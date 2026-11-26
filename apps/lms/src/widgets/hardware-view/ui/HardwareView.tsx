import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap,
  useNodesState, useEdgesState, addEdge, useEdges, useUpdateNodeInternals,
  type Node, type Edge, type Connection, type NodeTypes,
  Handle, Position, useReactFlow,
} from "@xyflow/react";
import { ArduinoUnoSvg, Esp32DevKitSvg } from "./BoardArt";
import {
  BOARD_LAYOUTS, PIN_WIRING, wiresFor, dataForPin, pinForGpio, pinTitle,
  type BoardLayout, type PinSide, type Wire,
} from "../model/boardPins";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import {
  NEOPIXEL, SERVO_PORTS, MOTORS, SENSOR_PORTS, OLED, ONBOARD_IMU,
} from "@/entities/board/model/hardwareConfig";
import { useBoard, getBoard } from "@/entities/board";
import { CONNECTION_RADIUS } from "@/shared/lib/canvasConfig";

// ─── Wokwi-quality component illustrations ────────────────────────────────────

function UltrasonicImg() {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full">
      <rect x="2" y="4" width="116" height="58" rx="3" fill="#1565c0" stroke="#0d47a1" strokeWidth="1.5"/>
      <rect x="5" y="7" width="110" height="52" rx="2" fill="#1976d2"/>
      <text x="60" y="16" textAnchor="middle" fontSize="7" fill="white" fontFamily="Arial" fontWeight="bold" opacity="0.9">HC-SR04</text>
      <text x="60" y="24" textAnchor="middle" fontSize="5" fill="white" fontFamily="Arial" opacity="0.7">ULTRASONIC SENSOR</text>
      <rect x="8" y="26" width="38" height="26" rx="3" fill="#263238"/>
      <circle cx="27" cy="39" r="13" fill="#37474f" stroke="#546e7a" strokeWidth="1"/>
      <circle cx="27" cy="39" r="10" fill="#2d3a3e"/>
      <circle cx="27" cy="39" r="7" fill="#263238"/>
      <circle cx="27" cy="39" r="4" fill="#1c2529"/>
      <ellipse cx="27" cy="39" rx="10" ry="2.5" fill="none" stroke="#607d8b" strokeWidth="0.5" opacity="0.6"/>
      <ellipse cx="27" cy="39" rx="6" ry="1.5" fill="none" stroke="#607d8b" strokeWidth="0.5" opacity="0.6"/>
      <rect x="74" y="26" width="38" height="26" rx="3" fill="#263238"/>
      <circle cx="93" cy="39" r="13" fill="#37474f" stroke="#546e7a" strokeWidth="1"/>
      <circle cx="93" cy="39" r="10" fill="#2d3a3e"/>
      <circle cx="93" cy="39" r="7" fill="#263238"/>
      <circle cx="93" cy="39" r="4" fill="#1c2529"/>
      <ellipse cx="93" cy="39" rx="10" ry="2.5" fill="none" stroke="#607d8b" strokeWidth="0.5" opacity="0.6"/>
      <ellipse cx="93" cy="39" rx="6" ry="1.5" fill="none" stroke="#607d8b" strokeWidth="0.5" opacity="0.6"/>
    </svg>
  );
}

function ServoImg() {
  return (
    <svg viewBox="0 0 130 80" className="w-full h-full">
      <rect x="5" y="8" width="75" height="58" rx="5" fill="#455a64" stroke="#37474f" strokeWidth="1.5"/>
      <rect x="8" y="11" width="69" height="52" rx="4" fill="#546e7a"/>
      <rect x="12" y="15" width="61" height="18" rx="2" fill="#37474f"/>
      <text x="42" y="26" textAnchor="middle" fontSize="9" fill="#90a4ae" fontFamily="Arial" fontWeight="bold">SG90</text>
      <circle cx="42" cy="48" r="15" fill="#37474f" stroke="#607d8b" strokeWidth="1"/>
      <circle cx="42" cy="48" r="11" fill="#2d3a3e"/>
      <circle cx="42" cy="48" r="7" fill="#455a64"/>
      <circle cx="42" cy="48" r="4" fill="#607d8b"/>
      <rect x="38" y="33" width="8" height="16" rx="4" fill="#eceff1" stroke="#bdbdbd" strokeWidth="0.8"/>
      <circle cx="42" cy="37" r="3" fill="#bdbdbd"/>
      <circle cx="42" cy="37" r="1.5" fill="#757575"/>
      <rect x="0" y="18" width="10" height="36" rx="2" fill="#455a64" stroke="#37474f" strokeWidth="1"/>
      <circle cx="5" cy="26" r="3" fill="#263238" stroke="#607d8b" strokeWidth="0.5"/>
      <circle cx="5" cy="46" r="3" fill="#263238" stroke="#607d8b" strokeWidth="0.5"/>
      <rect x="80" y="18" width="10" height="36" rx="2" fill="#455a64" stroke="#37474f" strokeWidth="1"/>
      <circle cx="85" cy="26" r="3" fill="#263238" stroke="#607d8b" strokeWidth="0.5"/>
      <circle cx="85" cy="46" r="3" fill="#263238" stroke="#607d8b" strokeWidth="0.5"/>
    </svg>
  );
}

function MotorImg() {
  return (
    <svg viewBox="0 0 120 75" className="w-full h-full">
      <rect x="18" y="9" width="70" height="50" rx="6" fill="#f9d423" stroke="#b7791f" strokeWidth="2"/>
      <rect x="21" y="12" width="64" height="44" rx="5" fill="#ffd84d" stroke="#d19a1f" strokeWidth="1"/>
      <rect x="28" y="16" width="28" height="30" rx="3" fill="#ffea7a" stroke="#d4a21f" strokeWidth="0.8"/>
      <rect x="32" y="20" width="20" height="10" rx="2" fill="#1f1f1f" opacity="0.18"/>
      <text x="42" y="28" textAnchor="middle" fontSize="8" fill="#7a4a00" fontFamily="Arial" fontWeight="900">BO</text>
      <text x="42" y="38" textAnchor="middle" fontSize="5.5" fill="#8a5b00" fontFamily="Arial" fontWeight="bold">MOTOR</text>
      <rect x="8" y="18" width="20" height="30" rx="3" fill="#5c4b1e" stroke="#3f3213" strokeWidth="1.2"/>
      <rect x="10" y="20" width="16" height="26" rx="2" fill="#776124"/>
      {[21,27,33,39,45].map(y=>(
        <rect key={y} x="8" y={y} width="4" height="3.5" rx="0.5" fill="#2c2410" opacity="0.9"/>
      ))}
      <rect x="1" y="29" width="10" height="10" rx="1.2" fill="#c7c7c7" stroke="#9b9b9b" strokeWidth="0.8"/>
    </svg>
  );
}

function NeoPixelImg() {
  return (
    <svg viewBox="0 0 90 90" className="w-full h-full">
      <circle cx="45" cy="45" r="42" fill="#1b1b1b" stroke="#333" strokeWidth="1.5"/>
      <circle cx="45" cy="45" r="36" fill="none" stroke="#2e7d32" strokeWidth="10"/>
      <circle cx="45" cy="45" r="36" fill="none" stroke="#1b5e20" strokeWidth="10" strokeDasharray="12 10" strokeDashoffset="0"/>
      <circle cx="45" cy="45" r="18" fill="#1b1b1b" stroke="#212121" strokeWidth="1"/>
      <circle cx="45" cy="45" r="8" fill="#111" stroke="#222" strokeWidth="1"/>
      {[0,45,90,135,180,225,270,315].map((angle,i)=>{
        const rad=(angle*Math.PI)/180;
        const cx=45+30*Math.cos(rad);
        const cy=45+30*Math.sin(rad);
        const colors=["#ff1744","#ff6d00","#ffd600","#00e676","#2979ff","#d500f9","#ff4081","#00e5ff"];
        return (
          <g key={i}>
            <rect x={cx-5} y={cy-4} width="10" height="8" rx="1.5"
              fill="#263238" stroke="#37474f" strokeWidth="0.5"
              transform={`rotate(${angle},${cx},${cy})`}/>
            <circle cx={cx} cy={cy} r="3.5" fill={colors[i]}
              style={{filter:`drop-shadow(0 0 4px ${colors[i]})`}} opacity="0.95"/>
          </g>
        );
      })}
    </svg>
  );
}

function IRSensorImg() {
  return (
    <svg viewBox="0 0 110 60" className="w-full h-full">
      <rect x="2" y="4" width="106" height="44" rx="3" fill="#212121" stroke="#333" strokeWidth="1.5"/>
      <rect x="5" y="7" width="100" height="38" rx="2" fill="#1a1a1a"/>
      <rect x="8" y="10" width="22" height="28" rx="3" fill="#1a237e" stroke="#283593" strokeWidth="1"/>
      <ellipse cx="19" cy="24" rx="8" ry="10" fill="#303f9f"/>
      <ellipse cx="19" cy="24" rx="5" ry="7" fill="#3949ab"/>
      <ellipse cx="19" cy="24" rx="3" ry="4" fill="#7986cb" opacity="0.6"/>
      <text x="19" y="42" textAnchor="middle" fontSize="5" fill="#5c6bc0" fontFamily="monospace">IR-TX</text>
      <rect x="36" y="10" width="22" height="28" rx="3" fill="#1a1a1a" stroke="#b71c1c" strokeWidth="1"/>
      <ellipse cx="47" cy="24" rx="8" ry="10" fill="#212121"/>
      <ellipse cx="47" cy="24" rx="5" ry="7" fill="#1a1a1a"/>
      <ellipse cx="47" cy="24" rx="3" ry="4" fill="#4a148c" opacity="0.6"/>
      <text x="47" y="42" textAnchor="middle" fontSize="5" fill="#e53935" fontFamily="monospace">IR-RX</text>
      <rect x="65" y="14" width="24" height="20" rx="2" fill="#263238" stroke="#37474f" strokeWidth="0.8"/>
      <text x="77" y="25" textAnchor="middle" fontSize="6" fill="#78909c" fontFamily="monospace">LM393</text>
      <circle cx="98" cy="16" r="5" fill="#00c853" opacity="0.9" style={{filter:"drop-shadow(0 0 3px #00c853)"}}/>
      <text x="98" y="26" textAnchor="middle" fontSize="4" fill="#666">PWR</text>
      <circle cx="93" cy="35" r="6" fill="#37474f" stroke="#546e7a" strokeWidth="0.8"/>
      <line x1="93" y1="29" x2="95" y2="35" stroke="#90a4ae" strokeWidth="1.2"/>
    </svg>
  );
}

function ButtonImg() {
  return (
    <svg viewBox="0 0 70 70" className="w-full h-full">
      <rect x="4" y="4" width="62" height="62" rx="4" fill="#004d40" stroke="#00332a" strokeWidth="1.5"/>
      <rect x="7" y="7" width="56" height="56" rx="3" fill="#00574a"/>
      {[[12,12],[58,12],[12,58],[58,58]].map(([cx,cy],i)=>(
        <g key={i}>
          <rect x={cx-7} y={cy-7} width="14" height="14" rx="2" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8"/>
          <rect x={cx-4} y={cy-4} width="8" height="8" rx="1" fill="#b8860b"/>
        </g>
      ))}
      <rect x="18" y="18" width="34" height="34" rx="3" fill="#1a1a1a" stroke="#444" strokeWidth="1.5"/>
      <circle cx="35" cy="35" r="13" fill="#1565c0" stroke="#0d47a1" strokeWidth="1.5"/>
      <circle cx="35" cy="35" r="10" fill="#1976d2"/>
      <circle cx="35" cy="35" r="7" fill="#1e88e5"/>
      <circle cx="32" cy="32" r="2" fill="#42a5f5" opacity="0.7"/>
      <text x="35" y="64" textAnchor="middle" fontSize="5" fill="#80cbc4" fontFamily="monospace">PUSH</text>
    </svg>
  );
}

function OLEDImg() {
  return (
    <svg viewBox="0 0 120 75" className="w-full h-full">
      <rect x="2" y="2" width="116" height="60" rx="3" fill="#0d1117" stroke="#1a2332" strokeWidth="1.5"/>
      <rect x="5" y="5" width="110" height="52" rx="2" fill="#161b22"/>
      <rect x="10" y="8" width="100" height="42" rx="2" fill="#0d1117" stroke="#21262d" strokeWidth="1"/>
      <rect x="13" y="11" width="94" height="36" rx="1" fill="#010409"/>
      <rect x="15" y="13" width="20" height="8" rx="1" fill="#1f6feb" opacity="0.9"/>
      <text x="25" y="20" textAnchor="middle" fontSize="6" fill="white" fontFamily="monospace">K</text>
      <text x="40" y="20" fontSize="6" fill="#58a6ff" fontFamily="monospace">akoon</text>
      <text x="15" y="30" fontSize="5" fill="#3fb950" fontFamily="monospace">Hello World!</text>
      <text x="15" y="38" fontSize="4" fill="#8b949e" fontFamily="monospace">v2.0 ready...</text>
      {[14,17,20,23,26,29,32,35,38,41,44].map(y=>(
        <line key={y} x1="13" y1={y} x2="107" y2={y} stroke="#58a6ff" strokeWidth="0.15" opacity="0.08"/>
      ))}
      <rect x="38" y="56" width="44" height="10" rx="1" fill="#21262d" stroke="#30363d" strokeWidth="0.5"/>
    </svg>
  );
}

function SoilImg() {
  return (
    <svg viewBox="0 0 70 100" className="w-full h-full">
      <rect x="6" y="2" width="58" height="50" rx="3" fill="#1b5e20" stroke="#154360" strokeWidth="1.5"/>
      <rect x="9" y="5" width="52" height="44" rx="2" fill="#1e8449"/>
      <rect x="18" y="10" width="34" height="20" rx="2" fill="#1a1a2e" stroke="#16213e" strokeWidth="0.8"/>
      <text x="35" y="23" textAnchor="middle" fontSize="6" fill="#4fc3f7" fontFamily="monospace">LM393</text>
      <circle cx="52" cy="14" r="5" fill="#ff4081" opacity="0.9" style={{filter:"drop-shadow(0 0 3px #ff4081)"}}/>
      <circle cx="18" cy="35" r="7" fill="#263238" stroke="#37474f" strokeWidth="1"/>
      <line x1="18" y1="28" x2="20" y2="35" stroke="#90a4ae" strokeWidth="1.2"/>
      <line x1="35" y1="52" x2="35" y2="58" stroke="#90a4ae" strokeWidth="2"/>
      <rect x="12" y="58" width="46" height="10" rx="2" fill="#004d40" stroke="#00332a" strokeWidth="1"/>
      <rect x="18" y="68" width="8" height="30" rx="4" fill="#78909c" stroke="#607d8b" strokeWidth="1"/>
      <rect x="20" y="70" width="4" height="26" rx="3" fill="#b0bec5"/>
      <rect x="44" y="68" width="8" height="30" rx="4" fill="#78909c" stroke="#607d8b" strokeWidth="1"/>
      <rect x="46" y="70" width="4" height="26" rx="3" fill="#b0bec5"/>
    </svg>
  );
}

function AnalogImg() {
  return (
    <svg viewBox="0 0 110 65" className="w-full h-full">
      <rect x="2" y="3" width="106" height="52" rx="3" fill="#1a237e" stroke="#0d1663" strokeWidth="1.5"/>
      <rect x="5" y="6" width="100" height="46" rx="2" fill="#1e2d9e"/>
      <circle cx="25" cy="27" r="13" fill="#fff9c4" stroke="#f9a825" strokeWidth="2"/>
      <circle cx="25" cy="27" r="10" fill="#fff176"/>
      <path d="M19 21 Q25 15 31 21 Q31 33 25 33 Q19 33 19 21" fill="#f9a825" opacity="0.5"/>
      <ellipse cx="25" cy="27" rx="5" ry="5" fill="none" stroke="#f57f17" strokeWidth="1.5"/>
      <text x="25" y="44" textAnchor="middle" fontSize="5" fill="#fff59d" fontFamily="monospace">LDR</text>
      <rect x="48" y="14" width="30" height="22" rx="2" fill="#0d1117" stroke="#30363d" strokeWidth="0.8"/>
      <text x="63" y="26" textAnchor="middle" fontSize="5.5" fill="#58a6ff" fontFamily="monospace">LM393</text>
      <circle cx="90" cy="17" r="6" fill="#00e676" style={{filter:"drop-shadow(0 0 4px #00e676)"}}/>
      <text x="90" y="28" textAnchor="middle" fontSize="4" fill="#80cbc4">PWR</text>
      <circle cx="90" cy="40" r="8" fill="#263238" stroke="#455a64" strokeWidth="1"/>
      <line x1="90" y1="32" x2="93" y2="40" stroke="#90a4ae" strokeWidth="1.2"/>
    </svg>
  );
}

function IMUImg() {
  return (
    <svg viewBox="0 0 90 75" className="w-full h-full">
      <rect x="3" y="3" width="84" height="58" rx="3" fill="#1a1a2e" stroke="#16213e" strokeWidth="1.5"/>
      <rect x="6" y="6" width="78" height="52" rx="2" fill="#16213e"/>
      <rect x="22" y="10" width="46" height="36" rx="2" fill="#0f0f1a" stroke="#1e3a5f" strokeWidth="1"/>
      {Array.from({length:5}).map((_,i)=>(
        <g key={i}>
          <rect x={26+i*8} y="8" width="5" height="4" rx="0.5" fill="#ffd700"/>
          <rect x={26+i*8} y="44" width="5" height="4" rx="0.5" fill="#ffd700"/>
        </g>
      ))}
      {Array.from({length:3}).map((_,i)=>(
        <g key={i}>
          <rect x="20" y={13+i*10} width="4" height="5" rx="0.5" fill="#ffd700"/>
          <rect x="66" y={13+i*10} width="4" height="5" rx="0.5" fill="#ffd700"/>
        </g>
      ))}
      <text x="45" y="26" textAnchor="middle" fontSize="6" fill="#4fc3f7" fontFamily="monospace" fontWeight="bold">LSM6</text>
      <text x="45" y="35" textAnchor="middle" fontSize="5" fill="#29b6f6" fontFamily="monospace">DS3TR-C</text>
      <line x1="45" y1="8" x2="45" y2="3" stroke="#ef5350" strokeWidth="1.5"/>
      <polygon points="45,2 43,5 47,5" fill="#ef5350"/>
      <line x1="66" y1="28" x2="71" y2="28" stroke="#66bb6a" strokeWidth="1.5"/>
      <polygon points="72,28 69,26 69,30" fill="#66bb6a"/>
      <text x="45" y="1" textAnchor="middle" fontSize="4" fill="#ef5350" fontFamily="monospace">Z</text>
      <text x="73" y="30" fontSize="4" fill="#66bb6a" fontFamily="monospace">X</text>
    </svg>
  );
}

function LedImg() {
  return (
    <svg viewBox="0 0 70 90" className="w-full h-full">
      <path d="M29 58V88M41 58V80" stroke="#b0bec5" strokeWidth="3" strokeLinecap="round"/>
      <path d="M17 58V30a18 18 0 0 1 36 0V58Z" fill="#e53935" stroke="#b71c1c" strokeWidth="1.5"/>
      <rect x="13" y="56" width="44" height="7" rx="2" fill="#c62828"/>
      <path d="M25 30a10 10 0 0 1 8-10" fill="none" stroke="#ffcdd2" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
    </svg>
  );
}

function RelayImg() {
  return (
    <svg viewBox="0 0 120 75" className="w-full h-full">
      <rect x="2" y="4" width="116" height="62" rx="3" fill="#b71c1c" stroke="#7f0000" strokeWidth="1.5"/>
      <rect x="34" y="10" width="56" height="50" rx="3" fill="#1565c0" stroke="#0d47a1" strokeWidth="1.5"/>
      <text x="62" y="32" textAnchor="middle" fontSize="8" fill="white" fontFamily="Arial" fontWeight="bold">SRD-05VDC</text>
      <text x="62" y="44" textAnchor="middle" fontSize="6" fill="#bbdefb" fontFamily="Arial">10A 250VAC</text>
      <rect x="96" y="14" width="16" height="42" rx="2" fill="#1e88e5" stroke="#0d47a1" strokeWidth="1"/>
      {[22,35,48].map(y=><circle key={y} cx="104" cy={y} r="4" fill="#cfd8dc" stroke="#78909c" strokeWidth="1"/>)}
      {[20,35,50].map(y=><rect key={y} x="8" y={y-3} width="12" height="6" fill="#ffd700"/>)}
      <circle cx="26" cy="14" r="3" fill="#00e676"/>
    </svg>
  );
}

function BuzzerImg() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <circle cx="40" cy="40" r="34" fill="#212121" stroke="#000" strokeWidth="2"/>
      <circle cx="40" cy="40" r="27" fill="#2b2b2b"/>
      <circle cx="40" cy="40" r="6" fill="#050505" stroke="#424242" strokeWidth="1.5"/>
      <text x="22" y="24" fontSize="12" fill="#bdbdbd" fontFamily="Arial" fontWeight="bold">+</text>
    </svg>
  );
}

function DhtImg() {
  return (
    <svg viewBox="0 0 70 95" className="w-full h-full">
      {[23,35,47].map(x=><rect key={x} x={x-1.5} y="64" width="3" height="28" fill="#b0bec5"/>)}
      <rect x="10" y="4" width="50" height="62" rx="3" fill="#29b6f6" stroke="#0277bd" strokeWidth="1.5"/>
      {[14,24,34].map(y=>[20,30,40,50].map(x=>(
        <rect key={`${x}-${y}`} x={x-3.5} y={y} width="7" height="6" rx="1" fill="#01579b"/>
      )))}
      <text x="35" y="58" textAnchor="middle" fontSize="8" fill="white" fontFamily="Arial" fontWeight="bold">DHT11</text>
    </svg>
  );
}

function PirImg() {
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="6" y="6" width="88" height="66" rx="3" fill="#1b5e20" stroke="#0b3d0f" strokeWidth="1.5"/>
      <rect x="22" y="12" width="56" height="54" rx="4" fill="#fafafa" stroke="#bdbdbd" strokeWidth="1"/>
      <circle cx="50" cy="39" r="24" fill="#f5f5f5" stroke="#bdbdbd" strokeWidth="1.5"/>
      <path d="M30 28Q50 18 70 28M27 39H73M30 50Q50 60 70 50M50 15V63M38 18Q32 39 38 60M62 18Q68 39 62 60" fill="none" stroke="#cfd8dc" strokeWidth="1"/>
    </svg>
  );
}

function LcdImg() {
  return (
    <svg viewBox="0 0 130 70" className="w-full h-full">
      <rect x="2" y="4" width="126" height="58" rx="3" fill="#1b5e20" stroke="#0b3d0f" strokeWidth="1.5"/>
      <rect x="10" y="12" width="110" height="42" rx="2" fill="#111" />
      <rect x="14" y="16" width="102" height="34" rx="1" fill="#1e40af"/>
      <text x="18" y="30" fontSize="9" fill="#e0f2fe" fontFamily="monospace">Hello</text>
      <text x="18" y="44" fontSize="9" fill="#e0f2fe" fontFamily="monospace">World</text>
      {[7,123].map(x=>[9,57].map(y=><circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#cfd8dc"/>))}
    </svg>
  );
}

/** Generic breakout board for parts that have no drawing of their own. */
function ModuleImg({ text }: { text: string }) {
  return (
    <svg viewBox="0 0 110 65" className="w-full h-full">
      <rect x="2" y="3" width="106" height="52" rx="3" fill="#4a148c" stroke="#311b92" strokeWidth="1.5"/>
      <rect x="30" y="12" width="50" height="26" rx="2" fill="#0d1117" stroke="#30363d" strokeWidth="0.8"/>
      <text x="55" y="29" textAnchor="middle" fontSize="8" fill="#ce93d8" fontFamily="monospace" fontWeight="bold">{text}</text>
      {[35,45,55,65,75].map(x=><rect key={x} x={x-2} y="44" width="4" height="8" fill="#ffd700"/>)}
      <circle cx="12" cy="13" r="4" fill="#1a1a1a" stroke="#b39ddb" strokeWidth="1"/>
      <circle cx="98" cy="13" r="4" fill="#00e676"/>
    </svg>
  );
}
const GasImg = () => <ModuleImg text="MQ-2" />;
const RainImg = () => <ModuleImg text="RAIN" />;
const WaterImg = () => <ModuleImg text="WATER" />;
const SoundImg = () => <ModuleImg text="SOUND" />;
const TouchImg = () => <ModuleImg text="TTP223" />;
const RtcImg = () => <ModuleImg text="DS3231" />;

// ─── Component catalogue ──────────────────────────────────────────────────────

interface HwComponent {
  id: string; label: string; nodeType: string;
  icon: React.ComponentType; defaultData: Record<string, unknown>;
  portHint: string; color: string; compatiblePorts: string[];
  /** Offered only on boards with per-pin anchors (Arduino Uno, ESP32). */
  pinOnly?: boolean;
  /** Other block types drawn as this part on those boards. */
  also?: string[];
}

const HW_COMPONENTS: HwComponent[] = [
  { id:"ultrasonic", label:"Ultrasonic",    nodeType:"ultrasonic",      icon:UltrasonicImg, defaultData:{port:"1"},                                  portHint:"Sensor 1 / 2",  color:"#7c3aed", compatiblePorts:["sensor1","sensor2"], also:["ultrasonic_sensor"] },
  { id:"ir_sensor",  label:"IR Sensor",     nodeType:"ir_sensor",       icon:IRSensorImg,   defaultData:{},                                          portHint:"GPIO",          color:"#ea580c", compatiblePorts:["gpio"] },
  { id:"button",     label:"Push Button",   nodeType:"push_button",     icon:ButtonImg,     defaultData:{},                                          portHint:"GPIO",          color:"#2563eb", compatiblePorts:["gpio"], also:["button_digital_input"] },
  { id:"soil",       label:"Soil Moisture", nodeType:"soil_moisture",   icon:SoilImg,       defaultData:{port:"1"},                                  portHint:"Sensor 1 / 2",  color:"#16a34a", compatiblePorts:["sensor1","sensor2"] },
  { id:"analog",     label:"Analog Sensor", nodeType:"analog_sensor",   icon:AnalogImg,     defaultData:{port:"1"},                                  portHint:"Sensor 1 / 2",  color:"#0284c7", compatiblePorts:["sensor1","sensor2"], also:["adc"] },
  { id:"imu",        label:"IMU Sensor",    nodeType:"imu_sensor",      icon:IMUImg,        defaultData:{scl:ONBOARD_IMU.scl,sda:ONBOARD_IMU.sda},  portHint:"IMU",           color:"#0891b2", compatiblePorts:["imu"] },
  { id:"oled",       label:"OLED 128×64",   nodeType:"oled_display",    icon:OLEDImg,       defaultData:{scl:OLED.scl,sda:OLED.sda},                portHint:"OLED / I2C",    color:"#4f46e5", compatiblePorts:["oled","i2c2"] },
  { id:"neopixel",   label:"NeoPixel",      nodeType:"neopixel_led",    icon:NeoPixelImg,   defaultData:{pin:NEOPIXEL.pin},                         portHint:"NeoPixel",      color:"#9333ea", compatiblePorts:["neopixel"] },
  { id:"dc_motor",   label:"DC Motor",      nodeType:"dc_motor_single", icon:MotorImg,      defaultData:{},                                          portHint:"Motor FR–RL",   color:"#dc2626", compatiblePorts:["motor_fr","motor_fl","motor_rr","motor_rl"] },
  { id:"servo",      label:"Servo Motor",   nodeType:"servo_motor",     icon:ServoImg,      defaultData:{},                                          portHint:"Servo S1–S4",   color:"#d97706", compatiblePorts:["servo_s1","servo_s2","servo_s3","servo_s4"] },
  // Parts below are wired pin by pin, so they exist only on the Arduino Uno and ESP32.
  ...([
    ["led",    "LED",              "led",          LedImg,    "#dc2626"],
    ["relay",  "Relay",            "relay",        RelayImg,  "#ea580c"],
    ["buzzer", "Buzzer",           "buzzer_tone",  BuzzerImg, "#64748b"],
    ["dht11",  "DHT11 Temp / Hum", "dht11",        DhtImg,    "#0ea5e9"],
    ["ldr",    "Light Sensor LDR", "ldr_sensor",   AnalogImg, "#ca8a04"],
    ["gas",    "Gas Sensor",       "gas_sensor",   GasImg,    "#9333ea"],
    ["pir",    "PIR Motion",       "pir_motion",   PirImg,    "#16a34a"],
    ["lcd",    "LCD 16x2 (I2C)",   "lcd_16x2",     LcdImg,    "#2563eb"],
    ["rain",   "Rain Sensor",      "rain_sensor",  RainImg,   "#0284c7"],
    ["water",  "Water Level",      "water_level",  WaterImg,  "#0891b2"],
    ["sound",  "Sound Sensor",     "sound_sensor", SoundImg,  "#db2777"],
    ["touch",  "Touch Sensor",     "touch_sensor", TouchImg,  "#7c3aed"],
    ["rtc",    "Clock (DS3231)",   "rtc_time",     RtcImg,    "#0d9488"],
  ] as const).map(([id, label, nodeType, icon, color]): HwComponent => ({
    id, label, nodeType, icon, color, defaultData: {}, portHint: "", compatiblePorts: [], pinOnly: true,
  })),
];

// ─── Board port positions ─────────────────────────────────────────────────────
// x/y are percentages of the 480×480 board image (top-left = 0,0).
// `side` controls the direction connection lines exit the handle.

interface BoardPort {
  id: string; label: string; side: Position;
  x: number; y: number; color: string;
}

const BOARD_PORTS: BoardPort[] = [
  // Centers from rendered 579×579 image scan - these ARE the exact CSS percentages
  { id:"gpio",     label:"GPIO PINS", side:Position.Top,    x:57,  y:8,  color:"#22c55e" },
  { id:"motor_fl", label:"ML1",       side:Position.Left,   x:7,  y:21,  color:"#ef4444" },
  { id:"motor_rl", label:"ML2",       side:Position.Left,   x:7,  y:32,  color:"#ef4444" },
  { id:"motor_fr", label:"MR1",       side:Position.Left,   x:7,  y:62,  color:"#ef4444" },
  { id:"motor_rr", label:"MR2",       side:Position.Left,   x:7,  y:74,  color:"#ef4444" },
  { id:"neopixel", label:"WSB LED",   side:Position.Left,   x:27,  y:23,  color:"#a855f7" },
  { id:"servo_s1", label:"Servo S1",  side:Position.Bottom, x:63,  y:79,  color:"#eab308" },
  { id:"servo_s2", label:"Servo S2",  side:Position.Bottom, x:69,  y:79,  color:"#eab308" },
  { id:"servo_s3", label:"Servo S3",  side:Position.Bottom, x:75,  y:79,  color:"#eab308" },
  { id:"servo_s4", label:"Servo S4",  side:Position.Bottom, x:80,  y:79,  color:"#eab308" },
  { id:"i2c2",     label:"I2C",       side:Position.Bottom, x:24,  y:92,  color:"#8b5cf6" },
  { id:"oled",     label:"OLED",      side:Position.Bottom, x:41,  y:92,  color:"#6366f1" },
  { id:"sensor1",  label:"Sensor 1",  side:Position.Bottom, x:58,  y:92,  color:"#14b8a6" },
  { id:"sensor2",  label:"Sensor 2",  side:Position.Bottom, x:75,  y:92,  color:"#14b8a6" },
];

// ─── Board node - uses real Kokoon Labs PCB image ─────────────────────────────

const BOARD_ART: Record<string, React.ComponentType> = { arduino_uno: ArduinoUnoSvg, esp32: Esp32DevKitSvg };
const SIDE_POSITION: Record<PinSide, Position> = {
  top: Position.Top, bottom: Position.Bottom, left: Position.Left, right: Position.Right,
};

/** What a wire carries, kept on the edge so the pin's tooltip can name it. */
type WireInfo = { part: string; role: string };

/** Arduino Uno / ESP32: the drawn board with one anchor on every usable pin. */
function PinBoard({ layout, Art }: { layout: BoardLayout; Art: React.ComponentType }) {
  const wired = new Map(useEdges().map((e) => [e.targetHandle, e]));
  return (
    <div
      className="relative select-none"
      style={{
        width: layout.w * layout.scale, height: layout.h * layout.scale,
        filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.45))",
      }}
    >
      <Art />
      {layout.pins.filter((p) => p.gpio !== undefined).map((pin) => {
        const edge = wired.get(pin.id);
        const info = edge?.data as WireInfo | undefined;
        const title = pinTitle(pin) + (info ? `: ${info.part}${info.role ? ` ${info.role}` : ""}` : "");
        const color = (edge?.style?.stroke as string | undefined) ?? "#fbbf24";
        return (
          <Handle
            key={pin.id}
            type="target"
            id={pin.id}
            position={SIDE_POSITION[pin.side]}
            title={title}
            aria-label={title}
            style={{
              // Same numbers the SVG draws the pin hole from.
              left: `${(pin.x / layout.w) * 100}%`,
              top: `${(pin.y / layout.h) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 13, height: 13,
              background: edge ? color : "rgba(251,191,36,0.18)",
              border: `2px solid ${color}`,
              boxShadow: edge ? `0 0 8px ${color}` : "none",
              zIndex: 10,
            }}
          />
        );
      })}
    </div>
  );
}

function BoardNode() {
  const board = useBoard();
  const layout = BOARD_LAYOUTS[board.id];
  // The handles change with the board: React Flow must re-measure them.
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals("board"); }, [board.id, updateNodeInternals]);

  if (layout) return <PinBoard layout={layout} Art={BOARD_ART[board.id]} />;
  return (
    <div className="relative select-none" style={{width:480,height:480}}>
      <img
        src="/assets/kokoon-board.png"
        alt="Kokoon Labs Board"
        draggable={false}
        style={{
          width:"100%", height:"100%",
          objectFit:"contain",
          userSelect:"none", pointerEvents:"none",
          filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.7))",
        }}
      />

      {BOARD_PORTS.map((port)=>(
        <Handle
          key={port.id}
          type="target"
          id={port.id}
          position={port.side}
          style={{
            top: `${port.y}%`,
            left: `${port.x}%`,
            transform: "translate(-50%, -50%)",
            background: port.color,
            width:16, height:16,
            border:`3px solid ${port.color}70`,
            boxShadow:`0 0 10px ${port.color}90, 0 0 20px ${port.color}30`,
            zIndex:10,
          }}
          title={port.label}
        />
      ))}
    </div>
  );
}

// ─── Component node - bare floating image, no card wrapper ───────────────────

/** Pin boards only: the block a part stands for, so toggling it back on restores its pins. */
type LogicRef = { type: string; data: Record<string, unknown> };

function ComponentNode({ id, data }: { id: string; data: { hwComp: HwComponent; color: string; enabled?: boolean; logic?: LogicRef; side?: PinSide } }) {
  const Icon = data.hwComp.icon;
  const { setNodes, getEdges } = useReactFlow();
  const enabled = data.enabled !== false;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newEnabled = !enabled;

    if (!newEnabled) {
      const logicId = _hwToLogic[id];
      if (logicId) {
        _canvasRefGlobal?.current?.removeNode(logicId);
        delete _logicToHw[logicId];
        delete _hwToLogic[id];
        _usedPorts.delete((_edges.find(e => e.source === id)?.targetHandle) ?? "");
      }
    } else {
      const edges = getEdges();
      const edge = edges.find(e => e.source === id);
      const portId = edge?.targetHandle ?? "";
      if (portId && _canvasRefGlobal?.current) {
        const factory = PORT_TO_NODE[portId];
        const { type, data: nodeData } = data.logic ?? (factory
          ? factory(data.hwComp)
          : { type: data.hwComp.nodeType, data: data.hwComp.defaultData });
        const logicId = _canvasRefGlobal.current.addNode(type, nodeData as Record<string, unknown>) ?? "";
        _hwToLogic[id] = logicId;
        _logicToHw[logicId] = id;
        _suppressSyncIds.add(logicId);
        _usedPorts.add(portId);
      }
    }

    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, enabled: newEnabled } } : n));
  }, [id, enabled, data.hwComp, data.logic, getEdges, setNodes]);

  const isWired = getEdges().some(e => e.source === id);

  return (
    <motion.div
      className="relative select-none"
      initial={{ opacity: 0, scale: 0.75, y: 12 }}
      animate={{
        opacity: enabled ? 1 : 0.35,
        scale: 1,
        y: 0,
        filter: enabled ? "none" : "grayscale(0.8)",
      }}
      whileHover={{ scale: 1.06, y: -2 }}
      transition={{ type: "spring", stiffness: 340, damping: 22, mass: 0.7 }}
      style={{ width: 120 }}
    >
      {/* Bare component image - glow via drop-shadow filter */}
      <div
        style={{
          width: 120, height: 80,
          filter: `drop-shadow(0 4px 18px ${data.color}60) drop-shadow(0 0 8px ${data.color}35)`,
        }}
      >
        <Icon />
      </div>

      {/* Label */}
      <div
        className="text-center mt-1 text-[9px] font-bold tracking-wide leading-none"
        style={{ color: data.color + "cc" }}
      >
        {data.hwComp.label}
      </div>

      {/* Enable/disable toggle pill - shown when wired */}
      <AnimatePresence>
        {isWired && (
          <motion.div
            key="toggle-wrap"
            className="nodrag absolute -top-5 left-0 w-full flex justify-center pointer-events-none"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="pointer-events-auto flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              onClick={handleToggle}
              title={enabled ? "Disable" : "Enable"}
              style={{
                background: enabled ? data.color + "22" : "#ffffff0a",
                border: `1px solid ${enabled ? data.color + "55" : "#ffffff18"}`,
                color: enabled ? data.color : "#666",
                backdropFilter: "blur(4px)",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              {/* Toggle track */}
              <span
                className="relative inline-block rounded-full"
                style={{
                  width: 20, height: 10,
                  background: enabled ? data.color + "aa" : "#444",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                <motion.span
                  className="absolute top-[1px] rounded-full bg-white shadow"
                  animate={{ left: enabled ? 10 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{ width: 8, height: 8, position: "absolute" }}
                />
              </span>
              <span>{enabled ? "ON" : "OFF"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection handle - anchored to the image's vertical center (image is 80px
          tall), so it lines up with the component art regardless of label height. */}
      <Handle
        type="source"
        // Parts placed to the right of a pin board face it, so the wire does not cross the part.
        position={data.side === "right" ? Position.Left : Position.Right}
        style={{
          background: data.color,
          width: 14, height: 14,
          border: `2.5px solid ${data.color}50`,
          boxShadow: `0 0 8px ${data.color}80`,
          top: 40,
          transform: "translateY(-50%)",
        }}
      />
    </motion.div>
  );
}

// ─── Node types ───────────────────────────────────────────────────────────────

const NODE_TYPES: NodeTypes = { board: BoardNode, hw_component: ComponentNode };

// ─── Port → logic node factory ────────────────────────────────────────────────

const PORT_TO_NODE: Record<string, (c: HwComponent) => { type: string; data: Record<string, unknown> }> = {
  gpio:      (c) => ({ type: c.nodeType,          data: c.defaultData }),
  neopixel:  ()  => ({ type: "neopixel_led",       data: { pin: NEOPIXEL.pin, count: NEOPIXEL.count } }),
  motor_fr:  ()  => ({ type: "dc_motor_single",    data: { motor: "frontRight", pwm: MOTORS.frontRight.pwm, dir: MOTORS.frontRight.dir } }),
  motor_fl:  ()  => ({ type: "dc_motor_single",    data: { motor: "frontLeft",  pwm: MOTORS.frontLeft.pwm,  dir: MOTORS.frontLeft.dir } }),
  motor_rr:  ()  => ({ type: "dc_motor_single",    data: { motor: "rearRight",  pwm: MOTORS.rearRight.pwm,  dir: MOTORS.rearRight.dir } }),
  motor_rl:  ()  => ({ type: "dc_motor_single",    data: { motor: "rearLeft",   pwm: MOTORS.rearLeft.pwm,   dir: MOTORS.rearLeft.dir } }),
  servo_s1:  ()  => ({ type: "servo_motor",         data: { servoPort: "S1", pin: SERVO_PORTS.S1.pin } }),
  servo_s2:  ()  => ({ type: "servo_motor",         data: { servoPort: "S2", pin: SERVO_PORTS.S2.pin } }),
  servo_s3:  ()  => ({ type: "servo_motor",         data: { servoPort: "S3", pin: SERVO_PORTS.S3.pin } }),
  servo_s4:  ()  => ({ type: "servo_motor",         data: { servoPort: "S4", pin: SERVO_PORTS.S4.pin } }),
  oled:      ()  => ({ type: "oled_display",        data: { scl: OLED.scl, sda: OLED.sda } }),
  i2c2:      (c) => ({ type: c.nodeType,            data: { scl: SENSOR_PORTS["2"].scl, sda: SENSOR_PORTS["2"].sda } }),
  sensor1:   (c) => ({ type: c.nodeType,            data: { port: "1", trig: SENSOR_PORTS["1"].trig, echo: SENSOR_PORTS["1"].echo } }),
  sensor2:   (c) => ({ type: c.nodeType,            data: { port: "2", trig: SENSOR_PORTS["2"].trig, echo: SENSOR_PORTS["2"].echo } }),
  imu:       ()  => ({ type: "imu_sensor",          data: { scl: ONBOARD_IMU.scl, sda: ONBOARD_IMU.sda } }),
};

// ─── nodeType → HwComponent lookup (for blocks→hardware sync) ─────────────────

const _nodeTypeToHwComp: Record<string, HwComponent> = {};
// Same lookup for boards with per-pin anchors: more parts, plus block aliases.
const _pinComp: Record<string, HwComponent> = {};
for (const comp of HW_COMPONENTS) {
  if (!comp.pinOnly) _nodeTypeToHwComp[comp.nodeType] = comp;
  for (const type of [comp.nodeType, ...(comp.also ?? [])]) {
    if (PIN_WIRING[type]) _pinComp[type] = comp;
  }
}

// ─── Port auto-assignment helpers ─────────────────────────────────────────────

const _leftPorts  = new Set(["neopixel","motor_fr","motor_fl","motor_rr","motor_rl"]);
const _bottomPorts = new Set(["servo_s1","servo_s2","servo_s3","servo_s4","i2c2","oled","sensor1","sensor2"]);

function _getBestPort(nodeType: string, data: Record<string, unknown>): string | null {
  switch (nodeType) {
    case "dc_motor_single": {
      const motorMap: Record<string, string> = {
        frontRight: "motor_fr", frontLeft: "motor_fl",
        rearRight: "motor_rr", rearLeft: "motor_rl",
      };
      const specific = motorMap[data.motor as string];
      if (specific && !_usedPorts.has(specific)) return specific;
      return ["motor_fr","motor_fl","motor_rr","motor_rl"].find(p => !_usedPorts.has(p)) ?? null;
    }
    case "servo_motor": {
      const servoMap: Record<string, string> = { S1:"servo_s1", S2:"servo_s2", S3:"servo_s3", S4:"servo_s4" };
      const specific = servoMap[data.port as string];
      if (specific && !_usedPorts.has(specific)) return specific;
      return ["servo_s1","servo_s2","servo_s3","servo_s4"].find(p => !_usedPorts.has(p)) ?? null;
    }
    case "neopixel_led":  return _usedPorts.has("neopixel") ? null : "neopixel";
    case "oled_display":  return _usedPorts.has("oled") ? (_usedPorts.has("i2c2") ? null : "i2c2") : "oled";
    case "imu_sensor":    return _usedPorts.has("imu") ? null : "imu";
    case "ultrasonic":
    case "soil_moisture":
    case "analog_sensor": {
      const pref = (data.port as string) === "2" ? "sensor2" : "sensor1";
      const alt  = pref === "sensor2" ? "sensor1" : "sensor2";
      if (!_usedPorts.has(pref)) return pref;
      if (!_usedPorts.has(alt)) return alt;
      return null;
    }
    case "ir_sensor":
    case "push_button":   return "gpio"; // gpio can host multiple (best-effort)
    default: return null;
  }
}

function _getAutoPosition(portId: string): { x: number; y: number } {
  const hwCount = _nodes.filter(n => n.type === "hw_component").length;
  if (_leftPorts.has(portId))   return { x: 20,  y: 60 + hwCount * 200 };
  if (_bottomPorts.has(portId)) return { x: 60 + hwCount * 200, y: 720 };
  return { x: 980, y: 60 + hwCount * 200 };
}

// ─── Module-level persistence & cross-canvas sync state ───────────────────────

const BOARD_NODE: Node = {
  id: "board", type: "board",
  position: { x: 300, y: 30 },
  data: {}, draggable: false, selectable: false,
};

let _nodes: Node[] = [BOARD_NODE];
let _edges: Edge[] = [];
let _wired: { label: string; color: string }[] = [];

// hw canvas id → logic canvas id (hw-initiated wiring)
let _hwToLogic: Record<string, string> = {};
// logic canvas id → hw canvas id (blocks-initiated or after sync)
let _logicToHw: Record<string, string> = {};
// ports currently in use
let _usedPorts: Set<string> = new Set();
// logic node IDs to skip in the next onFlowChange diff (prevent circular sync)
let _suppressSyncIds: Set<string> = new Set();

// Live setters - registered by HardwareCanvas when mounted
let _setNodesRef: ((fn: (ns: Node[]) => Node[]) => void) | null = null;
let _setEdgesRef: ((fn: (es: Edge[]) => Edge[]) => void) | null = null;
// Global canvas ref so ComponentNode toggle can call addNode/removeNode
let _canvasRefGlobal: React.RefObject<NodeCanvasRef | null> | null = null;

// ─── Exported sync API (called from EditorPage) ───────────────────────────────

/** Returns true if this logic node was just created by hardware wiring (skip blocks→hw sync). */
export function isFlowSyncSuppressed(logicId: string): boolean {
  if (_suppressSyncIds.has(logicId)) {
    _suppressSyncIds.delete(logicId);
    return true;
  }
  return false;
}

// ─── Boards with per-pin anchors (Arduino Uno, ESP32) ─────────────────────────

// Board the hardware canvas was last built for. Handle ids differ per board.
let _boardId: string | null = null;

// Update the module copy at once (several parts can be added in one pass,
// before React re-renders) and the mounted canvas if there is one.
function _applyNodes(fn: (ns: Node[]) => Node[]) { _nodes = fn(_nodes); _setNodesRef?.(fn); }
function _applyEdges(fn: (es: Edge[]) => Edge[]) { _edges = fn(_edges); _setEdgesRef?.(fn); }

/** Board changed: wires point at handles that no longer exist. Drop every mirrored part; the caller re-adds them. */
function _syncBoard() {
  const id = getBoard().id;
  if (_boardId === id) return;
  const first = _boardId === null;
  _boardId = id;
  if (first) return;
  const stale = new Set(Object.keys(_hwToLogic));
  _hwToLogic = {};
  _logicToHw = {};
  _usedPorts = new Set();
  _applyNodes(ns => ns.filter(n => !stale.has(n.id)));
  _applyEdges(() => []);
}

/** One wire per pin the part uses. A pin the board does not have gets no wire. */
function _pinEdges(hwId: string, comp: HwComponent, wires: Wire[], layout: BoardLayout): Edge[] {
  const edges: Edge[] = [];
  for (const w of wires) {
    const pin = pinForGpio(layout, w.gpio);
    if (!pin || edges.some(e => e.targetHandle === pin.id)) continue;
    edges.push({
      id: `e_${hwId}_${pin.id}`,
      source: hwId, target: "board",
      sourceHandle: null, targetHandle: pin.id,
      animated: true,
      style: { stroke: comp.color, strokeWidth: 2.5 },
      data: { part: comp.label, role: w.label } satisfies WireInfo,
    });
  }
  return edges;
}

/** Next free slot beside the edge of the board the part's first pin is on. */
function _pinAutoPosition(side: PinSide, layout: BoardLayout): { x: number; y: number } {
  const k = _nodes.filter(n => n.type === "hw_component" && n.data.side === side).length;
  const { x, y } = BOARD_NODE.position;
  const w = layout.w * layout.scale;
  const h = layout.h * layout.scale;
  switch (side) {
    case "top":    return { x: x + k * 150, y: y - 180 };
    case "bottom": return { x: x + k * 150, y: y + h + 70 };
    case "left":   return { x: x - 230, y: y + k * 130 };
    case "right":  return { x: x + w + 110, y: y + k * 130 };
  }
}

function _addPinHwNode(logicId: string, nodeType: string, data: Record<string, unknown>, layout: BoardLayout): void {
  const hwComp = _pinComp[nodeType];
  if (!hwComp) return; // Not drawn on this board
  const hwId = `hw_${crypto.randomUUID().slice(0, 8)}`;
  const edges = _pinEdges(hwId, hwComp, wiresFor(nodeType, data, getBoard()), layout);
  if (!edges.length) return; // No pin to attach to: no part rather than a dangling one
  const side = layout.pins.find(p => p.id === edges[0].targetHandle)?.side ?? "right";
  const newNode: Node = {
    id: hwId, type: "hw_component",
    position: _pinAutoPosition(side, layout),
    data: { hwComp, label: hwComp.label, color: hwComp.color, enabled: true, side, logic: { type: nodeType, data } satisfies LogicRef },
  };
  _logicToHw[logicId] = hwId;
  _hwToLogic[hwId] = logicId;
  _applyNodes(ns => [...ns, newNode]);
  _applyEdges(es => [...es, ...edges]);
}

/**
 * Called from EditorPage when a node is added to the blocks canvas by the user.
 * Creates the matching hw component node + edge to the best available board port
 * (Kokoon) or to the pins the block uses (Arduino Uno, ESP32).
 */
export function syncAddHwNode(logicId: string, nodeType: string, data: Record<string, unknown>): void {
  _syncBoard();
  if (_logicToHw[logicId]) return; // Already synced

  const layout = BOARD_LAYOUTS[getBoard().id];
  if (layout) return _addPinHwNode(logicId, nodeType, data, layout);

  const hwComp = _nodeTypeToHwComp[nodeType];
  if (!hwComp) return; // Not a hw-mappable type

  const portId = _getBestPort(nodeType, data);
  if (!portId) return; // No available port
  // The port must exist as a handle on the board (onboard parts such as the IMU
  // have none). Otherwise the component would be drawn with a wire to nowhere.
  if (!BOARD_PORTS.some((p) => p.id === portId)) return;

  const hwId = `hw_${crypto.randomUUID().slice(0, 8)}`;
  const newNode: Node = {
    id: hwId, type: "hw_component",
    position: _getAutoPosition(portId),
    data: { hwComp, label: hwComp.label, color: hwComp.color, enabled: true },
  };
  const newEdge: Edge = {
    id: `e_${hwId}_board`,
    source: hwId, target: "board",
    sourceHandle: null, targetHandle: portId,
    animated: true,
    style: { stroke: hwComp.color, strokeWidth: 2.5 },
  };

  _logicToHw[logicId] = hwId;
  _hwToLogic[hwId] = logicId;
  _usedPorts.add(portId);

  if (_setNodesRef) {
    _setNodesRef(ns => [...ns, newNode]);
    _setEdgesRef?.(es => [...es, newEdge]);
  } else {
    _nodes = [..._nodes, newNode];
    _edges = [..._edges, newEdge];
  }
}

/**
 * Called from EditorPage when a node is removed from the blocks canvas.
 * Removes the matching hw component node (if any).
 */
export function syncRemoveHwNode(logicId: string): void {
  const hwId = _logicToHw[logicId];
  if (!hwId) return; // No hw counterpart

  const portId = _edges.find(e => e.source === hwId)?.targetHandle ?? "";
  if (portId) _usedPorts.delete(portId);

  delete _logicToHw[logicId];
  delete _hwToLogic[hwId];

  if (_setNodesRef) {
    _setNodesRef(ns => ns.filter(n => n.id !== hwId));
    _setEdgesRef?.(es => es.filter(e => e.source !== hwId && e.target !== hwId));
  } else {
    _nodes = _nodes.filter(n => n.id !== hwId);
    _edges = _edges.filter(e => e.source !== hwId && e.target !== hwId);
  }
}

/**
 * Full reconcile: called every time the user switches to the hardware view.
 * Ensures the hw canvas exactly mirrors the current blocks canvas state -
 * handles any drift that accumulated while the hardware canvas was unmounted.
 */
export function resyncHwFromBlocks(logicNodes: Node[]): void {
  _syncBoard();
  const logicNodeMap = new Map(logicNodes.map(n => [n.id, n]));

  // Remove hw nodes whose logic counterpart no longer exists in blocks canvas
  for (const logicId of Object.keys(_logicToHw)) {
    if (!logicNodeMap.has(logicId)) {
      syncRemoveHwNode(logicId);
    }
  }

  // Add hw nodes for any hw-mappable blocks node that doesn't have one yet
  for (const node of logicNodes) {
    if (!_logicToHw[node.id]) {
      syncAddHwNode(node.id, node.type ?? "", node.data as Record<string, unknown>);
    }
  }

  // Pin boards: a pin edited on a block moves that part's wires to the new pin.
  const layout = BOARD_LAYOUTS[getBoard().id];
  if (!layout) return;
  const fresh = new Map<string, { edges: Edge[]; logic: LogicRef }>();
  for (const node of logicNodes) {
    const hwId = _logicToHw[node.id];
    const comp = _pinComp[node.type ?? ""];
    if (!hwId || !comp) continue;
    const data = node.data as Record<string, unknown>;
    fresh.set(hwId, {
      edges: _pinEdges(hwId, comp, wiresFor(node.type ?? "", data, getBoard()), layout),
      logic: { type: node.type ?? "", data },
    });
  }
  _applyEdges(es => [...es.filter(e => !fresh.has(e.source)), ...[...fresh.values()].flatMap(f => f.edges)]);
  _applyNodes(ns => ns.map(n => fresh.has(n.id) ? { ...n, data: { ...n.data, logic: fresh.get(n.id)?.logic } } : n));
}

// ─── Inner hardware canvas ────────────────────────────────────────────────────

interface InnerProps {
  canvasRef: React.RefObject<NodeCanvasRef | null>;
  onWired: (label: string, color: string) => void;
}

function HardwareCanvas({ canvasRef, onWired }: InnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(_nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(_edges);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const board = useBoard();
  const layout = BOARD_LAYOUTS[board.id];
  // Why the last wire was refused (pin boards), shown in place of the help line.
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 5000);
    return () => clearTimeout(t);
  }, [hint]);

  // Persist state to module-level so it survives unmount
  useEffect(() => { _nodes = nodes; }, [nodes]);
  useEffect(() => { _edges = edges; }, [edges]);

  // Register live setters and global canvas ref
  useEffect(() => {
    _setNodesRef = setNodes;
    _setEdgesRef = setEdges;
    _canvasRefGlobal = canvasRef;

    // Rebuild _usedPorts and _logicToHw from persisted state
    _usedPorts = new Set(
      _edges.filter(e => e.target === "board" && e.targetHandle).map(e => e.targetHandle as string)
    );
    _logicToHw = {};
    for (const [hwId, logicId] of Object.entries(_hwToLogic)) {
      _logicToHw[logicId] = hwId;
    }

    return () => {
      _setNodesRef = null;
      _setEdgesRef = null;
      _canvasRefGlobal = null;
    };
  }, [setNodes, setEdges, canvasRef]);

  // Board switched while this view is open: rebuild the parts for the new board's pins.
  const shownBoard = useRef(board.id);
  useEffect(() => {
    const workspace = canvasRef.current?.getWorkspace();
    if (workspace) resyncHwFromBlocks(workspace.nodes);
    if (shownBoard.current !== board.id) {
      shownBoard.current = board.id;
      requestAnimationFrame(() => fitView({ padding: 0.12 }));
    }
  }, [board.id, canvasRef, fitView]);

  const onConnect = useCallback((connection: Connection) => {
    const src = nodes.find(n => n.id === connection.source);
    if (!src || src.type !== "hw_component") return;
    const hwComp = (src.data as { hwComp: HwComponent }).hwComp;
    const portId = connection.targetHandle ?? "";

    if (layout) {
      // Arduino Uno / ESP32: the wire lands on a real pin and that pin goes into the block.
      const pin = layout.pins.find(p => p.id === portId);
      if (!pin) return;
      if (_hwToLogic[src.id]) { setHint(`${hwComp.label} is already wired. Delete its wire to move it.`); return; }
      const usedGpios = new Set(edges.map(e => layout.pins.find(p => p.id === e.targetHandle)?.gpio ?? -1));
      const data = dataForPin(hwComp.nodeType, pin, board, usedGpios);
      if (typeof data === "string") { setHint(`${hwComp.label} ${data}.`); return; }
      const wires = _pinEdges(src.id, hwComp, wiresFor(hwComp.nodeType, data, board), layout);
      if (!wires.length) return;
      setHint(null);
      setEdges(es => [...es.filter(e => e.source !== src.id), ...wires]);
      const logicId = canvasRef.current?.addNode(hwComp.nodeType, data) ?? "";
      _hwToLogic[src.id] = logicId;
      _logicToHw[logicId] = src.id;
      _suppressSyncIds.add(logicId);
      const logic: LogicRef = { type: hwComp.nodeType, data };
      setNodes(ns => ns.map(n => n.id === src.id ? { ...n, data: { ...n.data, enabled: true, logic } } : n));
      onWired(hwComp.label, hwComp.color);
      return;
    }

    if (hwComp.compatiblePorts.length && !hwComp.compatiblePorts.includes(portId)) return;

    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: hwComp.color, strokeWidth: 2.5 } }, eds));
    _usedPorts.add(portId);

    const factory = PORT_TO_NODE[portId];
    const { type, data } = factory ? factory(hwComp) : { type: hwComp.nodeType, data: hwComp.defaultData };
    const logicId = canvasRef.current?.addNode(type, data) ?? "";

    _hwToLogic[src.id] = logicId;
    _logicToHw[logicId] = src.id;
    _suppressSyncIds.add(logicId); // Prevent EditorPage from re-adding hw node

    onWired(hwComp.label, hwComp.color);
  }, [nodes, edges, layout, board, canvasRef, onWired, setEdges, setNodes]);

  const onNodesDelete = useCallback((deleted: Node[]) => {
    deleted.forEach(n => {
      const logicId = _hwToLogic[n.id];
      if (logicId) {
        const portId = _edges.find(e => e.source === n.id)?.targetHandle ?? "";
        if (portId) _usedPorts.delete(portId);
        canvasRef.current?.removeNode(logicId);
        delete _logicToHw[logicId];
        delete _hwToLogic[n.id];
      }
    });
  }, [canvasRef]);

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    deleted.forEach(e => {
      if (e.target === "board" && e.targetHandle) {
        _usedPorts.delete(e.targetHandle);
      }
      // When edge removed but node kept: remove logic node too
      const logicId = _hwToLogic[e.source];
      if (logicId) {
        canvasRef.current?.removeNode(logicId);
        delete _logicToHw[logicId];
        delete _hwToLogic[e.source];
      }
    });
    // Pin boards: a part can have two wires (TRIG/ECHO, SDA/SCL). Removing one removes both.
    if (layout) {
      const sources = new Set(deleted.map(e => e.source));
      setEdges(es => es.filter(e => !sources.has(e.source)));
    }
  }, [canvasRef, layout, setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/hw-component");
    if (!raw) return;
    const full = HW_COMPONENTS.find(c => c.id === JSON.parse(raw).id);
    if (!full) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes(nds => [...nds, {
      id: `hw_${crypto.randomUUID().slice(0, 8)}`,
      type: "hw_component", position,
      data: { hwComp: full, label: full.label, color: full.color, enabled: true },
    }]);
  }, [screenToFlowPosition, setNodes]);

  // The view can mount while its tab is hidden (zero size), which leaves React
  // Flow's initial fit wrong. Fit again whenever the pane goes from hidden to shown.
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let wasHidden = true;
    const ro = new ResizeObserver(([entry]) => {
      const shown = entry.contentRect.width > 0 && entry.contentRect.height > 0;
      if (shown && wasHidden) requestAnimationFrame(() => fitView({ padding: 0.12 }));
      wasHidden = !shown;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitView]);

  return (
    <div ref={wrapRef} className="flex-1 h-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={NODE_TYPES}
        connectionRadius={CONNECTION_RADIUS}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background id="hw-dots" color="var(--k-dim)" gap={52} size={1.5} variant={BackgroundVariant.Dots} style={{ backgroundColor: "var(--k-base-100)" }} />
        <MiniMap
          nodeColor="var(--k-primary)"
          maskColor="color-mix(in srgb, var(--k-base-100) 78%, transparent)"
          style={{ backgroundColor: "var(--k-base-300)", border: "1px solid var(--k-border)", borderRadius: "8px" }}
        />
        <div role="status" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full px-5 py-2 text-[11px] text-hint border border-subtle bg-panel/90 shadow pointer-events-none backdrop-blur-sm">
          {hint
            ? <span className="font-semibold text-[var(--k-text)]">{hint}</span>
            : `Drag a component · wire handle to board ${layout ? "pin" : "port"} · toggle ON/OFF · Delete removes from both views`}
        </div>
      </ReactFlow>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

interface HardwareViewProps { canvasRef: React.RefObject<NodeCanvasRef | null> }

export function HardwareView({ canvasRef }: HardwareViewProps) {
  const [wired, setWired] = useState<{ label: string; color: string }[]>(_wired);
  const handleWired = useCallback((label: string, color: string) => {
    setWired(prev => { const next = [...prev, { label, color }]; _wired = next; return next; });
  }, []);

  // Pin boards list the parts that can be wired pin by pin, with the pins a fresh block uses.
  const board = useBoard();
  const layout = BOARD_LAYOUTS[board.id];
  const parts = HW_COMPONENTS.filter(c => (layout ? !!PIN_WIRING[c.nodeType] : !c.pinOnly));
  const hintFor = (comp: HwComponent) => !layout ? comp.portHint : wiresFor(comp.nodeType, {}, board)
    .map(w => `${w.label || "Pin"} ${pinForGpio(layout, w.gpio)?.label ?? w.gpio}`).join(" · ");

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--k-base-100)]">
      {/* Palette */}
      <aside className="w-56 shrink-0 border-r border-[var(--k-border)] flex flex-col overflow-hidden" style={{ background: "var(--k-base-200)" }}>
        <div className="px-4 py-3 border-b border-[var(--k-border)]">
          <p className="text-[11px] font-bold text-body uppercase tracking-widest">Components</p>
          <p className="text-[11px] text-hint mt-0.5">Drag · Drop · Wire · Toggle</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {parts.map(comp => {
            const Icon = comp.icon;
            return (
              <div
                key={comp.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData("application/hw-component", JSON.stringify({ id: comp.id }));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="flex items-center gap-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] p-2.5"
                style={{
                  background: `linear-gradient(135deg,${comp.color}08,${comp.color}04)`,
                  borderColor: comp.color + "25",
                  boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
                }}
              >
                <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 52, height: 40, background: "#111" }}>
                  <Icon />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold leading-tight" style={{ color: comp.color }}>{comp.label}</div>
                  <div className="text-[11px] text-hint leading-tight mt-0.5">{hintFor(comp)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {wired.length > 0 && (
          <div className="border-t border-[var(--k-border)] p-3">
            <p className="text-[11px] font-bold text-hint uppercase tracking-widest mb-2">Connected</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {wired.slice().reverse().map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: w.color }} />
                  <span className="text-sub truncate">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Canvas */}
      <ReactFlowProvider>
        <HardwareCanvas canvasRef={canvasRef} onWired={handleWired} />
      </ReactFlowProvider>
    </div>
  );
}
