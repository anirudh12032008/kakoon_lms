import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BoardId } from "@/entities/board";

/**
 * The study plan. This file is the single source of truth for the Learn page:
 * three tiers, each a list of modules. A module with `lessons` is written and
 * open; a module with only `topics` is shown as an outline ("coming up").
 *
 * Lesson text lives in ../content/<moduleId>.ts and is loaded on demand.
 */

// ── Lesson content model ────────────────────────────────────────────────────
// Text supports two inline marks: **bold** and `code`. Pin numbers, voltages and
// ADC ranges that differ between boards never go in prose: use a `wiring` or
// `code` block, which is generated for whichever board the student selected.
export type Block =
  | FlatBlock
  /**
   * "Go deeper": derivations, edge cases and background a student can skip.
   * Folded away in Normal mode and opened in Detailed mode.
   */
  | { t: "deep"; title: string; blocks: FlatBlock[] };

export type FlatBlock =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "note"; kind: "tip" | "warn" | "safety"; text: string }
  | { t: "formula"; text: string; caption?: string }
  | { t: "table"; head: string[]; rows: string[][]; caption?: string }
  /** Hand-written code, shown as is. Used from the intermediate tier on. */
  | { t: "snippet"; lang: "c" | "cpp" | "python" | "bash" | "text" | "xml" | "yaml"; code: string; caption?: string }
  /** An interactive widget: src/pages/learn/widgets/<id>.tsx (default export, no props). */
  | { t: "widget"; id: string }
  /** A monospace drawing: circuit, timing diagram, block diagram or frame layout. */
  | { t: "diagram"; text: string; caption?: string }
  /** Signal wiring for a built-in project, for the selected board. */
  | { t: "wiring"; demo: string }
  /** Generated program for a built-in project, for the selected board. */
  | { t: "code"; demo: string };

export interface QuizItem {
  q: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Shown after answering: why the right option is right. */
  why: string;
}

/** Practice is optional. Later tiers are concept-led and may have none. */
export type Practice =
  | { kind: "project"; demo: string; task: string } // open a built-in project in the editor
  | { kind: "build"; task: string; steps: string[] } // build it yourself in the editor
  | { kind: "bench"; task: string; steps: string[] }; // hands-on, no editor needed

export interface Lesson {
  id: string;
  /** What the student can do afterwards. */
  outcomes: string[];
  blocks: Block[];
  mistakes?: string[];
  quiz: QuizItem[];
  practice?: Practice;
}

/** Each content file default-exports its module's lessons, keyed by lesson id. */
export type ModuleContent = Record<string, Lesson>;

// ── Outline model ───────────────────────────────────────────────────────────
export interface LessonMeta {
  id: string;
  title: string;
  minutes: number;
  /** Set when a lesson only makes sense on some boards. */
  boards?: BoardId[];
}

export interface ModuleMeta {
  id: string;
  title: string;
  summary: string;
  outcomes: string[];
  /** Strand within the tier, e.g. "Electronics" or "Robotics". */
  track?: string;
  /** Rough study time at about six hours a week. */
  weeks?: number;
  /** Ids of modules to finish first. */
  needs?: string[];
  /** Outline of what the module covers. */
  topics: string[];
  /** Built-in projects (ids from collegeDemos) or a described exit project. */
  projects?: string[];
  exitProject?: string;
  /** Present once the lessons are written. */
  lessons?: LessonMeta[];
}

export interface Tier {
  id: "beginner" | "intermediate" | "advanced";
  title: string;
  blurb: string;
  /** How this tier is studied: the editor matters less as the tiers go up. */
  how: string;
  /** Directions a student can choose between. Modules name theirs in `track`. */
  tracks?: { name: string; blurb: string }[];
  modules: ModuleMeta[];
}

export const CURRICULUM: Tier[] = [
  {
    id: "beginner",
    title: "Beginner: Foundations",
    blurb: "From never having touched a circuit to building and explaining a complete sensor-to-action project.",
    how: "Short theory lessons, then build with blocks in the editor. Every module ends in a project from the class list.",
    modules: [
      {
        id: "b1",
        title: "Meet your board",
        summary: "What a microcontroller is, how the Arduino Uno and ESP32 differ, and how to get a first program running.",
        outcomes: ["Explain what a microcontroller does", "Tell the Uno and ESP32 apart and pick one for a job", "Run a first program from the editor"],
        topics: ["Computer vs microcontroller", "Inputs, processing, outputs", "Arduino Uno and ESP32 side by side", "The editor: blocks, code, hardware view", "Upload, run and the serial terminal"],
        exitProject: "Blink the on-board LED at a speed you choose",
        lessons: [
          { id: "b1-what-is-a-microcontroller", title: "What is a microcontroller?", minutes: 10 },
          { id: "b1-uno-and-esp32", title: "Arduino Uno and ESP32 side by side", minutes: 12 },
          { id: "b1-first-program", title: "Your first program: blink", minutes: 15 },
        ],
      },
      {
        id: "b2",
        title: "Electricity you actually need",
        summary: "Voltage, current and resistance, Ohm's law, and how to build a circuit on a breadboard without damaging anything.",
        outcomes: ["Use Ohm's law to choose a resistor", "Wire an LED safely", "Read a breadboard and power rails", "Measure voltage with a multimeter"],
        needs: ["b1"],
        topics: ["Voltage, current, resistance", "Ohm's law and power", "Why an LED needs a series resistor", "Breadboards, jumpers and power rails", "Ground, short circuits and safe habits", "Using a multimeter"],
        exitProject: "An external LED with a correctly chosen resistor",
        lessons: [
          { id: "b2-voltage-current-resistance", title: "Voltage, current and resistance", minutes: 12 },
          { id: "b2-ohms-law-and-leds", title: "Ohm's law and the LED resistor", minutes: 15 },
          { id: "b2-breadboard-and-power", title: "Breadboards, power and ground", minutes: 12 },
          { id: "b2-safety-and-measuring", title: "Safe habits and the multimeter", minutes: 12 },
        ],
      },
      {
        id: "b3",
        title: "Digital output and program flow",
        summary: "Switch pins on and off, and learn the three ideas every program is built from: sequence, repetition and variables.",
        outcomes: ["Drive several outputs from GPIO pins", "Explain HIGH and LOW", "Write a timed sequence with a loop", "Use a variable to hold state"],
        needs: ["b2"],
        topics: ["GPIO pins as outputs", "HIGH, LOW and logic levels", "Sequence and delay", "The forever loop, setup versus loop", "Variables"],
        projects: ["demo_traffic_signal"],
        lessons: [
          { id: "b3-gpio-outputs", title: "GPIO pins as outputs", minutes: 12 },
          { id: "b3-sequence-and-delay", title: "Sequence, delay and the traffic signal", minutes: 15 },
          { id: "b3-loops-and-variables", title: "Loops and variables", minutes: 15 },
        ],
      },
      {
        id: "b4",
        title: "Digital input and decisions",
        summary: "Read buttons and on/off sensors, and make the program choose what to do.",
        outcomes: ["Wire a button with a pull-up or pull-down", "Explain a floating input", "Use if/else to react to an input", "Handle bounce and remember state"],
        needs: ["b3"],
        topics: ["Pins as inputs", "Floating inputs, pull-up and pull-down resistors", "If / else and comparisons", "PIR motion sensors", "Switch bounce and toggling"],
        projects: ["demo_pir_light", "demo_clap_switch"],
        lessons: [
          { id: "b4-buttons-and-pull-resistors", title: "Buttons and pull resistors", minutes: 15 },
          { id: "b4-if-else", title: "Decisions with if / else", minutes: 12 },
          { id: "b4-pir-motion", title: "Sensing motion with a PIR", minutes: 12 },
          { id: "b4-bounce-and-state", title: "Bounce, toggling and the clap switch", minutes: 15 },
        ],
      },
      {
        id: "b5",
        title: "Analog input: measuring the world",
        summary: "Most of the world is not on or off. Learn how a board turns a voltage into a number and how to choose a threshold.",
        outcomes: ["Explain what an ADC does and what its numbers mean", "Build a voltage divider", "Read an analog sensor and pick a threshold from real readings"],
        needs: ["b4"],
        topics: ["Analog versus digital", "The ADC: resolution and reference", "Voltage dividers", "LDR, gas, rain, soil and water sensors", "Choosing and tuning thresholds", "Watching readings on the live chart"],
        projects: ["demo_street_light", "demo_gas_leak", "demo_rain_detector"],
        lessons: [
          { id: "b5-analog-and-the-adc", title: "Analog signals and the ADC", minutes: 12 },
          { id: "b5-voltage-divider-and-ldr", title: "The voltage divider and the light sensor", minutes: 18 },
          { id: "b5-choosing-thresholds", title: "Choosing a threshold from real readings", minutes: 15 },
          { id: "b5-analog-sensor-modules", title: "Gas, rain, soil and water sensor modules", minutes: 15 },
        ],
      },
      {
        id: "b6",
        title: "Time, distance and motion",
        summary: "Use precise timing to dim, to move a servo, to make sound and to measure distance.",
        outcomes: ["Explain PWM and duty cycle", "Position a servo", "Measure distance from an echo time", "Drive a buzzer"],
        needs: ["b5"],
        topics: ["PWM and duty cycle", "Servo motors and their signal", "Ultrasonic time of flight", "Buzzers: active versus passive"],
        projects: ["demo_smart_dustbin"],
        lessons: [
          { id: "b6-pwm", title: "PWM: faking analog with timing", minutes: 12 },
          { id: "b6-servo-motors", title: "Servo motors", minutes: 12 },
          { id: "b6-ultrasonic-distance", title: "Measuring distance with sound", minutes: 15 },
          { id: "b6-smart-dustbin", title: "Putting it together: the smart dustbin", minutes: 15 },
        ],
      },
      {
        id: "b7",
        title: "Switching real loads",
        summary: "A pin cannot power a motor, pump or lamp. Learn how relays and transistors let a small signal control a big load.",
        outcomes: ["Explain why a GPIO pin cannot drive a motor", "Use a relay module safely", "Power a project from the right supply"],
        needs: ["b6"],
        topics: ["Current limits of a pin", "Transistors as switches", "Relay modules, NO and NC contacts", "Flyback diodes", "Separate supplies and common ground", "Mains voltage: what students must not do"],
        projects: ["demo_plant_watering", "demo_fan_control"],
        lessons: [
          { id: "b7-why-a-pin-is-not-enough", title: "Why a pin is not enough", minutes: 12 },
          { id: "b7-relays-and-transistors", title: "Relays and transistors", minutes: 15 },
          { id: "b7-powering-a-project", title: "Powering a project", minutes: 12 },
        ],
      },
      {
        id: "b8",
        title: "Displays and digital sensors",
        summary: "Show results on a screen and read sensors that talk in data instead of voltage.",
        outcomes: ["Explain what a bus is", "Wire and use an I2C LCD", "Read temperature and humidity from a DHT11", "Debug with the serial terminal"],
        needs: ["b5"],
        topics: ["Serial data in one paragraph", "I2C: two wires, many devices, addresses", "16x2 LCD with an I2C backpack", "DHT11 temperature and humidity", "Debugging with print and the live chart"],
        projects: ["demo_room_climate", "demo_water_level", "demo_distance_meter"],
        lessons: [
          { id: "b8-buses-and-i2c", title: "Buses and I2C", minutes: 12 },
          { id: "b8-lcd-display", title: "The 16x2 LCD", minutes: 12 },
          { id: "b8-dht11", title: "Temperature and humidity with the DHT11", minutes: 12 },
          { id: "b8-debugging", title: "Debugging: finding out what is really happening", minutes: 12 },
        ],
      },
      {
        id: "b9",
        title: "Capstone: your own project",
        summary: "Plan, build, test and present a complete project that combines sensing, deciding and acting.",
        outcomes: ["Break a project into inputs, logic and outputs", "Plan pins and power before wiring", "Test in stages", "Document and present the result"],
        needs: ["b7", "b8"],
        topics: ["From idea to block diagram", "Pin and power planning", "Build and test in stages", "RFID and identity", "Writing up and presenting"],
        projects: ["demo_rfid_door_lock"],
        lessons: [
          { id: "b9-planning-a-project", title: "Planning a project", minutes: 15 },
          { id: "b9-rfid-door-lock", title: "Worked capstone: RFID door lock", minutes: 20 },
          { id: "b9-document-and-present", title: "Documenting and presenting", minutes: 12 },
        ],
      },
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate: Engineering it properly",
    blurb: "Second and third year level. The circuit theory, device physics, firmware and networking behind the beginner projects, taught to the point where you can design, not just assemble.",
    how: "Concept first: theory, calculation and bench measurement, with text code in C/C++ and MicroPython. The block editor is only a quick prototyping aid from here on.",
    modules: [
      {"id": "i1", "track": "Electronics", "weeks": 3, "title": "Circuit analysis for embedded work", "summary": "The circuit theory that every later module leans on, applied to circuits you can build.", "outcomes": ["Analyse a resistive network with Kirchhoff's laws", "Reduce a circuit to its Thevenin equivalent", "Predict an RC circuit's response in time and in frequency"], "needs": ["b9"], "topics": ["Kirchhoff's voltage and current laws, nodal analysis", "Thevenin and Norton equivalents, loading and source impedance", "Capacitors and inductors, RC and RL transients, time constants", "AC signals, phasors and impedance", "First-order low-pass and high-pass filters, cut-off frequency, Bode plots", "Using an oscilloscope and a function generator"], "exitProject": "Design, build and measure an RC filter and compare the measured response with the calculation", "lessons": [{"id":"i1-kirchhoff-and-nodal-analysis","title":"Kirchhoff's laws and nodal analysis","minutes":20},{"id":"i1-thevenin-norton-and-loading","title":"Thevenin, Norton and loading","minutes":20},{"id":"i1-capacitors-inductors-and-transients","title":"Capacitors, inductors and transients","minutes":25},{"id":"i1-ac-phasors-and-filters","title":"AC, phasors, impedance and first-order filters","minutes":25},{"id":"i1-oscilloscope-generator-and-rc-filter-project","title":"Oscilloscope, function generator and the RC filter project","minutes":25}]},
      {"id": "i2", "track": "Electronics", "weeks": 4, "title": "Semiconductor devices and analog building blocks", "summary": "Diodes, transistors and op-amps as the parts that interface a microcontroller to the real world.", "outcomes": ["Design a BJT or MOSFET switch with correct base or gate drive", "Choose and bias an op-amp stage", "Condition a sensor signal for an ADC"], "needs": ["i1"], "topics": ["Diodes: rectifier, Zener, Schottky, LED, protection and clamping", "BJT as a switch and as an amplifier, saturation and gain", "MOSFETs: threshold, on-resistance, logic-level parts, gate charge", "Op-amp ideal model, comparator, buffer, inverting and non-inverting amplifiers", "Difference and instrumentation amplifiers, Wheatstone bridge", "Signal conditioning: scaling, offset, anti-alias filtering, protection", "Reading a datasheet: absolute maximum ratings versus operating conditions"], "exitProject": "Sensor front-end: amplify and filter a small signal (thermistor, load cell or microphone) to fill an ADC's range", "lessons": [{"id":"i2-diodes-rectifiers-zeners-and-protection","title":"Diodes: rectifiers, Zeners, Schottkys and protection","minutes":25},{"id":"i2-transistor-switches-bjt-and-mosfet","title":"Transistors: BJT and MOSFET switches and the BJT amplifier","minutes":25},{"id":"i2-op-amp-fundamentals","title":"Op-amp fundamentals","minutes":20},{"id":"i2-difference-amps-instrumentation-and-bridges","title":"Bridges, difference and instrumentation amplifiers","minutes":20},{"id":"i2-signal-conditioning-and-datasheets","title":"Signal conditioning and reading datasheets","minutes":25}]},
      {"id": "i3", "track": "Electronics", "weeks": 3, "title": "Digital electronics", "summary": "Logic at the gate and flip-flop level, so you understand what the microcontroller's pins and peripherals really do.", "outcomes": ["Design small combinational and sequential circuits", "Interface parts with different logic levels safely", "Read a timing diagram"], "needs": ["i1"], "topics": ["Number systems, Boolean algebra, Karnaugh maps", "Logic families, voltage thresholds, fan-out, open-drain outputs", "Combinational blocks: multiplexers, decoders, adders", "Latches, flip-flops, counters, shift registers", "Timing: setup, hold, propagation delay, metastability", "Level shifting and bus transceivers", "Memory types: flash, EEPROM, SRAM"], "exitProject": "Expand outputs with a shift register and drive a multiplexed display, with a timing diagram", "lessons": [{"id":"i3-numbers-logic-and-kmaps","title":"Number systems, Boolean algebra and combinational logic","minutes":25},{"id":"i3-logic-families-and-level-shifting","title":"Logic families, thresholds and level shifting","minutes":25},{"id":"i3-flip-flops-timing-and-memory","title":"Flip-flops, counters, timing and memory","minutes":25},{"id":"i3-shift-registers-and-multiplexed-display","title":"The 74HC595 and a multiplexed display","minutes":25}]},
      {"id": "i4", "track": "Programming and embedded", "weeks": 4, "title": "Embedded C, C++ and MicroPython", "summary": "Leave blocks behind: write, structure and debug firmware in text.", "outcomes": ["Write modular firmware in C/C++ and MicroPython", "Use pointers, structs and bit operations correctly", "Explain what the compiler and linker produce"], "needs": ["b9"], "topics": ["From generated code to hand-written code", "Data types, integer width, overflow, fixed-point arithmetic", "Pointers, arrays, structs, enums", "Bitwise operations and bit fields", "Functions, scope, header files, modular design", "The build process: compile, link, flash; memory map, stack and heap", "Debugging: serial logging, assertions, a hardware debugger", "Version control with Git"], "exitProject": "Rewrite a beginner project as a clean multi-file firmware project under version control", "lessons": [{"id":"i4-types-overflow-and-fixed-point","title":"From blocks to C: types, overflow and fixed point","minutes":25},{"id":"i4-pointers-structs-and-bits","title":"Pointers, structs, enums and bit operations","minutes":20},{"id":"i4-modules-build-and-memory","title":"Modules, the build process and memory","minutes":25},{"id":"i4-debugging-and-version-control","title":"Debugging and version control","minutes":25}]},
      {"id": "i5", "track": "Programming and embedded", "weeks": 4, "title": "Microcontroller architecture and peripherals", "summary": "How the chip works inside: registers, clocks, timers and converters.", "outcomes": ["Configure GPIO, timers and ADC at register level", "Generate precise PWM and measure time with input capture", "Explain how an ADC converts and what limits its accuracy"], "needs": ["i4", "i3"], "topics": ["CPU, memory and bus: Harvard and von Neumann, AVR versus ARM versus Xtensa/RISC-V", "Clock sources, prescalers, reset and boot", "GPIO registers: direction, output, input, pull resistors", "Timers and counters: overflow, compare match, input capture, PWM modes", "ADC: successive approximation, sampling time, reference, resolution versus accuracy", "DAC and analog comparator", "Watchdog timer and brown-out detection", "Reading a microcontroller datasheet and reference manual"], "exitProject": "Blink, PWM and analog read written against the registers, with no framework functions", "lessons": [{"id":"i5-cpu-memory-clocks-reset","title":"Inside the chip: CPU, memory, clocks and reset","minutes":25},{"id":"i5-gpio-registers","title":"GPIO at register level","minutes":20},{"id":"i5-timers-capture-pwm","title":"Timers, input capture and PWM","minutes":30},{"id":"i5-adc","title":"The ADC: from voltage to number","minutes":25},{"id":"i5-comparator-dac-watchdog-datasheet","title":"Comparator, DAC, watchdog, brown-out and the datasheet","minutes":35}]},
      {"id": "i6", "track": "Programming and embedded", "weeks": 3, "title": "Real-time programming", "summary": "Make a single processor do several things on time.", "outcomes": ["Write non-blocking code", "Design firmware as state machines", "Use interrupts safely"], "needs": ["i5"], "topics": ["Blocking versus non-blocking code, the super-loop", "Timing with ticks, software timers", "Finite state machines and state charts", "Interrupts: vectors, priorities, latency, service routine rules", "Shared data, critical sections, volatile, atomicity", "Debouncing, edge detection, event queues", "Cooperative scheduling as a step towards an RTOS"], "exitProject": "Traffic junction controller with pedestrian request, written as an interrupt-driven state machine", "lessons": [{"id":"i6-super-loop-and-timing","title":"Non-blocking code, the super-loop and millis() timing","minutes":25},{"id":"i6-state-machines","title":"Finite state machines and state charts","minutes":25},{"id":"i6-interrupts-and-shared-data","title":"Interrupts and shared data","minutes":30},{"id":"i6-events-scheduling-traffic-junction","title":"Debouncing, event queues, scheduling and the traffic junction","minutes":40}]},
      {"id": "i7", "track": "Connectivity", "weeks": 3, "title": "Wired communication protocols", "summary": "Serial buses at the level of bits, frames and electrical signals.", "outcomes": ["Choose the right bus for a job", "Decode a bus capture and debug a silent device", "Write a device driver from a datasheet"], "needs": ["i5"], "topics": ["UART: framing, baud rate, parity, flow control, RS-232 and RS-485", "I2C: addressing, ACK, pull-up sizing, clock stretching, bus capacitance", "SPI: modes, chip select, daisy chains, speed limits", "1-Wire and single-wire sensors", "CAN bus: frames, arbitration, termination", "Using a logic analyser", "Register maps and driver structure"], "exitProject": "Driver for an I2C or SPI sensor written from its datasheet, verified with a logic analyser", "lessons": [{"id":"i7-uart-and-serial-standards","title":"UART and serial line standards","minutes":25},{"id":"i7-i2c-bus","title":"The I2C bus in depth","minutes":25},{"id":"i7-spi-and-one-wire","title":"SPI and the 1-Wire bus","minutes":25},{"id":"i7-can-bus","title":"CAN bus for robust networks","minutes":25},{"id":"i7-logic-analyser-and-drivers","title":"Logic analysers and writing bus drivers","minutes":25}]},
      {"id": "i8", "track": "Electronics", "weeks": 3, "title": "Sensors, measurement and signal processing", "summary": "Turn noisy raw numbers into measurements you can defend.", "outcomes": ["Calibrate a sensor and state its uncertainty", "Choose a sampling rate", "Implement basic digital filters"], "needs": ["i2", "i5"], "topics": ["Sensor characteristics: range, sensitivity, linearity, hysteresis, drift", "Accuracy, precision, resolution, error analysis", "Calibration: two-point, multi-point, lookup tables, curve fitting", "Sampling theorem, aliasing, quantisation noise", "Digital filters: moving average, exponential (IIR), median", "Inertial sensors: accelerometer, gyroscope, magnetometer", "Complementary filter for tilt estimation"], "exitProject": "Calibrated measurement system with a stated uncertainty, or an IMU tilt sensor with a complementary filter", "lessons": [{"id":"i8-sensor-characteristics-and-uncertainty","title":"Sensor characteristics, error and uncertainty","minutes":25},{"id":"i8-calibration-and-curve-fitting","title":"Calibration, lookup tables and curve fitting","minutes":25},{"id":"i8-sampling-and-digital-filters","title":"Sampling, aliasing, quantisation and digital filters","minutes":25},{"id":"i8-inertial-sensors-and-tilt","title":"Inertial sensors and the complementary filter","minutes":25}]},
      {"id": "i9", "track": "Electronics", "weeks": 4, "title": "Actuators and power electronics", "summary": "Move things, and power them properly.", "outcomes": ["Drive DC, stepper and servo motors correctly", "Read an encoder", "Design a power tree and size a battery"], "needs": ["i2", "i6"], "topics": ["DC motor model: torque, speed, back-EMF, stall current", "H-bridges, PWM frequency, braking, current sensing", "Stepper motors, drivers and microstepping", "Hobby servos versus closed-loop servos, brushless motors in outline", "Encoders: incremental, quadrature decoding", "Linear regulators versus switching regulators, efficiency and heat", "Batteries: Li-ion and LiPo chemistry, C-rate, protection, charging safety", "Power budgeting, decoupling, brown-outs, grounding"], "exitProject": "Motor speed measurement and open-loop control rig with a documented power budget", "lessons": [{"id":"i9-dc-motors-and-h-bridges","title":"DC motors, H-bridges and PWM","minutes":30},{"id":"i9-steppers-servos-and-brushless","title":"Steppers, servos and brushless motors","minutes":25},{"id":"i9-encoders-and-speed-measurement","title":"Quadrature encoders and speed measurement","minutes":25},{"id":"i9-regulators-and-batteries","title":"Regulators and lithium batteries","minutes":25},{"id":"i9-power-budget-and-motor-rig","title":"Power budgets, decoupling, brown-outs and grounding","minutes":25}]},
      {"id": "i10", "track": "Connectivity", "weeks": 4, "title": "Wireless and networking", "summary": "Connect devices to each other, to phones and to the internet.", "outcomes": ["Explain the TCP/IP stack as far as a device needs", "Build a device that publishes and subscribes over MQTT", "Design a BLE service"], "needs": ["i4"], "topics": ["Networking basics: IP, ports, DNS, TCP versus UDP", "Wi-Fi: station and access point modes, provisioning", "HTTP, REST APIs and JSON", "MQTT: topics, quality of service, retained messages, brokers", "WebSockets and device web servers", "Bluetooth Low Energy: GAP, GATT, services and characteristics", "LoRa, Zigbee, ESP-NOW and NB-IoT compared", "Link budget, antennas and range in outline"], "exitProject": "Sensor node reporting to an MQTT broker with a phone or web dashboard", "lessons": [{"id":"i10-networking-and-wifi","title":"Networking fundamentals and Wi-Fi","minutes":25},{"id":"i10-http-json-and-web-servers","title":"HTTP, JSON and web servers","minutes":25},{"id":"i10-mqtt","title":"MQTT publish and subscribe messaging","minutes":25},{"id":"i10-bluetooth-low-energy","title":"Bluetooth Low Energy and GATT","minutes":25},{"id":"i10-long-range-radio-and-link-budget","title":"LoRa radio and link budgets","minutes":25}]},
      {"id": "i11", "track": "Connectivity", "weeks": 2, "title": "IoT data, time and updates", "summary": "What happens to the data after the device sends it, and how the device is maintained.", "outcomes": ["Timestamp and store data reliably", "Build a dashboard", "Update firmware remotely"], "needs": ["i10"], "topics": ["Real-time clocks and network time", "Local storage: flash file systems, SD cards, wear", "Data formats: CSV, JSON, binary", "Time-series databases and dashboards", "Over-the-air updates and rollback", "Basic device security: credentials, TLS in outline"], "exitProject": "Data logger that survives network loss and updates over the air", "lessons": [{"id":"i11-time-rtc-and-ntp","title":"Timekeeping with RTC and NTP","minutes":20},{"id":"i11-storage-and-data-formats","title":"Onboard storage and data formats","minutes":25},{"id":"i11-dashboards-and-store-and-forward","title":"Dashboards and store and forward","minutes":25},{"id":"i11-ota-updates-and-device-security","title":"OTA updates and device security","minutes":25}]},
      {"id": "i12", "track": "Robotics", "weeks": 4, "title": "Mobile robot fundamentals", "summary": "Your first real robot: a wheeled platform that senses and steers itself.", "outcomes": ["Derive and use differential-drive kinematics", "Estimate position by odometry", "Tune a PID loop on a real robot"], "needs": ["i9", "i8"], "topics": ["Robot anatomy: chassis, drive, sensors, compute, power", "Differential-drive kinematics, turning radius", "Wheel odometry and its drift", "Feedback control: on-off, proportional, PID, tuning by experiment", "Line following with a sensor array", "Obstacle avoidance with ultrasonic and infrared ranging", "Behaviour-based control and simple state machines"], "exitProject": "Line following or wall following robot with PID control and logged odometry", "lessons": [{"id":"i12-robot-anatomy-and-kinematics","title":"Robot anatomy and differential-drive kinematics","minutes":20},{"id":"i12-wheel-odometry","title":"Wheel odometry and its drift","minutes":25},{"id":"i12-feedback-control-pid","title":"Feedback control: on-off, P, PI and PID","minutes":20},{"id":"i12-sensing-and-behaviours","title":"Line following, obstacle avoidance and behaviours","minutes":30}]},
      {"id": "i13", "track": "Design practice", "weeks": 3, "title": "Electronics design practice", "summary": "From breadboard to something that lasts, and the tools to build and test it.", "outcomes": ["Draw a clean schematic in KiCad", "Solder and assemble a perfboard or simple PCB", "Use bench instruments to find a fault"], "needs": ["i2", "i3"], "topics": ["Reading and drawing schematics, symbols, nets, power flags", "KiCad schematic capture and electrical rule check", "Component selection: packages, tolerances, ratings, sourcing", "Soldering through-hole and basic surface-mount", "Perfboard and stripboard construction", "Bench instruments: multimeter, oscilloscope, bench supply, logic analyser", "A systematic fault-finding method", "A first two-layer PCB: a shield or breakout board"], "exitProject": "Schematic and a simple two-layer PCB for one of your own projects, assembled and tested", "lessons": [{"id":"i13-schematics-and-kicad","title":"Schematics and KiCad schematic capture","minutes":20},{"id":"i13-component-selection","title":"Choosing components: packages, ratings, sourcing","minutes":20},{"id":"i13-soldering-and-construction","title":"Soldering and perfboard construction","minutes":20},{"id":"i13-instruments-and-fault-finding","title":"Bench instruments and fault finding","minutes":20},{"id":"i13-first-pcb","title":"Your first two-layer PCB","minutes":20}]},
    ],
  },
  {
    id: "advanced",
    title: "Advanced: Systems, PCB design and robotics",
    blurb: "Final year and beyond. Design analog and power circuits, lay out multilayer boards, write production firmware, and build autonomous robots with ROS 2.",
    how: "Design-led: specifications, analysis, simulation, design reviews and written reports. No block editor. Professional tools: KiCad, SPICE, an RTOS, Linux, ROS 2, Gazebo.",
    tracks: [
      { name: "Electronics and PCB design", blurb: "For students heading towards hardware design: analog and power circuits, then boards from a first two-layer design to multilayer, EMC-aware layouts." },
      { name: "Embedded systems", blurb: "For students heading towards firmware and embedded software: operating systems, Linux on small computers, and professional firmware practice." },
      { name: "Robotics and autonomy", blurb: "For students heading towards robotics: control theory, state estimation, kinematics, then ROS 2, perception, navigation and manipulation." },
      { name: "Connected systems and AI", blurb: "For students heading towards IoT platforms: large deployments, security and machine learning on the device." },
      { name: "Capstone", blurb: "Taken last, whichever direction you chose. It draws on at least two directions." },
    ],
    modules: [
      {"id": "a1", "track": "Electronics and PCB design", "weeks": 4, "title": "Analog circuit design", "summary": "Design analog stages to a specification instead of copying them.", "outcomes": ["Design op-amp circuits with real op-amp limits in mind", "Design active filters", "Analyse and reduce noise in a signal chain"], "needs": ["i8"], "topics": ["Real op-amps: offset, bias current, gain-bandwidth, slew rate, rail limits", "Stability, phase margin, compensation", "Active filters: Sallen-Key, multiple feedback, Butterworth and Bessel responses", "ADC and DAC front-ends, drivers, references", "Noise sources, noise budget, shielding and guarding", "Precision measurement: bridges, instrumentation amplifiers, 4-wire sensing", "Simulation with SPICE"], "exitProject": "Precision data-acquisition front-end designed to a written specification, simulated, built and measured", "lessons": [{"id":"a1-real-op-amp-limits-and-error-budgets","title":"Real op amp limits and error budgets","minutes":25},{"id":"a1-stability-and-compensation","title":"Op amp stability and compensation","minutes":20},{"id":"a1-active-filters-adc-drivers-and-references","title":"Active filters, ADC drivers and references","minutes":25},{"id":"a1-noise-precision-measurement-and-spice","title":"Noise, precision measurement and SPICE","minutes":25}]},
      {"id": "a2", "track": "Electronics and PCB design", "weeks": 4, "title": "Power electronics and motor drives", "summary": "Convert and control power efficiently and safely.", "outcomes": ["Design a buck or boost converter", "Design a MOSFET H-bridge with gate drive and protection", "Do a thermal calculation"], "needs": ["i9", "a1"], "topics": ["Switching converters: buck, boost, buck-boost, continuous and discontinuous conduction", "Inductor and capacitor selection, ripple, control loop in outline", "MOSFET switching losses, gate drivers, dead time, bootstrap supplies", "H-bridge and three-phase inverter design", "Brushless motors: trapezoidal control and field-oriented control in outline", "Current sensing, over-current, over-voltage and reverse-polarity protection", "Battery management systems, cell balancing", "Thermal design, heat sinks, safe operating area"], "exitProject": "Motor driver board or DC-DC converter, designed, built and characterised for efficiency and temperature", "lessons": [{"id":"a2-switching-converters","title":"Switching converter topologies and design","minutes":25},{"id":"a2-mosfet-losses-gate-drive-and-thermal","title":"MOSFET losses, gate drive and thermal design","minutes":25},{"id":"a2-bridges-inverters-and-brushless-control","title":"Bridges, inverters and brushless motor control","minutes":20},{"id":"a2-sensing-protection-and-battery-management","title":"Sensing, protection and battery management","minutes":25}]},
      {"id": "a3", "track": "Electronics and PCB design", "weeks": 4, "title": "PCB design I: schematic to manufactured board", "summary": "The complete flow for a two-layer board that works first time.", "outcomes": ["Take a design from schematic to Gerber files in KiCad", "Create symbols and footprints", "Assemble and bring up a board"], "needs": ["i13"], "topics": ["Hierarchical schematics, design for readability", "Symbols, footprints and 3D models, library management", "Board outline, placement strategy, routing, copper pours", "Design rules, clearances, track width for current, via types", "Decoupling and power distribution on two layers", "Design rule check, Gerber and drill files, bill of materials, pick-and-place files", "Fabrication and assembly processes, panelisation, ordering", "Bring-up: inspection, power-on sequence, test points, rework"], "exitProject": "Microcontroller development board with USB, regulator and sensor, manufactured and brought up", "lessons": [{"id":"a3-hierarchy-libraries-reference-design","title":"Hierarchical schematics, libraries and reference designs","minutes":30},{"id":"a3-placement-routing-rules","title":"Placement, routing and design rules","minutes":25},{"id":"a3-outputs-fabrication-assembly","title":"Fabrication outputs and assembly","minutes":25},{"id":"a3-bring-up-exit-project","title":"Board bring-up and the exit project","minutes":20}]},
      {"id": "a4", "track": "Electronics and PCB design", "weeks": 4, "title": "PCB design II: multilayer, signal integrity and EMC", "summary": "Boards that are fast, quiet and manufacturable at volume.", "outcomes": ["Choose a layer stack-up and return-path strategy", "Route controlled-impedance and differential signals", "Design for EMC, manufacture and test"], "needs": ["a3"], "topics": ["Four-layer stack-ups, reference planes, return currents", "Transmission lines, characteristic impedance, termination, reflections", "Differential pairs, length matching: USB, Ethernet, CAN", "Crosstalk, ground bounce, power integrity, decoupling networks", "Mixed-signal layout, partitioning, grounding", "RF basics: antennas, matching, keep-out areas for Wi-Fi and BLE modules", "EMI and EMC: sources, filtering, shielding, ESD protection, pre-compliance testing", "Design for manufacture, assembly and test; reliability and derating"], "exitProject": "Four-layer mixed-signal board with a wireless module, reviewed against an EMC and DFM checklist", "lessons": [{"id":"a4-stackups-return-currents","title":"Stackups and return current paths","minutes":20},{"id":"a4-transmission-lines-differential-pairs","title":"Transmission lines and differential pairs","minutes":25},{"id":"a4-crosstalk-power-integrity-mixed-signal","title":"Crosstalk, power integrity and mixed signal","minutes":20},{"id":"a4-rf-and-emc","title":"RF layout and EMC design","minutes":25},{"id":"a4-dfm-dft-reliability-exit","title":"DFM, DFT, reliability and the exit project","minutes":20}]},
      {"id": "a5", "track": "Embedded systems", "weeks": 4, "title": "Real-time operating systems", "summary": "Structure complex firmware with tasks instead of one loop.", "outcomes": ["Design a multi-task firmware with FreeRTOS", "Prevent deadlock and priority inversion", "Analyse whether deadlines are met"], "needs": ["i6"], "topics": ["Tasks, scheduler, context switch, tick", "Queues, semaphores, mutexes, event groups, task notifications", "Priority inversion and inheritance, deadlock", "Interrupts with an RTOS, deferred processing", "Memory management, stack sizing, heap schemes", "Real-time scheduling theory: rate-monotonic analysis in outline", "Tracing and profiling"], "exitProject": "Multi-task firmware with a documented task diagram and timing analysis", "lessons": [{"id":"a5-tasks-and-the-scheduler","title":"Tasks, the scheduler and the tick","minutes":30},{"id":"a5-queues-semaphores-and-notifications","title":"Queues, semaphores, mutexes and notifications","minutes":25},{"id":"a5-inversion-deadlock-and-interrupts","title":"Priority inversion, deadlock and interrupts","minutes":25},{"id":"a5-memory-stacks-and-heaps","title":"Memory, stack sizing and heap schemes","minutes":25},{"id":"a5-schedulability-and-tracing","title":"Rate-monotonic analysis and tracing","minutes":25}]},
      {"id": "a6", "track": "Embedded systems", "weeks": 3, "title": "Embedded Linux and single-board computers", "summary": "When a microcontroller is not enough: Linux on the robot.", "outcomes": ["Set up and administer a Raspberry Pi class computer headless", "Access GPIO, I2C, SPI and cameras from Linux", "Split work between a Linux computer and a microcontroller"], "needs": ["i7", "i10"], "topics": ["Linux essentials: shell, file system, processes, permissions, services", "SSH, networking, package management", "Hardware access from user space, device tree in outline", "Python and C++ on Linux, cross-compilation", "Microcontroller as real-time co-processor: serial and CAN links", "Containers for reproducible deployment", "Boot time, reliability and power considerations"], "exitProject": "Raspberry Pi and microcontroller pair exchanging sensor data and commands over a defined protocol", "lessons": [{"id":"a6-linux-essentials-headless-pi","title":"Linux essentials on a headless Pi","minutes":25},{"id":"a6-hardware-from-user-space","title":"Hardware access from user space","minutes":25},{"id":"a6-microcontroller-coprocessor-protocol","title":"A framed protocol to a microcontroller","minutes":35},{"id":"a6-deployment-reliability-power","title":"Containers, boot time, reliability and power","minutes":25}]},
      {"id": "a7", "track": "Embedded systems", "weeks": 3, "title": "Firmware engineering", "summary": "The practices that separate a product from a prototype.", "outcomes": ["Design a bootloader and update scheme", "Test firmware automatically", "Debug with a hardware probe"], "needs": ["a5"], "topics": ["Layered architecture, hardware abstraction, drivers", "Bootloaders, partitions, signed over-the-air updates, rollback", "Unit testing, hardware-in-the-loop testing, continuous integration", "Debugging with JTAG and SWD, breakpoints, watchpoints, fault analysis", "Static analysis and coding standards (MISRA in outline)", "Low power design: sleep modes, wake sources, energy measurement", "Fault tolerance: watchdogs, brown-out, safe states"], "exitProject": "Firmware project with automated tests, a bootloader and a measured power profile", "lessons": [{"id":"a7-layered-architecture-and-hal","title":"Layered architecture and hardware abstraction","minutes":25},{"id":"a7-bootloaders-partitions-and-ota","title":"Bootloaders, partitions and OTA updates","minutes":30},{"id":"a7-testing-and-continuous-integration","title":"Unit tests, HIL and continuous integration","minutes":25},{"id":"a7-debugging-and-static-analysis","title":"Probe debugging, crash decoding and static analysis","minutes":25},{"id":"a7-low-power-and-fault-tolerance","title":"Low power design and fault tolerance","minutes":35}]},
      {"id": "a8", "track": "Robotics and autonomy", "weeks": 4, "title": "Control systems", "summary": "The mathematics of making a system do what you ask.", "outcomes": ["Model a physical system and identify its parameters", "Design and tune a PID controller analytically", "Assess stability"], "needs": ["i12"], "topics": ["Modelling: differential equations, Laplace transform, transfer functions", "First and second order responses, poles and zeros", "Block diagrams, feedback, steady-state error", "Stability: Routh-Hurwitz, root locus, Bode plots, gain and phase margin", "PID design, tuning methods, anti-windup, derivative filtering", "Discrete-time control, sampling, the z-transform in outline", "Cascade and feed-forward control", "State-space representation in outline"], "exitProject": "Motor position or speed controller designed from a model, with predicted versus measured response", "lessons": [{"id":"a8-modelling-a-dc-motor","title":"Modelling a DC motor","minutes":25},{"id":"a8-time-response-and-feedback","title":"Time response and feedback","minutes":20},{"id":"a8-stability-and-frequency-response","title":"Stability and frequency response","minutes":25},{"id":"a8-pid-design-analytically","title":"Designing PID controllers analytically","minutes":25},{"id":"a8-digital-cascade-state-space","title":"Digital, cascade and state-space control","minutes":30}]},
      {"id": "a9", "track": "Robotics and autonomy", "weeks": 3, "title": "State estimation and sensor fusion", "summary": "Know where you are when every sensor lies a little.", "outcomes": ["Explain and implement a Kalman filter", "Fuse IMU, encoder and other measurements", "Evaluate an estimator against ground truth"], "needs": ["a8", "i8"], "topics": ["Probability refresher: Gaussian noise, covariance", "Bayes filter idea", "Kalman filter: predict and update, tuning", "Extended Kalman filter for non-linear systems", "Orientation: Euler angles, rotation matrices, quaternions", "IMU fusion: attitude and heading reference systems", "Fusing wheel odometry with an IMU"], "exitProject": "Attitude estimator or fused odometry for a robot, evaluated against a reference", "lessons": [{"id":"a9-probability-and-the-bayes-filter","title":"Probability and the Bayes filter","minutes":25},{"id":"a9-the-kalman-filter","title":"The Kalman filter","minutes":30},{"id":"a9-extended-kalman-filter","title":"The extended Kalman filter for a wheeled robot","minutes":25},{"id":"a9-orientation-and-quaternions","title":"Orientation: Euler angles, rotation matrices and quaternions","minutes":25},{"id":"a9-imu-fusion-odometry-and-evaluation","title":"IMU fusion, fused odometry and evaluating an estimator","minutes":30}]},
      {"id": "a10", "track": "Robotics and autonomy", "weeks": 4, "title": "Robot kinematics and dynamics", "summary": "The geometry and physics of robots that move.", "outcomes": ["Describe poses with frames and homogeneous transforms", "Solve forward and inverse kinematics for a simple arm", "Model wheeled robot motion"], "needs": ["i12"], "topics": ["Coordinate frames, rotations, homogeneous transformations", "Forward kinematics, Denavit-Hartenberg convention", "Inverse kinematics: geometric and numerical methods", "Velocity kinematics and the Jacobian, singularities", "Mobile robot models: differential, Ackermann, omnidirectional", "Dynamics in outline: torque, inertia, motor sizing", "Trajectory generation: joint space and task space"], "exitProject": "Forward and inverse kinematics for a 3 or 4 axis arm, verified on hardware or in simulation", "lessons": [{"id":"a10-frames-rotations-transforms","title":"Frames, rotations and homogeneous transforms","minutes":25},{"id":"a10-forward-kinematics-dh","title":"Forward kinematics with DH parameters","minutes":25},{"id":"a10-inverse-kinematics","title":"Analytic and numerical inverse kinematics","minutes":25},{"id":"a10-jacobian-and-mobile-robots","title":"Jacobians, singularities and mobile robot kinematics","minutes":25},{"id":"a10-dynamics-sizing-trajectories","title":"Dynamics, actuator sizing and trajectories","minutes":25}]},
      {"id": "a11", "track": "Robotics and autonomy", "weeks": 5, "title": "ROS 2 fundamentals", "summary": "The standard software framework for robots.", "outcomes": ["Build a ROS 2 system of several nodes", "Describe a robot with URDF and visualise it", "Bridge a microcontroller into ROS 2"], "needs": ["a6"], "topics": ["ROS 2 concepts: nodes, topics, services, actions, parameters, quality of service", "Workspaces, packages, build tools, launch files", "Writing nodes in Python and C++", "Coordinate transforms with tf2", "Robot description: URDF and xacro, robot state publisher", "Visualisation and tools: RViz, rqt, bag recording", "Simulation with Gazebo", "ros2_control and hardware interfaces", "micro-ROS: microcontrollers as ROS 2 nodes"], "exitProject": "Simulated and real differential-drive robot driven by the same ROS 2 nodes, with a microcontroller base controller", "lessons": [{"id":"a11-ros2-concepts-and-communication","title":"ROS 2 concepts and communication","minutes":20},{"id":"a11-workspaces-packages-and-nodes","title":"Workspaces, packages and nodes","minutes":20},{"id":"a11-tf2-urdf-and-tools","title":"tf2, URDF and the tools","minutes":25},{"id":"a11-gazebo-and-ros2-control","title":"Gazebo and ros2_control","minutes":25},{"id":"a11-micro-ros-and-the-real-robot","title":"micro-ROS and the real robot","minutes":25}]},
      {"id": "a12", "track": "Robotics and autonomy", "weeks": 4, "title": "Perception", "summary": "Give the robot eyes and a sense of depth.", "outcomes": ["Process camera images with OpenCV", "Use LiDAR and depth data", "Detect and track objects"], "needs": ["a11"], "topics": ["Cameras: optics, calibration, distortion", "Image processing: filtering, thresholding, edges, contours, colour spaces", "Feature detection and matching, fiducial markers", "LiDAR and depth cameras, point clouds", "Object detection with neural networks, deployment on edge hardware", "Tracking over time", "Perception pipelines in ROS 2"], "exitProject": "Robot that detects and follows a marker or object using a camera", "lessons": [{"id":"a12-cameras-and-calibration","title":"Camera models and calibration","minutes":25},{"id":"a12-image-processing-features-and-markers","title":"Image processing, features and fiducial markers","minutes":30},{"id":"a12-lidar-depth-and-point-clouds","title":"LiDAR, depth cameras and point clouds","minutes":20},{"id":"a12-detection-tracking-and-ros2-pipelines","title":"Object detection, tracking and ROS 2 pipelines","minutes":25}]},
      {"id": "a13", "track": "Robotics and autonomy", "weeks": 5, "title": "Localisation, mapping and navigation", "summary": "A robot that knows where it is and can get somewhere on its own.", "outcomes": ["Explain probabilistic localisation and SLAM", "Build a map and localise in it", "Configure a navigation stack"], "needs": ["a9", "a12"], "topics": ["Occupancy grid maps", "Monte Carlo localisation (particle filters)", "SLAM: the problem, scan matching, graph-based SLAM in outline", "Path planning: Dijkstra, A*, sampling-based planners", "Local planning and obstacle avoidance: dynamic window, pure pursuit", "The ROS 2 navigation stack (Nav2): costmaps, planners, controllers, behaviour trees", "Multi-sensor fusion with robot_localization"], "exitProject": "Autonomous indoor robot that maps a room and navigates between goals", "lessons": [{"id":"a13-occupancy-grids-and-monte-carlo-localisation","title":"Occupancy grids and Monte Carlo localisation","minutes":25},{"id":"a13-slam-scan-matching-and-slam-toolbox","title":"SLAM, scan matching and slam_toolbox","minutes":20},{"id":"a13-global-and-local-planning","title":"Global and local path planning","minutes":25},{"id":"a13-nav2-and-sensor-fusion-project","title":"Nav2, sensor fusion and the navigation project","minutes":25}]},
      {"id": "a14", "track": "Robotics and autonomy", "weeks": 3, "title": "Manipulation and motion planning", "summary": "Arms that reach, grasp and avoid collisions.", "outcomes": ["Plan collision-free arm motion", "Control a gripper", "Integrate perception with manipulation"], "needs": ["a10", "a11"], "topics": ["Configuration space and collision checking", "Sampling-based motion planning: RRT and PRM", "MoveIt 2: planning scene, planners, controllers", "Grasping basics and end effectors", "Force and compliance in outline", "Pick and place as a complete pipeline"], "exitProject": "Pick and place with a small arm, in simulation and on hardware", "lessons": [{"id":"a14-configuration-space-collision","title":"Configuration space and collision checking","minutes":20},{"id":"a14-sampling-based-planning","title":"Sampling based motion planning","minutes":25},{"id":"a14-moveit2","title":"Motion planning with MoveIt 2","minutes":20},{"id":"a14-grasping-and-pick-place","title":"Grasping and pick and place","minutes":25}]},
      {"id": "a15", "track": "Connected systems and AI", "weeks": 3, "title": "IoT systems at scale", "summary": "From one device to a fleet.", "outcomes": ["Design an end-to-end architecture from requirements", "Plan provisioning and fleet management", "Reason about cost, latency and reliability"], "needs": ["i11"], "topics": ["Device, edge, gateway and cloud roles", "Protocol choice: MQTT, CoAP, HTTP, LwM2M", "Device identity, provisioning and fleet management", "Data pipelines, storage and analytics", "Offline behaviour, synchronisation and data integrity", "Industrial IoT: Modbus, OPC UA, fieldbuses in outline", "Cost and scalability estimation"], "exitProject": "Architecture document and working slice of a campus sensing network", "lessons": [{"id":"a15-architecture-and-protocol-choice","title":"IoT architecture and protocol choice","minutes":25},{"id":"a15-identity-provisioning-and-fleets","title":"Device identity, provisioning and fleet management","minutes":25},{"id":"a15-pipelines-offline-and-integrity","title":"Data pipelines, offline buffering and integrity","minutes":20},{"id":"a15-industrial-iot-and-cost","title":"Industrial IoT, Modbus and cost at scale","minutes":25}]},
      {"id": "a16", "track": "Connected systems and AI", "weeks": 3, "title": "Security for embedded and IoT", "summary": "Assume the device will be attacked.", "outcomes": ["Write a threat model", "Protect secrets, links and updates", "Assess a design against common attacks"], "needs": ["a15", "a7"], "topics": ["Threat modelling and attack surfaces", "Cryptography for engineers: symmetric, asymmetric, hashes, signatures", "TLS and certificates on constrained devices", "Secure boot, flash encryption, secure elements", "Secure over-the-air updates", "Common weaknesses: default credentials, exposed debug ports, replay", "Privacy and regulatory expectations in outline"], "exitProject": "Threat model and hardening of an earlier connected project, with evidence", "lessons": [{"id":"a16-threat-modelling-and-common-weaknesses","title":"Threat modelling and common IoT weaknesses","minutes":25},{"id":"a16-cryptography-and-tls","title":"Applied cryptography and TLS on ESP32","minutes":25},{"id":"a16-secure-boot-flash-encryption-and-ota","title":"Secure boot, flash encryption and OTA","minutes":25}]},
      {"id": "a17", "track": "Connected systems and AI", "weeks": 3, "title": "Machine learning on embedded devices", "summary": "Run inference where the data is produced.", "outcomes": ["Train and deploy a small model to a microcontroller", "Evaluate it honestly", "Decide when on-device ML is the wrong tool"], "needs": ["i8"], "topics": ["Machine learning workflow: data, features, training, validation", "Feature extraction for motion, sound and vision", "Model types that fit small devices", "Quantisation and deployment with TensorFlow Lite Micro or similar", "Measuring latency, memory and energy", "Datasets, bias and failure modes"], "exitProject": "Gesture, keyword or fall detection running entirely on a microcontroller", "lessons": [{"id":"a17-ml-workflow-and-honest-evaluation","title":"Embedded ML workflow and honest evaluation","minutes":25},{"id":"a17-features-and-model-types","title":"Features and model types for sensors","minutes":25},{"id":"a17-quantisation-deployment-and-measurement","title":"Quantisation, deployment and on-device measurement","minutes":25}]},
      {"id": "a18", "track": "Capstone", "weeks": 6, "title": "Systems engineering and capstone", "summary": "Bring every strand together in one designed, built, tested and defended system.", "outcomes": ["Write requirements and a test plan", "Manage a multi-discipline build", "Document and defend design decisions"], "needs": ["a4", "a7", "a13"], "topics": ["Requirements, specifications and the V-model", "Architecture, interfaces and trade studies", "Project planning, risk and bill of materials cost", "Verification and validation, test plans", "Reliability, safety and failure mode analysis", "Standards and compliance in outline (CE, FCC, BIS, RoHS)", "Technical writing, design reviews and presentation"], "exitProject": "Final project: a custom PCB, firmware and ROS 2 software forming one autonomous or connected system, with a full design report", "lessons": [{"id":"a18-requirements-and-the-v-model","title":"Requirements and the V model","minutes":25},{"id":"a18-architecture-interfaces-trade-studies","title":"Architecture, interfaces and trade studies","minutes":20},{"id":"a18-planning-risk-and-bom","title":"Planning, risk and the BOM","minutes":20},{"id":"a18-verification-reliability-and-safety","title":"Verification, reliability and safety","minutes":25},{"id":"a18-compliance-reviews-and-the-capstone","title":"Compliance, design reviews and the capstone","minutes":25}]},
    ],
  },
];

/** Find a lesson and where it sits. */
export function findLesson(lessonId: string) {
  for (const tier of CURRICULUM) {
    for (const mod of tier.modules) {
      const index = mod.lessons?.findIndex((l) => l.id === lessonId) ?? -1;
      if (index >= 0) return { tier, mod, meta: mod.lessons![index], index };
    }
  }
  return null;
}

/** Every written lesson in study order, for previous / next links. */
export const LESSON_ORDER: LessonMeta[] = CURRICULUM.flatMap((t) => t.modules.flatMap((m) => m.lessons ?? []));

// ── Reading mode ────────────────────────────────────────────────────────────
/** Normal folds the "Go deeper" sections away; Detailed opens them all. */
export type ReadingMode = "normal" | "detailed";

export const useReadingMode = create<{ mode: ReadingMode; setMode: (m: ReadingMode) => void }>()(
  persist((set) => ({ mode: "normal", setMode: (mode) => set({ mode }) }), { name: "codelab-reading-mode" })
);

// ── Progress ────────────────────────────────────────────────────────────────
// ponytail: kept in this browser only, keyed by user id because lab PCs are
// shared. Move to the API when the professor needs to see class progress.
interface LearnProgress {
  byUser: Record<string, string[]>;
  complete: (userId: string, lessonId: string) => void;
}

export const useLearnProgress = create<LearnProgress>()(
  persist(
    (set) => ({
      byUser: {},
      complete: (userId, lessonId) =>
        set((s) => {
          const done = s.byUser[userId] ?? [];
          return done.includes(lessonId) ? s : { byUser: { ...s.byUser, [userId]: [...done, lessonId] } };
        }),
    }),
    { name: "codelab-learn-progress" }
  )
);
