import type { Node, Edge } from "@xyflow/react";
import { getBoard } from "@/entities/board";

/**
 * Arduino C++ generator. Same flow-walking rules as the MicroPython generator
 * (codegen.ts) but only for the blocks that make sense on an Uno-class board.
 * Anything else is emitted as a visible "not available" comment, never as
 * silently wrong code.
 *
 * Shape of the sketch: top-level blocks run once in setup(); the body of a
 * top-level Forever Loop becomes loop().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- node data is a loose bag, same as codegen.ts
type D = Record<string, any>;

const LOOP_TYPES = ["forever_loop", "for_loop", "while_loop", "repeat"];
const BRANCH_HANDLES = ["body", "true", "false"];

/** Python-style print argument → C++ expression. */
function cppExpr(text: unknown, fallback: string): string {
  const s = String(text ?? "").trim();
  if (!s) return fallback;
  const quoted = s.match(/^(['"])([\s\S]*)\1$/);
  if (quoted) return JSON.stringify(quoted[2]);
  return s;
}

function cppCondition(cond: unknown): string {
  return String(cond ?? "true")
    .replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false")
    .replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\bnot\b/g, "!");
}

export function generateArduinoFromFlow(nodes: Node[], edges: Edge[]): string {
  const board = getBoard();
  if (nodes.length === 0) return "// Add blocks to generate code\n";

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const includes = new Set<string>();
  const globals = new Map<string, string>(); // key → declaration line
  const setupLines: string[] = [];
  const setupOnce = new Set<string>();
  const loopLines: string[] = [];
  const unsupported = new Set<string>();
  const visited = new Set<string>();

  const setup = (key: string, line: string) => {
    if (!setupOnce.has(key)) { setupOnce.add(key); setupLines.push(line); }
  };
  const declare = (name: unknown, fallback: string, type = "float", init = "0") => {
    const n = typeof name === "string" && /^[A-Za-z_]\w*$/.test(name.trim()) ? name.trim() : fallback;
    if (!globals.has(n)) globals.set(n, `${type} ${n} = ${init};`);
    return n;
  };
  const sensorPrint = (ind: string, v: string) => [
    `${ind}Serial.print("SENSOR,raw,${v},"); Serial.println(${v});`,
  ];

  const targetsOf = (id: string, handle: string) =>
    edges
      .filter((e) => e.source === id && e.sourceHandle === handle)
      .map((e) => nodeMap.get(e.target))
      .filter((n): n is Node => !!n)
      .sort((a, b) => a.position.y - b.position.y);

  function bodyOf(id: string, level: number, handle = "body"): string[] {
    let targets = targetsOf(id, handle);
    // Loops wired without the "body" handle: every node connected below it.
    if (targets.length === 0 && handle === "body") {
      const self = nodeMap.get(id)!;
      targets = edges
        .filter((e) => e.source === id && !e.sourceHandle)
        .map((e) => nodeMap.get(e.target))
        .filter((n): n is Node => !!n && n.position.y > self.position.y)
        .sort((a, b) => a.position.y - b.position.y);
    }
    return targets.flatMap((t) => chain(t.id, level, false));
  }

  function nextOf(node: Node): string | null {
    const isLoop = LOOP_TYPES.includes(node.type ?? "");
    const hasBodyEdge = edges.some((e) => e.source === node.id && e.sourceHandle === "body");
    const edge = edges.find((e) => {
      if (e.source !== node.id) return false;
      if (BRANCH_HANDLES.includes(e.sourceHandle ?? "")) return false;
      if (isLoop && !hasBodyEdge) {
        const t = nodeMap.get(e.target);
        if (t && t.position.y > node.position.y) return false; // used as the body
      }
      return true;
    });
    return edge ? edge.target : null;
  }

  function chain(id: string | null, level: number, top: boolean): string[] {
    if (!id || visited.has(id)) return [];
    visited.add(id);
    const node = nodeMap.get(id);
    if (!node) return [];
    const d = (node.data ?? {}) as D;
    const ind = "  ".repeat(level);
    const out: string[] = [];
    const block = (head: string, body: string[], tail: string[] = []) => {
      out.push(`${ind}${head} {`, ...body, ...tail, `${ind}}`);
    };
    const loopSleep = d.sleepEnabled ? [`${ind}  delay(${d.sleepMs ?? 1000});`] : [];

    if (!d.disabled) switch (node.type) {
      case "print":
        out.push(`${ind}Serial.println(${cppExpr(d.text, '"Hello world"')});`);
        break;
      case "sleep":
        out.push(`${ind}delay(${Math.round(Number(d.seconds ?? 1) * 1000)});`);
        break;
      case "variable":
        out.push(`${ind}${declare(d.name, "x")} = ${d.value ?? 0};`);
        break;

      case "gpio_pin":
        setup(`mode_${d.pin ?? 13}`, `pinMode(${d.pin ?? 13}, ${d.mode === "IN" ? "INPUT" : "OUTPUT"});`);
        break;
      case "pin_write":
        setup(`mode_${d.pin ?? 13}`, `pinMode(${d.pin ?? 13}, OUTPUT);`);
        out.push(`${ind}digitalWrite(${d.pin ?? 13}, ${d.value ? "HIGH" : "LOW"});`);
        break;
      case "button_digital_input": {
        const v = declare(d.varName, "btn", "int");
        setup(`mode_${d.pin ?? 2}`, `pinMode(${d.pin ?? 2}, ${d.pullup ? "INPUT_PULLUP" : "INPUT"});`);
        out.push(`${ind}${v} = digitalRead(${d.pin ?? 2});`);
        break;
      }
      case "pwm_output":
        setup(`mode_${d.pin ?? 3}`, `pinMode(${d.pin ?? 3}, OUTPUT);`);
        out.push(`${ind}analogWrite(${d.pin ?? 3}, ${Math.round(((d.duty ?? 50) / 100) * 255)});`);
        break;
      case "buzzer_tone":
        out.push(`${ind}tone(${d.pin ?? 8}, ${Number(d.tone ?? 1) * 440});`);
        break;

      case "forever_loop": {
        const body = bodyOf(id, top ? 1 : level + 1);
        if (top) loopLines.push(...body, ...(d.sleepEnabled ? [`  delay(${d.sleepMs ?? 1000});`] : []));
        else block("while (true)", body, loopSleep);
        break;
      }
      case "for_loop": {
        const i = /^[A-Za-z_]\w*$/.test(d.variable ?? "") ? d.variable : "i";
        block(`for (int ${i} = ${d.start ?? 0}; ${i} < ${d.end ?? 10}; ${i} += ${d.step ?? 1})`, bodyOf(id, level + 1), loopSleep);
        break;
      }
      case "while_loop":
        block(`while (${cppCondition(d.condition)})`, bodyOf(id, level + 1), loopSleep);
        break;
      case "repeat":
        block(`for (int _n = 0; _n < ${d.times ?? 1}; _n++)`, bodyOf(id, level + 1), loopSleep);
        break;
      case "break":
        out.push(`${ind}break;`);
        break;
      case "if_else":
        out.push(`${ind}if (${cppCondition(`${d.left || "0"} ${d.op ?? "=="} ${d.right ?? 0}`)}) {`);
        out.push(...bodyOf(id, level + 1, "true"));
        out.push(`${ind}} else {`);
        out.push(...bodyOf(id, level + 1, "false"));
        out.push(`${ind}}`);
        break;

      case "analog_sensor":
      case "soil_moisture": {
        // Uno analog pins: A0..A5 are also pins 14..19.
        const pin = d.pin ?? 14;
        const v = declare(d.varName, node.type === "soil_moisture" ? "value" : "analog_val", "int");
        out.push(`${ind}${v} = analogRead(${pin});  // 0-${board.adcMax}`);
        if (d.sendToViz !== false) out.push(...sensorPrint(ind, v));
        break;
      }
      case "ultrasonic": {
        const trig = d.trigPin ?? 7;
        const echo = d.echoPin ?? 8;
        const v = declare(d.varName, "distance");
        globals.set("__ultrasonic", `float readDistanceCm(int trig, int echo) {
  digitalWrite(trig, LOW); delayMicroseconds(2);
  digitalWrite(trig, HIGH); delayMicroseconds(10); digitalWrite(trig, LOW);
  unsigned long us = pulseIn(echo, HIGH, 30000);  // 30 ms timeout (~5 m)
  return us > 0 ? us * 0.0343 / 2 : 400;  // no echo = out of range
}`);
        setup(`mode_${trig}`, `pinMode(${trig}, OUTPUT);`);
        setup(`mode_${echo}`, `pinMode(${echo}, INPUT);`);
        out.push(`${ind}${v} = readDistanceCm(${trig}, ${echo});`);
        if (d.sendToViz !== false) out.push(`${ind}Serial.print("SENSOR,distance,${v},"); Serial.println(${v}, 1);`);
        break;
      }
      case "dht11": {
        const pin = d.pin ?? 2;
        const t = declare(d.tempVar, "temperature");
        const h = declare(d.humVar, "humidity");
        includes.add("#include <DHT.h>");
        globals.set(`__dht_${pin}`, `DHT dht_${pin}(${pin}, DHT11);`);
        setup(`dht_${pin}`, `dht_${pin}.begin();`);
        out.push(`${ind}${t} = dht_${pin}.readTemperature();`, `${ind}${h} = dht_${pin}.readHumidity();`);
        if (d.sendToViz !== false) out.push(...sensorPrint(ind, t), ...sensorPrint(ind, h));
        break;
      }
      case "servo_motor": {
        const port = typeof d.servoPort === "string" && d.servoPort in board.servoPins ? d.servoPort : "S1";
        const name = `servo_${port.toLowerCase()}`;
        includes.add("#include <Servo.h>");
        globals.set(`__${name}`, `Servo ${name};`);
        setup(name, `${name}.attach(${board.servoPins[port]});`);
        out.push(`${ind}${name}.write(${d.angle ?? 90});  // ${port} = pin ${board.servoPins[port]}`);
        break;
      }
      case "lcd_16x2": {
        includes.add("#include <Wire.h>");
        includes.add("#include <LiquidCrystal_I2C.h>");
        globals.set("__lcd", `LiquidCrystal_I2C lcd(${d.address ?? "0x27"}, 16, 2);  // SDA=A4 SCL=A5`);
        setup("lcd", "lcd.init();");
        out.push(`${ind}${d.backlight === false ? "lcd.noBacklight();" : "lcd.backlight();"}`, `${ind}lcd.clear();`);
        // "{name}" prints a variable; "{v}" is the block's Variable field.
        [d.line1 ?? "Hello", d.line2 ?? "World"].forEach((line: string, row: number) => {
          out.push(`${ind}lcd.setCursor(0, ${row});`);
          for (const part of String(line).split(/(\{[A-Za-z_]\w*\})/).filter(Boolean)) {
            const m = part.match(/^\{(\w+)\}$/);
            const ref = m ? (m[1] === "v" ? String(d.varName ?? "").trim() : m[1]) : null;
            if (m && !ref) continue;
            out.push(`${ind}lcd.print(${ref ?? JSON.stringify(part)});`);
          }
        });
        break;
      }

      case "map_range":
        out.push(`${ind}${declare(d.varName, "mapped_value")} = map(${d.value || "value"}, ${d.fromMin ?? 0}, ${d.fromMax ?? board.adcMax}, ${d.toMin ?? 0}, ${d.toMax ?? 180});`);
        break;
      case "clamp":
        out.push(`${ind}${declare(d.varName, "clamped")} = constrain(${d.value || "value"}, ${d.minVal ?? 0}, ${d.maxVal ?? 100});`);
        break;
      case "random_number":
        out.push(`${ind}${declare(d.varName, "rand_val", "long")} = random(${d.from ?? 0}, ${Number(d.to ?? 100) + 1});`);
        break;

      default:
        unsupported.add(node.type ?? "unknown");
        out.push(`${ind}// "${node.type}" block is not available on ${board.label} yet`);
    }

    return out.concat(chain(nextOf(node), level, top));
  }

  // Roots = nodes with no incoming sequential edge (branch entries don't count).
  const hasIncoming = new Set(
    edges.filter((e) => !BRANCH_HANDLES.includes(e.sourceHandle ?? "")).map((e) => e.target)
  );
  const onceLines = nodes
    .filter((n) => !hasIncoming.has(n.id))
    .sort((a, b) => a.position.y - b.position.y)
    .flatMap((r) => chain(r.id, 1, true));

  const lines = [`// Generated by CodeLab for ${board.label}`];
  if (unsupported.size > 0) lines.push(`// Not available on this board: ${[...unsupported].join(", ")}`);
  lines.push("", ...includes);
  if (includes.size > 0) lines.push("");
  lines.push(...globals.values());
  if (globals.size > 0) lines.push("");
  lines.push("void setup() {", "  Serial.begin(115200);", ...setupLines.map((l) => `  ${l}`), ...onceLines, "}", "");
  lines.push("void loop() {", ...loopLines, "}", "");
  return lines.join("\n");
}
