import type { ModuleContent } from "../model/curriculum";

/**
 * Module b3: Digital output and program flow.
 * Rules for lesson text: original wording, no pin numbers in prose (use
 * `wiring` / `code` blocks), every LED has a series resistor, and the program
 * walkthrough matches what the traffic signal project really generates.
 */
const lessons: ModuleContent = {
  "b3-gpio-outputs": {
    id: "b3-gpio-outputs",
    outcomes: [
      "Explain what a GPIO pin does when it is set as an output",
      "State what HIGH and LOW mean as voltages on the Arduino Uno and on the ESP32",
      "Wire an LED to an output pin so that HIGH switches it on",
      "Explain why a pin can light an LED but cannot run a motor",
    ],
    blocks: [
      { t: "h", text: "From always on to switched by a program" },
      { t: "p", text: "At the end of the last module you lit an LED from the board's supply pin. It worked, but the program had no say in it: the LED was on whenever the board had power. To control it, the top of that circuit has to move from the fixed supply to something the program can switch. That something is a **GPIO pin**." },
      { t: "p", text: "GPIO stands for **general purpose input and output**. Most of the labelled pins on your board are GPIO pins. Each one can be set up either to send a signal out or to read a signal in. This module uses them as outputs; inputs come in the next one." },

      { t: "h", text: "A pin is a two-way switch" },
      { t: "p", text: "Inside the chip, an output pin behaves like a switch with two positions. In one position the pin is joined to the chip's supply voltage. In the other it is joined to ground. Your program chooses the position, and it can change it thousands of times a second." },
      { t: "table", head: ["Name", "Also written", "Pin is joined to", "Voltage on the Arduino Uno", "Voltage on the ESP32"], rows: [
        ["**HIGH**", "1, on, true", "The supply", "About 5 V", "About 3.3 V"],
        ["**LOW**", "0, off, false", "Ground", "About 0 V", "About 0 V"],
      ] },
      { t: "p", text: "There is nothing in between. An output pin is fully HIGH or fully LOW, which is why this is called a **digital** output. The voltage for HIGH is the board's logic level from the first module: the same program gives 5 V on one board and 3.3 V on the other." },
      { t: "p", text: "The generated code shows this in two styles. Arduino C++ writes the words `HIGH` and `LOW`. MicroPython writes `1` and `0`. They mean the same thing." },

      { t: "h", text: "Telling the pin its job first" },
      { t: "p", text: "When a board starts, its pins are not yet outputs. The program must first set the **pin mode** to output. This is done once, at the start. With the LED block the editor adds that line for you; look for it near the top of the generated code, before the part that repeats." },

      { t: "h", text: "Wiring an LED to a pin" },
      { t: "p", text: "Take the circuit you already know and change one connection. The resistor used to start at the supply rail. Now it starts at the output pin. Everything else stays." },
      { t: "list", ordered: true, items: [
        "A jumper from the **output pin** to an empty row on the breadboard.",
        "A **220 Ω to 330 Ω** resistor from that row to another empty row.",
        "The LED's **longer leg** in the resistor's second row, and its **shorter leg** in a third row.",
        "A jumper from the shorter leg's row to **GND**.",
      ] },
      { t: "p", text: "Now follow the loop for each state. When the pin is HIGH it sits above ground, so current flows out of the pin, through the resistor and LED, and back to GND: the LED lights. When the pin is LOW, both ends of the circuit are at 0 V. With no voltage difference there is no push, so no current flows and the LED is dark." },
      { t: "note", kind: "safety", text: "The resistor is not optional because a pin is involved. Without it, the LED draws more current than the pin can safely give, and the damage is to the pin, which cannot be replaced." },

      { t: "h", text: "How much current, on each board" },
      { t: "p", text: "Use the LED formula from the last module with a 220 Ω resistor and a typical red LED that takes about 2 V." },
      { t: "table", head: ["Board", "HIGH voltage", "Left across the resistor", "Current"], rows: [
        ["Arduino Uno", "5 V", "5 - 2 = 3 V", "3 / 220, about 14 mA"],
        ["ESP32", "3.3 V", "3.3 - 2 = 1.3 V", "1.3 / 220, about 6 mA"],
      ], caption: "Typical figures. The same parts give a dimmer LED on the ESP32 because its HIGH is a lower voltage." },
      { t: "p", text: "Both currents are fine for a pin. If you want less current on the Uno, use 330 Ω." },
      { t: "deep", title: "Why a pin's HIGH voltage sags under load", blocks: [
        { t: "p", text: "An output pin is not a perfect source. Inside it, a transistor connects the pin to the chip's supply, and that transistor has some resistance. The more current you draw, the more voltage is lost inside it, so the HIGH level drops." },
        { t: "p", text: "The ATmega328P datasheet gives a figure you can check: with the chip at 5 V and 20 mA flowing out of a pin, the pin is guaranteed to stay above 4.2 V. A drop of up to 0.8 V at 20 mA means the pin acts like a source with roughly 40 Ω of resistance inside it (0.8 / 0.020 = 40). For an LED drawing 14 mA this hardly matters. It matters a lot when you try to draw large currents: the voltage falls, the chip warms, and the whole chip has a total current limit too (about 200 mA for all pins together on the ATmega328P)." },
        { t: "note", kind: "tip", text: "The ESP32 lets software choose an output's **drive strength**, which sets how much current a pin will push before its voltage sags. The default suits LEDs with resistors." },
      ] },

      { t: "h", text: "The limit of a pin" },
      { t: "p", text: "A pin is a signal source, not a power supply. Plan on no more than about 20 mA from one pin (a typical working limit): enough for an LED with a resistor, never for a motor. A small motor, a pump or a strip of many LEDs needs far more than that, and trying to draw it through a pin can destroy the pin or the whole chip." },
      { t: "p", text: "The rule to remember now is simple: one pin, one LED with its resistor. Larger loads are switched through a relay or a transistor, which a later module covers." },
      { t: "note", kind: "tip", text: "In the editor, the **LED** block has a **Pin** field. The pin you wire to must be the pin shown there. Open the Hardware view to see where that pin is on your board." },
      { t: "note", kind: "warn", text: "On an ESP32 DevKit, the LED block's default pin is one of a few pins the chip also reads at power-on to decide how to start, and on many DevKits it already drives the on-board LED. The circuit in this lesson, an LED and resistor from the pin to GND, is safe there. Do not connect anything that holds that pin HIGH at power-on, such as an LED wired up to 3.3 V or a pull-up resistor: the board may then refuse to take new firmware." },
    ],
    mistakes: [
      "**Wiring to a different pin from the one in the block.** The program switches one pin and the LED is on another. Compare the Pin field with the label printed beside the header.",
      "**Leaving the resistor on the supply rail.** If the resistor still starts at the supply instead of the pin, the LED stays on whatever the program does.",
      "**Expecting the same brightness on both boards.** HIGH is a lower voltage on the ESP32, so the same LED and resistor are dimmer there. That is expected.",
      "**Powering a motor or buzzer module straight from a pin.** The board resets or the pin stops working. A pin signals; it does not supply power.",
      "**Counting header holes instead of reading labels.** It is easy to be one position out. Always read the printed label.",
    ],
    practice: {
      kind: "build",
      task: "Rebuild your blink program from the first module, this time driving an external LED on the breadboard. Unplug the USB cable while you wire.",
      steps: [
        "In the editor, build the blink chain again: a **Forever Loop** with **LED** (On), **Sleep**, **LED** (Off), **Sleep** hanging from its side handle.",
        "Read the number in the **Pin** field of the LED blocks and find that pin in the **Hardware** view and on your board. Both LED blocks must show the same pin.",
        "With USB unplugged, wire the LED as in the four steps above: pin, resistor, LED longer leg, LED shorter leg, GND.",
        "Plug in and send the program as you did for the first blink: **Upload** on an Arduino Uno, or **Connect board** and then **Run** on an ESP32. The external LED should blink.",
        "If you have a multimeter, set it to DC voltage and measure from GND to the pin's row while the program runs. Watch the reading swap between about 0 V and your board's HIGH voltage.",
        "Unplug the USB cable, and swap the resistor for a 1 kΩ one. Predict how the brightness will change, then run it again.",
      ],
    },
    quiz: [
      {
        q: "An LED and resistor are wired from an output pin to GND. The program sets the pin LOW. Why is the LED dark?",
        options: [
          "LOW disconnects the pin from the circuit",
          "Both ends of the circuit are at about 0 V, so there is no voltage to push current through",
          "LOW reverses the current through the LED",
          "The resistor blocks all current when the pin is LOW",
        ],
        answer: 1,
        why: "LOW joins the pin to ground. With ground at both ends there is no voltage difference, so no current flows.",
      },
      {
        q: "The same program sets a pin HIGH on an Arduino Uno and on an ESP32. A multimeter measures from GND to the pin on each. What does it show?",
        options: [
          "About 5 V on both",
          "About 3.3 V on both",
          "About 3.3 V on the Uno and about 5 V on the ESP32",
          "About 5 V on the Uno and about 3.3 V on the ESP32",
        ],
        answer: 3,
        why: "HIGH means the pin is joined to the chip's own supply, which is the logic level: 5 V on the Uno and 3.3 V on the ESP32.",
      },
      {
        q: "A typical red LED (about 2 V) with a 330 Ω resistor is driven from a pin whose HIGH is 5 V. About how much current flows?",
        options: ["About 9 mA", "About 15 mA", "About 90 mA", "About 0.9 mA"],
        answer: 0,
        why: "The resistor has 5 - 2 = 3 V across it, and 3 / 330 is about 0.009 A, which is 9 mA.",
      },
      {
        q: "A student connects a small motor directly between an output pin and GND. The board keeps restarting and the motor barely twitches. What is the reason?",
        options: [
          "The program needs a longer Sleep",
          "The motor is connected the wrong way round",
          "The motor needs far more current than a pin can supply",
          "Motors only work on the Uno",
        ],
        answer: 2,
        why: "A pin should supply no more than about 20 mA. A motor demands much more, which pulls the supply down and can damage the pin.",
      },
    ],
  },

  "b3-sequence-and-delay": {
    id: "b3-sequence-and-delay",
    outcomes: [
      "Explain that a program runs its steps one at a time, in order",
      "Work out the timing of a sequence from its delays",
      "Wire three LEDs, each with its own resistor, to three output pins",
      "Read the generated traffic signal program and say what each line does",
    ],
    blocks: [
      { t: "h", text: "A program is a recipe" },
      { t: "p", text: "A recipe is followed from the top, one step at a time, and each step is finished before the next begins. A program is the same. This idea is called **sequence**, and it is the first of the three ideas every program is built from. The other two, repetition and variables, are in the next lesson." },
      { t: "p", text: "The board never skips ahead and never does two steps at once. So the order in which you join blocks is the order in which things happen. In the editor, a chain of blocks runs from top to bottom along the wires." },

      { t: "h", text: "Delay: how long a state lasts" },
      { t: "p", text: "Switching a pin takes the board almost no time. Left alone, it would run a whole sequence too fast to see. The **Sleep** block makes the board wait for a number of seconds before moving to the next step. In the generated code this is a delay." },
      { t: "p", text: "A useful way to think about it: an output stays in the state you set until a later step changes it. The delay after a step is therefore **how long that state lasts**. Set an LED on, wait 5 seconds, set it off, and the LED has been on for 5 seconds." },
      { t: "note", kind: "warn", text: "While the board is waiting in a delay it does nothing else at all. It does not read buttons or sensors. That is harmless for a traffic signal, but remember it: in a later module it explains why a button press can be missed." },

      { t: "h", text: "Designing the traffic signal" },
      { t: "p", text: "A simple traffic signal shows one colour at a time. Write the plan as a table before building it." },
      { t: "table", head: ["Step", "Light showing", "Lasts"], rows: [
        ["1", "Red", "5 seconds"],
        ["2", "Green", "5 seconds"],
        ["3", "Yellow", "2 seconds"],
      ], caption: "After step 3 the signal starts again from step 1." },
      { t: "formula", text: "time for one cycle = 5 + 5 + 2 = 12 seconds", caption: "The cycle time is the sum of every delay in the sequence. In one minute the signal completes 60 / 12 = 5 full cycles." },
      { t: "p", text: "Each row of the plan becomes three blocks: an **LED** block set to On, a **Sleep** block for the time, and an **LED** block set to Off for the same pin. Switching each light off before the next goes on is what guarantees that only one colour shows at a time." },
      { t: "deep", title: "How long a real traffic light stays amber", blocks: [
        { t: "p", text: "Real signal timings come from simple physics. The amber phase must give a driver who sees it change enough time to either stop comfortably or clear the junction. Traffic engineers work it out from a reaction time and a comfortable braking rate." },
        { t: "formula", text: String.raw`amber time ≈ reaction time + speed / (2 × braking rate)
speed 50 km/h = 13.9 m/s, reaction 1 s, braking 3 m/s²
amber ≈ 1 + 13.9 / 6 ≈ 1 + 2.3 ≈ 3.3 s` },
        { t: "p", text: "That is why ambers on city roads are usually 3 to 4 seconds and longer on fast roads. Your model uses whatever delays you choose, but the same idea applies: each delay in a sequence should come from what the person watching needs, not from a round number." },
      ] },

      { t: "h", text: "Wiring three LEDs" },
      { t: "p", text: "This is the single LED circuit from the last lesson, built three times side by side. Unplug the USB cable first." },
      { t: "list", ordered: true, items: [
        "Run one jumper from a **GND** pin on the board to the blue rail of the breadboard.",
        "Place the red, green and yellow LEDs in a line, each with its two legs in **two different rows**, and no LED sharing a row with another.",
        "Give **each** LED its own **220 Ω to 330 Ω** resistor, from the row of its longer leg to a free row.",
        "Run a jumper from each resistor's free row to that LED's output pin in the table below.",
        "Run a jumper from each LED's shorter leg to the blue rail.",
      ] },
      { t: "wiring", demo: "demo_traffic_signal" },
      { t: "p", text: "The three rows of the table are in the order the program uses them: the first pin is the **red** LED, the second is **green**, and the third is **yellow**." },
      { t: "note", kind: "safety", text: "Three LEDs need three resistors. Sharing one resistor between LEDs looks tidy, but LEDs that are on together through one resistor do not share the current evenly, and leaving a resistor out puts an LED straight across a pin." },

      { t: "h", text: "Reading the program" },
      { t: "p", text: "This is the program the editor generates for the traffic signal on the board you selected. Change the board at the top of the page to see the other language." },
      { t: "code", demo: "demo_traffic_signal" },
      { t: "p", text: "Read it in three parts:" },
      { t: "list", ordered: true, items: [
        "**Prepare, once.** The lines before the repeating part set the three LED pins as outputs. On the Arduino Uno these are the `pinMode` lines inside `setup()`; the `Serial.begin` line beside them opens the USB link used by the Terminal. On the ESP32 they are the three lines that create the pins, above `while True:`; the two `import` lines at the very top fetch the pin and timing tools the program needs.",
        "**Repeat forever.** Everything after that is the part that repeats: the body of `loop()` on the Uno, or the indented lines under `while True:` on the ESP32.",
        "**Nine steps in three groups.** Inside the repeating part there are nine lines. Each group of three is: pin on, wait, pin off. The first group is red, the second green, the third yellow. The comments at the end of the lines say `led on` and `led off`.",
      ] },
      { t: "p", text: "Compare the waits with your plan. The Uno shows them in milliseconds, so 5 seconds appears as `delay(5000)` and 2 seconds as `delay(2000)`. The ESP32 shows them in seconds, as `time.sleep(5)` and `time.sleep(2)`. The on and off lines differ in the same way: `HIGH` and `LOW` on the Uno, `1` and `0` on the ESP32." },
      { t: "p", text: "Notice what is **not** there: no wait between one light going off and the next coming on. Those two steps happen so close together that the change looks instant." },
    ],
    mistakes: [
      "**Colours in the wrong order.** The signal runs, but green and yellow are swapped. The program is right and two LEDs are on each other's pins. Swap the two jumpers at the board end.",
      "**One LED never lights.** Check that LED's own loop: the pin in the table, its resistor, the LED the right way round, and its wire to ground.",
      "**Two lights on together.** In your own version, an LED block was left On or the Off block uses a different pin from the On block. Each light needs an On and an Off for the same pin.",
      "**Forgetting the ground jumper to the rail.** All three LEDs stay dark, because the blue rail is not connected to the board.",
      "**Changing one delay and expecting the cycle time to stay the same.** The cycle is the sum of all the delays. Lengthen one and the whole cycle grows.",
    ],
    practice: {
      kind: "project",
      demo: "demo_traffic_signal",
      task: "Open the traffic signal project, wire the three LEDs as above, and run it. Time one full cycle with a watch and check it against the 12 seconds you calculated. Then change the three **Sleep** blocks so that red lasts 4 seconds, green 6 seconds and yellow 1 second. Work out the new cycle time on paper before you run it, and confirm it with the watch.",
    },
    quiz: [
      {
        q: "A sequence is: red on, wait 4 s, red off, green on, wait 6 s, green off, yellow on, wait 2 s, yellow off, then repeat. How long after the start does red come on for the second time?",
        options: ["4 seconds", "10 seconds", "12 seconds", "24 seconds"],
        answer: 2,
        why: "One full cycle is the sum of the delays: 4 + 6 + 2 = 12 seconds. Red comes on again when the cycle restarts.",
      },
      {
        q: "In the traffic signal, the block that switches red **off** is removed. What will you see?",
        options: [
          "Red stays lit all the time, with green and yellow taking turns alongside it",
          "Nothing lights",
          "Red blinks faster",
          "The program stops after the first cycle",
        ],
        answer: 0,
        why: "An output stays as it was last set. With nothing to set red LOW, it stays HIGH while the rest of the sequence carries on.",
      },
      {
        q: "The traffic signal runs with the right timing, but the order you see is red, yellow, green. The program has not been changed. What is the most likely cause?",
        options: [
          "The delays are too short",
          "The board is the wrong type",
          "A resistor is missing",
          "The green and yellow LEDs are connected to each other's pins",
        ],
        answer: 3,
        why: "The program switches pins, not colours. If two LEDs are on swapped pins, the right pins light in the right order but the colours appear swapped.",
      },
      {
        q: "On an Arduino Uno the code shows a wait of 2000. On an ESP32 the same block shows a wait of 2. Which statement is correct?",
        options: [
          "The Uno waits a thousand times longer",
          "Both wait two seconds: the Uno code counts in milliseconds and the ESP32 code in seconds",
          "The ESP32 waits a thousand times longer",
          "One of the two programs is wrong",
        ],
        answer: 1,
        why: "2000 milliseconds equals 2 seconds. The Sleep block is the same; only the units in the generated code differ.",
      },
    ],
  },

  "b3-loops-and-variables": {
    id: "b3-loops-and-variables",
    outcomes: [
      "Explain the difference between code that runs once and code that repeats forever",
      "Choose between a Forever Loop and a Repeat block for a task",
      "Create a variable, change it in a loop, and predict its value after several passes",
      "Use a Print block and the Terminal to watch a variable change",
    ],
    blocks: [
      { t: "h", text: "Why a microcontroller program never ends" },
      { t: "p", text: "A program on a laptop finishes and closes. A microcontroller has nothing to return to: if its program reached the end, the traffic signal would simply go dark. So almost every microcontroller program has the same shape: do some preparation **once**, then repeat the main work **forever**." },

      { t: "h", text: "Once, then forever" },
      { t: "table", head: ["Part", "Runs", "Typical contents", "Arduino Uno code", "ESP32 code"], rows: [
        ["Setup", "Once, at power-on or reset", "Setting pin modes, giving variables their starting values", "Inside `setup()`", "The lines above `while True:`"],
        ["Loop", "Again and again without end", "Reading, deciding, switching, waiting", "Inside `loop()`", "The indented lines under `while True:`"],
      ] },
      { t: "p", text: "In the editor, the **Forever Loop** block marks the dividing line. Blocks hanging from the handle on its **right side** are the loop body: they repeat. When the last block of the body finishes, the board jumps straight back to the first one. Blocks placed before the Forever Loop run once." },
      { t: "p", text: "Deciding where a step belongs is a real design choice. Ask: should this happen one time, or every time round? Setting a pin as an output is a once job. Switching a light is an every time job." },
      { t: "deep", title: "What surrounds setup and loop", blocks: [
        { t: "p", text: "Neither `setup()` nor `loop()` is where an Arduino program really starts. The Arduino core supplies a hidden `main()` function that runs first. It prepares the chip (for example starting the millisecond timer), calls your `setup()` once, and then calls `loop()` inside an endless loop of its own. When your `loop()` reaches its closing brace, it returns to that hidden loop, which simply calls it again." },
        { t: "p", text: "MicroPython on the ESP32 has no hidden loop: the script runs from top to bottom, and if it reaches the end, it stops and returns to the interpreter's prompt. That is why ESP32 programs in this course put their repeating part inside `while True:`. Leave it out and the program runs once and finishes." },
      ] },

      { t: "h", text: "Repeating a fixed number of times" },
      { t: "p", text: "Sometimes you want repetition with an end. A warning light that flashes three times before the signal changes is one example. The **Repeat** block does this. It has a **times** field, and the blocks hanging from its right side handle run that many times. Then the program carries on with whatever is joined below the Repeat block." },
      { t: "p", text: "A worked example. Inside a Repeat with times set to `3` are: LED on, Sleep `0.2`, LED off, Sleep `0.2`. One pass takes 0.2 + 0.2 = 0.4 seconds. Three passes take 3 × 0.4 = 1.2 seconds, and the LED flashes exactly three times." },
      { t: "formula", text: "total time = number of repeats × time for one pass" },
      { t: "p", text: "Loops can sit inside loops. Put that Repeat inside a Forever Loop, follow it with a Sleep of `2`, and you get three quick flashes, a two second pause, three quick flashes, and so on for as long as the board has power." },

      { t: "h", text: "Variables: giving the program a memory" },
      { t: "p", text: "So far the program remembers nothing. Each pass of the loop is identical to the last. A **variable** changes that. A variable is a named box that holds one value. The program can put a value in, look at it, and replace it with a new one." },
      { t: "p", text: "In the editor, the **Variable** block has two fields: **Variable**, which is the name, and **Value**, which is what to store. A block with Variable `count` and Value `0` means: put 0 in the box called `count`." },
      { t: "p", text: "The powerful step is to use the old value to make the new one. A Variable block with Variable `count` and Value `count + 1` means: take what is in the box, add one, and put the result back. In the generated code this appears as `count = count + 1`." },
      { t: "note", kind: "warn", text: "In a program the `=` sign is an instruction, not a statement of fact. It means: work out the right-hand side, then store the answer in the name on the left. Read `count = count + 1` as \"count becomes count plus one\"." },

      { t: "h", text: "Tracing a counter by hand" },
      { t: "p", text: "Place a Variable block setting `count` to `0` **before** the Forever Loop. Inside the loop, blink the LED once, then add one to `count`, then print it. Follow the value pass by pass:" },
      { t: "table", head: ["Moment", "Value of count", "What the Terminal shows"], rows: [
        ["After setup", "0", "Nothing yet"],
        ["End of pass 1", "1", "1"],
        ["End of pass 2", "2", "2"],
        ["End of pass 3", "3", "3"],
      ], caption: "On the Arduino Uno the numbers may appear with decimal places, such as 1.00, because of the number type the editor chooses." },
      { t: "p", text: "The variable now holds something no single pass could know: how many blinks have happened since the board started. That stored fact is called **state**. Counters, on and off flags and remembered sensor readings are all state held in variables." },
      { t: "p", text: "Where the starting value goes matters. If the block that sets `count` to `0` were inside the loop, every pass would wipe the box back to zero, and the Terminal would show 1 for ever." },

      { t: "h", text: "Seeing it in the Terminal" },
      { t: "p", text: "The **Print** block sends text over USB to the editor's Terminal. Type a variable's name into its **Text** field, without quotation marks, and it prints that variable's current value. With quotation marks it would print the letters themselves." },
      { t: "p", text: "Printing is the simplest way to find out what a program is really doing. When the behaviour surprises you, print the variable you are unsure about and compare it with what you expected." },
      { t: "note", kind: "tip", text: "Give variables names that say what they hold, such as `count` or `blinks`. Use letters, digits and underscores only, start with a letter, and avoid spaces." },
      { t: "deep", title: "How big a number a variable can hold", blocks: [
        { t: "p", text: "A variable is a few bytes of RAM. In Arduino C++ an `int` on the Uno is 2 bytes, 16 bits, so it can hold whole numbers from **-32768 to 32767**. On the ESP32's 32-bit chip an `int` in C++ is 4 bytes and reaches about 2.1 billion. MicroPython integers on the ESP32 simply grow larger as needed." },
        { t: "p", text: "What happens past the top? On the Uno, adding 1 to 32767 in an `int` in practice wraps round to -32768, like a car's odometer rolling over. A counter that adds 1 every millisecond would wrap after about 33 seconds. This is why time values on the Uno are kept in `unsigned long`, 4 bytes from 0 to 4,294,967,295, which takes about 49.7 days of milliseconds to roll over." },
        { t: "formula", text: "4,294,967,295 ms ÷ 1000 ÷ 3600 ÷ 24 ≈ 49.7 days" },
      ] },
    ],
    mistakes: [
      "**Starting value set inside the loop.** The counter never gets past 1, because it is reset on every pass. Move the block that sets it to zero above the Forever Loop.",
      "**Two spellings of one name.** `count` and `Count` are different boxes. The program either reports an error or quietly uses the wrong one. Copy the name exactly.",
      "**Quotation marks around the name in Print.** The Terminal shows the word count on every line instead of a number. Remove the quotation marks.",
      "**A block left outside the loop body.** A block that is not reached from the Forever Loop's side handle does not repeat. Follow the wires and check.",
      "**No delay anywhere in the loop.** The Terminal fills with numbers faster than you can read. Keep at least one Sleep in the body.",
    ],
    practice: {
      kind: "build",
      task: "Build a blink that counts its own flashes and reports the count in the Terminal. The on-board LED is enough, so no wiring is needed.",
      steps: [
        "From the **General** group, drag a **Variable** block onto the canvas. Set its **Variable** field to `count` and its **Value** field to `0`.",
        "From the **Loop** group, drag a **Forever Loop** and place it below. Join the bottom of the Variable block to the top of the Forever Loop.",
        "From the right side handle of the Forever Loop, build the blink chain: **LED** (On), **Sleep** `0.5`, **LED** (Off), **Sleep** `0.5`.",
        "Below the last Sleep, add a second **Variable** block with **Variable** `count` and **Value** `count + 1`.",
        "Below that, add a **Print** block and type `count` in its Text field, with no quotation marks.",
        "Open **Code** and check that the line setting `count` to 0 is in the run-once part and the line adding one is in the repeating part.",
        "Send it to the board (**Upload** on an Arduino Uno, **Run** on an ESP32) and watch the **Terminal**. On an Arduino Uno, press **Connect board** once the upload has finished, or no numbers will appear. Before it gets there, predict what number will be showing after 10 seconds.",
        "Change the second Variable block's **Value** to `count + 2`, predict the first four numbers, and run it again.",
      ],
    },
    quiz: [
      {
        q: "A program sets `count` to 0 before the Forever Loop. Inside the loop it runs `count = count + 2` once per pass. What is `count` at the end of the fourth pass?",
        options: ["2", "4", "6", "8"],
        answer: 3,
        why: "The value grows by 2 on each pass: 2, 4, 6, 8.",
      },
      {
        q: "A counter program prints 1, 1, 1, 1 and never goes higher. What is the most likely mistake?",
        options: [
          "The Print block has no quotation marks",
          "The block that sets the variable to 0 is inside the loop, so it is reset on every pass",
          "The Sleep is too long",
          "The board has run out of memory",
        ],
        answer: 1,
        why: "Each pass sets the variable back to 0 and then adds 1, so the printed value is always 1. The starting value belongs before the loop.",
      },
      {
        q: "Inside a Forever Loop there is a Repeat block with times set to 4, containing LED on, Sleep 0.25, LED off, Sleep 0.25. After the Repeat comes a Sleep of 3. How long is it from the start of one group of flashes to the start of the next?",
        options: ["5 seconds", "2 seconds", "3 seconds", "4 seconds"],
        answer: 0,
        why: "One pass is 0.5 seconds, so four passes take 2 seconds. Adding the 3 second pause gives 5 seconds.",
      },
      {
        q: "You want a buzzer pin set up as an output and a light that blinks continuously. Where does each step belong?",
        options: [
          "Both inside the loop",
          "Both before the loop",
          "The pin setup before the loop, the blinking inside it",
          "The blinking before the loop, the pin setup inside it",
        ],
        answer: 2,
        why: "Setting a pin's mode is a once job and belongs in the run-once part. Blinking must repeat, so it belongs in the loop.",
      },
    ],
  },
};

export default lessons;
