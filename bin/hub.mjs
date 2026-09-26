#!/usr/bin/env node
import { run } from '../lib/cli.mjs';

run(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(`${text}\n`),
  stderr: (text) => process.stderr.write(`${text}\n`),
}).then((code) => {
  process.exitCode = code;
});
