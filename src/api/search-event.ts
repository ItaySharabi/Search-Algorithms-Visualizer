/**
 * Shared event contract for the search-algorithms-ts visualizer.
 *
 * The algorithms (in `src/algorithms/`) emit a stream of `SearchEvent`s through
 * an injected `SearchEventEmitter`. The CLI passes `NULL_EMITTER` (no-op, zero
 * overhead). The web visualizer passes a buffering emitter that posts chunks
 * back to the main thread.
 *
 * Design rules:
 *  - All payloads are plain JSON (no class instances) so events are
 *    `structuredClone`-safe across the worker boundary.
 *  - `SerializedNode` is emitted once per node — only on `nodeGenerated`.
 *    Subsequent events reference the node by `nodeKey` (a number that matches
 *    `Node.key`). The UI keeps a `Map<number, SerializedNode>` for derefs;
 *    this keeps trace size O(generated nodes), not O(events × board).
 *  - This file lives in `src/api/` and MUST stay problem-agnostic. The
 *    `SerializedState.board` shape (a 2D string grid) is currently shaped for
 *    the marbles puzzle but the type itself is generic enough to be reused by
 *    any grid-based problem; the slide-animation hint fields are also opt-in
 *    (nullable).
 */

/** Identifier of one of the five supported search algorithms. */
export type AlgoName = "BFS" | "DFID" | "A*" | "IDA*" | "DFBnB";

/**
 * Plain-JSON board snapshot. Outer array is rows, inner arrays are cells.
 * The cell encoding is problem-specific (for marbles puzzle: marble tag or
 * the `EMPTY` sentinel).
 */
export type SerializedBoard = readonly (readonly string[])[];

/** Cardinal slide direction for animating the most recently moved piece. */
export type SerializedDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

/**
 * JSON-serializable view of a problem state. Mirrors the fields of the
 * marbles-puzzle `State` that the UI needs to render and animate. The
 * `key` MUST equal `state.key()` so the UI can dedup states across events
 * and bridge back to the algorithm's identity model.
 */
export interface SerializedState {
  /** Stable structural fingerprint — equals `state.key()`. */
  readonly key: string;
  /** Board grid for rendering. Shape is problem-specific (see file header). */
  readonly board: SerializedBoard;
  /** Edge cost INTO this state (0 for the root). Equals `state.getCost()`. */
  readonly cost: number;
  /** Tag of the marble moved to produce this state, or `null` for root. */
  readonly operatedMarbleTag: string | null;
  /** Direction of the move that produced this state, or `null` for root. */
  readonly operatedMarbleDirection: SerializedDirection | null;
  /** Destination grid position of the moved marble, or `null` for root. */
  readonly operatedMarblePos: { readonly i: number; readonly j: number } | null;
}

/**
 * JSON-serializable view of a search-tree node. Emitted exactly once per
 * generated node, on `nodeGenerated`. All later events refer to it by
 * `nodeKey`.
 *
 * `h` and `f` are populated only by heuristic algorithms (A*, IDA*, DFBnB);
 * they are absent for BFS / DFID.
 */
export interface SerializedNode {
  /** Stable per-run id — equals `Node.key`. Resets to 1 on `Node.reset()`. */
  readonly key: number;
  /** Parent's `Node.key`, or `null` for the root. */
  readonly parentKey: number | null;
  /** Depth from root (root has depth 0). */
  readonly depth: number;
  /** Accumulated path cost (g) from root to this node. */
  readonly weight: number;
  /** Plain-JSON state payload. */
  readonly state: SerializedState;
  /** Heuristic value h(state). Populated for heuristic algorithms only. */
  readonly h?: number;
  /** Evaluation value f(node) = weight + h. Populated for heuristic algorithms only. */
  readonly f?: number;
}

/**
 * Discriminated union of every event the algorithms can emit during a run.
 * Variants are documented inline; their relative ordering per algorithm is
 * specified in `search-event-spec.md`.
 */
export type SearchEvent =
  /**
   * Fired exactly once at the start of `Algorithm.execute()` (after counters
   * have been reset by `Problem.solve`). `rootKey`/`rootState` allow the UI
   * to seed its node map without waiting for a `nodeGenerated` event for the
   * root. `threshold` is set by IDA* (initial `t = h(start)`); `upperBound`
   * is set by DFBnB (initial `t = +Infinity`, may be encoded as
   * `Number.MAX_SAFE_INTEGER`).
   */
  | {
      readonly type: "searchStart";
      readonly algo: AlgoName;
      readonly rootKey: number;
      readonly rootState: SerializedState;
      readonly threshold?: number;
      readonly upperBound?: number;
    }
  /**
   * Fired exactly once at the end of `Algorithm.execute()`, immediately
   * before `execute` returns its formatted output string. `pathString` is
   * the same string the CLI prints.
   */
  | {
      readonly type: "searchEnd";
      readonly success: boolean;
      readonly goalNodeKey: number | null;
      readonly cost: number;
      readonly numGenerated: number;
      readonly elapsedMs: number;
      readonly pathString: string;
    }
  /**
   * Fired by iterative-deepening algorithms (DFID, IDA*) at the start of
   * each outer iteration. `index` is 1-based for DFID (depth limit) and
   * sequential (1, 2, ...) for IDA*. `threshold` is the current cutoff for
   * IDA*; absent for DFID.
   */
  | {
      readonly type: "iterationStart";
      readonly index: number;
      readonly threshold?: number;
    }
  /** Fired at the end of each outer iteration of DFID / IDA*. */
  | {
      readonly type: "iterationEnd";
      readonly index: number;
      readonly result: "cutoff" | "fail" | "goal";
    }
  /**
   * Fired by IDA* when the f-cutoff `t` is raised between iterations.
   * `oldThreshold` is the just-finished iteration's `t`; `newThreshold` is
   * the smallest f-value pruned during that iteration.
   */
  | {
      readonly type: "cutoffRaised";
      readonly oldThreshold: number;
      readonly newThreshold: number;
    }
  /**
   * First sighting of a node — emitted on the `new Node(...)` line so
   * `Node.key` is captured. Carries the full `SerializedNode` payload.
   * `parentKey` is `null` only for the root (which is also announced via
   * `searchStart.rootKey`; algorithms MAY skip emitting `nodeGenerated` for
   * the root since the UI already has it from `searchStart`).
   */
  | {
      readonly type: "nodeGenerated";
      readonly node: SerializedNode;
      readonly parentKey: number | null;
    }
  /** Node has been added to the algorithm's frontier (queue / pq / stack). */
  | {
      readonly type: "nodePushedToFrontier";
      readonly nodeKey: number;
    }
  /** Node has been removed from the frontier for expansion. */
  | {
      readonly type: "nodePoppedFromFrontier";
      readonly nodeKey: number;
    }
  /**
   * Node has been removed from the frontier WITHOUT being expanded — used
   * by A* when a better duplicate replaces it, and by IDA* / DFBnB when a
   * stale stack entry is dropped in favor of a cheaper one.
   */
  | {
      readonly type: "nodeRemovedFromFrontier";
      readonly nodeKey: number;
    }
  /** Node has been moved from frontier to explored set (BFS / A*). */
  | {
      readonly type: "nodeAddedToExplored";
      readonly nodeKey: number;
    }
  /**
   * A* found a cheaper path to a state already on the frontier and replaced
   * the existing entry. `nodeKey` is the NEW node (the one that won);
   * `oldWeight`/`newWeight` are the loser's and winner's g-values.
   * (Renamed from "nodeReopenedFromExplored" — A* in this implementation
   * does not reopen from the explored set, only from the frontier.)
   */
  | {
      readonly type: "nodeFrontierImproved";
      readonly nodeKey: number;
      readonly oldWeight: number;
      readonly newWeight: number;
    }
  /**
   * IDA* / DFBnB tag-based postprocessing: the node has been re-pushed onto
   * the stack with `markAsOut()` so that on its next pop the algorithm
   * removes it from the frontier instead of expanding it.
   */
  | {
      readonly type: "nodeMarkedForPostprocessing";
      readonly nodeKey: number;
    }
  /**
   * Node was discarded without entering the frontier.
   *  - `threshold`  : f exceeded the IDA* cutoff (`f` and `threshold` set).
   *  - `upperBound` : f >= DFBnB's current best `t` (`f` and `threshold`
   *                   carry f and t respectively).
   *  - `duplicate`  : a same-state node already on the frontier dominates.
   *  - `workingBranch` : DFID — successor's state is on the current
   *                      recursion branch (cycle prevention).
   */
  | {
      readonly type: "nodePruned";
      readonly nodeKey: number;
      readonly reason: "threshold" | "upperBound" | "duplicate" | "workingBranch";
      readonly f?: number;
      readonly threshold?: number;
    }
  /**
   * DFBnB only: after sorting children by the heuristic comparator (and
   * applying duplicate / dominance filtering), this announces the order in
   * which they will be pushed (reverse of pop order). `orderedChildKeys`
   * lists the kept children in pop order (best first).
   */
  | {
      readonly type: "successorsOrdered";
      readonly parentKey: number;
      readonly orderedChildKeys: readonly number[];
    }
  /** Goal predicate matched. Always followed by `searchEnd` for BFS / DFID /
   *  A* / IDA*. For DFBnB, `goalFound` may fire multiple times as better
   *  solutions are discovered; only the last one before `searchEnd` is the
   *  reported optimum. */
  | {
      readonly type: "goalFound";
      readonly nodeKey: number;
      readonly cost: number;
    }
  /**
   * DFBnB only: the upper bound `t` has been tightened to a newly-found
   * goal's cost. `nodeKey` is the goal node, `cost` is the new `t`.
   */
  | {
      readonly type: "bestPathUpdated";
      readonly nodeKey: number;
      readonly cost: number;
    };

/** Convenience union of every event tag. Useful for `switch` exhaustiveness. */
export type SearchEventType = SearchEvent["type"];

/**
 * Sink that receives `SearchEvent`s during a run. Implementations MUST be
 * synchronous and side-effect-only — algorithms call `emit` from inside
 * their main loops and do not await it.
 */
export interface SearchEventEmitter {
  emit(event: SearchEvent): void;
}

/**
 * No-op singleton. Default for the CLI path so instrumented algorithms have
 * zero observable overhead when nobody is listening.
 */
export const NULL_EMITTER: SearchEventEmitter = Object.freeze({
  emit(_event: SearchEvent): void {
    /* no-op */
  },
});
