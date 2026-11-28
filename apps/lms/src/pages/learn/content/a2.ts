import type { ModuleContent } from "../model/curriculum";

/**
 * Module a2: Power electronics and motor drives.
 * Builds on i9 (DC motor model, H-bridge basics, buck converter idea, Li-ion
 * cells, TP4056/DW01) and a1 (op-amp limits, stability). Does not re-teach them.
 * Part figures: INA240 from TI's product page; others are typical datasheet
 * values and are flagged in the text as values to confirm in the datasheet.
 */
const lessons: ModuleContent = {
  "a2-switching-converters": {
    id: "a2-switching-converters",
    outcomes: [
      "Derive the duty cycle of buck, boost and buck-boost converters from volt-second balance",
      "Tell continuous from discontinuous conduction and find the boundary load current",
      "Size the inductor, output capacitor and input capacitor of a buck converter to a ripple specification",
      "Describe voltage-mode and current-mode control and what the compensator must do",
    ],
    blocks: [
      { t: "h", text: "Why switch instead of burning" },
      { t: "p", text: "In i9 you met the linear regulator: it drops the excess voltage across a transistor and turns it into heat. From 12 V to 5 V at 2 A, that is 14 W of heat to deliver 10 W, an efficiency of 42%. A switching converter instead chops the input with a transistor that is either fully on (little voltage across it) or fully off (no current through it), and smooths the result with an inductor and a capacitor, which store energy without dissipating it. Ideal switches and reactive parts lose nothing, so efficiencies of 90 to 95% are normal. The price is ripple, noise, and a design that needs real engineering. This lesson derives the three basic topologies from one principle and designs a 12 V to 5 V, 2 A buck converter." },

      { t: "h", text: "The one principle: volt-second balance" },
      { t: "p", text: "An inductor obeys V = L di/dt. In steady state, its current at the end of each switching period must equal its current at the start, otherwise it would grow without limit. So the net change in current over one period is zero, which means the average voltage across the inductor over a period is zero. Equivalently, the volt-seconds applied during the on-time must cancel the volt-seconds during the off-time. The same argument for a capacitor (charge balance) says its average current is zero. Everything below follows from these two statements." },
      { t: "formula", text: String.raw`Δi_L = (1/L) ∫ v_L dt = 0  over one period  →  ⟨v_L⟩ = 0
Switch on for D·T, off for (1 - D)·T,  T = 1 / f_sw`, caption: "Volt-second balance. D is the duty cycle." },

      { t: "h", text: "Buck (step-down)" },
      { t: "diagram", text: String.raw`
 Vin ──[ high-side switch ]──●──[ L ]──●──── Vout
                             │         │
                     [ low-side switch │
                       or diode ]    [ C ]   [ load ]
                             │         │
 GND ────────────────────────┴─────────┴────`, caption: "Buck converter. The switch node is the junction of the two switches and the inductor." },
      { t: "formula", text: String.raw`On:   v_L = Vin - Vout     for D·T
Off:  v_L = 0 - Vout       for (1 - D)·T
(Vin - Vout) D T - Vout (1 - D) T = 0
Vout = D × Vin`, caption: "Buck: the output is the average of the switch-node square wave." },
      { t: "h", text: "Boost (step-up) and buck-boost" },
      { t: "p", text: "In a **boost**, the inductor sits at the input; the switch connects its far end to ground (storing energy), then releases it through a diode into the output. In the inverting **buck-boost**, the inductor sits from the switch node to ground and delivers its energy to an output of opposite polarity. Apply volt-second balance in exactly the same way:" },
      { t: "formula", text: String.raw`Boost:       on: v_L = Vin           off: v_L = Vin - Vout
             Vin D + (Vin - Vout)(1 - D) = 0   →   Vout = Vin / (1 - D)
Buck-boost:  on: v_L = Vin           off: v_L = Vout   (Vout negative)
             Vin D + Vout (1 - D) = 0          →   Vout = -Vin × D / (1 - D)`, caption: "Boost 5 V to 12 V needs D = 1 - 5/12 = 0.583." },
      { t: "p", text: "Note what the formulas say about current: in a boost, the input current equals the inductor current, and the output receives current only during the off-time, so the output capacitor sees large pulsed currents. In a buck it is the reverse: the input capacitor takes the pulses. A non-inverting buck-boost (four switches, used in USB-PD and battery products) runs as a buck or a boost depending on whether Vin is above or below Vout." },

      { t: "h", text: "Continuous and discontinuous conduction" },
      { t: "p", text: "The inductor current is a triangle riding on the load current: it rises during the on-time and falls during the off-time, with peak-to-peak ripple ΔI_L. Its average equals the load current in a buck. If the load current falls below ΔI_L / 2, the triangle would go below zero. With a diode, it cannot, so the current stops at zero for part of each cycle: **discontinuous conduction mode (DCM)**. In DCM the simple formula Vout = D × Vin no longer holds; the output rises at light load unless the controller reduces D. Synchronous converters (a MOSFET instead of the diode) can carry negative current and stay in CCM (\"forced PWM\"), or deliberately skip pulses at light load to save switching losses. The boundary for a buck is I_load = ΔI_L / 2." },

      { t: "h", text: "Worked example: a 12 V to 5 V, 2 A buck" },
      { t: "p", text: "Specification: Vin = 12 V, Vout = 5 V, I_out = 2 A, f_sw = 500 kHz, inductor ripple about 30% of I_out, output ripple under 20 mV." },
      { t: "list", ordered: true, items: [
        "**Duty cycle**: D = 5 / 12 = 0.417 (ideal; losses push it a little higher in practice).",
        "**Inductor**: during the on-time, v_L = 12 - 5 = 7 V for D × T = 0.417 × 2 µs = 0.833 µs. With ΔI_L = 0.3 × 2 = 0.6 A, L = v_L × t_on / ΔI_L = 7 × 0.833 µs / 0.6 A = 9.72 µH. Choose the standard **10 µH**.",
        "**Actual ripple** with 10 µH: ΔI_L = 7 × 0.833 µs / 10 µH = 0.583 A. Peak current = 2 + 0.583 / 2 = **2.29 A**. Choose an inductor with a saturation current of at least 3 A (margin for start-up and current limit) and an RMS rating of at least 2 A.",
        "**Output capacitor**: the ripple current flows into C, giving ΔV = ΔI_L / (8 f C). With 22 µF: 0.583 / (8 × 500 kHz × 22 µF) = 6.6 mV. ESR adds ΔI_L × ESR = 0.583 × 5 mΩ = 2.9 mV. Total under 10 mV, within the 20 mV target.",
        "**Input capacitor**: it supplies the pulsed input current. Its RMS ripple current is I_out √(D(1 - D)) = 2 × √(0.417 × 0.583) = **0.99 A**. Use a ceramic rated for that, close to the switch, plus bulk capacitance at the input connector.",
        "**DCM boundary**: I_load < ΔI_L / 2 = 0.29 A. Below about 0.3 A, a diode buck enters DCM.",
      ] },
      { t: "p", text: "Check the inductor value the other way: the off-time is 0.583 × 2 µs = 1.167 µs at v_L = -5 V, so the fall is 5 × 1.167 µs / 10 µH = 0.583 A, the same as the rise. The current balances over a period, as it must." },
      { t: "note", kind: "warn", text: "Ceramic capacitors lose capacitance with DC bias. A 22 µF, 10 V, 0805 X5R capacitor may provide well under half its rated value at 5 V. Read the DC-bias curve on the manufacturer's site and size for the effective value." },

      { t: "h", text: "Control loop in outline" },
      { t: "p", text: "The output is regulated by adjusting D. In **voltage-mode control**, an error amplifier compares a fraction of Vout with a reference and its output sets D through a PWM comparator. The LC filter is a second-order low-pass with a resonant peak at f_LC = 1 / (2π √(LC)), here 1 / (2π √(10 µH × 22 µF)) ≈ 10.7 kHz, with 180° of phase shift above it, so the compensator (a \"type III\" network) must add phase back. In **current-mode control**, an inner loop switches off when the inductor current reaches a level set by the error amplifier. The inductor then behaves like a current source, the plant becomes nearly first order, and the compensator is simpler (\"type II\"). Current-mode controllers also give free cycle-by-cycle current limiting, which is why most modern integrated bucks use it. Either way, the target is the one from a1: crossover at roughly a tenth to a fifth of f_sw with at least 45° of phase margin, verified with a load-step test whose overshoot you read with the same table." },

      { t: "deep", title: "Deriving the output ripple ΔV = ΔI / (8 f C)", blocks: [
        { t: "p", text: "In a buck, the inductor current is a triangle of peak-to-peak ΔI around I_out. The load takes the DC part, so the capacitor takes the AC triangle. Its positive half lasts T/2 and is a triangle of height ΔI/2." },
        { t: "formula", text: String.raw`Charge in positive half:  Q = (1/2) × (T/2) × (ΔI/2) = ΔI T / 8
ΔV = Q / C = ΔI T / (8 C) = ΔI / (8 f C)
10 µH, 22 µF, 500 kHz:  0.583 / (8 × 5e5 × 22e-6) = 6.6 mV`, caption: "The capacitive part only. ESR and ESL add square and spike components." },
        { t: "p", text: "With electrolytic capacitors, ESR usually dominates: 0.583 A × 50 mΩ = 29 mV, far more than the capacitive term. That is why ceramic output capacitors became standard once controllers could be compensated for their very low ESR." },
      ] },
      { t: "deep", title: "The DCM conversion ratio", blocks: [
        { t: "p", text: "In DCM the inductor current rises from zero during D T, falls to zero during D2 T, and stays at zero for the rest. Volt-second balance gives (Vin - Vout) D = Vout D2. The average inductor current equals the load current." },
        { t: "formula", text: String.raw`I_peak = (Vin - Vout) D T / L
I_out  = (1/2) I_peak (D + D2)
Eliminate D2:  Vout / Vin = 2 / (1 + √(1 + 4K / D²)),   K = 2 L f / R_load`, caption: "As R_load grows (light load), Vout/Vin rises towards 1 for a fixed D." },
        { t: "p", text: "The practical lesson: at light load, a buck controller must reduce D far below Vout/Vin, and its loop gain changes dramatically. Controllers handle this with pulse-skipping or burst modes, which is the cause of the audible hiss or low-frequency ripple you sometimes see at light load." },
      ] },
    ],
    mistakes: [
      "**Sizing the inductor by inductance alone.** Saturation current and RMS current ratings matter as much; a saturated inductor's current spikes destroy the switch.",
      "**Using a capacitor's nominal value.** DC bias derating can halve a ceramic's capacitance.",
      "**Forgetting the input capacitor ripple current.** In a buck, the input capacitor carries pulsed current of about I_out √(D(1 - D)) RMS.",
      "**Applying Vout = D Vin in DCM.** At light load the output rises unless the controller adjusts D.",
      "**Long switch-node and input-loop traces.** The loop from input capacitor through both switches must be tiny, or it radiates and rings.",
    ],
    practice: {
      kind: "bench",
      task: "Characterise a buck converter module and compare with the design equations.",
      steps: [
        "Take a buck module with an accessible inductor (an MP1584 or LM2596 board is fine) and note its inductance and switching frequency from the datasheet.",
        "Power it from a current-limited bench supply at 12 V, set the output to 5 V, and load it with power resistors at 0.2 A, 1 A and 2 A (check resistor power ratings first).",
        "At each load, measure input voltage and current and output voltage and current, and compute efficiency.",
        "Probe the switch node with the oscilloscope (short ground spring), measure the duty cycle, and compare with 5/12. Look for the DCM ringing at light load.",
        "Measure output ripple with the probe tip and ground spring directly across the output capacitor, 20 MHz bandwidth limit on, and compare with ΔI / (8 f C) plus ESR.",
      ],
    },
    quiz: [
      {
        q: "A boost converter runs at D = 0.6 from 5 V. What is the ideal output voltage?",
        options: ["3 V", "8.3 V", "12.5 V", "7.5 V"],
        answer: 2,
        why: "Vout = Vin / (1 - D) = 5 / 0.4 = 12.5 V.",
      },
      {
        q: "What does volt-second balance say about an inductor in steady state?",
        options: [
          "Its current is always constant",
          "The average voltage across it over a switching period is zero",
          "Its voltage is always equal to the input",
          "It stores no energy",
        ],
        answer: 1,
        why: "If the inductor current returns to the same value each period, the integral of v_L over the period, and so its average, is zero.",
      },
      {
        q: "A buck from 24 V to 12 V at 250 kHz uses 22 µH. What is the inductor ripple current?",
        options: ["About 1.09 A", "About 0.55 A", "About 2.2 A", "About 0.27 A"],
        answer: 0,
        why: "D = 0.5, t_on = 0.5 × 4 µs = 2 µs, v_L = 12 V. ΔI = 12 × 2 µs / 22 µH ≈ 1.09 A.",
      },
      {
        q: "With the ripple in the previous question, below what load current does a diode buck enter DCM?",
        options: ["1.09 A", "About 0.55 A", "2.2 A", "It never does"],
        answer: 1,
        why: "DCM begins when the load falls below half the ripple: 1.09 / 2 ≈ 0.55 A.",
      },
      {
        q: "Why is current-mode control easier to compensate than voltage-mode?",
        options: [
          "It has no feedback loop",
          "It runs at a lower frequency",
          "The inner current loop makes the inductor act like a current source, so the power stage looks nearly first order",
          "It removes the output capacitor",
        ],
        answer: 2,
        why: "With the inductor current controlled directly, the LC double pole is split and the plant is close to single-pole, needing a simpler compensator.",
      },
    ],
  },

  "a2-mosfet-losses-gate-drive-and-thermal": {
    id: "a2-mosfet-losses-gate-drive-and-thermal",
    outcomes: [
      "Calculate MOSFET conduction, switching, gate and dead-time losses from datasheet values",
      "Choose a gate driver and size a bootstrap capacitor",
      "Explain dead time and shoot-through",
      "Do a junction temperature calculation with θJC, θCS and θSA and check the safe operating area",
    ],
    blocks: [
      { t: "h", text: "Where the watts go" },
      { t: "p", text: "A switching converter or motor drive is efficient only if its switches really are close to ideal, and the difference between ideal and real becomes heat in a few cubic millimetres of silicon. In i2 you learned the MOSFET as a switch: threshold, Rds(on), gate charge, logic-level parts. Power design asks harder questions: how many watts does this MOSFET dissipate at this current and frequency, how hot will the junction get, and what has to drive the gate so that it switches fast enough? This lesson answers them with numbers, and they set the size of your heat sink and the reliability of your board." },

      { t: "h", text: "Conduction loss" },
      { t: "p", text: "When on, the MOSFET is a resistor Rds(on). Its loss is I_rms² × Rds(on), using the RMS current through that switch. Two corrections make the number honest. First, Rds(on) rises with temperature, typically by a factor of 1.4 to 1.8 between 25 °C and 125 °C; read the normalised Rds(on) graph and use the hot value. Second, Rds(on) depends on gate voltage: a logic-level MOSFET rated at Vgs = 4.5 V is much worse at 3.3 V, which is why power stages use gate drivers at 10 to 12 V." },
      { t: "h", text: "Switching loss" },
      { t: "p", text: "During each transition, voltage and current overlap: the current is already flowing while the voltage across the switch is still falling (or vice versa). With a clamped inductive load (every buck and every motor drive), the switch carries the full current while the full voltage is across it, for a time set by the gate driver. A good approximation is:" },
      { t: "formula", text: String.raw`P_sw ≈ (1/2) × V × I × (t_r + t_f) × f_sw
t ≈ Q_gd / I_gate                     (the Miller plateau time)
P_gate = Q_g × V_drive × f_sw         (dissipated in the driver and gate resistor, not the MOSFET)`, caption: "Switching loss grows with frequency; conduction loss does not." },
      { t: "p", text: "The transition time is mostly the time spent on the **Miller plateau**, where the driver is charging the gate-drain charge Q_gd while the drain voltage swings. Its length is Q_gd divided by the gate current, so a stronger driver switches faster and loses less, at the cost of faster edges and more EMI. A gate resistor (a few ohms) lets you trade the two." },

      { t: "h", text: "Worked example 1: the buck switch" },
      { t: "p", text: "Take the 12 V to 5 V, 2 A buck at 500 kHz from the last lesson, with a high-side MOSFET of Rds(on) = 10 mΩ at 25 °C, 15 mΩ hot, and transition times of 20 ns each way." },
      { t: "formula", text: String.raw`I_rms (high side) ≈ I_out √D = 2 × √0.417 = 1.29 A
P_cond = 1.29² × 0.015 = 0.025 W
P_sw   = 0.5 × 12 × 2 × (20 + 20) ns × 500 kHz = 0.24 W`, caption: "At 500 kHz, switching loss is ten times conduction loss." },
      { t: "p", text: "This is why low-current converters at high frequency choose small MOSFETs with low gate charge rather than the lowest Rds(on): halving Rds(on) usually doubles Q_g and makes the dominant loss worse." },
      { t: "h", text: "Worked example 2: an H-bridge switch" },
      { t: "p", text: "A motor H-bridge from 24 V, 10 A, PWM at 20 kHz, 50% duty, using MOSFETs with Rds(on) = 8 mΩ (12 mΩ hot), Q_gd = 12 nC, Q_g = 40 nC, driven by a half-bridge driver of the IR2104 class (typically about 130 mA source and 270 mA sink; confirm in the datasheet you buy against)." },
      { t: "formula", text: String.raw`P_cond = 10² × 0.012 × 0.5                  = 0.60 W
t_r    = 12 nC / 0.13 A                     = 92 ns
t_f    = 12 nC / 0.27 A                     = 44 ns
P_sw   = 0.5 × 24 × 10 × (92 + 44) ns × 20 kHz = 0.33 W
P_gate = 40 nC × 12 V × 20 kHz              = 9.6 mW   (in the driver)
Total per switching MOSFET                  ≈ 0.93 W`, caption: "At 20 kHz, conduction loss dominates." },

      { t: "h", text: "Gate drivers, dead time and bootstrap supplies" },
      { t: "p", text: "A half-bridge has two N-channel MOSFETs: low side (source at ground) and high side (source at the switch node, which swings between 0 and the supply). Driving the high side needs a gate voltage 10 V or so above the switch node, which may be at 24 V or 400 V. A **gate driver** such as the IR2104 or IR2110 provides a floating high-side output. A three-phase pre-driver such as the DRV8301 does the same for six MOSFETs and adds current-sense amplifiers and protection. Their job: level-shift the logic signal, source and sink amperes of gate current, and enforce dead time." },
      { t: "p", text: "**Dead time**: if both MOSFETs of one leg are on at once, even for 50 ns, the supply is short-circuited through them (**shoot-through**), and the current is limited only by Rds(on) and wiring. Every driver therefore inserts a delay between one switch turning off and the other turning on. The IR2104 has a fixed internal dead time of roughly half a microsecond (check the datasheet value); the IR2110 has none, so your PWM must provide it; most microcontroller motor-control timers (the ESP32's MCPWM, for example) have dead-time generators. During the dead time, the load current flows through a MOSFET's body diode, costing V_f × I × 2 t_d × f: for 0.8 V, 10 A, 520 ns and 20 kHz, that is 0.17 W, and it distorts the output voltage at low duty." },
      { t: "p", text: "**Bootstrap supply**: the high-side driver is powered from a capacitor C_boot between the VB pin and the switch node. When the low-side switch is on, the switch node is near ground and C_boot charges from the 12 V driver supply through a fast diode. When the high side turns on, C_boot rides up with the switch node and supplies the gate charge. Two consequences: the high side cannot stay on indefinitely (C_boot discharges through leakage, so 100% duty is impossible without a charge pump), and C_boot must be large enough not to sag." },
      { t: "formula", text: String.raw`C_boot ≥ (Q_g + I_leak × t_on,max) / ΔV_allowed
       = (40 nC + 100 µA × 50 µs) / 0.5 V = 90 nF    →  use 470 nF to 1 µF, 25 V ceramic`, caption: "The 50 µs is a full 20 kHz period; designers choose several times the minimum." },

      { t: "h", text: "Thermal design" },
      { t: "p", text: "Heat flows from the junction to the air through a chain of thermal resistances in series, each in °C/W, just as current flows through resistors. Temperature rise is power times thermal resistance." },
      { t: "formula", text: String.raw`Tj = Ta + P × (θJC + θCS + θSA)       with a heat sink
Tj = Ta + P × θJA                      no heat sink (θJA from the datasheet, measured on a stated PCB)`, caption: "θJC: junction to case. θCS: case to sink, through the thermal pad or grease. θSA: sink to ambient." },
      { t: "p", text: "For the H-bridge MOSFET in a TO-220 package (θJC ≈ 1 °C/W, θJA ≈ 62 °C/W, typical for the package), dissipating 0.93 W at Ta = 40 °C: without a heat sink, Tj = 40 + 0.93 × 62 ≈ 98 °C. That is legal for a 175 °C part but leaves little margin in a closed box, and Rds(on) at 98 °C is already the hot value. With a heat sink of θSA = 10 °C/W and a pad of θCS = 0.5 °C/W, Tj = 40 + 0.93 × (1 + 0.5 + 10) ≈ 51 °C. Reverse the calculation to choose a heat sink: for 4 W, Tj limited to 110 °C (a sensible derating) and Ta = 50 °C, θSA ≤ (110 - 50) / 4 - 1.5 = 13.5 °C/W." },
      { t: "p", text: "Surface-mount MOSFETs use the PCB as the heat sink: the thermal pad soldered to a copper area, with vias to inner or bottom copper. Datasheet θJA values assume a specific copper area (often 1 square inch of 2 oz copper); on a smaller pad, expect a much higher figure." },

      { t: "h", text: "Safe operating area" },
      { t: "p", text: "The **SOA** graph in a MOSFET datasheet plots drain current against drain-source voltage on log axes, with boundaries for Rds(on) limit, maximum current, maximum power for pulses of stated length (10 µs, 1 ms, DC) at a case temperature of 25 °C, and breakdown voltage. A switch in a hard-switching converter crosses the high-V, high-I region only for nanoseconds and stays within the short-pulse lines. Danger comes when a MOSFET operates linearly for longer: inrush limiting, a hot-swap circuit, a slow gate driven by a weak GPIO, or a reverse-polarity MOSFET turning on slowly. Modern trench MOSFETs can fail in linear mode well inside their apparent DC power rating, because of hot spots; check the DC and 10 ms lines and derate them for real case temperature." },
      { t: "note", kind: "safety", text: "A failed power MOSFET usually fails short. On a 24 V battery-powered bridge, a shorted leg can draw hundreds of amperes. Always put a fuse sized for the wiring between the battery and the board, and test new power stages from a current-limited bench supply first." },

      { t: "deep", title: "Deriving the switching loss triangle", blocks: [
        { t: "p", text: "At turn-on with a clamped inductive load, the current rises first, from 0 to I, while the voltage stays at V (the freewheeling diode holds the switch node). Then the voltage falls from V to nearly 0 while the current stays at I. Each phase is roughly a linear ramp, so the instantaneous power v × i is a triangle in each phase." },
        { t: "formula", text: String.raw`Energy in current rise:  ∫ V × (I t / t_ri) dt  = (1/2) V I t_ri
Energy in voltage fall:  ∫ I × V (1 - t / t_fv) dt = (1/2) V I t_fv
E_on ≈ (1/2) V I (t_ri + t_fv),  similarly E_off
P_sw = (E_on + E_off) × f_sw`, caption: "The Miller plateau sets t_fv and t_rv; the current ramps are set by Vgs moving from Vth to the plateau." },
        { t: "p", text: "Two losses the triangle ignores: the energy in the output capacitance Coss, (1/2) Coss V² per cycle, dumped into the channel at each hard turn-on; and the reverse-recovery charge of the opposite diode, which flows through the switch as an extra current spike. At 400 V both can dominate. At 24 V they are usually small, but reverse recovery is the reason synchronous rectifier MOSFETs are chosen for low Qrr." },
      ] },
      { t: "deep", title: "Thermal capacitance and transient thermal impedance", blocks: [
        { t: "p", text: "Thermal resistances describe steady state. The die and package also have heat capacity, so a short pulse heats the junction less than the same power held for ever. Datasheets give a transient thermal impedance graph Z_θJC(t) as a fraction of θJC versus pulse length and duty. For a single 1 ms pulse it may be 0.1 to 0.3 of θJC." },
        { t: "p", text: "Use it for motor stalls and start-up: a 50 A, 100 ms stall in the H-bridge dissipates 50² × 0.012 = 30 W per conducting MOSFET; with Z_θ for 100 ms of, say, 0.7 °C/W, the junction rises 21 °C above the case in that time. The case and heat sink, with much larger thermal mass, barely move. Your over-current protection must act within the time the transient curve allows." },
      ] },
    ],
    mistakes: [
      "**Using the 25 °C Rds(on).** At operating temperature it is 1.4 to 1.8 times higher.",
      "**Driving a power MOSFET straight from a 3.3 V GPIO at high frequency.** Weak drive stretches the Miller plateau and multiplies switching loss.",
      "**Assuming the IR2110 inserts dead time.** It does not; the IR2104 does. Read which kind your driver is.",
      "**Asking a bootstrap driver for 100% duty.** The bootstrap capacitor discharges and the high side turns off or half-on.",
      "**Using θJA from the datasheet for a board with a tiny copper pad.** θJA is only valid on the copper area it was measured with.",
      "**Ignoring linear-mode SOA.** A slow inrush circuit can kill a MOSFET well inside its DC power rating.",
    ],
    practice: {
      kind: "bench",
      task: "Measure switching transitions and temperature rise of a MOSFET half-bridge and compare with your loss budget.",
      steps: [
        "Build a half-bridge with two logic-level N-channel MOSFETs and an IR2104-class driver from a 12 V current-limited supply (set to 2 A), driving a 2 Ω power resistor (it dissipates about 18 W at 50% duty, so use a 25 W or larger part on a heat sink) in series with a 100 µH inductor to the low rail.",
        "Generate 20 kHz PWM at 50% from an ESP32 DevKit (LEDC on GPIO 25, 3.3 V logic into the driver's IN pin, SD tied to a second GPIO for enable).",
        "Probe the gate and the switch node. Measure the Miller plateau duration and the dead time.",
        "Compute conduction, switching and dead-time loss for your measured current and times.",
        "Attach a thermocouple or use a thermal camera to measure case temperature after 10 minutes, and back-calculate the power from θJA. Compare with the budget.",
      ],
    },
    quiz: [
      {
        q: "A MOSFET carries 5 A RMS with Rds(on) = 20 mΩ hot. What is its conduction loss?",
        options: ["0.1 W", "0.5 W", "2.5 W", "0.05 W"],
        answer: 1,
        why: "P = I² R = 25 × 0.02 = 0.5 W.",
      },
      {
        q: "A MOSFET switches 48 V and 5 A with t_r + t_f = 100 ns at 50 kHz. What is the approximate switching loss?",
        options: ["0.6 W", "6 W", "0.06 W", "1.2 W"],
        answer: 0,
        why: "P = 0.5 × 48 × 5 × 100 ns × 50 kHz = 0.6 W.",
      },
      {
        q: "What is shoot-through, and what prevents it?",
        options: [
          "Current through the body diode; prevented by a Schottky",
          "Gate oscillation; prevented by a gate resistor",
          "Both MOSFETs of one leg conducting at once; prevented by dead time",
          "Inductor saturation; prevented by a larger core",
        ],
        answer: 2,
        why: "If high and low side overlap, the supply is shorted through them. Dead time guarantees one is off before the other turns on.",
      },
      {
        q: "A MOSFET dissipates 3 W with θJC = 1.5, θCS = 0.5 and θSA = 8 °C/W at Ta = 35 °C. What is Tj?",
        options: ["65 °C", "59 °C", "95 °C", "35 °C"],
        answer: 0,
        why: "Tj = 35 + 3 × (1.5 + 0.5 + 8) = 35 + 30 = 65 °C.",
      },
      {
        q: "Why can a bootstrap high-side driver not hold the high-side MOSFET on at 100% duty for long?",
        options: [
          "The MOSFET overheats",
          "The bootstrap capacitor recharges only when the switch node is low, and leakage discharges it",
          "Dead time forbids it",
          "The low-side MOSFET turns on",
        ],
        answer: 1,
        why: "C_boot charges through the diode only while the low side pulls the switch node to ground. Without that, leakage slowly drains it.",
      },
    ],
  },

  "a2-bridges-inverters-and-brushless-control": {
    id: "a2-bridges-inverters-and-brushless-control",
    outcomes: [
      "Design a MOSFET H-bridge: device rating, gate drive, decoupling and layout",
      "Explain how a three-phase inverter produces line voltages from six switches",
      "Describe trapezoidal (six-step) commutation from Hall sensors",
      "Explain field-oriented control and apply the Clarke and Park transforms",
    ],
    blocks: [
      { t: "h", text: "From a driver chip to a power stage you design" },
      { t: "p", text: "In i9 you used H-bridge chips (TB6612FNG, DRV8833) and learned braking, coasting and PWM frequency. Those chips integrate MOSFETs good for one or two amperes. A robot drive at 24 V and 10 A, an e-bike or a drone motor needs discrete MOSFETs, gate drivers and a layout you design yourself. The theory from the last two lessons sizes each switch. This lesson assembles them into an H-bridge and a three-phase inverter, and then explains how a brushless motor is commutated: first the simple trapezoidal way, then field-oriented control." },

      { t: "h", text: "H-bridge design checklist" },
      { t: "list", ordered: true, items: [
        "**Voltage rating**: Vds rating at least 1.5 to 2 times the maximum bus voltage, because switching transients and regenerative braking push the bus above nominal. For a 24 V battery (up to 29.4 V for a full 7S Li-ion pack), use 60 V MOSFETs.",
        "**Current and loss**: compute conduction, switching and dead-time loss at the hot Rds(on) and at stall current, not just at running current; then do the thermal calculation.",
        "**Gate drive**: two half-bridge drivers (IR2104 class) or one full-bridge driver, a 10 to 12 V gate supply, gate resistors of a few ohms to tame ringing, and a pull-down of about 10 kΩ from each gate to its source so the MOSFETs stay off while the controller boots.",
        "**Bulk and decoupling capacitance**: electrolytic bulk near the bridge to absorb motor ripple current, plus 100 nF to 1 µF ceramic directly across each leg. The loop from capacitor to high-side drain to low-side source and back must be as short as possible, because its inductance times di/dt is the voltage spike on every edge.",
        "**Current sensing and protection**: a shunt in each leg or in the common return, an over-current comparator that disables the driver within microseconds (next lesson).",
        "**Logic isolation**: keep the microcontroller ground connected to the power ground at one point, near the shunt reference, so motor current does not flow through the logic ground.",
      ] },
      { t: "p", text: "Regenerative braking deserves a note. When a spinning motor is braked by the bridge, its back-EMF drives current into the supply. A battery absorbs it; a bench supply cannot, and the bus voltage rises until something fails. Either keep a battery or large capacitor on the bus, or add a brake chopper: a resistor switched across the bus when the voltage exceeds a threshold." },

      { t: "h", text: "The three-phase inverter" },
      { t: "diagram", text: String.raw`
  +Vbus ───┬──────────┬──────────┬───
         [QAH]      [QBH]      [QCH]
           ├── A      ├── B      ├── C   → to motor windings
         [QAL]      [QBL]      [QCL]
  GND  ────┴──────────┴──────────┴───`, caption: "Three half-bridges. Each phase output can be connected to +Vbus or to ground." },
      { t: "p", text: "A three-phase inverter is three half-bridges sharing one bus. A pre-driver such as the DRV8301 drives all six gates (three bootstrap high sides). Each phase node can be at Vbus or 0, so there are 2³ = 8 switch states, two of which (all high, all low) put zero voltage across the windings. PWM on each leg makes the average voltage of each phase anything from 0 to Vbus, and the motor responds to the differences between phase voltages." },

      { t: "h", text: "Brushless motors and trapezoidal control" },
      { t: "p", text: "A brushless DC motor (BLDC) has permanent magnets on the rotor and three windings on the stator, usually star-connected. Torque comes from the stator's magnetic field pulling the rotor's field; it is maximum when the two are at 90° electrical. Without brushes, the controller must switch the windings in step with rotor position. The motor's back-EMF in each phase is roughly trapezoidal for a classic BLDC, sinusoidal for a PMSM; most small motors are somewhere in between." },
      { t: "p", text: "In **trapezoidal (six-step) commutation**, at any moment one phase is driven high (with PWM), one is driven low, and the third floats. Three Hall sensors spaced 120° electrical give six distinct codes per electrical revolution, each selecting one of six switch patterns. PWM duty sets the voltage and therefore the speed." },
      { t: "table", head: ["Hall code (C B A)", "Phase A", "Phase B", "Phase C"], rows: [
        ["001", "+ (PWM)", "-", "float"],
        ["011", "+ (PWM)", "float", "-"],
        ["010", "float", "+ (PWM)", "-"],
        ["110", "-", "+ (PWM)", "float"],
        ["100", "-", "float", "+ (PWM)"],
        ["101", "float", "-", "+ (PWM)"],
      ], caption: "One common six-step sequence. The mapping from Hall codes to steps depends on the motor; find it by experiment at low current, or from the motor's datasheet." },
      { t: "p", text: "Sensorless trapezoidal control uses the floating phase instead of Halls: its voltage crosses half the bus at a known angle (30° electrical before the next commutation), so a comparator on the floating phase replaces the sensors once the motor is turning fast enough to produce back-EMF. That is how hobby drone ESCs work, and why they need a blind open-loop start." },
      { t: "p", text: "Six-step control is simple and efficient at speed, but it switches current between phases abruptly six times per electrical revolution, causing torque ripple of roughly 10 to 15% and audible noise, and it cannot hold a precise torque at very low speed." },

      { t: "h", text: "Field-oriented control in outline" },
      { t: "p", text: "**Field-oriented control (FOC)** drives all three phases with sinusoidal currents whose combined field is always held at 90° to the rotor's field, so torque is smooth and directly proportional to a single current. The trick is a change of coordinates. Three phase currents (of which only two are independent, since they sum to zero) are transformed into two currents in a frame that rotates with the rotor:" },
      { t: "list", items: [
        "**i_d** (direct axis), the current component aligned with the rotor magnets. It produces no torque; normally controlled to zero (or negative, for field weakening at high speed).",
        "**i_q** (quadrature axis), the component at 90° to the magnets. Torque is proportional to i_q: T = (3/2) × p × ψ × i_q for a surface-magnet motor with p pole pairs and magnet flux linkage ψ.",
      ] },
      { t: "p", text: "In the rotating frame, i_d and i_q are DC quantities at steady state, so two ordinary PI controllers (one for each, from a8) regulate them. Each control cycle, typically at the PWM frequency of 10 to 20 kHz: measure two phase currents and the rotor angle θ (from an encoder, Halls with interpolation, or an observer); transform to i_d and i_q; run the two PI loops; transform the requested voltages back to three phases; and set the three PWM duties. Because the loops see DC, they have no trouble tracking sinusoids at high speed, which is the whole reason for the transform." },
      { t: "diagram", text: String.raw`
 i_q ref ─►(PI)─► v_q ─┐                         ┌─► PWM A
                       ├─► inverse Park ─► SVPWM ─┼─► PWM B ─► inverter ─► motor
 i_d ref ─►(PI)─► v_d ─┘        ▲                └─► PWM C            │
            ▲                    θ                                       │
            └──── Park ◄── Clarke ◄── i_a, i_b (shunts) ◄────────────────┘
                   ▲
                   θ (encoder or observer)`, caption: "The FOC loop. SVPWM (space-vector PWM) is the usual way of turning two voltages into three duty cycles." },

      { t: "deep", title: "The Clarke and Park transforms, with a numerical check", blocks: [
        { t: "p", text: "The **Clarke transform** maps three balanced phase quantities onto two stationary orthogonal axes α and β. With ia + ib + ic = 0, only two currents need to be measured. The amplitude-invariant form keeps the peak value unchanged." },
        { t: "formula", text: String.raw`iα = ia
iβ = (ia + 2 ib) / √3`, caption: "Clarke, amplitude-invariant, using ia + ib + ic = 0." },
        { t: "p", text: "The **Park transform** rotates the (α, β) frame by the rotor's electrical angle θ, so that the d axis lines up with the magnets." },
        { t: "formula", text: String.raw`| id |   |  cos θ   sin θ |   | iα |
| iq | = | -sin θ   cos θ | × | iβ |

Inverse:  vα = vd cos θ - vq sin θ
          vβ = vd sin θ + vq cos θ`, caption: "Park and inverse Park. The inverse returns voltages to the stationary frame for the modulator." },
        { t: "p", text: "Check with balanced unit currents aligned with the rotor: ia = cos θ, ib = cos(θ - 120°), at θ = 30°. Then ia = 0.866, ib = cos(-90°) = 0. Clarke gives iα = 0.866 and iβ = (0.866 + 0)/√3 = 0.5. Park gives id = 0.866 × 0.866 + 0.5 × 0.5 = 1.0 and iq = -0.866 × 0.5 + 0.5 × 0.866 = 0. The sinusoidal three-phase currents have become a constant id = 1, iq = 0, exactly as claimed. The snippet checks this at every angle." },
        { t: "snippet", lang: "python", code: String.raw`import math

def clarke(ia, ib):
    return ia, (ia + 2 * ib) / math.sqrt(3)

def park(alpha, beta, theta):
    c, s = math.cos(theta), math.sin(theta)
    return alpha * c + beta * s, -alpha * s + beta * c

# Balanced currents aligned with the d axis (peak 1) must give id = 1, iq = 0.
for deg in range(0, 360, 15):
    th = math.radians(deg)
    ia = math.cos(th)
    ib = math.cos(th - 2 * math.pi / 3)
    i_d, i_q = park(*clarke(ia, ib), th)
    assert abs(i_d - 1) < 1e-9 and abs(i_q) < 1e-9, (deg, i_d, i_q)
print("Clarke and Park check passed at every angle")`, caption: "Run with python3. Shift the currents by 90° (use sin instead of cos) and you get id = 0, iq = 1: pure torque." },
      ] },
      { t: "deep", title: "Space-vector PWM and why it gives 15% more voltage", blocks: [
        { t: "p", text: "With plain sinusoidal PWM, each phase's duty swings between 0 and 1 about 0.5, so the peak phase voltage relative to the bus midpoint is Vbus/2, and the peak line-to-line voltage is √3 × Vbus/2 = 0.866 Vbus. But the motor only sees line-to-line differences. Adding the same signal to all three phases (a common-mode offset) changes nothing for the motor, so you can add a waveform that flattens the peaks." },
        { t: "p", text: "Space-vector PWM, or the equivalent min-max injection (subtract the average of the largest and smallest of the three references from each), lets the peak line-to-line voltage reach the full Vbus. The ratio 1 / 0.866 = 1.155 is the 15.5% gain. In practice this means a 24 V system can reach the same speed that sinusoidal PWM would need about 27.7 V for." },
      ] },
    ],
    mistakes: [
      "**Choosing MOSFETs rated just above the nominal bus voltage.** Transients and regeneration need 1.5 to 2 times margin.",
      "**No gate pull-down resistors.** Floating gates during boot can turn both MOSFETs of a leg on.",
      "**Testing regenerative braking on a bench supply.** The bus voltage rises with nowhere to go; use a battery or a brake chopper.",
      "**Wrong Hall-to-phase mapping.** The motor vibrates, draws high current or turns roughly; find the mapping at low current limit.",
      "**Forgetting that FOC needs an accurate rotor angle.** An angle error of 30° costs about 13% of torque (cos 30° = 0.866) and adds unwanted i_d.",
    ],
    practice: {
      kind: "bench",
      task: "Commutate a small BLDC motor with six-step control and log Hall codes and phase current.",
      steps: [
        "Use a three-phase driver board of the DRV8301 or similar class, or a small gimbal-motor driver, from a 12 V current-limited bench supply set to 1 A.",
        "Connect the motor's Hall outputs (with pull-ups to 3.3 V) to three ESP32 DevKit GPIOs and print the code while turning the rotor by hand. Record the sequence of six codes.",
        "Write firmware that maps each Hall code to the six-step table and applies 20 kHz PWM at 15% duty. If the motor stalls or vibrates, rotate the mapping by one step and retry.",
        "Probe one phase current with a current probe or the board's shunt amplifier and observe the six-step current shape.",
        "Run the Python Clarke and Park check from the lesson, then apply it to two phase currents you captured and plot i_d and i_q.",
      ],
    },
    quiz: [
      {
        q: "In a 7S Li-ion pack (up to 29.4 V), which MOSFET voltage rating is the sensible minimum for the bridge?",
        options: ["30 V", "40 V", "60 V", "20 V"],
        answer: 2,
        why: "Allow 1.5 to 2 times the maximum bus voltage for transients and regeneration: about 45 to 60 V, so 60 V parts.",
      },
      {
        q: "In six-step commutation, how many phases are actively driven at any moment?",
        options: ["All three", "Two (one high, one low), with the third floating", "One", "None, the Hall sensors drive them"],
        answer: 1,
        why: "Each step drives one phase high and one low; the third floats, which is also where sensorless control reads back-EMF.",
      },
      {
        q: "Why does FOC transform the currents into the rotating d-q frame?",
        options: [
          "To reduce the number of MOSFETs",
          "Because in that frame the sinusoidal currents become DC, so simple PI controllers can regulate torque and flux",
          "To remove the need for current sensors",
          "To make the motor spin backwards",
        ],
        answer: 1,
        why: "At steady state i_d and i_q are constant, so PI loops track them without the phase lag problems of tracking sinusoids.",
      },
      {
        q: "With the Clarke transform in the lesson, ia = 1 and ib = -0.5. What is iβ?",
        options: ["0", "1", "0.577", "-0.5"],
        answer: 0,
        why: "iβ = (ia + 2 ib)/√3 = (1 - 1)/√3 = 0.",
      },
      {
        q: "Which component of the stator current produces torque in a surface-magnet motor?",
        options: ["i_d", "i_α", "The neutral current", "i_q"],
        answer: 3,
        why: "Torque is proportional to i_q, the component at 90° electrical to the rotor magnets.",
      },
    ],
  },

  "a2-sensing-protection-and-battery-management": {
    id: "a2-sensing-protection-and-battery-management",
    outcomes: [
      "Design shunt current sensing with an INA240 or INA181 class amplifier, or choose a Hall sensor",
      "Add over-current, over-voltage and reverse-polarity protection to a power stage",
      "Explain what a battery management system monitors and how passive and active balancing work",
      "Plan the characterisation of a motor driver or converter for the exit project",
    ],
    blocks: [
      { t: "h", text: "The difference between a demo and a product" },
      { t: "p", text: "A power stage that works on the bench is half finished. In the field, motors stall, wires short, someone connects the battery backwards, a regenerating motor pumps the bus up, a cell in a pack drifts low. Each of these can destroy the board or, with lithium cells, start a fire. This lesson covers how to measure current precisely in a switching environment, the protection circuits every power board needs, and how battery packs are kept safe and balanced. It ends with the plan for the module's exit project." },

      { t: "h", text: "Shunt current sensing" },
      { t: "p", text: "A **shunt** is a low-value resistor in the current path; its voltage is I × R. Two placements:" },
      { t: "list", items: [
        "**Low side** (between the bridge and ground): the common-mode voltage is near 0 V, so a simple amplifier works. An INA181-class current-sense amplifier (fixed gains of 20 to 200 V/V) suits this, but low-side sensing cannot see a short from the motor terminal to ground, and it shifts the bridge ground by I × R.",
        "**Inline or high side** (in a motor phase or the supply line): sees every fault, but the shunt's common-mode voltage swings with PWM from 0 to Vbus in nanoseconds. You need an amplifier designed to reject that. The **INA240** is: common-mode range -4 V to 80 V independent of its 2.7 to 5.5 V supply, gains of 20 (A1), 50 (A2), 100 (A3) and 200 V/V (A4), 400 kHz bandwidth, and enhanced PWM rejection (93 dB AC CMRR at 50 kHz).",
      ] },
      { t: "p", text: "Worked example: an inline phase shunt for ±20 A, read by a 3.3 V ESP32. Bidirectional sensing needs the output to sit at mid-supply at zero current, so set the INA240's reference pins to 1.65 V. The output can swing about ±1.6 V. With gain 20 (INA240A1), the shunt voltage must stay within ±80 mV, so R = 80 mV / 20 A = **4 mΩ**. Power in the shunt at 20 A: 20² × 0.004 = **1.6 W**, so choose a 3 W, 4-terminal (Kelvin) shunt and route its sense terminals as a pair straight to the amplifier, following a1's 4-wire rule. The output scale is 4 mΩ × 20 = 80 mV/A." },
      { t: "p", text: "**Hall-effect sensors** (for example the ACS712 and ACS724 families) measure the magnetic field of the current through an isolated conductor in the package. They give galvanic isolation and no shunt loss, at the cost of more offset, temperature drift and noise, and sensitivity to stray fields. Use them for isolation or very high currents; use shunts for accuracy and bandwidth." },
      { t: "note", kind: "tip", text: "Sample the phase current in the middle of the PWM on-time, synchronised to the PWM counter (the ESP32 MCPWM and most motor-control timers can trigger the ADC). Sampling at a random moment catches switching spikes and ripple." },

      { t: "h", text: "Over-current protection" },
      { t: "p", text: "Firmware is too slow for a short circuit: a shorted 24 V bridge with 20 mΩ of total path resistance reaches hundreds of amperes in microseconds, limited only by wiring inductance. Protection is layered:" },
      { t: "list", ordered: true, items: [
        "**Cycle-by-cycle limit** in hardware: a comparator on the current-sense output resets the PWM for the rest of the cycle when the current exceeds a threshold. Most motor pre-drivers (DRV8301 class) also offer Vds monitoring: if the drain-source voltage of an on MOSFET exceeds a set level, the current must be excessive and the driver turns it off.",
        "**Latching shutdown** after repeated or severe over-current: the driver's shutdown pin (SD on the IR2104) pulled low by a latch, cleared only by firmware after investigation.",
        "**Firmware limit** on the average current (thermal protection of the motor and wiring), using the sampled current and a model of I²t.",
        "**A fuse** sized for the wiring, as the last line when everything else fails short.",
      ] },
      { t: "h", text: "Over-voltage and transients" },
      { t: "p", text: "Sources of over-voltage: regenerative braking, inductive kick when a long battery cable is suddenly interrupted (V = L di/dt), and hot-plugging, where a ceramic input capacitor and cable inductance ring to nearly twice the supply. Defences: a **TVS diode** across the input sized so its clamping voltage is below the MOSFETs' Vds rating; bulk capacitance (electrolytics have enough ESR to damp the hot-plug ring); a brake chopper or firmware that stops regeneration when the bus rises; and an over-voltage comparator that shuts the bridge down." },
      { t: "h", text: "Reverse-polarity protection" },
      { t: "p", text: "Connecting a battery backwards forward-biases every MOSFET body diode in the bridge and destroys the board in milliseconds. Options, compared at 5 A:" },
      { t: "table", head: ["Method", "Loss at 5 A", "Notes"], rows: [
        ["Series Schottky diode", "0.45 V × 5 A = 2.25 W", "Simple; wastes voltage and needs a heat sink"],
        ["P-channel MOSFET, high side", "5² × 10 mΩ = 0.25 W", "Gate to ground through a resistor, Zener clamp gate-source; body diode conducts until the channel turns on"],
        ["N-channel MOSFET, low side", "5² × 5 mΩ = 0.125 W", "Cheapest low-loss option, but the board ground is no longer the battery negative"],
        ["Ideal-diode controller + N-MOSFET", "Similar to N-MOSFET", "Also blocks reverse current on brown-out; best for high current"],
      ], caption: "MOSFET options assume the stated Rds(on). Note that a reverse-polarity MOSFET is inserted the 'wrong' way so its body diode conducts in the correct polarity." },
      { t: "note", kind: "warn", text: "A plain reverse-polarity MOSFET conducts in both directions once on, so it does not stop a regenerating motor from pushing current back into the battery. That is usually what you want with a battery, and exactly what you do not want with a bench supply." },

      { t: "h", text: "Battery management systems" },
      { t: "p", text: "In i9 you met the single-cell TP4056 charger and DW01 protection. A multi-cell pack needs a **battery management system (BMS)** that, at minimum:" },
      { t: "list", items: [
        "Measures **every cell voltage** and disconnects the pack (through back-to-back MOSFETs) on cell over-voltage (typically 4.20 to 4.25 V) or under-voltage (2.5 to 3.0 V, by chemistry and datasheet).",
        "Measures **pack current** and disconnects on over-current and short circuit, with fast hardware trip.",
        "Measures **temperature** with NTCs and blocks charging below about 0 °C (lithium plating) and charging or discharging above the cell's limit.",
        "**Balances** the cells so that they reach full charge together.",
        "Estimates **state of charge** (coulomb counting, corrected by voltage when resting) and, in better systems, state of health.",
      ] },
      { t: "p", text: "Why balance? Cells in series carry the same current, but they differ slightly in capacity and self-discharge. Over many cycles, one cell drifts higher. The charger stops when that cell reaches 4.2 V, so the others never fill; on discharge, the lowest cell hits its cut-off first. The pack's usable capacity becomes that of its worst cell." },
      { t: "p", text: "**Passive balancing** bleeds charge from the highest cells through a resistor during the end of charge. With a 33 Ω bleed resistor at 4.2 V, the bleed current is 4.2 / 33 = **127 mA** and the resistor dissipates 4.2² / 33 = **0.53 W**. Correcting a 100 mAh imbalance takes 100 / 127 ≈ 0.79 h, about **47 minutes**. Passive balancing is simple and universal but wastes energy as heat and is slow for large packs. **Active balancing** moves charge from high cells to low cells with switched capacitors or small inductive or transformer converters, at the cost of complexity; it pays off in large, expensive packs such as electric vehicles." },
      { t: "note", kind: "safety", text: "Lithium-ion cells can deliver hundreds of amperes into a short and can go into thermal runaway if over-charged, over-discharged and recharged, punctured or overheated. Never bypass a BMS, never charge a damaged or swollen cell, charge on a non-flammable surface you can watch, keep a sand bucket or a class D-suitable means at hand, and insulate pack terminals while you work. Use spot-welded or properly rated connections, never soldering directly onto cells." },
      { t: "note", kind: "safety", text: "Capacitors store energy after the power is off. A 1000 µF bus capacitor at 48 V holds (1/2) × 1000 µF × 48² = 1.15 J, enough to weld a screwdriver tip or burn skin across a ring. Fit a bleed resistor, and measure the bus before touching a power board." },

      { t: "h", text: "Exit project: design, build and characterise" },
      { t: "p", text: "The exit project is a motor driver board or a DC-DC converter, designed to a specification, built and characterised for efficiency and temperature. The deliverable is a short report with these parts: specification (input range, output, current, switching frequency, ambient); design calculations (duty cycle and component sizing, loss budget per device, thermal calculation, protection thresholds); schematic and layout notes (power loop, Kelvin shunt routing, star ground); test plan; and measured results. Measure efficiency at 10%, 25%, 50%, 75% and 100% load as (Vout × Iout) / (Vin × Iin), with the meters connected at the board terminals (4-wire again); measure MOSFET case temperatures after thermal equilibrium (at least 15 minutes) and compare with your θ-based prediction; and test each protection deliberately at reduced energy: current limit into a short, reverse polarity at low current limit, over-voltage with a bench supply." },

      { t: "deep", title: "Shunt design details: inductance, Kelvin layout and temperature coefficient", blocks: [
        { t: "p", text: "A shunt is not purely resistive. A few nanohenries of parasitic inductance L with resistance R form a zero at R / (2π L): for 4 mΩ and 2 nH, that is 318 kHz. Above it, the shunt voltage rises with frequency and the measured current shows spikes on every edge. A small RC filter at the amplifier input with the same time constant (L/R = 0.5 µs) cancels it." },
        { t: "p", text: "Temperature coefficient matters because the shunt heats itself: a 1.6 W shunt may rise 50 °C. Metal-element shunts are specified at 50 to 100 ppm/°C; a 50 °C rise at 100 ppm/°C is a 0.5% gain error. Thick-film chip resistors used as shunts can be several hundred ppm/°C. For the copper trace \"free shunt\" sometimes used on cheap boards, copper's coefficient is about 3900 ppm/°C, a 20% change over 50 °C." },
      ] },
      { t: "deep", title: "Coulomb counting and why voltage alone misleads", blocks: [
        { t: "p", text: "Coulomb counting integrates current: SOC(t) = SOC(0) - (1/Q) ∫ I dt. Its weakness is accumulated error. A current-sense offset of 5 mA on a 2000 mAh pack, uncorrected, is 5 mAh per hour, 0.25% per hour, which adds up to 6% per day." },
        { t: "p", text: "The open-circuit voltage of a lithium cell maps to SOC, but only after the cell has rested for tens of minutes; under load, the voltage drops by I × R_internal plus slow diffusion effects. Lithium iron phosphate cells have a nearly flat voltage curve between about 20% and 90%, so voltage is almost useless for them in that range. Practical fuel gauges combine both: count coulombs continuously, and correct SOC from the rested voltage whenever the pack has been idle. More advanced systems run an equivalent-circuit model of the cell inside a Kalman filter (a9)." },
      ] },
    ],
    mistakes: [
      "**Routing shunt sense lines from the pad corners carrying load current.** Use the shunt's Kelvin terminals, or the trace resistance becomes part of the measurement.",
      "**Using a general-purpose op-amp on an inline phase shunt.** It cannot reject the fast PWM common-mode swing; use an INA240-class amplifier.",
      "**Relying on firmware for short-circuit protection.** It takes microseconds for current to reach destructive levels; a hardware trip must act first.",
      "**Choosing a TVS whose clamping voltage is above the MOSFET rating.** The breakdown voltage is not the clamping voltage; read the clamping figure at your surge current.",
      "**Charging a multi-cell pack without balancing or cell-level monitoring.** One cell will be over-charged eventually.",
    ],
    practice: {
      kind: "bench",
      task: "Add current sensing and protection to a half-bridge or buck converter and verify each protection deliberately.",
      steps: [
        "Fit a 4-terminal shunt and an INA240A1 (or INA181 on the low side) to your power stage, referenced at 1.65 V, and read it with an ESP32 DevKit ADC pin (GPIO 34) at 3.3 V.",
        "Calibrate the current reading at three known currents from an electronic load or resistors, and record gain and offset.",
        "Build a comparator over-current trip on the amplifier output that pulls the driver's shutdown pin low, set to 1.5 times rated current. Verify it with a low-current-limited short, watching the gate signal and current on the oscilloscope.",
        "Add a P-channel reverse-polarity MOSFET and confirm, at a 100 mA bench current limit, that a reversed supply draws no current.",
        "Measure efficiency at five load points and MOSFET case temperature at full load after 15 minutes, and compare with your loss and thermal budgets.",
      ],
    },
    quiz: [
      {
        q: "An INA240A2 (gain 50) on a 3.3 V supply, referenced at 1.65 V, must measure ±10 A. What is the largest shunt that keeps the output within about ±1.6 V?",
        options: ["3.2 mΩ", "16 mΩ", "1.6 mΩ", "32 mΩ"],
        answer: 0,
        why: "±1.6 V / 50 = ±32 mV at the shunt. 32 mV / 10 A = 3.2 mΩ.",
      },
      {
        q: "Why is the INA240 suited to an inline motor-phase shunt where a simple low-side amplifier is not?",
        options: [
          "It has higher gain",
          "It rejects the fast common-mode swing between 0 V and the bus, over a -4 V to 80 V range",
          "It needs no supply",
          "It is isolated",
        ],
        answer: 1,
        why: "An inline phase shunt moves with the PWM. The INA240 is designed for that common-mode range and has enhanced PWM rejection.",
      },
      {
        q: "A pack uses passive balancing with 47 Ω resistors. At 4.2 V, what is the bleed current?",
        options: ["About 9 mA", "About 197 mA", "About 89 mA", "About 0.38 A"],
        answer: 2,
        why: "I = 4.2 / 47 ≈ 89 mA.",
      },
      {
        q: "Reverse-polarity protection for a 10 A board: a Schottky with 0.5 V drop, or a MOSFET with 8 mΩ Rds(on)?",
        options: [
          "Schottky: 5 W loss versus 0.8 W, so the Schottky is better",
          "They are equal",
          "MOSFET: 0.8 W versus 5 W for the Schottky",
          "Neither works at 10 A",
        ],
        answer: 2,
        why: "Schottky: 0.5 V × 10 A = 5 W. MOSFET: 10² × 0.008 = 0.8 W.",
      },
      {
        q: "How much energy is stored in a 2200 µF capacitor charged to 24 V?",
        options: ["0.26 J", "26 mJ", "0.63 J", "53 mJ"],
        answer: 2,
        why: "E = (1/2) C V² = 0.5 × 2200 × 10⁻⁶ × 576 ≈ 0.63 J.",
      },
      {
        q: "Why does a multi-cell pack without balancing lose usable capacity over time?",
        options: [
          "All cells age at exactly the same rate",
          "Series cells drift apart, so charging stops when the highest cell is full and discharge stops when the lowest is empty",
          "Balancing increases each cell's capacity",
          "The BMS wastes the energy",
        ],
        answer: 1,
        why: "The pack is limited by its extreme cells. Balancing brings them back together so all of them can use their full range.",
      },
    ],
  },
};

export default lessons;
