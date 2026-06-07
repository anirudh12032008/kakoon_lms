
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  useNodeField,
  COLORS,
} from "./BaseNode";

function WifiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  );
}

const outHS = {
  width: 12,
  height: 12,
  background: "var(--k-base-200)",
  border: "2.5px solid #22c55e",
  borderRadius: "50%",
  zIndex: 10,
  top: "50%",
  transform: "translateY(-50%)",
};

// ─── WiFi Connect ─────────────────────────────────────────────────────────────
export function WiFiConnectNode() {
  const [ssid, setSsid] = useNodeField<string>("ssid", "MyWiFi");
  const [password, setPassword] = useNodeField<string>("password", "password");
  return (
    <BaseNode title="WiFi Connect" color={COLORS.red} icon={<WifiIcon />} width="220px">
      <NodeField label="SSID"><TextInput value={ssid} onChange={setSsid} wide /></NodeField>
      <NodeField label="Password"><TextInput value={password} onChange={setPassword} wide /></NodeField>
    </BaseNode>
  );
}

// ─── HTTP GET ─────────────────────────────────────────────────────────────────
export function HTTPGetNode() {
  const [url, setUrl] = useNodeField<string>("url", "http://example.com");
  const [varName, setVarName] = useNodeField<string>("varName", "response");
  return (
    <BaseNode title="HTTP GET" color={COLORS.cyan} icon={<WifiIcon />} width="230px">
      <NodeField label="URL"><TextInput value={url} onChange={setUrl} wide /></NodeField>
      <NodeField label="Store In">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="response" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── ESP NOW Sender ───────────────────────────────────────────────────────────
export function ESPNOWSenderNode() {
  const [mac, setMac] = useNodeField<string>("mac", "FF:FF:FF:FF:FF:FF");
  const [sendData, setSendData] = useNodeField<string>("sendData", "'hello'");
  return (
    <BaseNode title="ESP NOW sender" color={COLORS.red} icon={<WifiIcon />} width="230px">
      <NodeField label="Receiver MAC"><TextInput value={mac} onChange={setMac} wide /></NodeField>
      <NodeField label="Send data"><TextInput value={sendData} onChange={setSendData} wide /></NodeField>
    </BaseNode>
  );
}

// ─── ESP NOW Receiver ─────────────────────────────────────────────────────────
export function ESPNOWReceiverNode() {
  const [varName, setVarName] = useNodeField<string>("varName", "data");
  return (
    <BaseNode title="ESP NOW Receiver" color={COLORS.red} icon={<WifiIcon />} width="230px">
      <NodeField label="Received data">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="data" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Time Online ──────────────────────────────────────────────────────────────
export function TimeOnlineNode() {
  const [varName, setVarName] = useNodeField<string>("varName", "time_now");
  return (
    <BaseNode title="Time Online" color={COLORS.cyan} icon={<WifiIcon />} width="210px">
      <NodeField label="Store In">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="time" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}
