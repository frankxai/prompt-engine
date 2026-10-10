#!/usr/bin/env node
import { readCatalog } from '../lib/task-packets.mjs';

const [filename, ...extra] = process.argv.slice(2);
try {
  if (!filename || extra.length) throw new Error('Usage: node bin/validate-task-catalog.mjs <local-catalog.json>');
  const catalog = readCatalog(filename);
  process.stdout.write(`${JSON.stringify({ valid: true, schema_version: catalog.schema_version, prompt_count: catalog.prompts.length })}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
