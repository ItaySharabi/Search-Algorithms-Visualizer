import input0 from "../../../data/marbles-puzzle/inputs/input.txt?raw";
import input1 from "../../../data/marbles-puzzle/inputs/input1.txt?raw";
import input2 from "../../../data/marbles-puzzle/inputs/input2.txt?raw";
import input3 from "../../../data/marbles-puzzle/inputs/input3.txt?raw";
import input4 from "../../../data/marbles-puzzle/inputs/input4.txt?raw";
import input5 from "../../../data/marbles-puzzle/inputs/input5.txt?raw";
import input6 from "../../../data/marbles-puzzle/inputs/input6.txt?raw";
import input7 from "../../../data/marbles-puzzle/inputs/input7.txt?raw";

export interface Preset {
  name: string;
  text: string;
}

export const PRESETS: readonly Preset[] = [
  { name: "input.txt", text: input0 },
  { name: "input1.txt", text: input1 },
  { name: "input2.txt", text: input2 },
  { name: "input3.txt", text: input3 },
  { name: "input4.txt", text: input4 },
  { name: "input5.txt", text: input5 },
  { name: "input6.txt", text: input6 },
  { name: "input7.txt", text: input7 },
];
