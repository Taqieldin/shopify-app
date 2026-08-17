#!/usr/bin/env node
const { execFileSync } = require("child_process");
const path = require("path");

process.chdir(__dirname);

try {
  execFileSync("node", ["--import", "tsx/esm", "server/index.ts"], {
    stdio: "inherit",
    cwd: __dirname,
  });
} catch (e) {
  console.error("Failed to start server:", e.message);
  process.exit(1);
}
