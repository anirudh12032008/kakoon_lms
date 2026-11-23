import type { Node, Edge } from "@xyflow/react";
import { BOARDS, type BoardId } from "@/entities/board";
import { makeTutorial, type Tutorial } from "./tutorials";

/**
 * Demo projects for the college IoT course - the four most-assigned titles
 * from the class project list. Same graphs on every board; only the pins and
 * analog thresholds differ (ESP32 ADC is 12-bit, Arduino Uno is 10-bit).
 */
interface DemoPins {
  ldr: number; led: number; trig: number; echo: number;
  dht: number; soil: number; relay: number;
  /** "dark" below this LDR reading / "dry" above this soil reading */
  darkBelow: number; dryAbove: number;
}

const PINS: Partial<Record<BoardId, DemoPins>> = {
  // soil_moisture reads 16-bit on MicroPython, analog_sensor reads 12-bit.
  esp32:       { ldr: 34, led: 2,  trig: 5, echo: 18, dht: 4, soil: 35, relay: 26, darkBelow: 1500, dryAbove: 40000 },
  // Uno: A0 = pin 14, A1 = pin 15. Trig/echo avoid the servo on pin 9.
  arduino_uno: { ldr: 14, led: 13, trig: 7, echo: 8,  dht: 2, soil: 15, relay: 4,  darkBelow: 400,  dryAbove: 600 },
};

const at = (col: number, row: number) => ({ x: 100 + col * 300, y: 100 + row * 190 });
const loop = (id: string, sleepMs: number): Node =>
  ({ id, type: "forever_loop", position: at(0, 0), data: { sleepEnabled: true, sleepMs } });

/** loop → sensor → if/else → (true block, false block) */
function senseAndReact(p: string, sleepMs: number, sensor: Node, cond: Record<string, unknown>, onTrue: Node, onFalse: Node, extra: Node[] = []) {
  const nodes: Node[] = [
    ...extra,
    loop(`${p}_loop`, sleepMs),
    { ...sensor, id: `${p}_sense`, position: at(1, 0) },
    { id: `${p}_if`, type: "if_else", position: at(1, 1), data: cond },
    { ...onTrue, id: `${p}_yes`, position: at(2, 1) },
    { ...onFalse, id: `${p}_no`, position: at(2, 2) },
  ];
  const edges: Edge[] = [
    { id: `${p}_e1`, source: `${p}_loop`, target: `${p}_sense`, sourceHandle: "body" },
    { id: `${p}_e2`, source: `${p}_sense`, target: `${p}_if` },
    { id: `${p}_e3`, source: `${p}_if`, target: `${p}_yes`, sourceHandle: "true" },
    { id: `${p}_e4`, source: `${p}_if`, target: `${p}_no`, sourceHandle: "false" },
  ];
  return { nodes, edges };
}

const blank = { id: "", position: { x: 0, y: 0 } };
const outputPin = (id: string, pin: number): Node =>
  ({ id, type: "gpio_pin", position: at(0, -1), data: { pin, mode: "OUT" } });
const write = (pin: number, value: boolean): Node =>
  ({ ...blank, type: "pin_write", data: { pin, value } });
const servo = (angle: number): Node =>
  ({ ...blank, type: "servo_motor", data: { servoPort: "S1", angle } });

export function collegeDemos(boardId: BoardId): Tutorial[] {
  const p = PINS[boardId];
  if (!p) return [];
  const board = BOARDS[boardId].label;

  const street = senseAndReact("street", 200,
    { ...blank, type: "analog_sensor", data: { pin: p.ldr, varName: "light" } },
    { left: "light", op: "<", right: p.darkBelow },
    write(p.led, true), write(p.led, false),
    [outputPin("street_led", p.led)]);

  const bin = senseAndReact("bin", 200,
    { ...blank, type: "ultrasonic", data: { trigPin: p.trig, echoPin: p.echo, varName: "distance" } },
    { left: "distance", op: "<", right: 15 },
    servo(90), servo(0));

  const plant = senseAndReact("plant", 1000,
    { ...blank, type: "soil_moisture", data: { pin: p.soil, varName: "moisture" } },
    { left: "moisture", op: ">", right: p.dryAbove },
    write(p.relay, true), write(p.relay, false),
    [outputPin("plant_relay", p.relay)]);

  const roomNodes: Node[] = [
    loop("room_loop", 2000),
    { id: "room_dht", type: "dht11", position: at(1, 0), data: { pin: p.dht, tempVar: "temperature", humVar: "humidity" } },
    { id: "room_lcd", type: "lcd_16x2", position: at(1, 1), data: { line1: "Temp: {temperature} C", line2: "Hum:  {humidity} %" } },
  ];
  const roomEdges: Edge[] = [
    { id: "room_e1", source: "room_loop", target: "room_dht", sourceHandle: "body" },
    { id: "room_e2", source: "room_dht", target: "room_lcd" },
  ];

  return [
    makeTutorial("demo_street_light", "Automatic Street Light",
      "An LDR measures daylight. When it gets dark the LED (your street light) switches on, and off again in the morning.",
      "Easy", ["analog_sensor", "if_else", "pin_write"], street.nodes, street.edges, board),
    makeTutorial("demo_smart_dustbin", "Smart Dustbin",
      "An ultrasonic sensor spots a hand within 15 cm and a servo swings the lid open, then closes it when the hand is gone.",
      "Easy", ["ultrasonic", "servo_motor", "if_else"], bin.nodes, bin.edges, board),
    makeTutorial("demo_room_climate", "Room Temperature and Humidity Monitoring",
      "A DHT11 reads temperature and humidity every two seconds and shows both on a 16×2 I2C LCD and in the live charts.",
      "Easy", ["dht11", "lcd_16x2"], roomNodes, roomEdges, board),
    makeTutorial("demo_plant_watering", "Smart Plant Watering System",
      "A soil moisture probe checks the pot. When the soil is dry a relay turns the water pump on until it is wet again.",
      "Medium", ["soil_moisture", "if_else", "pin_write"], plant.nodes, plant.edges, board),
  ];
}
