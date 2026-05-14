# Contributing

PRs welcome. This doc covers adding a new lab specialist agent. For patterns (the corpus), contribute to [`prompt-library`](https://github.com/frankxai/prompt-library) instead.

## Adding a new lab specialist

Use case: a model family not yet covered (e.g., DeepSeek, Cohere Command, Amazon Nova).

### 1. Copy a template

```bash
cp agents/prompt-oss-specialist.md agents/prompt-cohere-specialist.md
```

### 2. Adjust the doctrine

A lab specialist encodes the model family's quirks. For Cohere as example, document:
- System prompt placement convention.
- Tool-use schema.
- Citation / grounding patterns.
- Token / template conventions (if any).
- Anything specific to the family's instruction-tuning that the generic Architect can't know.

### 3. Add a flow variant (if needed)

Most flows pass through `lab-specialist` as a generic slot. If your new lab needs special routing (e.g., always runs after a tool-use lint step), document it in [`flows/`](../flows/README.md) and link from the flow file.

### 4. Add eval coverage

In your PR, include a head-to-head eval comparing your specialist against the closest existing specialist on at least 3 patterns. Use promptfoo.

### 5. Submit PR

Title format: `feat(agents): add @prompt-{lab}-specialist`

Required PR body:
- Lab name + canonical docs URL.
- Quirks the specialist encodes (bullet list).
- Eval comparison (link to result table).
- Test coverage (which patterns).

## Adding a new flow

Use case: a new specialist sequence that doesn't fit the existing 8.

Before submitting, ask:
1. Can this be expressed by chaining existing flows?
2. Does it have a unique success criterion?
3. Does it need a unique publish gate (e.g., Red Team gating)?

If yes to 2+3, propose it. Title format: `feat(flows): add flow-{name}`.

PR must include:
- Trigger phrases.
- Specialist sequence with handoff contract.
- Success criterion.
- Test invocation showing it works end-to-end.

## Adding a new technique tag

Use case: a new prompt-engineering technique gains traction (e.g., a 2026 paper introduces "lattice-of-thoughts").

1. Add to `schema/pattern.schema.json` `techniques` enum.
2. Add to companion `prompt-library/taxonomy/techniques.yaml` with 1-line description + paper link.
3. Tag 2+ existing patterns to demonstrate usage.

## Style

- No AI-slop phrases: never "delve", "dive into", "certainly", "absolutely", "it's worth noting".
- Lower-case verb-prefixed agent file names: `prompt-architect.md`, not `Prompt-Architect.md`.
- Markdown for all agent + flow docs; YAML for schemas.

## Code of Conduct

See `prompt-library/CODE_OF_CONDUCT.md` — same standard applies here.
