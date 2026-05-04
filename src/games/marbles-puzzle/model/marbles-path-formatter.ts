import type { IPathFormatter } from "../../../api/i-path-formatter.js";
import type { Node } from "../../../api/node.js";
import { State } from "./state.js";

export class MarblesPathFormatter implements IPathFormatter<State> {
  formatPath(goalNode: Node<State> | null): string {
    if (goalNode === null) return "";
    const raw = this.buildPath(goalNode);
    return raw.startsWith("--") ? raw.substring(2) : raw;
  }

  boardCount(): number {
    return State.getBoardCount();
  }

  private buildPath(n: Node<State> | null): string {
    if (n === null) return "";
    const m = n.state.operatedMarble;
    if (m === null) return "";
    return (
      this.buildPath(n.parent) +
      "--" +
      this.prev(n) +
      m.tag +
      ":(" +
      (m.i + 1) +
      "," +
      (m.j + 1) +
      ")"
    );
  }

  private prev(n: Node<State>): string {
    const d = n.state.operatedMarbleDirection;
    const t = n.state.operatedMarble;
    if (t === null || d === null) return "";

    const i = t.i + 1;
    const j = t.j + 1;

    switch (d) {
      case "UP":    return "(" + (i + 1) + "," + j + "):";
      case "LEFT":  return "(" + i + "," + (j + 1) + "):";
      case "RIGHT": return "(" + i + "," + (j - 1) + "):";
      case "DOWN":  return "(" + (i - 1) + "," + j + "):";
    }
  }
}
