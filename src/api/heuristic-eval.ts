import type { IState } from "./i-state.js";
import type { Node } from "./node.js";

export abstract class HeuristicEval<S extends IState> {
  constructor(protected readonly goalState: S) {}

  abstract h(s: S): number;

  f(n: Node<S>): number {
    return n.weight + this.h(n.state);
  }

  readonly compare = (a: Node<S>, b: Node<S>): number => {
    const fa = this.f(a);
    const fb = this.f(b);
    return fa === fb ? a.depth - b.depth : fa - fb;
  };

  getGoalState(): S {
    return this.goalState;
  }
}
