import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const ID = /^(?:P\d{3}|[a-z][a-z0-9]*(?:_[a-z0-9]+)*)$/;
const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const STATES = new Set(['prepared', 'queued', 'running', 'completed', 'blocked', 'cancelled', 'failed']);
const VISIBILITIES = new Set(['public', 'private']);

function object(value, label, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`${label}.${key} is not supported.`);
  }
}

function text(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
}

function strings(value, label, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) throw new Error(`${label} must be ${allowEmpty ? 'an' : 'a non-empty'} array.`);
  value.forEach((item, index) => text(item, `${label}[${index}]`));
}

function visibility(value, label) {
  if (!VISIBILITIES.has(value)) throw new Error(`${label} must be public or private.`);
}

function execution(value) {
  object(value, 'execution', ['state', 'execution_id', 'receipt']);
  if (!STATES.has(value.state)) throw new Error(`Unknown execution state: ${value.state}.`);
  if (value.state === 'prepared') {
    if (value.execution_id !== null || value.receipt !== null) throw new Error('A prepared task cannot claim an execution receipt.');
    return;
  }
  receipt(value.receipt);
  if (value.receipt.state !== value.state || value.receipt.execution_id !== value.execution_id) throw new Error('Execution state must match its returned receipt.');
}

function receipt(value) {
  object(value, 'receipt', ['state', 'execution_id', 'adapter', 'received_at', 'evidence_ref']);
  if (!STATES.has(value.state) || value.state === 'prepared') throw new Error(`Unknown receipt state: ${value.state}.`);
  text(value.execution_id, 'receipt.execution_id');
  text(value.adapter, 'receipt.adapter');
  const timestamp = value.received_at;
  if (typeof timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp) || Number.isNaN(Date.parse(timestamp)) || new Date(timestamp).toISOString().replace('.000Z', 'Z') !== timestamp.replace('.000Z', 'Z')) throw new Error('receipt.received_at must be a valid UTC ISO timestamp.');
  if (value.evidence_ref !== undefined) text(value.evidence_ref, 'receipt.evidence_ref');
  if (value.state === 'completed') text(value.evidence_ref, 'receipt.evidence_ref');
}

function prompt(value, index, prefixes) {
  const label = `prompts[${index}]`;
  object(value, label, ['id', 'version', 'title', 'brand', 'brand_revision', 'specialist', 'objective', 'input_requirements', 'output_contract', 'owning_repository', 'owning_issue', 'role_owner', 'dependencies', 'skills', 'tools', 'harness_capabilities', 'model_configuration', 'visibility', 'acceptance', 'resource_ceiling', 'prompt']);
  if (typeof value.id !== 'string' || !ID.test(value.id)) throw new Error(`${label}.id must be a stable prompt ID.`);
  if (typeof value.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(value.version)) throw new Error(`${label}.version must be semver.`);
  for (const field of ['title', 'brand', 'brand_revision', 'specialist', 'objective', 'role_owner', 'prompt']) text(value[field], `${label}.${field}`);
  if (!Object.hasOwn(prefixes.specialists, value.specialist)) throw new Error(`Missing specialist prefix: ${value.specialist}.`);
  for (const field of ['input_requirements', 'output_contract', 'acceptance']) strings(value[field], `${label}.${field}`);
  strings(value.dependencies, `${label}.dependencies`, true);
  if (!Array.isArray(value.skills) || value.skills.some(s => !s || typeof s !== 'object' || Array.isArray(s))) throw new Error(`${label}.skills must be an array of objects.`);
  value.skills.forEach((skill, i) => {
    object(skill, `${label}.skills[${i}]`, ['source', 'revision', 'license']);
    text(skill.source, `${label}.skills[${i}].source`);
    text(skill.revision, `${label}.skills[${i}].revision`);
    text(skill.license, `${label}.skills[${i}].license`);
  });
  object(value.tools, `${label}.tools`, ['required', 'optional']);
  strings(value.tools.required, `${label}.tools.required`, true);
  strings(value.tools.optional, `${label}.tools.optional`, true);
  strings(value.harness_capabilities, `${label}.harness_capabilities`, true);
  object(value.model_configuration, `${label}.model_configuration`, Object.keys(value.model_configuration || {}));
  for (const [k, v] of Object.entries(value.model_configuration)) {
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') {
      throw new Error(`${label}.model_configuration.${k} must be string, number, or boolean.`);
    }
  }
  if (typeof value.owning_repository !== 'string' || !REPOSITORY.test(value.owning_repository)) throw new Error(`${label}.owning_repository must be owner/repository.`);
  if (!Number.isSafeInteger(value.owning_issue) || value.owning_issue < 1) throw new Error(`${label}.owning_issue must be a positive integer.`);
  visibility(value.visibility, `${label}.visibility`);
  object(value.resource_ceiling, `${label}.resource_ceiling`, ['currency', 'cash_minor', 'attempts', 'time_minutes']);
  if (typeof value.resource_ceiling.currency !== 'string' || !/^[A-Z]{3}$/.test(value.resource_ceiling.currency)) throw new Error('resource_ceiling.currency must be a three-letter code.');
  for (const field of ['cash_minor', 'attempts', 'time_minutes']) {
    const amount = value.resource_ceiling[field];
    if (!Number.isSafeInteger(amount) || amount < (field === 'attempts' ? 1 : 0)) throw new Error(`resource_ceiling.${field} must be a bounded non-negative integer (attempts >= 1).`);
  }
}

export function validateCatalog(catalog) {
  object(catalog, 'catalog', ['schema_version', 'source', 'prefixes', 'prompts']);
  if (catalog.schema_version !== '1.0.0') throw new Error('Unsupported catalog schema_version.');
  object(catalog.source, 'source', ['repository', 'revision', 'visibility']);
  if (typeof catalog.source.repository !== 'string' || !REPOSITORY.test(catalog.source.repository)) throw new Error('source.repository must be owner/repository.');
  text(catalog.source.revision, 'source.revision');
  visibility(catalog.source.visibility, 'source.visibility');
  object(catalog.prefixes, 'prefixes', ['shared', 'specialists']);
  text(catalog.prefixes.shared, 'prefixes.shared');
  if (!catalog.prefixes.specialists || typeof catalog.prefixes.specialists !== 'object' || Array.isArray(catalog.prefixes.specialists)) throw new Error('prefixes.specialists must be an object.');
  for (const [key, value] of Object.entries(catalog.prefixes.specialists)) {
    if (!ID.test(key)) throw new Error('Specialist keys must be stable IDs.');
    text(value, `prefixes.specialists.${key}`);
  }
  if (!Array.isArray(catalog.prompts) || catalog.prompts.length === 0) throw new Error('prompts must be a non-empty array.');
  const ids = new Set();
  catalog.prompts.forEach((value, index) => {
    prompt(value, index, catalog.prefixes);
    if (ids.has(value.id)) throw new Error(`Duplicate prompt ID: ${value.id}.`);
    ids.add(value.id);
  });
  return catalog;
}

export function readCatalog(filename) {
  let catalog;
  try { catalog = JSON.parse(readFileSync(filename, 'utf8')); }
  catch { throw new Error('Catalog could not be read as JSON.'); }
  return validateCatalog(catalog);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function immutableBody(packet) {
  const { packet_id, content_sha256, execution: ignoredExecution, brief_markdown, ...body } = packet;
  return body;
}

function validatePacket(packet) {
  object(packet, 'packet', ['schema_version', 'packet_id', 'content_sha256', 'source', 'prompt_id', 'version', 'title', 'brand', 'brand_revision', 'specialist', 'objective', 'input_requirements', 'output_contract', 'owning_repository', 'owning_issue', 'role_owner', 'dependencies', 'skills', 'tools', 'harness_capabilities', 'model_configuration', 'visibility', 'source_prompt_visibility', 'acceptance', 'resource_ceiling', 'instructions', 'execution', 'brief_markdown']);
  // Reuse the catalog validator so adapters cannot bypass its field or prefix checks.
  validateCatalog({
    schema_version: packet.schema_version,
    source: packet.source,
    prefixes: { shared: packet.instructions?.shared, specialists: { [packet.specialist]: packet.instructions?.specialist } },
    prompts: [{ ...immutableBody(packet), id: packet.prompt_id, visibility: packet.source_prompt_visibility, prompt: packet.instructions?.task }]
      .map(({ schema_version, source, prompt_id, source_prompt_visibility, instructions, ...entry }) => entry),
  });
  object(packet.instructions, 'instructions', ['shared', 'specialist', 'task']);
  const expectedVisibility = packet.source.visibility === 'private' || packet.source_prompt_visibility === 'private' ? 'private' : 'public';
  if (packet.visibility !== expectedVisibility) throw new Error('Packet visibility cannot downgrade its source or prompt.');
  const contentHash = digest(immutableBody(packet));
  if (packet.content_sha256 !== contentHash || packet.packet_id !== `task_${contentHash}`) throw new Error('Packet content does not match its composition hash.');
  execution(packet.execution);
  if (packet.brief_markdown !== renderTaskPacket(packet)) throw new Error('Packet Markdown must match its structured fields.');
  return packet;
}

export function composeTaskPacket(catalog, id) {
  validateCatalog(catalog);
  const selected = catalog.prompts.find((entry) => entry.id === id);
  if (!selected) throw new Error(`Unknown prompt ID: ${id}.`);
  const { id: promptId, prompt: task, visibility: promptVisibility, ...fields } = structuredClone(selected);
  const body = {
    schema_version: '1.0.0',
    source: structuredClone(catalog.source),
    prompt_id: promptId,
    ...fields,
    visibility: catalog.source.visibility === 'private' || promptVisibility === 'private' ? 'private' : 'public',
    source_prompt_visibility: promptVisibility,
    instructions: { shared: catalog.prefixes.shared, specialist: catalog.prefixes.specialists[selected.specialist], task },
  };
  const contentHash = digest(body);
  const packet = { packet_id: `task_${contentHash}`, content_sha256: contentHash, ...body, execution: { state: 'prepared', execution_id: null, receipt: null } };
  packet.brief_markdown = renderTaskPacket(packet);
  return validatePacket(packet);
}

export function renderTaskPacket(packet) {
  const list = (items) => items.length ? items.map((item) => `- ${item}`).join('\n') : '- None declared.';
  const skillList = (skills) => skills.length ? skills.map((s) => `- ${s.source} @ ${s.revision} (License: ${s.license})`).join('\n') : '- None declared.';
  const configList = (config) => Object.keys(config).length ? Object.entries(config).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '- None declared.';
  const ceiling = packet.resource_ceiling;
  return `# ${packet.title}\n\n## Shared instructions\n\n${packet.instructions.shared}\n\n## Specialist instructions (${packet.specialist})\n\n${packet.instructions.specialist}\n\n## Task\n\n${packet.instructions.task}\n\n## Objective\n\n${packet.objective}\n\n## Input requirements\n\n${list(packet.input_requirements)}\n\n## Output contract\n\n${list(packet.output_contract)}\n\n## Acceptance\n\n${list(packet.acceptance)}\n\n## Dependencies\n\n${list(packet.dependencies)}\n\n## Skills\n\n${skillList(packet.skills)}\n\n## Tools\n\nRequired:\n${list(packet.tools.required)}\n\nOptional:\n${list(packet.tools.optional)}\n\n## Harness capabilities\n\n${list(packet.harness_capabilities)}\n\n*Note: Missing capabilities produce a usable manual path or a precise unmet prerequisite.*\n\n## Model configuration\n\n${configList(packet.model_configuration)}\n\n## Ownership and limits\n\n- Brand: ${packet.brand} (Revision: ${packet.brand_revision})\n- Owner: ${packet.role_owner}\n- Repository / issue: ${packet.owning_repository} #${packet.owning_issue}\n- Visibility: ${packet.visibility}\n- Resource ceiling: ${ceiling.cash_minor} minor units ${ceiling.currency}; ${ceiling.attempts} attempts; ${ceiling.time_minutes} minutes. This is a planning ceiling, not a reservation.\n- State: ${packet.execution.state}\n- Execution ID: ${packet.execution.execution_id ?? 'None returned.'}\n- Receipt: ${packet.execution.receipt ? JSON.stringify(packet.execution.receipt) : 'None returned; no worker is claimed.'}\n\n## Provenance\n\n- Prompt ID / version: ${packet.prompt_id} / ${packet.version}\n- Source: ${packet.source.repository} @ ${packet.source.revision}\n- Source visibility: ${packet.source.visibility}\n- Prompt visibility: ${packet.source_prompt_visibility}\n- Packet ID: ${packet.packet_id}\n- Composition SHA-256: ${packet.content_sha256}\n`;
}

export function applyExecutionReceipt(packet, returnedReceipt) {
  validatePacket(packet);
  receipt(returnedReceipt);
  const next = structuredClone(packet);
  const allowed = {
    prepared: ['queued', 'running', 'completed', 'blocked', 'failed', 'cancelled'],
    queued: ['queued', 'running', 'completed', 'blocked', 'failed', 'cancelled'],
    running: ['running', 'completed', 'blocked', 'failed', 'cancelled'],
    blocked: ['blocked', 'queued', 'running', 'completed', 'failed', 'cancelled'],
    completed: ['completed'], cancelled: ['cancelled'], failed: ['failed'],
  };
  if (!allowed[next.execution.state].includes(returnedReceipt.state)) throw new Error(`Invalid execution transition: ${next.execution.state} -> ${returnedReceipt.state}.`);
  if (next.execution.execution_id && next.execution.execution_id !== returnedReceipt.execution_id) throw new Error('A receipt cannot replace an existing execution ID.');
  if (next.execution.receipt && next.execution.receipt.adapter !== returnedReceipt.adapter) throw new Error('A receipt cannot replace an existing execution adapter.');
  if (next.execution.receipt && Date.parse(returnedReceipt.received_at) < Date.parse(next.execution.receipt.received_at)) throw new Error('A receipt cannot precede the current execution receipt.');
  next.execution = { state: returnedReceipt.state, execution_id: returnedReceipt.execution_id, receipt: structuredClone(returnedReceipt) };
  next.brief_markdown = renderTaskPacket(next);
  return validatePacket(next);
}

export function prepareGithubIssueDryRun(packet, destination, approvedPrivateDestination) {
  validatePacket(packet);
  object(destination, 'destination', ['repository', 'visibility']);
  if (typeof destination.repository !== 'string' || !REPOSITORY.test(destination.repository)) throw new Error('destination.repository must be owner/repository.');
  visibility(destination.visibility, 'destination.visibility');
  const address = `github-issue:${destination.repository}`;
  if (packet.visibility === 'private' && (destination.visibility !== 'private' || approvedPrivateDestination !== address)) throw new Error('Private export requires an exact, owner-approved private destination.');
  return {
    schema_version: '1.0.0',
    packet_id: packet.packet_id,
    destination: { adapter: 'github-issue', address, repository: destination.repository, visibility: destination.visibility },
    privacy: { content_visibility: packet.visibility, approval: packet.visibility === 'private' ? 'owner-attested-for-exact-private-destination' : 'public-content' },
    dispatch: { mode: 'dry-run', performed: false, worker_started_by_this_command: false },
    execution: structuredClone(packet.execution),
    payload: { title: `[${packet.prompt_id}] ${packet.title}`, body: packet.brief_markdown },
  };
}
