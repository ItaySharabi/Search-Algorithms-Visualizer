import type { IState } from "./i-state.js";

export interface IOperator<S extends IState> {
  apply(): S;
}
