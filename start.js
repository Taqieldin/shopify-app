#!/usr/bin/env node
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

await import("./dist-server/index.js");