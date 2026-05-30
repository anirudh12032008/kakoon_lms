
import {
  IfElseNodeWrapper,
  TextInput,
  NumberInput,
  SelectInput,
  useNodeField,
} from "./BaseNode";

// ─── If-Else ──────────────────────────────────────────────────────────────────
export function IfElseNode() {
  const [left, setLeft] = useNodeField<string>("left", "");
  const [op, setOp] = useNodeField<string>("op", "==");
  const [right, setRight] = useNodeField<number>("right", 0);
  return (
    <IfElseNodeWrapper>
      <div className="flex items-center gap-2">
        <TextInput value={left} onChange={setLeft} style={{ width: "95px" }} />
        <SelectInput
          value={op}
          onChange={setOp}
          style={{ width: "55px" }}
          options={[
            { label: "==", value: "==" },
            { label: "!=", value: "!=" },
            { label: ">", value: ">" },
            { label: "<", value: "<" },
            { label: ">=", value: ">=" },
            { label: "<=", value: "<=" },
          ]}
        />
        <NumberInput value={right} onChange={setRight} style={{ width: "55px" }} />
      </div>
    </IfElseNodeWrapper>
  );
}
