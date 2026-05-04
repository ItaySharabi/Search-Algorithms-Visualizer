import { costOf } from "./marble-color.js";

let marbleCount = 0;

export class Marble {
  private readonly cost: number;
  readonly i: number;
  readonly j: number;
  readonly tag: string;

  constructor(tag: string, i: number, j: number) {
    marbleCount++;
    this.i = i;
    this.j = j;
    this.tag = tag;
    this.cost = costOf(tag);
  }

  getI(): number {
    return this.i;
  }

  getJ(): number {
    return this.j;
  }

  getTag(): string {
    return this.tag;
  }

  getCost(): number {
    return this.cost;
  }

  equals(other: Marble): boolean {
    return this.i === other.i && this.j === other.j && this.tag === other.tag;
  }

  toString(): string {
    return `Marble[\`${this.tag}\`,(${this.i},${this.j})]`;
  }

  static getMarbleCount(): number {
    return marbleCount;
  }

  static reset(): void {
    marbleCount = 0;
  }
}
