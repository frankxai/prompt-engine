# Prompt Engine — Agent Instructions

> Repo: `prompt-engine` · Classification: template-study · Owner: FrankX AI · Remote: https://github.com/frankxai/prompt-engine.git

This is the horizontal substrate that designs, optimizes, evaluates, and red-teams prompts across Claude/GPT/Gemini/OSS model families — the 13-agent team described in [`README.md`](README.md). The companion repo [`prompt-library`](https://github.com/frankxai/prompt-library) holds the curated corpus this engine produces; pattern contributions go there, not here.

## Working in this repo

- **Branch:** `main` is the trunk. Cut a feature branch per change; PR back to `main`.
- **Install:** `pnpm install` (Node >=22 required — see `package.json` `engines`).
- **Commands:**
  ```bash
  pnpm run hub agents --json
  pnpm run hub flows --json
  pnpm run hub compose --catalog <local.json> --id <stable-id> --json
  pnpm test                          # dependency-free native tests
  pnpm run eval                      # promptfoo eval
  pnpm run validate <local.json>      # validates the local task-catalog adapter, not corpus patterns
  ```
- **No CI is wired yet** (`.github/` does not exist). Native tests run without dependencies using `node --test test/*.test.mjs`. Run the promptfoo eval command before a PR and report its actual result; this revision has no checked-in promptfoo configuration or eval prompts. Unavailable dependencies or absent eval inputs are not passing gates, and provider calls require an authorized budget. Do not claim "CI passed."
- **Task packets compose locally.** `compose` emits complete Markdown/JSON and can prepare a GitHub issue dry-run payload. It never sends an issue, launches a worker, or reserves resources. A private dry-run payload requires an exact owner-attested private destination; that declaration does not verify remote access. Supplied execution receipts are typed observations, not authenticated runtime proof. See [`docs/task-packets.md`](docs/task-packets.md).
- **Preserve existing conventions.** Do not touch unrelated dirty/untracked files (e.g. `.asph-wip/` is another harness's scratch state — never stage it).
- Do not publish secrets, private memory, credentials, or internal-only strategy.

## Repo layout

| Path | What |
|---|---|
| `agents/` | 13 agent definitions (`prompt-*.md`), mirroring the source of truth at `FrankX/.claude/agents/prompt-*.md` |
| `flows/` | The 8 canonical flow contracts (specialist sequence + handoff + success criterion) |
| `schema/pattern.schema.json` | JSON Schema (draft-07) every published prompt pattern must satisfy |
| `schema/task-{catalog,packet}.schema.json` | Local JSON adapter and complete task-packet contracts |
| `bin/hub.mjs` | CLI entry point (`prompt-engine` bin) |
| `lib/task-packets.mjs` | Local composition, receipt validation, and dry-run issue adapter |
| `docs/contributing.md` | Full contribution guide — read before adding an agent, flow, or technique tag |
| `docs/quickstart.md`, `docs/cross-ai-guide.md` | User-facing setup docs |

## Conventions

- Lower-case, verb-prefixed agent filenames: `prompt-architect.md`, not `Prompt-Architect.md`.
- Every published pattern needs provenance, license, eval score, and red-team verdict — no exceptions (see README "Anti-patterns").
- Lab specialists (`prompt-claude-specialist`, `prompt-gpt-specialist`, `prompt-gemini-specialist`, `prompt-oss-specialist`) stay separate — do not collapse lab-specific quirks into the generic `prompt-architect`.
- No AI-slop phrases anywhere in this repo's docs or generated output: "delve", "dive into", "certainly", "absolutely", "it's worth noting".
- Never lift a pattern from a closed-source marketplace (PromptHub, PromptBase) — permission and data shape are unknown.
- `prompt-psyche-cartographer` maps, never diagnoses — no DSM terms, no "you have X."

## Adding an agent, flow, or technique tag

Full process (template copy, doctrine checklist, eval comparison requirement, PR title format) is in [`docs/contributing.md`](docs/contributing.md). Short version: copy the closest existing agent as a template, encode the new lab/technique's real quirks (not guesses), add eval coverage comparing against the closest existing specialist, and follow the PR title convention (`feat(agents): add @prompt-{lab}-specialist` / `feat(flows): add flow-{name}`).

## Design Taste Kernel

Not applicable to this repo — `prompt-engine` has no site, app, or frontend surface. If a future task here touches a UI (e.g. a hub dashboard), pick up the estate-wide Design Taste Kernel at `C:\Users\frank\starlight\repos\DESIGN_TASTE.md` and siblings at that point, not before.
