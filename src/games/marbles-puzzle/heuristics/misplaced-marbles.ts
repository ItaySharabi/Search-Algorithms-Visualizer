import { HeuristicEval } from "../../../api/index.js";
import { State } from "../model/state.js";
import { costOf } from "../model/marble-color.js";

export class MisplacedMarbles extends HeuristicEval<State> {
  private readonly board: string[][];
  private readonly dim: number;

  constructor(goal: State) {
    super(goal);
    this.board = goal.getBoard();
    this.dim = this.board.length;
  }

  h(s: State): number {
    if (s.equals(this.goalState)) return 0;
    let hVal = 0;
    const b = s.getBoard();
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        if (this.board[i]![j] !== b[i]![j]) {
          hVal += costOf(b[i]![j]!);
        }
      }
    }
    return hVal;
  }
}
