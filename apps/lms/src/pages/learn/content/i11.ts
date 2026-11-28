import type { ModuleContent } from "../model/curriculum";

/**
 * Module i11: IoT data, time and updates.
 * Sketches: ESP32 DevKit, Arduino-ESP32 core 3.3.10 (ESP-IDF 5.5.4), with
 * RTClib 2.1, ArduinoJson 7.4 and the core's LittleFS, SD, HTTPClient, HTTPUpdate,
 * ArduinoOTA and NetworkClientSecure libraries. Compiled with arduino-cli.
 */
const lessons: ModuleContent = {
  "i11-time-rtc-and-ntp": {
    id: "i11-time-rtc-and-ntp",
    outcomes: [
      "Explain why every stored reading needs a timestamp in UTC, and how local time such as IST is derived from it",
      "Calculate clock drift from a ppm specification",
      "Set the ESP32's clock from NTP with configTzTime and keep time through power loss with a DS3231",
      "Describe how NTP estimates clock offset and network delay",
    ],
    blocks: [
      { t: "h", text: "A reading without a time is half a reading" },
      { t: "p", text: "A temperature of 31 °C means little until you know when it was taken. Once data is stored, merged from many devices, or sent late after a network outage, the timestamp is what lets you plot it, compare it and trust it. A microcontroller, however, has no idea what time it is when it starts. `millis()` counts from power-on, resets on every reboot, and drifts with the crystal. This lesson covers the two ways a device learns real time, a battery-backed real-time clock and network time, and how to combine them." },

      { t: "h", text: "Unix time, UTC and IST" },
      { t: "p", text: "Computers usually count time as **Unix time**: the number of seconds since 1970-01-01 00:00:00 UTC, ignoring leap seconds. It is a single integer with no time zone, no daylight saving and no formatting, which makes it ideal to store. For example, 12:00 IST on 27 November 2026 is 06:30 UTC, which is Unix time **1795761000**." },
      { t: "p", text: "**Rule: store and transmit UTC; convert to local time only for display.** India Standard Time is UTC + 5:30 all year (India has no daylight saving), so conversion is simple here, but data from devices in several countries, or a server configured for a different zone, becomes a mess if each device stores its own local time. A 32-bit signed Unix time overflows in January 2038; the ESP32's toolchain uses a 64-bit `time_t`, but if you pack timestamps into 32 bits yourself, use an unsigned type (good until 2106)." },
      { t: "p", text: "The C library converts using a **POSIX TZ string**. For India it is `IST-5:30`. The sign looks backwards: POSIX gives the offset you *add to local time to get UTC*, so a zone ahead of UTC has a negative number. Writing `IST+5:30` gives a clock eleven hours wrong." },

      { t: "h", text: "How clocks drift" },
      { t: "p", text: "Every clock counts the oscillations of a crystal or an RC circuit. Their frequency is never exactly the nominal value, and errors are quoted in **parts per million** (ppm). An error of 1 ppm is one microsecond per second." },
      { t: "formula", text: String.raw`drift per day = error(ppm) × 10⁻⁶ × 86 400 s

20 ppm watch crystal:   20e-6 × 86 400 = 1.73 s/day  ≈ 10.5 min/year
DS3231 (±2 ppm, 0 to 40 °C): 2e-6 × 86 400 = 0.17 s/day ≈ 63 s/year
ESP32 internal 150 kHz RC (±5 % before calibration):
                        0.05 × 86 400 = 4320 s/day = 72 min/day`, caption: "Check: 0.1728 × 365 = 63 s. A cheap RTC module with a DS1307 and a plain crystal is often 20 ppm or worse." },
      { t: "p", text: "That last line matters: when the ESP32 is in deep sleep and you have not fitted an external 32.768 kHz crystal, it keeps time with its internal RC oscillator. The core calibrates it against the main crystal, which helps a great deal, but expect seconds to minutes of error per day of sleep. A sleeping data logger that needs accurate timestamps either wakes to sync with NTP periodically, uses an external crystal, or reads a DS3231 on waking." },

      { t: "h", text: "The DS3231 real-time clock" },
      { t: "p", text: "The **DS3231** (Analog Devices, formerly Maxim) is an I2C real-time clock with a built-in, temperature-compensated crystal oscillator: it measures its own temperature every 64 seconds and trims the crystal, giving ±2 ppm from 0 °C to 40 °C. A coin cell (CR2032, or LIR2032 on modules with a charging circuit) keeps it counting when the main power is off, for years. It sits at I2C address **0x68**, stores time as BCD in registers 0x00 to 0x06, has two alarms, a square-wave output and a temperature sensor readable to 0.25 °C." },
      { t: "note", kind: "warn", text: "Many cheap DS3231 modules have a diode and resistor that charge the coin cell. With a non-rechargeable CR2032 this is unsafe: the cell can swell or leak. Either fit a rechargeable LIR2032 or remove the charging resistor (or diode), as many guides describe for the common ZS-042 module." },
      { t: "p", text: "BCD (binary-coded decimal) stores each decimal digit in four bits: 45 seconds is stored as 0x45, not 45 = 0x2D. Converting is (b >> 4) × 10 + (b & 0x0F). Libraries such as Adafruit's **RTClib** (version 2.1) hide this, and give you `DateTime` objects and `unixtime()`." },

      { t: "h", text: "Network time with NTP" },
      { t: "p", text: "The **Network Time Protocol** lets a device ask a server for the time over UDP port 123, and it corrects for the time the request spent travelling. Public servers are grouped in the NTP Pool; `in.pool.ntp.org` points to servers in India and `pool.ntp.org` to servers worldwide. Over a normal internet connection, a single NTP exchange gives the time to within a few to tens of milliseconds, far better than any RTC needs." },
      { t: "p", text: "On the ESP32 the Arduino core wraps ESP-IDF's SNTP client in two functions: `configTzTime(tz, server1, server2, server3)` sets the time zone and starts synchronisation in the background, and `getLocalTime(&tm, timeout_ms)` waits until the time is valid. After that, the standard C functions `time()`, `localtime_r()`, `gmtime_r()` and `strftime()` all work, and the SNTP client resyncs automatically (every hour by default)." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x, RTClib 2.1.
// Time from NTP when online; DS3231 (SDA GPIO21, SCL GPIO22) keeps it through power loss.
#include <WiFi.h>
#include <Wire.h>
#include <RTClib.h>
#include <sys/time.h>
#include "secrets.h"        // WIFI_SSID, WIFI_PASS

RTC_DS3231 rtc;
bool rtcOk = false;

// Copy the RTC into the ESP32's system clock (both in UTC).
void systemTimeFromRtc() {
  timeval tv = { (time_t)rtc.now().unixtime(), 0 };
  settimeofday(&tv, nullptr);
}

bool timeIsValid() { return time(nullptr) > 1700000000; }   // later than Nov 2023

void setup() {
  Serial.begin(115200);
  Wire.begin();
  rtcOk = rtc.begin();
  if (rtcOk && !rtc.lostPower()) {
    systemTimeFromRtc();                                       // usable time at once
    Serial.println("Time from DS3231");
  }

  configTzTime("IST-5:30", "in.pool.ntp.org", "pool.ntp.org", "time.google.com");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  tm local;
  if (getLocalTime(&local, 15000)) {                           // wait up to 15 s for NTP
    Serial.println("Time from NTP");
    if (rtcOk) rtc.adjust(DateTime((uint32_t)time(nullptr)));  // correct the RTC
  } else if (!timeIsValid()) {
    Serial.println("No valid time yet: readings will be marked untimed");
  }
}

void loop() {
  if (timeIsValid()) {
    time_t now = time(nullptr);
    tm utc, ist;
    gmtime_r(&now, &utc);
    localtime_r(&now, &ist);
    char a[32], b[32];
    strftime(a, sizeof a, "%Y-%m-%dT%H:%M:%SZ", &utc);        // ISO 8601, UTC: store this
    strftime(b, sizeof b, "%d %b %Y %H:%M:%S IST", &ist);     // for people
    Serial.printf("%lld  %s  %s\n", (long long)now, a, b);
  }
  delay(5000);
}`, caption: "Store the Unix time or the UTC string; show the IST string to users." },
      { t: "p", text: "Note the order of preference: NTP when available, the RTC when not, and an explicit \"untimed\" marker if neither has a valid time. A reading stored with time 0 (1 January 1970) is a common and confusing bug; check validity before stamping." },

      { t: "deep", title: "How NTP calculates offset and delay", blocks: [
        { t: "p", text: "The client records four timestamps: t1 when it sends the request (client clock), t2 when the server receives it and t3 when the server replies (server clock), and t4 when the reply arrives (client clock). Assuming the delay is the same in both directions:" },
        { t: "formula", text: String.raw`round-trip delay   δ = (t4 - t1) - (t3 - t2)
clock offset       θ = ((t2 - t1) + (t3 - t4)) / 2

Example (seconds after some minute):
t1 = 0.000   t2 = 0.120   t3 = 0.121   t4 = 0.051
δ = 0.051 - 0.001 = 0.050 s   (50 ms round trip)
θ = (0.120 + (0.121 - 0.051)) / 2 = (0.120 + 0.070) / 2 = 0.095 s
→ the client is 95 ms behind the server`, caption: "The server's own processing time (t3 - t2) is removed from the delay." },
        { t: "p", text: "Check by simulation: if the client is really 95 ms behind and each direction takes 25 ms, a request sent at client time 0.000 is server time 0.095 and arrives at 0.120. The reply leaves at server 0.121, which is client 0.026, and arrives 25 ms later at client 0.051. These match the four timestamps, so the formulas recover the true offset." },
        { t: "p", text: "If the paths are asymmetric (say 40 ms up and 10 ms down), the error in θ is half the asymmetry, 15 ms here. That is the fundamental accuracy limit of NTP over the internet. GPS receivers with a pulse-per-second output, or PTP (IEEE 1588) on wired networks with hardware timestamping, reach microseconds or better." },
        { t: "p", text: "NTP timestamps count from 1900, not 1970. The difference is 2 208 988 800 seconds (70 years including 17 leap days: (70 × 365 + 17) × 86 400). Raw-packet NTP code subtracts this constant; the ESP-IDF client does it for you." },
      ] },
      { t: "deep", title: "Reading DS3231 registers directly", blocks: [
        { t: "p", text: "Doing it once by hand shows what the library hides. Write the register pointer 0x00, then read seven bytes: seconds, minutes, hours, day of week, date, month (bit 7 is the century flag), year (00 to 99). Each is BCD, and the hours register has a 12/24-hour mode bit." },
        { t: "snippet", lang: "cpp", code: String.raw`#include <Wire.h>

uint8_t bcd2bin(uint8_t b) { return (b >> 4) * 10 + (b & 0x0F); }

void setup() {
  Serial.begin(115200);
  Wire.begin();
}

void loop() {
  Wire.beginTransmission(0x68);
  Wire.write(0x00);                        // start at the seconds register
  if (Wire.endTransmission(false) == 0 && Wire.requestFrom(0x68, 7) == 7) {
    uint8_t s = bcd2bin(Wire.read() & 0x7F);
    uint8_t m = bcd2bin(Wire.read());
    uint8_t h = bcd2bin(Wire.read() & 0x3F);   // assumes 24-hour mode
    Wire.read();                                // day of week, unused
    uint8_t d = bcd2bin(Wire.read());
    uint8_t mo = bcd2bin(Wire.read() & 0x1F);
    uint8_t y = bcd2bin(Wire.read());
    char text[24];
    snprintf(text, sizeof text, "20%02u-%02u-%02u %02u:%02u:%02u", y, mo, d, h, m, s);
    Serial.println(text);
  }
  delay(1000);
}`, caption: "Compiles for the Uno (A4, A5) and the ESP32 (GPIO 21, 22)." },
        { t: "p", text: "The DS3231 also has an aging-offset register (0x10) that trims the oscillator by about 0.1 ppm per step at 25 °C, so a unit measured against NTP over a few weeks can be calibrated beyond its datasheet accuracy. That is the calibration knob a long-running logger should keep." },
      ] },
    ],
    mistakes: [
      "**Storing local time instead of UTC.** Merge and compare in UTC; convert for display.",
      "**Writing the TZ string as IST+5:30.** POSIX signs are inverted; India is `IST-5:30`.",
      "**Stamping readings before the clock is valid.** You get dates in 1970; check `time(nullptr)` against a sensible threshold first.",
      "**Charging a non-rechargeable CR2032 on a DS3231 module.** Remove the charging resistor or use an LIR2032.",
      "**Trusting the ESP32's sleep clock for accurate timestamps.** Its RC oscillator drifts far more than a crystal; resync or use an RTC.",
      "**Calling an NTP server every few seconds.** The pool asks clients to sync no more than every few minutes; the default hourly resync is plenty.",
    ],
    practice: {
      kind: "bench",
      task: "Measure clock drift and build an RTC plus NTP time source.",
      steps: [
        "Wire a DS3231 module to the ESP32 DevKit (GPIO 21, 22, 3.3 V, GND) and check the coin cell charging issue on your module.",
        "Upload the lesson sketch with Wi-Fi available. Confirm it prints matching UTC and IST times.",
        "Power off, disconnect Wi-Fi (wrong password in secrets.h), and power on: confirm the time now comes from the DS3231.",
        "Leave the board running offline for 24 hours (or a weekend), then compare the DS3231 time with NTP. Calculate the drift in ppm and compare with ±2 ppm.",
        "For comparison, log `millis()` against NTP over the same period and calculate the drift of the ESP32's main crystal.",
      ],
    },
    quiz: [
      {
        q: "A clock is specified at ±10 ppm. What is the worst-case drift over 30 days?",
        options: ["About 2.6 s", "About 26 s", "About 0.86 s", "About 260 s"],
        answer: 1,
        why: "10e-6 × 86 400 s = 0.864 s per day, times 30 days = 25.9 s.",
      },
      {
        q: "Which POSIX TZ string gives Indian Standard Time on the ESP32?",
        options: ["IST+5:30", "UTC+5:30", "IST-5:30", "IST5.5"],
        answer: 2,
        why: "POSIX gives the offset to add to local time to reach UTC, so zones east of Greenwich have negative values.",
      },
      {
        q: "Devices in Bhopal and Berlin send readings to one server. How should they timestamp them?",
        options: [
          "Each in its own local time, so users see familiar times",
          "In IST, since the server is in India",
          "In UTC (for example Unix time), converting to local time only for display",
          "With millis() since boot",
        ],
        answer: 2,
        why: "A single zone-free time base makes data comparable and sortable. Local time is a presentation concern.",
      },
      {
        q: "An ESP32 logger boots with no network. Its DS3231 reports lostPower() as false. What should the firmware do?",
        options: [
          "Copy the DS3231's time into the system clock and stamp readings with it, then correct the RTC when NTP becomes available",
          "Refuse to log until NTP is available",
          "Use millis() as the timestamp",
          "Set the clock to 1 January 1970",
        ],
        answer: 0,
        why: "The RTC kept time on its battery, so it is a valid time source until NTP can refine it.",
      },
      {
        q: "Why is the DS3231 far more accurate than a DS1307 with a plain crystal?",
        options: [
          "It counts faster",
          "It measures its own temperature and compensates the crystal's frequency, holding about ±2 ppm",
          "It synchronises over I2C with the microcontroller",
          "It uses NTP",
        ],
        answer: 1,
        why: "A crystal's frequency changes with temperature. The DS3231's TCXO corrects for this; a plain crystal module may drift 20 ppm or more.",
      },
    ],
  },

  "i11-storage-and-data-formats": {
    id: "i11-storage-and-data-formats",
    outcomes: [
      "Choose between NVS, a flash file system and an SD card for a given amount and pattern of data",
      "Explain flash erase blocks, write endurance and wear levelling, and estimate a flash lifetime",
      "Compare CSV, JSON and binary records by size, readability and robustness",
      "Append records safely to LittleFS on the ESP32",
    ],
    blocks: [
      { t: "h", text: "Why a device must store data" },
      { t: "p", text: "Networks fail. Batteries run low. A field device may only be visited once a month. Whenever data must survive a reboot, a power cut or an outage, it has to be written to non-volatile memory, and what you write, where and how often decides whether the device works for years or wears out its flash in weeks. This lesson covers the storage available to an ESP32, the physics that limits it, and the trade-offs between data formats." },

      { t: "h", text: "Where data can live on an ESP32" },
      { t: "table", head: ["Storage", "Size on an ESP32 DevKit", "Good for", "Arduino API"], rows: [
        ["RTC memory", "8 kB slow RTC RAM", "Values kept through deep sleep, lost on power-off", "RTC_DATA_ATTR variables"],
        ["NVS (key-value)", "20 kB partition in the default table", "Settings, credentials, counters", "Preferences library"],
        ["Flash file system", "About 1.4 MB in the default table", "Logs, queues, config files, web pages", "LittleFS (or SPIFFS, FFat)"],
        ["SD card", "Gigabytes", "Long logs, large files to read on a PC", "SD (SPI) or SD_MMC"],
      ], caption: "The default 4 MB partition table of the Arduino-ESP32 core 3.3 reserves 0x160000 bytes for the file system." },
      { t: "p", text: "The Uno has 1 kB of EEPROM and no file system; for logging on an Uno, add an SD card module (with a level shifter, since cards are 3.3 V devices) or an external I2C EEPROM or FRAM chip. Everything else in this lesson uses the ESP32." },

      { t: "h", text: "How flash memory wears" },
      { t: "p", text: "The ESP32's program and file system live in an external **NOR flash** chip. Flash has an awkward rule: a write can only change bits from 1 to 0. To turn bits back to 1 you must **erase** a whole **sector**, 4 kB on these chips, which sets every bit in it to 1. And each sector survives only a limited number of erase cycles, typically **100 000** for the flash used on ESP32 modules, after which bits start to stick." },
      { t: "formula", text: String.raw`Naive design: rewrite one 4 kB sector once a minute
erases per day = 1440
lifetime = 100 000 / 1440 ≈ 69 days

Wear-levelled across the default 1.4 MB file system:
sectors = 0x160000 / 4096 = 352
lifetime ≈ 352 × 100 000 / 1440 ≈ 24 400 days ≈ 67 years`, caption: "Spreading writes over many sectors multiplies lifetime by the number of sectors (less file-system overhead in practice)." },
      { t: "p", text: "Check the numbers: 100 000 / 1440 = 69.4; 352 × 100 000 = 35.2 million erases; 35.2 million / 1440 = 24 444 days, or about 67 years. In practice metadata writes and partly filled blocks cost extra, so plan for several times less, but the conclusion holds: **never repeatedly rewrite the same fixed location**. Writing a settings struct to the same EEPROM address every loop, or saving a counter to NVS every second, is the classic way students wear out boards." },
      { t: "p", text: "**Wear levelling** spreads writes across all free sectors. **LittleFS**, the recommended file system in the Arduino-ESP32 core, does dynamic wear levelling and is designed to be **power-loss safe**: it uses copy-on-write, so a power cut mid-write leaves the old version of a file intact rather than a corrupted one. NVS also wear-levels across its pages by appending new values and erasing old pages only when full. SPIFFS, the older file system, is deprecated and has no directories." },

      { t: "h", text: "SD cards" },
      { t: "p", text: "SD cards contain their own controller, which wear-levels internally, so you do not manage sectors yourself; you write files through a FAT file system (FAT32 for cards up to 32 GB). On the ESP32 DevKit, the simplest connection is SPI mode on the VSPI pins (SCK GPIO 18, MISO GPIO 19, MOSI GPIO 23, CS GPIO 5) with the core's `SD` library. Three practical warnings:" },
      { t: "list", items: [
        "**Power**: cards draw spikes of 100 mA or more while writing. A weak 3.3 V supply browns out and corrupts the card. Add a 10 µF to 100 µF capacitor at the module.",
        "**FAT is not power-loss safe**: the file allocation table and directory entry are updated separately from the data. Pulling power while a file is open can lose the file or damage the file system. Call `flush()` or close the file after each batch, and if the device runs on batteries, stop writing when the voltage falls below a threshold.",
        "**Write in blocks**: cards erase internally in large units (often 64 kB to several MB). Writing a few bytes at a time causes many internal read-modify-write cycles; buffer records in RAM and write 512 bytes or more at once.",
      ] },

      { t: "h", text: "Data formats compared" },
      { t: "p", text: "Take one reading: time 1795761000 (12:00 IST, 27 November 2026), temperature 27.41 °C, humidity 61.2 %, pressure 95 321.5 Pa. Three ways to store it:" },
      { t: "snippet", lang: "text", code: String.raw`CSV  (30 bytes with newline):
1795761000,27.41,61.2,95321.5

JSON (50 bytes with newline, no spaces):
{"ts":1795761000,"t":27.41,"rh":61.2,"p":95321.5}

Binary (12 bytes): little-endian struct
  uint32 ts = 1795761000       → 68 23 09 6B
  int16  temp, 0.01 °C = 2741  → B5 0A
  uint16 rh,   0.01 %  = 6120  → E8 17
  uint32 p,    0.1 Pa  = 953215 → 7F 8B 0E 00`, caption: "The same reading in three formats." },
      { t: "table", head: ["", "CSV", "JSON", "Binary"], rows: [
        ["Bytes per reading", "30", "50", "12"],
        ["Per day at 1 reading/min", "43 200 B", "72 000 B", "17 280 B"],
        ["Days to fill 1 MB", "24", "14", "60"],
        ["Human readable", "Yes, opens in a spreadsheet", "Yes", "No: needs a decoder"],
        ["Self-describing", "Only with a header row", "Yes, field names in every record", "No: layout is defined in code"],
        ["Adding a field later", "Breaks old parsers unless appended", "Easy", "Needs a version number"],
        ["Parsing cost on the device", "Low", "Higher (ArduinoJson)", "Lowest (memcpy)"],
      ], caption: "Check: 1 048 576 / 43 200 = 24.3; / 72 000 = 14.6; / 17 280 = 60.7 days." },
      { t: "p", text: "Choose by who reads the data and how much there is. **CSV** is ideal for an SD card that a person pulls out and opens in a spreadsheet. **JSON** is the natural choice for messages to web services and MQTT dashboards, where readability and flexible fields matter more than bytes. **Binary** wins for queues on internal flash and for slow or metered links: LoRa (where every byte costs airtime), NB-IoT and satellite. When you use binary, always define the layout explicitly: fixed-width types, a stated byte order, packed structs, scaled integers instead of floats, and a format version number in a header so that future firmware can read old files." },

      { t: "h", text: "Appending records to LittleFS" },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. Append binary records to LittleFS
// and read them back. Uses the default partition table's 1.4 MB data partition.
#include <LittleFS.h>

struct __attribute__((packed)) Record {   // 12 bytes, little-endian on the ESP32
  uint32_t ts;          // Unix time, UTC
  int16_t  temp_centi;  // 0.01 degC
  uint16_t rh_centi;    // 0.01 %
  uint32_t p_deci;      // 0.1 Pa
};
static_assert(sizeof(Record) == 12, "record layout changed");

const char *LOG = "/log.bin";

bool appendRecord(const Record &r) {
  File f = LittleFS.open(LOG, FILE_APPEND);
  if (!f) return false;
  size_t n = f.write((const uint8_t *)&r, sizeof r);
  f.close();                               // close = data and metadata committed
  return n == sizeof r;
}

void dumpLog() {
  File f = LittleFS.open(LOG, FILE_READ);
  if (!f) return;
  Record r;
  while (f.read((uint8_t *)&r, sizeof r) == sizeof r) {
    Serial.printf("%lu,%.2f,%.2f,%.1f\n", (unsigned long)r.ts,
                  r.temp_centi / 100.0, r.rh_centi / 100.0, r.p_deci / 10.0);
  }
  f.close();
}

void setup() {
  Serial.begin(115200);
  if (!LittleFS.begin(true)) {             // true: format if mounting fails (first use)
    Serial.println("LittleFS mount failed");
    return;
  }
  Record r = { 1795761000, 2741, 6120, 953215 };
  appendRecord(r);
  Serial.printf("log size %u bytes, fs used %u of %u\n",
                (unsigned)LittleFS.open(LOG).size(),
                (unsigned)LittleFS.usedBytes(), (unsigned)LittleFS.totalBytes());
  dumpLog();                               // prints CSV, ready to paste into a spreadsheet
}

void loop() {}`, caption: "Each reboot appends one more record; the file grows by 12 bytes each time." },
      { t: "p", text: "Opening and closing the file for every 12-byte record is simple and safe but costs a little flash wear and time on each write, because LittleFS commits metadata on close. At one record a minute that is fine. At ten records a second, keep a RAM buffer and append a few hundred bytes at once, accepting that a power cut loses the buffered records." },

      { t: "deep", title: "Verifying the format sizes and the binary layout", blocks: [
        { t: "p", text: "Do not trust a size table you have not checked. Python's `struct` module packs exactly like the ESP32 when you use `<` (little-endian, no padding), which makes it the tool for writing PC-side decoders." },
        { t: "snippet", lang: "python", code: String.raw`import json, struct

ts, t, rh, p = 1795761000, 27.41, 61.2, 95321.5

csv_line = f"{ts},{t},{rh},{p}\n"
json_line = json.dumps({"ts": ts, "t": t, "rh": rh, "p": p}, separators=(",", ":")) + "\n"
binary = struct.pack("<IhHI", ts, round(t * 100), round(rh * 100), round(p * 10))

print(len(csv_line), len(json_line), len(binary))     # 30 50 12
print(binary.hex(" "))                                 # 68 23 09 6b b5 0a e8 17 7f 8b 0e 00

# Decode a whole log file of 12-byte records:
def read_log(data: bytes):
    for off in range(0, len(data) - len(data) % 12, 12):
        ts, tc, rc, pd = struct.unpack_from("<IhHI", data, off)
        yield ts, tc / 100, rc / 100, pd / 10

assert list(read_log(binary)) == [(1795761000, 27.41, 61.2, 95321.5)]`, caption: "Output: 30 50 12, then the twelve bytes. The assert proves the round trip." },
        { t: "p", text: "Why scaled integers rather than floats? A 4-byte float would also hold 27.41, but not exactly (it stores 27.40999984...), its layout is less obvious to other tools, and integers compress and compare cleanly. Choose the scale from the sensor's real resolution: storing a ±0.5 °C sensor in 0.01 °C units is fine for space, but do not let the extra digits suggest accuracy you do not have." },
        { t: "p", text: "For robustness on flash or SD, real logging formats add a file header (magic number, format version, device id, record size) and a CRC per record or per block, so a reader can detect a torn final record after a power cut and resynchronise. Formats such as CBOR and Protocol Buffers give binary compactness with a schema and versioning built in; both have embedded C libraries (for example tinycbor and nanopb)." },
      ] },
      { t: "deep", title: "Inside NOR flash and LittleFS", blocks: [
        { t: "p", text: "A NOR flash cell is a transistor with a floating gate that holds charge. Programming pushes electrons onto it (bit becomes 0); erasing removes them by tunnelling (bit becomes 1). Each erase slightly damages the oxide insulating the gate, which is why endurance is finite; data retention (typically 20 years) also falls as a cell ages and with high temperature." },
        { t: "p", text: "LittleFS stores metadata in pairs of blocks that it alternates between, appending small commits with a CRC; on mount it takes the newest commit whose CRC is valid, so a half-written commit is simply ignored. File data is written copy-on-write into new blocks, and blocks are allocated in a rotating fashion across the whole partition, which gives the dynamic wear levelling. Its known weakness is performance when the file system is nearly full, when it must search harder for free blocks. Keep at least 20 to 30% free, and rotate log files rather than letting one grow without limit." },
      ] },
    ],
    mistakes: [
      "**Rewriting the same EEPROM or NVS key every loop.** A counter saved every second wears a fixed location out; save only on change, or rarely.",
      "**Pulling power from an SD card with an open file.** FAT can lose the file; flush or close after each batch.",
      "**Using `struct` without `packed` and fixed-width types.** Padding and type sizes differ between compilers; the PC decoder then reads garbage.",
      "**Storing floats as text with many digits in CSV and calling it precision.** Store the sensor's real resolution.",
      "**Letting the log file fill the file system.** Rotate or cap files; LittleFS slows down and writes fail when nearly full.",
      "**Using SPIFFS in new projects.** It is deprecated in the ESP32 core; use LittleFS.",
    ],
    practice: {
      kind: "bench",
      task: "Measure storage costs on a real ESP32.",
      steps: [
        "Run the Python check in the Go deeper section and confirm 30, 50 and 12 bytes.",
        "Upload the LittleFS sketch, reset the board five times, and confirm the log grows by 12 bytes per reset and dumps five records.",
        "Modify it to append one record every second for ten minutes and time how long `appendRecord()` takes with `micros()`. Then batch 50 records per write and time it again.",
        "Write the same records as CSV to a second file and compare file sizes after ten minutes with the lesson's table.",
        "Calculate how long your device could log at one record a minute before filling the file system, in each format.",
      ],
    },
    quiz: [
      {
        q: "A sketch saves a counter to the same 4 kB flash sector once every 10 seconds, with no wear levelling. With 100 000 erase cycles, roughly how long will that sector last?",
        options: ["About 11.6 days", "About 116 days", "About 1.2 days", "About 3 years"],
        answer: 0,
        why: "8640 erases per day (86 400 / 10). 100 000 / 8640 ≈ 11.6 days.",
      },
      {
        q: "Why is flash written by erasing whole sectors?",
        options: [
          "Because the file system requires it",
          "Writing can only change bits from 1 to 0; only an erase, which works on a whole sector, returns bits to 1",
          "To make it faster",
          "Because of the SPI bus",
        ],
        answer: 1,
        why: "Programming adds charge (1 to 0). Removing it is an erase, which operates on 4 kB sectors on ESP32 flash.",
      },
      {
        q: "A LoRa node sends one reading every 15 minutes and every byte costs airtime. Which format suits it best?",
        options: ["JSON with descriptive field names", "CSV with a header row", "A fixed binary layout with scaled integers", "XML"],
        answer: 2,
        why: "Binary is the smallest (12 bytes against 50 for JSON here), which directly cuts airtime and battery use.",
      },
      {
        q: "What does LittleFS offer that FAT on an SD card does not?",
        options: [
          "Larger capacity",
          "Readability on a PC",
          "Power-loss safety through copy-on-write commits, plus wear levelling on raw flash",
          "Faster SPI speed",
        ],
        answer: 2,
        why: "LittleFS keeps the old version valid until a new commit is complete. FAT updates its tables separately and can be corrupted by a power cut.",
      },
      {
        q: "At one reading a minute, about how many days of CSV readings (30 bytes each) fit in 1 MB?",
        options: ["About 2.4 days", "About 24 days", "About 240 days", "About 60 days"],
        answer: 1,
        why: "30 × 1440 = 43 200 bytes per day. 1 048 576 / 43 200 ≈ 24.3 days.",
      },
    ],
  },

  "i11-dashboards-and-store-and-forward": {
    id: "i11-dashboards-and-store-and-forward",
    outcomes: [
      "Explain how a time-series database organises measurements, tags and fields, and why retention and downsampling matter",
      "Build a pipeline from device to database to dashboard with either InfluxDB and Grafana or Node-RED",
      "Design store-and-forward so that no readings are lost or duplicated when the network drops",
      "Implement a persistent upload queue on the ESP32",
    ],
    blocks: [
      { t: "h", text: "What happens to the data after it is sent" },
      { t: "p", text: "A message that reaches a broker and goes nowhere is wasted. Useful IoT systems store readings, plot them, alert on them and keep them for months. Sensor data has a particular shape: an endless stream of timestamped numbers from many devices, almost always appended and rarely changed, queried by time range. General databases can hold it, but **time-series databases** are built for it. And because devices lose their network, the device side must be designed so that the data still arrives, late but complete. This lesson covers both halves." },

      { t: "h", text: "Time-series data model" },
      { t: "p", text: "Most time-series databases, with InfluxDB as the common example, describe each point with four parts:" },
      { t: "list", items: [
        "**Measurement** (InfluxDB 3 calls it a table): what kind of data, such as `env`.",
        "**Tags**: indexed text that identifies the source and is used to filter and group: `device=bench07`, `room=lab101`. Keep the number of distinct tag values reasonable; a tag holding a unique value per point (a sequence number, a reading) explodes the index.",
        "**Fields**: the measured values: `temp_c=27.41`, `rh=61.2`. Not indexed.",
        "**Timestamp**: when, in UTC, at a stated precision.",
      ] },
      { t: "snippet", lang: "text", code: String.raw`env,device=bench07,room=lab101 temp_c=27.41,rh=61.2,p_pa=95321.5 1795761000
env,device=bench08,room=lab101 temp_c=26.90,rh=63.0,p_pa=95318.0 1795761000
│   └──── tags ────────────────┘ └──────── fields ──────────────┘ └ time (s) ┘
measurement`, caption: "InfluxDB line protocol: one line per point. A space separates the three parts; there are no spaces inside them." },
      { t: "p", text: "Two more ideas make time-series storage practical. **Retention**: raw data is kept only as long as needed (say 30 days), then deleted automatically. **Downsampling**: before raw data expires, it is summarised into coarser series (hourly mean, minimum and maximum), which are kept for years. One sensor at one reading every 10 seconds produces 8640 points a day; hourly summaries reduce that to 24, so a year of history becomes cheap." },

      { t: "h", text: "Two practical pipelines" },
      { t: "p", text: "**Route 1: InfluxDB and Grafana.** InfluxDB 3 Core is InfluxData's current open-source server (version 3.x, released in 2025; it is queried with SQL or InfluxQL, while the Flux language of InfluxDB 2 is not supported). Devices or a bridge write line protocol over HTTP. **Grafana** (any recent release) connects to InfluxDB as a data source and draws dashboards: time-series graphs, gauges, tables and alert rules. Both run on a laptop, a Raspberry Pi 4 or 5, or in Docker. This route is how production systems are built, and the skills transfer to any database." },
      { t: "p", text: "**Route 2: Node-RED.** Node-RED (version 4.x) is a browser-based, flow-based programming tool that runs on Node.js. You drag an **mqtt in** node onto a canvas, connect it to a **json** node and then to a chart or gauge from **Node-RED Dashboard 2.0** (the `@flowfuse/node-red-dashboard` package, which replaces the older, deprecated `node-red-dashboard`), and you have a live dashboard in minutes with no code. Node-RED can also write to InfluxDB, send Telegram or email alerts, and transform messages with small JavaScript function nodes. It is the fastest route to a working dashboard for a class project." },
      { t: "diagram", text: String.raw`Route 1                                   Route 2
ESP32 ─HTTP line protocol─► InfluxDB 3     ESP32 ─MQTT─► Mosquitto ─► Node-RED
   or ─MQTT─► broker ─► bridge ─┘ │                                 ├─► Dashboard 2.0 charts
                         Grafana ◄┘ (SQL)                           └─► (optional) InfluxDB`, caption: "Both routes can share the same device firmware if the device publishes MQTT." },
      { t: "note", kind: "tip", text: "These tools move quickly. Before following this lesson, check the install guide and release notes of the version you install, especially for InfluxDB, whose 1.x, 2.x and 3.x lines have different APIs and query languages." },

      { t: "h", text: "Store and forward" },
      { t: "p", text: "A device that only sends live readings loses everything while Wi-Fi or the server is down. **Store and forward** means: every reading is first written to non-volatile storage, and a separate upload step sends stored readings when it can, deleting them only after the server confirms it has stored them. The device never assumes the network is up." },
      { t: "diagram", text: String.raw`        sample every 60 s                 when online
sensor ───────────► append to queue ───► read oldest batch ───► POST to server
                    (LittleFS file)            ▲                   │
                                               │   2xx: advance    │
                                               └── read pointer ◄──┘
                                                   else: keep, back off, retry`, caption: "The queue is the source of truth; the network is just one way to drain it." },
      { t: "p", text: "Four design rules make it correct:" },
      { t: "list", ordered: true, items: [
        "**Timestamp at the moment of sampling**, not at upload time. A reading uploaded three hours late must still carry its own time. This is why the previous lessons on RTCs matter.",
        "**Delete only after acknowledgement.** HTTP 2xx from a server that has written the data, or an MQTT QoS 1 PUBACK from a broker that persists it. A QoS 0 publish returning true only means the bytes entered the TCP buffer.",
        "**Make uploads idempotent.** A timeout after the server stored a batch, but before the device saw the reply, causes the batch to be sent again. Give each reading a unique key (device id plus timestamp, or a sequence number) so the server overwrites rather than duplicates. In InfluxDB this happens naturally: a point with the same measurement, tags and timestamp replaces the earlier one.",
        "**Bound the queue.** Decide what happens when storage fills during a long outage: drop new readings (simplest, and what the sketch below does), overwrite the oldest (a ring buffer, usually preferred because recent data matters most), or start keeping only every tenth reading. Say which in the design.",
      ] },
      { t: "p", text: "Size the queue from the longest outage you must survive. With 12-byte binary records at one a minute, 17 280 bytes a day, a 1 MB queue holds about 60 days. With JSON it would be about 14 days." },

      { t: "h", text: "A persistent upload queue on the ESP32" },
      { t: "p", text: "The sketch below implements the design with two files: `/q.bin` holds 12-byte records, and `/q.pos` holds the byte offset of the oldest record not yet acknowledged. Uploads go to InfluxDB 3 Core's line-protocol write endpoint (`/api/v3/write_lp`) in batches of up to 60 records. When everything is acknowledged, both files are removed so the queue does not grow forever." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. Store-and-forward data logger.
// Samples every 60 s into a LittleFS queue; uploads to InfluxDB 3 Core when online.
#include <WiFi.h>
#include <HTTPClient.h>
#include <LittleFS.h>
#include "secrets.h"   // WIFI_SSID, WIFI_PASS, INFLUX_URL, INFLUX_TOKEN
// INFLUX_URL e.g. "http://192.168.1.10:8181/api/v3/write_lp?db=lab&precision=second"

struct __attribute__((packed)) Record { uint32_t ts; int16_t temp_centi; uint16_t rh_centi; uint32_t p_deci; };
const char *QFILE = "/q.bin", *QPOS = "/q.pos";
const size_t MAX_QUEUE = 900 * 1024;      // stop growing at ~900 kB (about 53 days)
const int BATCH = 60;

uint32_t readPos() {
  File f = LittleFS.open(QPOS, FILE_READ);
  uint32_t pos = 0;
  if (f) { f.read((uint8_t *)&pos, sizeof pos); f.close(); }
  return pos;
}

void writePos(uint32_t pos) {
  File f = LittleFS.open(QPOS, FILE_WRITE);   // small file, rewritten once per batch
  f.write((const uint8_t *)&pos, sizeof pos);
  f.close();
}

void enqueue(const Record &r) {
  File q = LittleFS.open(QFILE, FILE_APPEND);
  if (!q) return;
  if (q.size() < MAX_QUEUE) q.write((const uint8_t *)&r, sizeof r);
  // When full, new readings are dropped (simplest policy, keeps the start of the outage).
  // A ring buffer that overwrites the oldest records is the usual upgrade.
  q.close();
}

// Upload one batch. Returns true if the queue is now empty.
bool uploadBatch() {
  File q = LittleFS.open(QFILE, FILE_READ);
  if (!q) return true;                       // nothing queued
  uint32_t pos = readPos();
  if (pos >= q.size()) {                     // everything acknowledged: reset the queue
    q.close();
    LittleFS.remove(QPOS);                   // pointer first: a reset here only causes a harmless resend
    LittleFS.remove(QFILE);
    return true;
  }
  q.seek(pos);
  String body;
  Record r;
  int n = 0;
  while (n < BATCH && q.read((uint8_t *)&r, sizeof r) == sizeof r) {
    char line[128];
    snprintf(line, sizeof line, "env,device=bench07 temp_c=%.2f,rh=%.2f,p_pa=%.1f %lu\n",
             r.temp_centi / 100.0, r.rh_centi / 100.0, r.p_deci / 10.0, (unsigned long)r.ts);
    body += line;
    n++;
  }
  q.close();

  HTTPClient http;
  http.begin(INFLUX_URL);
  http.addHeader("Authorization", String("Bearer ") + INFLUX_TOKEN);
  http.addHeader("Content-Type", "text/plain; charset=utf-8");
  http.setTimeout(8000);
  int code = http.POST(body);
  http.end();
  if (code >= 200 && code < 300) {
    writePos(pos + n * sizeof(Record));      // acknowledged: advance the read pointer
    return false;
  }
  Serial.printf("Upload failed (%d), %d records kept\n", code, n);
  return false;
}

Record sample() {
  // Replace with real sensors (BMP280 driver from module i7, for example).
  return { (uint32_t)time(nullptr), (int16_t)lroundf(temperatureRead() * 100), 6000, 953215 };
}

void setup() {
  Serial.begin(115200);
  LittleFS.begin(true);
  configTzTime("IST-5:30", "in.pool.ntp.org", "pool.ntp.org");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  WiFi.setAutoReconnect(true);
}

void loop() {
  static uint32_t lastSample = 0, lastUpload = 0, backoff = 5000;
  if (millis() - lastSample >= 60000 || lastSample == 0) {
    lastSample = millis();
    if (time(nullptr) > 1700000000) enqueue(sample());   // only stamp with a valid clock
  }
  if (WiFi.status() == WL_CONNECTED && millis() - lastUpload >= backoff) {
    lastUpload = millis();
    uint32_t before = readPos();
    bool empty = uploadBatch();
    bool progressed = readPos() != before;
    backoff = (empty || progressed) ? 5000 : min<uint32_t>(backoff * 2, 300000);
  }
}`, caption: "A reboot at any point loses at most the batch in flight, which is then resent: duplicates are harmless because the server keys points by tags and time." },
      { t: "p", text: "Trace a failure to convince yourself it is correct. The device uploads 60 records; the server stores them; the reply is lost. The device sees a failure, keeps the pointer, backs off, and sends the same 60 records again. The server receives points with identical measurement, tags and timestamps and overwrites them with identical values. Result: no loss, no duplication. Now trace a power cut just after the server replied 204 but before `writePos()` finished: LittleFS keeps the old `/q.pos`, so the batch is resent, with the same harmless result." },

      { t: "deep", title: "Storage and query cost of a time-series database", blocks: [
        { t: "p", text: "Estimate before you deploy. A class of 30 devices, each sending 3 fields every 10 seconds:" },
        { t: "formula", text: String.raw`points per day = 30 devices × 8640 per day      = 259 200
field values   = 259 200 × 3                    = 777 600 per day
raw line protocol ≈ 70 bytes per point → 259 200 × 70 ≈ 18 MB/day

InfluxDB 3 stores data as compressed Parquet columns; sensor series often compress
by 10× or more, so on disk ≈ 2 MB/day, ≈ 55 MB for 30 days of raw data.

Hourly downsampled (mean, min, max of 3 fields): 30 × 24 = 720 points/day
→ a year of summaries ≈ 263 000 points, tiny.`, caption: "Check: 30 × 8640 = 259 200; × 70 B = 18.1 MB." },
        { t: "p", text: "Queries are fast when they filter by time range and tags first. A Grafana panel showing the last 24 hours for one device reads 8640 points; the same panel for 30 days should switch to the hourly series (720 points) rather than drawing 259 200 points that a screen cannot show anyway. Grafana's `$__interval` variable and SQL `date_bin()` grouping exist for exactly this." },
        { t: "p", text: "An alternative stack many teams use is PostgreSQL with the TimescaleDB extension, which keeps full SQL and relational joins (for device metadata) with time-series compression and continuous aggregates. The data model ideas (tags, fields, retention, downsampling) carry across." },
      ] },
      { t: "deep", title: "A Node-RED flow in outline", blocks: [
        { t: "p", text: "Node-RED flows are stored as JSON and can be imported from the clipboard (menu, Import). A minimal dashboard flow for the i10 MQTT node has four nodes:" },
        { t: "list", ordered: true, items: [
          "**mqtt in**: server = your Mosquitto broker, topic = `nitb/iotlab/+/telemetry`, output = parsed JSON object.",
          "**change**: set `msg.topic` to the device name (the third topic level) so each device becomes a separate line on the chart.",
          "**ui-chart** (Dashboard 2.0): type line, x-axis time, series from `msg.topic`, y from `msg.payload.temp_c`.",
          "**ui-gauge**: shows the latest RSSI, and a **ui-switch** wired to an **mqtt out** node publishing 1 or 0 to the command topic.",
        ] },
        { t: "p", text: "Install Node-RED with `npm install -g --unsafe-perm node-red` (Node.js 18 or later; check the current requirement), start it with `node-red`, open http://localhost:1880, and add Dashboard 2.0 from the palette manager. The dashboard is served at http://localhost:1880/dashboard. Node-RED keeps chart data only in memory by default, so use it for live views and InfluxDB for history." },
      ] },
    ],
    mistakes: [
      "**Timestamping at upload time.** Readings sent late then appear at the wrong time; stamp when sampling.",
      "**Deleting a reading as soon as publish() returns true.** That only means the bytes were buffered; wait for a real acknowledgement.",
      "**Putting a unique value such as a sequence number in a tag.** The tag index grows without bound; put it in a field.",
      "**Retrying a non-idempotent upload.** Without a unique key per reading, retries create duplicates.",
      "**Unbounded queues.** A month-long outage fills the flash and writes start failing; set a limit and a policy.",
      "**Drawing 30 days of 10-second data in one panel.** Use downsampled series for long ranges.",
    ],
    practice: {
      kind: "bench",
      task: "Build a dashboard pipeline and prove the logger survives an outage.",
      steps: [
        "Choose a route. Route 1: run InfluxDB 3 Core and Grafana (Docker makes this easy), create a database `lab` and a token, and add InfluxDB as a Grafana data source. Route 2: install Node-RED and Dashboard 2.0 and connect it to your Mosquitto broker.",
        "Route 1: fill INFLUX_URL and INFLUX_TOKEN in secrets.h and upload the store-and-forward sketch. Route 2: adapt the upload function to publish each record over MQTT and keep the queue logic.",
        "Build a panel showing temperature for the last hour. Confirm a new point every minute.",
        "Switch off the hotspot for 20 minutes. Watch the serial monitor report failed uploads and growing backoff.",
        "Switch it back on. Confirm the gap in the graph fills in with the stored readings, each at its original time, and count that no minute is missing or duplicated.",
      ],
    },
    quiz: [
      {
        q: "In InfluxDB, which of these should be a tag rather than a field?",
        options: ["The measured temperature", "A sequence number unique to every reading", "The battery voltage", "The device id"],
        answer: 3,
        why: "Tags identify the source and are indexed for filtering and grouping. Measured values, and anything unique per point, belong in fields.",
      },
      {
        q: "A device's upload times out after the server stored the batch. On retry it sends the same batch. Why is no data duplicated in the lesson's design?",
        options: [
          "HTTP never retries",
          "Each point has the same measurement, tags and timestamp as before, so the database overwrites it with identical values",
          "The device deletes the batch before sending",
          "QoS 2 is used",
        ],
        answer: 1,
        why: "The uploads are idempotent: the point's identity is its series and timestamp, so resending replaces rather than adds.",
      },
      {
        q: "When should a store-and-forward device remove a reading from its queue?",
        options: [
          "As soon as it is sampled",
          "When publish() or write() returns",
          "After the server or a persistent broker acknowledges that it has stored it",
          "After a fixed time",
        ],
        answer: 2,
        why: "Only a positive acknowledgement from the side that stores the data proves it arrived. Anything earlier risks loss.",
      },
      {
        q: "A logger stores 12-byte records once a minute and must survive a 30-day outage. What is the minimum queue size?",
        options: ["About 518 kB", "About 52 kB", "About 5.2 MB", "About 17 kB"],
        answer: 0,
        why: "12 × 1440 = 17 280 bytes per day; × 30 = 518 400 bytes.",
      },
      {
        q: "Why keep downsampled hourly data after deleting raw 10-second data?",
        options: [
          "Hourly data is more accurate",
          "Databases cannot store raw data for more than a month",
          "It keeps long-term trends (mean, min, max) at a tiny fraction of the storage, and long-range graphs load fast",
          "Grafana only plots hourly data",
        ],
        answer: 2,
        why: "8640 raw points a day become 24 summaries, so years of history stay cheap to store and quick to query.",
      },
    ],
  },

  "i11-ota-updates-and-device-security": {
    id: "i11-ota-updates-and-device-security",
    outcomes: [
      "Read an ESP32 partition table and explain how two OTA slots and otadata make updates safe",
      "Update firmware over the air with ArduinoOTA on a local network and with HTTP OTA from a server",
      "Use the core's rollback support so a bad update reverts itself",
      "Keep credentials out of source control and use TLS with a CA certificate on the ESP32",
    ],
    blocks: [
      { t: "h", text: "Devices you cannot reach with a USB cable" },
      { t: "p", text: "Once a device is on a pole, in a ceiling or in a field, every bug fix means a site visit, unless it can update itself. Over-the-air (OTA) updating is what turns a prototype into a maintainable product. It is also the most dangerous feature a device has: a bad update can brick every device at once, and an insecure update channel lets anyone replace your firmware. This lesson covers how ESP32 OTA works, two ways to use it, how to make it recover from a bad update, and the basic security every connected device needs." },

      { t: "h", text: "The partition table" },
      { t: "p", text: "The ESP32's flash is divided into **partitions**, listed in a table written at offset 0x8000. The Arduino-ESP32 core's default table for a 4 MB module (`default.csv` in core 3.3) is:" },
      { t: "snippet", lang: "text", code: String.raw`# Name,   Type, SubType, Offset,  Size,     Flags
nvs,      data, nvs,     0x9000,  0x5000,              20 kB   settings (Preferences)
otadata,  data, ota,     0xe000,  0x2000,               8 kB   which app slot to boot
app0,     app,  ota_0,   0x10000, 0x140000,          1280 kB   firmware slot A
app1,     app,  ota_1,   0x150000,0x140000,          1280 kB   firmware slot B
spiffs,   data, spiffs,  0x290000,0x160000,          1408 kB   file system (LittleFS)
coredump, data, coredump,0x3F0000,0x10000,             64 kB   crash dumps`, caption: "0x140000 = 1 310 720 bytes, which is exactly the \"Maximum is 1310720 bytes\" arduino-cli reports for a sketch." },
      { t: "p", text: "The key idea is **two application slots**. The running firmware lives in one; an update is written into the other while the old one keeps running. Only when the new image has been completely received and its checksum verified does the updater write to **otadata** to say \"boot the other slot next time\". If power fails mid-download, otadata still points to the old slot and the device boots the old firmware. The cost is that your sketch can use at most half the space for the application. If a sketch outgrows 1.25 MB, choose a different scheme in the board menu (for example `min_spiffs`, which gives 1.9 MB per slot) rather than `huge_app`, which has no second slot and therefore no OTA." },

      { t: "h", text: "Method 1: ArduinoOTA on the local network" },
      { t: "p", text: "The core's **ArduinoOTA** library makes the device listen for uploads from the Arduino IDE or arduino-cli on the same network. The device advertises itself by mDNS, the IDE shows it as a network port, and uploads use the espota protocol. Always set a password. It is ideal during development and for devices on a lab network; it does not scale to a fleet, because someone must push to each device." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. Development OTA from the IDE or arduino-cli.
#include <WiFi.h>
#include <ArduinoOTA.h>
#include "secrets.h"     // WIFI_SSID, WIFI_PASS, OTA_PASS

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(250);

  ArduinoOTA.setHostname("bench07");
  ArduinoOTA.setPassword(OTA_PASS);              // never leave OTA open
  ArduinoOTA.onStart([] { Serial.println("OTA start: stopping other work"); });
  ArduinoOTA.onProgress([](unsigned int done, unsigned int total) {
    Serial.printf("OTA %u%%\r", done * 100 / total);
  });
  ArduinoOTA.onError([](ota_error_t e) { Serial.printf("OTA error %d\n", e); });
  ArduinoOTA.begin();
  Serial.println(WiFi.localIP());
}

void loop() {
  ArduinoOTA.handle();                            // must run often
  // ... normal non-blocking work here
}`, caption: "Upload with: arduino-cli upload -b esp32:esp32:esp32 -p <device IP> --upload-field password=<OTA_PASS> sketch_dir" },
      { t: "note", kind: "warn", text: "The first upload must still be over USB, and every new firmware must include the OTA code. Upload a sketch without ArduinoOTA.handle() and you have removed your own way back in." },

      { t: "h", text: "Method 2: HTTP OTA from a server" },
      { t: "p", text: "For a fleet, devices **pull** updates. Each device periodically fetches a small manifest (for example a JSON file with the latest version number and the firmware URL), compares it with its own version, and if newer, downloads the binary and writes it to the other slot using the core's **Update** library, usually through the **HTTPUpdate** wrapper. A static file server or an object store is enough; no special software is needed. The binary is the `.bin` file arduino-cli writes to the build directory (use `arduino-cli compile --export-binaries`)." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. Pull-based HTTPS OTA with version check
// and rollback: a new image must prove it can reach the network before it is kept.
#include <WiFi.h>
#include <WiFiClientSecure.h>    // in core 3.x WiFiClientSecure is the NetworkClientSecure class
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <ArduinoJson.h>
#include "esp_ota_ops.h"
#include "secrets.h"             // WIFI_SSID, WIFI_PASS, MANIFEST_URL, ROOT_CA (PEM text)

const int FW_VERSION = 7;        // bump for every release

// Tell the core not to mark a new image valid at boot; we decide later.
// extern "C" is essential: the core's weak default is a C function, and without it
// this C++ definition gets a different (mangled) name and silently never replaces it.
extern "C" bool verifyRollbackLater() { return true; }

bool pendingVerify() {
  esp_ota_img_states_t st;
  return esp_ota_get_state_partition(esp_ota_get_running_partition(), &st) == ESP_OK &&
         st == ESP_OTA_IMG_PENDING_VERIFY;
}

void checkForUpdate() {
  WiFiClientSecure tls;
  tls.setCACert(ROOT_CA);                         // verify the server, needs correct time
  HTTPClient http;
  if (!http.begin(tls, MANIFEST_URL)) return;     // manifest: {"version":8,"url":"https://.../fw-8.bin"}
  if (http.GET() != HTTP_CODE_OK) { http.end(); return; }
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, http.getStream());
  http.end();
  if (err || !doc["version"].is<int>() || !doc["url"].is<const char *>()) return;
  if (doc["version"].as<int>() <= FW_VERSION) return;          // never downgrade

  Serial.printf("Updating %d -> %d\n", FW_VERSION, doc["version"].as<int>());
  httpUpdate.rebootOnUpdate(true);
  t_httpUpdate_return r = httpUpdate.update(tls, doc["url"].as<const char *>());
  if (r == HTTP_UPDATE_FAILED) {
    Serial.printf("Update failed: %s\n", httpUpdate.getLastErrorString().c_str());
  }
}

void setup() {
  Serial.begin(115200);
  Serial.printf("Firmware %d%s\n", FW_VERSION, pendingVerify() ? " (on trial)" : "");
  configTzTime("IST-5:30", "in.pool.ntp.org", "pool.ntp.org");   // TLS needs real time
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

void loop() {
  static uint32_t bootMs = millis(), lastCheck = 0;
  tm now;
  bool online = WiFi.status() == WL_CONNECTED && getLocalTime(&now, 0);

  if (pendingVerify()) {
    if (online) {
      esp_ota_mark_app_valid_cancel_rollback();   // health check passed: keep this image
      Serial.println("New firmware confirmed");
    } else if (millis() - bootMs > 120000) {
      Serial.println("No network for 2 min on new firmware: rolling back");
      esp_ota_mark_app_invalid_rollback_and_reboot();
    }
    return;                                       // do nothing risky while on trial
  }
  if (online && (lastCheck == 0 || millis() - lastCheck > 6UL * 3600 * 1000)) {
    lastCheck = millis();                         // check every 6 hours
    checkForUpdate();
  }
}`, caption: "Rollback needs CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE, which the prebuilt Arduino-ESP32 3.3 libraries enable (checked in the core's sdkconfig)." },

      { t: "h", text: "How rollback works" },
      { t: "p", text: "After an OTA write, the new slot is marked **new**. On its first boot the bootloader changes that to **pending verify** and runs it. The application now has one chance to declare itself healthy with `esp_ota_mark_app_valid_cancel_rollback()`. If it crashes, hangs until the watchdog resets it, or calls `esp_ota_mark_app_invalid_rollback_and_reboot()`, then on the next boot the bootloader sees an image still pending verification, marks it **aborted**, and boots the previous slot. A firmware that cannot even reach `setup()` therefore cannot keep itself installed." },
      { t: "p", text: "In Arduino-ESP32 3.3, `initArduino()` handles this for you by default: if the image is pending verification, it calls a weak function `verifyOta()` (which returns true unless you override it) and marks the app valid before `setup()` runs. That protects against images that crash during start-up only. The sketch above overrides the weak `verifyRollbackLater()` to return true (declared `extern \"C\"`, because the core defines it in a C file; a plain C++ definition compiles but is never called), which tells the core to skip that step, and makes the decision itself after a real health check: Wi-Fi up and valid time. Choose a health check that proves the device can receive its *next* update; an image that boots but cannot connect is still bricked from the fleet's point of view." },

      { t: "h", text: "Basic device security" },
      { t: "p", text: "Connected devices are attacked constantly and automatically. You do not need to be a security specialist to avoid the common failures, which are nearly all about credentials and unverified connections." },
      { t: "list", items: [
        "**No credentials in source code or Git.** Put Wi-Fi passwords, MQTT passwords, API tokens and OTA passwords in a `secrets.h` that is listed in `.gitignore`, and commit a `secrets.example.h` with placeholders. Better still, provision them into NVS (module i10) so the firmware binary holds no secrets at all. If a secret has ever been pushed to GitHub, consider it public: change it, because deleting the commit does not remove copies.",
        "**One credential per device.** If every device shares one MQTT password, one stolen board exposes the fleet. Give each device its own username (from its MAC address) and an ACL that lets it write only to its own topics.",
        "**Verify servers with TLS.** Use `WiFiClientSecure` (in core 3.x, an alias of `NetworkClientSecure`) with `setCACert(ROOT_CA)`, where ROOT_CA is the PEM text of the certificate authority that issued your server's certificate. `setInsecure()` encrypts but accepts anyone pretending to be your server, including a fake update server.",
        "**Time first.** Certificate checks need the current date; sync NTP before connecting with TLS, or validation fails (or an expired certificate is accepted if the clock thinks it is 1970).",
        "**Never trust an update you have not verified.** HTTPS with a CA check authenticates the server. Signing the firmware itself (ESP-IDF Secure Boot V2, or signature checks in the updater) authenticates the image even if the server is compromised.",
        "**Close what you do not use.** No unauthenticated web servers on deployed devices, no open ArduinoOTA, no debug commands over serial in production builds.",
      ] },
      { t: "snippet", lang: "bash", code: String.raw`# One-time setup in a sketch repository
printf 'secrets.h\nbuild/\n' >> .gitignore
cp secrets.example.h secrets.h        # then edit secrets.h with real values
git status                            # secrets.h must NOT appear as a new file

# Check what a server's certificate chain is, to find the root CA to embed
openssl s_client -connect updates.example.com:443 -showcerts </dev/null | grep -E "s:|i:"`, caption: "The last line prints each certificate's subject (s:) and issuer (i:); the top issuer is the root CA." },

      { t: "deep", title: "What the TLS check actually verifies", blocks: [
        { t: "p", text: "When the ESP32 connects, the server presents a chain: its own certificate (for updates.example.com), signed by an intermediate CA, signed by a root CA. mbedTLS on the ESP32 checks that each signature is valid, that the chain ends at the ROOT_CA you gave it, that each certificate is within its validity dates, and that the server's name matches. Only then does the key exchange proceed. Pinning the root CA rather than the server certificate means routine server certificate renewals (every 90 days with Let's Encrypt) do not break your devices; root CAs last for decades but do change, so ship a mechanism to update them." },
        { t: "p", text: "The ESP32 core also ships a bundle of common root certificates (the `x509_crt_bundle`), which `setCACertBundle()` uses so a device can talk to many public HTTPS services. For your own update server, embedding exactly one root is tighter: fewer authorities can impersonate it." },
        { t: "p", text: "A stronger model, used by AWS IoT and Azure IoT Hub, is **mutual TLS**: each device also holds a private key and certificate, and the server checks the device. The private key then becomes the most valuable secret on the device; ESP32 flash encryption and the Digital Signature peripheral on newer chips (ESP32-S3, C3, C6) exist to protect it." },
      ] },
      { t: "deep", title: "Secure boot, flash encryption and the update chain", blocks: [
        { t: "p", text: "Anyone with physical access and a USB cable can read an unprotected ESP32's flash with esptool, extracting the firmware and any secrets in NVS, or write their own firmware. ESP-IDF offers two hardware features against this. **Secure Boot V2** makes the ROM bootloader verify an RSA or ECDSA signature on the bootloader and on each app image, so only images signed with your private key run; OTA images must be signed too. **Flash encryption** encrypts flash contents with a key stored in eFuses that software cannot read, so a dumped flash is useless." },
        { t: "p", text: "Both burn one-time eFuses and can permanently lock a board if done wrong, so practise on a spare module and follow Espressif's guide for your chip and IDF version exactly. They require building with ESP-IDF (or the Arduino core as an IDF component) rather than the prebuilt Arduino libraries. For coursework, understand the chain; for a product, use it." },
        { t: "formula", text: String.raw`Trust chain for a secured update:
ROM (immutable) → verifies bootloader signature (Secure Boot V2)
bootloader      → verifies app signature, honours otadata and rollback
running app     → fetches manifest over TLS (server verified by ROOT_CA)
                → downloads image, Update library checks length and checksum
                → next boot: bootloader verifies the new image's signature
                → app health check → mark valid, or roll back`, caption: "Each link checks the next; a gap anywhere is where an attacker gets in." },
      ] },
    ],
    mistakes: [
      "**Uploading a firmware that leaves out the OTA code.** The next update needs a USB cable.",
      "**Using huge_app or no_ota partitions and expecting OTA to work.** OTA needs two app slots.",
      "**Leaving ArduinoOTA without a password.** Anyone on the network can replace your firmware.",
      "**Marking a new image valid before checking it can reach the network.** A firmware that boots but cannot connect can never be updated again.",
      "**Committing secrets.h, or a token in a sketch, to GitHub.** Rotate the credential; deleting the commit is not enough.",
      "**Calling setInsecure() on the update connection.** A fake server could then install any firmware.",
      "**Connecting with TLS before NTP has set the clock.** Certificate date checks fail or become meaningless.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: a data logger that survives network loss and updates over the air.",
      steps: [
        "Start from the store-and-forward sketch of the previous lesson. Add ArduinoOTA with a password, upload once over USB, then upload a change over the network with arduino-cli.",
        "Add the HTTP OTA code. Serve a manifest.json and the exported .bin from a laptop (for a first test, `python3 -m http.server 8000` with plain HTTP and a NetworkClient, then move to HTTPS with a real certificate).",
        "Release version 8 by bumping FW_VERSION, exporting the binary and updating the manifest. Confirm the device updates itself within one check interval and keeps logging, with no gap in the dashboard.",
        "Release a deliberately broken version 9 that never connects to Wi-Fi (wrong SSID constant). Confirm it rolls back to version 8 after two minutes, and that queued readings are still uploaded afterwards.",
        "Move all credentials into secrets.h, add it to .gitignore, and show with `git status` that it is not tracked. Write two sentences on what an attacker with the device in hand could still extract, and which feature would stop them.",
      ],
    },
    quiz: [
      {
        q: "Power fails halfway through downloading an OTA image. What happens on the next boot with the default two-slot table?",
        options: [
          "The device is bricked and needs USB",
          "It boots the old firmware, because otadata is only switched after the new image is complete and verified",
          "It boots the half-written image",
          "It formats the file system",
        ],
        answer: 1,
        why: "The new image is written to the inactive slot, and the boot selection changes only at the end. Until then, the old slot remains the one to boot.",
      },
      {
        q: "Why does an OTA-capable ESP32 with 4 MB of flash limit a sketch to about 1.25 MB?",
        options: [
          "The bootloader needs 2 MB",
          "The ESP32 cannot address more",
          "Two equal application slots are needed so the new image can be written while the old one runs",
          "LittleFS reserves it",
        ],
        answer: 2,
        why: "Default table: app0 and app1 are each 0x140000 bytes, with the rest for NVS, otadata, the file system and core dumps.",
      },
      {
        q: "A new firmware image boots, but it has a bug that stops it joining Wi-Fi. With the lesson's sketch, what happens?",
        options: [
          "It stays installed forever",
          "The core marks it valid at boot, so it stays",
          "After two minutes still pending verification, the app marks itself invalid and the bootloader returns to the previous firmware",
          "The server pushes the old firmware back",
        ],
        answer: 2,
        why: "verifyRollbackLater() makes the app decide. Without network within 2 minutes it calls esp_ota_mark_app_invalid_rollback_and_reboot().",
      },
      {
        q: "What is wrong with using setInsecure() on the connection that downloads firmware?",
        options: [
          "It makes the download slower",
          "Nothing, because the traffic is still encrypted",
          "It disables the Update library's checksum",
          "The device no longer verifies who the server is, so an impersonating server could deliver any firmware",
        ],
        answer: 3,
        why: "Encryption without authentication protects against eavesdropping, not impersonation. The CA check proves the server's identity.",
      },
      {
        q: "A student accidentally pushed secrets.h with the lab's MQTT password to a public repository, then deleted it in the next commit. What should be done?",
        options: [
          "Nothing more: it is deleted",
          "Change the password on the broker, because copies of the old commit may already exist",
          "Make the repository private and keep the password",
          "Rename the file",
        ],
        answer: 1,
        why: "Git history, forks and scrapers keep old commits. A leaked secret must be rotated.",
      },
    ],
  },
};

export default lessons;
