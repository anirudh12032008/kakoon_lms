import type { Node, Edge } from "@xyflow/react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  actionType: "add_node" | "connect" | "edit_field";
  nodeType?: string;
  nodeLabel?: string;
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
  forever_loop: {},
  gpio_pin: { pin: 2, mode: "OUT" },
  pin_write: { port: "1", pin: 4, value: false },
  pin_read: { port: "1", pin: 4, varName: "value" },
  pwm: { pin: 2, freq: 1000, duty: 512 },
  adc: { pin: 34, varName: "value" },
  push_button: { port: "1", pin: 4, varName: "value" },
  buzzer_tone: { port: "1", pin: 46, tone: "1" },
  neopixel_led: { pin: 45, brightness: 50, color: "#ff0000" },
  neopixel_rgb: { pin: 45, brightness: 50, red: 255, green: 0, blue: 0 },
  print: { text: "'Hello world'" },
  variable: { name: "x", value: 0 },
  sleep: { seconds: 1 },
  ultrasonic_sensor: { port: "1", trigPin: 1, echoPin: 5, varName: "distance" },
  touch_sensor: { port: "1", pin: 4, varName: "touch_value" },
  soil_moisture: { port: "1", pin: 4, varName: "value" },
  ir_receiver: { port: "1", pin: 5, varName: "ir_cmd" },
  ir_sensor: { port: "1", pin: 4, varName: "ir_value" },
  four_channel_touch: { port: "1", pin1: 4, pin2: 5, pin3: 6, pin4: 7, t1: "touch1", t2: "touch2", t3: "touch3", t4: "touch4" },
  if_else: { left: "", op: "==", right: 0 },
  map_range: { value: "", fromMin: 0, fromMax: 4095, toMin: 0, toMax: 180, varName: "mapped_value" },
  servo_motor: { pin: 4, angle: 90 }
};

const FIELD_LABELS: Record<string, string> = {
  port: "Port",
  pin: "Pin Number",
  varName: "Variable Name",
  name: "Variable Name",
  value: "Value",
  left: "Condition Variable",
  right: "Condition Value",
  op: "Operator",
  angle: "Servo Angle",
  seconds: "Sleep Duration",
  brightness: "Brightness",
  color: "Color",
  red: "Red Value",
  green: "Green Value",
  blue: "Blue Value"
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

// ─── Forklift ─────────────────────────────────────────────────────────────────
const forkliftNodes: Node[] = [
  { id: "fork_n1", type: "forever_loop",   position: { x: 100, y: 100 }, data: {} },
  { id: "fork_n2", type: "push_button",    position: { x: 360, y: 80  }, data: { port: "1", pin: 1, varName: "drive_btn" } },
  { id: "fork_n3", type: "dc_motor_single", position: { x: 360, y: 230 }, data: { in1: 13, in2: 14, enPin: 12, speed: 70, direction: "Forward", driver: "L298N" } },
  { id: "fork_n4", type: "push_button",    position: { x: 360, y: 390 }, data: { port: "1", pin: 2, varName: "lift_btn" } },
  { id: "fork_n5", type: "push_button",    position: { x: 360, y: 540 }, data: { port: "1", pin: 3, varName: "lower_btn" } },
  { id: "fork_n6", type: "servo_motor",    position: { x: 360, y: 690 }, data: { pin: 5, angle: 90 } },
  { id: "fork_n7", type: "sleep",          position: { x: 360, y: 850 }, data: { seconds: 0.05 } },
];

const forkliftEdges: Edge[] = [
  { id: "fork_e1", source: "fork_n1", target: "fork_n2", sourceHandle: "body" },
  { id: "fork_e2", source: "fork_n2", target: "fork_n3" },
  { id: "fork_e3", source: "fork_n3", target: "fork_n4" },
  { id: "fork_e4", source: "fork_n4", target: "fork_n5" },
  { id: "fork_e5", source: "fork_n5", target: "fork_n6" },
  { id: "fork_e6", source: "fork_n6", target: "fork_n7" },
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

  const queuePlaceNode = (node: Node) => {
    if (placedNodeIds.has(node.id)) return;
    placedNodeIds.add(node.id);

    const label = getReadableLabel(node.type || "");
    steps.push({
      id: `step_${stepCounter++}`,
      title: `Place a ${label} block`,
      description: `Drag and place the "${label}" block from the sidebar onto the canvas workspace.`,
      actionType: "add_node",
      nodeType: node.type,
      nodeLabel: label,
      nodeId: node.id,
    });

    if (node.data) {
      const defaultsForType = DEFAULTS[node.type || ""] || {};
      for (const key of Object.keys(node.data)) {
        const targetVal = node.data[key];
        const defaultVal = defaultsForType[key];
        if (defaultVal !== undefined && String(targetVal) !== String(defaultVal)) {
          const fieldLabel = FIELD_LABELS[key] || key;
          const actionText = key === "port" ? "Select" : "Type";
          steps.push({
            id: `step_${stepCounter++}`,
            title: `${actionText} "${targetVal}" in ${label}`,
            description: `${actionText} "${targetVal}" into the "${fieldLabel}" input field inside the ${label} block.`,
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
    "Forklift Robot",
    "Drive a forklift robot with a DC drive motor and raise/lower a servo-powered fork arm using dedicated lift and lower buttons.",
    "Medium",
    ["push_button", "dc_motor_single", "servo_motor", "forever_loop"],
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
