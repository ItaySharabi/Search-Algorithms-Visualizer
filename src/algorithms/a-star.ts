import {
  Algorithm,
  HeuristicEval,
  IOperator,
  IState,
  Node,
  type SearchEventEmitter,
} from "../api/index.js";
import type { IProblem } from "../api/index.js";
import { PriorityQueue } from "../util/priority-queue.js";

export class AStar<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private readonly heuristic: HeuristicEval<S>;
  private readonly pq: PriorityQueue<Node<S>>;
  private readonly frontier: Map<string, Node<S>>;
  private readonly exploredSet: Map<string, Node<S>>;
  private readonly rootKey: number;

  constructor(
    problem: IProblem<S, O>,
    heuristic: HeuristicEval<S>,
    verbose: boolean,
    events?: SearchEventEmitter,
  ) {
    super(problem, verbose, events);
    this.name = "A*";
    this.heuristic = heuristic;
    this.pq = new PriorityQueue(this.heuristic.compare);
    this.frontier = new Map();
    this.exploredSet = new Map();

    const root = new Node(this.start);
    this.pq.push(root);
    this.frontier.set(this.start.key(), root);
    this.rootKey = root.key;
  }

  override execute(): string {
    const startMs = Date.now();
    this.emitSearchStart("A*", this.rootKey, this.problem.serializeState(this.start));

    while (!this.pq.isEmpty()) {
      const n = this.pq.pop()!;
      this.print(n);
      this.emit({ type: "nodePoppedFromFrontier", nodeKey: n.key });

      if (this.isGoal(n)) {
        this.emit({ type: "goalFound", nodeKey: n.key, cost: n.weight });
        return this.output(this.path(n), n.weight, startMs, n.key);
      }

      const nKey = n.state.key();
      this.frontier.delete(nKey);
      this.exploredSet.set(nKey, n);
      this.emit({ type: "nodeAddedToExplored", nodeKey: n.key });

      for (const operator of this.problem.expand(n)) {
        const g = operator.apply();
        const gKey = g.key();
        const next = new Node(g, n);
        this.emit({
          type: "nodeGenerated",
          node: this.problem.serializeNode(next, this.heuristic),
          parentKey: n.key,
        });

        if (!this.exploredSet.has(gKey) && !this.frontier.has(gKey)) {
          this.pq.push(next);
          this.frontier.set(gKey, next);
          this.emit({ type: "nodePushedToFrontier", nodeKey: next.key });
        } else if (this.frontier.has(gKey)) {
          const existing = this.frontier.get(gKey)!;
          if (existing.weight > next.weight) {
            this.pq.remove(existing);
            this.emit({ type: "nodeRemovedFromFrontier", nodeKey: existing.key });
            this.frontier.set(gKey, next);
            this.pq.push(next);
            this.emit({
              type: "nodeFrontierImproved",
              nodeKey: next.key,
              oldWeight: existing.weight,
              newWeight: next.weight,
            });
            this.emit({ type: "nodePushedToFrontier", nodeKey: next.key });
          }
        }
      }
    }

    return this.output(this.path(null), -1, startMs, null);
  }
}
