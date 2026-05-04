import type { IState } from "./i-state.js";
import type { IOperator } from "./i-operator.js";
import type { IPathFormatter } from "./i-path-formatter.js";
import type { IProblem } from "./i-problem.js";
import { Node } from "./node.js";

export abstract class Algorithm<S extends IState, O extends IOperator<S>> {
  protected name = "~Algorithm~";
  protected readonly start: S;
  protected readonly goal: S;
  protected readonly formatter: IPathFormatter<S>;
  protected readonly verbose: boolean;

  constructor(protected readonly problem: IProblem<S, O>, verbose: boolean) {
    this.verbose = verbose;
    this.start = problem.getInitialState();
    this.goal = problem.getGoalState();
    this.formatter = problem.getPathFormatter();
  }

  abstract execute(): string;

  protected isGoal(x: S | Node<S>): boolean {
    const state = x instanceof Node ? x.state : x;
    return state.equals(this.goal);
  }

  protected path(n: Node<S> | null): string {
    return this.formatter.formatPath(n);
  }

  protected output(path: string, cost: number, startMs: number): string {
    const elapsed = (Date.now() - startMs) / 1000;
    if (!path || path === "no path") {
      return (
        "Path: Path could not be found!" +
        "\nNum: " + this.formatter.boardCount() +
        "\nCost: inf" +
        "\ntime: " + elapsed
      );
    }
    if (this.verbose) {
      console.log("Goal State found:\n" + this.goal);
    }
    return (
      path +
      "\nNum: " + this.formatter.boardCount() +
      "\nCost: " + cost +
      "\ntime: " + elapsed
    );
  }

  protected print(n: Node<S>): void {
    if (this.verbose) {
      console.log(n.toString());
    }
  }
}
