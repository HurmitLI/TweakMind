import packageJson from "../../../package.json";

const applicationName = "TweakMind";
const releasePhase = "Alpha";

export const AppInfo = {
  name: applicationName,
  version: packageJson.version,
  releasePhase,
  versionLabel: `${packageJson.version} ${releasePhase}`,
  windowTitle: `${applicationName} — ${packageJson.version} ${releasePhase}`,
  description: "Make every Windows optimization an informed decision.",
  tagline: "Understand before you optimize.",
  copyright: `© ${new Date().getFullYear()} ${applicationName}`,
  repositoryUrl: "https://github.com/HurmitLI/TweakMind",
  licenseName: "MIT License"
} as const;
