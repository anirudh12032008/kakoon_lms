import type { ModuleContent } from "../model/curriculum";

/**
 * Module a1: Analog circuit design.
 * Builds on i1 (circuit analysis, RC filters, phasors) and i2 (ideal op-amp,
 * difference and instrumentation amplifiers, bridges). Does not re-teach them.
 * Datasheet figures quoted are typical (typ) or maximum (max) at 25 °C from the
 * manufacturer product pages: OPA2333, OPA350, TL072, REF3030 (TI), MCP6022
 * (Microchip datasheet DS20001685), ADS1115, ADS1220 (TI).
 */
const lessons: ModuleContent = {
  "a1-real-op-amp-limits-and-error-budgets": {
    id: "a1-real-op-amp-limits-and-error-budgets",
    outcomes: [
      "Read an op-amp datasheet for offset, bias current, drift, gain-bandwidth, slew rate, rail limits and output drive",
      "Turn those figures into an error budget for a gain stage and decide whether a part meets a specification",
      "Choose between a zero-drift, a fast rail-to-rail and a general-purpose op-amp for a given job",
      "Predict closed-loop bandwidth and full-power bandwidth from GBW and slew rate",
    ],
    blocks: [
      { t: "h", text: "Designing to a specification" },
      { t: "p", text: "In i2 you treated the op-amp as ideal: infinite gain, no input current, no offset, an output that can go anywhere. That model gets the topology right, and it is how you start. It cannot tell you whether a circuit will meet a number. A specification says things like \"measure 0 to 20 mV with an error under 0.1% of full scale from 0 to 40 °C, with 1 kHz of bandwidth, from a 3.3 V supply\". Whether that is achievable depends entirely on the ways a real op-amp falls short of ideal, and on which shortfall dominates. This lesson is about finding the dominant error before you build, by writing an **error budget**." },
      { t: "p", text: "Four parts recur throughout this module. They span the range of what you will actually buy:" },
      { t: "table", head: ["Part", "Type", "Vos max", "Ib max", "GBW typ", "Slew typ", "Supply"], rows: [
        ["OPA2333 (TI)", "Zero-drift (chopper), RRIO", "10 µV", "200 pA", "350 kHz", "0.16 V/µs", "1.8 to 5.5 V"],
        ["OPA350 (TI)", "Fast CMOS, RRIO", "500 µV", "10 pA", "38 MHz", "22 V/µs", "2.7 to 5.5 V"],
        ["MCP6022 (Microchip)", "CMOS, RRIO", "500 µV", "1 pA typ", "10 MHz", "7 V/µs", "2.5 to 5.5 V"],
        ["TL072 (TI)", "JFET input, not RRIO", "6 mV", "200 pA", "3 MHz", "13 V/µs", "7 to 30 V"],
      ], caption: "RRIO means rail-to-rail input and output. Figures from the manufacturers' product pages and datasheets at 25 °C." },
      { t: "p", text: "Notice the trade-offs straight away. The OPA2333 is six hundred times better in offset than the TL072 but more than eighty times slower in slew rate. The OPA350 is fast and can drive a capacitive ADC input, but its offset is fifty times worse than the OPA2333. The TL072 cannot even run from 5 V. There is no best op-amp, only the right one for the dominant error in your circuit." },

      { t: "h", text: "DC errors: offset, bias current and drift" },
      { t: "p", text: "**Input offset voltage (Vos)** is the differential input voltage needed to make the output zero. Model it as a small battery in series with the non-inverting input. In a non-inverting stage it is amplified by the **noise gain** 1 + Rf/Rg, the same factor as the signal, so it is simplest to keep every DC error referred to the input (RTI) and compare it with the input signal." },
      { t: "p", text: "**Input bias current (Ib)** flows into each input. It must come from somewhere, so it flows through whatever resistance is connected to that input and creates a voltage error Ib × R. A CMOS input has picoamp bias currents at room temperature, but they roughly double every 10 °C because they are leakage currents of the input protection diodes. A bipolar input can be tens of nanoamps. If the two inputs see equal DC resistances, their bias-current errors largely cancel, leaving only the **offset current** Ios, which is why older designs put a resistor equal to Rf ∥ Rg in series with the non-inverting input." },
      { t: "p", text: "**Drift** is the change of Vos with temperature, in µV/°C. A specification across a temperature range must include it. Zero-drift (chopper or auto-zero) amplifiers such as the OPA2333 measure and cancel their own offset thousands of times a second, which is why both their offset and their drift (0.05 µV/°C max) are tiny." },
      { t: "p", text: "**Finite open-loop gain** gives a gain error of about G / Aol (from the feedback equation in i2). With Aol around 130 dB (about 3 × 10⁶) and G = 101, that is 30 ppm, usually negligible next to resistor tolerance." },

      { t: "h", text: "Worked example: an error budget" },
      { t: "p", text: "Specification: amplify a 0 to 20 mV sensor signal (source resistance 10 kΩ) to 0 to 2.02 V for a 3.3 V ADC, over 0 to 40 °C, total error under 0.1% of full scale (2.02 mV at the output, 20 µV referred to the input). Topology: non-inverting, Rf = 100 kΩ, Rg = 1 kΩ, so G = 1 + 100/1 = 101." },
      { t: "table", head: ["Error source", "Calculation (RTI)", "OPA2333", "TL072"], rows: [
        ["Offset Vos", "Vos max", "10 µV", "6000 µV"],
        ["Bias current through Rs", "Ib × 10 kΩ = 200 pA × 10 kΩ", "2 µV", "2 µV"],
        ["Drift over 40 °C", "drift × 40 °C", "0.05 × 40 = 2 µV", "not usable"],
        ["Worst-case DC sum", "add linearly", "14 µV", "over 6 mV"],
        ["At the output", "× 101", "1.41 mV", "over 606 mV"],
      ], caption: "Error budget for G = 101. The TL072 column also fails because it needs at least 7 V of supply." },
      { t: "p", text: "Check: 14 µV × 101 = 1.414 mV, which is 1.414 / 2020 = 0.07% of full scale. The OPA2333 passes the offset budget with some margin. The TL072 offset alone is 30% of full scale. Now the part people forget: resistor tolerance. With 0.1% resistors, the gain 1 + Rf/Rg can be off by up to about ±0.2% (each resistor at its opposite limit), and that alone breaks a 0.1% budget at full scale. So the budget tells you that the amplifier is no longer the problem: you need 0.05% resistors, a ratio-matched resistor network, or a two-point calibration (from i8) that removes gain and offset together. That is the real value of an error budget: it tells you where to spend money." },
      { t: "note", kind: "tip", text: "Add worst-case errors linearly when you need a guarantee. Add independent random errors as a root-sum-square (√ of the sum of squares) when you want a realistic typical figure. State which you did." },

      { t: "h", text: "AC limits: gain-bandwidth and slew rate" },
      { t: "p", text: "A voltage-feedback op-amp's open-loop gain falls at 20 dB per decade above a few hertz, so the product of closed-loop gain and bandwidth is roughly constant: the **gain-bandwidth product** (GBW). Closed-loop bandwidth is GBW divided by the noise gain." },
      { t: "formula", text: String.raw`f_-3dB ≈ GBW / G_noise
OPA2333, G = 101:  350 kHz / 101 ≈ 3.5 kHz
OPA350,  G = 101:   38 MHz / 101 ≈ 376 kHz`, caption: "Small-signal bandwidth of a non-inverting stage." },
      { t: "p", text: "At f_-3dB the gain is already 3 dB low, which is a 29% error. If the specification is 0.1% gain accuracy at 1 kHz, you need the bandwidth to be far higher than 1 kHz. For a single-pole response the gain error at frequency f is about (1/2)(f / f_-3dB)², so 0.1% needs f_-3dB ≥ f / √0.002 ≈ 22 × f, here 22 kHz. The OPA2333 at G = 101 (3.5 kHz) cannot meet 0.1% at 1 kHz; it would need to be a DC and slow-signal amplifier, or the gain split over two stages." },
      { t: "p", text: "**Slew rate** (SR) is the fastest the output can change, set by the current available to charge the internal compensation capacitor. It is a large-signal limit. A sine of peak amplitude Vp and frequency f has a maximum rate of change 2πf Vp, so the highest frequency at which the output can produce a full sine undistorted is the **full-power bandwidth**:" },
      { t: "formula", text: String.raw`f_FPBW = SR / (2π × Vp)
OPA2333, Vp = 1 V:    0.16 V/µs / (2π × 1 V)   ≈ 25 kHz
OPA350,  Vp = 2.5 V:  22 V/µs / (2π × 2.5 V)   ≈ 1.4 MHz`, caption: "Above this frequency a large sine turns into a triangle." },

      { t: "h", text: "Rail limits and output drive" },
      { t: "p", text: "From i2 you know that a single-supply op-amp has an input common-mode range and an output swing. Look at the limits precisely. \"Rail-to-rail output\" means the output gets within tens of millivolts of each rail at light load, and the datasheet graph of output voltage versus output current shows how that headroom grows as you draw current. \"Rail-to-rail input\" often uses two input pairs with a crossover region, about 1 V below the positive rail, where offset steps by tens or hundreds of microvolts; in a precision circuit, keep the common-mode voltage away from that region or pick a part with a single input pair and a charge pump. Finally, **output drive**: the OPA350 can source about 80 mA into a short and the MCP6022 about 30 mA, but long before those figures the output stops swinging to the rail and the device heats. Driving a 1 kΩ load from a 5 V rail with an op-amp rated for 10 kΩ loads is a design error, not an approximation." },
      { t: "note", kind: "warn", text: "Zero in a single-supply system is not reachable. If your sensor produces 0 mV at the bottom of its range, a single-supply stage outputs a few millivolts, not zero. Either bias the signal up from ground (a REF or a mid-supply offset, as in i2) or accept and calibrate the bottom-of-range error." },

      { t: "deep", title: "Why the gain error is about (f / f_-3dB)² / 2", blocks: [
        { t: "p", text: "A single-pole closed-loop response is G(f) = G0 / (1 + j f/fc). Its magnitude is G0 / √(1 + x²) with x = f/fc." },
        { t: "formula", text: String.raw`|G| / G0 = (1 + x²)^(-1/2)
          ≈ 1 - x²/2         for x << 1   (binomial expansion)
error     ≈ x²/2
0.1 %  →  x² = 0.002  →  x = 0.0447  →  fc = f / 0.0447 ≈ 22.4 f`, caption: "So a 0.1% flat band needs a corner over twenty times higher." },
        { t: "p", text: "Phase is far worse: the phase lag is arctan(x) ≈ x radians, so at x = 0.0447 it is already 2.6°. If two channels must stay in phase (power measurement from voltage and current, for example), match their bandwidths rather than trusting either to be ideal." },
      ] },
      { t: "deep", title: "How chopper amplifiers achieve microvolt offset, and what they cost", blocks: [
        { t: "p", text: "A chopper amplifier swaps its input connections with a switch at a frequency of a few hundred kilohertz, so the signal is modulated to the chopping frequency while the amplifier's own offset and 1/f noise stay at DC. After amplification, a second switch demodulates: the signal returns to baseband and the offset is moved up to the chopping frequency, where a filter removes it. The result is an offset of microvolts and no 1/f noise corner, which the noise lesson shows is worth a lot below 10 Hz." },
        { t: "p", text: "The costs: residual ripple and glitches near the chopping frequency, input bias current that is really switching charge injection (it looks like a few hundred picoamps and can be larger at high source impedance), and recovery time after overload. That is why the OPA2333 is excellent for a bridge or thermocouple at DC and a poor choice for an audio or 100 kHz signal path." },
        { t: "p", text: "Professionals read three datasheet graphs before trusting the table: Vos versus common-mode voltage (to find the input crossover), output swing versus load current, and Ib versus temperature. The table gives you one point; the graphs tell you where your circuit actually operates." },
      ] },
    ],
    mistakes: [
      "**Budgeting the amplifier and forgetting the resistors.** Gain-setting resistor tolerance is usually the largest error in a precision stage.",
      "**Treating f_-3dB as the usable bandwidth.** At the corner the gain is 29% low; a precise band needs the corner many times higher.",
      "**Confusing GBW with slew rate.** GBW limits small signals; slew rate limits large ones. Check both at your amplitude and frequency.",
      "**Ignoring bias current with high source resistance.** 200 pA is nothing through 10 kΩ but 200 µV through 1 MΩ, and it grows with temperature in CMOS parts.",
      "**Assuming a rail-to-rail output reaches 0 V.** It approaches the rail and stops, and the gap grows with load current.",
    ],
    practice: {
      kind: "bench",
      task: "Measure offset, bandwidth and slew rate of two op-amps and compare with your error budget.",
      steps: [
        "Build a non-inverting stage with G = 101 (100 kΩ and 1 kΩ) on 3.3 V, with the input grounded through 10 kΩ. Use an MCP6022 first, then an OPA2333 if you have one.",
        "Measure the output with a multimeter and divide by 101 to get the input-referred offset. Compare it with the datasheet maximum.",
        "Bias the input at about 10 mV with a divider from the rail, apply a 2 mVpp sine from a function generator through a capacitor, and sweep frequency to find where the output falls to 0.707 of its low-frequency value. Compare with GBW / 101.",
        "Rewire as a unity-gain buffer with a 0.5 V to 2.5 V square wave input. Measure the output edge slope on an oscilloscope and compare with the datasheet slew rate.",
        "Write your measured numbers into the error budget table and state whether each part meets the 0.1% specification in the lesson.",
      ],
    },
    quiz: [
      {
        q: "A non-inverting stage with G = 51 uses an op-amp with Vos = 200 µV max. What output offset can you expect at worst?",
        options: ["200 µV", "10.2 mV", "3.9 µV", "51 mV"],
        answer: 1,
        why: "Offset is amplified by the noise gain: 200 µV × 51 = 10.2 mV.",
      },
      {
        q: "An op-amp has GBW = 10 MHz. Roughly what is the -3 dB bandwidth of a non-inverting stage with G = 20?",
        options: ["200 MHz", "10 MHz", "2 MHz", "500 kHz"],
        answer: 3,
        why: "f_-3dB ≈ GBW / G = 10 MHz / 20 = 500 kHz.",
      },
      {
        q: "An op-amp with a slew rate of 1 V/µs must produce a 2 V peak sine. What is the highest frequency it can do without slew distortion?",
        options: ["About 80 kHz", "About 500 kHz", "About 1 MHz", "About 8 kHz"],
        answer: 0,
        why: "f = SR / (2π Vp) = 1,000,000 V/s / (2π × 2 V) ≈ 79.6 kHz.",
      },
      {
        q: "In the lesson's error budget, the OPA2333 contributes 14 µV RTI but 0.1% resistors still break the 0.1% specification. What is the lesson?",
        options: [
          "Use a faster op-amp",
          "The dominant error is gain-resistor tolerance, so fix it with tighter or matched resistors or a calibration",
          "Use the TL072 instead",
          "Error budgets are not useful for gain errors",
        ],
        answer: 1,
        why: "Once the amplifier's DC errors are small, resistor tolerance (about ±0.2% gain error) dominates. Spend effort on the dominant term.",
      },
      {
        q: "A CMOS op-amp's bias current is 5 pA at 25 °C. Roughly what would you expect at 85 °C?",
        options: ["The same 5 pA", "About 10 pA", "About 300 pA", "Zero"],
        answer: 2,
        why: "CMOS bias current is leakage that roughly doubles every 10 °C. 60 °C is six doublings: 5 × 2⁶ = 320 pA.",
      },
    ],
  },

  "a1-stability-and-compensation": {
    id: "a1-stability-and-compensation",
    outcomes: [
      "Explain loop gain, crossover frequency and phase margin for an op-amp circuit",
      "Relate phase margin to step-response overshoot",
      "Predict when a capacitive load or input capacitance will make an op-amp ring or oscillate",
      "Fix a marginal circuit with an isolation resistor, a feedback capacitor or a slower part",
    ],
    blocks: [
      { t: "h", text: "Why a correct circuit can oscillate" },
      { t: "p", text: "Every op-amp circuit you have built is a feedback system. The op-amp compares a fraction of its output with the input and drives the difference towards zero. If the feedback arrives late enough, by half a cycle, the correction adds to the error instead of cancelling it, and the circuit oscillates. The classic symptoms on a bench: an op-amp buffer driving a long cable rings at a few megahertz, an ADC driver gives noisy readings that change when you touch the board, a regulator's error amplifier hums. None of this appears in the ideal model. Stability analysis predicts it and tells you what to change." },

      { t: "h", text: "Loop gain and the two numbers that matter" },
      { t: "p", text: "Write the op-amp's open-loop gain as A(f) and the feedback fraction as β (for a non-inverting stage β = Rg / (Rf + Rg), so 1/β is the noise gain). The quantity that decides stability is the **loop gain** T = A·β: the gain around the loop if you broke it at the input and injected a signal." },
      { t: "formula", text: String.raw`Closed-loop gain = A / (1 + Aβ) = (1/β) × T / (1 + T)
T >> 1  →  gain ≈ 1/β       (the ideal result)
T = -1  →  denominator 0    (oscillation)`, caption: "The feedback equation from i2, with attention on where 1 + T could become zero." },
      { t: "p", text: "T = -1 means magnitude 1 and phase -180°. So the test is: at the **crossover frequency** fc, where |T| = 1, how far is the phase from -180°? That distance is the **phase margin** (PM)." },
      { t: "list", items: [
        "On a Bode plot, draw |A| in dB and the line 1/β in dB (the noise gain). They intersect at fc, because |Aβ| = 1 there.",
        "PM = 180° + phase of T at fc. A single-pole op-amp contributes -90°, so PM is 90°: very stable.",
        "Each extra pole below fc adds up to -90° more. A second pole exactly at fc adds -45°, leaving PM = 45°.",
        "The **rate of closure** rule: if |A| and 1/β meet with a difference in slope of 20 dB/decade, the circuit is stable; if 40 dB/decade, it is at best marginal.",
      ] },

      { t: "h", text: "What phase margin looks like" },
      { t: "p", text: "Phase margin maps closely to the overshoot of a step response, because a loop with two dominant poles behaves like a second-order system with damping ratio ζ:" },
      { t: "table", head: ["Phase margin", "Damping ratio ζ", "Step overshoot"], rows: [
        ["33°", "0.3", "37%"],
        ["45°", "0.42", "23%"],
        ["52°", "0.5", "16%"],
        ["59°", "0.6", "9.5%"],
        ["65°", "0.7", "4.6%"],
        ["70°", "0.8", "1.5%"],
      ], caption: "Computed from PM = arctan(2ζ / √(√(1 + 4ζ⁴) - 2ζ²)) and overshoot = exp(-πζ / √(1 - ζ²))." },
      { t: "p", text: "Design for 60° or more. 45° is the usual minimum, and you can see it on an oscilloscope as about 23% overshoot on a small step. This is also your bench test: apply a small square wave (small, so slew rate does not hide the result) and read the overshoot. You do not need a network analyser to check stability." },

      { t: "h", text: "Capacitive loads: the most common instability" },
      { t: "p", text: "Inside the op-amp the output stage has an open-loop output resistance Ro, typically tens of ohms. Put a capacitor CL on the output (a cable, a MOSFET gate, an ADC's input filter capacitor) and Ro with CL forms a low-pass pole inside the loop, at fp = 1 / (2π Ro CL). That pole adds phase lag right where it hurts." },
      { t: "p", text: "Worked example: an OPA350 as a unity-gain buffer (β = 1, so fc ≈ GBW ≈ 38 MHz) driving CL = 1 nF. Assume Ro = 40 Ω (read the real value from the open-loop output impedance graph; it varies with frequency and load). The extra pole is at 1 / (2π × 40 × 1 nF) ≈ 4.0 MHz, nearly a decade below crossover. At 38 MHz this pole contributes almost -84°, leaving a phase margin of only a few degrees. The buffer will ring hard or oscillate." },
      { t: "p", text: "Fixes, in the order you should try them:" },
      { t: "list", ordered: true, items: [
        "**Isolation resistor Riso** between the op-amp output and the capacitor (10 to 100 Ω), with the feedback taken from the op-amp output. The load capacitor now sees Riso, which adds a zero that cancels much of the pole's phase. The price: the voltage on CL lags, and any DC load current causes an Ib × Riso-like drop. For an ADC driver this is exactly the R of the RC filter you will meet next lesson.",
        "**Dual feedback**: take DC feedback from the far side of Riso (for accuracy) and AC feedback from the op-amp output through a small capacitor (for stability).",
        "**More noise gain**: run the stage at a gain of 2 or more. Crossover falls to GBW / G, further from the load pole. Many fast op-amps are specified as stable only at G ≥ 2 or more (\"decompensated\").",
        "**A part rated for capacitive loads**: some datasheets give a graph of overshoot versus CL. Use it.",
      ] },

      { t: "h", text: "Input capacitance and the feedback capacitor" },
      { t: "p", text: "The same problem appears at the input. The inverting input has capacitance Cin (the op-amp's own few picofarads plus wiring, or a photodiode's hundreds of picofarads). With large Rf, Rf and Cin form a pole in β, so 1/β rises at high frequency and meets |A| at 40 dB/decade closure. The fix is a small capacitor Cf across Rf, which gives β a zero. A good starting value makes Rf Cf equal to Rg Cin (the neutral compensation case for a non-inverting stage), then trim on the bench by watching the step response. In a transimpedance amplifier for a photodiode, Cf is not optional." },
      { t: "note", kind: "tip", text: "Rule of thumb: in a stage with Rf of 100 kΩ or more, always leave a footprint for a capacitor across Rf on the PCB. A few picofarads often cures a ringing stage, and an empty footprint costs nothing." },

      { t: "h", text: "Compensation in one paragraph" },
      { t: "p", text: "Internally compensated op-amps contain a capacitor (the Miller capacitor) that deliberately creates a dominant pole at a few hertz, so that the gain falls below 1 before the second internal pole adds phase. That is why GBW is roughly constant and why a unity-gain stable op-amp is stable as a plain follower. External compensation is what you add: Riso, Cf and noise gain shaping. All three are about keeping the 1/β line and the |A| curve meeting at 20 dB/decade with at least 45° to 60° to spare." },

      { t: "deep", title: "Deriving the phase margin of a two-pole loop", blocks: [
        { t: "p", text: "Model the loop gain with a dominant pole far below crossover (contributing -90°) and a second pole at f2." },
        { t: "formula", text: String.raw`T(f) = T0 / ((1 + j f/f1)(1 + j f/f2)),   f1 << fc
phase(T) at fc ≈ -90° - arctan(fc / f2)
PM = 180° + phase = 90° - arctan(fc / f2)

fc = f2       →  PM = 45°
fc = f2 / 2   →  PM = 90° - 26.6° = 63.4°
fc = f2 / 3   →  PM = 90° - 18.4° = 71.6°`, caption: "Keep crossover at least half the second pole frequency for about 60°." },
        { t: "p", text: "For the capacitive load example, f2 = 4 MHz and fc = 38 MHz: PM = 90° - arctan(9.5) = 90° - 84° = 6°. To get 60° with the same load, you would need fc ≤ about 2.3 MHz, meaning a noise gain of about 16, or an isolation resistor." },
        { t: "p", text: "The table relating PM to overshoot comes from the closed-loop response of this same two-pole loop, which is a standard second-order system. Its damping ratio depends only on the ratio of fc to f2, so phase margin and ζ are two descriptions of one thing." },
      ] },
      { t: "deep", title: "Sizing an isolation resistor", blocks: [
        { t: "p", text: "With Riso in series with CL and feedback taken from the op-amp side, the load network Ro + (Riso in series with CL) has a pole at 1/(2π (Ro + Riso) CL) and a zero at 1/(2π Riso CL). The zero cancels the pole's phase above it. Placing the zero at or below about fc/10 recovers most of the margin." },
        { t: "formula", text: String.raw`f_zero = 1 / (2π × Riso × CL) ≤ fc / 10
OPA350 buffer, CL = 1 nF, fc = 38 MHz:
Riso ≥ 10 / (2π × 38 MHz × 1 nF) ≈ 42 Ω    →  use 47 Ω and confirm on the bench`, caption: "A starting point, not a guarantee: the real Ro varies with frequency." },
        { t: "p", text: "Manufacturers often publish a graph of recommended Riso versus CL for each part. Prefer that graph over the estimate, then verify with a small-signal step on the real board." },
      ] },
    ],
    mistakes: [
      "**Testing stability with a large step.** A large step is slew-limited and hides ringing. Use a step of a few tens of millivolts.",
      "**Putting Riso inside the feedback loop.** If feedback is taken from the capacitor side without a compensating capacitor, Riso does nothing for stability.",
      "**Using a decompensated op-amp as a follower.** A part stable only at G ≥ 5 will oscillate at G = 1.",
      "**Large feedback resistors with no Cf.** 1 MΩ with 5 pF of input capacitance puts a pole at 32 kHz inside the loop.",
      "**Probing with a long ground lead.** The probe's own ringing is mistaken for the circuit's. Use the short ground spring.",
    ],
    practice: {
      kind: "bench",
      task: "Make an op-amp buffer ring with a capacitive load, then cure it and measure the phase margin from the overshoot.",
      steps: [
        "Build an MCP6022 unity-gain buffer on 5 V, input biased at 2.5 V with a 50 mVpp square wave at 10 kHz.",
        "Load the output with 10 nF, then 100 nF. Capture the step response each time and measure the overshoot.",
        "Use the table in the lesson to convert each overshoot into an approximate phase margin.",
        "Add a 47 Ω isolation resistor between the output and the capacitor, keeping feedback from the op-amp pin. Measure again, at the capacitor and at the op-amp pin.",
        "Try a gain of 2 (two 10 kΩ resistors) without Riso and compare. Record which fix gave the cleanest response.",
      ],
    },
    quiz: [
      {
        q: "A loop has a dominant pole and a second pole exactly at the crossover frequency. What is the phase margin?",
        options: ["90°", "45°", "0°", "180°"],
        answer: 1,
        why: "The dominant pole gives -90° and the second pole -45° at its own frequency, so the phase is -135°, leaving 45° to -180°.",
      },
      {
        q: "A small-signal step on an op-amp stage shows about 23% overshoot. What is the approximate phase margin?",
        options: ["70°", "60°", "30°", "45°"],
        answer: 3,
        why: "From the table, 45° phase margin corresponds to ζ ≈ 0.42 and about 23% overshoot.",
      },
      {
        q: "Why does a capacitor on an op-amp output reduce phase margin?",
        options: [
          "It forms a pole with the op-amp's open-loop output resistance inside the feedback loop",
          "It draws too much DC current",
          "It raises the slew rate",
          "It changes the feedback resistor ratio",
        ],
        answer: 0,
        why: "Ro and CL make a pole at 1/(2π Ro CL). Below crossover it adds phase lag that eats the margin.",
      },
      {
        q: "An op-amp with GBW = 20 MHz is used at a noise gain of 10. Where is crossover, roughly?",
        options: ["20 MHz", "200 MHz", "2 MHz", "200 kHz"],
        answer: 2,
        why: "Crossover is where |A| meets 1/β: about GBW / noise gain = 2 MHz.",
      },
      {
        q: "Which fix for a ringing capacitive load keeps the DC accuracy at the load best?",
        options: [
          "A bigger load capacitor",
          "Dual feedback: DC feedback from the load side of Riso, AC feedback from the op-amp output",
          "Removing the feedback resistor",
          "A slower supply",
        ],
        answer: 1,
        why: "Riso alone leaves a DC drop under load. Dual feedback corrects the DC at the load while the AC path keeps the loop stable.",
      },
    ],
  },

  "a1-active-filters-adc-drivers-and-references": {
    id: "a1-active-filters-adc-drivers-and-references",
    outcomes: [
      "Choose a filter response (Butterworth, Bessel, Chebyshev) from the job it must do",
      "Calculate components for a second-order Sallen-Key or multiple-feedback low-pass filter and check the result",
      "Design an ADC driver with the right RC filter for a switched-capacitor input",
      "Select and budget a voltage reference such as the REF3030",
    ],
    blocks: [
      { t: "h", text: "Why a first-order RC is not enough" },
      { t: "p", text: "In i1 you designed first-order RC filters, which fall at 20 dB per decade. In i8 you learned that anything above half the sampling rate aliases into your data. Suppose you sample at 10 kHz and want 1 kHz of clean signal. A first-order filter at 1 kHz only reaches -14 dB at 5 kHz: interference there is attenuated by a factor of five, not a thousand. A second-order filter falls at 40 dB per decade, a fourth-order at 80. Active filters give you those slopes with op-amps instead of inductors, and they let you choose the shape of the response near the corner." },

      { t: "h", text: "The second-order section and Q" },
      { t: "p", text: "Every active filter is built from second-order sections (plus one first-order section for odd orders). Each section is described by two numbers: the natural frequency f0 and the quality factor Q." },
      { t: "formula", text: String.raw`H(s) = H0 × ω0² / (s² + (ω0/Q) s + ω0²),   ω0 = 2π f0`, caption: "The standard second-order low-pass. Q sets how peaky the corner is." },
      { t: "p", text: "Low Q gives a soft, rounded corner; high Q gives a sharp corner with a peak. The named filter families are just recipes for Q (and for f0 in each section) that optimise one property:" },
      { t: "table", head: ["Response", "2nd-order Q", "Optimises", "Cost", "Use for"], rows: [
        ["Bessel", "0.577", "Constant delay, no overshoot", "Slow roll-off", "Pulses, steps, ECG shapes"],
        ["Butterworth", "0.707", "Maximally flat passband", "Some overshoot (about 4%)", "General anti-aliasing"],
        ["Chebyshev 1 dB", "0.956", "Steepest roll-off near corner", "1 dB ripple, large overshoot", "Removing a close interferer"],
      ], caption: "For second order. Higher orders use several sections with different Q values from published tables." },
      { t: "p", text: "Note one trap: for Butterworth, f0 is also the -3 dB frequency. For Bessel and Chebyshev it is not; design tables give a frequency scaling factor per section. Always check the -3 dB point of the result, as below." },

      { t: "h", text: "Sallen-Key low-pass: design procedure" },
      { t: "diagram", text: String.raw`
            C1 (to output)
         ┌─────||──────────────┐
 Vin ─[R1]─●─[R2]─●──────(+)    │
           A      B         op-amp ── Vout
                  │   ┌──(-)    │
                [C2]  └─────────┘   (unity-gain follower)
                  │
                 GND`, caption: "Unity-gain Sallen-Key low-pass. C1 runs from node A to the output; C2 from node B to ground." },
      { t: "formula", text: String.raw`ω0 = 1 / √(R1 R2 C1 C2)
Q  = √(R1 R2 C1 C2) / (C2 (R1 + R2))
With R1 = R2 = R:   Q = (1/2) √(C1 / C2)`, caption: "Unity-gain Sallen-Key. The op-amp is only a buffer." },
      { t: "p", text: "Design a 1 kHz Butterworth (Q = 0.707) anti-alias filter for an ESP32 or ADS1115 front-end." },
      { t: "list", ordered: true, items: [
        "Equal resistors and Q = 0.707 means √(C1/C2) = 1.414, so **C1 = 2 C2**.",
        "Choose capacitors first (there are fewer standard values): C2 = 10 nF, C1 = 20 nF (two 10 nF in parallel, C0G/NP0 type).",
        "Solve for R: R = 1 / (2π f0 √(C1 C2)) = 1 / (2π × 1000 × √(2 × 10⁻¹⁶)) = 1 / (2π × 1000 × 1.414 × 10⁻⁸) ≈ 11.25 kΩ.",
        "Pick the nearest E96 value: **R1 = R2 = 11.3 kΩ**.",
      ] },
      { t: "p", text: "Check: f0 = 1 / (2π × 11.3 kΩ × 14.14 nF) ≈ 996 Hz, 0.4% low, well inside the capacitor tolerance. Q is still exactly 0.707 because it depends only on the capacitor ratio. Solving the circuit's node equations numerically at 10 kHz gives -40.1 dB, exactly the 40 dB per decade promised. With 5% capacitors, expect f0 within about ±5%; buy 1% C0G capacitors if the corner matters." },
      { t: "p", text: "The op-amp needs GBW well above f0 × (something like 100) so its own roll-off does not shift the response, and it must handle the signal's range. An MCP6022 (10 MHz, RRIO) is a comfortable choice on 3.3 V. A known weakness of the Sallen-Key low-pass: at very high frequency the signal leaks through C1 into the op-amp output, whose impedance rises, so attenuation stops improving at around -50 to -60 dB. If you need deep rejection far above the corner, use multiple feedback." },

      { t: "h", text: "Multiple-feedback (MFB) low-pass" },
      { t: "diagram", text: String.raw`
                         C2
                  ┌──────||──────┐
                  │     R2       │
           ┌──────┼───[    ]─────┤
 Vin ─[R1]─● A    │              │
           │      └─[R3]─●─(-)   │
         [C1]            │  op-amp ── Vout
           │       GND ─(+)      │
          GND                     (inverting)`, caption: "MFB low-pass. R2 runs from node A to the output, R3 from A to the inverting input, C2 from the inverting input to the output." },
      { t: "formula", text: String.raw`H0 = -R2 / R1
ω0² = 1 / (R2 R3 C1 C2)
ω0 / Q = (1/C1) (1/R1 + 1/R2 + 1/R3)`, caption: "Inverting, with gain set by R2/R1." },
      { t: "p", text: "For gain -1 at 1 kHz Butterworth: choose R1 = R2 = 10 kΩ and C2 = 4.7 nF. Solving the two equations gives R3 ≈ 18.9 kΩ and C1 ≈ 28.4 nF. With standard values R3 = 19.1 kΩ and C1 = 27 nF, the computed f0 is 1022 Hz and Q is 0.687, and a numerical solution of the node equations puts the -3 dB point at 993 Hz. That is an acceptable result: a 3% shift in Q changes the response by a fraction of a decibel. MFB filters are less sensitive to op-amp output impedance and give gain and filtering in one stage, at the price of inverting the signal, which on a single supply means biasing the non-inverting input at a mid-supply reference." },

      { t: "h", text: "ADC drivers and the charge kickback problem" },
      { t: "p", text: "A SAR ADC (the ESP32's and the ATmega328P's ADCs are of this kind) and the switched-capacitor input of a delta-sigma ADC such as the ADS1115 do not present a resistance. At the start of each sample they connect a small capacitor Csh (a few picofarads) to the pin. The charge left on Csh from the last sample is dumped onto the pin, a **kickback** spike, and the source must recharge Csh to within half an LSB before the sample ends. Two components solve this together:" },
      { t: "list", items: [
        "A **filter capacitor Cf** right at the ADC pin, at least about 20 times Csh (often 1 nF to 10 nF). It acts as a charge reservoir, so the kickback moves the pin by only Csh / (Cf + Csh) of the difference.",
        "A **series resistor R** between the driver op-amp and Cf. It isolates the op-amp from the capacitive load (last lesson's Riso) and, with Cf, forms an RC that must settle within the acquisition time.",
      ] },
      { t: "p", text: "Worked example: a 12-bit SAR ADC with 1 µs acquisition time. Settling an error to half an LSB at 12 bits needs the error to fall by 2¹³ = 8192, which takes ln(8192) ≈ 9.0 time constants. So τ = R Cf ≤ 1 µs / 9.0 ≈ 111 ns. With Cf = 1 nF, R ≤ 111 Ω; use 100 Ω. The op-amp must then drive 1 nF through 100 Ω, settle quickly, and swing close to the rails: this is the OPA350's job, not the OPA2333's (0.16 V/µs would need 6 µs just to slew 1 V)." },
      { t: "p", text: "For a slow delta-sigma converter such as the ADS1220 (24-bit, up to 2 kSPS), the requirements are gentler, but its datasheet still recommends differential and common-mode RC filters at the inputs, and the anti-aliasing duty is partly done by its digital filter. Read the input-impedance section: it depends on gain and data rate." },
      { t: "note", kind: "warn", text: "Large source resistances directly into an ADC pin give readings that depend on the previous channel and on sample rate. If you use a high-value divider to save battery, add the Cf reservoir, and either lower the sample rate or buffer the node." },

      { t: "h", text: "Voltage references" },
      { t: "p", text: "An ADC measures a ratio: code = 2ᴺ × Vin / Vref. Every error in Vref appears directly as a gain error. A microcontroller's internal reference or supply rail can be several percent off and noisy. A dedicated reference such as the **REF3030** (3.0 V) has ±0.2% initial accuracy, at most 75 ppm/°C drift (some grades and temperature ranges are specified tighter in the datasheet table; design with the maximum for your range), 42 µA quiescent current, and low-frequency noise of a few tens of µVpp from 0.1 to 10 Hz (TI headlines 14 µVpp for the family; noise scales with output voltage, so check the 3.0 V row)." },
      { t: "formula", text: String.raw`Initial error:      3.0 V × 0.2 %              = ±6 mV
Drift over 40 °C:   3.0 V × 75 ppm/°C × 40 °C  = ±9 mV
Worst case:                                      ±15 mV  (0.5 % of full scale)`, caption: "REF3030 budget. Calibration removes the initial error; only drift remains." },
      { t: "p", text: "Two points about references. First, a reference is a voltage source with limited output current (25 mA max for the REF30 family) and its own stability requirements; drive an ADC's REF pin through the recommended capacitor, and buffer it if several devices share it. Second, the best reference is often no reference: in a **ratiometric** measurement such as a bridge excited by the same voltage that the ADC uses as Vref, reference drift cancels entirely. The next lesson uses that with the ADS1220." },

      { t: "deep", title: "Solving Sallen-Key for unequal resistors (when C1 = 2 C2 is not available)", blocks: [
        { t: "p", text: "Suppose you only have 22 nF and 10 nF. With C1 = 22 nF and C2 = 10 nF, Q with equal resistors would be 0.5 × √2.2 = 0.742, too peaky. Solve for unequal resistors instead. From the two equations, R1 R2 = 1 / (ω0² C1 C2) and R1 + R2 = 1 / (ω0 Q C2): a product and a sum, so R1 and R2 are the roots of a quadratic." },
        { t: "formula", text: String.raw`P = R1 R2 = 1 / ((2π·1000)² × 22n × 10n) = 1.151 × 10⁸ Ω²
S = R1 + R2 = 1 / (2π·1000 × 0.7071 × 10n)  = 22 508 Ω
R1, R2 = (S ± √(S² - 4P)) / 2 = 14.65 kΩ and 7.86 kΩ
E96: 14.7 kΩ and 7.87 kΩ  →  computed f_-3dB = 997 Hz`, caption: "A real solution exists only if C1/C2 ≥ 4Q², here 2.2 ≥ 2.0." },
        { t: "p", text: "That condition is worth remembering: in a unity-gain Sallen-Key you cannot reach a given Q unless the capacitor ratio is at least 4Q². For a Chebyshev section with Q = 0.956, C1/C2 must be at least 3.66." },
      ] },
      { t: "deep", title: "Sensitivity: why high-Q sections need care", blocks: [
        { t: "p", text: "The sensitivity of Q to a component x is S = (dQ/Q)/(dx/x). For the unity-gain Sallen-Key with equal resistors, Q depends on √(C1/C2), so a 5% error in C1 gives about 2.5% in Q. For a Sallen-Key with gain K > 1 (the equal-component form), Q = 1/(3 - K), and the sensitivity to K becomes large as K approaches 3: at K = 2.9, a 1% gain change moves Q by about 29%. That is why the equal-component, gain-of-K form is avoided for high Q, and why high-order filters order their sections with the lowest Q first, to limit the size of the peak an early stage can clip." },
        { t: "p", text: "Professionals design with a filter tool (TI's Filter Design Tool, Analog Devices' Filter Wizard), then run a Monte Carlo SPICE simulation with the real tolerances to see the spread of responses. The last lesson shows how." },
      ] },
    ],
    mistakes: [
      "**Using X7R or Y5V ceramics in a filter.** Their value changes with voltage and temperature; use C0G/NP0 or film.",
      "**Assuming f0 is the -3 dB point for Bessel or Chebyshev.** Only Butterworth has that property; check the result.",
      "**Driving a SAR input straight from a slow op-amp.** Kickback needs a reservoir capacitor and a driver that settles in the acquisition time.",
      "**Forgetting the reference in the error budget.** A 1% reference is a 1% gain error on every reading.",
      "**Putting a Sallen-Key's C1 to ground instead of to the output.** The circuit still filters, but Q collapses to below 0.5.",
    ],
    practice: {
      kind: "bench",
      task: "Build and characterise the 1 kHz Butterworth Sallen-Key filter and an ADC driver.",
      steps: [
        "Build the unity-gain Sallen-Key with 11.3 kΩ, 11.3 kΩ, 20 nF (two 10 nF C0G) and 10 nF, using an MCP6022 on 3.3 V with the input biased at 1.65 V.",
        "With a function generator and oscilloscope, measure gain at 100 Hz, 500 Hz, 1 kHz, 2 kHz, 5 kHz and 10 kHz. Expect about -3 dB at 1 kHz and -40 dB at 10 kHz.",
        "Apply a small square wave and measure overshoot; compare with about 4% for Butterworth.",
        "Feed the filter output to an ESP32 ADC pin (GPIO 34 on the DevKit) through 100 Ω with 1 nF at the pin. Log 1000 readings with and without the RC and compare the standard deviation.",
        "Swap the 20 nF for 10 nF (Q = 0.5) and repeat the frequency sweep. Describe how the corner changed.",
      ],
    },
    quiz: [
      {
        q: "You need an anti-alias filter for step-like signals that must not overshoot. Which response?",
        options: ["Chebyshev", "Butterworth", "Bessel", "Any; they all have the same step response"],
        answer: 2,
        why: "Bessel has almost constant group delay and no overshoot, at the cost of a slower roll-off.",
      },
      {
        q: "In a unity-gain Sallen-Key low-pass with equal resistors, C1 = 40 nF and C2 = 10 nF. What is Q?",
        options: ["1.0", "0.707", "0.5", "2.0"],
        answer: 0,
        why: "Q = 0.5 × √(C1/C2) = 0.5 × √4 = 1.0.",
      },
      {
        q: "A Butterworth Sallen-Key uses R1 = R2 = 10 kΩ, C1 = 20 nF, C2 = 10 nF. Roughly what is f0?",
        options: ["1.59 kHz", "1.13 kHz", "796 Hz", "11.3 kHz"],
        answer: 1,
        why: "f0 = 1/(2π × 10 kΩ × √(2 × 10⁻¹⁶)) = 1/(2π × 10⁴ × 1.414 × 10⁻⁸) ≈ 1.13 kHz.",
      },
      {
        q: "A 12-bit SAR ADC has 2 µs acquisition time and a 2.2 nF capacitor at its pin. What is the largest series resistor that lets the RC settle to half an LSB?",
        options: ["About 1 kΩ", "About 10 kΩ", "About 22 Ω", "About 100 Ω"],
        answer: 3,
        why: "Settling needs about 9 time constants: τ ≤ 2 µs / 9 ≈ 222 ns, and R ≤ 222 ns / 2.2 nF ≈ 101 Ω.",
      },
      {
        q: "A bridge is excited from the same 3.0 V that serves as the ADC's reference. What happens to the reference's 75 ppm/°C drift?",
        options: [
          "It doubles, because it affects both",
          "It cancels, because the bridge output and Vref change in the same proportion",
          "It is unchanged",
          "It becomes an offset error",
        ],
        answer: 1,
        why: "In a ratiometric measurement the code depends on Vout / Vref, and both scale with the excitation, so the drift cancels.",
      },
      {
        q: "What is the main reason to add a capacitor directly at a switched-capacitor ADC input?",
        options: [
          "To raise the ADC's resolution",
          "To act as a charge reservoir so the sampling capacitor's kickback barely moves the pin voltage",
          "To block DC",
          "To increase the sample rate",
        ],
        answer: 1,
        why: "With Cf much larger than Csh, charge sharing changes the pin by only Csh/(Cf + Csh) of the difference.",
      },
    ],
  },

  "a1-noise-precision-measurement-and-spice": {
    id: "a1-noise-precision-measurement-and-spice",
    outcomes: [
      "Calculate thermal and shot noise and combine noise sources into a noise budget",
      "Convert a noise density into integrated RMS and peak-to-peak noise over a bandwidth",
      "Apply shielding, guarding, 4-wire Kelvin sensing and ratiometric bridge measurement",
      "Simulate a filter and an op-amp stage in ngspice or LTspice with .ac and .tran analyses",
    ],
    blocks: [
      { t: "h", text: "The floor under every measurement" },
      { t: "p", text: "After you remove offset with calibration and drift with a good reference, what remains is noise: random fluctuation that no calibration can remove, only averaging and bandwidth limits. Noise sets the smallest change you can resolve. A 24-bit ADC behind a noisy amplifier is a 14-bit system with expensive extra bits. This lesson gives you the physics of the main noise sources, the arithmetic of a noise budget, the wiring practices that keep interference out, the techniques for precise resistance and bridge measurement, and the simulator you will use to check it all before you build the exit project." },

      { t: "h", text: "Four noise sources" },
      { t: "list", items: [
        "**Thermal (Johnson) noise**: every resistor generates a random voltage from the thermal motion of electrons, with density e_n = √(4kTR). k = 1.38 × 10⁻²³ J/K and T is in kelvin. A 1 kΩ resistor at 300 K gives 4.07 nV/√Hz. It scales as √R, so 100 kΩ gives 40.7 nV/√Hz.",
        "**Shot noise**: a current made of discrete charges crossing a barrier (a diode junction, a photodiode) fluctuates with density i_n = √(2qI), q = 1.60 × 10⁻¹⁹ C. 1 µA gives 0.57 pA/√Hz. It matters for photodiodes and for bias currents.",
        "**1/f (flicker) noise**: in amplifiers and some resistors, density rises below a corner frequency, often 10 Hz to 1 kHz. Below the corner it grows as 1/√f. Chopper amplifiers such as the OPA2333 have no 1/f region, which is exactly why they suit DC bridge measurement.",
        "**Op-amp voltage and current noise**: the datasheet gives e_n (nV/√Hz) and i_n (fA/√Hz or pA/√Hz). The current noise flows through the source resistance and becomes a voltage i_n × R.",
      ] },
      { t: "p", text: "The unit **per root hertz** exists because random noise power adds over frequency: noise power is proportional to bandwidth, so noise voltage is proportional to √bandwidth. A density tells you how much noise lands in each hertz of your passband." },

      { t: "h", text: "Combining and integrating noise" },
      { t: "p", text: "Independent noise sources add as powers, so their RMS values add as a root-sum-square. Refer them all to the input, combine, then integrate over the bandwidth. A real filter does not cut off sharply, so use the **noise-equivalent bandwidth** (ENBW): 1.57 × f_-3dB for a first-order low-pass, about 1.11 × f_-3dB for a second-order Butterworth." },
      { t: "formula", text: String.raw`e_total = √(e_amp² + e_R1² + e_R2² + (i_n R)² + ...)          (nV/√Hz, RTI)
V_rms   = e_total × √ENBW
V_pp    ≈ 6.6 × V_rms                                           (exceeded about 0.1 % of the time)`, caption: "The noise budget in three lines, for white noise. Add the 1/f region separately if it lies inside your band." },

      { t: "h", text: "Worked example: noise budget for the G = 101 stage" },
      { t: "p", text: "Use the first lesson's stage: OPA2333 (55 nV/√Hz, flat because it is a chopper), source resistance 1 kΩ, Rf = 100 kΩ and Rg = 1 kΩ (their parallel value, about 990 Ω, is what the inverting input sees), followed by a 10 Hz first-order filter." },
      { t: "formula", text: String.raw`Source 1 kΩ:        √(4kT × 1000) = 4.07 nV/√Hz
Rf ∥ Rg = 990 Ω:     √(4kT × 990)  = 4.05 nV/√Hz
OPA2333 e_n:                          55 nV/√Hz
Total RTI:           √(55² + 4.07² + 4.05²) = 55.3 nV/√Hz
ENBW:                1.57 × 10 Hz = 15.7 Hz
RTI rms:             55.3 nV × √15.7 = 219 nV
At output (× 101):   22.1 µV rms  ≈ 146 µV pp`, caption: "Current noise of the OPA2333 through 1 kΩ is negligible here." },
      { t: "p", text: "Check against the ADC: an ADS1115 on its ±2.048 V range has an LSB of 4.096 V / 65 536 = 62.5 µV. The noise is about one third of an LSB RMS, so the amplifier is well matched to that converter. The amplifier dominates the budget by a factor of more than ten in power, so changing resistors would gain nothing; to go lower you would need a quieter amplifier or a narrower bandwidth. That is the general rule: **find the dominant term and work on that one**." },

      { t: "h", text: "Interference: shielding and guarding" },
      { t: "p", text: "Noise is random; interference is coupled in from somewhere, usually mains at 50 Hz, switching regulators and motor drives. Three coupling paths and their cures:" },
      { t: "list", items: [
        "**Electric field (capacitive) coupling** into high-impedance nodes. Cure: a grounded shield (a screened cable, a metal can) connected at one end, normally the measuring end, and low impedances where you can afford them.",
        "**Magnetic field coupling** into loops. Cure: minimise loop area by twisting the signal and its return together. A shield does little against 50 Hz magnetic fields; geometry does.",
        "**Conducted coupling** through shared ground return paths. Cure: star grounding of analog returns and keeping motor and switching currents out of the sensor ground (more in a4).",
      ] },
      { t: "p", text: "**Guarding** protects against leakage. At picoamp levels, PCB surface leakage between a high-impedance input and a nearby supply trace is a real current. A guard is a copper ring around the sensitive node driven at the same voltage as that node (for example from the op-amp's other input or a buffer). With no voltage across the leakage path, no current flows through it." },

      { t: "h", text: "Precision measurement: bridges, INAs and Kelvin sensing" },
      { t: "p", text: "From i2 you know the Wheatstone bridge and the three-op-amp instrumentation amplifier. At this level, two refinements matter. First, make the measurement **ratiometric**: excite the bridge from the same voltage that drives the ADC's reference inputs, so excitation drift cancels. The ADS1220 is built for this: a 24-bit delta-sigma ADC with a PGA (gain 1 to 128) that acts as the instrumentation amplifier, external reference inputs, and two programmable current sources (IDACs, 10 µA to 1.5 mA)." },
      { t: "p", text: "Second, use **4-wire (Kelvin) sensing** for small resistances. Two wires carry the excitation current; two separate wires sense the voltage directly at the element. The sense wires carry almost no current, so their resistance drops no voltage. Example: a 100 mΩ shunt measured with 1 A through leads of 50 mΩ each. A 2-wire measurement sees 100 + 50 + 50 = 200 mΩ, a 100% error. A 4-wire measurement sees 100 mΩ." },
      { t: "p", text: "Worked example: a Pt100 temperature sensor with the ADS1220. Pass IDAC = 1 mA through the Pt100 and on through a reference resistor Rref = 1.62 kΩ to ground, and use the voltage across Rref (1.62 V) as the ADC reference. Sense the Pt100 with two separate wires. At 0 °C the Pt100 is 100 Ω, giving 100 mV; its sensitivity is about 0.385 Ω/°C, so 385 µV/°C. With PGA gain 8, the input range is ±1.62 / 8 = ±202 mV, enough up to about 202 Ω (roughly 266 °C)." },
      { t: "formula", text: String.raw`code = 2²³ × (G × I × R_rtd) / (I × R_ref)
R_rtd = code × R_ref / (G × 2²³)          the current I cancels`, caption: "Ratiometric RTD measurement. Accuracy depends on R_ref, so buy a 0.1%, low-drift one." },

      { t: "h", text: "Simulating before you build: SPICE" },
      { t: "p", text: "SPICE builds the modified nodal analysis matrix you met in i1 and solves it for each analysis. ngspice (free, command line) and LTspice (free, schematic entry, includes many op-amp models) both accept the same netlist language. Three analyses do most of the work: `.op` for the DC operating point, `.ac` for a frequency sweep (small-signal), and `.tran` for a time-domain run. Here is the 1 kHz Sallen-Key from the last lesson, with a simple op-amp model that has the OPA2333's 350 kHz GBW. This netlist uses ngspice syntax (version 40 or later) and also runs in LTspice." },
      { t: "snippet", lang: "text", code: String.raw`* 1 kHz unity-gain Sallen-Key Butterworth low-pass
* Op-amp model: DC gain 1e5, one pole at 3.5 Hz, so GBW = 350 kHz
V1   in  0   DC 0 AC 1 PULSE(0 0.1 1m 1u 1u 5m 10m)
R1   in  a   11.3k
R2   a   b   11.3k
C1   a   out 20n
C2   b   0   10n
* op-amp as a follower: + input = b, - input = out
Eamp n1  0   b out 1e5
Rp   n1  n2  1k
Cp   n2  0   45.5u
Eout out 0   n2 0 1

.control
  ac dec 50 10 100k
  meas ac f3db WHEN vdb(out)=-3.0103
  meas ac att10k FIND vdb(out) AT=10k
  plot vdb(out)
  tran 5u 10m
  plot v(in) v(out)
.endc
.end`, caption: "Save as sk.cir and run: ngspice sk.cir. Expect f3db near 996 Hz and about -40 dB at 10 kHz." },
      { t: "p", text: "Replace the ideal block with a vendor model (a .lib or .sub file from the manufacturer's product page, included with `.include`) once the topology works. Vendor models include slew rate, rail limits, output resistance and noise, so you can rerun the capacitive-load experiment from the stability lesson in simulation, or run a `.noise` analysis to check your noise budget." },
      { t: "note", kind: "tip", text: "A simulation is only as good as its models and its parasitics. Add the scope probe (10 pF), cable capacitance and the ADC's input capacitor to the netlist, or the simulation will be more stable than your board." },

      { t: "h", text: "Towards the exit project" },
      { t: "p", text: "The exit project is a precision data-acquisition front-end designed to a written specification. Write the specification first: input range, source impedance, bandwidth, accuracy, temperature range and supply. Then, in order: choose the topology; write the DC error budget (lesson 1); check stability with the real loads (lesson 2); design the anti-alias filter and the ADC drive, and budget the reference (lesson 3); write the noise budget (this lesson); simulate with vendor models; build; and measure offset, gain, bandwidth and noise against every line of the specification. A result that misses the specification is still a pass if your budget predicted it and explains why." },

      { t: "deep", title: "Where √(4kTR) comes from", blocks: [
        { t: "p", text: "Nyquist's argument: connect two equal resistors R by a lossless transmission line, all at temperature T. In equilibrium, each resistor delivers to the other the same power it absorbs. Classical statistical mechanics gives each electromagnetic mode on the line an average energy kT, and counting modes per unit bandwidth shows that the power each resistor delivers into a matched load is kT per hertz." },
        { t: "formula", text: String.raw`Power into a matched load:  P = e_n² / (4R)  per Hz
Set equal to kT:            e_n² / (4R) = kT
                            e_n = √(4kTR)        (V/√Hz)
1 kΩ, 300 K:                √(4 × 1.38e-23 × 300 × 1000) = 4.07 nV/√Hz`, caption: "The factor 4 comes from matched-load power transfer: half the open-circuit voltage appears across the load." },
        { t: "p", text: "The result depends on nothing but resistance and temperature, so no clever resistor avoids it. Only lower R, lower T, or narrower bandwidth reduce it. Excess noise above this limit does depend on construction: thick-film resistors have more 1/f noise under DC current than metal-film or thin-film ones." },
      ] },
      { t: "deep", title: "Measuring 0.1 to 10 Hz noise and why peak-to-peak uses 6.6", blocks: [
        { t: "p", text: "Low-frequency noise is specified peak-to-peak from 0.1 to 10 Hz because that is what a DC measurement sees over tens of seconds. To measure it, follow the amplifier with a 0.1 Hz high-pass and a 10 Hz low-pass (both second order or better), add enough gain that the noise is millivolts, and watch an oscilloscope or log an ADC for 10 seconds or more." },
        { t: "p", text: "For Gaussian noise, the instantaneous value lies within ±3.3σ about 99.9% of the time, so a peak-to-peak of 6.6σ is exceeded only rarely. Some datasheets use 6σ (99.7%). For the OPA2333 the 1.1 µVpp figure (0.01 to 10 Hz) is consistent with its 55 nV/√Hz density: 55 nV × √(1.57 × 10) ≈ 218 nV rms, times 6.6 ≈ 1.4 µVpp, close to the specified value." },
      ] },
      { t: "deep", title: "Monte Carlo and worst-case simulation", blocks: [
        { t: "p", text: "Tolerances matter as much as nominal values. In LTspice, write a resistor as `{mc(11.3k,0.01)}` and a capacitor as `{mc(10n,0.05)}`, then add `.step param run 1 100 1` to run 100 random cases; the overlay of responses shows the spread of f0 and Q. In ngspice the same is done with a `.control` loop using `sgauss()` or `sunif()` and the `alter` command." },
        { t: "p", text: "For a guarantee, run worst-case corners instead: every component at the limit that pushes the result one way. A specification you must sign off belongs to worst case; a production yield estimate belongs to Monte Carlo." },
      ] },
    ],
    mistakes: [
      "**Adding noise voltages linearly.** Independent noise adds as a root-sum-square.",
      "**Integrating over the -3 dB bandwidth.** Use the noise-equivalent bandwidth: 1.57 times the corner for a first-order filter.",
      "**Grounding a cable shield at both ends in a low-frequency measurement.** It creates a ground loop that carries mains current through the shield.",
      "**2-wire measurement of a milliohm shunt or RTD.** Lead and contact resistance can exceed the quantity you are measuring.",
      "**Trusting an ideal simulation.** Without vendor models and parasitics, SPICE will not show rail limits, slew or instability.",
    ],
    practice: {
      kind: "bench",
      task: "Simulate, then build and measure, a ratiometric RTD or bridge front-end against a written specification.",
      steps: [
        "Install ngspice (or LTspice) on a PC, run the Sallen-Key netlist from the lesson and record the measured f3db and attenuation at 10 kHz.",
        "Write a one-page specification for a Pt100 measurement from 0 to 100 °C with 0.1 °C resolution, then the error and noise budgets for it.",
        "Wire a Pt100 (or a 100 Ω 0.1% resistor as a stand-in) to an ADS1220 module in 4-wire configuration, with IDAC 1 mA and a 1.62 kΩ reference resistor, and read it over SPI from an ESP32 DevKit (3.3 V).",
        "Log 1000 readings, compute the standard deviation in ohms and in °C, and compare with your noise budget.",
        "Repeat with 2-wire connection through 1 m of thin wire and report the error.",
      ],
    },
    quiz: [
      {
        q: "What is the thermal noise density of a 100 kΩ resistor at 300 K?",
        options: ["4.07 nV/√Hz", "407 nV/√Hz", "40.7 nV/√Hz", "0.407 nV/√Hz"],
        answer: 2,
        why: "Noise scales as √R. 1 kΩ gives 4.07 nV/√Hz, and 100 times the resistance gives √100 = 10 times the noise.",
      },
      {
        q: "Two independent noise sources of 30 nV/√Hz and 40 nV/√Hz add to what?",
        options: ["70 nV/√Hz", "50 nV/√Hz", "35 nV/√Hz", "10 nV/√Hz"],
        answer: 1,
        why: "Root-sum-square: √(30² + 40²) = √2500 = 50 nV/√Hz.",
      },
      {
        q: "An amplifier with 20 nV/√Hz RTI noise is followed by a first-order filter at 100 Hz. What is the RTI RMS noise?",
        options: ["About 250 nV", "About 200 nV", "About 2 µV", "About 25 nV"],
        answer: 0,
        why: "ENBW = 1.57 × 100 = 157 Hz. 20 nV × √157 ≈ 251 nV rms.",
      },
      {
        q: "Why does 4-wire sensing remove lead resistance from a measurement?",
        options: [
          "The leads are cooled by the second pair",
          "The current is doubled",
          "The sense wires carry almost no current, so their resistance drops almost no voltage",
          "The ADC subtracts the lead resistance automatically",
        ],
        answer: 2,
        why: "Excitation current flows only in the force wires. The sense wires feed a high-impedance input, so V = IR across them is nearly zero.",
      },
      {
        q: "In the ratiometric Pt100 circuit, the IDAC current drifts by 1%. What happens to the reading?",
        options: [
          "It drifts by 1%",
          "It drifts by 2%",
          "It stays almost the same, because the same current sets both the signal and the reference",
          "It becomes noisy",
        ],
        answer: 2,
        why: "The code depends on I × R_rtd divided by I × R_ref, so I cancels.",
      },
      {
        q: "In the SPICE model in the lesson, what sets the op-amp's GBW to 350 kHz?",
        options: [
          "The DC gain of 1e5 times the 3.5 Hz pole frequency set by Rp and Cp",
          "The value of R1",
          "The .tran step size",
          "The PULSE source",
        ],
        answer: 0,
        why: "A single-pole amplifier has GBW = A0 × f_pole = 10⁵ × 3.5 Hz = 350 kHz; the pole is 1/(2π × 1 kΩ × 45.5 µF).",
      },
    ],
  },
};

export default lessons;
