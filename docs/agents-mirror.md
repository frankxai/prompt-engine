# Agents

Mirror copies of FrankX `.claude/agents/prompt-*.md` live here. Symlink or copy when extracting.

When this repo is extracted from FrankX to `frankxai/prompt-engine`, the extract-script copies the canonical agent definitions from `FrankX/.claude/agents/prompt-*.md` into this directory. After that, this directory is the source of truth for the public repo.

## Manifest — the 13 agents

| File | Agent | Role |
|------|-------|------|
| `prompt-conductor.md` | `@prompt-conductor` | Opus composer; routes every ask to a flow |
| `prompt-claude-specialist.md` | `@prompt-claude-specialist` | Anthropic doctrine: XML tags, prefill, extended thinking |
| `prompt-gpt-specialist.md` | `@prompt-gpt-specialist` | OpenAI/GPT-5 doctrine: developer role, Structured Outputs |
| `prompt-gemini-specialist.md` | `@prompt-gemini-specialist` | Google doctrine: system-at-top, native grounding |
| `prompt-oss-specialist.md` | `@prompt-oss-specialist` | Llama/Mistral/Qwen/DeepSeek: chat templates, special tokens |
| `prompt-architect.md` | `@prompt-architect` | Designs new prompts from blank |
| `prompt-optimizer.md` | `@prompt-optimizer` | Refines existing prompts; wraps `/po` |
| `prompt-evaluator.md` | `@prompt-evaluator` | Wraps promptfoo; colocates `evals/` |
| `prompt-librarian.md` | `@prompt-librarian` | Owns library repo; tags, ranks, schemas |
| `prompt-harvester.md` | `@prompt-harvester` | Bulk-imports Fabric/CC0/MIT sources |
| `prompt-red-team.md` | `@prompt-red-team` | Adversarial probes, jailbreak audit |
| `prompt-psyche-cartographer.md` | `@prompt-psyche-cartographer` | IFS parts mapping, voice modes |
| `prompt-psychometrist.md` | `@prompt-psychometrist` | IPIP-50, PVQ, ECR-R, VIA, Enneagram |

## How to mirror into Claude Code

```bash
# Symlink (dev)
for f in agents/prompt-*.md; do
  ln -s "$(pwd)/$f" ~/.claude/agents/$(basename "$f")
done

# Or copy (production)
cp agents/prompt-*.md ~/.claude/agents/
```

After mirroring, agents are addressable via `@prompt-conductor` etc. in any Claude Code session.

## Anti-patterns

- Never edit these in place during a session. Edit the FrankX canonical, then re-sync.
- Never delete an agent file from a published release — bump version + deprecate.
- Never mix the Cartographer and Psychometrist roles. Hard boundary: Cartographer = maps only, Psychometrist = instruments only.
