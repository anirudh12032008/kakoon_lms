import type { ModuleContent } from "../model/curriculum";

/**
 * Module i4: Embedded C, C++ and MicroPython.
 * Versions: Arduino AVR core 1.8.8 (avr-gcc), Arduino-ESP32 core 3.x, MicroPython 1.2x.
 * Every complete C/C++ program here was compiled with arduino-cli for arduino:avr:uno,
 * and the portable ones also for esp32:esp32:esp32.
 */
const lessons: ModuleContent = {
  "i4-types-overflow-and-fixed-point": {
    id: "i4-types-overflow-and-fixed-point",
    outcomes: [
      "Read the C++ that the block editor generates and rewrite it by hand",
      "Choose fixed-width integer types and predict when a calculation overflows",
      "Explain why `int` is 16 bits on the Uno and 32 bits on the ESP32, and what breaks because of it",
      "Do sensor arithmetic in fixed point instead of float",
      "Say how MicroPython integers differ from C integers",
    ],
    blocks: [
      { t: "h", text: "From blocks to text" },
      { t: "p", text: "Everything you built with blocks in the beginner tier was turned into C++ before it reached the board. The editor's code view shows it: a `setup()` that runs once, a `loop()` that runs forever, and calls such as `pinMode()` and `digitalWrite()`. Writing that text yourself gives you things blocks cannot: your own functions and data structures, several files, exact control over types and memory, and the ability to read any library or example on the internet. The price is that the compiler no longer protects you from the details. This module teaches those details, starting with the one that causes the most silent bugs: how big a number is." },
      { t: "p", text: "A hand-written version of a typical generated sketch, a blink with a counter:" },
      { t: "snippet", lang: "cpp", code: String.raw`// Board: Arduino Uno or ESP32 DevKit (LED pin differs: 13 on the Uno, 2 on most DevKits)
#if defined(ARDUINO_ARCH_ESP32)
const uint8_t LED_PIN = 2;
#else
const uint8_t LED_PIN = 13;
#endif

uint32_t blinks = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
  blinks++;
  Serial.print("blinks: ");
  Serial.println(blinks);
}`, caption: "Compiled for arduino:avr:uno and esp32:esp32:esp32." },
      { t: "p", text: "Notice what the generated code usually does not do: name the pin as a constant, choose a type with an explicit size, or adapt to the board. Those three habits are where hand-written firmware starts." },

      { t: "h", text: "Integer widths: the same code, different numbers" },
      { t: "p", text: "C only promises minimum sizes for its basic types. `int` must be at least 16 bits, and compilers pick whatever suits the CPU. On the 8-bit AVR in the Uno, `int` is **16 bits** (range -32768 to 32767). On the 32-bit Xtensa CPU in the ESP32, `int` is **32 bits** (about ±2.1 billion). Code that works on one board can overflow on the other." },
      { t: "table", head: ["Type", "Uno (AVR)", "ESP32", "Range"], rows: [
        ["`char`", "8 bits, signed", "8 bits, signed", "-128 to 127"],
        ["`int`", "16 bits", "32 bits", "board-dependent"],
        ["`long`", "32 bits", "32 bits", "about ±2.1 × 10⁹"],
        ["`float`", "32 bits", "32 bits", "about 7 significant digits"],
        ["`double`", "32 bits (same as float)", "64 bits", "board-dependent"],
        ["pointer", "16 bits", "32 bits", "address size"],
      ], caption: "Check with sizeof(): the program below prints these on your own board." },
      { t: "p", text: "The cure is the fixed-width types from `<stdint.h>` (already included by Arduino.h): `int8_t`, `uint8_t`, `int16_t`, `uint16_t`, `int32_t`, `uint32_t`, `int64_t`, `uint64_t`. Each is exactly that many bits on every compiler. Use them for anything that is stored, sent over a wire, or near a limit. Use `uint8_t` for pin numbers and bytes, `uint32_t` for anything holding `millis()`." },

      { t: "h", text: "Overflow" },
      { t: "p", text: "An **unsigned** type wraps around modulo 2ⁿ, and this is defined behaviour: a `uint8_t` holding 255 plus 1 is 0; a `uint16_t` holding 65535 plus 1 is 0. A **signed** overflow is **undefined behaviour** in C and C++: the standard says nothing about the result, and an optimising compiler may assume it never happens and remove your checks. Never rely on signed overflow." },
      { t: "p", text: "The classic Uno bug: `unsigned long timeout = 60 * 1000;`. Both literals are `int`, so the multiplication is done in 16 bits. 60000 does not fit in a signed 16-bit int (maximum 32767). The compiler warns about the overflow, and on AVR the stored bit pattern reads back as 60000 - 65536 = **-5536**, then is converted to unsigned long as 4294961760. On the ESP32 the same line is correct, because `int` is 32 bits. Fix: `60UL * 1000`, where the `UL` suffix makes the first operand unsigned long so the whole calculation is 32-bit." },
      { t: "p", text: "The second classic: scaling an ADC reading to millivolts. `int mv = reading * 5000 / 1023;` With reading = 512 the product 512 × 5000 = 2,560,000 does not fit in 16 bits. Cast first: `uint32_t mv = (uint32_t)reading * 5000 / 1023;` gives 2,560,000 / 1023 = 2502 mV (integer division drops the .44). Check: 2502 / 5000 × 1023 ≈ 512. Correct." },
      { t: "note", kind: "tip", text: "Time arithmetic with millis() wraps after 2³² ms = 4,294,967,296 ms, about 49.7 days. Writing `if (millis() - start >= interval)` with all values `uint32_t` stays correct across the wrap, because unsigned subtraction wraps too. Writing `if (millis() >= start + interval)` breaks at the wrap." },

      { t: "h", text: "Why not just use float?" },
      { t: "p", text: "The ATmega328P has no floating-point hardware. Every float add or multiply is a library routine of tens to hundreds of instructions, and the library itself costs about 1 to 2 KB of the Uno's 32 KB flash. A float also has only 24 bits of precision: 16,777,217 cannot be stored exactly, so a float counter stops incrementing at 16,777,216. The ESP32 has a single-precision FPU, so `float` is fast there, but `double` is still done in software." },

      { t: "h", text: "Fixed-point arithmetic" },
      { t: "p", text: "**Fixed point** stores a fractional value as an integer with an agreed scale. The simplest form is decimal scaling: store 23.45 °C as the integer 2345 hundredths of a degree in an `int16_t`. Adding two values is ordinary integer addition. Multiplying by an integer is ordinary multiplication. Printing it needs one division and one remainder: 2345 / 100 = 23 and 2345 % 100 = 45." },
      { t: "p", text: "Binary scaling is faster because the scale is a power of two, so rescaling is a shift. In **Q8.8** format a 16-bit value has 8 integer bits and 8 fraction bits: the real value is the integer divided by 256. 1.5 is stored as 384 and 2.25 as 576. To multiply, multiply the integers in 32 bits (the product has 16 fraction bits) and shift right by 8 to get back to Q8.8." },
      { t: "formula", text: String.raw`a = 1.5   → 1.5  × 256 = 384
b = 2.25  → 2.25 × 256 = 576
a × b     → (384 × 576) >> 8 = 221184 >> 8 = 864
864 / 256 = 3.375  ✓  (1.5 × 2.25 = 3.375)` },
      { t: "p", text: "Rules of thumb: keep enough integer bits for the largest value and enough fraction bits for the resolution you need; do the multiply in a wider type; round by adding half before shifting (add 128 before `>> 8`) if truncation bias matters." },
      { t: "snippet", lang: "cpp", code: String.raw`// Integer width, overflow and fixed point. Board: Arduino Uno or ESP32 DevKit.
#include <Arduino.h>

int16_t q88(float x) { return (int16_t)(x * 256.0f); }      // only for setting constants

int16_t q88_mul(int16_t a, int16_t b) {
  return (int16_t)(((int32_t)a * b + 128) >> 8);             // widen, round, rescale
}

void printCentidegrees(int16_t cdeg) {
  if (cdeg < 0) { Serial.print('-'); cdeg = -cdeg; }
  Serial.print(cdeg / 100);
  Serial.print('.');
  if (cdeg % 100 < 10) Serial.print('0');
  Serial.println(cdeg % 100);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.print("sizeof(int) = ");    Serial.println(sizeof(int));     // 2 on Uno, 4 on ESP32
  Serial.print("sizeof(long) = ");   Serial.println(sizeof(long));    // 4 on both
  Serial.print("sizeof(double) = "); Serial.println(sizeof(double));  // 4 on Uno, 8 on ESP32

  uint8_t u = 255;
  u++;                                                    // defined: wraps to 0
  Serial.print("uint8_t 255 + 1 = "); Serial.println(u);

  uint16_t reading = 512;
  uint32_t mv = (uint32_t)reading * 5000 / 1023;          // widen before multiplying
  Serial.print("512 counts = "); Serial.print(mv); Serial.println(" mV");   // 2502

  int16_t p = q88_mul(q88(1.5f), q88(2.25f));
  Serial.print("1.5 * 2.25 in Q8.8 = "); Serial.print(p);
  Serial.print(" -> "); Serial.println(p / 256.0f, 3);    // 864 -> 3.375

  printCentidegrees(2345);                                // 23.45
  printCentidegrees(-705);                                // -7.05
}

void loop() {}`, caption: "Compiled for arduino:avr:uno and esp32:esp32:esp32. Run it on both boards and compare the first three lines." },

      { t: "h", text: "MicroPython: the same ideas, different rules" },
      { t: "p", text: "MicroPython (this module uses version 1.2x on the ESP32) hides integer width. Its `int` is **arbitrary precision**: `2**100` works and nothing ever overflows. Small integers (that fit in a machine word minus a tag bit, 31 bits on the ESP32) are stored directly and are fast; larger ones become heap objects, which costs memory and time. When you talk to hardware you must mask results yourself, for example `(a + b) & 0xFFFF` to mimic a 16-bit register. Floats on the ESP32 port are single precision. Use `from micropython import const` for constants: `LED_PIN = const(2)` lets the compiler substitute the number instead of looking up a global name at run time." },
      { t: "snippet", lang: "python", code: String.raw`# MicroPython on ESP32 DevKit
from micropython import const

SCALE = const(256)          # Q8.8

def q88_mul(a, b):
    return (a * b + SCALE // 2) >> 8   # no overflow possible: ints grow as needed

a = int(1.5 * SCALE)        # 384
b = int(2.25 * SCALE)       # 576
p = q88_mul(a, b)
print(p, p / SCALE)         # 864 3.375

x = 65535
print((x + 1) & 0xFFFF)     # 0: mask to mimic a 16-bit register
print(2 ** 40)              # 1099511627776: no overflow, but a heap object`, caption: "Syntax-checked with python3 -m py_compile." },

      { t: "deep", title: "Integer promotion and the usual arithmetic conversions", blocks: [
        { t: "p", text: "Before any arithmetic, C promotes types smaller than `int` (char, short, uint8_t, int16_t on ESP32) to `int`. Then, if the operands differ, the \"usual arithmetic conversions\" convert both to a common type: if either is unsigned and at least as wide as int, the signed one is converted to unsigned. This produces two famous surprises." },
        { t: "list", items: [
          "`uint8_t a = 200, b = 100; if (a + b > 255)` is **true**, because the sum is computed in int as 300. Store it back into a uint8_t and you get 44.",
          "`int x = -1; unsigned int y = 1; if (x < y)` is **false**, because x is converted to unsigned (65535 on AVR, 4294967295 on ESP32). GCC warns with -Wsign-compare.",
        ] },
        { t: "p", text: "On AVR, `uint16_t * uint16_t` promotes to... nothing, because uint16_t is already as wide as int: it is done as unsigned int, 16 bits, and wraps. On ESP32 the same expression promotes both to 32-bit int. Turn on all warnings (Arduino IDE: Preferences, Compiler warnings: All; arduino-cli: `--warnings all`) and read every one." },
      ] },
      { t: "deep", title: "Why signed overflow is undefined, and what the optimiser does with it", blocks: [
        { t: "p", text: "C was standardised when machines used one's complement, sign-magnitude and two's complement, so the committee left signed overflow undefined. Modern compilers exploit that: given `for (int i = 0; i >= 0; i++)` GCC may conclude that i is always non-negative and generate an infinite loop, since \"i++ overflowing\" cannot happen in a valid program. C++20 finally requires two's complement representation, but overflow is still undefined." },
        { t: "p", text: "If you want wrap-around, use unsigned types. If you want to detect overflow, test before the operation (`if (a > INT16_MAX - b)`) or use GCC's `__builtin_add_overflow(a, b, &result)`, which returns true on overflow and is available in both the AVR and ESP32 toolchains." },
      ] },
    ],
    mistakes: [
      "**Using `int` for millis() values.** On the Uno it overflows after 32.8 s. Use `uint32_t` (or `unsigned long`).",
      "**Writing `60 * 1000` on AVR.** Both operands are 16-bit int; write `60UL * 1000`.",
      "**Multiplying before widening.** `(uint32_t)(a * b)` casts after the overflow has already happened. Cast an operand: `(uint32_t)a * b`.",
      "**Comparing signed with unsigned.** -1 becomes a huge unsigned number. Keep both sides the same signedness.",
      "**Assuming double is more precise on the Uno.** It is the same 32-bit float.",
      "**Forgetting to mask in MicroPython.** Python ints never wrap, so code ported from C that relies on 8- or 16-bit wrap gives different answers until you add `& 0xFF` or `& 0xFFFF`.",
    ],
    practice: {
      kind: "bench",
      task: "Find integer-width bugs by running the same program on two boards.",
      steps: [
        "Upload the width and fixed-point program to an Uno and an ESP32 DevKit. Record the three sizeof lines from each in a table.",
        "Add a line `long t = 60 * 1000;` and print t. Compile with warnings set to All, read the warning, and compare the printed values on the two boards.",
        "Fix the line with the UL suffix and confirm both boards print 60000.",
        "Read the LDR or potentiometer on A0 (Uno) or GPIO 34 (ESP32, scale by 3300 / 4095 instead), convert to millivolts in pure integer arithmetic, and compare with a multimeter.",
        "Write the same conversion in MicroPython on the ESP32 and confirm it gives the same result.",
      ],
    },
    quiz: [
      {
        q: "On an Uno, what does `int16_t x = 200 * 200;` risk?",
        options: [
          "Nothing: 40000 fits in 16 bits",
          "Signed overflow, because 40000 is larger than 32767",
          "A compile error only on the ESP32",
          "Loss of the fractional part",
        ],
        answer: 1,
        why: "200 × 200 = 40000, which exceeds the int16_t maximum of 32767. On AVR the multiplication itself is done in 16-bit int.",
      },
      {
        q: "Why does `millis() - start >= interval` keep working when millis() wraps after about 49.7 days?",
        options: [
          "millis() never actually wraps",
          "The compiler inserts a check",
          "Unsigned subtraction also wraps, so the difference is still the elapsed time",
          "start is reset automatically",
        ],
        answer: 2,
        why: "With uint32_t values, (small after wrap) - (large before wrap) wraps modulo 2³², giving the true elapsed count.",
      },
      {
        q: "In Q8.8 fixed point, what real value does the integer 640 represent?",
        options: ["2.5", "6.4", "0.4", "640"],
        answer: 0,
        why: "Q8.8 divides by 256: 640 / 256 = 2.5.",
      },
      {
        q: "Which expression correctly converts a 10-bit ADC reading to millivolts on the Uno without overflow?",
        options: [
          "`(uint32_t)(reading * 5000) / 1023`",
          "`reading * 5000 / 1023`",
          "`reading / 1023 * 5000`",
          "`(uint32_t)reading * 5000 / 1023`",
        ],
        answer: 3,
        why: "The cast must apply to an operand before the multiplication so the product is computed in 32 bits. Dividing first loses everything to integer division (reading / 1023 is 0 or 1).",
      },
      {
        q: "What happens in MicroPython when you compute 65535 + 1?",
        options: [
          "It wraps to 0",
          "It gives 65536; MicroPython integers have arbitrary precision",
          "It raises OverflowError",
          "It becomes a float",
        ],
        answer: 1,
        why: "Python integers grow as needed. To mimic a 16-bit register you must mask with & 0xFFFF yourself.",
      },
    ],
  },

  "i4-pointers-structs-and-bits": {
    id: "i4-pointers-structs-and-bits",
    outcomes: [
      "Use pointers to pass data to functions and walk arrays",
      "Group related data with structs and name states with enums",
      "Set, clear, toggle and test bits with masks, as in register code",
      "Pack and unpack multi-byte values with shifts",
    ],
    blocks: [
      { t: "h", text: "Why these features run every peripheral" },
      { t: "p", text: "Every hardware register is a memory address. Every driver passes buffers around by address. Every sensor packet is a set of fields packed into bytes. Pointers, structs and bit operations are not academic C features: they are how firmware talks to hardware. Get them right and register-level code in the next module will read like plain English." },

      { t: "h", text: "Pointers" },
      { t: "p", text: "A **pointer** is a variable that holds the address of another variable. `&x` gives the address of x; `*p` follows the pointer to the value it points at. The type says what is at the address, so `int16_t *p` points at a 16-bit integer, and `p + 1` moves forward by two bytes, not one." },
      { t: "p", text: "Pointers solve three problems. A function can change the caller's variable (C passes arguments by copy). A function can work on a large buffer without copying it. And code can reach fixed hardware addresses. C++ also offers **references** (`int16_t &x`), which are pointers that cannot be null or reseated, with nicer syntax; Arduino libraries use both." },
      { t: "snippet", lang: "cpp", code: String.raw`// Pointers, arrays, structs and enums. Board: Arduino Uno or ESP32 DevKit.
#include <Arduino.h>

enum class Mode : uint8_t { Idle, Measuring, Alarm };   // named states, 1 byte each

struct Reading {
  uint32_t timeMs;
  int16_t  centiDeg;   // fixed point: hundredths of a degree
  Mode     mode;
};

// Function changes the caller's variables through pointers.
void minMax(const int16_t *data, size_t n, int16_t *outMin, int16_t *outMax) {
  *outMin = data[0];
  *outMax = data[0];
  for (size_t i = 1; i < n; i++) {
    if (data[i] < *outMin) *outMin = data[i];
    if (data[i] > *outMax) *outMax = data[i];
  }
}

// Structs are passed by const reference to avoid copying.
void printReading(const Reading &r) {
  Serial.print(r.timeMs);
  Serial.print(" ms  ");
  Serial.print(r.centiDeg / 100.0f, 2);
  Serial.print(" C  mode=");
  Serial.println(static_cast<uint8_t>(r.mode));
}

const int16_t samples[] = {2310, 2295, 2402, 2288, 2350};
const size_t N = sizeof(samples) / sizeof(samples[0]);  // 5, computed by the compiler

void setup() {
  Serial.begin(115200);
  delay(1000);

  int16_t lo, hi;
  minMax(samples, N, &lo, &hi);
  Serial.print("min "); Serial.print(lo);
  Serial.print("  max "); Serial.println(hi);           // min 2288  max 2402

  const int16_t *p = samples;          // array name decays to a pointer to element 0
  Serial.print("third via pointer: ");
  Serial.println(*(p + 2));            // 2402, same as samples[2]

  Reading r = { millis(), hi, hi > 2400 ? Mode::Alarm : Mode::Measuring };
  printReading(r);
  Serial.print("sizeof(Reading) = ");
  Serial.println(sizeof(Reading));     // 7 on Uno, 8 on ESP32 (padding)
}

void loop() {}`, caption: "Compiled for arduino:avr:uno and esp32:esp32:esp32." },
      { t: "p", text: "Points to notice. `const int16_t *data` promises the function will not modify the array; write `const` wherever it is true, and the compiler will catch mistakes. An array passed to a function becomes a pointer to its first element and loses its length, so always pass the length too. `sizeof(samples) / sizeof(samples[0])` gives the element count only where the array itself is in scope, not inside a function that received a pointer." },
      { t: "note", kind: "warn", text: "Writing past the end of an array is not caught in C. On the Uno it silently overwrites whatever variable sits next in SRAM, or the stack, and the program misbehaves far from the bug. Always loop with `i < n`, never `i <= n`." },

      { t: "h", text: "Structs and padding" },
      { t: "p", text: "A **struct** groups fields into one type. Its size can be larger than the sum of its fields, because 32-bit CPUs need multi-byte fields aligned to addresses that are multiples of their size. The Reading struct above has 4 + 2 + 1 = 7 bytes of fields. On the 8-bit AVR there is no alignment requirement, so sizeof is 7. On the ESP32, the struct is padded to a multiple of 4 (its largest field's alignment), giving 8. This matters when you send a struct over a radio or write it to EEPROM and read it on a different chip: the layouts differ." },
      { t: "p", text: "An **enum** names a set of integer constants. Prefer `enum class` in C++: its values must be written `Mode::Alarm`, they do not convert silently to int, and you can fix the underlying type (`: uint8_t`) so it uses one byte. State machines in firmware are almost always an enum plus a `switch`." },

      { t: "h", text: "Bitwise operations" },
      { t: "table", head: ["Operator", "Meaning", "Example (8 bits)", "Result"], rows: [
        ["`&`", "AND", "1100 1010 & 0000 1111", "0000 1010"],
        ["`|`", "OR", "1100 1010 | 0000 0001", "1100 1011"],
        ["`^`", "XOR", "1100 1010 ^ 1111 0000", "0011 1010"],
        ["`~`", "NOT (invert)", "~1100 1010", "0011 0101"],
        ["`<<`", "Shift left", "0000 0011 << 2", "0000 1100"],
        ["`>>`", "Shift right", "1100 0000 >> 3", "0001 1000"],
      ], caption: "Do not confuse & with && or | with ||: the doubled forms are logical and give only true or false." },
      { t: "p", text: "Four idioms cover nearly all register work. Build a mask with `1 << n` (or the Arduino macro `_BV(n)` on AVR), then:" },
      { t: "formula", text: String.raw`set bit n:     reg |=  (1 << n);
clear bit n:   reg &= ~(1 << n);
toggle bit n:  reg ^=  (1 << n);
test bit n:    if (reg & (1 << n)) ...
read a field:  (reg >> shift) & mask        e.g. bits 4..6: (reg >> 4) & 0x07
write a field: reg = (reg & ~(mask << shift)) | ((value & mask) << shift)` },
      { t: "p", text: "Worked example: reg = 0b1010 0000 and you want to set bit 1 and clear bit 7. Set bit 1: 1010 0000 | 0000 0010 = 1010 0010. Clear bit 7: the mask is ~(1000 0000) = 0111 1111, and 1010 0010 & 0111 1111 = 0010 0010 = 0x22. Check: bit 7 is now 0, bit 5 unchanged at 1, bit 1 is 1. Correct." },
      { t: "p", text: "On the Uno, the built-in LED on D13 is bit 5 of port B. The two lines below do what `pinMode(13, OUTPUT)` and toggling `digitalWrite` do, using the AVR register names from avr-libc. Each compiles to a single instruction instead of a few dozen." },
      { t: "snippet", lang: "cpp", code: String.raw`// Register-style blink. Board: Arduino Uno only (ATmega328P registers).
#include <avr/io.h>

void setup() {
  DDRB |= (1 << DDB5);       // PB5 (D13) as output
}

void loop() {
  PORTB ^= (1 << PORTB5);    // toggle PB5
  delay(250);
}`, caption: "Compiled for arduino:avr:uno. The next module covers these registers fully." },
      { t: "p", text: "Multi-byte values are assembled with shifts. A sensor sends a 16-bit reading as a high byte then a low byte: `uint16_t v = ((uint16_t)hi << 8) | lo;`. With hi = 0x01 and lo = 0x2C that gives 0x012C = 300. To send a value: `hi = v >> 8; lo = v & 0xFF;`. The cast before the shift matters on AVR: `hi << 8` on a promoted 16-bit int is fine for bytes, but for a 32-bit result you must cast to uint32_t first." },

      { t: "h", text: "MicroPython equivalents" },
      { t: "p", text: "Python has no pointers: names refer to objects, and mutable objects such as `bytearray` and lists are shared rather than copied when passed to a function, which gives the same effect. Bitwise operators are the same (`& | ^ ~ << >>`), but `~x` on a positive int gives a negative number (`~5 == -6`) because ints are unbounded, so mask: `~x & 0xFF`. For packed binary data use the `struct` module: `struct.unpack('>h', buf)` reads a big-endian int16 from two bytes. For registers, `machine.mem32[address]` reads and writes a 32-bit word at an address, the closest MicroPython gets to a C pointer." },

      { t: "deep", title: "volatile, and pointers to hardware registers", blocks: [
        { t: "p", text: "In avr-libc, `PORTB` is a macro that expands roughly to `(*(volatile uint8_t *)0x25)`: take the number 0x25, treat it as the address of an 8-bit value, and dereference it. `volatile` tells the compiler that the value can change, or that writing has an effect, outside its view, so it must perform every read and write exactly as written. Without volatile, the optimiser could merge two writes, or read a status register once and loop on the cached copy forever." },
        { t: "p", text: "Use `volatile` for variables shared between an interrupt service routine and the main loop too. But volatile does not make an operation atomic: on the 8-bit AVR, reading a `volatile uint16_t` takes two instructions, and an interrupt between them can give you the high byte of one value and the low byte of another. Wrap such reads in `noInterrupts(); copy = shared; interrupts();`, or on AVR use `ATOMIC_BLOCK(ATOMIC_RESTORESTATE)` from `<util/atomic.h>`." },
      ] },
      { t: "deep", title: "Bit fields, packed structs and endianness", blocks: [
        { t: "p", text: "C lets you declare struct members with a width in bits: `struct { uint8_t mode : 3; uint8_t enable : 1; } cfg;`. It looks perfect for registers but the standard leaves bit order, padding and access width to the compiler. Vendor headers (ESP-IDF's register structs, CMSIS) do use bit fields, because they are tied to one compiler and chip. For portable code and anything sent over a wire, use explicit masks and shifts." },
        { t: "p", text: "`__attribute__((packed))` removes padding so a struct matches a wire format byte for byte, at the cost of slower, possibly unaligned access on 32-bit CPUs. Endianness also matters: AVR, ESP32 and x86 are all little-endian (low byte at the lower address), but most network protocols and many sensors (BME280 is mixed, MPU-6050 is big-endian) send the high byte first. Assembling values with shifts, as above, is correct whatever the CPU's endianness; casting a byte buffer to a struct pointer is not." },
      ] },
    ],
    mistakes: [
      "**Using `&&` where `&` was meant.** `if (reg && 0x04)` is true whenever reg is non-zero.",
      "**Clearing a bit with `reg &= (1 << n)`.** That clears every bit except n. You need the inverted mask `~(1 << n)`.",
      "**Taking sizeof of an array parameter.** Inside the function it is a pointer, so sizeof gives 2 (Uno) or 4 (ESP32). Pass the length.",
      "**Returning a pointer to a local variable.** The local is gone when the function returns; the pointer now points at reused stack.",
      "**Sending a struct raw between an Uno and an ESP32.** Padding differs (7 versus 8 bytes for the example). Serialise field by field.",
    ],
    practice: {
      kind: "bench",
      task: "Write a tiny bit-manipulation library and test it on the board.",
      steps: [
        "Write four functions: setBit, clearBit, toggleBit and testBit, each taking a `uint8_t *reg` and a bit number. Write a fifth, writeField(reg, shift, width, value).",
        "In setup(), start from 0xA0, apply a sequence of operations you have worked out on paper, and print each result in binary with Serial.println(x, BIN). Compare with your paper results.",
        "On an Uno, use the same functions on the real PORTB register (pass `&PORTB`, which needs the pointer type `volatile uint8_t *`) to blink D13. Notice the compiler error first, and fix the parameter type.",
        "Define a struct for a sensor packet (time, temperature, humidity, status flags). Print its sizeof on an Uno and an ESP32 and explain the difference.",
      ],
    },
    quiz: [
      {
        q: "reg = 0x5A (0101 1010). What is reg after `reg &= ~(1 << 3);`?",
        options: ["0x52", "0x5A", "0x08", "0x5E"],
        answer: 0,
        why: "Bit 3 of 0101 1010 is 1. Clearing it gives 0101 0010 = 0x52.",
      },
      {
        q: "A function has the parameter `int16_t *out`. How does it store 42 in the caller's variable?",
        options: ["out = 42;", "&out = 42;", "*out = 42;", "out[42] = 1;"],
        answer: 2,
        why: "*out follows the pointer to the caller's variable. Assigning to out itself would only change the local copy of the address.",
      },
      {
        q: "A struct holds a uint32_t, an int16_t and a uint8_t. Why is sizeof 8 on the ESP32 but 7 on the Uno?",
        options: [
          "The ESP32 stores int16_t in 3 bytes",
          "The ESP32 pads the struct for 4-byte alignment; the AVR has no alignment requirement",
          "The Uno compresses structs",
          "uint8_t is 2 bytes on the ESP32",
        ],
        answer: 1,
        why: "The 32-bit CPU pads the struct to a multiple of its largest field's alignment (4). The 8-bit AVR does not pad.",
      },
      {
        q: "A sensor sends hi = 0x03, lo = 0xE8. What 16-bit value is ((uint16_t)hi << 8) | lo?",
        options: ["1000", "232", "1003", "768"],
        answer: 0,
        why: "0x03E8 = 3 × 256 + 232 = 768 + 232 = 1000.",
      },
      {
        q: "Why must a variable shared between an ISR and loop() be declared volatile?",
        options: [
          "It makes reads atomic",
          "It stores the variable in flash",
          "It makes the variable faster to access",
          "It stops the compiler caching the value, so every access really reads or writes memory",
        ],
        answer: 3,
        why: "Without volatile the optimiser may keep the value in a register and never see the ISR's change. Volatile does not make multi-byte access atomic; that needs interrupts disabled.",
      },
    ],
  },

  "i4-modules-build-and-memory": {
    id: "i4-modules-build-and-memory",
    outcomes: [
      "Split firmware into .h and .cpp modules with include guards and clear interfaces",
      "Use scope, static and const to keep module internals private",
      "Describe each stage of the build: preprocess, compile, link, hex or bin, flash",
      "Read the Uno's memory map and explain stack, heap, .data and .bss",
      "Explain why String and malloc fragment the heap on AVR, and what to use instead",
    ],
    blocks: [
      { t: "h", text: "Why structure matters on a tiny chip" },
      { t: "p", text: "A 300-line single sketch is still readable. A 3000-line one, with every variable global, is not: changing a timing constant breaks the display, and nobody knows which function owns which pin. Professional firmware is split into **modules**, each a pair of files with a small public interface and private internals. Knowing what the compiler and linker do with those files also explains the numbers the IDE prints after every compile, and why a sketch that compiles fine still crashes when it runs out of RAM." },

      { t: "h", text: "Functions and scope" },
      { t: "p", text: "A variable declared inside a function is **local**: it lives on the stack and disappears when the function returns. A variable declared outside every function is **global**: it lives for the whole program and can be reached from any file that declares it with `extern`. Two keywords change this. `static` on a local variable makes it keep its value between calls (it is stored like a global but visible only in the function). `static` on a global variable or function makes it **private to its file**, so no other file can see or clash with it. In C++ an unnamed `namespace { }` does the same job." },
      { t: "p", text: "`const` declares a value that cannot change. A `const` global of a simple type takes no RAM at all if its address is never taken, because the compiler substitutes the number. Prefer `const uint8_t LED_PIN = 13;` (or `constexpr`) over `#define LED_PIN 13`: it has a type, obeys scope and shows up in the debugger." },

      { t: "h", text: "Header and source files" },
      { t: "p", text: "A module has a **header** (`.h`) that declares what other files may use, and a **source** file (`.cpp`) that defines it. Other files `#include` the header. The header holds function prototypes, type definitions and `extern` declarations; it never holds variable definitions or function bodies (except `inline` ones), or every file that includes it would get its own copy and the linker would complain of multiple definitions." },
      { t: "p", text: "A header must also survive being included twice, which happens easily when two headers include a third. An **include guard** does it: the first time, the macro is undefined, so the contents are read and the macro is defined; the second time the contents are skipped. Most compilers also accept `#pragma once`, which is shorter but not in the C standard." },
      { t: "snippet", lang: "cpp", code: String.raw`// File: Blinker.h  (public interface)
#ifndef BLINKER_H
#define BLINKER_H

#include <Arduino.h>

class Blinker {
public:
  Blinker(uint8_t pin, uint32_t periodMs);
  void begin();
  void update();               // call often from loop(); never blocks
  void setPeriod(uint32_t periodMs);
private:
  uint8_t  pin_;
  uint32_t periodMs_;
  uint32_t lastToggle_ = 0;
  bool     on_ = false;
};

#endif  // BLINKER_H`, caption: "The guard name is the file name in capitals, by convention." },
      { t: "snippet", lang: "cpp", code: String.raw`// File: Blinker.cpp  (implementation)
#include "Blinker.h"

Blinker::Blinker(uint8_t pin, uint32_t periodMs) : pin_(pin), periodMs_(periodMs) {}

void Blinker::begin() {
  pinMode(pin_, OUTPUT);
  digitalWrite(pin_, LOW);
}

void Blinker::update() {
  uint32_t now = millis();
  if (now - lastToggle_ >= periodMs_ / 2) {   // half period on, half off
    lastToggle_ = now;
    on_ = !on_;
    digitalWrite(pin_, on_ ? HIGH : LOW);
  }
}

void Blinker::setPeriod(uint32_t periodMs) { periodMs_ = periodMs; }` },
      { t: "snippet", lang: "cpp", code: String.raw`// File: firmware.ino  (main sketch; the folder must also be called firmware)
// Board: Arduino Uno (LED on D13) or ESP32 DevKit (LED on GPIO 2).
#include "Blinker.h"

#if defined(ARDUINO_ARCH_ESP32)
Blinker led(2, 1000);
#else
Blinker led(13, 1000);
#endif

void setup() {
  Serial.begin(115200);
  led.begin();
}

void loop() {
  led.update();
  if (Serial.available()) {
    long ms = Serial.parseInt();           // type a period in ms, e.g. 200
    if (ms > 0) led.setPeriod((uint32_t)ms);
  }
}`, caption: "The three files compiled together with arduino-cli for arduino:avr:uno and esp32:esp32:esp32." },
      { t: "p", text: "The Arduino build compiles every `.cpp` file in the sketch folder automatically, so the three files above are a complete project. The main sketch knows nothing about how Blinker works, only the five public members. You could rewrite Blinker to use a hardware timer without touching firmware.ino. That separation is the whole point." },

      { t: "h", text: "The build pipeline" },
      { t: "p", text: "When you press Verify, these steps run. On the Uno the tools are avr-gcc, avr-objcopy and avrdude; on the ESP32 they are xtensa-esp32-elf-gcc and esptool." },
      { t: "list", ordered: true, items: [
        "**Sketch preparation (Arduino only).** The .ino files are joined, `#include <Arduino.h>` is added and function prototypes are generated, producing a real .cpp file.",
        "**Preprocess.** `#include` pastes in headers, `#define` macros are expanded, `#if` blocks are kept or dropped. The output is pure C++ with no `#` lines.",
        "**Compile.** Each .cpp file becomes an **object file** (.o) of machine code, with unresolved references (\"I call `digitalWrite`, address unknown\"). Each file is compiled alone, which is why it needs headers to know what other files contain.",
        "**Link.** The linker joins all object files and the core library, resolves every reference to an address, and lays out code and data in memory according to a linker script. Missing or duplicated definitions are reported here (\"undefined reference to\", \"multiple definition of\"). The output is an **ELF** file, which includes debug information.",
        "**Convert.** avr-objcopy extracts the raw bytes into an Intel **.hex** file (Uno); esptool makes a **.bin** image (ESP32), along with a bootloader and a partition table.",
        "**Flash.** avrdude talks to the Optiboot bootloader on the Uno over serial at 115200 baud and writes the hex into flash; esptool talks to the ESP32's ROM bootloader and writes the bin into external SPI flash.",
      ] },
      { t: "p", text: "At the end the IDE prints two numbers, for the blink sketch at the start of this module on the Uno: \"Sketch uses 2182 bytes (6%) of program storage space. Maximum is 32256 bytes. Global variables use 200 bytes (9%) of dynamic memory, leaving 1848 bytes for local variables. Maximum is 2048 bytes.\" (Most of those 200 bytes are the Serial buffers.) Program storage is your code plus constant data in flash; 32256 is 32 KB minus the 512-byte bootloader. Dynamic memory is the RAM taken by globals; what is left must hold the stack and heap." },

      { t: "h", text: "Memory map of the Uno" },
      { t: "diagram", text: String.raw`ATmega328P data address space
0x0000 ┌───────────────────────────┐
       │ 32 CPU registers           │
0x0020 ├───────────────────────────┤
       │ 64 I/O registers (PORTB...)│
0x0060 ├───────────────────────────┤
       │ 160 extended I/O registers │
0x0100 ├───────────────────────────┤  start of 2048 bytes of SRAM
       │ .data  initialised globals │  (initial values copied from flash at reset)
       ├───────────────────────────┤
       │ .bss   zeroed globals      │
       ├───────────────────────────┤
       │ heap   grows upward  ↓     │  malloc, new, String
       │                            │
       │        free space          │
       │                            │
       │ stack  grows downward ↑    │  locals, return addresses, ISR context
0x08FF └───────────────────────────┘  RAMEND`, caption: "Global variables use .data plus .bss. Stack and heap share what is left and grow towards each other." },
      { t: "p", text: "Check: 0x08FF - 0x0100 + 1 = 0x0800 = 2048 bytes. The **stack** holds every function call's local variables and return address; it grows down from RAMEND and shrinks when functions return. The **heap** holds memory requested at run time with `malloc` or `new`. Nothing stops the two meeting: when they do, the stack overwrites heap data or globals, and the Uno resets or behaves strangely, with no error message. The ESP32 has 520 KB of SRAM and FreeRTOS gives each task its own fixed stack, with a canary that reports \"stack overflow\" instead of failing silently." },

      { t: "h", text: "Why to avoid String and malloc on the Uno" },
      { t: "p", text: "The Arduino `String` class stores its text on the heap and reallocates every time it grows. Concatenating in a loop (`s += c;`) allocates a slightly bigger block, copies, and frees the old one. Freed blocks of different sizes leave holes. After a while there may be 500 bytes free in total but no single hole of 100 bytes, so the next allocation fails. This is **heap fragmentation**. On a PC with gigabytes of memory nobody notices; on 2 KB it ends the program after hours or days. A failed `String` allocation does not crash immediately; the string just stays empty, which is worse because the bug is hidden." },
      { t: "list", items: [
        "Use fixed-size `char` buffers and `snprintf()` for formatting: `char buf[32]; snprintf(buf, sizeof buf, \"T=%d.%02d\", whole, frac);` Note that AVR's snprintf has no `%f` by default.",
        "Allocate everything at start-up (globals or `static`), never in `loop()`.",
        "Keep constant strings out of RAM with the `F()` macro: `Serial.println(F(\"Sensor ready\"));`. On AVR, string literals are otherwise copied into SRAM at start-up.",
        "On the ESP32 the heap is large and String is usually fine, but the same rules make long-running devices more robust.",
      ] },
      { t: "p", text: "MicroPython allocates for you constantly (every new int above 31 bits, every string, every list) and runs a garbage collector when the heap fills. That pause can be several milliseconds. Pre-allocate buffers (`buf = bytearray(64)`) and reuse them, call `gc.collect()` at a moment that suits you, and check `micropython.mem_info()` to see fragmentation." },

      { t: "deep", title: "Measuring free RAM on the Uno", blocks: [
        { t: "p", text: "avr-libc's linker defines symbols at the edges of each region. The address of a fresh local variable is the current stack top, and `__brkval` is the current heap end (zero before the first malloc). The gap between them is the free memory right now. Call it from deep inside your most nested function to find your worst case." },
        { t: "snippet", lang: "cpp", code: String.raw`// Free RAM between heap and stack. Board: Arduino Uno only.
extern char __heap_start;
extern char *__brkval;

int freeRam() {
  char top;   // lives at the current top of the stack
  return &top - (__brkval == 0 ? &__heap_start : __brkval);
}

void setup() {
  Serial.begin(115200);
  Serial.print(F("free RAM: "));
  Serial.println(freeRam());
}

void loop() {}`, caption: "Compiled for arduino:avr:uno. On the ESP32 use ESP.getFreeHeap() and uxTaskGetStackHighWaterMark(NULL) instead." },
        { t: "p", text: "`avr-size -C --mcu=atmega328p firmware.elf` prints the .text, .data and .bss sizes separately, and `avr-nm --size-sort -C firmware.elf` lists every symbol by size: the quickest way to find what ate your RAM. The ELF is in the build directory (arduino-cli prints it with `--verbose`, or set `--build-path`)." },
      ] },
      { t: "deep", title: "What the linker script and the start-up code do", blocks: [
        { t: "p", text: "Before `main()` runs, start-up code supplied by the toolchain (crt for AVR, the ESP-IDF boot sequence for ESP32) sets the stack pointer, copies the initial values of .data from flash into RAM, fills .bss with zeros, runs C++ global constructors, and only then calls `main()`. Arduino's `main()` calls `init()` (timers for millis, ADC setup), then `setup()`, then `loop()` forever. That is why a global object's constructor must not call hardware functions that rely on `init()`: it runs too early, which is why Arduino classes have a separate `begin()`." },
        { t: "p", text: "The linker script maps output sections to memory regions: .text and .rodata to flash, .data and .bss to RAM. On the ESP32 it is more involved: code normally runs from flash through a cache (IROM), code marked `IRAM_ATTR` is copied into internal instruction RAM, and constant data sits in DROM. Interrupt handlers must be in IRAM because the flash cache is disabled during flash writes." },
      ] },
    ],
    mistakes: [
      "**Defining a variable in a header.** `int count = 0;` in a header included by two files gives \"multiple definition\". Put `extern int count;` in the header and the definition in one .cpp.",
      "**Forgetting the include guard.** Including a header twice redefines its class and the compile fails.",
      "**Building strings with String += in loop() on the Uno.** It fragments the heap and fails after hours. Use a fixed char buffer.",
      "**Large local arrays.** `char buf[1024];` inside a function puts 1 KB on a 2 KB stack. Make big buffers static or global so they appear in the compile summary.",
      "**Calling pinMode() in a global constructor.** It runs before init(); use a begin() method called from setup().",
      "**Reading \"Global variables use 70%\" as fine.** The remaining 30% must hold the whole stack and heap. Above about 75% on the Uno, expect trouble.",
    ],
    practice: {
      kind: "bench",
      task: "Split a sketch into modules and watch the build.",
      steps: [
        "Create the three-file Blinker project above in a folder named firmware. Compile it with `arduino-cli compile -b arduino:avr:uno --verbose firmware` and find the avr-gcc, linker and avr-objcopy command lines in the output.",
        "Delete the include guard and include Blinker.h twice in firmware.ino. Read the error, then restore the guard.",
        "Add a second Blinker on another pin with a different period, and confirm both blink independently with no delay().",
        "Add the freeRam() function. Print it, then add `String s; for (int i = 0; i < 200; i++) s += 'x';` in loop() and print free RAM and s.length() each pass for a minute. Then replace it with a fixed char buffer and compare.",
        "Note the program and global sizes after each change in a small table.",
      ],
    },
    quiz: [
      {
        q: "Which stage reports \"undefined reference to `sensorRead()`\"?",
        options: ["The preprocessor", "The compiler", "The linker", "avrdude"],
        answer: 2,
        why: "Each file compiles alone with only a declaration. The linker is where every call must be matched to a definition, so a missing definition is reported there.",
      },
      {
        q: "What does an include guard prevent?",
        options: [
          "The contents of a header being processed twice in one compile, which would redefine its types",
          "A header being included by more than one .cpp file",
          "Global variables being used in other files",
          "The linker removing unused functions",
        ],
        answer: 0,
        why: "The guard skips the header's contents on the second inclusion within the same translation unit. Separate .cpp files each include it once, which is normal.",
      },
      {
        q: "The compile summary says globals use 1600 of 2048 bytes on an Uno. Why is this risky?",
        options: [
          "Flash will run out",
          "The ESP32 core will not compile it",
          "EEPROM is shared with globals",
          "Only 448 bytes remain for the stack and heap, and they can collide without any error",
        ],
        answer: 3,
        why: "2048 - 1600 = 448 bytes for every function call's locals and return addresses plus the heap. Overflow corrupts data silently.",
      },
      {
        q: "Why does repeated String concatenation eventually fail on an Uno even when total free memory looks adequate?",
        options: [
          "String uses EEPROM",
          "Freed blocks of different sizes leave holes, so no single free block is big enough",
          "The compiler limits Strings to 64 characters",
          "Serial cannot print long Strings",
        ],
        answer: 1,
        why: "That is heap fragmentation: free memory is split into small pieces, and an allocation needs one contiguous block.",
      },
      {
        q: "What does `static` do to a function defined in a .cpp file?",
        options: [
          "Makes it run faster",
          "Keeps its local variables between calls",
          "Makes it visible only within that file",
          "Places it in flash",
        ],
        answer: 2,
        why: "At file scope, static gives internal linkage: no other file can call it or clash with its name.",
      },
    ],
  },

  "i4-debugging-and-version-control": {
    id: "i4-debugging-and-version-control",
    outcomes: [
      "Add serial logging that can be switched off at compile time",
      "Use assertions to catch impossible states close to their cause",
      "Describe what a hardware debugger gives you and how it connects to an AVR or ESP32",
      "Put a firmware project under Git with a sensible .gitignore and history",
      "Rewrite a beginner project as a clean multi-file project (exit project)",
    ],
    blocks: [
      { t: "h", text: "Why debugging needs a method" },
      { t: "p", text: "Embedded bugs are harder than desktop bugs. There is no screen, the program runs at full speed against real time, and a crash often just looks like a reset. Changing code at random until the symptom disappears leaves the real cause in place. A method does better: make the failure repeatable, observe the program's state close to the failure, form one hypothesis, test it with one change. The tools for observing, from cheapest to most powerful, are serial logging, assertions and a hardware debugger. Version control is the other half: it lets you go back to the last version that worked and see exactly what changed." },

      { t: "h", text: "Serial logging done properly" },
      { t: "p", text: "`Serial.println()` is the simplest debugger, but scattered prints have costs. Each byte at 115200 baud takes about 87 µs (10 bits per byte including start and stop), so a 40-character line takes about 3.5 ms; once the 64-byte transmit buffer on the Uno is full, `print()` blocks until there is room, changing your timing. String literals use SRAM on AVR unless wrapped in `F()`. And debug prints left in release firmware waste flash and time." },
      { t: "p", text: "The professional pattern is a logging macro with levels that compiles to nothing when disabled. Include a timestamp and a tag so you can tell when and where each line came from." },
      { t: "snippet", lang: "cpp", code: String.raw`// Compile-time logging and assertions. Board: Arduino Uno or ESP32 DevKit.
#include <Arduino.h>

#if defined(ARDUINO_ARCH_ESP32)
const uint8_t LED_PIN = 2;
#else
const uint8_t LED_PIN = 13;
#endif

#define LOG_LEVEL 2          // 0 = off, 1 = errors, 2 = info, 3 = debug

#if LOG_LEVEL >= 1
  #define LOG_E(msg, val) do { Serial.print(millis()); Serial.print(F(" E ")); \
                               Serial.print(F(msg)); Serial.println(val); } while (0)
#else
  #define LOG_E(msg, val) do {} while (0)
#endif
#if LOG_LEVEL >= 2
  #define LOG_I(msg, val) do { Serial.print(millis()); Serial.print(F(" I ")); \
                               Serial.print(F(msg)); Serial.println(val); } while (0)
#else
  #define LOG_I(msg, val) do {} while (0)
#endif

// Assertion: report the file and line, then stop with the LED flashing.
#define ASSERT(cond) do { if (!(cond)) assertFailed(__FILE__, __LINE__); } while (0)

void assertFailed(const char *file, int line) {
  Serial.print(F("ASSERT FAILED "));
  Serial.print(file);
  Serial.print(':');
  Serial.println(line);
  Serial.flush();
  pinMode(LED_PIN, OUTPUT);
  for (;;) {                                    // halt here so the state is visible
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(100);
  }
}

const uint8_t MAX_ZONES = 4;
uint16_t thresholds[MAX_ZONES] = {100, 200, 300, 400};

uint16_t thresholdFor(uint8_t zone) {
  ASSERT(zone < MAX_ZONES);                     // catches an out-of-range index at its source
  return thresholds[zone];
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  LOG_I("boot, zones=", MAX_ZONES);
  for (uint8_t z = 0; z <= MAX_ZONES; z++) {    // deliberate bug: <= instead of <
    LOG_I("threshold=", thresholdFor(z));
  }
  LOG_E("not reached", 0);
}

void loop() {}`, caption: "Compiled for arduino:avr:uno and esp32:esp32:esp32. The deliberate off-by-one stops at the ASSERT with file and line." },
      { t: "p", text: "Two details. The `do { ... } while (0)` wrapper makes a multi-statement macro behave like one statement, so `if (x) LOG_I(\"a\", 1); else ...` compiles correctly. And without the ASSERT, the fifth iteration would read past the end of `thresholds` and print whatever lies next in memory: a wrong number, with no error, far from the cause." },

      { t: "h", text: "Assertions" },
      { t: "p", text: "An **assertion** states something that must be true if the program is correct: an index is in range, a pointer is not null, a state machine is in a known state. It is not error handling for things that can legitimately go wrong (a sensor not responding, Wi-Fi dropping): those need real code paths. Assertions catch your own logic errors, and they catch them where they happen rather than three functions later. The standard `assert()` from `<assert.h>` works on the ESP32 (it prints the failed expression and aborts, and the board resets with a backtrace). On AVR, a custom macro like the one above is more useful because it can report over Serial." },
      { t: "p", text: "C++ also has `static_assert(condition, \"message\")`, checked by the compiler, free at run time. Use it for facts about types and constants: `static_assert(sizeof(Packet) == 8, \"Packet layout changed\");` stops a build in which someone has broken a wire format." },

      { t: "h", text: "Hardware debuggers in outline" },
      { t: "p", text: "A hardware debugger connects to a debug port on the chip and lets a PC halt the CPU, step one line at a time, set **breakpoints** (stop when this line runs) and **watchpoints** (stop when this variable changes), and inspect every variable and register, all without adding a single print. You see the state at the moment of failure instead of guessing from logs." },
      { t: "table", head: ["Board", "Debug interface", "Probe", "Software"], rows: [
        ["Uno (ATmega328P)", "debugWIRE over the RESET pin", "Microchip Atmel-ICE, MPLAB PICkit 4/5, or the open-source dw-link on a second Uno", "Microchip Studio, or avr-gdb with dw-link"],
        ["ESP32 DevKit (original ESP32)", "JTAG on GPIO 12 to 15", "ESP-PROG (FT2232H based) or another FT2232H probe", "OpenOCD plus gdb, via ESP-IDF or PlatformIO"],
        ["ESP32-S3, ESP32-C3", "Built-in USB-JTAG on the USB pins", "Just a USB cable", "OpenOCD plus gdb; Arduino IDE 2 debugger"],
      ] },
      { t: "p", text: "On the Uno, debugWIRE requires removing or cutting the reset capacitor on the board (the auto-reset circuit loads the RESET line) and it disables normal reset while enabled, so it is a deliberate step. On the original ESP32, the JTAG pins are GPIO 12, 13, 14 and 15, so a design that uses those pins for other things cannot be debugged this way; GPIO 12 also sets the flash voltage at boot, so be careful what you connect to it." },

      { t: "h", text: "Version control with Git" },
      { t: "p", text: "**Git** records snapshots (**commits**) of your project folder. Each commit has a message, an author, a time and a unique hash, and points to the commit before it. You can compare any two versions, go back to one, or work on an experiment on a separate **branch** without disturbing the version that works. For firmware this answers the most useful debugging question there is: \"what changed since it last worked?\"" },
      { t: "snippet", lang: "bash", code: String.raw`# One-time setup
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"

# Start tracking a project
cd ~/Arduino/firmware
git init
printf "build/\n*.elf\n*.hex\n*.bin\n.vscode/\nsecrets.h\n" > .gitignore
git add .
git commit -m "Initial blinker module and main sketch"

# Everyday cycle: look, stage, commit
git status                    # what changed?
git diff                      # exactly which lines?
git add Blinker.cpp
git commit -m "Blinker: use half-period timing so duty is 50%"

# Experiments on a branch
git switch -c try-hw-timer    # create and switch
# ... edit, test, commit ...
git switch main               # back to the working version
git merge try-hw-timer        # keep the experiment if it worked

# History and recovery
git log --oneline             # short history
git restore Blinker.cpp       # throw away uncommitted edits to one file
git tag v1.0                  # mark the version you flashed to the demo board`, caption: "Git 2.23 or later for git switch and git restore." },
      { t: "p", text: "What to commit: every source file, headers, a README with board, core version and wiring, and the library versions you used. What not to commit: build outputs (they are regenerated), editor settings, and **secrets**. Wi-Fi passwords and API keys go in a `secrets.h` that is listed in .gitignore, with a `secrets.example.h` committed in its place. Once a secret is in a commit and pushed, assume it is public, even if you delete it later, because the old commit still contains it." },
      { t: "p", text: "Good commit messages say what and why in one line, in the imperative: \"Fix overflow in ADC scaling on AVR\", not \"changes\". Commit small, working steps: if each commit compiles and runs, `git bisect` can later find the exact commit that introduced a bug by testing halfway points." },

      { t: "h", text: "Exit project plan" },
      { t: "p", text: "Take a beginner project, such as a traffic light, a thermometer with a display, or a reaction game, and rewrite it as clean firmware. A good structure for a thermometer: `Sensor.h/.cpp` reads and converts to centidegrees in fixed point; `Display.h/.cpp` shows a value (reuse the 74HC595 display from module i3); `Config.h` holds pins and constants; the main sketch only wires them together in a non-blocking `loop()`. Add the logging macros and at least two ASSERTs. Commit after each module works, so the history tells the story." },

      { t: "deep", title: "Using git bisect to find the commit that broke it", blocks: [
        { t: "p", text: "If version v1.0 worked and the current version fails, `git bisect` does a binary search through the commits between them. With 64 commits it needs at most log₂ 64 = 6 tests." },
        { t: "snippet", lang: "bash", code: String.raw`git bisect start
git bisect bad                 # current commit fails
git bisect good v1.0           # this tag worked
# Git checks out a commit halfway. Build, flash, test, then say:
git bisect good                # or: git bisect bad
# ...repeat until Git prints "<hash> is the first bad commit"
git bisect reset               # return to where you started` },
        { t: "p", text: "Bisect only works if every commit builds. That is the strongest argument for small commits that each compile. If testing can be scripted (for example a unit test of your conversion functions on the PC), `git bisect run ./test.sh` does the whole search unattended." },
      ] },
      { t: "deep", title: "MicroPython debugging and speed: native and viper", blocks: [
        { t: "p", text: "MicroPython gives you a REPL over USB serial, which is itself a debugger: stop the program with Ctrl-C, inspect variables, call functions by hand. Exceptions print a traceback with file and line. `micropython.mem_info()` prints heap usage and `micropython.mem_info(1)` adds a map of heap blocks, which shows fragmentation visibly. Tools: `mpremote` (official) to copy files and open the REPL, Thonny for a simple IDE." },
        { t: "p", text: "For speed-critical functions, MicroPython offers two code emitters. The decorator `@micropython.native` compiles a function to machine code instead of bytecode, typically about twice as fast, with almost no restrictions. `@micropython.viper` goes further: with type hints such as `int`, `uint` and `ptr8`, integers become raw machine words (so they **do** overflow, like C) and you can index memory directly. Viper can be ten or more times faster than bytecode for bit-bashing loops." },
        { t: "snippet", lang: "python", code: String.raw`# MicroPython on ESP32 DevKit: three versions of the same checksum.
import micropython, time

def xor_py(buf):
    c = 0
    for b in buf:
        c ^= b
    return c

@micropython.native
def xor_native(buf):
    c = 0
    for b in buf:
        c ^= b
    return c

@micropython.viper
def xor_viper(buf, n: int) -> int:
    p = ptr8(buf)            # raw byte pointer, like uint8_t* in C
    c = 0
    for i in range(n):
        c ^= p[i]
    return c

data = bytearray(range(256)) * 16    # 4096 bytes
for f in (xor_py, xor_native):
    t = time.ticks_us(); r = f(data)
    print(f.__name__, r, time.ticks_diff(time.ticks_us(), t), "us")
t = time.ticks_us(); r = xor_viper(data, len(data))
print("xor_viper", r, time.ticks_diff(time.ticks_us(), t), "us")`, caption: "All three print the same checksum (0 here). Compare the times on your board. ptr8 is a viper built-in, so this file passes py_compile but runs only on MicroPython." },
        { t: "p", text: "Note `time.ticks_diff()`: MicroPython's tick counters wrap like `millis()` does, and ticks_diff handles the wrap correctly, the same idea as unsigned subtraction in C." },
      ] },
    ],
    mistakes: [
      "**Leaving blocking debug prints in timing-critical code.** A full Serial buffer makes print() wait, and the bug changes when you add the print.",
      "**Using assertions for expected failures.** A sensor timeout is a real condition that needs handling, not an assert that halts the device.",
      "**Committing secrets.** Wi-Fi passwords in a pushed commit stay in history. Use a git-ignored secrets.h.",
      "**Committing build outputs.** .hex, .bin and build folders bloat the repository and conflict on every build. List them in .gitignore.",
      "**Huge commits with messages like \"update\".** Small, described commits make diff and bisect useful.",
      "**Changing several things at once while debugging.** Change one thing, test, and note the result; otherwise you cannot tell which change mattered.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: rewrite a beginner project as a clean multi-file firmware project under version control.",
      steps: [
        "Pick a beginner project you built with blocks. Open its generated code and save it as the starting point. Run `git init`, add a .gitignore, and commit it unchanged as \"Generated code from block editor\".",
        "Create Config.h for pins and constants (with include guard), and one module (.h and .cpp) per piece of hardware. Commit after each module compiles and works.",
        "Replace every delay() in loop() with millis()-based non-blocking updates, and every int that holds time with uint32_t. Replace any float arithmetic on the Uno with fixed point where it is easy.",
        "Add the LOG_I and LOG_E macros and at least two ASSERTs. Show that setting LOG_LEVEL to 0 reduces the program size reported by the compiler.",
        "Compile for both arduino:avr:uno and esp32:esp32:esp32 with warnings set to All, and fix every warning.",
        "Write a README with board, core version, wiring table and how to build. Tag the final commit v1.0 and show `git log --oneline` to your instructor.",
      ],
    },
    quiz: [
      {
        q: "At 115200 baud with 10 bits per byte, roughly how long does sending a 58-character line take?",
        options: ["About 0.5 ms", "About 5 ms", "About 50 ms", "About 58 µs"],
        answer: 1,
        why: "One byte takes 10 / 115200 ≈ 87 µs. 58 × 87 µs ≈ 5.0 ms.",
      },
      {
        q: "Which is a correct use of an assertion?",
        options: [
          "Checking that an array index is within bounds before use",
          "Checking whether Wi-Fi connected",
          "Checking whether the user pressed a button",
          "Checking whether a sensor replied within 100 ms",
        ],
        answer: 0,
        why: "An out-of-range index means the program itself is wrong. The other three are normal run-time conditions that need real handling.",
      },
      {
        q: "Why is a logging macro wrapped in do { ... } while (0)?",
        options: [
          "To run the logging code once per loop",
          "To make it faster",
          "So the macro acts as a single statement, for example inside an if without braces",
          "To disable it in release builds",
        ],
        answer: 2,
        why: "Without the wrapper, a two-statement macro after an if would only make the first statement conditional, and an else after it would not compile.",
      },
      {
        q: "Which files belong in your firmware project's .gitignore?",
        options: [
          "Blinker.h and Blinker.cpp",
          "README.md",
          "secrets.example.h",
          "The build folder, .hex and .bin outputs, and secrets.h",
        ],
        answer: 3,
        why: "Build outputs are regenerated and secrets must never be committed. Sources, the README and the example secrets file are committed.",
      },
      {
        q: "What does a hardware debugger let you do that serial logging cannot?",
        options: [
          "Halt the CPU at a breakpoint and inspect any variable without changing the code",
          "Upload code faster",
          "Make the program use less RAM",
          "Print messages at a higher baud rate",
        ],
        answer: 0,
        why: "A debugger stops the program at a chosen point and shows its whole state. Logging only shows what you thought to print, and changes timing.",
      },
    ],
  },
};

export default lessons;
