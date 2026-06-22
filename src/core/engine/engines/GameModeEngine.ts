import { OptimizationRepository } from "../../optimization/OptimizationRepository";
import type { OptimizationEngine } from "../OptimizationEngine";
import { createEngineResult } from "../OptimizationEngine";
import type { OptimizationStatus } from "../../../types/optimization";
import { detectWithNativeCommand } from "../NativeDetection";

export class GameModeEngine implements OptimizationEngine {
  id = "game-mode" as const;

  async detect() {
    return detectWithNativeCommand("detect_game_mode", OptimizationRepository.getById(this.id)?.title ?? "Game Mode");
  }

  async apply() {
    return createEngineResult({
      status: "Success",
      previousState: "Unknown",
      currentState: "Unknown",
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Game Mode"} mock apply recorded. No Windows changes were made.`
    });
  }

  async restore(previousState: OptimizationStatus = "Unknown") {
    return createEngineResult({
      status: "Success",
      previousState: "Unknown",
      currentState: previousState,
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Game Mode"} mock restore recorded. No Windows changes were made.`
    });
  }
}
