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
# Requires Node 22+
git clone https://github.com/frankxai/prompt-engine.git
cd prompt-engine
pnpm install

# Run a flow
pnpm run hub design "summarize podcasts in my voice"
pnpm run hub optimize "<paste prompt>"
pnpm run hub evaluate prompts/extract_wisdom/

# Run promptfoo evals
pnpm run eval
```

For Claude Code integration, mirror the agents in `agents/` into your `.claude/agents/` directory (see [Composition into Claude Code](#composition-into-claude-code) below).

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

The agents in this repo are designed to mirror into Claude Code's `.claude/agents/` directory. Two ways to wire them up:

**Symlink (recommended for dev)**:
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

Each pattern's `evals/promptfoo.yaml` declares declarative test cases. CI runs `promptfoo eval` on every PR.

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
4. CI runs promptfoo evals + schema validation.
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
