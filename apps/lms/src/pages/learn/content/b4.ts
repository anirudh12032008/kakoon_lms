import type { ModuleContent } from "../model/curriculum";

/**
 * Module b4: Digital input and decisions.
 * Rules for lesson text: original wording, no pin numbers in prose (use
 * `wiring` / `code` blocks), component figures are typical values.
 */
const lessons: ModuleContent = {
  "b4-buttons-and-pull-resistors": {
    id: "b4-buttons-and-pull-resistors",
    outcomes: [
      "Explain what a pin set as an input actually measures",
      "Describe a floating input and why its readings cannot be trusted",
      "Wire a button with a pull-up or a pull-down resistor and predict the reading in each position",
      "Read a button in the editor with the Push Button block",
    ],
    blocks: [
      { t: "h", text: "A pin can listen as well as talk" },
      { t: "p", text: "So far every pin you used was an **output**: the program decided whether it was HIGH or LOW. A pin can also be an **input**. Then the outside world sets the voltage and the program only looks at it." },
      { t: "p", text: "A digital input asks one question: is the voltage on this pin close to the supply voltage, or close to ground? Close to the supply reads as **HIGH**, which the program sees as `1`. Close to ground reads as **LOW**, which the program sees as `0`. There is nothing in between as far as the program is concerned." },

      { t: "h", text: "The floating input" },
      { t: "p", text: "A push button is just two pieces of metal that touch when you press. Suppose you connect one side to the supply and the other side to an input pin. Pressed, the pin is joined to the supply and reads `1`. That part works." },
      { t: "p", text: "Now let go. The pin is connected to nothing at all. It is not at ground, it is simply left hanging, and an input pin is so sensitive that it picks up stray electrical noise from your hand, nearby wires and the room. The reading flips between `0` and `1` at random. This is a **floating input**, and it is the most common reason a first button circuit seems haunted." },
      { t: "note", kind: "tip", text: "Think of a see-saw with nobody on it on a windy day. It tips whichever way the wind pushes. A pull resistor is a light weight resting on one end: it decides the position whenever nobody is pushing harder." },

      { t: "h", text: "Pull-down and pull-up resistors" },
      { t: "p", text: "The cure is to give the pin a weak, permanent connection to a known level through a resistor. A typical value is **10 kΩ**. The button then makes a strong connection to the opposite level when it is pressed, and the strong connection wins." },
      { t: "table", head: ["Circuit", "Resistor goes from the pin to", "Button goes from the pin to", "Released", "Pressed"], rows: [
        ["Pull-down", "GND", "the supply", "`0` (LOW)", "`1` (HIGH)"],
        ["Pull-up", "the supply", "GND", "`1` (HIGH)", "`0` (LOW)"],
      ], caption: "With a pull-up the logic is upside down: pressed reads 0. That is normal, not a fault." },
      { t: "p", text: "Work through the pull-up with easy numbers. Take a 5 V supply and a 10 kΩ resistor. With the button released, no current flows through the resistor, so no voltage is lost across it and the pin sits at 5 V: HIGH. With the button pressed, the pin is joined straight to ground and sits at 0 V: LOW. Current now flows from the supply through the resistor to ground:" },
      { t: "formula", text: "I = V / R = 5 V / 10 000 Ω = 0.0005 A = 0.5 mA", caption: "Half a milliamp is tiny. The resistor lets the button win without wasting power." },
      { t: "p", text: "That calculation also shows why the resistor cannot be replaced by a plain wire. With a wire, pressing the button would join the supply directly to ground. That is a short circuit." },

      { t: "h", text: "The pull-up that is already inside the board" },
      { t: "p", text: "Pull-ups are needed so often that both the Arduino Uno and the ESP32 have one built into most pins. It is typically a few tens of kilohms and the program can switch it on. With it, a button needs no external resistor at all: one side of the button goes to the pin and the other side goes to **GND**." },
      { t: "p", text: "In the editor, the **Push Button** block does exactly this. It turns on the internal pull-up and also flips the reading for you, so its variable `value` is `1` while the button is pressed and `0` when it is released. The **Button / Digital Input** block gives you the raw level instead, so with its pull-up on, pressed reads `0`." },
      { t: "note", kind: "warn", text: "A few ESP32 pins are input-only and have no internal pull resistors. A button on one of those floats unless you add your own resistor. Use the pin the block shows for your board." },

      { t: "h", text: "Wiring a button on a breadboard" },
      { t: "list", ordered: true, items: [
        "Unplug the USB cable before you change any wiring.",
        "Place the button across the centre gap of the breadboard. A common four-leg button has its legs joined in pairs, so use two legs that are **diagonally opposite**: those are always on different sides of the switch.",
        "Run a jumper from one of those legs to the pin shown on the **Push Button** block.",
        "Run a jumper from the diagonally opposite leg to **GND**.",
        "Plug the USB cable back in.",
      ] },
      { t: "note", kind: "safety", text: "Wiring the button to GND with the internal pull-up means no supply voltage goes near the pin, which is the safest arrangement. If you build an external pull-up on an ESP32, connect the resistor to the 3.3 V pin, never the 5 V pin: an ESP32 pin must never see more than 3.3 V." },
    ],
    mistakes: [
      "**No pull resistor at all.** The reading changes when you wave your hand near the wire or touch the board. That is a floating input.",
      "**Expecting 1 when pressed on a pull-up circuit.** The LED is on until you press and goes off while you hold the button. Either use the Push Button block, which flips the value for you, or compare with 0.",
      "**Using two legs on the same side of a four-leg button.** Those two are permanently joined, so the pin reads pressed all the time.",
      "**Pull-up resistor replaced by a wire.** Pressing the button shorts the supply to ground. The board may reset or the USB port may switch off.",
      "**Button wired to 5 V on an ESP32.** This can damage the pin. Wire buttons to GND and use the pull-up.",
    ],
    practice: {
      kind: "build",
      task: "Make an LED that is on only while a button is held down.",
      steps: [
        "Wire the button between GND and the pin shown on the Push Button block, as described above.",
        "Drag a **Forever Loop** onto the canvas and put a **Push Button** block inside it.",
        "Add an **If-Else** block after it. Set the left side to `value`, the comparison to `==` and the right side to `1`.",
        "Put an **LED** block set to on in the true branch, and an **LED** block set to off in the false branch.",
        "Run it. If you use an external LED instead of the one on the board, give it a series resistor of 220 Ω to 330 Ω.",
        "Unplug USB, take the jumper out of GND so the button is no longer connected, plug USB back in and run the program again. The LED stays off and steady however you move your hand near the wire: the internal pull-up is holding the pin, so nothing floats. Unplug again and put the jumper back.",
      ],
    },
    quiz: [
      {
        q: "A button is wired from an input pin to the supply. There is no resistor and the internal pull is off. What does the pin read when the button is released?",
        options: [
          "Always 0",
          "Always 1",
          "Something unpredictable that can change from moment to moment",
          "Exactly half way between 0 and 1",
        ],
        answer: 2,
        why: "Released, the pin is connected to nothing, so it floats and picks up noise. A digital input can only report 0 or 1, and which one you get is random.",
      },
      {
        q: "A button uses a 10 kΩ pull-up to 3.3 V. How much current flows through the resistor while the button is held down?",
        options: ["0.33 mA", "3.3 mA", "33 mA", "None"],
        answer: 0,
        why: "Pressed, the full 3.3 V is across the resistor: 3.3 / 10 000 = 0.00033 A, which is 0.33 mA.",
      },
      {
        q: "With a pull-up resistor and the button wired to GND, what raw level does the pin read while the button is pressed?",
        options: ["HIGH, because pressing always means 1", "It floats", "It depends on the resistor value", "LOW, because the button joins the pin to ground"],
        answer: 3,
        why: "The button makes a direct connection to ground, which overpowers the weak pull-up. Pull-up circuits read 0 when pressed.",
      },
      {
        q: "A student's LED is stuck on, whether or not the button is pressed. The button is a four-leg type and both jumpers go to legs on the same side. What is the most likely cause?",
        options: [
          "The pull-up is too strong",
          "Those two legs are joined inside the button, so the circuit is always closed",
          "The LED has no resistor",
          "The program has no loop",
        ],
        answer: 1,
        why: "Legs on the same side of a four-leg button are one piece of metal. The pin is permanently connected to ground, so it always reads as pressed.",
      },
    ],
  },

  "b4-if-else": {
    id: "b4-if-else",
    outcomes: [
      "Write a comparison and say whether it is true or false for a given value",
      "Use If-Else so a program does one thing or another",
      "Explain why an output stays where it was last set, and why the else branch matters",
      "Trace a short program by hand for different inputs",
    ],
    blocks: [
      { t: "h", text: "Programs that choose" },
      { t: "p", text: "The traffic signal from the last module did the same thing every time. It never looked at the world. Most useful devices do: a door bell rings **if** the button is pressed, a street light switches on **if** it is dark. The part of a program that chooses is called a **conditional**, and in the editor it is the **If-Else** block." },
      { t: "p", text: "You already make decisions this way. If it is raining, take an umbrella, otherwise leave it at home. There is a question with a yes or no answer, one action for yes and another for no." },

      { t: "h", text: "Comparisons: questions with a yes or no answer" },
      { t: "p", text: "The question inside an `if` is a **comparison**. It puts two values side by side and the answer is either **true** or **false**. Nothing else is possible." },
      { t: "table", head: ["Symbol", "Meaning", "Example", "True when"], rows: [
        ["`==`", "equal to", "`value == 1`", "`value` is exactly 1"],
        ["`!=`", "not equal to", "`value != 0`", "`value` is anything except 0"],
        ["`<`", "less than", "`light < 300`", "`light` is 299 or lower"],
        ["`>`", "greater than", "`gas > 300`", "`gas` is 301 or higher"],
        ["`<=`", "less than or equal to", "`count <= 5`", "`count` is 5 or lower"],
        ["`>=`", "greater than or equal to", "`count >= 5`", "`count` is 5 or higher"],
      ], caption: "The numbers here are made up to show the idea." },
      { t: "note", kind: "warn", text: "One equals sign and two equals signs are different things. A single `=` **stores** a value in a variable. A double `==` **asks** whether two values are equal. Mixing them up is one of the most common slips in text code. The If-Else block protects you by offering only comparison symbols." },

      { t: "h", text: "If, and else" },
      { t: "p", text: "The If-Else block has two branches. When the comparison is true the program runs the true branch and skips the other. When it is false it runs the false branch, the **else**, and skips the first. Exactly one branch runs each time, never both and never neither." },
      { t: "p", text: "Here is a real example: the program for the motion light you will build in the next lesson, generated for your board. Do not worry about the sensor yet. Look for the shape of the decision." },
      { t: "code", demo: "demo_pir_light" },
      { t: "p", text: "Find the line that starts with `if`. The comparison is `motion == 1`. The line or lines directly under it are the true branch, and the lines under `else` are the false branch. Arduino C++ wraps each branch in curly braces. MicroPython marks a branch with a colon and by indenting its lines. The idea is identical in both." },

      { t: "h", text: "Why the else matters" },
      { t: "p", text: "An output pin has a kind of memory. Once the program sets it HIGH it stays HIGH until the program sets it LOW. It does not fall back by itself when the condition stops being true." },
      { t: "p", text: "So imagine the same program with an empty else branch. The first time `motion` is 1 the light is switched on. Later `motion` goes back to 0, the comparison is false, the else branch does nothing, and the light is still on. It stays on until you unplug the board. The else branch is where you say what should happen the rest of the time." },

      { t: "h", text: "The decision is made again and again" },
      { t: "p", text: "An `if` is checked at the moment the program reaches it, and only then. It reacts to change because it sits inside the forever loop, so the board measures, decides and acts many times a second. Trace two passes of the loop by hand:" },
      { t: "table", head: ["Pass", "`motion` is", "`motion == 1` is", "Branch that runs", "Output afterwards"], rows: [
        ["1", "0", "false", "else", "off"],
        ["2", "1", "true", "if", "on"],
        ["3", "1", "true", "if", "on (set again, no visible change)"],
        ["4", "0", "false", "else", "off"],
      ] },
      { t: "p", text: "Tracing like this, with a pencil, is the most reliable way to find out why a program does something you did not expect." },

      { t: "h", text: "Decisions inside decisions" },
      { t: "p", text: "A branch can contain another If-Else block. The inner question is only asked when the outer branch runs. You will see this in the clap switch at the end of this module: first \"did I hear something?\", and only if so, \"should the lamp now be on or off?\"" },
    ],
    mistakes: [
      "**Empty else branch.** The output switches on the first time the condition is true and never switches off again.",
      "**Left side of the If-Else block left blank.** The editor treats an unfinished condition as never true, so only the else branch ever runs.",
      "**Comparing with the wrong variable name.** The sensor block stores its reading in a named variable. If the If-Else block uses a different name, it is looking at a value that never changes.",
      "**Wrong direction of comparison.** Using `<` where `>` was meant makes the device do the opposite of what you wanted. Say the condition aloud as a sentence to check it.",
      "**Putting the If-Else block outside the loop.** The decision is made once at the start and never again.",
    ],
    practice: {
      kind: "build",
      task: "See for yourself what the else branch does, using the button circuit from the previous lesson.",
      steps: [
        "Unplug USB, wire the button between GND and the pin shown on the **Push Button** block, and plug USB back in.",
        "Build: **Forever Loop**, then **Push Button**, then **If-Else** with the condition `value == 1`.",
        "Put an **LED** block set to on in the true branch and leave the false branch empty.",
        "Run it. Press the button once and let go. Write down what the LED does and explain why.",
        "Now add an **LED** block set to off in the false branch and run it again.",
        "Last, change the comparison to `value == 0` and predict what will happen before you run it.",
      ],
    },
    quiz: [
      {
        q: "A program has `if (count >= 5)` and `count` is 5. Which branch runs?",
        options: [
          "The true branch, because 5 is greater than or equal to 5",
          "The else branch, because 5 is not greater than 5",
          "Both branches",
          "Neither branch",
        ],
        answer: 0,
        why: "The symbol `>=` includes the equal case, so the comparison is true when `count` is exactly 5.",
      },
      {
        q: "A light switches on when a button is pressed but never switches off. The If-Else block has an LED on block in the true branch and nothing in the false branch. Why does the light stay on?",
        options: [
          "The button is floating",
          "The comparison is always true",
          "The loop only runs once",
          "An output keeps its last state, and nothing in the program ever sets it off",
        ],
        answer: 3,
        why: "Output pins hold whatever they were last set to. With an empty else branch there is no instruction that turns the LED off.",
      },
      {
        q: "In text code, what is the difference between `x = 1` and `x == 1`?",
        options: [
          "There is no difference",
          "The first compares, the second stores",
          "The first stores 1 in `x`, the second asks whether `x` is 1",
          "The second only works with sensors",
        ],
        answer: 2,
        why: "A single equals sign assigns a value. A double equals sign is a comparison that gives true or false.",
      },
      {
        q: "A loop runs an If-Else on `motion == 1` three times, with `motion` equal to 0, then 1, then 0. The true branch switches a lamp on and the else branch switches it off. What is the lamp doing after each pass?",
        options: ["on, on, off", "off, on, off", "off, on, on", "on, off, on"],
        answer: 1,
        why: "Each pass runs exactly one branch: false gives off, true gives on, false gives off again.",
      },
    ],
  },

  "b4-pir-motion": {
    id: "b4-pir-motion",
    outcomes: [
      "Explain in simple terms how a PIR sensor notices a person moving",
      "Wire a PIR module and say what its two adjusters do",
      "Read the generated program for the motion light part by part",
      "Tell apart a sensor that is warming up, one that is holding, and one that is wired wrongly",
    ],
    blocks: [
      { t: "h", text: "A sensor that behaves like a button" },
      { t: "p", text: "A button gives the board a 0 or a 1 because a person pushes it. Many sensor modules give a 0 or a 1 by themselves: they contain the sensing part and a small circuit that makes the yes or no decision, and they hand the board a clean digital signal. To the program they look exactly like a button. The **PIR motion sensor** is the most familiar example. It is the white dome that switches on corridor lights." },

      { t: "h", text: "How a PIR notices you" },
      { t: "p", text: "PIR stands for **passive infrared**. Everything warm gives off infrared, which is heat radiation you cannot see. Your body gives off more than the wall behind you. The sensor has two heat-sensitive halves side by side behind a ribbed plastic dome. The dome is a lens that divides the room into many narrow zones." },
      { t: "p", text: "While nothing moves, both halves see the same amount of heat and the sensor stays quiet. When a warm body walks from one zone to the next, one half sees the change slightly before the other. That brief **difference** is what triggers the output." },
      { t: "list", items: [
        "**Passive** means it sends nothing out. It only receives.",
        "It detects **change**, not presence. Someone sitting perfectly still becomes invisible to it after a while.",
        "It reacts to warm things that move, including pets, sunlight sweeping across a wall and warm air from a heater.",
      ] },

      { t: "h", text: "The module and its adjusters" },
      { t: "p", text: "The common module has three pins: power, ground and output. When it sees motion the output goes HIGH and stays HIGH for a while, then drops back to LOW. On the back there are usually two small orange adjusters you turn with a screwdriver:" },
      { t: "table", head: ["Adjuster", "What it changes", "Typical range"], rows: [
        ["Sensitivity", "How far away motion is noticed", "Roughly 3 m to 7 m"],
        ["Hold time", "How long the output stays HIGH after the last motion", "A few seconds up to several minutes"],
      ], caption: "Typical figures for the common module. Yours may differ, and the adjusters are not labelled on every board." },
      { t: "note", kind: "tip", text: "After power is applied a PIR needs time to settle, typically 30 to 60 seconds. During that time the output may switch on and off for no reason. Keep still, wait a minute, then start testing. Set the hold time to its minimum while you experiment so you are not waiting for it." },

      { t: "h", text: "Wiring it" },
      { t: "p", text: "The built-in project switches a **relay module**: an electrically operated switch that module b7 explains properly. For now treat it as an output that clicks, with an indicator light that shows when it is on. If you do not have one, an LED with a series resistor in its place shows the same result." },
      { t: "list", ordered: true, items: [
        "Unplug the USB cable.",
        "Connect the PIR module's power pin to the board's **5 V** pin and its ground pin to **GND**. The common module needs about 5 V to work properly.",
        "Connect the PIR module's output pin to the input pin shown in the table below.",
        "Connect the relay module's power and ground pins to **5 V** and **GND**, and its signal pin to the output pin in the table. To use an LED instead, connect that pin through a **220 Ω to 330 Ω** resistor to the LED's longer leg, and the shorter leg to **GND**.",
        "Leave the relay's screw terminals empty. Plug the USB cable back in.",
      ] },
      { t: "wiring", demo: "demo_pir_light" },
      { t: "note", kind: "safety", text: "On the common PIR module the output is typically about 3.3 V even though the module is powered from 5 V, which an ESP32 pin can accept. Modules vary, so on an ESP32 measure the output with a multimeter first, and if it is above 3.3 V put a voltage divider between it and the pin. On an ESP32, use the LED in place of the relay for now unless your relay module is marked for 3.3 V logic: a 5 V relay module may not switch from a 3.3 V signal, and module b7 shows how to check one before connecting it. Never connect mains electricity to the relay: nothing in this course uses mains. The relay's click and its indicator are your light." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_pir_light" },
      { t: "list", ordered: true, items: [
        "**Setup.** The first lines run once. They make the PIR pin an input and the relay pin an output.",
        "**Read.** Inside the loop the board reads the PIR output and stores it in the variable `motion`. It is `1` while the sensor reports motion and `0` otherwise.",
        "**Report.** The line that prints `SENSOR` sends `motion` to the computer, so the live chart in the editor shows a step up each time the sensor triggers.",
        "**Decide and act.** If `motion == 1` the relay is switched on, otherwise it is switched off. This is the If-Else from the previous lesson, with its else branch doing the important job of switching off.",
        "**Wait.** A short pause, then the loop starts again.",
      ] },
      { t: "p", text: "Notice what the program does **not** do: it has no timer for how long the light stays on. That comes from the hold time adjuster on the sensor itself. The program simply copies the sensor's output to the relay." },
    ],
    mistakes: [
      "**Testing during warm-up.** The light switches on and off by itself in the first minute. Wait for the sensor to settle before deciding anything is wrong.",
      "**Thinking it is stuck on.** The output stays HIGH for the whole hold time, and on many modules every new movement restarts the timer. Turn the hold time down and step out of its view.",
      "**Power and ground swapped on the module.** The pin order is not the same on every module and is often printed under the dome. A module wired backwards gets warm and never triggers. Unplug at once and check.",
      "**Sensor facing a window, heater or fan.** Moving warm air and moving sunlight look like motion. Point it at the area you care about.",
      "**The relay works the wrong way round.** Some relay modules switch on with a LOW signal. Module b7 covers this. For now, note which way yours behaves.",
    ],
    practice: {
      kind: "project",
      demo: "demo_pir_light",
      task: "Open the PIR motion light project, wire it as above and run it. Wait a minute for the sensor to settle, then watch `motion` on the live chart as you walk past. Time how long the output stays high after you stop moving, turn the hold time adjuster a little, and time it again. Then stand in view and keep perfectly still: note how long it takes before the sensor stops seeing you.",
    },
    quiz: [
      {
        q: "A person walks into a room with a PIR light, sits down and reads without moving. After a while the light goes off. Why?",
        options: [
          "The sensor overheated",
          "The program's loop stopped",
          "A PIR detects changes in heat across its view, and a still person causes no change",
          "The person is too far away",
        ],
        answer: 2,
        why: "The sensor responds to a warm body moving between zones. With no movement there is no difference between its two halves, so after the hold time the output drops.",
      },
      {
        q: "In the motion light program, where is it decided how long the light stays on after the last movement?",
        options: [
          "By the pause at the end of the loop",
          "By the hold time adjuster on the PIR module",
          "By the relay",
          "By the number compared in the If-Else block",
        ],
        answer: 1,
        why: "The program only copies the sensor's output to the relay. The sensor keeps its output HIGH for its own hold time.",
      },
      {
        q: "You power up the circuit and the relay clicks on and off several times in the first half minute although nobody is moving. What should you do first?",
        options: [
          "Wait about a minute for the sensor to settle and test again",
          "Replace the sensor",
          "Change the comparison to `motion == 0`",
          "Add a pull-up resistor to the relay",
        ],
        answer: 0,
        why: "A PIR needs typically 30 to 60 seconds after power-up before its output is reliable. False triggers in that time are normal.",
      },
      {
        q: "The chart shows `motion` switching between 0 and 1 correctly, but the relay never clicks. Which part of the system should you check?",
        options: [
          "The PIR sensitivity adjuster",
          "The PIR warm-up time",
          "The dome lens",
          "The relay's wiring and the output side of the program",
        ],
        answer: 3,
        why: "A correct chart proves the sensor, its wiring and the reading step all work. The fault must be after the decision: the output pin, the relay's power or its signal wire.",
      },
    ],
  },

  "b4-bounce-and-state": {
    id: "b4-bounce-and-state",
    outcomes: [
      "Explain switch bounce and why a fast program sees one press as several",
      "Use a variable to remember whether something is on or off",
      "Explain how `lamp = 1 - lamp` flips a value",
      "Read the clap switch program and say what the short wait is for",
    ],
    blocks: [
      { t: "h", text: "Hold to light versus press to switch" },
      { t: "p", text: "Everything so far has been a direct copy: button down, light on; button up, light off. A room light switch does not work that way. You press once and it stays on. You press again and it goes off. That behaviour is called **toggling**, and it needs two new ideas. The program has to **remember** something, and it has to count each press or clap exactly **once**." },

      { t: "h", text: "Switch bounce" },
      { t: "p", text: "When two metal contacts close they do not meet cleanly. They hit, spring apart and hit again several times before settling, like a dropped ball. This is **bounce**. It lasts only a few thousandths of a second, typically 1 ms to 20 ms, and you could never see it." },
      { t: "p", text: "The board can. Its loop runs thousands of times a second, so in the time one press takes to settle the program may read 1, 0, 1, 0, 1. A program that toggles on every 1 would flip the lamp several times, and whether it ends up on or off is luck. A sound is even messier: one clap is a burst of vibration that makes a sound sensor's output flicker many times." },

      { t: "h", text: "Debouncing: count it once" },
      { t: "p", text: "The simplest cure is patience. As soon as the program sees the first 1 it acts, then **waits** long enough for the bouncing or the clap to be completely over before it looks again. For a button, about 50 ms is plenty. For a clap a longer wait is needed because the sound takes longer to die away." },
      { t: "note", kind: "tip", text: "The wait has a cost: the program is blind while it waits. A short wait still lets through the tail of the clap. A long one ignores a second clap that comes quickly. The value in the built-in project is a starting point for you to tune." },

      { t: "h", text: "Remembering with a variable" },
      { t: "p", text: "To toggle, the program must know whether the lamp is on right now. It keeps that in a variable called `lamp`: `0` means off and `1` means on. Each time a clap arrives it flips the variable with a small trick:" },
      { t: "formula", text: "lamp = 1 - lamp", caption: "Read it as: work out one minus the old value, then store the result back in `lamp`." },
      { t: "p", text: "Try both cases. If `lamp` is 0, then 1 minus 0 is 1, so it becomes 1. If `lamp` is 1, then 1 minus 1 is 0, so it becomes 0. The same line turns off into on and on into off. A variable that remembers what a device is doing is called its **state**." },

      { t: "h", text: "The sound sensor and its wiring" },
      { t: "p", text: "The sound sensor module has a small microphone and a comparator chip. A blue adjuster sets how loud a sound must be to count. The digital output, usually marked **DO**, changes level when a sound is louder than that, and a small light on the module blinks at the same moment." },
      { t: "list", ordered: true, items: [
        "Unplug the USB cable.",
        "Connect the module's power pin to **3.3 V** on an ESP32, or **5 V** on an Arduino Uno, and its ground pin to **GND**.",
        "Connect the module's **DO** pin to the input pin shown in the table below.",
        "The project uses the LED pin shown in the table. If you add your own LED there, connect it through a **220 Ω to 330 Ω** series resistor to **GND**.",
        "Plug USB back in. Turn the adjuster until the module's indicator blinks on a clap but stays steady in a quiet room.",
      ] },
      { t: "wiring", demo: "demo_clap_switch" },
      { t: "note", kind: "safety", text: "A module's output can rise as high as its supply. On an ESP32, power this module from 3.3 V so its output can never exceed what the pin accepts. Every LED needs its series resistor." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_clap_switch" },
      { t: "list", ordered: true, items: [
        "**Start.** Before the loop, `lamp` is set to `0`: the lamp begins off. The sensor pin is made an input and the LED pin an output.",
        "**Listen.** Each pass of the loop reads the sensor into the variable `sound`.",
        "**Outer decision.** `if sound == 1`: was a sound heard just now? If not, the else branch is empty and nothing changes. An empty else is correct here, because the lamp should keep its state.",
        "**Flip.** Inside the true branch, `lamp = 1 - lamp` flips the remembered state.",
        "**Inner decision.** A second If-Else looks at `lamp` and switches the LED on or off to match.",
        "**Wait.** The program pauses for a fraction of a second so the rest of the same clap is ignored. Then a very short pause ends each pass of the loop.",
      ] },
      { t: "p", text: "One limit to know about: the program asks \"is there sound **now**?\", not \"did a sound just **start**?\". A long continuous noise is still there after the wait, so the lamp flips again and again for as long as the noise lasts. Reacting only to the moment a signal changes is called edge detection, and you will meet it in the intermediate tier." },
    ],
    mistakes: [
      "**No wait after the toggle.** The lamp ends up on or off at random after each clap, because one clap is counted many times.",
      "**Setting `lamp` to 0 inside the loop.** The memory is wiped on every pass, so the lamp can never stay on. The starting value belongs before the loop.",
      "**Sensitivity set too high.** The module's indicator is lit all the time and the lamp flips continuously. Turn the adjuster until the indicator changes only on a clap.",
      "**A module whose output works the other way.** Some sound modules go LOW on a sound and are HIGH when quiet. The lamp then flips constantly in silence and stops when you make a noise. Change the comparison to `sound == 0`.",
      "**Forgetting which state you are in.** If the LED and the variable ever disagree, check that every place that changes `lamp` is followed by the block that updates the LED.",
    ],
    practice: {
      kind: "project",
      demo: "demo_clap_switch",
      task: "Open the clap switch project, wire it as above and adjust the module until one clap flips the LED once. Then experiment with the wait inside the true branch: make it much shorter and clap, then make it much longer and clap twice quickly. Describe what goes wrong in each case and settle on a value that suits your claps.",
    },
    quiz: [
      {
        q: "`lamp` is 1. The line `lamp = 1 - lamp` runs three times in a row. What is `lamp` afterwards?",
        options: ["0", "1", "3", "-2"],
        answer: 0,
        why: "Each run flips it: 1 becomes 0, 0 becomes 1, 1 becomes 0. After three flips starting from 1 it is 0.",
      },
      {
        q: "A student builds a toggle with a button and no wait. Each press sometimes changes the lamp and sometimes seems to do nothing. What is the best explanation?",
        options: [
          "The button is floating",
          "The LED has no resistor",
          "The contacts bounce, so one press is read as several and an even number of flips cancels out",
          "The variable is too small to hold the value",
        ],
        answer: 2,
        why: "Bounce produces several quick 1 readings per press. Two flips leave the lamp where it started, so the result looks random.",
      },
      {
        q: "In the clap switch, why is the else branch of the outer If-Else left empty on purpose?",
        options: [
          "Because else branches are optional and never matter",
          "Because the LED switches off by itself",
          "Because the sensor cannot read 0",
          "Because when there is no sound the lamp should stay exactly as it is",
        ],
        answer: 3,
        why: "A toggle changes state only when an event happens. Silence is not an event, so nothing should be done.",
      },
      {
        q: "With the clap switch running, someone plays loud music continuously. What will the LED do?",
        options: [
          "Stay on the whole time",
          "Flip on and off repeatedly, once after every wait, for as long as the music is loud",
          "Stay off the whole time",
          "Flip once and then stop",
        ],
        answer: 1,
        why: "The program checks whether sound is present, not whether it just started. After each wait the sound is still there, so the state flips again.",
      },
    ],
  },
};

export default lessons;
