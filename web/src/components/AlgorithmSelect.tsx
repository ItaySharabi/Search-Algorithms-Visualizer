import type { AlgoName } from "@algo/api/search-event.js";

const ALGOS: readonly AlgoName[] = ["BFS", "DFID", "A*", "IDA*", "DFBnB"];

interface Props { value: AlgoName; onChange: (a: AlgoName) => void }
export function AlgorithmSelect({ value, onChange }: Props): JSX.Element {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as AlgoName)}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
    >
      {ALGOS.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  );
}
