import {
  Algorithm,
  Node,
  IState,
  IOperator,
  IProblem,
  type SearchEventEmitter,
} from "../api/index.js";

export class BFS<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly frontier: Map<string, Node<S>> = new Map();
  private readonly exploredSet: Map<string, Node<S>> = new Map();
  private readonly queue: Node<S>[] = [];
  private readonly rootKey: number;

  constructor(problem: IProblem<S, O>, verbose: boolean, events?: SearchEventEmitter) {
    super(problem, verbose, events);
    this.name = "BFS";
    const root = new Node(this.start);
    this.frontier.set(this.start.key(), root);
    this.queue.push(root);
    this.rootKey = root.key;
  }

  execute(): string {
    const startMs = Date.now();
    this.emitSearchStart("BFS", this.rootKey, this.problem.serializeState(this.start));

    while (this.queue.length > 0) {
      const curr = this.queue.shift()!;
      this.print(curr);

      const currKey = curr.state.key();
      this.frontier.delete(currKey);
      this.exploredSet.set(currKey, curr);
      this.emit({ type: "nodePoppedFromFrontier", nodeKey: curr.key });
      this.emit({ type: "nodeAddedToExplored", nodeKey: curr.key });

      for (const operator of this.problem.expand(curr)) {
        const g = operator.apply();
        const gKey = g.key();

        if (!this.frontier.has(gKey) && !this.exploredSet.has(gKey)) {
          const next = new Node(g, curr);
          this.emit({
            type: "nodeGenerated",
            node: this.problem.serializeNode(next),
            parentKey: curr.key,
          });
          if (this.isGoal(g)) {
            this.emit({ type: "goalFound", nodeKey: next.key, cost: next.weight });
            return this.output(this.path(next), next.weight, startMs, next.key);
          } else {
            this.frontier.set(gKey, next);
            this.queue.push(next);
            this.emit({ type: "nodePushedToFrontier", nodeKey: next.key });
          }
        }
      }
    }

    return this.output(this.path(null), -1, startMs, null);
  }
}
