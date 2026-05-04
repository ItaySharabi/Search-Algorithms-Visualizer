import type { IOperator } from "../../../api/index.js";
import { Node } from "../../../api/index.js";
import { State } from "./state.js";
import { Marble } from "./marble.js";
import { type Direction, DIRECTION_VALUES } from "./utils/direction.js";
import { Pair } from "./utils/pair.js";

export class Operator implements IOperator<State> {
  private readonly n: Node<State>;
  private readonly p: Pair<Marble>;

  private constructor(n: Node<State>, p: Pair<Marble>) {
    this.n = n;
    this.p = p;
  }

  apply(): State {
    return State.fromMove(this.n.state, this.p);
  }

  static allowedOperators(n: Node<State>): Operator[] {
    const allowed: Operator[] = [];
    let badMarble: Marble | null = null;
    let prevDirection: Direction | null = null;
    const s = n.state;

    if (n.parent !== null) {
      badMarble = s.operatedMarble;
      prevDirection = s.operatedMarbleDirection !== null
        ? Operator.opposite(s.operatedMarbleDirection)
        : null;
    }

    const movable = s.getMovableMarbles();
    for (const d of DIRECTION_VALUES) {
      for (const m of movable) {
        if (badMarble !== null && m.equals(badMarble) && prevDirection === d) {
          continue;
        }
        if (s.movableMarble(m, d)) {
          allowed.push(new Operator(n, new Pair(d, m)));
        }
      }
    }
    return allowed;
  }

  static opposite(d: Direction): Direction {
    switch (d) {
      case "UP":    return "DOWN";
      case "DOWN":  return "UP";
      case "LEFT":  return "RIGHT";
      case "RIGHT": return "LEFT";
    }
  }

  toString(): string {
    return `Operator{${this.p}}`;
  }
}
