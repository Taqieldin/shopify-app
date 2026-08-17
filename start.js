#!/usr/bin/env node
import { execSync } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

execSync("npx tsx server/index.ts", { stdio: "inherit" });
