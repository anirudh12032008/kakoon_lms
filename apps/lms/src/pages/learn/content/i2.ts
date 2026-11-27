import type { ModuleContent } from "../model/curriculum";

/**
 * Module i2: Semiconductor devices and analog building blocks.
 * Same house rules as i1: Normal mode is a complete lesson, `deep` holds
 * derivations and datasheet detail, String.raw for code and drawings,
 * every worked number checked, no long dashes.
 * Part figures are quoted from common manufacturers' datasheets (onsemi,
 * Vishay, Infineon, Alpha and Omega, Texas Instruments, Microchip, Avia);
 * second-source parts can differ, so the lessons tell students to check theirs.
 */
const lessons: ModuleContent = {
  "i2-diodes-rectifiers-zeners-and-protection": {
    id: "i2-diodes-rectifiers-zeners-and-protection",
    outcomes: [
      "Explain forward voltage, reverse leakage and breakdown from a diode's I-V curve",
      "Design a rectifier with a reservoir capacitor and estimate its ripple",
      "Size a Zener shunt regulator and an LED series resistor",
      "Choose between a silicon, Schottky and Zener diode, and protect a microcontroller input with clamps",
    ],
    blocks: [
      { t: "h", text: "The one-way valve that every board relies on" },
      { t: "p", text: "Look at any microcontroller board and you will find diodes doing quiet but essential jobs: stopping a reversed battery from destroying the regulator, catching the spike from a relay coil, keeping an input from going above the supply, turning AC from a transformer into DC, and making light. The ESP32 itself has a diode from every GPIO pin to its 3.3 V rail and another to ground. A diode is the simplest semiconductor part, and understanding it properly is the base for transistors, which are built from the same junctions." },

      { t: "h", text: "The diode's I-V curve" },
      { t: "p", text: "A diode is a junction of p-type and n-type silicon. Current flows easily from the **anode** (p side) to the **cathode** (n side, marked by the band) once the forward voltage exceeds a threshold, and hardly at all the other way. The relation is exponential, not a sharp switch: below about 0.5 V a silicon diode passes almost nothing, and around 0.6 V to 0.8 V the current rises by a factor of ten for every additional 60 mV or so. That is why engineers treat a conducting silicon diode as a fixed drop of about **0.7 V**, and why the forward voltage in a datasheet is always quoted at a stated current." },
      { t: "diagram", text: String.raw`
           I
           │                 │
           │                 │   forward: steep rise
           │                /    beyond about 0.6 V
           │              /
  ─────┬───┼──────────..─────────── V
       │   │  tiny reverse leakage
       │   │
       │      breakdown at V_BR (Zener or avalanche)
       │`, caption: "A diode's current against voltage, not to scale." },
      { t: "p", text: "In reverse, a small **leakage current** flows (nanoamps for a small silicon diode, far more for a Schottky). Push the reverse voltage far enough and the diode **breaks down** and conducts heavily. For a rectifier this is a failure: you choose a part whose reverse rating is well above anything it will see. For a Zener diode it is the whole point." },

      { t: "h", text: "Four kinds of diode you will actually buy" },
      { t: "table", head: ["Part", "Type", "Key figures (datasheet)", "Use it for"], rows: [
        ["1N4007", "Silicon rectifier", "1000 V reverse, 1 A average, V_F up to 1.1 V at 1 A, 30 A surge", "Mains-frequency rectifiers, reverse-polarity protection, flyback across slow relays"],
        ["1N4148", "Small-signal silicon", "100 V, about 200 mA continuous, fast (4 ns recovery)", "Logic, clamping, fast signal work"],
        ["1N5819", "Schottky", "40 V reverse, 1 A, V_F up to 0.60 V at 1 A, leakage up to 1 mA at 40 V", "Low-drop power paths, battery OR-ing, fast clamps"],
        ["BZX55C3V3 (and family)", "Zener", "3.3 V ±5% at 5 mA test current, 500 mW", "Voltage references, crude regulation, clamping"],
      ], caption: "Values from common makers' datasheets; check the sheet for the exact part you buy." },
      { t: "p", text: "A **Schottky diode** uses a metal to semiconductor junction. It drops about half the voltage of a silicon diode and switches almost instantly, which makes it the better choice where every tenth of a volt matters, such as feeding a 3.3 V system from a battery. The price is reverse leakage that is far higher and rises steeply with temperature, and lower reverse voltage ratings. An **LED** is a diode made of a compound semiconductor that emits light; its forward voltage depends on the colour, from about 1.8 V for red to about 3 V for blue and white." },

      { t: "h", text: "LED series resistor" },
      { t: "p", text: "Because the LED's current rises exponentially with voltage, you set its current with a resistor, not by choosing a voltage. The resistor takes whatever voltage is left over. From a 3.3 V ESP32 pin, a red LED with V_F ≈ 2.0 V at 10 mA needs R = (3.3 - 2.0) / 0.010 = **130 Ω**. Use 150 Ω (the nearest common value above) and the current becomes about 8.7 mA. Check the GPIO: the ESP32's default drive is fine for this, and you have stayed well inside its per-pin limit." },

      { t: "h", text: "Rectifiers and the reservoir capacitor" },
      { t: "p", text: "A **bridge rectifier** of four diodes turns an AC input into a series of positive half-cycles at twice the mains frequency, 100 Hz in India. A large **reservoir capacitor** after it charges to the peak and then supplies the load between peaks, so the output is DC with a sawtooth **ripple**. Two diodes conduct at a time, so the peak output is the AC peak minus about 1.4 V." },
      { t: "formula", text: String.raw`V_peak = V_rms × √2 - 2 × V_F
Ripple   ΔV ≈ I_load / (f_ripple × C)      f_ripple = 100 Hz for a bridge on 50 Hz mains

Example: 12 V RMS transformer, 1N4007 bridge, 100 mA load, 1000 µF
V_peak ≈ 12 × 1.414 - 1.4 = 15.6 V
ΔV ≈ 0.1 / (100 × 0.001) = 1.0 V`, caption: "The ripple formula assumes the capacitor supplies the load for the whole cycle, which slightly overestimates it." },
      { t: "p", text: "Check the logic: the capacitor loses charge Q = I × t = 0.1 A × 10 ms = 1 mC between peaks, and ΔV = Q / C = 0.001 / 0.001 = 1 V. So the output swings between about 15.6 V and 14.6 V, which a linear regulator such as a 7805 can then smooth to a steady 5 V. Choose the capacitor's voltage rating above the peak (25 V here) and the diodes' reverse rating far above it (the 1N4007's 1000 V is plenty)." },
      { t: "note", kind: "safety", text: "Mains (230 V AC) can kill. In this course, rectifier experiments use a low-voltage transformer or AC adapter that is already enclosed and plugged in, and you work only on its low-voltage secondary. Never open, wire or probe the mains side." },

      { t: "h", text: "Zener diodes: a voltage you can rely on" },
      { t: "p", text: "A Zener diode is built to break down at a precise reverse voltage, V_Z, and to survive doing so. Put it in reverse with a series resistor and the voltage across it stays close to V_Z over a range of currents: a **shunt regulator**. Size the resistor so that the Zener gets roughly its test current (5 mA for the BZX55 series) plus whatever the load takes." },
      { t: "formula", text: String.raw`R = (V_in - V_Z) / (I_Z + I_load)

Example: 5 V in, BZX55C3V3, no load, I_Z = 5 mA
R = (5 - 3.3) / 0.005 = 340 Ω   →  use 330 Ω, I_Z = 5.15 mA
Zener dissipation = 3.3 × 5.15 mA ≈ 17 mW   (rating 500 mW)`, caption: "Check that the Zener's power stays far below its rating with the load removed, its worst case." },
      { t: "p", text: "A Zener regulator wastes current all the time and its voltage shifts with current and temperature, so it is not a substitute for a real regulator. It is excellent as a **clamp**: a 3.3 V Zener behind a resistor will stop a signal from climbing far above 3.3 V. Low-voltage Zeners (below about 5 V) have a soft knee and leak noticeably below V_Z, so a 3.3 V Zener clamp starts drawing current at around 2.5 V; this matters if it sits on an ADC input." },

      { t: "h", text: "Protection and clamping" },
      { t: "list", items: [
        "**Reverse-polarity protection**: a series diode (1N5819 for low loss) in the supply lead blocks current if the battery is fitted backwards. It costs its forward drop all the time; a P-channel MOSFET does the same job with almost no drop.",
        "**Flyback diode**: across a relay coil or motor, cathode to the positive supply, as in the transients lesson. A 1N4007 is fine for relays; a Schottky or fast diode is better for PWM-driven motors.",
        "**Input clamping**: a series resistor followed by diodes to the supply and to ground limits any pin to roughly one diode drop outside the rails. The microcontroller's internal clamp diodes do this weakly; the resistor is what limits the current through them to a safe level (keep it to around 1 mA or less). External Schottky clamps (a dual part such as BAT54S) take the current instead of the chip.",
        "**TVS diodes**: transient voltage suppressors are fast, robust Zener-like parts for protecting connectors and long cables from ESD and surges.",
      ] },
      { t: "note", kind: "warn", text: "A 5 V signal into an ESP32 pin, even through its internal clamp diode, can push current into the 3.3 V rail and damage the chip or raise the rail. Use a divider, a series resistor with a clamp, or a level shifter." },

      { t: "deep", title: "The Shockley diode equation and the 60 mV per decade rule", blocks: [
        { t: "p", text: "The ideal diode equation relates current to voltage through the thermal voltage V_T = kT/q, which is about 25.9 mV at 27 °C (often rounded to 26 mV)." },
        { t: "formula", text: String.raw`I = I_S · (e^(V / (n · V_T)) - 1)
For V well above V_T:   V = n · V_T · ln(I / I_S)
Tenfold current change: ΔV = n · V_T · ln 10 ≈ n × 59.6 mV`, caption: "I_S is the saturation current (femtoamps to nanoamps), n the ideality factor between about 1 and 2." },
        { t: "p", text: "With n = 1, each factor of ten in current needs about 60 mV more forward voltage, which is why a diode looks like a fixed 0.6 V to 0.7 V drop across three decades of current. The forward voltage also falls by about 2 mV per °C at constant current, so a diode is a crude thermometer, and a hot rectifier carries more current than a cold one in parallel with it (which is why you do not parallel diodes without ballast resistors). The same equation, with the base-emitter junction, governs the BJT in the next lesson." },
      ] },
      { t: "deep", title: "Reverse recovery, and why Schottky diodes leak", blocks: [
        { t: "p", text: "A conducting silicon diode has charge stored in its junction. When the voltage reverses, that charge must be swept out before the diode blocks, so for a short time (the **reverse recovery time**, t_rr) it conducts backwards. For a 1N4007 this is several microseconds, harmless at 100 Hz but wasteful and noisy in a switching regulator at 500 kHz. Fast-recovery and Schottky diodes are used there instead." },
        { t: "p", text: "A Schottky diode conducts with majority carriers only, so it stores almost no charge and has essentially no recovery time. Its lower barrier, which gives the low forward drop, also lets more carriers cross in reverse, so leakage is higher. The 1N5819 datasheet allows up to 1 mA at its full 40 V at 25 °C, rising by roughly ten times at 100 °C. In a battery-powered device sleeping at a few microamps, that leakage can dominate the power budget, so read the leakage figure at your actual reverse voltage and temperature." },
      ] },
    ],
    mistakes: [
      "**Fitting a diode backwards.** The band is the cathode. In a flyback position the cathode goes to the positive supply; reversed, the diode shorts the supply when the transistor turns on.",
      "**Driving an LED with no series resistor** because \"it's only 3.3 V\". The current is then limited only by the pin, which overloads it.",
      "**Choosing a rectifier capacitor without checking ripple and voltage rating.** Too small and the regulator drops out at each trough; under-rated and it fails.",
      "**Using a Zener regulator for a load that varies a lot.** If the load takes more than the resistor supplies, the Zener stops regulating.",
      "**Ignoring Schottky leakage** in low-power designs or on high-impedance sensor lines.",
      "**Relying on a microcontroller's internal clamp diodes** to absorb an over-voltage with no series resistor.",
    ],
    practice: {
      kind: "bench",
      task: "Characterise three diodes and build a Zener clamp for a 3.3 V input.",
      steps: [
        "Connect a 1N4007, a 1N5819 and a red LED in turn, each in series with 1 kΩ from a 5 V supply (forward direction). Measure the forward voltage and calculate the current for each.",
        "Repeat with 100 Ω for the 1N4007 and 1N5819 only. Compare how much V_F changed for the roughly tenfold change in current.",
        "Build a shunt regulator from 5 V: 330 Ω in series with a BZX55C3V3 to ground. Measure the Zener voltage with no load, then with 1 kΩ and 470 Ω loads. Explain the trend.",
        "Build an input clamp: 1 kΩ series resistor, then a 1N5819 from the node to 3.3 V and another from GND to the node. Feed the input from 0 V to 5 V with a bench supply and plot the node voltage. Do not connect a microcontroller pin until the clamp is proven.",
      ],
    },
    quiz: [
      {
        q: "A blue LED (V_F ≈ 3.0 V at 5 mA) is driven from a 5 V Uno pin. What series resistor gives about 5 mA?",
        options: ["600 Ω", "400 Ω", "1 kΩ", "60 Ω"],
        answer: 1,
        why: "R = (5 - 3.0) / 0.005 = 400 Ω. The resistor takes the voltage the LED does not.",
      },
      {
        q: "A bridge rectifier on 50 Hz mains feeds a 2200 µF capacitor and a 220 mA load. Roughly what is the ripple?",
        options: ["0.1 V", "2 V", "4.4 V", "1 V"],
        answer: 3,
        why: "Ripple frequency is 100 Hz, so ΔV ≈ I/(fC) = 0.22 / (100 × 0.0022) = 1.0 V.",
      },
      {
        q: "Why would you choose a 1N5819 rather than a 1N4007 for reverse-polarity protection on a 3.7 V battery device?",
        options: [
          "It blocks higher reverse voltages",
          "Its forward drop is about half, so less of the small battery voltage is lost",
          "It has lower leakage",
          "It is the only one that conducts DC",
        ],
        answer: 1,
        why: "A Schottky drops about 0.3 V to 0.6 V compared with 0.7 V to 1 V for silicon, which matters when the battery is only a few volts. Its leakage is actually higher.",
      },
      {
        q: "A 5.1 V Zener is fed from 9 V through a resistor, with a load drawing 10 mA and 5 mA wanted in the Zener. What resistor?",
        options: ["260 Ω", "780 Ω", "390 Ω", "510 Ω"],
        answer: 0,
        why: "R = (9 - 5.1) / (0.005 + 0.010) = 3.9 / 0.015 = 260 Ω.",
      },
      {
        q: "What does the series resistor do in a diode clamp on a microcontroller input?",
        options: [
          "It raises the clamp voltage",
          "It limits the current that flows through the clamp diodes when the input goes outside the rails",
          "It makes the input faster",
          "It is not needed if diodes are fitted",
        ],
        answer: 1,
        why: "The diodes hold the node near the rails; the resistor drops the excess voltage and so limits the current the diodes, and the supply rail, must absorb.",
      },
    ],
  },

  "i2-transistor-switches-bjt-and-mosfet": {
    id: "i2-transistor-switches-bjt-and-mosfet",
    outcomes: [
      "Design a BJT low-side switch with a base resistor that guarantees saturation",
      "Bias a common-emitter amplifier and estimate its gain",
      "Read a MOSFET datasheet for threshold, R_DS(on) and gate charge, and tell a logic-level part from a standard one",
      "Drive a MOSFET correctly from a 3.3 V ESP32 pin, including PWM",
    ],
    blocks: [
      { t: "h", text: "Why a pin needs a transistor" },
      { t: "p", text: "A GPIO pin can supply a few milliamps at 3.3 V or 5 V. A relay coil wants 70 mA, a 12 V LED strip several amps, a DC motor more. The transistor is the part that lets a small control signal switch a large current, possibly at a different voltage. You will use two kinds: the **bipolar junction transistor** (BJT), which is controlled by a current into its base, and the **MOSFET**, which is controlled by a voltage on its gate. Both can also amplify, and the BJT amplifier is the classic place to learn biasing." },

      { t: "h", text: "The BJT in three regions" },
      { t: "p", text: "An NPN transistor such as the **2N2222** or **BC547** has a collector, base and emitter. With the emitter on ground, a small base current I_B flowing in through the base-emitter junction (a diode, about 0.7 V) allows a much larger collector current I_C = β × I_B to flow, where β (also written h_FE) is the current gain. β varies enormously from part to part: the BC547's datasheet range is 110 to 800 depending on grade." },
      { t: "list", items: [
        "**Cut-off**: no base current, no collector current. The switch is off.",
        "**Active**: I_C = β × I_B and the collector voltage sits somewhere between the rails. This is where amplifiers work.",
        "**Saturation**: the base is driven harder than the collector circuit needs. The collector falls to V_CE(sat), about 0.1 V to 0.3 V, and I_C is set by the load, not by β. This is where switches work.",
      ] },

      { t: "h", text: "Worked example: a relay driver from an ESP32 pin" },
      { t: "p", text: "A 5 V relay coil of about 71 Ω draws 5 / 71 ≈ 70 mA. Switch it with a 2N2222 on the low side (emitter to ground, coil between 5 V and the collector, 1N4007 flyback diode across the coil). To be sure of saturation regardless of β, design for a **forced β of 10**: I_B = I_C / 10 = 7 mA. Allow V_BE ≈ 0.8 V at this current." },
      { t: "formula", text: String.raw`R_B = (V_pin - V_BE) / I_B = (3.3 - 0.8) / 0.007 ≈ 357 Ω   →  use 330 Ω
Check: I_B = (3.3 - 0.8) / 330 = 7.6 mA,  forced β = 70 / 7.6 ≈ 9.2
Transistor dissipation ≈ V_CE(sat) × I_C = 0.3 × 0.07 = 21 mW`, caption: "A forced β of 10 to 20 is the usual switch design rule." },
      { t: "p", text: "Check against limits: 70 mA is well inside the 2N2222's 600 mA rating and its collector-emitter rating (30 V for the 2N2222, 40 V for the 2N2222A); the ESP32 pin supplies 7.6 mA, inside its default drive capability. A BC547 would also do (100 mA maximum), but with less margin. Add a 10 kΩ resistor from base to ground so the transistor stays off while the ESP32 boots and its pins float." },
      { t: "diagram", text: String.raw`
   +5 V ───────┬──────────┐
               │          │
            [ relay ]   ─┴─ 1N4007 (cathode to +5 V)
               │          │
               ├──────────┘
               │ C
  GPIO ──[330]─┤ B   2N2222
               │ E
  GND ─────────┴──────────`, caption: "Low-side NPN switch. Add 10 kΩ from base to GND." },

      { t: "h", text: "The BJT as an amplifier" },
      { t: "p", text: "In the active region, a small change in base voltage gives a large change in collector current, and the collector resistor turns that into a large change in voltage. The **common-emitter** stage with an emitter resistor is the robust textbook circuit, because the emitter resistor makes the gain depend on resistors rather than on the unreliable β." },
      { t: "formula", text: String.raw`V_B set by a divider R1 (top), R2 (bottom)
I_C ≈ I_E = (V_B - 0.7) / R_E
Small-signal voltage gain  A_v ≈ -R_C / (R_E + r_e),   r_e = 26 mV / I_C

Example: 9 V supply, R1 = 39 kΩ, R2 = 10 kΩ, R_C = 4.7 kΩ, R_E = 1 kΩ, β = 200
Unloaded V_B = 9 × 10 / 49 = 1.84 V,  divider R_th = 7.96 kΩ
Base current ≈ (1.84 - 0.7) / (7.96k + 201 × 1k) = 5.4 µA  →  V_B ≈ 1.79 V
I_C ≈ (1.79 - 0.7) / 1k ≈ 1.09 mA,  V_C = 9 - 4.7k × 1.09 mA ≈ 3.9 V
r_e ≈ 24 Ω,  A_v ≈ -4.7k / 1.024k ≈ -4.6`, caption: "The Thevenin equivalent of the bias divider, from module i1, does the base calculation." },
      { t: "p", text: "The collector sits at 3.9 V, comfortably between the rails, so the output can swing a couple of volts either way before clipping. The minus sign means the output is inverted. With a 10 mV input sine you get about 46 mV out. Notice how little β mattered: doubling β to 400 changes V_B by a few tens of millivolts. That insensitivity is the reason for the design. In practice, op-amps (next lesson) have replaced discrete amplifiers for most sensor work, but the BJT switch is everywhere." },

      { t: "h", text: "MOSFETs: switching with a voltage" },
      { t: "p", text: "An N-channel enhancement MOSFET has a gate, drain and source. The gate is insulated, so at DC it draws no current at all; instead, a gate-source voltage V_GS above a threshold opens a conducting channel between drain and source. When fully on, the channel behaves like a small resistor, **R_DS(on)**, so the power wasted is I² × R_DS(on). For high currents a MOSFET beats a BJT easily: no base current, and milliohms rather than a fixed 0.2 V drop." },
      { t: "list", items: [
        "**V_GS(th), the threshold**: the gate voltage at which the device just begins to conduct, specified at a tiny current such as 250 µA. It is **not** the voltage at which the part is fully on. This is the most common misreading of a MOSFET datasheet.",
        "**R_DS(on)**: specified at particular gate voltages, such as 10 V and 4.5 V. If your gate voltage is not one of the listed ones, the datasheet makes no promise.",
        "**Gate charge Q_g**: the charge you must put into the gate to turn the part fully on. It sets how fast your driver can switch it.",
        "**V_DS(max)** and **I_D(max)**: the drain voltage and current limits. I_D is usually quoted at a case temperature of 25 °C with an ideal heatsink, so treat it as an upper bound, not a working figure.",
      ] },
      { t: "table", head: ["Part", "V_DS max", "V_GS(th)", "R_DS(on) (max)", "Q_g", "From 3.3 V?"], rows: [
        ["IRF540N", "100 V", "2 to 4 V", "44 mΩ at 10 V only", "71 nC", "No: standard part, needs about 10 V"],
        ["IRLZ44N", "55 V", "1 to 2 V", "22 mΩ at 10 V, 25 mΩ at 5 V, 35 mΩ at 4 V", "48 nC", "Marginal: not rated below 4 V"],
        ["AO3400A (SOT-23)", "30 V", "about 0.65 to 1.45 V", "32 mΩ at 4.5 V, 48 mΩ at 2.5 V", "about 6 nC at 4.5 V", "Yes: rated at 2.5 V"],
      ], caption: "Figures from the Infineon and Alpha and Omega datasheets. The AO3400 is made by several companies with slightly different figures; check yours." },
      { t: "p", text: "The IRF540N is a fine part with a 10 V gate drive and useless from a 3.3 V pin: at 3.3 V it may not even reach its threshold, which can be 4 V. The **IRLZ44N** is called \"logic-level\" because it is rated at 5 V and 4 V, which makes it a good choice from a 5 V Uno pin: at 5 A it wastes 25 × 0.025 = 0.63 W. From an ESP32's 3.3 V it will usually conduct, but the datasheet gives no R_DS(on) at 3.3 V, so some parts will run hot at high current. The right answer for 3.3 V is a part rated at 2.5 V such as the **AO3400A**, or a gate driver." },

      { t: "h", text: "Driving a MOSFET from a 3.3 V ESP32 pin" },
      { t: "list", ordered: true, items: [
        "Choose a part with R_DS(on) specified at 2.5 V or lower (AO3400A, or similar), with V_DS max comfortably above your load voltage.",
        "Add a series gate resistor of about 47 Ω to 220 Ω. It limits the inrush current into the gate capacitance and damps ringing.",
        "Add a pull-down of 10 kΩ to 100 kΩ from gate to source, so the MOSFET is off while the ESP32 boots and the pin floats.",
        "Fit a flyback diode across any inductive load, and put the MOSFET on the low side (source to ground).",
        "For loads above a few amps, or PWM above a few tens of kilohertz, or a part that needs 10 V, use a gate driver IC or a BJT level shifter to drive the gate harder.",
      ] },
      { t: "p", text: "The gate charge sets the switching time. A pin through 100 Ω delivers at most about 20 mA at the start of a transition, so an IRLZ44N with Q_g = 48 nC takes roughly t ≈ Q_g / I = 48 nC / 20 mA ≈ 2.4 µs to switch. At 20 kHz PWM (a 50 µs period), two such transitions spend about a tenth of every cycle in the half-on region where the MOSFET dissipates heavily. The AO3400A, with about a tenth of the gate charge, switches in a few hundred nanoseconds from the same pin." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.x: PWM a logic-level MOSFET gate.
// GPIO 25 -> 100 Ohm -> gate of AO3400 (or IRLZ44N). 10 kOhm gate to GND.
const int GATE_PIN = 25;
const uint32_t PWM_HZ = 20000;   // above hearing, slow enough for a weak gate drive
const uint8_t PWM_BITS = 10;     // duty 0 to 1023

void setup() {
  ledcAttach(GATE_PIN, PWM_HZ, PWM_BITS);
}

void loop() {
  for (int duty = 0; duty <= 1023; duty += 64) {
    ledcWrite(GATE_PIN, duty);
    delay(200);
  }
}`, caption: "Uses the core 3.x LEDC API (ledcAttach and ledcWrite take the pin). On core 2.x the calls were ledcSetup and ledcAttachPin with a channel number." },
      { t: "note", kind: "safety", text: "MOSFET gates are damaged by static electricity. Handle them by the body, work on an antistatic mat if you have one, and never leave a gate unconnected in a powered circuit: a floating gate can sit half-on and overheat the device." },

      { t: "deep", title: "Why the BJT amplifier gain is -R_C / (R_E + r_e)", blocks: [
        { t: "p", text: "The collector current follows the base-emitter voltage exponentially, I_C = I_S · e^(V_BE / V_T), exactly like the diode equation. Its slope, the **transconductance**, is g_m = dI_C / dV_BE = I_C / V_T. Its inverse, r_e = V_T / I_C ≈ 26 mV / I_C at room temperature, is the small-signal resistance seen looking into the emitter." },
        { t: "formula", text: String.raw`Small input change v_b at the base
Emitter follows the base:   v_e ≈ v_b × R_E / (R_E + r_e)
Emitter current change:     i_e = v_b / (R_E + r_e)
Collector current ≈ i_e, so v_c = -i_e × R_C
A_v = v_c / v_b = -R_C / (R_E + r_e)`, caption: "Emitter degeneration trades gain for predictability." },
        { t: "p", text: "Without R_E (or with it bypassed by a capacitor), the gain becomes -R_C / r_e = -g_m R_C, which is large (about -180 for 4.7 kΩ at 1 mA) but depends on temperature and on the operating current, and distorts badly because r_e changes over each cycle. The same trade, feedback that lowers gain but makes it predictable and linear, is the central idea of op-amp circuits." },
      ] },
      { t: "deep", title: "Reading the MOSFET datasheet: transfer curves, the Miller plateau and SOA", blocks: [
        { t: "p", text: "Two plots matter more than any single number. The **output characteristic** (I_D against V_DS for several V_GS values) shows how much current the part can pass with a low drop at your gate voltage; if the curve for 3.0 V flattens out at 4 A, you cannot use it at 5 A from a 3.3 V pin. The **transfer characteristic** (I_D against V_GS) shows the same thing from the gate's side, at two or three temperatures." },
        { t: "p", text: "The **gate charge curve** (V_GS against Q_g) has a flat region called the **Miller plateau**. During it, the drain voltage is falling and the gate-drain capacitance is being charged, so the driver's current goes into that capacitance and V_GS stops rising. This is the high-loss part of each transition. The switching loss is roughly P = ½ × V_DS × I_D × (t_rise + t_fall) × f_PWM, which is why stronger gate drive and lower Q_g matter at higher PWM frequencies." },
        { t: "p", text: "Finally, the **safe operating area** (SOA) plot shows the combinations of V_DS, I_D and pulse length the part survives. A MOSFET held half-on in its linear region (as in a crude linear current source) can fail far below its I_D rating; modern trench MOSFETs are especially vulnerable to this, which is another reason never to let a gate float." },
      ] },
    ],
    mistakes: [
      "**Designing a BJT switch with the typical β.** Use a forced β of 10 to 20, so every part saturates.",
      "**Reading V_GS(th) as the turn-on voltage.** At threshold the part passes about 250 µA. Look for R_DS(on) at your actual gate voltage.",
      "**Using an IRF540N (or IRFZ44N) from a 3.3 V or 5 V pin.** They need about 10 V on the gate.",
      "**Leaving the gate or base without a pull-down**, so the load switches on during boot.",
      "**Forgetting the flyback diode** on a relay or motor driven by the transistor.",
      "**Trusting the headline I_D rating.** It assumes a perfect heatsink at 25 °C. Work out I² × R_DS(on) and the package's thermal resistance.",
    ],
    practice: {
      kind: "bench",
      task: "Build and compare a BJT relay driver and a MOSFET PWM driver from an ESP32 DevKit.",
      steps: [
        "Build the 2N2222 relay driver from the lesson with a 330 Ω base resistor, 10 kΩ base pull-down and 1N4007 across the coil. Toggle it from GPIO 26 with a simple sketch.",
        "Measure V_CE when on and the base current (voltage across the 330 Ω divided by 330). Calculate the forced β.",
        "Build the MOSFET circuit: GPIO 25 through 100 Ω to the gate of an AO3400A (or IRLZ44N), 10 kΩ gate to source, a 12 V LED strip or 12 V lamp as the load, source to GND, ESP32 GND joined to the 12 V supply's ground.",
        "Upload the PWM sketch. With a meter, measure V_DS at full duty and calculate R_DS(on) from the load current. Compare with the datasheet.",
        "If you have a scope, look at the gate and drain at 20 kHz and measure the transition time. Swap the IRLZ44N and AO3400A and compare.",
      ],
    },
    quiz: [
      {
        q: "An NPN switch must carry 200 mA. With a forced β of 10 and a 5 V Uno pin (V_BE ≈ 0.8 V), what base resistor is closest?",
        options: ["210 Ω", "2.1 kΩ", "21 Ω", "1 kΩ"],
        answer: 0,
        why: "I_B = 200 mA / 10 = 20 mA. R_B = (5 - 0.8) / 0.02 = 210 Ω. Note that 20 mA is near the limit for an Uno pin; a MOSFET would be a better choice here.",
      },
      {
        q: "A MOSFET datasheet lists V_GS(th) = 1.0 to 2.5 V and R_DS(on) only at V_GS = 10 V. What can you conclude about driving it from 3.3 V?",
        options: [
          "It will be fully on, because 3.3 V is above the threshold",
          "The datasheet gives no guarantee it will be fully on at 3.3 V; it may conduct poorly and overheat",
          "It cannot conduct at all at 3.3 V",
          "It will be fully on as long as you add a gate resistor",
        ],
        answer: 1,
        why: "The threshold is where conduction just starts, at a fraction of a milliamp. Without an R_DS(on) figure at or below your gate voltage, there is no promise of low resistance.",
      },
      {
        q: "A MOSFET with R_DS(on) = 40 mΩ carries 3 A continuously. How much power does it dissipate?",
        options: ["0.12 W", "0.36 W", "1.2 W", "0.04 W"],
        answer: 1,
        why: "P = I² × R = 9 × 0.04 = 0.36 W.",
      },
      {
        q: "A common-emitter stage has R_C = 10 kΩ and R_E = 1 kΩ, at I_C = 1 mA. Approximately what is its voltage gain?",
        options: ["-10", "-385", "+10", "-9.7"],
        answer: 3,
        why: "A_v ≈ -R_C / (R_E + r_e) with r_e ≈ 26 Ω: -10 000 / 1026 ≈ -9.7. Quoting -10 ignores r_e but is close.",
      },
      {
        q: "Why does the gate charge Q_g matter when you PWM a MOSFET from a GPIO pin?",
        options: [
          "It sets the maximum drain voltage",
          "The pin can only supply a limited current, so a large Q_g means slow transitions and more power lost in each switching event",
          "It sets the threshold voltage",
          "It decides whether the MOSFET is N-channel or P-channel",
        ],
        answer: 1,
        why: "Switching time is roughly Q_g / I_gate. With a weak driver, a high-charge part spends longer half-on, and switching loss grows with PWM frequency.",
      },
    ],
  },

  "i2-op-amp-fundamentals": {
    id: "i2-op-amp-fundamentals",
    outcomes: [
      "Apply the ideal op-amp rules to analyse a feedback circuit",
      "Design comparator, buffer, inverting and non-inverting stages",
      "Explain why an op-amp's input and output ranges matter on a single 3.3 V or 5 V supply",
      "Choose between an LM358 and a rail-to-rail part such as the MCP6002",
    ],
    blocks: [
      { t: "h", text: "The most useful analog part" },
      { t: "p", text: "Most sensors produce signals that are too small, too weak to drive an ADC, or offset in the wrong place. The **operational amplifier** fixes all three with a handful of resistors. It is a high-gain differential amplifier in a package: two inputs, non-inverting (+) and inverting (-), and one output. On its own it is almost useless, because its gain is so large that the output slams to a rail. With **negative feedback**, a path from the output back to the inverting input, it becomes an amplifier whose gain is set precisely by resistor ratios." },

      { t: "h", text: "The ideal model: two golden rules" },
      { t: "formula", text: String.raw`v_out = A_OL × (v+ - v-)        A_OL ≈ 100 000 or more

With negative feedback:
Rule 1: the output does whatever it must to make v- = v+
Rule 2: no current flows into either input`, caption: "Analyse every op-amp circuit with these two rules." },
      { t: "p", text: "Rule 1 follows from the huge open-loop gain: if the output is a few volts, the difference between the inputs is a few volts divided by 100 000, tens of microvolts, which you treat as zero. It only holds while the output is within its range and there is negative feedback. Rule 2 follows from the input impedance, which for a CMOS op-amp like the MCP6002 is around 10¹³ Ω. With these rules, every circuit in this lesson is a KCL problem at the inverting input." },

      { t: "h", text: "Comparator: no feedback" },
      { t: "p", text: "Without feedback, the op-amp's output goes to the high rail when v+ > v- and to the low rail when v+ < v-. This **comparator** turns an analog signal into a digital one: an LDR divider on v+ and a 1.65 V reference on v- give a light-dark signal for a GPIO pin. Real projects add **hysteresis** (a little positive feedback, from output to v+) so that noise near the threshold does not make the output chatter. For fast or frequent comparisons, use a dedicated comparator chip such as the LM393, which has an open-drain output you can pull up to 3.3 V, and switches far faster than a general-purpose op-amp." },

      { t: "h", text: "Voltage follower (buffer)" },
      { t: "p", text: "Join the output straight to the inverting input and apply the signal to v+. Rule 1 says v- = v+, and v- is the output, so **v_out = v_in**, a gain of one. The point is impedance: the input draws essentially nothing (rule 2), while the output can drive milliamps. This is the cure for the loading problems of module i1. Put a buffer after a high-resistance divider and the ADC sees a source impedance of a few ohms instead of hundreds of kilohms." },

      { t: "h", text: "Non-inverting amplifier" },
      { t: "diagram", text: String.raw`
  v_in ───────────────┤+ \
                      │   >───●──── v_out
                 ┌────┤- /    │
                 │            │
                 ●────[ R_f ]─┘
                 │
              [ R_g ]
                 │
  GND ───────────┘`, caption: "R_f and R_g divide the output back to the inverting input." },
      { t: "formula", text: String.raw`v- = v_out × R_g / (R_g + R_f)     and rule 1 makes v- = v_in
Gain  G = v_out / v_in = 1 + R_f / R_g

Example: R_f = 20 kΩ, R_g = 1 kΩ   →   G = 21
A 0 to 100 mV sensor becomes 0 to 2.1 V`, caption: "The input is high impedance, and the gain is always at least 1." },

      { t: "h", text: "Inverting amplifier" },
      { t: "p", text: "Ground the + input and feed the signal into the - input through R_in, with R_f from output back to the - input. Rule 1 holds v- at 0 V (a **virtual ground**). The input current v_in / R_in cannot enter the op-amp (rule 2), so it all flows through R_f, and the output must sit at -i × R_f." },
      { t: "formula", text: String.raw`i = v_in / R_in = -v_out / R_f
Gain  G = -R_f / R_in

Example: R_in = 10 kΩ, R_f = 100 kΩ  →  G = -10, input impedance = 10 kΩ`, caption: "The input impedance is R_in, not infinite." },
      { t: "p", text: "The minus sign means a positive input gives a negative output. On a single supply there is no negative output, so in microcontroller work the + input is tied to a **mid-rail reference** (half the supply, from a divider with a decoupling capacitor) instead of ground. The output then swings around mid-rail. Feed several inputs into the same virtual ground through their own resistors and you have a **summing amplifier**, the basis of adding an offset to a signal." },

      { t: "h", text: "Single-supply reality: input range, output swing, bandwidth" },
      { t: "p", text: "The golden rules ignore the supply. Real op-amps can only handle inputs within a **common-mode range** and can only drive their output within some distance of each rail. This decides which part you can use on a 3.3 V ESP32 board." },
      { t: "table", head: ["Figure", "LM358", "MCP6002"], rows: [
        ["Supply range", "3 V to 32 V (single)", "1.8 V to 6.0 V"],
        ["Input common-mode range", "0 V to about V_CC - 1.5 V", "about 0.3 V beyond each rail (rail-to-rail)"],
        ["Output swing", "near 0 V low; about V_CC - 1.5 V high", "within about 25 mV of each rail at light load"],
        ["Gain-bandwidth product", "about 0.7 MHz (TI); 1 MHz from some makers", "1 MHz"],
        ["Supply current", "about 0.7 mA for both amplifiers", "about 100 µA per amplifier"],
      ], caption: "Typical figures from the TI LM358 and Microchip MCP6002 datasheets; the LM358's limits worsen with temperature." },
      { t: "p", text: "An LM358 on 3.3 V can only accept inputs up to about 1.8 V and drive its output up to about 1.8 V, wasting half of the ESP32's ADC range. It is a good, cheap part from a 5 V or 12 V supply. The **MCP6002** is rail-to-rail on input and output and runs from 3.3 V directly, so it is the default choice for ESP32 work. But its absolute maximum supply is 7 V, so never run it from 9 V or 12 V." },
      { t: "p", text: "The **gain-bandwidth product** (GBW) limits gain at high frequency. A non-inverting stage of gain G has a bandwidth of about GBW / G. With the MCP6002 at a gain of 21, that is 1 MHz / 21 ≈ 48 kHz: plenty for a temperature sensor, tight for ultrasound." },
      { t: "note", kind: "tip", text: "Every op-amp needs a 100 nF decoupling capacitor from its supply pin to ground, placed right beside the chip. Unused amplifiers in a dual package should be tied as followers to a mid-rail voltage, not left floating." },

      { t: "deep", title: "Finite open-loop gain and the feedback equation", blocks: [
        { t: "p", text: "The golden rules are the limit of a more exact result. Let β = R_g / (R_g + R_f) be the fraction of the output fed back, and A the open-loop gain. Then v_out = A × (v_in - β × v_out)." },
        { t: "formula", text: String.raw`v_out / v_in = A / (1 + Aβ) = (1/β) × 1 / (1 + 1/(Aβ))
As A → ∞:  gain → 1/β = 1 + R_f / R_g

Example: A = 100 000, 1/β = 21
Gain = 21 / (1 + 21/100 000) = 20.9956, an error of 0.02%`, caption: "The loop gain Aβ decides how close the circuit is to ideal." },
        { t: "p", text: "Because A falls with frequency (it drops by 20 dB per decade above a few hertz in a typical op-amp, exactly a first-order low-pass from module i1), the loop gain falls too, and at the frequency where A = 1/β the circuit's gain starts to drop. That is the origin of the GBW rule. Feedback also divides the output impedance and multiplies the input impedance of the non-inverting stage by roughly (1 + Aβ), which is why a follower is such a good buffer." },
      ] },
      { t: "deep", title: "Offset, bias current and slew rate", blocks: [
        { t: "p", text: "A real op-amp behaves as if a small **input offset voltage** V_OS (a few millivolts for an LM358 or MCP6002, microvolts for a precision part) were in series with its input. In a gain-of-21 stage, a 3 mV offset becomes 63 mV at the output, which matters for a 100 mV sensor. **Input bias current** flows into the inputs: tens of nanoamps for the bipolar LM358, picoamps for CMOS parts. Through a 1 MΩ source it produces tens of millivolts of error on the LM358, almost nothing on the MCP6002." },
        { t: "p", text: "**Slew rate** is the fastest the output can change, about 0.3 V/µs for the LM358 and 0.6 V/µs for the MCP6002. A sine of peak V_p at frequency f needs a slew rate of 2πf·V_p, so a 3 V peak sine at 20 kHz needs 0.38 V/µs, just beyond the LM358. Large fast signals distort into triangles when they exceed it, even though the small-signal bandwidth looked adequate." },
      ] },
    ],
    mistakes: [
      "**Applying the golden rules to a comparator.** With no negative feedback, the inputs are not equal; the output simply goes to a rail.",
      "**Using an LM358 on 3.3 V and expecting full-range output.** Its output and input stop about 1.5 V below the positive rail.",
      "**Running an inverting amplifier from a single supply with + grounded**, then wondering why the output is stuck at 0 V. Bias + at mid-rail.",
      "**Forgetting the input impedance of the inverting stage is R_in**, which can load a high-impedance sensor.",
      "**Leaving out the supply decoupling capacitor**, so the op-amp oscillates or picks up noise.",
      "**Exceeding the supply rating**: an MCP6002 on a 9 V battery is destroyed.",
    ],
    practice: {
      kind: "bench",
      task: "Build follower, non-inverting and comparator stages with an MCP6002 on 3.3 V and compare with an LM358.",
      steps: [
        "Power an MCP6002 from the ESP32 DevKit's 3.3 V pin with a 100 nF capacitor across its supply pins.",
        "Build a follower on one amplifier. Feed it from a 1 MΩ and 1 MΩ divider and measure the divider's output with and without the follower (use a meter on the 10 MΩ range to see the meter loading the bare divider).",
        "Build a non-inverting stage with R_f = 20 kΩ and R_g = 1 kΩ. Apply 0, 50 and 100 mV from a divider and confirm a gain of 21.",
        "Increase the input until the output stops rising and note the maximum output. Repeat the same stage with an LM358 on 3.3 V (then on 5 V) and compare.",
        "Use the second amplifier as a comparator between an LDR divider and a 1.65 V reference, and read the output on GPIO 34 with `digitalRead`.",
      ],
    },
    quiz: [
      {
        q: "A non-inverting amplifier has R_f = 47 kΩ and R_g = 4.7 kΩ. What is its gain?",
        options: ["10", "11", "-10", "0.1"],
        answer: 1,
        why: "G = 1 + R_f/R_g = 1 + 10 = 11.",
      },
      {
        q: "An inverting amplifier has R_in = 2 kΩ and R_f = 30 kΩ, with + at 0 V on split supplies. The input is +0.2 V. What is the output?",
        options: ["+3.0 V", "-3.0 V", "-3.2 V", "-0.2 V"],
        answer: 1,
        why: "G = -30/2 = -15, so v_out = -15 × 0.2 = -3.0 V.",
      },
      {
        q: "Why is a voltage follower useful even though its gain is 1?",
        options: [
          "It doubles the signal power by adding gain",
          "It has a very high input impedance and low output impedance, so it stops a load from pulling down a weak source",
          "It removes the DC offset",
          "It inverts the signal",
        ],
        answer: 1,
        why: "The follower draws almost no current from the source and can supply current to the load, so it isolates the two.",
      },
      {
        q: "You run an LM358 from 3.3 V as a gain-of-10 stage with a 0.25 V input. What output do you expect?",
        options: [
          "2.5 V exactly",
          "Somewhere around 1.8 V at most, because the LM358's output cannot get within about 1.5 V of the positive rail",
          "3.3 V",
          "0 V",
        ],
        answer: 1,
        why: "The ideal answer is 2.5 V, but the LM358's output high limit is about V_CC - 1.5 V, so it saturates near 1.8 V. Use a rail-to-rail part on 3.3 V.",
      },
      {
        q: "An op-amp with a GBW of 1 MHz is used as a non-inverting amplifier with a gain of 50. What is its approximate bandwidth?",
        options: ["50 MHz", "1 MHz", "200 kHz", "20 kHz"],
        answer: 3,
        why: "Bandwidth ≈ GBW / G = 1 MHz / 50 = 20 kHz.",
      },
    ],
  },

  "i2-difference-amps-instrumentation-and-bridges": {
    id: "i2-difference-amps-instrumentation-and-bridges",
    outcomes: [
      "Analyse a Wheatstone bridge and calculate its output for a small resistance change",
      "Explain common-mode and differential signals, and why a difference amplifier needs matched resistors",
      "Set the gain of an instrumentation amplifier such as the INA128 or INA125",
      "Choose between an instrumentation amplifier and the HX711 for a load cell",
    ],
    blocks: [
      { t: "h", text: "When the signal is a tiny difference" },
      { t: "p", text: "Strain gauges, load cells, pressure sensors and many thermistor and RTD circuits do not give you a voltage relative to ground. They give you two voltages, both sitting near half the supply, that differ by a few millivolts. The few millivolts are the measurement. The large shared voltage, the **common-mode** voltage, is something you must ignore. The non-inverting amplifier from the last lesson cannot do this, because it amplifies relative to ground. This lesson builds up the circuits that can: the Wheatstone bridge that creates the difference, and the difference and instrumentation amplifiers that measure it." },

      { t: "h", text: "The Wheatstone bridge" },
      { t: "diagram", text: String.raw`
              V_ex
          ┌─────┴─────┐
        [ R1 ]      [ R3 ]
          │           │
     A ───●           ●─── B        v_out = V_B - V_A
          │           │
        [ R2 ]      [ R4 ]
          └─────┬─────┘
               GND`, caption: "Two dividers side by side, fed from the same excitation voltage." },
      { t: "formula", text: String.raw`V_A = V_ex × R2 / (R1 + R2)
V_B = V_ex × R4 / (R3 + R4)
v_out = V_ex × ( R4/(R3 + R4) - R2/(R1 + R2) )
Balanced (v_out = 0) when  R1/R2 = R3/R4`, caption: "Each half is a divider from module i1." },
      { t: "p", text: "Make all four resistors equal to R, and the bridge is balanced: both nodes sit at V_ex / 2 and v_out = 0. Now let one of them, say R4, be a sensor whose resistance changes to R(1 + x). For small x, the output is very nearly proportional to x. That is a **quarter bridge**." },
      { t: "formula", text: String.raw`Quarter bridge:   v_out ≈ V_ex × x / 4      (x = ΔR / R, small)

Example: V_ex = 3.3 V, x = 0.002 (a strain gauge at 1000 microstrain, gauge factor 2)
v_out ≈ 3.3 × 0.002 / 4 = 1.65 mV       (exact: 1.648 mV)
Common-mode voltage at both nodes ≈ 1.65 V`, caption: "A 1.65 mV signal riding on 1.65 V: a thousand to one." },
      { t: "p", text: "Check the exact value: V_B = 3.3 × 1.002 / 2.002 = 1.651648 V and V_A = 1.65 V, a difference of 1.648 mV. A full bridge, with all four arms active in pairs that change in opposite directions (as inside a load cell), gives v_out = V_ex × x, four times more, and is linear rather than approximately linear. Load cells are specified this way, as a **rated output** in millivolts per volt of excitation: a typical cheap 5 kg or 10 kg cell gives about **1 mV/V to 2 mV/V** at full load, so at 5 V excitation, a 2 mV/V cell gives just **10 mV** at full scale." },
      { t: "p", text: "Why bother with a bridge rather than a single divider? Because the bridge subtracts the large constant part. And if R3 is a matched dummy gauge on the same metal, temperature changes both arms equally and cancel. The bridge is also **ratiometric**: the output is proportional to V_ex, so if the ADC uses the same voltage as its reference, supply variations cancel too." },

      { t: "h", text: "Common-mode and differential signals" },
      { t: "p", text: "Any pair of voltages V_A and V_B can be described by their **differential** part, V_d = V_B - V_A, and their **common-mode** part, V_cm = (V_A + V_B) / 2. An ideal differential amplifier gives v_out = G × V_d and ignores V_cm entirely. A real one lets a little V_cm through. The measure of how well it rejects it is the **common-mode rejection ratio** (CMRR), the differential gain divided by the common-mode gain, usually quoted in decibels." },

      { t: "h", text: "The difference amplifier" },
      { t: "p", text: "One op-amp and four resistors make a difference amplifier. V_A feeds the - input through R1, with R2 from output to - input. V_B feeds the + input through another R1, with another R2 from + input to the reference (ground or mid-rail). If the two pairs of resistors match exactly, v_out = (R2 / R1) × (V_B - V_A)." },
      { t: "p", text: "It has two weaknesses for bridge work. First, its input impedance is only about R1, which loads the bridge and unbalances it. Second, its CMRR depends entirely on resistor matching: with 1% resistors, a common-mode voltage of 1.65 V can leak through as an error of tens of millivolts, far larger than your 1.65 mV signal. The difference amplifier is excellent for larger signals, such as measuring a current-sense resistor in a supply line, but not for millivolt bridges." },

      { t: "h", text: "The instrumentation amplifier" },
      { t: "p", text: "The **instrumentation amplifier** (in-amp) puts a buffer stage in front of the difference amplifier, so both inputs are high impedance, and makes the gain adjustable with a single resistor, R_G. The matched resistors are laser-trimmed inside the chip, so the CMRR is high (around 100 dB or more at high gain). You buy it as one part." },
      { t: "formula", text: String.raw`INA128:  G = 1 + 50 kΩ / R_G
INA125:  G = 4 + 60 kΩ / R_G

Example: a 2 mV/V load cell at 5 V excitation gives 10 mV full scale.
For 2.5 V out, G = 250.  With an INA125: R_G = 60 kΩ / (250 - 4) ≈ 244 Ω
Check: G = 4 + 60 000 / 244 = 249.9`, caption: "Gain equations from the TI datasheets." },
      { t: "p", text: "Choose the part for the supply. The INA128 is a precision part for split supplies of ±2.25 V to ±18 V; its inputs and output do not reach the rails, so it is awkward on a single 5 V supply and unusable on 3.3 V. The INA125 runs from a single supply down to 2.7 V and includes a precision voltage reference for exciting the bridge, which makes it a natural load-cell amplifier. Set the in-amp's REF pin to a mid-rail voltage if the signal can go negative." },

      { t: "h", text: "The HX711: a load cell ADC on a chip" },
      { t: "p", text: "For weighing, most student projects use the **HX711**, a 24-bit ADC with a built-in programmable gain amplifier (gain 128 or 64 on channel A) and a bridge excitation supply. At gain 128 and 5 V analogue supply, its full-scale differential input is ±0.5 × 5 / 128 ≈ **±19.5 mV**, which suits a 1 mV/V or 2 mV/V load cell directly. It outputs 10 or 80 samples per second, selected by a pin, through a simple two-wire serial interface that any GPIO pair can read. You trade speed and flexibility for convenience: the HX711 is excellent for scales and useless for vibration or fast force measurements, where an in-amp feeding a faster ADC is the right choice." },
      { t: "table", head: ["Need", "Choose"], rows: [
        ["A kitchen scale, 10 readings a second", "HX711 module"],
        ["A fast force or strain signal, hundreds or thousands of samples a second", "INA125 into the microcontroller ADC, or a faster external ADC"],
        ["A current-sense resistor in a 12 V line", "Difference amplifier or a dedicated current-sense amp"],
        ["A thermistor or LDR referenced to ground", "Divider and non-inverting amp (previous lesson), no bridge needed"],
      ], caption: "A rough selection guide." },

      { t: "deep", title: "Deriving the difference amplifier and its sensitivity to mismatch", blocks: [
        { t: "p", text: "Use the golden rules. The + input is a divider of V_B: v+ = V_B × R2 / (R1 + R2). KCL at the - input, with v- = v+: (V_A - v-) / R1 = (v- - v_out) / R2." },
        { t: "formula", text: String.raw`v_out = v- × (1 + R2/R1) - V_A × R2/R1
      = V_B × R2/(R1 + R2) × (R1 + R2)/R1 - V_A × R2/R1
      = (R2/R1) × (V_B - V_A)`, caption: "Exact only if both resistor pairs have the same ratio." },
        { t: "p", text: "Suppose the ratios differ by a fraction ε (for four 1% resistors, ε can reach about 4%). The common-mode gain then becomes roughly ε × G / (1 + G), so for G = 1 and ε = 0.04, CMRR ≈ 1 / 0.02 = 50, only 34 dB. With 1.65 V of common mode, that is 33 mV of error. Trimmed thin-film networks inside an in-amp match to around 0.01%, which is how the INA series reaches 100 dB or more." },
      ] },
      { t: "deep", title: "Inside the three-op-amp instrumentation amplifier", blocks: [
        { t: "p", text: "The classic in-amp has two non-inverting buffers, A1 and A2, whose inverting inputs are joined through R_G, with feedback resistors R (25 kΩ each in the INA128) from each output to its own inverting input. The golden rules put V_A and V_B across R_G, so a current (V_B - V_A) / R_G flows through R_G and both feedback resistors. The differential voltage between the two buffer outputs is therefore (V_B - V_A) × (1 + 2R / R_G). The common-mode voltage passes through these buffers at unity gain, unamplified." },
        { t: "formula", text: String.raw`First stage differential gain = 1 + 2R / R_G = 1 + 50 kΩ / R_G   (R = 25 kΩ)
Second stage: a unity-gain difference amplifier removes the common mode`, caption: "This is where the INA128 gain formula comes from." },
        { t: "p", text: "The structure explains the in-amp's two awkward properties. The internal nodes swing by the common-mode voltage plus the amplified signal, so the input range depends on the gain and the output voltage (datasheets show this as a hexagonal plot of allowed input versus output). And because gain is set by one resistor, a 1% R_G gives about a 1% gain error, which you remove by calibration, a topic of module i8." },
      ] },
    ],
    mistakes: [
      "**Amplifying one side of a bridge relative to ground.** The common mode is amplified with the signal and swamps it. Measure the difference.",
      "**Building a difference amplifier from 5% resistors** for a millivolt bridge. Its CMRR is then far too low.",
      "**Running an INA128 from a single 3.3 V or 5 V supply.** It needs split or much larger supplies; use an INA125 or similar single-supply part.",
      "**Exciting the bridge from a different supply than the ADC reference**, losing the ratiometric cancellation.",
      "**Twisting load cell wires carelessly or running them beside motor leads.** A millivolt signal picks up interference easily; keep leads short and twisted.",
    ],
    practice: {
      kind: "bench",
      task: "Build a Wheatstone bridge, measure its imbalance, and read a load cell through an HX711.",
      steps: [
        "Build a bridge of four 1 kΩ resistors from 5 V. Measure V_A, V_B and the difference with a meter on its millivolt range.",
        "Replace R4 with 1 kΩ in series with 10 Ω (x = 0.01). Predict the output with the quarter-bridge formula and compare with the measured value.",
        "Connect a load cell to an HX711 module (red E+, black E-, white A-, green A+ is common, but check your cell's label). Wire DT and SCK to two Uno pins and read raw values with a widely used HX711 library.",
        "Record raw readings for no load and two known weights (for example 500 g and 1 kg). Calculate counts per gram from each and check that they agree.",
        "Calculate the cell's full-scale output in millivolts from its mV/V rating and your excitation voltage, and compare with the HX711's ±19.5 mV range at gain 128.",
      ],
    },
    quiz: [
      {
        q: "A quarter bridge of 350 Ω gauges is excited at 5 V. One gauge changes by +0.7 Ω. Approximately what is the output?",
        options: ["10 mV", "2.5 mV", "1.25 mV", "5 mV"],
        answer: 1,
        why: "x = 0.7 / 350 = 0.002, so v_out ≈ 5 × 0.002 / 4 = 2.5 mV.",
      },
      {
        q: "A load cell is rated 2 mV/V and excited at 3.3 V. What is its full-scale output?",
        options: ["6.6 mV", "2 mV", "3.3 mV", "0.66 mV"],
        answer: 0,
        why: "Rated output × excitation = 2 mV/V × 3.3 V = 6.6 mV.",
      },
      {
        q: "Why is an instrumentation amplifier preferred to a four-resistor difference amplifier for a bridge?",
        options: [
          "It has a lower input impedance",
          "It has high-impedance inputs that do not load the bridge, and trimmed internal resistors that give high common-mode rejection",
          "It does not need a power supply",
          "It works without a reference pin",
        ],
        answer: 1,
        why: "The difference amplifier loads the bridge through its input resistors and its CMRR depends on resistor matching. The in-amp solves both.",
      },
      {
        q: "An INA128 needs a gain of 101. What value of R_G?",
        options: ["50 kΩ", "5 kΩ", "500 Ω", "101 Ω"],
        answer: 2,
        why: "G = 1 + 50 kΩ / R_G, so R_G = 50 kΩ / 100 = 500 Ω.",
      },
      {
        q: "Both bridge nodes sit at about 2.5 V and differ by 4 mV. What are the common-mode and differential voltages?",
        options: ["2.5 V and 4 mV", "4 mV and 2.5 V", "5 V and 4 mV", "2.5 V and 2 mV"],
        answer: 0,
        why: "Common mode is the average of the two, about 2.5 V. The differential voltage is their difference, 4 mV.",
      },
    ],
  },

  "i2-signal-conditioning-and-datasheets": {
    id: "i2-signal-conditioning-and-datasheets",
    outcomes: [
      "Scale and offset a sensor signal so it fills an ADC's usable range",
      "Design an anti-alias filter and input protection for an ADC channel",
      "Tell absolute maximum ratings from recommended operating conditions and design to the right one",
      "Plan and build a complete sensor front-end for the module's exit project",
    ],
    blocks: [
      { t: "h", text: "The chain between a sensor and a number" },
      { t: "p", text: "An ADC can only report what arrives at its pin, and it does so with a fixed number of steps across a fixed range. A thermistor divider that swings only 0.3 V uses about 60 of the Uno's 1024 steps. A microphone signal centred on 0 V loses its negative half entirely. A long sensor cable picks up a 10 kV static discharge. **Signal conditioning** is the stage that fixes all of this: it scales the signal to the range, shifts it to the right offset, removes frequencies the ADC would misread, and protects the pin. Then you need to read datasheets correctly, because every one of those decisions rests on a limit printed in one." },

      { t: "h", text: "Step 1: know your ADC" },
      { t: "table", head: ["", "Arduino Uno (ATmega328P)", "ESP32 DevKit (ESP32)"], rows: [
        ["Resolution", "10 bits (0 to 1023)", "12 bits (0 to 4095)"],
        ["Input range", "0 V to AREF, 5 V by default (1.1 V internal option)", "set by attenuation; at 11 dB / 12 dB, roughly 0.15 V to 2.45 V is the accurate region"],
        ["Recommended source impedance", "10 kΩ or less", "keep it low or add about 100 nF at the pin"],
        ["Notes", "ratiometric with the 5 V supply when AREF = AVCC", "non-linear near the ends; use the calibrated API in ESP-IDF or analogReadMilliVolts() in Arduino-ESP32"],
      ], caption: "From the ATmega328P datasheet and the ESP-IDF ADC documentation (ESP-IDF v5). ADC2 pins cannot be used while Wi-Fi is on." },
      { t: "p", text: "The ESP32 lesson in practice: target roughly 0.2 V to 2.4 V for the useful signal, not 0 to 3.3 V. On the Uno, use 0 V to 5 V, or switch to the 1.1 V internal reference for small signals." },

      { t: "h", text: "Step 2: scale and offset" },
      { t: "p", text: "Write the sensor's output range as V_min to V_max and the ADC's target range as T_min to T_max. You need a gain G = (T_max - T_min) / (V_max - V_min) and then an offset so that V_min lands at T_min. Three common cases:" },
      { t: "list", items: [
        "**Too large** (a 0 to 12 V battery on a 0 to 3.3 V input): a divider, with gain below 1. Check its Thevenin resistance against the ADC's source impedance limit, and add a capacitor or buffer.",
        "**Too small, starting near 0 V** (a 0 to 100 mV shunt or thermocouple amplifier): a non-inverting amplifier. G = 21 (R_f = 20 kΩ, R_g = 1 kΩ) maps 0 to 100 mV onto 0 to 2.1 V. On an ESP32, the bottom 0.15 V is inaccurate, so add an offset of about 0.2 V or accept poor readings near zero.",
        "**Centred on 0 V** (a microphone, an AC current transformer): AC-couple it with a capacitor (a high-pass), bias it at mid-rail with a divider, then amplify around mid-rail with an inverting or non-inverting stage referenced to that mid-rail.",
      ] },
      { t: "formula", text: String.raw`Worked example: an NTC thermistor divider on the Uno
10 kΩ fixed (top, to 5 V), 10 kΩ NTC at 25 °C (bottom), beta = 3950
At 25 °C:  R_NTC = 10 kΩ    →  V = 2.50 V   (511 counts)
At 0 °C:   R_NTC ≈ 33.6 kΩ  →  V ≈ 3.85 V
At 50 °C:  R_NTC ≈ 3.6 kΩ   →  V ≈ 1.32 V`, caption: "R_NTC = R0 × e^(β(1/T - 1/T0)), T in kelvin. The 0 °C to 50 °C span already covers about half the ADC range, so no amplifier is needed." },
      { t: "p", text: "Check the 0 °C figure: 1/273.15 - 1/298.15 = 3.070 × 10⁻⁴, times 3950 is 1.213, and e^1.213 = 3.36, so R_NTC ≈ 33.6 kΩ and V = 5 × 33.6 / 43.6 ≈ 3.85 V. Choosing the fixed resistor equal to the NTC's resistance in the middle of the range is what makes this work. The divider's Thevenin resistance is at most about 8 kΩ, under the Uno's 10 kΩ limit." },
      { t: "snippet", lang: "cpp", code: String.raw`// Arduino Uno: read a 10 kOhm NTC thermistor (beta 3950) in a divider.
// 5 V -> 10 kOhm fixed -> A0 -> NTC -> GND. 100 nF from A0 to GND.
const float R_FIXED = 10000.0;
const float R0 = 10000.0;     // NTC resistance at 25 C
const float BETA = 3950.0;    // from the thermistor's datasheet
const float T0 = 298.15;      // 25 C in kelvin

void setup() {
  Serial.begin(115200);
}

void loop() {
  long sum = 0;
  for (int i = 0; i < 16; i++) sum += analogRead(A0);
  float counts = sum / 16.0;
  // Divider: counts/1023 = R_ntc / (R_fixed + R_ntc). Ratiometric, so 5 V cancels.
  float r_ntc = R_FIXED * counts / (1023.0 - counts);
  float t_k = 1.0 / (1.0 / T0 + log(r_ntc / R0) / BETA);
  Serial.print("R = ");
  Serial.print(r_ntc, 0);
  Serial.print(" Ohm, T = ");
  Serial.print(t_k - 273.15, 1);
  Serial.println(" C");
  delay(500);
}`, caption: "Averaging 16 readings reduces noise; the beta equation is the inverse of the formula above. The beta value varies between thermistors, so read it from yours." },

      { t: "h", text: "Step 3: anti-alias filtering" },
      { t: "p", text: "An ADC sampling at f_s cannot tell a frequency f from one at f_s - f. Noise above f_s / 2, such as 50 Hz hum when you sample at 60 Hz, or switching noise from a motor driver, folds down and appears as a slow, false signal. You cannot remove it afterwards in software. So filter **before** the ADC with a low-pass whose cut-off is below f_s / 2. For a slow sensor read 10 times a second, an RC filter with f_c of 1 Hz to 2 Hz is reasonable; for audio sampled at 16 kHz, a cut-off around 5 kHz to 7 kHz, preferably second order or higher. The RC filter design is exactly that of module i1, and the capacitor doubles as the reservoir that satisfies the ADC's source impedance requirement." },

      { t: "h", text: "Step 4: protection" },
      { t: "list", items: [
        "**Series resistor** (1 kΩ to 10 kΩ) at the pin, which also forms the anti-alias filter with the capacitor.",
        "**Clamp diodes** to the rails, or rely on the internal ones only if the series resistor limits fault current to about 1 mA or less.",
        "**TVS diode** at the connector for any cable that leaves the board.",
        "**Rail-to-rail op-amp supplied from the ADC's rail** (MCP6002 on 3.3 V), so the amplifier physically cannot drive the pin beyond the supply.",
      ] },

      { t: "h", text: "Reading a datasheet: absolute maximum versus operating conditions" },
      { t: "p", text: "Every datasheet has two tables that students confuse. **Absolute maximum ratings** are stress limits: exceed them, even briefly, and the part may be permanently damaged. They are not conditions under which the part works properly. **Recommended operating conditions** are the range in which the part is designed to work and within which the electrical characteristics table is guaranteed. You design to the recommended conditions, with margin, and treat absolute maximums as a cliff edge you never approach." },
      { t: "table", head: ["Part", "Absolute maximum (do not exceed)", "Recommended operating (design to this)"], rows: [
        ["ESP32 (I/O voltage)", "VDD + 0.3 V on a pin, about 3.6 V", "pins between 0 V and 3.3 V; supply 3.0 V to 3.6 V"],
        ["ESP32 (GPIO current)", "about 40 mA per pin at the strongest drive setting", "default drive about 20 mA; keep the total low"],
        ["ATmega328P (Uno)", "40 mA per I/O pin, 200 mA total for VCC and GND", "about 20 mA per pin for guaranteed output levels"],
        ["MCP6002", "7.0 V supply", "1.8 V to 6.0 V supply"],
        ["2N2222A", "V_CEO 40 V, I_C 600 mA (continuous)", "derate for temperature; switch well below both"],
      ], caption: "Summarised from the Espressif ESP32 datasheet, Microchip ATmega328P and MCP6002 datasheets, and onsemi 2N2222A datasheet. Check the current revision of each." },
      { t: "p", text: "Read every number with its **conditions**. A figure means nothing without the temperature, supply voltage and load it was measured at. Note whether it is a **minimum, typical or maximum**: design with the worst-case limit (min or max), never the typical, which is just what half the parts beat. And read the graphs: an op-amp's output swing at 10 kΩ load can be very different from its swing at 1 kΩ, and the table only gives one." },

      { t: "h", text: "The exit project: a sensor front-end that fills the ADC" },
      { t: "p", text: "Choose a thermistor, load cell or electret microphone. Write down the sensor's output range, the ADC's usable range, the sample rate you need and the protection the input needs. Design the gain, offset, filter and protection, calculate every value, build it, then measure the output at known inputs (ice water and warm water for a thermistor; known weights for a load cell; a tone from a phone for a microphone) and confirm the signal spans most of the ADC range without clipping." },

      { t: "deep", title: "Designing gain and offset with one op-amp", blocks: [
        { t: "p", text: "A non-inverting amplifier whose R_g goes to a reference voltage V_ref instead of ground gives v_out = G × v_in - (G - 1) × V_ref, with G = 1 + R_f / R_g. That subtracts an offset. To add an offset instead, feed the + input through a resistor R_a from the signal and a resistor R_b from the 3.3 V rail. The + input then sits at v+ = k × v_in + (1 - k) × 3.3, with k = R_b / (R_a + R_b). Writing the target as v_out = m × v_in + c, you need m = G × k and c = G × (1 - k) × 3.3." },
        { t: "formula", text: String.raw`Target: 0 to 100 mV in  →  0.2 to 2.2 V out (ESP32 accurate region)
m = (2.2 - 0.2) / 0.1 = 20          c = 0.2 V
G × (1 - k) = 0.2 / 3.3 = 0.0606    G × k = 20    →  G = 20.06,  1 - k = 0.00302
Choose R_a = 1 kΩ, R_b = 330 kΩ:  1 - k = 1/331 = 0.00302
Choose R_g = 1 kΩ, R_f = 19.1 kΩ:  G = 20.1
Check: m = 20.1 × 330/331 = 20.04,   c = 20.1 × 3.3 / 331 = 0.200 V`, caption: "Work the algebra once, then check the result at both ends of the range: 0 mV gives 0.20 V, 100 mV gives 2.20 V." },
        { t: "p", text: "In practice designers often take a simpler path: amplify with G = 20 to 0 to 2.0 V, and accept, or calibrate away, the poor ESP32 readings below 0.15 V, or use an external ADC (such as the ADS1115, a 16-bit I2C part) that is accurate down to 0 V. Knowing the algebra lets you decide whether the extra resistors are worth it." },
      ] },
      { t: "deep", title: "Why absolute maximum ratings are what they are", blocks: [
        { t: "p", text: "A CMOS input pin has protection diodes to its supply and ground. Raise the pin more than about 0.3 V above VDD and the upper diode conducts, which is why the absolute maximum is written as VDD + 0.3 V. Small currents through it are harmless; larger ones can trigger **latch-up**, in which a parasitic thyristor structure in the chip turns on and shorts the supply until power is removed, often destroying the chip. That is the physics behind the rule of a series resistor and a fault current of about 1 mA." },
        { t: "p", text: "Current limits come from the metal tracks and bond wires inside the package and from heat. Junction temperature limits (typically 150 °C) set the power a transistor can dissipate: T_J = T_A + P × θ_JA, where θ_JA is the thermal resistance in °C per watt from the datasheet. A TO-92 2N2222A at about 200 °C/W can dissipate only about 0.6 W at 25 °C ambient before its junction reaches 150 °C, whatever its current rating says." },
      ] },
    ],
    mistakes: [
      "**Designing to absolute maximum ratings.** They are damage limits. Design to recommended operating conditions with margin.",
      "**Using typical values for worst-case design.** Half the parts are worse than typical. Use the min or max column.",
      "**Expecting the ESP32 ADC to be linear from 0 V to 3.3 V.** Keep signals in its accurate region and use the calibrated reading functions.",
      "**Filtering in software only.** Aliased noise cannot be separated from the signal after sampling; filter before the ADC.",
      "**Leaving a sensor input unprotected** when it connects to a cable or the outside world.",
      "**Feeding a large-resistance divider straight into the ADC** with no capacitor or buffer.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: build a sensor front-end that amplifies and filters a small signal to fill an ADC's range.",
      steps: [
        "Choose a sensor: a 10 kΩ NTC thermistor, a load cell with an INA125 (or an HX711 if you are short of time), or an electret microphone module.",
        "Write a one-page design: sensor output range, ADC usable range on your board, gain and offset, filter cut-off and the sample rate it supports, protection components, and the expected output at three known inputs.",
        "Check the datasheet limits of every part you use (op-amp supply, input range and output swing; MCU pin absolute maximums) and note the margin.",
        "Build the circuit with a 100 nF decoupling capacitor at every IC. Before connecting the MCU pin, check with a meter that the output stays within 0 V and the board's supply over the whole input range.",
        "Connect to the ADC and log readings at your three known inputs. For the thermistor, use the sketch in the lesson as a starting point.",
        "Compare measured and predicted outputs, state the percentage of ADC range used, and explain any differences.",
      ],
    },
    quiz: [
      {
        q: "A sensor outputs 0.5 V to 1.0 V. You want it to span 0.5 V to 3.0 V at the ADC. What gain do you need?",
        options: ["3", "6", "5", "2.5"],
        answer: 2,
        why: "G = (3.0 - 0.5) / (1.0 - 0.5) = 2.5 / 0.5 = 5. You then also need an offset, since 0.5 V × 5 = 2.5 V, not 0.5 V.",
      },
      {
        q: "A datasheet lists an absolute maximum supply of 7 V and a recommended range of 1.8 V to 6 V. Which supply is the sound choice?",
        options: ["6.9 V, since it is under the absolute maximum", "7 V", "5 V, inside the recommended range with margin", "Any voltage under 7 V is equally safe"],
        answer: 2,
        why: "Absolute maximums are damage limits with no guarantee of correct operation. Design inside the recommended range, with margin.",
      },
      {
        q: "You sample a temperature sensor at 20 Hz. Why add an RC low-pass before the ADC instead of averaging in software?",
        options: [
          "Software averaging is too slow on a microcontroller",
          "Noise above 10 Hz would alias into false low-frequency readings, which software cannot separate after sampling",
          "The ADC cannot read DC without a filter",
          "It makes the ADC more accurate at 0 V",
        ],
        answer: 1,
        why: "Anything above half the sample rate folds down into the band you care about. It must be removed before the signal is sampled.",
      },
      {
        q: "An NTC thermistor's datasheet gives its resistance as typical 10 kΩ ±1% at 25 °C, beta 3950 ±1%. For a worst-case error estimate, which values should you use?",
        options: ["Only the typical values", "The ends of the tolerance ranges", "Only the beta value", "The absolute maximum ratings"],
        answer: 1,
        why: "Worst-case design uses the limits of each tolerance, not the typical value that only half the parts beat.",
      },
      {
        q: "Why is a microphone signal AC-coupled and biased at mid-rail before an ESP32 ADC?",
        options: [
          "To make it louder",
          "Because the signal swings above and below 0 V, and the ADC can only read positive voltages within its range",
          "Because the ESP32 ADC only works at 1.65 V",
          "To remove high-frequency noise",
        ],
        answer: 1,
        why: "The capacitor blocks the microphone's own DC level and the bias divider centres the signal in the ADC's range so both halves of the wave are captured.",
      },
    ],
  },
};

export default lessons;
