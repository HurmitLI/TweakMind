import { invoke } from "@tauri-apps/api/core";
import type { OptimizationStatus } from "../../types/optimization";
import type { OptimizationEngineResult, OptimizationEngineStatus } from "./OptimizationEngine";

interface NativeDetectionResult {
  success: boolean;
  status: OptimizationEngineStatus;
  previous_state: OptimizationStatus;
  current_state: OptimizationStatus;
  message: string;
  timestamp: string;
}

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function fromNative(result: NativeDetectionResult): OptimizationEngineResult {
  return {
    success: result.success,
    status: result.status,
    previousState: result.previous_state,
    currentState: result.current_state,
    message: result.message,
    timestamp: result.timestamp
  };
}

export async function detectWithNativeCommand(command: string, label: string): Promise<OptimizationEngineResult> {
  if (!isTauriRuntime()) {
    const timestamp = Math.floor(Date.now() / 1000).toString();

    return {
      success: false,
      status: "Failed",
      previousState: "Unknown",
      currentState: "Unknown",
      message: `${label} detection is only available in the Tauri desktop app.`,
      timestamp
    };
  }

  const result = await invoke<NativeDetectionResult>(command);
  return fromNative(result);
}
