import { IOHandler } from "./games/marbles-puzzle/index.js";

async function main(): Promise<void> {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error("Usage: node dist/main.js <input-file>");
    process.exit(1);
  }

  console.log(`Loading input from: ${inputFile}`);

  const io = await IOHandler.load(inputFile);
  const problem = io.getProblem();
  const algoName = io.getAlgorithmName();
  const verbose = io.getVerbose();

  if (verbose) {
    console.log(`${problem}\n\n ~ Starting \`${algoName}\` search algorithm ~\n=======================================\n`);
  }

  const solution = problem.solve(algoName, verbose);

  if (verbose) {
    console.log(`...finished successfully!\n${solution}`);
  }

  await io.write(solution, "data/marbles-puzzle/output.txt");
}

main().catch(err => { console.error(err); process.exit(1); });
