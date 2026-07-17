# Prompt Engine — Agent Instructions

> Repo: `prompt-engine` · Classification: template-study · Owner: FrankX AI · Remote: https://github.com/frankxai/prompt-engine.git

This is the horizontal substrate that designs, optimizes, evaluates, and red-teams prompts across Claude/GPT/Gemini/OSS model families — the 13-agent team described in [`README.md`](README.md). The companion repo [`prompt-library`](https://github.com/frankxai/prompt-library) holds the curated corpus this engine produces; pattern contributions go there, not here.

## Working in this repo

- **Branch:** `main` is the trunk. Cut a feature branch per change; PR back to `main`.
- **Install:** `pnpm install` (Node >=22 required — see `package.json` `engines`).
- **Commands:**
  ```bash
  pnpm run hub design "<ask>"       # node bin/hub.mjs — routes to a flow
  pnpm run hub optimize "<prompt>"
  pnpm run hub evaluate prompts/<pattern>/
  pnpm run eval                      # promptfoo eval
  pnpm run validate                  # BROKEN: package.json points it at bin/validate-schema.mjs, which is not in the tree yet
  ```
- **No CI is wired yet** (`.github/` does not exist in this repo despite the README describing a CI-gated flow). Until it lands, `pnpm run eval` is the manual pre-PR gate — run it before opening a PR, and don't claim "CI passed" in a PR description. `pnpm run validate` joins the gate once `bin/validate-schema.mjs` actually exists.
- **Preserve existing conventions.** Do not touch unrelated dirty/untracked files (e.g. `.asph-wip/` is another harness's scratch state — never stage it).
- Do not publish secrets, private memory, credentials, or internal-only strategy.

## Repo layout

| Path | What |
|---|---|
| `agents/` | 13 agent definitions (`prompt-*.md`), mirroring the source of truth at `FrankX/.claude/agents/prompt-*.md` |
| `flows/` | The 8 canonical flow contracts (specialist sequence + handoff + success criterion) |
| `schema/pattern.schema.json` | JSON Schema (draft-07) every published prompt pattern must satisfy |
| `bin/hub.mjs` | CLI entry point (`prompt-engine` bin) |
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
