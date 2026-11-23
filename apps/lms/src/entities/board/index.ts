export {
  BOARD,
  OLED,
  NEOPIXEL,
  ONBOARD_IMU,
  SENSOR_PORTS,
  PIR_SENSOR,
  IR_SENSOR,
  SPI1,
  RFID,
  MATRIX,
  SERVO_PORTS,
  SERVO_PORT_ORDER,
  SERVO_MODELS,
  SERVO_MODEL_ORDER,
  MOTORS,
} from "./model/hardwareConfig";

export type {
  SensorPortId,
  ServoPortId,
  ServoModelId,
  ServoType,
  MotorId,
} from "./model/hardwareConfig";

export { BOARDS, BOARD_ORDER, DEFAULT_BOARD, useBoardStore, useBoard, getBoard } from "./model/boards";
export type { BoardId, BoardProfile, BoardRuntime } from "./model/boards";
