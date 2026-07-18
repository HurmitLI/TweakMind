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

/// Pure input validation and outcome evaluation for values that arrive from
/// the frontend (saved recovery state) or from post-apply re-queries.
/// This module is intentionally free of Windows API calls so it compiles and
/// tests on every platform.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
mod input_validation {
    /// Whitelist parser for saved binary registry values. Game Mode and Core
    /// Isolation only ever store 0 or 1; anything else (including large
    /// DWORDs, signs, whitespace, or leading zeros) is rejected so a corrupt
    /// or tampered history entry can never write an arbitrary value.
    pub fn parse_binary_dword_raw(value: &str) -> Option<u32> {
        match value {
            "DWORD:0" => Some(0),
            "DWORD:1" => Some(1),
            _ => None,
        }
    }

    /// Platform-neutral GUID representation so parsing stays testable
    /// without the windows-sys GUID type.
    #[derive(Debug, PartialEq, Eq)]
    pub struct GuidParts {
        pub data1: u32,
        pub data2: u16,
        pub data3: u16,
        pub data4: [u8; 8],
    }

    fn is_strict_hex(part: &str, expected_len: usize) -> bool {
        part.len() == expected_len && part.bytes().all(|byte| byte.is_ascii_hexdigit())
    }

    /// Strict parser for saved power scheme identifiers. Only the exact shape
    /// `GUID:{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}` produced by the detector
    /// is accepted: one brace pair, five dash-separated groups, hex digits
    /// only. Signs, whitespace, missing braces, or extra characters are all
    /// rejected before any power plan activation can happen.
    pub fn parse_guid_raw_strict(value: &str) -> Option<GuidParts> {
        let inner = value.strip_prefix("GUID:{")?.strip_suffix('}')?;

        if inner.contains('{') || inner.contains('}') {
            return None;
        }

        let parts: Vec<&str> = inner.split('-').collect();

        if parts.len() != 5 {
            return None;
        }

        let expected_lengths = [8usize, 4, 4, 4, 12];

        for (part, expected_length) in parts.iter().zip(expected_lengths) {
            if !is_strict_hex(part, expected_length) {
                return None;
            }
        }

        let data1 = u32::from_str_radix(parts[0], 16).ok()?;
        let data2 = u16::from_str_radix(parts[1], 16).ok()?;
        let data3 = u16::from_str_radix(parts[2], 16).ok()?;
        let mut combined = String::from(parts[3]);
        combined.push_str(parts[4]);
        let bytes = (0..8)
            .map(|index| u8::from_str_radix(&combined[index * 2..index * 2 + 2], 16))
            .collect::<Result<Vec<_>, _>>()
            .ok()?;
        let mut data4 = [0u8; 8];
        data4.copy_from_slice(&bytes);

        Some(GuidParts {
            data1,
            data2,
            data3,
            data4,
        })
    }

    /// Outcome of confirming a service apply through a post-change re-query.
    #[derive(Debug, PartialEq, Eq)]
    pub enum ServiceApplyConfirmation {
        /// Re-query succeeded and the startup type is Disabled as expected.
        Confirmed { state: String },
        /// Re-query succeeded but the startup type is not Disabled.
        Mismatch { state: String, startup_type: String },
        /// Re-query failed; the result cannot be trusted as a success.
        QueryFailed { error: String },
    }

    /// Judges whether a service apply may be reported as success. Success
    /// requires a successful re-query showing startup type Disabled; a failed
    /// re-query or an unexpected startup type must never be masked with a
    /// fabricated snapshot.
    pub fn confirm_service_apply(
        requery: Result<(String, String), String>,
    ) -> ServiceApplyConfirmation {
        match requery {
            Ok((state, startup_type)) => {
                if startup_type == "Disabled" {
                    ServiceApplyConfirmation::Confirmed { state }
                } else {
                    ServiceApplyConfirmation::Mismatch {
                        state,
                        startup_type,
                    }
                }
            }
            Err(error) => ServiceApplyConfirmation::QueryFailed { error },
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn binary_dword_accepts_only_zero_and_one() {
            assert_eq!(parse_binary_dword_raw("DWORD:0"), Some(0));
            assert_eq!(parse_binary_dword_raw("DWORD:1"), Some(1));
        }

        #[test]
        fn binary_dword_rejects_other_numbers() {
            assert_eq!(parse_binary_dword_raw("DWORD:2"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:100"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:4294967295"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:-1"), None);
        }

        #[test]
        fn binary_dword_rejects_formatting_tricks() {
            assert_eq!(parse_binary_dword_raw("DWORD:01"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:+1"), None);
            assert_eq!(parse_binary_dword_raw("DWORD: 1"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:1 "), None);
            assert_eq!(parse_binary_dword_raw(" DWORD:1"), None);
            assert_eq!(parse_binary_dword_raw("dword:1"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:0x1"), None);
        }

        #[test]
        fn binary_dword_rejects_corrupt_input() {
            assert_eq!(parse_binary_dword_raw(""), None);
            assert_eq!(parse_binary_dword_raw("DWORD:"), None);
            assert_eq!(parse_binary_dword_raw("Missing"), None);
            assert_eq!(parse_binary_dword_raw("UnsupportedType"), None);
            assert_eq!(parse_binary_dword_raw("DWORD:1;reg delete HKLM"), None);
        }

        #[test]
        fn guid_accepts_the_exact_detector_shape() {
            let parsed = parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1bb1920fa1}")
                .expect("balanced GUID should parse");

            assert_eq!(parsed.data1, 0x381b4222);
            assert_eq!(parsed.data2, 0xf694);
            assert_eq!(parsed.data3, 0x41f0);
            assert_eq!(parsed.data4, [0x96, 0x85, 0xff, 0x1b, 0xb1, 0x92, 0x0f, 0xa1]);
        }

        #[test]
        fn guid_accepts_uppercase_hex_and_boundary_values() {
            assert!(parse_guid_raw_strict("GUID:{8C5E7FDA-E8BF-4A96-9A85-A6E23A8C635C}").is_some());
            assert!(parse_guid_raw_strict("GUID:{00000000-0000-0000-0000-000000000000}").is_some());
            assert!(parse_guid_raw_strict("GUID:{ffffffff-ffff-ffff-ffff-ffffffffffff}").is_some());
        }

        #[test]
        fn guid_rejects_missing_or_malformed_wrappers() {
            assert_eq!(parse_guid_raw_strict(""), None);
            assert_eq!(parse_guid_raw_strict("GUID:{}"), None);
            assert_eq!(parse_guid_raw_strict("381b4222-f694-41f0-9685-ff1bb1920fa1"), None);
            assert_eq!(parse_guid_raw_strict("GUID:381b4222-f694-41f0-9685-ff1bb1920fa1"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1bb1920fa1"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{{381b4222-f694-41f0-9685-ff1bb1920fa1}}"), None);
            assert_eq!(parse_guid_raw_strict("guid:{381b4222-f694-41f0-9685-ff1bb1920fa1}"), None);
        }

        #[test]
        fn guid_rejects_wrong_group_shapes() {
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1b-b1920fa1}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b422-f694-41f0-9685-ff1bb1920fa1}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f69-41f0-9685-ff1bb1920fa1}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1bb1920fa}"), None);
        }

        #[test]
        fn guid_rejects_non_hex_and_injection_attempts() {
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1bb1920fzz}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{+81b4222-f694-41f0-9685-ff1bb1920fa1}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{ 81b4222-f694-41f0-9685-ff1bb1920fa1}"), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1bb1920fa1} "), None);
            assert_eq!(parse_guid_raw_strict("GUID:{381b4222-f694-41f0-9685-ff1bb1920fa1};rm"), None);
        }

        #[test]
        fn service_apply_confirms_only_a_disabled_requery() {
            let outcome = confirm_service_apply(Ok(("Disabled".to_string(), "Disabled".to_string())));

            assert_eq!(
                outcome,
                ServiceApplyConfirmation::Confirmed {
                    state: "Disabled".to_string()
                }
            );
        }

        #[test]
        fn service_apply_reports_mismatch_when_startup_type_is_not_disabled() {
            let outcome = confirm_service_apply(Ok(("Stopped".to_string(), "Manual".to_string())));

            assert_eq!(
                outcome,
                ServiceApplyConfirmation::Mismatch {
                    state: "Stopped".to_string(),
                    startup_type: "Manual".to_string()
                }
            );

            let still_automatic =
                confirm_service_apply(Ok(("Running".to_string(), "Automatic".to_string())));
            assert!(matches!(
                still_automatic,
                ServiceApplyConfirmation::Mismatch { .. }
            ));
        }

        #[test]
        fn service_apply_never_reports_success_when_the_requery_fails() {
            let outcome = confirm_service_apply(Err("Windows error 5".to_string()));

            assert_eq!(
                outcome,
                ServiceApplyConfirmation::QueryFailed {
                    error: "Windows error 5".to_string()
                }
            );
        }
    }
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
mod power_plan_ops {
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::null_mut;
    use windows_sys::Win32::Foundation::{ERROR_SUCCESS, LocalFree};
    use windows_sys::Win32::System::Power::{PowerGetActiveScheme, PowerSetActiveScheme};
    use windows_sys::Win32::System::Registry::{RegCloseKey, RegOpenKeyExW, HKEY_LOCAL_MACHINE, KEY_READ};
    use windows_sys::core::GUID;

    fn wide(value: &str) -> Vec<u16> {
        OsStr::new(value).encode_wide().chain(once(0)).collect()
    }

    pub struct PowerPlanSnapshot {
        pub state: String,
        pub label: String,
        pub guid_raw: String,
        pub message: String,
    }

    const BALANCED_GUID: &str = "381b4222-f694-41f0-9685-ff1bb1920fa1";
    const HIGH_PERFORMANCE_GUID: &str = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";
    const POWER_SAVER_GUID: &str = "a1841308-3541-4fab-bc81-f69e7f89651";
    const ULTIMATE_GUID: &str = "e9a42b02-d5df-448d-aa00-03f14749ebe6";

    pub fn recommended_high_performance_guid() -> &'static str {
        HIGH_PERFORMANCE_GUID
    }

    fn normalize_guid(value: &str) -> String {
        value.trim().trim_matches('{').trim_matches('}').to_lowercase()
    }

    fn guid_from_str(value: &str) -> Option<GUID> {
        let normalized = normalize_guid(value);
        let parts: Vec<&str> = normalized.split('-').collect();
        if parts.len() != 5 || parts[0].len() != 8 || parts[1].len() != 4 || parts[2].len() != 4 || parts[3].len() != 4 || parts[4].len() != 12 {
            return None;
        }

        let data1 = u32::from_str_radix(parts[0], 16).ok()?;
        let data2 = u16::from_str_radix(parts[1], 16).ok()?;
        let data3 = u16::from_str_radix(parts[2], 16).ok()?;
        let mut combined = String::from(parts[3]);
        combined.push_str(parts[4]);
        let bytes = (0..8)
            .map(|index| u8::from_str_radix(&combined[index * 2..index * 2 + 2], 16))
            .collect::<Result<Vec<_>, _>>()
            .ok()?;
        let mut data4 = [0u8; 8];
        data4.copy_from_slice(&bytes);

        Some(GUID {
            data1,
            data2,
            data3,
            data4,
        })
    }

    fn guid_to_string(guid: &GUID) -> String {
        format!(
            "{:08x}-{:04x}-{:04x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
            guid.data1,
            guid.data2,
            guid.data3,
            guid.data4[0],
            guid.data4[1],
            guid.data4[2],
            guid.data4[3],
            guid.data4[4],
            guid.data4[5],
            guid.data4[6],
            guid.data4[7]
        )
    }

    pub fn guid_to_raw(guid: &GUID) -> String {
        format!("GUID:{{{}}}", guid_to_string(guid))
    }

    pub fn parse_guid_raw(value: &str) -> Option<GUID> {
        // Strict validation: only the exact `GUID:{...}` shape produced by
        // the detector is accepted, so a corrupt or tampered saved value can
        // never reach PowerSetActiveScheme.
        let parts = super::input_validation::parse_guid_raw_strict(value)?;

        Some(GUID {
            data1: parts.data1,
            data2: parts.data2,
            data3: parts.data3,
            data4: parts.data4,
        })
    }

    pub fn classify_guid(value: &str) -> (String, String, String) {
        match normalize_guid(value).as_str() {
            BALANCED_GUID => (
                "Default".to_string(),
                "Balanced".to_string(),
                "Balanced power plan detected.".to_string(),
            ),
            HIGH_PERFORMANCE_GUID => (
                "Enabled".to_string(),
                "High Performance".to_string(),
                "High performance power plan detected.".to_string(),
            ),
            POWER_SAVER_GUID => (
                "Disabled".to_string(),
                "Power Saver".to_string(),
                "Power saver plan detected.".to_string(),
            ),
            ULTIMATE_GUID => (
                "Enabled".to_string(),
                "Ultimate Performance".to_string(),
                "Ultimate performance power plan detected.".to_string(),
            ),
            _ => (
                "Unknown".to_string(),
                "Unknown".to_string(),
                format!("Active power scheme GUID: {value}"),
            ),
        }
    }

    pub fn query_active_power_plan() -> Result<PowerPlanSnapshot, String> {
        let mut guid_ptr: *mut GUID = null_mut();
        let status = unsafe { PowerGetActiveScheme(null_mut(), &mut guid_ptr) };

        if status != ERROR_SUCCESS {
            return Err(format!("PowerGetActiveScheme failed with Windows error {status}."));
        }

        if guid_ptr.is_null() {
            return Err("PowerGetActiveScheme returned a null active scheme.".to_string());
        }

        let guid = unsafe { *guid_ptr };
        unsafe {
            LocalFree(guid_ptr as _);
        }

        let guid_string = guid_to_string(&guid);
        let (state, label, message) = classify_guid(&guid_string);

        Ok(PowerPlanSnapshot {
            state,
            label,
            guid_raw: guid_to_raw(&guid),
            message,
        })
    }

    pub fn scheme_exists(guid: &GUID) -> bool {
        let guid_string = guid_to_string(guid);
        let path = format!("SYSTEM\\CurrentControlSet\\Control\\Power\\User\\PowerSchemes\\{{{guid_string}}}");
        let path_wide = wide(&path);
        let mut key = null_mut();
        let status = unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, path_wide.as_ptr(), 0, KEY_READ, &mut key) };

        if status == ERROR_SUCCESS {
            unsafe {
                RegCloseKey(key);
            }
            true
        } else {
            false
        }
    }

    pub fn set_active_power_plan(guid: &GUID) -> Result<(), String> {
        let status = unsafe { PowerSetActiveScheme(null_mut(), guid) };

        if status != ERROR_SUCCESS {
            return Err(format!("PowerSetActiveScheme failed with Windows error {status}."));
        }

        Ok(())
    }

    pub fn high_performance_available() -> bool {
        guid_from_str(HIGH_PERFORMANCE_GUID)
            .map(|guid| scheme_exists(&guid))
            .unwrap_or(false)
    }

    pub fn is_high_performance(snapshot: &PowerPlanSnapshot) -> bool {
        normalize_guid(
            snapshot
                .guid_raw
                .strip_prefix("GUID:")
                .unwrap_or(snapshot.guid_raw.as_str()),
        ) == HIGH_PERFORMANCE_GUID
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
        HKEY_LOCAL_MACHINE, KEY_READ, REG_DWORD, REG_SZ,
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

    fn read_string(root: HKEY, path: &str, value: &str) -> Result<Option<String>, String> {
        let key = match open_registry_key(root, path) {
            Ok(key) => key,
            Err(message) if message.ends_with("Windows error 2.") => return Ok(None),
            Err(message) => return Err(message),
        };

        let value_name = wide(value);
        let mut data_type = 0u32;
        let mut data_size = 0u32;
        let status = unsafe {
            RegQueryValueExW(
                key.0,
                value_name.as_ptr(),
                null_mut(),
                &mut data_type,
                null_mut(),
                &mut data_size,
            )
        };

        if status == ERROR_FILE_NOT_FOUND {
            return Ok(None);
        }

        if status != ERROR_SUCCESS && status != ERROR_INSUFFICIENT_BUFFER {
            return Err(error_message("Read registry value size", status));
        }

        let mut buffer = vec![0u16; (data_size as usize / 2).max(1) + 1];
        let status = unsafe {
            RegQueryValueExW(
                key.0,
                value_name.as_ptr(),
                null_mut(),
                &mut data_type,
                buffer.as_mut_ptr() as *mut u8,
                &mut data_size,
            )
        };

        if status == ERROR_FILE_NOT_FOUND {
            return Ok(None);
        }

        if status != ERROR_SUCCESS {
            return Err(error_message("Read registry value", status));
        }

        if data_type != REG_SZ {
            return Ok(None);
        }

        let text = String::from_utf16_lossy(&buffer);
        Ok(Some(text.trim_end_matches('\0').trim().to_string()))
    }

    fn detect_service_optimization(service_name: &str, label: &str, success_message: &str) -> DetectionResult {
        let result = (|| -> Result<String, String> {
            let service_name = wide(service_name);
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
                return Err(format!("Unable to open {label} service."));
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
                return Err(format!("Unable to query {label} service status."));
            }

            Ok(match status.dwCurrentState {
                SERVICE_RUNNING => "Running",
                SERVICE_STOPPED => "Stopped",
                _ => "Unknown",
            }
            .to_string())
        })();

        match result {
            Ok(state) => detection_result(true, &state, success_message.to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn power_plan() -> DetectionResult {
        match super::power_plan_ops::query_active_power_plan() {
            Ok(snapshot) => detection_result(true, &snapshot.state, snapshot.message),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn windows_search() -> DetectionResult {
        detect_service_optimization("WSearch", "Windows Search", "Windows Search state detected.")
    }

    pub fn sysmain() -> DetectionResult {
        detect_service_optimization("SysMain", "SysMain", "SysMain state detected.")
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

    pub fn hags() -> DetectionResult {
        match read_dword(
            HKEY_LOCAL_MACHINE,
            "SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers",
            "HwSchMode",
        ) {
            Ok(Some(1)) => detection_result(true, "Enabled", "HAGS state detected.".to_string()),
            Ok(Some(2)) => detection_result(true, "Disabled", "HAGS state detected.".to_string()),
            Ok(Some(_)) => detection_result(true, "Unknown", "HAGS registry value is not recognized.".to_string()),
            Ok(None) => detection_result(true, "Unknown", "HAGS registry value is not present.".to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn visual_effects() -> DetectionResult {
        match read_dword(
            HKEY_CURRENT_USER,
            "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects",
            "VisualFXSetting",
        ) {
            Ok(Some(0)) => detection_result(true, "Default", "Visual effects set to let Windows decide.".to_string()),
            Ok(Some(1)) => detection_result(true, "Enabled", "Visual effects set for best appearance.".to_string()),
            Ok(Some(2)) => detection_result(true, "Disabled", "Visual effects set for best performance.".to_string()),
            Ok(Some(3)) => detection_result(true, "Unknown", "Custom visual effects setting detected.".to_string()),
            Ok(Some(_)) => detection_result(true, "Unknown", "Visual effects registry value is not recognized.".to_string()),
            Ok(None) => detection_result(true, "Unknown", "Visual effects registry value is not present.".to_string()),
            Err(message) => detection_result(false, "Unknown", message),
        }
    }

    pub fn active_hours() -> DetectionResult {
        let start = read_dword(
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings",
            "ActiveHoursStart",
        );
        let end = read_dword(
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings",
            "ActiveHoursEnd",
        );

        match (start, end) {
            (Ok(Some(start_value)), Ok(Some(end_value))) if start_value > 0 || end_value > 0 => {
                detection_result(
                    true,
                    "Enabled",
                    format!("Active hours detected ({start_value}-{end_value})."),
                )
            }
            (Ok(None), Ok(None)) => detection_result(
                true,
                "Default",
                "Active hours are not configured.".to_string(),
            ),
            (Ok(_), Ok(_)) => detection_result(
                true,
                "Unknown",
                "Active hours registry values are present but not recognized.".to_string(),
            ),
            (Err(message), _) | (_, Err(message)) => detection_result(false, "Unknown", message),
        }
    }

    pub fn background_apps() -> DetectionResult {
        match read_dword(
            HKEY_CURRENT_USER,
            "Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications",
            "GlobalUserDisabled",
        ) {
            Ok(Some(1)) => detection_result(
                true,
                "Disabled",
                "Global background apps are disabled.".to_string(),
            ),
            Ok(Some(0)) => detection_result(
                true,
                "Enabled",
                "Global background apps are allowed.".to_string(),
            ),
            Ok(Some(_)) => detection_result(
                true,
                "Unknown",
                "Background apps registry value is not recognized.".to_string(),
            ),
            Ok(None) => detection_result(
                true,
                "Unknown",
                "Background apps registry value is not present.".to_string(),
            ),
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
        RegSetValueExW, HKEY, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ, KEY_SET_VALUE, REG_DWORD,
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

    struct CoreIsolationSnapshot {
        state: String,
        raw_value: String,
    }

    struct HagsSnapshot {
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
        // Game Mode only ever stores 0 or 1; any other saved value is
        // rejected before it can reach the registry.
        super::input_validation::parse_binary_dword_raw(value)
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

    fn open_core_isolation_key(access: u32) -> Result<RegistryKey, String> {
        let key_path = wide(
            "SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity",
        );
        let mut key: HKEY = null_mut();

        let status = if access == KEY_READ {
            unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, key_path.as_ptr(), 0, KEY_READ, &mut key) }
        } else {
            unsafe { RegCreateKeyW(HKEY_LOCAL_MACHINE, key_path.as_ptr(), &mut key) }
        };

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Open Core Isolation registry key failed with Windows error 5. Administrator privileges are required."
                    .to_string(),
            );
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Open Core Isolation registry key failed with Windows error {status}."));
        }

        Ok(RegistryKey(key))
    }

    fn state_from_core_isolation_value(value: Option<u32>) -> String {
        match value {
            Some(1) => "Enabled".to_string(),
            Some(0) => "Disabled".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    fn raw_core_isolation_value(value: Option<u32>) -> String {
        match value {
            Some(value) => format!("DWORD:{value}"),
            None => "Missing".to_string(),
        }
    }

    fn parse_core_isolation_raw_value(value: &str) -> Option<u32> {
        // HVCI Enabled only ever stores 0 or 1; any other saved value is
        // rejected before it can reach the registry.
        super::input_validation::parse_binary_dword_raw(value)
    }

    fn query_core_isolation_snapshot() -> Result<CoreIsolationSnapshot, String> {
        let key = open_core_isolation_key(KEY_READ)?;
        let value_name = wide("Enabled");
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
            return Ok(CoreIsolationSnapshot {
                state: "Unknown".to_string(),
                raw_value: "Missing".to_string(),
            });
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Read Core Isolation registry value failed with Windows error {status}."));
        }

        if data_type != REG_DWORD {
            return Ok(CoreIsolationSnapshot {
                state: "Unknown".to_string(),
                raw_value: "UnsupportedType".to_string(),
            });
        }

        Ok(CoreIsolationSnapshot {
            state: state_from_core_isolation_value(Some(data)),
            raw_value: raw_core_isolation_value(Some(data)),
        })
    }

    fn set_core_isolation_value(value: u32) -> Result<(), String> {
        let key = open_core_isolation_key(KEY_SET_VALUE)?;
        let value_name = wide("Enabled");
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

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Write Core Isolation registry value failed with Windows error 5. Administrator privileges are required."
                    .to_string(),
            );
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Write Core Isolation registry value failed with Windows error {status}."));
        }

        Ok(())
    }

    fn delete_core_isolation_value() -> Result<(), String> {
        let key = open_core_isolation_key(KEY_SET_VALUE)?;
        let value_name = wide("Enabled");
        let status = unsafe { RegDeleteValueW(key.0, value_name.as_ptr()) };

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Delete Core Isolation registry value failed with Windows error 5. Administrator privileges are required."
                    .to_string(),
            );
        }

        if status == ERROR_FILE_NOT_FOUND || status == ERROR_SUCCESS {
            return Ok(());
        }

        Err(format!("Delete Core Isolation registry value failed with Windows error {status}."))
    }

    fn open_hags_key(access: u32) -> Result<RegistryKey, String> {
        let key_path = wide("SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers");
        let mut key: HKEY = null_mut();

        let status = if access == KEY_READ {
            unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, key_path.as_ptr(), 0, KEY_READ, &mut key) }
        } else {
            unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, key_path.as_ptr(), 0, KEY_SET_VALUE, &mut key) }
        };

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Open HAGS registry key failed with Windows error 5. Administrator privileges are required."
                    .to_string(),
            );
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Open HAGS registry key failed with Windows error {status}."));
        }

        Ok(RegistryKey(key))
    }

    fn state_from_hags_value(value: Option<u32>) -> String {
        match value {
            Some(1) => "Enabled".to_string(),
            Some(2) => "Disabled".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    fn raw_hags_value(value: Option<u32>) -> String {
        match value {
            Some(value) => format!("DWORD:{value}"),
            None => "Missing".to_string(),
        }
    }

    fn parse_hags_raw_value(value: &str) -> Option<u32> {
        value.strip_prefix("DWORD:").and_then(|raw| raw.parse::<u32>().ok())
    }

    fn query_hags_snapshot() -> Result<HagsSnapshot, String> {
        let key = open_hags_key(KEY_READ)?;
        let value_name = wide("HwSchMode");
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
            return Ok(HagsSnapshot {
                state: "Unknown".to_string(),
                raw_value: "Missing".to_string(),
            });
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Read HAGS registry value failed with Windows error {status}."));
        }

        if data_type != REG_DWORD {
            return Ok(HagsSnapshot {
                state: "Unknown".to_string(),
                raw_value: "UnsupportedType".to_string(),
            });
        }

        Ok(HagsSnapshot {
            state: state_from_hags_value(Some(data)),
            raw_value: raw_hags_value(Some(data)),
        })
    }

    fn set_hags_value(value: u32) -> Result<(), String> {
        if value != 1 && value != 2 {
            return Err("HAGS registry value must be 1 (Enabled) or 2 (Disabled).".to_string());
        }

        let key = open_hags_key(KEY_SET_VALUE)?;
        let value_name = wide("HwSchMode");
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

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Write HAGS registry value failed with Windows error 5. Administrator privileges are required."
                    .to_string(),
            );
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Write HAGS registry value failed with Windows error {status}."));
        }

        Ok(())
    }

    fn delete_hags_value() -> Result<(), String> {
        let key = open_hags_key(KEY_SET_VALUE)?;
        let value_name = wide("HwSchMode");
        let status = unsafe { RegDeleteValueW(key.0, value_name.as_ptr()) };

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Delete HAGS registry value failed with Windows error 5. Administrator privileges are required."
                    .to_string(),
            );
        }

        if status == ERROR_FILE_NOT_FOUND || status == ERROR_SUCCESS {
            return Ok(());
        }

        Err(format!("Delete HAGS registry value failed with Windows error {status}."))
    }

    fn query_snapshot(service: SC_HANDLE, service_label: &str) -> Result<ServiceSnapshot, String> {
        let mut bytes_needed = 0u32;
        unsafe {
            QueryServiceConfigW(service, null_mut(), 0, &mut bytes_needed);
        }

        if bytes_needed == 0 {
            let code = last_error();
            if code != ERROR_INSUFFICIENT_BUFFER {
                return Err(format!("Unable to query {service_label} startup type. Windows error {code}."));
            }
        }

        let mut buffer = vec![0u8; bytes_needed as usize];
        let config = buffer.as_mut_ptr() as *mut QUERY_SERVICE_CONFIGW;
        let ok = unsafe { QueryServiceConfigW(service, config, bytes_needed, &mut bytes_needed) };

        if ok == 0 {
            return Err(format!(
                "Unable to query {service_label} startup type. Windows error {}.",
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
                "Unable to query {service_label} service status. Windows error {}.",
                last_error()
            ));
        }

        Ok(ServiceSnapshot {
            state: state_name(status.dwCurrentState, &startup_type),
            startup_type,
        })
    }

    fn wait_for_state(service: SC_HANDLE, expected_state: &str, service_label: &str) -> Option<ServiceSnapshot> {
        for _ in 0..20 {
            if let Ok(snapshot) = query_snapshot(service, service_label) {
                if snapshot.state == expected_state
                    || (expected_state == "Stopped" && snapshot.state != "Running" && snapshot.startup_type != "Disabled")
                {
                    return Some(snapshot);
                }
            }

            sleep(Duration::from_millis(250));
        }

        query_snapshot(service, service_label).ok()
    }

    fn apply_service(service_name: &str, optimization_id: &str, label: &str) -> ApplyResult {
        let service_name = wide(service_name);
        let manager = unsafe { OpenSCManagerW(null(), null(), SC_MANAGER_CONNECT) };

        if manager.is_null() {
            let code = last_error();
            return apply_result(
                optimization_id,
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
                format!("Administrator permission is required to disable {label}.")
            } else {
                format!("Unable to open {label} service for apply.")
            };

            return apply_result(
                optimization_id,
                "failed",
                "Unknown",
                "Unknown",
                "Unknown",
                friendly,
                Some(format!("OpenServiceW failed with Windows error {code}.")),
            );
        }

        let service = ServiceHandle(service);
        let before = match query_snapshot(service.0, label) {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    optimization_id,
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
                optimization_id,
                "failed",
                &before.state,
                &before.state,
                &before.startup_type,
                format!("{label} was not changed."),
                Some(format!("ChangeServiceConfigW failed with Windows error {code}.")),
            );
        }

        if before.state == "Running" {
            let mut service_status: SERVICE_STATUS = unsafe { std::mem::zeroed() };
            unsafe {
                ControlService(service.0, SERVICE_CONTROL_STOP, &mut service_status);
            }
        }

        // Success must be confirmed by a real re-query showing the service is
        // Disabled; a failed re-query or an unexpected startup type is
        // reported as a failure instead of being masked.
        let requery = query_snapshot(service.0, label)
            .map(|snapshot| (snapshot.state, snapshot.startup_type));

        match super::input_validation::confirm_service_apply(requery) {
            super::input_validation::ServiceApplyConfirmation::Confirmed { state } => apply_result(
                optimization_id,
                "success",
                &before.state,
                &state,
                &before.startup_type,
                format!("{label} was disabled through the native Tauri executor."),
                None,
            ),
            super::input_validation::ServiceApplyConfirmation::Mismatch {
                state,
                startup_type,
            } => apply_result(
                optimization_id,
                "failed",
                &before.state,
                &state,
                &before.startup_type,
                format!("{label} was not confirmed as Disabled after apply."),
                Some(format!(
                    "Post-apply query detected startup type {startup_type} instead of Disabled."
                )),
            ),
            super::input_validation::ServiceApplyConfirmation::QueryFailed { error } => apply_result(
                optimization_id,
                "failed",
                &before.state,
                "Unknown",
                &before.startup_type,
                format!("{label} could not be confirmed after apply."),
                Some(error),
            ),
        }
    }

    fn restore_service(
        service_name: &str,
        optimization_id: &str,
        label: &str,
        previous_state: String,
        previous_startup_type: String,
    ) -> RecoveryResult {
        let service_name = wide(service_name);
        let manager = unsafe { OpenSCManagerW(null(), null(), SC_MANAGER_CONNECT) };

        if manager.is_null() {
            let code = last_error();
            return recovery_result(
                optimization_id,
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
                format!("Administrator permission is required to restore {label}.")
            } else {
                format!("Unable to open {label} service for recovery.")
            };

            return recovery_result(
                optimization_id,
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
            let actual = query_snapshot(service.0, label)
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());
            let code = last_error();
            return recovery_result(
                optimization_id,
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_startup_type,
                format!("{label} recovery was not applied."),
                Some(format!("ChangeServiceConfigW failed with Windows error {code}.")),
            );
        }

        if previous_state == "Running" {
            unsafe {
                StartServiceW(service.0, 0, null());
            }
        } else if previous_state == "Stopped" || previous_state == "Disabled" {
            let current = query_snapshot(service.0, label).ok();
            if current.as_ref().is_some_and(|snapshot| snapshot.state == "Running") {
                let mut service_status: SERVICE_STATUS = unsafe { std::mem::zeroed() };
                unsafe {
                    ControlService(service.0, SERVICE_CONTROL_STOP, &mut service_status);
                }
            }
        }

        let after = wait_for_state(service.0, &previous_state, label).unwrap_or(ServiceSnapshot {
            state: "Unknown".to_string(),
            startup_type: previous_startup_type.clone(),
        });
        let success = after.state == previous_state
            || (previous_state == "Stopped" && after.state != "Running" && after.startup_type != "Disabled");

        recovery_result(
            optimization_id,
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_startup_type,
            if success {
                format!("{label} was restored to the saved previous state.")
            } else {
                format!("{label} recovery expected {previous_state}, but detected {}.", after.state)
            },
            if success {
                None
            } else {
                Some("Recovered state did not match the saved previous state.".to_string())
            },
        )
    }

    pub fn windows_search() -> ApplyResult {
        apply_service("WSearch", "windows-search", "Windows Search")
    }

    pub fn restore_windows_search(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        restore_service("WSearch", "windows-search", "Windows Search", previous_state, previous_startup_type)
    }

    pub fn sysmain() -> ApplyResult {
        apply_service("SysMain", "sysmain", "SysMain")
    }

    pub fn restore_sysmain(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        restore_service("SysMain", "sysmain", "SysMain", previous_state, previous_startup_type)
    }

    pub fn hags() -> ApplyResult {
        let before = match query_hags_snapshot() {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    "hags",
                    "failed",
                    "Unknown",
                    "Unknown",
                    "Unknown",
                    message.clone(),
                    Some(message),
                );
            }
        };

        if let Err(message) = set_hags_value(1) {
            return apply_result(
                "hags",
                "failed",
                &before.state,
                &before.state,
                &before.raw_value,
                "HAGS was not changed.".to_string(),
                Some(message),
            );
        }

        let after = query_hags_snapshot().unwrap_or(HagsSnapshot {
            state: "Enabled".to_string(),
            raw_value: "DWORD:1".to_string(),
        });

        apply_result(
            "hags",
            if after.state == "Enabled" { "success" } else { "failed" },
            &before.state,
            &after.state,
            &before.raw_value,
            if after.state == "Enabled" {
                "HAGS was enabled through the native Tauri executor. A restart may be required for full effect.".to_string()
            } else {
                format!("HAGS apply expected Enabled, but detected {}.", after.state)
            },
            if after.state == "Enabled" {
                None
            } else {
                Some("Applied registry value did not produce the expected detected state.".to_string())
            },
        )
    }

    pub fn restore_hags(previous_state: String, previous_registry_value: String) -> RecoveryResult {
        let recovery = if previous_registry_value == "Missing" {
            delete_hags_value()
        } else if let Some(value) = parse_hags_raw_value(&previous_registry_value) {
            set_hags_value(value)
        } else {
            Err("Saved HAGS registry value is not restorable.".to_string())
        };

        if let Err(message) = recovery {
            let actual = query_hags_snapshot()
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());

            return recovery_result(
                "hags",
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_registry_value,
                "HAGS recovery was not applied.".to_string(),
                Some(message),
            );
        }

        let after = query_hags_snapshot().unwrap_or(HagsSnapshot {
            state: "Unknown".to_string(),
            raw_value: previous_registry_value.clone(),
        });
        let success = after.state == previous_state;

        recovery_result(
            "hags",
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_registry_value,
            if success {
                "HAGS was restored to the saved previous state. A restart may be required for full effect.".to_string()
            } else {
                format!("HAGS recovery expected {previous_state}, but detected {}.", after.state)
            },
            if success {
                None
            } else {
                Some("Recovered state did not match the saved previous state.".to_string())
            },
        )
    }

    pub fn power_plan() -> ApplyResult {
        let before = match super::power_plan_ops::query_active_power_plan() {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    "power-plan",
                    "failed",
                    "Unknown",
                    "Unknown",
                    "Unknown",
                    message.clone(),
                    Some(message),
                );
            }
        };

        if !super::power_plan_ops::high_performance_available() {
            return apply_result(
                "power-plan",
                "failed",
                &before.state,
                &before.state,
                &before.guid_raw,
                "High performance power plan is not available on this system. Ultimate Performance was not created."
                    .to_string(),
                Some(
                    "High performance power plan is not available on this system. TweakMind does not create Ultimate Performance automatically."
                        .to_string(),
                ),
            );
        }

        let target_guid = match super::power_plan_ops::parse_guid_raw(&format!(
            "GUID:{{{}}}",
            super::power_plan_ops::recommended_high_performance_guid()
        )) {
            Some(guid) => guid,
            None => {
                return apply_result(
                    "power-plan",
                    "failed",
                    &before.state,
                    &before.state,
                    &before.guid_raw,
                    "High performance power plan GUID is invalid.".to_string(),
                    Some("High performance power plan GUID is invalid.".to_string()),
                );
            }
        };

        if let Err(message) = super::power_plan_ops::set_active_power_plan(&target_guid) {
            return apply_result(
                "power-plan",
                "failed",
                &before.state,
                &before.state,
                &before.guid_raw,
                "Power plan was not changed.".to_string(),
                Some(message),
            );
        }

        let after = super::power_plan_ops::query_active_power_plan().unwrap_or(super::power_plan_ops::PowerPlanSnapshot {
            state: "Enabled".to_string(),
            label: "High Performance".to_string(),
            guid_raw: format!(
                "GUID:{{{}}}",
                super::power_plan_ops::recommended_high_performance_guid()
            ),
            message: "High performance power plan detected.".to_string(),
        });
        let success = super::power_plan_ops::is_high_performance(&after);

        apply_result(
            "power-plan",
            if success { "success" } else { "failed" },
            &before.state,
            &after.state,
            &before.guid_raw,
            if success {
                "Power plan was switched to High performance through the native Tauri executor.".to_string()
            } else {
                format!(
                    "Power plan apply expected High performance, but detected {}.",
                    after.label
                )
            },
            if success {
                None
            } else {
                Some("Applied power plan did not produce the expected detected state.".to_string())
            },
        )
    }

    pub fn restore_power_plan(previous_state: String, previous_guid_raw: String) -> RecoveryResult {
        let target_guid = match super::power_plan_ops::parse_guid_raw(&previous_guid_raw) {
            Some(guid) => guid,
            None => {
                return recovery_result(
                    "power-plan",
                    "failed",
                    &previous_state,
                    &previous_state,
                    "Unknown",
                    &previous_guid_raw,
                    "Power plan recovery was not applied.".to_string(),
                    Some("Saved power plan GUID is not restorable.".to_string()),
                );
            }
        };

        if !super::power_plan_ops::scheme_exists(&target_guid) {
            return recovery_result(
                "power-plan",
                "failed",
                &previous_state,
                &previous_state,
                "Unknown",
                &previous_guid_raw,
                "The saved power plan is no longer available on this system.".to_string(),
                Some("The saved power plan is no longer available on this system.".to_string()),
            );
        }

        if let Err(message) = super::power_plan_ops::set_active_power_plan(&target_guid) {
            let actual = super::power_plan_ops::query_active_power_plan()
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());

            return recovery_result(
                "power-plan",
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_guid_raw,
                "Power plan recovery was not applied.".to_string(),
                Some(message),
            );
        }

        let after = super::power_plan_ops::query_active_power_plan().unwrap_or(super::power_plan_ops::PowerPlanSnapshot {
            state: "Unknown".to_string(),
            label: "Unknown".to_string(),
            guid_raw: previous_guid_raw.clone(),
            message: "Active power plan could not be confirmed after recovery.".to_string(),
        });
        let success = after.state == previous_state;

        recovery_result(
            "power-plan",
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_guid_raw,
            if success {
                "Power plan was restored to the saved previous state.".to_string()
            } else {
                format!(
                    "Power plan recovery expected {previous_state}, but detected {} ({}).",
                    after.state, after.label
                )
            },
            if success {
                None
            } else {
                Some("Recovered power plan did not match the saved previous state.".to_string())
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

    pub fn core_isolation() -> ApplyResult {
        let before = match query_core_isolation_snapshot() {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    "core-isolation",
                    "failed",
                    "Unknown",
                    "Unknown",
                    "Unknown",
                    message.clone(),
                    Some(message),
                );
            }
        };

        if let Err(message) = set_core_isolation_value(1) {
            return apply_result(
                "core-isolation",
                "failed",
                &before.state,
                &before.state,
                &before.raw_value,
                "Core Isolation (Memory Integrity) was not changed.".to_string(),
                Some(message),
            );
        }

        let after = query_core_isolation_snapshot().unwrap_or(CoreIsolationSnapshot {
            state: "Enabled".to_string(),
            raw_value: "DWORD:1".to_string(),
        });

        apply_result(
            "core-isolation",
            if after.state == "Enabled" { "success" } else { "failed" },
            &before.state,
            &after.state,
            &before.raw_value,
            if after.state == "Enabled" {
                "Core Isolation (Memory Integrity) was enabled through the native Tauri executor. A restart may be required for full effect.".to_string()
            } else {
                format!(
                    "Core Isolation apply expected Enabled, but detected {}.",
                    after.state
                )
            },
            if after.state == "Enabled" {
                None
            } else {
                Some("Applied registry value did not produce the expected detected state.".to_string())
            },
        )
    }

    pub fn restore_core_isolation(previous_state: String, previous_registry_value: String) -> RecoveryResult {
        let recovery = if previous_registry_value == "Missing" {
            delete_core_isolation_value()
        } else if let Some(value) = parse_core_isolation_raw_value(&previous_registry_value) {
            set_core_isolation_value(value)
        } else {
            Err("Saved Core Isolation registry value is not restorable.".to_string())
        };

        if let Err(message) = recovery {
            let actual = query_core_isolation_snapshot()
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());

            return recovery_result(
                "core-isolation",
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_registry_value,
                "Core Isolation recovery was not applied.".to_string(),
                Some(message),
            );
        }

        let after = query_core_isolation_snapshot().unwrap_or(CoreIsolationSnapshot {
            state: "Unknown".to_string(),
            raw_value: previous_registry_value.clone(),
        });
        let success = after.state == previous_state;

        recovery_result(
            "core-isolation",
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_registry_value,
            if success {
                "Core Isolation was restored to the saved previous state. A restart may be required for full effect.".to_string()
            } else {
                format!(
                    "Core Isolation recovery expected {previous_state}, but detected {}.",
                    after.state
                )
            },
            if success {
                None
            } else {
                Some("Recovered state did not match the saved previous state.".to_string())
            },
        )
    }

    const DO_POLICY_PATH: &str = "SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization";
    const DO_CONFIG_PATH: &str = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config";
    const DO_APPLY_TARGET: u32 = 0;

    struct DeliveryOptimizationSnapshot {
        state: String,
        raw_value: String,
        write_source: String,
    }

    enum DeliveryOptimizationRestoreAction {
        Set(u32),
        Delete,
    }

    fn state_from_delivery_optimization_value(value: Option<u32>) -> String {
        match value {
            Some(0) | Some(100) => "Disabled".to_string(),
            Some(_) => "Enabled".to_string(),
            None => "Unknown".to_string(),
        }
    }

    fn encode_delivery_optimization_raw(source: &str, value: Option<u32>) -> String {
        match value {
            Some(value) => format!("{source}:DWORD:{value}"),
            None => format!("{source}:Missing"),
        }
    }

    fn open_delivery_optimization_key(source: &str, access: u32) -> Result<RegistryKey, String> {
        let key_path = wide(match source {
            "Policy" => DO_POLICY_PATH,
            "Config" => DO_CONFIG_PATH,
            _ => {
                return Err("Unknown Delivery Optimization registry source.".to_string());
            }
        });
        let mut key: HKEY = null_mut();

        let status = if access == KEY_READ {
            unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, key_path.as_ptr(), 0, KEY_READ, &mut key) }
        } else {
            unsafe { RegCreateKeyW(HKEY_LOCAL_MACHINE, key_path.as_ptr(), &mut key) }
        };

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Open Delivery Optimization registry key failed with Windows error 5. Administrator privileges may be required."
                    .to_string(),
            );
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Open Delivery Optimization registry key failed with Windows error {status}."));
        }

        Ok(RegistryKey(key))
    }

    fn read_delivery_optimization_dword(source: &str) -> Result<Option<u32>, String> {
        let key = match open_delivery_optimization_key(source, KEY_READ) {
            Ok(key) => key,
            Err(message) if message.contains("Windows error 2.") => return Ok(None),
            Err(message) => return Err(message),
        };
        let value_name = wide("DODownloadMode");
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
            return Err(format!("Read Delivery Optimization registry value failed with Windows error {status}."));
        }

        if data_type != REG_DWORD {
            return Ok(None);
        }

        Ok(Some(data))
    }

    fn query_delivery_optimization_snapshot() -> Result<DeliveryOptimizationSnapshot, String> {
        match read_delivery_optimization_dword("Policy") {
            Ok(Some(value)) => Ok(DeliveryOptimizationSnapshot {
                state: state_from_delivery_optimization_value(Some(value)),
                raw_value: encode_delivery_optimization_raw("Policy", Some(value)),
                write_source: "Policy".to_string(),
            }),
            Ok(None) => match read_delivery_optimization_dword("Config") {
                Ok(Some(value)) => Ok(DeliveryOptimizationSnapshot {
                    state: state_from_delivery_optimization_value(Some(value)),
                    raw_value: encode_delivery_optimization_raw("Config", Some(value)),
                    write_source: "Config".to_string(),
                }),
                Ok(None) => Ok(DeliveryOptimizationSnapshot {
                    state: "Unknown".to_string(),
                    raw_value: encode_delivery_optimization_raw("Config", None),
                    write_source: "Config".to_string(),
                }),
                Err(message) => Err(message),
            },
            Err(message) => Err(message),
        }
    }

    fn set_delivery_optimization_value(source: &str, value: u32) -> Result<(), String> {
        let key = open_delivery_optimization_key(source, KEY_SET_VALUE)?;
        let value_name = wide("DODownloadMode");
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

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Write Delivery Optimization registry value failed with Windows error 5. Administrator privileges may be required."
                    .to_string(),
            );
        }

        if status != ERROR_SUCCESS {
            return Err(format!("Write Delivery Optimization registry value failed with Windows error {status}."));
        }

        Ok(())
    }

    fn delete_delivery_optimization_value(source: &str) -> Result<(), String> {
        let key = open_delivery_optimization_key(source, KEY_SET_VALUE)?;
        let value_name = wide("DODownloadMode");
        let status = unsafe { RegDeleteValueW(key.0, value_name.as_ptr()) };

        if status == ERROR_ACCESS_DENIED {
            return Err(
                "Delete Delivery Optimization registry value failed with Windows error 5. Administrator privileges may be required."
                    .to_string(),
            );
        }

        if status == ERROR_FILE_NOT_FOUND || status == ERROR_SUCCESS {
            return Ok(());
        }

        Err(format!("Delete Delivery Optimization registry value failed with Windows error {status}."))
    }

    fn parse_delivery_optimization_raw(raw: &str) -> Result<(String, DeliveryOptimizationRestoreAction), String> {
        if raw.ends_with(":Missing") {
            let source = raw.trim_end_matches(":Missing").to_string();
            return Ok((source, DeliveryOptimizationRestoreAction::Delete));
        }

        if let Some((source, value_str)) = raw.split_once(":DWORD:") {
            let value = value_str
                .parse::<u32>()
                .map_err(|_| "Saved Delivery Optimization registry value is not restorable.".to_string())?;
            return Ok((source.to_string(), DeliveryOptimizationRestoreAction::Set(value)));
        }

        Err("Saved Delivery Optimization registry value is not restorable.".to_string())
    }

    pub fn delivery_optimization() -> ApplyResult {
        let before = match query_delivery_optimization_snapshot() {
            Ok(snapshot) => snapshot,
            Err(message) => {
                return apply_result(
                    "delivery-optimization",
                    "failed",
                    "Unknown",
                    "Unknown",
                    "Unknown",
                    message.clone(),
                    Some(message),
                );
            }
        };

        if let Err(message) = set_delivery_optimization_value(&before.write_source, DO_APPLY_TARGET) {
            return apply_result(
                "delivery-optimization",
                "failed",
                &before.state,
                &before.state,
                &before.raw_value,
                "Delivery Optimization was not changed.".to_string(),
                Some(message),
            );
        }

        let after = query_delivery_optimization_snapshot().unwrap_or(DeliveryOptimizationSnapshot {
            state: "Disabled".to_string(),
            raw_value: encode_delivery_optimization_raw(&before.write_source, Some(DO_APPLY_TARGET)),
            write_source: before.write_source.clone(),
        });

        apply_result(
            "delivery-optimization",
            if after.state == "Disabled" { "success" } else { "failed" },
            &before.state,
            &after.state,
            &before.raw_value,
            if after.state == "Disabled" {
                "Delivery Optimization was limited to HTTP-only mode (no peer sharing) through the native Tauri executor.".to_string()
            } else {
                format!(
                    "Delivery Optimization apply expected Disabled, but detected {}.",
                    after.state
                )
            },
            if after.state == "Disabled" {
                None
            } else {
                Some("Applied registry value did not produce the expected detected state.".to_string())
            },
        )
    }

    pub fn restore_delivery_optimization(previous_state: String, previous_registry_value: String) -> RecoveryResult {
        let recovery = match parse_delivery_optimization_raw(&previous_registry_value) {
            Ok((source, DeliveryOptimizationRestoreAction::Delete)) => delete_delivery_optimization_value(&source),
            Ok((source, DeliveryOptimizationRestoreAction::Set(value))) => {
                set_delivery_optimization_value(&source, value)
            }
            Err(message) => Err(message),
        };

        if let Err(message) = recovery {
            let actual = query_delivery_optimization_snapshot()
                .map(|snapshot| snapshot.state)
                .unwrap_or_else(|_| "Unknown".to_string());

            return recovery_result(
                "delivery-optimization",
                "failed",
                &previous_state,
                &previous_state,
                &actual,
                &previous_registry_value,
                "Delivery Optimization recovery was not applied.".to_string(),
                Some(message),
            );
        }

        let after = query_delivery_optimization_snapshot().unwrap_or(DeliveryOptimizationSnapshot {
            state: "Unknown".to_string(),
            raw_value: previous_registry_value.clone(),
            write_source: "Config".to_string(),
        });
        let success = after.state == previous_state;

        recovery_result(
            "delivery-optimization",
            if success { "success" } else { "failed" },
            &previous_state,
            &previous_state,
            &after.state,
            &previous_registry_value,
            if success {
                "Delivery Optimization was restored to the saved previous state.".to_string()
            } else {
                format!(
                    "Delivery Optimization recovery expected {previous_state}, but detected {}.",
                    after.state
                )
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

    pub fn core_isolation() -> ApplyResult {
        apply_result(
            "core-isolation",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "Core Isolation Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_core_isolation(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "core-isolation",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "Core Isolation Recovery is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn delivery_optimization() -> ApplyResult {
        apply_result(
            "delivery-optimization",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "Delivery Optimization Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_delivery_optimization(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "delivery-optimization",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "Delivery Optimization Recovery is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn sysmain() -> ApplyResult {
        apply_result(
            "sysmain",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "SysMain Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_sysmain(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "sysmain",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "SysMain Recovery is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn hags() -> ApplyResult {
        apply_result(
            "hags",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "HAGS Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_hags(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "hags",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "HAGS Recovery is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn power_plan() -> ApplyResult {
        apply_result(
            "power-plan",
            "failed",
            "Unknown",
            "Unknown",
            "Unknown",
            "Power Plan Apply is only available on Windows.".to_string(),
            Some("Unsupported operating system.".to_string()),
        )
    }

    pub fn restore_power_plan(previous_state: String, previous_startup_type: String) -> RecoveryResult {
        recovery_result(
            "power-plan",
            "failed",
            &previous_state,
            &previous_state,
            "Unknown",
            &previous_startup_type,
            "Power Plan Recovery is only available on Windows.".to_string(),
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

    pub fn sysmain() -> DetectionResult {
        unsupported("SysMain")
    }

    pub fn hags() -> DetectionResult {
        unsupported("HAGS")
    }

    pub fn power_plan() -> DetectionResult {
        unsupported("Power Plan")
    }

    pub fn visual_effects() -> DetectionResult {
        unsupported("Visual Effects")
    }

    pub fn active_hours() -> DetectionResult {
        unsupported("Windows Update Active Hours")
    }

    pub fn background_apps() -> DetectionResult {
        unsupported("Background Apps")
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
fn detect_sysmain() -> DetectionResult {
    windows_detect::sysmain()
}

#[tauri::command]
fn detect_hags() -> DetectionResult {
    windows_detect::hags()
}

#[tauri::command]
fn detect_power_plan() -> DetectionResult {
    windows_detect::power_plan()
}

#[tauri::command]
fn detect_visual_effects() -> DetectionResult {
    windows_detect::visual_effects()
}

#[tauri::command]
fn detect_active_hours() -> DetectionResult {
    windows_detect::active_hours()
}

#[tauri::command]
fn detect_background_apps() -> DetectionResult {
    windows_detect::background_apps()
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

#[tauri::command]
fn apply_core_isolation() -> ApplyResult {
    windows_apply::core_isolation()
}

#[tauri::command]
fn restore_core_isolation(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_core_isolation(previous_state, previous_startup_type)
}

#[tauri::command]
fn apply_delivery_optimization() -> ApplyResult {
    windows_apply::delivery_optimization()
}

#[tauri::command]
fn restore_delivery_optimization(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_delivery_optimization(previous_state, previous_startup_type)
}

#[tauri::command]
fn apply_sysmain() -> ApplyResult {
    windows_apply::sysmain()
}

#[tauri::command]
fn restore_sysmain(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_sysmain(previous_state, previous_startup_type)
}

#[tauri::command]
fn apply_hags() -> ApplyResult {
    windows_apply::hags()
}

#[tauri::command]
fn restore_hags(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_hags(previous_state, previous_startup_type)
}

#[tauri::command]
fn apply_power_plan() -> ApplyResult {
    windows_apply::power_plan()
}

#[tauri::command]
fn restore_power_plan(previous_state: String, previous_startup_type: String) -> RecoveryResult {
    windows_apply::restore_power_plan(previous_state, previous_startup_type)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_windows_search,
            detect_game_mode,
            detect_core_isolation,
            detect_delivery_optimization,
            detect_sysmain,
            detect_hags,
            detect_power_plan,
            detect_visual_effects,
            detect_active_hours,
            detect_background_apps,
            apply_windows_search,
            restore_windows_search,
            apply_game_mode,
            restore_game_mode,
            apply_core_isolation,
            restore_core_isolation,
            apply_delivery_optimization,
            restore_delivery_optimization,
            apply_sysmain,
            restore_sysmain,
            apply_hags,
            restore_hags,
            apply_power_plan,
            restore_power_plan
        ])
        .run(tauri::generate_context!())
        .expect("failed to run TweakMind");
}
