import { Algorithm, Node, IState, IOperator, IProblem } from "../api/index.js";

export class DFID<S extends IState, O extends IOperator<S>> extends Algorithm<S, O> {
  private startMs = 0;

  constructor(problem: IProblem<S, O>, verbose: boolean) {
    super(problem, verbose);
    this.name = "DFID";
  }

  private LimitedDFS(
    curr: Node<S>,
    depth: number,
    workingBranch: Map<string, Node<S>>,
  ): string {
    this.print(curr);

    if (this.isGoal(curr)) {
      return this.output(this.path(curr), curr.weight, this.startMs);
    } else if (depth === 0) {
      return "cutoff";
    }

    workingBranch.set(curr.state.key(), curr);
    try {
      let isCutoff = false;

      for (const operator of this.problem.expand(curr)) {
        const g = operator.apply();
        if (workingBranch.has(g.key())) {
          continue;
        }
        const next = new Node(g, curr);
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
    }
  }

  execute(): string {
    const root = new Node(this.start);
    this.startMs = Date.now();

    for (let i = 1; i < Number.MAX_SAFE_INTEGER; ++i) {
      const H = new Map<string, Node<S>>();
      const output = this.LimitedDFS(root, i, H);
      if (output !== "cutoff") {
        return output;
      }
    }

    return "no path";
  }
}
