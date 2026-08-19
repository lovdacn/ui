"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const workspaceRoot = path.resolve(__dirname, "../../..");
const validator = path.join(__dirname, "validate-registry-channel.cjs");

for (const channel of ["beta", "stable"]) {
  const result = spawnSync(process.execPath, [validator], {
    cwd: path.join(workspaceRoot, "packages/lovdacn"),
    env: { ...process.env, LOVDA_REGISTRY_CHANNEL: channel },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

if (process.env.ENFORCE_STABLE_COMMIT_FREEZE === "1") {
  const freeze = spawnSync(
    "git",
    [
      "diff",
      "--quiet",
      "e690c97f00dcdcecf463f7ccbccb9d1edca58ad",
      "--",
      "apps/v2/public/r/styles",
      "apps/v2/public/r/blocks",
    ],
    { cwd: workspaceRoot, stdio: "inherit" },
  );
  if (freeze.status !== 0) {
    console.error(
      "Frozen stable registry differs from e690c97f00dcdcecf463f7ccbccb9d1edca58ad",
    );
    process.exit(freeze.status || 1);
  }
}

console.log("all registry channels validated successfully");
