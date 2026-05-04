import { Algorithm, HeuristicEval, Node, IState, IOperator, IProblem } from "../api/index.js";

export class DFBnB<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly STK: Node<S>[] = [];
  private readonly frontier: Map<string, Node<S>> = new Map();
  private readonly heuristic: HeuristicEval<S>;

  constructor(problem: IProblem<S, O>, heuristic: HeuristicEval<S>, verbose: boolean) {
    super(problem, verbose);
    this.name = "DFBnB";
    this.heuristic = heuristic;
    const start = new Node<S>(this.start);
    this.STK.push(start);
    this.frontier.set(this.start.key(), start);
  }

  execute(): string {
    let result: string | null = null;
    let t = Number.MAX_SAFE_INTEGER;
    const startMs = Date.now();

    while (this.STK.length > 0) {
      const n = this.STK.pop()!;
      this.print(n);

      if (n.isOut()) {
        this.frontier.delete(n.state.key());
      } else {
        n.markAsOut();
        this.STK.push(n);

        const N: Node<S>[] = [];
        for (const operator of this.problem.expand(n)) {
          N.push(new Node<S>(operator.apply(), n));
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
            N.length = pos;
          } else {
            const existing = this.frontier.get(childKey);
            if (existing !== undefined && existing.isOut()) {
              N.splice(pos, 1);
            } else if (existing !== undefined && !existing.isOut()) {
              if (this.heuristic.f(existing) <= this.heuristic.f(child)) {
                N.splice(pos, 1);
              } else {
                const stkIdx = this.STK.indexOf(existing);
                if (stkIdx >= 0) this.STK.splice(stkIdx, 1);
                this.frontier.delete(childKey);
              }
            } else if (this.isGoal(child)) {
              t = this.heuristic.f(child);
              result = this.output(this.path(child), child.weight, startMs);
              N.length = pos;
            }
          }
        }

        N.sort(this.heuristic.compare);
        N.reverse();

        for (const c of N) {
          this.STK.push(c);
          this.frontier.set(c.state.key(), c);
        }
      }
    }

    return result ?? this.output(this.path(null), -1, startMs);
  }
}
