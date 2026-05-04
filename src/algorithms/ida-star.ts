import { Algorithm, HeuristicEval, Node, IState, IOperator, IProblem } from "../api/index.js";

export class IDAStar<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly STK: Node<S>[] = [];
  private readonly frontier: Map<string, Node<S>> = new Map();
  private readonly heuristics: HeuristicEval<S>;
  private t: number;

  constructor(problem: IProblem<S, O>, heuristic: HeuristicEval<S>, verbose: boolean) {
    super(problem, verbose);
    this.name = "IDA*";
    this.heuristics = heuristic;
    this.t = heuristic.h(this.start);
  }

  execute(): string {
    const startMs = Date.now();

    while (this.t !== Number.MAX_SAFE_INTEGER) {
      let minF = Number.MAX_SAFE_INTEGER;

      const curr = new Node<S>(this.start);
      curr.setTag(false);
      this.STK.push(curr);
      this.frontier.set(this.start.key(), curr);

      while (this.STK.length > 0) {
        const n = this.STK.pop()!;
        this.print(n);

        if (n.isOut()) {
          this.frontier.delete(n.state.key());
        } else {
          n.markAsOut();
          this.STK.push(n);

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

            if (existing !== undefined && !existing.isOut()) {
              if (this.heuristics.f(existing) > this.heuristics.f(next)) {
                const idx = this.STK.indexOf(existing);
                if (idx >= 0) this.STK.splice(idx, 1);
                this.frontier.delete(gKey);
              } else {
                continue;
              }
            }

            if (this.isGoal(next)) {
              return this.output(this.path(next), next.weight, startMs);
            }

            this.STK.push(next);
            this.frontier.set(gKey, next);
          }
        }
      }

      this.t = minF;
    }

    return this.output(this.path(null), -1, startMs);
  }
}
