import assert from "node:assert/strict";
import test from "node:test";

import { detectOpenVault, resolveVaultRoot } from "../scripts/qa-paths.js";

const noConfig = () => undefined;

test("Vault 路径优先使用命令行参数", () => {
  assert.equal(
    resolveVaultRoot({ argv: ["D:/Vault"], env: { OBSIDIAN_VAULT: "E:/Vault" }, readConfig: noConfig }),
    "D:/Vault",
  );
});

test("Vault 路径其次使用 OBSIDIAN_VAULT", () => {
  assert.equal(resolveVaultRoot({ argv: [], env: { OBSIDIAN_VAULT: "E:/Vault" }, readConfig: noConfig }), "E:/Vault");
});

test("Vault 路径没有输入时使用 Obsidian 当前打开的 Vault", () => {
  const config = JSON.stringify({
    vaults: {
      a: { path: "C:/Old", ts: 2 },
      b: { path: "C:/Open", ts: 1, open: true },
    },
  });

  assert.equal(resolveVaultRoot({ argv: [], env: {}, readConfig: () => config }), "C:/Open");
});

test("没有打开的 Vault 时取最近使用的 Vault", () => {
  const config = JSON.stringify({ vaults: { a: { path: "C:/Old", ts: 1 }, b: { path: "C:/Recent", ts: 2 } } });

  assert.equal(detectOpenVault(config), "C:/Recent");
});

test("找不到任何 Vault 时给出明确错误", () => {
  assert.throws(() => resolveVaultRoot({ argv: [], env: {}, readConfig: noConfig }), /OBSIDIAN_VAULT/);
  assert.throws(() => resolveVaultRoot({ argv: [], env: {}, readConfig: () => "not json" }), /OBSIDIAN_VAULT/);
});
