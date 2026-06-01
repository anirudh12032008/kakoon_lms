import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, NumberInput, ToggleInput,
  useNodeField, COLORS,
} from "./BaseNode";

const outHS = (color = "#22c55e") => ({
  width: 12, height: 12, background: "#111113",
  border: `2.5px solid ${color}`, borderRadius: "50%", zIndex: 10,
});

function CommsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  );
}

// ─── BLE Mode ─────────────────────────────────────────────────────────────────
const BLE_CMDS_DEFAULT = [
  { trigger: "LED_ON", action: "led_state", value: "1" },
  { trigger: "LED_OFF", action: "led_state", value: "0" },
];

export function BLEModeNode() {
  const [deviceName, setDeviceName] = useNodeField<string>("deviceName", "ESP32-BLE");
  const [serviceUUID, setServiceUUID] = useNodeField<string>("serviceUUID", "6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
  const [charUUID, setCharUUID] = useNodeField<string>("charUUID", "6E400002-B5A3-F393-E0A9-E50E24DCCA9E");
  const [notifyMode, setNotifyMode] = useNodeField<boolean>("notifyMode", false);
  const [notifyVar, setNotifyVar] = useNodeField<string>("notifyVar", "sensor_val");
  const [notifyInterval, setNotifyInterval] = useNodeField<number>("notifyInterval", 500);
  const [varName, setVarName] = useNodeField<string>("varName", "ble_cmd");
  const [cmdMap, setCmdMap] = useNodeField<typeof BLE_CMDS_DEFAULT>("cmdMap", BLE_CMDS_DEFAULT);
  const [showCmds, setShowCmds] = useState(false);
  const [simInput, setSimInput] = useState("");
  const [simLog, setSimLog] = useState<string[]>([]);

  const addCmd = () => setCmdMap([...cmdMap, { trigger: "", action: "", value: "" }]);
  const removeCmd = (i: number) => setCmdMap(cmdMap.filter((_, idx) => idx !== i));
  const updateCmd = (i: number, field: keyof typeof BLE_CMDS_DEFAULT[0], val: string) =>
    setCmdMap(cmdMap.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleSim = () => {
    if (!simInput.trim()) return;
    const match = cmdMap.find(c => c.trigger === simInput.trim());
    setSimLog(prev => [`→ "${simInput}" → ${match ? `${match.action} = ${match.value}` : "no match"}`, ...prev.slice(0, 4)]);
    setSimInput("");
  };

  return (
    <BaseNode title="BLE Mode" color={COLORS.blue} icon={<CommsIcon />} width="280px">
      <NodeField label="Device Name"><TextInput value={deviceName} onChange={setDeviceName} wide /></NodeField>
      <NodeField label="Service UUID"><TextInput value={serviceUUID} onChange={setServiceUUID} wide /></NodeField>
      <NodeField label="Char UUID"><TextInput value={charUUID} onChange={setCharUUID} wide /></NodeField>

      <div className="mx-3 mt-0.5 border-t border-[#1c1c20]" />

      <NodeField label="Notify push"><ToggleInput value={notifyMode} onChange={setNotifyMode} leftLabel="Off" rightLabel="On" /></NodeField>
      {notifyMode && (<>
        <NodeField label="Notify var"><TextInput value={notifyVar} onChange={setNotifyVar} wide /></NodeField>
        <NodeField label="Interval">
          <NumberInput value={notifyInterval} onChange={setNotifyInterval} style={{ width: 70 }} />
          <span className="text-[10px] text-zinc-500 ml-1">ms</span>
        </NodeField>
      </>)}

      <NodeField label="Cmd var">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="ble_cmd"
          style={{ ...outHS(COLORS.blue), right: -6 }} />
      </NodeField>

      {/* command map */}
      <div className="px-3 mt-0.5 mb-0.5">
        <button onClick={() => setShowCmds(!showCmds)}
          className="nodrag w-full flex items-center justify-between py-1 text-[9px] text-zinc-500 hover:text-blue-400 transition-colors">
          <span className="font-bold uppercase tracking-wider">Command Map ({cmdMap.length})</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: showCmds ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {showCmds && (
          <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] overflow-hidden mt-1">
            <div className="flex px-2 py-1 text-[8px] text-zinc-600 uppercase tracking-wider gap-1 border-b border-[#1c1c20]">
              <span className="w-[68px]">Trigger</span>
              <span className="w-[68px]">Variable</span>
              <span className="flex-1">Value</span>
            </div>
            {cmdMap.map((cmd, i) => (
              <div key={i} className="flex items-center gap-1 px-1.5 py-1 border-t border-[#111116]">
                <input value={cmd.trigger} onChange={(e) => updateCmd(i, "trigger", e.target.value)}
                  className="nodrag w-[64px] text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-blue-400 outline-none" />
                <input value={cmd.action} onChange={(e) => updateCmd(i, "action", e.target.value)}
                  className="nodrag w-[64px] text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-zinc-300 outline-none" />
                <input value={cmd.value} onChange={(e) => updateCmd(i, "value", e.target.value)}
                  className="nodrag flex-1 text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-green-400 outline-none" />
                <button onClick={() => removeCmd(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
              </div>
            ))}
            <button onClick={addCmd}
              className="nodrag w-full py-1 text-[9px] text-blue-400 hover:text-blue-300 border-t border-[#1c1c20] transition-colors font-bold">
              + Add command
            </button>
          </div>
        )}
      </div>

      {/* phone sim */}
      <div className="px-3 pb-2">
        <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] p-2">
          <div className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">BLE Terminal Simulator</div>
          <div className="flex gap-1 mb-1.5">
            <input value={simInput} onChange={(e) => setSimInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSim()}
              placeholder="Type BLE command…"
              className="nodrag flex-1 text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-2 py-1 text-white outline-none placeholder:text-zinc-700" />
            <button onClick={handleSim}
              className="nodrag px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[9px] font-bold hover:bg-blue-500/30 transition-all">
              Send
            </button>
          </div>
          {simLog.length > 0 && (
            <div className="space-y-0.5">
              {simLog.map((l, i) => (
                <div key={i} className={`text-[9px] font-mono ${l.includes("no match") ? "text-red-400" : "text-green-400"}`}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
}
