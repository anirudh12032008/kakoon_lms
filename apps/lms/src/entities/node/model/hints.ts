/**
 * Kid-friendly one-liner hints for every node type. Shown in the node header's
 * "?" tooltip and as hover titles in the block palette.
 */
export const NODE_HINTS: Record<string, string> = {
  // General
  print: "Writes a message to the terminal — great for checking what your robot is thinking.",
  variable: "Stores a value (a number or text) with a name so other blocks can use it.",
  sleep: "Pauses the program for a number of seconds before running the next block.",

  // Loop
  forever_loop: "Repeats everything inside it forever — the heartbeat of most robots.",
  for_loop: "Repeats its blocks a counted number of times, counting up as it goes.",
  while_loop: "Keeps repeating while a condition stays true.",
  repeat: "Runs its blocks a fixed number of times.",
  break: "Jumps out of the current loop immediately.",

  // Condition
  if_else: "Asks a yes/no question — True goes right, False goes left.",

  // GPIO
  gpio_pin: "Sets up one pin on the board as an input or output.",
  pin_write: "Turns a pin on (HIGH) or off (LOW) — switch LEDs and relays.",
  pin_read: "Reads whether a pin is on or off right now.",
  pwm: "Sends a fast on/off signal to fade LEDs or control speed.",
  pwm_output: "Outputs a PWM signal with a chosen frequency and strength.",
  adc: "Reads an analog voltage (0–4095) from a pin — for knobs and sensors.",
  push_button: "Reacts when a button wired to a pin is pressed.",
  buzzer_tone: "Plays a beep or tone on a buzzer at a chosen pitch.",
  neopixel_led: "Sets the color of addressable RGB LEDs (NeoPixels).",
  neopixel_rgb: "Full control of NeoPixels — per-LED colors and effects.",
  neopixel_designer: "Plays a light pattern you drew in the NeoPixel Designer.",
  rgb_led_matrix: "Drives a grid of RGB LEDs to show colors and patterns.",

  // Sensors
  analog_sensor: "Reads any analog sensor (light, knob, flex…) into a variable.",
  ultrasonic: "Measures distance with sound waves — like bat sonar.",
  button_digital_input: "Reads a simple on/off signal like a button or switch.",
  touch_sensor: "Detects when someone touches the sensor pad.",
  soil_moisture: "Measures how wet the soil is — perfect for plant projects.",
  ir_receiver: "Receives signals from an infrared remote control.",
  ir_sensor: "Detects obstacles or lines using infrared light.",
  four_channel_touch: "Four touch pads in one — each pad can trigger something different.",
  imu_sensor: "Reads the board's motion sensor — tilt, turn, and shake.",
  pir_sensor: "Detects movement of people or pets using body heat.",

  // IoT
  wifi_connect: "Connects your robot to a WiFi network.",
  http_get: "Fetches data from a website or API over WiFi.",
  esp_now_sender: "Sends quick messages directly to another ESP32 — no WiFi router needed.",
  esp_now_receiver: "Listens for messages from another ESP32.",
  time_online: "Gets the real current time from the internet.",

  // Display
  oled_display: "Shows text and numbers on the small OLED screen.",
  lcd_16x2: "Writes two lines of text on a classic 16×2 LCD.",
  seven_seg: "Shows numbers on a 4-digit seven-segment display.",
  max7219: "Draws patterns on an 8×8 LED matrix.",
  play_animation: "Plays an animation you made in the OLED Designer.",
  show_image: "Shows a picture you imported on the OLED screen.",

  // Motors
  robot_drive: "Drives your robot — forward, backward, and turns — with one block.",
  dc_motor_single: "Spins one DC motor at a chosen speed and direction.",
  multi_motor_controller: "Controls up to four motors together — sync them or steer each one.",
  servo_motor: "Turns a servo to an exact angle (0–180°).",
  servo_motor_advance: "Sweeps a servo back and forth between two angles.",
  servo_controller: "Live slider control for a servo — great for testing positions.",
  multi_servo_sequencer: "Choreographs several servos through a sequence of poses.",

  // Comms
  ble_mode: "Lets a phone connect to your robot over Bluetooth.",
  wifi_node: "Advanced WiFi setup with extra connection options.",
  mqtt_node: "Sends and receives messages through an MQTT broker — IoT style.",
  http_client: "Makes web requests (GET/POST) with full control.",
  serial_monitor: "Prints values over USB so you can watch them live.",

  // Logic
  timer_interval: "Runs blocks on a repeating timer without blocking the program.",
  variable_state: "A smarter variable that tracks state changes.",
  math_transform: "Applies math (scale, offset, smooth…) to a value.",

  // Power
  deep_sleep: "Puts the board into ultra-low-power sleep to save battery.",
  ota_update: "Updates the robot's code over WiFi — no cable needed.",
  sd_card: "Reads and writes files on an SD card.",

  // Tools
  i2c_scanner: "Finds every I2C device connected to the board and lists its address.",
  servo_calibration: "Helps you find a servo's true min/max angles.",

  // Math
  map_range: "Converts a number from one range to another (e.g. 0–4095 → 0–100).",
  random_number: "Picks a random number between a min and max.",
  clamp: "Keeps a number inside a min/max range.",
};
