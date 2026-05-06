# Search Event Spec

Companion document to `src/api/search-event.ts`. Specifies how the event
contract is used by the algorithms, the worker, and the UI.

## Scope & assumptions

- Audience: backend developer plumbing the emitter into the algorithms (Phase
  2A) and frontend developer consuming the trace (Phase 2B / 3).
- The emitter is injected via the `Algorithm` constructor (Phase 2A); CLI
  passes `NULL_EMITTER` so behavior is byte-identical to today.
- All `nodeKey` values are `Node.key` numbers, monotonic per run, reset to 1
  by `Problem.solve` via `Node.reset()`.

## Hook lines per algorithm

Line numbers refer to files as they are at the start of Phase 2A. Phase 2A
MUST verify these against the actual lines before inserting the
`this.events.emit(...)` calls; correct any drift in this table at that time.
The footnote `(new Node)` means: emit on the same line where `new Node(...)`
is constructed for a child, so the freshly-allocated `Node.key` is captured.
Root `nodeGenerated` is OPTIONAL — the UI gets the root via
`searchStart.rootKey` / `rootState`.

| Event                          | BFS    | DFID         | A*      | IDA*    | DFBnB  |
|--------------------------------|--------|--------------|---------|---------|--------|
| `searchStart`                  | 18     | 51           | 25      | 17      | 20     |
| `iterationStart`               | n/a    | 53           | n/a     | 19      | n/a    |
| `iterationEnd`                 | n/a    | 56           | n/a     | 73      | n/a    |
| `cutoffRaised`                 | n/a    | n/a          | n/a     | 74      | n/a    |
| `nodePoppedFromFrontier`       | 21     | (recursion)  | 28      | 28      | 23     |
| `nodeAddedToExplored`          | 26     | n/a          | 38      | n/a     | n/a    |
| `nodeMarkedForPostprocessing`  | n/a    | n/a          | n/a     | 34      | 29     |
| `successorsOrdered`            | n/a    | n/a          | n/a     | n/a     | 37     |
| `nodeGenerated` (new Node)     | 33     | 33           | 43      | 52      | 34     |
| `nodePushedToFrontier`         | 38     | 24 (wb.set)  | 46      | 68/69   | 75     |
| `nodeRemovedFromFrontier`      | n/a    | n/a          | 51      | 57      | 60     |
| `nodeFrontierImproved`         | n/a    | n/a          | 53      | n/a     | n/a    |
| `nodePruned`                   | n/a    | 31 (wb-skip) | n/a     | 43, 50  | 49, 53, 56 |
| `goalFound`                    | 34     | 19           | 32      | 64      | 63     |
| `bestPathUpdated`              | n/a    | n/a          | n/a     | n/a     | 64     |
| `searchEnd`                    | 35, 44 | 19, 56       | 33, 59  | 65, 77  | 81     |

### Drift correction notes (vs. plan section 2)

- A*: `nodeGenerated` is line **43** (`const next = new Node(g, n)`), not 41.
  The plan footnote says emit on the `new Node(...)` line, and that line is
  43 in the current source.
- IDA*: `nodeGenerated` is line **52** (`const next = new Node<S>(g, n)`),
  not 38. Line 38 is the `operator.apply()` call which has no `Node.key`
  yet.
- DFBnB: `nodeGenerated` is line **34** (the `new Node<S>(operator.apply(),
  n)` inside the `for` loop), not 33. Line 33 is the `for` header.
- `goalFound` for DFBnB is line **63** (the `else if (this.isGoal(child))`
  predicate); `bestPathUpdated` follows on line 64 in the same block.

## Per-algorithm event ordering invariants

The following describe the canonical sequence for one outer iteration of the
main loop. `[*]` denotes "0 or more times".

### BFS

```
searchStart(algo="BFS", rootKey, rootState)
[*] iteration:
      nodePoppedFromFrontier(n)
      nodeAddedToExplored(n)
      [*] for each successor s:
            nodeGenerated(s, parent=n)              // for unseen s only
            if isGoal(s):
              goalFound(s, cost); searchEnd(success=true); STOP
            nodePushedToFrontier(s)                 // for unseen s only
searchEnd(success=false)                            // if queue drained
```

### DFID

DFID is recursive; "frontier" = the current recursion branch (`workingBranch`
map). `nodePushedToFrontier` is emitted when a node is added to the working
branch on entry to `LimitedDFS`, `nodePoppedFromFrontier` is emitted in the
`finally` block on the way out (the recursion-return).

```
searchStart(algo="DFID", rootKey, rootState)
[*] outer iteration i = 1, 2, ...:
      iterationStart(index=i)
      LimitedDFS(curr, depth, workingBranch):
        if isGoal(curr): goalFound(curr); searchEnd(success=true); STOP
        if depth == 0: return "cutoff"
        nodePushedToFrontier(curr)                  // wb.set
        [*] for each successor g:
              if g.key in workingBranch:
                nodePruned(reason="workingBranch")
                continue
              nodeGenerated(next, parent=curr)
              recurse → ...
        nodePoppedFromFrontier(curr)                // wb.delete (finally)
      iterationEnd(index=i, result="cutoff"|"goal"|"fail")
searchEnd(success=false)                            // if loop bound exhausted
```

### A*

```
searchStart(algo="A*", rootKey, rootState)
[*] iteration:
      nodePoppedFromFrontier(n)
      if isGoal(n):
        goalFound(n, cost); searchEnd(success=true); STOP
      nodeAddedToExplored(n)
      [*] for each successor s (next = new Node(s, n)):
            nodeGenerated(next, parent=n)
            if !explored(s) and !frontier(s):
              nodePushedToFrontier(next)
            else if frontier(s) and existing.weight > next.weight:
              nodeRemovedFromFrontier(existing)
              nodeFrontierImproved(nodeKey=next.key,
                                   oldWeight=existing.weight,
                                   newWeight=next.weight)
              nodePushedToFrontier(next)
searchEnd(success=false)                            // if pq empty
```

Note: A* in this implementation does NOT reopen from the explored set — once
in `exploredSet`, a state is never revisited. Hence `nodeFrontierImproved`,
not `nodeReopenedFromExplored`.

### IDA*

```
searchStart(algo="IDA*", rootKey, rootState, threshold=h(start))
[*] outer iteration (numbered by emitter, e.g. 1..K):
      iterationStart(index, threshold=t)
      [*] inner loop (STK is the DFS stack):
            nodePoppedFromFrontier(n)
            if n.isOut():
              // postprocessing visit
              continue                              // implicit: removed from frontier
            else:
              nodeMarkedForPostprocessing(n)        // n.markAsOut(); STK.push(n)
              [*] for each successor s:
                    if h(s) + n.weight > t:
                      nodePruned(reason="threshold", f, threshold=t)
                      continue
                    if existing && existing.isOut():
                      nodePruned(reason="duplicate")
                      continue
                    nodeGenerated(next, parent=n)
                    if existing && !existing.isOut():
                      if f(existing) > f(next):
                        nodeRemovedFromFrontier(existing)
                      else:
                        nodePruned(reason="duplicate")
                        continue
                    if isGoal(next):
                      goalFound(next, cost); searchEnd(success=true); STOP
                    nodePushedToFrontier(next)
      iterationEnd(index, result="cutoff"|"goal")
      cutoffRaised(oldThreshold=t, newThreshold=minF)
searchEnd(success=false)                            // when t == MAX_SAFE_INTEGER
```

### DFBnB

DFBnB uses the same tag-based postprocessing as IDA* (`markAsOut()`) and
reports improving solutions as it finds them.

```
searchStart(algo="DFBnB", rootKey, rootState, upperBound=+inf)
[*] iteration:
      nodePoppedFromFrontier(n)
      if n.isOut():
        continue                                    // implicit removal
      else:
        nodeMarkedForPostprocessing(n)              // n.markAsOut(); STK.push(n)
        [*] generate all children: nodeGenerated(child, parent=n)
        // children are sorted, then filtered:
        successorsOrdered(parentKey=n.key, orderedChildKeys=[...])
        [*] for each child in sorted order:
              if f(child) >= t:
                nodePruned(reason="upperBound", f, threshold=t)
                // and all subsequent children in this batch are also dropped
              else if existing && existing.isOut():
                nodePruned(reason="duplicate")
              else if existing && !existing.isOut():
                if f(existing) <= f(child):
                  nodePruned(reason="duplicate")
                else:
                  nodeRemovedFromFrontier(existing)
              else if isGoal(child):
                goalFound(child, cost)
                bestPathUpdated(child, cost=f(child))
                // t tightens; remaining siblings dropped
        [*] for each kept child (push order = reverse of sort order):
              nodePushedToFrontier(child)
searchEnd(success=(result != null))
```

## Worker protocol

The worker bundle wraps `Problem.solve` with a buffering emitter that
`postMessage`s chunks back to the main thread. Define these types in the
frontend (`web/src/worker/...`); this section is the contract the backend's
emitter must shape its output to fit.

```ts
type ToWorker =
  | { type: "run"; runId: string; algo: AlgoName; inputText: string; chunkSize?: number }
  | { type: "cancel"; runId: string };

type FromWorker =
  | { type: "ready" | "started" | "cancelled"; runId?: string }
  | { type: "trace-chunk"; runId: string; events: SearchEvent[]; seq: number }
  | { type: "trace-complete"; runId: string; finalString: string; totalEvents: number }
  | { type: "error"; runId: string; message: string; stack?: string };
```

Buffering:
- The worker accumulates events and flushes a `trace-chunk` every
  `chunkSize` events (default 5,000).
- The final flush is followed by `trace-complete` carrying `finalString`
  (the same string `Problem.solve` returns to the CLI).
- Cancel = `worker.terminate()` from the main thread; the worker does not
  poll a flag.
- Comparison mode = N workers in parallel, one per algorithm.

## Snapshot shape

Used by the UI's keyframe builder. Defined frontend-side, listed here so
the backend understands what state the UI derives from the emitted events.

```ts
interface SearchSnapshot {
  /** Index into the `events` array this snapshot is computed at. */
  eventIndex: number;
  /** Frontier membership at this point, in algorithm-relevant order. */
  frontierKeys: number[];
  /** The next node the algorithm will pop (peeked via look-ahead). */
  frontierTopKey: number | null;
  /** Explored set membership (BFS / A*); empty for DFID / IDA* / DFBnB. */
  exploredKeys: number[];
  /** Last node popped — the visualizer's "you are here". */
  currentNodeKey: number | null;
  /** Aggregate counters. */
  stats: {
    numGenerated: number;
    numExpanded: number;
    numPruned: number;
    iterationIndex: number | null;
    threshold: number | null;
    upperBound: number | null;
    bestCost: number | null;
  };
}
```

`pathFromRoot` is NOT stored on the snapshot — the UI derives it in
O(depth) by walking `parentKey` in `nodeMap`.

## Invariants the backend MUST preserve

- **`nodeGenerated` precedes everything else for the same `nodeKey`.** No
  `nodePushedToFrontier`, `nodePoppedFromFrontier`, `nodePruned`, or
  `goalFound` may reference a `nodeKey` whose `nodeGenerated` has not
  already been emitted. Exception: the root, which is announced via
  `searchStart.rootKey` / `rootState` instead. Algorithms MAY skip
  `nodeGenerated` for the root.
- **`Node.key` is stable per run.** Captured on the `new Node(...)` line.
  The `searchStart` event MUST emit the root's key in `rootKey`.
- **Counters reset per run.** `Problem.solve` calls `State.reset();
  Node.reset(); Marble.reset();` at the top of every invocation. The
  worker MUST drive the run via `Problem.solve` (not by constructing an
  algorithm directly), or it MUST replicate those three resets verbatim
  before each run. Otherwise `Num:` and `Node.key` numbering leak across
  runs.
- **CLI byte-identical output.** With `NULL_EMITTER` (the default), the
  string returned by `Algorithm.execute()` and the byte content of
  `data/marbles-puzzle/output.txt` MUST match the pre-instrumentation
  baseline exactly, except for the `time:` line. Phase 2A's verification
  gate enforces this.
- **`IOHandler` is unreachable from the worker bundle.** It imports
  `node:fs/promises`, which Vite cannot bundle for the browser. Phase 2A
  introduces `src/games/marbles-puzzle/browser.ts` that re-exports
  everything except `IOHandler`; the worker imports from there. Do not add
  Node-only dependencies to any module the worker transitively imports
  (`Algorithm`, `Problem`, `State`, `Operator`, `Marble`, the heuristics,
  the path formatter, and `PriorityQueue`).
- **Emitter calls are synchronous and side-effect-only.** Algorithms do
  not await `emit`. The emitter must not throw. `NULL_EMITTER` must remain
  a no-op so the JIT can eliminate the call.
- **No class instances in event payloads.** All payloads are plain JSON
  (`structuredClone`-safe). Convert `State` → `SerializedState` and
  `Node` → `SerializedNode` at the emit site.

## Open questions

None at the contract level — Phase 2A may surface incidental questions
(e.g. exact wording of the "implicit removal" of `isOut()` nodes in IDA* /
DFBnB — should it emit `nodeRemovedFromFrontier` to make the UI's life
easier?). Resolve those at implementation time and update this spec.
