import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap,
  useNodesState, useEdgesState, addEdge,
  type Node, type Edge, type Connection, type NodeTypes,
  Handle, Position, useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import {
  NEOPIXEL, SERVO_PORTS, MOTORS, SENSOR_PORTS, OLED, ONBOARD_IMU,
} from "@/entities/board/model/hardwareConfig";

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
      {["VCC","TRG","ECH","GND"].map((p,i)=>(
        <g key={p}>
          <rect x={40+i*9} y="55" width="7" height="8" rx="0.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
          <text x={43.5+i*9} y="61" textAnchor="middle" fontSize="3.5" fill="#333" fontFamily="monospace">{p}</text>
        </g>
      ))}
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
      <rect x="90" y="28" width="12" height="20" rx="2" fill="#f5f5f5" stroke="#bdbdbd" strokeWidth="0.8"/>
      <rect x="92" y="31" width="8" height="5" rx="0.5" fill="#ff6d00"/>
      <rect x="92" y="38" width="8" height="5" rx="0.5" fill="#d32f2f"/>
      <rect x="92" y="44" width="8" height="5" rx="0.5" fill="#424242"/>
      <line x1="102" y1="33" x2="130" y2="30" stroke="#ff6d00" strokeWidth="2"/>
      <line x1="102" y1="40" x2="130" y2="42" stroke="#d32f2f" strokeWidth="2"/>
      <line x1="102" y1="47" x2="130" y2="54" stroke="#424242" strokeWidth="2"/>
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
      <rect x="88" y="21" width="14" height="10" rx="2" fill="#222" stroke="#444" strokeWidth="0.8"/>
      <rect x="90" y="23" width="4" height="6" rx="1" fill="#e53935"/>
      <rect x="96" y="23" width="4" height="6" rx="1" fill="#1565c0"/>
      <rect x="84" y="34" width="16" height="18" rx="2" fill="#2b2b2b" stroke="#4a4a4a" strokeWidth="0.8"/>
      <circle cx="92" cy="43" r="5" fill="#5a5a5a" stroke="#8a8a8a" strokeWidth="0.5"/>
      <circle cx="92" cy="43" r="2" fill="#222"/>
      <rect x="102" y="31" width="16" height="4" rx="1" fill="#b7791f"/>
      <line x1="118" y1="33" x2="120" y2="33" stroke="#b7791f" strokeWidth="2"/>
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
      {["DI","5V","GND","DO"].map((p,i)=>{
        const angle=(i*90-45)*Math.PI/180;
        return (
          <g key={p}>
            <rect x={45+14*Math.cos(angle)-6} y={45+14*Math.sin(angle)-4} width="12" height="8" rx="1"
              fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
            <text x={45+14*Math.cos(angle)} y={45+14*Math.sin(angle)+1.5}
              textAnchor="middle" fontSize="4" fill="#333" fontFamily="monospace">{p}</text>
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
      {["VCC","GND","DO","AO"].map((p,i)=>(
        <g key={p}>
          <rect x={8+i*14} y="47" width="10" height="9" rx="0.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
          <text x={13+i*14} y="54" textAnchor="middle" fontSize="4" fill="#333" fontFamily="monospace">{p}</text>
        </g>
      ))}
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
      {["GND","VCC","SCL","SDA"].map((p,i)=>(
        <g key={p}>
          <rect x={40+i*11} y="57" width="9" height="8" rx="0.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
          <text x={44.5+i*11} y="63" textAnchor="middle" fontSize="3.5" fill="#333" fontFamily="monospace">{p}</text>
        </g>
      ))}
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
      {["AO","DO","GND","VCC"].map((p,i)=>(
        <g key={p}>
          <rect x={8+i*14} y="46" width="10" height="8" rx="0.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
          <text x={13+i*14} y="52" textAnchor="middle" fontSize="3.5" fill="#333" fontFamily="monospace">{p}</text>
        </g>
      ))}
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
      {["AO","DO","GND","VCC"].map((p,i)=>(
        <g key={p}>
          <rect x={5+i*20} y="52" width="14" height="10" rx="0.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
          <text x={12+i*20} y="59" textAnchor="middle" fontSize="4" fill="#333" fontFamily="monospace">{p}</text>
        </g>
      ))}
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
      {["VCC","GND","SCL","SDA"].map((p,i)=>(
        <g key={p}>
          <rect x={5+i*21} y="61" width="14" height="9" rx="0.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5"/>
          <text x={12+i*21} y="68" textAnchor="middle" fontSize="4" fill="#333" fontFamily="monospace">{p}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Component catalogue ──────────────────────────────────────────────────────

interface HwComponent {
  id: string; label: string; nodeType: string;
  icon: React.ComponentType; defaultData: Record<string, unknown>;
  portHint: string; color: string; compatiblePorts: string[];
}

const HW_COMPONENTS: HwComponent[] = [
  { id:"ultrasonic", label:"Ultrasonic",    nodeType:"ultrasonic",      icon:UltrasonicImg, defaultData:{port:"1"},                                  portHint:"Sensor 1 / 2",  color:"#7c3aed", compatiblePorts:["sensor1","sensor2"] },
  { id:"ir_sensor",  label:"IR Sensor",     nodeType:"ir_sensor",       icon:IRSensorImg,   defaultData:{},                                          portHint:"GPIO",          color:"#ea580c", compatiblePorts:["gpio"] },
  { id:"button",     label:"Push Button",   nodeType:"push_button",     icon:ButtonImg,     defaultData:{},                                          portHint:"GPIO",          color:"#2563eb", compatiblePorts:["gpio"] },
  { id:"soil",       label:"Soil Moisture", nodeType:"soil_moisture",   icon:SoilImg,       defaultData:{port:"1"},                                  portHint:"Sensor 1 / 2",  color:"#16a34a", compatiblePorts:["sensor1","sensor2"] },
  { id:"analog",     label:"Analog Sensor", nodeType:"analog_sensor",   icon:AnalogImg,     defaultData:{port:"1"},                                  portHint:"Sensor 1 / 2",  color:"#0284c7", compatiblePorts:["sensor1","sensor2"] },
  { id:"imu",        label:"IMU Sensor",    nodeType:"imu_sensor",      icon:IMUImg,        defaultData:{scl:ONBOARD_IMU.scl,sda:ONBOARD_IMU.sda},  portHint:"IMU",           color:"#0891b2", compatiblePorts:["imu"] },
  { id:"oled",       label:"OLED 128×64",   nodeType:"oled_display",    icon:OLEDImg,       defaultData:{scl:OLED.scl,sda:OLED.sda},                portHint:"OLED / I2C",    color:"#4f46e5", compatiblePorts:["oled","i2c2"] },
  { id:"neopixel",   label:"NeoPixel",      nodeType:"neopixel_led",    icon:NeoPixelImg,   defaultData:{pin:NEOPIXEL.pin},                         portHint:"NeoPixel",      color:"#9333ea", compatiblePorts:["neopixel"] },
  { id:"dc_motor",   label:"DC Motor",      nodeType:"dc_motor_single", icon:MotorImg,      defaultData:{},                                          portHint:"Motor FR–RL",   color:"#dc2626", compatiblePorts:["motor_fr","motor_fl","motor_rr","motor_rl"] },
  { id:"servo",      label:"Servo Motor",   nodeType:"servo_motor",     icon:ServoImg,      defaultData:{},                                          portHint:"Servo S1–S4",   color:"#d97706", compatiblePorts:["servo_s1","servo_s2","servo_s3","servo_s4"] },
];

// ─── Board port positions ─────────────────────────────────────────────────────

const BOARD_PORTS = [
  { id:"gpio",     label:"GPIO 01–13", side:Position.Top,    offset:40, color:"#22c55e" },
  { id:"battery",  label:"Battery",    side:Position.Top,    offset:80, color:"#3b82f6" },
  { id:"neopixel", label:"NeoPixel",   side:Position.Left,   offset:14, color:"#a855f7" },
  { id:"i2s",      label:"I2S",        side:Position.Left,   offset:24, color:"#f97316" },
  { id:"motor_fr", label:"Motor FR",   side:Position.Left,   offset:37, color:"#ef4444" },
  { id:"motor_fl", label:"Motor FL",   side:Position.Left,   offset:48, color:"#ef4444" },
  { id:"motor_rr", label:"Motor RR",   side:Position.Left,   offset:59, color:"#ef4444" },
  { id:"motor_rl", label:"Motor RL",   side:Position.Left,   offset:70, color:"#ef4444" },
  { id:"usbc",     label:"USB-C",      side:Position.Right,  offset:12, color:"#64748b" },
  { id:"imu",      label:"IMU",        side:Position.Right,  offset:26, color:"#06b6d4" },
  { id:"servo_s1", label:"Servo S1",   side:Position.Right,  offset:48, color:"#eab308" },
  { id:"servo_s2", label:"Servo S2",   side:Position.Right,  offset:60, color:"#eab308" },
  { id:"servo_s3", label:"Servo S3",   side:Position.Right,  offset:72, color:"#eab308" },
  { id:"servo_s4", label:"Servo S4",   side:Position.Right,  offset:84, color:"#eab308" },
  { id:"oled",     label:"OLED",       side:Position.Bottom, offset:12, color:"#6366f1" },
  { id:"i2c2",     label:"I2C-2",      side:Position.Bottom, offset:29, color:"#8b5cf6" },
  { id:"sensor2",  label:"Sensor 2",   side:Position.Bottom, offset:56, color:"#14b8a6" },
  { id:"sensor1",  label:"Sensor 1",   side:Position.Bottom, offset:78, color:"#14b8a6" },
];

// ─── Board node (close PCB replica) ──────────────────────────────────────────

function BoardLabel({ x, y, text, color, anchor = "middle" }: { x: number; y: number; text: string; color: string; anchor?: "inherit" | "end" | "middle" | "start" }) {
  const w = text.length * 6.2 + 10;
  return (
    <g>
      <rect x={anchor === "end" ? x - w : anchor === "start" ? x : x - w/2} y={y - 9} width={w} height={13} rx="3"
        fill={color} opacity="0.18"/>
      <text x={x} y={y} textAnchor={anchor} fontSize="8.5" fontWeight="bold" fill={color}
        fontFamily="'Courier New',monospace" letterSpacing="0.5">{text}</text>
    </g>
  );
}

// Clean white port connector box — left edge
function PortLeft({ y, label, color }: { y: number; label: string; color: string }) {
  const w = 62; const h = 22;
  return (
    <g>
      <rect x="2" y={y - h / 2} width={w} height={h} rx="3"
        fill="#e8e8e8" stroke={color} strokeWidth="1.3"/>
      <rect x="4" y={y - h / 2 + 2} width={w - 4} height={h - 4} rx="2"
        fill="#f2f2f2"/>
      <text x={w / 2 + 2} y={y + 4} textAnchor="middle" fontSize="8"
        fill="#333" fontFamily="'Courier New',monospace" fontWeight="bold">{label}</text>
    </g>
  );
}

// Clean white port connector box — bottom edge
function PortBottom({ x, label, color }: { x: number; label: string; color: string }) {
  const w = 54; const h = 26;
  return (
    <g>
      <rect x={x - w / 2} y="528" width={w} height={h} rx="3"
        fill="#e8e8e8" stroke={color} strokeWidth="1.3"/>
      <rect x={x - w / 2 + 2} y="530" width={w - 4} height={h - 4} rx="2"
        fill="#f2f2f2"/>
      <text x={x} y="544" textAnchor="middle" fontSize="8"
        fill="#333" fontFamily="'Courier New',monospace" fontWeight="bold">{label}</text>
    </g>
  );
}

function BoardNode() {
  return (
    <div className="relative select-none" style={{width:500,height:560}}>
      <svg viewBox="0 0 500 560" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="pcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d7038"/>
            <stop offset="45%" stopColor="#145228"/>
            <stop offset="100%" stopColor="#1d7038"/>
          </linearGradient>
          <linearGradient id="espGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cdcdcd"/>
            <stop offset="100%" stopColor="#ababab"/>
          </linearGradient>
        </defs>

        <rect x="3" y="3" width="494" height="554" rx="12"
          fill="url(#pcbGrad)" stroke="#0a3318" strokeWidth="2.5"
          style={{filter:"drop-shadow(0 6px 18px rgba(0,0,0,0.7))"}}/>

        {Array.from({length:31}).map((_,i)=>(
          <line key={`v${i}`} x1={16*i+8} y1="3" x2={16*i+8} y2="557" stroke="#fff" strokeWidth="0.4" opacity="0.04"/>
        ))}
        {Array.from({length:35}).map((_,i)=>(
          <line key={`h${i}`} x1="3" y1={16*i+8} x2="497" y2={16*i+8} stroke="#fff" strokeWidth="0.4" opacity="0.04"/>
        ))}

        {[[18,18],[482,18],[18,542],[482,542]].map(([cx,cy],i)=>(
          <g key={i}>
            <circle cx={cx} cy={cy} r="11" fill="#0a1f0e" stroke="#143d1c" strokeWidth="1"/>
            <circle cx={cx} cy={cy} r="7" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.8"/>
            <line x1={cx-4} y1={cy} x2={cx+4} y2={cy} stroke="#555" strokeWidth="1.2"/>
            <line x1={cx} y1={cy-4} x2={cx} y2={cy+4} stroke="#555" strokeWidth="1.2"/>
          </g>
        ))}

        {/* ─── TOP: GPIO header ─── */}
        <BoardLabel x={210} y={18} text="GPIO  01 – 13" color="#4ade80"/>
        <rect x="78" y="22" width="264" height="28" rx="3" fill="#111" stroke="#333" strokeWidth="1.2"/>
        {Array.from({length:13}).map((_,i)=>(
          <g key={i}>
            <rect x={83+i*19} y="24" width="16" height="10" rx="1.2" fill="#0a0a0a" stroke="#222" strokeWidth="0.6"/>
            <rect x={83+i*19} y="35" width="16" height="10" rx="1.2" fill="#0a0a0a" stroke="#222" strokeWidth="0.6"/>
          </g>
        ))}
        {["GND","13","11","12","10","09","07","06","05","04","03","02","01"].map((lbl,i)=>(
          <text key={i} x={91+i*19} y="58" textAnchor="middle" fontSize="7" fill="#4ade80"
            fontFamily="'Courier New',monospace" opacity="0.75" fontWeight="bold">{lbl}</text>
        ))}

        {/* ─── TOP RIGHT: Battery port box ─── */}
        <rect x="374" y="20" width="52" height="24" rx="3"
          fill="#e8e8e8" stroke="#3b82f6" strokeWidth="1.3"/>
        <rect x="376" y="22" width="48" height="20" rx="2" fill="#f2f2f2"/>
        <text x="400" y="35" textAnchor="middle" fontSize="8"
          fill="#333" fontFamily="'Courier New',monospace" fontWeight="bold">BATTERY</text>

        {/* ─── LEFT EDGE: port boxes ─── */}
        <PortLeft y={78}  label="NEOPIXEL" color="#a855f7"/>
        <PortLeft y={134} label="I2S"      color="#f97316"/>
        <PortLeft y={207} label="MTR  FR"  color="#ef4444"/>
        <PortLeft y={269} label="MTR  FL"  color="#ef4444"/>
        <PortLeft y={330} label="MTR  RR"  color="#ef4444"/>
        <PortLeft y={392} label="MTR  RL"  color="#ef4444"/>

        {/* ─── CENTER: ESP32-S3 WROOM module ─── */}
        <rect x="145" y="130" width="220" height="210" rx="5" fill="url(#espGrad)" stroke="#888" strokeWidth="2"/>
        <rect x="150" y="135" width="210" height="200" rx="4" fill="#c4c4c4"/>
        {Array.from({length:11}).map((_,i)=>(
          <line key={i} x1={154+i*18} y1="135" x2={154+i*18} y2="335" stroke="#b4b4b4" strokeWidth="0.6" opacity="0.5"/>
        ))}
        {Array.from({length:7}).map((_,i)=>(
          <line key={i} x1="150" y1={140+i*28} x2="360" y2={140+i*28} stroke="#b4b4b4" strokeWidth="0.6" opacity="0.5"/>
        ))}
        <text x="255" y="210" textAnchor="middle" fontSize="16" fill="#1a1a1a" fontFamily="Arial" fontWeight="900">ESP32-S3</text>
        <text x="255" y="230" textAnchor="middle" fontSize="11" fill="#333" fontFamily="Arial">WROOM-1  N16R8</text>
        <text x="255" y="248" textAnchor="middle" fontSize="9" fill="#555" fontFamily="Arial">FCC ID: 2AC7Z-ESP32S3</text>
        <rect x="348" y="138" width="24" height="166" rx="3" fill="#b8b8b8"/>
        <rect x="351" y="144" width="18" height="154" rx="2" fill="#adadad"/>
        {Array.from({length:22}).map((_,i)=>(
          <rect key={i} x={150+i*9} y="333" width="7" height="5" rx="0.6" fill="#888" stroke="#666" strokeWidth="0.4"/>
        ))}

        {/* ─── Electrolytic capacitors ─── */}
        {[[72,395,40],[128,395,32],[184,395,40]].map(([cx,cy,d],i)=>(
          <g key={i}>
            <circle cx={cx} cy={cy} r={d/2} fill="#222" stroke="#444" strokeWidth="2"/>
            <circle cx={cx} cy={cy} r={d/2-4} fill="#1a1a1a"/>
            <text x={cx} y={cy-3} textAnchor="middle" fontSize="7.5" fill="#999" fontFamily="monospace">{["1000","470","1000"][i]}</text>
            <text x={cx} y={cy+8} textAnchor="middle" fontSize="6" fill="#777" fontFamily="monospace">µF 16V</text>
          </g>
        ))}

        {/* ─── Servo ports (right side) — simple labeled boxes ─── */}
        {(["S1","S2","S3","S4"] as const).map((s, i) => {
          const yPct = [48,60,72,84][i];
          const yPx = (yPct / 100) * 560;
          return (
            <g key={s}>
              <rect x="434" y={yPx - 11} width="58" height="22" rx="3"
                fill="#e8e8e8" stroke="#eab308" strokeWidth="1.3"/>
              <rect x="436" y={yPx - 9} width="54" height="18" rx="2" fill="#f2f2f2"/>
              <text x="463" y={yPx + 4} textAnchor="middle" fontSize="8"
                fill="#333" fontFamily="'Courier New',monospace" fontWeight="bold">{`SERVO ${s}`}</text>
            </g>
          );
        })}

        {/* ─── KOKOON LABS watermark ─── */}
        <text x="150" y="388" fontSize="20" fill="rgba(255,255,255,0.1)" fontFamily="Arial"
          fontWeight="900" letterSpacing="4">KOKOON</text>
        <text x="150" y="414" fontSize="20" fill="rgba(255,255,255,0.1)" fontFamily="Arial"
          fontWeight="900" letterSpacing="8">LABS</text>

        {/* ─── LEDs ─── */}
        <circle cx="456" cy="60" r="7" fill="#00e676" style={{filter:"drop-shadow(0 0 5px #00c853)"}}/>
        <circle cx="476" cy="60" r="7" fill="#ff1744" style={{filter:"drop-shadow(0 0 4px #ff1744)"}}/>
        <text x="456" y="74" textAnchor="middle" fontSize="7" fill="#4ade80" fontFamily="monospace">LED1</text>
        <text x="476" y="74" textAnchor="middle" fontSize="7" fill="#f87171" fontFamily="monospace">LED2</text>

        {/* ─── RST / BOOT buttons ─── */}
        {[{label:"RST",x:390,y:82},{label:"BOOT",x:432,y:82}].map(({label,x,y})=>(
          <g key={label}>
            <rect x={x} y={y} width="30" height="22" rx="3" fill="#2a2a2a" stroke="#555" strokeWidth="1.2"/>
            <rect x={x+4} y={y+4} width="22" height="14" rx="2" fill="#1a1a1a"/>
            <text x={x+15} y={y+36} textAnchor="middle" fontSize="8" fill="#888" fontFamily="monospace">{label}</text>
          </g>
        ))}

        {/* USB-C port box */}
        <rect x="434" y={Math.round(0.12*560) - 11} width="58" height="22" rx="3"
          fill="#e8e8e8" stroke="#94a3b8" strokeWidth="1.3"/>
        <rect x="436" y={Math.round(0.12*560) - 9} width="54" height="18" rx="2" fill="#f2f2f2"/>
        <text x="463" y={Math.round(0.12*560) + 4} textAnchor="middle" fontSize="8"
          fill="#333" fontFamily="'Courier New',monospace" fontWeight="bold">USB-C</text>

        {/* IMU port box on right edge */}
        <rect x="434" y={Math.round(0.26*560) - 11} width="58" height="22" rx="3"
          fill="#e8e8e8" stroke="#06b6d4" strokeWidth="1.3"/>
        <rect x="436" y={Math.round(0.26*560) - 9} width="54" height="18" rx="2" fill="#f2f2f2"/>
        <text x="463" y={Math.round(0.26*560) + 4} textAnchor="middle" fontSize="8"
          fill="#333" fontFamily="'Courier New',monospace" fontWeight="bold">IMU</text>

        {/* ─── BOTTOM EDGE: port boxes ─── */}
        <PortBottom x={60}  label="OLED"  color="#6366f1"/>
        <PortBottom x={145} label="I2C-2" color="#8b5cf6"/>
        <PortBottom x={280} label="SNS-2" color="#14b8a6"/>
        <PortBottom x={390} label="SNS-1" color="#14b8a6"/>
      </svg>

      {BOARD_PORTS.map((port)=>(
        <Handle
          key={port.id}
          type="target"
          id={port.id}
          position={port.side}
          style={{
            [port.side===Position.Left||port.side===Position.Right?"top":"left"]:`${port.offset}%`,
            background: port.color,
            width:18, height:18,
            border:`3px solid ${port.color}70`,
            boxShadow:`0 0 12px ${port.color}90, 0 0 24px ${port.color}30`,
            zIndex:10,
          }}
          title={port.label}
        />
      ))}
    </div>
  );
}

// ─── Component node — bare floating image, no card wrapper ───────────────────

function ComponentNode({ id, data }: { id: string; data: { hwComp: HwComponent; color: string; enabled?: boolean } }) {
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
        const { type, data: nodeData } = factory
          ? factory(data.hwComp)
          : { type: data.hwComp.nodeType, data: data.hwComp.defaultData };
        const logicId = _canvasRefGlobal.current.addNode(type, nodeData as Record<string, unknown>) ?? "";
        _hwToLogic[id] = logicId;
        _logicToHw[logicId] = id;
        _suppressSyncIds.add(logicId);
        _usedPorts.add(portId);
      }
    }

    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, enabled: newEnabled } } : n));
  }, [id, enabled, data.hwComp, getEdges, setNodes]);

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
      {/* Bare component image — glow via drop-shadow filter */}
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

      {/* Enable/disable toggle pill — shown when wired */}
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

      {/* Connection handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: data.color,
          width: 12, height: 12,
          border: `2.5px solid ${data.color}50`,
          boxShadow: `0 0 8px ${data.color}80`,
          top: "40%",
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
  servo_s1:  ()  => ({ type: "servo_motor",         data: { port: "S1", pin: SERVO_PORTS.S1.pin } }),
  servo_s2:  ()  => ({ type: "servo_motor",         data: { port: "S2", pin: SERVO_PORTS.S2.pin } }),
  servo_s3:  ()  => ({ type: "servo_motor",         data: { port: "S3", pin: SERVO_PORTS.S3.pin } }),
  servo_s4:  ()  => ({ type: "servo_motor",         data: { port: "S4", pin: SERVO_PORTS.S4.pin } }),
  oled:      ()  => ({ type: "oled_display",        data: { scl: OLED.scl, sda: OLED.sda } }),
  i2c2:      (c) => ({ type: c.nodeType,            data: { scl: SENSOR_PORTS["2"].scl, sda: SENSOR_PORTS["2"].sda } }),
  sensor1:   (c) => ({ type: c.nodeType,            data: { port: "1", trig: SENSOR_PORTS["1"].trig, echo: SENSOR_PORTS["1"].echo } }),
  sensor2:   (c) => ({ type: c.nodeType,            data: { port: "2", trig: SENSOR_PORTS["2"].trig, echo: SENSOR_PORTS["2"].echo } }),
  imu:       ()  => ({ type: "imu_sensor",          data: { scl: ONBOARD_IMU.scl, sda: ONBOARD_IMU.sda } }),
};

// ─── nodeType → HwComponent lookup (for blocks→hardware sync) ─────────────────

const _nodeTypeToHwComp: Record<string, HwComponent> = {};
for (const comp of HW_COMPONENTS) {
  _nodeTypeToHwComp[comp.nodeType] = comp;
}

// ─── Port auto-assignment helpers ─────────────────────────────────────────────

const _leftPorts  = new Set(["neopixel","i2s","motor_fr","motor_fl","motor_rr","motor_rl"]);
const _rightPorts = new Set(["imu","servo_s1","servo_s2","servo_s3","servo_s4"]);

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
  if (_leftPorts.has(portId))  return { x: 20,  y: 60 + hwCount * 200 };
  if (_rightPorts.has(portId)) return { x: 980, y: 60 + hwCount * 200 };
  return { x: 60 + hwCount * 200, y: 720 };
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

// Live setters — registered by HardwareCanvas when mounted
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

/**
 * Called from EditorPage when a node is added to the blocks canvas by the user.
 * Creates the matching hw component node + edge to the best available board port.
 */
export function syncAddHwNode(logicId: string, nodeType: string, data: Record<string, unknown>): void {
  if (_logicToHw[logicId]) return; // Already synced

  const hwComp = _nodeTypeToHwComp[nodeType];
  if (!hwComp) return; // Not a hw-mappable type

  const portId = _getBestPort(nodeType, data);
  if (!portId) return; // No available port

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

// ─── Inner hardware canvas ────────────────────────────────────────────────────

interface InnerProps {
  canvasRef: React.RefObject<NodeCanvasRef | null>;
  onWired: (label: string, color: string) => void;
}

function HardwareCanvas({ canvasRef, onWired }: InnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(_nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(_edges);
  const { screenToFlowPosition } = useReactFlow();

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

  const onConnect = useCallback((connection: Connection) => {
    const src = nodes.find(n => n.id === connection.source);
    if (!src || src.type !== "hw_component") return;
    const hwComp = (src.data as { hwComp: HwComponent }).hwComp;
    const portId = connection.targetHandle ?? "";
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
  }, [nodes, canvasRef, onWired, setEdges]);

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
  }, [canvasRef]);

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

  return (
    <div className="flex-1 h-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={NODE_TYPES}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background id="hw-dots" color="#16a34a" gap={52} size={1.5} variant={BackgroundVariant.Dots} style={{ backgroundColor: "#050a07" }} />
        <MiniMap
          nodeColor="#8b5cf6"
          maskColor="rgba(8, 12, 8, 0.85)"
          style={{ backgroundColor: "#101510", border: "1px solid #1f2a1f", borderRadius: "8px" }}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full px-5 py-2 text-[11px] text-hint border border-subtle bg-panel/90 shadow pointer-events-none backdrop-blur-sm">
          Drag a component · wire handle to board port · toggle ON/OFF · Delete removes from both views
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

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#080c08]">
      {/* Palette */}
      <aside className="w-56 shrink-0 border-r border-white/5 flex flex-col overflow-hidden" style={{ background: "#0d120d" }}>
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Components</p>
          <p className="text-[10px] text-white/30 mt-0.5">Drag · Drop · Wire · Toggle</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {HW_COMPONENTS.map(comp => {
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
                  <div className="text-[10px] font-bold leading-tight" style={{ color: comp.color }}>{comp.label}</div>
                  <div className="text-[9px] text-white/30 leading-tight mt-0.5">{comp.portHint}</div>
                </div>
              </div>
            );
          })}
        </div>

        {wired.length > 0 && (
          <div className="border-t border-white/5 p-3">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">Connected</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {wired.slice().reverse().map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px]">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: w.color }} />
                  <span className="text-white/40 truncate">{w.label}</span>
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
