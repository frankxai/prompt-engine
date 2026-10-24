# Prompt Engine

> The 13-agent team that designs, optimizes, evaluates, and red-teams elite prompts — across every major model family.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--extraction-orange.svg)]()

---

## What it is

Prompt Engine is the **horizontal substrate** that lets every AI workflow design, optimize, evaluate, store, and retrieve elite prompts across Claude, GPT, Gemini, and open-source models — with a built-in psyche layer that maps the user's own parts and patterns, never treating prompts as disposable text.

Three commitments:

1. **Every published prompt is evaluated, attributed, lab-tagged, and red-teamed before it ships.** No vibes.
2. **Every contributor uses the same schema** so libraries become true Library-of-Alexandria nodes for prompts.
3. **Every user can map their own parts, values, and patterns** through a Psyche Cartographer that mirrors but never unburdens.

Companion repo: [`frankxai/prompt-library`](https://github.com/frankxai/prompt-library) — the curated corpus this engine produces.

---

## Quick start

```bash
# Requires Node 22+. Install the 13 agents into Claude Code (~/.claude/agents):
npx @frankxai/prompt-engine install

# Then, in any Claude Code session:
#   "design a prompt for summarizing podcasts in my voice"   -> @prompt-conductor runs flow-design
```

The flows run inside Claude Code; the CLI installs and describes them:

```bash
npx @frankxai/prompt-engine agents            # the 13 agents
npx @frankxai/prompt-engine flows             # the 8 flows and the agents each chains
npx @frankxai/prompt-engine install --dry-run # what install would change
```

Every command takes `--json` (exactly one JSON document on stdout) for agents and scripts. `install` never overwrites an agent you edited; a conflict stops the install unless you pass `--force`. Exit codes: 0 ok, 1 usage error or install conflict.

To run the promptfoo evals from a clone: `npm install && npm run eval`.

## Local task packets

From a clone, compose a complete task brief using a stable ID:

```bash
npm run hub -- compose --catalog test/fixtures/synthetic-catalog.json --id synthetic_design_constitution
npm run hub -- compose --catalog test/fixtures/synthetic-catalog.json --id synthetic_design_constitution --json
npm run validate -- test/fixtures/synthetic-catalog.json
npm run test
```

The committed fixtures are entirely synthetic: a design constitution, teaching article, and product acceptance receipt. The teaching fixture is marked private solely to exercise the boundary. Keep the owner-supplied catalog outside this public tree or in ignored `.local/`; `prompt-library` owns the corpus. Adapt it to [`schema/task-catalog.schema.json`](schema/task-catalog.schema.json), then select an ID with `--catalog <local.json> --id <stable-id>`.

Packets include shared and specialist instructions, the full task, source revision, objective, inputs, outputs, repository/issue, role owner, dependencies, acceptance, visibility, and resource ceilings. The stable composition hash changes when the selected content, prefixes, or source revision changes. It detects accidental content changes; it does not authenticate an author.

Prepare an exact GitHub destination and copy-ready payload without dispatching:

```bash
npm run hub -- compose --catalog test/fixtures/synthetic-catalog.json --id synthetic_design_constitution --dry-run --destination github-issue:example/synthetic-destination --destination-visibility public --json
```

Private payloads require `--destination-visibility private` and `--approved-private-destination github-issue:owner/repo` matching the exact destination. This records the operator's approval; it does not verify a repository's actual privacy, permissions, or access. The current adapter always returns `dispatch.performed: false` and sends no external request.

Composition starts at `prepared`. A supplied `--receipt <returned.json>` can record a returned execution identifier and state; `queued` remains distinct from `running`. These typed receipts are operator-supplied observations, not authentication or proof that a worker remains alive. Completion additionally requires an evidence reference and may follow prepared, queued, or blocked when the job finishes between observations. See [the task-packet contract](docs/task-packets.md) for inputs, limitations, and transitions.

---

## The 13-agent team

The Hub follows one top-level Opus composer + 12 specialists. Mega-12 chosen over Elite-8 to give lab-specific quirks their own home.

| # | Agent | Role |
|---|-------|------|
| 0 | `@prompt-conductor` | Opus composer; routes every ask to a flow |
| 1 | `@prompt-claude-specialist` | Anthropic doctrine: XML tags, prefill, extended thinking, constitution-style virtue prompting |
| 2 | `@prompt-gpt-specialist` | OpenAI/GPT-5 doctrine: developer role, reasoning_effort × verbosity, Structured Outputs |
| 3 | `@prompt-gemini-specialist` | Google doctrine: system-at-top, "think very hard" trigger, native grounding |
| 4 | `@prompt-oss-specialist` | Llama/Mistral/Qwen/DeepSeek: `apply_chat_template()`, ChatML vs Llama3 tokens, `<think>` blocks |
| 5 | `@prompt-architect` | Designs new prompts from blank, hands to lab specialist for final pass |
| 6 | `@prompt-optimizer` | Refines existing prompts; outputs diff + rationale; wraps `/po` |
| 7 | `@prompt-evaluator` | Wraps promptfoo (MIT); colocates `evals/` per pattern |
| 8 | `@prompt-librarian` | Owns library repo; categorizes, tags, ranks, enforces schema |
| 9 | `@prompt-harvester` | Bulk-imports Fabric/CC0/MIT sources, tags provenance, runs quality gate |
| 10 | `@prompt-red-team` | Adversarial probes, jailbreak audit, refusal-bypass detection, injection tests |
| 11 | `@prompt-psyche-cartographer` | IFS parts mapping, unblending, Self-led inquiry; Socratic/Stoic/Jungian voice modes |
| 12 | `@prompt-psychometrist` | Administers IPIP-50, Schwartz PVQ, ECR-R, VIA, Enneagram; outputs lenses, not verdicts |

Each agent has a markdown definition in [`agents/`](./agents/) mirroring the source-of-truth at `FrankX/.claude/agents/prompt-*.md`.

---

## The 8 canonical flows

The Conductor maps every request to one of these. Each flow has a fixed specialist sequence and a documented success criterion.

| Flow | Trigger phrases | Sequence | Success criterion |
|------|-----------------|----------|-------------------|
| **flow-design** | "design a prompt for X" | architect → lab-specialist → red-team → evaluator | Output >= 4/5 on 5 example inputs |
| **flow-optimize** | "optimize this prompt", `/po` | optimizer → lab-specialist → evaluator | Optimized beats original on declared metric |
| **flow-evaluate** | "evaluate my prompt" | evaluator → red-team | Score card + adversarial findings in `evals/` |
| **flow-harvest** | "import from Fabric" | harvester → red-team → librarian | New patterns landed with provenance |
| **flow-curate** | "rerank prompts in X category" | librarian → optimizer → evaluator | Library invariants pass; new ranking has rationale |
| **flow-introspect** | "IFS session", "journal with me" | cartographer (solo) | One question or one mirror — never an answer |
| **flow-profile** | "give me a values map", "profile me on Big Five" | psychometrist → cartographer | Profile framed as lens, with caveat |
| **flow-knowledge-base** | "design prompts for RAG of X" | architect → librarian → evaluator | Ingestion + retrieval prompt pair tested against sample docs |

**Red Team gates every publish flow** (design, harvest). This is the load-bearing invariant.

Each flow's full sequence + handoff contract lives in [`flows/`](./flows/).

---

## Composition into Claude Code

The agents in this repo are designed to mirror into Claude Code's `.claude/agents/` directory. `npx @frankxai/prompt-engine install` does this safely (see [Quick start](#quick-start)). To wire them by hand instead:

**Symlink (for development)**:
```bash
ln -s $(pwd)/agents/prompt-conductor.md ~/.claude/agents/prompt-conductor.md
# ...repeat for all 13
```

**Copy (recommended for production)**:
```bash
cp agents/prompt-*.md ~/.claude/agents/
```

After mirroring, agents become available via `@prompt-conductor`, `@prompt-architect`, etc. in any Claude Code session.

To extend with a new lab specialist (e.g., DeepSeek-specific):
1. Copy `agents/prompt-oss-specialist.md` as a starting template
2. Adjust doctrine + handoff contract
3. Add a new flow variant if needed
4. Submit PR with eval comparison vs. existing specialists

See [`docs/contributing.md`](./docs/contributing.md).

---

## Pattern schema

Every prompt in the companion `prompt-library` is a folder with [this schema](./schema/pattern.schema.json):

```yaml
---
id: extract_wisdom               # verb_topic, kebab-snake-case
title: "Extract Wisdom"
version: 1.0.0                   # semver
description: One-sentence purpose.
lane: claude | gpt | gemini | oss | cross-lab
category: analyze | create | extract | summarize | answer | audit | check | compare | improve | write | rate | introspect | profile
tags: [chain-of-thought, structured-output]
techniques: [cot, xml-tags, prefill]
provenance:
  source: original | fabric | awesome-chatgpt-prompts | awesome-claude-prompts | manual
  source_url: https://...
  attribution: "Daniel Miessler / Fabric, MIT"
  license: MIT | CC0 | Apache-2.0
eval:
  score: 4.6
  last_run: 2026-05-13
red_team:
  status: pass | warn | fail
psyche:
  applicable: true | false
  boundary: maps-only | instruments-only | n/a
created: 2026-05-13
updated: 2026-05-13
---
```

See [`schema/pattern.schema.json`](./schema/pattern.schema.json) for the full JSON Schema (draft-07).

---

## Eval harness

Patterns may supply an `evals/promptfoo.yaml` declaring test cases. This engine revision has no checked-in promptfoo configuration or eval prompts. Run `npm run eval` (`promptfoo eval`) before opening a PR and report the actual result, including unavailable native dependencies or absent inputs. Task-packet behavior is tested locally with `npm run test`; these deterministic checks do not evaluate model output quality. CI is not yet wired.

```yaml
description: Evals for extract_wisdom
providers:
  - anthropic:messages:claude-opus-4-7
  - openai:gpt-5
  - google:gemini-3-pro
prompts:
  - file://../pattern.md
tests:
  - vars: { input: "<sample>" }
    assert:
      - type: not-contains
        value: ["delve", "dive into"]   # brand-voice gate
      - type: llm-rubric
        rubric: "Output extracts 3-7 items, each <=16 words, no repetition."
        threshold: 0.8
```

---

## Contributing

Pull requests welcome. Standard flow:

1. Read [`docs/contributing.md`](./docs/contributing.md).
2. Open an issue describing the agent/flow/schema change.
3. Fork, branch, commit, PR.
4. Run native tests, validate any local task-catalog fixture, and attempt `npm run eval` before requesting review. Report unavailable checks accurately; CI is not yet wired. `npm run validate -- <local.json>` validates the task adapter only; published corpus-pattern validation remains separate.
5. Two reviewers must sign off before merge.

Adding a pattern? Submit to [`prompt-library`](https://github.com/frankxai/prompt-library) instead.

Adding an agent or flow? Submit here.

---

## Anti-patterns (never)

- Never publish a pattern without provenance, license, eval score, and red-team verdict.
- Never let Cartographer diagnose. No DSM terms, no "you have X." Maps only.
- Never collapse lab-specific quirks into one Architect. Lab specialists exist because Claude prefill, GPT-5 Structured Outputs, and Gemini grounding are not interchangeable.
- Never lift a pattern from a closed-source marketplace (PromptHub / PromptBase). Permission + data shape unknown.
- Never use AI-slop phrases: "delve", "dive into", "certainly", "absolutely", "it's worth noting".

---

## License

MIT. See [`LICENSE`](./LICENSE).

Imported patterns retain their original licenses. See companion `prompt-library` `ATTRIBUTION.md`.

---

## Acknowledgments

Built on the shoulders of:

- [Fabric](https://github.com/danielmiessler/fabric) — Daniel Miessler's folder-per-pattern shape (MIT)
- [promptfoo](https://github.com/promptfoo/promptfoo) — declarative eval harness (MIT)
- [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) — technique taxonomy (MIT)
- [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) (CC0)
- [awesome-claude-prompts](https://github.com/langgptai/awesome-claude-prompts) (MIT)

---

_Elite prompts. Evaluated. Attributed. Red-teamed._
