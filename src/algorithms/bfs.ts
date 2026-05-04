import { Algorithm, Node, IState, IOperator, IProblem } from "../api/index.js";

export class BFS<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly frontier: Map<string, Node<S>> = new Map();
  private readonly exploredSet: Map<string, Node<S>> = new Map();
  // O(n) shift is acceptable for puzzle sizes used here.
  private readonly queue: Node<S>[] = [];

  constructor(problem: IProblem<S, O>, verbose: boolean) {
    super(problem, verbose);
    this.name = "BFS";
    const root = new Node(this.start);
    this.frontier.set(this.start.key(), root);
    this.queue.push(root);
  }

  execute(): string {
    const startMs = Date.now();

    while (this.queue.length > 0) {
      const curr = this.queue.shift()!;
      this.print(curr);

      const currKey = curr.state.key();
      this.frontier.delete(currKey);
      this.exploredSet.set(currKey, curr);

      for (const operator of this.problem.expand(curr)) {
        const g = operator.apply();
        const gKey = g.key();

        if (!this.frontier.has(gKey) && !this.exploredSet.has(gKey)) {
          const next = new Node(g, curr);
          if (this.isGoal(g)) {
            return this.output(this.path(next), next.weight, startMs);
          } else {
            this.frontier.set(gKey, next);
            this.queue.push(next);
          }
        }
      }
    }

    return this.output(this.path(null), -1, startMs);
  }
}
