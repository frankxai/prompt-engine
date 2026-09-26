import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VERSION = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')).version;

export const FLOWS = [
  { name: 'flow-design', trigger: 'design a prompt for X', sequence: 'architect -> lab-specialist -> red-team -> evaluator' },
  { name: 'flow-optimize', trigger: 'optimize this prompt, /po', sequence: 'optimizer -> lab-specialist -> evaluator' },
  { name: 'flow-evaluate', trigger: 'evaluate my prompt', sequence: 'evaluator -> red-team' },
  { name: 'flow-harvest', trigger: 'import from Fabric', sequence: 'harvester -> red-team -> librarian' },
  { name: 'flow-curate', trigger: 'rerank prompts in X category', sequence: 'librarian -> optimizer -> evaluator' },
  { name: 'flow-introspect', trigger: 'IFS session, journal with me', sequence: 'cartographer (solo)' },
  { name: 'flow-profile', trigger: 'profile me on Big Five', sequence: 'psychometrist -> cartographer' },
  { name: 'flow-knowledge-base', trigger: 'design prompts for RAG of X', sequence: 'architect -> librarian -> evaluator' },
];

const HELP = `prompt-engine ${VERSION}: a 13-agent team that designs, optimizes, evaluates and red-teams prompts.

Usage
  prompt-engine agents [--json]                     list the agents
  prompt-engine flows [--json]                      list the 8 flows and the agents they chain
  prompt-engine install [--target <dir>] [--dry-run] [--force] [--json]
                                                    copy the agents into Claude Code (default ~/.claude/agents)
  prompt-engine --version

install never overwrites an agent you edited: any conflict stops the install unless --force.

Exit codes: 0 ok · 1 usage error or install conflict.
--json prints exactly one JSON document on stdout; messages go to stderr.`;

const COMMANDS = { agents: 1, flows: 1, install: 1 };
const VALUE_FLAGS = new Set(['--target']);
const BOOLEAN_FLAGS = new Set(['--json', '--dry-run', '--force', '--help', '-h', '--version']);

function parseArgs(argv) {
  const args = { positional: [], flags: new Set(), values: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (VALUE_FLAGS.has(arg)) {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) args.problem ??= `${arg} needs a value.`;
      else { args.values[arg] = value; i += 1; }
    } else if (BOOLEAN_FLAGS.has(arg)) args.flags.add(arg);
    else if (arg.startsWith('-')) args.problem ??= `Unknown option: ${arg}.`;
    else args.positional.push(arg);
  }
  return args;
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const fields = {};
  for (const line of match ? match[1].split(/\r?\n/) : []) {
    const colon = line.indexOf(':');
    if (colon > 0) fields[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return fields;
}

export function listAgents(agentsDir) {
  return readdirSync(agentsDir)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort()
    .map((file) => {
      const fields = frontmatter(readFileSync(path.join(agentsDir, file), 'utf8'));
      return { name: fields.name ?? file.replace(/\.md$/, ''), description: fields.description ?? '', tools: fields.tools ?? '', file };
    });
}

export function planInstall(agentsDir, target, force) {
  const plan = { target, toInstall: [], unchanged: [], conflicts: [] };
  for (const { file } of listAgents(agentsDir)) {
    const destination = path.join(target, file);
    if (!existsSync(destination)) plan.toInstall.push(file);
    else if (readFileSync(destination, 'utf8') === readFileSync(path.join(agentsDir, file), 'utf8')) plan.unchanged.push(file);
    else if (force) plan.toInstall.push(file);
    else plan.conflicts.push(file);
  }
  return plan;
}

export async function run(argv, io, { agentsDir = path.join(packageRoot, 'agents'), home = homedir() } = {}) {
  const args = parseArgs(argv);
  const json = args.flags.has('--json');
  const print = (value, message) => {
    if (json) io.stdout(JSON.stringify(value, null, 2));
    else if (message) io.stdout(message);
  };
  const fail = (error) => {
    if (json) io.stdout(JSON.stringify({ error, exitCode: 1 }));
    io.stderr(error);
    return 1;
  };

  if (args.flags.has('--version')) { io.stdout(VERSION); return 0; }
  const [command] = args.positional;
  if (args.flags.has('--help') || args.flags.has('-h') || command === undefined || command === 'help') {
    io.stdout(json ? JSON.stringify({ help: HELP }) : HELP);
    return 0;
  }
  if (args.problem) return fail(`${args.problem} Run prompt-engine --help.`);
  if (!(command in COMMANDS)) return fail(`Unknown command: ${command}. Run prompt-engine --help.`);
  if (args.positional.length > COMMANDS[command]) return fail(`Unexpected argument: ${args.positional[COMMANDS[command]]}.`);

  if (command === 'agents') {
    const agents = listAgents(agentsDir);
    print({ agents }, agents.map((agent) => `  ${agent.name}`).join('\n'));
    return 0;
  }
  if (command === 'flows') {
    print({ flows: FLOWS }, FLOWS.map((flow) => `  ${flow.name.padEnd(22)} ${flow.sequence}\n  ${''.padEnd(22)} trigger: "${flow.trigger}"`).join('\n'));
    return 0;
  }

  const target = path.resolve(args.values['--target'] ?? path.join(home, '.claude', 'agents'));
  const plan = planInstall(agentsDir, target, args.flags.has('--force'));
  if (plan.conflicts.length > 0) {
    print({ target, installed: [], unchanged: plan.unchanged, conflicts: plan.conflicts }, '');
    io.stderr(`Not installed: ${plan.conflicts.length} agent(s) in ${target} differ from this version (${plan.conflicts.join(', ')}). Re-run with --force to overwrite them.`);
    return 1;
  }
  if (args.flags.has('--dry-run')) {
    print({ target, planned: plan.toInstall, unchanged: plan.unchanged, conflicts: [] }, `Would install ${plan.toInstall.length} agent(s) into ${target}; ${plan.unchanged.length} already current.`);
    return 0;
  }
  mkdirSync(target, { recursive: true });
  for (const file of plan.toInstall) copyFileSync(path.join(agentsDir, file), path.join(target, file));
  print({ target, installed: plan.toInstall, unchanged: plan.unchanged, conflicts: [] }, `Installed ${plan.toInstall.length} agent(s) into ${target}; ${plan.unchanged.length} already current. Restart Claude Code to load them.`);
  return 0;
}
