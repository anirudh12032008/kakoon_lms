import type { ModuleContent } from "../model/curriculum";

/**
 * Module b7: Switching real loads.
 * Rules for lesson text: original wording, no pin numbers or board-specific
 * numbers in prose (use `wiring` / `code` blocks), component figures are
 * marked as typical, and no load is ever powered from a GPIO pin.
 */
const lessons: ModuleContent = {
  "b7-why-a-pin-is-not-enough": {
    id: "b7-why-a-pin-is-not-enough",
    outcomes: [
      "Explain the difference between a signal and a power supply",
      "Compare the current a load needs with the current a pin can give",
      "Predict what happens when a motor or pump is wired straight to a pin",
      "Describe the idea of a small signal controlling a separate, larger current",
    ],
    blocks: [
      { t: "h", text: "A pin carries a message, not muscle" },
      { t: "p", text: "So far every output in this course has been an LED or a buzzer. They work from a pin because they need very little current. A water pump, a fan, a motor or a lamp is a different kind of part. It does physical work, and physical work needs far more current than a pin was ever designed to give." },
      { t: "p", text: "Think of the wall switch for a ceiling fan. Your finger does not turn the fan. Your finger moves a small lever, and the lever lets the building's wiring do the heavy work. A GPIO pin is the finger. It can say **on** or **off**. Something else has to supply the power." },

      { t: "h", text: "How much can a pin give?" },
      { t: "p", text: "A pin on either board is built to supply a small current, enough for an LED with its resistor. As a working rule, plan for no more than about **20 mA** from one pin, and less is better. The chip also has a limit on the total from all its pins together. These are typical working figures, not a promise: the real limits are in each chip's datasheet." },
      { t: "deep", title: "The limits of a whole chip, not just a pin", blocks: [
        { t: "p", text: "A pin's limit is only part of the story. All the pins share the chip's supply and ground connections, which have limits of their own. On the ATmega328P the datasheet gives about 40 mA as the absolute maximum for one pin, recommends staying near 20 mA, and limits the whole chip to about 200 mA in total. Ten LEDs at 20 mA each would already reach the total." },
        { t: "p", text: "**Absolute maximum** in a datasheet does not mean \"safe up to here\". It means damage may begin beyond this point. Designers keep well inside it, which is why this course plans around 20 mA per pin and a handful of pins at a time. The ESP32's datasheet uses different figures (its pins default to a drive strength of about 20 mA, and groups of pins share a power domain with its own budget), so check its own numbers rather than reusing the Uno's." },
      ] },

      { t: "h", text: "How much does a load need?" },
      { t: "table", head: ["Part", "Typical current", "From a pin?"], rows: [
        ["LED with series resistor", "5 to 15 mA", "Yes"],
        ["Relay coil on a 5 V module", "about 70 mA", "No"],
        ["Small 5 V water pump", "150 to 300 mA", "No"],
        ["Small 5 V or 12 V fan", "100 to 250 mA", "No"],
        ["Small hobby servo while moving", "200 to 700 mA", "No"],
      ], caption: "Typical values for classroom parts. Read the label or the seller's listing for your own part." },
      { t: "p", text: "Work one example. Suppose the pump is marked 200 mA and you plan on 20 mA from a pin." },
      { t: "formula", text: "200 mA ÷ 20 mA = 10", caption: "The pump wants ten times what the pin should give. No setting in the program can close that gap." },
      { t: "p", text: "A motor is even worse at the moment it starts or is held still. For a fraction of a second it can draw several times its running current." },

      { t: "h", text: "What happens if you try anyway" },
      { t: "list", items: [
        "The pin's voltage **sags**. The pin tries to hold its level, cannot, and the load gets too little to run. The pump hums or does nothing.",
        "The chip **heats up** inside. The damage is often invisible: the pin simply stops working, today or next week.",
        "The whole board **resets**. The supply dips, the processor restarts, and the program begins again from the top.",
      ] },
      { t: "note", kind: "safety", text: "Never connect a motor, pump, fan, relay coil or servo power wire directly to a GPIO pin. This rule has no exceptions in this course, even for a very small motor and even for a quick test." },

      { t: "h", text: "Two more reasons: voltage and kick-back" },
      { t: "p", text: "Current is not the only mismatch. Many loads need a **different voltage** from the board, for example a 12 V fan. A pin can only output the board's own logic voltage." },
      { t: "p", text: "Motors, pumps and relay coils also contain coils of wire. A coil stores energy while current flows. When the current is cut, that energy has to go somewhere, and it appears as a short, sharp voltage spike, far higher than the supply. A spike like that can destroy a pin. The next lesson shows the small part that absorbs it." },
      { t: "deep", title: "Why a coil kicks back", blocks: [
        { t: "p", text: "A coil stores energy in its magnetic field, and it resists any change in its current. The voltage it produces depends on how fast the current changes:" },
        { t: "formula", text: String.raw`V = L × (change in current) / (time taken)
relay coil: L ≈ 0.1 H, current 70 mA, switched off in 10 µs
V ≈ 0.1 × 0.070 / 0.000010 = 700 V` },
        { t: "p", text: "These are round illustrative figures, but the result is real: cutting a coil's current suddenly produces a spike of hundreds of volts, far above anything a transistor or pin is built to withstand. The faster the switch, the bigger the spike. The cure is to give the current a path to die away slowly instead of stopping it dead, which is the flyback diode in the next lesson." },
      ] },

      { t: "h", text: "The answer: let the pin control a switch" },
      { t: "p", text: "The fix is always the same shape. The load gets its power from a supply that can provide it. In that power path sits an electrically controlled switch. The pin only operates the switch, which takes a tiny current." },
      { t: "list", items: [
        "A **transistor** is a switch with no moving parts.",
        "A **relay** is a mechanical switch moved by an electromagnet.",
        "A **relay module** is a relay with its transistor and protection already built on a small board. This is what you will use.",
      ] },
      { t: "note", kind: "tip", text: "Before wiring any new output, ask two questions. How much current does it need? What voltage does it need? If either answer is more than a pin provides, it goes through a switch." },
    ],
    mistakes: [
      "**Testing a small motor on a pin \"just for a second\".** A second is long enough. If a pin that used to work now does nothing, this is the usual history.",
      "**Thinking the code can fix it.** A longer delay or a different block does not change how much current a pin can supply.",
      "**Reading only the voltage.** A 5 V pump on a 5 V board looks like a match. The voltage matches; the current does not.",
      "**Ignoring the start-up surge.** The project works with the pump out of water and resets when the pump is loaded. The supply or the switch was sized for running current only.",
    ],
    practice: {
      kind: "bench",
      task: "Make a current table for the parts in your kit. No wiring is needed.",
      steps: [
        "Collect every output part in your kit: LEDs, buzzer, relay module, servo, pump or fan.",
        "For each one, find its voltage and current from the label, the kit sheet or the seller's listing. Write **unknown** if you cannot find it.",
        "Add a third column: **pin** or **switch**. Use about 20 mA as the dividing line.",
        "For each part marked **switch**, divide its current by 20 mA to see how many times too large it is for a pin.",
        "Keep the table. You will add these currents together in the last lesson of this module.",
      ],
    },
    quiz: [
      {
        q: "A fan is marked 5 V, 180 mA. Your board's logic voltage is 5 V. Can a pin drive it directly?",
        options: [
          "Yes, because the voltages match",
          "Yes, if the program switches it on slowly",
          "No, because it needs about nine times the current a pin should supply",
          "No, because fans only work on 12 V",
        ],
        answer: 2,
        why: "180 mA ÷ 20 mA is 9. The voltage matches but the current does not, so the fan needs a switch and a supply that can provide 180 mA.",
      },
      {
        q: "Every time the pump starts, the program restarts from the beginning. What is the most likely cause?",
        options: [
          "The supply voltage dips when the pump draws its starting current, and the processor resets",
          "The forever loop has ended",
          "The soil sensor is giving a wrong reading",
          "The USB cable is too short",
        ],
        answer: 0,
        why: "A motor draws a surge when it starts. If that current comes from the same weak supply as the board, the voltage dips and the board resets.",
      },
      {
        q: "Why can switching a motor off be more dangerous to a pin than switching it on?",
        options: [
          "The motor spins backwards",
          "The program runs faster when the motor is off",
          "The pin changes from output to input",
          "The energy stored in the motor's coil produces a short high-voltage spike",
        ],
        answer: 3,
        why: "A coil resists a sudden stop in current. When the current is cut, the stored energy shows up as a voltage spike much higher than the supply.",
      },
      {
        q: "Which statement best describes the job of the pin when a relay module controls a pump?",
        options: [
          "It supplies the pump's current through the relay",
          "It sends an on or off signal; the pump's current comes from a separate supply",
          "It measures how much water has been pumped",
          "It raises the voltage to what the pump needs",
        ],
        answer: 1,
        why: "The pin only operates the switch. The load's current flows from its own supply through the switch contacts and never through the pin.",
      },
    ],
  },

  "b7-relays-and-transistors": {
    id: "b7-relays-and-transistors",
    outcomes: [
      "Explain how a transistor and a relay each act as a switch",
      "Say what a flyback diode does and where it goes",
      "Wire a relay module using its COM, NO and NC terminals",
      "Recognise an active low relay module and set the Relay block to match",
    ],
    blocks: [
      { t: "h", text: "The transistor: a switch with no moving parts" },
      { t: "p", text: "A transistor has three legs. A small current into the control leg lets a much larger current flow between the other two. For switching a load, the usual arrangement puts the transistor between the load and ground: the load's positive side goes to its supply, its negative side goes to the transistor, and the transistor connects it to ground when the pin says so." },
      { t: "p", text: "The pin connects to the control leg through a resistor, often around **1 kΩ** for a common small transistor. The resistor limits the pin's current to a few milliamps, well inside what a pin can give. Because the signal and the load share the transistor, the board's ground and the load supply's ground must be joined." },

      { t: "h", text: "The flyback diode" },
      { t: "p", text: "The last lesson described the voltage spike a coil produces when its current is cut. A **flyback diode** gives that current somewhere harmless to go. It is an ordinary diode wired across the coil or motor, **backwards** compared with normal current flow: the striped end goes to the positive side." },
      { t: "p", text: "In normal running the diode does nothing, because it faces the wrong way. At switch-off the coil's current loops round through the diode and dies away in a few milliseconds instead of punching through the transistor." },
      { t: "note", kind: "warn", text: "A transistor switching a relay coil, motor, pump or fan without a flyback diode may work for a while and then fail without warning. If you build your own transistor switch, the diode is part of the circuit, not an extra." },

      { t: "h", text: "The relay: a switch moved by a magnet" },
      { t: "p", text: "Inside a relay is a coil and a springy metal contact. Current in the coil makes a magnet, the magnet pulls the contact across, and you hear a **click**. The coil side and the contact side are not electrically connected, so the load circuit is fully separate from the board." },
      { t: "p", text: "The coil itself needs about 70 mA (typical for a 5 V relay), so a pin cannot drive a bare relay. A **relay module** solves this: one small board carries the relay, a transistor to drive the coil, on most modules a flyback diode, and an indicator LED. Use a module, not a bare relay." },
      { t: "table", head: ["Terminal", "Meaning", "Connected to COM when"], rows: [
        ["**COM**", "Common: the moving contact", "always, it is the moving part"],
        ["**NO**", "Normally open", "the relay is **on**"],
        ["**NC**", "Normally closed", "the relay is **off**"],
      ], caption: "\"Normally\" means with the coil unpowered. For a load that should be off until the program switches it on, use COM and NO." },
      { t: "deep", title: "Inside a relay: coil current and why the flyback diode is needed", blocks: [
        { t: "p", text: "A common blue 5 V relay module uses a relay whose coil measures about 70 Ω. Ohm's law gives the coil current: 5 / 70 ≈ **71 mA**, more than three times a pin's working limit. The coil is wound from hundreds of turns of thin wire around an iron core, so it is also a strong inductor, and the last lesson showed what an inductor does when its current is cut." },
        { t: "p", text: "With a diode across the coil, at switch-off the coil current flows round the loop through the diode and fades out in a few milliseconds, while the voltage at the transistor rises only about 0.7 V above the supply. The price is that the relay releases slightly more slowly, which does not matter for a pump or a lamp." },
        { t: "p", text: "The contact side is rated separately and printed on the relay's case, often 10 A at 250 V AC and 10 A at 30 V DC. That rating is for the contacts only. The tracks and screw terminals of a cheap module may not safely carry anything like it." },
        { t: "note", kind: "safety", text: "Mains voltage on a relay module's screw terminals is exposed and can kill. In this course switch only low-voltage DC loads. Mains switching needs enclosed, certified hardware and supervision." },
      ] },

      { t: "h", text: "Active low modules" },
      { t: "p", text: "Some relay modules switch on when their input pin is HIGH. Many common ones do the opposite: they switch on when the input is **LOW**. These are called **active low**. Nothing is broken; the module simply reads the signal upside down." },
      { t: "p", text: "The editor's **Relay** block has an **Active low** option. Leave it at No for an active high module. Set it to Yes for an active low module, and the block sends the opposite level so that \"on\" in your program still means the relay is on." },
      { t: "note", kind: "warn", text: "Many 5 V relay modules, especially active low ones, do not switch reliably from the 3.3 V signal of an ESP32: the relay may stay on, or never click. Before you connect one to an ESP32, power the module and measure with a multimeter, on its DC voltage range, from GND to its **IN** pin while IN is connected to nothing. If the reading is above 3.3 V, do not connect it to the ESP32. Then test with the load disconnected. If the module fails either check, use one sold for 3.3 V logic." },
      { t: "deep", title: "Making sure the transistor switches fully on", blocks: [
        { t: "p", text: "A bipolar transistor multiplies the current into its control leg (the **base**) by its **gain**, often written hFE. A small switching transistor might have a gain of 100 or more, so a base current of 1 mA could allow 100 mA through the load. To switch hard, so the transistor drops almost no voltage and stays cool, designers give it several times the base current it strictly needs." },
        { t: "formula", text: String.raw`base current = (pin voltage - 0.7 V) / base resistor
Uno, 1 kΩ:    (5 - 0.7)   / 1000 ≈ 4.3 mA
ESP32, 1 kΩ:  (3.3 - 0.7) / 1000 ≈ 2.6 mA
relay coil 71 mA, gain 100  →  needs at least 0.71 mA. Both are well above it.` },
        { t: "p", text: "For heavier loads, such as a pump drawing an ampere or more, designers switch to a **MOSFET**, which is controlled by voltage instead of current. Choose a **logic-level** MOSFET, one whose datasheet shows it fully on at the pin's voltage. Many popular MOSFETs need about 10 V on the gate and only half switch on from a 3.3 V ESP32 pin, getting hot as a result." },
      ] },

      { t: "h", text: "Wiring the plant watering project" },
      { t: "list", ordered: true, items: [
        "Disconnect USB before you touch any wire.",
        "Soil probe: connect its **VCC** to the **3.3 V** pin on an ESP32 or the **5 V** pin on an Arduino Uno, its **GND** to **GND**, and its analog output to the pin shown in the table.",
        "Relay module, control side: **VCC** to the board's **5 V** pin, **GND** to **GND**, and **IN** to the pin shown in the table. On an ESP32, do the IN pin check from the warning above before connecting IN.",
        "Do not connect the pump yet. Run the program and check that the relay clicks and its LED changes when you move the probe between dry and wet soil.",
        "Disconnect USB again. Now wire the load side: the positive wire of the pump's own supply to **COM**, a wire from **NO** to the pump's positive lead, and the pump's negative lead back to the supply's negative. A flyback diode across the pump's two leads, striped end to positive, protects the relay contacts.",
      ] },
      { t: "wiring", demo: "demo_plant_watering" },
      { t: "note", kind: "safety", text: "In this course a relay switches only low-voltage DC loads: a 5 V or 12 V pump or fan fed from a DC adapter or a battery pack. A relay is able to switch mains voltage, and that is exactly why this needs saying plainly: you never wire mains in this course. Mains can kill, and a breadboard gives no protection." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_plant_watering" },
      { t: "list", ordered: true, items: [
        "**Setup.** The relay's pin is made an output. On the ESP32 the analog input is also prepared here.",
        "**Measure.** The probe's voltage is read into the variable `moisture`. With this probe a **higher** number means **drier** soil.",
        "**Decide.** The `if` asks whether `moisture` is above the dry threshold. The number in the program is a starting point; find your own with the method from the thresholds lesson.",
        "**Act.** Dry soil switches the relay on, which runs the pump. Otherwise the relay is switched off.",
        "**Wait.** The loop pauses for a second, so the soil is checked once a second.",
      ] },
      { t: "p", text: "Notice that the program writes a plain HIGH for on. That is correct for an active high module. With an active low module and the option left at No, everything works backwards." },
    ],
    mistakes: [
      "**The pump runs when the soil is wet and stops when it is dry.** The module is active low. Set **Active low** to Yes in both Relay blocks.",
      "**Using NC instead of NO.** The pump runs whenever the relay is off, including while the board is unpowered or being programmed.",
      "**The relay LED changes but there is no click.** The coil is not getting enough power. Check that the module's VCC is on the 5 V pin, not on a GPIO pin or the 3.3 V pin.",
      "**The relay clicks but the pump does nothing.** The control side is fine. The fault is on the load side: the pump's supply, its polarity, or a wire not clamped in the screw terminal.",
      "**Powering the pump from the board's 5 V pin through the relay.** The relay does the switching, but the current still comes from USB. Give the pump its own supply.",
    ],
    practice: {
      kind: "project",
      demo: "demo_plant_watering",
      task: "Open the smart plant watering project. First run it with only the soil probe and the relay module connected, and confirm the relay clicks on in dry soil and off in wet soil. If it is backwards, set **Active low** to Yes in both Relay blocks. Only then disconnect USB and add the pump and its own supply through COM and NO. Keep water away from the board and the breadboard.",
    },
    quiz: [
      {
        q: "A pump must be off whenever the board is unpowered. Which relay terminals carry the pump's supply?",
        options: ["NC and NO", "COM and NC", "IN and GND", "COM and NO"],
        answer: 3,
        why: "COM and NO are only joined while the relay is energised, so with no power to the board the pump circuit is open.",
      },
      {
        q: "With an unchanged project, the relay switches on when the program says off, and off when it says on. What is the cleanest fix?",
        options: [
          "Swap the module's VCC and GND wires",
          "Set the Relay block's Active low option to Yes",
          "Remove the flyback diode",
          "Raise the dry threshold",
        ],
        answer: 1,
        why: "The module is active low: it switches on for a LOW input. The option makes the block send the opposite level so on means on again.",
      },
      {
        q: "In which direction is a flyback diode fitted across a relay coil or motor?",
        options: [
          "Striped end to the positive side, so it does not conduct in normal running",
          "Striped end to ground, so it conducts all the time",
          "In series with the coil, to limit the current",
          "Either way round, a diode has no direction",
        ],
        answer: 0,
        why: "Fitted backwards, the diode is idle in normal running and only conducts the coil's own current at switch-off, which removes the spike.",
      },
      {
        q: "The relay clicks and its LED lights at the right moments, but the pump never runs. Where do you look first?",
        options: [
          "The soil threshold in the If-Else block",
          "The Active low option",
          "The load side: pump supply, polarity, and the COM and NO connections",
          "The analog pin of the soil probe",
        ],
        answer: 2,
        why: "A click at the right time proves the sensor, the program and the control side all work. Only the load circuit is left to check.",
      },
    ],
  },

  "b7-powering-a-project": {
    id: "b7-powering-a-project",
    outcomes: [
      "Add up the current of each part to make a power budget",
      "Decide when a load needs its own supply",
      "Explain why grounds are joined and wire a common ground",
      "Recognise the symptoms of a supply that is too weak",
    ],
    blocks: [
      { t: "h", text: "USB is a small supply" },
      { t: "p", text: "While you work at a computer, the whole project runs from the USB port. A typical computer port provides about **500 mA** at 5 V, and some provide less. The board itself, every sensor, every LED and every module shares that one allowance. It is enough for sensors and a display. It is usually not enough for anything that moves." },

      { t: "h", text: "Make a current budget" },
      { t: "p", text: "A budget is a list of parts with the current each one needs, and a total at the bottom. Do it before you wire, the same way you would check your money before shopping. Here is one for the fan control project, with typical figures:" },
      { t: "table", head: ["Part", "Typical current"], rows: [
        ["The board itself", "50 mA"],
        ["DHT11 sensor", "about 2 mA"],
        ["Relay module with coil on", "about 75 mA"],
        ["5 V fan", "200 mA"],
      ] },
      { t: "formula", text: "50 + 2 + 75 + 200 = 327 mA", caption: "On paper this fits inside 500 mA. Now add a margin." },
      { t: "p", text: "Motors draw extra at start-up, and parts vary. A sensible rule is to choose a supply rated for at least **one and a half times** the total. Here that is about 490 mA: right at the edge of a USB port, with a motor's start-up surge still to come. The decision is clear: the fan gets its own supply, and USB keeps the remaining 127 mA, which it handles easily." },
      { t: "note", kind: "tip", text: "A quick shortcut: anything with a motor in it (fan, pump, servo) gets its own supply unless your budget proves otherwise. The only exception is a brief test of one very small, unloaded servo from the board's 5 V pin, never from a GPIO pin." },
      { t: "deep", title: "Why a supply's voltage drops under load", blocks: [
        { t: "p", text: "No supply is perfect. Each has some internal resistance, from its circuit, its cable and its connectors. When current flows, some voltage is lost across that resistance before it reaches your project." },
        { t: "formula", text: String.raw`voltage at the board = supply voltage - current × resistance of supply and cable
thin USB cable, 0.5 Ω round trip, 400 mA:  5 - 0.4 × 0.5 = 4.8 V
same cable, 900 mA motor start:            5 - 0.9 × 0.5 = 4.55 V` },
        { t: "p", text: "This is why a long, thin USB cable can make a project misbehave only when the motor starts. The standard limits help with planning too: a USB 2.0 port promises 500 mA and a USB 3 port 900 mA, while a phone charger may give more but sags in its own way." },
      ] },

      { t: "h", text: "Choosing the second supply" },
      { t: "list", items: [
        "**Match the voltage** to the load: a 5 V pump from a 5 V supply, a 12 V fan from a 12 V adapter.",
        "**Exceed the current**: the supply's rated current must be more than the load needs. A load only takes what it needs, so a larger rating is safe.",
        "**Check polarity** before connecting. Most DC motors just spin backwards, but fans and modules can be destroyed by reversed power.",
        "A pack of four AA cells is a good 6 V source for small motors and servos. A small 9 V block battery cannot give much current and sags quickly under a motor.",
      ] },
      { t: "note", kind: "safety", text: "A supply above the board's logic voltage must never reach a GPIO pin. A 12 V wire that touches a pin destroys it. An ESP32 pin must never see more than 3.3 V. Disconnect USB and the second supply before rewiring, and use only low-voltage DC supplies: no mains wiring." },

      { t: "h", text: "Common ground" },
      { t: "p", text: "A voltage is always measured between two points. When a board sends a signal to a transistor, a servo or a module with its own supply, the receiver can only make sense of that signal if both sides agree on what zero is. That shared zero is **ground**. With two supplies, join their negative sides: one wire from the board's **GND** to the negative terminal of the second supply. Only the grounds are joined, never the positive sides." },
      { t: "p", text: "A relay's contacts are the one exception. COM, NO and NC are isolated from the board, so the load circuit that passes through them needs no ground link. The relay module's own GND pin still goes to the board's GND." },
      { t: "deep", title: "Why linear regulators get hot", blocks: [
        { t: "p", text: "Boards make their lower voltages with a **linear regulator**, which works like a self-adjusting resistor: it drops whatever voltage is in excess and turns it into heat. The power it wastes is the voltage it drops times the current through it." },
        { t: "formula", text: String.raw`heat in regulator = (input voltage - output voltage) × current
9 V adapter into an Uno's barrel jack, 300 mA from the 5 V pin:
(9 - 5) × 0.3 = 1.2 W   (too hot to touch for a small regulator)
12 V adapter, same load:  (12 - 5) × 0.3 = 2.1 W` },
        { t: "p", text: "A small regulator on a board can only shed perhaps a watt before it overheats and shuts down or fails. That is why a board's regulator is a poor place to power motors from, and why a higher adapter voltage is not \"more power\" but more heat. A **switching** regulator (a buck converter) converts voltage with little waste and is the right tool when large currents are needed." },
      ] },

      { t: "h", text: "Signs of a weak supply" },
      { t: "list", items: [
        "The board restarts or the computer reports the USB device disconnecting when a motor starts.",
        "An LCD backlight dims or sensor readings jump at the moment a load switches.",
        "A servo twitches or buzzes instead of moving cleanly.",
        "Everything works with the load unplugged and fails with it connected.",
      ] },

      { t: "h", text: "Wiring the fan control project" },
      { t: "list", ordered: true, items: [
        "Disconnect USB. Connect the DHT11 module's **VCC** to the **3.3 V** pin on an ESP32 or the **5 V** pin on an Arduino Uno, **GND** to **GND**, and its data pin to the pin shown in the table.",
        "Connect the relay module's **VCC** to the board's **5 V** pin, **GND** to **GND**, and **IN** to the pin in the table. On an ESP32, use a module that passed the IN pin check from the relay lesson: nothing above 3.3 V may reach the pin.",
        "Test without the fan: warm the sensor between your fingers and listen for the relay.",
        "Disconnect USB, then wire the fan's own supply through **COM** and **NO** exactly as you did for the pump.",
      ] },
      { t: "wiring", demo: "demo_fan_control" },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_fan_control" },
      { t: "p", text: "The DHT11 is explained properly in the next module. For now, treat it as the source of a number called `temperature`, in degrees Celsius. The program reads it, switches the relay on if it is above 30, switches it off otherwise, and waits two seconds." },
      { t: "p", text: "One weakness is worth noticing. When the room sits right at the threshold, the reading can step back and forth and the relay clicks on and off every couple of seconds. Real controllers use two thresholds, one to switch on and a lower one to switch off. You could build that with a second If-Else as an extension." },
      { t: "deep", title: "Why ground must be shared, in one picture", blocks: [
        { t: "p", text: "A voltage is always measured between two points. When the board says HIGH, it means its pin is 5 V or 3.3 V above **its own** ground. A module powered from a separate supply judges that signal against **its** ground. If the two grounds are not joined, there is no fixed relationship between them, and the signal can mean anything." },
        { t: "diagram", text: String.raw`board pin ──── signal ────► module input
board GND ──┐               ┌── module GND
            └───── joined ──┘        (without this wire the signal has no reference)
board supply: USB 5 V          module supply: its own adapter` },
        { t: "p", text: "Only the grounds are joined, never the two positive supplies. Connecting two different supply voltages together lets them fight, with large currents flowing between them." },
      ] },
    ],
    mistakes: [
      "**No common ground.** A servo or transistor-switched load on its own supply behaves at random until the board's GND and the supply's negative are joined.",
      "**Joining the positive sides as well.** Connecting the board's 5 V pin to a second supply's positive makes the two supplies fight. Join grounds only.",
      "**Budgeting only the running current.** The project passes a quiet test and resets when the motor starts under load.",
      "**Running a motor from a small 9 V block battery.** It works for a minute, then the voltage collapses. Use AA cells or an adapter.",
      "**Trusting a power bank for a tiny project.** Many power banks switch themselves off when the current is very low, so the project stops after a few seconds.",
    ],
    practice: {
      kind: "project",
      demo: "demo_fan_control",
      task: "Before wiring, write the current budget for your own parts using the table you made in the first lesson, and decide what runs from USB and what needs its own supply. Then open the fan control project, test it with the fan disconnected, and add the fan on its own supply. To test without waiting for a hot day, lower the 30 in the If-Else block to just above your room's reading and warm the sensor with your fingers.",
    },
    quiz: [
      {
        q: "A project has a board (50 mA), an LCD (30 mA), a relay module (75 mA) and a pump (300 mA). Using the one and a half times rule, what supply current should you plan for if everything shared one supply?",
        options: ["About 455 mA", "About 300 mA", "About 500 mA", "About 680 mA"],
        answer: 3,
        why: "The total is 455 mA, and 455 × 1.5 is about 680 mA. That is more than a USB port gives, so the pump needs its own supply.",
      },
      {
        q: "A servo has its own battery pack. Its signal wire goes to the board. It twitches at random. What is most likely missing?",
        options: [
          "A wire joining the battery pack's negative to the board's GND",
          "A wire joining the battery pack's positive to the board's 5 V pin",
          "A resistor in the signal wire",
          "A second battery pack",
        ],
        answer: 0,
        why: "Without a shared ground the servo has no reference for the signal voltage, so it reads noise. Only the grounds are joined.",
      },
      {
        q: "A pump needs 5 V and 250 mA. Which supply is suitable?",
        options: [
          "12 V, 250 mA",
          "5 V, 100 mA",
          "5 V, 1000 mA",
          "3.3 V, 1000 mA",
        ],
        answer: 2,
        why: "The voltage must match and the current rating must be at least what the load needs. A load draws only what it needs, so a larger current rating is safe.",
      },
      {
        q: "The fan relay clicks on and off every two seconds when the room is close to 30 degrees. Why?",
        options: [
          "The relay is faulty",
          "The reading wobbles around a single threshold, so each pass of the loop gives a different answer",
          "The supply is too weak",
          "The relay is active low",
        ],
        answer: 1,
        why: "With one threshold, a reading that steps between just below and just above it flips the output each time. A separate, lower switch-off threshold stops this.",
      },
    ],
  },
};

export default lessons;
