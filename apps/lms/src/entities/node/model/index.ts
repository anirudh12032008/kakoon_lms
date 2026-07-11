import type { NodeTypes } from "@xyflow/react";

import { PrintNode, VariableNode, SleepNode } from "../ui/GeneralNodes";
import { GPIOPinNode, PinWriteNode, PinReadNode, PWMNode, ADCNode, PushButtonNode, BuzzerToneNode, PWMOutputNode } from "../ui/GPIOBasicNodes";
import { NeoPixelLEDNode, NeoPixelRGBNode, RGBLEDMatrixNode, NeoPixelDesignerNode } from "../ui/NeoPixelNodes";
import { ForeverLoopNode, ForLoopNode, WhileLoopNode, RepeatNode, BreakNode } from "../ui/LoopNodes";
import { IfElseNode } from "../ui/ConditionalNodes";
import { WiFiConnectNode, HTTPGetNode, ESPNOWSenderNode, ESPNOWReceiverNode, TimeOnlineNode } from "../ui/IOTNodes";
import { AnalogSensorNode } from "../ui/AnalogSensorNode";
import { UltrasonicSensorNode } from "../ui/UltrasonicSensorNode";
import { TouchSensorNode, SoilMoistureSensorNode, ButtonDigitalInputNode, FourChannelTouchNode, DHT11Node } from "../ui/DigitalSensorNodes";
import { IRSensorNode, IRReceiverNode } from "../ui/IRNodes";
import { IMUSensorNode, PIRSensorNode } from "../ui/IMUNodes";
import { OLEDDisplayNode, PlayAnimationNode, ShowImageNode } from "../ui/OLEDNodes";
import { LCD16x2Node } from "../ui/LCDNodes";
import { MAX7219Node } from "../ui/MatrixNodes";
import { SevenSegNode } from "../ui/SevenSegNodes";
import { ServoMotorNode, ServoMotorAdvanceNode, ServoControllerNode, MultiServoSequencerNode, ShadowArmNode, MainArmNode, ArmCalibrationNode } from "../ui/ServoNodes";
import { DCMotorSingleNode, MultiMotorControllerNode, L298NMotorDriverNode, RobotDriveNode } from "../ui/DCMotorNodes";
import { MapRangeNode, RandomNumberNode, ClampNode } from "../ui/MathNodes";
import { I2CScannerNode } from "../ui/ToolNodes";
import { ServoCalibrationNode } from "../ui/ServoNodes";
import { BLEModeNode } from "../ui/BLENodes";
import { WiFiNodeNode } from "../ui/WiFiNode";
import { MQTTNode } from "../ui/MQTTNodes";
import { HTTPClientNode, SerialMonitorNode } from "../ui/HTTPSerialNodes";
import { TimerIntervalNode, VariableStateNode, MathTransformNode } from "../ui/LogicNodes";
import { DeepSleepNode, OTAUpdateNode, SDCardNode } from "../ui/PowerNodes";

export const NODE_TYPES: NodeTypes = {
  print: PrintNode,
  variable: VariableNode,
  sleep: SleepNode,
  gpio_pin: GPIOPinNode,
  pin_write: PinWriteNode,
  pin_read: PinReadNode,
  pwm: PWMNode,
  adc: ADCNode,
  push_button: PushButtonNode,
  buzzer_tone: BuzzerToneNode,
  neopixel_led: NeoPixelLEDNode,
  neopixel_rgb: NeoPixelRGBNode,
  neopixel_designer: NeoPixelDesignerNode,
  rgb_led_matrix: RGBLEDMatrixNode,
  pwm_output: PWMOutputNode,
  forever_loop: ForeverLoopNode,
  for_loop: ForLoopNode,
  while_loop: WhileLoopNode,
  repeat: RepeatNode,
  break: BreakNode,
  if_else: IfElseNode,
  wifi_connect: WiFiConnectNode,
  http_get: HTTPGetNode,
  esp_now_sender: ESPNOWSenderNode,
  esp_now_receiver: ESPNOWReceiverNode,
  time_online: TimeOnlineNode,
  ultrasonic: UltrasonicSensorNode,
  touch_sensor: TouchSensorNode,
  soil_moisture: SoilMoistureSensorNode,
  dht11: DHT11Node,
  ir_receiver: IRReceiverNode,
  ir_sensor: IRSensorNode,
  four_channel_touch: FourChannelTouchNode,
  imu_sensor: IMUSensorNode,
  pir_sensor: PIRSensorNode,
  analog_sensor: AnalogSensorNode,
  button_digital_input: ButtonDigitalInputNode,
  oled_display: OLEDDisplayNode,
  seven_seg: SevenSegNode,
  max7219: MAX7219Node,
  play_animation: PlayAnimationNode,
  show_image: ShowImageNode,
  lcd_16x2: LCD16x2Node,
  robot_drive: RobotDriveNode,
  servo_motor: ServoMotorNode,
  servo_motor_advance: ServoMotorAdvanceNode,
  l298n_motor: L298NMotorDriverNode,
  dc_motor_single: DCMotorSingleNode,
  multi_motor_controller: MultiMotorControllerNode,
  servo_controller: ServoControllerNode,
  multi_servo_sequencer: MultiServoSequencerNode,
  shadow_arm: ShadowArmNode,
  main_arm: MainArmNode,
  arm_calibration: ArmCalibrationNode,
  map_range: MapRangeNode,
  random_number: RandomNumberNode,
  clamp: ClampNode,
  i2c_scanner: I2CScannerNode,
  servo_calibration: ServoCalibrationNode,
  ble_mode: BLEModeNode,
  wifi_node: WiFiNodeNode,
  mqtt_node: MQTTNode,
  http_client: HTTPClientNode,
  serial_monitor: SerialMonitorNode,
  timer_interval: TimerIntervalNode,
  variable_state: VariableStateNode,
  math_transform: MathTransformNode,
  deep_sleep: DeepSleepNode,
  ota_update: OTAUpdateNode,
  sd_card: SDCardNode,
};

export interface NodeDef {
  type: string;
  label: string;
  color: string;
  previewDot: string;
}

export interface NodeCategory {
  id: string;
  label: string;
  icon: string;
  nodes: NodeDef[];
}

export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: "general",
    label: "General",
    icon: "🌐",
    nodes: [
      { type: "print", label: "Print", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "variable", label: "Variable", color: "#eab308", previewDot: "#eab308" },
      { type: "sleep", label: "Sleep", color: "#ec4899", previewDot: "#ec4899" },
    ],
  },
  {
    id: "loop",
    label: "Loop",
    icon: "∞",
    nodes: [
      { type: "forever_loop", label: "Forever Loop", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "for_loop", label: "For Loop", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "while_loop", label: "While Loop", color: "#22c55e", previewDot: "#22c55e" },
      { type: "repeat", label: "Repeat", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "break", label: "Break", color: "#eab308", previewDot: "#eab308" },
    ],
  },
  {
    id: "condition",
    label: "Condition",
    icon: "?",
    nodes: [
      { type: "if_else", label: "If-Else", color: "#3b82f6", previewDot: "#3b82f6" },
    ],
  },
  {
    id: "gpio",
    label: "GPIO",
    icon: "🔲",
    nodes: [
      { type: "gpio_pin", label: "GPIO Pin", color: "#22c55e", previewDot: "#22c55e" },
      { type: "pin_write", label: "Pin Write", color: "#f97316", previewDot: "#f97316" },
      { type: "pin_read", label: "Pin Read", color: "#6366f1", previewDot: "#6366f1" },
      { type: "pwm", label: "PWM", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "pwm_output", label: "PWM Output", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "adc", label: "ADC", color: "#22c55e", previewDot: "#22c55e" },
      { type: "push_button", label: "Push Button", color: "#ec4899", previewDot: "#ec4899" },
      { type: "buzzer_tone", label: "Buzzer Tone", color: "#22c55e", previewDot: "#22c55e" },
      { type: "neopixel_led", label: "NeoPixel LED", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "neopixel_rgb", label: "NeoPixel RGB (Advanced)", color: "#7c3aed", previewDot: "#7c3aed" },
      { type: "neopixel_designer", label: "NeoPixel Designer", color: "#7c3aed", previewDot: "#7c3aed" },
      { type: "rgb_led_matrix", label: "RGB LED Matrix", color: "#14b8a6", previewDot: "#14b8a6" },
    ],
  },
  {
    id: "sensor",
    label: "Sensor",
    icon: "📡",
    nodes: [
      { type: "analog_sensor", label: "Analog Sensor", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "ultrasonic", label: "Ultrasonic Sensor", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "button_digital_input", label: "Button / Digital Input", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "touch_sensor", label: "Touch Sensor", color: "#ef4444", previewDot: "#ef4444" },
      { type: "soil_moisture", label: "Soil Moisture Sensor", color: "#f97316", previewDot: "#f97316" },
      { type: "dht11", label: "DHT11 Temp / Humidity", color: "#06b6d4", previewDot: "#06b6d4" },
      { type: "ir_receiver", label: "IR Receiver", color: "#f97316", previewDot: "#f97316" },
      { type: "ir_sensor", label: "IR Sensor", color: "#f97316", previewDot: "#f97316" },
      { type: "four_channel_touch", label: "4-Channel Touch Sensor", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "imu_sensor",    label: "Onboard IMU (LSM6DS3)", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "pir_sensor", label: "PIR Motion Sensor", color: "#22c55e", previewDot: "#22c55e" },
    ],
  },
  {
    id: "iot",
    label: "IoT",
    icon: "📶",
    nodes: [
      { type: "wifi_connect", label: "WiFi Connect", color: "#ef4444", previewDot: "#ef4444" },
      { type: "http_get", label: "HTTP GET", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "esp_now_sender", label: "ESP NOW Sender", color: "#ef4444", previewDot: "#ef4444" },
      { type: "esp_now_receiver", label: "ESP NOW Receiver", color: "#ef4444", previewDot: "#ef4444" },
      { type: "time_online", label: "Time Online", color: "#14b8a6", previewDot: "#14b8a6" },
    ],
  },
  {
    id: "display",
    label: "Display",
    icon: "🖥",
    nodes: [
      { type: "oled_display", label: "OLED Display 128×64", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "lcd_16x2", label: "16×2 LCD Node", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "seven_seg", label: "7-Seg Display TM1637", color: "#ef4444", previewDot: "#ef4444" },
      { type: "max7219", label: "MAX7219 8×8 Matrix", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "play_animation", label: "Play Animation", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "show_image", label: "Show Image", color: "#8b5cf6", previewDot: "#8b5cf6" },
    ],
  },
  {
    id: "motors",
    label: "Motors",
    icon: "⚙️",
    nodes: [
      { type: "robot_drive", label: "Robot Drive", color: "#f97316", previewDot: "#f97316" },
      { type: "dc_motor_single", label: "DC Motor (Single)", color: "#f97316", previewDot: "#f97316" },
      { type: "multi_motor_controller", label: "Multi-Motor Controller", color: "#ef4444", previewDot: "#ef4444" },
      { type: "servo_motor", label: "Servo Motor", color: "#f97316", previewDot: "#f97316" },
      { type: "servo_motor_advance", label: "Servo Sweep", color: "#f97316", previewDot: "#f97316" },
      { type: "servo_controller", label: "Servo Controller", color: "#f97316", previewDot: "#f97316" },
      { type: "multi_servo_sequencer", label: "Multi-Servo Sequencer", color: "#8b5cf6", previewDot: "#8b5cf6" },
      { type: "shadow_arm", label: "Shadow Arm (Pots)", color: "#06b6d4", previewDot: "#06b6d4" },
      { type: "main_arm", label: "Main Arm (Robo)", color: "#f97316", previewDot: "#f97316" },
      { type: "arm_calibration", label: "Arm Calibration", color: "#06b6d4", previewDot: "#06b6d4" },
    ],
  },
  {
    id: "comms",
    label: "Comms",
    icon: "📡",
    nodes: [
      { type: "ble_mode", label: "BLE Mode", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "wifi_node", label: "WiFi Node", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "mqtt_node", label: "MQTT Node", color: "#f97316", previewDot: "#f97316" },
      { type: "http_client", label: "HTTP Client", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "serial_monitor", label: "Serial Monitor", color: "#22c55e", previewDot: "#22c55e" },
    ],
  },
  {
    id: "logic",
    label: "Logic",
    icon: "⚡",
    nodes: [
      { type: "timer_interval", label: "Timer / Interval", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "variable_state", label: "Variable / State", color: "#eab308", previewDot: "#eab308" },
      { type: "math_transform", label: "Math / Transform", color: "#8b5cf6", previewDot: "#8b5cf6" },
    ],
  },
  {
    id: "power",
    label: "Power",
    icon: "🔋",
    nodes: [
      { type: "deep_sleep", label: "Deep Sleep / Power", color: "#ef4444", previewDot: "#ef4444" },
      { type: "ota_update", label: "OTA Update", color: "#14b8a6", previewDot: "#14b8a6" },
      { type: "sd_card", label: "SD Card", color: "#22c55e", previewDot: "#22c55e" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: "🔧",
    nodes: [
      { type: "i2c_scanner", label: "I2C Scanner", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "servo_calibration", label: "Servo Calibration", color: "#14b8a6", previewDot: "#14b8a6" },
    ],
  },
  {
    id: "math",
    label: "Math",
    icon: "(x)",
    nodes: [
      { type: "map_range", label: "Map Range", color: "#3b82f6", previewDot: "#3b82f6" },
      { type: "random_number", label: "Random Number", color: "#7c3aed", previewDot: "#7c3aed" },
      { type: "clamp", label: "Clamp", color: "#22c55e", previewDot: "#22c55e" },
    ],
  },
];
