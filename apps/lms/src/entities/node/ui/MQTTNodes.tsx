import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, NumberInput, ToggleInput,
  useNodeField, AdvancedSection, COLORS,
} from "./BaseNode";

const outHS = (color = "#22c55e") => ({
  width: 12, height: 12, background: "#111113",
  border: `2.5px solid ${color}`, borderRadius: "50%", zIndex: 10,
});

function MQTTIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
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
      <AdvancedSection>
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
      </AdvancedSection>

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

      <AdvancedSection>
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
      </AdvancedSection>
    </BaseNode>
  );
}

// keep backward-compat re-export
export { MQTTNode as MqttNode };
