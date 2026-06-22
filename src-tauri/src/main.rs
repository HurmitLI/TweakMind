use serde::Serialize;

#[derive(Serialize)]
struct DetectionResult {
    success: bool,
    status: String,
    previous_state: String,
    current_state: String,
    message: String,
    timestamp: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ApplyResult {
    optimization_id: String,
    apply_mode: String,
    status: String,
    previous_state: String,
    current_state: String,
    previous_startup_type: String,
    message: String,
    error: Option<String>,
    timestamp: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RecoveryResult {
    optimization_id: String,
    status: String,
    previous_state: String,
    expected_state: String,
    actual_state: String,
    previous_startup_type: String,
    message: String,
    error: Option<String>,
    timestamp: String,
}

fn now_timestamp() -> String {
    match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
        Ok(duration) => duration.as_secs().to_string(),
        Err(_) => "0".to_string(),
    }
}

fn detection_result(success: bool, current_state: &str, message: String) -> DetectionResult {
    DetectionResult {
        success,
        status: if success { "Success" } else { "Failed" }.to_string(),
        previous_state: current_state.to_string(),
        current_state: current_state.to_string(),
        message,
        timestamp: now_timestamp(),
    }
}

fn apply_result(
    optimization_id: &str,
    status: &str,
    previous_state: &str,
    current_state: &str,
    previous_startup_type: &str,
    message: String,
    error: Option<String>,
) -> ApplyResult {
    ApplyResult {
        optimization_id: optimization_id.to_string(),
        apply_mode: "real".to_string(),
        status: status.to_string(),
        previous_state: previous_state.to_string(),
        current_state: current_state.to_string(),
        previous_startup_type: previous_startup_type.to_string(),
        message,
        error,
        timestamp: now_timestamp(),
    }
}

fn recovery_result(
    optimization_id: &str,
    status: &str,
    previous_state: &str,
    expected_state: &str,
    actual_state: &str,
    previous_startup_type: &str,
    message: String,
    error: Option<String>,
) -> RecoveryResult {
    RecoveryResult {
        optimization_id: optimization_id.to_string(),
        status: status.to_string(),
        previous_state: previous_state.to_string(),
        expected_state: expected_state.to_string(),
        actual_state: actual_state.to_string(),
        previous_startup_type: previous_startup_type.to_string(),
        message,
        error,
        timestamp: now_timestamp(),
    }
}

#[cfg(target_os = "windows")]
mod windows_detect {
    use super::{detection_result, DetectionResult};
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::{null, null_mut};
    use windows_sys::Win32::Foundation::{
        ERROR_FILE_NOT_FOUND, ERROR_INSUFFICIENT_BUFFER, ERROR_SUCCESS,
    };
    use windows_sys::Win32::System::Registry::{
        RegCloseKey, RegOpenKeyExW, RegQueryValueExW, HKEY, HKEY_CURRENT_USER,
        HKEY_LOCAL_MACHINE, KEY_READ, REG_DWORD,
    };
    use windows_sys::Win32::System::Services::{
        CloseServiceHandle, OpenSCManagerW, OpenServiceW, QueryServiceConfigW,
        QueryServiceStatusEx, SC_HANDLE, SC_MANAGER_CONNECT, SC_STATUS_PROCESS_INFO,
        SERVICE_DISABLED, SERVICE_QUERY_CONFIG, SERVICE_QUERY_STATUS, SERVICE_RUNNING,
        SERVICE_STATUS_PROCESS, SERVICE_STOPPED, QUERY_SERVICE_CONFIGW,
    };

    struct ServiceHandle(SC_HANDLE);

    impl Drop for ServiceHandle {
        fn drop(&mut self) {
            unsafe {
                CloseServiceHandle(self.0);
            }
        }
    }

    struct RegistryKey(HKEY);

    impl Drop for RegistryKey {
        fn drop(&mut self) {
            unsafe {
                RegCloseKey(self.0);
            }
        }
    }

    fn wide(value: &str) -> Vec<u16> {
        OsStr::new(value).encode_wide().chain(once(0)).collect()
    }

    fn error_message(context: &str, code: u32) -> String {
        format!("{context} failed with Windows error {code}.")
    }

    fn open_registry_key(root: HKEY, path: &str) -> Result<RegistryKey, String> {
        let key_path = wide(path);
        let mut key: HKEY = null_mut();
        let status = unsafe { RegOpenKeyExW(root, key_path.as_ptr(), 0, KEY_READ, &mut key) };

        if status != ERROR_SUCCESS {
            return Err(error_message("Open registry key", status));
        }

        Ok(RegistryKey(key))
    }

    fn read_dword(root: HKEY, path: &str, value: &str) -> Result<Option<u32>, String> {
        let key = match open_registry_key(root, path) {
            Ok(key) => key,
            Err(message) if message.ends_with("Windows error 2.") => return Ok(None),
            Err(message) => return Err(message),
        };

        let value_name = wide(value);
        let mut data_type = 0u32;
        let mut data = 0u32;
        let mut data_size = std::mem::size_of::<u32>() as u32;
        let status = unsafe {
            RegQueryValueExW(
                key.0,
                value_name.as_ptr(),
                null_mut(),
                &mut data_type,
                &mut data as *mut _ as *mut u8,
                &mut data_size,
            )
        };

        if status == ERROR_FILE_NOT_FOUND {
            return Ok(None);
        }

        if status != ERROR_SUCCESS {
            return Err(error_message("Read registry value", status));
        }

        if data_type != REG_DWORD {
            return Ok(None);
        }

        Ok(Some(data))
    }

    pub fn windows_search() -> DetectionResult {
        let result = (|| -> Result<String, String> {
            let service_name = wide("WSearch");
            let manager = unsafe { OpenSCManagerW(null(), null(), SC_MANAGER_CONNECT) };

            if manager.is_null() {
                return Err("Unable to open Service Control Manager.".to_string());
            }

            let manager = ServiceHandle(manager);
            let service = unsafe {
                OpenServiceW(
                    manager.0,
                    service_name.as_ptr(),
                    SERVICE_QUERY_STATUS | SERVICE_QUERY_CONFIG,
                )
            };

            if service.is_null() {
                return Err("Unable to open Windows Search service.".to_string());
            }

            let service = ServiceHandle(service);
            let mut bytes_needed = 0u32;
            unsafe {
                QueryServiceConfigW(service.0, null_mut(), 0, &mut bytes_needed);
            }

            if bytes_needed > 0 {
                let mut buffer = vec![0u8; bytes_needed as usize];
                let config = buffer.as_mut_ptr() as *mut QUERY_SERVICE_CONFIGW;
                let ok = unsafe {
                    QueryServiceConfigW(service.0, config, bytes_needed, &mut bytes_needed)
                };

                if ok != 0 && unsafe { (*config).dwStartType } == SERVICE_DISABLED {
                    return Ok("Disabled".to_string());
                }
            } else {
                let _ = ERROR_INSUFFICIENT_BUFFER;
            }

            let mut status: SERVICE_STATUS_PROCESS = unsafe { std::mem::zeroed() };
            let mut status_bytes_needed = 0u32;
            let ok = unsafe {
                QueryServiceStatusEx(
                    service.0,
                    SC_STATUS_PROCESS_INFO,
                    &mut status as *mut _ as *mut u8,
                    std::mem::size_of::<SERVICE_STATUS_PROCESS>() as u32,
                    &mut status_bytes_needed,
                )
            };

            if ok == 0 {
                return Err("Unable to query Windows Search service status.".to_string());
            }

            Ok(match status.dwCurrentState {
                SERVICE_RUNNING => "Running",
                SERVICE_STOPPED => "Stopped",
                _ => "Unknown",
            }
            .to_string())
        })();

        match result {
            Ok(state) => detection_result(true, &state, "Windows Search state detected.".to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn game_mode() -> DetectionResult {
        match read_dword(
            HKEY_CURRENT_USER,
            "Software\\Microsoft\\GameBar",
            "AutoGameModeEnabled",
        ) {
            Ok(Some(1)) => detection_result(true, "Enabled", "Game Mode state detected.".to_string()),
            Ok(Some(0)) => detection_result(true, "Disabled", "Game Mode state detected.".to_string()),
            Ok(Some(_)) => detection_result(true, "Unknown", "Game Mode registry value is not recognized.".to_string()),
            Ok(None) => detection_result(true, "Unknown", "Game Mode registry value is not present.".to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn core_isolation() -> DetectionResult {
        match read_dword(
            HKEY_LOCAL_MACHINE,
            "SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity",
            "Enabled",
        ) {
            Ok(Some(1)) => detection_result(true, "Enabled", "Core Isolation state detected.".to_string()),
            Ok(Some(0)) => detection_result(true, "Disabled", "Core Isolation state detected.".to_string()),
            Ok(Some(_)) => detection_result(true, "Unknown", "Core Isolation registry value is not recognized.".to_string()),
            Ok(None) => detection_result(true, "Unknown", "Core Isolation registry value is not present.".to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn delivery_optimization() -> DetectionResult {
        let policy_value = read_dword(
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization",
            "DODownloadMode",
        );
        let value = match policy_value {
            Ok(Some(value)) => Ok(Some(value)),
            Ok(None) => read_dword(
                HKEY_LOCAL_MACHINE,
                "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config",
                "DODownloadMode",
            ),
            Err(message) => Err(message),
        };

        match value {
            Ok(Some(0)) | Ok(Some(100)) => {
                detection_result(true, "Disabled", "Delivery Optimization state detected.".to_string())
            }
            Ok(Some(_)) => {
                detection_result(true, "Enabled", "Delivery Optimization state detected.".to_string())
            }
            Ok(None) => detection_result(true, "Unknown", "Delivery Optimization registry value is not present.".to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }
}

#[cfg(target_os = "windows")]
mod windows_apply {
    use super::{apply_result, recovery_result, ApplyResult, RecoveryResult};
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::{null, null_mut};
    use std::thread::sleep;
    use std::time::Duration;
    use windows_sys::Win32::Foundation::{
        ERROR_ACCESS_DENIED, ERROR_FILE_NOT_FOUND, ERROR_INSUFFICIENT_BUFFER, ERROR_SUCCESS,
    };
    use windows_sys::Win32::System::Registry::{
        RegCloseKey, RegCreateKeyW, RegDeleteValueW, RegOpenKeyExW, RegQueryValueExW,
        RegSetValueExW, HKEY, HKEY_CURRENT_USER, KEY_READ, KEY_SET_VALUE, REG_DWORD,
    };
    use windows_sys::Win32::System::Services::{
        ChangeServiceConfigW, CloseServiceHandle, ControlService, OpenSCManagerW, OpenServiceW,
        QueryServiceConfigW, QueryServiceStatusEx, SC_HANDLE, SC_MANAGER_CONNECT,
        SC_STATUS_PROCESS_INFO, SERVICE_AUTO_START, SERVICE_CHANGE_CONFIG, SERVICE_CONTROL_STOP,
        SERVICE_DEMAND_START, SERVICE_DISABLED, SERVICE_NO_CHANGE, SERVICE_QUERY_CONFIG,
        SERVICE_QUERY_STATUS, SERVICE_RUNNING, SERVICE_START, SERVICE_STOP, SERVICE_STOPPED,
        SERVICE_STATUS, SERVICE_STATUS_PROCESS, StartServiceW, QUERY_SERVICE_CONFIGW,
    };

    struct ServiceHandle(SC_HANDLE);

    impl Drop for ServiceHandle {
        fn drop(&mut self) {
            unsafe {
                CloseServiceHandle(self.0);
            }
        }
    }

    struct ServiceSnapshot {
        state: String,
        startup_type: String,
    }

    struct RegistryKey(HKEY);

    impl Drop for RegistryKey {
        fn drop(&mut self) {
            unsafe {
                RegCloseKey(self.0);
            }
        }
    }

    struct GameModeSnapshot {
        state: String,
        raw_value: String,
    }

    fn wide(value: &str) -> Vec<u16> {
        OsStr::new(value).encode_wide().chain(once(0)).collect()
    }

    fn startup_type_name(value: u32) -> String {
        match value {
            0 => "Boot".to_string(),
            1 => "System".to_string(),
            2 => "Automatic".to_string(),
            3 => "Manual".to_string(),
            4 => "Disabled".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    fn startup_type_code(value: &str, expected_state: &str) -> u32 {
        match value {
            "Automatic" => SERVICE_AUTO_START,
            "Manual" => SERVICE_DEMAND_START,
            "Disabled" => SERVICE_DISABLED,
            _ if expected_state == "Running" => SERVICE_AUTO_START,
            _ if expected_state == "Disabled" => SERVICE_DISABLED,
            _ => SERVICE_DEMAND_START,
        }
    }

    fn state_name(value: u32, startup_type: &str) -> String {
        if startup_type == "Disabled" {
            return "Disabled".to_string();
        }

        match value {
            SERVICE_RUNNING => "Running".to_string(),
            SERVICE_STOPPED => "Stopped".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    fn last_error() -> u32 {
        std::io::Error::last_os_error()
            .raw_os_error()
            .unwrap_or_default() as u32
    }

    fn open_game_mode_key(access: u32) -> Result<RegistryKey, String> {
        let key_path = wide("Software\\Microsoft\\GameBar");
        let mut key: HKEY = null_mut();

        let status = if access == KEY_READ {
            unsafe { RegOpenKeyExW(HKEY_CURRENT_USER, key_path.as_ptr(), 0, KEY_READ, &mut key) }
        } else {
            unsafe { RegCreateKeyW(HKEY_CURRENT_USER, key_path.as_ptr(), &mut key) }
        };

        if status != ERROR_SUCCESS {
            return Err(format!("Open Game Mode registry key failed with Windows error {status}."));
        }

        Ok(RegistryKey(key))
    }

    fn state_from_game_mode_value(value: Option<u32>) -> String {
        match value {
            Some(1) => "Enabled".to_string(),
            Some(0) => "Disabled".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    fn raw_game_mode_value(value: Option<u32>) -> String {
        match value {
            Some(value) => format!("DWORD:{value}"),
            None => "Missing".to_string(),
        }
    }

    fn parse_game_mode_raw_value(value: &str) -> Option<u32> {
        value.strip_prefix("DWORD:")
            .and_then(|raw| raw.parse::<u32>().ok())
    }

    fn query_game_mode_snapshot() -> Result<GameModeSnapshot, String> {
        let key = open_game_mode_key(KEY_READ)?;
        let value_name = wide("AutoGameModeEnabled");
        let mut data_type = 0u32;
        let mut data = 0u32;
        let mut data_size = std::mem::size_of::<u32>() as u32;
        let status = unsafe {
            RegQueryValueExW(
                key.0,
                value_name.as_ptr(),
                null_mut(),
                &mut data_type,
                &mut data as *mut _ as *mut u8,
                &mut data_size,
            )
        };

        if status == ERROR_FILE_NOT_FOUND {
            return Ok(GameModeSnapshot {
                state: "Unknown".to_string(),
                raw_value: "Missing".to_string(),
            });
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Read Game Mode registry value failed with Windows error {status}."));
        }

        if data_type != REG_DWORD {
            return Ok(GameModeSnapshot {
                state: "Unknown".to_string(),
                raw_value: "UnsupportedType".to_string(),
            });
        }

        Ok(GameModeSnapshot {
            state: state_from_game_mode_value(Some(data)),
            raw_value: raw_game_mode_value(Some(data)),
        })
    }

    fn set_game_mode_value(value: u32) -> Result<(), String> {
        let key = open_game_mode_key(KEY_SET_VALUE)?;
        let value_name = wide("AutoGameModeEnabled");
        let status = unsafe {
            RegSetValueExW(
                key.0,
                value_name.as_ptr(),
                0,
                REG_DWORD,
                &value as *const _ as *const u8,
                std::mem::size_of::<u32>() as u32,
            )
        };

        if status != ERROR_SUCCESS {
            return Err(format!("Write Game Mode registry value failed with Windows error {status}."));
        }

        Ok(())
    }

    fn delete_game_mode_value() -> Result<(), String> {
        let key = open_game_mode_key(KEY_SET_VALUE)?;
        let value_name = wide("AutoGameModeEnabled");
        let status = unsafe { RegDeleteValueW(key.0, value_name.as_ptr()) };

        if status == ERROR_FILE_NOT_FOUND || status == ERROR_SUCCESS {
            return Ok(());
        }

        Err(format!("Delete Game Mode registry value failed with Windows error {status}."))
    }

    fn query_snapshot(service: SC_HANDLE) -> Result<ServiceSnapshot, String> {
        let mut bytes_needed = 0u32;
        unsafe {
            QueryServiceConfigW(service, null_mut(), 0, &mut bytes_needed);
        }

        if bytes_needed == 0 {
            let code = last_error();
            if code != ERROR_INSUFFICIENT_BUFFER {
                return Err(format!("Unable to query Windows Search startup type. Windows error {code}."));
            }
        }

        let mut buffer = vec![0u8; bytes_needed as usize];
        let config = buffer.as_mut_ptr() as *mut QUERY_SERVICE_CONFIGW;
        let ok = unsafe { QueryServiceConfigW(service, config, bytes_needed, &mut bytes_needed) };

        if ok == 0 {
            return Err(format!(
                "Unable to query Windows Search startup type. Windows error {}.",
                last_error()
            ));
        }

        let startup_type = startup_type_name(unsafe { (*config).dwStartType });

        let mut status: SERVICE_STATUS_PROCESS = unsafe { std::mem::zeroed() };
        let mut status_bytes_needed = 0u32;
        let ok = unsafe {
            QueryServiceStatusEx(
                service,
                SC_STATUS_PROCESS_INFO,
                &mut status as *mut _ as *mut u8,
                std::mem::size_of::<SERVICE_STATUS_PROCESS>() as u32,
                &mut status_bytes_needed,
            )
        };

        if ok == 0 {
            return Err(format!(
                "Unable to query Windows Search service status. Windows error {}.",
                last_error()
            ));
        }

        Ok(ServiceSnapshot {
            state: state_name(status.dwCurrentState, &startup_type),
            startup_type,
        })
    }

    fn wait_for_state(service: SC_HANDLE, expected_state: &str) -> Option<ServiceSnapshot> {
        for _ in 0..20 {
            if let Ok(snapshot) = query_snapshot(service) {
                if snapshot.state == expected_state
                    || (expected_state == "Stopped" && snapshot.state != "Running" && snapshot.startup_type != "Disabled")
                {
                    return Some(snapshot);
                }
            }

            sleep(Duration::from_millis(250));
        }

        query_snapshot(service).ok()
    }

    pub fn windows_search() -> ApplyResult {
        let service_name = wide("WSearch");
        let manager = unsafe { OpenSCManagerW(null(), null(), SC_MANAGER_CONNECT) };

        if manager.is_null() {
            let code = last_error();
            return apply_result(
                "windows-search",
                "failed",
                "Unknown",
                "Unknown",
                "Unknown",
                "Unable to open Service Control Manager.".to_string(),
                Some(format!("OpenSCManagerW failed with Windows error {code}.")),
            );
        }

        let manager = ServiceHandle(manager);
        let service = unsafe {
            OpenServiceW(
                manager.0,
                service_name.as_ptr(),
                SERVICE_QUERY_STATUS | SERVICE_QUERY_CONFIG | SERVICE_CHANGE_CONFIG | SERVICE_STOP,
            )
        };

        if service.is_null() {
            let code = last_error();
            let friendly = if code == ERROR_ACCESS_DENIED {
                "Administrator permission is required to disable Windows Search.".to_string()
            } else {
                "Unable to open Windows Search service for apply.".to_string()
            };

            return apply_result(
                "windows-search",
                "failed",
                "Unknown",
                "Unknown",
                "Unknown",
                friendly,
                Some(format!("OpenServiceW failed with Windows error {code}.")),
            );
        }

        let service = ServiceHandle(service);
        let before = match query_snapshot(service.0) {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    "windows-search",
                    "failed",
                    "Unknown",
                    "Unknown",
                    "Unknown",
                    message.clone(),
                    Some(message),
                );
            }
        };

        let ok = unsafe {
            ChangeServiceConfigW(
                service.0,
                SERVICE_NO_CHANGE,
                SERVICE_DISABLED,
                SERVICE_NO_CHANGE,
                null(),
                null(),
                null_mut(),
                null(),
                null(),
                null(),
                null(),
            )
        };

        if ok == 0 {
            let code = last_error();
            return apply_result(
                "windows-search",
                "failed",
                &before.state,
                &before.state,
                &before.startup_type,
                "Windows Search was not changed.".to_string(),
                Some(format!("ChangeServiceConfigW failed with Windows error {code}.")),
            );
        }

        if before.state == "Running" {
            let mut service_status: SERVICE_STATUS = unsafe { std::mem::zeroed() };
            unsafe {
                ControlService(service.0, SERVICE_CONTROL_STOP, &mut service_status);
            }
        }

        let after = query_snapshot(service.0).unwrap_or(ServiceSnapshot {
            state: "Disabled".to_string(),
            startup_type: "Disabled".to_string(),
        });

        apply_result(
            "windows-search",
            "success",
            &before.state,
            &after.state,
            &before.startup_type,
            "Windows Search was disabled through the native Tauri executor.".to_string(),
            None,
        )
    }

    pub fn restore_windows_search(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        let service_name = wide("WSearch");
        let manager = unsafe { OpenSCManagerW(null(), null(), SC_MANAGER_CONNECT) };

        if manager.is_null() {
            let code = last_error();
            return recovery_result(
                "windows-search",
                "failed",
                &previous_state,
                &previous_state,
                "Unknown",
                &previous_startup_type,
                "Unable to open Service Control Manager.".to_string(),
                Some(format!("OpenSCManagerW failed with Windows error {code}.")),
            );
        }

        let manager = ServiceHandle(manager);
        let service = unsafe {
            OpenServiceW(
                manager.0,
                service_name.as_ptr(),
                SERVICE_QUERY_STATUS
                    | SERVICE_QUERY_CONFIG
                    | SERVICE_CHANGE_CONFIG
                    | SERVICE_START
                    | SERVICE_STOP,
            )
        };

        if service.is_null() {
            let code = last_error();
            let friendly = if code == ERROR_ACCESS_DENIED {
                "Administrator permission is required to restore Windows Search.".to_string()
            } else {
                "Unable to open Windows Search service for recovery.".to_string()
            };

            return recovery_result(
                "windows-search",
                "failed",
                &previous_state,
                &previous_state,
                "Unknown",
                &previous_startup_type,
                friendly,
                Some(format!("OpenServiceW failed with Windows error {code}.")),
            );
        }

        let service = ServiceHandle(service);
        let startup_type = startup_type_code(&previous_startup_type, &previous_state);
        let ok = unsafe {
            ChangeServiceConfigW(
                service.0,
                SERVICE_NO_CHANGE,
                startup_type,
                SERVICE_NO_CHANGE,
                null(),
                null(),
                null_mut(),
                null(),
                null(),
                null(),
                null(),
            )
        };

        if ok == 0 {
            let actual = query_snapshot(service.0)
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());
            let code = last_error();
            return recovery_result(
                "windows-search",
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_startup_type,
                "Windows Search recovery was not applied.".to_string(),
                Some(format!("ChangeServiceConfigW failed with Windows error {code}.")),
            );
        }

        if previous_state == "Running" {
            unsafe {
                StartServiceW(service.0, 0, null());
            }
        } else if previous_state == "Stopped" || previous_state == "Disabled" {
            let current = query_snapshot(service.0).ok();
            if current.as_ref().is_some_and(|snapshot| snapshot.state == "Running") {
                let mut service_status: SERVICE_STATUS = unsafe { std::mem::zeroed() };
                unsafe {
                    ControlService(service.0, SERVICE_CONTROL_STOP, &mut service_status);
                }
            }
        }

        let after = wait_for_state(service.0, &previous_state).unwrap_or(ServiceSnapshot {
            state: "Unknown".to_string(),
            startup_type: previous_startup_type.clone(),
        });
        let success = after.state == previous_state
            || (previous_state == "Stopped" && after.state != "Running" && after.startup_type != "Disabled");

        recovery_result(
            "windows-search",
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_startup_type,
            if success {
                "Windows Search was restored to the saved previous state.".to_string()
            } else {
                format!("Windows Search recovery expected {previous_state}, but detected {}.", after.state)
            },
            if success {
                None
            } else {
                Some("Recovered state did not match the saved previous state.".to_string())
            },
        )
    }

    pub fn game_mode() -> ApplyResult {
        let before = match query_game_mode_snapshot() {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    "game-mode",
                    "failed",
                    "Unknown",
                    "Unknown",
                    "Unknown",
                    message.clone(),
                    Some(message),
                );
            }
        };

        if let Err(message) = set_game_mode_value(1) {
            return apply_result(
                "game-mode",
                "failed",
                &before.state,
                &before.state,
                &before.raw_value,
                "Game Mode was not changed.".to_string(),
                Some(message),
            );
        }

        let after = query_game_mode_snapshot().unwrap_or(GameModeSnapshot {
            state: "Enabled".to_string(),
            raw_value: "DWORD:1".to_string(),
        });

        apply_result(
            "game-mode",
            if after.state == "Enabled" { "success" } else { "failed" },
            &before.state,
            &after.state,
            &before.raw_value,
            if after.state == "Enabled" {
                "Game Mode was enabled through the native Tauri executor.".to_string()
            } else {
                format!("Game Mode apply expected Enabled, but detected {}.", after.state)
            },
            if after.state == "Enabled" {
                None
            } else {
                Some("Applied registry value did not produce the expected detected state.".to_string())
            },
        )
    }

    pub fn restore_game_mode(previous_state: String, previous_registry_value: String) -> RecoveryResult {
        let recovery = if previous_registry_value == "Missing" {
            delete_game_mode_value()
        } else if let Some(value) = parse_game_mode_raw_value(&previous_registry_value) {
            set_game_mode_value(value)
        } else {
            Err("Saved Game Mode registry value is not restorable.".to_string())
        };

        if let Err(message) = recovery {
            let actual = query_game_mode_snapshot()
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());

            return recovery_result(
                "game-mode",
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_registry_value,
                "Game Mode recovery was not applied.".to_string(),
                Some(message),
            );
        }

        let after = query_game_mode_snapshot().unwrap_or(GameModeSnapshot {
            state: "Unknown".to_string(),
            raw_value: previous_registry_value.clone(),
        });
        let success = after.state == previous_state;

        recovery_result(
            "game-mode",
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_registry_value,
            if success {
                "Game Mode was restored to the saved previous state.".to_string()
            } else {
                format!("Game Mode recovery expected {previous_state}, but detected {}.", after.state)
            },
            if success {
                None
            } else {
                Some("Recovered state did not match the saved previous state.".to_string())
            },
        )
    }
}

#[cfg(not(target_os = "windows"))]
mod windows_apply {
    use super::{apply_result, recovery_result, ApplyResult, RecoveryResult};

    pub fn windows_search() -> ApplyResult {
        apply_result(
            "windows-search",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "Windows Search Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_windows_search(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "windows-search",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "Windows Search Recovery is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn game_mode() -> ApplyResult {
        apply_result(
            "game-mode",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "Game Mode Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_game_mode(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "game-mode",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "Game Mode Recovery is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }
}

#[cfg(not(target_os = "windows"))]
mod windows_detect {
    use super::{detection_result, DetectionResult};

    fn unsupported(name: &str) -> DetectionResult {
        detection_result(false, "Unknown", format!("{name} detection is only available on Windows."))
    }

    pub fn windows_search() -> DetectionResult {
        unsupported("Windows Search")
    }

    pub fn game_mode() -> DetectionResult {
        unsupported("Game Mode")
    }

    pub fn core_isolation() -> DetectionResult {
        unsupported("Core Isolation")
    }

    pub fn delivery_optimization() -> DetectionResult {
        unsupported("Delivery Optimization")
    }
}

#[tauri::command]
fn detect_windows_search() -> DetectionResult {
    windows_detect::windows_search()
}

#[tauri::command]
fn detect_game_mode() -> DetectionResult {
    windows_detect::game_mode()
}

#[tauri::command]
fn detect_core_isolation() -> DetectionResult {
    windows_detect::core_isolation()
}

#[tauri::command]
fn detect_delivery_optimization() -> DetectionResult {
    windows_detect::delivery_optimization()
}

#[tauri::command]
fn apply_windows_search() -> ApplyResult {
    windows_apply::windows_search()
}

#[tauri::command]
fn restore_windows_search(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_windows_search(previous_state, previous_startup_type)
}

#[tauri::command]
fn apply_game_mode() -> ApplyResult {
    windows_apply::game_mode()
}

#[tauri::command]
fn restore_game_mode(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_game_mode(previous_state, previous_startup_type)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_windows_search,
            detect_game_mode,
            detect_core_isolation,
            detect_delivery_optimization,
            apply_windows_search,
            restore_windows_search,
            apply_game_mode,
            restore_game_mode
        ])
        .run(tauri::generate_context!())
        .expect("failed to run TweakMind");
}
