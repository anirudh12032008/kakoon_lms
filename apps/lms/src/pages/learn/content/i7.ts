import type { ModuleContent } from "../model/curriculum";

/**
 * Module i7: Wired communication protocols.
 * Sketches target the Arduino AVR core 1.8.8 (Uno) and Arduino-ESP32 core 3.3.10
 * (ESP-IDF 5.5), compiled with arduino-cli.
 */
const lessons: ModuleContent = {
  "i7-uart-and-serial-standards": {
    id: "i7-uart-and-serial-standards",
    outcomes: [
      "Draw a UART frame bit by bit and work out the time it takes on the wire",
      "Calculate baud rate error from a clock frequency and judge whether a link will work",
      "Explain what parity and hardware flow control protect against",
      "Choose between TTL serial, RS-232 and RS-485 for a given cable length and environment",
    ],
    blocks: [
      { t: "h", text: "Why serial ports still matter" },
      { t: "p", text: "Almost every device you will meet has a UART somewhere: GPS modules, GSM and LTE modems, fingerprint readers, motor drivers, industrial meters, and the USB link you use to print debug text. It is the oldest of the buses in this module and the simplest, which is exactly why it is worth understanding properly. When a GPS module prints garbage, the reason is nearly always one of four things in this lesson: the wrong baud rate, the wrong frame format, the wrong voltage levels, or a missing ground." },
      { t: "p", text: "UART stands for Universal Asynchronous Receiver Transmitter. **Asynchronous** is the important word. There is no clock wire. Each side has its own clock, both agree in advance on how long one bit lasts, and the receiver re-synchronises at the start of every character. Two wires carry data, one in each direction (`TX` of one device goes to `RX` of the other), and a third wire, ground, is the reference that makes the voltages mean anything." },

      { t: "h", text: "The frame, bit by bit" },
      { t: "p", text: "The idle line sits high (logic 1, called **mark**). A character begins with a **start bit**, a low (0, called **space**) lasting exactly one bit time. Then come the data bits, **least significant bit first**, usually 8 of them. Optionally a **parity bit** follows. Finally one or two **stop bits** return the line high, so the next start bit always has a high-to-low edge to be seen." },
      { t: "diagram", text: String.raw`Sending 'K' = 0x4B = 0100 1011 binary, as 8N1 (LSB first: 1 1 0 1 0 0 1 0)

 idle  start  d0   d1   d2   d3   d4   d5   d6   d7   stop  idle
 ────┐      ┌─────────┐    ┌──┐         ┌──┐         ┌──────────
     │      │         │    │  │         │  │         │
     └──────┘         └────┘  └─────────┘  └─────────┘
       0      1    1    0    1   0    0    1    0      1
     |<-1 bit->|                                     |
     |<---------------- 10 bit times ---------------->|

 Receiver: sees the falling edge, waits 1.5 bit times, then samples
 the middle of each following bit.`, caption: "One 8N1 character: 1 start bit, 8 data bits LSB first, no parity, 1 stop bit." },
      { t: "p", text: "Frame formats are written as data bits, parity, stop bits: **8N1** is 8 data bits, no parity, 1 stop bit, and it is what almost everything uses by default. **8E1** adds an even parity bit (common in Modbus RTU). **7E1** turns up on old meters. Both ends must agree, or every character is wrong." },
      { t: "widget", id: "uart-frame" },
      { t: "h", text: "Baud rate and real throughput" },
      { t: "p", text: "The **baud rate** is the number of symbols per second on the line. For a UART every symbol is one bit, so 9600 baud means each bit lasts 1/9600 s ≈ 104.2 µs. The framing bits are overhead: an 8N1 character takes 10 bit times to carry 8 bits of data." },
      { t: "formula", text: String.raw`bit time        = 1 / baud
character time  = (1 + data + parity + stop) / baud
bytes per second = baud / bits per character

9600 baud, 8N1:    9600 / 10 = 960 bytes/s,  one byte every 1.04 ms
115200 baud, 8N1:  115200 / 10 = 11520 bytes/s, one byte every 86.8 µs
115200 baud, 8E1:  115200 / 11 ≈ 10473 bytes/s`, caption: "Throughput is always less than baud ÷ 8." },
      { t: "p", text: "Check: a GPS module sending a 70-character NMEA sentence at 9600 baud 8N1 needs 70 × 1.04 ms ≈ 73 ms. Ten sentences a second would need 730 ms of every second, so 9600 baud is close to full at 10 Hz updates. That is why fast GPS modules are switched to 38400 or 115200 baud." },

      { t: "h", text: "Baud rate error: why some rates fail" },
      { t: "p", text: "The UART hardware divides its clock by an integer to get the bit rate. If the clock does not divide evenly, the actual rate differs from the one you asked for. The receiver samples near the middle of each bit, so a small error accumulates over the frame. By the stop bit (9.5 bit times after the start edge for 8N1), the sample point must still be inside the bit. That gives a total budget of half a bit over 9.5 bits, about 5%, shared between the two ends, so as a rule **keep each end within about 2%**." },
      { t: "p", text: "The Uno's ATmega328P runs from 16 MHz. In double-speed mode (which the Arduino core uses at most rates), the divider is UBRR and the rate is 16 MHz ÷ (8 × (UBRR + 1))." },
      { t: "formula", text: String.raw`Ask for 115200:  UBRR = 16 000 000 / (8 × 115200) - 1 = 16.36  → 16
                 actual = 16 000 000 / (8 × 17) = 117 647 baud
                 error  = (117 647 - 115 200) / 115 200 = +2.1 %

Ask for 9600:    UBRR = 16 000 000 / (8 × 9600) - 1 = 207.3  → 207
                 actual = 16 000 000 / (8 × 208) = 9615 baud
                 error  = +0.16 %`, caption: "The Uno at 115200 is already at the edge; at 9600 it is nearly exact." },
      { t: "p", text: "Check the 115200 case: one bit at 117 647 baud is 8.5 µs instead of 8.68 µs, and after 9.5 bits the drift is 9.5 × 0.18 ≈ 1.7 µs, about 20% of a bit. The sample is still inside the stop bit, so it works, but a second device that is 3% slow in the other direction would break it. The ESP32 has a fractional divider from an 80 MHz clock and is within a fraction of a percent at all the common rates, so most Uno to ESP32 problems at 115200 come from the Uno's side." },

      { t: "h", text: "Parity and flow control" },
      { t: "p", text: "A **parity bit** makes the count of 1s in data plus parity even (even parity) or odd (odd parity). It detects any single flipped bit in the character, and misses any two flipped bits. It cannot correct anything. Modern protocols prefer a checksum or CRC over the whole message, which catches far more, so parity is mostly seen where a standard requires it." },
      { t: "p", text: "**Flow control** stops a fast sender overrunning a slow receiver's buffer. The Uno's receive buffer is only 64 bytes: at 115200 baud it fills in 64 × 86.8 µs ≈ 5.6 ms, so a sketch that blocks for 10 ms inside `delay()` will lose data. Hardware flow control adds two wires: the receiver drives **RTS** (request to send) low when it has room, and the sender only transmits while its **CTS** (clear to send) input is low. Software flow control (XON/XOFF) sends the bytes 0x11 and 0x13 in the data stream instead, which only works for text. Many modems and Bluetooth modules need RTS/CTS at high baud rates; the ESP32's UARTs support it in hardware with `Serial1.setPins(rx, tx, cts, rts)` and `Serial1.setHwFlowCtrlMode()`." },

      { t: "h", text: "Voltage levels: TTL, RS-232 and RS-485" },
      { t: "p", text: "The UART decides the timing. The **physical layer** decides what voltage stands for 1 and 0, and how far the signal can go. Three are common:" },
      { t: "table", head: ["", "TTL / CMOS serial", "RS-232", "RS-485"], rows: [
        ["Logic 1 (mark)", "High: 3.3 V or 5 V", "-3 to -15 V", "A higher than B by 200 mV or more (MAX485-style A/B labels)"],
        ["Logic 0 (space)", "Low: 0 V", "+3 to +15 V", "A lower than B by 200 mV or more"],
        ["Wires", "TX, RX, GND", "TX, RX, GND (+ handshake)", "Twisted pair A/B (+ GND)"],
        ["Typical range", "Under 1 m, same board", "About 15 m at 19200 baud", "Up to 1200 m at 100 kbaud"],
        ["Devices on a line", "2", "2", "32 unit loads (more with 1/8 load parts)"],
        ["Chip you use", "None", "MAX232 / MAX3232", "MAX485, SN75176, MAX3485 (3.3 V)"],
      ], caption: "RS-232 is inverted and bipolar; RS-485 is differential. The TIA-485 standard itself names the lines the other way round (its A is the inverting line), so when two vendors' devices do not talk, try swapping A and B." },
      { t: "p", text: "**TTL serial** is the raw pin. An Uno TX pin swings 0 to 5 V; an ESP32 swings 0 to 3.3 V. Connecting Uno TX straight to an ESP32 RX pin puts 5 V on a 3.3 V input: use a divider (for example 1 kΩ from Uno TX and 2 kΩ to ground gives 3.33 V) or a level shifter. The other direction usually works because the Uno reads 3.3 V as high." },
      { t: "p", text: "**RS-232** is the old PC serial port. Its voltages are inverted and can reach ±15 V, which will destroy a microcontroller pin. Never connect a DB9 serial port straight to a GPIO; go through a MAX3232 (which works from 3.3 V) or a ready-made converter." },
      { t: "p", text: "**RS-485** sends each bit as the difference between two wires twisted together. Noise picked up along the cable appears equally on both and cancels when the receiver subtracts them. That is why it is the standard for factory sensors, energy meters and Modbus RTU. It is half duplex on one pair: only one device talks at a time, and your code must switch the transceiver between transmit and receive. On a MAX485 the **DE** (driver enable) and **/RE** (receiver enable, active low) pins are usually tied together to one GPIO: high to transmit, low to listen. The cable needs a 120 Ω terminator at each end of the line." },
      { t: "note", kind: "warn", text: "The plain MAX485 is a 5 V part. With an ESP32 DevKit, use a 3.3 V transceiver such as the MAX3485 or SP3485, or the MAX485's RO output will put 5 V on your RX pin." },

      { t: "h", text: "Worked example: RS-485 on the ESP32" },
      { t: "p", text: "The sketch below sends a Modbus-style request on `Serial2` at 9600 baud 8E1 through a MAX3485, with RX on GPIO 16, TX on GPIO 17 and DE/RE on GPIO 4 of the ESP32 DevKit. The key detail is `Serial2.flush()`: it waits until the last stop bit has actually left the shift register. Switch DE low before that and you chop off the end of your own message." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. MAX3485 on Serial2.
// GPIO16 = RX (RO), GPIO17 = TX (DI), GPIO4 = DE and /RE tied together.
const int PIN_RX = 16, PIN_TX = 17, PIN_DIR = 4;

void sendFrame(const uint8_t *buf, size_t len) {
  digitalWrite(PIN_DIR, HIGH);   // driver on
  Serial2.write(buf, len);
  Serial2.flush();               // wait for the last stop bit to leave
  digitalWrite(PIN_DIR, LOW);    // back to listening
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_DIR, OUTPUT);
  digitalWrite(PIN_DIR, LOW);
  Serial2.begin(9600, SERIAL_8E1, PIN_RX, PIN_TX);
}

void loop() {
  // Read holding register 0 from slave 1 (Modbus RTU, CRC precomputed).
  const uint8_t req[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x01, 0x84, 0x0A};
  sendFrame(req, sizeof req);

  unsigned long start = millis();
  while (millis() - start < 200) {          // 200 ms reply window
    if (Serial2.available()) {
      Serial.printf("%02X ", Serial2.read());
    }
  }
  Serial.println();
  delay(1000);
}`, caption: "Half-duplex RS-485: drive, flush, release." },

      { t: "deep", title: "Deriving the 5% UART timing budget", blocks: [
        { t: "p", text: "Let the receiver's bit time be T and the sender's be T(1 + e), where e is the fractional mismatch. The receiver detects the start edge (with an uncertainty of one sample tick, 1/16 of a bit on most UARTs) and then samples at 1.5T, 2.5T and so on. The last sample, in the stop bit, is at 9.5T for 8N1." },
        { t: "formula", text: String.raw`Stop bit on the wire lasts from 9(1+e)T to 10(1+e)T
Sample must satisfy  9(1+e)T < 9.5T < 10(1+e)T
Upper limit (sender slow):  9(1+e) < 9.5   →  e < +5.6 %
Lower limit (sender fast):  10(1+e) > 9.5  →  e > -5.0 %
Subtract 1/16 bit for edge detection: 0.5 - 0.0625 = 0.4375 bit
Usable mismatch ≈ 0.4375 / 9.5 ≈ 4.6 %`, caption: "A total mismatch budget of about ±4.6% between the two ends." },
        { t: "p", text: "Real receivers often take three samples around the middle and vote, which narrows the budget further, and the edges are not perfectly sharp on a long cable. That is why datasheets recommend staying within about ±2% at each end, so that two worst-case devices erring in opposite directions still fit. For 8E1 the last sample is at 10.5T, so the budget shrinks to about 0.4375 / 10.5 ≈ 4.2%." },
        { t: "p", text: "A practical consequence: an internal RC oscillator, typically accurate to ±1% to ±10% depending on the chip and temperature, is often not good enough for a UART. Microcontrollers that must talk serial reliably use a crystal or a calibrated oscillator, or auto-baud by timing a known character." },
      ] },
      { t: "deep", title: "RS-485 termination, biasing and unit loads", blocks: [
        { t: "p", text: "A twisted pair has a characteristic impedance of about 100 to 120 Ω. A signal edge travelling along it is reflected at an open end, and the reflection can be mistaken for a bit. A resistor equal to the cable impedance at each physical end absorbs the edge. Two 120 Ω resistors in parallel load the driver with 60 Ω; an RS-485 driver is specified to produce at least 1.5 V across 54 Ω, which is exactly this case plus some margin." },
        { t: "p", text: "When nobody is transmitting, all drivers are off and the line floats. Noise can then look like a start bit. **Fail-safe biasing** fixes this: a pull-up (often 560 Ω to 1 kΩ) on A and a pull-down on B at one node hold A above B by more than 200 mV, so an idle line reads as mark (logic 1). Check that the bias network still leaves enough difference when combined with the two terminators." },
        { t: "formula", text: String.raw`Bias: 5 V → 680 Ω → A ── 60 Ω (two terminators) ── B → 680 Ω → GND
Current = 5 / (680 + 60 + 680) = 3.52 mA
V(A) - V(B) = 3.52 mA × 60 Ω ≈ 211 mV   (just above 200 mV)`, caption: "Bias resistors much larger than 680 Ω would not hold the idle line above the 200 mV threshold." },
        { t: "p", text: "Each receiver is a load on the line, measured in **unit loads** (one unit load is 12 kΩ input resistance). A standard driver can handle 32 unit loads. Modern transceivers rated 1/4 or 1/8 unit load allow 128 or 256 nodes. Lay the bus out as a daisy chain with short stubs, not a star: every branch is another open end to reflect from." },
      ] },
    ],
    mistakes: [
      "**Connecting TX to TX.** One device's transmit pin goes to the other's receive pin, and grounds must be joined.",
      "**Forgetting the common ground.** Without it, TTL and RS-232 levels have no reference and you get random characters or nothing.",
      "**Putting 5 V or RS-232 levels into an ESP32 pin.** Use a divider, level shifter or MAX3232; RS-232's ±12 V will damage any GPIO.",
      "**Switching an RS-485 transceiver back to receive before `flush()` returns.** The last byte of every message is cut off and the slave never replies.",
      "**Mismatched frame format.** A device expecting 8E1 talking to one sending 8N1 gives framing errors on every byte, even though the baud rate is right.",
      "**Blocking code with a small receive buffer.** A 64-byte buffer at 115200 baud overflows in under 6 ms; read the port often or raise the buffer size on the ESP32 with `Serial2.setRxBufferSize()` before `begin()`.",
    ],
    practice: {
      kind: "bench",
      task: "Link an Uno and an ESP32 over TTL serial and watch a baud mismatch fail.",
      steps: [
        "Wire Uno D1 (TX) through a 1 kΩ / 2 kΩ divider to ESP32 GPIO 16, ESP32 GPIO 17 straight to Uno D0 (RX) via a 1 kΩ series resistor, and join the grounds. Unplug the D0 wire while uploading to the Uno.",
        "On the Uno, print a counter every 100 ms with `Serial.begin(9600)`. On the ESP32, start `Serial2.begin(9600, SERIAL_8N1, 16, 17)` and copy everything from Serial2 to Serial.",
        "Confirm clean text in the ESP32's serial monitor. Measure the divider output with a multimeter while the Uno line idles: it should be near 3.3 V.",
        "Change only the ESP32 side to 8E1, then to 10000 baud (a 4% error), then 10500 baud. Record which settings give errors and relate them to the timing budget in the lesson.",
        "Bonus: calculate the Uno's actual rate at 57600 baud using the UBRR formula and test whether it works.",
      ],
    },
    quiz: [
      {
        q: "How long does one 8N1 character take at 19200 baud?",
        options: ["About 417 µs", "About 521 µs", "About 52 µs", "About 4.2 ms"],
        answer: 1,
        why: "8N1 is 10 bits. 10 / 19200 s = 520.8 µs.",
      },
      {
        q: "A 16 MHz Uno is asked for 115200 baud and actually produces about 117 647 baud. Why does this usually still work?",
        options: [
          "The receiver resynchronises on every bit",
          "Parity corrects the error",
          "The error is about 2.1%, inside the roughly 4 to 5% total budget before the stop bit sample drifts out of the bit",
          "The UART always rounds to the nearest standard rate",
        ],
        answer: 2,
        why: "A UART only resynchronises at the start edge. Over 9.5 bit times, a 2.1% error moves the stop bit sample by about 20% of a bit, which is still inside it.",
      },
      {
        q: "Even parity is in use. A byte arrives with two of its bits flipped by noise. What happens?",
        options: [
          "The parity check passes and the corrupt byte is accepted",
          "The parity bit corrects both bits",
          "The receiver flags a parity error",
          "The receiver discards the whole message",
        ],
        answer: 0,
        why: "Two flips leave the count of 1s with the same evenness, so parity cannot see them. Parity only detects an odd number of errors.",
      },
      {
        q: "Why can RS-485 run hundreds of metres where TTL serial cannot?",
        options: [
          "It uses a higher baud rate",
          "It sends each bit as a voltage difference on a twisted pair, so noise common to both wires cancels",
          "It uses ±15 V levels",
          "It has a clock wire",
        ],
        answer: 1,
        why: "Differential signalling rejects common-mode noise, and twisted pairs pick up nearly equal noise on both wires.",
      },
      {
        q: "On a MAX485, your sketch writes a 8-byte request and sets DE low on the next line without calling flush(). What do you expect?",
        options: [
          "Nothing changes: write() only returns once the bytes are sent",
          "The baud rate doubles",
          "The receiver enable conflicts and the chip overheats",
          "The tail of the message is cut off because the driver is disabled while bytes are still in the transmit buffer",
        ],
        answer: 3,
        why: "write() copies bytes into a buffer and returns at once. flush() waits for the last stop bit to leave; only then is it safe to release the line.",
      },
    ],
  },

  "i7-i2c-bus": {
    id: "i7-i2c-bus",
    outcomes: [
      "Draw an I2C write and read transaction with start, address, ACK and stop",
      "Size I2C pull-up resistors from supply voltage, sink current, bus capacitance and the rise-time limit",
      "Explain clock stretching and repeated start, and recognise when a device uses them",
      "Scan a bus and diagnose a missing or address-clashing device",
    ],
    blocks: [
      { t: "h", text: "Why I2C is everywhere" },
      { t: "p", text: "Pressure sensors, IMUs, OLED displays, real-time clocks, port expanders and EEPROMs nearly all speak I2C (Inter-Integrated Circuit, from Philips, now NXP). The attraction is wiring: two signal wires, **SDA** (data) and **SCL** (clock), shared by up to dozens of devices, each picked out by an address. The cost is that the bus is open-drain and slow, and most I2C problems are electrical rather than software. Understanding the bus at the level of bits is what lets you fix a sensor that \"is not detected\"." },
      { t: "p", text: "On the Uno, SDA is A4 and SCL is A5 (also brought out near AREF). On the ESP32 DevKit, the Arduino core defaults are SDA = GPIO 21 and SCL = GPIO 22, and any other pair can be chosen with `Wire.begin(sda, scl)`." },

      { t: "h", text: "Open drain: nobody drives high" },
      { t: "p", text: "Every device on the bus can only pull a line **low** (it switches a transistor to ground) or let go of it. A **pull-up resistor** to the supply brings the line high when everyone has let go. This is called open drain (or wired-AND): the line is high only if every device leaves it alone, and any one device can hold it low. Two important consequences follow. No two devices can ever fight with one driving high and one low, so the bus cannot short out. And the rising edge is slow, because it is just a resistor charging the wire's capacitance." },
      { t: "diagram", text: String.raw`   VDD (3.3 V)
    │        │
   [Rp]     [Rp]
    │        │
 ───●─SDA────┼──────────●──────────●───
 ───┼────────●─SCL──────┼────●─────┼────●──
    │        │          │    │     │    │
  ┌─┴────────┴─┐      ┌─┴────┴─┐ ┌─┴────┴─┐
  │ controller │      │ sensor │ │  OLED  │
  │ (ESP32)    │      │  0x76  │ │  0x3C  │
  └────────────┘      └────────┘ └────────┘`, caption: "One pull-up per line, shared by all devices." },

      { t: "h", text: "The frame" },
      { t: "p", text: "Data on SDA may only change while SCL is low, and is read while SCL is high. Two special conditions break that rule on purpose, so every device can recognise them: a **START** is SDA falling while SCL is high, and a **STOP** is SDA rising while SCL is high. Between them, everything travels in 9-clock chunks: 8 data bits, **most significant bit first**, then one acknowledge bit, during which the *receiver* pulls SDA low (**ACK**) or leaves it high (**NACK**)." },
      { t: "diagram", text: String.raw`Write 0xA0 to register 0xF4 of a device at address 0x76:

 S | 1110110 | 0 | A | 11110100 | A | 10100000 | A | P
   | addr    |W=0|   | reg 0xF4 |   | data 0xA0|   |
   |<-- controller sends, device ACKs each byte -->|

SCL ‾‾‾‾\_/‾\_/‾\_/‾\_/‾\_/‾\_/‾\_/‾\_/‾\_/‾\_ ... _/‾‾‾‾
SDA ‾‾\___X___X___X___X___X___X___X___X___/  ...  __/‾‾
      START b7  b6 ...                b0 ACK          STOP
      (SDA falls while SCL high)  (SDA rises while SCL high)

Read 2 bytes starting at register 0xFA:

 S | 1110110 0 | A | 11111010 | A | Sr | 1110110 1 | A | D1 | A | D2 | N | P
                                  repeated start, R=1   ctrl ACKs  ctrl NACKs last`, caption: "S = start, Sr = repeated start, A = ACK, N = NACK, P = stop." },
      { t: "p", text: "The first byte is always the 7-bit address followed by the **R/W bit** (0 = write, 1 = read). So device 0x76 is addressed with the byte 0xEC for writing and 0xED for reading. Datasheets disagree about whether to quote the 7-bit address (0x76) or the 8-bit byte (0xEC); the Arduino `Wire` library wants the 7-bit form." },
      { t: "p", text: "Reading a register is a two-part transaction: write the register number, then a **repeated start** (a START without a STOP before it, so no other controller can grab the bus in between), then the address with R = 1. The device now sends bytes, the controller ACKs each one it wants more after, and NACKs the last to say \"stop sending\", then issues STOP." },
      { t: "p", text: "If a device does not ACK its address, it is absent, at a different address, unpowered, or the bus is electrically broken. In the Wire library, `Wire.endTransmission()` returns 0 for success, 2 for a NACK on the address and 3 for a NACK on data. That return value is the basis of an **I2C scanner**:" },
      { t: "snippet", lang: "cpp", code: String.raw`// I2C scanner. Uno: SDA = A4, SCL = A5. ESP32 DevKit: SDA = GPIO21, SCL = GPIO22.
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setClock(100000);          // standard mode while debugging
}

void loop() {
  int found = 0;
  for (uint8_t addr = 0x08; addr <= 0x77; addr++) {   // 0x00-0x07, 0x78-0x7F are reserved
    Wire.beginTransmission(addr);
    uint8_t err = Wire.endTransmission();               // address only, no data
    if (err == 0) {
      Serial.print("Device at 0x");
      if (addr < 16) Serial.print('0');
      Serial.println(addr, HEX);
      found++;
    } else if (err == 4) {
      Serial.println("Bus error: check pull-ups and wiring");
    }
  }
  Serial.print(found);
  Serial.println(" device(s) found\n");
  delay(3000);
}`, caption: "Compiles for both arduino:avr:uno and esp32:esp32:esp32." },

      { t: "h", text: "Speed modes" },
      { t: "table", head: ["Mode", "Max SCL", "Max rise time tr", "Max bus capacitance", "Max sink current (VOL = 0.4 V)"], rows: [
        ["Standard-mode", "100 kHz", "1000 ns", "400 pF", "3 mA"],
        ["Fast-mode", "400 kHz", "300 ns", "400 pF", "3 mA"],
        ["Fast-mode Plus", "1 MHz", "120 ns", "550 pF", "20 mA"],
      ], caption: "From the NXP I2C-bus specification (UM10204). Rise time is measured from 30% to 70% of VDD." },

      { t: "h", text: "Sizing the pull-up resistors" },
      { t: "p", text: "The pull-up has two jobs that pull in opposite directions. It must be **small enough** that the line rises quickly through the bus capacitance (every device pin, plus the wires, adds a few picofarads). It must be **large enough** that a device sinking current to pull the line low can get it below the low threshold. That gives a window." },
      { t: "formula", text: String.raw`Minimum (sink current limit):   Rp(min) = (VDD - VOL(max)) / IOL
Maximum (rise time limit):      Rp(max) = tr / (0.8473 × Cb)`, caption: "VOL(max) = 0.4 V, IOL = 3 mA for standard and fast mode; Cb is total bus capacitance." },
      { t: "p", text: "Worked example: an ESP32 at 3.3 V, with an IMU, a pressure sensor, an OLED and 30 cm of jumper wire. Estimate Cb at about 10 pF per device pin plus about 10 pF for the controller and roughly 50 pF per 30 cm of loose wiring: 4 × 10 + 50 ≈ 90 pF. Call it 100 pF to be safe." },
      { t: "formula", text: String.raw`Rp(min) = (3.3 - 0.4) / 0.003         = 967 Ω

Standard-mode (tr = 1000 ns):
Rp(max) = 1000e-9 / (0.8473 × 100e-12) = 11.8 kΩ

Fast-mode (tr = 300 ns):
Rp(max) = 300e-9 / (0.8473 × 100e-12)  = 3.54 kΩ

Choose 2.2 kΩ for 400 kHz:
tr = 0.8473 × 2200 × 100e-12 = 186 ns   (≤ 300 ns, OK)
IOL needed = (3.3 - 0.4) / 2200 = 1.3 mA  (≤ 3 mA, OK)`, caption: "Anything from about 1 kΩ to 3.5 kΩ works at 400 kHz on this bus." },
      { t: "p", text: "Check both limits with the chosen value, as above. Then repeat for the worst case you can imagine: if someone adds a 1 m cable (another 150 pF or so), Cb becomes about 250 pF and the fast-mode maximum falls to 300e-9 / (0.8473 × 250e-12) ≈ 1.4 kΩ. The 2.2 kΩ resistors would then give a 466 ns rise, too slow for 400 kHz; drop to 100 kHz or use 1.2 kΩ." },
      { t: "widget", id: "i2c-pullup" },
      { t: "note", kind: "warn", text: "Breakout boards usually carry their own pull-ups, often 4.7 kΩ or 10 kΩ. Three boards with 4.7 kΩ each in parallel give about 1.57 kΩ, still above the 967 Ω minimum at 3.3 V. Five boards would give 940 Ω and break the minimum. Count them, and remove extras by desoldering or cutting the pull-up jumper." },
      { t: "p", text: "The internal pull-ups of the Uno (20 to 50 kΩ) and ESP32 (about 45 kΩ) are far too weak for anything but very short wires at 100 kHz. Always fit external ones. Pull up to the voltage of the lowest-voltage device: on a mixed 5 V and 3.3 V bus, pull up to 3.3 V only if the 5 V device reads 3.3 V as high (the Uno's ATmega328P needs 0.7 × 5 = 3.5 V for a guaranteed high on its I2C pins), otherwise use a level shifter such as the BSS138 two-MOSFET circuit found on cheap shifter boards." },

      { t: "h", text: "Clock stretching" },
      { t: "p", text: "The controller drives SCL, but because SCL is open drain too, a slow peripheral can **hold SCL low** after the controller releases it. The controller must wait until SCL actually goes high before continuing. This is clock stretching: the device's way of saying \"wait, I am still working\", for example while a sensor finishes a conversion or a microcontroller acting as a peripheral fetches a byte. The Uno's TWI hardware and the ESP32's I2C controller both support it, but the ESP32 has a timeout; for slow devices increase it with `Wire.setTimeOut(ms)`. Some cheap controllers and bit-banged libraries ignore stretching and read garbage." },

      { t: "deep", title: "Where 0.8473 RC comes from", blocks: [
        { t: "p", text: "When every device releases the line, it charges through Rp towards VDD as a first-order RC circuit: V(t) = VDD (1 - e^(-t/RC)). The specification measures rise time between the 30% and 70% points, which are the input thresholds VIL and VIH for CMOS-level I2C devices." },
        { t: "formula", text: String.raw`V(t1) = 0.3 VDD  →  e^(-t1/RC) = 0.7  →  t1 = -RC ln 0.7 = 0.3567 RC
V(t2) = 0.7 VDD  →  e^(-t2/RC) = 0.3  →  t2 = -RC ln 0.3 = 1.2040 RC
tr = t2 - t1 = RC × ln(0.7 / 0.3) = 0.8473 RC`, caption: "Solving for R with tr fixed gives Rp(max) = tr / (0.8473 Cb)." },
        { t: "p", text: "Notice the answer does not depend on VDD: the same rise time limit applies at 3.3 V and 5 V. Only the minimum resistor (from the sink current) changes with supply voltage. At 5 V, Rp(min) = (5 - 0.4) / 3 mA ≈ 1.53 kΩ." },
        { t: "p", text: "Measuring Cb directly is hard, but you can work backwards: put a scope on SCL, measure the 30% to 70% rise time, and divide by 0.8473 Rp. If a 4.7 kΩ pull-up gives a 600 ns rise, Cb ≈ 600e-9 / (0.8473 × 4700) ≈ 151 pF." },
        { t: "p", text: "For long or heavily loaded buses, professionals use an active pull-up (a current source that charges the line at constant current, giving a linear ramp) or a bus buffer such as the PCA9515 or P82B715, which splits the capacitance into segments." },
      ] },
      { t: "deep", title: "Arbitration, bus recovery and 10-bit addresses", blocks: [
        { t: "p", text: "Two controllers may start at once. Because the bus is wired-AND, each controller reads SDA back as it sends. A controller that sends a 1 but reads a 0 knows someone else is sending a 0, and it backs off silently. The winner never notices. This is the same idea as CAN arbitration in a later lesson." },
        { t: "p", text: "A common lock-up: the controller resets in the middle of a read while a peripheral is sending a 0 bit. The peripheral keeps SDA low, waiting for clocks that never come, and every new START fails. The fix in the specification is to toggle SCL up to nine times, as a GPIO, until the peripheral releases SDA, then send a STOP. Put this in your startup code if a board ever needs a power cycle to make a sensor reappear." },
        { t: "snippet", lang: "cpp", code: String.raw`// Bus recovery before Wire.begin(). Works on Uno or ESP32 (pass the pins).
void i2cRecover(int sda, int scl) {
  pinMode(sda, INPUT_PULLUP);
  pinMode(scl, OUTPUT);
  for (int i = 0; i < 9 && digitalRead(sda) == LOW; i++) {
    digitalWrite(scl, LOW);  delayMicroseconds(5);
    digitalWrite(scl, HIGH); delayMicroseconds(5);
  }
  // Generate a STOP: SDA low then high while SCL is high.
  digitalWrite(scl, HIGH); delayMicroseconds(5);   // in case the loop did not run
  pinMode(sda, OUTPUT);
  digitalWrite(sda, LOW);  delayMicroseconds(5);
  digitalWrite(sda, HIGH); delayMicroseconds(5);
  pinMode(sda, INPUT);
  pinMode(scl, INPUT);
}`, caption: "Call before Wire.begin()." },
        { t: "p", text: "Addresses 0x00 to 0x07 and 0x78 to 0x7F are reserved: 0x00 is the general call, and the pattern 11110xx starts a **10-bit address**, split across two bytes. Ten-bit devices are rare. Address clashes between two identical sensors are common; solutions are a strap pin that changes the address (the BMP280's SDO pin selects 0x76 or 0x77), a second I2C controller (the ESP32 has two), or an I2C multiplexer such as the TCA9548A." },
      ] },
    ],
    mistakes: [
      "**Using the 8-bit address with Wire.** If the datasheet says 0xEC/0xED, the 7-bit address for Wire is 0x76.",
      "**No pull-ups, or relying on internal ones.** The bus may work on the bench with 5 cm wires and fail with 30 cm.",
      "**Too many breakout boards with their own pull-ups.** The parallel resistance falls below the minimum and the devices cannot pull the line low enough.",
      "**Running 400 kHz over a long cable.** Rise time grows with capacitance; measure it or slow the clock.",
      "**Pulling a 3.3 V ESP32 bus up to 5 V.** That puts 5 V on ESP32 pins. Pull up to 3.3 V and level shift any 5 V-only device.",
    ],
    practice: {
      kind: "bench",
      task: "Measure the effect of pull-up size on a real I2C bus.",
      steps: [
        "Connect one I2C sensor breakout to the ESP32 DevKit (GPIO 21 and 22) and run the scanner. Note its address.",
        "Check whether the breakout has pull-ups: measure resistance from SDA to VCC with the board unpowered.",
        "If you have a scope or logic analyser, capture SCL at 100 kHz and 400 kHz. With a scope, measure the 30% to 70% rise time.",
        "Add a second 4.7 kΩ pull-up in parallel, then try a 10 kΩ only setup (remove board pull-ups if you can). Record rise times and whether the scanner still finds the device at 400 kHz.",
        "Estimate the bus capacitance from your measured rise time using Cb = tr / (0.8473 Rp) and compare with the lesson's rough estimate.",
      ],
    },
    quiz: [
      {
        q: "On an I2C bus, which event marks a START condition?",
        options: [
          "SCL falls while SDA is high",
          "SDA falls while SCL is high",
          "SDA rises while SCL is high",
          "Both lines go low together for one bit time",
        ],
        answer: 1,
        why: "Normally SDA only changes while SCL is low. SDA falling while SCL is high is reserved for START; rising while SCL is high is STOP.",
      },
      {
        q: "A 3.3 V fast-mode bus has 200 pF of capacitance. What is the largest pull-up that meets the 300 ns rise-time limit?",
        options: ["About 1.77 kΩ", "About 5.9 kΩ", "About 967 Ω", "About 10 kΩ"],
        answer: 0,
        why: "Rp(max) = 300e-9 / (0.8473 × 200e-12) ≈ 1770 Ω.",
      },
      {
        q: "Why can't you simply use a 220 Ω pull-up on a 3.3 V I2C bus to get very fast edges?",
        options: [
          "It would make the bus too slow",
          "It would change the device addresses",
          "A device would need to sink (3.3 - 0.4) / 220 ≈ 13 mA to pull the line low, far above the 3 mA it is specified for",
          "Pull-ups must always be 4.7 kΩ",
        ],
        answer: 2,
        why: "The minimum pull-up is set by the sink current limit: (VDD - VOL) / IOL = 967 Ω at 3.3 V and 3 mA.",
      },
      {
        q: "During a read, after receiving the last byte it wants, what does the controller do?",
        options: [
          "Sends ACK and then STOP",
          "Holds SCL low",
          "Sends a repeated start",
          "Sends NACK and then STOP",
        ],
        answer: 3,
        why: "A NACK tells the device to stop sending, so SDA is free for the controller to generate STOP.",
      },
      {
        q: "A slow sensor holds SCL low after the controller releases it. What is happening?",
        options: [
          "Clock stretching: the device needs more time before the transfer continues",
          "The bus has failed and needs a reset",
          "The sensor is claiming bus arbitration",
          "The pull-up is too strong",
        ],
        answer: 0,
        why: "Because SCL is open drain, a peripheral can hold it low. The controller must wait until SCL actually rises.",
      },
    ],
  },

  "i7-spi-and-one-wire": {
    id: "i7-spi-and-one-wire",
    outcomes: [
      "Explain the four SPI modes from a timing diagram and pick the right one from a datasheet",
      "Wire several SPI devices with separate chip selects or as a daisy chain",
      "Estimate the maximum safe SPI clock from wiring and device limits",
      "Describe the 1-Wire reset, presence and time-slot scheme and read a DS18B20",
    ],
    blocks: [
      { t: "h", text: "When I2C is too slow" },
      { t: "p", text: "I2C tops out at a few hundred kilohertz because of its pull-ups. SPI (Serial Peripheral Interface, from Motorola) has push-pull outputs and a separate wire for each direction, so it runs at tens of megahertz. That is why SD cards, TFT displays, fast ADCs, flash memory, radio chips such as the SX1276 LoRa transceiver and the MCP2515 CAN controller all use SPI. The price is more wires and no addressing: each device needs its own chip select line." },
      { t: "h", text: "The four wires" },
      { t: "list", items: [
        "**SCLK** (or SCK): clock, always driven by the controller.",
        "**MOSI** (controller out, peripheral in; newer documents say COPI or SDO on the controller side).",
        "**MISO** (controller in, peripheral out; also CIPO or SDI).",
        "**CS** (chip select, also SS or nCS): active low, one per peripheral. A peripheral ignores the clock and leaves MISO floating (high impedance) unless its CS is low.",
      ] },
      { t: "p", text: "On the Uno the hardware SPI pins are D13 (SCK), D11 (MOSI), D12 (MISO), and D10 is conventionally CS (D10 must be an output for the Uno to stay in controller mode). On the ESP32 DevKit, the Arduino core's default `SPI` object uses the VSPI pins: GPIO 18 (SCK), GPIO 23 (MOSI), GPIO 19 (MISO) and GPIO 5 (CS)." },
      { t: "p", text: "SPI is a **shift register exchange**. Every clock pulse moves one bit out of the controller on MOSI and one bit in from the peripheral on MISO, at the same time. Sending a byte always receives a byte. To read, you send dummy bytes (usually 0x00 or 0xFF) to clock the peripheral's data out." },

      { t: "h", text: "Clock polarity and phase: the four modes" },
      { t: "p", text: "Devices disagree about when data is valid. Two settings describe it. **CPOL** is the idle level of the clock (0 = idles low, 1 = idles high). **CPHA** says on which edge data is sampled: CPHA = 0 samples on the first (leading) edge after CS goes low, so the first bit must already be on the line when CS falls; CPHA = 1 samples on the second (trailing) edge, and data changes on the leading one." },
      { t: "diagram", text: String.raw`CS    ‾‾‾\_________________________________/‾‾‾

Mode 0 (CPOL 0, CPHA 0): idle low, sample on rising edge
SCLK  ______/‾‾\__/‾‾\__/‾‾\__/‾‾\__ ... _______
DATA  ----X=b7=====X=b6=====X=b5=====X ...
             ^ sample    ^         ^

Mode 1 (CPOL 0, CPHA 1): idle low, sample on falling edge
SCLK  ______/‾‾\__/‾‾\__/‾‾\__/‾‾\__ ... _______
DATA  --------X=b7===X=b6===X=b5==== ...
                 ^ sample  ^      ^

Mode 2 (CPOL 1, CPHA 0): idle high, sample on falling edge
SCLK  ‾‾‾‾‾‾\__/‾‾\__/‾‾\__/‾‾\__/‾‾ ... ‾‾‾‾‾‾‾
DATA  ----X=b7=====X=b6=====X=b5=====X ...
             ^ sample    ^         ^

Mode 3 (CPOL 1, CPHA 1): idle high, sample on rising edge
SCLK  ‾‾‾‾‾‾\__/‾‾\__/‾‾\__/‾‾\__/‾‾ ... ‾‾‾‾‾‾‾
DATA  --------X=b7===X=b6===X=b5==== ...
                 ^ sample  ^      ^`, caption: "X marks where data changes; ^ marks where it is sampled. Bits are usually MSB first." },
      { t: "table", head: ["Mode", "CPOL", "CPHA", "Clock idles", "Data sampled on"], rows: [
        ["0", "0", "0", "Low", "Rising edge"],
        ["1", "0", "1", "Low", "Falling edge"],
        ["2", "1", "0", "High", "Falling edge"],
        ["3", "1", "1", "High", "Rising edge"],
      ], caption: "Mode 0 and mode 3 are by far the most common; many devices accept both." },
      { t: "p", text: "Datasheets often do not say \"mode 1\". They show a timing diagram. Read it as above: look at the clock's level when CS falls (CPOL), then see whether the first bit is sampled on the first clock edge (CPHA 0) or the second (CPHA 1). The wrong mode typically gives data shifted by one bit, so values come back doubled or halved, or 0xFF everywhere." },
      { t: "p", text: "In Arduino code, each device's settings go in a `SPISettings` object passed to `beginTransaction`, so different devices on the same bus can use different speeds and modes:" },
      { t: "snippet", lang: "cpp", code: String.raw`// Read the ID register of a device in SPI mode 0 at 4 MHz.
// Uno: SCK D13, MISO D12, MOSI D11, CS D10.  ESP32 DevKit: SCK 18, MISO 19, MOSI 23, CS 5.
#include <SPI.h>

#if defined(ARDUINO_ARCH_ESP32)
const int CS_PIN = 5;
#else
const int CS_PIN = 10;
#endif

uint8_t readRegister(uint8_t reg) {
  SPI.beginTransaction(SPISettings(4000000, MSBFIRST, SPI_MODE0));
  digitalWrite(CS_PIN, LOW);
  SPI.transfer(reg | 0x80);        // many sensors: bit 7 = 1 means read
  uint8_t value = SPI.transfer(0x00);  // dummy byte clocks the answer out
  digitalWrite(CS_PIN, HIGH);
  SPI.endTransaction();
  return value;
}

void setup() {
  Serial.begin(115200);
  pinMode(CS_PIN, OUTPUT);
  digitalWrite(CS_PIN, HIGH);      // deselect before the bus starts
  SPI.begin();
}

void loop() {
  Serial.print("WHO_AM_I = 0x");
  Serial.println(readRegister(0x0F), HEX);
  delay(1000);
}`, caption: "beginTransaction / endTransaction keeps each device's settings separate." },

      { t: "h", text: "Several devices: separate selects or a daisy chain" },
      { t: "p", text: "The usual arrangement shares SCLK, MOSI and MISO and gives each device its own CS pin. Only the selected device drives MISO. This needs one GPIO per device, and every peripheral's MISO must really go high impedance when deselected; a few cheap SD card modules do not, and they corrupt the bus for everyone else." },
      { t: "p", text: "In a **daisy chain**, the controller's MOSI goes into the first device, its data output goes into the next device's input, and so on, with the last output returning to MISO. All share one CS. The chain behaves as one long shift register: to update three 8-bit devices you clock out 24 bits, the bits for the last device first, then raise CS to latch. 74HC595 shift registers and MAX7219 LED drivers are designed for this. Devices with a request-and-reply protocol (most sensors) cannot be chained." },
      { t: "diagram", text: String.raw`Separate chip selects             Daisy chain (one CS)
                                   MOSI ─► [dev 1] ─► [dev 2] ─► [dev 3] ─► MISO
 SCLK ──┬──────┬──────┐            SCLK ─────┴─────────┴─────────┘
 MOSI ──┼──┬───┼──┬───┼──┐         CS   ─────┴─────────┴─────────┘
 MISO ──┼──┼─┬─┼──┼─┬─┼──┼─┐
 CS1 ─[dev A]│ │  │ │ │  │ │       24 clocks move 3 bytes through;
 CS2 ────────[dev B]│ │  │ │       raising CS latches all three at once.
 CS3 ───────────────[dev C]`, caption: "Separate selects allow talking to one device at a time; a chain updates all at once." },

      { t: "h", text: "How fast can you go?" },
      { t: "p", text: "Three things limit the clock: the device's datasheet maximum, the controller's divider, and the wiring. The ATmega328P's maximum SPI clock is half its 16 MHz clock, 8 MHz. The ESP32's SPI controllers run to 80 MHz on the dedicated IO_MUX pins (the defaults above) and 40 MHz or so through the GPIO matrix. Breadboard wiring is the usual real limit." },
      { t: "p", text: "The subtle limit is reading. The controller samples MISO a fixed time after its own clock edge, but the peripheral's data has to travel there and back: clock out along the wire, the device's output delay, data back along the wire. If the round trip takes more than half a clock period, the controller samples the old bit. Example: 20 cm of jumper wire is about 1 ns each way on a board but behaves more like 2 ns with loading; a sensor's MISO output delay might be 40 ns. Round trip ≈ 44 ns, which must fit in half a period, so the clock must be below 1 / (2 × 44 ns) ≈ 11 MHz. Writes are less fragile than reads for this reason. Start at 1 MHz, prove it works, then increase." },

      { t: "h", text: "1-Wire: one data wire and ground" },
      { t: "p", text: "Dallas Semiconductor (now Analog Devices) designed 1-Wire to use a single open-drain data line with a pull-up, usually 4.7 kΩ, plus ground. Each device has a unique, factory-lasered 64-bit ROM code, so many devices can share one wire without address straps. The best-known device is the **DS18B20** digital thermometer: ±0.5 °C accuracy from -10 °C to +85 °C, and 9 to 12-bit resolution, with 12 bits giving 0.0625 °C steps." },
      { t: "p", text: "There is no clock. Everything is timed by the controller pulling the line low for specific durations:" },
      { t: "list", items: [
        "**Reset and presence**: the controller pulls low for at least 480 µs, then releases. Each device present waits 15 to 60 µs and pulls the line low for 60 to 240 µs, the presence pulse.",
        "**Write 1**: pull low for 1 to 15 µs, then release for the rest of a 60 µs slot.",
        "**Write 0**: pull low for the whole 60 to 120 µs slot.",
        "**Read**: pull low for at least 1 µs and release; the device either leaves the line high (1) or holds it low (0). The controller samples within 15 µs of the start of the slot.",
      ] },
      { t: "diagram", text: String.raw`Reset / presence:
      ‾‾‾‾\________________________/‾‾‾‾\_____________/‾‾‾‾‾‾
          |<- controller ≥480 µs ->|15-60|<- device ->|
                                    µs    60-240 µs

Write 1 slot (60 µs)          Write 0 slot (60 µs)
‾‾\_/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾       ‾‾\________________/‾‾
  1-15 µs low                    held low 60 µs`, caption: "1-Wire timing, standard speed." },
      { t: "p", text: "Because the timing is in microseconds, 1-Wire libraries disable interrupts briefly during each slot. A typical temperature read is: reset, **Skip ROM** (0xCC) to address every device, **Convert T** (0x44), wait for conversion (up to 750 ms at 12 bits), reset, select the device, **Read Scratchpad** (0xBE), read 9 bytes. The first two bytes are the temperature as a signed 16-bit number in units of 1/16 °C, and the ninth byte is a CRC-8 you should check." },
      { t: "formula", text: String.raw`raw bytes: LSB = 0x91, MSB = 0x01  →  raw = 0x0191 = 401
T = 401 / 16 = 25.0625 °C

raw bytes: LSB = 0x5E, MSB = 0xFF  →  raw = 0xFF5E = -162 (two's complement)
T = -162 / 16 = -10.125 °C`, caption: "DS18B20 scratchpad decoding. Both examples match the datasheet's temperature table." },
      { t: "p", text: "In practice you use the OneWire and DallasTemperature libraries, which do this for you. Know the trade-offs: a 750 ms conversion is slow, so request a conversion, do other work, and read later (`setWaitForConversion(false)`). Lower resolution is faster: 9 bits converts in 93.75 ms with 0.5 °C steps. Waterproof DS18B20 probes on long cables work well up to tens of metres with a stronger pull-up (for example 2.2 kΩ)." },
      { t: "note", kind: "tip", text: "\"Single-wire\" sensors such as the DHT11 and DHT22 are not 1-Wire. They use their own timing protocol, have no ROM code, and only one can sit on a pin. Do not try to put them on a 1-Wire bus." },

      { t: "deep", title: "Checking the DS18B20 CRC", blocks: [
        { t: "p", text: "The ninth scratchpad byte is a CRC-8 computed over the first eight with the polynomial x⁸ + x⁵ + x⁴ + 1 (Dallas/Maxim CRC, 0x31, processed least significant bit first so the reflected value 0x8C appears in code). The same CRC protects the 64-bit ROM code. A long cable with a marginal pull-up shows up first as CRC failures, long before it fails completely." },
        { t: "snippet", lang: "python", code: String.raw`def crc8_maxim(data: bytes) -> int:
    crc = 0
    for byte in data:
        for _ in range(8):
            mix = (crc ^ byte) & 0x01
            crc >>= 1
            if mix:
                crc ^= 0x8C
            byte >>= 1
    return crc

# Any message followed by its own CRC gives a CRC of zero.
msg = bytes([0x91, 0x01, 0x4B, 0x46, 0x7F, 0xFF, 0x0F, 0x10])
c = crc8_maxim(msg)
assert crc8_maxim(msg + bytes([c])) == 0
print(hex(c))`, caption: "Run on a PC to understand the algorithm; the OneWire library has OneWire::crc8()." },
        { t: "p", text: "The self-check at the end is a general property of CRCs: appending the CRC to the message and running the CRC again gives zero. Receivers often use this rather than comparing bytes." },
      ] },
      { t: "deep", title: "1-Wire search and parasite power", blocks: [
        { t: "p", text: "With several devices on one wire, the controller discovers their ROM codes with the **Search ROM** command (0xF0). For each of the 64 bits, every device sends its bit and then its complement. Because the line is wired-AND, the controller reads 01 (all devices have 0), 10 (all have 1), 00 (devices disagree) or 11 (no devices). At a disagreement it picks a branch by writing a bit, which silences the devices that do not match, and remembers to come back for the other branch. This is a binary tree walk that finds n devices in n passes." },
        { t: "p", text: "In **parasite power** mode, the DS18B20 runs with only data and ground: it charges an internal capacitor from the data line while it is high. During a temperature conversion it needs up to 1.5 mA, more than a 4.7 kΩ pull-up can supply, so the controller must drive the line hard high with a MOSFET (a \"strong pull-up\") for the whole conversion. It saves a wire but makes the system more fragile; with three wires available, use normal power." },
      ] },
    ],
    mistakes: [
      "**Wrong SPI mode.** Data comes back shifted by a bit; check CPOL and CPHA against the timing diagram, not the board's tutorial.",
      "**Forgetting to set CS as an output and high before SPI.begin().** A floating CS can select the device and garble the first transfer.",
      "**Sharing a bus with a module whose MISO never tri-states.** One cheap SD module can break every other device; test each device alone, then together.",
      "**Running SPI at the datasheet maximum over jumper wires.** Prove the link at 1 MHz first, then step up.",
      "**Blocking for 750 ms on every DS18B20 read.** Start the conversion, do other work, and read later.",
      "**Treating a DHT22 as a 1-Wire device.** It uses a different protocol and library.",
    ],
    practice: {
      kind: "bench",
      task: "Read a DS18B20 and an SPI device from the same ESP32 and capture both buses.",
      steps: [
        "Wire a DS18B20 to GPIO 4 of the ESP32 DevKit with a 4.7 kΩ pull-up to 3.3 V, and power it from 3.3 V and GND (not parasite mode).",
        "Install the OneWire and DallasTemperature libraries and print the temperature once a second using a non-blocking conversion request.",
        "Connect any SPI device you have (an SD card module, MAX7219 or SPI sensor) on GPIO 18, 19, 23 with CS on GPIO 5, and read a register or write a pattern.",
        "Deliberately set the wrong SPI mode and record what the received data looks like.",
        "If you have a logic analyser, capture one DS18B20 reset and presence pulse and measure the pulse widths against the lesson's timings.",
      ],
    },
    quiz: [
      {
        q: "A datasheet shows the clock idling high and data sampled on the rising edge. Which SPI mode is it?",
        options: ["Mode 0", "Mode 1", "Mode 2", "Mode 3"],
        answer: 3,
        why: "Idle high is CPOL 1. With the clock idling high, the first edge is falling, so sampling on the rising (second) edge is CPHA 1: mode 3.",
      },
      {
        q: "Why must you send a byte to read a byte over SPI?",
        options: [
          "Because SPI is half duplex",
          "Because the peripheral needs an address first",
          "Because data only moves when the controller clocks, and every clock shifts one bit each way at once",
          "Because MISO is shared with MOSI",
        ],
        answer: 2,
        why: "SPI is a shift-register exchange. The controller generates clocks by sending, and a dummy byte clocks the peripheral's data back.",
      },
      {
        q: "Three 74HC595 shift registers are daisy-chained. How many bits do you clock out before raising the latch, and which register's bits go first?",
        options: [
          "8 bits, for the first register",
          "24 bits, the last register's bits first",
          "24 bits, the first register's bits first",
          "3 bits, one per register",
        ],
        answer: 1,
        why: "The chain is one 24-bit shift register. Bits sent first travel furthest, so they end up in the last register.",
      },
      {
        q: "A DS18B20 returns scratchpad bytes LSB = 0x50, MSB = 0x05. What is the temperature?",
        options: ["85 °C", "80 °C", "5.5 °C", "1360 °C"],
        answer: 0,
        why: "0x0550 = 1360. 1360 / 16 = 85 °C. (85 °C is also the power-on reset value, so a reading of exactly 85 often means no conversion has run yet.)",
      },
      {
        q: "On a 1-Wire bus, how does the controller find out that at least one device is connected?",
        options: [
          "It reads the ROM code over SPI",
          "After a long reset pulse, any device holds the line low for a presence pulse",
          "The pull-up current increases",
          "Devices broadcast their addresses every second",
        ],
        answer: 1,
        why: "The reset pulse of at least 480 µs is followed by presence pulses of 60 to 240 µs from every device present.",
      },
    ],
  },

  "i7-can-bus": {
    id: "i7-can-bus",
    outcomes: [
      "Describe a CAN 2.0 data frame field by field and explain bit stuffing",
      "Work through bitwise arbitration and say which identifier wins",
      "Terminate and verify a CAN bus with a multimeter",
      "Send and receive frames with the ESP32's TWAI controller or an MCP2515",
    ],
    blocks: [
      { t: "h", text: "Why cars, robots and factories use CAN" },
      { t: "p", text: "A car has dozens of microcontrollers: engine, brakes, airbags, dashboard, doors. Bosch designed the Controller Area Network in the 1980s so that all of them could share one twisted pair, tolerate a harsh electrical environment, and guarantee that the most urgent message always gets through first. Today CAN also connects robot motor drivers, battery management systems, agricultural machines and industrial sensors (as CANopen). If you build anything with more than a couple of motor controllers, you will meet it." },
      { t: "p", text: "CAN has three properties that UART, I2C and SPI lack together: it is **multi-controller** (any node can start a message), messages carry an **identifier** describing their content rather than a destination address, and the hardware does **error detection, retransmission and fault confinement** for you." },

      { t: "h", text: "Dominant and recessive" },
      { t: "p", text: "The bus is a twisted pair, **CAN_H** and **CAN_L**. A **recessive** bit (logic 1) is the idle state: both wires sit near 2.5 V and the difference is about 0 V. A **dominant** bit (logic 0) is driven: CAN_H rises to about 3.5 V and CAN_L falls to about 1.5 V, a 2 V difference. If any node sends dominant, the bus is dominant, whatever the others send. This wired-AND behaviour, the same idea as I2C's open drain, is what makes arbitration work." },
      { t: "diagram", text: String.raw`        recessive   dominant   recessive
CAN_H   2.5 V ───┐  ┌─3.5 V─┐  ┌──── 2.5 V
                 └──┘       └──┘
CAN_L   2.5 V ───┐           ┌──── 2.5 V
                 └──1.5 V────┘
Vdiff      0 V       2 V        0 V
logic       1         0          1`, caption: "Classic CAN levels from a 5 V transceiver such as the TJA1050 or MCP2551." },

      { t: "h", text: "The data frame" },
      { t: "diagram", text: String.raw`Standard (11-bit identifier) CAN 2.0A data frame

 SOF | Identifier | RTR | IDE | r0 | DLC | Data     | CRC  | DEL | ACK | DEL | EOF | IFS
  1  |    11      |  1  |  1  |  1 |  4  | 0 to 64  |  15  |  1  |  1  |  1  |  7  |  3
     |<-- arbitration -->|<- control ->|            |                 |
     field
 SOF = start of frame (one dominant bit)    DLC = data length code (0 to 8 bytes)
 RTR = 0 for data, 1 for remote request     ACK = any receiver drives this dominant
 IDE = 0 for 11-bit, 1 for 29-bit ID        EOF = 7 recessive bits`, caption: "Field widths in bits. An extended (29-bit, CAN 2.0B) frame adds 18 identifier bits and two control bits." },
      { t: "p", text: "Count the bits of a standard frame with 8 data bytes: 1 + 11 + 1 + 1 + 1 + 4 + 64 + 15 + 1 + 1 + 1 + 7 = 108 bits, plus 3 bits of interframe space. At 500 kbit/s, each bit is 2 µs, so a full frame takes about 222 µs before stuffing (next section), carrying 8 bytes of payload. CAN is not about raw throughput; it is about guaranteed, prioritised, error-checked delivery of short messages." },
      { t: "p", text: "Note that there is no source or destination address. The **identifier** names the content (for example 0x0C0 = \"engine speed\") and also sets its priority. Every node hears every frame and uses **acceptance filters** in hardware to keep only the identifiers it cares about." },
      { t: "h", text: "Bit stuffing" },
      { t: "p", text: "There is no clock wire; receivers resynchronise on edges. A long run of identical bits would give no edges. So after **five identical bits in a row**, the transmitter inserts one bit of the opposite value, and every receiver removes it. Six identical bits in a row inside a frame is therefore always an error, and that fact is used to signal errors on purpose. Stuffing adds up to about 20% in the worst case, so a 108-bit frame can stretch to around 130 bits." },

      { t: "h", text: "Arbitration: the lowest identifier wins" },
      { t: "p", text: "When the bus goes idle, several nodes may start a frame at the same moment. Each sends its identifier bit by bit, **most significant bit first**, and reads the bus back. A node that sends recessive (1) but reads dominant (0) knows someone with a lower identifier is also sending. It stops transmitting immediately and becomes a receiver. The winner never sees a collision, and its frame goes out undamaged, so no bus time is wasted. The loser tries again when the bus is next idle." },
      { t: "diagram", text: String.raw`Three nodes start together. Identifiers in binary (11 bits):

             bit: 10 9 8 7 6 5 4 3 2 1 0
Node A  0x65A  =   1  1 0 0 1 0 1 1 0 1 0
Node B  0x659  =   1  1 0 0 1 0 1 1 0 0 1
Node C  0x6E0  =   1  1 0 1 1 1 0 0 0 0 0
Bus (AND)      =   1  1 0 0 1 0 1 1 0 0 1
                           ^ C sends 1, sees 0 at bit 7: drops out
                                           ^ A sends 1, sees 0 at bit 1: drops out
Winner: B (0x659), the lowest identifier.`, caption: "Bitwise arbitration. A dominant 0 overwrites a recessive 1." },
      { t: "p", text: "Check by comparing the numbers directly: 0x659 = 1625, 0x65A = 1626, 0x6E0 = 1760. The lowest, 1625, wins, as the bitwise walk shows. In system design this means you assign low identifiers to the most time-critical messages (brakes, emergency stop) and high ones to diagnostics." },

      { t: "h", text: "Errors and fault confinement" },
      { t: "p", text: "Every node checks every frame: the 15-bit CRC, the fixed-format fields, the stuffing rule, and whether the bit it sent is the bit it reads. A node that finds a problem sends an **error frame** (six dominant bits, which breaks the stuffing rule and so is seen by all), the frame is discarded everywhere, and the transmitter retries automatically. Each node keeps transmit and receive error counters. A node whose counters climb past 127 becomes **error passive** (it may no longer destroy others' frames), and past 255 it goes **bus off** and stops transmitting entirely. A faulty node therefore removes itself instead of jamming the whole bus." },

      { t: "h", text: "Wiring and termination" },
      { t: "p", text: "A CAN bus is a single line (not a star) with a **120 Ω resistor between CAN_H and CAN_L at each end**. The terminators absorb reflections and also pull the bus back to recessive quickly after a dominant bit. Stubs from the main line to each node should be short, around 30 cm or less at 1 Mbit/s. Bit rate and length trade off because every node must see each bit within the same bit time, including propagation there and back during arbitration:" },
      { t: "table", head: ["Bit rate", "Typical maximum bus length"], rows: [
        ["1 Mbit/s", "25 to 40 m"],
        ["500 kbit/s", "100 m"],
        ["250 kbit/s", "250 m"],
        ["125 kbit/s", "500 m"],
      ], caption: "Rule-of-thumb lengths for classic CAN; exact figures depend on transceivers and cable." },
      { t: "p", text: "To check termination, power the bus off and measure resistance between CAN_H and CAN_L with a multimeter. Two 120 Ω terminators in parallel read **60 Ω**. 120 Ω means one is missing; about 40 Ω means a third has been fitted by mistake (common when every module has a terminator jumper)." },

      { t: "h", text: "CAN on the ESP32 and the Uno" },
      { t: "p", text: "A CAN node needs two parts: a **controller** that handles frames, arbitration and errors, and a **transceiver** that converts its TX/RX logic signals to the differential bus. The ESP32 has a CAN 2.0 controller built in, which Espressif calls **TWAI** (Two-Wire Automotive Interface). It still needs an external transceiver; the **SN65HVD230** runs from 3.3 V and suits the ESP32 directly. The Uno has no CAN controller, so it uses an **MCP2515** controller over SPI, usually on a module that also has a TJA1050 transceiver and an 8 MHz crystal." },
      { t: "p", text: "The sketch below uses the ESP-IDF TWAI driver (`driver/twai.h`), which the Arduino-ESP32 core 3.3.x includes; this is the same API as the core's own TWAItransmit example. ESP-IDF 5.5 also offers a newer node-based TWAI API, but the classic one shown here remains supported. TX is GPIO 5 and RX is GPIO 4 on the ESP32 DevKit, wired to the SN65HVD230's D and R pins." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit + SN65HVD230, Arduino-ESP32 core 3.3.x (ESP-IDF 5.5 TWAI driver).
// GPIO5 -> transceiver D (TX), GPIO4 <- transceiver R (RX). 500 kbit/s.
#include <Arduino.h>
#include "driver/twai.h"

const gpio_num_t TX_PIN = GPIO_NUM_5;
const gpio_num_t RX_PIN = GPIO_NUM_4;

void setup() {
  Serial.begin(115200);
  twai_general_config_t g = TWAI_GENERAL_CONFIG_DEFAULT(TX_PIN, RX_PIN, TWAI_MODE_NORMAL);
  twai_timing_config_t t = TWAI_TIMING_CONFIG_500KBITS();
  twai_filter_config_t f = TWAI_FILTER_CONFIG_ACCEPT_ALL();
  if (twai_driver_install(&g, &t, &f) != ESP_OK || twai_start() != ESP_OK) {
    Serial.println("TWAI start failed");
    while (true) delay(1000);
  }
  Serial.println("TWAI running at 500 kbit/s");
}

void loop() {
  static uint32_t lastSend = 0;
  static uint16_t counter = 0;

  if (millis() - lastSend >= 100) {          // send ID 0x123 every 100 ms
    lastSend = millis();
    twai_message_t tx = {};
    tx.identifier = 0x123;
    tx.data_length_code = 2;
    tx.data[0] = counter >> 8;
    tx.data[1] = counter & 0xFF;
    counter++;
    if (twai_transmit(&tx, pdMS_TO_TICKS(10)) != ESP_OK) {
      Serial.println("TX queue full or bus problem");
    }
  }

  twai_message_t rx;
  while (twai_receive(&rx, 0) == ESP_OK) {   // drain without waiting
    Serial.printf("ID 0x%03lX len %d:", (unsigned long)rx.identifier, rx.data_length_code);
    for (int i = 0; i < rx.data_length_code; i++) Serial.printf(" %02X", rx.data[i]);
    Serial.println();
  }

  twai_status_info_t s;
  twai_get_status_info(&s);
  if (s.state == TWAI_STATE_BUS_OFF) {
    Serial.println("Bus off: check wiring and termination, recovering");
    twai_initiate_recovery();
  }
}`, caption: "A node alone on a bus gets no ACK and its error counter climbs: test with two nodes." },
      { t: "note", kind: "warn", text: "A CAN node transmitting with nobody else on the bus never gets its ACK bit, so it retries forever and its error counter rises. That is not a bug in your code. You need at least two powered nodes with correct termination to test CAN." },

      { t: "deep", title: "Bit timing: segments, sample point and the propagation limit", blocks: [
        { t: "p", text: "A CAN controller divides each bit into **time quanta** (tq) derived from its clock by a prescaler. A bit is made of a sync segment (always 1 tq, where the edge is expected), a propagation segment, and two phase segments. The sample point sits between phase segment 1 and phase segment 2, typically at 75% to 87.5% of the bit. The resynchronisation jump width (SJW) is how many tq the controller may stretch or shrink a bit to follow the transmitter's edges." },
        { t: "formula", text: String.raw`ESP32 TWAI, 80 MHz APB clock, 500 kbit/s (values used by TWAI_TIMING_CONFIG_500KBITS):
  prescaler (BRP) = 8   → tq = 8 / 80 MHz = 100 ns
  bit = 1 (sync) + 15 (TSEG1) + 4 (TSEG2) = 20 tq = 2000 ns  → 500 kbit/s
  sample point = (1 + 15) / 20 = 80 %`, caption: "Check: 20 tq × 100 ns = 2 µs, which is 1 / 500 000 s." },
        { t: "p", text: "Why bus length is limited: during arbitration, a node at one end must see a dominant bit from a node at the other end, and the far node must see the near node's reply, before the sample point. The signal travels at about 5 ns per metre in twisted pair, plus delays through two transceivers and controllers (often about 150 to 250 ns each way in total)." },
        { t: "formula", text: String.raw`Round trip must be < time to sample point
2 × (L × 5 ns/m + 200 ns) < 0.8 × 1000 ns     (1 Mbit/s, 80 % sample point)
L × 10 ns/m < 800 - 400 = 400 ns
L < 40 m`, caption: "This is where the 40 m at 1 Mbit/s rule of thumb comes from." },
        { t: "p", text: "CAN FD (flexible data rate) relaxes this by arbitrating at the slow rate and then switching to a faster rate, up to 5 or 8 Mbit/s, for the data phase, where only one node is transmitting. It also allows 64-byte payloads. The classic ESP32 TWAI controller does not support CAN FD." },
      ] },
      { t: "deep", title: "Using an MCP2515 from an Uno", blocks: [
        { t: "p", text: "The MCP2515 is a standalone CAN controller with an SPI interface (modes 0 and 3, up to 10 MHz), three transmit buffers, two receive buffers, and six acceptance filters with two masks. Its INT pin goes low when a frame arrives, so the Uno does not have to poll. Most hobby modules use an 8 MHz crystal, and libraries must be told this, or the bit rate will be wrong by a factor of two (a library that assumes 16 MHz configured for 500 kbit/s will actually run at 250 kbit/s)." },
        { t: "p", text: "Common libraries are autowp's arduino-mcp2515 and Cory Fowler's MCP_CAN_lib; both expose begin, setBitrate (with the crystal frequency), sendMessage and readMessage. The module's TJA1050 transceiver is a 5 V part. It works with the Uno directly; with an ESP32, use the built-in TWAI controller and a 3.3 V transceiver instead of mixing levels." },
        { t: "p", text: "Filters are worth understanding. A mask says which identifier bits matter, and a filter says what they must equal. Mask 0x7F0 with filter 0x120 accepts identifiers 0x120 to 0x12F and nothing else, and the rejection happens in hardware without waking the Uno." },
      ] },
    ],
    mistakes: [
      "**Testing a single node.** Without a second node to ACK, every frame fails; test with two.",
      "**Missing or extra terminators.** Measure 60 Ω between CAN_H and CAN_L with power off.",
      "**Connecting the ESP32 TX/RX pins to the bus directly.** The TWAI controller needs a transceiver; the bus is differential.",
      "**Wrong crystal setting for MCP2515 modules.** An 8 MHz crystal configured as 16 MHz halves the bit rate.",
      "**Wiring a star with long branches.** CAN is a line with short stubs.",
      "**Giving routine messages low identifiers.** Low identifiers win arbitration; reserve them for urgent messages.",
    ],
    practice: {
      kind: "bench",
      task: "Build a two-node CAN bus and watch arbitration and error handling.",
      steps: [
        "Wire two ESP32 DevKits, each with an SN65HVD230 module (GPIO 5 to D, GPIO 4 to R, 3.3 V, GND), joined CAN_H to CAN_H and CAN_L to CAN_L with a twisted pair.",
        "Power off and measure CAN_H to CAN_L resistance. Fit or remove terminators until you read about 60 Ω.",
        "Upload the lesson sketch to both, changing the identifier on one to 0x124. Confirm each prints the other's frames.",
        "Unplug one node and watch the other's status: print `s.tx_error_counter` and see it climb, then reconnect.",
        "Make both nodes send at the same moment (trigger from a shared button on GPIO 0) with identifiers 0x123 and 0x124, and confirm with a logic analyser that 0x123 always goes first.",
      ],
    },
    quiz: [
      {
        q: "Two nodes start transmitting at once with identifiers 0x100 and 0x0FF. Which frame is sent first, and what happens to the other?",
        options: [
          "0x100; 0x0FF is corrupted and both retry",
          "0x0FF wins; the 0x100 node backs off without damaging the frame and retries when the bus is idle",
          "Both are destroyed and an error frame follows",
          "Whichever node is closer to the terminator wins",
        ],
        answer: 1,
        why: "The lower identifier has a dominant 0 where the other has a recessive 1. The loser sees the mismatch and stops; the winner's frame is unharmed.",
      },
      {
        q: "With the bus unpowered, you measure 120 Ω between CAN_H and CAN_L. What does that suggest?",
        options: [
          "The bus is correctly terminated",
          "There are three terminators",
          "Only one terminator is fitted",
          "The transceiver is faulty",
        ],
        answer: 2,
        why: "Two 120 Ω terminators in parallel give 60 Ω. Reading 120 Ω means one end is unterminated.",
      },
      {
        q: "Why does a CAN transmitter insert an opposite bit after five identical bits?",
        options: [
          "To mark the end of the identifier",
          "To guarantee edges so receivers stay synchronised, since there is no clock wire",
          "To carry the parity of the previous bits",
          "To give other nodes a chance to transmit",
        ],
        answer: 1,
        why: "Bit stuffing guarantees an edge at least every six bits for resynchronisation, and makes six identical bits a recognisable error signal.",
      },
      {
        q: "A standard CAN frame with 8 data bytes is about 108 bits before stuffing. Roughly how long does it take at 250 kbit/s?",
        options: ["About 43 µs", "About 108 µs", "About 864 µs", "About 432 µs"],
        answer: 3,
        why: "Each bit is 4 µs at 250 kbit/s. 108 × 4 µs = 432 µs (more with stuffing and interframe space).",
      },
      {
        q: "What does the ESP32 need, besides its built-in TWAI controller, to join a CAN bus?",
        options: [
          "An MCP2515",
          "A transceiver such as the SN65HVD230 to drive and read the differential bus",
          "Nothing: GPIO pins can drive CAN_H and CAN_L",
          "An RS-485 transceiver",
        ],
        answer: 1,
        why: "The controller produces logic-level TX and RX. A CAN transceiver converts these to dominant and recessive bus levels.",
      },
      {
        q: "A node's transmit error counter passes 255. What does the CAN protocol make it do?",
        options: [
          "Go bus off and stop transmitting, so a faulty node cannot jam the bus",
          "Increase its bit rate",
          "Reset the other nodes",
          "Switch to 29-bit identifiers",
        ],
        answer: 0,
        why: "Fault confinement: above 127 a node becomes error passive, and above 255 it goes bus off until it recovers.",
      },
    ],
  },

  "i7-logic-analyser-and-drivers": {
    id: "i7-logic-analyser-and-drivers",
    outcomes: [
      "Capture and decode UART, I2C and SPI traffic with a low-cost logic analyser and PulseView",
      "Choose a sample rate and trigger to capture a bus problem",
      "Read a sensor register map and write a small driver: identify, configure, read, convert",
      "Verify a driver against the datasheet's worked example and a bus capture",
    ],
    blocks: [
      { t: "h", text: "Seeing the bus instead of guessing" },
      { t: "p", text: "Most protocol bugs are invisible from code. The sketch prints 0 or 255, and you cannot tell whether the device NACKed, the mode was wrong, the address was wrong or the register was wrong. A **logic analyser** records several digital lines at once and draws them as a timing diagram, and its software decodes the bits into bytes, addresses and ACKs. Ten minutes with one replaces hours of changing code at random. This lesson shows how to use one, then uses it to verify a driver you write from a datasheet, which is the module's exit project." },

      { t: "h", text: "The cheap 24 MHz analyser" },
      { t: "p", text: "The most common student analyser is a small board, sold for a few hundred rupees, built around the Cypress (now Infineon) **CY7C68013A FX2** USB chip. It has 8 inputs and samples up to 24 MS/s (million samples per second). It is a clone of the old Saleae Logic, and the free, open-source **sigrok** project supports it with its own firmware, **fx2lafw**, which its GUI, **PulseView**, loads automatically. Install PulseView from sigrok.org (on Windows it includes the driver installer Zadig, which you use once to bind the WinUSB driver to the device)." },
      { t: "list", items: [
        "**Inputs are 0 V to 5 V tolerant digital inputs**, with a threshold around 1.4 V, so 3.3 V and 5 V logic both read correctly. They are not protected against higher voltages: never connect them to RS-232, RS-485 A/B, CAN_H/CAN_L or anything above 5 V. Probe the logic side of a transceiver instead.",
        "**Always connect the analyser's GND to your circuit's GND.** Without it, captures are noise.",
        "**Sample rate**: sample at least 4 times, preferably 10 times, the fastest signal. 24 MS/s handles a 400 kHz I2C bus easily, a 115200 baud UART easily, and SPI up to about 4 MHz reliably. For faster SPI, slow the bus down for debugging.",
        "**Sample count**: at 24 MS/s, 1 second is 24 million samples per channel. USB bandwidth limits the cheap board, so if captures fail at 24 MHz with many channels, use fewer channels or 12 MHz.",
      ] },
      { t: "h", text: "A capture, step by step" },
      { t: "list", ordered: true, items: [
        "Connect GND, then D0 to SCL and D1 to SDA (or the SPI or UART lines).",
        "In PulseView choose the fx2lafw device, set the sample rate (4 MHz is plenty for 100 kHz I2C) and the number of samples (for example 1 M samples, 250 ms at 4 MHz).",
        "Set a **trigger** so the capture starts at the interesting moment: a falling edge on SDA catches an I2C START, a falling edge on CS catches an SPI transaction, a falling edge on RX catches a UART start bit.",
        "Run, then reset or exercise the board so the traffic happens.",
        "Add a **protocol decoder** (the yellow and green icon): I2C with SCL = D0, SDA = D1; SPI with clock, MOSI, MISO, CS and the mode; UART with the baud rate and frame format. Decoders can be stacked: an I2C decoder can feed a decoder for a specific chip.",
        "Read the annotations: Start, Address write 76, ACK, Data write F4, and so on. Compare every byte with what your code meant to send.",
      ] },
      { t: "table", head: ["What you see", "What it means"], rows: [
        ["Address byte followed by NACK", "Wrong address, device unpowered, or SDA/SCL swapped"],
        ["Slow, curved rising edges on I2C", "Pull-ups too weak for the bus capacitance"],
        ["SCL held low for a long time mid-byte", "Clock stretching (normal) or a stuck device (bus recovery needed)"],
        ["SPI data correct but shifted one bit", "Wrong CPHA (SPI mode)"],
        ["UART decoder shows framing errors", "Wrong baud rate or frame format; measure one bit width"],
        ["Nothing at all on a line", "Wrong pin in code, pin not initialised, or probe on the wrong wire"],
      ], caption: "A first triage table for bus captures." },
      { t: "p", text: "Measuring a UART bit width is a quick way to find an unknown baud rate: place cursors on the shortest pulse. 104 µs means 9600 baud; 8.7 µs means 115200." },

      { t: "h", text: "Reading a register map" },
      { t: "p", text: "Nearly every sensor presents itself as a small set of numbered **registers**, each one byte, that you read and write over I2C or SPI. The datasheet's register map is the contract. The worked device here is the Bosch **BMP280** pressure and temperature sensor, at I2C address 0x76 (SDO pin low) or 0x77 (SDO high). Its key registers:" },
      { t: "table", head: ["Address", "Name", "What it holds"], rows: [
        ["0xD0", "id", "Chip ID, always 0x58 for the BMP280 (0x60 means a BME280)"],
        ["0xE0", "reset", "Write 0xB6 to reset"],
        ["0xF3", "status", "Bit 3: measuring; bit 0: copying calibration"],
        ["0xF4", "ctrl_meas", "Bits 7..5 osrs_t, bits 4..2 osrs_p, bits 1..0 mode"],
        ["0xF5", "config", "Bits 7..5 standby time, bits 4..2 IIR filter"],
        ["0xF7 to 0xF9", "press_msb, lsb, xlsb", "20-bit raw pressure"],
        ["0xFA to 0xFC", "temp_msb, lsb, xlsb", "20-bit raw temperature"],
        ["0x88 to 0x9F", "calib00 to calib23", "Factory calibration: dig_T1 to T3, dig_P1 to P9"],
      ], caption: "From the BMP280 datasheet (Bosch Sensortec, BST-BMP280-DS001)." },
      { t: "p", text: "Building a register value from fields is bit arithmetic. For normal mode (11), pressure oversampling ×16 (101) and temperature oversampling ×2 (010):" },
      { t: "formula", text: String.raw`ctrl_meas = osrs_t << 5 | osrs_p << 2 | mode
          = 010 << 5   | 101 << 2   | 11
          = 0100 0000  | 0001 0100  | 0000 0011
          = 0101 0111  = 0x57`, caption: "Always check the bit fields against the datasheet's table." },
      { t: "p", text: "The raw readings are not in degrees or pascals. Each chip is calibrated at the factory, and the datasheet gives integer formulas that combine the raw values with the chip's own calibration constants. The calibration words are **little-endian** (low byte first) and some are signed, which is where most hand-written BMP280 drivers go wrong." },

      { t: "h", text: "Driver structure" },
      { t: "p", text: "A good small driver has the same shape whatever the device: low-level register read and write functions, an initialisation that checks the chip ID and loads calibration, configuration, and a read function that returns physical units. Keeping bus access in two functions means you can port the driver from I2C to SPI by changing only those two." },
      { t: "snippet", lang: "cpp", code: String.raw`// Minimal BMP280 driver over I2C with Wire, written from the Bosch datasheet.
// Uno: SDA A4, SCL A5 (use a module with a regulator and level shifting).
// ESP32 DevKit: SDA GPIO21, SCL GPIO22, power the sensor from 3.3 V.
#include <Wire.h>

const uint8_t BMP_ADDR = 0x76;     // 0x77 if SDO is tied high

uint16_t dig_T1, dig_P1;
int16_t  dig_T2, dig_T3, dig_P2, dig_P3, dig_P4, dig_P5, dig_P6, dig_P7, dig_P8, dig_P9;
int32_t  t_fine;

// Low level: the only two functions that know about the bus.
bool writeReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(BMP_ADDR);
  Wire.write(reg);
  Wire.write(val);
  return Wire.endTransmission() == 0;
}

bool readRegs(uint8_t reg, uint8_t *buf, uint8_t n) {
  Wire.beginTransmission(BMP_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;   // repeated start
  if (Wire.requestFrom(BMP_ADDR, n) != n) return false;
  for (uint8_t i = 0; i < n; i++) buf[i] = Wire.read();
  return true;
}

uint16_t u16le(const uint8_t *p) { return (uint16_t)p[0] | ((uint16_t)p[1] << 8); }

bool bmpBegin() {
  uint8_t id;
  if (!readRegs(0xD0, &id, 1) || id != 0x58) return false;
  uint8_t c[24];
  if (!readRegs(0x88, c, 24)) return false;
  dig_T1 = u16le(c + 0);           dig_T2 = (int16_t)u16le(c + 2);  dig_T3 = (int16_t)u16le(c + 4);
  dig_P1 = u16le(c + 6);           dig_P2 = (int16_t)u16le(c + 8);  dig_P3 = (int16_t)u16le(c + 10);
  dig_P4 = (int16_t)u16le(c + 12); dig_P5 = (int16_t)u16le(c + 14); dig_P6 = (int16_t)u16le(c + 16);
  dig_P7 = (int16_t)u16le(c + 18); dig_P8 = (int16_t)u16le(c + 20); dig_P9 = (int16_t)u16le(c + 22);
  // config: standby 62.5 ms (001), IIR filter x4 (010) -> 0010 1000 = 0x28
  // ctrl_meas: osrs_t x2, osrs_p x16, normal mode -> 0x57
  return writeReg(0xF5, 0x28) && writeReg(0xF4, 0x57);
}

// Datasheet compensation, 32-bit integer version: returns 0.01 degC.
int32_t compensateT(int32_t adc_T) {
  int32_t var1 = ((((adc_T >> 3) - ((int32_t)dig_T1 << 1))) * ((int32_t)dig_T2)) >> 11;
  int32_t var2 = (((((adc_T >> 4) - ((int32_t)dig_T1)) * ((adc_T >> 4) - ((int32_t)dig_T1))) >> 12) *
                  ((int32_t)dig_T3)) >> 14;
  t_fine = var1 + var2;
  return (t_fine * 5 + 128) >> 8;
}

// Datasheet compensation, 64-bit version: returns Pa in Q24.8 (divide by 256).
uint32_t compensateP(int32_t adc_P) {
  int64_t var1 = ((int64_t)t_fine) - 128000;
  int64_t var2 = var1 * var1 * (int64_t)dig_P6;
  var2 = var2 + ((var1 * (int64_t)dig_P5) << 17);
  var2 = var2 + (((int64_t)dig_P4) << 35);
  var1 = ((var1 * var1 * (int64_t)dig_P3) >> 8) + ((var1 * (int64_t)dig_P2) << 12);
  var1 = (((((int64_t)1) << 47) + var1)) * ((int64_t)dig_P1) >> 33;
  if (var1 == 0) return 0;                      // avoid division by zero
  int64_t p = 1048576 - adc_P;
  p = (((p << 31) - var2) * 3125) / var1;
  var1 = (((int64_t)dig_P9) * (p >> 13) * (p >> 13)) >> 25;
  var2 = (((int64_t)dig_P8) * p) >> 19;
  p = ((p + var1 + var2) >> 8) + (((int64_t)dig_P7) << 4);
  return (uint32_t)p;
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  if (!bmpBegin()) {
    Serial.println("BMP280 not found: check address, wiring and chip ID");
    while (true) delay(1000);
  }
}

void loop() {
  uint8_t d[6];
  if (readRegs(0xF7, d, 6)) {                   // burst read: pressure then temperature
    int32_t adc_P = ((int32_t)d[0] << 12) | ((int32_t)d[1] << 4) | (d[2] >> 4);
    int32_t adc_T = ((int32_t)d[3] << 12) | ((int32_t)d[4] << 4) | (d[5] >> 4);
    int32_t t = compensateT(adc_T);             // must run first: sets t_fine
    uint32_t p = compensateP(adc_P);
    Serial.print("T = ");   Serial.print(t / 100.0, 2);
    Serial.print(" C, P = "); Serial.print(p / 25600.0, 2);
    Serial.println(" hPa");
  }
  delay(1000);
}`, caption: "Compiles for arduino:avr:uno and esp32:esp32:esp32. Temperature must be compensated before pressure." },
      { t: "p", text: "Three details in this driver come straight from the datasheet and are easy to miss. The raw values are **20 bits**, assembled from MSB, LSB and the top four bits of XLSB. Pressure compensation uses **t_fine** from the temperature calculation, so temperature must be computed first. And all six data bytes are read in **one burst**, because the chip guarantees the burst comes from the same measurement; reading them in separate transactions can mix halves of two measurements." },
      { t: "h", text: "Verify the driver three ways" },
      { t: "list", ordered: true, items: [
        "**Against the datasheet's worked example.** Bosch gives sample calibration values and raw readings with the expected results. Feed them to your compensation functions on a PC (see the Go deeper section) and compare.",
        "**Against a bus capture.** Capture the startup with PulseView: you should see a write of 0xD0, a repeated start and a read returning 0x58; a 24-byte read from 0x88; writes of 0x28 to 0xF5 and 0x57 to 0xF4. Each one ACKed.",
        "**Against physics.** At room temperature in Bhopal (about 500 m above sea level), pressure should be roughly 950 to 960 hPa. Breathe on the sensor and the temperature should rise within seconds.",
      ] },

      { t: "deep", title: "Checking the compensation code against the datasheet example", blocks: [
        { t: "p", text: "The BMP280 datasheet's section on compensation gives an example chip: dig_T1 = 27504, dig_T2 = 26435, dig_T3 = -1000, dig_P1 = 36477, dig_P2 = -10685, dig_P3 = 3024, dig_P4 = 2855, dig_P5 = 140, dig_P6 = -7, dig_P7 = 15500, dig_P8 = -14600, dig_P9 = 6000, with raw readings adc_T = 519888 and adc_P = 415148. It states the results as 25.08 °C and about 100653 Pa. Porting the integer code to Python lets you check your C on a PC first." },
        { t: "snippet", lang: "python", code: String.raw`T1, T2, T3 = 27504, 26435, -1000
P = [36477, -10685, 3024, 2855, 140, -7, 15500, -14600, 6000]
adc_T, adc_P = 519888, 415148

var1 = (((adc_T >> 3) - (T1 << 1)) * T2) >> 11
var2 = (((((adc_T >> 4) - T1) * ((adc_T >> 4) - T1)) >> 12) * T3) >> 14
t_fine = var1 + var2
T = (t_fine * 5 + 128) >> 8
print("T =", T / 100, "C")             # 25.08

def cdiv(a, b):                        # C integer division truncates towards zero
    q = abs(a) // abs(b)
    return q if (a >= 0) == (b >= 0) else -q

v1 = t_fine - 128000
v2 = v1 * v1 * P[5]
v2 += (v1 * P[4]) << 17
v2 += P[3] << 35
v1 = ((v1 * v1 * P[2]) >> 8) + ((v1 * P[1]) << 12)
v1 = (((1 << 47) + v1) * P[0]) >> 33
p = 1048576 - adc_P
p = cdiv(((p << 31) - v2) * 3125, v1)
v1 = (P[8] * (p >> 13) * (p >> 13)) >> 25
v2 = (P[7] * p) >> 19
p = ((p + v1 + v2) >> 8) + (P[6] << 4)
print("P =", p / 256, "Pa")            # about 100653
assert T == 2508 and abs(p / 256 - 100653) < 1`, caption: "Output: T = 25.08 C, P = 100653.25 Pa (the datasheet's floating-point version gives 100653.27 Pa). The assert makes it a self-check." },
        { t: "p", text: "Two traps for porting: Python's `//` rounds towards minus infinity while C's `/` truncates towards zero (hence `cdiv`), and Python integers never overflow while C's do, which is why the datasheet uses 64-bit integers for pressure. On the Uno, `int64_t` arithmetic works but is slow (a few hundred microseconds per reading), which is fine at one reading a second. Bosch also gives a floating-point version." },
      ] },
      { t: "deep", title: "From a sketch to a reusable driver", blocks: [
        { t: "p", text: "Professional drivers, such as Bosch's own BMP2 Sensor API on GitHub, separate the chip logic from the bus completely. The driver holds a struct of function pointers for read, write and delay, supplied by the application. The same C file then runs on an AVR, an ESP32 or a Linux board with no change. In C++ the usual Arduino pattern is a class whose `begin()` takes a `TwoWire&` so it can use the ESP32's second I2C controller." },
        { t: "list", items: [
          "**Return errors, do not print them.** A driver that prints to Serial cannot be reused in a product with no serial port.",
          "**Never block forever.** Every wait for a status bit needs a timeout.",
          "**Keep units explicit** in names: `temp_centi_c`, `pressure_pa_q24_8`.",
          "**Check the chip ID before anything else**, so a wrong part (a BME280 sold as BMP280, ID 0x60) is caught at once.",
          "**Write a host test** for the conversion maths, as in the previous section, so you can change the code without a board on the desk.",
        ] },
        { t: "p", text: "The same steps apply to the MPU6050 IMU (address 0x68, WHO_AM_I register 0x75 returns 0x68, wake it by writing 0 to PWR_MGMT_1 at 0x6B, then burst read 14 bytes from 0x3B: accelerometer, temperature and gyro as big-endian signed 16-bit values). Note that the MPU6050 is big-endian where the BMP280's calibration is little-endian: always check per device." },
      ] },
    ],
    mistakes: [
      "**No common ground between analyser and circuit.** The capture is meaningless.",
      "**Sampling too slowly.** At 1 MHz sampling, a 400 kHz I2C bus has only two or three samples per bit and the decoder fails.",
      "**Probing RS-485, CAN or RS-232 lines directly.** The analyser's inputs are 0 to 5 V only; probe the logic-level side of the transceiver.",
      "**Reading calibration words as big-endian or unsigned.** The BMP280 stores them little-endian and most are signed.",
      "**Computing pressure before temperature.** Pressure needs t_fine from the temperature step.",
      "**Reading the data registers one at a time.** Burst read them so all values come from the same measurement.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: a BMP280 driver from the datasheet, verified with a logic analyser.",
      steps: [
        "Run the Python check in the Go deeper section and confirm it prints 25.08 °C and about 100653 Pa.",
        "Wire a BMP280 module to the ESP32 DevKit (GPIO 21, 22, 3.3 V, GND) and run the I2C scanner to confirm 0x76 or 0x77.",
        "Compile and upload the driver sketch. Confirm sensible readings.",
        "Connect a 24 MHz analyser (GND, D0 = SCL, D1 = SDA), trigger on SDA falling, capture a reset of the ESP32, and decode with the I2C decoder.",
        "In the capture, find the chip ID read, the calibration burst read, and the two configuration writes. Screenshot each and annotate the address, register and value bytes.",
        "Change ctrl_meas to forced mode (mode bits 01) and modify the driver to trigger one measurement and wait for the status bit to clear, with a timeout. Capture it and show the status polling on the bus.",
      ],
    },
    quiz: [
      {
        q: "You need to capture a 400 kHz I2C bus with a 24 MS/s analyser. Which sample rate is a sensible minimum?",
        options: ["500 kHz", "800 kHz", "4 MHz", "100 MHz"],
        answer: 2,
        why: "Aim for at least 4 and preferably 10 samples per bit. 4 MHz gives 10 samples per 400 kHz clock period.",
      },
      {
        q: "In PulseView an I2C capture shows the address byte for 0x76 followed by NACK. Which is the most likely cause?",
        options: [
          "The pull-ups are too strong",
          "The baud rate is wrong",
          "The device is not at 0x76 (wrong address strap), is unpowered, or SDA and SCL are swapped",
          "The register number is wrong",
        ],
        answer: 2,
        why: "A NACK on the address means no device recognised it. I2C has no baud rate, and the register comes after the address.",
      },
      {
        q: "For the BMP280, what value of ctrl_meas selects osrs_t = 001 (×1), osrs_p = 011 (×4) and normal mode (11)?",
        options: ["0x2F", "0x57", "0x27", "0x2D"],
        answer: 0,
        why: "001 << 5 = 0x20, 011 << 2 = 0x0C, mode 11 = 0x03. 0x20 + 0x0C + 0x03 = 0x2F.",
      },
      {
        q: "The two calibration bytes for dig_T2 at 0x8A and 0x8B are 0x43 and 0x67. What is dig_T2?",
        options: ["0x4367 = 17255", "0x6743 = 26435", "-26435", "0x43 + 0x67 = 170"],
        answer: 1,
        why: "The BMP280 stores calibration little-endian: the low byte first. 0x6743 = 26435, which is positive as a signed 16-bit value.",
      },
      {
        q: "Why does the driver read all six data registers in one burst?",
        options: [
          "It is faster to type",
          "I2C cannot read single registers",
          "So that pressure and temperature come from the same measurement, as the datasheet guarantees for a burst",
          "To avoid clock stretching",
        ],
        answer: 2,
        why: "The chip shadows the data registers during a burst read. Separate reads can mix bytes from two different measurements.",
      },
    ],
  },
};

export default lessons;
