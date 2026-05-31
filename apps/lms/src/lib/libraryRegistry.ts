export interface LibraryEntry {
  id: string;
  name: string;
  description: string;
  /** String that appears in generated code when this lib is needed */
  trigger: string;
  /** Path under /public/libs/ */
  path: string;
  category: "Display" | "Sensor" | "Motor" | "Comms" | "Utility";
  /** npm-like size estimate shown in UI */
  size?: string;
}

export const LIBRARY_REGISTRY: LibraryEntry[] = [
  // ── Display ──────────────────────────────────────────────────────────────────
  {
    id: "sh1106",
    name: "sh1106.py",
    description: "SH1106 OLED display driver (I2C/SPI, 128×64)",
    trigger: "SH1106_I2C",
    path: "/libs/sh1106.py",
    category: "Display",
    size: "4 KB",
  },
  {
    id: "ssd1306",
    name: "ssd1306.py",
    description: "SSD1306 OLED display driver (I2C/SPI, 128×64)",
    trigger: "SSD1306_I2C",
    path: "/libs/ssd1306.py",
    category: "Display",
    size: "5 KB",
  },
  {
    id: "max7219",
    name: "max7219.py",
    description: "MAX7219 8×8 LED matrix driver (SPI chaining support)",
    trigger: "max7219",
    path: "/libs/max7219.py",
    category: "Display",
    size: "3 KB",
  },
  {
    id: "tm1637",
    name: "tm1637.py",
    description: "TM1637 7-segment display driver",
    trigger: "tm1637",
    path: "/libs/tm1637.py",
    category: "Display",
    size: "2 KB",
  },
  // ── Sensor ───────────────────────────────────────────────────────────────────
  {
    id: "lsm6ds3",
    name: "lsm6ds3.py",
    description: "LSM6DS3 onboard 6-axis IMU — Kakoon ESP32-S3 (SCL=42, SDA=41)",
    trigger: "lsm6ds3",
    path: "/libs/lsm6ds3.py",
    category: "Sensor",
    size: "2 KB",
  },
  {
    id: "mpu6050",
    name: "mpu6050.py",
    description: "MPU6050 6-axis IMU (accelerometer + gyroscope) — I2C",
    trigger: "mpu6050",
    path: "/libs/mpu6050.py",
    category: "Sensor",
    size: "6 KB",
  },
  {
    id: "bme280",
    name: "bme280.py",
    description: "BME280 environmental sensor (temp, humidity, pressure)",
    trigger: "bme280",
    path: "/libs/bme280.py",
    category: "Sensor",
    size: "7 KB",
  },
  {
    id: "vl53l0x",
    name: "vl53l0x.py",
    description: "VL53L0X Time-of-Flight distance sensor — I2C",
    trigger: "vl53l0x",
    path: "/libs/vl53l0x.py",
    category: "Sensor",
    size: "8 KB",
  },
  {
    id: "dht",
    name: "dht.py",
    description: "DHT11/DHT22 temperature & humidity sensor",
    trigger: "import dht",
    path: "/libs/dht.py",
    category: "Sensor",
    size: "2 KB",
  },
  {
    id: "hcsr04",
    name: "hcsr04.py",
    description: "HC-SR04 ultrasonic distance sensor helper",
    trigger: "hcsr04",
    path: "/libs/hcsr04.py",
    category: "Sensor",
    size: "2 KB",
  },
  // ── Motor ────────────────────────────────────────────────────────────────────
  {
    id: "drv8833",
    name: "drv8833.py",
    description: "DRV8833 dual H-bridge motor driver helper",
    trigger: "drv8833",
    path: "/libs/drv8833.py",
    category: "Motor",
    size: "2 KB",
  },
  // ── Comms ────────────────────────────────────────────────────────────────────
  {
    id: "umqtt_simple",
    name: "umqtt/simple.py",
    description: "Lightweight MQTT client for MicroPython",
    trigger: "umqtt",
    path: "/libs/umqtt_simple.py",
    category: "Comms",
    size: "5 KB",
  },
  {
    id: "urequests",
    name: "urequests.py",
    description: "HTTP requests library for MicroPython",
    trigger: "urequests",
    path: "/libs/urequests.py",
    category: "Comms",
    size: "4 KB",
  },
  {
    id: "aioble",
    name: "aioble.py",
    description: "Async BLE library for MicroPython (Bluetooth LE)",
    trigger: "aioble",
    path: "/libs/aioble.py",
    category: "Comms",
    size: "12 KB",
  },
  // ── Utility ──────────────────────────────────────────────────────────────────
  {
    id: "sdcard",
    name: "sdcard.py",
    description: "SD card SPI driver for MicroPython filesystem",
    trigger: "sdcard",
    path: "/libs/sdcard.py",
    category: "Utility",
    size: "3 KB",
  },
  {
    id: "ntptime",
    name: "ntptime.py",
    description: "NTP time synchronization for MicroPython",
    trigger: "ntptime",
    path: "/libs/ntptime.py",
    category: "Utility",
    size: "1 KB",
  },
];

export function getRequiredLibraries(code: string): LibraryEntry[] {
  return LIBRARY_REGISTRY.filter((lib) => code.includes(lib.trigger));
}

export const CATEGORY_COLORS: Record<LibraryEntry["category"], string> = {
  Display: "#8b5cf6",
  Sensor: "#22c55e",
  Motor: "#f97316",
  Comms: "#3b82f6",
  Utility: "#eab308",
};
