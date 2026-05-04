# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@.claude/agentic-workflow.md

## Commands

```
npm run build          # tsc → dist/
npm run typecheck      # tsc --noEmit
npm start              # node dist/main.js  (needs input arg, see below)

# Run a search end-to-end:
node dist/main.js data/marbles-puzzle/inputs/input.txt
```

There is no test runner, no linter, and no `tsx`/watch tooling. Verification is `npm run typecheck` plus manual runs against files in `data/marbles-puzzle/inputs/`. Output is written to `data/marbles-puzzle/output.txt` (gitignored) relative to `process.cwd()`.

Node ≥ 24 is required (`package.json` engines).

## What this project is

A Node.js + TypeScript search-algorithms framework with a Marbles Puzzle as the concrete problem. Printed metrics are `Path / Num / Cost / time`; output is written to `data/marbles-puzzle/output.txt`.

## Architecture (read `ARCHITECTURE.md` for the full version)

Three layers, each in its own folder under `src/`:

- `src/api/` — problem-agnostic search framework: `IState`, `IOperator`, `IProblem`, `Node`, `HeuristicEval`, `Algorithm`. Generic over `<S extends IState, O extends IOperator<S>>`.
- `src/algorithms/` — generic implementations: `BFS`, `DFID`, `AStar`, `IDAStar`, `DFBnB`. They consume only the `api` layer.
- `src/games/marbles-puzzle/` — the concrete problem (`State`, `Operator`, `Problem`, heuristics, `IOHandler`, path formatter). `Problem.solve(algoName, verbose)` is the dispatch point.

`src/util/priority-queue.ts` is a hand-rolled binary min-heap with O(n) remove (no deps).

### Two non-obvious invariants

**1. Equality via `key(): string`.** JS `Map` uses reference equality, so a `Map<IState, Node>` keyed by object identity will not match across separately-constructed states. Every `IState` must expose a deterministic `key(): string`, and every `frontier`/`exploredSet` is `Map<string, Node<S>>` keyed by `state.key()`. `IState.equals(other)` is implemented as `this.key() === other.key()`. When introducing a new state type, the `key()` must uniquely encode every field that affects equality.

**2. Per-run counter reset.** `Node`, `State`, and `Marble` all carry `static` counters. `Problem.solve` resets them at the top of every run via `Node.reset(); State.reset(); Marble.reset();`. **Any alternate driver that runs a search must do the same** — otherwise counters leak between runs and `Num:` output is wrong.

### Algorithm-name dispatch

`Problem.solve` matches `algoName` case-insensitively against these aliases:

| Input token         | Class     |
|---------------------|-----------|
| `BFS`               | `BFS`     |
| `DFID`              | `DFID`    |
| `A*` or `AStar`     | `AStar`   |
| `IDA*` or `IDAStar` | `IDAStar` |
| `DFBnB`             | `DFBnB`   |

For informed search (`AStar`/`IDAStar`/`DFBnB`), `Problem.solve` constructs a `ManhattanDistance(goal)` heuristic and injects it into the algorithm constructor.

## Module / TS conventions

- ESM (`"type": "module"`), `module: "NodeNext"`. **Relative imports MUST end in `.js`** even though the source files are `.ts` (e.g. `import { Node } from "./node.js";`). This applies inside `src/` too — the extension is the runtime path, not the source path.
- File names are `kebab-case.ts`; class names stay `PascalCase`.
- `tsconfig.json` enables `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Index access yields `T | undefined` — narrow it; don't `!`-assert away the check unless the invariant is genuinely enforced upstream.
- `HeuristicEval.compare` is an arrow **property** (not a method), so it can be passed to `PriorityQueue` / `Array.sort` without `.bind`. Preserve that shape when adding heuristics.
