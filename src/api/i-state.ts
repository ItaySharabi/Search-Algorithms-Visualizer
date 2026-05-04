export interface IState {
  /** Edge cost INTO this state (cost of the move that produced it). 0 for root. */
  getCost(): number;
  /**
   * Stable string fingerprint used as a Map<string, ...> key.
   * Two states with the same key MUST be structurally equal.
   * Required because JS Maps are reference-keyed.
   */
  key(): string;
  /** Structural equality — for goal-checks where we hold IState references. */
  equals(other: IState): boolean;
  toString(): string;
}
