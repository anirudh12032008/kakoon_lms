import { NODE_CATEGORIES } from "@/entities/node/model";

export type EditorWorkspaceMode = "guided" | "challenge" | "sandbox" | "full" | "customize";
export type EditorLaunchType = "mode" | "kit" | "custom";

export interface EditorLaunchContext {
  id: string;
  title: string;
  description: string;
  mode: EditorWorkspaceMode;
  launchType: EditorLaunchType;
  kitId?: string;
  accent?: string;
  allowedCategories?: string[];
  allowedNodeTypes?: string[];
  availableSensors?: string[];
}

export type LaunchPreset = Omit<EditorLaunchContext, "id"> & { id: string };
export type CustomLaunchPreset = EditorLaunchContext & { createdAt: number; updatedAt: number };

const ALL_CATEGORY_IDS = NODE_CATEGORIES.map((category) => category.id);
export const CUSTOM_PRESET_STORAGE_KEY = "kakoon-custom-editor-presets";
export const ADMIN_UNLOCK_STORAGE_KEY = "kakoon-admin-unlocked";
export const ADMIN_SECRET = "x";

export const EDITOR_MODE_PRESETS: LaunchPreset[] = [
  {
    id: "guided-classroom",
    title: "Guided Classroom",
    description: "A focused, step-by-step workspace for lessons and instructor-led builds.",
    mode: "guided",
    launchType: "mode",
    accent: "from-cyan-500 to-blue-500",
    allowedCategories: ["general", "loop", "condition", "gpio", "sensor"],
    allowedNodeTypes: ["print", "variable", "sleep", "forever_loop", "if_else", "gpio_pin", "pin_write", "pin_read", "push_button", "buzzer_tone", "ultrasonic", "touch_sensor", "button_digital_input"],
    availableSensors: ["Push Button", "Ultrasonic Sensor", "Touch Sensor", "Digital Input"],
  },
  {
    id: "challenge-lab",
    title: "Challenge Lab",
    description: "A slightly larger workspace for timed tasks, competitions, and guided challenges.",
    mode: "challenge",
    launchType: "mode",
    accent: "from-amber-500 to-orange-500",
    allowedCategories: ["general", "loop", "condition", "gpio", "sensor", "motors"],
    allowedNodeTypes: ["print", "variable", "sleep", "forever_loop", "for_loop", "while_loop", "repeat", "if_else", "gpio_pin", "pin_write", "pin_read", "push_button", "buzzer_tone", "ultrasonic", "touch_sensor", "soil_moisture", "ir_sensor", "servo_motor", "dc_motor_single"],
    availableSensors: ["Ultrasonic Sensor", "Touch Sensor", "Soil Moisture Sensor", "IR Sensor", "Servo Motor", "DC Motor"],
  },
  {
    id: "sandbox",
    title: "Sandbox",
    description: "A roomy creative workspace with nearly everything available for experimentation.",
    mode: "sandbox",
    launchType: "mode",
    accent: "from-violet-500 to-fuchsia-500",
    allowedCategories: [...ALL_CATEGORY_IDS],
    availableSensors: ["All available blocks"],
  },
  {
    id: "full-workshop",
    title: "Full Workshop",
    description: "No restrictions. Open every block, every category, and the complete hardware palette.",
    mode: "full",
    launchType: "mode",
    accent: "from-slate-500 to-zinc-500",
    allowedCategories: [...ALL_CATEGORY_IDS],
    availableSensors: ["All available blocks"],
  },
];

export const EDITOR_KIT_PRESETS: LaunchPreset[] = [
  {
    id: "starter-kit",
    kitId: "starter-kit",
    title: "Starter Kit",
    description: "Minimal blocks for first-time learners and demo lessons.",
    mode: "guided",
    launchType: "kit",
    accent: "from-emerald-500 to-teal-500",
    allowedCategories: ["general", "loop", "condition", "gpio"],
    allowedNodeTypes: ["print", "variable", "sleep", "forever_loop", "if_else", "gpio_pin", "pin_write", "pin_read", "push_button", "buzzer_tone"],
    availableSensors: ["Push Button", "GPIO Pin", "Buzzer"],
  },
  {
    id: "sensor-kit",
    kitId: "sensor-kit",
    title: "Sensor Kit",
    description: "A kit for sensing, reading, and reacting to the physical world.",
    mode: "guided",
    launchType: "kit",
    accent: "from-cyan-500 to-sky-500",
    allowedCategories: ["general", "loop", "condition", "gpio", "sensor"],
    allowedNodeTypes: ["print", "variable", "sleep", "forever_loop", "if_else", "gpio_pin", "pin_write", "pin_read", "push_button", "ultrasonic", "touch_sensor", "soil_moisture", "ir_receiver", "ir_sensor", "analog_sensor", "button_digital_input", "four_channel_touch"],
    availableSensors: ["Ultrasonic Sensor", "Touch Sensor", "Soil Moisture Sensor", "IR Receiver", "Analog Sensor"],
  },
  {
    id: "motion-kit",
    kitId: "motion-kit",
    title: "Motion Kit",
    description: "Pre-wired blocks for motors, servos, and movement exercises.",
    mode: "sandbox",
    launchType: "kit",
    accent: "from-rose-500 to-orange-500",
    allowedCategories: ["general", "loop", "condition", "gpio", "motors"],
    allowedNodeTypes: ["print", "variable", "sleep", "forever_loop", "if_else", "gpio_pin", "pin_write", "pin_read", "servo_motor", "servo_motor_advance", "servo_controller", "multi_servo_sequencer", "dc_motor_single", "l298n_motor", "multi_motor_controller"],
    availableSensors: ["Servo Motor", "DC Motor", "Motor Driver"],
  },
  {
    id: "iot-kit",
    kitId: "iot-kit",
    title: "IoT Kit",
    description: "Connectivity-first blocks for WiFi, MQTT, BLE, and cloud exercises.",
    mode: "sandbox",
    launchType: "kit",
    accent: "from-fuchsia-500 to-violet-500",
    allowedCategories: ["general", "loop", "condition", "gpio", "iot", "comms", "power"],
    allowedNodeTypes: ["print", "variable", "sleep", "forever_loop", "if_else", "wifi_connect", "http_get", "esp_now_sender", "esp_now_receiver", "time_online", "ble_mode", "wifi_node", "mqtt_node", "http_client", "serial_monitor", "deep_sleep", "ota_update", "sd_card"],
    availableSensors: ["WiFi", "MQTT", "BLE", "HTTP", "Deep Sleep"],
  },
];

export const CUSTOM_DEFAULT_CATEGORIES = ["general", "loop", "condition", "gpio"];

export function categoriesToNodeTypes(categories: string[]): string[] {
  const allowed = new Set<string>();
  NODE_CATEGORIES.forEach((category) => {
    if (!categories.includes(category.id)) return;
    category.nodes.forEach((node) => allowed.add(node.type));
  });
  return Array.from(allowed);
}

export function buildLaunchContext(preset: LaunchPreset): EditorLaunchContext {
  return {
    ...preset,
    allowedCategories: preset.allowedCategories ?? ALL_CATEGORY_IDS,
    allowedNodeTypes: preset.allowedNodeTypes,
  };
}

export function buildCustomLaunchContext(input: {
  title: string;
  description: string;
  selectedCategories: string[];
  availableSensors?: string[];
  selectedNodeTypes?: string[];
}): EditorLaunchContext {
  const allowedCategories = input.selectedCategories.length > 0 ? input.selectedCategories : CUSTOM_DEFAULT_CATEGORIES;
  const allowedNodeTypes = input.selectedNodeTypes && input.selectedNodeTypes.length > 0
    ? input.selectedNodeTypes
    : categoriesToNodeTypes(allowedCategories);
  return {
    id: "custom-workspace",
    title: input.title,
    description: input.description,
    mode: "customize",
    launchType: "custom",
    accent: "from-zinc-500 to-slate-500",
    allowedCategories,
    allowedNodeTypes,
    availableSensors: input.availableSensors,
  };
}

export function loadCustomPresets(): CustomLaunchPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomLaunchPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: CustomLaunchPreset[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, JSON.stringify(presets));
}

export function saveCustomPreset(preset: Omit<CustomLaunchPreset, "createdAt" | "updatedAt">): CustomLaunchPreset[] {
  const now = Date.now();
  const current = loadCustomPresets();
  const next: CustomLaunchPreset = { ...preset, createdAt: now, updatedAt: now };
  const updated = [...current.filter((item) => item.id !== next.id), next];
  saveCustomPresets(updated);
  return updated;
}

export function deleteCustomPreset(presetId: string): CustomLaunchPreset[] {
  const updated = loadCustomPresets().filter((preset) => preset.id !== presetId);
  saveCustomPresets(updated);
  return updated;
}