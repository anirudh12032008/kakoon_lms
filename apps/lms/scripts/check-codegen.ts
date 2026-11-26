// Runnable check: every built-in demo must generate code on every board, with
// no "not available" / "Unknown node" markers (college demos). Prints the Arduino sketches so
// they can be compiled with arduino-cli.
//   TSX_TSCONFIG_PATH=tsconfig.app.json node --import ../../backend/api/node_modules/tsx/dist/esm/index.mjs scripts/check-codegen.ts [outDir]
import assert from "node:assert";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { BOARDS, BOARD_ORDER, useBoardStore } from "@/entities/board";
import { NODE_TYPES } from "@/entities/node";
import { generateCode } from "@/entities/node/lib/codegen";
import { pinDefaults } from "@/entities/node/lib/blockDefaults";
import { NODE_CATEGORIES, categoriesForBoard } from "@/entities/node/model";
import { getRequiredLibraries } from "@/features/editor/install-library/lib/libraryRegistry";
import { builtinTutorials } from "@/features/editor/tutorial/lib/tutorials";

const out = process.argv[2];
for (const boardId of BOARD_ORDER) {
  useBoardStore.getState().setBoard(boardId);
  const demos = builtinTutorials(boardId);
  assert(demos.length >= 4, `${boardId}: expected at least 4 built-in examples`);
  for (const t of demos) {
    const code = generateCode(t.nodes, t.edges);
    if (boardId === "kokoon") continue; // original robot set, left untouched
    assert(!/not available|Unknown node|WARNING: pin/.test(code), `${boardId}/${t.id} has an unsupported block or a pin the board lacks:\n${code}`);
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

// ─── Block-level validity: the generated code must at least be well-formed ────
// Every block type (a) alone at top level and (b) alone inside a Forever Loop, with empty data,
// plus the shapes that used to break: comment-only bodies in every loop and If branch.
type Flow = [Parameters<typeof generateCode>[0], Parameters<typeof generateCode>[1]];
const at = (id: string, type: string, y: number) => ({ id, type, position: { x: 0, y }, data: {} });
const flowsFor = (type: string): Record<string, Flow> => ({
  top: [[at("n", type, 0)], []],
  loop: [[at("loop", "forever_loop", 0), at("n", type, 100)], [{ id: "e", source: "loop", sourceHandle: "body", target: "n" }]],
});
const COMMENT_ONLY = "servo_calibration"; // emits only a comment on MicroPython
const EDGE_FLOWS: Record<string, Flow> = {
  ...Object.fromEntries(["for_loop", "while_loop", "repeat"].map((loop) => [
    `${loop}_comment_body`,
    [[at("loop", loop, 0), at("n", COMMENT_ONLY, 100)], [{ id: "e", source: "loop", sourceHandle: "body", target: "n" }]] as Flow,
  ])),
  if_comment_branches: [
    [at("if", "if_else", 0), at("t", COMMENT_ONLY, 100), at("f", COMMENT_ONLY, 100)],
    [{ id: "e1", source: "if", sourceHandle: "true", target: "t" }, { id: "e2", source: "if", sourceHandle: "false", target: "f" }],
  ],
  if_in_loop_in_loop: [
    [at("a", "forever_loop", 0), at("b", "repeat", 100), at("c", "if_else", 200)],
    [{ id: "e1", source: "a", sourceHandle: "body", target: "b" }, { id: "e2", source: "b", sourceHandle: "body", target: "c" }],
  ],
};
const allFlows = (): [string, Flow][] => [
  ...Object.keys(NODE_TYPES).flatMap((type) => Object.entries(flowsFor(type)).map(([k, f]) => [`${k}_${type}`, f] as [string, Flow])),
  ...Object.entries(EDGE_FLOWS),
];

// MicroPython boards: syntax check with the host python3 (ast.parse only, nothing is imported or run).
const pyDir = mkdtempSync(`${tmpdir()}/codegen-py-`);
const pyFiles = ["public/libs/mfrc522.py"];
for (const boardId of ["esp32", "kokoon"] as const) {
  useBoardStore.getState().setBoard(boardId);
  for (const [name, [nodes, edges]] of allFlows()) {
    const file = `${pyDir}/${boardId}-${name}.py`;
    writeFileSync(file, generateCode(nodes, edges));
    pyFiles.push(file);
  }
}
const pyErrors = execFileSync("python3", ["-c", `
import ast, sys
for f in sys.argv[1:]:
    try: ast.parse(open(f).read())
    except SyntaxError as e: print(f, "line", e.lineno, e.msg)
`, ...pyFiles], { encoding: "utf8" }).trim();
assert(!pyErrors, `generated MicroPython does not parse:\n${pyErrors}`);
console.log(`ok python syntax: ${pyFiles.length} files (esp32 + kokoon, every block at top level and in a loop, edge cases, mfrc522.py)`);

// Arduino: no compiler here, so check that brackets balance once strings and comments are removed.
function unbalanced(code: string): string | null {
  const bare = code.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
  const closers: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of bare) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (ch in closers && stack.pop() !== closers[ch]) return `unexpected "${ch}"`;
  }
  return stack.length ? `unclosed "${stack.pop()}"` : null;
}
assert(unbalanced("void f() { g(\"}\"); }") === null && unbalanced("void f() { if (x) { }") !== null, "bracket checker self-test");
useBoardStore.getState().setBoard("arduino_uno");
// Blocks this pass gave real Arduino code: written out as blk_<type>.ino for arduino-cli.
const NEWLY_ON_UNO = [
  "dc_motor_single", "l298n_motor", "seven_seg", "ir_receiver", "i2c_scanner",
  "serial_monitor", "timer_interval", "variable_state", "math_transform",
];
for (const [name, [nodes, edges]] of allFlows()) {
  const code = generateCode(nodes, edges);
  const problem = unbalanced(code);
  assert(!problem, `arduino_uno/${name}: ${problem}:\n${code}`);
  assert(code.includes("void setup() {") && code.includes("void loop() {"), `arduino_uno/${name}: missing setup()/loop()`);
  assert(!/\(\s*(==|!=|<=?|>=?)/.test(code), `arduino_uno/${name}: condition with an empty left side:\n${code}`);
  const type = name.replace(/^loop_/, "");
  if (name.startsWith("loop_") && NEWLY_ON_UNO.includes(type)) {
    assert(!code.includes("not available"), `arduino_uno/${type} must generate real code:\n${code}`);
    if (out) {
      mkdirSync(`${out}/blk_${type}`, { recursive: true });
      writeFileSync(`${out}/blk_${type}/blk_${type}.ino`, code);
    }
  }
}
console.log(`ok arduino_uno structure: ${allFlows().length} sketches have balanced brackets`);

// Palette allowlists (NodeDef.boards) must match what the Arduino generator can really do.
const loopCode = (type: string) => generateCode(...flowsFor(type).loop);
const unoPalette = new Set(categoriesForBoard("arduino_uno").flatMap((c) => c.nodes.map((n) => n.type)));
for (const def of NODE_CATEGORIES.flatMap((c) => c.nodes)) {
  assert(def.type in NODE_TYPES, `palette entry ${def.type} has no node component`);
  const works = !loopCode(def.type).includes("not available");
  assert(unoPalette.has(def.type) === works, `${def.type}: palette says ${unoPalette.has(def.type) ? "shown" : "hidden"} on Arduino Uno but the generator says ${works ? "available" : "not available"}`);
}
for (const boardId of BOARD_ORDER) {
  const hidden = NODE_CATEGORIES.flatMap((c) => c.nodes).filter((n) => n.boards && !n.boards.includes(boardId)).map((n) => n.type);
  console.log(`  hidden from the ${boardId} palette (${hidden.length}): ${hidden.join(", ")}`);
}

// RFID on MicroPython: the generated code must pull in the bundled driver and use its API.
useBoardStore.getState().setBoard("esp32");
const rfidCode = loopCode("rfid_reader");
assert(getRequiredLibraries(rfidCode).some((l) => l.path === "/libs/mfrc522.py"), "rfid_reader code does not trigger the mfrc522 library");
assert(/MFRC522\(\d+, \d+, \d+, \d+, \d+\)/.test(rfidCode) && rfidCode.includes(".request(_rfid.REQIDL)") && rfidCode.includes(".anticoll()"), "rfid_reader code does not match mfrc522.py");
console.log("ok rfid_reader: uses public/libs/mfrc522.py (sck, mosi, miso, rst, cs)");
