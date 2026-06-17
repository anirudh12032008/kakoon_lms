import {
  BaseNode,
  NodeField,
  NumberInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { DisplayIcon } from "./_shared";

const PORT_OPTIONS = [
  { label: "Port 1", value: "1" },
  { label: "Port 2", value: "2" },
  { label: "Port 3", value: "3" },
];

// ─── 7-Seg Display TM1637 ─────────────────────────────────────────────────────
export function SevenSegNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [clk, setClk] = useNodeField<number>("clk", 4);
  const [dio, setDio] = useNodeField<number>("dio", 5);
  const [number, setNumber] = useNodeField<number>("number", 1234);
  const [brightness, setBrightness] = useNodeField<number>("brightness", 5);
  const [colon, setColon] = useNodeField<boolean>("colon", false);
  return (
    <BaseNode title="7-Seg Display TM1637" color={COLORS.red} icon={<DisplayIcon />} width="230px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Number"><NumberInput value={number} onChange={setNumber} /></NodeField>
      <NodeField label="Colon"><ToggleInput value={colon} onChange={setColon} leftLabel="Off" rightLabel="On" /></NodeField>
      <AdvancedSection>
        <NodeField label="CLK Pin"><NumberInput value={clk} onChange={setClk} /></NodeField>
        <NodeField label="DIO Pin"><NumberInput value={dio} onChange={setDio} /></NodeField>
        <NodeField label="Brightness (0–7)"><NumberInput value={brightness} onChange={setBrightness} /></NodeField>
      </AdvancedSection>
    </BaseNode>
  );
}
