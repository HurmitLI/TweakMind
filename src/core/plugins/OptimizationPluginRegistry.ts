import type { OptimizationId } from "../../types/optimization";
import type { OptimizationPlugin } from "./OptimizationPluginTypes";
import { CoreIsolationPlugin } from "./core-isolation/CoreIsolationPlugin";
import { GameModePlugin } from "./game-mode/GameModePlugin";
import { UnsupportedPlugin } from "./UnsupportedPlugin";
import { WindowsSearchPlugin } from "./windows-search/WindowsSearchPlugin";

const plugins = new Map<OptimizationId, OptimizationPlugin>([
  ["windows-search", WindowsSearchPlugin],
  ["game-mode", GameModePlugin],
  ["core-isolation", CoreIsolationPlugin]
]);

export class OptimizationPluginRegistry {
  static get(id: OptimizationId): OptimizationPlugin {
    return plugins.get(id) ?? new UnsupportedPlugin(id);
  }

  static getAll(): OptimizationPlugin[] {
    return Array.from(plugins.values());
  }
}
