import { PRESETS } from "@/presets";
interface Props { value: string; onChange: (name: string) => void }
export function PresetSelect({ value, onChange }: Props): JSX.Element {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
    >
      {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
    </select>
  );
}
