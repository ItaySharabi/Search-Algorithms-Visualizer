import type { IState } from "./i-state.js";
import type { IOperator } from "./i-operator.js";
import type { IPathFormatter } from "./i-path-formatter.js";
import type { Node } from "./node.js";
import type { HeuristicEval } from "./heuristic-eval.js";
import type { SerializedNode, SerializedState, SearchEventEmitter } from "./search-event.js";

export interface IProblem<S extends IState, O extends IOperator<S>> {
  getInitialState(): S;
  getGoalState(): S;
  getPathFormatter(): IPathFormatter<S>;
  expand(n: Node<S>): O[];
  solve(algoName: string, verbose: boolean, events?: SearchEventEmitter): string;

  /** Convert a state to its plain-JSON event-payload form. Problem-specific. */
  serializeState(s: S): SerializedState;
  /** Convert a node to its plain-JSON event-payload form. Problem-specific. */
  serializeNode(n: Node<S>, h?: HeuristicEval<S>): SerializedNode;
}
