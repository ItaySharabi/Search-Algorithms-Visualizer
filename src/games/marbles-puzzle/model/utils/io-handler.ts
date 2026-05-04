import { readFile, writeFile } from "node:fs/promises";
import { Problem } from "../problem.js";
import { State } from "../state.js";
import { EMPTY } from "../marble-color.js";

function parseBoard(lines: string[], offset: number, dim: number): readonly (readonly string[])[] {
  const board: string[][] = [];
  let countR = 0, countB = 0, countG = 0, countY = 0;

  for (let i = 0; i < dim; i++) {
    const raw = lines[offset + i];
    if (raw === undefined) {
      throw new Error(`IOHandler: unexpected end of file while reading board row ${i}`);
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
      throw new Error("IOHandler: Wrong GameBoard input");
    }
  } else {
    if (countR > 4 || countB > 4 || countG > 4 || countY > 4) {
      throw new Error("IOHandler: Wrong GameBoard input");
    }
  }

  return board.map(row => row as readonly string[]) as readonly (readonly string[])[];
}

export class IOHandler {
  private readonly algorithmName: string;
  private readonly verbose: boolean;
  private readonly problem: Problem;

  private constructor(algorithmName: string, verbose: boolean, problem: Problem) {
    this.algorithmName = algorithmName;
    this.verbose = verbose;
    this.problem = problem;
  }

  static async load(path: string): Promise<IOHandler> {
    let raw: string;
    try {
      raw = await readFile(path, "utf-8");
    } catch (e) {
      throw new Error(`IOHandler: Input file not found: ${path}`);
    }

    // Normalize line endings and split
    const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    if (lines.length < 1) {
      throw new Error("IOHandler: Empty input file");
    }

    const algorithmName = lines[0]?.trim() ?? "";
    const verboseLine = lines[1]?.trim() ?? "";
    const verbose = verboseLine.toLowerCase() === "with open";

    const sizeLine = lines[2]?.trim() ?? "";
    const dim = sizeLine.toLowerCase() === "big" ? 5 : 3;

    // Lines 3..(3+dim-1) are the initial board
    const initialOffset = 3;
    const initialBoard = parseBoard(lines, initialOffset, dim);

    // Line 3+dim is the separator — discard it
    const separatorOffset = initialOffset + dim;

    // Lines separatorOffset+1..(separatorOffset+dim) are the goal board
    const goalOffset = separatorOffset + 1;
    const goalBoard = parseBoard(lines, goalOffset, dim);

    const initialState = State.fromBoard(initialBoard);
    const goalState = State.fromBoard(goalBoard);
    const problem = new Problem(initialState, goalState);

    return new IOHandler(algorithmName, verbose, problem);
  }

  getAlgorithmName(): string {
    return this.algorithmName;
  }

  getVerbose(): boolean {
    return this.verbose;
  }

  getProblem(): Problem {
    return this.problem;
  }

  async write(content: string, outputPath: string): Promise<void> {
    await writeFile(outputPath, content, "utf-8");
  }
}
