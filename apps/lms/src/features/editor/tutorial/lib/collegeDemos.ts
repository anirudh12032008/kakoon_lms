import type { Node, Edge } from "@xyflow/react";
import type { BoardId } from "@/entities/board";
import { pinDefaults } from "@/entities/node/lib/blockDefaults";
import { makeTutorial, type Tutorial } from "./tutorials";

/**
 * Demo projects for the college IoT course, taken from the class project list.
 * Same graphs on every board. Pins come from the per-board block defaults
 * (blockDefaults.ts) wherever nothing collides, so a block dropped by hand
 * already has the pin the demo uses. Only what the defaults cannot know lives
 * in TUNING: analog thresholds (ESP32 ADC is 12-bit, Arduino Uno is 10-bit)
 * and the few pins that had to move.
 */
interface Tuning {
  /** LDR: "dark" below this reading */
  darkBelow: number;
  /** soil probe: "dry" above this reading */
  dryAbove: number;
  /** MQ gas sensor: "leak" above this reading */
  gasAbove: number;
  /** rain board reads lower the wetter it gets: "raining" below this reading */
  wetBelow: number;
  /** water level strip: "tank full" above this reading */
  waterAbove: number;
  /** traffic signal LEDs: red, yellow, green */
  lights: [number, number, number];
  /** servo port of the door lock */
  lockServo: string;
}

const TUNING: Partial<Record<BoardId, Tuning>> = {
  // soil_moisture reads 16-bit on MicroPython, every other analog block 12-bit.
  esp32:       { darkBelow: 1500, dryAbove: 40000, gasAbove: 1600, wetBelow: 2000, waterAbove: 1500, lights: [25, 26, 27], lockServo: "S1" },
  // Uno: RFID owns pins 9-13 (RST, SS, SPI), so the lock servo is S4 (pin 6) instead of S1 (pin 9).
  arduino_uno: { darkBelow: 400,  dryAbove: 600,   gasAbove: 400,  wetBelow: 500,  waterAbove: 400,  lights: [5, 4, 3],    lockServo: "S4" },
};

/** Card that opens the door lock demo. Students replace it with their own card's UID. */
const ALLOWED_CARD = "A1B2C3D4";

type Data = Record<string, unknown>;
type Block = [type: string, data?: Data];
interface Branch { cond: Data; yes: Seq; no: Seq }
type Seq = (Block | Branch)[];

// Blocks taller than one layout row.
const TALL = new Set(["lcd_16x2", "ultrasonic", "rfid_reader", "dht11", "servo_motor"]);

/**
 * Builds the graph: `setup` blocks run once, then a Forever Loop runs `body`.
 * Every block gets its own row, so top to bottom is the order the code runs in;
 * If/Else branches step one column to the right.
 */
function flow(p: string, sleepMs: number, body: Seq, setup: Block[] = []) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let row = 0;
  const add = (type: string, data: Data = {}, col: number) => {
    const id = `${p}_${nodes.length + 1}`;
    nodes.push({ id, type, position: { x: 100 + col * 300, y: 100 + row * 190 }, data });
    row += TALL.has(type) ? 2 : 1;
    return id;
  };
  const seq = (items: Seq, col: number, from: string, handle?: string) => {
    for (const item of items) {
      const id = Array.isArray(item) ? add(item[0], item[1], col) : add("if_else", item.cond, col);
      edges.push({ id: `${p}_e${edges.length + 1}`, source: from, target: id, ...(handle && { sourceHandle: handle }) });
      if (!Array.isArray(item)) {
        seq(item.yes, col + 1, id, "true");
        seq(item.no, col + 1, id, "false");
      }
      from = id;
      handle = undefined; // the next block hangs off the bottom output
    }
  };
  for (const [type, data] of setup) add(type, data, 0);
  seq(body, 1, add("forever_loop", sleepMs ? { sleepEnabled: true, sleepMs } : {}, 0), "body");
  return { nodes, edges };
}

const when = (left: string, op: string, right: number, yes: Seq, no: Seq = []): Branch =>
  ({ cond: { left, op, right }, yes, no });
const led = (state: boolean, pin?: number): Block => ["led", pin === undefined ? { state } : { pin, state }];
const relay = (state: boolean): Block => ["relay", { state }];
const sleep = (seconds: number): Block => ["sleep", { seconds }];

export function collegeDemos(boardId: BoardId): Tutorial[] {
  const t = TUNING[boardId];
  if (!t) return [];
  const P = pinDefaults(boardId);

  // The Buzzer Tone block cannot switch the sound off again, so the alarms use
  // an active buzzer (beeps while its pin is HIGH) on a plain output pin.
  const buzzerPin: Block[] = [["gpio_pin", { pin: P.buzzer, mode: "OUT" }]];
  const buzzer = (value: boolean): Block => ["pin_write", { pin: P.buzzer, value }];
  const servo = (angle: number, servoPort = "S1"): Block => ["servo_motor", { servoPort, angle }];
  const [red, yellow, green] = t.lights;

  const demo = (id: string, title: string, description: string, difficulty: Tutorial["difficulty"],
    components: string[], g: { nodes: Node[]; edges: Edge[] }) =>
    makeTutorial(id, title, description, difficulty, components, g.nodes, g.edges, boardId);

  return [
    demo("demo_street_light", "Automatic Street Light",
      "An LDR measures daylight. When it gets dark the LED (your street light) switches on, and off again in the morning.",
      "Easy", ["ldr_sensor", "if_else", "led"],
      flow("street", 200, [["ldr_sensor"], when("light", "<", t.darkBelow, [led(true)], [led(false)])])),

    demo("demo_smart_dustbin", "Smart Dustbin",
      "An ultrasonic sensor spots a hand within 15 cm and a servo swings the lid open, then closes it when the hand is gone.",
      "Easy", ["ultrasonic", "servo_motor", "if_else"],
      flow("bin", 200, [["ultrasonic"], when("distance", "<", 15, [servo(90)], [servo(0)])])),

    demo("demo_room_climate", "Room Temperature and Humidity Monitoring",
      "A DHT11 reads temperature and humidity every two seconds and shows both on a 16x2 I2C LCD and in the live charts.",
      "Easy", ["dht11", "lcd_16x2"],
      flow("room", 2000, [["dht11"], ["lcd_16x2", { line1: "Temp: {temperature} C", line2: "Hum:  {humidity} %" }]])),

    demo("demo_plant_watering", "Smart Plant Watering System",
      "A soil moisture probe checks the pot. When the soil is dry a relay turns the water pump on until it is wet again.",
      "Medium", ["soil_moisture", "if_else", "relay"],
      flow("plant", 1000, [["soil_moisture", { varName: "moisture" }], when("moisture", ">", t.dryAbove, [relay(true)], [relay(false)])])),

    demo("demo_gas_leak", "Smart Gas Leakage Monitoring",
      "An MQ-2 gas sensor sniffs the air. When the reading goes above the threshold you chose, a buzzer module and a warning LED switch on until the air is clear.",
      "Easy", ["gas_sensor", "if_else", "gpio_pin", "pin_write", "led"],
      flow("gas", 500, [["gas_sensor"], when("gas", ">", t.gasAbove, [buzzer(true), led(true)], [buzzer(false), led(false)])], buzzerPin)),

    demo("demo_pir_light", "PIR Motion Based Automatic Light",
      "A PIR sensor notices when someone moves in the room. A relay switches the light on while there is motion and off when the room is empty.",
      "Easy", ["pir_motion", "if_else", "relay"],
      flow("pir", 200, [["pir_motion"], when("motion", "==", 1, [relay(true)], [relay(false)])])),

    demo("demo_rain_detector", "Smart Rain Detector",
      "A rain sensor board reads lower when water drops land on it. When it rains, a buzzer module sounds and \"Rain detected!\" is printed in the console.",
      "Easy", ["rain_sensor", "if_else", "gpio_pin", "pin_write", "print"],
      flow("rain", 500, [["rain_sensor"],
        when("rain", "<", t.wetBelow, [buzzer(true), ["print", { text: "'Rain detected!'" }]], [buzzer(false)])], buzzerPin)),

    demo("demo_water_level", "Water Level Monitoring",
      "A water level sensor in the tank shows its reading on a 16x2 I2C LCD. When the tank is nearly full, a buzzer module warns you to stop the pump.",
      "Medium", ["water_level", "lcd_16x2", "if_else", "gpio_pin", "pin_write"],
      flow("water", 1000, [["water_level"], ["lcd_16x2", { line1: "Water level", line2: "{water_level}" }],
        when("water_level", ">", t.waterAbove, [buzzer(true)], [buzzer(false)])], buzzerPin)),

    demo("demo_distance_meter", "Distance Measurement using Ultrasonic Sensor",
      "An ultrasonic sensor measures how far away an object is and shows the distance in centimetres on a 16x2 I2C LCD.",
      "Easy", ["ultrasonic", "variable", "lcd_16x2"],
      // Whole centimetres, so the number always fits the 16 columns.
      flow("dist", 500, [["ultrasonic"], ["variable", { name: "cm", value: "int(distance)" }],
        ["lcd_16x2", { line1: "Distance", line2: "{cm} cm" }]])),

    demo("demo_clap_switch", "Clap Switch",
      "A sound sensor hears a clap. Each clap flips the LED: clap once to switch it on, clap again to switch it off.",
      "Medium", ["sound_sensor", "variable", "if_else", "led", "sleep"],
      // "lamp" remembers the state between claps; the short sleep stops one clap counting twice.
      flow("clap", 10, [["sound_sensor", { sendToViz: false }],
        when("sound", "==", 1, [
          ["variable", { name: "lamp", value: "1 - lamp" }],
          when("lamp", "==", 1, [led(true)], [led(false)]),
          sleep(0.3),
        ])], [["variable", { name: "lamp", value: 0 }]])),

    demo("demo_traffic_signal", "Traffic Signal Simulation",
      "Three LEDs act as a traffic signal: red for 5 seconds, green for 5 seconds, then yellow for 2 seconds, again and again.",
      "Easy", ["led", "sleep", "forever_loop"],
      flow("traffic", 0, [
        led(true, red), sleep(5), led(false, red),
        led(true, green), sleep(5), led(false, green),
        led(true, yellow), sleep(2), led(false, yellow),
      ])),

    demo("demo_rfid_door_lock", "Smart Door Lock (RFID)",
      "Tap an RFID card on the reader: the allowed card turns the servo to open the lock for 3 seconds, any other card sounds a buzzer module. Each card's ID is printed in the console so you can put your own card in the If block.",
      "Hard", ["rfid_reader", "if_else", "servo_motor", "gpio_pin", "pin_write", "print", "sleep"],
      // The If/Else value box only takes numbers, so the text comparisons sit in
      // the left box in brackets: (a == "b") is 1 when true in both languages.
      flow("lock", 200, [["rfid_reader"],
        when('(card_uid != "")', "==", 1, [
          ["print", { text: "card_uid" }],
          when(`(card_uid == "${ALLOWED_CARD}")`, "==", 1,
            [servo(90, t.lockServo), sleep(3), servo(0, t.lockServo)],
            [buzzer(true), sleep(1), buzzer(false)]),
        ])], [...buzzerPin, servo(0, t.lockServo)])), // start locked

    demo("demo_fan_control", "Room Temperature Based Fan Control",
      "A DHT11 measures the room temperature. When it is hotter than 30 C a relay switches the fan on, and off again when the room cools down.",
      "Easy", ["dht11", "if_else", "relay"],
      flow("fan", 2000, [["dht11"], when("temperature", ">", 30, [relay(true)], [relay(false)])])),
  ];
}
