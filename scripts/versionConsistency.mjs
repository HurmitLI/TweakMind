/**
 * Pure version-extraction and consistency logic for TweakMind release
 * verification. Inputs are raw file contents so the logic stays testable
 * without touching the filesystem.
 */

export const versionSources = ["package.json", "src-tauri/tauri.conf.json", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock"];

function parseJsonVersion(content) {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

export function parseCargoTomlVersion(content) {
  const packageSection = content.split(/^\[/m).find((section) => section.startsWith("package]"));

  if (!packageSection) {
    return null;
  }

  const match = packageSection.match(/^\s*version\s*=\s*"([^"]+)"/m);
  return match ? match[1] : null;
}

export function parseCargoLockVersion(content, packageName = "tweakmind") {
  const packageBlocks = content.split("[[package]]");

  for (const block of packageBlocks) {
    const nameMatch = block.match(/^\s*name\s*=\s*"([^"]+)"/m);

    if (!nameMatch || nameMatch[1] !== packageName) {
      continue;
    }

    const versionMatch = block.match(/^\s*version\s*=\s*"([^"]+)"/m);
    return versionMatch ? versionMatch[1] : null;
  }

  return null;
}

/**
 * @param {{ packageJson: string, tauriConf: string, cargoToml: string, cargoLock: string }} contents
 * @returns {{ versions: Record<string, string | null>, errors: string[] }}
 */
export function checkVersionConsistency(contents) {
  const versions = {
    "package.json": parseJsonVersion(contents.packageJson),
    "src-tauri/tauri.conf.json": parseJsonVersion(contents.tauriConf),
    "src-tauri/Cargo.toml": parseCargoTomlVersion(contents.cargoToml),
    "src-tauri/Cargo.lock": parseCargoLockVersion(contents.cargoLock)
  };

  const errors = [];

  for (const source of versionSources) {
    if (versions[source] === null) {
      errors.push(`${source}: could not read a version for the tweakmind package.`);
    }
  }

  const distinctVersions = [...new Set(Object.values(versions).filter((version) => version !== null))];

  if (distinctVersions.length > 1) {
    const detail = versionSources.map((source) => `${source}=${versions[source] ?? "missing"}`).join(", ");
    errors.push(`Version mismatch across release files: ${detail}`);
  }

  return { versions, errors };
}
