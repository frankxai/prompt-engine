# Quickstart

Get the engine running in 5 minutes.

## 1. Install

```bash
git clone https://github.com/frankxai/prompt-engine.git
cd prompt-engine
pnpm install      # or: npm install
```

Requires Node 22+.

## 2. Mirror agents into Claude Code

The 13 agents live in `agents/`. Mirror them into your Claude Code config:

```bash
# Symlink (recommended for active development)
for f in agents/prompt-*.md; do
  ln -s "$(pwd)/$f" ~/.claude/agents/$(basename "$f")
done

# Or copy (recommended for stable installs)
cp agents/prompt-*.md ~/.claude/agents/
```

Restart your Claude Code session. You should now have `@prompt-conductor`, `@prompt-architect`, etc.

## 3. Run a flow

In Claude Code:

```
@prompt-conductor design a prompt for summarizing podcasts in my voice
```

The Conductor will:
1. Route to `flow-design`.
2. Dispatch `@prompt-architect` to draft.
3. Hand to `@prompt-claude-specialist` for lab tuning.
4. Run `@prompt-red-team` for adversarial probes.
5. Pass to `@prompt-evaluator` for scoring.

Output: a scored, attributed pattern ready to land in `prompt-library`.

## 4. Run promptfoo evals

If you have a pattern checked out (e.g. from `prompt-library`):

```bash
cd prompts/extract_wisdom
npx promptfoo eval --config evals/promptfoo.yaml
```

This pings Claude, GPT, and Gemini providers (you'll need API keys in `.env`) and writes a score card.

## 5. Try the CLI

```bash
pnpm run hub
```

Prints version + the 8 flows. The CLI is a stub for now — the real dispatch lives in Claude Code via the agent team.

## Next steps

- Read [`docs/contributing.md`](./contributing.md) to add a new lab specialist or agent.
- Browse the companion corpus at [`frankxai/prompt-library`](https://github.com/frankxai/prompt-library).
- Read the master design spec (in FrankX): `docs/superpowers/specs/2026-05-13-prompt-hub-design.md`.
