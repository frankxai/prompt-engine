# Flows

The 8 canonical flows. Each flow is a fixed specialist sequence with a documented success criterion. The Conductor maps every request to one of these.

## flow-design

**Trigger**: "design a prompt for X", "build me a system prompt for Y"
**Sequence**: `@prompt-architect` -> `@prompt-{lab}-specialist` -> `@prompt-red-team` -> `@prompt-evaluator`
**Success**: Prompt produces target output >= 4/5 on 5 example inputs.
**Publish gate**: Red Team verdict = pass.

## flow-optimize

**Trigger**: "optimize this prompt", "make this prompt better", `/po`
**Sequence**: `@prompt-optimizer` -> `@prompt-{lab}-specialist` -> `@prompt-evaluator`
**Success**: Optimized version beats original on declared metric (eval score delta > 0).

## flow-evaluate

**Trigger**: "evaluate my prompt", "test this system prompt"
**Sequence**: `@prompt-evaluator` -> `@prompt-red-team`
**Success**: Score card written to `evals/` + adversarial findings appended.

## flow-harvest

**Trigger**: "import from Fabric", "harvest awesome-claude-prompts", "ingest these prompts"
**Sequence**: `@prompt-harvester` -> `@prompt-red-team` -> `@prompt-librarian`
**Success**: New patterns landed in library with provenance + license + eval score.
**Publish gate**: Red Team verdict = pass for every imported pattern.

## flow-curate

**Trigger**: "rebuild the library category tree", "rerank prompts in X category"
**Sequence**: `@prompt-librarian` -> `@prompt-optimizer` -> `@prompt-evaluator`
**Success**: Library invariants pass; new ranking has documented rationale.

## flow-introspect

**Trigger**: "IFS session", "what part of me wants X", "journal with me"
**Sequence**: `@prompt-psyche-cartographer` (solo)
**Success**: One question or one mirror — never an answer.
**Boundary**: Maps only. No advice. No diagnosis. Crisis routing on triggers.

## flow-profile

**Trigger**: "give me a values map", "profile me on Big Five", "what's my attachment style"
**Sequence**: `@prompt-psychometrist` -> `@prompt-psyche-cartographer`
**Success**: Profile output framed as lens, with caveat "This is a lens through which one researcher saw patterns in many people. It is not who you are."

## flow-knowledge-base

**Trigger**: "build a knowledge-base ingestion prompt set", "design prompts for RAG of X"
**Sequence**: `@prompt-architect` -> `@prompt-librarian` -> `@prompt-evaluator`
**Success**: Ingestion + retrieval prompt pair tested against sample docs.

---

## Invariants

- **Red Team gates every publish flow** (flow-design, flow-harvest). This is load-bearing.
- **flow-introspect never multi-agents.** Cartographer solo, by design.
- **flow-profile always pairs psychometrist with cartographer.** Raw instrument output without IFS framing is harmful.
