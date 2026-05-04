import type { IState } from "./i-state.js";

let nodeCounter = 1;

export class Node<S extends IState> {
  readonly key: number;
  readonly parent: Node<S> | null;
  readonly state: S;
  readonly depth: number;
  readonly weight: number;
  private tag = false;

  constructor(state: S, parent: Node<S> | null = null) {
    this.key = nodeCounter++;
    this.state = state;
    this.parent = parent;
    this.weight = (parent?.weight ?? 0) + state.getCost();
    this.depth = (parent?.depth ?? -1) + 1;
  }

  getTag(): boolean { return this.tag; }
  setTag(t: boolean): void { this.tag = t; }
  markAsOut(): void { this.tag = true; }
  isOut(): boolean { return this.tag; }

  toString(): string {
    return `Node #${this.key}\n${this.state}Weight: ${this.weight}\n`;
  }

  static count(): number { return nodeCounter; }
  static reset(): void { nodeCounter = 1; }
}
