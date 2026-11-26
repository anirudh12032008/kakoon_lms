import type { ModuleContent } from "../model/curriculum";

/**
 * Module b9: Capstone.
 * Rules for lesson text: original wording, no pin numbers or board-specific
 * numbers in prose (use `wiring` / `code` blocks), component figures are
 * marked as typical.
 */
const lessons: ModuleContent = {
  "b9-planning-a-project": {
    id: "b9-planning-a-project",
    outcomes: [
      "Break a project idea into inputs, processing and outputs",
      "Write a pin plan and spot a pin conflict before wiring",
      "Write a power plan by adding up currents",
      "Plan a build order that tests one stage at a time",
    ],
    blocks: [
      { t: "h", text: "Why plan at all" },
      { t: "p", text: "Until now each project came with its parts chosen and its blocks arranged. In a capstone you start from an idea and a blank table. The common way to fail is to wire everything at once, switch on, and face six possible faults together. A plan on one sheet of paper, made **before** any wire is placed, avoids most of that. It takes twenty minutes and usually saves several hours." },

      { t: "h", text: "Step 1: one sentence" },
      { t: "p", text: "Write what the project does in one sentence that names what it senses and what it does about it. \"When the tank is nearly empty, switch the pump on until it is full, and show the level on a screen.\" If you cannot write the sentence, the idea is not ready to build. If the sentence has three \"and also\" parts, the project is too big for a first attempt: keep the core and list the rest as extras." },

      { t: "h", text: "Step 2: inputs, processing, outputs" },
      { t: "p", text: "Every project in this course has had the same three-part shape. Sort your sentence into it. For the tank filler:" },
      { t: "table", head: ["Input", "Processing", "Output"], rows: [
        ["Water level sensor", "Is the level below the low mark? Start filling.", "Relay module and pump"],
        ["", "Is the level above the full mark? Stop filling.", "LCD showing the level"],
      ] },
      { t: "p", text: "Then draw it as a **block diagram**: a box for each part, the board in the middle, and an arrow for each signal. Inputs point into the board, outputs point away. No pins yet, no wires. If a box has no arrow, the project does not need it." },

      { t: "h", text: "Step 3: the pin plan" },
      { t: "p", text: "A pin plan is a table with one row per signal: which part, what kind of pin it needs, and which pin it gets. Kinds of pin are not interchangeable:" },
      { t: "list", items: [
        "An **analog sensor** needs a pin that can measure voltage.",
        "An **I2C device** must use the board's SDA and SCL pins, and all I2C devices share them.",
        "A **servo** uses one of the board's servo ports.",
        "Some parts use a bus that needs several particular pins at once.",
        "Simple on and off parts (LED, relay input, buzzer, button) can use any free general pin.",
      ] },
      { t: "p", text: "Fill in the fussy parts first, because they have no choice of pin, and give the flexible parts whatever is left. Two signals that want the same pin are a **pin conflict**. On paper, a conflict costs one line crossed out. Found after wiring, it costs a rebuild. The editor fills in a default pin for each block, and its hardware view shows them, so use it to check your table." },
      { t: "note", kind: "warn", text: "On an ESP32, \"any free pin\" has two exceptions. A few pins are input-only and cannot drive an LED, relay or buzzer at all. A few others are read by the chip at power-on to decide how it starts, and a part that holds one of them HIGH or LOW at that moment can stop the board starting or taking new firmware. Keep each block on its default pin unless you have checked the new pin on your board's pin diagram." },

      { t: "h", text: "Step 4: the power plan" },
      { t: "p", text: "List every part with its typical current, exactly as in the powering lesson, and add them up." },
      { t: "table", head: ["Part", "Typical current", "Powered from"], rows: [
        ["Board", "50 mA", "USB"],
        ["Water level sensor", "20 mA", "Board"],
        ["LCD with backlight", "30 mA", "Board"],
        ["Relay module, coil on", "75 mA", "Board 5 V pin"],
        ["5 V pump", "250 mA", "Its own 5 V supply"],
      ] },
      { t: "formula", text: "USB side: 50 + 20 + 30 + 75 = 175 mA", caption: "Comfortably inside a typical 500 mA USB port. The pump's 250 mA never passes through the board." },
      { t: "p", text: "For each part also note its **voltage**. This is where you catch a 5 V module that would put 5 V on an ESP32 pin, or a 12 V fan that needs an adapter you do not have yet." },
      { t: "note", kind: "safety", text: "Your power plan must show that no motor, pump, fan, relay coil or servo is powered from a GPIO pin, that anything too hungry for USB has its own low-voltage DC supply with grounds joined where needed, and that nothing connects to mains." },

      { t: "h", text: "Step 5: build and test in stages" },
      { t: "p", text: "Decide the order of building now. Add one part, prove it works with the smallest possible program, and only then add the next." },
      { t: "list", ordered: true, items: [
        "Sensor alone: watch its reading on the live chart and note the values for empty and full.",
        "LCD alone: show a fixed line of text.",
        "Sensor and LCD together: show the live reading.",
        "Relay alone, with no load: make it click on and off.",
        "Full logic with the relay but no pump: check it clicks at the right levels.",
        "Disconnect USB, add the pump and its supply, and run the complete project.",
      ] },
      { t: "p", text: "When stage four works and stage five does not, the fault must be in what you just added. That is the whole point: each test has only one new thing in it." },
      { t: "note", kind: "tip", text: "Write a \"smallest version that still counts\" at the bottom of your plan. If time runs out, a simple project that works is worth far more than an ambitious one that does not." },
    ],
    mistakes: [
      "**Wiring everything before testing anything.** Nothing works and there are a dozen possible causes. Take it apart and add one stage at a time.",
      "**Choosing pins as you go.** The last part to arrive finds its only possible pin already used.",
      "**No power plan.** The project works on the bench without the motor and resets as soon as the motor is added.",
      "**An idea with no clear output.** \"A smart room\" is not a plan. \"Switch the fan on above a set temperature\" is.",
      "**Skipping the test values.** Thresholds copied from another project instead of read from your own sensor in stage one.",
    ],
    practice: {
      kind: "bench",
      task: "Write a one-page plan for your own project. No wiring yet.",
      steps: [
        "Write the one-sentence description. Underline what is sensed and what is done.",
        "Draw the input, processing, output table and then the block diagram with arrows.",
        "Write the pin plan: one row per signal, with the kind of pin it needs. Place the fussy parts first. Check the result against the editor's default pins.",
        "Write the power plan: each part's voltage and typical current, what it is powered from, and the total drawn from USB.",
        "List your build stages in order, and next to each write the test that proves it works.",
        "Write the smallest version that still counts, and one extra you will add only if there is time.",
        "Swap plans with a classmate and try to find a pin conflict or a power problem in each other's.",
      ],
    },
    quiz: [
      {
        q: "A plan lists a soil probe, an LCD and a pump on a relay. Which is the correct sorting?",
        options: [
          "Inputs: soil probe and LCD. Output: pump",
          "Input: soil probe. Outputs: LCD, and the relay with its pump",
          "Input: pump. Outputs: soil probe and LCD",
          "Inputs: relay and soil probe. Output: LCD",
        ],
        answer: 1,
        why: "The probe brings information in. The LCD and the relay-switched pump are both things the board acts on, so both are outputs.",
      },
      {
        q: "Why are bus devices and analog sensors placed in the pin plan before LEDs and relays?",
        options: [
          "They are more expensive",
          "They use more current",
          "They are tested first",
          "They can only use particular pins, while simple on and off parts can use almost any free pin",
        ],
        answer: 3,
        why: "Parts with no choice of pin must be placed first. Flexible parts then take what is left, which avoids conflicts.",
      },
      {
        q: "A plan's USB side adds up to 180 mA, and a 400 mA servo motor is also on the list. What should the power plan say?",
        options: [
          "The servo gets its own supply with its ground joined to the board's ground",
          "Everything runs from USB because 580 mA is close to 500 mA",
          "The servo is powered from its signal pin",
          "The servo is removed from the project",
        ],
        answer: 0,
        why: "580 mA is more than a typical USB port gives, before any margin or start-up surge. The servo needs its own supply, and its signal needs a shared ground.",
      },
      {
        q: "Stage three (sensor and LCD together) worked. Stage four adds the relay and now the LCD shows nothing. Where is the fault most likely to be?",
        options: [
          "In the sensor",
          "In the LCD's contrast setting",
          "In something that changed when the relay was added: its wiring, its pin or its power",
          "In the one-sentence description",
        ],
        answer: 2,
        why: "Everything before this stage was proved working. Building in stages means the newest addition is the first suspect.",
      },
    ],
  },

  "b9-rfid-door-lock": {
    id: "b9-rfid-door-lock",
    outcomes: [
      "Explain how an RFID card identifies itself to a reader",
      "Apply the planning method to a project with a bus, a servo and a buzzer",
      "Explain what a pin conflict is and how this project avoids one",
      "Read your own card's ID and make it the one that opens the lock",
    ],
    blocks: [
      { t: "h", text: "How a card says who it is" },
      { t: "p", text: "An RFID card has no battery. Inside the plastic is a coil of wire and a tiny chip. The reader sends out a weak radio field. When the card comes within a few centimetres (typical for this reader), the field powers the chip, and the chip answers with its **ID**: a number fixed when the card was made. The reader passes that number to your program." },
      { t: "p", text: "In this project the ID arrives as text in a variable called `card_uid`, typically eight characters made of the digits 0 to 9 and the letters A to F. When no card is present the variable is empty." },
      { t: "note", kind: "warn", text: "A card's ID is not a secret. It can be read by any reader and copied onto another card. This project teaches identification and decision-making. It is not a real security system and should not guard anything valuable." },

      { t: "h", text: "The plan: sentence and three-part table" },
      { t: "p", text: "\"When the allowed card is tapped, open the lock for three seconds; for any other card, sound a buzzer.\"" },
      { t: "table", head: ["Input", "Processing", "Output"], rows: [
        ["RFID reader: the card's ID", "Is a card present?", "Servo: turns the latch"],
        ["", "Is its ID the allowed one?", "Active buzzer: wrong card"],
        ["", "", "Terminal: prints each ID"],
      ] },

      { t: "h", text: "The pin plan, and a real conflict" },
      { t: "p", text: "The reader uses a bus called **SPI**. Like I2C, it lets a board talk to a device in data. Unlike I2C, it uses a separate wire for each job: a clock, data out, data in, and a select line that tells this device it is being spoken to. The reader also has a reset line. That is five signal pins for one part, so it goes into the pin plan first." },
      { t: "p", text: "On the Arduino Uno the SPI bus lives on fixed pins, and the reader's reset line sits next to them. The board's first servo port happens to be one of those same pins. One pin cannot carry two signals, so this is a **pin conflict**. The project resolves it the way your own plan should: the reader cannot move, so the servo moves to a different servo port. On the ESP32 the SPI pins are elsewhere and there is no clash. The wiring table shows which servo port your board uses." },
      { t: "wiring", demo: "demo_rfid_door_lock" },
      { t: "p", text: "The table lists the reader's five signal lines, the buzzer's pin (the row called \"Output on a plain pin\") and the servo's port. The reader's connections are also written in a comment near the top of the program below, next to the line that creates the reader. On the reader module, the pin labelled **SDA** is the SPI select line, sometimes written SS. It has nothing to do with I2C." },

      { t: "h", text: "The power plan" },
      { t: "table", head: ["Part", "Supply", "Typical current", "Note"], rows: [
        ["RFID reader (MFRC522)", "**3.3 V** on both boards", "about 30 mA", "Never 5 V"],
        ["Small servo", "Its own 5 V to 6 V supply", "up to several hundred mA while moving", "Ground joined to the board"],
        ["Active buzzer module", "Board (3.3 V on an ESP32)", "about 20 to 30 mA", "Use a module with its own transistor, or a small active buzzer known to draw less than about 20 mA. Anything else goes through a transistor, never straight onto a pin"],
      ] },
      { t: "note", kind: "safety", text: "The MFRC522 reader is a 3.3 V part. Power it from the 3.3 V pin on both boards, never from 5 V. On a 5 V Arduino Uno the signal lines going into the reader are also at 5 V. Classroom kits commonly connect them directly, but that is outside the chip's rating: the correct approach is a level shifter on those lines, or a 1 kΩ and 2 kΩ voltage divider on each of the four lines that go from the Uno into the reader (clock, data in, select and reset). The line that carries data from the reader back to the Uno needs nothing. The servo's power wire goes to its own supply, never to a GPIO pin, with the supply's negative joined to the board's GND. Disconnect USB before rewiring." },

      { t: "h", text: "Build in stages" },
      { t: "p", text: "Disconnect USB before the wiring of every stage, and reconnect it only when the new part is fully wired." },
      { t: "list", ordered: true, items: [
        "**On an ESP32 only:** open the editor's Libraries panel and install the `mfrc522` library first. Without it the program stops at once with an import error.",
        "**Reader alone.** Wire only the reader and run the project. Tap a card and look for a line of characters in the serial terminal. No servo, no buzzer yet.",
        "**Buzzer.** Add it. The example ID is not your card's, so every tap should now give a one second beep. That proves the buzzer and the \"wrong card\" branch.",
        "**Servo.** Disconnect USB, add the servo on its own supply with grounds joined, and reconnect. It should move to the locked position at start-up.",
        "**Your card.** Put your card's ID into the program, as described below, and test both branches: your card opens, another card beeps.",
      ] },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_rfid_door_lock" },
      { t: "list", ordered: true, items: [
        "**Setup.** The buzzer's pin is made an output, the reader is started, and the servo is sent to 0 degrees so the lock begins closed.",
        "**Read.** Each pass of the loop asks the reader for a card and stores the answer in `card_uid`. No card gives empty text.",
        "**Is a card there?** The outer If-Else checks that `card_uid` is not empty. With no card, nothing else happens.",
        "**Print.** The ID is printed in the terminal. This is how you learn your own card's ID.",
        "**Is it the allowed card?** The inner If-Else compares `card_uid` with the allowed ID. If it matches, the servo turns to 90 degrees, waits three seconds and returns to 0. If not, the buzzer sounds for one second.",
        "**Pause.** A short wait, then the loop repeats.",
      ] },
      { t: "p", text: "The two If-Else blocks look unusual: the comparison is written inside brackets in the left box and tested against 1. The value box of an If-Else accepts only numbers, and an ID is text, so the text comparison is done in the brackets. It gives 1 when true and 0 when false, in both languages." },

      { t: "h", text: "Making it your card" },
      { t: "list", ordered: true, items: [
        "Run the project and tap your card. Copy the characters printed in the terminal exactly.",
        "In the inner If-Else block, find the example ID `A1B2C3D4` between the quotation marks.",
        "Replace only those characters with your own ID. Keep the quotation marks and the brackets. Use capital letters and no spaces, exactly as printed.",
        "Run again. Your card should open the lock, and any other card should sound the buzzer.",
      ] },
      { t: "p", text: "One limit to notice and report: while the lock is open, the program is waiting inside the three second pause and does not read the reader. A second card tapped in that time is ignored." },
    ],
    mistakes: [
      "**Reader powered from 5 V.** It may work briefly and then fail for good. The reader's supply is 3.3 V on both boards.",
      "**No ID ever appears.** Check the reader's wires against the comment in the program one by one, and on an ESP32 check that the `mfrc522` library is installed.",
      "**Your own card sounds the buzzer.** The ID in the If-Else does not match exactly: lower case letters, a space, a missing character, or the quotation marks were deleted.",
      "**The board resets when the servo moves.** The servo is drawing its current through the board. Give it its own supply and join the grounds.",
      "**Moving the servo back to the first servo port on an Arduino Uno.** That pin belongs to the reader in this project, so both stop working properly.",
    ],
    practice: {
      kind: "project",
      demo: "demo_rfid_door_lock",
      task: "Open the smart door lock project and build it in the five stages above, testing after each one. Record your card's ID, replace the example ID in the inner If-Else block, and show that your card opens the lock while a classmate's card sounds the buzzer. Then write down one limitation you observed and one improvement you would make, for use in the next lesson.",
    },
    quiz: [
      {
        q: "On the Arduino Uno this project puts the servo on a different servo port from the one used in earlier projects. Why?",
        options: [
          "The usual servo pin is needed by the RFID reader, and one pin cannot carry two signals",
          "The servo needs more current in this project",
          "The other port is faster",
          "RFID readers interfere with servos by radio",
        ],
        answer: 0,
        why: "The reader's lines occupy fixed pins on the Uno, including the usual servo pin. The reader cannot move, so the servo does.",
      },
      {
        q: "The terminal prints your card's ID correctly, but tapping it sounds the buzzer. What is the most likely cause?",
        options: [
          "The reader is powered from the wrong voltage",
          "The servo has no power",
          "The ID typed into the inner If-Else does not match the printed ID exactly",
          "The library is not installed",
        ],
        answer: 2,
        why: "A printed ID proves the reader works. Reaching the buzzer means the comparison was false, so the text in the block differs from the card's ID.",
      },
      {
        q: "Which statement about powering the MFRC522 reader is correct?",
        options: [
          "5 V on an Arduino Uno, 3.3 V on an ESP32",
          "5 V on both boards",
          "From a GPIO pin set HIGH",
          "3.3 V on both boards",
        ],
        answer: 3,
        why: "The reader is a 3.3 V part whichever board it is connected to. The board's logic voltage does not change what the reader's supply must be.",
      },
      {
        q: "You tap a card and nothing is printed at all. According to the program's structure, which part is failing?",
        options: [
          "The inner If-Else comparison",
          "The reading stage: `card_uid` stays empty, so the outer If-Else never passes",
          "The servo",
          "The buzzer",
        ],
        answer: 1,
        why: "Printing happens as soon as a card is detected, before any comparison. No print means no ID arrived: reader wiring, power or library.",
      },
    ],
  },

  "b9-document-and-present": {
    id: "b9-document-and-present",
    outcomes: [
      "Write a short project report with a standard structure",
      "Record test results in a table, including the ones that failed",
      "State the limitations of a project honestly and usefully",
      "Plan and rehearse a two-minute demonstration",
    ],
    blocks: [
      { t: "h", text: "Why write it up" },
      { t: "p", text: "A project that only you understand, and only this week, is half finished. A short report lets someone else rebuild it, lets a teacher see what you understood, and lets you pick it up again in six months. Engineers are judged as much on how clearly they explain their work as on the work itself. The report does not need to be long. Two or three pages is plenty." },

      { t: "h", text: "The structure" },
      { t: "table", head: ["Section", "What goes in it", "Length"], rows: [
        ["**Aim**", "The one-sentence description from your plan", "1 to 2 lines"],
        ["**Parts list**", "Every part, with its voltage and typical current", "A table"],
        ["**Circuit**", "Block diagram, pin table and power plan", "Half a page"],
        ["**How it works**", "The program explained in the stages: setup, measure, decide, act", "One paragraph or a short list"],
        ["**Test results**", "What you tested, what you expected, what happened", "A table"],
        ["**Limitations**", "What it cannot do, or does poorly", "3 to 5 points"],
        ["**What next**", "The improvements you would make with more time", "2 to 3 points"],
      ] },
      { t: "p", text: "Most of this already exists. The aim, the tables and the block diagram come straight from your one-page plan. Update them to match what you actually built, because the final circuit often differs from the first plan. Say where it differs and why." },

      { t: "h", text: "Test results as a table" },
      { t: "p", text: "\"It works\" is not a result. A result says what was done and what was seen. For the door lock:" },
      { t: "table", head: ["Test", "Expected", "Observed", "Pass?"], rows: [
        ["Allowed card tapped, 10 times", "Lock opens every time", "Opened 10 of 10", "Yes"],
        ["Other card tapped, 10 times", "Buzzer every time, lock stays shut", "Buzzer 10 of 10", "Yes"],
        ["Card held 5 cm above reader", "Not known in advance", "Not read; read at about 3 cm", "Noted"],
        ["Second card tapped while lock is open", "Buzzer", "Ignored", "No"],
      ] },
      { t: "p", text: "Repeat each test several times and give the count. A project that works 7 times out of 10 is a different thing from one that works 10 out of 10, and the reader deserves to know which you have." },

      { t: "h", text: "Reporting what did not work" },
      { t: "p", text: "Look at the last row of that table. It is a failure, and it is the most interesting line in the report. It shows the student tested beyond the easy case, understood why it happened (the program is paused while the lock is open), and can suggest a fix." },
      { t: "p", text: "Hiding a failure is dishonest, and it is also a poor tactic: the person assessing you will probably find it in the demonstration. A reported limitation shows understanding. A hidden one, once discovered, casts doubt on everything else you wrote. Never change a number or leave out a test to make the project look better." },
      { t: "list", items: [
        "**Weak:** \"Sometimes it does not work properly.\"",
        "**Useful:** \"A second card tapped during the three second open time is ignored, because the program waits and does not check the reader. Checking the reader inside a shorter repeated wait would fix this.\"",
      ] },
      { t: "p", text: "The useful version has three parts: what happens, why, and what would improve it. Write each limitation that way. Include the limits of your parts too, for example that a DHT11 is typically accurate only to a couple of degrees." },

      { t: "h", text: "The two-minute demonstration" },
      { t: "p", text: "Two minutes is short. Without a plan, most of it goes on plugging things in. Give each part of the time a job:" },
      { t: "table", head: ["Time", "What you do"], rows: [
        ["0:00 to 0:20", "Say the aim in one sentence and point to the input, the board and the output"],
        ["0:20 to 1:00", "Show the main behaviour working, once, slowly, saying what is happening"],
        ["1:00 to 1:30", "Show the other case: the wrong card, the dry soil, the cool room"],
        ["1:30 to 2:00", "Name one limitation and one improvement, then invite questions"],
      ] },
      { t: "list", items: [
        "**Rehearse with a timer**, at least twice, with the real hardware.",
        "**Arrive with it running.** Power it and test it before your turn, not during it.",
        "**Bring the test conditions with you**: the spare card, a cup of water, a torch, whatever makes the sensor change on demand.",
        "**Have a backup.** Record a short video of the project working, in case a wire comes loose on the way.",
        "**If it fails live, debug aloud.** Go along the chain of power, input, logic and output. Calm, methodical fault-finding impresses more than a perfect run.",
      ] },
      { t: "note", kind: "tip", text: "Expect three questions: why did you choose that sensor, what happens if it reads wrongly, and what would you change. Your limitations section already holds the answers." },
    ],
    mistakes: [
      "**Writing the report from memory at the end.** Thresholds, readings and test counts are forgotten. Note them down as you build.",
      "**Describing the plan, not the build.** The report shows the first pin table although two pins were changed later. Update it.",
      "**\"It works\" as the only result.** Give the test, the number of tries and what you observed.",
      "**Leaving out failures.** They are found in the demonstration anyway, and the report then looks careless or dishonest.",
      "**Spending the demonstration setting up.** Half the time is gone before anything moves. Arrive with it running.",
    ],
    practice: {
      kind: "bench",
      task: "Write the report for your capstone project and rehearse the demonstration.",
      steps: [
        "Copy the aim, parts list, block diagram, pin table and power plan from your plan, and correct each one to match what you built.",
        "Write \"How it works\" in four short points: setup, measure, decide, act.",
        "Run at least four tests, including one you expect might fail. Repeat each several times and fill in the results table with counts.",
        "Write three limitations, each with what happens, why, and what would improve it.",
        "Write a two-minute demonstration plan as a timed list, then rehearse it twice with a timer and the real hardware.",
        "Record a short backup video of the project working.",
      ],
    },
    quiz: [
      {
        q: "Which of these is the most useful test result to put in a report?",
        options: [
          "The project works well",
          "The sensor is very accurate",
          "The allowed card opened the lock in 9 of 10 taps; the failed tap was at the edge of the reader",
          "Testing was completed successfully",
        ],
        answer: 2,
        why: "It states what was tested, how many times, what was observed, and gives a clue about the one failure. The others cannot be checked.",
      },
      {
        q: "Your plant watering project floods the pot if the probe falls out of the soil. What should the report do with this?",
        options: [
          "Leave it out, because it only happens by accident",
          "State it as a limitation, explain that a probe in air reads as dry, and suggest a maximum pumping time",
          "Mention that the project sometimes behaves unexpectedly",
          "Change the test table so it does not show",
        ],
        answer: 1,
        why: "A good limitation says what happens, why, and what would improve it. Reporting it shows understanding of the design.",
      },
      {
        q: "During your demonstration the output does nothing. What is the best response?",
        options: [
          "Explain what you are checking, in the order power, input, logic, output",
          "Say it worked yesterday and stop",
          "Restart the board repeatedly without comment",
          "Swap wires quickly until something happens",
        ],
        answer: 0,
        why: "Working along the chain aloud shows the method you learned, and it is also the quickest way to find the fault.",
      },
      {
        q: "After testing, your final build uses a different pin for the buzzer than your plan did. What goes in the report's pin table?",
        options: [
          "The planned pin, because the plan was approved",
          "Both pins, without explanation",
          "No pin table, to avoid confusion",
          "The pin actually used, with a line saying what changed and why",
        ],
        answer: 3,
        why: "A report describes what was built so that someone else can rebuild it. Changes from the plan are worth recording with their reason.",
      },
    ],
  },
};

export default lessons;
