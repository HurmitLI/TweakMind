import { invoke } from "@tauri-apps/api/core";
import type { ApplyExecutionResult } from "../OptimizationExecutionTypes";
import { isTauriRuntime, nowTimestamp } from "./ExecutionRuntime";

export class WindowsSearchExecutor {
  async apply(): Promise<ApplyExecutionResult> {
    if (!isTauriRuntime()) {
      return {
        optimizationId: "windows-search",
        applyMode: "unsupported",
        status: "unsupported",
        previousState: "Unknown",
        currentState: "Unknown",
        error: "Real Windows Apply is only available inside the Tauri desktop app. No Windows changes were made.",
        timestamp: nowTimestamp()
      };
    }

    try {
      return await invoke<ApplyExecutionResult>("apply_windows_search");
    } catch (error) {
      return {
        optimizationId: "windows-search",
        applyMode: "real",
        status: "failed",
        previousState: "Unknown",
        currentState: "Unknown",
        error: error instanceof Error ? error.message : String(error),
        timestamp: nowTimestamp()
      };
    }
  }
}
