// Runnable check: every built-in demo must generate code on every board, with
// no "not available" / "Unknown node" markers (college demos). Prints the Arduino sketches so
// they can be compiled with arduino-cli.
//   TSX_TSCONFIG_PATH=tsconfig.app.json node --import ../../backend/api/node_modules/tsx/dist/esm/index.mjs scripts/check-codegen.ts [outDir]
import assert from "node:assert";
import { writeFileSync, mkdirSync } from "node:fs";
import { BOARDS, BOARD_ORDER, useBoardStore } from "@/entities/board";
import { NODE_TYPES } from "@/entities/node";
import { generateCode } from "@/entities/node/lib/codegen";
import { pinDefaults } from "@/entities/node/lib/blockDefaults";
import { builtinTutorials } from "@/features/editor/tutorial/lib/tutorials";

const out = process.argv[2];
for (const boardId of BOARD_ORDER) {
  useBoardStore.getState().setBoard(boardId);
  const demos = builtinTutorials(boardId);
  assert(demos.length >= 4, `${boardId}: expected at least 4 built-in examples`);
  for (const t of demos) {
    const code = generateCode(t.nodes, t.edges);
    if (boardId === "kokoon") continue; // original robot set, left untouched
    assert(!/not available|Unknown node/.test(code), `${boardId}/${t.id} has an unsupported block:\n${code}`);
    assert(!code.includes("neopixel"), `${boardId}/${t.id} touches the Kokoon NeoPixel`);
    if (out) {
      const ino = boardId === "arduino_uno";
      const dir = ino ? `${out}/${t.id}` : out;
      mkdirSync(dir, { recursive: true });
      writeFileSync(ino ? `${dir}/${t.id}.ino` : `${dir}/${boardId}-${t.id}.py`, code);
    }
  }
  console.log(`ok ${boardId}: ${demos.map((t) => t.id).join(", ")}`);
}

// Every registered block, alone in a Forever Loop with empty data (= all defaults).
const NEW_BLOCKS = [
  "gas_sensor", "pir_motion", "rain_sensor", "water_level", "sound_sensor", "ldr_sensor",
  "led", "relay", "rfid_reader", "rtc_time", "bluetooth_serial",
];
// Blocks that must generate real code on both boards (new ones + the ones given per-board default pins).
const MUST_WORK = new Set([
  ...NEW_BLOCKS, "gpio_pin", "pin_write", "pin_read", "push_button", "pwm", "pwm_output", "adc", "buzzer_tone",
  "analog_sensor", "soil_moisture", "touch_sensor", "button_digital_input", "dht11", "ir_sensor",
  "ultrasonic", "ultrasonic_sensor",
]);
for (const boardId of ["esp32", "arduino_uno"] as const) {
  useBoardStore.getState().setBoard(boardId);
  for (const [role, pin] of Object.entries(pinDefaults(boardId))) {
    assert(BOARDS[boardId].validPins?.includes(pin), `${boardId}: default ${role} pin ${pin} does not exist on the board`);
  }
  const unavailable: string[] = [];
  for (const type of Object.keys(NODE_TYPES)) {
    const code = generateCode(
      [
        { id: "loop", type: "forever_loop", position: { x: 0, y: 0 }, data: {} },
        { id: "n", type, position: { x: 0, y: 100 }, data: {} },
      ],
      [{ id: "e", source: "loop", sourceHandle: "body", target: "n" }],
    );
    assert(!code.includes("Unknown node"), `${boardId}/${type} has no codegen case:\n${code}`);
    if (code.includes("not available")) {
      assert(!MUST_WORK.has(type), `${boardId}/${type} must generate real code:\n${code}`);
      unavailable.push(type);
    }
    if (out && boardId === "arduino_uno" && NEW_BLOCKS.includes(type)) {
      mkdirSync(`${out}/new_${type}`, { recursive: true });
      writeFileSync(`${out}/new_${type}/new_${type}.ino`, code);
    }
  }
  console.log(`ok ${boardId}: all ${Object.keys(NODE_TYPES).length} block types generate code`);
  if (unavailable.length) console.log(`  not available on ${boardId} (${unavailable.length}): ${unavailable.join(", ")}`);
}
