import { OptimizationRepository } from "../../optimization/OptimizationRepository";
import type { OptimizationEngine } from "../OptimizationEngine";
import { createEngineResult } from "../OptimizationEngine";
import type { OptimizationStatus } from "../../../types/optimization";
import { detectWithNativeCommand } from "../NativeDetection";

export class WindowsSearchEngine implements OptimizationEngine {
  id = "windows-search" as const;

  async detect() {
    return detectWithNativeCommand("detect_windows_search", OptimizationRepository.getById(this.id)?.title ?? "Windows Search");
  }

  async apply() {
    return createEngineResult({
      status: "Success",
      previousState: "Disabled",
      currentState: "Disabled",
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Windows Search"} is already optimized. No Windows changes were made.`
    });
  }

  async restore(previousState: OptimizationStatus = "Disabled") {
    return createEngineResult({
      status: "Success",
      previousState: "Disabled",
      currentState: previousState,
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Windows Search"} restore recorded. No Windows changes were made.`
    });
  }
}
