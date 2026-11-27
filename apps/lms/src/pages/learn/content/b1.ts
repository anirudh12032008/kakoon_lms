import type { ModuleContent } from "../model/curriculum";

/**
 * Module b1: Meet your board.
 * Rules for lesson text: original wording, no pin numbers in prose, board
 * differences stated generally (Uno 5 V + Arduino C++, ESP32 3.3 V + MicroPython).
 */
const lessons: ModuleContent = {
  "b1-what-is-a-microcontroller": {
    id: "b1-what-is-a-microcontroller",
    outcomes: [
      "Explain what a microcontroller is and how it differs from a laptop or phone",
      "Break any gadget down into inputs, processing and outputs",
      "Name the main parts of a development board and what each is for",
    ],
    blocks: [
      { t: "h", text: "A small computer with one job" },
      { t: "p", text: "A washing machine fills with water, turns the drum, drains, and beeps when it is done. Nobody is inside pressing switches. Something is watching the water level, counting the minutes and switching the motor. That something is a **microcontroller**: a complete, very small computer on a single chip, built to do one job again and again." },
      { t: "p", text: "You already own dozens of them. There is one in a microwave oven, a TV remote, a digital watch, a car key and an electric meter. They are cheap, they use very little power, and they start working the moment they get electricity." },

      { t: "h", text: "How it differs from a laptop" },
      { t: "p", text: "A laptop is a general purpose computer. It runs an operating system, many programs at once, and expects a screen and keyboard. A microcontroller is the opposite in almost every way." },
      { t: "table", head: ["", "Laptop or phone", "Microcontroller"], rows: [
        ["Programs", "Many, chosen by the user", "**One**, stored on the chip, started at power-on"],
        ["Operating system", "Yes", "Usually none: your program is all that runs"],
        ["Speed and memory", "Very large", "Small, but enough for its one job"],
        ["Talks to", "Screen, keyboard, network", "**Electrical pins** wired to sensors, lights and motors"],
        ["Power", "Needs a big battery or wall supply", "Can run for a long time on a small battery"],
      ] },
      { t: "p", text: "The row that matters most is the fourth one. A laptop has no simple way to read a temperature sensor or switch a light. A microcontroller is built for exactly that. Its **pins** are metal contacts that your program can switch on and off, or use to measure a voltage." },

      { t: "h", text: "Input, processing, output" },
      { t: "p", text: "Every project in this course, and every gadget you can think of, has the same three parts:" },
      { t: "list", ordered: true, items: [
        "**Input.** Something that tells the board about the world: a button, a light sensor, a temperature sensor.",
        "**Processing.** The program. It looks at the inputs and decides what should happen.",
        "**Output.** Something the board changes in the world: an LED, a buzzer, a motor, a display.",
      ] },
      { t: "p", text: "Try it on an automatic street light. The input is a light sensor. The processing is one decision: is it dark? The output is the lamp. Try it on a lift: the inputs are the floor buttons and door sensors, the outputs are the motor, the door and the floor display, and the processing decides where to go next." },
      { t: "note", kind: "tip", text: "When a project idea feels too big, write three lists: inputs, outputs, and the rules that connect them. Once those lists are written, most of the design is done." },

      { t: "h", text: "The chip and the board" },
      { t: "p", text: "The microcontroller itself is a small black chip. On its own it is awkward to use: its legs are tiny and it needs a steady power supply and a way to receive programs. So it is sold mounted on a **development board**, which adds the helpful parts around it." },
      { t: "list", items: [
        "**The microcontroller chip.** The computer itself.",
        "**USB socket.** Brings power from your computer and carries your program to the chip. It also carries text messages back, which you will read in the editor's Terminal.",
        "**Pin headers.** Rows of holes or pins along the edges. Each is labelled. Jumper wires plug in here.",
        "**Power pins.** Among the headers are pins labelled 5V, 3V3 or 3.3V, and GND. These supply electricity to your sensors and parts.",
        "**Voltage regulator.** Provides the steady voltages the board needs, such as 3.3 V made from the 5 V of the USB cable.",
        "**Reset button.** Restarts your program from the beginning. It does not erase it.",
        "**On-board LED.** A tiny light already wired to one pin, so you can test a program with no extra parts.",
      ] },
      { t: "p", text: "The two boards used in this course, the **Arduino Uno** and the **ESP32 DevKit**, both have all of these. The next lesson compares them." },
      { t: "deep", title: "What is inside the microcontroller chip", blocks: [
        { t: "p", text: "Under the black plastic a microcontroller holds the same parts as a full computer, shrunk onto one piece of silicon. A **processor core** carries out instructions. **Flash memory** stores your program and keeps it with the power off. **RAM** holds the variables while the program runs and is wiped at power-off. Around them sit the **peripherals**: blocks of hardware that drive pins, measure voltages, count time and talk to other chips, so the processor does not have to do every job by hand." },
        { t: "table", head: ["", "Arduino Uno (ATmega328P)", "ESP32 DevKit (ESP32)"], rows: [["Processor", "one 8-bit core, 16 MHz", "two 32-bit cores, up to 240 MHz"], ["Program memory (flash)", "32 KB, of which a small part holds the bootloader", "a separate flash chip, commonly 4 MB"], ["Working memory (RAM)", "2 KB", "about 520 KB"], ["Built in radio", "none", "Wi-Fi and Bluetooth"]], caption: "Figures from the chip makers' datasheets. 1 KB is 1024 bytes, about one page of plain text." },
        { t: "p", text: "2 KB of RAM sounds tiny, and it is: a single photo from a phone would not fit a thousand times over. Yet a street light controller needs only a few numbers in memory. Small memory is what keeps these chips cheap and frugal with power." },
      ] },

      { t: "h", text: "What a program is here" },
      { t: "p", text: "A program is a list of instructions the chip follows in order, very fast and exactly as written. The chip does not guess what you meant. If the light stays off, it is because the instructions, the wiring, or both say so. That sounds strict, but it is good news: every problem has a cause you can find." },
      { t: "p", text: "Once a program has been **saved** on the board it stays there. Unplug the board, plug it into a phone charger tomorrow, and the same program starts again from the top. The last lesson of this module shows how saving works on each board." },
    ],
    mistakes: [
      "**Thinking the board needs the computer to run.** The computer is only needed to send the program and to read messages. After that, any suitable USB power source will do.",
      "**Calling everything an input.** Ask which way the information flows. If the board learns something from the part, it is an input. If the board changes the part, it is an output.",
      "**Expecting the reset button to erase the program.** Reset only restarts the saved program. It stays until you save a new one.",
      "**Mixing up the chip and the board.** The board is the carrier. The microcontroller is the one chip on it that runs your program.",
    ],
    practice: {
      kind: "bench",
      task: "Get to know the board in your hand before you power it. Keep it unplugged for this task.",
      steps: [
        "Find the USB socket, the reset button and the largest chip or metal can on the board. That is the microcontroller.",
        "Read the labels printed beside the pin headers. Find one pin labelled **GND** and one power pin labelled **5V**, **3V3** or **3.3V**.",
        "Find the small on-board LEDs. One usually shows power; another is the one your program can control.",
        "Pick one appliance at home, such as a fan regulator, a microwave or a water purifier. Write down its inputs, its outputs, and one rule that connects them.",
      ],
    },
    quiz: [
      {
        q: "A classroom fan should switch on by itself when the room gets hot. Which list describes it correctly?",
        options: [
          "Input: fan. Processing: temperature sensor. Output: program",
          "Input: program. Processing: fan. Output: temperature sensor",
          "Input: temperature sensor. Processing: compare with a limit. Output: fan",
          "Input: fan and sensor. Processing: none. Output: none",
        ],
        answer: 2,
        why: "The sensor tells the board about the room, the program decides by comparing with a limit, and the fan is what the board changes.",
      },
      {
        q: "You save a program on a board, unplug it from the laptop, and connect it to a phone charger. What happens?",
        options: [
          "The same program starts running from the beginning",
          "Nothing, because the program was on the laptop",
          "The board waits until the laptop is connected again",
          "The program is erased when power is lost",
        ],
        answer: 0,
        why: "A saved program is stored on the board itself and starts whenever the board gets power. The laptop is only needed to send it.",
      },
      {
        q: "Which job suits a microcontroller better than a laptop?",
        options: [
          "Editing a video",
          "Browsing many websites at once",
          "Running a spreadsheet",
          "Switching a water pump off when a tank is full, all day, on a small power supply",
        ],
        answer: 3,
        why: "It is one fixed job that needs pins wired to a sensor and a pump, and low power. That is exactly what a microcontroller is built for.",
      },
      {
        q: "A project is saved on the board and working. You press the reset button. What should you expect?",
        options: [
          "The program is deleted and must be sent again",
          "The program restarts from its first instruction",
          "The board switches to a different program",
          "The pins are permanently switched off",
        ],
        answer: 1,
        why: "Reset restarts the stored program from the top. It does not remove it.",
      },
    ],
  },

  "b1-uno-and-esp32": {
    id: "b1-uno-and-esp32",
    outcomes: [
      "State the differences between the Arduino Uno and the ESP32 that affect wiring and code",
      "Explain why an ESP32 pin must never be given more than 3.3 V",
      "Choose the better board for a given project and give a reason",
      "Select your board in the editor so that pins and code match it",
    ],
    blocks: [
      { t: "h", text: "Two boards, the same ideas" },
      { t: "p", text: "This course uses two boards. Everything you learn about inputs, outputs and programs applies to both, and every project in the class list can be built on either. But they are not interchangeable: they work at different voltages and are programmed in different languages. Knowing the differences now will save you a damaged board later." },

      { t: "h", text: "Side by side" },
      { t: "table", head: ["", "Arduino Uno", "ESP32 DevKit"], rows: [
        ["Pin voltage (logic level)", "**5 V**", "**3.3 V**"],
        ["Language in this course", "Arduino C++", "MicroPython"],
        ["Wireless", "None built in", "Wi-Fi and Bluetooth built in"],
        ["Speed and memory", "Modest: fine for sensors, LEDs and motors", "Far higher"],
        ["Analog reading range", "0 to 1023", "0 to 4095 (in this site's analog blocks)"],
        ["Typical strength", "Simple, tough, forgiving", "Powerful and connected"],
      ], caption: "Both boards take their power from the USB cable, which supplies 5 V." },

      { t: "h", text: "Logic level: the difference that can break things" },
      { t: "p", text: "When a pin is switched on, it sits at the board's **logic level**. On the Uno that is 5 V. On the ESP32 it is 3.3 V. The same number is also the most the pin can safely receive from outside." },
      { t: "p", text: "Think of two water tanks built for different pressures. Connect a pipe from the high pressure system into the low pressure tank and the tank is damaged. In the same way, a 5 V signal fed into an ESP32 pin pushes harder than the chip was built to stand." },
      { t: "note", kind: "safety", text: "Never connect 5 V to an ESP32 input or output pin. An ESP32 pin must never see more than 3.3 V. Power ESP32 sensors from the 3.3 V pin unless a lesson tells you otherwise." },
      { t: "p", text: "The other direction is gentler but still matters. A 3.3 V signal going into an Uno is safe, and the Uno will usually read it as on. Some parts designed for 5 V will be dim, weak or unreliable on 3.3 V." },
      { t: "deep", title: "What counts as HIGH: logic thresholds on each board", blocks: [
        { t: "p", text: "A digital input does not need exactly 5 V or exactly 3.3 V to read HIGH. The chip compares the voltage against two limits from its datasheet. Above the upper limit it is guaranteed to read 1, below the lower limit it is guaranteed to read 0, and in between the result is not guaranteed." },
        { t: "table", head: ["", "Arduino Uno (powered at 5 V)", "ESP32 (powered at 3.3 V)"], rows: [["Reads 1 for certain above", "3.0 V (0.6 of the supply)", "about 2.5 V (0.75 of the supply)"], ["Reads 0 for certain below", "1.5 V (0.3 of the supply)", "about 0.8 V (0.25 of the supply)"], ["Highest safe voltage on a pin", "about 5.5 V", "about 3.6 V"]], caption: "From the ATmega328P and ESP32 datasheets. Both are fractions of the chip's own supply voltage." },
        { t: "p", text: "This table explains a common surprise. An ESP32 output at 3.3 V is above the Uno's 3.0 V limit, so an Uno can usually read an ESP32 signal directly. The reverse is not true: a 5 V signal is far above the ESP32's 3.6 V maximum and can destroy the pin. That one-way danger is why the course keeps repeating the 3.3 V warning." },
      ] },

      { t: "h", text: "Two languages, one set of blocks" },
      { t: "p", text: "In the editor you build programs from blocks. The editor then writes the text code for you: **Arduino C++** for the Uno and **MicroPython** for the ESP32. The blocks are the same; only the generated text differs." },
      { t: "list", items: [
        "On the **Uno**, your program is translated (compiled) into machine instructions on the computer, and the result is uploaded to the chip.",
        "On the **ESP32**, the board already runs a MicroPython interpreter. Your program is sent as text and the board reads and runs it line by line.",
      ] },
      { t: "p", text: "You do not have to write either language yet. You will read both as you go, and by the end of the beginner path the generated code will look familiar." },

      { t: "h", text: "Bigger numbers from the ESP32" },
      { t: "p", text: "Later you will measure voltages from sensors. The board reports each measurement as a whole number. The Uno counts from 0 to 1023. The ESP32, in this site's analog blocks, counts from 0 to 4095. A bigger range means finer steps, not a stronger signal." },
      { t: "p", text: "A worked example: a sensor sitting at half of the board's full voltage reads about 512 on the Uno and about 2048 on the ESP32. So a threshold number copied from a classmate using the other board will be wrong for yours." },

      { t: "h", text: "Which board for which job" },
      { t: "list", items: [
        "The project must send data to a phone or the internet: **ESP32**, because wireless is built in.",
        "The parts in your kit are 5 V modules and the project is stand-alone: the **Uno** is the simpler choice.",
        "You need many readings per second or a lot of memory: **ESP32**.",
        "It is your first week and you want the board least likely to be harmed by a wiring slip: **Uno**.",
      ] },
      { t: "note", kind: "tip", text: "Always set the Board menu, here and in the editor, to the board on your desk. Wiring tables and generated code on this site change with that choice. If the pins in a lesson do not match your board, check the menu first." },
    ],
    mistakes: [
      "**Wiring from a table made for the other board.** The pin names do not match and the project does nothing. Check which board is selected at the top of the page.",
      "**Feeding a 5 V sensor output into an ESP32.** It may work for a while and then the pin stops responding. Power the sensor from 3.3 V.",
      "**Copying a threshold between boards.** A reading of 500 is about half scale on the Uno but only about an eighth of the scale on the ESP32.",
      "**Choosing the ESP32 only because it is faster.** For a stand-alone project with a few LEDs and one sensor, speed makes no difference. Choose by voltage and by whether you need wireless.",
    ],
    practice: {
      kind: "bench",
      task: "Compare the two boards with your own eyes, unplugged, and make one design decision.",
      steps: [
        "Place an Arduino Uno and an ESP32 DevKit side by side, or look closely at the one you have and a photo of the other.",
        "On each, find the power pins. Note which board offers both a 5 V and a 3.3 V pin, and how they are labelled.",
        "On the ESP32, find the metal shield with a small zigzag or printed track beside it. That is the wireless module and its antenna. The Uno has nothing like it.",
        "Use the Board menu at the top of this page to select your board, and leave it set for the rest of the course.",
        "Decide which board you would use for a soil moisture alarm that sends a message to a phone, and write one sentence explaining why.",
      ],
    },
    quiz: [
      {
        q: "A sensor module is powered from 5 V and its output pin swings between 0 V and 5 V. You want to use it with an ESP32. What is the problem?",
        options: [
          "The ESP32 is too fast for the sensor",
          "MicroPython cannot read sensors",
          "The sensor's output can reach 5 V, which is more than an ESP32 pin can safely receive",
          "There is no problem",
        ],
        answer: 2,
        why: "An ESP32 pin must never see more than 3.3 V. A 5 V output can damage it.",
      },
      {
        q: "A sensor sits at about half of the board's full voltage. Roughly what number does each board report?",
        options: [
          "About 512 on the Uno and about 2048 on the ESP32",
          "About 512 on both",
          "About 2048 on the Uno and about 512 on the ESP32",
          "About 5 on the Uno and about 3 on the ESP32",
        ],
        answer: 0,
        why: "Half of 1023 is about 512 and half of 4095 is about 2048. The voltage is the same share of full scale; only the counting range differs.",
      },
      {
        q: "A greenhouse monitor must send temperature readings to a phone every minute. Which board is the natural choice, and why?",
        options: [
          "The Uno, because it uses 5 V",
          "The Uno, because C++ is needed for temperature",
          "Either, because both have Wi-Fi",
          "The ESP32, because Wi-Fi and Bluetooth are built in",
        ],
        answer: 3,
        why: "Sending data to a phone needs a wireless link. The ESP32 has one built in; the Uno does not.",
      },
      {
        q: "You follow a wiring table exactly, but nothing works. A classmate with the other board followed the same table and theirs works. What should you check first?",
        options: [
          "Whether your USB cable is a different colour",
          "Whether the Board menu is set to your board, so the table shows your pins",
          "Whether your LED is a different brand",
          "Whether the room is too bright",
        ],
        answer: 1,
        why: "Wiring tables and code are generated for the selected board. With the wrong board selected, the pins shown are not yours.",
      },
    ],
  },

  "b1-first-program": {
    id: "b1-first-program",
    outcomes: [
      "Find the block palette, the canvas, the generated code, the hardware view and the Terminal in the editor",
      "Build a program that blinks the on-board LED using the LED, Sleep and Forever Loop blocks",
      "Explain why a blink needs two waits, not one",
      "Change the blink speed and predict the result before running it",
    ],
    blocks: [
      { t: "h", text: "Why everyone starts with a blinking light" },
      { t: "p", text: "Blinking an LED is the smallest program that proves everything works: the cable, the board, the editor, and your understanding of how instructions run. It needs no extra parts, because the Arduino Uno and most ESP32 DevKit boards have a small LED already wired to one pin." },

      { t: "h", text: "A tour of the editor" },
      { t: "list", items: [
        "**Palette.** The list of blocks, grouped by kind: General, Loop, Condition, GPIO, Sensor and so on. You drag blocks from here.",
        "**Canvas.** The large area where you place blocks and join them with wires. The wires set the order in which things happen.",
        "**Code.** The text program the editor writes from your blocks, in the language of your board. You do not type it; you read it.",
        "**Hardware.** A picture of your board showing which pin each block uses. Use it to check your wiring.",
        "**Terminal.** Text sent back from the board over USB. A **Print** block writes here. It is how a program tells you what it is doing.",
      ] },
      { t: "p", text: "The editor's toolbar holds the buttons that talk to the board: **Connect board**, and the buttons that send your program. Those differ a little between the two boards, as the last section explains." },

      { t: "h", text: "The plan in plain words" },
      { t: "p", text: "Before touching a block, say what you want in ordinary language:" },
      { t: "list", ordered: true, items: [
        "Switch the LED on.",
        "Wait one second.",
        "Switch the LED off.",
        "Wait one second.",
        "Go back to step 1.",
      ] },
      { t: "p", text: "Each line becomes one block. Steps 1 and 3 are **LED** blocks, with State set to On and Off. Steps 2 and 4 are **Sleep** blocks, which make the board wait for a number of seconds. Step 5 is the **Forever Loop**, which repeats everything attached to it without end." },

      { t: "h", text: "Why two waits" },
      { t: "p", text: "The board runs instructions extremely fast: far more than a thousand in the blink of an eye. A wait is the only thing that slows it to human speed." },
      { t: "p", text: "Suppose you leave out the last wait. The LED goes off, the loop jumps back to the top, and the LED goes on again a tiny fraction of a second later. The off time is so short your eye cannot see it. The LED looks permanently on, and it seems the program is broken when it is doing exactly what it was told." },
      { t: "note", kind: "tip", text: "When something looks stuck on or stuck off, ask how long the program actually stays in each state. A state with no wait after it lasts almost no time at all." },

      { t: "h", text: "Working out the timing" },
      { t: "p", text: "One full blink is one on time plus one off time." },
      { t: "formula", text: "time for one blink = on time + off time", caption: "With 1 second on and 1 second off, one blink takes 2 seconds, so the LED blinks 30 times a minute." },
      { t: "p", text: "Change both Sleep blocks to `0.5` and one blink takes 1 second: twice as fast. Set the first to `0.1` and the second to `0.9` and the blink still takes 1 second, but now it is a short flash followed by a long pause. The two numbers control different things." },
      { t: "deep", title: "What the chip is doing during a wait", blocks: [
        { t: "p", text: "A wait is not a pause in the chip. The processor never stops: on the Uno the clock ticks 16 million times a second, so a one second wait is about 16,000,000 clock ticks spent checking the time and doing nothing useful. This is called a **busy wait**." },
        { t: "p", text: "The chip knows the time because a hardware **timer** counts clock ticks in the background, independent of your program. On the Uno, the Arduino core sets a timer up before your program starts so that a millisecond counter is always running. MicroPython on the ESP32 relies on the chip's own timers in the same way, and during `time.sleep` it can let background jobs, such as the USB link, carry on." },
        { t: "note", kind: "tip", text: "Because a busy wait blocks everything else, a program that must blink a light and also watch a button at the same time cannot simply wait. Later modules show how to check the clock instead of waiting on it." },
      ] },

      { t: "h", text: "How it looks in each language" },
      { t: "p", text: "Open the Code view after you build it. The two boards show the same idea in different words." },
      { t: "table", head: ["Idea", "Arduino Uno (C++)", "ESP32 (MicroPython)"], rows: [
        ["Prepare the pin, once", "A line inside `setup()`", "A line near the top, before the loop"],
        ["Repeat forever", "Everything inside `loop()`", "Everything indented under `while True:`"],
        ["LED on / off", "`digitalWrite` with `HIGH` or `LOW`", "`.value(1)` or `.value(0)`"],
        ["Wait", "`delay`, counted in **milliseconds**", "`time.sleep`, counted in **seconds**"],
      ], caption: "A one second wait appears as 1000 on the Uno and as 1 on the ESP32. Both mean the same thing." },

      { t: "h", text: "Running it" },
      { t: "p", text: "Plug the board in with a USB cable. What you press next depends on the board, because of the way each one receives programs." },
      { t: "table", head: ["", "Arduino Uno", "ESP32"], rows: [
        ["To try the program", "Press **Upload**. The program is compiled, sent to the board and started.", "Press **Connect board**, then **Run**. The program runs straight away."],
        ["Is it saved on the board?", "Yes. Every upload replaces the stored program.", "Not by **Run**. Press **Upload** to save it so that it starts by itself at power-on."],
        ["To end it", "It runs until you upload something else or remove power.", "Press **Stop**."],
        ["To see printed text in the Terminal (and, in later modules, readings on the live chart)", "Uploading closes the link to the board. When the upload has finished, press **Connect board**. The program may start again from the top when you do.", "Nothing extra: the board is already connected."],
      ] },
      { t: "p", text: "Choose your board's port when the browser asks for it. Within a few seconds the on-board LED should start blinking." },
      { t: "note", kind: "warn", text: "Some USB cables are made only for charging and carry no data. If the board lights up but never appears when you connect, try another cable before anything else. Connecting over USB needs the Chrome or Edge browser." },
      { t: "note", kind: "tip", text: "A few ESP32 DevKit boards have a power light but no LED that a program can switch. If the program runs without an error and nothing blinks, that is the likely reason. Carry on: in module b3 you will wire your own LED, with its resistor, to the same pin." },
      { t: "deep", title: "What happens when you press Upload", blocks: [
        { t: "p", text: "On the **Uno**, your C++ is first **compiled**: translated into the machine instructions the ATmega328P understands. The editor then resets the board through the USB link. For a moment after every reset a small program called the **bootloader**, kept in a protected corner of flash, listens on the serial line. It receives the new instructions, writes them into flash, and hands control to your program. If nothing arrives it simply starts the old program." },
        { t: "p", text: "The **ESP32** works differently in this course. Its chip already holds **MicroPython**, an interpreter that reads Python text and carries it out line by line. **Run** sends your script's text to the interpreter, which runs it from RAM, so it disappears at power-off. **Upload** saves the script as a file in the board's flash storage, and MicroPython runs that file each time it starts." },
        { t: "table", head: ["", "Uno", "ESP32 with MicroPython"], rows: [["What is sent", "machine code", "Python text"], ["Who receives it", "the bootloader", "the MicroPython interpreter"], ["When it is translated", "before sending, on your computer", "on the board, while it runs"]] },
      ] },
    ],
    mistakes: [
      "**Only one Sleep block.** The LED looks always on, or always off. Each state needs its own wait.",
      "**Blocks not joined to the loop.** A block that is sitting on the canvas but not wired into the chain is not part of the repeated sequence. Follow the wires from the Forever Loop and check every block is reached.",
      "**Both LED blocks set to On.** The State switch defaults to On. The second LED block must be changed to Off, or nothing ever switches the light off.",
      "**Wrong board selected.** The program is written for a pin your board does not use for its LED. Check the Board menu.",
      "**It stops blinking after a power cut.** On an ESP32, **Run** does not save the program. Use **Upload** if it should start by itself. If nothing happens at all, read the Terminal: an error message there usually names the problem.",
    ],
    practice: {
      kind: "build",
      task: "Build the blink program yourself, run it, and then change its rhythm. No extra parts are needed: the LED block's default pin is the on-board LED of the selected board.",
      steps: [
        "Open the editor and check that the board shown is the one on your desk.",
        "From the **Loop** group, drag a **Forever Loop** onto the canvas.",
        "From the **GPIO** group, drag an **LED** block. Leave **Pin** at its default and leave **State** on **On**.",
        "Join the handle on the **right side** of the Forever Loop to the top of the LED block. Whatever hangs from that side handle is repeated.",
        "From the **General** group, drag a **Sleep** block, leave it at `1`, and join the bottom of the LED block to its top.",
        "Add a second **LED** block below, set its **State** to **Off**, and join it on. Then add a second **Sleep** block below that.",
        "Open **Code** and find the on, wait, off, wait lines. Then send the program to the board: **Upload** on an Arduino Uno, or **Connect board** and then **Run** on an ESP32.",
        "Predict first, then test: what will you see with Sleep values of `0.2` and `0.2`? With `0.1` and `2`? With the last Sleep block removed?",
      ],
    },
    quiz: [
      {
        q: "A blink program has: LED on, Sleep 1, LED off, and then the loop repeats. There is no second Sleep. What do you see?",
        options: [
          "The LED blinks once a second",
          "The LED appears to stay on",
          "The LED stays off",
          "The program stops after one pass",
        ],
        answer: 1,
        why: "The off state lasts only the instant it takes to jump back to the top, far too short to see, so the LED looks permanently on.",
      },
      {
        q: "The two Sleep blocks are set to `0.25` and `0.75`. How many blinks happen in one minute?",
        options: ["15", "30", "60", "120"],
        answer: 2,
        why: "One blink takes 0.25 + 0.75 = 1 second, so there are 60 in a minute.",
      },
      {
        q: "On an Arduino Uno the Code view shows a wait written as 500. The same blocks on an ESP32 show 0.5. Why?",
        options: [
          "The Uno counts the wait in milliseconds and the ESP32 code counts it in seconds, so both are half a second",
          "The ESP32 is a thousand times faster",
          "The Uno program has a mistake",
          "The ESP32 blinks more slowly",
        ],
        answer: 0,
        why: "500 milliseconds and 0.5 seconds are the same length of time. The two languages simply use different units.",
      },
      {
        q: "Your blink has four blocks on the canvas, but the LED switches on and never goes off. The Code view shows only an on line and a wait inside the loop. What is the most likely cause?",
        options: [
          "The board is too slow",
          "The LED is faulty",
          "The USB cable is too long",
          "The last two blocks are not wired into the chain",
        ],
        answer: 3,
        why: "Only blocks reached by the wires from the loop become part of the repeated code. The Code view confirms the off step is missing.",
      },
    ],
  },
};

export default lessons;
