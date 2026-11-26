import type { ModuleContent } from "../model/curriculum";

/**
 * Module b2: Electricity you actually need.
 * Rules for lesson text: original wording, no pin numbers in prose, component
 * figures (LED forward voltage, currents) are marked as typical, and every LED
 * has a series resistor.
 */
const lessons: ModuleContent = {
  "b2-voltage-current-resistance": {
    id: "b2-voltage-current-resistance",
    outcomes: [
      "Describe voltage, current and resistance in plain words and give the unit of each",
      "Explain why current only flows in a closed loop",
      "Predict whether current goes up or down when voltage or resistance changes",
      "Read the voltage and current figures on a charger or battery and say what they mean",
    ],
    blocks: [
      { t: "h", text: "Three ideas run every circuit" },
      { t: "p", text: "You do not need a full electronics course to build these projects. You need three ideas and the way they fit together: **voltage**, **current** and **resistance**. Every wiring decision in this course comes back to them." },

      { t: "h", text: "The water tank picture" },
      { t: "p", text: "Picture a water tank on a roof, with a pipe running down to a tap in the garden." },
      { t: "list", items: [
        "The **height** of the tank gives the water its push. A higher tank pushes harder. That push is like **voltage**.",
        "The **amount of water flowing** through the pipe each second is like **current**.",
        "A **narrow section** of pipe holds the flow back. That is like **resistance**.",
      ] },
      { t: "p", text: "With the tap closed there is plenty of push but no flow. Open it and water flows. Raise the tank and more flows. Squeeze the pipe and less flows. Electricity behaves in the same way." },

      { t: "h", text: "The three quantities" },
      { t: "table", head: ["Quantity", "What it is", "Unit", "Symbol in formulas"], rows: [
        ["Voltage", "The push that drives charge around a circuit", "volt (V)", "`V`"],
        ["Current", "How much charge flows past a point each second", "ampere (A)", "`I`"],
        ["Resistance", "How strongly a part holds the flow back", "ohm (Ω)", "`R`"],
      ] },
      { t: "p", text: "Voltage is always measured **between two points**, just as the height of a tank only means something compared with the ground. When a board pin is described as 5 V, that means 5 V higher than the board's **GND** pin, which is the agreed zero." },
      { t: "p", text: "The currents in this course are small, so you will mostly see **milliamps**. One milliamp (mA) is a thousandth of an amp, so 20 mA is 0.020 A. Resistances are often large, so you will see **kilohms**: 1 kΩ is 1000 Ω." },

      { t: "h", text: "Current needs a complete loop" },
      { t: "p", text: "Water from the tank ends up on the ground. Charge is different: it has to travel all the way round and back to where it started. Current flows only when there is an unbroken path from the supply, through the parts, and back to the supply. That path is a **circuit**, and the return side is the wire to GND." },
      { t: "p", text: "This is why every part you connect has at least two wires, and why a project with one loose ground wire does nothing at all. A gap anywhere in the loop stops the current everywhere in the loop." },
      { t: "note", kind: "tip", text: "When a circuit does nothing, trace the loop with your finger: out of the supply pin, through each part, and back to GND. The fault is wherever your finger has to jump." },

      { t: "h", text: "How they depend on each other" },
      { t: "p", text: "You can reason about a circuit before doing any arithmetic:" },
      { t: "list", items: [
        "**More voltage**, same resistance: more current. A harder push moves more through the same path.",
        "**More resistance**, same voltage: less current. A tighter path lets less through.",
        "**Almost no resistance**: a very large current. This is a short circuit, and it is dangerous.",
      ] },
      { t: "p", text: "An example with the two boards. Take one resistor and connect it first across a 5 V supply and then across a 3.3 V supply. The resistor has not changed, but the push is smaller the second time, so the current is smaller too: about two thirds of what it was, because 3.3 is about two thirds of 5. The next lesson turns this reasoning into a formula." },

      { t: "h", text: "Voltage is offered, current is drawn" },
      { t: "p", text: "A phone charger marked 5 V and 2 A does not force 2 A into whatever is connected. The 5 V is the push it provides. The 2 A is the **most** it can supply. The connected device decides how much current it actually takes, according to its resistance." },
      { t: "p", text: "So a board that needs a small current is perfectly safe on a charger able to give a large one, as long as the voltage is right. The wrong voltage is what damages things." },
      { t: "note", kind: "safety", text: "Everything in this course runs from the 5 V of a USB cable or less. Mains electricity from a wall socket is never used, opened or measured in this course." },
    ],
    mistakes: [
      "**Saying a single point has a voltage.** Voltage is always between two points. If nothing else is stated, the second point is GND.",
      "**Thinking a bigger current rating will harm the board.** The rating is the most a supply can give, not what it forces through. Match the voltage; the device takes the current it needs.",
      "**Forgetting the return wire.** A part connected to a supply pin but not to GND has no loop, so no current flows and nothing happens.",
      "**Mixing up mA and A.** 20 mA is 0.020 A, not 20 A. Convert to amps before using a formula.",
    ],
    practice: {
      kind: "bench",
      task: "Find voltage and current figures on real objects and practise saying what they mean. Nothing needs to be powered.",
      steps: [
        "Read the small print on a phone charger. Find the line that starts with Output and note the voltage and the current.",
        "Say in one sentence which number is the push and which is the most it can supply.",
        "Look at an AA or AAA cell and note its voltage. Compare it with the charger.",
        "On your board, find the pins labelled GND and the power pins. Write down the voltage each power pin provides, measured against GND.",
        "Convert these to amps: 15 mA, 250 mA, 5 mA. Convert these to ohms: 1 kΩ, 4.7 kΩ, 10 kΩ.",
      ],
    },
    quiz: [
      {
        q: "A resistor is connected across a supply. You swap the supply for one with a higher voltage and change nothing else. What happens to the current?",
        options: [
          "It increases",
          "It decreases",
          "It stays the same",
          "It stops",
        ],
        answer: 0,
        why: "A larger push through the same resistance drives more current.",
      },
      {
        q: "An LED and its resistor are wired to the 5 V pin, but the wire back to GND has fallen out. What will the LED do?",
        options: [
          "Glow at half brightness",
          "Glow normally, because 5 V is still connected",
          "Flicker",
          "Stay off, because there is no complete loop",
        ],
        answer: 3,
        why: "Current needs an unbroken path out and back. With the return wire missing, no current flows anywhere in the loop.",
      },
      {
        q: "A board normally takes about 0.1 A at 5 V. You power it from a charger marked 5 V, 3 A. What happens?",
        options: [
          "The board is damaged by 3 A",
          "The board runs thirty times faster",
          "The board takes about 0.1 A as usual",
          "The charger refuses to work",
        ],
        answer: 2,
        why: "The 3 A figure is the most the charger can supply. The board draws only what it needs because the voltage is the same.",
      },
      {
        q: "The same resistor is moved from a 5 V supply to a 3.3 V supply. Roughly how does the current compare?",
        options: [
          "It is the same",
          "It falls to about two thirds",
          "It rises by about half",
          "It falls to zero",
        ],
        answer: 1,
        why: "With the resistance fixed, current follows voltage. 3.3 V is about two thirds of 5 V, so the current is about two thirds as well.",
      },
    ],
  },

  "b2-ohms-law-and-leds": {
    id: "b2-ohms-law-and-leds",
    outcomes: [
      "Use Ohm's law to find voltage, current or resistance when the other two are known",
      "Explain why an LED must always have a resistor in series",
      "Calculate a suitable LED resistor for a 5 V and a 3.3 V supply",
      "Tell the two legs of an LED apart and connect it the right way round",
    ],
    blocks: [
      { t: "h", text: "One formula for the last lesson" },
      { t: "p", text: "The last lesson ended with three rules of thumb: more push gives more flow, more resistance gives less. **Ohm's law** is those rules written as a single line." },
      { t: "formula", text: "V = I × R", caption: "`V` is the voltage across a part in volts, `I` is the current through it in amps, and `R` is its resistance in ohms." },
      { t: "p", text: "The same line can be turned round to find whichever quantity is missing:" },
      { t: "formula", text: "I = V / R,  and  R = V / I" },
      { t: "p", text: "Try it with easy numbers. A 100 Ω resistor with 5 V across it carries 5 / 100 = 0.05 A, which is 50 mA. Double the resistor to 200 Ω and the current halves to 25 mA. That is exactly the behaviour the water picture predicted." },
      { t: "note", kind: "warn", text: "Always work in volts, amps and ohms. Change milliamps to amps first: 10 mA is 0.010 A. Forgetting this gives answers that are wrong by a factor of a thousand." },

      { t: "h", text: "What makes an LED different" },
      { t: "p", text: "A resistor behaves steadily: twice the voltage, twice the current. An **LED** (light emitting diode) does not. Below a certain voltage it passes almost nothing and stays dark. Once that voltage is reached it conducts very easily, and it then holds roughly that same voltage across itself however much current flows." },
      { t: "p", text: "That voltage is called the **forward voltage**. It depends on the colour. Typical figures are around 2 V for red and yellow, a little more for green, and around 3 V for blue and white. These are typical values, not exact ones: individual LEDs differ." },
      { t: "p", text: "Now the danger. Connect a red LED straight across 5 V. The LED takes about 2 V and conducts freely, so nothing is left to limit the current except the supply itself. The current rises far above what the LED can stand. It overheats and is destroyed, sometimes with a brief bright flash, and it can damage the board pin feeding it." },
      { t: "note", kind: "safety", text: "Every LED gets a resistor in series, every time. A value of 220 Ω to 330 Ω is the standard starting point on both boards." },

      { t: "h", text: "The resistor takes up the difference" },
      { t: "p", text: "Put a resistor in the same line as the LED, one after the other. This is called **in series**, and the same current flows through both. The LED keeps its forward voltage. The resistor takes whatever voltage is left over, and Ohm's law applied to the resistor sets the current." },
      { t: "formula", text: "R = (Vsupply - Vled) / I", caption: "`Vsupply` is the supply voltage, `Vled` is the LED's forward voltage, and `I` is the current you want, in amps." },
      { t: "p", text: "A typical small LED is clearly visible at 5 mA to 10 mA. More current than about 20 mA is rarely useful, and about 20 mA is also the most you should plan to take from one board pin (a typical working limit). Aim for about 10 mA or less." },

      { t: "h", text: "Worked example on 5 V" },
      { t: "list", ordered: true, items: [
        "Supply is 5 V. A typical red LED takes about 2 V. So the resistor must drop 5 - 2 = **3 V**.",
        "Choose a current of 10 mA, which is 0.010 A.",
        "`R` = 3 / 0.010 = **300 Ω**.",
        "Resistors come in fixed standard values. 300 Ω is not a common one, so pick the next value **up**: **330 Ω**. Going up gives slightly less current, which is the safe direction.",
        "Check: 3 / 330 is about 0.009 A, so about 9 mA. Comfortable for the LED and for the pin.",
      ] },

      { t: "h", text: "Worked example on 3.3 V" },
      { t: "list", ordered: true, items: [
        "Supply is 3.3 V. The same red LED still takes about 2 V. The resistor drops 3.3 - 2 = **1.3 V**.",
        "With a **220 Ω** resistor the current is 1.3 / 220, about 0.006 A, so about 6 mA.",
        "That is a little dimmer than on 5 V but perfectly visible, and well within what a pin can supply.",
      ] },
      { t: "p", text: "Notice that a blue or white LED, needing around 3 V, leaves very little spare voltage on a 3.3 V supply. It will be dim or may not light at all. That is the LED's nature, not a wiring fault." },

      { t: "h", text: "Which way round" },
      { t: "p", text: "An LED passes current in one direction only. The **longer leg** is the positive side (the anode) and goes towards the supply. The **shorter leg** is the negative side (the cathode) and goes towards GND. Many LEDs also have a small flat on the rim of the plastic beside the shorter leg." },
      { t: "p", text: "Fitted backwards on these low voltages, an LED simply stays dark and is not harmed. Turn it round. The resistor has no direction, and it may sit on either side of the LED: in a series loop the current is the same everywhere." },

      { t: "h", text: "How warm does the resistor get" },
      { t: "p", text: "A part that carries current with a voltage across it turns electrical energy into heat. The rate is called **power**, measured in watts." },
      { t: "formula", text: "P = V × I", caption: "For the 5 V example: the resistor has 3 V across it and carries about 0.009 A, so it turns about 0.027 W into heat." },
      { t: "p", text: "The small resistors in a student kit are usually rated for a quarter of a watt, which is 0.25 W. The LED resistor is using about a tenth of that, so it stays cool. The same formula explains why a short circuit is dangerous: a large current makes a lot of heat very quickly." },
    ],
    mistakes: [
      "**No resistor because it worked for a friend.** An LED without a resistor may light for a while before it fails, and the pin may fail with it. If an LED was very bright and is now dead, this is the likely story.",
      "**Using milliamps in the formula.** Dividing 3 by 10 instead of by 0.010 gives 0.3 Ω, which is almost no resistance at all. Convert to amps first.",
      "**Using a kilohm value by mistake.** A 10 kΩ resistor in place of 330 Ω gives a glow so faint it looks off in daylight. Check the value before blaming the LED.",
      "**LED the wrong way round.** It stays dark and nothing gets warm. Turn it round so the longer leg faces the supply side.",
      "**Rounding the resistor down.** A smaller resistor means more current. When the exact value is not available, go up.",
    ],
    practice: {
      kind: "bench",
      task: "Work these out on paper, then find the real parts in your kit. No power is needed.",
      steps: [
        "A resistor of 500 Ω has 5 V across it. Find the current in amps and in milliamps.",
        "A yellow LED (typically about 2 V) is to run at 5 mA from a 5 V supply. Calculate the resistor, then choose the nearest common value at or above your answer.",
        "The same LED with a 220 Ω resistor is moved to a 3.3 V supply. Estimate the current.",
        "For your answer to step 2, work out the power turned to heat in the resistor and compare it with 0.25 W.",
        "Find a 220 Ω or 330 Ω resistor in your kit. If you have a multimeter, confirm the value on its resistance setting; otherwise check the printed label on the strip or bag.",
        "Pick up an LED and identify the longer leg and the flat on the rim.",
      ],
    },
    quiz: [
      {
        q: "A green LED with a typical forward voltage of about 2 V is to run at 10 mA from a 5 V supply. Which resistor is the best choice?",
        options: ["30 Ω", "150 Ω", "330 Ω", "3.3 kΩ"],
        answer: 2,
        why: "The resistor drops 5 - 2 = 3 V, and 3 / 0.010 = 300 Ω. The next common value up is 330 Ω.",
      },
      {
        q: "A student connects an LED straight from the 5 V pin to GND with no resistor. It flashes brightly and then goes dark for good. Why?",
        options: [
          "The LED was the wrong colour",
          "Nothing limited the current, so far too much flowed and the LED overheated",
          "5 V is too low for an LED",
          "The LED was backwards",
        ],
        answer: 1,
        why: "Once past its forward voltage an LED conducts very easily. Without a resistor to take up the remaining voltage, the current rises until the LED is destroyed.",
      },
      {
        q: "An LED circuit with a 220 Ω resistor works on a 5 V supply. You move the same LED and resistor to a 3.3 V supply. What do you expect?",
        options: [
          "It is brighter, because 3.3 V is safer",
          "It is destroyed",
          "It is exactly as bright",
          "It is dimmer, because less voltage is left across the resistor and so less current flows",
        ],
        answer: 3,
        why: "The LED keeps about the same forward voltage, so the resistor has only about 1.3 V across it instead of about 3 V. Less voltage across the same resistor means less current.",
      },
      {
        q: "An LED and resistor are wired correctly in every respect except that the LED's shorter leg faces the supply. What happens on a 5 V or 3.3 V supply?",
        options: [
          "The LED stays dark and is not harmed; turning it round fixes it",
          "The LED lights at double brightness",
          "The resistor burns out",
          "The board resets",
        ],
        answer: 0,
        why: "An LED conducts in one direction only. At these low voltages a reversed LED simply blocks the current.",
      },
    ],
  },

  "b2-breadboard-and-power": {
    id: "b2-breadboard-and-power",
    outcomes: [
      "Say which holes on a breadboard are joined inside and which are not",
      "Use the power rails to share supply and ground among several parts",
      "Explain what ground is and why every part of a project must share it",
      "Build an LED circuit on a breadboard and spot a short circuit before applying power",
    ],
    blocks: [
      { t: "h", text: "Building without solder" },
      { t: "p", text: "A **breadboard** is a plastic block full of holes with metal spring clips hidden underneath. Push a wire or a component leg into a hole and the clip grips it. Holes that share a clip are joined together, as if by a wire you cannot see. Learning which holes are joined is the whole skill." },

      { t: "h", text: "The pattern inside" },
      { t: "table", head: ["Area", "How the holes are joined", "Used for"], rows: [
        ["Main area, each side of the centre gap", "In short **rows of five**, running across the board", "Components and jumper wires"],
        ["Centre gap", "Nothing crosses it: the two sides are **separate**", "Chips and modules that straddle the gap"],
        ["Long strips at the edges (power rails)", "Along the **length** of the board, usually marked with a red and a blue line", "Sharing supply and ground"],
      ] },
      { t: "p", text: "Two legs in the same row of five are connected. Two legs in neighbouring rows are not. So to join two parts, put one leg of each in the **same row**. To keep two legs apart, put them in **different rows**." },
      { t: "p", text: "That second point catches every beginner once. If both legs of an LED or a resistor are pushed into the same row, the breadboard joins them together and the current goes round the part instead of through it. A part must always **bridge two different rows**." },
      { t: "note", kind: "warn", text: "On many longer breadboards each power rail is split into two halves at the middle of the board. If parts on one half have no power, look for a break in the red and blue lines and bridge it with a short jumper." },

      { t: "h", text: "Power rails and the board's power pins" },
      { t: "p", text: "Your board gets 5 V from the USB cable. It offers power to your circuit through labelled pins:" },
      { t: "list", items: [
        "**5 V pin.** Roughly the USB voltage. On some ESP32 boards it is labelled VIN.",
        "**3.3 V pin.** A lower, regulated voltage, often labelled 3V3. This is the one to use for parts connected to an ESP32.",
        "**GND.** The return path and the zero point for every voltage on the board. Boards have several GND pins; they are all the same connection.",
      ] },
      { t: "p", text: "A project often has several parts that all need supply and ground, but the board has only a few such pins. So run one jumper from a supply pin to the red rail and one from GND to the blue rail. Now every hole along those rails is a supply or ground point, and each part takes a short wire to the nearest one." },
      { t: "note", kind: "tip", text: "Keep to a colour habit: red wires for supply, black or blue for ground, any other colour for signals. You will find a wrong wire far faster." },

      { t: "h", text: "What ground really is" },
      { t: "p", text: "Voltage is always measured between two points, so a circuit needs one agreed point to measure from. That point is **ground**, written GND. It is defined as 0 V, and it is also where current returns to the supply after passing through your parts." },
      { t: "p", text: "Because GND is the reference for everything, every part of a project must connect to the **same** ground. A sensor whose ground wire is missing has no complete loop and no shared zero, so its readings are meaningless or absent. A missing ground is one of the most common reasons a correct-looking circuit does not work." },

      { t: "h", text: "Short circuits" },
      { t: "p", text: "A **short circuit** is a path from supply to ground with almost no resistance in it. Ohm's law says what follows: a tiny `R` gives a huge `I`. Wires get hot, the board may switch off or reset, the computer may shut down its USB port, and parts can be damaged." },
      { t: "p", text: "On a breadboard a short usually comes from one of three slips: a jumper placed straight between the two power rails, both legs of a part in one row that also touches supply and ground, or bare component legs bent until they touch each other." },
      { t: "note", kind: "safety", text: "Never join a 5 V or 3.3 V pin directly to GND. Unplug the USB cable before you add, move or remove any wire, and look over the whole circuit once more before plugging it back in." },

      { t: "h", text: "Building the LED circuit" },
      { t: "p", text: "This circuit uses no program. It simply lights an LED from the board's supply pin, so you can practise the breadboard itself. With USB unplugged:" },
      { t: "list", ordered: true, items: [
        "Run a jumper from a **GND** pin on the board to the blue rail.",
        "Run a jumper from the **3.3 V** pin to the red rail. On an Arduino Uno you may use the **5 V** pin instead.",
        "Place the LED so that its two legs are in **two different rows**. Note which row holds the longer leg.",
        "Place a **220 Ω to 330 Ω** resistor with one leg in the red rail and the other in the same row as the LED's **longer** leg.",
        "Run a jumper from the row of the LED's **shorter** leg to the blue rail.",
        "Trace the loop with your finger: supply pin, red rail, resistor, LED, blue rail, GND. Then plug in the USB cable.",
      ] },
      { t: "p", text: "The LED should light and stay lit. In the next module the red rail end of that resistor will move to an output pin, and your program will decide when the LED is on." },
    ],
    mistakes: [
      "**Both legs in the same row.** The breadboard joins them, so the part is bypassed. An LED wired this way stays dark; a resistor wired this way does nothing, and may leave the LED unprotected.",
      "**Parts placed across the split in a power rail.** Half the circuit has no supply. Check for a break in the coloured lines.",
      "**A jumper not pushed fully in.** It looks connected but is loose, so the circuit works only when the wire is touched. Push each wire in firmly.",
      "**No ground wire from the board.** The blue rail is only ground if a jumper connects it to the board's GND pin.",
      "**Rewiring with the USB cable still in.** A wire that brushes the wrong rail for a moment is enough to cause a short. Unplug first.",
    ],
    practice: {
      kind: "bench",
      task: "Build the always-on LED circuit described above, then use it to test what you now know about the breadboard. Unplug the USB cable before every change.",
      steps: [
        "Build the circuit and confirm the LED lights.",
        "Unplug. Move the LED's shorter leg into the same row as its longer leg. Predict what will happen, then plug in and check. Put it back afterwards.",
        "Unplug. Move the ground jumper to a different hole in the **same** row of five as before. Predict, then check.",
        "Unplug. Move the ground jumper one row along, to a neighbouring row. Predict, then check, then restore it.",
        "Unplug. Turn the LED round. Predict, then check, then restore it.",
        "Leave the working circuit built. You will measure it in the next lesson.",
      ],
    },
    quiz: [
      {
        q: "A resistor is pushed into a breadboard with both of its legs in the same row of five. What is the effect?",
        options: [
          "The resistance doubles",
          "The resistor overheats",
          "The resistor is bypassed, because the row itself joins its two legs",
          "The resistor works normally",
        ],
        answer: 2,
        why: "Holes in one row share a metal clip. Current takes that clip instead of passing through the resistor.",
      },
      {
        q: "The LED at one end of a long breadboard lights, but an identical circuit at the other end, fed from the same rails, does not. The board's supply and GND each have one jumper to the rails. What is the most likely cause?",
        options: [
          "The power rails are split at the middle, so the far half is not connected",
          "The far LED needs more voltage",
          "Breadboards only work at one end",
          "The USB cable is too short",
        ],
        answer: 0,
        why: "Many long breadboards break each rail at the centre. Without a bridging jumper, the far half receives neither supply nor ground.",
      },
      {
        q: "A sensor has its supply wire and its signal wire connected, but its ground wire was forgotten. What should you expect?",
        options: [
          "It works, but more slowly",
          "It works, because ground is optional for sensors",
          "It reads double the true value",
          "It does not work properly, because there is no return path and no shared zero to measure against",
        ],
        answer: 3,
        why: "Current needs a complete loop back to the supply, and the signal voltage only has meaning relative to a ground shared with the board.",
      },
      {
        q: "The moment a student plugs in the USB cable, the board's power light goes out and the computer reports a problem with the USB port. What should they look for first?",
        options: [
          "A missing resistor on one LED",
          "A wire or part joining a supply rail directly to the ground rail",
          "An LED fitted backwards",
          "A program with no Sleep block",
        ],
        answer: 1,
        why: "The supply collapsing at once is the sign of a short circuit: a path from supply to ground with almost no resistance, drawing a very large current.",
      },
    ],
  },

  "b2-safety-and-measuring": {
    id: "b2-safety-and-measuring",
    outcomes: [
      "Follow a fixed routine that prevents the usual ways of damaging a board",
      "Measure a DC voltage with a multimeter, with the probes and range set correctly",
      "Use the continuity setting to check a wire or a breadboard connection",
      "Use measured voltages to work out the current in an LED circuit",
    ],
    blocks: [
      { t: "h", text: "Habits protect better than luck" },
      { t: "p", text: "Almost every damaged board in a first year lab was damaged in one of a handful of ways, and each one is prevented by a habit rather than by skill. Learn the routine once and follow it every time, even when you are in a hurry." },
      { t: "list", ordered: true, items: [
        "**Unplug before you touch the wiring.** Add, move or remove wires only with the USB cable out.",
        "**Look before you power.** Trace supply to ground once. Check nothing joins them directly.",
        "**Every LED has its resistor.** 220 Ω to 330 Ω, in series.",
        "**Respect the ESP32's limit.** No ESP32 pin ever sees more than 3.3 V.",
        "**A pin is a signal, not a power supply.** Plan on no more than about 20 mA from one pin (a typical working limit): enough for an LED with a resistor, never for a motor.",
        "**Keep the bench clear.** A board resting on a stray resistor leg, a foil wrapper or a metal pencil case can be shorted from underneath.",
        "**If something smells hot or feels hot, unplug first** and investigate afterwards.",
      ] },
      { t: "note", kind: "safety", text: "This course uses only the low voltage from a USB cable or small batteries. Mains electricity from a wall socket is never used, and a multimeter from the kit must never be pushed into a socket." },

      { t: "h", text: "What a multimeter is for" },
      { t: "p", text: "You cannot see electricity. When a circuit misbehaves, guessing is slow. A **multimeter** lets you check the facts: is 3.3 V really arriving here, is this wire broken inside, is this resistor the value I think it is. In this course you will use three of its settings." },
      { t: "table", head: ["Setting", "Symbol on the dial", "Answers the question", "Circuit power"], rows: [
        ["DC voltage", "V with a straight line", "How many volts are between these two points?", "**On**"],
        ["Continuity", "A sound wave or diode symbol", "Are these two points joined?", "**Off**"],
        ["Resistance", "Ω", "What value is this resistor?", "**Off**, part removed from the circuit"],
      ] },
      { t: "p", text: "Plug the **black** lead into the socket marked COM and the **red** lead into the socket marked V or VΩ. Leave them there. The other sockets are for measuring current, which this course does not do directly." },

      { t: "h", text: "Measuring voltage" },
      { t: "p", text: "Voltage exists between two points, so a voltage measurement always uses both probes. You do not break the circuit. You touch the probes to two points of the working circuit, **across** the part you are interested in." },
      { t: "list", ordered: true, items: [
        "Turn the dial to DC voltage. If the meter has several ranges, choose the smallest one that is **above** what you expect. For this course that is usually the 20 V range.",
        "Touch the black probe to GND and the red probe to the point you want to know about.",
        "Read the display. A minus sign only means the probes are the other way round.",
      ] },
      { t: "p", text: "Measuring from GND tells you the voltage at a point. Measuring with one probe on each leg of a part tells you the voltage **across** that part." },

      { t: "h", text: "A worked measurement" },
      { t: "p", text: "Take the always-on LED circuit from the last lesson, built on a 5 V supply with a 330 Ω resistor. Suppose you measure these three values:" },
      { t: "table", head: ["Probes placed", "Example reading"], rows: [
        ["Red rail to blue rail", "5.0 V"],
        ["Across the resistor", "3.1 V"],
        ["Across the LED", "1.9 V"],
      ], caption: "Example figures. Your readings will differ a little with the LED, the resistor and the board." },
      { t: "p", text: "Two things can be read from this. First, 3.1 + 1.9 = 5.0: the voltages across the parts of a series loop **add up to the supply**. If yours do not, a probe was in the wrong place. Second, Ohm's law on the resistor gives the current without ever measuring current: 3.1 / 330 is about 0.0094 A, so about 9 mA. The LED carries the same current, because it is in the same loop." },
      { t: "note", kind: "tip", text: "This is the standard way to find a current safely: measure the voltage across a known resistor and divide. It needs no change to the circuit." },

      { t: "h", text: "Continuity: is it really connected" },
      { t: "p", text: "On the continuity setting the meter beeps when its two probes are joined by a path of very low resistance. Touch the probes together to hear it. Use it, with the circuit **unpowered**, to answer questions such as:" },
      { t: "list", items: [
        "Is this jumper wire broken inside its insulation? Probe both ends.",
        "Are these two breadboard holes joined? Push a short wire into each and probe the wires.",
        "Is the power rail continuous from end to end, or split in the middle?",
        "Have I accidentally joined supply to ground? Probe the two rails: a beep means a short, so do not plug in.",
      ] },

      { t: "h", text: "Two things never to do with the meter" },
      { t: "list", items: [
        "**Never use the current (A or mA) setting or sockets across a supply.** In that mode the meter is almost a plain wire. Probes placed from supply to ground would be a short circuit through the meter.",
        "**Never use continuity or resistance on a powered circuit.** The reading is meaningless and the meter can be harmed. Unplug the USB cable first.",
      ] },
    ],
    mistakes: [
      "**Red lead left in a current socket.** The meter then acts like a wire, and trying to measure voltage shorts the supply. Check the leads are in COM and V before every session.",
      "**Dial on AC voltage.** The reading shows zero or nonsense on a DC circuit. Use the V with a straight line, not the wavy one.",
      "**Range set too low.** The display shows 1 or OL, meaning out of range. Move to a higher range.",
      "**Measuring resistance with the part still in a powered or connected circuit.** Other paths around the part change the reading. Take the part out first.",
      "**Probes slipping and bridging two pins.** Hold the probe on a jumper wire or a component leg rather than directly on tightly packed header pins.",
    ],
    practice: {
      kind: "bench",
      task: "Measure the always-on LED circuit you left built in the last lesson and check it against Ohm's law.",
      steps: [
        "With the USB cable unplugged, set the meter to continuity. Confirm the red rail and blue rail do **not** beep together.",
        "Still unplugged, pull the resistor out and measure it on the Ω setting. Write the value down and put it back.",
        "Plug in the USB cable. Set the meter to DC voltage and measure from the red rail to the blue rail.",
        "Measure the voltage across the resistor, then across the LED. Write both down.",
        "Add the two readings. Compare the total with the supply reading from step 3.",
        "Divide the resistor's voltage by its measured resistance to find the current in amps, then convert to milliamps. Is it within the 5 mA to 10 mA range you would expect?",
      ],
    },
    quiz: [
      {
        q: "In a working series LED circuit on a 5 V supply, a student measures 2.0 V across the LED. What should the meter show across the resistor?",
        options: ["0 V", "2.0 V", "5.0 V", "About 3.0 V"],
        answer: 3,
        why: "The voltages across the parts of a series loop add up to the supply, so the resistor has about 5 - 2 = 3 V across it.",
      },
      {
        q: "The voltage across a 220 Ω resistor in series with an LED is measured as 1.1 V. What current flows through the LED?",
        options: ["5 mA", "0.5 mA", "242 mA", "200 mA"],
        answer: 0,
        why: "1.1 / 220 = 0.005 A, which is 5 mA. The LED is in the same loop, so it carries the same current.",
      },
      {
        q: "A student wants to know how much current the 5 V pin can give, so sets the meter to its current setting and touches the probes to the 5 V pin and GND. What is wrong with this?",
        options: [
          "Nothing, this is the correct method",
          "The reading will be in the wrong units",
          "On the current setting the meter is almost a plain wire, so this shorts 5 V to GND",
          "The meter needs to be on AC",
        ],
        answer: 2,
        why: "A meter set to measure current has very little resistance. Placing it straight across a supply creates a short circuit through the meter.",
      },
      {
        q: "An LED circuit looks right but stays dark. With power on, the meter shows the full supply voltage between the rails and 0 V across both the resistor and the LED. What does that suggest?",
        options: [
          "The LED is too bright to see",
          "The loop is broken somewhere, such as a loose jumper, so no current flows",
          "The resistor value is too small",
          "The supply voltage is too high",
        ],
        answer: 1,
        why: "No voltage across the resistor means no current through it. The supply is present, so the fault is a gap in the loop, and the missing volts appear across that gap.",
      },
    ],
  },
};

export default lessons;
