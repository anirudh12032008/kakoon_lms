import { useCallback, useEffect, useRef, useState } from "react";
import {
  type SerialConnection,
  connectSerial,
  disconnectSerial,
  isWebSerialSupported,
  sendCodeToESP32,
  uploadCodeToESP32,
} from "./serial";

type ConnectionType = "usb" | "wifi";

export function useSerialConnection() {
  const connectionRef = useRef<SerialConnection>({
    port: null,
    writer: null,
    reader: null,
    isConnected: false,
  });
  const connectionTypeRef = useRef<ConnectionType>("usb");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const responseCallbackRef = useRef<((data: string) => void) | null>(null);
  const responseBufferRef = useRef<string>("");

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${timestamp}] ${message}`]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    setIsSupported(isWebSerialSupported());
    if (!isWebSerialSupported()) {
      addLog("⚠️ Web Serial API not supported. Use Chrome or Edge for USB.");
    }
    return () => {
      if (connectionRef.current.port && connectionTypeRef.current === "usb") {
        disconnectSerial(connectionRef.current);
      }
    };
  }, [addLog]);

  // Read loop
  const startReading = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn.reader) return;

    try {
      while (conn.isConnected) {
        const { value, done } = await conn.reader.read();
        if (done) break;
        if (value) {
          const text = new TextDecoder().decode(value);
          responseBufferRef.current += text;

          const lines = responseBufferRef.current.split(/\r?\n/);
          responseBufferRef.current = lines.pop() ?? "";

          for (const line of lines) {
            if (line.trim()) {
              addLog(`📥 ${line}`);
              responseCallbackRef.current?.(line);
            }
          }
        }
      }
    } catch {
      // connection closed
    }
  }, [addLog]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const conn = await connectSerial();
      connectionRef.current = conn;
      connectionTypeRef.current = "usb";
      setIsConnected(true);
      addLog("✅ Connected via USB Serial");
      startReading();
    } catch (err: any) {
      addLog(`❌ Connection failed: ${err?.message ?? err}`);
    } finally {
      setIsConnecting(false);
    }
  }, [addLog, startReading]);

  const connectWifi = useCallback(async (ip: string, _password: string) => {
    addLog(`📡 WiFi connect to ${ip} — WebREPL not wired yet`);
    connectionTypeRef.current = "wifi";
    setIsConnected(true);
  }, [addLog]);

  const disconnect = useCallback(async () => {
    if (connectionTypeRef.current === "usb") {
      await disconnectSerial(connectionRef.current);
    }
    setIsConnected(false);
    addLog("🔌 Disconnected");
  }, [addLog]);

  const sendCode = useCallback(async (code: string): Promise<boolean> => {
    if (!connectionRef.current.writer) {
      addLog("❌ Not connected");
      return false;
    }
    try {
      await sendCodeToESP32(connectionRef.current.writer!, code);
      return true;
    } catch (err: any) {
      addLog(`❌ Send failed: ${err?.message ?? err}`);
      return false;
    }
  }, [addLog]);

  const uploadCode = useCallback(async (code: string): Promise<boolean> => {
    if (!connectionRef.current.writer) {
      addLog("❌ Not connected");
      return false;
    }
    try {
      await uploadCodeToESP32(connectionRef.current.writer!, code);
      return true;
    } catch (err: any) {
      addLog(`❌ Upload failed: ${err?.message ?? err}`);
      return false;
    }
  }, [addLog]);

  const sendCommand = useCallback(async (cmd: string): Promise<void> => {
    if (!connectionRef.current.writer) return;
    const encoder = new TextEncoder();
    await connectionRef.current.writer.write(encoder.encode(cmd + "\r\n"));
  }, []);

  const sendPythonCode = useCallback(async (code: string, timeoutMs = 5000): Promise<string | null> => {
    return new Promise((resolve) => {
      let buffer = "";
      const timeout = setTimeout(() => {
        responseCallbackRef.current = null;
        resolve(buffer || null);
      }, timeoutMs);

      responseCallbackRef.current = (line: string) => {
        buffer += line + "\n";
      };

      sendCode(code).then((ok) => {
        if (!ok) { clearTimeout(timeout); resolve(null); }
      });
    });
  }, [sendCode]);

  return {
    isConnected, isConnecting, isSupported,
    connect, connectWifi, disconnect,
    sendCode, sendCommand, sendPythonCode, uploadCode,
    logs, addLog, clearLogs,
  };
}
