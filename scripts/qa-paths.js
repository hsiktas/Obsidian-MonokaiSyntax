import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/* Obsidian 全局配置 obsidian.json 所在目录（记录了所有 Vault 及当前打开的 Vault）。 */
export function obsidianConfigPath({ env = process.env, platform = process.platform } = {}) {
  if (platform === "win32") {
    return join(env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "obsidian", "obsidian.json");
  }

  if (platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "obsidian", "obsidian.json");
  }

  return join(env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "obsidian", "obsidian.json");
}

/* 从 obsidian.json 中找出当前打开的 Vault；没有标记为 open 时取最近使用的一个。 */
export function detectOpenVault(configText) {
  let vaults;

  try {
    vaults = Object.values(JSON.parse(configText).vaults ?? {});
  } catch {
    return undefined;
  }

  const candidates = vaults.filter((vault) => typeof vault?.path === "string");
  const open = candidates.find((vault) => vault.open);

  if (open) {
    return open.path;
  }

  return candidates.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))[0]?.path;
}

function readObsidianConfig(options) {
  const configPath = obsidianConfigPath(options);
  return existsSync(configPath) ? readFileSync(configPath, "utf8") : undefined;
}

export function resolveVaultRoot({
  argv = process.argv.slice(2),
  env = process.env,
  readConfig = () => readObsidianConfig({ env }),
} = {}) {
  const explicit = argv[0] ?? env.OBSIDIAN_VAULT;

  if (explicit) {
    return explicit;
  }

  const configText = readConfig();
  const detected = configText ? detectOpenVault(configText) : undefined;

  if (detected) {
    return detected;
  }

  throw new Error("未找到 Obsidian Vault：请通过命令行参数或 OBSIDIAN_VAULT 环境变量指定 Vault 路径。");
}

export function resolveQaPaths(vaultRoot) {
  const vaultDir = resolve(vaultRoot);
  const qaDir = resolve(vaultDir, "project/Monokai Syntax/QA");
  const themeDir = resolve(vaultDir, ".obsidian/themes/Monokai Syntax");

  return {
    vaultDir,
    qaDir,
    themeDir,
    appearancePath: resolve(vaultDir, ".obsidian/appearance.json"),
    themeCssPath: resolve(themeDir, "theme.css"),
    manifestPath: resolve(themeDir, "manifest.json"),
  };
}
