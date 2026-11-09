import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { run } from '../lib/cli.mjs';
import { applyExecutionReceipt, composeTaskPacket, prepareGithubIssueDryRun, readCatalog, renderTaskPacket, validateCatalog } from '../lib/task-packets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'test', 'fixtures', 'synthetic-catalog.json');
const catalog = () => readCatalog(fixture);
const packet = (id = 'synthetic_design_constitution') => composeTaskPacket(catalog(), id);
const returnedReceipt = (state = 'running', overrides = {}) => ({ state, execution_id: 'synthetic-run-1', adapter: 'synthetic-test-adapter', received_at: '2026-10-08T01:00:00Z', ...overrides });
const destination = (visibility = 'public') => ({ repository: 'example/synthetic-destination', visibility });

function io() {
  const out = { stdout: [], stderr: [] };
  return { out, stdout: (text) => out.stdout.push(text), stderr: (text) => out.stderr.push(text) };
}

test('all three synthetic classes produce a complete Markdown and structured brief', () => {
  const source = catalog();
  for (const entry of source.prompts) {
    const result = composeTaskPacket(source, entry.id);
    assert.equal(result.prompt_id, entry.id);
    assert.equal(result.source.revision, 'SYNTHETIC-REVISION-1');
    assert.equal(result.instructions.shared, source.prefixes.shared);
    assert.equal(result.instructions.specialist, source.prefixes.specialists[entry.specialist]);
    assert.equal(result.instructions.task, entry.prompt);
    assert.equal(result.brief_markdown, renderTaskPacket(result));
    assert.deepEqual(result.execution, { state: 'prepared', execution_id: null, receipt: null });
    for (const heading of ['Shared instructions', 'Specialist instructions', 'Task', 'Objective', 'Input requirements', 'Output contract', 'Acceptance', 'Dependencies', 'Ownership and limits', 'Provenance']) assert.ok(result.brief_markdown.includes(`## ${heading}`));
    for (const field of ['brand', 'role_owner', 'owning_repository', 'owning_issue', 'visibility', 'resource_ceiling']) assert.deepEqual(result[field], entry[field]);
  }
});

test('stable IDs and composition hashes survive repeated imports and object key ordering', () => {
  const first = packet();
  assert.deepEqual(packet(), first);
  const reordered = catalog();
  reordered.source = Object.fromEntries(Object.entries(reordered.source).reverse());
  assert.equal(composeTaskPacket(reordered, first.prompt_id).packet_id, first.packet_id);
  const revised = catalog();
  revised.source.revision = 'SYNTHETIC-REVISION-2';
  assert.notEqual(composeTaskPacket(revised, first.prompt_id).packet_id, first.packet_id);
  revised.source.revision = first.source.revision;
  revised.prefixes.shared += ' Synthetic additional instruction.';
  assert.notEqual(composeTaskPacket(revised, first.prompt_id).packet_id, first.packet_id);
  assert.equal(catalog().prompts[0].prompt, first.instructions.task, 'composition leaves the source untouched');
});

test('missing required input and empty requirements fail before composing', () => {
  for (const mutate of [
    (source) => { delete source.prompts[0].input_requirements; },
    (source) => { source.prompts[0].input_requirements = []; },
    (source) => { source.prompts[0].input_requirements = [' ']; },
    (source) => { delete source.prompts[0].owning_issue; },
    (source) => { source.prompts[0].resource_ceiling.cash_minor = -1; },
    (source) => { source.prompts[0].resource_ceiling.attempts = 0; },
  ]) {
    const source = catalog(); mutate(source);
    assert.throws(() => composeTaskPacket(source, 'synthetic_design_constitution'));
  }
});

test('duplicate IDs, missing shared or specialist prefixes, and unknown selection are rejected', () => {
  const duplicate = catalog(); duplicate.prompts.push(structuredClone(duplicate.prompts[0]));
  assert.throws(() => validateCatalog(duplicate), /Duplicate prompt ID/);
  const shared = catalog(); delete shared.prefixes.shared;
  assert.throws(() => validateCatalog(shared), /prefixes.shared/);
  const specialist = catalog(); delete specialist.prefixes.specialists.design;
  assert.throws(() => validateCatalog(specialist), /Missing specialist prefix/);
  assert.throws(() => composeTaskPacket(catalog(), 'P999'), /Unknown prompt ID/);
});

test('a private source keeps even a public selected prompt private', () => {
  const source = catalog(); source.source.visibility = 'private';
  const result = composeTaskPacket(source, 'synthetic_design_constitution');
  assert.equal(result.source_prompt_visibility, 'public');
  assert.equal(result.visibility, 'private');
  assert.throws(() => prepareGithubIssueDryRun(result, destination()), /Private export/);
  result.visibility = 'public';
  assert.throws(() => prepareGithubIssueDryRun(result, destination()), /cannot downgrade/);
});

test('private exports require a matching explicit approval and declared private boundary', () => {
  const privatePacket = packet('synthetic_teaching_article');
  const address = 'github-issue:example/synthetic-destination';
  assert.throws(() => prepareGithubIssueDryRun(privatePacket, destination('private')), /Private export/);
  assert.throws(() => prepareGithubIssueDryRun(privatePacket, destination('private'), 'github-issue:example/other'), /Private export/);
  assert.throws(() => prepareGithubIssueDryRun(privatePacket, destination('public'), address), /Private export/);
  const approved = prepareGithubIssueDryRun(privatePacket, destination('private'), address);
  assert.equal(approved.destination.address, address);
  assert.equal(approved.privacy.approval, 'owner-attested-for-exact-private-destination');
  assert.equal(approved.payload.body, privatePacket.brief_markdown);
  assert.deepEqual(approved.dispatch, { mode: 'dry-run', performed: false, worker_started_by_this_command: false });
  assert.equal(approved.execution.state, 'prepared');
});

test('content or Markdown tampering cannot enter an adapter or receipt update', () => {
  const changed = packet(); changed.instructions.shared = 'Synthetic modified instructions.';
  assert.throws(() => prepareGithubIssueDryRun(changed, destination()), /composition hash/);
  assert.throws(() => applyExecutionReceipt(changed, returnedReceipt()), /composition hash/);
  const markdown = packet(); markdown.brief_markdown += ' Synthetic unaudited content.';
  assert.throws(() => prepareGithubIssueDryRun(markdown, destination()), /Markdown must match/);
});

test('unknown states and unreceipted running claims fail', () => {
  assert.throws(() => applyExecutionReceipt(packet(), returnedReceipt('teleported')), /Unknown receipt state/);
  assert.throws(() => applyExecutionReceipt(packet(), returnedReceipt('running', { execution_id: '' })), /execution_id/);
  const unknown = packet(); unknown.execution.state = 'teleported';
  assert.throws(() => prepareGithubIssueDryRun(unknown, destination()), /Unknown execution state/);
  const unreceipted = packet(); unreceipted.execution.state = 'running';
  assert.throws(() => prepareGithubIssueDryRun(unreceipted, destination()), /receipt must be an object/);
});

test('returned queue receipts remain queued and running retains its returned identifier', () => {
  const initial = packet();
  const queued = applyExecutionReceipt(initial, returnedReceipt('queued'));
  assert.equal(initial.execution.state, 'prepared');
  assert.equal(queued.execution.state, 'queued');
  const manifest = prepareGithubIssueDryRun(queued, destination());
  assert.equal(manifest.execution.state, 'queued');
  assert.equal(manifest.dispatch.worker_started_by_this_command, false);
  const running = applyExecutionReceipt(queued, returnedReceipt('running', { received_at: '2026-10-08T01:01:00Z' }));
  assert.equal(running.execution.execution_id, 'synthetic-run-1');
  assert.equal(running.packet_id, initial.packet_id, 'execution observations do not rewrite composition identity');
  assert.match(running.brief_markdown, /State: running/);
});

test('receipt changes cannot replace an execution identity, regress time, or reverse a terminal state', () => {
  const running = applyExecutionReceipt(packet(), returnedReceipt());
  assert.throws(() => applyExecutionReceipt(running, returnedReceipt('running', { execution_id: 'synthetic-run-2' })), /execution ID/);
  assert.throws(() => applyExecutionReceipt(running, returnedReceipt('running', { adapter: 'synthetic-other-adapter' })), /execution adapter/);
  assert.throws(() => applyExecutionReceipt(running, returnedReceipt('running', { received_at: '2026-10-08T00:00:00Z' })), /cannot precede/);
  assert.throws(() => applyExecutionReceipt(running, returnedReceipt('queued')), /Invalid execution transition/);
  assert.throws(() => applyExecutionReceipt(running, returnedReceipt('completed')), /evidence_ref/);
  const completed = applyExecutionReceipt(running, returnedReceipt('completed', { evidence_ref: 'synthetic://acceptance/1' }));
  assert.throws(() => applyExecutionReceipt(completed, returnedReceipt('running')), /Invalid execution transition/);
  for (const received_at of ['not-a-date', '2026-02-30T00:00:00Z', '2026-10-08']) assert.throws(() => applyExecutionReceipt(packet(), returnedReceipt('running', { received_at })), /valid UTC ISO/);
});

test('a queued job can complete between observations with evidence and the same execution ID', () => {
  const queued = applyExecutionReceipt(packet(), returnedReceipt('queued'));
  const completedReceipt = returnedReceipt('completed', { received_at: '2026-10-08T01:01:00Z', evidence_ref: 'synthetic://acceptance/fast-job' });
  assert.throws(() => applyExecutionReceipt(queued, returnedReceipt('completed')), /evidence_ref/);
  assert.throws(() => applyExecutionReceipt(queued, { ...completedReceipt, execution_id: 'synthetic-other-run' }), /execution ID/);
  const completed = applyExecutionReceipt(queued, completedReceipt);
  assert.equal(queued.execution.state, 'queued');
  assert.equal(completed.execution.state, 'completed');
  assert.equal(completed.execution.execution_id, queued.execution.execution_id);
  assert.equal(completed.execution.receipt.evidence_ref, completedReceipt.evidence_ref);
  assert.equal(completed.packet_id, queued.packet_id);
  assert.throws(() => applyExecutionReceipt(completed, returnedReceipt('running', { received_at: '2026-10-08T01:02:00Z' })), /Invalid execution transition/);
});

test('a blocked observation can be followed by same-ID completion while evidence and time guards remain', () => {
  const blocked = applyExecutionReceipt(packet(), returnedReceipt('blocked'));
  const completedReceipt = returnedReceipt('completed', { received_at: '2026-10-08T01:01:00Z', evidence_ref: 'synthetic://acceptance/resumed-job' });
  assert.throws(() => applyExecutionReceipt(blocked, returnedReceipt('completed')), /evidence_ref/);
  assert.throws(() => applyExecutionReceipt(blocked, { ...completedReceipt, received_at: '2026-10-08T00:00:00Z' }), /cannot precede/);
  const completed = applyExecutionReceipt(blocked, completedReceipt);
  assert.equal(blocked.execution.state, 'blocked');
  assert.equal(completed.execution.state, 'completed');
  assert.equal(completed.execution.execution_id, blocked.execution.execution_id);
  assert.equal(completed.execution.receipt.evidence_ref, completedReceipt.evidence_ref);
  assert.equal(completed.packet_id, blocked.packet_id);
});

test('catalog states and unsupported fields cannot fabricate execution during import', () => {
  const source = catalog(); source.prompts[0].execution = { state: 'running', execution_id: 'made-up' };
  assert.throws(() => validateCatalog(source), /execution is not supported/);
  const extra = catalog(); extra.prefixes.specialists.design = '';
  assert.throws(() => validateCatalog(extra), /non-empty string/);
});

test('extended contract properties enforce shape when present but remain backward-compatible', () => {
  const source = catalog();
  // Validates properly when omitting the optional fields (backward compatibility)
  delete source.prompts[0].skills;
  delete source.prompts[0].tools;
  delete source.prompts[0].harness_capabilities;
  delete source.prompts[0].model_configuration;
  delete source.prompts[0].brand_revision;
  validateCatalog(source);

  const badSkill = catalog();
  badSkill.prompts[0].skills = [{}];
  assert.throws(() => validateCatalog(badSkill), /prompts\[0\].skills\[0\].source must be a non-empty string/);

  const badBrand = catalog();
  badBrand.prompts[0].brand_revision = '';
  assert.throws(() => validateCatalog(badBrand), /prompts\[0\].brand_revision must be a non-empty string/);

  const badCapability = catalog();
  badCapability.prompts[0].harness_capabilities = [123];
  assert.throws(() => validateCatalog(badCapability), /prompts\[0\].harness_capabilities\[0\] must be a non-empty string/);

  const badConfigNan = catalog();
  badConfigNan.prompts[0].model_configuration = { top_p: NaN };
  assert.throws(() => validateCatalog(badConfigNan), /prompts\[0\].model_configuration.top_p must be a finite number/);

  const badConfigInf = catalog();
  badConfigInf.prompts[0].model_configuration = { temperature: Infinity };
  assert.throws(() => validateCatalog(badConfigInf), /prompts\[0\].model_configuration.temperature must be a finite number/);
});

test('CLI emits one JSON document or the full Markdown without writes', async () => {
  const local = mkdtempSync(path.join(tmpdir(), 'pe-packet-'));
  const filename = path.join(local, 'catalog.json'); writeFileSync(filename, JSON.stringify(catalog()));
  const before = readdirSync(local);
  const args = ['compose', '--catalog', filename, '--id', 'synthetic_design_constitution'];
  const json = io(); assert.equal(await run([...args, '--json'], json), 0);
  assert.equal(json.out.stdout.length, 1);
  assert.deepEqual(JSON.parse(json.out.stdout[0]), packet());
  const markdown = io(); assert.equal(await run(args, markdown), 0);
  assert.equal(markdown.out.stdout[0], packet().brief_markdown);
  const dry = io();
  assert.equal(await run([...args, '--dry-run', '--destination', 'github-issue:example/synthetic-destination', '--destination-visibility', 'public', '--json'], dry), 0);
  assert.equal(JSON.parse(dry.out.stdout[0]).dispatch.performed, false);
  assert.deepEqual(readdirSync(local), before);
});

test('CLI errors expose no private brief and cannot dispatch or bypass destination checks', async () => {
  const args = ['compose', '--catalog', fixture, '--id', 'synthetic_teaching_article', '--json'];
  const wrong = [
    [...args, '--dry-run', '--destination', 'github-issue:example/synthetic-destination', '--destination-visibility', 'public'],
    [...args, '--destination', 'github-issue:example/synthetic-destination'],
    [...args, '--dry-run'],
    [...args, '--force'],
    [...args, '--id', 'synthetic_design_constitution'],
    ['compose', '--json'],
    ['agents', '--catalog', fixture, '--json'],
  ];
  for (const argv of wrong) {
    const output = io(); assert.equal(await run(argv, output), 1, argv.join(' '));
    assert.equal(output.out.stdout.length, 1);
    assert.equal(JSON.parse(output.out.stdout[0]).exitCode, 1);
    assert.ok(!output.out.stdout[0].includes(catalog().prompts[1].prompt));
  }
});

test('CLI consumes an explicit returned receipt and validator runs against a clone fixture', async () => {
  const local = mkdtempSync(path.join(tmpdir(), 'pe-receipt-'));
  const filename = path.join(local, 'receipt.json'); writeFileSync(filename, JSON.stringify(returnedReceipt('queued')));
  const output = io();
  assert.equal(await run(['compose', '--catalog', fixture, '--id', 'synthetic_design_constitution', '--receipt', filename, '--json'], output), 0);
  assert.equal(JSON.parse(output.out.stdout[0]).execution.state, 'queued');
  const valid = spawnSync(process.execPath, [path.join(root, 'bin/validate-task-catalog.mjs'), fixture], { encoding: 'utf8' });
  assert.equal(valid.status, 0);
  assert.deepEqual(JSON.parse(valid.stdout), { valid: true, schema_version: '1.0.0', prompt_count: 3 });
  writeFileSync(filename, '{malformed');
  const bad = spawnSync(process.execPath, [path.join(root, 'bin/validate-task-catalog.mjs'), filename], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
  assert.ok(!bad.stderr.includes('{malformed'));
});

test('machine-readable schemas preserve the catalog and packet required fields', () => {
  const catalogSchema = JSON.parse(readFileSync(path.join(root, 'schema/task-catalog.schema.json'), 'utf8'));
  const packetSchema = JSON.parse(readFileSync(path.join(root, 'schema/task-packet.schema.json'), 'utf8'));

  // The catalog requires exactly these root properties
  assert.equal(catalogSchema.additionalProperties, false);
  assert.deepEqual(Object.keys(catalog()).sort(), catalogSchema.required.toSorted());

  // Packets have exactly these required properties (which doesn't include optional properties)
  const packetKeys = Object.keys(packet());
  const requiredPacketKeys = packetKeys.filter(k => packetSchema.required.includes(k));
  assert.deepEqual(requiredPacketKeys.sort(), packetSchema.required.toSorted());
});
