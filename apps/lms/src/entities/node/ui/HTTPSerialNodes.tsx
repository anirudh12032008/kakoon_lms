import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, NumberInput, SelectInput,
  useNodeField, useAdvancedMode, COLORS,
} from "./BaseNode";

const outHS = (color = "#22c55e") => ({
  width: 12, height: 12, background: "var(--k-base-200)",
  border: `2.5px solid ${color}`, borderRadius: "50%", zIndex: 10,
});

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
  const isAdvanced = useAdvancedMode();

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

      {/* headers — advanced only */}
      {isAdvanced && <div className="px-3 mt-0.5">
        <button onClick={() => setShowHeaders(!showHeaders)}
          className="nodrag w-full flex items-center justify-between py-1 text-[9px] text-zinc-500 hover:text-cyan-400 transition-colors">
          <span className="font-bold uppercase tracking-wider">Headers ({headers.length})</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: showHeaders ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {showHeaders && (
          <div className="rounded-lg border border-[var(--k-base-300)] bg-[var(--k-base-100)] overflow-hidden mt-1">
            {headers.map((h, i) => (
              <div key={i} className="flex gap-1 px-1.5 py-1 border-b border-[var(--k-base-200)] last:border-0">
                <input value={h.key} onChange={(e) => updateHeader(i, "key", e.target.value)}
                  placeholder="Header"
                  className="nodrag w-[90px] text-[9px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-[var(--k-muted)] outline-none" />
                <input value={h.value} onChange={(e) => updateHeader(i, "value", e.target.value)}
                  placeholder="Value"
                  className="nodrag flex-1 text-[9px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-cyan-400 outline-none" />
                <button onClick={() => removeHeader(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
              </div>
            ))}
            <button onClick={addHeader}
              className="nodrag w-full py-1 text-[9px] text-cyan-400 hover:text-cyan-300 border-t border-[var(--k-base-300)] transition-colors font-bold">
              + Add header
            </button>
          </div>
        )}
      </div>}

      {/* JSON body builder for POST/PUT/PATCH — advanced only */}
      {isAdvanced && isPost && (
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
            <div className="rounded-lg border border-[var(--k-base-300)] bg-[var(--k-base-100)] overflow-hidden mt-1">
              <div className="px-2 py-1 border-b border-[var(--k-base-300)]">
                <code className="text-[8px] text-zinc-600">
                  {"{" + bodyFields.map(f => `"${f.key || "key"}": {"{" + (f.varName || "var") + "}"}`).join(", ") + "}"}
                </code>
              </div>
              {bodyFields.map((f, i) => (
                <div key={i} className="flex gap-1 px-1.5 py-1 border-b border-[var(--k-base-200)] last:border-0">
                  <input value={f.key} onChange={(e) => updateField(i, "key", e.target.value)}
                    placeholder="key"
                    className="nodrag w-[70px] text-[9px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-orange-400 outline-none" />
                  <span className="text-[9px] text-zinc-600 self-center">→</span>
                  <input value={f.varName} onChange={(e) => updateField(i, "varName", e.target.value)}
                    placeholder="variable"
                    className="nodrag flex-1 text-[9px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-cyan-400 outline-none" />
                  <button onClick={() => removeField(i)} className="nodrag text-zinc-600 hover:text-red-400 text-[11px] px-0.5">×</button>
                </div>
              ))}
              <button onClick={addField}
                className="nodrag w-full py-1 text-[9px] text-orange-400 hover:text-orange-300 border-t border-[var(--k-base-300)] transition-colors font-bold">
                + Add field
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mx-3 mt-1 border-t border-[var(--k-base-300)]" />
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
          <div className="rounded-lg border border-[var(--k-base-300)] bg-[var(--k-base-100)] overflow-hidden">
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
            <div className="border-t border-[var(--k-base-300)] flex">
              <input value={sendCmd} onChange={(e) => setSendCmd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Send command…"
                className="nodrag flex-1 text-[10px] font-mono bg-transparent px-2 py-1.5 text-yellow-400 outline-none placeholder:text-zinc-700" />
              <button onClick={handleSend}
                className="nodrag px-2 text-[9px] text-yellow-400 hover:text-white hover:bg-yellow-500/20 border-l border-[var(--k-base-300)] transition-all font-bold">
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
        <div className="rounded-lg border border-[var(--k-base-300)] bg-[var(--k-base-100)] overflow-hidden">
          <div className="flex px-2 py-1 text-[8px] text-zinc-600 uppercase tracking-wider gap-1 border-b border-[var(--k-base-300)]">
            <span className="flex-1">Var name</span>
            <span className="w-[44px]">Delim</span>
            <span className="w-[28px]">Idx</span>
          </div>
          {parseVars.map((v, i) => (
            <div key={i} className="flex items-center gap-1 px-1.5 py-1 border-t border-[var(--k-base-200)]">
              <input value={v.name} onChange={(e) => updateVar(i, "name", e.target.value)}
                className="nodrag flex-1 text-[10px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-green-400 outline-none" />
              <input value={v.delimiter} onChange={(e) => updateVar(i, "delimiter", e.target.value)}
                className="nodrag w-[40px] text-[10px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-[var(--k-muted)] text-center outline-none" />
              <input type="number" value={v.index} onChange={(e) => updateVar(i, "index", +e.target.value)} min={0}
                className="nodrag w-[26px] text-[10px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1 py-0.5 text-blue-400 text-center outline-none" />
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
