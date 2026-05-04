# Agentic workflow

How the main Claude session and the sub-agent team work together in this project.

## Sub-agent team

The team lives in `.claude/agents/`:

- `tech-lead` (opus) — produces phased delegation plans with explicit `depends on: Phase X` markers and **no pre-written prompts**. The main session writes each spawned agent's prompt itself.
- `architect` (opus) — designs APIs, type contracts, and module boundaries. Output is a spec other agents consume.
- `frontend-developer` (sonnet) — React + TypeScript implementation against a contract.
- `backend-developer` (sonnet) — Node.js + TypeScript implementation against a contract.
- `product-manager` (sonnet) — project-specific (search-algorithms-ts). Read-only research and recommendations.
- `code-review` (sonnet) — read-only review of diffs/files for bugs, smells, anti-patterns, tight coupling.

**Only the main Claude session spawns sub-agents.** None of the agents have the `Agent` / `Task` tool — they cannot dispatch each other. This keeps coordination centralized.

## Escalation pattern from sub-agents

Sub-agents are instructed to **refuse to guess**. When they hit an ambiguity, a missing contract, or a decision they shouldn't make alone, they return a `## Blocker` or `## Question` block as the **first** section of their response:

```
## Blocker   (or ## Question)
<what needs to be decided>

**Why this blocks me:** <context>

**Options:**
- A) <option> — <implication>
- B) <option> — <implication>

**My recommendation:** <A or B, only if they have a clear lean>
```

When the main session receives a response with this block:

1. **Read it first** — it's positioned at the top precisely so it's not missed.
2. **Resolve only what is unambiguously already in the conversation** (e.g., the user previously stated their preference). Do not infer from silence.
3. **Otherwise, relay the question to the user via the `AskUserQuestion` tool.** Use the agent's options as the option list when applicable. Do not answer on the user's behalf.
4. **Re-dispatch** the sub-agent with the resolved answer included in the prompt, plus any partial work it already produced so it doesn't redo it.

## Always resolve ambiguities via AskUserQuestion

Whenever a request has a real ambiguity that affects the outcome — choice of approach, scope boundary, naming, breaking-change tolerance, framework/library choice, where artifacts live — **the main session must use the `AskUserQuestion` tool to surface it before acting.** Do not guess and do not bury assumptions in the response. This applies whether dispatching a sub-agent, writing code directly, or planning. Batch related questions into a single `AskUserQuestion` call (1–4 questions) rather than asking serially.
