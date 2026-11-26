import { getBoard, useBoard, RFID, SENSOR_PORTS, IR_SENSOR, PIR_SENSOR, type BoardId } from "@/entities/board";

/**
 * Default pin for a block that has no pin set yet, per board. Both generators
 * and the node UI read this table, so the pin shown on a fresh block is the pin
 * the generated code uses. Nothing here is written into node data.
 */
const PINS = {
  // ESP32 DevKit: ADC1 inputs (32-39) for analog, 2 = onboard LED. Avoids 0/1/3/12 (boot, REPL) and 21/22 (I2C).
  esp32: {
    gpio: 2, write: 2, led: 2, pwm: 2, relay: 26, buzzer: 25,
    read: 15, button: 15, dht: 4, pir: 33, ir: 27, sound: 14, touch: 32,
    analog: 34, soil: 35, trig: 16, echo: 17,
    rfidSs: 5, rfidRst: 4, sck: 18, mosi: 23, miso: 19, btRx: 16, btTx: 17,
    motorIn1: 18, motorIn2: 19, motorEn: 23, // only shared with the RFID / SD card SPI pins
  },
  // Uno: A0-A5 are pins 14-19, 13 = onboard LED, PWM needs 3/5/6/9/10/11, 10-13 = SPI (RFID).
  arduino_uno: {
    gpio: 13, write: 13, led: 13, pwm: 3, relay: 7, buzzer: 8,
    read: 2, button: 2, dht: 4, pir: 2, ir: 2, sound: 2, touch: 2,
    analog: 14, soil: 14, trig: 5, echo: 6,
    rfidSs: 10, rfidRst: 9, sck: 13, mosi: 11, miso: 12, btRx: 10, btTx: 11,
    motorIn1: 15, motorIn2: 16, motorEn: 3, // A1, A2 + PWM pin 3 (Servo.h takes PWM off 9/10, 5/6 are the ultrasonic defaults; tone() stops PWM on 3, so move EN to 5 or 6 when a buzzer is used)
  },
  // Kokoon PCB: the values these blocks always used (sensor port 1 = GPIO 4/5, port 2 = GPIO 1/2).
  kokoon: {
    gpio: 2, write: 4, led: 2, pwm: 2, relay: 2, buzzer: 46,
    read: 4, button: 0, dht: 4, pir: PIR_SENSOR.pin, ir: IR_SENSOR.pin, sound: 1, touch: SENSOR_PORTS["1"].sda,
    analog: 34, soil: SENSOR_PORTS["1"].sda, trig: SENSOR_PORTS["1"].trig, echo: SENSOR_PORTS["1"].echo,
    rfidSs: RFID.cs, rfidRst: RFID.rst, sck: RFID.sck, mosi: RFID.mosi, miso: RFID.miso, btRx: 1, btTx: 2,
    motorIn1: 4, motorIn2: 5, motorEn: 1, // unused: Kokoon drives motors through the onboard DRV8833
  },
} satisfies Record<BoardId, Record<string, number>>;

export type PinRole = keyof (typeof PINS)["esp32"];

export function pinDefaults(boardId: BoardId = getBoard().id): Record<PinRole, number> {
  return PINS[boardId];
}

/** Same table for the node UI, following the board picker. */
export const usePinDefaults = () => pinDefaults(useBoard().id);

/** One-pin sensors that share a single node component and one codegen path. */
export const SIMPLE_SENSORS: Record<string, { title: string; varName: string; pin: PinRole }> = {
  gas_sensor:   { title: "Gas Sensor (MQ-2 / MQ-135)", varName: "gas", pin: "analog" },
  rain_sensor:  { title: "Rain Sensor", varName: "rain", pin: "analog" },
  water_level:  { title: "Water Level Sensor", varName: "water_level", pin: "analog" },
  ldr_sensor:   { title: "Light Sensor (LDR)", varName: "light", pin: "analog" },
  sound_sensor: { title: "Sound Sensor", varName: "sound", pin: "sound" },
  pir_motion:   { title: "PIR Motion (HC-SR501)", varName: "motion", pin: "pir" },
};
