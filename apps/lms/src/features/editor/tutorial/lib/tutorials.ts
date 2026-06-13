import type { Node, Edge } from "@xyflow/react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  actionType: "add_node" | "connect" | "edit_field";
  nodeType?: string;
  nodeLabel?: string;
  /** Minimum count of this nodeType required before step completes */
  minCount?: number;
  sourceType?: string;
  sourceHandle?: string;
  targetType?: string;
  targetHandle?: string;
  sourceId?: string;
  targetId?: string;
  nodeId?: string;
  fieldName?: string;
  fieldValue?: any;
  fieldLabel?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  board: "Atom S3" | "Molecule S3" | "Quark C3";
  components: string[];
  nodes: Node[];
  edges: Edge[];
  steps: TutorialStep[];
}

const DEFAULTS: Record<string, Record<string, any>> = {
  forever_loop:        {},
  gpio_pin:            { pin: 2, mode: "OUT" },
  pin_write:           { port: "1", pin: 4, value: false },
  pin_read:            { port: "1", pin: 4, varName: "value" },
  pwm:                 { pin: 2, freq: 1000, duty: 512 },
  adc:                 { pin: 34, varName: "value" },
  push_button:         { port: "1", pin: 4, varName: "value" },
  buzzer_tone:         { port: "1", pin: 46, tone: "1" },
  neopixel_led:        { numLeds: 8, brightness: 50, color: "#ff0000" },
  neopixel_rgb:        { pin: 45, brightness: 50, red: 255, green: 0, blue: 0 },
  print:               { text: "'Hello world'" },
  variable:            { name: "x", value: 0 },
  sleep:               { seconds: 1 },
  ultrasonic_sensor:   { port: "1", trigPin: 1, echoPin: 5, varName: "distance" },
  touch_sensor:        { port: "1", pin: 4, varName: "touch_value" },
  soil_moisture:       { port: "1", pin: 4, varName: "value" },
  ir_receiver:         { port: "1", pin: 5, varName: "ir_cmd" },
  ir_sensor:           { port: "1", pin: 4, varName: "ir_value" },
  four_channel_touch:  { port: "1", pin1: 4, pin2: 5, pin3: 6, pin4: 7, t1: "touch1", t2: "touch2", t3: "touch3", t4: "touch4" },
  if_else:             { left: "", op: "==", right: 0 },
  map_range:           { value: "", fromMin: 0, fromMax: 4095, toMin: 0, toMax: 180, varName: "mapped_value" },
  servo_motor:         { servoPort: "S1", angle: 90 },
  dc_motor_single:     { in1: 13, in2: 14, enPin: 12, speed: 80, direction: "Forward", driver: "L298N" },
  oled_display:        { mode: "text", line1: "", line2: "", driver: false },
  ble_mode:            { deviceName: "ESP32-BLE", rawVarName: "ble_data", enableCmdMap: true, enableTx: false, txVarName: "ble_tx" },
};

const FIELD_LABELS: Record<string, string> = {
  port:         "Port",
  pin:          "Pin Number",
  varName:      "Variable Name",
  name:         "Variable Name",
  value:        "Value",
  left:         "Condition Variable",
  right:        "Condition Value",
  op:           "Operator",
  angle:        "Servo Angle",
  seconds:      "Sleep Duration",
  brightness:   "Brightness",
  color:        "Color",
  red:          "Red Value",
  green:        "Green Value",
  blue:         "Blue Value",
  speed:        "Speed",
  direction:    "Direction",
  numLeds:      "Number of LEDs",
  line1:        "Line 1 Text",
  line2:        "Line 2 Text",
  deviceName:   "BLE Device Name",
  rawVarName:   "Receive Variable",
  in1:          "IN1 Pin",
  in2:          "IN2 Pin",
  enPin:        "Enable Pin",
  servoPort:    "Servo Port",
  motorPort:    "Motor Port",
};

// ─── Built-in Tutorial Definitions ───────────────────────────────────────────

function makeTutorial(
  id: string,
  title: string,
  description: string,
  difficulty: Tutorial["difficulty"],
  components: string[],
  nodes: Node[],
  edges: Edge[]
): Tutorial {
  return {
    id,
    title,
    description,
    difficulty,
    board: "Quark C3",
    components,
    nodes,
    edges,
    steps: generateStepsFromFlow(nodes, edges),
  };
}

// ─── RC Car ───────────────────────────────────────────────────────────────────
const rcCarNodes: Node[] = [
  { id: "car_n1", type: "forever_loop", position: { x: 100, y: 100 }, data: {} },
  { id: "car_n2", type: "push_button",  position: { x: 360, y: 80  }, data: { port: "1", pin: 1, varName: "fwd_btn" } },
  { id: "car_n3", type: "push_button",  position: { x: 360, y: 230 }, data: { port: "1", pin: 2, varName: "bwd_btn" } },
  { id: "car_n4", type: "dc_motor_single", position: { x: 360, y: 380 }, data: { in1: 13, in2: 14, enPin: 12, speed: 80, direction: "Forward", driver: "L298N" } },
  { id: "car_n5", type: "dc_motor_single", position: { x: 360, y: 540 }, data: { in1: 15, in2: 16, enPin: 17, speed: 80, direction: "Forward", driver: "L298N" } },
  { id: "car_n6", type: "sleep",          position: { x: 360, y: 700 }, data: { seconds: 0.05 } },
];

const rcCarEdges: Edge[] = [
  { id: "car_e1", source: "car_n1", target: "car_n2", sourceHandle: "body" },
  { id: "car_e2", source: "car_n2", target: "car_n3" },
  { id: "car_e3", source: "car_n3", target: "car_n4" },
  { id: "car_e4", source: "car_n4", target: "car_n5" },
  { id: "car_e5", source: "car_n5", target: "car_n6" },
];

// ─── Tank ─────────────────────────────────────────────────────────────────────
const tankNodes: Node[] = [
  { id: "tank_n1", type: "forever_loop", position: { x: 100, y: 100 }, data: {} },
  { id: "tank_n2", type: "push_button",  position: { x: 360, y: 80  }, data: { port: "1", pin: 1, varName: "left_btn" } },
  { id: "tank_n3", type: "push_button",  position: { x: 360, y: 230 }, data: { port: "1", pin: 2, varName: "right_btn" } },
  { id: "tank_n4", type: "push_button",  position: { x: 360, y: 380 }, data: { port: "1", pin: 3, varName: "turbo_btn" } },
  {
    id: "tank_n5", type: "multi_motor_controller", position: { x: 360, y: 530 },
    data: { driver: "L298N", syncMode: false, m1speed: 80, m1dir: "Forward", m2speed: 80, m2dir: "Reverse", m3speed: 0, m3dir: "Brake", m4speed: 0, m4dir: "Brake" },
  },
  { id: "tank_n6", type: "sleep", position: { x: 360, y: 760 }, data: { seconds: 0.05 } },
];

const tankEdges: Edge[] = [
  { id: "tank_e1", source: "tank_n1", target: "tank_n2", sourceHandle: "body" },
  { id: "tank_e2", source: "tank_n2", target: "tank_n3" },
  { id: "tank_e3", source: "tank_n3", target: "tank_n4" },
  { id: "tank_e4", source: "tank_n4", target: "tank_n5" },
  { id: "tank_e5", source: "tank_n5", target: "tank_n6" },
];

// ─── BT Forklift ──────────────────────────────────────────────────────────────
// BLE command map:
//  cmd_0 "F" → Forward  (all 4 motors fwd 80% for 0.75 s then brake)
//  cmd_1 "B" → Backward (all 4 motors rev 80% for 0.75 s then brake)
//  cmd_2 "R" → Right    (left fwd + right rev 70% for 0.5 s, then brake)
//  cmd_3 "L" → Left     (left rev + right fwd 70% for 0.5 s, then brake)
//  cmd_4 "+" → Speed up (variable speed = 100)
//  cmd_5 "-" → Speed down (variable speed = 40)
//  cmd_6 "N" → NeoPixel LED strip (8 LEDs, cyan)
//  cmd_7 "O" → OLED status display
//  cmd_8 "U" → Fork up   (servo S1 → 0°)
//  cmd_9 "D" → Fork down (servo S1 → 90°)

const BT_CMD_MAP = [
  { trigger: "F", varName: "", value: "" },
  { trigger: "B", varName: "", value: "" },
  { trigger: "R", varName: "", value: "" },
  { trigger: "L", varName: "", value: "" },
  { trigger: "+", varName: "", value: "" },
  { trigger: "-", varName: "", value: "" },
  { trigger: "N", varName: "", value: "" },
  { trigger: "O", varName: "", value: "" },
  { trigger: "U", varName: "", value: "" },
  { trigger: "D", varName: "", value: "" },
];

const forkliftNodes: Node[] = [
  // ── Entry ──────────────────────────────────────────────────────────────────
  { id: "fk_n1",  type: "forever_loop", position: { x: 60,   y: 0    }, data: {} },
  { id: "fk_n2",  type: "ble_mode",     position: { x: 340,  y: 0    }, data: {
    deviceName: "Forklift", rawVarName: "cmd", enableCmdMap: true,
    cmdMap: BT_CMD_MAP, enableTx: false, txVarName: "ble_tx",
  }},

  // ── Forward: 'F' — all 4 motors fwd 80%, sleep 0.75 s, then brake ────────
  { id: "fk_n3",  type: "multi_motor_controller", position: { x: 700,  y: 140  }, data: { syncMode: true, l1speed: 80, l1dir: "Forward" } },
  { id: "fk_n4",  type: "sleep",                  position: { x: 980,  y: 140  }, data: { seconds: 0.75 } },
  { id: "fk_n5",  type: "multi_motor_controller", position: { x: 1260, y: 140  }, data: { syncMode: true, l1speed: 0, l1dir: "Brake" } },

  // ── Backward: 'B' — all 4 motors rev 80%, sleep 0.75 s, then brake ───────
  { id: "fk_n6",  type: "multi_motor_controller", position: { x: 700,  y: 340  }, data: { syncMode: true, l1speed: 80, l1dir: "Reverse" } },
  { id: "fk_n7",  type: "sleep",                  position: { x: 980,  y: 340  }, data: { seconds: 0.75 } },
  { id: "fk_n8",  type: "multi_motor_controller", position: { x: 1260, y: 340  }, data: { syncMode: true, l1speed: 0, l1dir: "Brake" } },

  // ── Right turn: 'R' — left fwd + right rev 70%, sleep 0.5 s, then brake ──
  { id: "fk_n9",  type: "multi_motor_controller", position: { x: 700,  y: 540  }, data: { pairMode: true, leftSpeed: 70, leftDir: "Forward", rightSpeed: 70, rightDir: "Reverse" } },
  { id: "fk_n10", type: "sleep",                  position: { x: 980,  y: 540  }, data: { seconds: 0.5 } },
  { id: "fk_n9b", type: "multi_motor_controller", position: { x: 1260, y: 540  }, data: { syncMode: true, l1speed: 0, l1dir: "Brake" } },

  // ── Left turn: 'L' — left rev + right fwd 70%, sleep 0.5 s, then brake ───
  { id: "fk_n11",  type: "multi_motor_controller", position: { x: 700,  y: 720  }, data: { pairMode: true, leftSpeed: 70, leftDir: "Reverse", rightSpeed: 70, rightDir: "Forward" } },
  { id: "fk_n12",  type: "sleep",                  position: { x: 980,  y: 720  }, data: { seconds: 0.5 } },
  { id: "fk_n12b", type: "multi_motor_controller", position: { x: 1260, y: 720  }, data: { syncMode: true, l1speed: 0, l1dir: "Brake" } },

  // ── Speed control: '+' / '-' ──────────────────────────────────────────────
  { id: "fk_n13", type: "variable",               position: { x: 700, y: 920  }, data: { name: "speed", value: 100 } },
  { id: "fk_n14", type: "variable",               position: { x: 700, y: 1080 }, data: { name: "speed", value: 40  } },

  // ── NeoPixel LED strip: 'N' — 8 LEDs, cyan ───────────────────────────────
  { id: "fk_n15", type: "neopixel_led",            position: { x: 700, y: 1260 }, data: { numLeds: 8, brightness: 80, color: "#00c8ff" } },

  // ── OLED status display: 'O' ──────────────────────────────────────────────
  { id: "fk_n16", type: "oled_display",            position: { x: 700, y: 1460 }, data: { mode: "text", line1: "Forklift OK", line2: "BT Ready", driver: false } },

  // ── Fork servo up: 'U' — S1 (pin 21) to 0° ───────────────────────────────
  { id: "fk_n17", type: "servo_motor",             position: { x: 700, y: 1660 }, data: { servoPort: "S1", angle: 0  } },

  // ── Fork servo down: 'D' — S1 (pin 21) to 90° ────────────────────────────
  { id: "fk_n18", type: "servo_motor",             position: { x: 700, y: 1840 }, data: { servoPort: "S1", angle: 90 } },
];

const forkliftEdges: Edge[] = [
  { id: "fk_e1",  source: "fk_n1",  target: "fk_n2",  sourceHandle: "body"  },

  // BLE 'F' → forward chain: motors → sleep → brake
  { id: "fk_e2",  source: "fk_n2",  target: "fk_n3",  sourceHandle: "cmd_0" },
  { id: "fk_e3",  source: "fk_n3",  target: "fk_n4"  },
  { id: "fk_e4",  source: "fk_n4",  target: "fk_n5"  },

  // BLE 'B' → backward chain: motors → sleep → brake
  { id: "fk_e5",  source: "fk_n2",  target: "fk_n6",  sourceHandle: "cmd_1" },
  { id: "fk_e6",  source: "fk_n6",  target: "fk_n7"  },
  { id: "fk_e7",  source: "fk_n7",  target: "fk_n8"  },

  // BLE 'R' → right turn: motors → sleep → brake
  { id: "fk_e8",  source: "fk_n2",  target: "fk_n9",  sourceHandle: "cmd_2" },
  { id: "fk_e9",  source: "fk_n9",  target: "fk_n10" },
  { id: "fk_e9b", source: "fk_n10", target: "fk_n9b" },

  // BLE 'L' → left turn: motors → sleep → brake
  { id: "fk_e10",  source: "fk_n2",  target: "fk_n11",  sourceHandle: "cmd_3" },
  { id: "fk_e11",  source: "fk_n11", target: "fk_n12"  },
  { id: "fk_e12b", source: "fk_n12", target: "fk_n12b" },

  // BLE '+' / '-' → speed variable
  { id: "fk_e12", source: "fk_n2",  target: "fk_n13", sourceHandle: "cmd_4" },
  { id: "fk_e13", source: "fk_n2",  target: "fk_n14", sourceHandle: "cmd_5" },

  // BLE 'N' → NeoPixel
  { id: "fk_e14", source: "fk_n2",  target: "fk_n15", sourceHandle: "cmd_6" },

  // BLE 'O' → OLED
  { id: "fk_e15", source: "fk_n2",  target: "fk_n16", sourceHandle: "cmd_7" },

  // BLE 'U'/'D' → servo
  { id: "fk_e16", source: "fk_n2",  target: "fk_n17", sourceHandle: "cmd_8" },
  { id: "fk_e17", source: "fk_n2",  target: "fk_n18", sourceHandle: "cmd_9" },
];

// ─── Turret ───────────────────────────────────────────────────────────────────
const turretNodes: Node[] = [
  { id: "tur_n1", type: "forever_loop", position: { x: 100, y: 100 }, data: {} },
  { id: "tur_n2", type: "push_button",  position: { x: 360, y: 80  }, data: { port: "1", pin: 1, varName: "pan_left" } },
  { id: "tur_n3", type: "push_button",  position: { x: 360, y: 230 }, data: { port: "1", pin: 2, varName: "pan_right" } },
  { id: "tur_n4", type: "servo_motor",  position: { x: 360, y: 380 }, data: { pin: 4, angle: 90 } },
  { id: "tur_n5", type: "push_button",  position: { x: 360, y: 530 }, data: { port: "1", pin: 3, varName: "tilt_up" } },
  { id: "tur_n6", type: "push_button",  position: { x: 360, y: 680 }, data: { port: "1", pin: 4, varName: "tilt_down" } },
  { id: "tur_n7", type: "servo_motor",  position: { x: 360, y: 830 }, data: { pin: 5, angle: 45 } },
  { id: "tur_n8", type: "sleep",        position: { x: 360, y: 980 }, data: { seconds: 0.05 } },
];

const turretEdges: Edge[] = [
  { id: "tur_e1", source: "tur_n1", target: "tur_n2", sourceHandle: "body" },
  { id: "tur_e2", source: "tur_n2", target: "tur_n3" },
  { id: "tur_e3", source: "tur_n3", target: "tur_n4" },
  { id: "tur_e4", source: "tur_n4", target: "tur_n5" },
  { id: "tur_e5", source: "tur_n5", target: "tur_n6" },
  { id: "tur_e6", source: "tur_n6", target: "tur_n7" },
  { id: "tur_e7", source: "tur_n7", target: "tur_n8" },
];

export function generateStepsFromFlow(nodes: Node[], edges: Edge[]): TutorialStep[] {
  const steps: TutorialStep[] = [];
  let stepCounter = 1;

  const placedNodeIds = new Set<string>();
  const connectedEdgeIds = new Set<string>();

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  const getReadableLabel = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Pre-count how many nodes of each type exist so we can number duplicates
  const nodeTypeTotals: Record<string, number> = {};
  for (const n of nodes) {
    const t = n.type || "";
    nodeTypeTotals[t] = (nodeTypeTotals[t] || 0) + 1;
  }
  const nodeTypeCurrentIdx: Record<string, number> = {};

  const queuePlaceNode = (node: Node) => {
    if (placedNodeIds.has(node.id)) return;
    placedNodeIds.add(node.id);

    const t = node.type || "";
    nodeTypeCurrentIdx[t] = (nodeTypeCurrentIdx[t] || 0) + 1;
    const count = nodeTypeCurrentIdx[t];
    const total = nodeTypeTotals[t] || 1;

    const label = getReadableLabel(t);
    const suffix = total > 1 ? ` #${count}` : "";
    steps.push({
      id: `step_${stepCounter++}`,
      title: `Place a ${label}${suffix} block`,
      description: `Drag the "${label}" block from the sidebar panel onto the canvas. ${total > 1 ? `(This is block ${count} of ${total} of this type.)` : ""}`.trim(),
      actionType: "add_node",
      nodeType: node.type,
      nodeLabel: label,
      nodeId: node.id,
      minCount: count,
    });

    if (node.data) {
      const defaultsForType = DEFAULTS[node.type || ""] || {};
      for (const key of Object.keys(node.data)) {
        const targetVal = node.data[key];
        const defaultVal = defaultsForType[key];
        // Skip complex objects (cmdMap arrays, etc.) — only simple primitives
        if (typeof targetVal === "object" && targetVal !== null) continue;
        if (defaultVal !== undefined && String(targetVal) !== String(defaultVal)) {
          const fieldLabel = FIELD_LABELS[key] || key;
          const actionText = key === "port" || key === "direction" || key === "mode" ? "Select" : "Set";
          steps.push({
            id: `step_${stepCounter++}`,
            title: `${actionText} ${fieldLabel} to "${targetVal}" in ${label}${suffix}`,
            description: `Inside the ${label}${suffix} block, ${actionText.toLowerCase()} the "${fieldLabel}" field to "${targetVal}".`,
            actionType: "edit_field",
            nodeType: node.type,
            nodeLabel: label,
            nodeId: node.id,
            fieldName: key,
            fieldValue: targetVal,
            fieldLabel,
          });
        }
      }
    }
  };

  const queueConnect = (edge: Edge) => {
    if (connectedEdgeIds.has(edge.id)) return;
    connectedEdgeIds.add(edge.id);

    const src = getNode(edge.source);
    const tgt = getNode(edge.target);
    if (!src || !tgt) return;

    queuePlaceNode(src);
    queuePlaceNode(tgt);

    const srcReadable = getReadableLabel(src.type || "");
    const tgtReadable = getReadableLabel(tgt.type || "");
    const handleLabel = edge.sourceHandle ? `(${edge.sourceHandle} branch)` : "(bottom output)";

    steps.push({
      id: `step_${stepCounter++}`,
      title: `Connect ${srcReadable} to ${tgtReadable}`,
      description: `Connect the ${handleLabel} output of the ${srcReadable} block to the top input handle of the ${tgtReadable} block.`,
      actionType: "connect",
      sourceType: src.type,
      sourceHandle: edge.sourceHandle || undefined,
      targetType: tgt.type,
      targetHandle: edge.targetHandle || undefined,
      sourceId: edge.source,
      targetId: edge.target,
    });
  };

  const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

  for (const node of sortedNodes) {
    const outgoingEdges = edges.filter((e) => e.source === node.id);
    if (outgoingEdges.length > 0) {
      for (const edge of outgoingEdges) queueConnect(edge);
    } else {
      queuePlaceNode(node);
    }
  }

  for (const edge of edges) queueConnect(edge);

  return steps;
}

// ─── Exported Built-in Tutorial List ─────────────────────────────────────────
export const BUILTIN_TUTORIALS: Tutorial[] = [
  makeTutorial(
    "builtin_rc_car",
    "RC Car Control",
    "Build a two-motor RC car that reads forward and backward push buttons to drive a left and right wheel motor using an L298N driver.",
    "Easy",
    ["push_button", "dc_motor_single", "forever_loop"],
    rcCarNodes,
    rcCarEdges
  ),
  makeTutorial(
    "builtin_tank",
    "Tank / Tracked Robot",
    "Control a tank-style robot with independent left and right tread motors. Use push buttons to steer — hold left to pivot left, hold right to pivot right.",
    "Medium",
    ["push_button", "multi_motor_controller", "forever_loop"],
    tankNodes,
    tankEdges
  ),
  makeTutorial(
    "builtin_forklift",
    "BT Forklift",
    "Control a Bluetooth forklift from your phone. Send commands to drive forward/backward (0.75 s bursts), turn, adjust speed, control 8 NeoPixel LEDs, update an OLED display, and raise or lower the servo fork arm.",
    "Hard",
    ["ble_mode", "multi_motor_controller", "servo_motor", "neopixel_led", "oled_display", "forever_loop"],
    forkliftNodes,
    forkliftEdges
  ),
  makeTutorial(
    "builtin_turret",
    "Pan-Tilt Turret",
    "Control a two-axis camera or sensor turret. Four push buttons let you pan left/right and tilt up/down using two servo motors.",
    "Easy",
    ["push_button", "servo_motor", "forever_loop"],
    turretNodes,
    turretEdges
  ),
];
