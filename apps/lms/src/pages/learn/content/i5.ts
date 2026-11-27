import type { ModuleContent } from "../model/curriculum";

/**
 * Module i5: Microcontroller architecture and peripherals.
 * Register and bit names follow the ATmega328P datasheet (Microchip DS40002061)
 * and avr-libc's <avr/io.h>. ESP32 material uses Arduino-ESP32 3.x (ESP-IDF 5.x).
 * Every complete sketch here compiles with arduino-cli for arduino:avr:uno
 * (AVR core 1.8.8) or esp32:esp32:esp32 (core 3.3.10).
 */
const lessons: ModuleContent = {
  "i5-cpu-memory-clocks-reset": {
    id: "i5-cpu-memory-clocks-reset",
    outcomes: [
      "Explain the difference between Harvard and von Neumann architectures and where the ATmega328P and ESP32 sit",
      "Describe the memory map of the ATmega328P: registers, I/O space, SRAM, flash and EEPROM",
      "Name the clock sources and the system clock prescaler, and calculate an instruction time",
      "List the four reset sources and trace what happens from reset to setup()",
    ],
    blocks: [
      { t: "h", text: "Why look inside the chip" },
      { t: "p", text: "Up to now, `digitalWrite`, `analogRead` and `delay` have hidden the hardware. That works until something does not: a PWM frequency you cannot change, an ADC reading that is 3% off, a sketch that resets itself when a motor starts, a timer that stops `millis()` working. Each of those has a cause you can only see at the level of the chip itself. This module opens the box. You will learn what the CPU, memories and buses are, how the clock and reset work, and then, peripheral by peripheral, how to drive the hardware directly through its registers. The reference throughout is the ATmega328P on the Arduino Uno, because its datasheet is short enough to read completely, with the ESP32 as the comparison." },

      { t: "h", text: "The parts of a microcontroller" },
      { t: "p", text: "A microcontroller is a CPU, memory and peripherals on one die, joined by buses. The **CPU** fetches instructions, decodes them and executes them. **Flash** holds the program and keeps it with the power off. **SRAM** holds variables and the stack while running. **EEPROM** (on the 328P) holds small amounts of data that must survive power loss. The **peripherals** (GPIO ports, timers, ADC, UART, SPI, I2C, watchdog) are hardware blocks that do jobs on their own once configured. A **bus** is the set of wires that carries addresses and data between these parts." },
      { t: "diagram", text: String.raw`
           ┌──────────── program bus (16-bit) ──────────┐
           │                                            │
     ┌─────┴─────┐                               ┌──────┴──────┐
     │  AVR CPU  │                               │ Flash 32 KB │
     │ 32 regs   │                               │ (program)   │
     │ ALU, PC   │                               └─────────────┘
     └─────┬─────┘
           │ data bus (8-bit)
   ┌───────┼──────────┬──────────┬──────────┬──────────┐
 ┌─┴──┐ ┌──┴───┐ ┌────┴───┐ ┌────┴───┐ ┌────┴───┐ ┌────┴───┐
 │SRAM│ │EEPROM│ │ GPIO   │ │ Timers │ │  ADC   │ │ USART  │
 │2 KB│ │ 1 KB │ │ B,C,D  │ │ 0,1,2  │ │ 10-bit │ │ SPI,TWI│
 └────┘ └──────┘ └────────┘ └────────┘ └────────┘ └────────┘`, caption: "ATmega328P in outline. Program and data travel on separate buses." },

      { t: "h", text: "Harvard and von Neumann" },
      { t: "p", text: "In a **von Neumann** machine, instructions and data share one memory and one bus. A pointer can point at code or at data, and the CPU must take turns fetching an instruction and moving data over the same wires. In a **Harvard** machine, program memory and data memory are separate, with separate buses, so the CPU can fetch the next instruction while the current one reads or writes data." },
      { t: "p", text: "The AVR core in the ATmega328P is a true Harvard design. Flash is 32 KB organised as 16 K words of 16 bits, because almost every AVR instruction is one 16-bit word. Data memory is a separate 8-bit address space. Because fetching and executing overlap (a two-stage pipeline), most instructions finish in **one clock cycle**, so a 16 MHz Uno runs close to 16 million instructions per second." },
      { t: "p", text: "Harvard has a cost you will meet as a programmer. A pointer into data memory cannot read flash, because flash is a different address space reached by a different instruction (`LPM`, load program memory). That is why a constant table placed in flash with `PROGMEM` must be read with `pgm_read_byte()`, and why `Serial.print(F(\"text\"))` exists: without `F()`, string literals are copied from flash into the 2 KB of SRAM at start-up and eat it." },
      { t: "p", text: "The ESP32 is a **modified Harvard** design. Its two Xtensa LX6 cores have separate instruction and data buses internally, but the memories sit in one large 32-bit address map, so to a C programmer a pointer is a pointer. The program lives in an external SPI flash chip (4 MB on a typical DevKit) and is executed through a cache. Code that must run while the cache is unavailable, such as an interrupt handler during a flash write, has to be copied into internal instruction RAM, which is what `IRAM_ATTR` does. You will use that in module i6. ARM Cortex-M chips (STM32, RP2040) are also modified Harvard with one unified map. The ESP32-C3 replaces Xtensa with a single 32-bit **RISC-V** core (the open RV32IMC instruction set) at 160 MHz; the peripherals feel similar, the instruction set is different." },
      { t: "table", head: ["", "ATmega328P (Uno)", "ESP32 (DevKit)"], rows: [
        ["CPU", "8-bit AVR, 1 core", "32-bit Xtensa LX6, 2 cores"],
        ["Clock", "16 MHz on the Uno (20 MHz max)", "up to 240 MHz from a 40 MHz crystal"],
        ["Architecture", "Harvard", "modified Harvard, unified address map"],
        ["Program memory", "32 KB internal flash", "external SPI flash via cache, typically 4 MB"],
        ["RAM", "2 KB SRAM", "520 KB SRAM"],
        ["Non-volatile data", "1 KB EEPROM", "flash partition (NVS)"],
        ["Supply / logic", "5 V on the Uno", "3.3 V, pins are not 5 V tolerant"],
      ], caption: "The two boards of this course, at architecture level." },

      { t: "h", text: "The data memory map of the ATmega328P" },
      { t: "p", text: "Every register you will configure in this module has an address in data memory. The map is small enough to remember:" },
      { t: "diagram", text: String.raw`
 0x0000 ┌──────────────────────────┐
        │ 32 general registers     │  r0 to r31
 0x0020 ├──────────────────────────┤
        │ 64 I/O registers         │  PINB, DDRB, PORTB, ... (fast: IN, OUT, SBI, CBI)
 0x0060 ├──────────────────────────┤
        │ 160 extended I/O         │  TCCR1A, ADCSRA, UCSR0A, ... (LD and ST only)
 0x0100 ├──────────────────────────┤
        │ 2048 bytes SRAM          │  .data, .bss, heap grows up
        │                          │  stack grows down from the top
 0x08FF └──────────────────────────┘`, caption: "Data space addresses. Flash and EEPROM are separate address spaces." },
      { t: "p", text: "When you write `PORTB = 0x20;` in C, `PORTB` is just a name for the byte at data address 0x25, declared `volatile` in `<avr/io.h>` so the compiler never optimises the access away. Registers in the low part of the I/O space can be reached with single-cycle instructions that set or clear one bit, which matters for speed and for atomicity, as the next lesson shows." },

      { t: "h", text: "Clocks and prescalers" },
      { t: "p", text: "Everything in a synchronous chip happens on clock edges, so the clock sets the speed of the CPU and the timing of every peripheral. The ATmega328P can take its clock from:" },
      { t: "list", items: [
        "**An external crystal or ceramic resonator** on pins PB6 and PB7. The Uno uses a 16 MHz ceramic resonator for the 328P (accurate to about 0.5%), which is good enough for UART but drifts too much for a clock that must keep time over days.",
        "**The internal 8 MHz RC oscillator**, factory calibrated to about ±10% and trimmable through the `OSCCAL` register. Saves two pins and a part.",
        "**The internal 128 kHz oscillator**, which always drives the watchdog and can run the whole chip at very low power.",
        "**An external clock signal** fed into PB6.",
      ] },
      { t: "p", text: "The source is chosen by **fuses**, configuration bits stored in the chip and written by a programmer, not by your sketch. After the source comes the **system clock prescaler**, which divides the clock by 1, 2, 4 and so on up to 256 and can be changed at run time through the `CLKPR` register. Each peripheral then has its own prescaler: Timer1 can divide the system clock by 1, 8, 64, 256 or 1024, and the ADC by 2 to 128." },
      { t: "formula", text: String.raw`t_cycle = 1 / f_clk
16 MHz  →  t_cycle = 1 / 16 000 000 = 62.5 ns
A 2-cycle instruction such as SBI takes 2 × 62.5 = 125 ns`, caption: "Clock period and instruction time on the Uno." },
      { t: "p", text: "Dividing the clock saves power: CMOS logic draws current roughly in proportion to clock frequency. It also changes every timing calculation in this module, so the first line of any calculation is always the clock frequency actually reaching the peripheral." },

      { t: "h", text: "Reset and boot" },
      { t: "p", text: "Reset puts every register into its documented initial value and starts the CPU at the reset vector. The 328P has four reset sources, and after a reset the `MCUSR` register tells you which one fired:" },
      { t: "table", head: ["Source", "Cause", "Flag in MCUSR"], rows: [
        ["Power-on", "supply rose from below the power-on threshold", "PORF"],
        ["External", "RESET pin held low longer than the minimum pulse", "EXTRF"],
        ["Watchdog", "watchdog timer expired in reset mode", "WDRF"],
        ["Brown-out", "supply fell below the brown-out level", "BORF"],
      ], caption: "Reading MCUSR at the start of setup() is the quickest way to diagnose a mysterious restart." },
      { t: "p", text: "On the Uno, the chip does not jump straight to your sketch. A fuse (`BOOTRST`) makes it start in a 512-byte **bootloader** (Optiboot) at the top of flash. For a moment after reset it listens on the UART for the upload protocol. If an upload arrives, it writes the new program into flash; if not, it jumps to address 0, your program. This is why `arduino-cli` reports a maximum sketch size of 32 256 bytes rather than 32 768: 32 768 minus 512 for the bootloader. The USB chip pulses RESET through a 100 nF capacitor whenever the serial port is opened, which is why opening the Serial Monitor restarts the sketch." },
      { t: "p", text: "Your program then starts in the C runtime, not in `setup()`. Start-up code copies initial values of global variables from flash into SRAM (the `.data` section), zeroes the rest (`.bss`), and calls `main()`. The Arduino core's `main()` calls `init()`, which configures Timer0 for `millis()` and sets up the other timers for `analogWrite()`, then calls `setup()` once and `loop()` forever. When you write your own `main()` later in this module, none of that happens, and you own every register." },
      { t: "p", text: "The ESP32 boots differently. A ROM bootloader samples **strapping pins** (GPIO 0 low at reset means 'wait for a download'), loads a second-stage bootloader from flash, which reads a partition table and starts your application. FreeRTOS is already running when `setup()` is called; `setup()` and `loop()` run inside a task." },

      { t: "deep", title: "Changing the system clock prescaler: the timed sequence", blocks: [
        { t: "p", text: "Some registers protect themselves against accidental writes with a **timed sequence**: you must first write an enable bit, then write the new value within four clock cycles. `CLKPR` is one. Set `CLKPCE` (bit 7) with every other bit zero, then within four cycles write the new `CLKPS3:0` value with `CLKPCE` zero. Interrupts must be off, or an interrupt arriving between the two writes breaks the sequence." },
        { t: "snippet", lang: "c", code: String.raw`#include <avr/io.h>
#include <avr/interrupt.h>

// Divide the system clock by 2 (16 MHz -> 8 MHz).
void clockDiv2(void) {
  uint8_t sreg = SREG;
  cli();
  CLKPR = (1 << CLKPCE);   // step 1: unlock
  CLKPR = (1 << CLKPS0);   // step 2: CLKPS3:0 = 0001, divide by 2, within 4 cycles
  SREG = sreg;
}`, caption: "avr-libc also offers clock_prescale_set() in <avr/power.h>, which does the same thing." },
        { t: "p", text: "After this, `delay()` and `millis()` run at half speed and `Serial` baud rates are wrong, because the Arduino core computed them for 16 MHz at compile time from `F_CPU`. That is the price of changing clocks under a framework that assumes one." },
        { t: "p", text: "The fuses on an Uno are low 0xFF (low-power crystal oscillator for 8 to 16 MHz, longest start-up delay), high 0xDE (512-byte boot section, `BOOTRST` programmed) and extended 0xFD (brown-out at 2.7 V). A fresh ATmega328P from the factory ships with the internal 8 MHz oscillator and the `CKDIV8` fuse programmed, so it runs at 1 MHz. Fuse bits are 'programmed' when they read 0, which trips up everyone once." },
      ] },
      { t: "deep", title: "Pipelines, cycles and what 16 MIPS really means", blocks: [
        { t: "p", text: "The AVR fetches instruction n + 1 while it executes instruction n. Register-to-register arithmetic, `IN`, `OUT` and immediate loads take one cycle. Loads and stores to SRAM take two, `SBI` and `CBI` two, a taken branch two, `CALL` four and `RET` four. A tight loop in C therefore runs at well under 16 million useful operations per second, and you count cycles from the disassembly (`avr-objdump -d`) when timing really matters." },
        { t: "p", text: "The ESP32 cores have deeper pipelines and execute from a cache. A cache miss costs many cycles while the line is fetched from SPI flash, so the same loop can take noticeably different times on different runs. That is the trade: much more speed on average, less determinism. For tight, repeatable timing on an ESP32 you use hardware peripherals (RMT, LEDC, MCPWM) rather than counting instructions." },
      ] },
    ],
    mistakes: [
      "**Assuming a pointer can read flash on the AVR.** A `const` table without `PROGMEM` is copied into SRAM; with `PROGMEM` it must be read with `pgm_read_byte()`, or you read garbage from the data space.",
      "**Forgetting the clock reaching the peripheral.** Timer and ADC calculations use the clock after the system prescaler and the peripheral's own prescaler, not the crystal frequency.",
      "**Reading 'programmed' as 1.** AVR fuse bits are active low: a programmed fuse reads 0.",
      "**Blaming the code for every restart.** Read `MCUSR` first: a brown-out flag points at the power supply, not the program.",
      "**Thinking setup() is the first code to run.** The C runtime and the Arduino `init()` run first and have already configured Timer0, Timer1 and Timer2.",
    ],
    practice: {
      kind: "bench",
      task: "Find out what reset your Uno, and see the memory map in a real build.",
      steps: [
        "In `setup()`, copy `MCUSR` into a variable, set `MCUSR = 0`, open Serial and print which of PORF, EXTRF, BORF and WDRF are set.",
        "Upload, then (a) press the reset button, (b) unplug and replug USB, (c) open the Serial Monitor. Record the flags each time and explain each result.",
        "Compile any sketch with `arduino-cli compile -b arduino:avr:uno --build-path build .` and run `avr-size build/*.elf` (avr-size is in the Arduino AVR toolchain folder). Note the .text, .data and .bss sizes.",
        "Add a 200-character string literal printed with `Serial.print(\"...\")`. Rebuild and see .data grow by about 200 bytes. Wrap it in `F()` and rebuild: .data shrinks back and .text grows instead. Explain why in terms of Harvard architecture.",
      ],
    },
    quiz: [
      {
        q: "Why does an AVR need a special instruction and pgm_read_byte() to read a table stored in flash?",
        options: [
          "Flash is too slow to read with normal instructions",
          "In a Harvard architecture flash is a separate address space, so normal data loads cannot reach it",
          "Flash is encrypted",
          "The compiler does not allow const tables",
        ],
        answer: 1,
        why: "Program and data memory have separate buses and address spaces. Data loads reach only the data space; LPM reads program memory.",
      },
      {
        q: "An Uno runs at 16 MHz. How long does a two-cycle instruction take?",
        options: ["62.5 ns", "250 ns", "125 ns", "2 µs"],
        answer: 2,
        why: "One cycle is 1 / 16 MHz = 62.5 ns, so two cycles take 125 ns.",
      },
      {
        q: "arduino-cli says the Uno can hold at most 32 256 bytes of sketch, though the chip has 32 KB of flash. Where did the other 512 bytes go?",
        options: [
          "To the EEPROM",
          "To the bootloader at the top of flash",
          "To the interrupt vector table",
          "To the SRAM copy of global variables",
        ],
        answer: 1,
        why: "32 768 minus 32 256 is 512 bytes: the Optiboot bootloader that receives uploads over the UART.",
      },
      {
        q: "A board restarts whenever a motor starts, and MCUSR shows BORF set. What is the most likely cause?",
        options: [
          "The supply voltage dipped below the brown-out threshold",
          "The watchdog was not fed",
          "Someone pressed reset",
          "A stack overflow",
        ],
        answer: 0,
        why: "BORF is the brown-out reset flag. The motor's start-up current pulled the supply down, which is a power problem to fix with supply design and decoupling.",
      },
      {
        q: "Which statement about the ESP32 is correct?",
        options: [
          "It is a pure Harvard machine like the AVR, so pointers cannot read flash",
          "It runs code from internal flash only, so it needs no cache",
          "It is modified Harvard: separate internal buses but one unified address map, with program code executed from external flash through a cache",
          "It is an 8-bit microcontroller",
        ],
        answer: 2,
        why: "The Xtensa cores have separate instruction and data buses, but memories share one 32-bit map, and code runs from external SPI flash through a cache.",
      },
    ],
  },

  "i5-gpio-registers": {
    id: "i5-gpio-registers",
    outcomes: [
      "Configure a pin as input, input with pull-up, or output using DDRx and PORTx",
      "Read pins with PINx and toggle outputs by writing to PINx",
      "Write bit-manipulation expressions that set, clear, toggle and test single bits",
      "Explain why some read-modify-write operations are not safe when interrupts are running",
    ],
    blocks: [
      { t: "h", text: "Why drive pins through registers" },
      { t: "p", text: "`digitalWrite(13, HIGH)` takes a few microseconds on an Uno: it looks up which port and bit pin 13 is, checks whether a timer is driving it, turns interrupts off, changes one bit and turns them back on. The single instruction it finally needs takes 125 ns. For blinking an LED that does not matter. For bit-banging a protocol, generating a precise pulse, or changing eight pins at the same instant, it does. Register access also teaches you what the framework is really doing, which you need the first time it surprises you." },

      { t: "h", text: "Ports, pins and the Uno pin map" },
      { t: "p", text: "The ATmega328P groups its pins into 8-bit **ports**: B, C and D. Each pin is one bit of one port, written like PB5 (port B, bit 5). The Arduino pin numbers are only labels on top:" },
      { t: "table", head: ["Uno pins", "Port bits", "Notes"], rows: [
        ["D0 to D7", "PD0 to PD7", "D0 and D1 are the UART to the USB chip"],
        ["D8 to D13", "PB0 to PB5", "D13 (PB5) has the on-board LED"],
        ["A0 to A5", "PC0 to PC5", "also ADC channels 0 to 5"],
        ["(none)", "PB6, PB7", "resonator pins on the Uno"],
        ["RESET", "PC6", "reset pin, not used as I/O"],
      ], caption: "Uno header labels against ATmega328P port bits." },

      { t: "h", text: "Three registers per port" },
      { t: "p", text: "Each port x (B, C or D) is controlled by three registers, one bit per pin:" },
      { t: "list", items: [
        "**DDRx**, the data direction register: 1 makes the pin an output, 0 an input. All pins are inputs after reset.",
        "**PORTx**, the data register: for an output, 1 drives high and 0 drives low. For an input, 1 turns on the internal pull-up resistor (about 20 to 50 kΩ to VCC) and 0 leaves the pin floating.",
        "**PINx**, the input pins address: reading it gives the actual logic level on every pin of the port, whether input or output. Writing a 1 to a bit of PINx **toggles** the matching bit of PORTx.",
      ] },
      { t: "table", head: ["DDxn", "PORTxn", "Pin behaviour"], rows: [
        ["0", "0", "input, high impedance (floating)"],
        ["0", "1", "input with pull-up"],
        ["1", "0", "output, driven low"],
        ["1", "1", "output, driven high"],
      ], caption: "The four configurations of one pin. Setting PUD in MCUCR disables every pull-up at once." },

      { t: "h", text: "Bit manipulation you will use every day" },
      { t: "p", text: "Registers are bytes, and you almost always want to change one bit without touching the other seven. Four idioms do everything. `<avr/io.h>` gives every bit a name equal to its position, so `PORTB5` is 5 and `(1 << PORTB5)` is the mask 0b00100000." },
      { t: "formula", text: String.raw`set bit n:     REG |=  (1 << n)
clear bit n:   REG &= ~(1 << n)
toggle bit n:  REG ^=  (1 << n)       (on AVR ports: PINx = (1 << n))
test bit n:    if (REG & (1 << n)) ...`, caption: "OR sets, AND with the inverted mask clears, XOR toggles, AND tests." },
      { t: "p", text: "Check the clear idiom once by hand. With PORTB = 0b00100100 and n = 5: the mask is 0b00100000, its inverse is 0b11011111, and 0b00100100 AND 0b11011111 = 0b00000100. Bit 5 is now 0 and bit 2 is untouched." },

      { t: "h", text: "Worked example: blink and read a button with registers only" },
      { t: "p", text: "The program below blinks the LED on D13 (PB5) while a button between D2 (PD2) and GND is released, and holds the LED off while it is pressed. It defines its own `main()`, so the Arduino core's `init()` never runs; `_delay_ms()` from avr-libc is a busy loop calculated from the clock frequency at compile time." },
      { t: "snippet", lang: "cpp", code: String.raw`// Blink D13 (PB5) on the Uno using only port registers.
#include <avr/io.h>
#include <util/delay.h>

int main(void) {
  DDRB |= (1 << DDB5);            // PB5 as output
  DDRD &= ~(1 << DDD2);           // PD2 (D2) as input
  PORTD |= (1 << PORTD2);         // enable its pull-up
  for (;;) {
    if (PIND & (1 << PIND2)) {    // button released (pulled high)
      PINB = (1 << PINB5);        // writing 1 to PINx toggles PORTx
      _delay_ms(250);
    } else {
      PORTB &= ~(1 << PORTB5);    // held: LED off
    }
  }
}`, caption: "Arduino Uno. Compiles with arduino-cli for arduino:avr:uno to 170 bytes." },
      { t: "p", text: "Read it line by line against the tables. `DDRB |= (1 << DDB5)` makes PB5 an output. `DDRD &= ~(1 << DDD2)` makes PD2 an input (it already is after reset, but say so). `PORTD |= (1 << PORTD2)` on an input pin turns on its pull-up, so the pin reads 1 until the button pulls it to 0. `PIND & (1 << PIND2)` is non-zero while the button is released. `PINB = (1 << PINB5)` toggles PB5 in one instruction, leaving the other bits of PORTB alone." },
      { t: "p", text: "Notice that `PINB = (1 << PINB5)` is an assignment, not `|=`. Writing a 0 to a PINx bit does nothing, so writing a single 1 toggles exactly one pin. Using `PINB |= ...` would read the current pin levels, OR in the mask and write the result back, toggling every pin that happened to read high." },

      { t: "h", text: "Changing several pins at once" },
      { t: "p", text: "Because a port register drives all eight pins together, one write changes several pins at the same instant. `PORTD = (PORTD & 0x0F) | 0xA0;` sets PD7 and PD5 high and PD6 and PD4 low in one store, while keeping PD0 to PD3 unchanged. With `digitalWrite` the pins would change one after another, microseconds apart, which matters for a parallel bus or for driving both sides of an H-bridge." },

      { t: "h", text: "When read-modify-write goes wrong" },
      { t: "p", text: "`PORTB |= (1 << 5)` looks like one operation, and for a constant single-bit mask on ports B, C or D the compiler turns it into one `SBI` instruction, which cannot be interrupted. But `PORTB |= mask` with a variable mask, or a change to several bits, becomes three instructions: read PORTB into a register, OR, write back. If an interrupt routine changes another bit of PORTB between the read and the write, the main program writes back the old value and the interrupt's change is lost. Module i6 treats this properly; for now, remember that only single-bit changes with constant masks are guaranteed atomic, and only on registers in the low I/O space." },
      { t: "note", kind: "warn", text: "Output limits on the ATmega328P: 20 mA per pin is the practical design figure, 40 mA is the absolute maximum, and the total for the whole chip is 200 mA. An LED needs a series resistor; a relay or motor needs a transistor driver." },
      { t: "note", kind: "safety", text: "ESP32 pins are 3.3 V only. Never connect a 5 V output (an Uno pin, a 5 V sensor) directly to an ESP32 GPIO; use a level shifter or a divider." },

      { t: "deep", title: "ESP32 GPIO registers: W1TS, W1TC and the GPIO matrix", blocks: [
        { t: "p", text: "The ESP32 has up to 40 GPIOs. Its output register `GPIO_OUT_REG` holds the levels of GPIO 0 to 31 (GPIO 32 to 39 are in `GPIO_OUT1_REG`), and `GPIO_ENABLE_REG` is the equivalent of DDRx. Two cores and many interrupt sources may touch these registers at once, so a plain read-modify-write would be dangerous. The chip solves it in hardware with **write-1-to-set** and **write-1-to-clear** registers: writing a mask to `GPIO_OUT_W1TS_REG` sets exactly those bits of `GPIO_OUT_REG`, and writing to `GPIO_OUT_W1TC_REG` clears them. Bits written as 0 are ignored, so no read is needed and no race is possible. `GPIO_ENABLE_W1TS_REG` and `GPIO_ENABLE_W1TC_REG` do the same for direction, and `GPIO_IN_REG` reads levels." },
        { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit (Arduino-ESP32 3.x): fast toggling of GPIO 2 with the
// write-1-to-set / write-1-to-clear registers.
#include "soc/gpio_reg.h"
#include "soc/soc.h"

const int LED = 2;

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);                        // let the driver set up the IO MUX and matrix
}

void loop() {
  for (int i = 0; i < 1000000; i++) {
    REG_WRITE(GPIO_OUT_W1TS_REG, 1UL << LED);  // set bit 2 only
    REG_WRITE(GPIO_OUT_W1TC_REG, 1UL << LED);  // clear bit 2 only
  }
  delay(1000);
  uint32_t in = REG_READ(GPIO_IN_REG);         // inputs 0 to 31
  Serial.println((in >> 0) & 1);               // GPIO 0 (BOOT button) level
}`, caption: "ESP32 DevKit, Arduino-ESP32 3.x. Register names from soc/gpio_reg.h. Compiled for esp32:esp32:esp32." },
        { t: "p", text: "Between the GPIO registers and the pins sits the **IO MUX** and the **GPIO matrix**, which let almost any peripheral signal (a UART TX, a PWM channel) be routed to almost any pin. `pinMode()` configures that routing, which is why the example still calls it. Some pins carry restrictions you must respect: GPIO 34 to 39 are input only and have no pull-ups, GPIO 6 to 11 connect to the flash chip and must not be used, and GPIO 0, 2, 5, 12 and 15 are strapping pins whose level at reset changes boot behaviour." },
      ] },
      { t: "deep", title: "What the input circuit does: synchroniser and Schmitt trigger", blocks: [
        { t: "p", text: "A pin's level can change at any instant, but the CPU samples on clock edges. If the pin changed exactly at an edge, a flip-flop could go metastable (stuck between 0 and 1 for a moment). The AVR passes every input through a two-flip-flop **synchroniser** before PINx, which removes that risk at the cost of up to about 1.5 clock cycles of delay. A practical consequence from the datasheet: if you change an output and immediately read it back through PINx, insert one `NOP` (`__asm__ __volatile__ (\"nop\");`) in between or you may read the old value." },
        { t: "p", text: "The input stage is also a **Schmitt trigger**: it switches high at a higher voltage than it switches low (on a 5 V supply, roughly above 0.6 VCC counts as high and below 0.3 VCC as low, with hysteresis in between). Slowly rising signals, such as an RC-filtered button, therefore produce one clean transition rather than a burst. When a pin is used as an analogue input, its digital input buffer still draws a little current near mid-supply, which is why the ADC lesson turns it off with DIDR0." },
      ] },
    ],
    mistakes: [
      "**Writing PINB |= mask to toggle.** That toggles every pin that reads high. Write `PINB = mask`.",
      "**Forgetting the pull-up.** A button to GND on an input with PORTx = 0 floats and reads random values when released.",
      "**Using Arduino pin numbers as bit numbers.** D13 is PB5, not bit 13 of anything. Check the pin map.",
      "**Assuming every |= is atomic.** Only a single-bit change with a constant mask on a low I/O register compiles to SBI or CBI.",
      "**Overwriting a whole port.** `PORTD = 0x20` also changes PD0 and PD1, the UART pins. Mask in only the bits you mean to change.",
    ],
    practice: {
      kind: "bench",
      task: "Measure the speed difference between digitalWrite and direct port access.",
      steps: [
        "On an Uno, write a loop that does `digitalWrite(8, HIGH); digitalWrite(8, LOW);` forever, with interrupts off (`noInterrupts()`) so millis cannot disturb it.",
        "Measure the frequency on D8 with an oscilloscope, a logic analyser or a frequency meter. Work out the time per digitalWrite.",
        "Replace the two calls with `PORTB |= (1 << PORTB0); PORTB &= ~(1 << PORTB0);` and measure again. Then try `PINB = (1 << PINB0);` alone in the loop.",
        "Disassemble the build (`avr-objdump -d` on the .elf) and find the SBI, CBI or OUT instructions. Count cycles including the loop's jump and check them against your measured frequency.",
      ],
    },
    quiz: [
      {
        q: "D7 on an Uno must be an input with its internal pull-up enabled. Which register values do this?",
        options: [
          "DDRD bit 7 = 1, PORTD bit 7 = 1",
          "DDRD bit 7 = 0, PORTD bit 7 = 0",
          "DDRD bit 7 = 1, PORTD bit 7 = 0",
          "DDRD bit 7 = 0, PORTD bit 7 = 1",
        ],
        answer: 3,
        why: "D7 is PD7. Direction 0 makes it an input, and PORTx = 1 on an input turns on the pull-up.",
      },
      {
        q: "PORTB holds 0b00100100. What does PORTB &= ~(1 << 2) leave in it?",
        options: ["0b00100000", "0b00000100", "0b11011011", "0b00100110"],
        answer: 0,
        why: "The mask is 0b00000100, inverted 0b11111011. ANDing clears bit 2 and keeps bit 5: 0b00100000.",
      },
      {
        q: "Why is PINB = (1 << PINB5) used to toggle D13, rather than PINB |= (1 << PINB5)?",
        options: [
          "PINB is read-only, so |= fails to compile",
          "|= reads the current pin levels and writes them back, toggling every pin that was high as well as PB5",
          "Assignment is slower but safer",
          "The two are identical",
        ],
        answer: 1,
        why: "Writing 1 to a PINx bit toggles that PORTx bit. |= writes back the read value, so every pin reading 1 is toggled too.",
      },
      {
        q: "Which change to PORTB is guaranteed not to be split by an interrupt on the ATmega328P?",
        options: [
          "PORTB |= mask, where mask is a variable",
          "PORTB = (PORTB & 0xF0) | 0x05",
          "PORTB |= (1 << PORTB3)",
          "PORTB ^= 0xFF",
        ],
        answer: 2,
        why: "A constant single-bit change on a low I/O register compiles to one SBI instruction. The others are read, modify, write sequences.",
      },
      {
        q: "On an ESP32, why use GPIO_OUT_W1TS_REG instead of reading GPIO_OUT_REG, ORing a bit in and writing it back?",
        options: [
          "W1TS sets only the bits written as 1, with no read, so another core or interrupt cannot have its change overwritten",
          "GPIO_OUT_REG cannot be read",
          "W1TS drives the pin at 5 V",
          "W1TS enables the pull-up",
        ],
        answer: 0,
        why: "Write-1-to-set registers change only the chosen bits in hardware, so there is no read-modify-write race.",
      },
    ],
  },

  "i5-timers-capture-pwm": {
    id: "i5-timers-capture-pwm",
    outcomes: [
      "Calculate timer tick, overflow and compare-match periods for any prescaler",
      "Configure Timer1 in CTC mode and generate an exact frequency on an output pin",
      "Measure a period with Timer1 input capture",
      "Choose between Fast PWM and phase-correct PWM and calculate frequency and duty cycle for each",
    ],
    blocks: [
      { t: "h", text: "Why hardware timers" },
      { t: "p", text: "A CPU that counts time by looping is busy doing nothing, and its timing shifts every time an interrupt or a branch takes longer. A **timer** is a hardware counter clocked from the system clock through a prescaler. Once configured it counts on its own, compares itself against registers, toggles pins and raises flags or interrupts, all with clock-cycle precision and no CPU time. `millis()`, `analogWrite()`, the `Servo` library and `tone()` are all timers underneath." },

      { t: "h", text: "The three timers of the ATmega328P" },
      { t: "table", head: ["Timer", "Width", "Prescalers", "Output pins (Uno)", "Used by Arduino for"], rows: [
        ["Timer0", "8-bit", "1, 8, 64, 256, 1024", "OC0A = D6, OC0B = D5", "millis(), delay(), PWM on D5, D6"],
        ["Timer1", "16-bit", "1, 8, 64, 256, 1024", "OC1A = D9, OC1B = D10; ICP1 = D8", "PWM on D9, D10; Servo library"],
        ["Timer2", "8-bit", "1, 8, 32, 64, 128, 256, 1024", "OC2A = D11, OC2B = D3", "PWM on D3, D11; tone()"],
      ], caption: "Changing Timer0 breaks millis() and delay(). Timer1 is the usual one to take over." },
      { t: "p", text: "Each timer has a counter register (`TCNT0`, `TCNT1`, `TCNT2`), two output compare registers (`OCRnA`, `OCRnB`), two control registers (`TCCRnA`, `TCCRnB`), an interrupt mask (`TIMSKn`) and an interrupt flag register (`TIFRn`). Timer1 also has `ICR1`, the input capture register. The **waveform generation mode** bits `WGMn` (spread across TCCRnA and TCCRnB) pick how the counter counts; the **clock select** bits `CSn2:0` in TCCRnB pick the prescaler (and 000 stops the timer); the **compare output mode** bits `COMnA1:0` and `COMnB1:0` pick what happens to the output pins on a match." },

      { t: "h", text: "Ticks and overflow" },
      { t: "formula", text: String.raw`t_tick     = N / f_clk
t_overflow = N × 2^n / f_clk          (n = 8 or 16 bits)

Timer1, N = 1:     t_tick = 62.5 ns,   t_overflow = 65 536 × 62.5 ns = 4.096 ms
Timer1, N = 1024:  t_tick = 64 µs,     t_overflow = 65 536 × 64 µs   = 4.194 s`, caption: "N is the prescaler, f_clk the system clock (16 MHz on the Uno)." },
      { t: "p", text: "In **normal mode** the counter runs from 0 to its maximum (255 or 65 535), rolls over to 0 and sets the overflow flag (`TOV0`, `TOV1`, `TOV2`), which can raise an overflow interrupt (`TOIEn` in TIMSKn). Overflow is useful for counting long intervals, but the period is fixed at powers of two times the tick, so you rarely get the exact number you want." },

      { t: "h", text: "CTC: clear timer on compare match" },
      { t: "p", text: "In **CTC mode** the counter counts up to the value in `OCRnA`, then clears to 0 on the next tick. Setting OCRnA chooses the period exactly. On each match the compare flag `OCFnA` is set, an interrupt can fire (`OCIEnA`), and the output pin OCnA can toggle (`COMnA1:0` = 01). The counter visits OCRnA + 1 values (0 to OCRnA inclusive) per cycle, which is where the 1 comes from:" },
      { t: "formula", text: String.raw`f_match = f_clk / (N × (1 + OCRnA))
f_pin   = f_clk / (2 × N × (1 + OCRnA))     (pin toggles once per match)
OCRnA   = f_clk / (N × f_match) - 1`, caption: "CTC mode. The pin frequency is half the match rate because it takes two toggles to make one cycle." },
      { t: "p", text: "**Worked example: an exact 2 Hz event for a 1 Hz blink.** You want a match every 0.5 s on Timer1. Try N = 256: OCR1A = 16 000 000 / (256 × 2) - 1 = 31 250 - 1 = 31 249, which fits in 16 bits. Check: 16 000 000 / (256 × 31 250) = 2.000 Hz exactly. With N = 1024 you would need 7811.5, not an integer, so N = 256 is the better choice. Always try prescalers from smallest up and take the first one whose OCR value fits the timer and comes out as an integer, or close enough." },
      { t: "p", text: "**Worked example: a 1 kHz square wave on D11.** Timer2 is 8-bit, so OCR2A must be 255 or less. f_pin = 1000 Hz means f_match = 2000 Hz. With N = 64: OCR2A = 16 000 000 / (64 × 2000) - 1 = 125 - 1 = 124. Check: 16 000 000 / (2 × 64 × 125) = 1000 Hz. Note that on Timer2 the bits CS22:0 = 100 select 64; on Timer0 and Timer1 the same bit pattern selects 256. Always read the prescaler table for the timer you are using." },

      { t: "h", text: "Input capture: measuring time with Timer1" },
      { t: "p", text: "Timer1 has a feature the 8-bit timers lack. When the selected edge arrives on the **ICP1** pin (PB0, D8 on the Uno), the hardware copies the running value of TCNT1 into `ICR1` and sets `ICF1`. The copy happens in the same clock cycle as the edge, regardless of what the CPU is doing, so the timestamp is exact even if the interrupt is serviced a few microseconds later. Subtract two captures and you have a period with 62.5 ns resolution at N = 1." },
      { t: "list", items: [
        "`ICES1` in TCCR1B selects the edge: 1 for rising, 0 for falling. Flip it inside the interrupt to measure a pulse width instead of a period.",
        "`ICNC1` turns on the noise canceller, which requires four equal samples before accepting an edge, adding four clock cycles of delay but rejecting glitches.",
        "`ICIE1` in TIMSK1 enables the capture interrupt, `TIMER1_CAPT_vect`.",
      ] },
      { t: "p", text: "With N = 1 the counter wraps every 4.096 ms, so periods up to 65 535 ticks can be measured directly, meaning frequencies down to 16 000 000 / 65 536 ≈ 244 Hz. The subtraction `now - lastCapture` in 16-bit unsigned arithmetic gives the right answer even when the counter has wrapped once between the two captures. For slower signals, use a larger prescaler or count overflows as well." },
      { t: "snippet", lang: "cpp", code: String.raw`// Measure the period of a signal on D8 (ICP1) with Timer1 input capture.
// Prints the frequency over Serial. Feed it the 1 kHz from TimerDemo, or any
// 0 to 5 V square wave between about 245 Hz and 100 kHz.
#include <util/atomic.h>

volatile uint16_t lastCapture = 0;
volatile uint16_t period = 0;          // in timer ticks of 62.5 ns
volatile bool fresh = false;

ISR(TIMER1_CAPT_vect) {
  uint16_t now = ICR1;                 // captured count at the rising edge
  period = now - lastCapture;          // unsigned subtraction survives wrap
  lastCapture = now;
  fresh = true;
}

void setup() {
  Serial.begin(115200);
  TCCR1A = 0;                                    // normal mode
  TCCR1B = (1 << ICNC1) | (1 << ICES1) | (1 << CS10);  // noise canceller, rising edge, no prescale
  TIFR1 = (1 << ICF1);                           // clear any stale flag
  TIMSK1 = (1 << ICIE1);                         // enable capture interrupt
}

void loop() {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint >= 500) {
    lastPrint = millis();
    uint16_t p;
    bool f;
    ATOMIC_BLOCK(ATOMIC_RESTORESTATE) { p = period; f = fresh; fresh = false; }
    if (f && p) {
      Serial.print(16000000.0 / p, 1);
      Serial.println(" Hz");
    } else {
      Serial.println("no signal");
    }
  }
}`, caption: "Arduino Uno. Uses millis() and Serial from the core, which leaves Timer1 free. A 1 kHz input gives period = 16 000 ticks." },

      { t: "h", text: "PWM: Fast PWM and phase-correct PWM" },
      { t: "p", text: "Pulse-width modulation switches a pin at a fixed frequency while varying the fraction of time it is high, the **duty cycle**. The timer does it in hardware: the counter runs from 0 to TOP, and the output pin is set or cleared when the counter equals OCRnx." },
      { t: "diagram", text: String.raw`
 Fast PWM (single slope)                Phase-correct PWM (dual slope)

 TOP ─   /|   /|   /|                   TOP ─    /\      /\
        / |  / |  / |                           /  \    /  \
 OCR ─ /--|-/--|-/--|                   OCR ─  /----\--/----\
      /   |/   |/   |                         /      \/      \
 0  ─/    /    /    /                   0  ─ /                \
 pin: ‾‾‾|_|‾‾|_|‾‾|_                   pin: _|‾‾‾‾‾‾|__|‾‾‾‾‾‾|_
      set at 0, clear at OCR                 clear going up, set coming down`, caption: "Non-inverting modes (COMnx1:0 = 10). Phase-correct counts up and down, so each period takes twice as long and the pulse stays centred." },
      { t: "formula", text: String.raw`Fast PWM:           f_PWM = f_clk / (N × (1 + TOP))      duty = (OCR + 1) / (TOP + 1)
Phase-correct PWM:  f_PWM = f_clk / (2 × N × TOP)        duty = OCR / TOP`, caption: "Non-inverting output. TOP is 255 for 8-bit modes, or OCRnA or ICR1 in the modes that use them." },
      { t: "p", text: "Check the Arduino defaults. Timer0 runs Fast PWM with N = 64 and TOP = 255: 16 000 000 / (64 × 256) = 976.6 Hz on D5 and D6. Timer1 and Timer2 run phase-correct 8-bit with N = 64: 16 000 000 / (2 × 64 × 255) = 490.2 Hz on D3, D9, D10 and D11. These are the two familiar `analogWrite()` frequencies." },
      { t: "p", text: "**Which mode?** Fast PWM gives twice the frequency for the same resolution, which suits LED dimming, DACs made with a filter, and switching regulators. Phase-correct PWM keeps the centre of each pulse fixed as the duty changes, so the two outputs of a timer switch symmetrically; motor drivers prefer it because it shifts harmonics and avoids both outputs switching at the same instant. One quirk: in Fast PWM, OCR = 0 still gives a narrow spike one tick wide, and the duty never reaches exactly 0; use COM bits = 00 or a different approach when you need the pin fully off." },
      { t: "p", text: "**Worked example: a servo signal.** Hobby servos want a 50 Hz frame (20 ms) with a pulse between about 1 and 2 ms. Use Timer1 in mode 14 (Fast PWM, TOP = ICR1), so OCR1A sets the pulse independently. With N = 8 the tick is 0.5 µs; 20 ms needs 40 000 ticks, so ICR1 = 39 999. Check: 16 000 000 / (8 × 40 000) = 50 Hz. A 1.5 ms pulse is 3000 ticks, and since the pin stays high for OCR1A + 1 ticks, OCR1A = 2999. The resolution is 0.5 µs, about 2000 steps across the servo's 1 to 2 ms range, far finer than an 8-bit analogWrite could manage." },
      { t: "snippet", lang: "cpp", code: String.raw`// Timer1 Fast PWM (mode 14, TOP = ICR1): 50 Hz servo signal on D9 (OC1A).
// Timer2 CTC: 1 kHz square wave on D11 (OC2A).
#include <avr/io.h>

int main(void) {
  // Timer1: 16 MHz / (8 * (1 + 39999)) = 50 Hz
  DDRB |= (1 << DDB1);                                  // D9 = OC1A output
  TCCR1A = (1 << COM1A1) | (1 << WGM11);                // non-inverting, WGM11
  TCCR1B = (1 << WGM13) | (1 << WGM12) | (1 << CS11);   // WGM13:12, prescaler 8
  ICR1 = 39999;                                         // TOP
  OCR1A = 2999;                                         // (2999+1) * 0.5 us = 1.5 ms pulse

  // Timer2: 16 MHz / (2 * 64 * (1 + 124)) = 1000 Hz
  DDRB |= (1 << DDB3);                                  // D11 = OC2A output
  TCCR2A = (1 << COM2A0) | (1 << WGM21);                // toggle OC2A on match, CTC
  TCCR2B = (1 << CS22);                                 // prescaler 64 (Timer2 table)
  OCR2A = 124;

  for (;;) { }
}`, caption: "Arduino Uno: 50 Hz servo signal on D9 and a 1 kHz square wave on D11, with no Arduino functions. Connect D11 to D8 and run the input capture sketch on a second Uno to see 1000.0 Hz." },
      { t: "note", kind: "tip", text: "Mode numbers come from the waveform generation table in each timer's chapter of the datasheet. Timer1 mode 4 is CTC with TOP = OCR1A (WGM12 set), mode 14 is Fast PWM with TOP = ICR1 (WGM13, WGM12 and WGM11 set). Set the WGM bits from the table, never from memory." },

      { t: "deep", title: "Double buffering of OCR and why CTC can miss a match", blocks: [
        { t: "p", text: "In the PWM modes, writing OCRnx does not change the compare value immediately. The new value waits in a buffer and is copied in at TOP (Fast PWM) or at TOP for phase-correct mode (BOTTOM in phase and frequency correct mode). This **double buffering** guarantees that every PWM period is either all old or all new, so there are never glitch pulses." },
        { t: "p", text: "In CTC and normal mode OCRnx is not buffered. Suppose OCR1A is 30 000 and TCNT1 has reached 20 000, and you write OCR1A = 10 000. The counter is already past the new value, so there is no match on this cycle: it runs on to 65 535, wraps, and only then matches at 10 000. One period becomes about 5.6 times longer than intended (65 536 - 20 000 + 10 001 ticks instead of 10 001). Change a CTC period inside the compare interrupt, right after the match, when TCNT1 is near 0, or use a PWM mode, where OCR1A and OCR1B are double-buffered. (ICR1 is not buffered, so the same care applies when you change TOP in mode 14.)" },
        { t: "p", text: "16-bit registers add one more trap. The 8-bit CPU reads and writes TCNT1, OCR1A and ICR1 through a shared temporary register: write the high byte first, read the low byte first. The compiler does this correctly for you when you use the 16-bit names, but an interrupt that touches another 16-bit Timer1 register between the two halves can corrupt the shared TEMP byte. If both main code and an ISR access 16-bit timer registers, make the main-code access atomic." },
      ] },
      { t: "deep", title: "Phase and frequency correct mode, and getting high PWM frequencies", blocks: [
        { t: "p", text: "Timer1 has a third PWM family, **phase and frequency correct** (modes 8 and 9), identical to phase-correct except that OCR and TOP are updated at BOTTOM. If you vary TOP to change frequency, the waveform stays symmetric in every period, which matters for some motor and audio work. Its frequency formula is the same: f = f_clk / (2 × N × TOP)." },
        { t: "p", text: "Resolution and frequency trade against each other. The number of distinct duty values is TOP + 1, so resolution in bits is log2(TOP + 1). At N = 1, Fast PWM with TOP = 255 gives 16 000 000 / 256 = 62.5 kHz at 8 bits; TOP = 1023 gives 15.6 kHz at 10 bits; TOP = 65 535 gives 244 Hz at 16 bits. A motor driver that must be above the audible range (about 20 kHz) therefore gets at most 800 steps, about 9.6 bits, on a 16 MHz AVR (16 MHz / 20 kHz = 800). The ESP32's LEDC peripheral has the same trade, set by its timer resolution argument." },
        { t: "formula", text: String.raw`resolution (bits) = log2(TOP + 1)
f_PWM × (TOP + 1) = f_clk / N              (Fast PWM)

N = 1, TOP = 255:    62 500 Hz,  8 bits
N = 1, TOP = 1023:   15 625 Hz, 10 bits`, caption: "Frequency times number of steps is fixed by the clock." },
      ] },
    ],
    mistakes: [
      "**Forgetting the + 1.** CTC and Fast PWM periods contain OCR + 1 or TOP + 1 ticks. Leaving it out gives errors of one tick, which is 0.1% at TOP = 999 and very visible at TOP = 9.",
      "**Using another timer's prescaler table.** CS bits 100 mean 256 on Timer0 and Timer1 but 64 on Timer2.",
      "**Taking over Timer0.** It runs `millis()` and `delay()`. Changing it silently breaks every library that waits.",
      "**Setting WGM bits in only one register.** The mode bits are split across TCCRnA and TCCRnB. Write both.",
      "**Changing a CTC compare value at the wrong moment.** If the counter is already past the new value, the next match is a full wrap away.",
      "**Configuring the timer but not the pin.** The compare output only reaches the pin if its DDR bit is set as an output.",
    ],
    practice: {
      kind: "bench",
      task: "Generate frequencies with one Uno and measure them with input capture on another (or the same) Uno.",
      steps: [
        "Upload the Timer1/Timer2 register sketch. Check D9 with an oscilloscope or logic analyser: 20 ms period, 1.5 ms high.",
        "Upload the input capture sketch to a second Uno (or to the same Uno after merging the Timer2 part into it). Connect D11 of the first to D8 of the second, and join the GNDs.",
        "Confirm the reading is 1000.0 Hz. Then change OCR2A to 61 and predict the new frequency from the CTC formula before measuring it.",
        "Change the servo pulse to 1.0 ms and 2.0 ms by calculating OCR1A. If you have a servo, power it from a separate 5 V supply with GNDs joined, and watch it move to each end.",
      ],
    },
    quiz: [
      {
        q: "Timer1 runs in CTC mode on a 16 MHz Uno with prescaler 64. What OCR1A gives a compare match every 1 ms?",
        options: ["250", "249", "2499", "15 999"],
        answer: 1,
        why: "OCR1A = 16 000 000 / (64 × 1000) - 1 = 250 - 1 = 249. The counter visits 0 to 249, which is 250 ticks of 4 µs.",
      },
      {
        q: "Timer2 toggles OC2A in CTC mode with N = 64 and OCR2A = 124. What frequency appears on the pin?",
        options: ["2000 Hz", "1000 Hz", "500 Hz", "976.6 Hz"],
        answer: 1,
        why: "Matches happen at 16 000 000 / (64 × 125) = 2000 Hz, and each match toggles the pin, so the square wave is 1000 Hz.",
      },
      {
        q: "Why is input capture more precise than reading micros() inside a pin-change interrupt?",
        options: [
          "Input capture uses a faster clock than the CPU",
          "The hardware copies TCNT1 into ICR1 on the edge itself, so interrupt latency does not affect the timestamp",
          "micros() cannot be called in an interrupt",
          "Input capture works on every pin",
        ],
        answer: 1,
        why: "The capture happens in hardware at the edge. The ISR may run microseconds later but reads the already-frozen value.",
      },
      {
        q: "Phase-correct 8-bit PWM on a 16 MHz Uno with N = 64. What is the PWM frequency?",
        options: ["976.6 Hz", "980.4 Hz", "245.1 Hz", "490.2 Hz"],
        answer: 3,
        why: "Phase-correct: f = f_clk / (2 × N × TOP) = 16 000 000 / (2 × 64 × 255) = 490.2 Hz, the analogWrite frequency on D3, D9, D10, D11.",
      },
      {
        q: "A servo signal uses Timer1 Fast PWM with TOP = ICR1 = 39 999 and N = 8. Which OCR1A gives a 2.0 ms pulse?",
        options: ["3999", "4000", "1999", "39 999"],
        answer: 0,
        why: "The tick is 8 / 16 MHz = 0.5 µs, so 2.0 ms is 4000 ticks. The pin is high for OCR1A + 1 ticks, so OCR1A = 3999.",
      },
      {
        q: "Why do motor drivers often prefer phase-correct PWM to Fast PWM?",
        options: [
          "It gives twice the frequency",
          "It allows a duty cycle above 100%",
          "Each pulse stays centred in the period as the duty changes, so outputs switch symmetrically",
          "It does not need a prescaler",
        ],
        answer: 2,
        why: "Dual-slope counting keeps pulses centred and symmetric. Fast PWM gives the higher frequency, not phase-correct.",
      },
    ],
  },

  "i5-adc": {
    id: "i5-adc",
    outcomes: [
      "Explain how a successive approximation ADC finds a result in one step per bit",
      "Configure the ATmega328P ADC with ADMUX and ADCSRA and choose a legal ADC clock",
      "Calculate conversion time, sample rate and the voltage of one LSB",
      "Distinguish resolution from accuracy and correct for reference error",
      "Describe the ESP32 ADC's attenuation settings and nonlinearity",
    ],
    blocks: [
      { t: "h", text: "Why the ADC deserves a lesson" },
      { t: "p", text: "Most sensors end in a voltage, and the ADC is where that voltage becomes a number your program believes. `analogRead()` makes it look trivial, but the number can be off by several percent because of the reference, wrong because the source impedance is too high, or noisy because the clock is too fast. Knowing how the converter works tells you which of these is biting and what to change." },

      { t: "h", text: "Successive approximation" },
      { t: "p", text: "The ATmega328P and the ESP32 both use a **successive approximation register (SAR)** ADC. It has three parts: a **sample-and-hold** capacitor that grabs the input voltage and holds it still, an internal **DAC** that can produce any of the 1024 levels between 0 and the reference, and a **comparator** that says whether the held input is above or below the DAC output. A control register then plays a binary search: try the most significant bit, keep it if the input is still above the DAC output, move on to the next bit. A 10-bit result takes 10 comparisons." },
      { t: "p", text: "**Worked example.** Vref = 5.000 V and the input is 3.300 V. Each trial value is compared as code × 5 / 1024:" },
      { t: "table", head: ["Bit tried", "Trial code", "DAC voltage", "Input ≥ DAC?", "Keep bit?"], rows: [
        ["9", "512", "2.5000 V", "yes", "1"],
        ["8", "768", "3.7500 V", "no", "0"],
        ["7", "640", "3.1250 V", "yes", "1"],
        ["6", "704", "3.4375 V", "no", "0"],
        ["5", "672", "3.2813 V", "yes", "1"],
        ["4", "688", "3.3594 V", "no", "0"],
        ["3", "680", "3.3203 V", "no", "0"],
        ["2", "676", "3.3008 V", "no", "0"],
        ["1", "674", "3.2910 V", "yes", "1"],
        ["0", "675", "3.2959 V", "yes", "1"],
      ], caption: "Ten steps from 512 down to the final result 675 = 0b1010100011." },
      { t: "formula", text: String.raw`ADC = floor(Vin × 1024 / Vref)
    = floor(3.300 × 1024 / 5.000) = floor(675.84) = 675     ✓ matches the search
1 LSB = Vref / 1024 = 5.000 / 1024 = 4.88 mV`, caption: "The ATmega328P datasheet's conversion formula, and the size of one step." },

      { t: "h", text: "The ADC registers" },
      { t: "p", text: "Two registers do almost everything. **ADMUX** picks the reference and the channel; **ADCSRA** enables, starts and clocks the converter. The 10-bit result is read from `ADCL` and `ADCH`, which avr-libc combines as the 16-bit name `ADC` (it reads ADCL first, which the hardware requires so both halves come from the same conversion)." },
      { t: "table", head: ["Register", "Bits", "Meaning"], rows: [
        ["ADMUX", "REFS1:0", "00 = AREF pin, 01 = AVcc (with a capacitor on AREF), 11 = internal 1.1 V"],
        ["ADMUX", "ADLAR", "1 = left-adjust the result, so ADCH alone holds the top 8 bits"],
        ["ADMUX", "MUX3:0", "0000 to 0101 = A0 to A5 on the Uno, 1000 = temperature sensor, 1110 = 1.1 V bandgap, 1111 = 0 V"],
        ["ADCSRA", "ADEN", "1 = ADC on"],
        ["ADCSRA", "ADSC", "write 1 to start a conversion; reads 1 until it finishes"],
        ["ADCSRA", "ADATE", "1 = auto-trigger from the source chosen by ADTS2:0 in ADCSRB (free running, timer match and others)"],
        ["ADCSRA", "ADIF, ADIE", "conversion complete flag, and its interrupt enable"],
        ["ADCSRA", "ADPS2:0", "ADC clock prescaler: 000 and 001 = 2, then 4, 8, 16, 32, 64, 128 for 111"],
        ["DIDR0", "ADC5D to ADC0D", "1 = disable the digital input buffer on that analogue pin"],
      ], caption: "ATmega328P ADC control bits." },

      { t: "h", text: "Clock, conversion time and sample rate" },
      { t: "p", text: "The SAR logic needs its own clock. For full 10-bit accuracy the datasheet asks for an ADC clock **between 50 kHz and 200 kHz**. On a 16 MHz Uno: 16 MHz / 64 = 250 kHz is too fast, and 16 MHz / 128 = 125 kHz is the only setting in range, so ADPS2:0 = 111. That is what the Arduino core uses. Faster clocks work with fewer effective bits, which is acceptable when 8 bits are enough." },
      { t: "formula", text: String.raw`Normal conversion:  13 ADC clocks       (the first after enabling: 25)
t_conv = 13 / 125 000 Hz = 104 µs
f_sample = 125 000 / 13 ≈ 9615 samples per second
Sample-and-hold closes 1.5 ADC clocks after the start: 1.5 / 125 kHz = 12 µs`, caption: "Conversion timing at 16 MHz with prescaler 128." },
      { t: "p", text: "During the sampling window the input must charge the internal sample capacitor (about 14 pF) through the multiplexer's resistance and whatever resistance your circuit has. The datasheet recommends a source impedance of **10 kΩ or less**. A divider made from two 100 kΩ resistors has a Thevenin resistance of 50 kΩ, too high: readings come out low and depend on the previous channel. Fix it with smaller resistors, a capacitor of about 100 nF from the pin to GND (which supplies the charge), or an op-amp buffer." },

      { t: "h", text: "Reference, resolution and accuracy" },
      { t: "p", text: "**Resolution** is how finely the ADC divides its range: 10 bits, 1024 steps, 4.88 mV per step with a 5 V reference. **Accuracy** is how close the result is to the truth. They are different things, and accuracy is usually the worse of the two. The 328P's absolute accuracy, including offset, gain error and nonlinearity, is specified at about ±2 LSB, and that assumes a perfect reference." },
      { t: "p", text: "The reference matters most. The result is a ratio of Vin to Vref, so any error in Vref appears directly as a gain error. With REFS = 01 the reference is AVcc, which on an Uno powered from USB is the USB voltage, anywhere from about 4.75 V to 5.25 V, and it changes when other loads switch." },
      { t: "p", text: "**Worked example.** AVcc is really 4.85 V, the input is 2.000 V, and the code converts with 5.000 V. ADC = floor(2.000 × 1024 / 4.85) = floor(422.27) = 422. The program computes 422 × 5.000 / 1024 = 2.061 V, an error of 3%, about 12 LSB. Ten bits of resolution, 6 bits of accuracy. The fixes, from simplest: measure AVcc with a good meter and use the real value; use the internal 1.1 V reference for small signals (it is stable but only accurate to about ±9% from part to part, so calibrate it once); or use an external precision reference on AREF." },
      { t: "p", text: "**Ratiometric** sensors avoid the problem altogether. A potentiometer or a thermistor divider powered from the same AVcc gives an output proportional to AVcc, so the ratio Vin / Vref, and the ADC count, does not change when the supply does. Read ratiometric sensors against AVcc and absolute sensors (a TMP36, a current-sense amplifier) against a fixed reference." },
      { t: "snippet", lang: "cpp", code: String.raw`// Read A0 with the ADC registers and print millivolts.
#include <avr/io.h>

static void adcInit(void) {
  ADMUX = (1 << REFS0);                                  // AVcc reference, right adjusted, channel 0
  ADCSRA = (1 << ADEN) | (1 << ADPS2) | (1 << ADPS1) | (1 << ADPS0);  // enable, 16 MHz / 128 = 125 kHz
  DIDR0 = (1 << ADC0D);                                  // disable digital input buffer on A0
}

static uint16_t adcRead(uint8_t channel) {
  ADMUX = (ADMUX & 0xF0) | (channel & 0x0F);             // select channel, keep reference bits
  ADCSRA |= (1 << ADSC);                                 // start a conversion
  while (ADCSRA & (1 << ADSC)) { }                       // ADSC reads 1 until it finishes
  return ADC;                                            // avr-libc reads ADCL then ADCH
}

void setup() {
  Serial.begin(115200);
  adcInit();
  adcRead(0);                                            // discard the first (25-cycle) result
}

void loop() {
  uint16_t raw = adcRead(0);
  uint32_t mv = (uint32_t)raw * 5000UL / 1024UL;         // assumes AVcc = 5.000 V
  Serial.print(raw);
  Serial.print("  ");
  Serial.print(mv);
  Serial.println(" mV");
  delay(200);
}`, caption: "Arduino Uno. Register-level ADC read with polling of ADSC; Serial is still the core's." },
      { t: "note", kind: "warn", text: "With REFS1:0 = 00 the reference is whatever is on the AREF pin. Never connect an external voltage to AREF while the code selects AVcc or the internal reference: the internal reference is then shorted against your source. Select AREF in software before applying the voltage." },

      { t: "h", text: "The ESP32 ADC" },
      { t: "p", text: "The ESP32 has two 12-bit SAR ADCs. **ADC1** serves GPIO 32 to 39; **ADC2** serves ten other pins but cannot be used while Wi-Fi is running, because the radio driver uses it. For any project that might use Wi-Fi, put analogue inputs on ADC1. The internal reference is about 1.1 V, so the input passes through a selectable **attenuator** to accept larger voltages. In Arduino-ESP32 3.x the settings are `ADC_0db`, `ADC_2_5db`, `ADC_6db` and `ADC_11db` (the default), and Espressif documents the usable ranges for the original ESP32 as roughly 100 to 950 mV, 100 to 1250 mV, 150 to 1750 mV and 150 to 2450 mV respectively." },
      { t: "p", text: "Two properties catch people. The ADC is **nonlinear near both ends**: below about 100 to 150 mV it reads 0, and near the top of each range it flattens, so a pot swept across 0 to 3.3 V does not give a straight line from 0 to 4095. And the reference varies from chip to chip by several percent. Espressif stores calibration data in each chip's eFuses, and `analogReadMilliVolts()` applies it. Use millivolts, keep signals inside the documented range, and calibrate against a meter if you need better than a few percent." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.x: read GPIO 34 (ADC1 channel 6) as raw counts and calibrated millivolts.
const int POT = 34;               // ADC1: still usable while Wi-Fi is on

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);       // 0 to 4095
  analogSetPinAttenuation(POT, ADC_11db);   // widest input range, about 150 to 2450 mV usable
}

void loop() {
  int raw = analogRead(POT);
  int mv = analogReadMilliVolts(POT);       // uses the chip's eFuse calibration
  Serial.printf("raw %4d   %4d mV\n", raw, mv);
  delay(200);
}`, caption: "ESP32 DevKit, Arduino-ESP32 3.x. Compiled for esp32:esp32:esp32." },

      { t: "deep", title: "Measuring your own supply with the 1.1 V bandgap", blocks: [
        { t: "p", text: "Select AVcc as the reference and the internal 1.1 V bandgap as the input (MUX3:0 = 1110). The result is ADC = 1.1 × 1024 / AVcc, so AVcc = 1.1 × 1024 / ADC. A reading of 232 means AVcc ≈ 1126.4 / 232 = 4.855 V. The bandgap varies by up to ±0.1 V between chips, so measure AVcc once with a good meter, compute your chip's real bandgap voltage (Vbg = AVcc × ADC / 1024), and store it in EEPROM. After that, every reading can be corrected for supply drift on the fly, which is how battery-powered AVR boards report their own battery voltage with no extra parts." },
        { t: "snippet", lang: "c", code: String.raw`// Returns AVcc in millivolts using the bandgap. VBG_MV is your calibrated value.
#define VBG_MV 1100UL
uint16_t readVccMillivolts(void) {
  ADMUX = (1 << REFS0) | 0x0E;          // AVcc reference, input = 1.1 V bandgap
  for (volatile uint16_t i = 0; i < 2000; i++) { }   // let the bandgap settle (~1 ms)
  ADCSRA |= (1 << ADSC);
  while (ADCSRA & (1 << ADSC)) { }
  return (uint16_t)(VBG_MV * 1024UL / ADC);
}`, caption: "Switch the mux back to your sensor channel afterwards and discard the first reading." },
      ] },
      { t: "deep", title: "INL, DNL, noise and oversampling", blocks: [
        { t: "p", text: "Datasheets describe ADC error with a few standard terms. **Offset error** is how far the first transition is from where it should be. **Gain error** is the slope error, after removing offset. **Differential nonlinearity (DNL)** is how much each individual step differs from 1 LSB wide; DNL worse than -1 LSB means missing codes. **Integral nonlinearity (INL)** is the worst deviation of the actual transfer curve from a straight line. Offset and gain can be calibrated out with two known inputs; INL and DNL cannot, short of a lookup table." },
        { t: "p", text: "Random noise can be used. If the input carries about 1 LSB of noise, averaging 4^k samples and shifting right by k gives k extra bits of resolution: 16 samples for 11 bits, 64 for 12. This is **oversampling and decimation** (Atmel application note AVR121). It improves resolution, not accuracy: averaging cannot remove a reference error. The ADC also has a **noise reduction** sleep mode that halts the CPU during the conversion so its switching noise does not disturb the result." },
        { t: "p", text: "For timed sampling, set ADATE and choose a trigger such as Timer1 compare match B in ADTS2:0. The conversion then starts exactly on the timer event, with no jitter from software, which matters for any later signal processing. The sensors module (i8) relies on this." },
      ] },
    ],
    mistakes: [
      "**Running the ADC clock too fast.** At 16 MHz only prescaler 128 gives a clock within 50 to 200 kHz for full 10-bit accuracy.",
      "**Assuming AVcc is exactly 5 V.** On USB power it can be 4.75 to 5.25 V, which is a gain error of up to 5% on absolute measurements.",
      "**Feeding the ADC from a high-impedance source.** Above about 10 kΩ the sample capacitor does not charge fully; add a capacitor or lower the resistance.",
      "**Using ADC2 pins on an ESP32 with Wi-Fi.** ADC2 belongs to the radio while Wi-Fi is on; use GPIO 32 to 39.",
      "**Trusting the first conversion after a reference or channel change.** Discard it.",
      "**Confusing resolution with accuracy.** 12 bits on an ESP32 does not mean 12 accurate bits; nonlinearity and reference spread dominate.",
    ],
    practice: {
      kind: "bench",
      task: "Measure how accurate your Uno's ADC really is, and correct it.",
      steps: [
        "Wire a 10 kΩ potentiometer between 5 V and GND with the wiper to A0. Upload the register-level ADC sketch.",
        "Set the wiper to three positions, near 1 V, 2.5 V and 4 V. At each, record the multimeter voltage on A0 and the printed millivolts.",
        "Measure the 5 V pin with the meter. Replace 5000 in the sketch with your measured value in millivolts and repeat. How much did the error shrink?",
        "Add a reading of the 1.1 V bandgap (MUX3:0 = 1110), compute your chip's true bandgap voltage from the measured AVcc, and use it to report AVcc continuously. Load the 5 V rail with a 100 Ω resistor through a transistor or simply a bright LED and resistor, and watch the reported AVcc change.",
      ],
    },
    quiz: [
      {
        q: "How many comparisons does a 10-bit successive approximation ADC need for one result?",
        options: ["1024", "10", "1", "13"],
        answer: 1,
        why: "It decides one bit per comparison, from the most significant down. The 13 ADC clocks include sampling and overhead.",
      },
      {
        q: "On a 16 MHz Uno, which ADC prescaler keeps the ADC clock within 50 to 200 kHz?",
        options: ["16", "32", "64", "128"],
        answer: 3,
        why: "16 MHz / 128 = 125 kHz is in range. 16 MHz / 64 = 250 kHz is too fast.",
      },
      {
        q: "With Vref = 5.000 V, what does the ADC return for an input of 1.000 V?",
        options: ["204", "205", "200", "1000"],
        answer: 0,
        why: "1.000 × 1024 / 5.000 = 204.8, and the result is the integer part: 204.",
      },
      {
        q: "A sketch assumes AVcc = 5.00 V, but it is actually 4.80 V. A TMP36 temperature sensor (absolute output) is read against AVcc. What happens?",
        options: [
          "Nothing, because the ADC compensates automatically",
          "The computed voltage reads about 4% high",
          "The computed voltage reads about 4% low",
          "The ADC returns 1023",
        ],
        answer: 1,
        why: "The count is Vin × 1024 / 4.80, about 4% larger than with 5.00 V, and the sketch multiplies by 5.00 / 1024, so the result is about 4% high.",
      },
      {
        q: "Why does a 10 kΩ potentiometer read against AVcc give the same count even when the USB supply changes?",
        options: [
          "Potentiometers regulate their own voltage",
          "The ADC has an internal regulator",
          "The pot's output is proportional to AVcc, so the ratio Vin / Vref is unchanged: it is ratiometric",
          "It does not; the count changes with the supply",
        ],
        answer: 2,
        why: "Both the input and the reference scale with AVcc, so their ratio, which is what the ADC measures, stays the same.",
      },
      {
        q: "An ESP32 project uses Wi-Fi. Where should the analogue sensor go?",
        options: [
          "Any ADC2 pin",
          "GPIO 32 to 39, the ADC1 pins",
          "GPIO 6 to 11",
          "It cannot read analogue values while Wi-Fi is on",
        ],
        answer: 1,
        why: "ADC2 is used by the Wi-Fi driver. ADC1 on GPIO 32 to 39 stays available.",
      },
    ],
  },

  "i5-comparator-dac-watchdog-datasheet": {
    id: "i5-comparator-dac-watchdog-datasheet",
    outcomes: [
      "Use the analog comparator to detect a threshold in hardware",
      "Make a DAC from PWM and an RC filter and calculate its ripple and settling time",
      "Configure the watchdog timer and explain brown-out detection",
      "Find any register, bit and electrical limit in the ATmega328P datasheet",
      "Write blink, PWM and analogue read using registers only",
    ],
    blocks: [
      { t: "h", text: "Why these peripherals matter" },
      { t: "p", text: "The ADC tells you what a voltage is; sometimes you only need to know, instantly, whether it has crossed a line. Sometimes you need the opposite of an ADC, a voltage out. And every product needs a way to recover when the firmware hangs or the supply sags. This lesson covers the analog comparator, the DAC (and how to fake one), the watchdog and brown-out detector, and then the skill that ties the module together: finding all of this in a datasheet yourself." },

      { t: "h", text: "The analog comparator" },
      { t: "p", text: "A comparator outputs 1 when its positive input is above its negative input, and 0 otherwise. The ATmega328P has one. The positive input is **AIN0** (PD6, D6 on the Uno) and the negative input is **AIN1** (PD7, D7). It responds in well under a microsecond, uses no CPU time, and can raise an interrupt or trigger Timer1 input capture. Typical jobs: detecting when a capacitor has charged to a threshold, zero-crossing detection, overcurrent trips, and simple wake-up on a level." },
      { t: "table", head: ["Register", "Bits", "Meaning"], rows: [
        ["ACSR", "ACD", "1 = comparator off (saves power)"],
        ["ACSR", "ACBG", "1 = replace AIN0 with the internal 1.1 V bandgap"],
        ["ACSR", "ACO", "the comparator output, read-only"],
        ["ACSR", "ACI, ACIE", "interrupt flag and interrupt enable"],
        ["ACSR", "ACIC", "1 = connect the output to Timer1 input capture"],
        ["ACSR", "ACIS1:0", "interrupt on 00 = toggle, 10 = falling, 11 = rising"],
        ["ADCSRB", "ACME", "1 (with ADEN = 0) = take the negative input from the ADC multiplexer, A0 to A5"],
        ["DIDR1", "AIN1D, AIN0D", "disable the digital input buffers on the comparator pins"],
      ], caption: "Analog comparator bits. Disable ACIE before changing ACIS1:0, or the change itself can raise an interrupt." },
      { t: "p", text: "**Example.** Battery undervoltage alarm with no ADC conversions: set ACBG so the positive input is the 1.1 V bandgap, feed the battery through a divider to AIN1, and enable the comparator interrupt. Which edge? Think it through: ACO = 1 when positive (1.1 V) is above negative (the divided battery). As the battery falls, the divided voltage drops below 1.1 V and ACO goes from 0 to 1, a **rising** edge, so ACIS1:0 = 11. Choose the divider so the trip point is right: for a 3.3 V alarm, the divider must produce 1.1 V at 3.3 V, a ratio of 1/3, for example 20 kΩ over 10 kΩ." },
      { t: "formula", text: String.raw`V_AIN1 = V_bat × R2 / (R1 + R2) = V_bat × 10 / (20 + 10) = V_bat / 3
trip when V_bat / 3 = 1.1 V  →  V_bat = 3.3 V
check: 3.3 × 10 / 30 = 1.10 V ✓`, caption: "Divider for a 3.3 V trip. The bandgap's ±0.1 V tolerance makes the real trip anywhere from about 3.0 to 3.6 V, so calibrate if it matters." },

      { t: "h", text: "DAC: real and improvised" },
      { t: "p", text: "A **DAC** turns a number into a voltage. The ATmega328P has none. The original ESP32 has two 8-bit DACs, on GPIO 25 and GPIO 26 of the DevKit, driven in Arduino-ESP32 with `dacWrite(25, value)`; the output is roughly 3.3 V × value / 255 (Espressif gives VDD3P3_RTC × value / 255), and is useful for audio tones, bias voltages and test signals. Newer chips (ESP32-C3, ESP32-S3) dropped the DAC, so do not design around it unless you know which chip you have." },
      { t: "p", text: "On the AVR, the standard substitute is **PWM followed by an RC low-pass filter**. The PWM's average value is Vcc × duty; the filter removes most of the switching, leaving that average plus a small ripple. The filter must have a cut-off far below the PWM frequency. Two numbers describe the result: ripple and settling time." },
      { t: "formula", text: String.raw`f_c      = 1 / (2π R C)
ripple   ≈ Vcc × D × (1 - D) / (f_PWM × R × C)      (peak to peak, valid when RC ≫ 1/f_PWM)
settling ≈ 5 R C                                   (to within 1% of a new value)`, caption: "First-order RC filter on a PWM output. Ripple is worst at D = 0.5." },
      { t: "p", text: "**Worked example.** Timer2 Fast PWM with N = 1 gives 16 MHz / 256 = 62.5 kHz on D11 or D3. Use R = 10 kΩ and C = 1 µF: RC = 10 ms and f_c = 1 / (2π × 0.01) ≈ 15.9 Hz. At D = 0.5 the ripple is 5 × 0.25 / (62 500 × 0.01) = 1.25 / 625 = 2 mV peak to peak, under half an 8-bit step (5 / 256 = 19.5 mV). Settling to a new value takes about 5 × 10 ms = 50 ms. Now try it at the default analogWrite frequency of 490 Hz: the ripple would be 1.25 / (490 × 0.01) ≈ 255 mV, over 13 steps. Higher PWM frequency is what makes the filter work. The output can source very little current through 10 kΩ, so buffer it with an op-amp follower if it drives anything." },

      { t: "h", text: "The watchdog timer" },
      { t: "p", text: "A **watchdog** is a timer that resets the chip unless the program restarts it regularly ('feeds' or 'kicks' it). If the firmware hangs in a loop, waits forever for a sensor that never answers, or is corrupted by electrical noise, the feeding stops and the watchdog brings the system back. The 328P's watchdog runs from its own 128 kHz oscillator, so it keeps working even if the main clock fails." },
      { t: "list", items: [
        "Timeouts from about 16 ms to 8 s, set by WDP3:0 in `WDTCSR`.",
        "Three modes: **interrupt** (WDIE, runs `WDT_vect`, also handy as a low-power wake-up timer), **reset** (WDE), or **interrupt then reset** (both), which lets you save state before the reset.",
        "Changes are protected by a timed sequence: write WDCE and WDE together, then the new value within four cycles. The `WDTON` fuse forces the watchdog permanently on.",
        "avr-libc wraps it: `wdt_enable(WDTO_2S)`, `wdt_reset()`, `wdt_disable()` in `<avr/wdt.h>`.",
      ] },
      { t: "snippet", lang: "cpp", code: String.raw`// Watchdog demo: the loop feeds the dog; send any character to make it hang.
#include <avr/wdt.h>

void setup() {
  uint8_t cause = MCUSR;      // why did we reset?
  MCUSR = 0;                  // clear the flags (WDRF must be cleared before WDE)
  wdt_disable();
  Serial.begin(115200);
  Serial.print("reset cause:");
  if (cause & (1 << PORF))  Serial.print(" power-on");
  if (cause & (1 << EXTRF)) Serial.print(" external");
  if (cause & (1 << BORF))  Serial.print(" brown-out");
  if (cause & (1 << WDRF))  Serial.print(" watchdog");
  Serial.println();
  wdt_enable(WDTO_2S);        // about 2 s timeout
}

void loop() {
  wdt_reset();                // feed the watchdog
  if (Serial.available()) {
    Serial.println("hanging...");
    for (;;) { }              // no more wdt_reset(): reset in about 2 s
  }
  delay(100);
}`, caption: "Arduino Uno. Prints the reset cause, then resets itself through the watchdog when you send a character." },
      { t: "p", text: "Feed the watchdog in one place only, at the top of the main loop, after the work that proves the system is healthy. Feeding it inside a slow function, or from a timer interrupt, defeats the purpose: the interrupt keeps running while the main loop is stuck." },

      { t: "h", text: "Brown-out detection" },
      { t: "p", text: "As the supply falls, a CPU does not stop cleanly. Below its rated voltage for the clock speed, it may misread instructions, jump to random places, or write garbage into EEPROM and flash. The **brown-out detector (BOD)** holds the chip in reset while VCC is below a threshold set by the BODLEVEL fuses: about 1.8 V, 2.7 V or 4.3 V, or disabled. The Uno's fuses select 2.7 V. After the supply recovers, the chip restarts and `MCUSR` shows BORF." },
      { t: "p", text: "The safe operating area in the datasheet's speed grades makes the choice concrete: the ATmega328P is rated for 10 MHz at 2.7 V and 20 MHz at 4.5 V, linear in between. At 16 MHz you need about 2.7 + (16 - 10) × (4.5 - 2.7) / (20 - 10) = 3.78 V. So a 16 MHz board with BOD at 2.7 V can, in principle, run out of specification between 3.78 V and 2.7 V; a 4.3 V BOD level is the strict choice for 16 MHz at 5 V. The ESP32 has a brown-out detector too, enabled by default in Arduino-ESP32; the message 'Brownout detector was triggered' usually means a weak USB cable or supply sagging during Wi-Fi transmit bursts." },

      { t: "h", text: "Reading the ATmega328P datasheet" },
      { t: "p", text: "Everything in this module came from one document: the ATmega328P datasheet, Microchip DS40002061 (the current edition of the older Atmel 'ATmega48A/PA/88A/PA/168A/PA/328/P' datasheet). It is long, but it is organised the same way for every peripheral, and you never read it front to back. Learn its layout:" },
      { t: "list", ordered: true, items: [
        "**Pin configurations and pin descriptions.** Which physical pin carries which functions (PD6 is also AIN0 and OC0A).",
        "**Overview and block diagram.** What exists and how it connects.",
        "**Core chapters**: AVR CPU, memories, system clock, power management and sleep, system control and reset (watchdog, BOD), interrupts (the vector table).",
        "**One chapter per peripheral**: I/O ports, Timer0, Timer1, Timer2, SPI, USART, TWI, analog comparator, ADC. Each starts with features and a block diagram, explains operation and modes, and ends with **Register Description**: every register, every bit, its read or write access and its initial value.",
        "**Register summary.** All registers with addresses and bit names on a few pages. Keep it open while coding.",
        "**Electrical characteristics.** The guaranteed numbers: supply ranges, pin current, input thresholds, ADC accuracy. Plan against these, not against 'typical characteristics' graphs, and never against 'absolute maximum ratings', which are the limits of destruction.",
        "**Errata.** Known silicon bugs. Read it before blaming yourself for something impossible.",
      ] },
      { t: "p", text: "A method that works for any peripheral: read the block diagram, then the operation section for the mode you need, then the register description; write down each register and the bits you will set, with the reason; only then write code. Comment each register write with the mode or value it selects, as the sketches here do. For ESP32 the equivalent documents are the ESP32 datasheet (electrical) and the ESP32 Technical Reference Manual (registers), plus the ESP-IDF programming guide for drivers." },

      { t: "h", text: "Exit project: blink, PWM and analogue read with registers only" },
      { t: "p", text: "The program below uses no Arduino functions at all: it defines `main()`, so `init()`, `setup()` and `loop()` never run, and it talks to Timer0, Timer1, the ADC and USART0 directly. D13 blinks at 1 Hz, timed by Timer1 in CTC mode with the compare flag polled. A potentiometer on A0 sets the brightness of an LED on D6 through Timer0 Fast PWM. The ADC reading is printed over the serial port at 9600 baud each time the LED toggles." },
      { t: "diagram", text: String.raw`
  Uno 5V ──┐                     D6 ──[ 330 Ω ]──►|── GND   (LED)
          [10k pot]
   A0 ◄────┤ wiper               D13 on-board LED
  Uno GND ─┘`, caption: "Wiring: a pot on A0, an LED with a series resistor on D6." },
      { t: "snippet", lang: "cpp", code: String.raw`// i5 exit project: blink, PWM and analog read on the Uno using registers only.
//   D13 (PB5): LED blinks at 1 Hz, timed by Timer1 in CTC mode (flag polled)
//   D6  (PD6): LED brightness follows the pot, Timer0 Fast PWM on OC0A
//   A0  (PC0): pot wiper, read by the ADC
//   USART0: prints the ADC reading at 9600 baud each time the LED toggles
#include <avr/io.h>

static void uartInit(void) {
  UBRR0 = 103;                               // 16 MHz / (16 * 9600) - 1 = 103.17
  UCSR0B = (1 << TXEN0);                     // transmitter on
  UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);    // 8 data bits, no parity, 1 stop
}

static void uartPut(char c) {
  while (!(UCSR0A & (1 << UDRE0))) { }       // wait for empty transmit buffer
  UDR0 = c;
}

static void uartPrintU16(uint16_t v) {
  char buf[6];
  uint8_t i = 0;
  do { buf[i++] = '0' + v % 10; v /= 10; } while (v);
  while (i) uartPut(buf[--i]);
  uartPut('\r');
  uartPut('\n');
}

static void adcInit(void) {
  ADMUX = (1 << REFS0);                      // AVcc reference, channel 0
  ADCSRA = (1 << ADEN) | (1 << ADPS2) | (1 << ADPS1) | (1 << ADPS0);  // 125 kHz ADC clock
  DIDR0 = (1 << ADC0D);
}

static uint16_t adcRead(void) {
  ADCSRA |= (1 << ADSC);
  while (ADCSRA & (1 << ADSC)) { }
  return ADC;
}

int main(void) {
  // Blink: Timer1 CTC (mode 4), compare match every 0.5 s
  DDRB |= (1 << DDB5);
  TCCR1A = 0;
  TCCR1B = (1 << WGM12) | (1 << CS12);        // CTC, prescaler 256
  OCR1A = 31249;                             // (31249 + 1) * 256 / 16 MHz = 0.5 s exactly

  // PWM: Timer0 Fast PWM (mode 3), non-inverting on OC0A, prescaler 64
  DDRD |= (1 << DDD6);
  TCCR0A = (1 << COM0A1) | (1 << WGM01) | (1 << WGM00);
  TCCR0B = (1 << CS01) | (1 << CS00);        // 16 MHz / (64 * 256) = 976.6 Hz

  adcInit();
  uartInit();
  adcRead();                                 // discard first conversion

  uint16_t value = 0;
  for (;;) {
    value = adcRead();
    OCR0A = value >> 2;                      // 10-bit reading to 8-bit duty

    if (TIFR1 & (1 << OCF1A)) {              // 0.5 s has passed
      TIFR1 = (1 << OCF1A);                  // clear the flag by writing a 1
      PINB = (1 << PINB5);                   // toggle the LED
      uartPrintU16(value);
    }
  }
}`, caption: "Arduino Uno. Compiles with arduino-cli for arduino:avr:uno to 422 bytes. Open the Serial Monitor at 9600 baud." },
      { t: "p", text: "Check its numbers. Timer1: (31 249 + 1) × 256 / 16 000 000 = 0.5 s per toggle, so 1 Hz. Timer0: 16 000 000 / (64 × 256) = 976.6 Hz PWM. ADC clock: 16 MHz / 128 = 125 kHz, inside the 50 to 200 kHz window. UART: UBRR0 = 16 000 000 / (16 × 9600) - 1 = 103.17, rounded to 103, giving an actual rate of 16 000 000 / (16 × 104) = 9615 baud, 0.16% fast, far inside the roughly ±2% a UART tolerates. The `uartPrintU16` function builds digits in reverse with `% 10` and `/ 10`, then sends them in the right order." },
      { t: "note", kind: "tip", text: "Uploading still works because the bootloader runs before your main(). If a register experiment ever leaves the board unresponsive, press reset just as the upload starts." },

      { t: "deep", title: "A watchdog trap: the endless reset loop", blocks: [
        { t: "p", text: "After a watchdog reset, the 328P keeps the watchdog **enabled** with its shortest timeout (about 16 ms), because WDRF in MCUSR forces WDE on. If the code takes longer than 16 ms to reach the point where it disables or feeds the watchdog, the chip resets again, forever. The datasheet's rule: clear WDRF in MCUSR, then disable or reconfigure the watchdog, as early as possible in start-up." },
        { t: "p", text: "Current Optiboot on the Uno handles this for you by passing control straight to your sketch after a watchdog reset, and the demo above clears MCUSR and calls `wdt_disable()` first thing in setup(). On a bare chip, an older Nano bootloader, or a custom board, put that code in a function placed in the `.init3` section so it runs before the C runtime even zeroes RAM:" },
        { t: "snippet", lang: "c", code: String.raw`#include <avr/wdt.h>
uint8_t resetFlags __attribute__((section(".noinit")));

void earlyWdtOff(void) __attribute__((naked, used, section(".init3")));
void earlyWdtOff(void) {
  resetFlags = MCUSR;   // keep the cause for later
  MCUSR = 0;
  wdt_disable();
}`, caption: "Pattern from the avr-libc documentation. .noinit keeps resetFlags from being zeroed by start-up code." },
      ] },
      { t: "deep", title: "Watchdogs on the ESP32", blocks: [
        { t: "p", text: "The ESP32 has several watchdogs, all managed by ESP-IDF underneath the Arduino core. The **Task Watchdog Timer (TWDT)** checks that chosen FreeRTOS tasks, and the idle tasks, get to run; a loop that never yields starves the idle task and triggers a 'task_wdt' message. The **Interrupt Watchdog (IWDT)** checks that interrupts are not disabled, or an ISR is not running, for too long. A third, the RTC watchdog, guards the boot process." },
        { t: "p", text: "The lesson for code is the same as for the AVR, with one more rule: on an ESP32, a long busy loop in `loop()` without `delay()` or `yield()` can trip the task watchdog even though nothing is wrong. The real-time programming module (i6) shows how to structure code so that never happens." },
      ] },
    ],
    mistakes: [
      "**Getting the comparator's sense backwards.** ACO is 1 when AIN0 (or the bandgap) is above AIN1. Work out which edge you want before setting ACIS1:0.",
      "**Filtering low-frequency PWM.** At 490 Hz an RC filter needs a huge time constant to reduce ripple; raise the PWM frequency first.",
      "**Feeding the watchdog from a timer interrupt.** The interrupt keeps running when the main loop hangs, so the watchdog never fires.",
      "**Running 16 MHz below 3.8 V.** The 328P is not rated for it; a 2.7 V brown-out level does not protect that region.",
      "**Planning with absolute maximum ratings.** They are limits of damage, not operating conditions. Design to the electrical characteristics tables.",
      "**Assuming every ESP32 has a DAC.** Only the original ESP32 and the ESP32-S2 do.",
    ],
    practice: {
      kind: "bench",
      task: "Build the exit project, then extend it from the datasheet alone.",
      steps: [
        "Wire the pot and LED, upload the register-only sketch, and open the Serial Monitor at 9600 baud. Turn the pot and confirm the LED brightness and printed values follow it.",
        "Measure the LED's PWM frequency on D6 with an oscilloscope or logic analyser and compare with 976.6 Hz.",
        "Using only the datasheet's Timer0 chapter, change Timer0 to phase-correct PWM. Predict the new frequency, then measure it.",
        "Using only the analog comparator chapter, add a threshold: make D13 stay on whenever A0 is above the 1.1 V bandgap. (Hint: ACME, ACBG and the ADC mux, with ADEN off, or read the comparator between ADC conversions.) Write down every register and bit you used and why.",
      ],
    },
    quiz: [
      {
        q: "ACBG is set, so the comparator's positive input is the 1.1 V bandgap; a divided battery voltage goes to AIN1. What does ACO do as the battery voltage falls past the trip point?",
        options: [
          "It goes from 1 to 0",
          "It goes from 0 to 1",
          "It stays at 1",
          "It oscillates",
        ],
        answer: 1,
        why: "ACO is 1 when the positive input exceeds the negative one. Once the divided voltage drops below 1.1 V, positive is higher and ACO rises from 0 to 1.",
      },
      {
        q: "A PWM DAC uses 62.5 kHz PWM with R = 10 kΩ and C = 1 µF. Roughly how long does the output take to settle after the duty cycle changes?",
        options: ["10 ms", "50 ms", "16 µs", "1 s"],
        answer: 1,
        why: "RC = 10 kΩ × 1 µF = 10 ms, and settling to within about 1% takes about 5 RC = 50 ms.",
      },
      {
        q: "Why is the same RC filter much worse at 490 Hz PWM than at 62.5 kHz?",
        options: [
          "The average voltage is different",
          "Ripple is inversely proportional to the PWM frequency, so it is about 128 times larger",
          "The filter cut-off frequency changes",
          "490 Hz PWM has lower resolution",
        ],
        answer: 1,
        why: "Ripple ≈ Vcc × D(1 - D) / (f × RC). Dropping f from 62 500 to 490 Hz multiplies ripple by about 128, from 2 mV to about 255 mV.",
      },
      {
        q: "Where should a program feed the watchdog?",
        options: [
          "In a timer interrupt, so it is fed regularly",
          "Once in setup()",
          "In the main loop, after the work that shows the system is healthy",
          "Inside every function",
        ],
        answer: 2,
        why: "The watchdog must only be fed when the main program is making progress. A timer interrupt keeps running even when the main loop is stuck.",
      },
      {
        q: "In the exit project, UBRR0 = 103 at 16 MHz. What is the actual baud rate and is it acceptable for 9600 baud?",
        options: [
          "9615 baud, 0.16% fast, acceptable",
          "9600 baud exactly",
          "10 000 baud, 4% fast, too fast",
          "9520 baud, 0.8% slow, unacceptable",
        ],
        answer: 0,
        why: "Baud = 16 000 000 / (16 × (103 + 1)) = 9615.4, which is 0.16% above 9600, well within the roughly 2% a UART tolerates.",
      },
      {
        q: "Which section of the datasheet should you design against for the guaranteed input-high threshold of a pin?",
        options: [
          "Absolute maximum ratings",
          "Typical characteristics graphs",
          "Electrical characteristics tables",
          "The block diagram",
        ],
        answer: 2,
        why: "Electrical characteristics give guaranteed minimum and maximum values. Typical graphs are not guaranteed, and absolute maximums are damage limits.",
      },
    ],
  },
};

export default lessons;
