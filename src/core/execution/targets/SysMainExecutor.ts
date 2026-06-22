import { invoke } from "@tauri-apps/api/core";
import type { ApplyExecutionResult } from "../OptimizationExecutionTypes";
import { isTauriRuntime, nowTimestamp } from "./ExecutionRuntime";

export class SysMainExecutor {
  async apply(): Promise<ApplyExecutionResult> {
    if (!isTauriRuntime()) {
      return {
        optimizationId: "sysmain",
        applyMode: "unsupported",
        status: "unsupported",
        previousState: "Unknown",
        currentState: "Unknown",
        error: "Real SysMain Apply is only available inside the Tauri desktop app. No Windows changes were made.",
        timestamp: nowTimestamp()
      };
    }

    try {
      return await invoke<ApplyExecutionResult>("apply_sysmain");
    } catch (error) {
      return {
        optimizationId: "sysmain",
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
