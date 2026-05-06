// Pure-string mirror of `IOHandler.load` parsing — no `node:fs/promises`.

import { State } from "@algo/games/marbles-puzzle/browser.js";
import { Problem } from "@algo/games/marbles-puzzle/browser.js";

const EMPTY = "_";

function parseBoard(lines: string[], offset: number, dim: number): readonly (readonly string[])[] {
  const board: string[][] = [];
  let countR = 0, countB = 0, countG = 0, countY = 0;

  for (let i = 0; i < dim; i++) {
    const raw = lines[offset + i];
    if (raw === undefined) {
      throw new Error(`parseInputText: unexpected end of input while reading board row ${i}`);
    }
    const cells = raw.split(",");
    const row: string[] = [];

    for (let j = 0; j < dim; j++) {
      const cell = cells[j]?.trim() ?? EMPTY;
      if (cell === "R") { row.push("R"); countR++; }
      else if (cell === "G") { row.push("G"); countG++; }
      else if (cell === "B") { row.push("B"); countB++; }
      else if (dim === 5 && cell === "Y") { row.push("Y"); countY++; }
      else { row.push(EMPTY); }
    }
    board.push(row);
  }

  if (dim === 3) {
    if (countR > 2 || countB > 2 || countG > 2 || countY > 0) {
      throw new Error("parseInputText: Wrong GameBoard input");
    }
  } else {
    if (countR > 4 || countB > 4 || countG > 4 || countY > 4) {
      throw new Error("parseInputText: Wrong GameBoard input");
    }
  }

  return board.map(row => row as readonly string[]) as readonly (readonly string[])[];
}

export interface ParsedInput {
  algorithmName: string;
  verbose: boolean;
  problem: Problem;
}

export function parseInputText(raw: string): ParsedInput {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 1) {
    throw new Error("parseInputText: Empty input");
  }

  const algorithmName = lines[0]?.trim() ?? "";
  const verbose = (lines[1]?.trim() ?? "").toLowerCase() === "with open";
  const dim = (lines[2]?.trim() ?? "").toLowerCase() === "big" ? 5 : 3;

  const initialBoard = parseBoard(lines, 3, dim);
  const goalBoard = parseBoard(lines, 3 + dim + 1, dim);

  const problem = new Problem(State.fromBoard(initialBoard), State.fromBoard(goalBoard));
  return { algorithmName, verbose, problem };
}
