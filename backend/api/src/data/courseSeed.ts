/**
 * Seed definitions for the four robot-build courses. The `launch` block mirrors
 * the frontend EditorLaunchContext — categories/node types here control exactly
 * which blocks appear in the editor when a learner opens the course.
 *
 * Node type + category ids must match those defined in the frontend node model.
 */

const CORE_CATEGORIES = ["general", "loop", "condition", "gpio"];
const CORE_NODES = [
  "print",
  "variable",
  "sleep",
  "forever_loop",
  "for_loop",
  "while_loop",
  "if_else",
  "gpio_pin",
  "pin_write",
  "pin_read",
];

/** Auto-completion rule evaluated by the editor against the node graph. */
export interface Check {
  allOf?: string[];
  anyOf?: string[];
  min?: number;
}
export interface LevelSeed {
  key: string;
  label: string;
  build: string;
  editor: string;
  order: number;
  check?: Check;
}
export interface ChallengeSeed {
  key: string;
  title: string;
  order: number;
  check?: Check;
}

export interface CourseSeed {
  slug: string;
  title: string;
  robotType: "forklift" | "tank" | "turret" | "robotic_arm";
  summary: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  accent: string;
  coverEmoji: string;
  learningGoals: string[];
  components: string[];
  order: number;
  levels: LevelSeed[];
  challenges: ChallengeSeed[];
  launch: {
    mode: "guided" | "challenge" | "sandbox" | "full" | "customize";
    launchType: "course";
    accent: string;
    allowedCategories: string[];
    allowedNodeTypes: string[];
    availableSensors: string[];
  };
}

// Helpers to keep the content below readable.
const lvl = (key: string, label: string, build: string, editor: string, order: number, check?: Check): LevelSeed => ({
  key, label, build, editor, order, check,
});
const ch = (key: string, title: string, order: number, check?: Check): ChallengeSeed => ({ key, title, order, check });

const BASE_COURSES: Omit<CourseSeed, "levels" | "challenges">[] = [
  {
    slug: "forklift",
    title: "Build a Forklift Robot",
    robotType: "forklift",
    summary: "Drive, steer, and lift loads with motors and a servo-powered fork.",
    description:
      "Learn how a real forklift works. You'll wire up two drive motors, add a servo to raise and lower the fork, and use an ultrasonic sensor to stop before bumping a wall.",
    difficulty: "beginner",
    estimatedHours: 2,
    accent: "from-amber-500 to-orange-600",
    coverEmoji: "🏗️",
    learningGoals: [
      "Drive two DC motors forward, backward, and turn",
      "Raise & lower a fork with a servo",
      "Stop automatically using an ultrasonic sensor",
    ],
    components: ["2× DC Motor", "1× Servo", "Ultrasonic Sensor", "Push Button"],
    order: 1,
    launch: {
      mode: "guided",
      launchType: "course",
      accent: "from-amber-500 to-orange-600",
      allowedCategories: [...CORE_CATEGORIES, "motors", "sensor"],
      allowedNodeTypes: [
        ...CORE_NODES,
        "dc_motor_single",
        "multi_motor_controller",
        "servo_motor",
        "servo_motor_advance",
        "ultrasonic",
        "push_button",
      ],
      availableSensors: ["DC Motor", "Servo Motor", "Ultrasonic Sensor", "Push Button"],
    },
  },
  {
    slug: "tank",
    title: "Build a Tank Robot",
    robotType: "tank",
    summary: "Control a tracked robot with independent left/right tread motors.",
    description:
      "Tanks steer by spinning their treads at different speeds. Program independent left and right motor control, then add buttons and a distance sensor to drive it like a pro.",
    difficulty: "beginner",
    estimatedHours: 2,
    accent: "from-emerald-500 to-green-700",
    coverEmoji: "🪖",
    learningGoals: [
      "Control left & right tread motors independently",
      "Pivot, spin, and drive straight",
      "React to obstacles with a distance sensor",
    ],
    components: ["2× DC Motor (treads)", "Ultrasonic Sensor", "IR Sensor", "Push Button"],
    order: 2,
    launch: {
      mode: "guided",
      launchType: "course",
      accent: "from-emerald-500 to-green-700",
      allowedCategories: [...CORE_CATEGORIES, "motors", "sensor"],
      allowedNodeTypes: [
        ...CORE_NODES,
        "dc_motor_single",
        "multi_motor_controller",
        "ultrasonic",
        "ir_sensor",
        "push_button",
      ],
      availableSensors: ["DC Motor", "Ultrasonic Sensor", "IR Sensor", "Push Button"],
    },
  },
  {
    slug: "turret",
    title: "Build a Targeting Turret",
    robotType: "turret",
    summary: "Aim a servo turret, track targets, and light up on lock-on.",
    description:
      "Combine servos for pan/tilt aiming with sensors to detect a target. Add NeoPixel feedback so your turret glows when it locks on. A great intro to sensing + actuation loops.",
    difficulty: "intermediate",
    estimatedHours: 3,
    accent: "from-rose-500 to-pink-700",
    coverEmoji: "🎯",
    learningGoals: [
      "Pan & tilt with two servos",
      "Detect targets with an ultrasonic / IR sensor",
      "Show lock-on status with NeoPixel LEDs",
    ],
    components: ["2× Servo (pan/tilt)", "Ultrasonic Sensor", "IR Sensor", "NeoPixel Ring"],
    order: 3,
    launch: {
      mode: "guided",
      launchType: "course",
      accent: "from-rose-500 to-pink-700",
      allowedCategories: [...CORE_CATEGORIES, "motors", "sensor", "display"],
      allowedNodeTypes: [
        ...CORE_NODES,
        "servo_motor",
        "servo_motor_advance",
        "servo_controller",
        "ultrasonic",
        "ir_sensor",
        "neopixel_led",
        "neopixel_rgb",
      ],
      availableSensors: ["Servo Motor", "Ultrasonic Sensor", "IR Sensor", "NeoPixel"],
    },
  },
  {
    slug: "robotic-arm",
    title: "Build a Robotic Arm",
    robotType: "robotic_arm",
    summary: "Choreograph a multi-servo arm to pick, place, and pose.",
    description:
      "The robotic arm is the ultimate servo challenge. Sequence multiple servos with the Multi-Servo Sequencer to make smooth pick-and-place motions, and trigger them with buttons and sensors.",
    difficulty: "advanced",
    estimatedHours: 4,
    accent: "from-violet-500 to-indigo-700",
    coverEmoji: "🦾",
    learningGoals: [
      "Drive 3–4 servos together as joints",
      "Record and replay motion sequences",
      "Trigger routines with buttons & analog input",
    ],
    components: ["4× Servo (joints)", "Push Button", "Analog Sensor (potentiometer)"],
    order: 4,
    launch: {
      mode: "guided",
      launchType: "course",
      accent: "from-violet-500 to-indigo-700",
      allowedCategories: [...CORE_CATEGORIES, "motors", "sensor"],
      allowedNodeTypes: [
        ...CORE_NODES,
        "servo_motor",
        "servo_motor_advance",
        "servo_controller",
        "multi_servo_sequencer",
        "push_button",
        "analog_sensor",
      ],
      availableSensors: ["Servo Motor", "Multi-Servo Sequencer", "Push Button", "Analog Sensor"],
    },
  },
];

// ─── Levels (build journey) per course ────────────────────────────────────────
// Each level pairs a "Build" step (physical/LMS) with an "Editor" step (coding).
const LEVELS: Record<string, LevelSeed[]> = {
  forklift: [
    lvl("intro", "Intro", "Get comfortable with the components", "Add motors, servo, OLED and RGB LED control", 0,
      { anyOf: ["dc_motor_single", "multi_motor_controller", "servo_motor", "oled_display", "neopixel_led"] }),
    lvl("l1", "Level 1", "Assemble the forklift and run it", "Move 4 motors and add speed control", 1,
      { anyOf: ["multi_motor_controller", "dc_motor_single"] }),
    lvl("l2", "Level 2", "Add the lifting mechanism", "Add servo control with top & bottom limits", 2,
      { anyOf: ["servo_motor", "servo_motor_advance", "servo_controller"] }),
    lvl("l3", "Level 3", "Add an OLED and understand how it works", "Drive the OLED and play an animation", 3,
      { allOf: ["oled_display"] }),
    lvl("l4", "Level 4", "Add a light and make it react to other things", "RGB control with color presets", 4,
      { anyOf: ["neopixel_led", "neopixel_rgb"] }),
    lvl("l5", "Level 5", "Tweak the code and explore", "LDR control, speed variables, and more", 5,
      { allOf: ["analog_sensor"] }),
  ],
  tank: [
    lvl("intro", "Intro", "Multiple servos, sweeps, and ultrasound working", "Learn about multiple servos and ultrasound", 0,
      { anyOf: ["servo_motor", "servo_controller", "ultrasonic"] }),
    lvl("l1", "Level 1", "Assemble the tank and make it move", "Control 2 motors with speed", 1,
      { anyOf: ["multi_motor_controller", "dc_motor_single"] }),
    lvl("l2", "Level 2", "Assemble the shooting & lifting mechanism", "Control 2 motors + 2 servos (one limited to shoot)", 2,
      { anyOf: ["servo_motor", "servo_controller"] }),
    lvl("l3", "Level 3", "Attach ultrasound to measure distance and show it on your phone", "Add ultrasound and send distance over Bluetooth", 3,
      { allOf: ["ultrasonic"] }),
    lvl("l4", "Level 4", "Make it shoot when something is ~10cm away", "Add the logic to shoot", 4,
      { allOf: ["ultrasonic"], anyOf: ["if_else"] }),
    lvl("l5", "Level 5", "Add LEDs so it feels alive", "LED control + logic for different colors", 5,
      { anyOf: ["neopixel_led", "neopixel_rgb"] }),
  ],
  turret: [
    lvl("intro", "Intro", "How the flywheel mechanism works, and how IR works", "Add IR input", 0,
      { anyOf: ["ir_sensor", "ir_receiver"] }),
    lvl("l1", "Level 1", "Assemble the pan & tilt motion", "Add 2-motor control with speed", 1,
      { anyOf: ["multi_motor_controller", "dc_motor_single"] }),
    lvl("l2", "Level 2", "Attach the flywheel and shooting mechanism", "Add 2-motor control with speed", 2,
      { anyOf: ["multi_motor_controller", "dc_motor_single"], min: 2 }),
    lvl("l3", "Level 3", "Try shooting at different speeds", "Add PWM speed control", 3,
      { anyOf: ["multi_motor_controller", "dc_motor_single"] }),
    lvl("l4", "Level 4", "Control it with an IR remote", "Add the IR input option", 4,
      { anyOf: ["ir_sensor", "ir_receiver"] }),
    lvl("l5", "Level 5", "Add a passcode feature", "Add IR input check + passcode logic", 5,
      { anyOf: ["ir_sensor", "ir_receiver"] }),
  ],
  "robotic-arm": [
    lvl("intro", "Intro", "How to work with multiple servos", "Calibrate button for servos", 0,
      { anyOf: ["servo_motor", "servo_controller", "multi_servo_sequencer"] }),
    lvl("l1", "Level 1", "Assemble the arm", "Control 3 servos over Bluetooth", 1,
      { anyOf: ["servo_motor", "servo_controller"] }),
    lvl("l2", "Level 2", "Assemble the gripper", "Gripper servo with open/close limits", 2,
      { anyOf: ["servo_motor", "servo_controller"] }),
    lvl("l3", "Level 3", "Pick and place an item using your phone (BT)", "Control all servos over Bluetooth", 3,
      { anyOf: ["servo_controller", "multi_servo_sequencer"] }),
    lvl("l4", "Level 4", "Add a shadow arm to control the robot arm", "Use a potentiometer to control servos (map & clamp)", 4,
      { allOf: ["analog_sensor"], anyOf: ["servo_motor", "servo_controller"] }),
    lvl("l5", "Level 5", "Add record & play buttons", "Button to record and play back servo motions", 5,
      { allOf: ["multi_servo_sequencer"] }),
  ],
};

// ─── Challenges (post-build add-ons / modifications) per course ───────────────
const CHALLENGES: Record<string, ChallengeSeed[]> = {
  forklift: [
    ch("c1", "Move the robot in a square", 0, { anyOf: ["multi_motor_controller", "dc_motor_single"], allOf: ["forever_loop"] }),
    ch("c2", "Pick up and place a crate", 1, { anyOf: ["servo_motor", "servo_controller"] }),
    ch("c3", "Run everything at half speed", 2, { anyOf: ["multi_motor_controller", "dc_motor_single"] }),
    ch("c4", "Try out OLED animations", 3, { allOf: ["oled_display"] }),
    ch("c5", "Upgrade the BLE remote", 4, { anyOf: ["ble_mode"] }),
    ch("c6", "Change LED color based on the forklift's action", 5, { allOf: ["neopixel_led"], anyOf: ["if_else"] }),
  ],
  tank: [
    ch("c1", "Make the robot move autonomously", 0, { allOf: ["ultrasonic"], anyOf: ["if_else"] }),
    ch("c2", "Use the distance to calculate the shooting height", 1, { allOf: ["ultrasonic"], anyOf: ["servo_motor", "servo_controller"] }),
    ch("c3", "Shoot targets at different distances", 2, { allOf: ["ultrasonic"], anyOf: ["servo_motor", "servo_controller"] }),
    ch("c4", "Swap the ultrasound for an OLED", 3, { allOf: ["oled_display"] }),
    ch("c5", "Change colors based on actions", 4, { anyOf: ["neopixel_led", "neopixel_rgb"] }),
  ],
  turret: [
    ch("c1", "Add a Russian-roulette firing system", 0, { anyOf: ["ir_sensor", "ir_receiver"], allOf: ["if_else"] }),
    ch("c2", "Shoot in different modes while in IR mode", 1, { anyOf: ["ir_sensor", "ir_receiver"], allOf: ["if_else"] }),
    ch("c3", "Shoot 3 darts at once — make it dynamic", 2, { anyOf: ["multi_motor_controller", "dc_motor_single"] }),
    ch("c4", "Shoot at different distances", 3, { allOf: ["ultrasonic"] }),
    ch("c5", "Add an ultrasonic sensor", 4, { allOf: ["ultrasonic"] }),
    ch("c6", "Build an ammo counter", 5, { anyOf: ["oled_display", "seven_seg"] }),
  ],
  "robotic-arm": [
    ch("c1", "Record one motion and make it loop continuously", 0, { allOf: ["multi_servo_sequencer"] }),
    ch("c2", "Make a motion manually, without the shadow arm", 1, { anyOf: ["servo_motor", "servo_controller"] }),
    ch("c3", "Test the max payload it can lift", 2), // physical — manual only
    ch("c4", "Save 3 moves and play them back: pick, wave, and dance", 3, { allOf: ["multi_servo_sequencer"] }),
  ],
};

export const COURSE_SEED: CourseSeed[] = BASE_COURSES.map((c) => ({
  ...c,
  levels: LEVELS[c.slug] ?? [],
  challenges: CHALLENGES[c.slug] ?? [],
}));
