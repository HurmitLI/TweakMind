/**
 * Release verification: asserts that package.json, tauri.conf.json,
 * Cargo.toml, and Cargo.lock all declare the same tweakmind version.
 *
 * Usage: node scripts/check-versions.mjs (exits 1 on mismatch)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { checkVersionConsistency, versionSources } from "./versionConsistency.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readRepoFile(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const { versions, errors } = checkVersionConsistency({
  packageJson: readRepoFile("package.json"),
  tauriConf: readRepoFile("src-tauri/tauri.conf.json"),
  cargoToml: readRepoFile("src-tauri/Cargo.toml"),
  cargoLock: readRepoFile("src-tauri/Cargo.lock")
});

for (const source of versionSources) {
  process.stdout.write(`${source}: ${versions[source] ?? "missing"}\n`);
}

if (errors.length > 0) {
  for (const error of errors) {
    process.stderr.write(`ERROR: ${error}\n`);
  }
  process.exit(1);
}

process.stdout.write("Version consistency check passed.\n");
