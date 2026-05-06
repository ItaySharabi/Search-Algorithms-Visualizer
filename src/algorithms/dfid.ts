import {
  Algorithm,
  Node,
  IState,
  IOperator,
  IProblem,
  type SearchEventEmitter,
} from "../api/index.js";

export class DFID<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private startMs = 0;

  constructor(problem: IProblem<S, O>, verbose: boolean, events?: SearchEventEmitter) {
    super(problem, verbose, events);
    this.name = "DFID";
  }

  private LimitedDFS(
    curr: Node<S>,
    depth: number,
    workingBranch: Map<string, Node<S>>,
  ): string {
    this.print(curr);

    if (this.isGoal(curr)) {
      this.emit({ type: "goalFound", nodeKey: curr.key, cost: curr.weight });
      return this.output(this.path(curr), curr.weight, this.startMs, curr.key);
    } else if (depth === 0) {
      return "cutoff";
    }

    workingBranch.set(curr.state.key(), curr);
    this.emit({ type: "nodePushedToFrontier", nodeKey: curr.key });
    try {
      let isCutoff = false;

      for (const operator of this.problem.expand(curr)) {
        const g = operator.apply();
        if (workingBranch.has(g.key())) {
          continue;
        }
        const next = new Node(g, curr);
        this.emit({
          type: "nodeGenerated",
          node: this.problem.serializeNode(next),
          parentKey: curr.key,
        });
        const result = this.LimitedDFS(next, depth - 1, workingBranch);

        if (result === "cutoff") {
          isCutoff = true;
        } else if (result !== "fail") {
          return result;
        }
      }

      return isCutoff ? "cutoff" : "fail";
    } finally {
      workingBranch.delete(curr.state.key());
      this.emit({ type: "nodePoppedFromFrontier", nodeKey: curr.key });
    }
  }

  execute(): string {
    const root = new Node(this.start);
    this.startMs = Date.now();
    this.emitSearchStart("DFID", root.key, this.problem.serializeState(this.start));

    for (let i = 1; i < Number.MAX_SAFE_INTEGER; ++i) {
      this.emit({ type: "iterationStart", index: i });
      const H = new Map<string, Node<S>>();
      const output = this.LimitedDFS(root, i, H);
      if (output !== "cutoff") {
        this.emit({
          type: "iterationEnd",
          index: i,
          result: output === "fail" ? "fail" : "goal",
        });
        return output;
      }
      this.emit({ type: "iterationEnd", index: i, result: "cutoff" });
    }

    return "no path";
  }
}
