import { Algorithm, HeuristicEval, IOperator, IState, Node } from "../api/index.js";
import type { IProblem } from "../api/index.js";
import { PriorityQueue } from "../util/priority-queue.js";

export class AStar<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly heuristic: HeuristicEval<S>;
  private readonly pq: PriorityQueue<Node<S>>;
  private readonly frontier: Map<string, Node<S>>;
  private readonly exploredSet: Map<string, Node<S>>;

  constructor(problem: IProblem<S, O>, heuristic: HeuristicEval<S>, verbose: boolean) {
    super(problem, verbose);
    this.name = "A*";
    this.heuristic = heuristic;
    this.pq = new PriorityQueue(this.heuristic.compare);
    this.frontier = new Map();
    this.exploredSet = new Map();

    const root = new Node(this.start);
    this.pq.push(root);
    this.frontier.set(this.start.key(), root);
  }

  override execute(): string {
    const startMs = Date.now();

    while (!this.pq.isEmpty()) {
      const n = this.pq.pop()!;

      this.print(n);

      if (this.isGoal(n)) {
        return this.output(this.path(n), n.weight, startMs);
      }

      const nKey = n.state.key();
      this.frontier.delete(nKey);
      this.exploredSet.set(nKey, n);

      for (const operator of this.problem.expand(n)) {
        const g = operator.apply();
        const gKey = g.key();
        const next = new Node(g, n);

        if (!this.exploredSet.has(gKey) && !this.frontier.has(gKey)) {
          this.pq.push(next);
          this.frontier.set(gKey, next);
        } else if (this.frontier.has(gKey)) {
          const existing = this.frontier.get(gKey)!;
          if (existing.weight > next.weight) {
            this.pq.remove(existing);
            this.frontier.set(gKey, next);
            this.pq.push(next);
          }
        }
      }
    }

    return this.output(this.path(null), -1, startMs);
  }
}
