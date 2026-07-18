import type { OptimizationStatus } from "../../types/optimization";
import { LocalizationService } from "./LocalizationService";
import type { TranslationKey } from "./messages";

function normalize(message: string | null | undefined): string {
  return (message ?? "").trim();
}

function translate(key: TranslationKey, params?: Record<string, string | number>) {
  return LocalizationService.translate(key, params);
}

function translateRuntimeState(value: string): string {
  const normalized = value.trim();
  const statusMap: Record<OptimizationStatus, TranslationKey> = {
    Enabled: "status.optimization.enabled",
    Disabled: "status.optimization.disabled",
    Running: "status.optimization.running",
    Stopped: "status.optimization.stopped",
    Default: "status.optimization.default",
    Unknown: "status.optimization.unknown"
  };

  if (normalized in statusMap) {
    return translate(statusMap[normalized as OptimizationStatus]);
  }

  if (normalized === "Disabled (HTTP only, no peer sharing)") {
    return translate("runtime.state.deliveryOptimizationHttpOnly");
  }

  if (normalized === "High performance") {
    return translate("runtime.state.highPerformance");
  }

  return normalized;
}

function isTechnicalWindowsMessage(message: string): boolean {
  return [
    /registry/i,
    /hkey/i,
    /windows error/i,
    /service control/i,
    /open .* failed/i,
    /read .* failed/i,
    /write .* failed/i,
    /delete .* failed/i,
    /powerget/i,
    /powerset/i,
    /invoke/i,
    /api/i
  ].some((pattern) => pattern.test(message));
}

const exactMessages: Record<string, TranslationKey> = {
  "Optimization completed through the executor.": "runtime.apply.completedThroughExecutor",
  "Detection is not available for this optimization yet.": "runtime.scan.detectionUnavailable",
  "Unable to determine the current Windows state. Please retry scanning or check permissions.": "runtime.scan.stateUnknown",
  "Scan failed for this optimization. Unable to determine the current Windows state. Please retry scanning or check permissions.": "runtime.scan.optimizationFailed",
  "Scan failed unexpectedly.": "runtime.scan.unexpectedFailure",
  "Real Apply is not available for this optimization yet. No Windows changes were made.": "runtime.apply.unsupportedOptimization",
  "Recovery is not available for this optimization yet. No Windows changes were made.": "runtime.recovery.unsupportedOptimization",
  "Verification is not available for this optimization yet.": "runtime.verify.unsupportedOptimization",
  "Recovery verification is not available for this optimization yet.": "runtime.verify.recoveryUnsupportedOptimization",
  "A valid History record is required before Recovery can start.": "runtime.recovery.validHistoryRequired",
  "No completed Apply result was found. Verification is pending.": "runtime.verify.noApplyResult",
  "No completed Recovery result was found. Verification is pending.": "runtime.verify.noRecoveryResult",
  "Recovery did not complete successfully, so verification cannot run.": "runtime.verify.recoveryNotSuccessful",
  "Recovery finished.": "runtime.recovery.finished",
  "Captured before apply": "runtime.history.capturedBeforeApply",
  "Active power plan could not be confirmed after recovery.": "runtime.recovery.powerPlanUnconfirmed",
  "Applied registry value did not produce the expected detected state.": "runtime.error.expectedStateMismatch",
  "Applied power plan did not produce the expected detected state.": "runtime.error.expectedStateMismatch",
  "Delivery Optimization was limited to HTTP-only mode (no peer sharing) through the native Tauri executor.": "runtime.apply.deliveryOptimizationHttpOnly"
};

export class RuntimeMessageLocalizationService {
  static translate(message: string | null | undefined): string {
    const normalized = normalize(message);

    if (!normalized) {
      return translate("common.value.unknown");
    }

    const exactKey = exactMessages[normalized];
    if (exactKey) {
      return translate(exactKey);
    }

    const desktopApply = normalized.match(/^Real (.+) Apply is only available inside the Tauri desktop app\. No Windows changes were made\.$/);
    if (desktopApply) {
      return translate("runtime.apply.desktopOnly", { title: desktopApply[1] });
    }

    const windowsApply = normalized.match(/^(.+) Apply is only available on Windows\.$/);
    if (windowsApply) {
      return translate("runtime.apply.windowsOnly", { title: windowsApply[1] });
    }

    const desktopRecovery = normalized.match(/^Real (.+) Recovery is only available inside the Tauri desktop app\. No Windows changes were made\.$/);
    if (desktopRecovery) {
      return translate("runtime.recovery.desktopOnly", { title: desktopRecovery[1] });
    }

    const windowsRecovery = normalized.match(/^(.+) Recovery is only available on Windows\.$/);
    if (windowsRecovery) {
      return translate("runtime.recovery.windowsOnly", { title: windowsRecovery[1] });
    }

    const realRecoveryDesktop = normalized.match(/^Real Recovery is only available inside the Tauri desktop app\. No Windows changes were made\.$/);
    if (realRecoveryDesktop) {
      return translate("runtime.recovery.desktopOnlyGeneric");
    }

    const onlySuccessfulApply = normalized.match(/^Only successful real (.+) Apply results can be verified in this MVP step\.$/);
    if (onlySuccessfulApply) {
      return translate("runtime.verify.onlySuccessfulRealApply", { title: onlySuccessfulApply[1] });
    }

    const recoveryOnlySuccessful = normalized.match(/^Recovery is available only for successful (.+) Real Apply records\.$/);
    if (recoveryOnlySuccessful) {
      return translate("runtime.recovery.onlySuccessfulRealApply", { title: recoveryOnlySuccessful[1] });
    }

    const disabledThroughExecutor = normalized.match(/^(.+) was disabled through the native Tauri executor\.$/);
    if (disabledThroughExecutor) {
      return translate("runtime.apply.disabledThroughExecutor", { title: disabledThroughExecutor[1] });
    }

    const enabledThroughExecutorRestart = normalized.match(/^(.+) was enabled through the native Tauri executor\. A restart may be required for full effect\.$/);
    if (enabledThroughExecutorRestart) {
      return translate("runtime.apply.enabledThroughExecutorRestart", { title: enabledThroughExecutorRestart[1] });
    }

    const applyExpectedButDetected = normalized.match(/^(.+) apply expected (.+), but detected (.+)\.$/);
    if (applyExpectedButDetected) {
      return translate("runtime.apply.expectedButDetected", {
        title: applyExpectedButDetected[1],
        expected: translateRuntimeState(applyExpectedButDetected[2]),
        actual: translateRuntimeState(applyExpectedButDetected[3])
      });
    }

    const recoveryNotApplied = normalized.match(/^(.+) recovery was not applied\.$/);
    if (recoveryNotApplied) {
      return translate("runtime.recovery.notApplied", { title: recoveryNotApplied[1] });
    }

    const recoveryRestored = normalized.match(/^(.+) was restored to the saved previous state\.( A restart may be required for full effect\.)?$/);
    if (recoveryRestored) {
      return translate(recoveryRestored[2] ? "runtime.recovery.restoredRestart" : "runtime.recovery.restored", {
        title: recoveryRestored[1]
      });
    }

    const recoveryExpectedButDetected = normalized.match(/^(.+) recovery expected (.+), but detected (.+?)(?: \(.+\))?\.$/);
    if (recoveryExpectedButDetected) {
      return translate("runtime.recovery.expectedButDetected", {
        title: recoveryExpectedButDetected[1],
        expected: translateRuntimeState(recoveryExpectedButDetected[2]),
        actual: translateRuntimeState(recoveryExpectedButDetected[3])
      });
    }

    const savedStateNotRestorable = normalized.match(/^Saved (.+) registry value is not restorable\.$/);
    if (savedStateNotRestorable) {
      return translate("runtime.recovery.savedStateNotRestorable", { title: savedStateNotRestorable[1] });
    }

    const detectedAs = normalized.match(/^(.+) is now detected as (.+)\.$/);
    if (detectedAs) {
      return translate("runtime.verify.detectedAs", {
        title: detectedAs[1],
        state: translateRuntimeState(detectedAs[2])
      });
    }

    const expectedButDetected = normalized.match(/^Expected (.+) to be (.+), but detected (.+)\.( A restart may be required before the change takes full effect\.)?$/);
    if (expectedButDetected) {
      return translate(expectedButDetected[4] ? "runtime.verify.expectedButDetectedRestart" : "runtime.verify.expectedButDetected", {
        title: expectedButDetected[1],
        expected: translateRuntimeState(expectedButDetected[2]),
        actual: translateRuntimeState(expectedButDetected[3])
      });
    }

    const expectedPowerPlan = normalized.match(/^Expected High performance power plan, but detected (.+)\.$/);
    if (expectedPowerPlan) {
      return translate("runtime.verify.expectedPowerPlanButDetected", {
        actual: translateRuntimeState(expectedPowerPlan[1])
      });
    }

    if (normalized === "Power plan is now detected as High performance.") {
      return translate("runtime.verify.powerPlanHighPerformance");
    }

    if (/administrator|privileges are required|permission is required|windows error 5/i.test(normalized)) {
      return translate("runtime.error.administratorRequired");
    }

    if (/restart may be required/i.test(normalized)) {
      return translate("runtime.error.restartMayBeRequired");
    }

    if (isTechnicalWindowsMessage(normalized)) {
      return translate("runtime.error.windowsSettingFailed");
    }

    return normalized;
  }
}

export function translateRuntimeMessage(message: string | null | undefined): string {
  return RuntimeMessageLocalizationService.translate(message);
}
