#!/usr/bin/env node
// prompt-engine CLI — v0.1.0
// Stub: the real dispatch lives in Claude Code via the 13-agent team.
// This CLI prints the surface area so users know what's available.

const FLOWS = [
  { name: 'flow-design',          trigger: 'design a prompt for X',           sequence: 'architect -> lab-specialist -> red-team -> evaluator' },
  { name: 'flow-optimize',        trigger: 'optimize this prompt, /po',       sequence: 'optimizer -> lab-specialist -> evaluator' },
  { name: 'flow-evaluate',        trigger: 'evaluate my prompt',              sequence: 'evaluator -> red-team' },
  { name: 'flow-harvest',         trigger: 'import from Fabric',              sequence: 'harvester -> red-team -> librarian' },
  { name: 'flow-curate',          trigger: 'rerank prompts in X category',    sequence: 'librarian -> optimizer -> evaluator' },
  { name: 'flow-introspect',      trigger: 'IFS session, journal with me',    sequence: 'cartographer (solo)' },
  { name: 'flow-profile',         trigger: 'profile me on Big Five',          sequence: 'psychometrist -> cartographer' },
  { name: 'flow-knowledge-base',  trigger: 'design prompts for RAG of X',     sequence: 'architect -> librarian -> evaluator' },
];

console.log('prompt-engine v0.1.0 — wire up via Claude Code');
console.log('');
console.log('The 13 agents live in agents/. Mirror to ~/.claude/agents/ to activate.');
console.log('');
console.log('The 8 canonical flows:');
console.log('');
for (const f of FLOWS) {
  console.log(`  ${f.name.padEnd(24)} ${f.sequence}`);
  console.log(`  ${''.padEnd(24)} trigger: "${f.trigger}"`);
  console.log('');
}
console.log('Docs: ./docs/quickstart.md');
console.log('Schema: ./schema/pattern.schema.json');
console.log('Companion corpus: https://github.com/frankxai/prompt-library');
