import type { ModuleContent } from "../model/curriculum";

/**
 * Module a7: Firmware engineering.
 * Checked against: Arduino-ESP32 core 3.3.10 (ESP-IDF 5.5 based; its sdkconfig.h,
 * esp32-hal-misc.c rollback hooks, Update library and default partition table),
 * the AVR core for arduino:avr:uno, and Unity v2.6.x.
 * Every complete sketch was compiled with arduino-cli for esp32:esp32:esp32 or
 * arduino:avr:uno; the Unity test was built with cc and run on a host; the
 * backtrace example was decoded with the core's xtensa-esp32-elf-addr2line.
 */
const lessons: ModuleContent = {
  // ─────────────────────────────────────────────────────────────────────────
  "a7-layered-architecture-and-hal": {
    id: "a7-layered-architecture-and-hal",
    outcomes: [
      "Explain why product firmware is built in layers and state the dependency rule between them",
      "Design a hardware abstraction layer and a device driver whose logic can run without the hardware",
      "Choose between function-pointer, link-time and C++ interface seams for swapping hardware",
      "Lay out a firmware repository so that board details live in one place",
    ],
    blocks: [
      { t: "h", text: "From prototype to product" },
      { t: "p", text: "In the intermediate tier you wrote firmware as one sketch: `setup()`, `loop()`, a state machine (i6) and later a handful of FreeRTOS tasks (a5). That is the right shape for a prototype. A product is different in four ways. It lives for years, so other people will change it. It ships in thousands, so it must be updated in the field without a USB cable. It fails in places you cannot see, so it must tell you what went wrong. And it often runs on more than one board revision, so the same logic must survive a change of pins, sensor or even microcontroller. **Firmware engineering** is the set of practices that make those four things possible. This module covers them in order: structure (this lesson), updates, testing, debugging and analysis, and finally power and fault tolerance." },
      { t: "p", text: "Structure comes first because every other practice depends on it. You cannot unit test a function that writes straight to a GPIO register, you cannot port a driver that calls `Wire.beginTransmission()` from inside its maths, and you cannot reason about a crash in a 3000 line `loop()`. Layering is how you get code that can be tested, ported and read." },

      { t: "h", text: "The layers" },
      { t: "diagram", text: String.raw`┌───────────────────────────────────────────────┐
│ Application    state machines, control laws,  │  knows WHAT the product does
│                business rules, user interface │
├───────────────────────────────────────────────┤
│ Services       logging, storage, OTA, comms,  │  reusable across products
│                scheduler or RTOS wrappers     │
├───────────────────────────────────────────────┤
│ Device drivers TMP102, motor driver, display  │  knows ONE external chip
├───────────────────────────────────────────────┤
│ HAL            gpio, i2c, spi, uart, timer,   │  knows ONE microcontroller
│                adc: small, chip-neutral API   │
├───────────────────────────────────────────────┤
│ BSP / config   pin map, clock, which bus each │  knows ONE board
│                device sits on                 │
├───────────────────────────────────────────────┤
│ Vendor SDK and registers  (ESP-IDF, avr-libc) │
└───────────────────────────────────────────────┘
     calls go DOWN only; data comes back UP`, caption: "A conventional firmware stack. Each layer may call only the layer below it." },
      { t: "p", text: "The **dependency rule** is the whole idea: a layer may call only the layer below it, never above, and never skip down to registers. The application does not know there is an I2C bus; it asks a driver for a temperature. The driver does not know which microcontroller it runs on; it asks the HAL to read two bytes from address 0x48. The HAL does not know which board it is on; the **board support package** (BSP) tells it that the sensor bus uses GPIO 21 and 22 at 400 kHz. Change the board and you edit the BSP. Change the microcontroller and you rewrite the HAL. Change the sensor and you write one new driver. The application never changes for any of these." },
      { t: "p", text: "You have used a HAL since your first sketch. `digitalWrite(13, HIGH)` is a HAL call: on an Uno it becomes a write to `PORTB`, on an ESP32 it becomes a write to `GPIO_OUT_W1TS_REG`. The Arduino API is a thin, portable HAL with a fixed board layer (the variant files). ESP-IDF is layered more strictly: the `soc` component describes registers, the `hal` component holds chip-neutral low-level functions, `esp_driver_*` components add locking and interrupts, and your code calls the driver. Professional firmware usually adds its own thin HAL on top of the vendor SDK so that the product code depends on an interface the team controls, not on a vendor API that changes between major versions." },

      { t: "h", text: "Designing a HAL interface" },
      { t: "p", text: "A good HAL is small and boring. It exposes what the drivers need and nothing more: for I2C, a function to write bytes, read bytes and do a write-then-read with a repeated start. It reports errors as return codes rather than printing them. It takes no global state from the caller; everything it needs arrives as arguments or lives behind a handle. And it never blocks forever: every bus operation has a timeout, because a stuck SDA line is a field failure you will meet." },
      { t: "p", text: "The key design question is how a driver gets hold of the HAL, because that choice decides whether you can replace the real hardware with a fake one in a test. That replacement point is called a **seam**. There are three common seams in C and C++." },
      { t: "table", head: ["Seam", "How it works", "Cost", "Good for"], rows: [
        ["Function pointers (an interface struct)", "The driver receives a struct of pointers; real and fake buses fill it differently", "One indirect call per operation, a few bytes of RAM", "Drivers that must work on several buses or boards at run time"],
        ["Link time", "The same header, two `.c` files: `i2c_esp32.c` for the target, `i2c_fake.c` for tests; the build picks one", "Zero at run time", "Whole-HAL replacement on host builds"],
        ["C++ abstract class", "The driver holds an `I2cBus&`; real and fake classes override virtual methods", "One virtual call, a vtable pointer per object", "C++ code bases, GoogleTest mocks"],
      ], caption: "Seams for swapping hardware. All three are used in industry; pick one per project and be consistent." },

      { t: "h", text: "A driver with no hardware inside it" },
      { t: "p", text: "Here is a complete driver for the TI TMP102 temperature sensor, written against a one-function bus interface. The TMP102 returns its reading from register 0x00 as two bytes: a 12-bit two's-complement value, left-aligned, at 0.0625 °C per least significant bit. The driver's job is exactly that conversion and nothing else." },
      { t: "snippet", lang: "c", code: String.raw`/* tmp102.h : the driver's public face */
#ifndef TMP102_H
#define TMP102_H
#include <stdint.h>

/* The only thing the driver knows about the hardware: one function pointer. */
typedef struct {
  /* Read len bytes from register reg of device addr. Returns 0 on success. */
  int (*read_reg)(void *ctx, uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t len);
  void *ctx;
} i2c_bus_t;

enum { TMP102_OK = 0, TMP102_ERR_BUS = -1 };

/* Temperature in milli-degrees Celsius. */
int tmp102_read_mC(const i2c_bus_t *bus, uint8_t addr, int32_t *out_mC);
#endif

/* tmp102.c */
#include "tmp102.h"

int tmp102_read_mC(const i2c_bus_t *bus, uint8_t addr, int32_t *out_mC) {
  uint8_t b[2];
  if (bus->read_reg(bus->ctx, addr, 0x00, b, 2) != 0) return TMP102_ERR_BUS;
  int16_t raw = (int16_t)(((uint16_t)b[0] << 8) | b[1]); /* 12-bit value, left aligned */
  raw /= 16;                         /* drop the 4 unused bits, sign kept */
  *out_mC = (int32_t)raw * 625 / 10; /* 0.0625 degC per LSB = 62.5 mC */
  return TMP102_OK;
}`, caption: "A portable driver. It compiles unchanged for the ESP32, the Uno or a laptop." },
      { t: "p", text: "Notice the decisions. The result is an integer in milli-degrees, not a `float`, so it is exact, cheap on an Uno, and easy to compare in a test. The division by 16 is used instead of `raw >> 4` because right-shifting a negative signed number is implementation-defined in C; division is defined and the compiler turns it into the same instruction anyway. The output is written only on success, so a caller that ignores the error still holds its last good value. And the function does exactly one thing; deciding what to do with a failed reading belongs to the layer above." },
      { t: "p", text: "**Worked check.** If the sensor returns bytes 0x19 0x00, the 16-bit word is 0x1900. Divided by 16 that is 0x190 = 400 counts. 400 × 62.5 = 25 000 m°C = 25.0 °C. For 0xE7 0x00 the word is 0xE700, which as a signed 16-bit number is −6400; divided by 16 that is −400, giving −25.0 °C. Both match the datasheet's example table, and both are tested in lesson 3." },
      { t: "p", text: "On the target, the BSP provides the real bus function, a few lines that call the Arduino `Wire` library or the ESP-IDF I2C master driver:" },
      { t: "snippet", lang: "cpp", code: String.raw`// bsp_esp32.cpp : the only file that knows about Wire and pins
#include <Wire.h>
extern "C" {
#include "tmp102.h"
}

static int wire_read_reg(void *ctx, uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t len) {
  TwoWire *w = static_cast<TwoWire *>(ctx);
  w->beginTransmission(addr);
  w->write(reg);
  if (w->endTransmission(false) != 0) return -1;          // repeated start
  if (w->requestFrom(addr, len) != len) return -1;
  for (uint8_t i = 0; i < len; i++) buf[i] = w->read();
  return 0;
}

i2c_bus_t sensor_bus = { wire_read_reg, &Wire };

void bsp_init() {
  Wire.begin(21, 22, 400000);   // SDA, SCL, clock: board facts live here only
  Wire.setTimeOut(20);          // never hang on a stuck bus
}`, caption: "The board layer adapts the vendor API to the driver's interface." },

      { t: "h", text: "Laying out the repository" },
      { t: "p", text: "Folders make the layers visible and let the build enforce them. A layout that works with both arduino-cli (via a library folder) and ESP-IDF (via components) is shown below. The test folder is built on your laptop and never sees `Wire.h`; if a driver accidentally includes it, the host build fails, which is exactly the alarm you want." },
      { t: "diagram", text: String.raw`firmware/
├── app/            node.c, state machine, no hardware headers
├── drivers/        tmp102.c/.h, motor.c/.h  (C, portable)
├── hal/            hal_i2c.h, hal_gpio.h    (interfaces only)
├── bsp/
│   ├── esp32_devkit/   bsp.cpp: Wire, pins, clocks
│   └── uno/            bsp.cpp
├── test/           test_tmp102.c, fakes, Makefile (host only)
└── .github/workflows/firmware.yml`, caption: "One folder per layer; the test build includes everything except bsp/." },
      { t: "note", kind: "tip", text: "Keep the application free of `delay()` and of direct timing calls. Pass time in as an argument (`node_step(now_ms, reading)`), exactly as the state machines in i6 did. Then time is just another input you control in a test." },

      { t: "h", text: "What not to abstract" },
      { t: "p", text: "Layers cost something: more files, an indirect call, and the temptation to build a framework instead of a product. Abstract the things that genuinely vary or that you must fake to test: buses, GPIO, time, storage, the network. Do not wrap things that never change, and do not design a HAL for chips you might use one day. A HAL with forty functions, of which a product uses six, is a liability. Start with the functions your drivers call today and grow the interface when a second user needs something new." },
      { t: "p", text: "Equally, timing-critical paths sometimes have to break the rule on purpose. A 20 kHz motor-commutation interrupt may write registers directly because a call through two layers costs too many cycles. That is fine if it is deliberate, confined to one file in the BSP, and commented with the reason. An exception you can name is engineering; an exception you did not notice is a mess." },

      { t: "deep", title: "What an indirect call costs, in cycles", blocks: [
        { t: "p", text: "On the ESP32's Xtensa LX6 a direct `call8` and an indirect `callx8` through a register each take a few cycles; the difference is the load of the function pointer from RAM, typically one or two cycles from internal SRAM. At 240 MHz that is under 10 ns. On an ATmega328P at 16 MHz, an `icall` takes 3 cycles against 4 for `call`, plus two loads of the pointer (about 4 cycles), so roughly 0.25 µs extra. An I2C byte at 400 kHz takes 22.5 µs. The abstraction is therefore about one per cent of the cost of even one byte on the bus; it is invisible. Where it does matter is in tight inner loops that run millions of times a second, such as a software DSP filter, and there you should not be calling through a HAL at all." },
        { t: "p", text: "The less obvious cost of function pointers is that the compiler can no longer inline or remove unused code across the seam, and static analysers lose track of what is called. Link-time seams avoid both, which is why many safety-related code bases prefer them: the shipped binary contains direct calls only." },
      ] },
      { t: "deep", title: "Weak symbols as a link-time seam", blocks: [
        { t: "p", text: "GCC lets you mark a function `__attribute__((weak))`. If another object file defines a normal (strong) function with the same name, the linker uses that one and silently drops the weak one. The Arduino-ESP32 core uses this in exactly the way you will in lesson 2: it defines `bool verifyRollbackLater()` as weak, returning false, and your sketch can define its own version returning true. The core calls the function without knowing which one it gets." },
        { t: "p", text: "You can use the same trick for a test double: define the real `hal_i2c_read()` as weak in the HAL, and a strong fake in the test build. The danger is that a typo in the strong name compiles cleanly and the weak default runs instead. Guard against it with a test that would fail if the default ran." },
      ] },
      { t: "deep", title: "Static allocation and why products avoid malloc after start-up", blocks: [

        { t: "p", text: "Lesson a5 showed heap fragmentation: a long-running device that allocates and frees blocks of different sizes can find, after weeks, that no contiguous block is large enough even though plenty of memory is free. Product firmware usually allocates everything at start-up (driver objects, queues, buffers) and then never calls `malloc` or `new` again, or uses fixed-size pools. FreeRTOS supports this with the `...Static` creation functions such as `xTaskCreateStatic`. MISRA C (lesson 4) makes the same rule formal. A driver like the TMP102 one above, which takes its context by pointer and allocates nothing, fits this style naturally." },
        { t: "p", text: "Static allocation also makes memory use visible at build time: the RAM figure arduino-cli prints after compiling then covers nearly everything the program will ever use, apart from stacks. A product team can set a budget (say 70% of RAM) and fail the CI build when a change exceeds it, instead of discovering the shortage as a rare crash in the field." },
      ] },
    ],
    mistakes: [
      "**Letting the application include vendor headers.** One `#include <Wire.h>` in app code welds the product to one SDK and breaks the host test build.",
      "**Putting pin numbers in drivers.** Pins are board facts; they belong in the BSP. A driver that hard-codes GPIO 21 cannot be reused on a board that routes the sensor elsewhere.",
      "**HAL calls with no timeout.** A bus that can hang forever turns one noisy cable into a frozen product. Every blocking HAL call needs a bound.",
      "**Abstracting everything.** Wrapping a function that never varies adds indirection, documentation and test burden for no benefit.",
      "**Printing errors deep in a driver.** The driver cannot know whether a failure matters; return a code and let the application decide.",
      "**Right-shifting signed values.** `raw >> 4` on a negative `int16_t` is implementation-defined. Divide, or shift an unsigned copy and sign-extend explicitly.",
    ],
    practice: {
      kind: "bench",
      task: "Restructure an earlier sensor project (from i8 or i11) into layers, without changing its behaviour.",
      steps: [
        "List every place the current sketch touches hardware: pins, Wire or SPI calls, analogRead, millis, delay. Each one belongs in the BSP or behind a HAL function.",
        "Write one driver for the sensor you use, in plain C, with a bus interface struct like the TMP102 example. It must not include any Arduino or ESP-IDF header.",
        "Move pin numbers, bus speeds and the bus adapter function into a bsp file. Make the application take time and readings as arguments.",
        "Compile the driver on your laptop with `cc -std=c11 -Wall -Wextra -c drivers/yoursensor.c`. If it fails because of a hardware header, the layering is broken; fix it.",
        "Build and upload for the board and confirm the readings are identical to the old sketch. Record the flash and RAM figures before and after; the difference should be a few hundred bytes at most.",
      ],
    },
    quiz: [
      {
        q: "Under the dependency rule, which call is allowed?",
        options: [
          "The application calls Wire.requestFrom() to read the sensor quickly",
          "The TMP102 driver calls the HAL's i2c read function",
          "The HAL calls the application's error handler when the bus fails",
          "The driver reads the GPIO input register to check the sensor's alert pin",
        ],
        answer: 1,
        why: "Each layer may call only the layer below it. The driver calling the HAL is a downward call. The application skipping to Wire, the HAL calling upward, and the driver going straight to registers all break the rule.",
      },
      {
        q: "The TMP102 returns 0xFF 0x00. What temperature does the driver report?",
        options: ["+4080 m°C", "−1000 m°C", "−62 m°C", "−16 m°C"],
        answer: 1,
        why: "0xFF00 as a signed 16-bit value is −256. Divided by 16 that is −16 counts, and −16 × 62.5 = −1000 m°C, which is −1.0 °C. Reading −16 forgets the scale; +4080 forgets the sign.",
      },
      {
        q: "You move a working product from an ESP32 DevKit to a custom board where the sensor bus uses GPIO 4 and 5. In a well-layered code base, what changes?",
        options: [
          "The application and the driver",
          "Only the BSP (board configuration)",
          "The HAL and the driver",
          "Everything, because pins are used everywhere",
        ],
        answer: 1,
        why: "Pin assignments are board facts and live only in the BSP. The microcontroller is the same, so the HAL is unchanged, and the driver and application never knew the pins.",
      },
      {
        q: "Which seam leaves no run-time cost in the shipped firmware?",
        options: [
          "An interface struct of function pointers",
          "A C++ abstract base class with virtual methods",
          "A link-time seam: the build picks the real or the fake .c file",
          "A global flag checked inside each HAL function",
        ],
        answer: 2,
        why: "A link-time seam swaps whole implementations at build time, so the target binary contains ordinary direct calls. Function pointers and virtual calls add an indirect call; a run-time flag adds a branch and dead code.",
      },
      {
        q: "Why does the driver write *out_mC only when the bus read succeeds?",
        options: [
          "To save a store instruction",
          "Because MISRA forbids writing to pointers",
          "So a caller that ignores the error still holds its last valid reading rather than garbage",
          "Because the bus function writes it instead",
        ],
        answer: 2,
        why: "On failure the buffer contents are undefined. Leaving the output untouched means the caller's previous good value survives, and the error code tells a careful caller what happened.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "a7-bootloaders-partitions-and-ota": {
    id: "a7-bootloaders-partitions-and-ota",
    outcomes: [
      "Trace the ESP32 boot chain from ROM to application and the Uno's boot through Optiboot",
      "Read and design an ESP32 partition table for A/B over-the-air updates",
      "Implement an OTA update that validates itself after reboot and rolls back on failure",
      "Explain image signing and Secure Boot v2 in outline, and what each protects against",
    ],
    blocks: [
      { t: "h", text: "What a bootloader is for" },
      { t: "p", text: "A **bootloader** is the small program that runs after reset and before your application. It has two jobs. First, it decides which application image to run and checks that the image is intact. Second, it gives you a way to put a new image in flash without a hardware programmer. Every Arduino you have used has had one: that is how a USB cable can reprogram the chip. In a product the bootloader carries a third job: it is the last line of defence when an update goes wrong, so it must itself never be updated casually, and it must be able to fall back to a known good image." },

      { t: "h", text: "The Uno: Optiboot" },
      { t: "p", text: "The ATmega328P on an Uno ships with **Optiboot**, a bootloader of 512 bytes that lives in the top of the 32 KB flash. The `BOOTRST` fuse makes the chip start at the bootloader instead of address 0, and the `BOOTSZ` fuses set the size of the boot section; only code running there may execute the `SPM` instruction that writes flash. That is why the sketch limit is 32 256 bytes, not 32 768: 32 768 − 512 = 32 256." },
      { t: "p", text: "When you click Upload, the USB-serial chip pulses the reset line (via DTR and a 100 nF capacitor). Optiboot starts, listens on the UART at 115 200 baud for about a second for the STK500 protocol, receives pages of 128 bytes, writes them with `SPM`, and then jumps to address 0. If nothing arrives, it jumps straight to your sketch. There is no second slot and no fallback: an interrupted upload leaves a broken sketch, and you simply upload again. For a device on your desk that is fine. For a device bolted to a water tank 2 km away it is not, which is why field-updatable products use chips with more flash and a proper A/B scheme." },

      { t: "h", text: "The ESP32 boot chain" },
      { t: "diagram", text: String.raw`reset
  │
  ▼
ROM bootloader (in silicon, cannot change)
  │  strapping pins: GPIO0 low → download mode (esptool)
  │  otherwise load second stage from flash 0x1000
  ▼
second-stage bootloader  (flash 0x1000, about 25 KB)
  │  read partition table at 0x8000
  │  read otadata: which app slot is current, and its state
  │  verify image header, checksum and SHA-256 (and signature if secure boot)
  ▼
application  (ota_0 or ota_1, or factory)
     app_main() → Arduino's setup()/loop() task`, caption: "Three stages. Only the last two live in flash and can change." },
      { t: "p", text: "The **ROM bootloader** is fixed in the chip. It checks the strapping pins: holding GPIO0 low at reset puts the chip into serial download mode, which is what esptool (and the Arduino upload button) uses. Otherwise it loads the **second-stage bootloader** from flash offset 0x1000 on the original ESP32. That second stage reads the **partition table** at 0x8000, decides which application to run, verifies it and jumps to it. Because the second stage is ordinary code built with ESP-IDF, its behaviour is configurable: rollback, signature checking and anti-rollback are all bootloader options." },

      { t: "h", text: "Partition tables" },
      { t: "p", text: "The partition table divides the flash chip into named regions. It is a CSV file at build time, compiled to a binary of up to 3 KB. This is the default table used by Arduino-ESP32 3.3 for a 4 MB ESP32 (the \"Default 4MB with spiffs\" scheme):" },
      { t: "snippet", lang: "text", code: String.raw`# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x140000,
app1,     app,  ota_1,   0x150000,0x140000,
spiffs,   data, spiffs,  0x290000,0x160000,
coredump, data, coredump,0x3F0000,0x10000,`, caption: "tools/partitions/default.csv in the installed esp32 core 3.3.10." },
      { t: "table", head: ["Partition", "Size", "Purpose"], rows: [
        ["nvs", "20 KB", "Non-volatile storage: Wi-Fi credentials, Preferences, calibration"],
        ["otadata", "8 KB", "Two sectors recording which OTA slot to boot and its state"],
        ["app0 / app1", "1.25 MB each", "Two application slots for A/B updates"],
        ["spiffs", "1.375 MB", "A file system (SPIFFS or LittleFS)"],
        ["coredump", "64 KB", "Where a crash dump is saved for later analysis (lesson 4)"],
      ] },
      { t: "p", text: "Check the arithmetic: 0x140000 = 1 310 720 bytes, which is exactly the \"Maximum is 1310720 bytes\" that arduino-cli prints for every ESP32 sketch. Application partitions must start on a 64 KB (0x10000) boundary because the cache maps flash into the address space in 64 KB pages; 0x10000 and 0x150000 both are. The last partition ends at 0x3F0000 + 0x10000 = 0x400000 = 4 MB, so the table fills the chip exactly. If your image outgrows 1.25 MB you choose a scheme with bigger slots and a smaller file system; you do not give up the second slot." },

      { t: "h", text: "A/B updates and rollback" },
      { t: "p", text: "With two slots, an update never overwrites the code that is running. Suppose the device runs from app0. The new image downloads into app1 while app0 keeps working. Only after the whole image has arrived and its SHA-256 has been checked does the firmware write otadata to say \"boot app1 next\". If the power fails during download, otadata still points at app0 and nothing is lost. This property, that every instant of the update leaves at least one bootable image, is the definition of a **fail-safe update**." },
      { t: "p", text: "A complete image can still be a bad image: it boots, then crashes in a loop, or it runs but can no longer join Wi-Fi, which means it can never receive the fix. **Rollback** handles this. With `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` (which the Arduino-ESP32 3.3 prebuilt libraries have switched on), each slot carries a state in otadata:" },
      { t: "diagram", text: String.raw`            Update.end() / esp_ota_set_boot_partition()
                         │
                         ▼
                      ┌─────┐  bootloader boots it once
                      │ NEW │──────────────────────────┐
                      └─────┘                          ▼
                                             ┌──────────────────┐
                 esp_ota_mark_app_valid_     │  PENDING_VERIFY  │
           ┌──── cancel_rollback() ──────────│  (on trial)      │
           ▼                                 └──────────────────┘
       ┌───────┐                                │            │
       │ VALID │      reset before confirming ──┘            │ mark_app_invalid_
       └───────┘      bootloader sets ABORTED,               │ rollback_and_reboot()
                      boots the previous slot                ▼
                                                      ┌─────────┐
                                                      │ INVALID │ previous slot boots
                                                      └─────────┘`, caption: "OTA image states with rollback enabled." },
      { t: "p", text: "The rule is simple: **a new image is on trial until it confirms itself.** If it resets for any reason (a panic, a watchdog, a power cycle) before calling `esp_ota_mark_app_valid_cancel_rollback()`, the bootloader marks it aborted and boots the old slot. The art is choosing what to check before confirming. A good self-test covers whatever the new build could break that would stop you fixing it: the network joins, the update server answers, the critical sensors respond." },
      { t: "p", text: "The Arduino-ESP32 core gives you two weak hooks (the link-time seam from lesson 1). By default `initArduino()` checks the running slot; if it is pending verification it calls `verifyOta()` (default: return true) and confirms the image at once, before `setup()` even runs. That is too early to know whether Wi-Fi works. Defining `verifyRollbackLater()` to return true tells the core to leave the decision to you:" },
      { t: "snippet", lang: "cpp", code: String.raw`// OTA update with deferred validation and automatic rollback.
// Board: ESP32 DevKit, Arduino-ESP32 3.3.x, partition scheme "Default 4MB with spiffs".
#include <WiFi.h>
#include <HTTPClient.h>
#include <Update.h>
#include "esp_ota_ops.h"

const char *WIFI_SSID = "lab-ap";
const char *WIFI_PASS = "change-me";
const char *FW_URL    = "http://192.168.1.10:8000/firmware.bin";
const char *VER_URL   = "http://192.168.1.10:8000/version.txt";
const int   FW_VERSION = 3;   // bump for every release

// Tell the core NOT to mark this image valid during start-up.
// We confirm it ourselves once the self-test has passed.
bool verifyRollbackLater() { return true; }

bool selfTest() {
  // Real products check whatever the new build could break:
  // sensors answer on I2C, Wi-Fi joins, the server is reachable.
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) delay(100);
  return WiFi.status() == WL_CONNECTED;
}

void confirmOrRollBack() {
  const esp_partition_t *running = esp_ota_get_running_partition();
  esp_ota_img_states_t state;
  if (esp_ota_get_state_partition(running, &state) != ESP_OK) return;
  if (state != ESP_OTA_IMG_PENDING_VERIFY) return;   // not a fresh update
  if (selfTest()) {
    esp_ota_mark_app_valid_cancel_rollback();
    Serial.println("New image confirmed");
  } else {
    Serial.println("Self-test failed, rolling back");
    esp_ota_mark_app_invalid_rollback_and_reboot();  // does not return
  }
}

int fetchVersion() {
  HTTPClient http;
  http.begin(VER_URL);
  int v = -1;
  if (http.GET() == HTTP_CODE_OK) v = http.getString().toInt();
  http.end();
  return v;
}

bool installUpdate() {
  HTTPClient http;
  http.begin(FW_URL);
  if (http.GET() != HTTP_CODE_OK) { http.end(); return false; }
  int len = http.getSize();
  if (len <= 0 || !Update.begin(len)) { http.end(); return false; }
  size_t written = Update.writeStream(*http.getStreamPtr());
  bool ok = (written == (size_t)len) && Update.end();  // end() checks the image and sets the boot partition
  if (!ok) Serial.printf("Update failed, error %u\n", Update.getError());
  http.end();
  return ok;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("Running v%d from %s\n", FW_VERSION, esp_ota_get_running_partition()->label);
  confirmOrRollBack();
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last > 60000 && WiFi.status() == WL_CONNECTED) {
    last = millis();
    int remote = fetchVersion();
    if (remote > FW_VERSION && installUpdate()) {
      Serial.println("Rebooting into new image");
      delay(100);
      ESP.restart();
    }
  }
}`, caption: "Compiled for esp32:esp32:esp32 with core 3.3.10: about 1.04 MB, 79% of one app slot." },
      { t: "p", text: "To try it, build the sketch once with `FW_VERSION = 3` and upload it over USB. Change the number to 4, use Sketch, Export Compiled Binary (or `arduino-cli compile --output-dir out`), and serve `out/ota_rollback.ino.bin` and a `version.txt` containing 4 from your laptop with `python3 -m http.server 8000`. Within a minute the board downloads, reboots, prints `Running v4 from app1` and confirms. Then build version 5 with a deliberately wrong Wi-Fi password: it boots, fails the self-test after 15 s, and rolls back to v4 in app1's partner slot. That experiment is the core of the exit project." },
      { t: "p", text: "**Worked check: download time.** The image is 1 038 132 bytes. Over a link that sustains 50 kB/s (realistic for HTTP on a congested campus access point) the download takes 1 038 132 / 50 000 ≈ 20.8 s. Erasing the slot first adds time too: Update erases 4 KB sectors as it goes. Budget for about half a minute in which the device is busy, and make sure the watchdog and any control loop are not starved meanwhile." },
      { t: "note", kind: "warn", text: "This lab sketch uses plain HTTP and trusts whatever the server sends. Anyone on the same network could serve their own firmware. A product must at least use HTTPS with a pinned certificate, and should verify a signature on the image itself, as described next. Module a16 treats this properly." },

      { t: "h", text: "Signed images and Secure Boot v2, in outline" },
      { t: "p", text: "A checksum proves an image was not damaged; it does not prove who made it. A **digital signature** does. The build server holds a private key; it hashes the image and signs the hash. The device holds only the matching public key and checks the signature before accepting the update. An attacker without the private key cannot produce an image that passes. Arduino-ESP32's `Update` library can do this in the application (see its Signed_OTA_Update example), which protects the download path." },
      { t: "p", text: "**Secure Boot v2** goes further and protects the boot path itself. On ESP32 chips of revision 3.0 or later it uses RSA-3072 signatures (RSA-PSS). You burn the SHA-256 digest of your public key into an eFuse, a one-time-programmable bit field in the chip. From then on the ROM verifies the second-stage bootloader's signature before running it, and the bootloader verifies the application's signature before running it. An unsigned or wrongly signed image simply does not boot. It is configured in ESP-IDF menuconfig (`CONFIG_SECURE_BOOT`, version 2) and keys are made with `espsecure.py generate_signing_key --version 2`." },
      { t: "note", kind: "safety", text: "Enabling secure boot burns eFuses and is irreversible. Lose the private key and the chip can never run new firmware again. Practise on a spare board, keep the key off the device and backed up, and never enable it on a lab DevKit you want to reuse." },
      { t: "p", text: "Two related ideas complete the picture. **Anti-rollback** stores a security version number in eFuses so that an attacker cannot install an old, signed but vulnerable image. **Flash encryption** stops someone reading your firmware and secrets out of the flash chip with a programmer. Both are covered in a16; here it is enough to know they exist and that they are bootloader features, which is why the bootloader is planned at the start of a project rather than bolted on." },

      { t: "deep", title: "How otadata chooses a slot", blocks: [
        { t: "p", text: "The otadata partition holds two copies of a small record, one per 4 KB flash sector. Each record has a 32-bit sequence number, the image state, and a CRC. The bootloader reads both, ignores any with a bad CRC, and takes the valid one with the higher sequence number. The slot to boot is (seq − 1) mod (number of OTA slots), so with two slots an odd sequence selects ota_0 and an even one selects ota_1." },
        { t: "p", text: "Setting a new boot partition writes a record with seq + 1 into the sector that does not hold the current newest record. Flash is erased and written a sector at a time, so a power cut mid-write damages only the record being written; its CRC fails and the older record still points at the old slot. This alternating two-copy scheme is a standard way to make a single flag update atomic on flash, and you can reuse it for your own configuration data." },
        { t: "p", text: "If otadata is blank (both sectors erased, as after `esptool erase_flash` and a USB upload), the bootloader boots the factory partition if there is one, otherwise ota_0. That is why a fresh USB upload of an OTA-capable sketch always runs from app0." },
      ] },
      { t: "deep", title: "A failure walk-through: where can power fail?", blocks: [
        { t: "p", text: "A fail-safe claim is only as good as the list of moments you checked. Walk through every step of the update and ask what the bootloader sees if power disappears exactly there." },
        { t: "list", ordered: true, items: [
          "**During download into app1.** otadata unchanged; app0 boots. Update.begin() on the next attempt erases app1 again. Safe.",
          "**After Update.end() writes otadata, before reboot.** Next boot selects app1 in state NEW, which becomes PENDING_VERIFY. Same as a normal reboot. Safe.",
          "**During the self-test of app1.** The bootloader sees the slot still PENDING_VERIFY on the next boot and marks it ABORTED, then boots app0. The update is lost but the device works. Safe.",
          "**During esp_ota_mark_app_valid_cancel_rollback().** That call rewrites one otadata record; the two-copy scheme means either the old or the new record survives intact. Safe.",
          "**During a USB upload of the bootloader itself.** No fallback exists: the ROM finds a corrupt second stage and the board needs reflashing in download mode. This is why products never update the bootloader over the air unless the chip supports a dual bootloader scheme.",
        ] },
      ] },
    ],
    mistakes: [
      "**Confirming the image too early.** The default Arduino behaviour marks an update valid before setup() runs. If the new build breaks Wi-Fi, it has already been confirmed and can never receive the fix.",
      "**Using a partition scheme with no second app slot.** \"Huge APP\" schemes give one 3 MB slot and no OTA at all. Choose slots before the first release; changing the table later needs a USB reflash of every device.",
      "**Overwriting the running slot.** Any scheme that writes the new image over the old one has a window in which the device has no bootable firmware.",
      "**Trusting the download.** HTTP with no signature means anyone on the network can replace your firmware.",
      "**Experimenting with secure boot or eFuses on a shared board.** They are one-time programmable. A mistake makes the board useless for everyone after you.",
    ],
    practice: {
      kind: "bench",
      task: "Make an ESP32 update itself over Wi-Fi, then prove that a bad update rolls back.",
      steps: [
        "Upload the OTA sketch over USB with FW_VERSION = 3 and the Default 4MB with spiffs partition scheme. Confirm it prints Running v3 from app0.",
        "Export the binary for version 4, serve it with python3 -m http.server 8000 from the export folder along with version.txt containing 4. Watch the board update and print Running v4 from app1 and New image confirmed.",
        "Build version 5 with a wrong Wi-Fi password. Serve it with version.txt = 5. Observe the update, the 15 s self-test failure and the rollback. Note which slot runs afterwards.",
        "Build version 6 that calls abort() at the start of setup(). Serve it and confirm the bootloader rolls back without your code ever reaching the self-test.",
        "Pull the USB cable in the middle of a download (watch the HTTP server log) and confirm the board still boots the old version. Write up each experiment as one line: cause, expected state, observed state.",
      ],
    },
    quiz: [
      {
        q: "Why is the maximum Uno sketch size 32 256 bytes rather than 32 768?",
        options: [
          "The top 512 bytes of flash hold the Optiboot bootloader",
          "The EEPROM takes 512 bytes of flash",
          "The interrupt vector table uses 512 bytes",
          "The USB chip reserves 512 bytes",
        ],
        answer: 0,
        why: "Optiboot occupies the 512-byte boot section at the top of the 32 KB flash, set by the BOOTSZ fuses. 32 768 − 512 = 32 256.",
      },
      {
        q: "In the default table, app0 is at 0x10000 with size 0x140000. Where must the next app partition start at the earliest, and why is 0x150000 a valid choice?",
        options: [
          "0x150000, and it is valid because it is on a 64 KB boundary",
          "0x140000, because sizes are absolute",
          "0x151000, because a 4 KB gap is required",
          "Anywhere, because app partitions have no alignment rule",
        ],
        answer: 0,
        why: "0x10000 + 0x140000 = 0x150000, the first free address. App partitions must be 64 KB (0x10000) aligned for the flash cache, and 0x150000 is.",
      },
      {
        q: "A new image boots in PENDING_VERIFY. Before it calls esp_ota_mark_app_valid_cancel_rollback(), the task watchdog resets the chip. What does the bootloader do?",
        options: [
          "Boots the new image again and waits for it to confirm",
          "Marks the new image aborted and boots the previous slot",
          "Erases both slots and enters download mode",
          "Boots the factory partition only if Wi-Fi is available",
        ],
        answer: 1,
        why: "An image that resets before confirming itself is treated as failed. The bootloader marks it ABORTED and falls back to the previous valid slot.",
      },
      {
        q: "Why does the OTA sketch define verifyRollbackLater() to return true?",
        options: [
          "To disable rollback completely",
          "To make the core skip its early automatic confirmation, so the sketch can confirm only after its own self-test passes",
          "To speed up the download",
          "Because Update.end() fails otherwise",
        ],
        answer: 1,
        why: "By default initArduino() confirms a pending image before setup(). Returning true defers that, so the image stays on trial until the sketch has checked that Wi-Fi and the server still work.",
      },
      {
        q: "What does Secure Boot v2 protect against that a SHA-256 checksum alone does not?",
        options: [
          "Bit errors during download",
          "An image built by someone without the private signing key",
          "Power failure during an update",
          "Running out of flash",
        ],
        answer: 1,
        why: "A checksum detects damage but anyone can compute one for their own image. A signature can only be produced with the private key, and the chip checks it against the key digest burned into eFuse.",
      },
      {
        q: "A 1 038 132 byte image downloads at 50 kB/s. Roughly how long is the download?",
        options: ["2 s", "21 s", "208 s", "52 s"],
        answer: 1,
        why: "1 038 132 / 50 000 ≈ 20.8 s, so about 21 s, before erase time and the reboot.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "a7-testing-and-continuous-integration": {
    id: "a7-testing-and-continuous-integration",
    outcomes: [
      "Write unit tests for firmware logic that run on a laptop with Unity",
      "Choose the right test double (stub, fake, mock, spy) for a piece of hardware",
      "Describe a hardware-in-the-loop rig and write a scripted test against a real board",
      "Set up a GitHub Actions workflow that runs tests and builds firmware on every push",
    ],
    blocks: [
      { t: "h", text: "Why firmware needs automated tests" },
      { t: "p", text: "Manual testing of firmware means: upload, open the Serial Monitor, poke the device, watch. It is slow, it tests only what you remember to try, and it is never repeated exactly. The first time somebody changes the debounce code six months later, nobody re-checks the timeout path. Automated tests turn your knowledge of how the code should behave into programs that check it every time anything changes. In firmware they also do something manual testing cannot: they exercise paths that are hard to provoke on hardware, such as a bus error on the third byte, a sensor reading of exactly −40 °C, or a 32-bit `millis()` wrap after 49.7 days." },
      { t: "p", text: "Tests come in layers, like the code. The usual picture is a pyramid: many fast tests at the bottom, few slow ones at the top." },
      { t: "table", head: ["Level", "Runs on", "Speed", "What it catches"], rows: [
        ["Unit tests", "Your laptop or a CI server", "Milliseconds; hundreds per second", "Logic errors in drivers, parsers, state machines, maths"],
        ["On-target tests", "The real microcontroller", "Seconds", "Compiler, alignment, timing and peripheral behaviour on the actual chip"],
        ["Hardware-in-the-loop", "Board plus a test rig that drives its inputs and reads its outputs", "Seconds to minutes", "Integration: wiring, real sensors, power, the whole product"],
        ["Field and soak tests", "Devices running for days", "Days", "Leaks, rare races, environmental faults"],
      ], caption: "The test pyramid for embedded systems." },
      { t: "p", text: "The layered architecture from lesson 1 is what makes the bottom of the pyramid possible. Code that touches no hardware can be compiled by the ordinary `gcc` or `clang` on your laptop and run in milliseconds. Practitioners call this **dual targeting**: the same source compiles for the ESP32 and for the host." },

      { t: "h", text: "Unit testing with Unity" },
      { t: "p", text: "**Unity** is a small unit test framework written in C for embedded work: three files (`unity.c`, `unity.h`, `unity_internals.h`), no dynamic memory, and it runs both on a PC and on a microcontroller. ESP-IDF bundles it for on-target tests. A test is a `void` function with assertions; `setUp()` runs before each test and `tearDown()` after it; `main()` lists the tests." },
      { t: "p", text: "Here are tests for the TMP102 driver from lesson 1, using a **fake bus** that returns canned bytes and records what it was asked for:" },
      { t: "snippet", lang: "c", code: String.raw`#include "unity.h"
#include "tmp102.h"

/* A fake bus: returns canned bytes and records what it was asked for. */
typedef struct {
  uint8_t reply[2];
  int fail;
  uint8_t last_addr, last_reg;
  int calls;
} fake_bus_t;

static int fake_read(void *ctx, uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t len) {
  fake_bus_t *f = (fake_bus_t *)ctx;
  f->calls++;
  f->last_addr = addr;
  f->last_reg = reg;
  if (f->fail) return -1;
  for (uint8_t i = 0; i < len; i++) buf[i] = f->reply[i];
  return 0;
}

static fake_bus_t fake;
static i2c_bus_t bus = { fake_read, &fake };

void setUp(void) { fake = (fake_bus_t){ {0, 0}, 0, 0, 0, 0 }; }
void tearDown(void) {}

static void test_positive_25C(void) {
  int32_t t;
  fake.reply[0] = 0x19; fake.reply[1] = 0x00;
  TEST_ASSERT_EQUAL_INT(TMP102_OK, tmp102_read_mC(&bus, 0x48, &t));
  TEST_ASSERT_EQUAL_INT32(25000, t);
  TEST_ASSERT_EQUAL_HEX8(0x48, fake.last_addr);
  TEST_ASSERT_EQUAL_HEX8(0x00, fake.last_reg);
}

static void test_negative_minus25C(void) {
  int32_t t;
  fake.reply[0] = 0xE7; fake.reply[1] = 0x00;
  tmp102_read_mC(&bus, 0x48, &t);
  TEST_ASSERT_EQUAL_INT32(-25000, t);
}

static void test_smallest_step(void) {
  int32_t t;
  fake.reply[0] = 0x00; fake.reply[1] = 0x10; /* raw = 1 */
  tmp102_read_mC(&bus, 0x48, &t);
  TEST_ASSERT_EQUAL_INT32(62, t);  /* 62.5 truncated */
}

static void test_bus_error_leaves_output_alone(void) {
  int32_t t = 12345;
  fake.fail = 1;
  TEST_ASSERT_EQUAL_INT(TMP102_ERR_BUS, tmp102_read_mC(&bus, 0x48, &t));
  TEST_ASSERT_EQUAL_INT32(12345, t);
  TEST_ASSERT_EQUAL_INT(1, fake.calls);
}

int main(void) {
  UNITY_BEGIN();
  RUN_TEST(test_positive_25C);
  RUN_TEST(test_negative_minus25C);
  RUN_TEST(test_smallest_step);
  RUN_TEST(test_bus_error_leaves_output_alone);
  return UNITY_END();
}`, caption: "test/test_tmp102.c. Built and run on a laptop: 4 Tests 0 Failures 0 Ignored." },
      { t: "snippet", lang: "text", code: String.raw`UNITY ?= ../unity/src
CFLAGS = -std=c11 -Wall -Wextra -Werror -I. -I$(UNITY)

test: test_tmp102
	./test_tmp102

test_tmp102: test_tmp102.c tmp102.c $(UNITY)/unity.c
	$(CC) $(CFLAGS) -o $@ $^`, caption: "test/Makefile. Run with make; the recipe lines start with a tab." },
      { t: "p", text: "Look at what the tests check. Two typical values, one at each sign. The smallest step, which catches a units mistake (62 rather than 62.5 shows that integer truncation is deliberate and pinned down). The error path, including the promise that the output is untouched and that the bus was called once, not retried silently. And the address and register the driver used: a driver that read register 0x01 (the configuration register) would return plausible garbage, and only a test that inspects the request catches it." },
      { t: "p", text: "For C++ code bases, **GoogleTest** (with GoogleMock) plays the same role with richer features: test fixtures as classes, parameterised tests and generated mocks for abstract interfaces. It needs a hosted C++ environment, so it is used almost only for host tests. The principles are the same." },

      { t: "h", text: "Test doubles for hardware" },
      { t: "p", text: "Anything that stands in for real hardware in a test is a **test double**. The names are worth knowing because they describe different jobs:" },
      { t: "table", head: ["Double", "What it does", "Example"], rows: [
        ["Stub", "Returns fixed answers, records nothing", "`hal_millis()` that always returns 1000"],
        ["Fake", "A working but simplified implementation", "An in-RAM array standing in for flash or EEPROM; the fake bus above"],
        ["Spy", "A stub that also records how it was called", "The fake bus's last_addr and calls fields"],
        ["Mock", "Pre-programmed with expected calls; fails the test if they differ", "CMock or GoogleMock: expect i2c_read(0x48, 0x00, 2) exactly once"],
      ] },
      { t: "p", text: "Start with fakes and spies; they are a few lines of plain C and you can read them. Mocks generated by tools such as CMock (Unity's companion) are powerful but tie tests to the exact sequence of calls, so a harmless refactor breaks them. Use them when the sequence is the behaviour, for example a display driver whose initialisation commands must be sent in a fixed order." },
      { t: "p", text: "Time deserves its own double. Give the code a `now_ms` argument or a `hal_millis()` you control, and a test can jump 49.7 days forward in one line to check the wrap, or advance 1 ms at a time to check a debounce. A test that uses the real clock is slow and flaky; one that uses a fake clock is instant and exact." },

      { t: "h", text: "On-target and hardware-in-the-loop testing" },
      { t: "p", text: "Host tests cannot catch everything. The ESP32 compiler, its alignment rules, its real I2C peripheral and its interrupt timing differ from your laptop. **On-target tests** run the same Unity tests on the chip; ESP-IDF provides a test-app structure for this, and results come back over the serial port." },
      { t: "p", text: "**Hardware-in-the-loop** (HIL) testing goes one level up. The device under test (DUT) runs its real, shipping firmware, and a test rig plays the outside world: it drives inputs (a DAC voltage instead of a sensor, a relay instead of a button, a programmable supply for brown-out tests) and measures outputs (GPIO levels, PWM duty, serial messages, current draw). A test script on a PC orchestrates both." },
      { t: "diagram", text: String.raw`┌────────────┐ USB  ┌──────────────┐ GPIO / DAC / relays ┌────────────┐
│ CI runner  │──────│ Rig MCU      │────────────────────│  DUT        │
│ (PC or Pi) │      │ (second ESP32│◄───────────────────│  (product   │
│ pytest     │      │  or Uno)     │   outputs, PWM      │  firmware)  │
│ scripts    │──────┼──────────────┼── USB serial ──────►│            │
└────────────┘      └──────────────┘                     └─────┬──────┘
      │                 programmable bench supply ──────────────┘
      └──── flash DUT with esptool, read logs, power-cycle it`, caption: "A minimal HIL rig. A second microcontroller is the cheapest rig controller." },
      { t: "p", text: "A HIL test is a short script: power-cycle the DUT, flash the build under test, set inputs, wait, check outputs and logs. Python with `pyserial` and `pytest` is the usual tool. This test checks that the sensor node from lesson 5 reports a reading after a wake and then sleeps:" },
      { t: "snippet", lang: "python", code: String.raw`# conftest.py (pytest reads option hooks only from conftest.py or plugins)
def pytest_addoption(parser):
    parser.addoption("--port", default="/dev/ttyUSB0")


# test_node_hil.py : run with  pytest -v test_node_hil.py --port /dev/ttyUSB0
import re
import time

import pytest
import serial


@pytest.fixture
def dut(request):
    port = request.config.getoption("--port")
    s = serial.Serial(port, 115200, timeout=0.2)
    # Pulse EN low through the DTR/RTS auto-reset circuit to restart the DUT.
    s.dtr = False
    s.rts = True
    time.sleep(0.1)
    s.rts = False
    yield s
    s.close()


def read_until(s, pattern, timeout_s):
    deadline = time.monotonic() + timeout_s
    buf = ""
    while time.monotonic() < deadline:
        buf += s.read(256).decode(errors="replace")
        m = re.search(pattern, buf)
        if m:
            return m, buf
    pytest.fail(f"did not see {pattern!r} within {timeout_s} s; got:\n{buf}")


def test_reports_reading_after_boot(dut):
    m, _ = read_until(dut, r"ADC = (\d+)", 5)
    assert 0 <= int(m.group(1)) <= 4095


def test_no_watchdog_resets(dut):
    m, _ = read_until(dut, r"watchdog resets so far: (\d+)", 5)
    assert int(m.group(1)) == 0`, caption: "A HIL test, as two files. A pytest_addoption hook placed in the test file itself is ignored and --port is then rejected." },

      { t: "h", text: "Continuous integration" },
      { t: "p", text: "**Continuous integration** (CI) means every push to the shared repository is built and tested automatically by a server, and the result is shown on the commit or pull request. A broken build is noticed in minutes by the person who broke it, not weeks later by someone else. GitHub Actions runs workflows described in YAML files under `.github/workflows/`. This workflow runs the host tests, then builds the firmware for both boards with arduino-cli and keeps the binaries:" },
      { t: "snippet", lang: "yaml", code: String.raw`# .github/workflows/firmware.yml
name: firmware
on: [push, pull_request]

jobs:
  host-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch Unity
        run: git clone --depth 1 --branch v2.6.1 https://github.com/ThrowTheSwitch/Unity.git unity
      - name: Run unit tests
        run: make -C test UNITY=../unity/src

  build:
    runs-on: ubuntu-latest
    needs: host-tests            # do not bother building if logic tests fail
    steps:
      - uses: actions/checkout@v4
      - uses: arduino/setup-arduino-cli@v2
      - name: Install cores
        run: |
          URL=https://espressif.github.io/arduino-esp32/package_esp32_index.json
          arduino-cli core update-index --additional-urls "$URL"
          arduino-cli core install esp32:esp32@3.3.10 --additional-urls "$URL"
          arduino-cli core install arduino:avr
      - name: Build ESP32 node
        run: arduino-cli compile --fqbn esp32:esp32:esp32 --warnings all --output-dir out/esp32 firmware/node
      - name: Build Uno logger
        run: arduino-cli compile --fqbn arduino:avr:uno --warnings all --output-dir out/uno firmware/uno_logger
      - uses: actions/upload-artifact@v4
        with:
          name: firmware-binaries
          path: out/

  idf-build:
    runs-on: ubuntu-latest
    needs: host-tests
    steps:
      - uses: actions/checkout@v4
      - uses: espressif/esp-idf-ci-action@v1
        with:
          esp_idf_version: v5.5
          target: esp32
          path: idf_app             # runs idf.py build inside the official Docker image`, caption: "A two-stage pipeline: tests gate the builds. Pin the core version so builds are reproducible." },
      { t: "p", text: "Three habits make CI useful rather than decorative. **Pin versions** (the core, Unity, the IDF release) so that a build that passed last month still passes; an unpinned toolchain upgrade is a common reason a CI build turns red with no code change. **Treat warnings as errors** in your own code (`-Werror` in the host build, `--warnings all` and a review of the log on target) so they never accumulate. And **keep the artefacts**: the binary that CI built and tested is the binary you release over the air in lesson 2, never one built on somebody's laptop. The HIL stage usually runs on a self-hosted runner (a Raspberry Pi next to the rig) because GitHub's cloud machines have no boards attached." },

      { t: "deep", title: "Coverage: how much of the code did the tests run?", blocks: [
        { t: "p", text: "Add `--coverage` to CFLAGS in the host build and run the tests; gcc writes `.gcda` files, and `gcov tmp102.c` (or `gcovr` for a summary) reports which lines and branches executed. For the TMP102 driver the four tests reach every line and both outcomes of the bus-error branch: 100% line and branch coverage." },
        { t: "p", text: "Coverage tells you what you have not tested, never that what you tested is right. A test that calls every function but asserts nothing scores 100%. Use it to find untested error paths, which are where field bugs hide, and to stop coverage falling over time; do not chase a number for its own sake." },
      ] },
      { t: "deep", title: "Flaky tests and how HIL rigs fail", blocks: [
        { t: "p", text: "A **flaky** test sometimes passes and sometimes fails on the same code. On a HIL rig the causes are usually the rig, not the firmware: a USB hub that drops the serial port on power-cycle, a read that starts before the DUT's boot banner, a timeout that is long enough on your PC but not on the CI Pi. Treat the rig as a product. Log everything (the full serial capture is attached to the test failure above), make waits event-driven (`read_until` a pattern, never a bare `sleep`), and quarantine a flaky test rather than letting people learn to ignore red builds." },
        { t: "p", text: "The ESP-IDF project itself uses `pytest-embedded`, a pytest plugin that flashes the DUT, captures serial, decodes panics and talks to several boards at once. When you move from Arduino to ESP-IDF builds it replaces the hand-written fixture above." },
      ] },
    ],
    mistakes: [
      "**Testing through the hardware only.** If the only way to test the parser is to type into the Serial Monitor, the parser is too entangled with the UART. Separate it and test it on the host.",
      "**Tests with no assertions on the error path.** Most field failures are on paths that \"never happen\": bus errors, timeouts, full queues. Test them deliberately with a fake that fails.",
      "**Using the real clock in tests.** Sleeps make tests slow and flaky. Inject time.",
      "**Over-specified mocks.** A mock that insists on an exact call sequence breaks on harmless refactoring. Prefer fakes unless the order is the behaviour.",
      "**Unpinned toolchains in CI.** A core or library update changes the build under you. Pin versions and upgrade on purpose.",
      "**Releasing a binary CI did not build.** Then what you tested and what you shipped are different files.",
    ],
    practice: {
      kind: "bench",
      task: "Put the driver you wrote in lesson 1 under automated test and continuous integration.",
      steps: [
        "Download Unity (v2.6.x) into your repository or as a CI step. Write a fake for your bus interface with a fail switch and a call log.",
        "Write at least five tests: two normal readings, one boundary value from the datasheet, one bus failure, and one that checks the register or command the driver sends. Run them with make.",
        "Break the driver on purpose (wrong register, wrong scale, sign error) and confirm each fault makes at least one test fail. A fault no test catches shows you a missing test.",
        "Add the workflow YAML from this lesson, adjusted to your folder names. Push and check that the run turns green, and that the firmware binaries appear as an artefact.",
        "Optional HIL: wire a second board or a relay to drive one input of your DUT, and write a pytest script that checks one output. Run it locally from the same commit.",
      ],
    },
    quiz: [
      {
        q: "Why can the TMP102 driver be unit tested on a laptop at all?",
        options: [
          "Because Unity emulates the ESP32",
          "Because the driver reaches the hardware only through an interface the test can fill with a fake",
          "Because laptops have I2C ports",
          "Because the driver is written in C++",
        ],
        answer: 1,
        why: "The driver has no hardware headers; all bus access goes through the function pointer in i2c_bus_t. The test supplies a fake, so the driver compiles and runs with an ordinary host compiler.",
      },
      {
        q: "A test double returns canned bytes and also records the address and register it was asked for. What is it best called?",
        options: ["A mock", "A stub", "A spy (or a fake with spy features)", "A driver"],
        answer: 2,
        why: "A stub only returns answers. Recording the calls so the test can inspect them afterwards is what a spy does. A mock would be pre-programmed with expectations and fail by itself.",
      },
      {
        q: "test_smallest_step expects 62 for a raw count of 1. Why not 62.5 or 63?",
        options: [
          "The sensor rounds internally",
          "Integer arithmetic 1 × 625 / 10 truncates toward zero to 62, and the test pins that behaviour down",
          "Unity cannot compare decimals",
          "62 is the datasheet value",
        ],
        answer: 1,
        why: "625 / 10 in C integer division is 62. The test documents that the driver truncates; if someone later changes the rounding, the test makes that a deliberate decision.",
      },
      {
        q: "In the workflow, what does needs: host-tests on the build job do?",
        options: [
          "Runs the two jobs on the same machine",
          "Makes the build job wait for the host tests and skip if they fail",
          "Installs Unity for the build job",
          "Uploads the test results",
        ],
        answer: 1,
        why: "needs declares a dependency: the build job starts only after host-tests succeeds. Without it the jobs run in parallel and a logic failure still produces binaries.",
      },
      {
        q: "Which fault is a HIL test likely to catch that host unit tests will not?",
        options: [
          "A sign error in a conversion function",
          "A missing case in a state machine",
          "The sensor's I2C pull-ups are missing on the new board revision",
          "An off-by-one in a ring buffer",
        ],
        answer: 2,
        why: "Host tests replace the hardware with fakes, so they cannot see wiring or electrical faults. A HIL rig runs real firmware on the real board and would see the bus fail.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "a7-debugging-and-static-analysis": {
    id: "a7-debugging-and-static-analysis",
    outcomes: [
      "Explain JTAG and SWD and connect a probe to an ESP32 with OpenOCD and GDB",
      "Use breakpoints, hardware watchpoints and the call stack to find a fault",
      "Decode an ESP32 panic and backtrace into source lines with addr2line",
      "Run cppcheck and clang-tidy, and explain the purpose and structure of MISRA C",
    ],
    blocks: [
      { t: "h", text: "Beyond Serial.print" },
      { t: "p", text: "Printing is the debugger you have used so far, and it remains useful. But it has limits. It changes timing (a 40-character line at 115 200 baud takes about 3.5 ms), it shows only what you thought to print, and it cannot stop the processor at the instant something goes wrong. A **hardware debug probe** can. It connects to a debug port on the chip and lets a debugger on your PC halt the CPU, read and write any register or memory, step one instruction or one line at a time, and stop when a particular address is executed or a particular variable is written. Professional firmware engineers use one every day." },

      { t: "h", text: "JTAG and SWD" },
      { t: "p", text: "**JTAG** (IEEE 1149.1) was designed for testing solder joints on boards and grew into the standard debug port. It uses four signals plus ground: TCK (clock), TMS (mode select, which steps a state machine inside the chip), TDI (data in) and TDO (data out), with an optional TRST reset. Several chips can be daisy-chained on one JTAG port. **SWD** (Serial Wire Debug) is Arm's two-wire alternative for Cortex-M chips: SWCLK and a bidirectional SWDIO. It gives the same debug access with fewer pins and is what you meet on STM32, nRF52 and RP2040 boards." },
      { t: "table", head: ["", "ESP32 (JTAG)", "ATmega328P", "Arm Cortex-M (SWD)"], rows: [
        ["Debug port", "JTAG on GPIO 12 to 15", "debugWIRE on the RESET pin (no JTAG)", "SWDIO and SWCLK"],
        ["Pins", "TDI = 12, TCK = 13, TMS = 14, TDO = 15", "1 (RESET)", "2"],
        ["Typical probe", "ESP-Prog (FT2232H) or any FT2232 board", "Atmel-ICE, or an MPLAB Snap", "ST-Link, J-Link, CMSIS-DAP"],
        ["Software", "OpenOCD (Espressif fork) + xtensa GDB", "Microchip Studio or avarice-style tools", "OpenOCD or pyOCD + arm-none-eabi-gdb"],
        ["Hardware breakpoints", "2 per core", "1 (plus software breaks)", "Usually 4 to 8"],
      ], caption: "Debug access on the boards and chips you are likely to meet." },
      { t: "note", kind: "warn", text: "On the ESP32 DevKit, GPIO 12 is also a strapping pin that sets the flash voltage at reset. A probe or circuit that pulls it high at boot selects 1.8 V flash and the board will not boot. ESP-Prog leaves it floating at reset, but avoid using GPIO 12 to 15 for anything else if you want to debug. The S3 and C3 chips have a built-in USB-JTAG bridge and need no probe at all." },
      { t: "p", text: "The software chain is the same everywhere. **OpenOCD** talks to the probe and exposes a GDB server on port 3333. **GDB** connects to it and gives you the commands. With ESP-IDF you run `idf.py openocd` in one terminal and `idf.py gdb` in another; with Arduino IDE 2 the Debug button drives the same tools for supported boards." },
      { t: "snippet", lang: "bash", code: String.raw`# terminal 1: start OpenOCD for an ESP32 with an ESP-Prog
openocd -f board/esp32-wrover-kit-3.3v.cfg

# terminal 2: GDB on the ELF file of the running build
xtensa-esp32-elf-gdb build/node.elf
(gdb) target extended-remote :3333
(gdb) monitor reset halt          # reset the chip and stop at the first instruction
(gdb) hbreak app_step             # hardware breakpoint on a function
(gdb) continue
(gdb) bt                          # call stack when it stops
(gdb) info locals
(gdb) watch g_state.setpoint      # stop whenever this variable is written
(gdb) continue
(gdb) print/x g_state             # dump a struct in hex`, caption: "A typical session. The ESP-Prog board config file works for most FT2232 based probes." },

      { t: "h", text: "Breakpoints and watchpoints" },
      { t: "p", text: "A **breakpoint** stops the CPU when it reaches an instruction address. A **software breakpoint** replaces the instruction with a special break instruction; that works in RAM but not in flash, because the debugger cannot rewrite flash quickly. ESP32 code runs from flash through a cache, so the debugger falls back on **hardware breakpoints**: comparator registers inside the CPU that match the program counter. The ESP32 has two per core. Set a third and GDB will tell you it cannot insert it. Spend them wisely and delete the ones you no longer need." },
      { t: "p", text: "A **watchpoint** stops the CPU when a data address is read or written. It is the tool for the hardest class of bug: \"something is corrupting this variable and I do not know what\". Set `watch` on the variable, run, and the CPU halts on the exact instruction that wrote it, with the whole call stack visible. Typical culprits it finds in seconds: a buffer overflow in a neighbouring array, a stray pointer, a task writing shared data without the mutex from a5. The ESP32 also has two hardware watchpoints per core, each covering an aligned region of up to 64 bytes." },
      { t: "p", text: "One thing to remember when you halt a real-time system: the rest of the world does not stop. Motors keep turning at the last PWM value, Wi-Fi drops the connection, and the watchdog may fire the moment you resume. Halt only when outputs are safe, and disable watchdogs in debug builds (OpenOCD does this on the ESP32 while halted)." },

      { t: "h", text: "Reading an ESP32 panic" },
      { t: "p", text: "Often the first sign of a bug is a crash in the field with no probe attached. The ESP32 prints a **panic report** on the serial port and restarts. Learn to read it; it usually points at the line. Here is a small sketch with a bug (`lookup(7)` returns a null pointer) and the report it produces:" },
      { t: "snippet", lang: "cpp", code: String.raw`struct Reading { int value; };
Reading *lookup(int id) { return id == 7 ? nullptr : new Reading{id}; }
int scale(Reading *r) { return r->value * 10; }   // crashes when r is null
void setup() { Serial.begin(115200); }
void loop() { Serial.println(scale(lookup(millis() > 3000 ? 7 : 1))); delay(500); }`, caption: "crash.ino. After 3 s it dereferences a null pointer. (It also leaks a Reading every call: a second bug.)" },
      { t: "snippet", lang: "text", code: String.raw`Guru Meditation Error: Core  1 panic'ed (LoadProhibited). Exception was unhandled.

Core  1 register dump:
PC      : 0x400d1644  PS      : 0x00060a30  A0      : 0x800d3828  A1      : 0x3ffb2270
A2      : 0x00000000  A3      : 0x00000000  A4      : 0x00000001  A5      : 0x00000000
...
EXCVADDR: 0x00000000  ...

Backtrace: 0x400d1644:0x3ffb2270 0x400d3828:0x3ffb2290 0x4008ff19:0x3ffb22b0`, caption: "The shape of a panic report (register values other than PC and EXCVADDR are illustrative)." },
      { t: "list", items: [
        "**LoadProhibited**: the CPU tried to load from an address it may not read. Its partner StoreProhibited means a write. Both are almost always a bad pointer.",
        "**EXCVADDR = 0x00000000**: the address it tried to read. Zero, or a small number such as 0x00000004, means a null pointer (plus a struct field offset).",
        "**PC = 0x400d1644**: the instruction that faulted. Addresses 0x400Dxxxx are code in flash.",
        "**Backtrace**: pairs of PC:SP for each stack frame, newest first. After the first, the PCs are return addresses, so a decoder may name the line of the call rather than the line after it.",
      ] },
      { t: "p", text: "The numbers mean nothing until you translate them with the **ELF file** of the exact build that crashed (keep it with every release: CI artefacts are perfect for this). `addr2line` from the core's toolchain does the translation:" },
      { t: "snippet", lang: "bash", code: String.raw`# Arduino-ESP32 3.3.x toolchain on macOS (adjust the version folder)
A2L=~/Library/Arduino15/packages/esp32/tools/esp-x32/2601/bin/xtensa-esp32-elf-addr2line
$A2L -pfiaC -e build/crash.ino.elf 0x400d1644 0x400d3828

0x400d1644: scale(Reading*) at /home/you/crash/crash.ino:3
 (inlined by) loop() at /home/you/crash/crash.ino:5
0x400d3828: loopTask(void*) at .../cores/esp32/main.cpp:52`, caption: "Real output for this sketch built with core 3.3.10 (paths shortened). -p pretty, -f functions, -i inlined frames, -a addresses, -C demangle C++." },
      { t: "p", text: "It names line 3, `r->value`, inlined into `loop()`, called from the core's `loopTask`. Combined with EXCVADDR = 0 you have the diagnosis: `r` is null. With ESP-IDF, `idf.py monitor` does this decoding automatically as the panic scrolls past. In the Arduino world, keep the ELF (`arduino-cli compile --output-dir` saves it) and run addr2line yourself. The default partition table's `coredump` partition can also hold a full core dump written at panic time, which `idf.py coredump-info` turns into a stack trace for every task after the fact." },

      { t: "h", text: "Static analysis" },
      { t: "p", text: "Debuggers find bugs after they happen. **Static analysis** finds a class of bugs before the code runs, by reading the source. The first static analyser is your compiler: build with `-Wall -Wextra` and read every warning. Beyond that, two free tools are standard:" },
      { t: "snippet", lang: "bash", code: String.raw`# cppcheck: fast, few false alarms, understands embedded C well
cppcheck --enable=warning,style,performance,portability --std=c11 \
         --inline-suppr --error-exitcode=1 -I drivers -I hal drivers app

# clang-tidy: uses the clang front end; checks are grouped by name
clang-tidy drivers/tmp102.c \
  -checks='-*,bugprone-*,cert-*,clang-analyzer-*,readability-magic-numbers' \
  -- -std=c11 -I drivers -I hal`, caption: "Both return non-zero on findings, so they can be a step in the CI workflow." },
      { t: "p", text: "Typical findings: an uninitialised variable on one path, a buffer index that can reach its size, a pointer that may be null when dereferenced (cppcheck would flag `scale(lookup(7))` above if `lookup` were in the same file), a return value ignored, a condition that is always true, an integer that can overflow before it is widened. Each takes seconds to fix when found by a tool and hours when found in the field." },

      { t: "h", text: "Coding standards and MISRA C" },
      { t: "p", text: "C lets you write many things whose behaviour is undefined or implementation-defined. A **coding standard** forbids the dangerous subset so that code is predictable and analysable. The best known for embedded work is **MISRA C**, from the Motor Industry Software Reliability Association, now used well beyond cars (rail, medical, aerospace, industrial). The current edition is MISRA C:2023, which consolidates MISRA C:2012 and its amendments. You do not need to memorise it; you need to know its shape:" },
      { t: "list", items: [
        "**Directives and rules.** Directives are process requirements (for example, \"run-time failures shall be minimised\"); rules are checkable properties of the code.",
        "**Categories.** Each rule is Mandatory (never broken), Required (broken only with a documented, approved deviation) or Advisory.",
        "**The essential type model.** Rules in section 10 stop implicit conversions between signed and unsigned, narrowing assignments and mixed-type arithmetic, the source of many sensor-scaling bugs.",
        "**Examples of the flavour:** the value returned by a non-void function shall be used (Rule 17.7); dynamic memory from stdlib shall not be used (Rule 21.3); every switch shall have a default (Rule 16.4); an if ... else if chain shall end with else (Rule 15.7).",
        "**Deviations.** A project may break a Required rule if it records why, what the risk is and who approved it. Compliance means every violation is either fixed or deviated, not that none exist.",
      ] },
      { t: "p", text: "You will see MISRA's influence throughout this module: the TMP102 driver avoids shifting a signed value, uses fixed-width types, checks every return code and allocates nothing. Commercial tools (and the cppcheck premium edition) check MISRA rules automatically. For course projects, adopt a short house standard of your own: warnings as errors, cppcheck clean, no heap after start-up, fixed-width integer types, every switch with a default, and one formatter (`clang-format`) so that diffs show logic, not whitespace." },

      { t: "deep", title: "How a hardware watchpoint works", blocks: [
        { t: "p", text: "The Xtensa LX6 debug module has two DBREAKA (address) and two DBREAKC (control) registers per core. DBREAKC holds a mask that ignores the low address bits, which is why a watchpoint covers a power-of-two sized, aligned region from 1 to 64 bytes, and flags saying whether loads, stores or both should trigger. Every memory access the CPU makes is compared with these registers in hardware at no cost in speed; on a match the core raises a debug exception, and OpenOCD reports it to GDB as a stop." },
        { t: "p", text: "Two consequences follow. First, a watchpoint on a 4-byte variable inside a 64-byte struct is exact, but one on a large array must be split or narrowed. Second, a write by DMA (for example the I2S or SPI peripheral filling a buffer) does not go through the CPU and is invisible to a watchpoint. ESP-IDF also uses one watchpoint itself as a stack overflow guard at the end of each task's stack when `CONFIG_FREERTOS_WATCHPOINT_END_OF_STACK` is set." },
      ] },
      { t: "deep", title: "Other ESP32 crash types you will meet", blocks: [
        { t: "table", head: ["Report", "Usual cause"], rows: [
          ["LoadProhibited / StoreProhibited", "Null or wild pointer; EXCVADDR shows the address"],
          ["IllegalInstruction", "Jumping through a corrupt function pointer, or a stack overwrite that damaged a return address"],
          ["InstrFetchProhibited", "Calling a function pointer that holds data or zero"],
          ["LoadStoreAlignment", "A 32-bit access to an address not a multiple of 4, often a cast from a byte buffer to a struct pointer"],
          ["Cache disabled but cached memory region accessed", "An ISR in flash running while flash is being written; mark the ISR IRAM_ATTR"],
          ["Stack canary watchpoint triggered (task)", "A task overflowed its stack; increase it and check with uxTaskGetStackHighWaterMark (a5)"],
          ["Task watchdog got triggered", "A task, usually loop or IDLE, did not run or reset the watchdog in time (lesson 5)"],
        ] },
        { t: "p", text: "A backtrace ending in `|<-CORRUPTED` means the stack itself was damaged, so the frames after that are unreliable. Then the most recent good frame and a watchpoint on the overwritten area are your best leads." },
      ] },
      { t: "deep", title: "Debugging the Uno: debugWIRE and its catch", blocks: [
        { t: "p", text: "The ATmega328P has no JTAG. Its on-chip debug uses **debugWIRE**, a one-wire protocol on the RESET pin, enabled by programming the DWEN fuse with an ISP programmer. Once enabled, the RESET pin no longer resets the chip, and the Uno's auto-reset capacitor (100 nF from the USB chip's DTR to RESET) distorts the debugWIRE signal, so on a genuine Uno you must cut the RESET-EN solder trace. To return to normal use the debugger must disable DWEN over debugWIRE before you can use ISP again. For these reasons most people debug an Uno with serial output and a logic analyser, and keep probe debugging for chips with a proper port." },
        { t: "p", text: "If you do want breakpoints on AVR code, there is a middle way: develop the logic on the host with the unit tests of lesson 3 and a normal debugger such as GDB or your IDE, where breakpoints are unlimited and free, and leave only the thin board layer to be checked on the chip." },
      ] },
    ],
    mistakes: [
      "**Throwing away the ELF file.** A backtrace without the matching ELF cannot be decoded. Keep the ELF of every release next to its binary.",
      "**Decoding with the ELF of a different build.** Even a one-line change moves addresses; the decoder then names the wrong functions with total confidence.",
      "**Using GPIO 12 to 15 for circuits on an ESP32 you want to debug.** They are the JTAG pins, and GPIO 12 is a strapping pin that can stop the board booting.",
      "**Setting more hardware breakpoints than the chip has.** The ESP32 has two per core; delete old ones instead of wondering why the third did nothing.",
      "**Silencing analyser warnings instead of reading them.** A suppression should come with a comment explaining why the code is correct.",
      "**Claiming MISRA compliance because a tool found no violations.** Compliance needs the deviations recorded and the directives followed, not just a clean report.",
    ],
    practice: {
      kind: "bench",
      task: "Find two planted bugs, one with a panic decode and one with static analysis.",
      steps: [
        "Compile crash.ino with arduino-cli compile --output-dir out so the ELF is kept. Upload it and capture the panic from the Serial Monitor.",
        "Run xtensa-esp32-elf-addr2line -pfiaC -e out/crash.ino.elf on the PC and every backtrace address. Write down the file, line and the meaning of EXCVADDR.",
        "Fix the crash by making scale() handle a null pointer and lookup() avoid new. Explain which MISRA-style rule each fix follows.",
        "Install cppcheck (Homebrew, apt or the Windows installer) and run it on your lesson 1 driver and application with --enable=warning,style. Fix or justify every finding.",
        "If you have an ESP-Prog or an ESP32-S3 board, set a hardware watchpoint on a global variable, change it from loop(), and confirm GDB stops on the writing line with the call stack.",
      ],
    },
    quiz: [
      {
        q: "An ESP32 reports LoadProhibited with EXCVADDR = 0x00000008. What is the most likely cause?",
        options: [
          "The stack overflowed",
          "Code read a field 8 bytes into a struct through a null pointer",
          "Flash is being written during an interrupt",
          "The watchdog fired",
        ],
        answer: 1,
        why: "LoadProhibited is an illegal read; an address near zero means a null base pointer plus a field offset, here 8 bytes.",
      },
      {
        q: "Why does the debugger use hardware breakpoints for ESP32 code in flash?",
        options: [
          "Software breakpoints are slower",
          "A software breakpoint must overwrite the instruction, which cannot be done quickly in flash",
          "Flash code cannot be debugged at all",
          "Hardware breakpoints are unlimited",
        ],
        answer: 1,
        why: "Software breakpoints patch a break instruction into memory, which is easy in RAM but not in flash. Hardware breakpoints compare the program counter in silicon instead, and there are only two per core.",
      },
      {
        q: "A global variable is being corrupted by an unknown piece of code. Which tool finds the culprit fastest?",
        options: [
          "A breakpoint at the start of loop()",
          "A watchpoint on the variable",
          "Adding Serial.print to every function",
          "Increasing the task stack size",
        ],
        answer: 1,
        why: "A watchpoint halts the CPU on the exact instruction that writes the variable, with the call stack visible, whichever code it is.",
      },
      {
        q: "What does addr2line need to turn a backtrace address into a source line?",
        options: [
          "The .bin file that was uploaded",
          "The ELF file from exactly the same build that crashed",
          "Any ELF file from the same project",
          "The partition table",
        ],
        answer: 1,
        why: "Only the ELF holds the symbol and line tables, and addresses change with every build, so it must be the ELF of the very build that crashed.",
      },
      {
        q: "In MISRA C, what is a Required rule?",
        options: [
          "A rule that may never be broken under any circumstances",
          "A recommendation that may be ignored freely",
          "A rule that may be broken only with a documented and approved deviation",
          "A rule checked only by the compiler",
        ],
        answer: 2,
        why: "Mandatory rules are never broken; Required rules may be deviated from with a recorded justification and approval; Advisory rules are recommendations.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "a7-low-power-and-fault-tolerance": {
    id: "a7-low-power-and-fault-tolerance",
    outcomes: [
      "Choose ESP32 and AVR sleep modes and wake sources for a duty-cycled device",
      "Calculate average current and battery life from a measured power profile",
      "Measure a device's current correctly across microamps and hundreds of milliamps",
      "Use watchdogs, brown-out detection, reset reasons and safe states to make firmware recover from faults",
    ],
    blocks: [
      { t: "h", text: "Energy is a design input" },
      { t: "p", text: "A mains-powered device can afford to be careless. A battery-powered one cannot: its lifetime is set almost entirely by what the firmware does with the CPU and radio. The key quantity is **average current**. Most battery devices spend a short time awake, doing useful work at high current, and the rest asleep at very low current. That pattern is **duty cycling**, and its arithmetic is the most important formula in this lesson." },
      { t: "formula", text: String.raw`I_avg = (I_active × t_active + I_sleep × t_sleep) / (t_active + t_sleep)

battery life (hours) = usable capacity (mAh) / I_avg (mA)
usable capacity ≈ rated capacity × derating   (0.7 to 0.85 typical)`, caption: "Duty-cycle average and battery life. Add more terms if there are several active phases." },
      { t: "p", text: "Two consequences jump out. When the device sleeps most of the time, the sleep current dominates the result, so a few microamps matter more than a few milliamps of active current. And the active time is multiplied by a large current, so finishing the work quickly (connect fast, send, sleep) is worth more than running the CPU slowly. Engineers call this **race to sleep**." },

      { t: "h", text: "ESP32 power modes" },
      { t: "table", head: ["Mode", "What is on", "Typical chip current", "How it wakes"], rows: [
        ["Active, Wi-Fi transmitting", "Everything", "About 160 to 240 mA in bursts", "Running"],
        ["Modem sleep", "CPUs on, radio off between beacons", "About 20 to 70 mA (depends on clock)", "Running"],
        ["Light sleep", "CPUs paused, RAM and peripherals kept", "About 0.8 mA", "Timer, GPIO, UART, touch, ULP; resumes where it stopped"],
        ["Deep sleep", "RTC controller, RTC memory, optionally ULP", "About 10 µA (RTC timer and memory)", "Timer, ext0, ext1, touch, ULP; reboots into setup()"],
        ["Hibernation", "RTC timer only", "About 5 µA", "Timer, ext1"],
      ], caption: "ESP32 datasheet typical figures for the chip alone. A DevKit board draws far more; see below." },
      { t: "p", text: "**Light sleep** pauses the CPUs with RAM retained, so execution continues at the next line after `esp_light_sleep_start()`. It is good for waits of tens of milliseconds to seconds. **Deep sleep** powers down the CPUs and most RAM; waking is a reset, so the program starts again in `setup()`. Only variables marked `RTC_DATA_ATTR` (stored in 8 KB of RTC slow memory) survive. Use `esp_sleep_get_wakeup_cause()` to find out why you woke and `esp_reset_reason()` to distinguish a sleep wake from a power-on or a crash." },
      { t: "p", text: "The **wake sources** for deep sleep are: the RTC **timer** (`esp_sleep_enable_timer_wakeup(us)`); **ext0**, one RTC-capable GPIO at a chosen level (`esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, 0)`); **ext1**, several RTC GPIOs combined as any-high or all-low (`esp_sleep_enable_ext1_wakeup(mask, mode)`); the **touch** sensor; and the **ULP coprocessor**. Only RTC GPIOs (0, 2, 4, 12 to 15, 25 to 27, 32 to 39) can wake from deep sleep." },
      { t: "p", text: "The **ULP** (ultra-low-power) coprocessor is a tiny state machine processor that keeps running in deep sleep from RTC slow memory. It can read the ADC, poll an I2C sensor or count pulses, and wake the main CPUs only when a value crosses a threshold. A node that must react to a temperature change without waking every second uses it. On the original ESP32 it is programmed in a special assembly language through ESP-IDF; treat it as an advanced option once the simple timer pattern works." },
      { t: "snippet", lang: "cpp", code: String.raw`// Duty-cycled sensor node: wake, measure, report, deep sleep.
// Board: ESP32 DevKit, Arduino-ESP32 3.3.x.
#include "esp_sleep.h"
#include "esp_system.h"
#include "esp_task_wdt.h"

const uint64_t SLEEP_US = 60ULL * 1000000ULL;   // 60 s between readings
const gpio_num_t BUTTON = GPIO_NUM_33;          // RTC GPIO, button to GND, external pull-up

RTC_DATA_ATTR uint32_t bootCount = 0;            // survives deep sleep, lost on power-off
RTC_DATA_ATTR uint32_t wdtResets = 0;

const char *resetName(esp_reset_reason_t r) {
  switch (r) {
    case ESP_RST_POWERON:  return "power-on";
    case ESP_RST_DEEPSLEEP: return "deep sleep wake";
    case ESP_RST_BROWNOUT: return "brown-out";
    case ESP_RST_TASK_WDT: return "task watchdog";
    case ESP_RST_INT_WDT:  return "interrupt watchdog";
    case ESP_RST_PANIC:    return "panic";
    case ESP_RST_SW:       return "software restart";
    default:               return "other";
  }
}

void setup() {
  Serial.begin(115200);
  bootCount++;
  esp_reset_reason_t why = esp_reset_reason();
  if (why == ESP_RST_TASK_WDT || why == ESP_RST_INT_WDT) wdtResets++;
  Serial.printf("Boot %lu, reset: %s, watchdog resets so far: %lu\n",
                (unsigned long)bootCount, resetName(why), (unsigned long)wdtResets);

  switch (esp_sleep_get_wakeup_cause()) {
    case ESP_SLEEP_WAKEUP_TIMER: Serial.println("Woken by timer"); break;
    case ESP_SLEEP_WAKEUP_EXT0:  Serial.println("Woken by button"); break;
    default:                     Serial.println("Not a sleep wake"); break;
  }

  // Guard the awake phase: if anything hangs for 3 s, the task watchdog resets us.
  esp_task_wdt_config_t cfg = { .timeout_ms = 3000, .idle_core_mask = 0, .trigger_panic = true };
  esp_task_wdt_reconfigure(&cfg);
  esp_task_wdt_add(NULL);                  // watch this (the loop) task

  int raw = analogRead(34);                // the measurement
  esp_task_wdt_reset();
  Serial.printf("ADC = %d\n", raw);        // a real node would transmit here
  esp_task_wdt_reset();

  esp_task_wdt_delete(NULL);
  esp_sleep_enable_timer_wakeup(SLEEP_US);
  esp_sleep_enable_ext0_wakeup(BUTTON, 0); // wake when the pin goes low
  Serial.flush();
  esp_deep_sleep_start();                  // never returns; next wake runs setup() again
}

void loop() {}`, caption: "Compiled for esp32:esp32:esp32 with core 3.3.10. The watchdog and reset-reason parts are explained below." },

      { t: "h", text: "AVR sleep modes and the PRR" },
      { t: "p", text: "The ATmega328P has six sleep modes chosen with `set_sleep_mode()`: **Idle** (CPU stopped, all peripherals and timers run), **ADC noise reduction**, **Power-save** (like power-down but Timer2 keeps running from a 32 kHz crystal), **Standby**, **Extended standby**, and **Power-down** (oscillator stopped; only the watchdog, external interrupts, pin change and TWI address match can wake it). Power-down with the watchdog running draws a few microamps; the datasheet gives about 0.1 µA with the watchdog off at low voltage." },
      { t: "p", text: "Two more controls matter. The **Power Reduction Register** (PRR) stops the clock to individual peripherals (`PRADC`, `PRUSART0`, `PRSPI`, `PRTIM0`, `PRTIM1`, `PRTIM2`, `PRTWI`); avr-libc wraps it as `power_spi_disable()` and so on. It saves current while awake. And the **ADC** must be switched off (`ADEN` cleared) before sleep, because it draws current even in power-down; the brown-out detector can also be turned off for the duration of one sleep with `sleep_bod_disable()`." },
      { t: "snippet", lang: "cpp", code: String.raw`// Uno: sleep in power-down, wake every 8 s on the watchdog interrupt,
// take a reading, sleep again. Also reports why the chip last reset.
#include <avr/sleep.h>
#include <avr/power.h>
#include <avr/wdt.h>
#include <avr/interrupt.h>

uint8_t resetFlags __attribute__((section(".noinit")));
volatile bool wdtFired = false;

ISR(WDT_vect) { wdtFired = true; }   // interrupt mode: wakes us, no reset

void wdtInterrupt8s() {
  cli();
  wdt_reset();
  WDTCSR = _BV(WDCE) | _BV(WDE);              // timed sequence: unlock
  WDTCSR = _BV(WDIE) | _BV(WDP3) | _BV(WDP0); // interrupt only, about 8 s
  sei();
}

void sleepNow() {
  ADCSRA &= ~_BV(ADEN);              // ADC off: it draws current even in sleep
  set_sleep_mode(SLEEP_MODE_PWR_DOWN);
  cli();
  sleep_enable();
  sleep_bod_disable();               // BOD off for this sleep only
  sei();                             // the instruction after sei always runs, so no wake is lost
  sleep_cpu();
  sleep_disable();                   // execution resumes here after the ISR
  ADCSRA |= _BV(ADEN);
}

void setup() {
  resetFlags = MCUSR;
  MCUSR = 0;
  wdt_disable();
  Serial.begin(115200);
  Serial.print(F("Reset cause:"));
  if (resetFlags & _BV(PORF))  Serial.print(F(" power-on"));
  if (resetFlags & _BV(EXTRF)) Serial.print(F(" reset-pin"));
  if (resetFlags & _BV(BORF))  Serial.print(F(" brown-out"));
  if (resetFlags & _BV(WDRF))  Serial.print(F(" watchdog"));
  Serial.println();

  power_spi_disable();               // PRR: stop clocks to unused peripherals
  power_twi_disable();
  power_timer1_disable();
  power_timer2_disable();
  wdtInterrupt8s();
}

void loop() {
  int raw = analogRead(A0);
  Serial.print(F("A0 = "));
  Serial.println(raw);
  Serial.flush();                    // let the last byte leave before the clock stops
  sleepNow();
}`, caption: "Compiled for arduino:avr:uno: 2118 bytes. Timer0 is left running so millis() and Serial still work while awake." },
      { t: "note", kind: "warn", text: "The stock Uno bootloader (Optiboot 4.4) reads MCUSR and clears it before jumping to your sketch, so on a stock Uno the code above prints no cause at all. Optiboot 8 passes a copy of the flags to the sketch in register r2 instead. On a chip programmed without a bootloader (via ISP) the code above reports causes reliably." },

      { t: "h", text: "The board is not the chip" },
      { t: "p", text: "Put an ESP32 DevKit into deep sleep and measure it: you will see several milliamps, not 10 µA. The AMS1117 regulator's quiescent current, the USB-to-serial chip and the power LED stay on regardless of what the ESP32 does. An Uno is worse, around 30 mA in power-down, because of its regulator, its USB chip (an ATmega16U2) and its LEDs. Sleep modes only pay off on a board designed for them: a bare module, a regulator with microamp quiescent current, no always-on LEDs, and sensors that are switched off or put in their own sleep mode. Design and measure the **whole board**." },

      { t: "h", text: "Worked example: battery life of a sensor node" },
      { t: "p", text: "A node wakes every 10 minutes (600 s), stays awake 2 s at an average of 80 mA (Wi-Fi connect, send, disconnect), and sleeps the rest. It runs from a 2000 mAh lithium cell; take 80% as usable. Compare a well-designed board sleeping at 15 µA with a DevKit sleeping at 6 mA." },
      { t: "formula", text: String.raw`charge per cycle, awake  = 2 s × 80 mA          = 160 mA·s
custom board, asleep     = 598 s × 0.015 mA     = 8.97 mA·s
I_avg                    = (160 + 8.97) / 600   = 0.282 mA
life                     = 2000 × 0.8 / 0.282   ≈ 5680 h ≈ 237 days

DevKit, asleep           = 598 s × 6 mA         = 3588 mA·s
I_avg                    = (160 + 3588) / 600   = 6.25 mA
life                     = 1600 / 6.25          ≈ 256 h ≈ 10.7 days
check: 0.282 mA × 5680 h ≈ 1600 mAh ✓   6.25 mA × 256 h = 1600 mAh ✓`, caption: "Same firmware, same battery: the board's sleep current changes the life by a factor of 22." },
      { t: "p", text: "Now look at where the custom board's charge goes: 160 of 169 mA·s per cycle is the awake phase. The next improvement is firmware: cutting the awake time from 2 s to 1 s (a static IP instead of DHCP, a faster connect, sending a smaller message) almost halves the average current, to (80 + 8.985)/600 ≈ 0.148 mA, and nearly doubles the life. On the DevKit, by contrast, the awake time barely matters because the sleep term swamps it. The formula tells you which lever to pull." },
      { t: "p", text: "For the Uno-style logger above on a bare ATmega328P (no board), suppose 5 ms awake at 5 mA every 8 s and 6 µA asleep with the watchdog running: I_avg = (0.005 × 5 + 7.995 × 0.006)/8 ≈ 9.1 µA. Three AA alkaline cells of about 2500 mAh with 80% usable would last 2000/0.0091 ≈ 220 000 h, about 25 years on paper. In practice the cells' own self-discharge (a few per cent a year) and shelf life end it first; at microamp levels the battery chemistry, not the firmware, sets the limit." },

      { t: "h", text: "Measuring a power profile" },
      { t: "p", text: "Current in a duty-cycled device spans five orders of magnitude, from microamps to a quarter of an amp, in bursts of milliseconds. A multimeter in series on its µA range has a large **burden voltage** (the drop across its internal shunt): typically around 100 mV per mA on the lowest range, so the 200 mA wake-up spike drops the supply and the ESP32 browns out. Professional and practical options:" },
      { t: "list", items: [
        "**A shunt resistor and an oscilloscope.** A 1 Ω resistor in the ground return gives 1 mV per mA; good for the active phase, useless for microamps.",
        "**A source-measure or power profiler**: Nordic's Power Profiler Kit II, Joulescope or Otii. These switch ranges automatically, sample at 100 kHz or more, and integrate charge over a cycle. This is what \"a measured power profile\" in the exit project means.",
        "**Two-stage measurement** with a multimeter: measure the sleep current on the µA range with the device held in sleep, then the active phase with the shunt and scope, and combine them in the formula. Short the meter during wake-ups to avoid brown-outs.",
      ] },

      { t: "h", text: "Fault tolerance: watchdogs" },
      { t: "p", text: "Field firmware will eventually hang: a bus lock-up, a deadlock (a5), a loop waiting for a reply that never comes. A **watchdog** is a hardware timer that resets the chip unless the firmware \"feeds\" it in time. It turns a permanent hang into a brief reboot. The ESP32 has several:" },
      { t: "list", items: [
        "**Task watchdog (TWDT).** Watches chosen tasks; each must call `esp_task_wdt_reset()` within the timeout. In Arduino-ESP32 3.3 it starts at boot with a 5 s timeout, watching the IDLE task of core 0 and set to panic. The sketch above reconfigures it to 3 s and subscribes the loop task with `esp_task_wdt_add(NULL)`.",
        "**Interrupt watchdog.** Fires if interrupts stay disabled or an ISR runs too long (default 300 ms), catching a stuck ISR.",
        "**RTC watchdog.** Guards the boot process and is used by the bootloader.",
      ] },
      { t: "p", text: "A watchdog is only as good as where you feed it. Feed it from a timer interrupt and it will happily keep a deadlocked application alive, because the interrupt still runs. Feed it only at the point that proves the system is doing its job: after a complete control cycle, or, with several tasks, from a supervisor that feeds only when every task has checked in recently. The TWDT's per-task subscription does this for you." },
      { t: "p", text: "On the AVR, `wdt_enable(WDTO_2S)` sets a 2 s reset watchdog and `wdt_reset()` feeds it. The sketch above uses the same peripheral in interrupt mode as a wake timer instead. After a watchdog reset the watchdog stays enabled with its shortest timeout, so the very first thing a sketch must do is clear `MCUSR` and call `wdt_disable()`, as the AVR sketch does; otherwise it can reset again before `setup()` finishes, in an endless loop. Old Uno bootloaders had exactly this bug." },

      { t: "h", text: "Brown-out and safe states" },
      { t: "p", text: "A **brown-out** is a supply dip below the voltage at which the chip runs reliably, for example when a motor starts or a battery sags under a Wi-Fi burst. Below that point the CPU may execute garbage and corrupt flash. The **brown-out detector** (BOD) holds the chip in reset until the supply recovers. The ESP32's BOD threshold is configurable; Arduino-ESP32 3.3 uses level 0, about 2.43 V. The Uno's fuses set the ATmega328P's BOD at 2.7 V. Do not disable the BOD to stop the resets: fix the supply (bulk capacitance, a separate motor supply, a regulator that can deliver the 500 mA peak), and use the reset reason to log that it happened." },
      { t: "p", text: "Every reset, for any reason, should lead to a **safe state**: the condition in which the device does no harm while it starts up or while it has failed. Relays de-energised, motors stopped, heaters off, valves in their fail-safe position. Three rules make it real. Choose hardware so the safe state is the unpowered state (a pull-down on a MOSFET gate, a normally-closed valve where closed is safe). Set outputs to safe values as the first lines of `setup()`, before any slow initialisation. And log the reset reason (both sketches above do) and count repeated faults in RTC memory or NVS, so that a device that has crashed three times in an hour can stop retrying the risky action and report itself instead of cycling forever." },
      { t: "note", kind: "safety", text: "A watchdog reset re-runs your start-up code with the outputs in an unknown state for a few milliseconds. Anything that can injure, burn or flood (mains loads, heaters, pumps, actuators) must be safe in hardware during reset and must never rely on firmware alone." },

      { t: "h", text: "The exit project" },
      { t: "p", text: "The module's exit project brings the five lessons together into one product-grade firmware. Use your best earlier connected project, on the ESP32, and deliver:" },
      { t: "list", ordered: true, items: [
        "**Layered source** (lesson 1): app, drivers, HAL interfaces and a BSP folder, with no hardware headers above the BSP.",
        "**Automated tests** (lesson 3): host unit tests with Unity for every driver and for the application state machine, with fakes for the bus and the clock, run by a GitHub Actions workflow that also builds the firmware and keeps the binary and ELF.",
        "**An update scheme** (lesson 2): A/B OTA from a server, with a self-test that confirms or rolls back, demonstrated with a deliberately bad build. Document the partition table you chose and why.",
        "**Static analysis** (lesson 4): cppcheck clean in CI, and a one-page house coding standard.",
        "**A measured power profile** (this lesson): current versus time for one full cycle, the sleep current, the charge per cycle, and a battery-life estimate with the formula, checked against the measurement.",
        "**Fault handling**: the task watchdog subscribed, the reset reason logged, a counted fault limit, and a written statement of the safe state.",
      ] },

      { t: "deep", title: "Wake-up cost and the break-even sleep time", blocks: [
        { t: "p", text: "Sleeping is not free. Waking from deep sleep costs boot time: on the ESP32 the bootloader and app start take roughly 100 to 300 ms at around 40 to 50 mA before your code runs, and Wi-Fi reconnection adds more. Light sleep wakes in under a millisecond but sleeps at about 0.8 mA rather than 10 µA. For a gap of length T, deep sleep wins only if its saving exceeds the wake cost:" },
        { t: "formula", text: String.raw`saving = (I_light − I_deep) × T = (0.8 − 0.01) mA × T
cost   ≈ 45 mA × 0.2 s = 9 mA·s
break-even T = 9 / 0.79 ≈ 11.4 s`, caption: "Illustrative figures; measure your own board's boot charge." },
        { t: "p", text: "So for gaps under about ten seconds, light sleep is usually better; for minutes, deep sleep wins by a wide margin. Shortening the boot (skipping the bootloader's image verification on wake with `CONFIG_BOOTLOADER_SKIP_VALIDATE_IN_DEEP_SLEEP`, lowering log output) moves the break-even down." },
      ] },
      { t: "deep", title: "Battery capacity is not a constant", blocks: [
        { t: "p", text: "A cell's rated mAh is measured at a gentle discharge rate and room temperature. Pulse loads of 200 mA from a small lithium cell cause voltage dips through its internal resistance (a coin cell's 10 to 30 Ω makes a CR2032 useless for Wi-Fi), cold cuts capacity sharply, and the regulator's dropout means the device stops before the cell is truly empty. That is what the derating factor stands for. For an honest estimate, take the capacity at the cut-off voltage your regulator and BOD imply, at the coldest expected temperature, and add self-discharge as a constant extra current (a 2000 mAh cell losing 3% a year is losing 60 mAh / 8760 h ≈ 7 µA, comparable to a good sleep current)." },
        { t: "p", text: "Measure rather than assume. Run a prototype from the real cell at the real temperature with a profiler logging current and voltage, and note the voltage dip during the transmit burst. If the dip approaches the BOD threshold late in the cell's life, the device will start resetting long before the capacity figure says it is flat." },
      ] },
      { t: "deep", title: "Designing a fault counter that cannot trap you", blocks: [
        { t: "p", text: "Counting resets is easy; acting on the count safely needs care. Store the counter in RTC memory if it only needs to survive watchdog and sleep resets, or in NVS (flash) if it must survive power loss, but then write it sparingly (flash has tens of thousands of erase cycles per sector, and NVS spreads writes). Decay the counter: clear it after a period of healthy running, otherwise a device that crashed three times over a year eventually locks itself out. Define what \"degraded mode\" means in advance (for example: stay awake for diagnostics, disable the actuator, report every hour) and make sure the update path still works in it, so the fix can arrive over the air." },
        { t: "snippet", lang: "cpp", code: String.raw`RTC_DATA_ATTR uint8_t faults = 0;      // survives watchdog resets and deep sleep
RTC_DATA_ATTR uint32_t healthySince = 0;

bool degraded() { return faults >= 3; }

void onBoot(esp_reset_reason_t why) {
  if (why == ESP_RST_TASK_WDT || why == ESP_RST_PANIC || why == ESP_RST_BROWNOUT) {
    if (faults < 255) faults++;
  }
}

void onHealthyCycle(uint32_t uptime_s) {
  if (uptime_s - healthySince > 3600) { faults = 0; healthySince = uptime_s; } // decay
}`, caption: "The shape of a decaying fault counter. Uptime must itself be kept across sleeps for the decay to work." },
      ] },
    ],
    mistakes: [
      "**Measuring sleep current on a DevKit or Uno and blaming the chip.** The regulator, USB chip and LEDs draw milliamps; only a purpose-built board shows the chip's microamps.",
      "**Using a multimeter's µA range through a Wi-Fi burst.** The burden voltage browns out the ESP32 and the reading is wrong. Use a profiler, or measure sleep and active phases separately.",
      "**Feeding the watchdog from a timer interrupt.** It then proves only that interrupts run, not that the application is alive.",
      "**Forgetting wdt_disable() early after an AVR watchdog reset.** The watchdog stays on with a short timeout and resets the chip again during start-up.",
      "**Disabling the brown-out detector to stop resets.** The resets are a symptom of a weak supply; without the BOD the chip runs corrupted instead.",
      "**Setting outputs late in setup().** Until the first write, a relay or motor driver may be in whatever state the pin floats to. Make outputs safe first.",
    ],
    practice: {
      kind: "bench",
      task: "Measure a power profile for a duty-cycled ESP32 node and make it recover from a hang.",
      steps: [
        "Upload the deep-sleep node sketch with SLEEP_US set to 10 s. Confirm the boot count rises and the wake cause alternates correctly when you press the button.",
        "Measure the sleep current with a multimeter on its µA or mA range (start on the highest range, and power the board through its 3V3 pin from a bench supply to bypass the USB chip if you can). Record the value and explain the difference from 10 µA.",
        "Measure the awake phase: put a 1 Ω resistor in the supply return, view it on an oscilloscope (1 mV = 1 mA), and estimate the awake time and average current. Or use a power profiler if your lab has one.",
        "Compute the average current and battery life for a 2000 mAh cell with your measured numbers and with a 15 µA sleep current. Show each step and check the result by multiplying back.",
        "Add a while(true) {} after the analogRead. Confirm the task watchdog resets the board within 3 s, that the reset reason reads task watchdog and that the watchdog counter increments. Then describe the safe state your device would need if GPIO 26 drove a pump.",
      ],
    },
    quiz: [
      {
        q: "A node is awake 1 s at 100 mA and asleep 99 s at 0.02 mA. What is its average current?",
        options: ["About 1.02 mA", "About 50 mA", "About 0.02 mA", "About 10 mA"],
        answer: 0,
        why: "(1 × 100 + 99 × 0.02) / 100 = (100 + 1.98) / 100 = 1.02 mA. The awake phase dominates here.",
      },
      {
        q: "In the worked example, the DevKit lasts about 11 days and the custom board about 237 days with the same firmware. Why?",
        options: [
          "The DevKit's ESP32 is a slower chip",
          "The DevKit's regulator, USB chip and LED draw milliamps during sleep, and sleep current dominates when the device sleeps 99.7% of the time",
          "The custom board transmits less often",
          "The DevKit cannot enter deep sleep",
        ],
        answer: 1,
        why: "Both run the same duty cycle. The sleep term is 3588 mA·s per cycle on the DevKit against 9 mA·s on the custom board, so the board's always-on parts set the life.",
      },
      {
        q: "After ESP32 deep sleep, which statement is true?",
        options: [
          "Execution continues at the line after esp_deep_sleep_start()",
          "All global variables keep their values",
          "The chip restarts in setup(); only RTC_DATA_ATTR variables survive",
          "Wi-Fi stays connected",
        ],
        answer: 2,
        why: "Waking from deep sleep is a reset. Ordinary RAM is lost; RTC slow memory, where RTC_DATA_ATTR variables live, is kept. Light sleep is the mode that resumes in place.",
      },
      {
        q: "Where should a task watchdog be fed to give real protection?",
        options: [
          "From a hardware timer interrupt every 100 ms",
          "At the point in the task that proves a full cycle of useful work completed",
          "At the very start of setup() only",
          "Nowhere: watchdogs should be disabled in products",
        ],
        answer: 1,
        why: "Feeding from an interrupt proves only that interrupts run. Feeding after a completed cycle means a hang anywhere in the cycle stops the feeding and triggers recovery.",
      },
      {
        q: "An ESP32 robot resets every time its motors start, and the reset reason is brown-out. What is the right fix?",
        options: [
          "Disable the brown-out detector",
          "Lower the BOD threshold to the minimum",
          "Fix the supply: bulk capacitance, a separate motor supply or a stronger regulator",
          "Increase the task watchdog timeout",
        ],
        answer: 2,
        why: "The BOD is correctly stopping the chip running on a voltage too low for reliable operation. The cause is the supply sagging under motor inrush, so the supply is what must change.",
      },
      {
        q: "Why must an AVR sketch clear MCUSR and call wdt_disable() early after a watchdog reset?",
        options: [
          "To save power",
          "Because the watchdog stays enabled with a short timeout and would reset the chip again before start-up completes",
          "Because Serial does not work otherwise",
          "To re-enable the brown-out detector",
        ],
        answer: 1,
        why: "After a watchdog reset the WDRF flag keeps the watchdog enabled at its shortest period. Unless it is cleared and disabled straight away, the chip can reset repeatedly in a loop.",
      },
    ],
  },
};

export default lessons;
