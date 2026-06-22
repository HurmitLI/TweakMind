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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_windows_search,
            detect_game_mode,
            detect_core_isolation,
            detect_delivery_optimization
        ])
        .run(tauri::generate_context!())
        .expect("failed to run TweakMind");
}
