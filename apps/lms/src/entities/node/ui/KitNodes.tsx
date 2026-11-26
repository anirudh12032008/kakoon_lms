// Blocks for the common sensor-kit modules (gas, PIR, rain, relay, RFID, RTC, HC-05 ...).
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  makeHandleStyle,
  COLORS,
} from "./BaseNode";
import { SensorIcon, ChipIcon } from "./_shared";
import { useBoard } from "@/entities/board";
import { usePinDefaults, SIMPLE_SENSORS } from "../lib/blockDefaults";

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)", right: -6 };

const Note = ({ children }: { children: string }) => (
  <p className="px-3 pb-2 text-[11px] text-[var(--k-dim)] leading-relaxed">{children}</p>
);

function VarField({ label, field, fallback }: { label: string; field: string; fallback: string }) {
  const [value, setValue] = useNodeField<string>(field, fallback);
  return (
    <NodeField label={label}>
      <TextInput value={value} onChange={setValue} green />
      <Handle type="source" position={Position.Right} id={field} style={outHS} />
    </NodeField>
  );
}

function PinField({ label, field, fallback }: { label: string; field: string; fallback: number }) {
  const [value, setValue] = useNodeField<number>(field, fallback);
  return <NodeField label={label}><NumberInput value={value} onChange={setValue} /></NodeField>;
}

// ─── Gas / rain / water level / LDR / sound / PIR: one pin in, one variable out ─
export function SimpleSensorNode({ type }: NodeProps) {
  const { title, varName, pin: role } = SIMPLE_SENSORS[type];
  const P = usePinDefaults();
  const [mode, setMode] = useNodeField<string>("mode", "digital");
  const [sendToViz, setSendToViz] = useNodeField<boolean>("sendToViz", true);
  const analog = role === "analog" || mode === "analog";
  return (
    <BaseNode title={title} color={COLORS.purple} icon={<SensorIcon />} width="240px">
      {type === "sound_sensor" && (
        <NodeField label="Output">
          <SelectInput value={mode} onChange={setMode} compact
            options={[{ label: "Digital (DO)", value: "digital" }, { label: "Analog (AO)", value: "analog" }]} />
        </NodeField>
      )}
      <PinField label={analog ? "Analog Pin" : "Pin"} field="pin" fallback={analog ? P.analog : P[role]} />
      <NodeField label="Send to Viz">
        <ToggleInput value={sendToViz} onChange={setSendToViz} leftLabel="Off" rightLabel="On" />
      </NodeField>
      <VarField label={analog ? "value" : "0 / 1"} field="varName" fallback={varName} />
    </BaseNode>
  );
}

// ─── LED / Relay: one output pin, on or off ───────────────────────────────────
export function SwitchNode({ type }: NodeProps) {
  const relay = type === "relay";
  const P = usePinDefaults();
  const [state, setState] = useNodeField<boolean>("state", true);
  const [activeLow, setActiveLow] = useNodeField<boolean>("activeLow", false);
  return (
    <BaseNode title={relay ? "Relay" : "LED"} color={relay ? COLORS.orange : COLORS.yellow} icon={<ChipIcon />} width="210px">
      <PinField label="Pin" field="pin" fallback={relay ? P.relay : P.led} />
      <NodeField label="State"><ToggleInput value={state} onChange={setState} leftLabel="Off" rightLabel="On" /></NodeField>
      {relay && (
        <NodeField label="Active low"><ToggleInput value={activeLow} onChange={setActiveLow} leftLabel="No" rightLabel="Yes" /></NodeField>
      )}
    </BaseNode>
  );
}

// ─── RFID reader (MFRC522, SPI) ───────────────────────────────────────────────
export function RFIDReaderNode() {
  const P = usePinDefaults();
  const arduino = useBoard().runtime === "arduino";
  return (
    <BaseNode title="RFID Reader (MFRC522)" color={COLORS.indigo} icon={<SensorIcon />} width="250px">
      <PinField label="SS / SDA" field="ssPin" fallback={P.rfidSs} />
      <PinField label="RST Pin" field="rstPin" fallback={P.rfidRst} />
      <VarField label="Card UID" field="varName" fallback="card_uid" />
      <Note>
        {`Card UID as text like "A1B2C3D4", empty when no card. SCK ${P.sck}, MOSI ${P.mosi}, MISO ${P.miso}, 3.3V only.` +
          (arduino ? "" : " Install the mfrc522 library from the Libraries panel first.")}
      </Note>
    </BaseNode>
  );
}

// ─── Real-time clock (DS3231, I2C) ────────────────────────────────────────────
export function RTCTimeNode() {
  const { i2c } = useBoard();
  return (
    <BaseNode title="Clock (DS3231 RTC)" color={COLORS.cyan} icon={<SensorIcon />} width="240px">
      <VarField label="hour" field="hourVar" fallback="hour" />
      <VarField label="minute" field="minVar" fallback="minute" />
      <VarField label="second" field="secVar" fallback="second" />
      <Note>{`I2C: SDA ${i2c.sda}, SCL ${i2c.scl}. Hours are 0 to 23.`}</Note>
    </BaseNode>
  );
}

// ─── Bluetooth serial (HC-05) ─────────────────────────────────────────────────
export function BluetoothSerialNode() {
  const P = usePinDefaults();
  const arduino = useBoard().runtime === "arduino";
  return (
    <BaseNode title="Bluetooth (HC-05)" color={COLORS.blue} icon={<SensorIcon />} width="250px">
      {arduino && <PinField label="RX Pin" field="rxPin" fallback={P.btRx} />}
      {arduino && <PinField label="TX Pin" field="txPin" fallback={P.btTx} />}
      <VarField label="Last char" field="varName" fallback="bt_data" />
      <Note>
        {arduino
          ? "RX pin goes to HC-05 TXD, TX pin goes to HC-05 RXD. 9600 baud."
          : "HC-05 is for Arduino boards. This board has built-in Bluetooth: use the BLE Mode block."}
      </Note>
    </BaseNode>
  );
}
