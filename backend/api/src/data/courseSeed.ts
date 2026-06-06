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
  launch: {
    mode: "guided" | "challenge" | "sandbox" | "full" | "customize";
    launchType: "course";
    accent: string;
    allowedCategories: string[];
    allowedNodeTypes: string[];
    availableSensors: string[];
  };
}

export const COURSE_SEED: CourseSeed[] = [
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
