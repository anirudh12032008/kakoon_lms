import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, SelectInput, ToggleInput,
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

// ─── WiFi Node ─────────────────────────────────────────────────────────────────
export function WiFiNodeNode() {
  const [mode, setMode] = useNodeField<string>("mode", "sta");
  const [ssid, setSsid] = useNodeField<string>("ssid", "MyNetwork");
  const [password, setPassword] = useNodeField<string>("password", "password123");
  const [staticIp, setStaticIp] = useNodeField<string>("staticIp", "");
  const [reconnect, setReconnect] = useNodeField<boolean>("reconnect", true);
  const [varName, setVarName] = useNodeField<string>("varName", "ip");
  const [rssiVar, setRssiVar] = useNodeField<string>("rssiVar", "wifi_rssi");
  const [connVar, setConnVar] = useNodeField<string>("connVar", "wifi_connected");

  return (
    <BaseNode title="WiFi Node" color={COLORS.cyan} icon={<CommsIcon />} width="265px">
      <NodeField label="Mode">
        <SelectInput value={mode} onChange={setMode} compact
          options={[{ label: "STA (Connect)", value: "sta" }, { label: "AP (Hotspot)", value: "ap" }, { label: "AP+STA", value: "apsta" }]} />
      </NodeField>
      <NodeField label="SSID"><TextInput value={ssid} onChange={setSsid} wide /></NodeField>
      <NodeField label="Password"><TextInput value={password} onChange={setPassword} wide /></NodeField>
      {mode === "sta" && (
        <NodeField label="Static IP"><TextInput value={staticIp} onChange={setStaticIp} wide /></NodeField>
      )}
      <NodeField label="Auto-reconnect"><ToggleInput value={reconnect} onChange={setReconnect} leftLabel="No" rightLabel="Yes" /></NodeField>

      <div className="mx-3 mt-0.5 border-t border-[#1c1c20]" />

      <NodeField label="IP Address">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="ip"
          style={{ ...outHS(COLORS.cyan), right: -6 }} />
      </NodeField>
      <NodeField label="Connected">
        <TextInput value={connVar} onChange={setConnVar} green />
        <Handle type="source" position={Position.Right} id="connected"
          style={{ ...outHS(COLORS.green), right: -6 }} />
      </NodeField>
      <NodeField label="RSSI (dBm)">
        <TextInput value={rssiVar} onChange={setRssiVar} green />
        <Handle type="source" position={Position.Right} id="rssi"
          style={{ ...outHS(COLORS.yellow), right: -6 }} />
      </NodeField>

      {/* signal strength visual */}
      <div className="mx-3 mb-2 mt-0.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0a0a0d] border border-[#1c1c20]">
        <div className="flex items-end gap-0.5">
          {[20, 40, 60, 80, 100].map((h, i) => (
            <div key={i} className="w-1.5 rounded-sm" style={{ height: h * 0.12 + "px", background: i < 3 ? "#14b8a6" : "#1c1c20" }} />
          ))}
        </div>
        <span className="text-[9px] text-zinc-500">Signal preview (live at runtime)</span>
      </div>
    </BaseNode>
  );
}
