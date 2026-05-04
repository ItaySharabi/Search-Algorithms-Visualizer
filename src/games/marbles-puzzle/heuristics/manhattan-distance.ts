import { HeuristicEval } from "../../../api/index.js";
import { State } from "../model/state.js";
import { EMPTY, costOf } from "../model/marble-color.js";

export class ManhattanDistance extends HeuristicEval<State> {
  private readonly g: string[][];
  private readonly dim: number;

  constructor(goal: State) {
    super(goal);
    this.g = goal.getBoard();
    this.dim = this.g.length;
  }

  h(s: State): number {
    let hVal = 0;
    const nBoard = s.getBoard();
    const placed: boolean[][] = Array.from({ length: this.dim }, (_, i) =>
      Array.from({ length: this.dim }, (__, j) => nBoard[i]![j] === this.g[i]![j])
    );

    let countMisplaced = 0;
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        if (nBoard[i]![j] === EMPTY) continue;
        if (this.g[i]![j] !== nBoard[i]![j]) {
          let dist =
            this.manhattanDist(nBoard[i]![j]!, i, j, placed) *
            costOf(nBoard[i]![j]!);
          countMisplaced++;
          // Punish blocked + misplaced marbles by +1 distance
          if (s.getMarble(i, j) === null) {
            dist++;
          }
          hVal += dist;
        }
      }
    }
    // Add the count of misplaced marbles to the heuristic value
    return hVal + countMisplaced;
  }

  private manhattanDist(key: string, i: number, j: number, placed: boolean[][]): number {
    for (let k = 0; k < this.dim; k++) {
      for (let l = 0; l < this.dim; l++) {
        if (this.g[k]![l] === key) {
          if (placed[k]![l]) continue;
          placed[k]![l] = true;
          return Math.abs(k - i) + Math.abs(l - j);
        }
      }
    }
    return 0;
  }
}
