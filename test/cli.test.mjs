import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { listAgents, run } from '../lib/cli.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(root, 'bin', 'hub.mjs');

function io() {
  const out = { stdout: [], stderr: [] };
  return { out, stdout: (text) => out.stdout.push(text), stderr: (text) => out.stderr.push(text) };
}

test('listAgents reads every agent with its frontmatter', () => {
  const agents = listAgents(path.join(root, 'agents'));
  assert.equal(agents.length, 13);
  const conductor = agents.find((agent) => agent.name === 'prompt-conductor');
  assert.match(conductor.description, /Routes every prompt-engineering ask/);
  assert.equal(conductor.file, 'prompt-conductor.md');
});

test('agents and flows --json print exactly one JSON document', async () => {
  for (const command of ['agents', 'flows']) {
    const d = io();
    assert.equal(await run([command, '--json'], d), 0);
    assert.equal(d.out.stdout.length, 1);
    assert.ok(Array.isArray(JSON.parse(d.out.stdout[0])[command]));
  }
});

test('install copies the agents, is idempotent, and dry-run writes nothing', async () => {
  const target = mkdtempSync(path.join(tmpdir(), 'pe-agents-'));
  const dry = io();
  assert.equal(await run(['install', '--target', target, '--dry-run', '--json'], dry), 0);
  assert.equal(readdirSync(target).length, 0);
  assert.equal(JSON.parse(dry.out.stdout[0]).planned.length, 13);

  const real = io();
  assert.equal(await run(['install', '--target', target, '--json'], real), 0);
  assert.equal(JSON.parse(real.out.stdout[0]).installed.length, 13);
  assert.ok(existsSync(path.join(target, 'prompt-conductor.md')));

  const again = io();
  assert.equal(await run(['install', '--target', target, '--json'], again), 0);
  assert.equal(JSON.parse(again.out.stdout[0]).unchanged.length, 13);
});

test('install never overwrites a locally edited agent unless --force', async () => {
  const target = mkdtempSync(path.join(tmpdir(), 'pe-agents-'));
  writeFileSync(path.join(target, 'prompt-conductor.md'), 'my local edits');
  const d = io();
  assert.equal(await run(['install', '--target', target, '--json'], d), 1);
  const result = JSON.parse(d.out.stdout[0]);
  assert.deepEqual(result.conflicts, ['prompt-conductor.md']);
  assert.equal(result.installed.length, 0, 'a conflict stops the whole install');

  const forced = io();
  assert.equal(await run(['install', '--target', target, '--force', '--json'], forced), 0);
  assert.equal(JSON.parse(forced.out.stdout[0]).installed.length, 13);
});

test('usage errors exit 1 with one JSON document under --json', async () => {
  for (const argv of [['nope', '--json'], ['agents', 'extra', '--json'], ['install', '--target', '--json'], ['agents', '--bogus', '--json']]) {
    const d = io();
    assert.equal(await run(argv, d), 1, argv.join(' '));
    assert.equal(d.out.stdout.length, 1);
    assert.equal(typeof JSON.parse(d.out.stdout[0]).error, 'string');
  }
});

test('the bin runs, prints help with no args, and reports its package version', () => {
  const { version } = JSON.parse(spawnSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('package.json','utf8'))"], { cwd: root, encoding: 'utf8' }).stdout);
  const help = spawnSync(process.execPath, [bin], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /prompt-engine install/);
  const v = spawnSync(process.execPath, [bin, '--version'], { encoding: 'utf8' });
  assert.equal(v.stdout.trim(), version);
});
