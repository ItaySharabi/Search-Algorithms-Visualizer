import type { IState } from "./i-state.js";
import type { Node } from "./node.js";

export interface IPathFormatter<S extends IState> {
  /**
   * @param goalNode the leaf node that satisfies the goal predicate.
   * @returns a human-readable path string, or empty when goalNode is null.
   */
  formatPath(goalNode: Node<S> | null): string;

  /** @returns the number of states/boards generated during the current run. */
  boardCount(): number;
}
