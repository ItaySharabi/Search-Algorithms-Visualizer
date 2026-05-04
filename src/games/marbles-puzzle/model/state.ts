// Two static factories: State.fromBoard(board) for root, State.fromMove(prev, pair) for child.
import type { IState } from "../../../api/i-state.js";
import { Marble } from "./marble.js";
import { EMPTY } from "./marble-color.js";
import { type Direction, DIRECTION_VALUES } from "./utils/direction.js";
import { Pair } from "./utils/pair.js";

let boardCount = 0;

export class State implements IState {
  private readonly dim: number;
  private readonly board: readonly (readonly string[])[];
  private readonly movableMarbles: readonly Marble[];
  readonly operatedMarble: Marble | null;
  readonly operatedMarbleDirection: Direction | null;

  private constructor(
    board: readonly (readonly string[])[],
    movableMarbles: readonly Marble[],
    operatedMarble: Marble | null,
    operatedMarbleDirection: Direction | null,
  ) {
    boardCount++;
    this.dim = board.length;
    this.board = board;
    this.movableMarbles = movableMarbles;
    this.operatedMarble = operatedMarble;
    this.operatedMarbleDirection = operatedMarbleDirection;
  }

  static fromBoard(board: readonly (readonly string[])[]): State {
    const dim = board.length;
    const frozen = board.map(row => [...row] as readonly string[]) as readonly (readonly string[])[];
    const movable = State.buildMovableMarbles(frozen, dim);
    return new State(frozen, movable, null, null);
  }

  static fromMove(prev: State, pair: Pair<Marble>): State {
    const marble = pair.marble;
    const d = pair.direction;
    const srcI = marble.i;
    const srcJ = marble.j;
    let dstI = srcI;
    let dstJ = srcJ;

    switch (d) {
      case "UP":    dstI -= 1; break;
      case "DOWN":  dstI += 1; break;
      case "LEFT":  dstJ -= 1; break;
      case "RIGHT": dstJ += 1; break;
    }

    const dim = prev.dim;
    const newBoard: string[][] = prev.board.map(row => [...row]);
    newBoard[dstI]![dstJ] = marble.tag;
    newBoard[srcI]![srcJ] = EMPTY;

    const frozen = newBoard.map(row => row as readonly string[]) as readonly (readonly string[])[];
    const movable = State.buildMovableMarbles(frozen, dim);
    const operatedMarble = State.findMarble(movable, dstI, dstJ);
    return new State(frozen, movable, operatedMarble, d);
  }

  private static buildMovableMarbles(board: readonly (readonly string[])[], dim: number): Marble[] {
    const result: Marble[] = [];
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const tag = board[i]![j]!;
        if (tag !== EMPTY && State.isMovableAt(board, dim, i, j)) {
          result.push(new Marble(tag, i, j));
        }
      }
    }
    return result;
  }

  private static isMovableAt(board: readonly (readonly string[])[], dim: number, i: number, j: number): boolean {
    for (const d of DIRECTION_VALUES) {
      if (State.canMove(board, dim, i, j, d)) return true;
    }
    return false;
  }

  private static canMove(board: readonly (readonly string[])[], dim: number, i: number, j: number, d: Direction): boolean {
    if (i < 0 || i >= dim || j < 0 || j >= dim) return false;
    if (board[i]![j] === EMPTY) return false;
    switch (d) {
      case "UP":    return i > 0 && board[i - 1]![j] === EMPTY;
      case "DOWN":  return i < dim - 1 && board[i + 1]![j] === EMPTY;
      case "LEFT":  return j > 0 && board[i]![j - 1] === EMPTY;
      case "RIGHT": return j < dim - 1 && board[i]![j + 1] === EMPTY;
    }
  }

  private static findMarble(marbles: readonly Marble[], i: number, j: number): Marble | null {
    for (const m of marbles) {
      if (m.i === i && m.j === j) return m;
    }
    return null;
  }

  getMarble(i: number, j: number): Marble | null {
    return State.findMarble(this.movableMarbles, i, j);
  }

  getBoard(): string[][] {
    return this.board.map(row => [...row]);
  }

  getMovableMarbles(): readonly Marble[] {
    return this.movableMarbles;
  }

  movableMarbleAt(i: number, j: number, d: Direction): boolean {
    return State.canMove(this.board, this.dim, i, j, d);
  }

  movableMarble(marble: Marble, d: Direction): boolean {
    return this.movableMarbleAt(marble.i, marble.j, d);
  }

  size(): number {
    return this.dim;
  }

  getCost(): number {
    if (this.operatedMarble === null || this.operatedMarbleDirection === null) return 0;
    return this.operatedMarble.getCost();
  }

  key(): string {
    return this.dim + ":" + this.board.map(row => row.join(",")).join("|");
  }

  equals(other: IState): boolean {
    return this.key() === other.key();
  }

  toString(): string {
    const border = this.dim === 3 ? " _______ \n" : " ___________ \n";
    const bottom = this.dim === 3 ? " ------- \n" : " ----------- \n";
    let out = border;
    for (let i = 0; i < this.dim; i++) {
      out += "| ";
      for (let j = 0; j < this.dim; j++) {
        out += this.board[i]![j]! + " ";
      }
      out += "|\n";
    }
    out += bottom;
    return out;
  }

  static getBoardCount(): number {
    return boardCount;
  }

  static reset(): void {
    boardCount = 0;
  }
}
