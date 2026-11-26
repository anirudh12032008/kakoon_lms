import type { ModuleContent } from "../model/curriculum";

/**
 * Module b6: Time, distance and motion.
 * Rules for lesson text: original wording, no pin numbers in prose (use
 * `wiring` / `code` blocks), component figures are typical values.
 */
const lessons: ModuleContent = {
  "b6-pwm": {
    id: "b6-pwm",
    outcomes: [
      "Explain how a pin that is only ever on or off can make an LED look dim",
      "Calculate duty cycle from on-time and period, and frequency from period",
      "Dim an LED with the PWM Output block",
      "Tell an active buzzer from a passive one and say which needs a changing signal",
    ],
    blocks: [
      { t: "h", text: "The problem: a pin has no dimmer" },
      { t: "p", text: "An output pin has two positions, HIGH and LOW. An LED on it is fully on or fully off. There is no half voltage setting. Yet phone screens dim smoothly and fans run at several speeds. The trick they use needs no new hardware at all, only **timing**." },
      { t: "p", text: "Flick a room light switch on and off once a second and you see flashing. Imagine doing it a thousand times a second. Your eye cannot follow that. It sees a steady glow, and how bright the glow looks depends on what share of the time the light was on. That is **pulse width modulation**, or **PWM**: switching fully on and fully off very fast, and changing how long each on-pulse lasts." },

      { t: "h", text: "Period, frequency and duty cycle" },
      { t: "p", text: "One on-pulse followed by one off-gap is a cycle. Three words describe it:" },
      { t: "list", items: [
        "**Period**: how long one complete cycle takes.",
        "**Frequency**: how many cycles fit in one second. It is 1 divided by the period, measured in hertz (Hz).",
        "**Duty cycle**: the share of each period for which the pin is HIGH, as a percentage.",
      ] },
      { t: "formula", text: "duty cycle = on-time / period × 100 %", caption: "0 % is always off, 100 % is always on." },
      { t: "p", text: "A worked example with easy numbers. The period is 2 ms and the pin is HIGH for 0.5 ms of it. The duty cycle is 0.5 / 2 × 100 = **25 %**. The frequency is 1 / 0.002 s = **500 Hz**, so this on-off pattern repeats five hundred times every second." },

      { t: "h", text: "What the LED experiences" },
      { t: "p", text: "Over many cycles the LED receives power for only part of the time, so it gives out less light on average. The **average voltage** is a useful way to picture it:" },
      { t: "formula", text: "average voltage = duty cycle × supply voltage", caption: "25 % of 5 V is 1.25 V. 50 % of 3.3 V is 1.65 V." },
      { t: "p", text: "Be careful with that picture. The pin never actually sits at 1.25 V. It is at the full supply voltage or at zero, and only the average is 1.25 V. This is why the lesson title says **faking** analog. Slow things like your eye and a motor smooth the pulses out. A fast electronic input would see every pulse." },
      { t: "table", head: ["Duty cycle", "Pin is HIGH for", "LED looks"], rows: [
        ["0 %", "none of each period", "off"],
        ["10 %", "one tenth", "dim, but clearly lit"],
        ["50 %", "half", "fairly bright"],
        ["100 %", "all of it", "full brightness"],
      ], caption: "Eyes do not judge brightness evenly: 50 % looks much more than half as bright. Most of the visible change happens at low duty cycles." },

      { t: "h", text: "PWM in the editor" },
      { t: "p", text: "The **PWM Output** block takes a duty cycle as a percentage and keeps the pin pulsing at that setting until another block changes it. If you look at the generated code you will see a different number from the one you typed. Each board counts duty on its own scale, and the editor converts your percentage for you." },
      { t: "p", text: "On an Arduino Uno only some pins can produce PWM. They are marked on the board with a small wave symbol (~). On an ESP32 almost any output pin can. Use the pin the block shows." },
      { t: "note", kind: "safety", text: "PWM changes how long the LED is on, not how much current flows while it is on. During each pulse the LED still sees the full supply voltage, so it still needs its series resistor of 220 Ω to 330 Ω." },

      { t: "h", text: "Buzzers: frequency you can hear" },
      { t: "p", text: "With an LED you change the duty cycle and leave the frequency alone. With sound it is the other way round. A buzzer's disc clicks each time the pin changes, and a few hundred to a few thousand clicks per second is heard as a note. A higher frequency gives a higher pitch." },
      { t: "table", head: ["Type", "What is inside", "What it needs", "Sound"], rows: [
        ["Active buzzer", "A disc and its own oscillator circuit", "A steady HIGH. It makes the tone itself", "One fixed pitch"],
        ["Passive buzzer", "Only the disc, like a tiny loudspeaker", "A signal that switches on and off at the pitch you want", "Any note the program chooses"],
      ], caption: "They look almost the same. An active buzzer usually has a sealed underside and often a sticker on top. To tell them apart, unplug USB, connect the longer leg to the 3.3 V pin and the shorter leg to GND, then plug USB in for a second or two only: the one that beeps is active." },
      { t: "p", text: "The built-in projects use an **active** buzzer because a plain pin set HIGH is enough. For a passive buzzer use the **Buzzer Tone** block, which sends a signal at a chosen frequency. A tone setting of 1 gives 440 Hz, the note musicians tune to, and larger settings give multiples of it. A passive buzzer is wired from the pin shown on the block to **GND**, with a resistor of about **100 Ω** in series: many passive buzzers are a coil of only a few tens of ohms, which would otherwise draw more than a pin should give." },
      { t: "note", kind: "warn", text: "A small active buzzer typically draws 20 mA to 30 mA, which is at or above the most a pin should supply. So use a **buzzer module** (three pins, with its own transistor), or a small active buzzer you know draws less than about 20 mA. Anything larger, or unknown, goes through a transistor: module b7 shows how. Many buzzer modules sound when their signal is LOW, and on an ESP32 a module is powered from 3.3 V." },
    ],
    mistakes: [
      "**Using a pin that cannot do PWM on an Arduino Uno.** The LED is simply off at low settings and fully on at high ones, with nothing in between. Move to a pin with the wave mark, or use the pin the block shows.",
      "**Leaving out the LED resistor because the LED is dim anyway.** Each pulse is still at full voltage. The LED and the pin are stressed on every one.",
      "**Expecting a passive buzzer to sound from a steady HIGH.** It gives one faint click and then silence. It needs a tone signal.",
      "**Driving an active buzzer with a tone signal.** It sounds rough or warbles, because its own oscillator is fighting yours.",
      "**Thinking PWM lowers the voltage.** A multimeter may show a middle value because it averages, but the pin is switching between zero and full supply the whole time.",
    ],
    practice: {
      kind: "build",
      task: "Step an LED through four brightness levels and find out how your eye responds.",
      steps: [
        "Unplug USB. Drag a **PWM Output** block onto the canvas and note its pin. If that pin is not the board's own LED, connect an LED from it through a 220 Ω to 330 Ω resistor to GND. Plug USB back in.",
        "Build a **Forever Loop** containing four pairs of blocks: **PWM Output** then **Sleep** for one second. Set the four duty cycles to 5, 25, 50 and 100 percent.",
        "Run it and watch. Which step looks like the biggest jump in brightness?",
        "Calculate the average voltage on the pin for each of the four settings on your board.",
        "Wave the LED quickly from side to side at the 25 percent setting in a dim room. The dotted trail you see is the individual pulses.",
      ],
    },
    quiz: [
      {
        q: "A PWM signal has a period of 10 ms and the pin is HIGH for 3 ms of each period. What is the duty cycle?",
        options: ["3 %", "30 %", "33 %", "70 %"],
        answer: 1,
        why: "Duty cycle is on-time divided by period: 3 / 10 × 100 = 30 %.",
      },
      {
        q: "A signal repeats every 4 ms. What is its frequency?",
        options: ["250 Hz", "4 Hz", "25 Hz", "4000 Hz"],
        answer: 0,
        why: "Frequency is 1 divided by the period: 1 / 0.004 s = 250 Hz.",
      },
      {
        q: "On a 5 V board a pin runs PWM at 20 % duty. Which statement is true?",
        options: [
          "The pin sits at a steady 1 V",
          "The pin sits at a steady 4 V",
          "The pin is at 5 V for 20 % of the time and 0 V for 80 % of the time",
          "The pin is at 5 V for 80 % of the time and 0 V for 20 % of the time",
        ],
        answer: 2,
        why: "PWM only ever outputs full supply or zero. The average works out to 1 V, but the pin itself is never at 1 V.",
      },
      {
        q: "A buzzer gives a single faint click when its pin goes HIGH and then stays silent. What is the most likely explanation?",
        options: [
          "It is an active buzzer wired backwards",
          "The pin cannot supply any current",
          "The duty cycle is too high",
          "It is a passive buzzer, which needs a signal that keeps switching at the pitch you want",
        ],
        answer: 3,
        why: "A passive buzzer has no oscillator. A steady level moves the disc once. Only a repeating signal makes a continuous tone.",
      },
    ],
  },

  "b6-servo-motors": {
    id: "b6-servo-motors",
    outcomes: [
      "Describe what is inside a hobby servo and why it holds a position",
      "Explain how pulse width sets the angle, and estimate the pulse for a given angle",
      "Wire a servo with the right power and a shared ground",
      "Recognise the signs of a servo that is not getting enough power",
    ],
    blocks: [
      { t: "h", text: "A motor that goes where it is told" },
      { t: "p", text: "An ordinary motor spins for as long as it has power. You control how fast, not where it stops. A **servo** is different: you tell it an angle and it turns its arm to that angle and holds it there, pushing back if something tries to move it. That makes it the natural choice for a lid, a barrier, a pointer or a robot joint." },
      { t: "p", text: "Inside the small plastic case there are four things: a little motor, a set of gears that trade speed for strength, a sensor that measures the angle of the output shaft, and a control circuit. The circuit compares the angle you asked for with the angle the sensor reports, and runs the motor one way or the other until they match. Then it keeps checking. A typical hobby servo covers about half a turn, from 0° to 180°." },

      { t: "h", text: "The signal: width means angle" },
      { t: "p", text: "A servo is told its angle with a pulse, repeated about 50 times a second, so one pulse every **20 ms**. The servo ignores how often the pulses come and measures how **long** each one lasts:" },
      { t: "table", head: ["Pulse width (typical)", "Angle"], rows: [
        ["about 1 ms", "0°"],
        ["about 1.5 ms", "90°, the centre"],
        ["about 2 ms", "180°"],
      ], caption: "Nominal figures. Real servos differ: many need roughly 0.5 ms to 2.4 ms to reach both ends, and the editor's generated code uses limits of that kind." },
      { t: "p", text: "This is PWM again, with a twist. For the LED the average mattered. For the servo the exact width of each pulse is the message. Work out the duty cycle at the centre position: 1.5 ms out of 20 ms is 1.5 / 20 × 100 = **7.5 %**. The pin is LOW for most of the time." },
      { t: "p", text: "Angles in between are in proportion:" },
      { t: "formula", text: "pulse width = shortest pulse + (longest pulse - shortest pulse) × angle / 180", caption: "With the nominal 1 ms and 2 ms, an angle of 45° needs 1 + (2 - 1) × 45 / 180 = 1.25 ms." },
      { t: "p", text: "You will not type pulse widths. The **Servo Motor** block takes an angle and the generated code produces the pulses. Knowing what is underneath explains why a servo sometimes stops short of 0° or 180°: its real limits are a little different from the nominal ones." },

      { t: "h", text: "Three wires" },
      { t: "table", head: ["Wire colour (typical)", "Purpose", "Connect to"], rows: [
        ["Brown or black", "Ground", "GND"],
        ["Red (the middle wire)", "Power", "5 V"],
        ["Orange, yellow or white", "Signal", "the servo pin for your board"],
      ] },
      { t: "p", text: "The Servo Motor block names a servo port, such as S1. The generated code and the hardware view in the editor show which pin that port is on your board." },

      { t: "h", text: "Power: the part that goes wrong" },
      { t: "p", text: "The signal wire carries almost no current. The red wire is another matter. A small servo typically draws a few hundred milliamps while it moves, and more for an instant when it starts or is blocked. A pin should supply no more than about 20 mA, so a servo is **never** powered from a pin." },
      { t: "list", items: [
        "**Signal** comes from the pin. A 3.3 V signal from an ESP32 is normally enough for a 5 V servo to understand.",
        "**Power** comes from the board's **5 V** pin, which is fed by the USB cable.",
        "**Ground** is shared: the servo's ground wire goes to the board's GND.",
      ] },
      { t: "p", text: "Even a USB port has limits. If the board restarts, the USB connection drops or the servo twitches each time it moves, the servo is pulling the supply voltage down. The cure is a **separate supply** for the servo, for example a battery pack of four AA cells (small servos typically accept about 4.8 V to 6 V), with its negative terminal joined to the board's GND. Without that shared ground the signal has nothing to be measured against and the servo behaves randomly." },
      { t: "note", kind: "safety", text: "Unplug USB before connecting or moving the servo plug: it fits either way round, and reversed power can destroy the servo. Never connect the servo's red wire to a GPIO pin. Do not force the arm round by hand, because that strips the small gears. Keep fingers, hair and cables clear of the arm when the program starts." },
    ],
    mistakes: [
      "**Servo powered from the 3.3 V pin or from a GPIO pin.** It hums, moves weakly or resets the board. Power it from 5 V.",
      "**No shared ground with a separate supply.** The servo jitters or ignores commands. Join the supply's negative terminal to the board's GND.",
      "**Board resets whenever the servo moves.** The serial terminal shows the program starting again from the top. The supply cannot deliver the current: use a separate 5 V supply.",
      "**Servo buzzes at 0° or 180°.** It has reached its mechanical end stop before its commanded angle and is pushing against it. Use angles a few degrees inside the limits, such as 10° and 170°.",
      "**Expecting continuous rotation.** A standard servo turns about half a turn and stops. A continuous rotation servo is a different part: for it the same signal sets speed, not angle.",
    ],
    practice: {
      kind: "build",
      task: "Sweep a servo between three positions and check its power.",
      steps: [
        "Unplug USB. Push the servo horn (the plastic arm) onto the shaft so you can see the angle.",
        "Drag a **Servo Motor** block onto the canvas. Find the pin for its port in the generated code or the hardware view, and connect the servo: signal to that pin, red to **5 V**, brown or black to **GND**.",
        "Build a **Forever Loop** with three pairs of blocks: **Servo Motor** then **Sleep** for one second. Set the angles to 10, 90 and 170.",
        "Plug USB in and run it. Check that the arm stops at three clearly different positions.",
        "Watch the board while the servo moves. If its power light dips or the program restarts, the servo needs its own 5 V supply with the grounds joined.",
        "Using the nominal 1 ms to 2 ms range, calculate the pulse width for each of your three angles.",
      ],
    },
    quiz: [
      {
        q: "Using the nominal range of 1 ms for 0° and 2 ms for 180°, what pulse width asks for 135°?",
        options: ["1.25 ms", "1.35 ms", "1.75 ms", "2.35 ms"],
        answer: 2,
        why: "135 / 180 is three quarters of the way, so the pulse is 1 + 0.75 × 1 = 1.75 ms.",
      },
      {
        q: "Every time the servo starts to move, the program restarts from the beginning. What is the most likely cause?",
        options: [
          "The servo draws more current than the supply can give, so the board's voltage dips and it resets",
          "The angle in the block is too large",
          "The signal wire is too long",
          "The loop has no delay",
        ],
        answer: 0,
        why: "A motor's starting current can pull the supply voltage down far enough to restart the microcontroller. A separate 5 V supply with a shared ground fixes it.",
      },
      {
        q: "A servo is powered from a separate battery pack. Its signal wire goes to the board, but the battery's negative terminal is not connected to the board. What will happen?",
        options: [
          "It works normally, because power and signal are separate",
          "The battery will overheat",
          "The servo runs at double speed",
          "The servo behaves erratically, because the signal voltage has no common reference",
        ],
        answer: 3,
        why: "A voltage is always measured between two points. Without a shared ground the servo cannot tell what the signal's HIGH and LOW are.",
      },
      {
        q: "How does a servo signal differ from the PWM used to dim an LED?",
        options: [
          "It uses a much higher voltage",
          "The exact width of each pulse carries the information, not the average brightness or power",
          "It is an analog voltage, not pulses",
          "It only works on analog pins",
        ],
        answer: 1,
        why: "Both are trains of pulses, but the servo's control circuit measures how long each pulse lasts and turns that into an angle.",
      },
    ],
  },

  "b6-ultrasonic-distance": {
    id: "b6-ultrasonic-distance",
    outcomes: [
      "Explain how timing an echo gives a distance",
      "Calculate distance from an echo time, including why the result is halved",
      "Wire an ultrasonic module safely on an Arduino Uno and on an ESP32",
      "Read the distance meter program and explain what it reports when there is no echo",
    ],
    blocks: [
      { t: "h", text: "Measuring with an echo" },
      { t: "p", text: "Shout toward a distant cliff and the echo comes back a moment later. The further the cliff, the longer the wait. If you know how fast sound travels, the wait tells you the distance. Bats find insects this way, and so do the parking sensors in a car bumper." },
      { t: "p", text: "The **ultrasonic sensor** does the same with sound too high for people to hear, typically around 40 000 Hz. The common module has two metal cylinders on the front. One is a tiny loudspeaker and the other a tiny microphone." },

      { t: "h", text: "Trigger and echo" },
      { t: "p", text: "The module has four pins: power, ground, **TRIG** and **ECHO**. A measurement goes like this:" },
      { t: "list", ordered: true, items: [
        "The board sets **TRIG** HIGH for a very short moment, about ten millionths of a second. That is the command to measure.",
        "The module sends out a short burst of ultrasound and sets **ECHO** HIGH.",
        "The burst travels out, bounces off the nearest object and travels back.",
        "When the microphone hears it return, the module sets **ECHO** LOW again.",
      ] },
      { t: "p", text: "So the length of time ECHO stays HIGH is the travel time of the sound. The board's only job is to time one pulse very precisely. This is the third use of timing in this module: PWM set a width, the servo read a width, and now the board **measures** one." },

      { t: "h", text: "From time to distance" },
      { t: "p", text: "Sound in air at room temperature travels at about **343 metres per second**. In the small units a microcontroller works with, that is 0.0343 cm in every microsecond (a microsecond, written µs, is a millionth of a second)." },
      { t: "formula", text: "distance = speed of sound × echo time / 2", caption: "Halved because the sound went there and back, and you want the one-way distance." },
      { t: "p", text: "A worked example. The echo pulse lasts 1000 µs. The sound travelled 1000 × 0.0343 = 34.3 cm in total. Half of that is the distance to the object: **17.15 cm**. A second check in everyday units: an echo time of 2 ms is 0.002 s, and 343 × 0.002 = 0.686 m there and back, so the object is 0.343 m away." },
      { t: "note", kind: "tip", text: "A handy figure to remember: about 58 µs of echo time for every centimetre of distance. An object 10 cm away gives an echo of roughly 580 µs." },

      { t: "h", text: "What it can and cannot see" },
      { t: "list", items: [
        "**Range.** Typically from about 2 cm to about 4 m. Closer than the minimum, the echo returns before the module is ready to listen.",
        "**Beam.** It hears within a cone of roughly 15° either side of straight ahead, so it reports the nearest thing in that cone, which may be the table edge.",
        "**Surfaces.** Hard, flat surfaces facing the sensor work best. Soft things such as clothing absorb the sound. A flat surface at an angle reflects it away like a mirror.",
        "**Accuracy.** Expect a centimetre or so of error. The speed of sound also rises slightly in warm air.",
      ] },
      { t: "p", text: "If no echo comes back within the waiting time, the generated program does not stop or report zero. It reports **400**, meaning \"nothing within range\". Treat 400 as \"no object\", not as a real measurement." },

      { t: "h", text: "Wiring it" },
      { t: "list", ordered: true, items: [
        "Unplug the USB cable.",
        "Connect the module's **VCC** to the board's **5 V** pin and **GND** to **GND**. This module needs 5 V to work.",
        "Connect **TRIG** to the trigger pin shown in the table below.",
        "**Arduino Uno:** connect **ECHO** straight to the echo pin in the table.",
        "**ESP32:** do **not** connect ECHO straight to the pin. Connect a **1 kΩ** resistor from ECHO to the echo pin, and a **2 kΩ** resistor from the echo pin to **GND**.",
      ] },
      { t: "wiring", demo: "demo_distance_meter" },
      { t: "note", kind: "safety", text: "The module's ECHO output is a 5 V signal, and an ESP32 pin must never see more than 3.3 V. The two resistors are the voltage divider from module b5: 5 V × 2 / (1 + 2) = 3.33 V at the pin. A level shifter module does the same job. TRIG needs no divider, because there the signal goes from the board to the module." },
      { t: "p", text: "The table also lists a display. This project shows the distance on an LCD, which module b8 covers. You will come back to the complete project then, so do not connect an LCD yet. On an ESP32 the complete project stops with an error in the Terminal when no LCD is connected. The practice below uses the sensor on its own." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_distance_meter" },
      { t: "list", ordered: true, items: [
        "**Trigger.** The trigger pin is set LOW briefly to start clean, then HIGH for about ten microseconds, then LOW again.",
        "**Time the echo.** One instruction waits for the echo pin to go HIGH and measures how long it stays there, in microseconds. It gives up after a fixed waiting time.",
        "**Convert.** The time is multiplied by 0.0343 and divided by 2: the formula above. If no echo came, the result is set to 400 instead. The answer is stored in the variable `distance`.",
        "**Report.** The `SENSOR` line sends `distance` to the live chart.",
        "**Tidy and show.** A second variable, `cm`, holds the distance as a whole number, and the remaining lines write it to the display. On the Arduino Uno the editor stores variables as decimal numbers, so the screen shows it as `23.00`; even the largest value still fits the 16 places.",
        "**Wait.** Half a second, then the next measurement.",
      ] },
      { t: "p", text: "In the Arduino C++ version the trigger, timing and conversion steps are written once as a small helper near the top of the program, and the loop calls that helper by name. In the MicroPython version the same steps sit inside the loop. The steps themselves are identical." },
    ],
    mistakes: [
      "**ECHO wired straight to an ESP32 pin.** It may appear to work, but 5 V on that pin can damage it for good. Always use the divider or a level shifter.",
      "**Module powered from 3.3 V.** The readings are stuck at 400 or jump about. The common module needs 5 V.",
      "**TRIG and ECHO swapped.** The reading is always 400, because the board is listening on the wrong wire.",
      "**Forgetting to halve.** Every distance comes out exactly double. The sound makes a round trip.",
      "**Measuring a soft or angled target.** A hand held edge-on, or a jumper sleeve, returns almost nothing. Test with a book or a flat piece of card facing the sensor.",
    ],
    practice: {
      kind: "build",
      task: "Check the sensor against a ruler and find out how far you can trust it.",
      steps: [
        "Wire the module as above, including the ECHO divider if you are using an ESP32.",
        "Build a **Forever Loop** containing one **Ultrasonic Sensor** block and run it. The distance appears on the live chart.",
        "Stand a book upright facing the sensor. Use a ruler to place it at 10 cm, 20 cm, 30 cm and 50 cm, and write the ruler distance and the reported distance side by side.",
        "Work out the error at each distance. Is it a fixed number of centimetres, or does it grow with distance?",
        "Move the book closer until the reading stops making sense. That is your module's minimum range.",
        "Turn the book to about 45° and note what happens to the reading. Then point the sensor at empty space and confirm that it reports 400.",
      ],
    },
    quiz: [
      {
        q: "An echo pulse lasts 2000 µs. Using 0.0343 cm per microsecond, how far away is the object?",
        options: ["68.6 cm", "34.3 cm", "17.15 cm", "3.43 cm"],
        answer: 1,
        why: "Total travel is 2000 × 0.0343 = 68.6 cm. The sound went there and back, so the distance is half: 34.3 cm.",
      },
      {
        q: "Why must the ECHO pin go through a voltage divider on an ESP32?",
        options: [
          "To make the sound travel more slowly",
          "Because the ESP32 cannot time short pulses",
          "To double the range of the sensor",
          "Because ECHO is a 5 V signal and an ESP32 pin tolerates only 3.3 V",
        ],
        answer: 3,
        why: "The module runs from 5 V, so its output is 5 V. A 1 kΩ and 2 kΩ divider brings that down to about 3.3 V.",
      },
      {
        q: "The chart shows a steady 400 while a cushion is held 30 cm in front of the sensor, but a book at the same place reads 30. What explains this?",
        options: [
          "The cushion absorbs the ultrasound, so no echo returns and the program reports its out-of-range value",
          "The cushion is 400 cm thick as far as sound is concerned",
          "The sensor is broken",
          "The speed of sound is different near fabric",
        ],
        answer: 0,
        why: "Soft materials soak up the burst. With no echo inside the waiting time the program substitutes 400, which means nothing was detected.",
      },
      {
        q: "A student's program shows 40 cm for an object a ruler puts at 20 cm, and 60 cm for an object at 30 cm. What is the likely error?",
        options: [
          "The module is powered from 3.3 V",
          "TRIG and ECHO are swapped",
          "The echo time was not divided by 2",
          "The object is too soft",
        ],
        answer: 2,
        why: "Readings that are exactly double at every distance mean the full round-trip distance is being reported.",
      },
    ],
  },

  "b6-smart-dustbin": {
    id: "b6-smart-dustbin",
    outcomes: [
      "Break a small system into sense, decide and act, and name the part that does each",
      "Wire an ultrasonic sensor and a servo together with safe power for both",
      "Read the smart dustbin program and predict the lid position for any distance",
      "Test a combined project in stages so a fault can be traced to one part",
    ],
    blocks: [
      { t: "h", text: "One project, three jobs" },
      { t: "p", text: "A touch-free dustbin opens its lid when a hand comes near and closes it again afterwards. Nothing in it is new. It is the ultrasonic sensor from the last lesson, the If-Else block from module b4 and the servo from this module, joined together. Almost every device you will build has the same three jobs:" },
      { t: "table", head: ["Job", "Question", "In the dustbin"], rows: [
        ["Sense", "What is happening outside?", "Ultrasonic sensor measures the distance to whatever is in front"],
        ["Decide", "What should be done about it?", "Compare the distance with a limit"],
        ["Act", "Do it", "Servo turns the lid open or closed"],
      ] },
      { t: "p", text: "When a project misbehaves, this table is your map. A wrong reading is a sensing fault. A right reading with the wrong action is a deciding fault. A right decision that produces no movement is an acting fault." },

      { t: "h", text: "Wiring both parts" },
      { t: "list", ordered: true, items: [
        "Unplug the USB cable.",
        "**Ultrasonic module:** VCC to **5 V**, GND to **GND**, TRIG to the trigger pin in the table below.",
        "**ECHO on an Arduino Uno:** straight to the echo pin in the table.",
        "**ECHO on an ESP32:** through a voltage divider. A **1 kΩ** resistor from ECHO to the echo pin and a **2 kΩ** resistor from the echo pin to **GND**. ECHO is a 5 V signal and must not reach an ESP32 pin directly.",
        "**Servo:** signal wire to the servo pin in the table, red wire to **5 V**, brown or black wire to **GND**.",
        "Check every connection once more against the table, then plug USB back in.",
      ] },
      { t: "wiring", demo: "demo_smart_dustbin" },
      { t: "note", kind: "safety", text: "Two parts now share the 5 V pin, and the servo takes far more current than the sensor. If the board restarts or the distance readings jump when the lid moves, give the servo its own 5 V supply and join that supply's negative terminal to the board's GND. Never power the servo from a GPIO pin, and keep fingers clear of the lid when the program starts." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_smart_dustbin" },
      { t: "list", ordered: true, items: [
        "**Prepare.** The lines before the loop set up the servo. On some boards this section is long, because it includes the code that turns an angle into pulse widths. You met that idea in the servo lesson and can skip over the detail.",
        "**Sense.** Inside the loop the board triggers the ultrasonic module, times the echo and converts it to centimetres in the variable `distance`. A missing echo becomes 400.",
        "**Report.** The `SENSOR` line sends `distance` to the live chart.",
        "**Decide.** One comparison: is `distance` less than the limit?",
        "**Act.** If it is, the servo is sent to 90°, lid open. Otherwise it is sent to 0°, lid closed.",
        "**Wait.** A short pause, and the loop repeats several times a second.",
      ] },
      { t: "p", text: "In the Arduino C++ version the trigger, timing and conversion steps are written once as a small helper near the top of the program, and the loop calls that helper by name. In the MicroPython version the same steps sit inside the loop. The steps themselves are identical." },
      { t: "p", text: "Follow the 400 through the decision. When nothing is in range the sensor reports 400, which is not less than the limit, so the lid stays closed. A design where \"no information\" leads to the safe, quiet state is a good habit to copy." },

      { t: "h", text: "Tuning the limit and the angles" },
      { t: "p", text: "The project opens with a limit already filled in. As with the thresholds in module b5 it is a starting guess. Distance has real units, which makes the choice easier, but the right value still depends on your bin. Watch the chart with nothing nearby and note the reading: it may be the far wall, the table or 400. Then note the reading with a hand where a person would naturally hold it. Put the limit between the two, with a margin." },
      { t: "p", text: "The two angles are guesses as well. How far the servo must turn depends on how the arm is attached to the lid. Start with small movements and increase them, so the servo is never driving the lid against a stop." },

      { t: "h", text: "When the lid flaps" },
      { t: "p", text: "Hold your hand right at the limit and the lid chatters open and shut, because the reading wobbles by a centimetre across the line. This is the flicker from the thresholds lesson in mechanical form. There are two cures. One is hysteresis: open below one distance and close only above a larger one. The other, simpler here, is to add a **Sleep** block after the open command, so the lid stays open for a couple of seconds before the program measures again." },

      { t: "h", text: "Test in stages" },
      { t: "p", text: "Do not wire everything, press run and hope. Build confidence one job at a time:" },
      { t: "list", ordered: true, items: [
        "**Sensor alone.** Leave the servo unplugged. Run the project and check on the chart that `distance` follows your hand.",
        "**Servo alone.** Check that it can reach both angles, using the small sweep program from the servo lesson.",
        "**Together, without the lid.** Run the project with the servo arm free and check that it turns when your hand crosses the limit.",
        "**With the lid attached.** Only now fix the arm to the lid, and adjust the angles.",
      ] },
      { t: "p", text: "If stage 3 fails although stages 1 and 2 passed, the fault is in the decision or in the power, and you have very few places left to look." },
    ],
    mistakes: [
      "**Sensor looking at the lid or the bin's own rim.** The reading is always small, so the lid opens and never closes. Mount the sensor so its cone points clear of the lid in every position.",
      "**Readings jump every time the servo moves.** The servo is disturbing the 5 V supply that the sensor shares. Give the servo a separate supply with a shared ground.",
      "**Lid flaps when a hand is at the limit.** Normal noise is crossing the line. Add a hold-open delay or use two limits.",
      "**ECHO divider left out on an ESP32 because the project seemed to work.** Damage from too much voltage can be gradual. The divider is not optional.",
      "**Debugging the whole thing at once.** Without the chart you cannot tell a sensing fault from an acting fault. Look at `distance` first, every time.",
    ],
    practice: {
      kind: "project",
      demo: "demo_smart_dustbin",
      task: "Open the smart dustbin project and work through the four test stages above. Record the distance reading with nothing in front and with your hand in a natural position, and choose your own limit between them. Then hold your hand at the limit to make the lid flap, and cure it by adding a Sleep block of two seconds after the block that opens the lid. Finish by writing one sentence for each job: what senses, what decides and what acts.",
    },
    quiz: [
      {
        q: "The dustbin program opens the lid when `distance` is less than its limit. Nothing is in front of the sensor, so no echo returns. What does the lid do, and why?",
        options: [
          "Opens, because no echo counts as zero distance",
          "Flaps, because the reading is random",
          "The program stops with an error",
          "Stays closed, because the program reports 400 when there is no echo and 400 is not less than the limit",
        ],
        answer: 3,
        why: "A missing echo is turned into 400, a value far above any sensible limit, so the comparison is false and the else branch closes the lid.",
      },
      {
        q: "On the chart, `distance` drops to 8 when a hand approaches, but the lid does not move. The servo worked in its own test program. Where should you look first?",
        options: [
          "At the ultrasonic sensor's wiring",
          "At the comparison in the If-Else block and at the servo's connections in this circuit",
          "At the speed of sound",
          "At the USB cable",
        ],
        answer: 1,
        why: "The chart proves sensing works. The fault is in deciding or acting: a wrong comparison or variable name, or the servo's signal or power in this build.",
      },
      {
        q: "The lid chatters open and closed when a hand is held still at about the limit distance. Which change addresses the cause?",
        options: [
          "Keep the lid open for a couple of seconds after opening, or use separate open and close distances",
          "Use a faster servo",
          "Remove the pause at the end of the loop",
          "Power the sensor from 3.3 V",
        ],
        answer: 0,
        why: "The reading wobbles across a single limit. A hold time or hysteresis stops small wobbles from changing the decision.",
      },
      {
        q: "Each time the lid opens, the distance reading spikes and the board sometimes restarts. What is the best fix?",
        options: [
          "Lower the limit",
          "Remove the ECHO divider",
          "Give the servo its own 5 V supply and connect that supply's ground to the board's ground",
          "Increase the servo angle",
        ],
        answer: 2,
        why: "The servo's current pulls the shared 5 V down, upsetting the sensor and the board. A separate supply with a common ground isolates the motor's demand.",
      },
    ],
  },
};

export default lessons;
