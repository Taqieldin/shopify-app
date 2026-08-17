#!/usr/bin/env node
process.chdir(__dirname);

const { spawn } = require("child_process");
const path = require("path");

process.env.NODE_ENV = "production";

const tsxPath = path.join(__dirname, "node_modules", "tsx", "dist", "esm", "index.mjs");
const serverPath = path.join(__dirname, "server", "index.ts");

const child = spawn(
  process.execPath,
  ["--import", "file://" + tsxPath, serverPath],
  {
    stdio: "inherit",
    cwd: __dirname,
    env: process.env,
  }
);

child.on("error", (err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
