import type { ModuleContent } from "../model/curriculum";

/**
 * Module i3: Digital electronics.
 * Datasheet numbers: TI SN74HC595 (SCLS041), Microchip ATmega328P, Espressif ESP32 datasheet.
 * Normal mode is self-sufficient; `deep` holds derivations and datasheet detail.
 */
const lessons: ModuleContent = {
  "i3-numbers-logic-and-kmaps": {
    id: "i3-numbers-logic-and-kmaps",
    outcomes: [
      "Convert between binary, hexadecimal, decimal and two's complement without a calculator",
      "Simplify a Boolean expression with the laws of Boolean algebra and with a Karnaugh map",
      "Explain how a multiplexer, a decoder and a full adder are built from gates",
      "Read a truth table and turn it into a working gate circuit",
    ],
    blocks: [
      { t: "h", text: "Why a firmware engineer needs gate-level logic" },
      { t: "p", text: "Every register you will write in firmware is a row of flip-flops, and every peripheral is a block of gates. When a datasheet says a bit is \"set by hardware, cleared by writing 1\", or a status flag is the OR of several conditions, it is describing logic. When you read `0x3F` in a register dump you need to see the six ones at a glance. This lesson gives you the language: number systems, Boolean algebra, Karnaugh maps, and the combinational blocks that every chip is built from." },

      { t: "h", text: "Number systems" },
      { t: "p", text: "A number written in base b has digits worth b⁰, b¹, b² and so on from the right. Digital hardware uses base 2 (**binary**) because a wire is either high or low. Binary numbers get long, so engineers group four bits into one **hexadecimal** digit (base 16, digits 0 to 9 then A to F). One hex digit is exactly one nibble, two hex digits are one byte. That exact fit is why hex, not decimal, is the language of registers and memory dumps." },
      { t: "formula", text: String.raw`1011 0110 (binary)
= 1·128 + 0·64 + 1·32 + 1·16 + 0·8 + 1·4 + 1·2 + 0·1
= 182 (decimal)
= B6 (hex):  1011 = B,  0110 = 6`, caption: "Binary to decimal by place value, binary to hex by grouping nibbles." },
      { t: "p", text: "Check: B6 in hex is 11 × 16 + 6 = 176 + 6 = 182. Same answer by two routes, so it is right." },
      { t: "p", text: "To go from decimal to binary, divide by 2 repeatedly and read the remainders from last to first, or subtract the largest power of 2 that fits. For 100: 64 fits (36 left), 32 fits (4 left), 16 and 8 do not, 4 fits (0 left). So 100 = 0110 0100 = 0x64." },

      { t: "h", text: "Signed numbers: two's complement" },
      { t: "p", text: "Microcontrollers store negative integers in **two's complement**. In an n-bit number the top bit is worth minus 2ⁿ⁻¹ instead of plus. An 8-bit value therefore runs from -128 to +127. To negate a number, invert every bit and add 1. The beauty of the scheme is that the same adder circuit adds signed and unsigned numbers; only your interpretation of the result changes." },
      { t: "formula", text: String.raw`+5        = 0000 0101
invert    = 1111 1010
add 1     = 1111 1011 = 0xFB = -5

0xB5 = 1011 0101
unsigned: 181
signed:   181 - 256 = -75`, caption: "The same eight bits mean 181 or -75 depending on whether the type is uint8_t or int8_t." },
      { t: "p", text: "Check: -5 + 5 in binary is 1111 1011 + 0000 0101 = 1 0000 0000. The ninth bit falls off the end of an 8-bit register, leaving 0000 0000. Correct." },
      { t: "p", text: "**BCD** (binary coded decimal) stores each decimal digit in its own nibble, so 59 is 0101 1001 (0x59). It wastes codes (1010 to 1111 are unused) but real-time clock chips such as the DS3231 use it because the digits go straight to a display." },

      { t: "h", text: "Boolean algebra" },
      { t: "p", text: "Boolean algebra works on values that are 0 or 1 with three basic operations: AND (written A·B or AB), OR (A + B) and NOT (A'). Every digital circuit, however large, can be written with these. The useful laws:" },
      { t: "table", head: ["Law", "AND form", "OR form"], rows: [
        ["Identity", "A·1 = A", "A + 0 = A"],
        ["Null", "A·0 = 0", "A + 1 = 1"],
        ["Idempotent", "A·A = A", "A + A = A"],
        ["Complement", "A·A' = 0", "A + A' = 1"],
        ["Absorption", "A(A + B) = A", "A + AB = A"],
        ["Distributive", "A(B + C) = AB + AC", "A + BC = (A + B)(A + C)"],
        ["De Morgan", "(AB)' = A' + B'", "(A + B)' = A'B'"],
      ], caption: "Each law has a dual: swap AND with OR and 0 with 1." },
      { t: "p", text: "De Morgan's laws matter most in practice. They say a NAND gate is an OR gate with inverted inputs, and a NOR gate is an AND gate with inverted inputs. Since NAND alone can build any function, chips are mostly NAND and NOR internally. They also explain active-low signals: a chip enable called `CE'` (or `/CE`, or with a bar) is asserted when it is 0, and \"enabled when A or B is low\" is the same as \"NAND of A and B is high\"." },
      { t: "p", text: "Worked simplification: F = AB + AB' + A'B. Group the first two: A(B + B') = A·1 = A. So F = A + A'B. By the distributive law in OR form, A + A'B = (A + A')(A + B) = A + B. Check with the truth table: F is 0 only when A = 0 and B = 0 (none of the three terms is 1), which is exactly A + B." },

      { t: "h", text: "Karnaugh maps" },
      { t: "p", text: "Algebra works, but you can miss a simplification. A **Karnaugh map** (K-map) lays out the truth table in a grid where neighbouring cells differ in exactly one variable. The rows and columns are therefore labelled in **Gray code** order: 00, 01, 11, 10, not 00, 01, 10, 11. You then circle groups of 1s whose size is a power of two (1, 2, 4, 8) and that are rectangles, wrapping round the edges if needed. Each group becomes one product term; inside a group, a variable that changes drops out." },
      { t: "p", text: "Example: a 4-input function F(A, B, C, D) is 1 for minterms 0, 2, 5, 7, 8, 10, 13 and 15. (Minterm 5 means ABCD = 0101.)" },
      { t: "diagram", text: String.raw`              CD
           00  01  11  10
        +---+---+---+---+
   AB 00| 1 | 0 | 0 | 1 |     minterms 0, 1, 3, 2
        +---+---+---+---+
      01| 0 | 1 | 1 | 0 |     minterms 4, 5, 7, 6
        +---+---+---+---+
      11| 0 | 1 | 1 | 0 |     minterms 12, 13, 15, 14
        +---+---+---+---+
      10| 1 | 0 | 0 | 1 |     minterms 8, 9, 11, 10
        +---+---+---+---+`, caption: "Rows and columns in Gray code order. The four corners are neighbours because the map wraps round." },
      { t: "p", text: "There are two groups of four. The middle square (minterms 5, 7, 13, 15) has B = 1 and D = 1 throughout while A and C change, so it gives **BD**. The four corners (0, 2, 8, 10) have B = 0 and D = 0, giving **B'D'**. So F = BD + B'D', which is 1 when B equals D: an XNOR of B and D. Eight minterms of four literals each collapsed to one gate." },
      { t: "p", text: "Check: minterm 7 is 0111, B = 1 and D = 1, so F = 1. Minterm 6 is 0110, B = 1 and D = 0, so F = 0. Both match the map." },
      { t: "note", kind: "tip", text: "Cells for input combinations that can never occur are \"don't cares\", marked X. Include them in a group when that makes the group bigger, ignore them otherwise. A BCD to 7-segment decoder has six don't cares (inputs 10 to 15), which simplifies it a lot." },

      { t: "h", text: "Combinational building blocks" },
      { t: "p", text: "A **combinational** circuit's output depends only on its present inputs; it has no memory. Three blocks appear in every chip." },
      { t: "p", text: "A **multiplexer** (mux) selects one of several inputs onto one output, controlled by select lines. A 2-to-1 mux is Y = S'·I0 + S·I1. With n select lines it chooses between 2ⁿ inputs; the 74HC151 is an 8-to-1 mux, and the CD74HC4067 is a 16-channel analog mux often used to give one ADC pin sixteen sensors. Inside a microcontroller, the pin mux that decides whether a pin is GPIO, UART TX or PWM is exactly this." },
      { t: "p", text: "A **decoder** does the reverse job: n input bits activate exactly one of 2ⁿ outputs. The 74HC138 is a 3-to-8 decoder with active-low outputs, used to turn three address lines into eight chip selects. Each output is one minterm: output 5 is A2·A1'·A0, inverted." },
      { t: "p", text: "A **full adder** adds two bits A and B plus a carry in, giving a sum S and a carry out. Chain n of them, each carry out feeding the next carry in, and you have an n-bit **ripple-carry adder**, the core of an ALU." },
      { t: "formula", text: String.raw`S    = A ⊕ B ⊕ Cin
Cout = A·B + Cin·(A ⊕ B)`, caption: "Full adder. ⊕ is exclusive OR: 1 when an odd number of inputs are 1." },
      { t: "p", text: "Check one row: A = 1, B = 1, Cin = 1. S = 1 ⊕ 1 ⊕ 1 = 1, and Cout = 1·1 + 1·0 = 1. So 1 + 1 + 1 = binary 11 = 3. Correct." },
      { t: "p", text: "The catch with ripple carry is time: the top sum bit is not valid until the carry has rippled through every stage. If each stage takes 10 ns to pass a carry, a 32-bit ripple adder needs about 320 ns, far too slow for a CPU running at 240 MHz (a 4.2 ns cycle). Real ALUs use carry-lookahead, covered in the deep section." },

      { t: "deep", title: "Carry-lookahead: making addition fast", blocks: [
        { t: "p", text: "Define for each bit position a **generate** signal G = A·B (this stage makes a carry regardless of the incoming one) and a **propagate** signal P = A ⊕ B (this stage passes an incoming carry through). Then Cout = G + P·Cin. Unroll it for four bits:" },
        { t: "formula", text: String.raw`C1 = G0 + P0·C0
C2 = G1 + P1·G0 + P1·P0·C0
C3 = G2 + P2·G1 + P2·P1·G0 + P2·P1·P0·C0
C4 = G3 + P3·G2 + P3·P2·G1 + P3·P2·P1·G0 + P3·P2·P1·P0·C0` },
        { t: "p", text: "Every carry is now a two-level AND-OR expression of the inputs, so all four carries appear after about three gate delays instead of eight. The 74HC283 4-bit adder uses this internally. For 32 or 64 bits the idea is applied hierarchically (group generate and propagate), giving delay that grows with log n instead of n. That is why addition is a single-cycle instruction on any CPU." },
      ] },
      { t: "deep", title: "Why K-maps use Gray code, and where they stop", blocks: [
        { t: "p", text: "Grouping works because of the law XY + XY' = X: two minterms that differ in one variable merge and that variable vanishes. Gray code ordering guarantees that physically adjacent cells differ in one variable, so adjacency on paper equals mergeability in algebra. With binary order (00, 01, 10, 11), cells 01 and 10 sit side by side but differ in two bits and cannot merge." },
        { t: "p", text: "K-maps are practical up to about five or six variables. Beyond that, tools use the Quine-McCluskey tabular method or, in modern synthesis (Yosys, Vivado), heuristic minimisers like Espresso and BDD or AIG representations. You will never hand-minimise a 20-input function, but understanding a K-map tells you what the tool is doing and why don't cares save area." },
        { t: "p", text: "Gray code also matters outside K-maps: rotary encoders and FIFO pointers crossing clock domains use it because only one bit changes per step, so a sample taken mid-change is wrong by at most one count, never wildly wrong." },
      ] },
    ],
    mistakes: [
      "**Labelling K-map rows in binary order.** It must be 00, 01, 11, 10, otherwise neighbours are not neighbours and groups give wrong terms.",
      "**Making groups of three or six.** Groups must be 1, 2, 4, 8 or 16 cells in a rectangle. A group of three is two overlapping groups of two.",
      "**Forgetting the wrap-around.** The left and right edges are adjacent, as are top and bottom; the four corners can form one group.",
      "**Reading a signed byte as unsigned.** 0xFF is 255 as uint8_t but -1 as int8_t. Decide the type before you interpret a dump.",
      "**Ignoring active-low naming.** A pin marked with a bar or a trailing apostrophe is asserted at 0 V. Treating `OE'` as active high leaves the 74HC595 outputs floating.",
    ],
    practice: {
      kind: "bench",
      task: "Build a 2-to-1 multiplexer from gates and verify its truth table.",
      steps: [
        "Using a 74HC00 (quad NAND) on a breadboard powered from the Uno's 5 V, build Y = S'·I0 + S·I1 using only NAND gates (hint: by De Morgan, an AND-OR is a NAND-NAND). You need four gates: one as an inverter for S.",
        "Put a 100 nF capacitor across the chip's VCC (pin 14) and GND (pin 7). Tie any unused inputs to GND.",
        "Drive I0, I1 and S from D2, D3 and D4 on the Uno, and read Y on D5. Write a sketch that steps through all eight input combinations and prints a truth table over Serial.",
        "Compare the printed table with the one you derived by hand. Then measure Y with a multimeter for one high and one low case and note the actual voltages.",
      ],
    },
    quiz: [
      {
        q: "What is 0xC3 as a signed 8-bit (int8_t) value?",
        options: ["195", "-61", "-67", "61"],
        answer: 1,
        why: "0xC3 = 12 × 16 + 3 = 195 unsigned. As int8_t the top bit is worth -128, so the value is 195 - 256 = -61.",
      },
      {
        q: "A K-map group of four cells covers minterms where A and C change but B = 0 and D = 1 throughout. What term does it give?",
        options: ["A'C'", "AC", "B'D", "BD'"],
        answer: 2,
        why: "Variables that change inside a group drop out. B is always 0 (B') and D is always 1 (D), so the term is B'D.",
      },
      {
        q: "Using De Morgan's law, (A + B)' equals:",
        options: ["A' + B'", "A'·B'", "A·B", "(A·B)'"],
        answer: 1,
        why: "The complement of an OR is the AND of the complements. A NOR gate is an AND gate with inverted inputs.",
      },
      {
        q: "A full adder has A = 1, B = 0 and Cin = 1. What are S and Cout?",
        options: ["S = 0, Cout = 1", "S = 1, Cout = 0", "S = 1, Cout = 1", "S = 0, Cout = 0"],
        answer: 0,
        why: "S = 1 ⊕ 0 ⊕ 1 = 0. Cout = A·B + Cin·(A ⊕ B) = 0 + 1·1 = 1. 1 + 0 + 1 = binary 10.",
      },
      {
        q: "How many select lines does a mux need to choose between 16 inputs?",
        options: ["16", "8", "2", "4"],
        answer: 3,
        why: "n select lines choose between 2ⁿ inputs, and 2⁴ = 16.",
      },
      {
        q: "Why does a 32-bit ripple-carry adder become slow?",
        options: [
          "Each stage must wait for the carry from the stage below, so delay grows with the number of bits",
          "XOR gates are slower than AND gates",
          "It needs a clock for every bit",
          "Two's complement needs an extra subtraction step",
        ],
        answer: 0,
        why: "The top bit's sum is only valid after the carry has rippled through every lower stage, so the delay is roughly the number of bits times one stage's carry delay.",
      },
    ],
  },

  "i3-logic-families-and-level-shifting": {
    id: "i3-logic-families-and-level-shifting",
    outcomes: [
      "Read VIH, VIL, VOH and VOL from a datasheet and compute noise margins",
      "Decide whether one chip can drive another directly, including 3.3 V to 5 V",
      "Explain open-drain outputs, pull-ups and wired-AND buses",
      "Choose a level shifter (divider, BSS138, 74AHCT125, transceiver) for a given signal",
    ],
    blocks: [
      { t: "h", text: "Why logic levels go wrong in real projects" },
      { t: "p", text: "A logic 1 is not \"5 V\" and a 0 is not \"0 V\". Each is a range of voltages that one chip promises to produce and another promises to understand. Most mysterious failures when you join an ESP32 to a 5 V module, a sensor to an Uno, or a long cable to a button come from those ranges not overlapping. This lesson teaches you to read the four numbers that decide it, and what to do when they do not fit." },

      { t: "h", text: "The four threshold numbers" },
      { t: "list", items: [
        "**VOH (min)**: the lowest voltage a driver guarantees when outputting 1, at a stated output current.",
        "**VOL (max)**: the highest voltage a driver guarantees when outputting 0, at a stated current.",
        "**VIH (min)**: the lowest input voltage the receiver guarantees to read as 1.",
        "**VIL (max)**: the highest input voltage the receiver guarantees to read as 0.",
      ] },
      { t: "p", text: "Between VIL and VIH is the forbidden zone: the input may read either value, may oscillate, and draws extra supply current because both input transistors conduct. A connection is guaranteed to work only if the driver's worst case lands outside that zone, on the right side. The amount of spare voltage is the **noise margin**." },
      { t: "formula", text: String.raw`NMH = VOH(min) - VIH(min)     high-level noise margin
NML = VIL(max) - VOL(max)     low-level noise margin
Both must be positive. Bigger is better.` },

      { t: "h", text: "TTL and CMOS" },
      { t: "p", text: "**TTL** (transistor-transistor logic, the 74LS series and its relatives) uses bipolar transistors. Its thresholds are fixed by diode drops, not by supply: VIH = 2.0 V and VIL = 0.8 V. Its outputs are weak at pulling high (VOH about 2.7 V for 74LS). **CMOS** (the 74HC series and every modern microcontroller) uses complementary MOSFETs. Its thresholds scale with the supply, roughly 30% and 70% of VCC, and its outputs swing almost rail to rail when lightly loaded." },
      { t: "table", head: ["Parameter", "74LS (TTL), 5 V", "74HC (CMOS), VCC = 4.5 V", "74HCT, 4.5 V"], rows: [
        ["VIH min", "2.0 V", "3.15 V", "2.0 V"],
        ["VIL max", "0.8 V", "1.35 V", "0.8 V"],
        ["VOH min", "2.7 V (0.4 mA)", "4.4 V (20 µA), 3.98 V (6 mA)", "about the same as HC"],
        ["VOL max", "0.5 V (8 mA)", "0.1 V (20 µA), 0.26 V (6 mA)", "about the same as HC"],
        ["Input current", "-0.4 mA low", "±1 µA", "±1 µA"],
      ], caption: "74HC figures from the TI SN74HC595 datasheet at 25 °C. 74HCT is CMOS with TTL-compatible input thresholds." },
      { t: "p", text: "Worked example, 74HC driving 74HC at 4.5 V with a 6 mA load: NMH = 3.98 - 3.15 = 0.83 V and NML = 1.35 - 0.26 = 1.09 V. With a light load (20 µA): NMH = 4.4 - 3.15 = 1.25 V and NML = 1.35 - 0.1 = 1.25 V. Large margins, which is why CMOS logic is robust on a breadboard." },
      { t: "p", text: "Now a 74HC output (CMOS) driving a 74LS input: VOH 3.98 V is well above 2.0 V and VOL 0.26 V is below 0.8 V. Fine. The other way round, 74LS driving 74HC: VOH = 2.7 V is below VIH = 3.15 V. **It does not work reliably.** That is exactly why 74HCT exists: CMOS outputs with TTL input thresholds, made to accept TTL-level highs." },

      { t: "h", text: "The case that matters most: ESP32 and Uno" },
      { t: "p", text: "The ATmega328P on the Uno at VCC = 5 V has VIH = 0.6 × VCC = 3.0 V and VIL = 0.3 × VCC = 1.5 V. The ESP32 datasheet gives VOH min = 0.8 × VDD = 2.64 V at 3.3 V supply. So NMH = 2.64 - 3.0 = -0.36 V. Negative: an ESP32 output is **not guaranteed** to read as high on an Uno input. In practice an unloaded ESP32 pin sits close to 3.3 V and it usually works, with only 0.3 V of margin. Usually is not a design. Use a level shifter, or a 74HCT part, which reads anything above 2.0 V as high." },
      { t: "p", text: "The other direction is worse. A 5 V Uno output into an ESP32 pin exceeds the ESP32's absolute maximum input (VDD + 0.3 V = 3.6 V). Current flows through the pin's internal protection diode into the 3.3 V rail. It may survive for a while and it may not." },
      { t: "note", kind: "safety", text: "Never connect a 5 V output directly to an ESP32 GPIO. Use a divider, a BSS138 shifter or a 3.3 V-powered buffer. This includes the TX line of 5 V GPS modules, ultrasonic sensor echo pins and 5 V Arduino boards." },

      { t: "h", text: "Fan-out" },
      { t: "p", text: "**Fan-out** is how many inputs one output can drive while still meeting its VOH and VOL. For TTL it is a DC current limit: a 74LS output sinks 8 mA at VOL, and each 74LS input sources 0.4 mA when low, so fan-out = 8 / 0.4 = 20. For CMOS the DC input current is about 1 µA, so DC fan-out is in the thousands; the real limit is **capacitance**. Each 74HC input is up to 10 pF, and every extra picofarad slows the edges. Ten inputs plus 20 pF of wiring is 120 pF, and edge times grow accordingly; the datasheet's propagation delay rises from 30 ns max at 50 pF to 40 ns max at 150 pF (SN74HC595, RCLK to outputs, 4.5 V)." },

      { t: "h", text: "Push-pull, open-drain and pull-ups" },
      { t: "p", text: "A normal (**push-pull**) output has a transistor to VCC and one to GND, and actively drives both levels. Join two push-pull outputs and let one drive high while the other drives low, and you short the supply through two transistors. An **open-drain** (open-collector, in bipolar) output has only the bottom transistor: it can pull the line low or let go. A **pull-up resistor** makes the line high when nobody pulls it low." },
      { t: "diagram", text: String.raw`        VCC
         │
       [ Rp ]  pull-up
         │
  ───────●──────────●──────────●───── shared line (reads A AND B AND C)
         │          │          │
       ┌─┴─┐      ┌─┴─┐      ┌─┴─┐
       │ A │      │ B │      │ C │   open-drain: pull low or release
       └─┬─┘      └─┬─┘      └─┬─┘
         │          │          │
  GND ───┴──────────┴──────────┘`, caption: "Wired-AND: the line is high only if every device releases it. Any one can pull it low safely." },
      { t: "p", text: "Open-drain gives three gifts. Several devices can share one wire safely (I²C, interrupt lines, 1-Wire). The pull-up can go to a different voltage from the driver's supply, which is a free level shift as long as the driver's pin tolerates that voltage. And the line implements a logical AND for free. The cost is a slow rising edge: the pull-up charges the line capacitance with time constant τ = Rp × C. With Rp = 4.7 kΩ and 100 pF, τ = 470 ns, and the 30% to 70% rise time is τ × ln(0.7 / 0.3) ≈ 0.85 τ ≈ 400 ns. That is the figure to check against the bus specification: standard-mode I²C allows 1000 ns, fast mode 300 ns." },
      { t: "p", text: "On the ESP32 you can make any output pin open-drain in software (`pinMode(pin, OUTPUT_OPEN_DRAIN)` in the Arduino core). The ATmega328P has no open-drain mode, but you get the same effect by writing the pin low and switching it between OUTPUT (pull low) and INPUT (release)." },

      { t: "h", text: "Level shifting: four tools" },
      { t: "table", head: ["Method", "Direction", "Speed", "Use for"], rows: [
        ["Resistor divider (e.g. 1 kΩ over 2 kΩ)", "5 V to 3.3 V only", "Fine to about 1 MHz", "UART RX into ESP32, echo pins"],
        ["BSS138 MOSFET with two pull-ups", "Bidirectional", "Up to about 400 kHz", "I²C, open-drain lines"],
        ["74AHCT125 powered from 5 V", "3.3 V to 5 V only", "Tens of MHz", "WS2812 LED data, fast SPI to 5 V parts"],
        ["Direction-controlled transceiver (74LVC245, TXB0108)", "Set by pin, or auto", "Tens of MHz", "Parallel buses, mixed SPI"],
      ] },
      { t: "p", text: "**Divider** check: 5 V × 2 / (1 + 2) = 3.33 V into the ESP32. The ESP32 VIH is 0.75 × 3.3 = 2.475 V, so the margin is 0.86 V. The divider draws 5 / 3 kΩ = 1.67 mA when high, fine for a GPIO. Bigger resistors save current but round the edges, because the pin capacitance charges through the 667 Ω Thevenin resistance (1 kΩ parallel 2 kΩ)." },
      { t: "p", text: "**BSS138 shifter**: the MOSFET gate goes to 3.3 V, source to the 3.3 V side with a pull-up to 3.3 V, drain to the 5 V side with a pull-up to 5 V. When the 3.3 V side pulls low, VGS = 3.3 V, the FET turns on and pulls the 5 V side low too. When the 5 V side pulls low, the FET's body diode pulls the source down until VGS exceeds the threshold (0.8 to 1.5 V for the BSS138), then the channel conducts. When nobody pulls low, the FET is off and each side rises to its own rail. It works only for open-drain style signals and its speed is limited by the pull-ups." },
      { t: "p", text: "**74AHCT125**: a quad buffer with TTL-level inputs. Power it from 5 V: a 3.3 V input is above its VIH of 2.0 V, and its outputs swing to 5 V. It is the standard part for driving 5 V WS2812 LED strips from an ESP32." },

      { t: "deep", title: "Inside a CMOS inverter: where VIH and VIL come from", blocks: [
        { t: "p", text: "A CMOS inverter is a P-channel MOSFET from VDD to the output and an N-channel from the output to GND, gates joined as the input. With the input near 0 V the P-FET is on and the N-FET off; near VDD the reverse. In between, both are partly on and a through current flows. The transfer curve (Vout against Vin) is steep near VDD/2, and the datasheet's VIL and VIH are chosen on the flat parts of it, with allowance for temperature and process spread. That is why CMOS thresholds are a fraction of VDD." },
        { t: "p", text: "Two practical consequences. First, an input left floating drifts into the middle and both transistors conduct, raising supply current and sometimes oscillating: tie unused CMOS inputs to VCC or GND, as the TI datasheet insists. Second, a slow input edge spends a long time in the middle region; the SN74HC595 datasheet warns that inputs dwelling in the threshold region can cause double clocking. Clock inputs need clean edges; feed slow signals through a Schmitt-trigger part such as the 74HC14." },
      ] },
      { t: "deep", title: "Auto-direction translators and their traps", blocks: [
        { t: "p", text: "The TXB0108 senses which side is driving using one-shot edge accelerators and weak internal resistors. It is convenient for push-pull SPI or UART but fails with I²C or anything with strong pull-ups, because the pull-up overpowers its weak driver and it cannot tell who is driving. The TXS0108E is the open-drain friendly cousin, with built-in pull-ups. The rule: BSS138 or TXS for open-drain buses, TXB or a direction-pin transceiver such as the 74LVC245 for push-pull buses, and a single-direction buffer whenever direction is fixed." },
        { t: "p", text: "Bus transceivers like the 74HC245 also add drive strength: they can push tens of milliamps into a long ribbon cable, where a microcontroller pin would give slow, ringing edges. On a long cable, a 22 to 33 Ω series resistor at the driver damps reflections." },
      ] },
    ],
    mistakes: [
      "**Assuming 3.3 V is always a valid high for a 5 V chip.** Check VIH: 74HC at 5 V needs 3.5 V; ATmega328P needs 3.0 V; only TTL-input parts (HCT, AHCT) accept 2.0 V.",
      "**Using a divider for a bidirectional line.** A divider shifts only one way. I²C needs a BSS138-style shifter.",
      "**Using a TXB0108 on I²C.** It cannot work with pull-ups. Use a BSS138 board or a TXS0108E.",
      "**Leaving CMOS inputs floating.** An unused input on a 74HC chip must be tied to VCC or GND.",
      "**Shorting two push-pull outputs together.** Only open-drain outputs can share a line.",
      "**Choosing huge pull-ups to save power on a fast bus.** The rise time grows with R × C and the bus fails at speed.",
    ],
    practice: {
      kind: "bench",
      task: "Measure real thresholds and noise margins.",
      steps: [
        "Power a 74HC14 (hex Schmitt inverter) or 74HC04 from the Uno's 5 V, with a 100 nF bypass capacitor. Tie unused inputs to GND.",
        "Feed one input from a 10 kΩ potentiometer between 5 V and GND. Watch the output with a multimeter while slowly turning the pot. Record the input voltage where the output switches, going up and going down.",
        "Compare with VIH and VIL from the datasheet. With the 74HC14 you will see two different switching points (hysteresis).",
        "Load an output with 1 kΩ to GND (about 5 mA when high) and measure VOH. Compute NMH against a 74HC input at 5 V.",
        "Build a 1 kΩ over 2 kΩ divider from a 5 V Uno output (D7) and measure the 3.3 V-side voltage. Do not connect it to an ESP32 until you have measured it.",
      ],
    },
    quiz: [
      {
        q: "A driver has VOH(min) = 2.4 V and VOL(max) = 0.4 V. A receiver has VIH(min) = 2.0 V and VIL(max) = 0.8 V. What are the noise margins?",
        options: ["NMH = 0.4 V, NML = 0.4 V", "NMH = 2.0 V, NML = 0.4 V", "NMH = 0.4 V, NML = 1.2 V", "NMH = -0.4 V, NML = 0.4 V"],
        answer: 0,
        why: "NMH = VOH - VIH = 2.4 - 2.0 = 0.4 V. NML = VIL - VOL = 0.8 - 0.4 = 0.4 V.",
      },
      {
        q: "Why is an ESP32 output not guaranteed to be read as high by an Uno's ATmega328P running at 5 V?",
        options: [
          "The ESP32 output current is too low",
          "The ESP32's guaranteed VOH (2.64 V) is below the ATmega's VIH (3.0 V)",
          "The ATmega's VIL is above 3.3 V",
          "The two boards have different grounds",
        ],
        answer: 1,
        why: "VOH min of the ESP32 is 0.8 × 3.3 = 2.64 V. The ATmega needs 0.6 × 5 = 3.0 V. The high-level noise margin is negative.",
      },
      {
        q: "Which part is the right choice to drive a 5 V WS2812 LED strip data line from an ESP32?",
        options: ["A 1 kΩ / 2 kΩ divider", "A BSS138 shifter with 10 kΩ pull-ups", "A 74HC125 powered from 5 V", "A 74AHCT125 powered from 5 V"],
        answer: 3,
        why: "The direction is fixed and the signal is fast (800 kHz with tight timing). The AHCT part's TTL inputs read 3.3 V as high and it drives 5 V outputs. A 74HC at 5 V needs 3.5 V in; a divider only shifts down.",
      },
      {
        q: "What makes open-drain outputs safe to connect together on one wire?",
        options: [
          "They can only pull the line low, and a resistor pulls it high, so no output ever fights another driving high",
          "They have current limiting built in",
          "They take turns using a clock",
          "They run at a lower voltage",
        ],
        answer: 0,
        why: "No device drives high, so there is never a high-versus-low short. The line is low if any device pulls it low, a wired-AND.",
      },
      {
        q: "A 74LS output can sink 8 mA at VOL and each 74LS input sources 0.4 mA when low. What is the fan-out?",
        options: ["8", "20", "32", "400"],
        answer: 1,
        why: "Fan-out = 8 mA / 0.4 mA = 20 inputs.",
      },
      {
        q: "A 1 kΩ (top) and 2 kΩ (bottom) divider is fed from a 5 V output. What voltage reaches the 3.3 V input?",
        options: ["2.5 V", "1.67 V", "3.33 V", "5 V"],
        answer: 2,
        why: "5 × 2 / (1 + 2) = 3.33 V, below the ESP32's 3.6 V limit and well above its VIH of about 2.48 V.",
      },
    ],
  },

  "i3-flip-flops-timing-and-memory": {
    id: "i3-flip-flops-timing-and-memory",
    outcomes: [
      "Explain how an SR latch, a D latch and an edge-triggered D flip-flop store a bit",
      "Build counters and shift registers from flip-flops and predict their outputs",
      "Use setup time, hold time and propagation delay to find a circuit's maximum clock",
      "Explain metastability and why a two-flip-flop synchroniser fixes it",
      "Compare flash, EEPROM and SRAM and pick the right one for data in firmware",
    ],
    blocks: [
      { t: "h", text: "Why memory elements matter" },
      { t: "p", text: "Combinational logic forgets: take away the input and the output is gone. Anything that counts, waits, remembers a setting or moves data in step needs **sequential** logic, built from elements that store a bit. A microcontroller's registers, timers, UART shift registers and even its SRAM are all built from the latches and flip-flops in this lesson, and their timing rules are the reason a datasheet lists setup times and maximum clock frequencies." },

      { t: "h", text: "The SR latch" },
      { t: "p", text: "Cross-couple two NOR gates, each output feeding the other's input, and you get a circuit with two stable states. Pulse S (set) high and Q goes to 1 and stays there after S returns low. Pulse R (reset) and Q goes to 0 and stays. With S = R = 0 the latch holds. S = R = 1 is forbidden: both outputs go low, and when both inputs release together the final state is a race. This feedback loop is the essence of every memory element." },
      { t: "table", head: ["S", "R", "Q next", "Meaning"], rows: [
        ["0", "0", "Q", "Hold"],
        ["1", "0", "1", "Set"],
        ["0", "1", "0", "Reset"],
        ["1", "1", "invalid", "Forbidden"],
      ] },

      { t: "h", text: "D latch and D flip-flop" },
      { t: "p", text: "A **D latch** adds gating so that the forbidden state cannot occur: while the enable input E is high the latch is **transparent** (Q follows D), and when E falls it holds the last value. Transparency is a problem when you chain stages, because data can run straight through several latches during one enable pulse." },
      { t: "p", text: "An **edge-triggered D flip-flop** fixes this. It is two latches in series (master and slave) with opposite enables. On the rising clock edge the master closes and the slave opens, so Q takes the value D had at that instant and nothing else. Between edges D can do anything. This is the behaviour of every register in your microcontroller." },
      { t: "diagram", text: String.raw`CLK  ___┌───┐___┌───┐___┌───┐___┌───┐___
           ↑       ↑       ↑       ↑
D    ______┌───────────┐___________┌────
Q    ________┌───────────────┐_______┌──
             sampled 1 at each ↑   sampled 0, then 1`, caption: "Q changes only just after rising edges, copying D as it was at the edge." },
      { t: "p", text: "Other types: a **JK flip-flop** is like SR but J = K = 1 toggles instead of being forbidden; a **T flip-flop** toggles on every clock when T = 1. Both are easy to make from a D flip-flop with a gate in front, which is what modern logic does. Most flip-flops also have asynchronous set and clear (preset and reset) inputs that act immediately, without waiting for a clock edge." },

      { t: "h", text: "Counters" },
      { t: "p", text: "A T flip-flop toggling on every edge divides the clock frequency by 2. Chain four of them, each clocked by the previous output, and you have a 4-bit **ripple counter** that counts 0 to 15 and divides by 16. It is cheap but each stage adds its delay, so the outputs do not change together: going from 0111 to 1000 the counter briefly shows 0110, 0100, 0000. Decode those outputs with gates and you get glitches." },
      { t: "p", text: "A **synchronous counter** clocks every flip-flop from the same clock and uses gates to decide which bits toggle: bit n toggles when all lower bits are 1. All outputs change together after one flip-flop delay. The 74HC161 is a synchronous 4-bit counter; the timers inside the ATmega328P and ESP32 are synchronous counters of 8, 16 or 64 bits, with a comparator on the side." },
      { t: "p", text: "Check: Timer1 on the Uno is a 16-bit counter. Clocked at 16 MHz with a prescaler of 256 it counts at 62.5 kHz, so it overflows every 65536 / 62500 ≈ 1.049 s." },

      { t: "h", text: "Shift registers" },
      { t: "p", text: "Connect D flip-flops in a chain, each Q to the next D, all on one clock, and every clock edge moves the data one place along. That is a **shift register**. Serial-in, parallel-out (SIPO) turns a stream of bits on one wire into eight parallel outputs: this is how the 74HC595 gives the Uno eight extra outputs from three pins. Parallel-in, serial-out (PISO), such as the 74HC165, does the reverse for inputs. The UART and SPI peripherals in your microcontroller are shift registers too. The next lesson works through the 74HC595 in detail." },

      { t: "h", text: "Timing: setup, hold and propagation delay" },
      { t: "p", text: "A flip-flop needs D to be steady for a short time **before** the clock edge (the **setup time**, tsu) and for a time **after** it (the **hold time**, th). After the edge, Q takes the **propagation delay** (tpd, also called clock-to-Q) to settle. For the SN74HC595 at 4.5 V and 25 °C, the TI datasheet gives tsu = 20 ns for SER before SRCLK, th = 0 ns, a clock pulse width of at least 16 ns, and tpd from SRCLK to QH' of 17 ns typical, 32 ns max." },
      { t: "diagram", text: String.raw`             │◄─ tsu ─►│◄ th ►│
D     XXXXXXXX─────────────────────XXXXXXX   must be stable here
CLK   _____________________┌───────────
                           ↑ edge
Q     ─────────────────────│◄ tpd ►│XXXX new value`, caption: "The data window around each edge, and the delay before the output is valid." },
      { t: "p", text: "In a synchronous circuit, one flip-flop's output passes through some logic to the next flip-flop's input. For the next flip-flop to capture it, the signal must arrive at least tsu before the next edge:" },
      { t: "formula", text: String.raw`T_clk ≥ tpd(FF) + tpd(logic) + tsu
f_max  = 1 / T_clk(min)`, caption: "The critical path sets the maximum clock frequency." },
      { t: "p", text: "Worked example: two 74HC595 stages chained (QH' of the first into SER of the second) at 4.5 V. Worst case: tpd = 32 ns, no logic in between, tsu = 20 ns. T_clk ≥ 32 + 0 + 20 = 52 ns, so f_max = 1 / 52 ns ≈ 19 MHz. The datasheet's own figure for fclock max at 4.5 V is 31 MHz at 25 °C (21 MHz over the full temperature range), which uses typical rather than stacked worst-case delays. Either way, the Uno's `shiftOut()` at well under 1 MHz is nowhere near the limit." },
      { t: "p", text: "Hold time is checked the other way: the new data must not reach the next stage too soon after the edge. Since the 74HC595's hold time is 0 ns and its own tpd is at least several nanoseconds, chaining is safe." },

      { t: "h", text: "Metastability" },
      { t: "p", text: "What if D changes inside the setup and hold window? The flip-flop's feedback loop can be left balanced on the edge, like a ball on a hilltop, with Q sitting at an in-between voltage for an unpredictable time before falling to 0 or 1. This is **metastability**. It is not a design fault you can remove; it is physics, and any signal not synchronised to your clock (a button, a sensor's data-ready line, a signal from another chip's clock) will eventually change inside the window." },
      { t: "p", text: "The fix is a **two-flip-flop synchroniser**: feed the asynchronous signal into one flip-flop, and its output into a second, both on your clock. The first may go metastable, but it has a whole clock period to resolve before the second samples it, and the chance of still being undecided after a full period is astronomically small. Your microcontroller already does this on every GPIO input: the ATmega328P datasheet shows a synchroniser latch and flip-flop on each pin, which is why a pin change appears in the PIN register between half and one and a half clock cycles late." },

      { t: "h", text: "Memory types" },
      { t: "table", head: ["Type", "Keeps data unpowered", "Write", "Endurance", "Uno (ATmega328P)", "ESP32"], rows: [
        ["SRAM", "No", "Byte, fast, unlimited", "Unlimited", "2 KB", "520 KB on chip"],
        ["Flash", "Yes", "Erase by page or sector, then program", "10,000 cycles (AVR)", "32 KB, holds your program", "External SPI flash, usually 4 MB"],
        ["EEPROM", "Yes", "Byte, about 3.3 ms each", "100,000 cycles", "1 KB", "None; emulated in flash (NVS, Preferences)"],
      ] },
      { t: "p", text: "**SRAM** stores each bit in a six-transistor cross-coupled latch, the same feedback idea as the SR latch. It is fast and loses everything at power-off: your variables live here. **Flash** stores charge on a floating gate. It is dense and permanent but must be erased in blocks (4 KB sectors on the ESP32's SPI flash) before rewriting, and each block wears out after a limited number of erases. **EEPROM** is the same floating-gate idea with byte-level erase, so it suits settings that change occasionally." },
      { t: "p", text: "The endurance numbers drive design. Write a reading to the Uno's EEPROM once a second and a 100,000-cycle cell is worn out in 100,000 s, about 28 hours. Write it once an hour and it lasts about 11 years. Store settings when they change, not on a timer, and on the ESP32 use the Preferences library, which spreads writes across flash sectors (wear levelling)." },

      { t: "deep", title: "Calculating metastability MTBF", blocks: [
        { t: "p", text: "The standard model gives the mean time between synchroniser failures as:" },
        { t: "formula", text: String.raw`MTBF = e^(t_r / τ) / (T0 · f_clk · f_data)

t_r   = time allowed for resolution (about one clock period minus tsu)
τ, T0 = constants of the flip-flop technology
f_clk = sampling clock,  f_data = rate of changes on the input` },
        { t: "p", text: "Illustrative numbers (not from a specific datasheet): τ = 0.3 ns, T0 = 1 ns, f_clk = 16 MHz, f_data = 1 kHz, and t_r = 10 ns. Then e^(10/0.3) = e^33.3 ≈ 3.0 × 10¹⁴, and the denominator is 1e-9 × 16e6 × 1e3 = 16, so MTBF ≈ 1.9 × 10¹³ s, about 600,000 years. Halve t_r to 5 ns and the exponent falls to 16.7: MTBF ≈ 1.1 × 10⁶ s, about 12.5 days. The exponential is why one extra flip-flop stage, which adds a whole clock period of t_r, turns a frequent failure into a practically impossible one." },
        { t: "p", text: "FPGA vendors publish τ and T0 for their flip-flops and their timing tools report synchroniser MTBF. In firmware, the lesson is simpler: never let two pieces of logic sample the same asynchronous input separately, because they can disagree. Read the pin once into a variable and use that copy." },
      ] },
      { t: "deep", title: "Inside flash and EEPROM cells", blocks: [
        { t: "p", text: "A floating-gate cell is a MOSFET with an extra gate surrounded by oxide. Charge trapped on it shifts the threshold voltage, so the transistor reads as 0 or 1. Programming pushes electrons through the thin oxide by hot-electron injection or Fowler-Nordheim tunnelling at 10 to 20 V generated by an on-chip charge pump; erasing pulls them back. Every cycle damages the oxide slightly, which sets endurance, and charge slowly leaks, which sets data retention (the ATmega328P datasheet quotes 20 years at 85 °C)." },
        { t: "p", text: "NOR flash, used for program memory, allows random reads of any byte, so the CPU can execute code straight from it. NAND flash, used in SD cards, is denser but reads in pages, so it needs a controller and is never executed in place. The ESP32 executes from external NOR flash through a cache, which is why functions that run during flash writes or in fast interrupts must be placed in internal RAM with the `IRAM_ATTR` attribute." },
      ] },
    ],
    mistakes: [
      "**Using a level-sensitive latch where an edge-triggered flip-flop is needed.** A transparent latch lets data race through a chain while enabled.",
      "**Decoding a ripple counter's outputs.** Its bits change at different times and the decoder glitches. Use a synchronous counter.",
      "**Sampling an asynchronous input in two places.** Two reads can disagree. Read once, use the copy.",
      "**Writing EEPROM or flash in a fast loop.** 100,000 cycles is gone in about a day at once per second.",
      "**Adding worst-case and typical numbers from different columns.** Use one consistent set of datasheet conditions (voltage, temperature, load) for a timing budget.",
    ],
    practice: {
      kind: "bench",
      task: "Build a divide-by-4 counter from D flip-flops and see edge triggering.",
      steps: [
        "Use a 74HC74 (dual D flip-flop) powered from the Uno's 5 V, with a 100 nF bypass capacitor. Tie both PRE' and CLR' inputs high.",
        "Wire each flip-flop as a toggle: connect its Q' output back to its own D. Clock the first from D8 on the Uno, and clock the second from the first's Q' (clocking it from Q would make the pair count down).",
        "Write a sketch that pulses D8 once per second and prints the two Q outputs (read on D2 and D3) after each pulse. Confirm the count 00, 01, 10, 11 (as Q2 Q1).",
        "Replace the sketch's clock with a push button through a 10 kΩ pull-up directly on the clock pin. Press it a few times and note any jumps of more than one count: that is switch bounce, which is why clock inputs need clean edges.",
      ],
    },
    quiz: [
      {
        q: "A flip-flop has tpd = 15 ns and tsu = 10 ns, with 25 ns of logic between two flip-flops. What is the maximum clock frequency?",
        options: ["20 MHz", "40 MHz", "50 MHz", "100 MHz"],
        answer: 0,
        why: "T_clk ≥ 15 + 25 + 10 = 50 ns, so f_max = 1 / 50 ns = 20 MHz.",
      },
      {
        q: "What is the key difference between a D latch and an edge-triggered D flip-flop?",
        options: [
          "The latch has no clock input",
          "The latch is transparent while enabled; the flip-flop captures D only at the clock edge",
          "The flip-flop cannot hold data",
          "The latch is faster at every frequency",
        ],
        answer: 1,
        why: "While E is high a latch passes D straight through. A flip-flop's master-slave structure samples D only at the edge.",
      },
      {
        q: "A settings value is written to a 100,000-cycle EEPROM cell once every 10 seconds. Roughly how long until that cell wears out?",
        options: ["About 1 day", "About 1 year", "About 28 hours", "About 12 days"],
        answer: 3,
        why: "100,000 × 10 s = 1,000,000 s, about 11.6 days.",
      },
      {
        q: "Why does a two-flip-flop synchroniser reduce metastability failures so much?",
        options: [
          "The second flip-flop is faster",
          "It removes the setup and hold window",
          "The first flip-flop gets a whole clock period to resolve before the second samples it",
          "It filters out switch bounce",
        ],
        answer: 2,
        why: "The probability of still being metastable falls exponentially with time, so a full clock period of resolution time makes failure extremely unlikely.",
      },
      {
        q: "Where do your program's global variables live on an Uno while it runs?",
        options: ["In SRAM", "In flash", "In EEPROM", "In the shift register"],
        answer: 0,
        why: "Variables need fast, unlimited writes, so they live in the 2 KB of SRAM. Their initial values are copied there from flash at start-up.",
      },
    ],
  },

  "i3-shift-registers-and-multiplexed-display": {
    id: "i3-shift-registers-and-multiplexed-display",
    outcomes: [
      "Explain the 74HC595's two registers and what SER, SRCLK, RCLK, OE' and SRCLR' do",
      "Draw the timing diagram for loading a byte into a 74HC595",
      "Calculate LED currents within the 74HC595's absolute maximum ratings",
      "Design and code a four-digit multiplexed 7-segment display on the Uno",
    ],
    blocks: [
      { t: "h", text: "Why shift registers are worth mastering" },
      { t: "p", text: "The Uno has 20 usable I/O pins and a four-digit display alone needs 12. Shift registers trade pins for time: three wires carry any number of outputs, one bit at a time. The same idea drives LED matrices, relay boards and the SPI bus. The 74HC595 is the standard part, and working through it ties together everything in this module: flip-flops, setup and hold, logic levels and current limits." },

      { t: "h", text: "Inside the 74HC595" },
      { t: "diagram", text: String.raw`             ┌──────────────── shift register ────────────────┐
SER  ───────►│ D0 → D1 → D2 → D3 → D4 → D5 → D6 → D7           │──► QH' (to next chip's SER)
SRCLK ──────►│ clocked on rising edge                          │
SRCLR' ─────►│ clears all 8 bits when low                      │
             └───┬────┬────┬────┬────┬────┬────┬────┬──────────┘
                 ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
             ┌──────────── storage (latch) register ───────────┐
RCLK  ──────►│ copies all 8 bits on rising edge                │
             └───┬────┬────┬────┬────┬────┬────┬────┬──────────┘
OE'   ──────► 3-state output buffers (enabled when OE' low)
                 QA   QB   QC   QD   QE   QF   QG   QH`, caption: "Two banks of eight D flip-flops. Shifting does not disturb the outputs until RCLK." },
      { t: "table", head: ["Pin", "Name", "Function", "Typical connection"], rows: [
        ["14", "SER", "Serial data in", "D2 on the Uno"],
        ["11", "SRCLK", "Shift clock, rising edge", "D3 on the Uno"],
        ["12", "RCLK", "Latch clock, rising edge", "D4 on the Uno"],
        ["13", "OE'", "Output enable, active low", "GND (or a PWM pin for dimming)"],
        ["10", "SRCLR'", "Clear shift register, active low", "5 V"],
        ["9", "QH'", "Serial out for chaining", "Next chip's SER"],
        ["15, 1 to 7", "QA to QH", "Parallel outputs", "Loads via resistors"],
        ["16, 8", "VCC, GND", "Supply 2 to 6 V", "5 V, GND, 100 nF across them"],
      ] },
      { t: "p", text: "The double register is the clever part. You clock eight new bits through the shift register while the outputs keep showing the old byte, then one RCLK edge updates all eight outputs at once. Without it, the outputs would ripple through intermediate patterns during every update and LEDs would flicker." },

      { t: "h", text: "Loading a byte: the timing diagram" },
      { t: "p", text: "To send 0b10110010 most significant bit first: for each bit, set SER, then pulse SRCLK high and low. After eight pulses, pulse RCLK. The first bit sent ends up in QH, the last in QA." },
      { t: "diagram", text: String.raw`bit sent    1     0     1     1     0     0     1     0
SER     ‾‾‾‾‾‾|_____|‾‾‾‾‾‾‾‾‾‾‾|___________|‾‾‾‾‾|_____
SRCLK   __|‾|___|‾|___|‾|___|‾|___|‾|___|‾|___|‾|___|‾|________
            ↑     ↑     ↑     ↑     ↑     ↑     ↑     ↑
RCLK    ______________________________________________|‾|___
                                                      ↑ outputs update
QA..QH  ==== old byte ================================X= 1011 0010 =
              (QH = 1, QG = 0, QF = 1, QE = 1, QD = 0, QC = 0, QB = 1, QA = 0)`, caption: "SER must be stable at least tsu (20 ns at 4.5 V) before each SRCLK rising edge. Hold time is 0 ns." },
      { t: "p", text: "At Uno speeds you cannot violate these timings: one `digitalWrite()` takes about 4 µs, two hundred times longer than the 20 ns setup time. If you later drive the 595 from hardware SPI at 8 MHz, the clock period is 125 ns and SPI changes data on the opposite edge to the one it samples on (mode 0), giving about 62 ns of setup. Still comfortable." },

      { t: "h", text: "Current limits" },
      { t: "p", text: "The SN74HC595 absolute maximum ratings are ±35 mA per output and ±70 mA through VCC or GND in total. The second figure is the one that bites. Eight LEDs at 9 mA each would be 72 mA through one supply pin." },
      { t: "p", text: "Worked example: red LEDs (forward voltage about 2.0 V) with 470 Ω resistors from a 5 V supply. Ignoring the output's own drop, I = (5 - 2.0) / 470 = 6.4 mA. Eight segments lit is 8 × 6.4 = 51 mA, under 70 mA. Check against the output spec: at 6 mA the datasheet guarantees VOH ≥ 3.98 V at 4.5 V supply, so the output loses up to about 0.5 V and the real current is a little lower, about 5.3 mA. Bright enough for an indoor display, and inside every rating." },
      { t: "note", kind: "warn", text: "A 7-segment digit's common pin carries the sum of all its lit segments (up to 8 × 6.4 = 51 mA here). That is above the 20 mA you should draw from an Uno pin (40 mA is the absolute maximum). Switch each digit's common through a transistor." },

      { t: "h", text: "Multiplexing four digits" },
      { t: "p", text: "A four-digit display has 8 segment lines shared by all digits plus 4 common lines, one per digit. **Multiplexing** lights one digit at a time: put digit 0's pattern on the segments, turn on digit 0's common, wait, turn it off, move to digit 1, and so on. Cycle fast enough and persistence of vision makes all four look steadily lit. Each digit is lit for 1/4 of the time, so it looks a quarter as bright as a static LED at the same current." },
      { t: "p", text: "Timing: show each digit for 2 ms. A full cycle is 4 × 2 = 8 ms, so the refresh rate is 1 / 8 ms = 125 Hz, well above the roughly 60 Hz where flicker becomes visible. Below about 50 Hz, the display flickers, especially in peripheral vision." },
      { t: "diagram", text: String.raw`            Uno                 74HC595               4-digit display
                                                       (common cathode)
   D2 SER   ─────────────────► 14 SER     QA..QG,QH ──[470R]x8──► segments a..g, dp
   D3 SRCLK ─────────────────► 11 SRCLK
   D4 RCLK  ─────────────────► 12 RCLK
            GND ─────────────► 13 OE'
            5 V ─────────────► 10 SRCLR'
   D5..D8 ──[1k]──► base  NPN (BC547 or 2N2222), emitter GND, collector ──► digit common 1..4`, caption: "Segments from the 595 (sourcing current), digit commons sunk by NPN transistors." },
      { t: "p", text: "Base resistor check: a 1 kΩ from a 5 V pin gives about (5 - 0.7) / 1000 = 4.3 mA of base current. To saturate the transistor with 51 mA of collector current you want a forced beta of about 10 to 20, so 2.6 to 5 mA of base current. 4.3 mA is in range, and the Uno pin is well under its 20 mA guideline." },
      { t: "p", text: "The complete program for a common-cathode display. Segment bit order: bit 0 = a through bit 6 = g, bit 7 = dp, matching QA to QH. A '1' lights a segment." },
      { t: "snippet", lang: "cpp", code: String.raw`// Four-digit multiplexed 7-segment display via one 74HC595.
// Board: Arduino Uno. Common-cathode display, digit commons switched by NPN transistors.
const uint8_t PIN_SER = 2, PIN_SRCLK = 3, PIN_RCLK = 4;
const uint8_t DIGIT_PINS[4] = {5, 6, 7, 8};   // HIGH turns a digit's transistor on

// Segment patterns for 0 to 9: bit0 = a ... bit6 = g, bit7 = dp
const uint8_t FONT[10] = {
  0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F
};

uint8_t digits[4];          // pattern currently shown on each digit
uint8_t current = 0;        // which digit is lit now
unsigned long lastSwitch = 0;
const unsigned long DIGIT_US = 2000;   // 2 ms per digit -> 125 Hz refresh

void write595(uint8_t value) {
  for (int8_t bit = 7; bit >= 0; bit--) {     // MSB first, ends up in QH
    digitalWrite(PIN_SER, (value >> bit) & 1);
    digitalWrite(PIN_SRCLK, HIGH);            // data sampled on this rising edge
    digitalWrite(PIN_SRCLK, LOW);
  }
  digitalWrite(PIN_RCLK, HIGH);               // copy to outputs, all at once
  digitalWrite(PIN_RCLK, LOW);
}

void setNumber(uint16_t n) {
  for (int8_t i = 3; i >= 0; i--) {           // digits[3] is the rightmost
    digits[i] = FONT[n % 10];
    n /= 10;
  }
}

void refreshDisplay() {
  if (micros() - lastSwitch < DIGIT_US) return;
  lastSwitch += DIGIT_US;
  digitalWrite(DIGIT_PINS[current], LOW);     // blank the old digit first (no ghosting)
  current = (current + 1) & 3;
  write595(digits[current]);
  digitalWrite(DIGIT_PINS[current], HIGH);
}

void setup() {
  pinMode(PIN_SER, OUTPUT);
  pinMode(PIN_SRCLK, OUTPUT);
  pinMode(PIN_RCLK, OUTPUT);
  for (uint8_t i = 0; i < 4; i++) {
    pinMode(DIGIT_PINS[i], OUTPUT);
    digitalWrite(DIGIT_PINS[i], LOW);
  }
  setNumber(0);
}

void loop() {
  refreshDisplay();                           // must run often: never use delay() here
  static unsigned long lastCount = 0;
  static uint16_t count = 0;
  if (millis() - lastCount >= 100) {          // count tenths of a second
    lastCount += 100;
    count = (count + 1) % 10000;
    setNumber(count);
  }
}`, caption: "Compiled with arduino-cli for arduino:avr:uno. The refresh is non-blocking, so loop() can do other work." },
      { t: "p", text: "Check the font: 0x3F = 0011 1111 lights a to f, which is a zero. 0x06 = 0000 0110 lights b and c, a one. 0x5B = 0101 1011 lights a, b, d, e, g, a two. Note the order inside `refreshDisplay()`: turn off the old digit **before** loading the new pattern. Do it the other way round and the next digit's pattern flashes briefly on the old digit, a faint \"ghost\"." },

      { t: "deep", title: "Driving the 74HC595 from hardware SPI", blocks: [
        { t: "p", text: "The 595 is SPI-compatible: SER is MOSI, SRCLK is SCK, and RCLK is a chip-select-style latch that you pulse after the transfer. On the Uno, hardware SPI uses D11 (MOSI) and D13 (SCK); D10 must be an output for the AVR to stay SPI master. The transfer of one byte at 8 MHz takes 1 µs instead of the roughly 100 µs of the bit-banged loop." },
        { t: "snippet", lang: "cpp", code: String.raw`#include <SPI.h>
// Board: Arduino Uno. 74HC595 SER on D11, SRCLK on D13, RCLK on D10.
const uint8_t PIN_RCLK = 10;

void write595(uint8_t value) {
  SPI.beginTransaction(SPISettings(8000000, MSBFIRST, SPI_MODE0));
  SPI.transfer(value);
  SPI.endTransaction();
  digitalWrite(PIN_RCLK, HIGH);
  digitalWrite(PIN_RCLK, LOW);
}

void setup() {
  pinMode(PIN_RCLK, OUTPUT);
  SPI.begin();
}

void loop() {
  for (uint8_t i = 0; i < 8; i++) {           // walking bit
    write595(1 << i);
    delay(100);
  }
}`, caption: "Compiled with arduino-cli for arduino:avr:uno." },
        { t: "p", text: "SPI mode 0 changes MOSI on the falling SCK edge and the 595 samples on the rising edge, so data has half a clock period (62.5 ns at 8 MHz) to settle: three times the 20 ns setup time. On an ESP32 at 3.3 V you can power the 595 from 3.3 V directly (its range is 2 to 6 V), or use a 74HCT595 at 5 V, which accepts 3.3 V inputs." },
      ] },
      { t: "deep", title: "Brightness, duty cycle and peak current in multiplexed displays", blocks: [
        { t: "p", text: "With four digits each lit 25% of the time, average current per segment is a quarter of the on-current. To make a multiplexed display as bright as a static one you need four times the peak current, which LED datasheets allow within a pulsed rating (often 100 mA peak at 10% duty, 0.1 ms pulse, for small indicator LEDs). The 74HC595's 70 mA total limit stops you from doing that here, so for bright displays use a dedicated driver like the MAX7219 (constant-current, scans eight digits itself) or the TM1637." },
        { t: "p", text: "Ghosting has a second cause besides software order: the transistor's storage time. A saturated BJT takes a microsecond or so to turn off. If you switch digits within that time the old digit glows faintly. A few microseconds of all-off between digits (blanking) fixes it, and is free since the refresh interval is 2000 µs." },
        { t: "p", text: "Dimming: tie OE' to a PWM pin (D9 on the Uno) instead of GND. Since OE' is active low, `analogWrite(9, 0)` is full brightness and `analogWrite(9, 255)` is off. The PWM frequency (490 Hz on D9) beats against the 125 Hz multiplex rate; if you see shimmer, raise the PWM frequency or synchronise the two." },
      ] },
    ],
    mistakes: [
      "**Forgetting to pulse RCLK.** Data shifts in but the outputs never change. SER and SRCLK alone fill the hidden register.",
      "**Leaving OE' or SRCLR' floating.** Both are active low; floating inputs give random blank or cleared outputs. Tie OE' low and SRCLR' high.",
      "**Running a digit common straight from an Uno pin.** Up to eight segments add up to more than 40 mA. Use a transistor.",
      "**Exceeding 70 mA total on the 595.** Eight segments at 10 mA each is already over the limit. Size resistors for the total, not per pin.",
      "**Using delay() in a multiplexed display loop.** Any blocking delay longer than a few milliseconds freezes the refresh and one digit glows while the others go dark.",
      "**No bypass capacitor.** Switching eight LEDs at once makes the supply dip; a 100 nF capacitor right at pins 16 and 8 keeps the chip stable.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: expand the Uno's outputs with a 74HC595 and drive a four-digit multiplexed display, then document its timing.",
      steps: [
        "Wire one 74HC595 to D2 (SER), D3 (SRCLK) and D4 (RCLK) on the Uno, with OE' to GND, SRCLR' to 5 V and a 100 nF capacitor across pins 16 and 8. Start with eight LEDs on QA to QH through 470 Ω resistors and a walking-bit test.",
        "Replace the LEDs with a common-cathode four-digit display: segments through the 470 Ω resistors, digit commons through NPN transistors with 1 kΩ base resistors from D5 to D8.",
        "Upload the program from this lesson and confirm the counter runs without flicker or ghosting. Swap the order of the two lines in refreshDisplay() to see ghosting appear, then put it back.",
        "If you have a logic analyser (a cheap 8-channel USB one with PulseView works), capture SER, SRCLK, RCLK and one digit pin. Measure the time per bit, per byte, and per digit, and draw the timing diagram in your notebook with these numbers.",
        "Calculate the worst-case total current through the 595 for the digit 8 with the decimal point (all eight segments), and confirm it is under 70 mA.",
        "Write a one-page design note: pin map, timing diagram, current budget, and refresh rate.",
      ],
    },
    quiz: [
      {
        q: "You clock eight bits into a 74HC595 but the outputs never change. What is the most likely cause?",
        options: ["SER is wired to QH'", "RCLK was never pulsed", "SRCLK is too slow", "OE' is tied to GND"],
        answer: 1,
        why: "Shifted data sits in the internal shift register until a rising edge on RCLK copies it to the storage register and outputs. OE' to GND is correct (enabled).",
      },
      {
        q: "Each of eight segments draws 8 mA from one 74HC595. Is this within the chip's absolute maximum ratings?",
        options: [
          "Yes, each output is under 35 mA",
          "No, 64 mA exceeds the per-output limit",
          "Yes, 64 mA total is under the 70 mA VCC/GND limit, but with little margin",
          "No, any LED needs a transistor",
        ],
        answer: 2,
        why: "8 × 8 = 64 mA through the VCC pin, under 70 mA. Each output at 8 mA is under 35 mA. It is legal but close; 470 Ω resistors give more margin.",
      },
      {
        q: "A five-digit multiplexed display shows each digit for 3 ms. What is the refresh rate?",
        options: ["About 333 Hz", "About 167 Hz", "About 67 Hz", "15 Hz"],
        answer: 2,
        why: "A cycle is 5 × 3 = 15 ms, and 1 / 15 ms ≈ 67 Hz. That is close to the flicker threshold; shorter per-digit times would be safer.",
      },
      {
        q: "Why does the code switch off the current digit before writing the next digit's pattern?",
        options: [
          "To save power",
          "Because the 595 cannot shift while a digit is on",
          "To meet the 595's setup time",
          "So the new pattern never appears on the old digit, which would cause ghosting",
        ],
        answer: 3,
        why: "If the new pattern is latched while the old digit is still on, it flashes briefly on the wrong digit and shows as a faint ghost.",
      },
      {
        q: "What does the 0x06 entry in the font table display, with bit 0 = segment a?",
        options: ["The digit 1 (segments b and c)", "The digit 6", "The digit 7", "Segments f and g"],
        answer: 0,
        why: "0x06 = 0000 0110, so bits 1 and 2 are set: segments b and c, the two right-hand vertical segments, which form a 1.",
      },
    ],
  },
};

export default lessons;
