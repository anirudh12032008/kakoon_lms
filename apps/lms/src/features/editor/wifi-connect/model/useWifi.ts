"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * WiFi credential storage policy:
 *   - SSID and ESP IP hint → sessionStorage (survives refresh, cleared on tab close)
 *   - Password             → React state only (never persisted anywhere)
 */

const SSID_KEY = "kokoon-wifi-ssid";
const SUBNET_KEY = "kokoon-wifi-subnet";

interface UseWifiOptions {
  connectWifi: (ip: string, password: string) => Promise<void>;
  setConnectionMode: (mode: "usb" | "wifi") => void;
  addLog: (msg: string) => void;
}

export function useWifi({ connectWifi, setConnectionMode, addLog }: UseWifiOptions) {
  const [wifiSsid, setWifiSsidRaw] = useState("");
  const [wifiPassword, setWifiPassword] = useState(""); // never stored
  const [wifiSubnet, setWifiSubnetRaw] = useState("");
  const [showWifiInput, setShowWifiInput] = useState(false);
  const [isConfiguringWifi, setIsConfiguringWifi] = useState(false);

  useEffect(() => {
    const ssid = sessionStorage.getItem(SSID_KEY);
    const subnet = sessionStorage.getItem(SUBNET_KEY);
    if (ssid) setWifiSsidRaw(ssid);
    if (subnet) setWifiSubnetRaw(subnet);
  }, []);

  const setWifiSsid = useCallback((v: string) => {
    setWifiSsidRaw(v);
    sessionStorage.setItem(SSID_KEY, v);
  }, []);

  const setWifiSubnet = useCallback((v: string) => {
    setWifiSubnetRaw(v);
    sessionStorage.setItem(SUBNET_KEY, v);
  }, []);

  const handleWifiConnect = useCallback(async () => {
    setIsConfiguringWifi(true);
    addLog("🔍 Searching for ESP32 on network...");
    const userInput = wifiSubnet.trim();

    const tryConnect = (ip: string): Promise<boolean> =>
      new Promise((resolve) => {
        try {
          const ws = new WebSocket(`ws://${ip}:8266`);
          const t = setTimeout(() => { ws.close(); resolve(false); }, 3000);
          ws.onopen = () => { clearTimeout(t); ws.close(); resolve(true); };
          ws.onerror = () => { clearTimeout(t); resolve(false); };
          ws.onclose = () => clearTimeout(t);
        } catch {
          resolve(false);
        }
      });

    if (userInput) {
      const parts = userInput.split(".");
      if (parts.length === 4 && parts.every((p) => !isNaN(Number(p)))) {
        addLog(`📡 Trying ${userInput}...`);
        if (await tryConnect(userInput)) {
          addLog(`✅ Found ESP32 at ${userInput}`);
          await connectWifi(userInput, "Kokoon");
          setConnectionMode("wifi");
          setIsConfiguringWifi(false);
          return;
        }
      }
    }

    addLog("📡 Trying Kokoon.local...");
    if (await tryConnect("Kokoon.local")) {
      addLog("✅ Found ESP32 at Kokoon.local");
      await connectWifi("Kokoon.local", "Kokoon");
      setConnectionMode("wifi");
      setIsConfiguringWifi(false);
      return;
    }

    addLog("❌ ESP32 not found. Make sure it's powered and on the network.");
    setIsConfiguringWifi(false);
  }, [wifiSubnet, connectWifi, setConnectionMode, addLog]);

  return {
    wifiSsid, setWifiSsid,
    wifiPassword, setWifiPassword,
    wifiSubnet, setWifiSubnet,
    showWifiInput, setShowWifiInput,
    isConfiguringWifi,
    handleWifiConnect,
  };
}
