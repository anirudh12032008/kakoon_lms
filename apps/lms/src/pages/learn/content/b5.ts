import type { ModuleContent } from "../model/curriculum";

/**
 * Module b5: Analog input.
 * Rules for lesson text: original wording, no pin numbers or board-specific
 * numbers in prose (use `wiring` / `code` blocks), teach how to find a
 * threshold rather than quoting one.
 */
const lessons: ModuleContent = {
  "b5-analog-and-the-adc": {
    id: "b5-analog-and-the-adc",
    outcomes: [
      "Tell an analog signal from a digital one and give an example of each",
      "Explain what an analog to digital converter does, using its reference and its number of steps",
      "Work out the size of one step and turn a reading back into a voltage",
      "Say why the same voltage gives different numbers on an Arduino Uno and an ESP32",
    ],
    blocks: [
      { t: "h", text: "The world is not on or off" },
      { t: "p", text: "A button is pressed or it is not. That is a **digital** signal: two possible values. Most things worth measuring are not like that. Light fades gradually at dusk. A water tank is a quarter full, then half, then nearly full. These are **analog** quantities: they can take any value in a range and they change smoothly." },
      { t: "p", text: "Sensors for analog quantities produce an analog **voltage**, one that can sit anywhere between ground and the supply. A digital input would crush that into a single 0 or 1 and throw the detail away. To keep the detail the board needs a different kind of input." },

      { t: "h", text: "The ADC is a ruler for voltage" },
      { t: "p", text: "A processor can only store numbers. The part that turns a voltage into a number is the **analog to digital converter**, or **ADC**. Think of it as a ruler laid alongside the voltage. The ruler has a fixed length and a fixed number of marks, and the ADC reports which mark the voltage reaches." },
      { t: "list", items: [
        "The length of the ruler is the **reference voltage**: the highest voltage the ADC can measure. A voltage at or above the reference gives the largest number.",
        "The number of marks is the **resolution**. It is given in bits. Each extra bit doubles the number of steps: 10 bits give 1024 steps and 12 bits give 4096.",
      ] },
      { t: "table", head: ["Board", "Resolution", "Number of steps", "Readings run from", "Reference (top of the ruler)"], rows: [
        ["Arduino Uno", "10 bits", "1024", "0 to 1023", "5 V"],
        ["ESP32", "12 bits", "4096", "0 to 4095", "about 3.3 V"],
      ], caption: "On the ESP32 these are the numbers given by this site's analog blocks. One block is an exception: the Soil Moisture Sensor block reports 0 to 65535 on the ESP32. The range depends on the block, so always look at the live chart to see what yours gives." },

      { t: "h", text: "How big is one step?" },
      { t: "p", text: "Divide the length of the ruler by the number of marks:" },
      { t: "formula", text: "step size = reference voltage / number of steps", caption: "The smallest change in voltage the ADC can notice." },
      { t: "p", text: "For the Arduino Uno that is 5 V / 1024, which is about 0.0049 V, or roughly **5 mV** per step. For the ESP32 it is 3.3 V / 4096, which is about 0.0008 V, or roughly **0.8 mV** per step. The ESP32 has a shorter ruler with more marks on it, so its marks are much closer together." },
      { t: "p", text: "A change smaller than one step is invisible. That is rarely a problem in this course, because the sensors you will use change by hundreds of steps." },

      { t: "h", text: "From a reading back to a voltage" },
      { t: "p", text: "Multiply the reading by the step size, which is the same as:" },
      { t: "formula", text: "voltage = reading × reference voltage / number of steps" },
      { t: "p", text: "Two worked examples. An Arduino Uno reads 512: 512 × 5 / 1024 = **2.5 V**, half the reference, which makes sense because 512 is half of 1024. An ESP32 reads 1024: 1024 × 3.3 / 4096 = **0.825 V**, a quarter of its reference." },
      { t: "p", text: "Now turn it round. Put the same 1.65 V on both boards. The Uno reports about 338 and the ESP32 about 2048. The voltage is identical. The numbers differ because the rulers differ. This is why a number that works in a program for one board cannot simply be copied to the other." },
      { t: "note", kind: "warn", text: "Real readings are never perfectly steady. Expect the last digit or two to jitter even when nothing changes. The ESP32's converter is also less accurate near the very bottom and very top of its range. Treat a reading as a good estimate, not an exact measurement." },

      { t: "h", text: "Which pins, and how much voltage" },
      { t: "p", text: "Only some pins are connected to the ADC. On the Arduino Uno they are the pins in the group labelled as analog inputs. On the ESP32 several pins can do it, and some of those are input-only. You do not need to memorise them: use the pin shown on the block or in a lesson's wiring table." },
      { t: "note", kind: "safety", text: "The reference is also a limit. On an ESP32 no pin may ever see more than 3.3 V, so an analog sensor must be powered from the 3.3 V pin or have its output divided down. On an Arduino Uno the limit is 5 V. A voltage above the limit does not give a bigger number. It damages the pin." },

      { t: "h", text: "Seeing it in a program" },
      { t: "p", text: "This is the street light program you will build in the next lesson, generated for your board. For now find just one line: the one inside the loop that takes an analog reading and stores it in the variable `light`. Everything in this lesson happens in that single line." },
      { t: "code", demo: "demo_street_light" },
      { t: "p", text: "The line that prints `SENSOR` sends each reading to the computer. The editor draws those readings as the **live chart**, which you will use in every lesson of this module." },
    ],
    mistakes: [
      "**Expecting volts.** The program receives a step count, not a voltage. A reading of 512 does not mean 512 of anything until you apply the formula.",
      "**Copying a number from the other board.** The two boards count on different scales, so the same voltage gives a much larger number on the ESP32 than on the Uno.",
      "**Leaving the analog pin unconnected.** A floating analog pin gives readings that wander slowly and react to your hand, just like a floating digital pin but with more digits.",
      "**Using a pin that has no ADC.** The reading stays at one value whatever you do. Use the pin the block shows.",
      "**Trusting the top of the range.** A reading stuck at the maximum means the voltage is at or above the reference. The real value could be anything higher, and on an ESP32 it may already be harming the pin.",
    ],
    practice: {
      kind: "build",
      task: "Predict three readings with the formula, then check them against the board.",
      steps: [
        "Drag a **Forever Loop** onto the canvas and put an **Analog Sensor** block inside it. Note the pin the block shows.",
        "Unplug USB. Connect a jumper from that pin to **GND**. Plug in, run the program and read the value on the live chart. It should be at or very near 0.",
        "Unplug USB. Move the jumper's other end from GND to the **3.3 V** pin. Before you run it, calculate what you expect: on an ESP32 this is the top of the ruler, and on an Arduino Uno it is 3.3 V measured against a 5 V reference.",
        "Run it and compare the reading with your prediction. A difference of a few percent is normal.",
        "Unplug USB and remove the jumper so the pin is connected to nothing. Run it once more and watch the chart while you move your hand near the pin. This is what a floating analog input looks like.",
        "Never move the jumper to the 5 V pin on an ESP32.",
      ],
    },
    quiz: [
      {
        q: "An ADC has a 5 V reference and 1024 steps. Roughly how large is one step?",
        options: ["0.5 mV", "5 mV", "50 mV", "0.5 V"],
        answer: 1,
        why: "Step size is the reference divided by the number of steps: 5 / 1024 is about 0.0049 V, which is roughly 5 mV.",
      },
      {
        q: "An ESP32 analog block (3.3 V reference, 4096 steps) reports 2048. What voltage is on the pin?",
        options: ["About 3.3 V", "About 2.0 V", "About 0.8 V", "About 1.65 V"],
        answer: 3,
        why: "2048 is half of 4096, so the voltage is half the reference: 2048 × 3.3 / 4096 = 1.65 V.",
      },
      {
        q: "The same sensor circuit gives 300 on an Arduino Uno. A classmate moves the program, unchanged, to an ESP32 where the circuit is powered from 3.3 V. Why might the program now behave differently?",
        options: [
          "The ESP32 counts in a different range, so the same light level produces a different number",
          "The ESP32 cannot read analog sensors",
          "The sensor needs time to warm up",
          "The loop runs too fast on an ESP32",
        ],
        answer: 0,
        why: "The reference and the number of steps both differ between the boards, so a comparison number chosen on one board means something else on the other.",
      },
      {
        q: "An analog reading on an ESP32 sits at exactly 4095 and does not move when the sensor changes. What is the most sensible conclusion?",
        options: [
          "The sensor is perfectly accurate",
          "The ADC has switched itself off",
          "The voltage is at or above the top of the range, so the pin may be seeing too much voltage",
          "The program is missing a delay",
        ],
        answer: 2,
        why: "The largest number means the voltage has reached the reference. The ADC cannot report anything higher, and on an ESP32 a voltage above 3.3 V can damage the pin.",
      },
    ],
  },

  "b5-voltage-divider-and-ldr": {
    id: "b5-voltage-divider-and-ldr",
    outcomes: [
      "Explain why a resistive sensor needs a second resistor before a board can read it",
      "Work out the output voltage of a voltage divider",
      "Wire a light dependent resistor (LDR) to an analog pin",
      "Read the generated program for the automatic street light line by line",
    ],
    blocks: [
      { t: "h", text: "The problem: a pin measures voltage, not resistance" },
      { t: "p", text: "A light dependent resistor, or **LDR**, is a small part whose resistance changes with light. In bright light its resistance is low, often a few hundred ohms. In darkness it is high, often hundreds of thousands of ohms." },
      { t: "p", text: "That sounds like exactly what a street light needs. The catch is that an analog pin cannot measure resistance. It can only measure **voltage**. So the job is to turn a changing resistance into a changing voltage, and the circuit that does it is the **voltage divider**." },

      { t: "h", text: "The voltage divider" },
      { t: "p", text: "Put two resistors in series between the supply voltage and ground. The same current flows through both, so by Ohm's law each one drops a share of the voltage in proportion to its resistance. The point between them sits at a voltage somewhere between the supply and ground." },
      { t: "formula", text: "Vout = Vin × R2 / (R1 + R2)", caption: "`R1` is the resistor connected to the supply, `R2` the one connected to ground, and `Vout` is measured at the point where they meet." },
      { t: "p", text: "Check it with easy numbers. If `R1` and `R2` are equal, the fraction is one half, so `Vout` is half of `Vin`. If `R2` is much larger than `R1`, the fraction is close to one and `Vout` is close to `Vin`. If `R2` is much smaller, `Vout` is close to zero." },
      { t: "note", kind: "tip", text: "You do not need to memorise which way round it goes. Ask one question: which resistor is bigger? The bigger resistor takes the bigger share of the voltage." },

      { t: "h", text: "Making one resistor the sensor" },
      { t: "p", text: "Now replace one of the two resistors with the LDR and keep the other as an ordinary fixed resistor. As the light changes, the LDR's share of the voltage changes, and `Vout` moves up and down. That moving voltage is what the analog pin reads." },
      { t: "p", text: "There are two ways to arrange it, and they behave in opposite directions:" },
      { t: "table", head: ["Arrangement", "In bright light", "In darkness"], rows: [
        ["LDR to the supply, fixed resistor to ground", "LDR is small, so `Vout` is **high**", "LDR is large, so `Vout` is **low**"],
        ["Fixed resistor to the supply, LDR to ground", "LDR is small, so `Vout` is **low**", "LDR is large, so `Vout` is **high**"],
      ], caption: "The street light project in this course uses the first arrangement: a darker room gives a lower reading." },
      { t: "p", text: "Neither is more correct. What matters is that you know which one you built, because it decides whether your program should switch the light on when the reading goes **below** a value or **above** it." },

      { t: "h", text: "Choosing the fixed resistor" },
      { t: "p", text: "The divider gives the biggest swing in voltage when the fixed resistor is roughly in the middle of the LDR's range. A common starting value is **10 kΩ**. If your readings barely change between light and dark, the fixed resistor is too far from the LDR's working range, so try a larger or smaller one." },
      { t: "note", kind: "warn", text: "LDRs vary a lot from part to part, and so does the lighting in your room. The resistances quoted here are typical values, not a specification. Always look at your own readings before choosing a threshold. The next lesson shows how." },

      { t: "h", text: "Wiring it" },
      { t: "list", ordered: true, items: [
        "Connect one leg of the LDR to the board's **3.3 V** pin on an ESP32, or the **5 V** pin on an Arduino Uno. An LDR has no polarity, so either leg will do.",
        "Connect the other leg of the LDR to a free row on the breadboard. This row is the middle point of the divider.",
        "Connect the **10 kΩ** resistor from that same row to **GND**.",
        "Run a jumper from the middle row to the analog pin shown in the table below.",
        "For the lamp, connect the LED's longer leg through a **220 Ω to 330 Ω** resistor to the output pin in the table, and its shorter leg to **GND**.",
      ] },
      { t: "wiring", demo: "demo_street_light" },
      { t: "note", kind: "safety", text: "On an ESP32, never feed more than 3.3 V into any pin. Power the divider from the 3.3 V pin, not the 5 V pin. An LED always needs its series resistor: without one it draws too much current and can damage the LED and the pin." },

      { t: "h", text: "Reading the program" },
      { t: "p", text: "This is the program the editor generates for the automatic street light on the board you selected. Change the board at the top of the page and it changes with you." },
      { t: "code", demo: "demo_street_light" },
      { t: "p", text: "Read it in four parts:" },
      { t: "list", ordered: true, items: [
        "**Setup.** The lines before the loop run once. They make the LED's pin an output. On the ESP32 they also prepare the analog input; on the Arduino Uno an analog reading needs no setup line.",
        "**Measure.** Inside the loop, the board samples the voltage at the middle of the divider and stores it as a number in the variable `light`. A bigger number means a higher voltage.",
        "**Decide.** The `if` compares `light` with a threshold. Because of the way this divider is arranged, a low number means darkness, so the test is \"is `light` below the threshold?\"",
        "**Act, then wait.** The LED is switched on or off, and the program pauses briefly before measuring again.",
      ] },
      { t: "p", text: "The line that prints `SENSOR` sends each reading to the computer. That is what feeds the live chart in the editor, and it is the tool you will use to pick a sensible threshold." },
    ],
    mistakes: [
      "**Reading a floating pin.** If the fixed resistor is missing or in the wrong row, the analog pin is connected to nothing through the LDR alone and the readings jump around at random.",
      "**The logic is backwards.** The lamp turns on in daylight. You built the other arrangement of the divider. Either swap the LDR and the resistor, or change the comparison from below to above.",
      "**Using a digital-only or output-only pin.** Only some pins can measure voltage. Use the pin in the wiring table.",
      "**The LDR sees its own lamp.** If the LED shines on the LDR, the reading rises, the lamp turns off, the reading falls, and the lamp flickers. Point them away from each other.",
      "**Copying someone else's threshold.** It was right for their sensor in their room. Yours will be different.",
    ],
    practice: {
      kind: "project",
      demo: "demo_street_light",
      task: "Open the automatic street light project, wire it as above, and run it. Cover the LDR with your hand and watch the reading change on the live chart. Note the number you see in room light and the number you see when covered: you will need both in the next lesson.",
    },
    quiz: [
      {
        q: "Why can an LDR not be connected to an analog pin on its own?",
        options: [
          "An LDR produces too much voltage for the pin",
          "The pin measures voltage, and an LDR on its own only changes resistance",
          "LDRs only work with digital pins",
          "The pin would overheat",
        ],
        answer: 1,
        why: "An analog pin measures voltage. The fixed resistor turns the LDR's changing resistance into a changing voltage.",
      },
      {
        q: "A divider has `R1` = 10 kΩ to the supply and `R2` = 10 kΩ to ground. The supply is 5 V. What is `Vout`?",
        options: ["0 V", "2.5 V", "5 V", "10 V"],
        answer: 1,
        why: "Equal resistors share the voltage equally: 5 × 10 / (10 + 10) = 2.5 V.",
      },
      {
        q: "The LDR is connected to the supply and the fixed resistor to ground. The room goes dark. What happens to the reading?",
        options: [
          "It goes up, because the LDR's resistance rises",
          "It goes down, because the LDR now takes a bigger share of the voltage",
          "It stays the same",
          "It becomes random",
        ],
        answer: 1,
        why: "In the dark the LDR's resistance is large, so most of the voltage drops across it and little is left across the fixed resistor where the pin measures.",
      },
      {
        q: "Your lamp switches on in bright light and off in the dark. What is the simplest fix in the program?",
        options: [
          "Add a longer delay",
          "Use a different LED",
          "Change the comparison from \"below\" to \"above\"",
          "Remove the threshold",
        ],
        answer: 2,
        why: "The divider is arranged the other way round, so darkness gives a high reading. Reversing the comparison matches the program to the circuit.",
      },
    ],
  },

  "b5-choosing-thresholds": {
    id: "b5-choosing-thresholds",
    outcomes: [
      "Find the reading a sensor gives in each condition by watching the live chart",
      "Place a threshold between two sets of readings with a margin on both sides",
      "Decide whether the comparison should be below or above",
      "Explain why a reading near the threshold makes an output flicker, and how hysteresis cures it",
    ],
    blocks: [
      { t: "h", text: "A threshold is a line you draw" },
      { t: "p", text: "At the end of the last lesson you wrote down two numbers: the reading in room light and the reading with the LDR covered. The street light has to turn that smoothly changing number into a yes or no: lamp on, or lamp off. It does so by comparing the reading with one fixed number, the **threshold**." },
      { t: "p", text: "Nobody can tell you what that number should be. It depends on your LDR, your resistor, your board and the lighting in your room. The number already filled in when you open a built-in project is a **starting guess** so that the project does something on the first run. It is not the right answer, and neither is the number on the next bench. This lesson gives you the method for finding your own." },

      { t: "h", text: "Step 1: watch before you decide" },
      { t: "p", text: "Run the project and open the live chart. Do nothing clever yet. Just watch the line for half a minute in each condition you care about. For the street light the two conditions are \"light enough that the lamp should be off\" and \"dark enough that the lamp should be on\"." },
      { t: "p", text: "You will notice the line is not flat. It wobbles. That wobble is noise, and the whole method exists because of it." },

      { t: "h", text: "Step 2: record a range for each condition" },
      { t: "p", text: "For each condition write down the **lowest** and the **highest** value you see, not a single number. Repeat it a few times: uncover and cover the sensor again, let someone walk past, switch the room light. A table like this is enough:" },
      { t: "table", head: ["Condition", "Lowest seen", "Highest seen"], rows: [
        ["Covered (dark)", "180", "260"],
        ["Room light", "700", "760"],
      ], caption: "Invented readings to show the method. Yours will be different, and so will your neighbour's." },

      { t: "h", text: "Step 3: put the line in the gap" },
      { t: "p", text: "Look at the space between the two ranges. In the example the dark readings never go above 260 and the light readings never go below 700. Any threshold inside that gap separates the two conditions. The middle of the gap gives the most room for error on both sides:" },
      { t: "formula", text: "threshold = (top of the low range + bottom of the high range) / 2", caption: "With the example readings: (260 + 700) / 2 = 480." },
      { t: "p", text: "The distance from the threshold to each range is your **margin**. Here it is 220 steps on each side, which is comfortable: the readings would have to drift a long way before the lamp made a mistake. The middle is a sensible first choice, not a rule. If you want the lamp to come on earlier in the evening, move the line toward the light range, but keep it clear of the wobble you recorded." },
      { t: "note", kind: "warn", text: "If the two ranges overlap, or the gap is only a few steps wide, no number will work reliably. Fix the measurement instead: change the fixed resistor, shade the sensor from the lamp, move it, or check the wiring. Do not hunt for a magic number." },

      { t: "h", text: "Step 4: check the direction" },
      { t: "p", text: "A threshold is only half of the condition. The other half is the comparison. Ask: in the condition where the output should be **on**, is the reading on the low side or the high side of the line? In the street light, dark gives the low readings, so the test is \"is `light` below the threshold?\". A sensor whose reading rises when the thing you care about happens needs \"above\" instead." },
      { t: "p", text: "This is where the number lives in the program. Find the `if` line and you will see the starting guess for your board:" },
      { t: "code", demo: "demo_street_light" },
      { t: "p", text: "In the editor you change it on the **If-Else** block: the right side of the condition is the threshold and the symbol in the middle is the direction." },

      { t: "h", text: "Step 5: test, then test again later" },
      { t: "p", text: "Put your number in, run the project and try both conditions several times. Then try the awkward cases: a half-covered sensor, a cloudy window, a phone torch. Conditions drift, too. Daylight changes through the day and some sensors change as they warm up. A threshold chosen at noon may need another look at five o'clock. Re-measuring is part of the job, not a sign that you did it wrong." },

      { t: "h", text: "Flicker and hysteresis" },
      { t: "p", text: "When the real reading sits right on the threshold, the wobble carries it back and forth across the line and the output chatters on and off. The cure is **hysteresis**: use two thresholds instead of one. Switch on only when the reading passes the first, and switch off only when it has come back past a second one some distance away. In the example you might switch the lamp on below 430 and off only above 530. Inside that band the output simply keeps whatever state it had, so noise smaller than the band cannot flip it. A room thermostat works the same way." },
    ],
    mistakes: [
      "**Using the number that came with the project.** It was chosen so the demo would do something on a typical bench. Measure your own.",
      "**Recording one reading per condition.** A single number hides the wobble, and the wobble is what causes flicker. Record a lowest and a highest.",
      "**Placing the threshold at the edge of a range.** The output is right most of the time and wrong now and then. Leave a margin on both sides.",
      "**Carrying a threshold to the other board.** The Arduino Uno and the ESP32 count in different ranges, so the same light level gives different numbers. Measure again.",
      "**Tuning with your hand over the sensor, then walking away.** Your shadow was part of the measurement. Check the readings again with the setup as it will really be used.",
    ],
    practice: {
      kind: "project",
      demo: "demo_street_light",
      task: "Open the automatic street light project with the circuit from the previous lesson. Watch the live chart and fill in your own table: lowest and highest reading in room light, lowest and highest reading with the sensor covered. Calculate the middle of the gap, type it into the right side of the If-Else block, and test it ten times. Then hold your hand so the reading sits close to your threshold and watch the LED flicker: that is the problem hysteresis solves.",
    },
    quiz: [
      {
        q: "A sensor reads 250 to 310 in one condition and 590 to 650 in the other. Using the method from this lesson, what is a sensible first threshold?",
        options: ["280", "310", "450", "620"],
        answer: 2,
        why: "Take the middle of the gap between the ranges: (310 + 590) / 2 = 450. That leaves 140 steps of margin on each side.",
      },
      {
        q: "Your readings are 410 to 470 in the dry condition and 450 to 520 in the wet condition. What should you do?",
        options: [
          "Use 460, the middle of the overlap",
          "Use the number that came with the project",
          "Add a longer delay to the loop",
          "Improve the circuit or the sensor's position, because the ranges overlap and no single number separates them",
        ],
        answer: 3,
        why: "When the ranges overlap, every possible threshold misclassifies some readings. The measurement has to be improved before a threshold can work.",
      },
      {
        q: "A lamp flickers rapidly at dusk but behaves perfectly in full daylight and full darkness. What is happening?",
        options: [
          "The reading is hovering around the threshold and noise keeps carrying it across the line",
          "The LED resistor is too large",
          "The ADC is broken",
          "The loop is running too slowly",
        ],
        answer: 0,
        why: "Near the threshold the normal wobble of the reading is enough to cross it repeatedly. Two thresholds with a band between them, hysteresis, stop this.",
      },
      {
        q: "A friend says: \"Just use 512, it is the middle of the range on an Uno, so it is always right.\" What is wrong with that?",
        options: [
          "512 is not the middle of the range",
          "The middle of the ADC's range has nothing to do with where your sensor's two conditions happen to fall",
          "Thresholds must be odd numbers",
          "Nothing, it is good advice",
        ],
        answer: 1,
        why: "A threshold has to sit between the readings your own sensor gives in your own conditions. Those can lie anywhere in the range, so they must be measured.",
      },
    ],
  },

  "b5-analog-sensor-modules": {
    id: "b5-analog-sensor-modules",
    outcomes: [
      "Describe what a sensor module adds to a bare sensor and identify its power, ground and analog output pins",
      "Predict which way the reading moves for gas, rain, water level and soil sensors",
      "Power an analog module safely on an Arduino Uno and on an ESP32",
      "Read the rain detector program and adapt the same pattern to another sensor",
    ],
    blocks: [
      { t: "h", text: "The same idea in different clothes" },
      { t: "p", text: "The LDR needed you to build a voltage divider around it. Most classroom sensors are sold as **modules**: a small board that already carries the sensing part, the divider and often an amplifier. The module does the electrical work and hands you a voltage. That is why four sensors that look nothing alike can all be read in exactly the same way." },
      { t: "p", text: "Nearly every one of these modules has the same pins:" },
      { t: "list", items: [
        "**VCC** (sometimes marked +): power in.",
        "**GND** (sometimes marked -): ground.",
        "**AO**, analog out: a voltage that moves smoothly with the thing being sensed. This is the pin used in this lesson.",
        "**DO**, digital out, on many modules: a ready-made 0 or 1 from an on-board comparator, with a small adjuster that sets its switching point. Handy, but it hides the readings from you, so this course uses AO and chooses the threshold in the program.",
      ] },

      { t: "h", text: "Four sensors side by side" },
      { t: "table", head: ["Sensor", "What it reacts to", "How it works", "Reading in this course's projects"], rows: [
        ["Gas (MQ-2, MQ-135)", "Smoke and some gases and vapours in the air", "A heated element whose resistance changes when gas reaches it", "**Rises** with more gas"],
        ["Rain board", "Water drops on its surface", "Drops bridge two sets of metal tracks, so the resistance between them falls", "**Falls** when wet"],
        ["Water level strip", "How much of the strip is under water", "Water joins the parallel tracks; deeper water joins more of them", "**Rises** with deeper water"],
        ["Soil moisture probe", "Water in the soil between its two legs", "Wet soil conducts better than dry soil", "**Rises** as the soil dries"],
      ], caption: "Directions are for the common modules used with the built-in projects. Confirm yours on the live chart: some modules are built the other way round." },
      { t: "p", text: "The direction decides the comparison. Gas and water level trigger when the reading goes **above** the threshold. Rain triggers when it goes **below**. You find the threshold itself with the method from the previous lesson: record the reading in each condition and put the line in the gap. The numbers filled in when you open these projects are starting guesses only." },
      { t: "note", kind: "tip", text: "Soil moisture has its own block and its own project in module b7. On the ESP32 that block reports a larger range (0 to 65535) than the other analog blocks (0 to 4095). The range depends on the block, so read the chart before choosing any number." },

      { t: "h", text: "Powering a module safely" },
      { t: "p", text: "A module's analog output can swing up to its supply voltage. That one fact decides how you power it:" },
      { t: "table", head: ["Board", "Rain, water level, soil", "Gas (MQ type)"], rows: [
        ["Arduino Uno", "VCC to 5 V", "VCC to 5 V"],
        ["ESP32", "VCC to **3.3 V**, so the output cannot exceed 3.3 V", "VCC to 5 V because the heater needs it, and the output goes through a **voltage divider** before the pin"],
      ] },
      { t: "p", text: "For the gas sensor on an ESP32, use the divider from two lessons ago: a **1 kΩ** resistor from AO to the analog pin, and a **2 kΩ** resistor from the analog pin to GND. Check it with the formula: 5 V × 2 / (1 + 2) = 3.33 V at most. The readings are scaled down by the same fraction, which does not matter because you measure your own threshold anyway." },
      { t: "note", kind: "safety", text: "An MQ gas sensor has a heater inside. The metal cap gets **hot**: do not touch it, and keep it away from paper and plastic. It needs to warm up, typically a few minutes, before its readings settle, and it draws far more current than other sensors (typically around 150 mA). It is a demonstration part. It is **never** a real gas or smoke alarm, and you must not release gas from a lighter or cylinder to test it. A cotton bud with a drop of hand sanitiser held a few centimetres from the cap, never touching it, is enough to see the reading move." },

      { t: "h", text: "Wiring the rain detector" },
      { t: "list", ordered: true, items: [
        "Unplug the USB cable.",
        "If the rain board is separate from its small control board, join the two with the pair of wires supplied. Either way round is fine.",
        "Connect the module's **VCC** to **3.3 V** on an ESP32, or **5 V** on an Arduino Uno, and **GND** to **GND**.",
        "Connect **AO** to the analog pin shown in the table below.",
        "Connect the buzzer, after reading the note below the table. A small active buzzer has its longer leg (marked +) on the output pin in the table and its shorter leg on **GND**. A buzzer module has its signal pin on that output pin.",
        "Keep the board, the breadboard and the control board away from the water. Only the rain board gets wet. Plug USB back in.",
      ] },
      { t: "wiring", demo: "demo_rain_detector" },
      { t: "note", kind: "safety", text: "The buzzer in these projects is switched by a pin, so it must be a light load. Use a **buzzer module** (three pins, with its own transistor: VCC and GND to the supply, signal to the pin) or a small active buzzer that you know draws less than about 20 mA. A larger or unknown buzzer goes through a transistor, as module b7 explains, never straight onto a pin. Two things to know about modules: many sound when their signal is **LOW**, so the alarm works backwards until you set the two blocks that switch the buzzer pin the other way round, and on an ESP32 the module is powered from 3.3 V. This applies to the rain, gas and water level projects alike." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_rain_detector" },
      { t: "list", ordered: true, items: [
        "**Setup.** The first lines make the buzzer pin an output. On the ESP32 they also prepare the analog input.",
        "**Measure.** Each pass of the loop reads the module's output into the variable `rain`.",
        "**Report.** The `SENSOR` line sends `rain` to the live chart. This is the line that lets you choose a threshold.",
        "**Decide.** `rain` is compared with the threshold using **below**, because this board reads lower when it is wet.",
        "**Act.** When it is wet the buzzer pin is switched on and a message is printed. Otherwise the buzzer pin is switched off.",
        "**Wait.** A pause of about half a second, then the loop measures again.",
      ] },
      { t: "p", text: "The gas leak and water level projects have exactly the same parts. Only three things change: the name of the variable (`gas`, `water_level`), the direction of the comparison (above instead of below) and what is switched on. Here is the gas project's wiring for your board. On an ESP32, remember the divider on its analog output." },
      { t: "wiring", demo: "demo_gas_leak" },
      { t: "p", text: "The gas project also lights a warning LED. If you use an external LED, it needs a **220 Ω to 330 Ω** series resistor." },

      { t: "h", text: "The water level project" },
      { t: "p", text: "The water level strip has three pins, usually marked **+**, **-** and **S** for signal. Unplug USB, then connect **+** to **3.3 V** on an ESP32 or **5 V** on an Arduino Uno, **-** to **GND**, and **S** to the analog pin in the table below. The buzzer goes on the output pin in the table, under the same rule as in the rain detector: a buzzer module, or a small active buzzer known to draw less than about 20 mA." },
      { t: "wiring", demo: "demo_water_level" },
      { t: "p", text: "The program reads the strip into the variable `water_level` and sounds the buzzer when the reading is **above** the threshold, because deeper water gives a higher number. Find your threshold as before: record the range with the strip dry, and the range with water at the height you call full." },
      { t: "p", text: "The table also lists the pins of an LCD, and the program has lines that write the reading to it. Displays have their own lessons in module b8, including how to power one safely on an ESP32, so build the complete project when you reach that module. Do not connect an LCD before then. On an ESP32 the unchanged project stops with an error in the Terminal when no LCD is connected, so to try the sensor and buzzer now, delete the LCD block from your copy first and join the Water Level Sensor block to the If-Else block again. Only the lower, striped part of the strip goes in the water. Keep its connector, the breadboard and the board dry." },
      { t: "note", kind: "warn", text: "The rain board, the water strip and the cheap two-leg soil probe all pass a small current through water. Left powered and wet for days, their tracks corrode. Dry them after use. Their readings also depend on how clean the water is, so treat them as \"wetter or drier\", not as a measurement in millimetres." },
    ],
    mistakes: [
      "**Wrong direction of comparison.** The rain buzzer sounds when the board is dry and stops when it is wet. Watch the chart to see which way your module moves, then choose below or above to match.",
      "**Reading the gas sensor straight after power-up.** The reading starts high and falls for the first few minutes as the heater warms. Choose a threshold only after it has levelled off.",
      "**A 5 V module output wired straight to an ESP32 pin.** The reading sits at the maximum and the pin can be damaged. Power the module from 3.3 V, or divide the output if the module must have 5 V.",
      "**Connecting DO instead of AO.** The reading jumps between the two ends of the range with nothing in between. Move the wire to AO.",
      "**Using the project's built-in number.** A different module, a different board or different tap water changes every reading. Measure your own two conditions.",
    ],
    practice: {
      kind: "project",
      demo: "demo_rain_detector",
      task: "Open the rain detector project, wire it as above and run it. Using the live chart, record the lowest and highest reading with the board completely dry, then with a few drops of water on it. Work out your own threshold from the gap and type it into the If-Else block. Then wipe the board dry and note how long the reading takes to return to its dry range.",
    },
    quiz: [
      {
        q: "A rain board gives readings around 3000 when dry and around 1200 with drops on it. Which condition should switch the buzzer on?",
        options: [
          "`rain` above a threshold between the two",
          "`rain` equal to 1200",
          "`rain` equal to 3000",
          "`rain` below a threshold between the two",
        ],
        answer: 3,
        why: "This board reads lower when wet, so wet is the low side of the line. A test for exact equality would almost never be true with a noisy reading.",
      },
      {
        q: "Why is the MQ gas sensor's output passed through a voltage divider on an ESP32 but connected directly on an Arduino Uno?",
        options: [
          "The sensor is powered from 5 V and its output can rise above the 3.3 V an ESP32 pin tolerates",
          "The ESP32 reads analog voltages too quickly",
          "The Uno has no analog pins",
          "The divider makes the sensor warm up faster",
        ],
        answer: 0,
        why: "The heater needs about 5 V, so the output can approach 5 V. That is within the Uno's limit but above the ESP32's, so it is scaled down first.",
      },
      {
        q: "A gas project is switched on and the buzzer sounds at once in clean air, then stops by itself after a few minutes. What is the most likely reason?",
        options: [
          "There really was gas in the room",
          "The threshold is far too high",
          "The sensor reads high while its heater warms up and only then settles",
          "The buzzer is a passive type",
        ],
        answer: 2,
        why: "MQ sensors need warm-up time. Readings taken before they settle are not meaningful, which is one reason they must never be relied on as a safety alarm.",
      },
      {
        q: "A student wires a water level strip and sees the reading flip between 0 and the maximum with no values in between. What should they check?",
        options: [
          "Whether the water is too cold",
          "Whether the wire is on the module's digital output instead of its analog output",
          "Whether the loop delay is too short",
          "Whether the threshold is too low",
        ],
        answer: 1,
        why: "A digital output has only two levels, so an analog pin reading it shows only the two ends of the range. The smoothly changing signal is on AO.",
      },
    ],
  },
};

export default lessons;
