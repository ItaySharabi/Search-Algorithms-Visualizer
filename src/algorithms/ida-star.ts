import {
  Algorithm,
  HeuristicEval,
  Node,
  IState,
  IOperator,
  IProblem,
  type SearchEventEmitter,
} from "../api/index.js";

export class IDAStar<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly STK: Node<S>[] = [];
  private readonly frontier: Map<string, Node<S>> = new Map();
  private readonly heuristics: HeuristicEval<S>;
  private t: number;

  constructor(
    problem: IProblem<S, O>,
    heuristic: HeuristicEval<S>,
    verbose: boolean,
    events?: SearchEventEmitter,
  ) {
    super(problem, verbose, events);
    this.name = "IDA*";
    this.heuristics = heuristic;
    this.t = heuristic.h(this.start);
  }

  execute(): string {
    const startMs = Date.now();
    let firstIter = true;
    let iterIndex = 0;

    while (this.t !== Number.MAX_SAFE_INTEGER) {
      iterIndex++;
      let minF = Number.MAX_SAFE_INTEGER;

      const curr = new Node<S>(this.start);
      curr.setTag(false);

      if (firstIter) {
        this.emitSearchStart(
          "IDA*",
          curr.key,
          this.problem.serializeState(this.start),
          { threshold: this.t },
        );
        firstIter = false;
      } else {
        this.emit({
          type: "nodeGenerated",
          node: this.problem.serializeNode(curr, this.heuristics),
          parentKey: null,
        });
      }
      this.emit({ type: "iterationStart", index: iterIndex, threshold: this.t });

      this.STK.push(curr);
      this.frontier.set(this.start.key(), curr);
      this.emit({ type: "nodePushedToFrontier", nodeKey: curr.key });

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

          for (const operator of this.problem.expand(n)) {
            const g = operator.apply();
            const gKey = g.key();
            const _f = this.heuristics.h(g) + n.weight;

            if (_f > this.t) {
              minF = Math.min(minF, _f);
              continue;
            }

            const existing = this.frontier.get(gKey);
            if (existing !== undefined && existing.isOut()) {
              continue;
            }

            const next = new Node<S>(g, n);
            this.emit({
              type: "nodeGenerated",
              node: this.problem.serializeNode(next, this.heuristics),
              parentKey: n.key,
            });

            if (existing !== undefined && !existing.isOut()) {
              if (this.heuristics.f(existing) > this.heuristics.f(next)) {
                const idx = this.STK.indexOf(existing);
                if (idx >= 0) this.STK.splice(idx, 1);
                this.frontier.delete(gKey);
                this.emit({ type: "nodeRemovedFromFrontier", nodeKey: existing.key });
              } else {
                this.emit({ type: "nodePruned", nodeKey: next.key, reason: "duplicate" });
                continue;
              }
            }

            if (this.isGoal(next)) {
              this.emit({ type: "goalFound", nodeKey: next.key, cost: next.weight });
              this.emit({ type: "iterationEnd", index: iterIndex, result: "goal" });
              return this.output(this.path(next), next.weight, startMs, next.key);
            }

            this.STK.push(next);
            this.frontier.set(gKey, next);
            this.emit({ type: "nodePushedToFrontier", nodeKey: next.key });
          }
        }
      }

      this.emit({ type: "iterationEnd", index: iterIndex, result: "cutoff" });
      const oldT = this.t;
      this.t = minF;
      if (this.t !== Number.MAX_SAFE_INTEGER) {
        this.emit({ type: "cutoffRaised", oldThreshold: oldT, newThreshold: this.t });
      }
    }

    return this.output(this.path(null), -1, startMs, null);
  }
}
