# Architecture — search-algorithms-ts

A Node.js + TypeScript search-algorithms framework with a Marbles Puzzle as
the concrete problem. Printed metrics are `Path / Num / Cost / time`; runtime
output is written to `output.txt`.

## Module Map

```
search-algorithms-ts/
  data/marbles-puzzle/
    inputs/                    input.txt + input1..input7.txt
    output.txt                 written at runtime; gitignored
  src/
    api/                       problem-agnostic search framework
      i-state.ts               IState (with key(): string)
      i-operator.ts            IOperator<S>
      i-path-formatter.ts      IPathFormatter<S>
      i-problem.ts             IProblem<S, O>
      heuristic-eval.ts        abstract HeuristicEval<S> + Comparator
      node.ts                  Node<S> with static counter
      algorithm.ts             abstract Algorithm<S, O>
      index.ts                 barrel
    algorithms/                generic search implementations
      bfs.ts dfid.ts a-star.ts ida-star.ts df-bnb.ts
      index.ts
    util/
      priority-queue.ts        binary min-heap with O(n) remove (no deps)
    games/marbles-puzzle/
      model/
        marble-color.ts marble.ts state.ts operator.ts problem.ts
        marbles-path-formatter.ts
        utils/ direction.ts pair.ts io-handler.ts
      heuristics/
        manhattan-distance.ts misplaced-marbles.ts
      index.ts                 factory + re-exports
    main.ts                    CLI entry: node dist/main.js <input-file>
  package.json tsconfig.json .gitignore
```

File names are `kebab-case.ts`; class names stay `PascalCase`.

## Key Type Signatures

```ts
// src/api/i-state.ts
export interface IState {
  /** Edge cost INTO this state (the cost of the move that produced it). 0 for root. */
  getCost(): number;
  /** Stable string fingerprint used as Map key (JS Maps are reference-keyed). */
  key(): string;
  equals(other: IState): boolean;
  toString(): string;
}

// src/api/i-operator.ts
export interface IOperator<S extends IState> { apply(): S; }

// src/api/i-path-formatter.ts
export interface IPathFormatter<S extends IState> {
  formatPath(goalNode: Node<S> | null): string;
  boardCount(): number;
}

// src/api/i-problem.ts
export interface IProblem<S extends IState, O extends IOperator<S>> {
  getInitialState(): S;
  getGoalState(): S;
  getPathFormatter(): IPathFormatter<S>;
  expand(n: Node<S>): O[];
  solve(algoName: string, verbose: boolean): string;
}

// src/api/node.ts
export class Node<S extends IState> {
  readonly key: number;
  readonly parent: Node<S> | null;
  readonly state: S;
  readonly depth: number;
  readonly weight: number;        // g(n)
  // tag for IDA* / DFBnB "out" marking
  static count(): number;
  static reset(): void;
}

// src/api/heuristic-eval.ts
export abstract class HeuristicEval<S extends IState> {
  abstract h(s: S): number;
  f(n: Node<S>): number;
  // arrow property — passable to PriorityQueue / Array.sort without bind
  compare: (a: Node<S>, b: Node<S>) => number;
}

// src/api/algorithm.ts
export abstract class Algorithm<S extends IState, O extends IOperator<S>> {
  protected name: string;
  abstract execute(): string;
  protected isGoal(x: S | Node<S>): boolean;
  protected path(n: Node<S> | null): string;
  protected output(path: string, cost: number, startMs: number): string;
}
```

## Equality-key Strategy

JS `Map` uses reference equality, so a `Map<IState, Node>` keyed by object
identity will not match across separately-constructed states. Every `IState`
exposes `key(): string` returning a deterministic serialization (for
`MarblesPuzzle.State`: `dim:row0|row1|...` with rows joined by `,`). All
`frontier` / `exploredSet` maps in the algorithms are `Map<string, Node<S>>`
keyed by `state.key()`. `IState.equals(other)` is implemented as
`this.key() === other.key()`.

## Per-run Counter Reset

`Node`, `State`, and `Marble` carry `static` counters with `count()` /
`reset()` methods. **Any code path that runs a search must call
`Node.reset(); State.reset(); Marble.reset();` first.** `Problem.solve` does
this — alternate drivers must do the same.

## Algorithm-name Dispatch

`Problem.solve(algoName, verbose)` matches the algorithm name
case-insensitively against these aliases:

| Input token         | Algorithm class |
|---------------------|-----------------|
| `BFS`               | `BFS`           |
| `DFID`              | `DFID`          |
| `A*` or `AStar`     | `AStar`         |
| `IDA*` or `IDAStar` | `IDAStar`       |
| `DFBnB`             | `DFBnB`         |

For informed search (`AStar`, `IDAStar`, `DFBnB`), `Problem.solve` constructs a
`ManhattanDistance(goal)` heuristic and passes it into the algorithm's
constructor. After construction, `algo.execute()` returns the formatted
solution string (path + `Num:` + `Cost:` + `time:`), which `solve` returns to
the caller.

## CLI

```
npm run build
node dist/main.js data/marbles-puzzle/inputs/input.txt
```

The single positional argument is the path to a marble-puzzle input file.
`output.txt` is written to `data/marbles-puzzle/output.txt` relative to
`process.cwd()`.

## Tooling

- npm + plain `tsc`. No `tsx`, no other dev deps.
- `devDependencies`: `typescript`, `@types/node` only.
- ESM (`"type": "module"`), `module: "NodeNext"` — relative imports MUST end
  in `.js` even when the source is `.ts`.
- No tests. Manual review only.
