import type { OptimizationId } from "../../types/optimization";
import type { OptimizationEngine } from "./OptimizationEngine";
import { CoreIsolationEngine } from "./engines/CoreIsolationEngine";
import { DeliveryOptimizationEngine } from "./engines/DeliveryOptimizationEngine";
import { GameModeEngine } from "./engines/GameModeEngine";
import { WindowsSearchEngine } from "./engines/WindowsSearchEngine";

const engines = new Map<OptimizationId, OptimizationEngine>([
  ["windows-search", new WindowsSearchEngine()],
  ["game-mode", new GameModeEngine()],
  ["core-isolation", new CoreIsolationEngine()],
  ["delivery-optimization", new DeliveryOptimizationEngine()]
]);

export class OptimizationEngineRegistry {
  static get(id: OptimizationId): OptimizationEngine {
    const engine = engines.get(id);

    if (!engine) {
      throw new Error(`Missing optimization engine for ${id}`);
    }

    return engine;
  }

  static getAll(): OptimizationEngine[] {
    return Array.from(engines.values());
  }
}
