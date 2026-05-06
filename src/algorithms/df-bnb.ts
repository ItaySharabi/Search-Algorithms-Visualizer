import {
  Algorithm,
  HeuristicEval,
  Node,
  IState,
  IOperator,
  IProblem,
  type SearchEventEmitter,
} from "../api/index.js";

export class DFBnB<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly STK: Node<S>[] = [];
  private readonly frontier: Map<string, Node<S>> = new Map();
  private readonly heuristic: HeuristicEval<S>;
  private readonly rootKey: number;

  constructor(
    problem: IProblem<S, O>,
    heuristic: HeuristicEval<S>,
    verbose: boolean,
    events?: SearchEventEmitter,
  ) {
    super(problem, verbose, events);
    this.name = "DFBnB";
    this.heuristic = heuristic;
    const start = new Node<S>(this.start);
    this.STK.push(start);
    this.frontier.set(this.start.key(), start);
    this.rootKey = start.key;
  }

  execute(): string {
    let result: string | null = null;
    let goalKey: number | null = null;
    let t = Number.MAX_SAFE_INTEGER;
    const startMs = Date.now();
    this.emitSearchStart(
      "DFBnB",
      this.rootKey,
      this.problem.serializeState(this.start),
      { upperBound: t },
    );
    this.emit({ type: "nodePushedToFrontier", nodeKey: this.rootKey });

    while (this.STK.length > 0) {
      const n = this.STK.pop()!;
      this.print(n);
      this.emit({ type: "nodePoppedFromFrontier", nodeKey: n.key });

      if (n.isOut()) {
        this.frontier.delete(n.state.key());
        this.emit({ type: "nodeRemovedFromFrontier", nodeKey: n.key });
      } else {
        n.markAsOut();
        this.STK.push(n);
        this.emit({ type: "nodeMarkedForPostprocessing", nodeKey: n.key });

        const N: Node<S>[] = [];
        for (const operator of this.problem.expand(n)) {
          const child = new Node<S>(operator.apply(), n);
          this.emit({
            type: "nodeGenerated",
            node: this.problem.serializeNode(child, this.heuristic),
            parentKey: n.key,
          });
          N.push(child);
        }

        N.sort(this.heuristic.compare);
        const cpyN = N.slice();

        for (let idx = 0; idx < cpyN.length; idx++) {
          const child = cpyN[idx]!;
          const childKey = child.state.key();
          const pos = N.indexOf(child);

          if (pos < 0) {
            continue;
          }

          if (this.heuristic.f(child) >= t) {
            for (let k = pos; k < N.length; k++) {
              this.emit({
                type: "nodePruned",
                nodeKey: N[k]!.key,
                reason: "upperBound",
                f: this.heuristic.f(N[k]!),
                threshold: t,
              });
            }
            N.length = pos;
          } else {
            const existing = this.frontier.get(childKey);
            if (existing !== undefined && existing.isOut()) {
              this.emit({ type: "nodePruned", nodeKey: child.key, reason: "duplicate" });
              N.splice(pos, 1);
            } else if (existing !== undefined && !existing.isOut()) {
              if (this.heuristic.f(existing) <= this.heuristic.f(child)) {
                this.emit({ type: "nodePruned", nodeKey: child.key, reason: "duplicate" });
                N.splice(pos, 1);
              } else {
                const stkIdx = this.STK.indexOf(existing);
                if (stkIdx >= 0) this.STK.splice(stkIdx, 1);
                this.frontier.delete(childKey);
                this.emit({ type: "nodeRemovedFromFrontier", nodeKey: existing.key });
              }
            } else if (this.isGoal(child)) {
              t = this.heuristic.f(child);
              goalKey = child.key;
              this.emit({ type: "goalFound", nodeKey: child.key, cost: child.weight });
              this.emit({ type: "bestPathUpdated", nodeKey: child.key, cost: child.weight });
              result = this.output(this.path(child), child.weight, startMs, child.key);
              for (let k = pos + 1; k < N.length; k++) {
                this.emit({
                  type: "nodePruned",
                  nodeKey: N[k]!.key,
                  reason: "upperBound",
                  f: this.heuristic.f(N[k]!),
                  threshold: t,
                });
              }
              N.length = pos;
            }
          }
        }

        N.sort(this.heuristic.compare);
        N.reverse();

        this.emit({
          type: "successorsOrdered",
          parentKey: n.key,
          orderedChildKeys: [...N].reverse().map(c => c.key),
        });

        for (const c of N) {
          this.STK.push(c);
          this.frontier.set(c.state.key(), c);
          this.emit({ type: "nodePushedToFrontier", nodeKey: c.key });
        }
      }
    }

    return result ?? this.output(this.path(null), -1, startMs, goalKey);
  }
}
