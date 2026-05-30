import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, NumberInput, SelectInput, ToggleInput,
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
function MQTTIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
function HTTPIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
function SerialIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
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

// ─── MQTT Node ────────────────────────────────────────────────────────────────
const MQTT_PUB_DEFAULT = [{ topic: "home/sensor", varName: "sensor_val", qos: "0", retained: false }];
const MQTT_SUB_DEFAULT = [{ topic: "home/cmd", varName: "mqtt_cmd", qos: "0" }];

export function MQTTNode() {
  const [broker, setBroker] = useNodeField<string>("broker", "broker.hivemq.com");
  const [port, setPort] = useNodeField<number>("port", 1883);
  const [clientId, setClientId] = useNodeField<string>("clientId", "esp32_" + Math.random().toString(36).slice(2, 7));
  const [useAuth, setUseAuth] = useNodeField<boolean>("useAuth", false);
  const [username, setUsername] = useNodeField<string>("username", "");
  const [mqttPass, setMqttPass] = useNodeField<string>("mqttPass", "");
  const [useTLS, setUseTLS] = useNodeField<boolean>("useTLS", false);
  const [pubTopics, setPubTopics] = useNodeField<typeof MQTT_PUB_DEFAULT>("pubTopics", MQTT_PUB_DEFAULT);
  const [subTopics, setSubTopics] = useNodeField<typeof MQTT_SUB_DEFAULT>("subTopics", MQTT_SUB_DEFAULT);
  const [keepAlive] = useNodeField<number>("keepAlive", 60);
  const [lwtTopic, setLwtTopic] = useNodeField<string>("lwtTopic", "home/status");
  const [lwtMsg, setLwtMsg] = useNodeField<string>("lwtMsg", "offline");

  const addPub = () => setPubTopics([...pubTopics, { topic: "", varName: "", qos: "0", retained: false }]);
  const removePub = (i: number) => setPubTopics(pubTopics.filter((_, idx) => idx !== i));
  const updatePub = (i: number, field: keyof typeof MQTT_PUB_DEFAULT[0], val: string | boolean) =>
    setPubTopics(pubTopics.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

  const addSub = () => setSubTopics([...subTopics, { topic: "", varName: "", qos: "0" }]);
  const removeSub = (i: number) => setSubTopics(subTopics.filter((_, idx) => idx !== i));
  const updateSub = (i: number, field: keyof typeof MQTT_SUB_DEFAULT[0], val: string) =>
    setSubTopics(subTopics.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

  return (
    <BaseNode title="MQTT Node" color={COLORS.orange} icon={<MQTTIcon />} width="290px">
      {/* WiFi dep badge */}
      <div className="mx-3 mt-1 mb-0.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/8 border border-orange-500/20">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        <span className="text-[9px] text-orange-400">Requires WiFi Node</span>
      </div>

      {/* broker config */}
      <NodeField label="Broker"><TextInput value={broker} onChange={setBroker} wide /></NodeField>
      <NodeField label="Port"><NumberInput value={port} onChange={setPort} /></NodeField>
      <NodeField label="Client ID"><TextInput value={clientId} onChange={setClientId} wide /></NodeField>
      <NodeField label="TLS / SSL"><ToggleInput value={useTLS} onChange={setUseTLS} leftLabel="Off" rightLabel="On" /></NodeField>
      <NodeField label="Auth">
        <ToggleInput value={useAuth} onChange={setUseAuth} leftLabel="Off" rightLabel="On" />
        <span className="text-[9px] text-zinc-600 ml-1">Keep-alive: {keepAlive}s</span>
      </NodeField>
      {useAuth && (<>
        <NodeField label="Username"><TextInput value={username} onChange={setUsername} wide /></NodeField>
        <NodeField label="Password"><TextInput value={mqttPass} onChange={setMqttPass} wide /></NodeField>
      </>)}

      <div className="mx-3 mt-1 mb-0.5 border-t border-[#1c1c20]" />

      {/* publish topics */}
      <div className="px-3 mb-0.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-orange-400 font-bold">Publish Topics</span>
          <button onClick={addPub}
            className="nodrag text-[9px] px-1.5 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 font-bold transition-all">
            + Add
          </button>
        </div>
        <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] overflow-hidden">
          {pubTopics.map((t, i) => (
            <div key={i} className="border-b border-[#111116] last:border-0 px-2 py-1.5">
              <div className="flex items-center gap-1 mb-1">
                <input value={t.topic} onChange={(e) => updatePub(i, "topic", e.target.value)}
                  placeholder="topic/path"
                  className="nodrag flex-1 text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1.5 py-0.5 text-orange-400 outline-none" />
                <select value={t.qos} onChange={(e) => updatePub(i, "qos", e.target.value)}
                  className="nodrag text-[9px] bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-zinc-400 outline-none">
                  <option value="0">QoS 0</option><option value="1">QoS 1</option><option value="2">QoS 2</option>
                </select>
                <button onClick={() => removePub(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
              </div>
              <div className="flex items-center gap-2">
                <Handle type="target" position={Position.Left} id={`pub_${i}`}
                  style={{ ...outHS(COLORS.orange), left: -22, top: "auto", position: "relative", display: "inline-block" }} />
                <input value={t.varName} onChange={(e) => updatePub(i, "varName", e.target.value)}
                  placeholder="variable name"
                  className="nodrag flex-1 text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1.5 py-0.5 text-cyan-400 outline-none" />
                <label className="flex items-center gap-1 cursor-pointer nodrag">
                  <input type="checkbox" checked={t.retained}
                    onChange={(e) => updatePub(i, "retained", e.target.checked)}
                    className="nodrag w-3 h-3 accent-orange-500" />
                  <span className="text-[8px] text-zinc-500">Retain</span>
                </label>
              </div>
            </div>
          ))}
          {pubTopics.length === 0 && <div className="py-2 text-center text-[9px] text-zinc-600">No publish topics</div>}
        </div>
      </div>

      {/* subscribe topics */}
      <div className="px-3 mb-0.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold">Subscribe Topics</span>
          <button onClick={addSub}
            className="nodrag text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 font-bold transition-all">
            + Add
          </button>
        </div>
        <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] overflow-hidden">
          {subTopics.map((t, i) => (
            <div key={i} className="border-b border-[#111116] last:border-0 px-2 py-1.5 flex items-center gap-1">
              <input value={t.topic} onChange={(e) => updateSub(i, "topic", e.target.value)}
                placeholder="topic/path"
                className="nodrag flex-1 text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1.5 py-0.5 text-cyan-400 outline-none" />
              <select value={t.qos} onChange={(e) => updateSub(i, "qos", e.target.value)}
                className="nodrag text-[9px] bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-zinc-400 outline-none">
                <option value="0">QoS 0</option><option value="1">QoS 1</option><option value="2">QoS 2</option>
              </select>
              <input value={t.varName} onChange={(e) => updateSub(i, "varName", e.target.value)}
                placeholder="var"
                className="nodrag w-[60px] text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1.5 py-0.5 text-green-400 outline-none" />
              <Handle type="source" position={Position.Right} id={`sub_${i}`}
                style={{ ...outHS(COLORS.cyan), right: -22, top: "auto", position: "relative", display: "inline-block" }} />
              <button onClick={() => removeSub(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
            </div>
          ))}
          {subTopics.length === 0 && <div className="py-2 text-center text-[9px] text-zinc-600">No subscribe topics</div>}
        </div>
      </div>

      {/* LWT */}
      <div className="px-3 pb-2">
        <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Last Will & Testament</div>
        <div className="flex gap-1.5">
          <input value={lwtTopic} onChange={(e) => setLwtTopic(e.target.value)}
            className="nodrag flex-1 text-[10px] font-mono bg-[#0a0a0d] border border-[#1c1c20] rounded px-1.5 py-1 text-zinc-400 outline-none" />
          <input value={lwtMsg} onChange={(e) => setLwtMsg(e.target.value)}
            className="nodrag w-[60px] text-[10px] font-mono bg-[#0a0a0d] border border-[#1c1c20] rounded px-1.5 py-1 text-red-400 outline-none" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Handle type="source" position={Position.Right} id="connected"
            style={{ ...outHS(COLORS.green), right: -6, position: "relative", display: "inline-block" }} />
          <span className="text-[8px] text-zinc-600">connected</span>
          <Handle type="source" position={Position.Right} id="error"
            style={{ ...outHS(COLORS.red), right: -6, position: "relative", display: "inline-block", marginLeft: 8 }} />
          <span className="text-[8px] text-zinc-600">error</span>
        </div>
      </div>
    </BaseNode>
  );
}

// ─── HTTP Client Node ──────────────────────────────────────────────────────────
const HEADERS_DEFAULT = [{ key: "Content-Type", value: "application/json" }];
const BODY_FIELDS_DEFAULT = [{ key: "sensor", varName: "sensor_val" }];

export function HTTPClientNode() {
  const [method, setMethod] = useNodeField<string>("method", "GET");
  const [url, setUrl] = useNodeField<string>("url", "https://api.example.com/data");
  const [triggerMode, setTriggerMode] = useNodeField<string>("triggerMode", "manual");
  const [intervalMs, setIntervalMs] = useNodeField<number>("intervalMs", 5000);
  const [headers, setHeaders] = useNodeField<typeof HEADERS_DEFAULT>("headers", HEADERS_DEFAULT);
  const [bodyFields, setBodyFields] = useNodeField<typeof BODY_FIELDS_DEFAULT>("bodyFields", BODY_FIELDS_DEFAULT);
  const [responseVar, setResponseVar] = useNodeField<string>("responseVar", "http_response");
  const [codeVar, setCodeVar] = useNodeField<string>("codeVar", "http_code");
  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(false);

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: "key" | "value", val: string) =>
    setHeaders(headers.map((h, idx) => idx === i ? { ...h, [field]: val } : h));

  const addField = () => setBodyFields([...bodyFields, { key: "", varName: "" }]);
  const removeField = (i: number) => setBodyFields(bodyFields.filter((_, idx) => idx !== i));
  const updateField = (i: number, field: "key" | "varName", val: string) =>
    setBodyFields(bodyFields.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  const isPost = method === "POST" || method === "PUT" || method === "PATCH";
  const methodColor: Record<string, string> = { GET: "#22c55e", POST: "#f97316", PUT: "#3b82f6", PATCH: "#8b5cf6", DELETE: "#ef4444" };
  const mc = methodColor[method] ?? COLORS.cyan;

  return (
    <BaseNode title="HTTP Client" color={COLORS.cyan} icon={<HTTPIcon />} width="285px">
      <div className="mx-3 mt-1 mb-0.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/8 border border-cyan-500/20">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5">
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        <span className="text-[9px] text-cyan-400">Requires WiFi Node</span>
      </div>

      <NodeField label="Method">
        <SelectInput value={method} onChange={setMethod} compact
          options={["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => ({ label: m, value: m }))} />
        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono"
          style={{ background: `${mc}22`, color: mc, border: `1px solid ${mc}44` }}>{method}</span>
      </NodeField>
      <NodeField label="URL"><TextInput value={url} onChange={setUrl} wide /></NodeField>
      <div className="px-3">
        <div className="text-[8px] text-zinc-600 mb-0.5">Use {"{varName}"} in URL for dynamic values</div>
      </div>
      <NodeField label="Trigger">
        <SelectInput value={triggerMode} onChange={setTriggerMode} compact
          options={[{ label: "Manual", value: "manual" }, { label: "Timer", value: "timer" }, { label: "Threshold", value: "threshold" }]} />
      </NodeField>
      {triggerMode === "timer" && (
        <NodeField label="Interval">
          <NumberInput value={intervalMs} onChange={setIntervalMs} style={{ width: 70 }} />
          <span className="text-[10px] text-zinc-500 ml-1">ms</span>
        </NodeField>
      )}

      {/* headers */}
      <div className="px-3 mt-0.5">
        <button onClick={() => setShowHeaders(!showHeaders)}
          className="nodrag w-full flex items-center justify-between py-1 text-[9px] text-zinc-500 hover:text-cyan-400 transition-colors">
          <span className="font-bold uppercase tracking-wider">Headers ({headers.length})</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: showHeaders ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {showHeaders && (
          <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] overflow-hidden mt-1">
            {headers.map((h, i) => (
              <div key={i} className="flex gap-1 px-1.5 py-1 border-b border-[#111116] last:border-0">
                <input value={h.key} onChange={(e) => updateHeader(i, "key", e.target.value)}
                  placeholder="Header"
                  className="nodrag w-[90px] text-[9px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-zinc-400 outline-none" />
                <input value={h.value} onChange={(e) => updateHeader(i, "value", e.target.value)}
                  placeholder="Value"
                  className="nodrag flex-1 text-[9px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-cyan-400 outline-none" />
                <button onClick={() => removeHeader(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
              </div>
            ))}
            <button onClick={addHeader}
              className="nodrag w-full py-1 text-[9px] text-cyan-400 hover:text-cyan-300 border-t border-[#1c1c20] transition-colors font-bold">
              + Add header
            </button>
          </div>
        )}
      </div>

      {/* JSON body builder for POST/PUT/PATCH */}
      {isPost && (
        <div className="px-3 mt-0.5">
          <button onClick={() => setShowBody(!showBody)}
            className="nodrag w-full flex items-center justify-between py-1 text-[9px] text-zinc-500 hover:text-orange-400 transition-colors">
            <span className="font-bold uppercase tracking-wider">JSON Body ({bodyFields.length} fields)</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: showBody ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showBody && (
            <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] overflow-hidden mt-1">
              <div className="px-2 py-1 border-b border-[#1c1c20]">
                <code className="text-[8px] text-zinc-600">
                  {"{" + bodyFields.map(f => `"${f.key || "key"}": {"{" + (f.varName || "var") + "}"}`).join(", ") + "}"}
                </code>
              </div>
              {bodyFields.map((f, i) => (
                <div key={i} className="flex gap-1 px-1.5 py-1 border-b border-[#111116] last:border-0">
                  <input value={f.key} onChange={(e) => updateField(i, "key", e.target.value)}
                    placeholder="key"
                    className="nodrag w-[70px] text-[9px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-orange-400 outline-none" />
                  <span className="text-[9px] text-zinc-600 self-center">→</span>
                  <input value={f.varName} onChange={(e) => updateField(i, "varName", e.target.value)}
                    placeholder="variable"
                    className="nodrag flex-1 text-[9px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-cyan-400 outline-none" />
                  <button onClick={() => removeField(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
                </div>
              ))}
              <button onClick={addField}
                className="nodrag w-full py-1 text-[9px] text-orange-400 hover:text-orange-300 border-t border-[#1c1c20] transition-colors font-bold">
                + Add field
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mx-3 mt-1 border-t border-[#1c1c20]" />
      <NodeField label="Response var">
        <TextInput value={responseVar} onChange={setResponseVar} green />
        <Handle type="source" position={Position.Right} id="response"
          style={{ ...outHS(COLORS.cyan), right: -6 }} />
      </NodeField>
      <NodeField label="HTTP code var">
        <TextInput value={codeVar} onChange={setCodeVar} green />
        <Handle type="source" position={Position.Right} id="http_code"
          style={{ ...outHS(COLORS.yellow), right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Serial Monitor Node ───────────────────────────────────────────────────────
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(b => ({ label: `${b}`, value: `${b}` }));
const PARSE_VARS_DEFAULT = [{ name: "temp", delimiter: ",", index: 0 }];

export function SerialMonitorNode() {
  const [baud, setBaud] = useNodeField<string>("baud", "115200");
  const [newline, setNewline] = useNodeField<string>("newline", "\\n");
  const [parseVars, setParseVars] = useNodeField<typeof PARSE_VARS_DEFAULT>("parseVars", PARSE_VARS_DEFAULT);
  const [rxVar, setRxVar] = useNodeField<string>("rxVar", "serial_rx");
  const [showLog, setShowLog] = useState(true);
  const [log, setLog] = useState<{ t: string; msg: string; dir: "rx" | "tx" }[]>([
    { t: "00:00.001", msg: "ESP32 boot — ready", dir: "rx" },
    { t: "00:00.120", msg: "WiFi connecting…", dir: "rx" },
    { t: "00:01.300", msg: "Connected! IP: 192.168.1.42", dir: "rx" },
  ]);
  const [sendCmd, setSendCmd] = useState("");

  const addVar = () => setParseVars([...parseVars, { name: "", delimiter: ",", index: parseVars.length }]);
  const removeVar = (i: number) => setParseVars(parseVars.filter((_, idx) => idx !== i));
  const updateVar = (i: number, field: keyof typeof PARSE_VARS_DEFAULT[0], val: string | number) =>
    setParseVars(parseVars.map((v, idx) => idx === i ? { ...v, [field]: val } : v));

  const handleSend = () => {
    if (!sendCmd.trim()) return;
    const now = new Date();
    const t = `${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}.${String(now.getMilliseconds()).padStart(3,"0")}`;
    setLog(prev => [{ t, msg: sendCmd, dir: "tx" }, ...prev.slice(0, 19)]);
    setSendCmd("");
  };

  return (
    <BaseNode title="Serial Monitor" color={COLORS.green} icon={<SerialIcon />} width="290px">
      <NodeField label="Baud rate">
        <SelectInput value={baud} onChange={setBaud} compact options={BAUD_RATES} />
        <span className="text-[9px] text-zinc-600 ml-1 font-mono">{(+baud / 1000).toFixed(1)}k</span>
      </NodeField>
      <NodeField label="Line ending">
        <SelectInput value={newline} onChange={setNewline} compact
          options={[{ label: "\\n (LF)", value: "\\n" }, { label: "\\r\\n (CRLF)", value: "\\r\\n" }, { label: "None", value: "" }]} />
      </NodeField>

      {/* log panel */}
      <div className="px-3 mt-0.5 mb-0.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-green-400 font-bold">Live Log</span>
          <div className="flex gap-1">
            <button onClick={() => setLog([])}
              className="nodrag text-[8px] text-zinc-600 hover:text-red-400 transition-colors px-1">CLR</button>
            <button onClick={() => setShowLog(!showLog)}
              className="nodrag text-[8px] text-zinc-600 hover:text-green-400 transition-colors px-1">{showLog ? "▲" : "▼"}</button>
          </div>
        </div>
        {showLog && (
          <div className="rounded-lg border border-[#1c1c20] bg-[#050507] overflow-hidden">
            <div className="h-[90px] overflow-y-auto flex flex-col-reverse p-1.5 gap-0.5 scrollbar-thin">
              {log.map((entry, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-[8px] text-zinc-700 font-mono flex-shrink-0">{entry.t}</span>
                  <span className={`text-[9px] font-mono ${entry.dir === "tx" ? "text-yellow-400" : "text-green-400"}`}>
                    {entry.dir === "tx" ? "↑" : "↓"} {entry.msg}
                  </span>
                </div>
              ))}
              {log.length === 0 && <div className="text-[9px] text-zinc-700 text-center py-2">No data yet</div>}
            </div>
            {/* send bar */}
            <div className="border-t border-[#1c1c20] flex">
              <input value={sendCmd} onChange={(e) => setSendCmd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Send command…"
                className="nodrag flex-1 text-[10px] font-mono bg-transparent px-2 py-1.5 text-yellow-400 outline-none placeholder:text-zinc-700" />
              <button onClick={handleSend}
                className="nodrag px-2 text-[9px] text-yellow-400 hover:text-white hover:bg-yellow-500/20 border-l border-[#1c1c20] transition-all font-bold">
                ↵
              </button>
            </div>
          </div>
        )}
      </div>

      {/* parse section */}
      <div className="px-3 mb-0.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Parse → Variables</span>
          <button onClick={addVar}
            className="nodrag text-[9px] px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold transition-all">
            + Add
          </button>
        </div>
        <div className="rounded-lg border border-[#1c1c20] bg-[#0a0a0d] overflow-hidden">
          <div className="flex px-2 py-1 text-[8px] text-zinc-600 uppercase tracking-wider gap-1 border-b border-[#1c1c20]">
            <span className="flex-1">Var name</span>
            <span className="w-[44px]">Delim</span>
            <span className="w-[28px]">Idx</span>
          </div>
          {parseVars.map((v, i) => (
            <div key={i} className="flex items-center gap-1 px-1.5 py-1 border-t border-[#111116]">
              <input value={v.name} onChange={(e) => updateVar(i, "name", e.target.value)}
                className="nodrag flex-1 text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-green-400 outline-none" />
              <input value={v.delimiter} onChange={(e) => updateVar(i, "delimiter", e.target.value)}
                className="nodrag w-[40px] text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-zinc-400 text-center outline-none" />
              <input type="number" value={v.index} onChange={(e) => updateVar(i, "index", +e.target.value)} min={0}
                className="nodrag w-[26px] text-[10px] font-mono bg-[#111116] border border-[#2d2d35] rounded px-1 py-0.5 text-blue-400 text-center outline-none" />
              <Handle type="source" position={Position.Right} id={`parse_${i}`}
                style={{ ...outHS(COLORS.green), right: -22, position: "relative", display: "inline-block" }} />
              <button onClick={() => removeVar(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
            </div>
          ))}
          {parseVars.length === 0 && <div className="py-2 text-center text-[9px] text-zinc-600">No parse rules</div>}
        </div>
      </div>

      <NodeField label="Raw RX var">
        <TextInput value={rxVar} onChange={setRxVar} green />
        <Handle type="source" position={Position.Right} id="rx"
          style={{ ...outHS(COLORS.green), right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// keep backward-compat re-exports used by other files via CommsNodes
export { MQTTNode as MqttNode };
