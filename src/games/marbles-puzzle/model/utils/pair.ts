import type { Direction } from "./direction.js";

export class Pair<M> {
  constructor(
    readonly direction: Direction,
    readonly marble: M,
  ) {}

  toString(): string {
    return `[${String(this.marble)}, ${this.direction}]`;
  }
}
