import type { IState } from "./i-state.js";
import type { IOperator } from "./i-operator.js";
import type { IPathFormatter } from "./i-path-formatter.js";
import type { Node } from "./node.js";

export interface IProblem<S extends IState, O extends IOperator<S>> {
  getInitialState(): S;
  getGoalState(): S;
  getPathFormatter(): IPathFormatter<S>;
  expand(n: Node<S>): O[];
  solve(algoName: string, verbose: boolean): string;
}
