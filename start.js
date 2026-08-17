#!/usr/bin/env node
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

register("tsx/esm", import.meta.url);

await import("./server/index.ts");
