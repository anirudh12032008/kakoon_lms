import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, ToggleInput,
  useNodeField, useAdvancedMode, COLORS,
} from "./BaseNode";

function BLEIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>
    </svg>
  );
}

const DEFAULT_CMDS = [
  { trigger: "LED_ON",  varName: "", value: "" },
  { trigger: "LED_OFF", varName: "", value: "" },
];

const cmdHandle = {
  width: 12, height: 12,
  background: "var(--k-base-200)",
  border: "2.5px solid #3b82f6",
  borderRadius: "50%",
  position: "relative" as const,
  display: "inline-block",
  zIndex: 10,
  right: -14,
  top: "auto",
  transform: "none",
};

export function BLEModeNode() {
  const [deviceName,  setDeviceName]  = useNodeField<string>("deviceName",  "ESP32-BLE");
  const [serviceUUID, setServiceUUID] = useNodeField<string>("serviceUUID", "6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
  const [rxCharUUID,  setRxCharUUID]  = useNodeField<string>("rxCharUUID",  "6E400002-B5A3-F393-E0A9-E50E24DCCA9E");
  const [txCharUUID,  setTxCharUUID]  = useNodeField<string>("txCharUUID",  "6E400003-B5A3-F393-E0A9-E50E24DCCA9E");
  const [rawVarName,  setRawVarName]  = useNodeField<string>("rawVarName",  "ble_data");
  useNodeField<boolean>("enableCmdMap", true);
  const [cmdMap,      setCmdMap]      = useNodeField<typeof DEFAULT_CMDS>("cmdMap", DEFAULT_CMDS);
  const [txVarName,   setTxVarName]   = useNodeField<string>("txVarName",   "ble_tx");
  const [enableTx,    setEnableTx]    = useNodeField<boolean>("enableTx",   false);
  const [logCmds,     setLogCmds]     = useNodeField<boolean>("logCmds",    false);
  const isAdvanced = useAdvancedMode();

  const addCmd = () => setCmdMap([...cmdMap, { trigger: "", varName: "", value: "" }]);
  const removeCmd = (i: number) => setCmdMap(cmdMap.filter((_, idx) => idx !== i));
  const updateTrigger = (i: number, val: string) =>
    setCmdMap(cmdMap.map((c, idx) => idx === i ? { ...c, trigger: val } : c));

  return (
    <BaseNode title="BLE" color={COLORS.blue} icon={<BLEIcon />} width="260px">

      {/* Device name */}
      <NodeField label="Name"><TextInput value={deviceName} onChange={setDeviceName} wide /></NodeField>

      <div className="mx-3 my-1 border-t border-[var(--k-base-300)]" />

      {/* Raw incoming data variable */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2 bg-[var(--k-base-300)] border border-[var(--k-border)] rounded-lg px-2 py-1.5">
          <span className="text-[9px] text-[var(--k-muted)] shrink-0">phone → </span>
          <input value={rawVarName} onChange={(e) => setRawVarName(e.target.value)}
            className="nodrag flex-1 text-[11px] font-mono bg-transparent text-blue-300 outline-none min-w-0" />
          <Handle type="source" position={Position.Right} id="ble_raw"
            style={{ width: 12, height: 12, background: "var(--k-base-200)", border: "2.5px solid #3b82f6", borderRadius: "50%", position: "relative", display: "inline-block", zIndex: 10, right: -14, top: "auto", transform: "none" }} />
        </div>
      </div>

      <div className="mx-3 my-1 border-t border-[var(--k-base-300)]" />

      {/* Commands */}
      <div className="px-3 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--k-text)]">When phone sends…</span>
          <button onClick={addCmd}
            className="nodrag text-[9px] px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/25 text-blue-400 hover:bg-blue-500/25 transition-all font-semibold">
            + Add
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {cmdMap.map((cmd, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-[var(--k-base-300)] border border-[var(--k-border)] rounded-lg px-2 py-1.5">
              <input
                value={cmd.trigger}
                onChange={(e) => updateTrigger(i, e.target.value)}
                placeholder="command…"
                className="nodrag flex-1 text-[11px] font-mono bg-transparent text-blue-300 outline-none placeholder:text-[var(--k-dim)] min-w-0"
              />
              <button onClick={() => removeCmd(i)}
                className="nodrag text-[var(--k-dim)] hover:text-red-400 text-[11px] shrink-0 leading-none">×</button>
              <Handle type="source" position={Position.Right} id={`cmd_${i}`} style={cmdHandle} />
            </div>
          ))}
          {cmdMap.length === 0 && (
            <div className="text-[9px] text-[var(--k-dim)] text-center py-2">No commands yet</div>
          )}
        </div>

        {/* Log received commands to the serial terminal */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-semibold text-[var(--k-text)]">Log to terminal</span>
          <ToggleInput value={logCmds} onChange={setLogCmds} leftLabel="Off" rightLabel="On" />
        </div>
        {logCmds && (
          <p className="text-[9px] text-[var(--k-dim)] mt-1 leading-relaxed">
            Prints each command to the serial monitor only when one is received.
          </p>
        )}
      </div>

      <div className="mx-3 my-1 border-t border-[var(--k-base-300)]" />

      {/* Send back to phone */}
      <div className="px-3 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[var(--k-text)]">Send to phone</span>
          <ToggleInput value={enableTx} onChange={setEnableTx} leftLabel="Off" rightLabel="On" />
        </div>
        {enableTx && (
          <div className="flex items-center gap-2 mt-1.5">
            <Handle type="target" position={Position.Left} id="ble_tx"
              style={{ width: 12, height: 12, background: "var(--k-base-200)", border: "2.5px solid #22c55e", borderRadius: "50%", position: "relative", display: "inline-block", zIndex: 10, left: -14, top: "auto", transform: "none" }} />
            <input value={txVarName} onChange={(e) => setTxVarName(e.target.value)}
              className="nodrag flex-1 text-[10px] font-mono bg-[var(--k-base-300)] border border-[var(--k-border)] rounded-lg px-2 py-1 text-green-300 outline-none" />
          </div>
        )}
      </div>

      {/* Advanced fields (shown in advanced mode) */}
      {isAdvanced && (
        <div className="px-3 pb-2">
          <div className="mt-1 space-y-0.5">
            <NodeField label="Raw var"><TextInput value={rawVarName} onChange={setRawVarName} wide /></NodeField>
            <NodeField label="Service UUID"><TextInput value={serviceUUID} onChange={setServiceUUID} wide /></NodeField>
            <NodeField label="RX UUID"><TextInput value={rxCharUUID} onChange={setRxCharUUID} wide /></NodeField>
            <NodeField label="TX UUID"><TextInput value={txCharUUID} onChange={setTxCharUUID} wide /></NodeField>
            {/* Status handles */}
            <div className="flex items-center gap-3 pt-1 px-1">
              <Handle type="source" position={Position.Right} id="connected"
                style={{ width: 10, height: 10, background: "var(--k-base-200)", border: "2px solid #22c55e", borderRadius: "50%", position: "relative", display: "inline-block", zIndex: 10, right: -6, top: "auto", transform: "none" }} />
              <span className="text-[8px] text-[var(--k-dim)]">on connect</span>
              <Handle type="source" position={Position.Right} id="disconnected"
                style={{ width: 10, height: 10, background: "var(--k-base-200)", border: "2px solid #ef4444", borderRadius: "50%", position: "relative", display: "inline-block", zIndex: 10, right: -6, top: "auto", transform: "none", marginLeft: 4 }} />
              <span className="text-[8px] text-[var(--k-dim)]">on disconnect</span>
            </div>
          </div>
        </div>
      )}

    </BaseNode>
  );
}
