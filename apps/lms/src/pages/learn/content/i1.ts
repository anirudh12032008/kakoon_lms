import type { ModuleContent } from "../model/curriculum";

/**
 * Module i1: Circuit analysis for embedded work.
 * House rules for intermediate and advanced lessons:
 * - Normal mode (everything outside `deep`) is a complete lesson on its own, and
 *   every quiz question can be answered from it.
 * - `deep` sections hold derivations, edge cases and background.
 * - Code and drawings use String.raw so backslashes and quotes survive.
 * - Every number in a worked example is checked; no long dashes.
 */
const lessons: ModuleContent = {
  "i1-kirchhoff-and-nodal-analysis": {
    id: "i1-kirchhoff-and-nodal-analysis",
    outcomes: [
      "State Kirchhoff's current and voltage laws and the physical reason each one holds",
      "Write node equations for a resistive circuit and solve them by hand",
      "Explain why a sensor divider reads differently once something is connected to it",
      "Check a solution by confirming that currents balance at every node",
    ],
    blocks: [
      { t: "h", text: "Why bother with circuit analysis" },
      { t: "p", text: "In the beginner tier, every circuit had a single loop or a simple voltage divider, and Ohm's law was enough. Real embedded circuits are rarely that tidy. A sensor divider feeds an ADC input that draws a little current. A pull-up resistor shares a line with a second device. A battery monitor divider sits beside the regulator. As soon as two paths meet, you need a method that works for any arrangement, not a formula for one shape. That method rests on two laws named after Gustav Kirchhoff, plus a systematic way of applying them called **nodal analysis**." },
      { t: "p", text: "First, two words. A **node** is a point where two or more parts connect; every piece of wire joined together without a part in between is the same node. A **loop** is any closed path you can trace through parts and back to where you started." },

      { t: "h", text: "Kirchhoff's current law (KCL)" },
      { t: "formula", text: "Σ I_in = Σ I_out", caption: "At any node, the current flowing in equals the current flowing out." },
      { t: "p", text: "Charge cannot pile up at a junction of wires, and it cannot vanish there either. So whatever current arrives at a node must leave it. If 5 mA flows into a node and two resistors leave it, their currents add up to 5 mA, whatever their values. A common way to write it is that the currents leaving a node sum to zero, counting currents that arrive as negative." },
      { t: "h", text: "Kirchhoff's voltage law (KVL)" },
      { t: "formula", text: "Σ V around any closed loop = 0", caption: "Rises and drops around a loop cancel out." },
      { t: "p", text: "Voltage is the difference in energy per unit charge between two points. If you walk around a loop and return to the start, you are back at the same energy, so all the rises (across sources) and drops (across resistors) along the way must cancel. In a single loop with a 9 V battery and two resistors, the two resistor voltages add up to 9 V. That is the voltage divider you already know, seen as a consequence of KVL." },

      { t: "h", text: "Nodal analysis in four steps" },
      { t: "p", text: "KCL and KVL are true of any circuit, but using them freely leads to too many equations. Nodal analysis is the disciplined way. It gives one equation per unknown node voltage, and it suits embedded work because what you usually want to know is the voltage at a pin." },
      { t: "list", ordered: true, items: [
        "**Choose a reference node** and call it 0 V. On a microcontroller board this is always GND.",
        "**Label every other node** whose voltage you do not already know: `Va`, `Vb` and so on. A node joined straight to a source of known voltage is not unknown: its voltage is the source voltage.",
        "**Write KCL at each unknown node**, expressing each resistor current with Ohm's law as the voltage difference across it divided by its resistance. Treat every current as leaving the node; the signs then take care of themselves.",
        "**Solve the equations** and then work back to any current you need.",
      ] },

      { t: "h", text: "Worked example: one unknown node" },
      { t: "p", text: "A 9 V supply feeds node A through R1 = 1 kΩ. From node A, R2 = 2 kΩ and R3 = 3 kΩ both go to ground. What is the voltage at A?" },
      { t: "diagram", text: String.raw`
  +9 V ──[ R1 1k ]──●── A
                    │
             ┌──────┴──────┐
          [ R2 2k ]     [ R3 3k ]
             │             │
  GND ───────┴─────────────┘`, caption: "Node A has one resistor from the supply and two to ground." },
      { t: "p", text: "Currents leaving A through each resistor, in milliamps when voltages are in volts and resistances in kilohms:" },
      { t: "formula", text: String.raw`(Va - 9)/1 + Va/2 + Va/3 = 0
Va (1 + 0.5 + 0.333) = 9
Va = 9 / 1.833 ≈ 4.91 V`, caption: "Working in volts, milliamps and kilohms keeps the numbers small." },
      { t: "p", text: "Now check with KCL. The current in from the supply is (9 - 4.91) / 1 ≈ 4.09 mA. The currents out to ground are 4.91 / 2 ≈ 2.45 mA and 4.91 / 3 ≈ 1.64 mA, which add up to 4.09 mA. The node balances, so the answer is right. Always do this check; it costs a minute and catches most algebra slips." },

      { t: "h", text: "Why this matters on a real board: loading" },
      { t: "p", text: "Remove R3 from the example and node A is a plain divider: 9 × 2 / (1 + 2) = 6 V. Put R3 back and the voltage falls to 4.91 V. Nothing about R1 or R2 changed. The extra path to ground drew current through R1, which dropped more voltage. This effect is called **loading**, and you meet it constantly." },
      { t: "list", items: [
        "An **LDR or thermistor divider** read by an ADC: the ADC input draws a small current and its sampling capacitor briefly draws more, so a divider made from very large resistors reads low or noisy.",
        "A **battery monitor divider** with megohm resistors: fine for saving power, but the ADC may need a capacitor across the lower resistor to give it a stiff source.",
        "**Two dividers in a chain**, as in the next example: the second divider loads the first.",
      ] },
      { t: "note", kind: "tip", text: "A quick rule from this example: a load only disturbs a divider a little if its resistance is much larger, about ten times or more, than the resistances in the divider. The next lesson turns that rule into a number with the Thevenin equivalent." },

      { t: "h", text: "Worked example: two unknown nodes" },
      { t: "p", text: "A 5 V supply feeds node A through R1 = 1 kΩ. R2 = 1 kΩ goes from A to ground. R3 = 1 kΩ joins A to node B, and R4 = 1 kΩ goes from B to ground. This is two dividers in a chain." },
      { t: "formula", text: String.raw`Node A:  (Va - 5)/1 + Va/1 + (Va - Vb)/1 = 0   →   3Va - Vb = 5
Node B:  (Vb - Va)/1 + Vb/1 = 0               →   -Va + 2Vb = 0`, caption: "One KCL equation per unknown node." },
      { t: "p", text: "The second equation gives Va = 2Vb. Substitute into the first: 6Vb - Vb = 5, so **Vb = 1 V** and **Va = 2 V**. Check node A: 3 mA arrives from the supply ((5 - 2) / 1), 2 mA leaves to ground and 1 mA leaves towards B. Check node B: 1 mA arrives and 1 mA leaves to ground. Both balance." },
      { t: "p", text: "Notice that A is not at 2.5 V, which is what a lone 1 kΩ and 1 kΩ divider would give. The second divider loaded it. This is exactly the mistake people make when they chain an attenuator into a filter, or a level-shift divider into a pin with an internal pull-up enabled." },

      { t: "deep", title: "Nodal analysis as a matrix equation", blocks: [
        { t: "p", text: "Collect the node equations and a pattern appears. Writing conductances (G = 1/R) instead of resistances, every resistive circuit gives an equation of the form **G v = i**: a square conductance matrix times the vector of unknown node voltages equals a vector of injected currents." },
        { t: "formula", text: String.raw`|  3  -1 |   | Va |     | 5 |
| -1   2 | × | Vb |  =  | 0 |`, caption: "The two-node example, in millisiemens, volts and milliamps. The 5 on the right is the supply current that would flow into A through R1 if A were held at 0 V: 5 V / 1 kΩ." },
        { t: "p", text: "You can write G by inspection. Each diagonal entry is the sum of the conductances touching that node, and each off-diagonal entry is minus the conductance joining the two nodes. That is why G is always symmetric for a circuit of resistors. A voltage source in series with a resistor becomes a current source of V/R in parallel with the same resistor (a Norton equivalent, next lesson), which is where the right-hand side comes from." },
        { t: "p", text: "Circuit simulators such as SPICE build exactly this matrix, extended for capacitors, inductors and transistors (a method called modified nodal analysis), and solve it at every time step. Seeing it once makes simulator error messages such as \"singular matrix\" make sense: a node with no DC path to ground leaves a row of G that the solver cannot pin down." },
        { t: "snippet", lang: "python", code: String.raw`import numpy as np

# Conductance matrix (mS) and injected currents (mA) for the two-node example.
G = np.array([[3.0, -1.0],
              [-1.0, 2.0]])
i = np.array([5.0, 0.0])

va, vb = np.linalg.solve(G, i)
print(f"Va = {va:.3f} V, Vb = {vb:.3f} V")   # Va = 2.000 V, Vb = 1.000 V`, caption: "Solving the node equations numerically. For more than three nodes, this is how you should do it." },
      ] },

      { t: "deep", title: "Where Kirchhoff's laws stop being exact", blocks: [
        { t: "p", text: "Both laws assume a **lumped** circuit: parts small enough, compared with the wavelength of the signals, that a change at one end of a wire is seen at the other end at the same instant. At the frequencies in this module that is true by an enormous margin. A 1 MHz signal has a wavelength of about 300 m in free space and roughly half that on a circuit board." },
        { t: "p", text: "The assumption fails when a trace becomes a noticeable fraction of a wavelength, roughly a tenth. For the fast edges of a USB or SPI signal, the edge's rise time matters more than the clock rate: a 1 ns edge contains energy up to several hundred megahertz, and a trace of a few centimetres starts behaving like a transmission line. KCL then appears to fail because charge is stored along the line. The advanced PCB module treats this properly." },
        { t: "p", text: "KVL has a second limit. A changing magnetic field passing through a loop induces a voltage in it (Faraday's law), so the sum around the loop is no longer zero. This is how a large ground loop in a lab setup picks up mains hum, and why good layouts keep signal and return paths close together." },
      ] },
    ],
    mistakes: [
      "**Forgetting that wires joined together are one node.** Two dots on a schematic connected by a plain wire are the same node and get one voltage label, not two.",
      "**Mixing current directions within one equation.** Pick a rule, such as every current leaving the node being positive, and apply it to every term.",
      "**Labelling a node tied to a source as unknown.** If a node is connected straight to the 5 V rail, its voltage is 5 V; it needs no equation.",
      "**Mixing units.** Volts with kilohms give milliamps. Keep the whole equation in one consistent set.",
      "**Skipping the KCL check.** A wrong sign in one term still gives a confident-looking answer. Confirm the currents balance.",
    ],
    practice: {
      kind: "bench",
      task: "Build the two-node circuit and compare measurement with calculation.",
      steps: [
        "On a breadboard, build the two-node example using four 1 kΩ resistors and your board's 5 V pin (on an ESP32 DevKit, use the 5 V or VIN pin while powered from USB). Do not connect any GPIO pin.",
        "Calculate Va and Vb before measuring, as in the lesson.",
        "Measure Va and Vb with a multimeter on DC volts, black probe on GND. Write down the actual supply voltage too, since USB is rarely exactly 5 V.",
        "Scale your calculated values by actual supply / 5 and compare. They should agree within the resistors' tolerance (usually 1% or 5%).",
        "Replace R4 with a 10 kΩ resistor, predict the new Va, then measure it. Explain in one sentence why Va rose.",
      ],
    },
    quiz: [
      {
        q: "Three resistors meet at a node. 6 mA flows in through the first and 2 mA flows out through the second. What flows through the third?",
        options: ["4 mA out of the node", "8 mA out of the node", "4 mA into the node", "Not enough information"],
        answer: 0,
        why: "By KCL the currents out must total the 6 mA in. 2 mA leaves through the second resistor, so 4 mA must leave through the third.",
      },
      {
        q: "A 1 kΩ and a 2 kΩ divider from 9 V gives 6 V. A 3 kΩ resistor is then connected from the middle to ground. What happens to the middle voltage, and why?",
        options: [
          "It stays at 6 V, because R1 and R2 have not changed",
          "It falls, because the extra path to ground draws more current through the top resistor, which then drops more voltage",
          "It rises, because there are now more resistors in the circuit",
          "It falls to 0 V, because the new resistor shorts it",
        ],
        answer: 1,
        why: "This is loading. In the lesson the voltage falls from 6 V to about 4.91 V. More current through R1 means more voltage dropped across it.",
      },
      {
        q: "In nodal analysis, how many equations do you write?",
        options: [
          "One for each resistor",
          "One for each loop",
          "One for each node whose voltage is unknown",
          "Always exactly two",
        ],
        answer: 2,
        why: "Each unknown node voltage needs one KCL equation. The reference node and nodes tied to known sources need none.",
      },
      {
        q: "Two 1 kΩ dividers are chained from 5 V as in the second example. Why is the first node at 2 V rather than 2.5 V?",
        options: [
          "Because the supply is really 4 V",
          "Because the second divider draws current from the first node, which loads it",
          "Because current cannot flow from node A to node B",
          "Because Kirchhoff's laws do not apply to chained dividers",
        ],
        answer: 1,
        why: "The second divider is an extra path from node A to ground. It draws 1 mA, pulling node A below the unloaded 2.5 V.",
      },
      {
        q: "You solve a circuit and get Va = 3 V. What is the quickest way to check the answer?",
        options: [
          "Solve it again the same way",
          "Calculate every current at node A from the result and confirm the currents in equal the currents out",
          "Check that Va is less than the supply voltage",
          "Add up all the resistances",
        ],
        answer: 1,
        why: "KCL must hold at every node. If the currents balance with your voltages, the solution is right.",
      },
    ],
  },

  "i1-thevenin-norton-and-loading": {
    id: "i1-thevenin-norton-and-loading",
    outcomes: [
      "Reduce any linear two-terminal network to a Thevenin or Norton equivalent",
      "Measure a Thevenin equivalent on the bench with two readings",
      "Predict how much a load will pull down a source, and choose resistor values so it does not matter",
      "Explain source and load impedance for an ADC input, a GPIO pin and a battery",
    ],
    blocks: [
      { t: "h", text: "Why one equivalent circuit saves you a page of algebra" },
      { t: "p", text: "In the last lesson, adding one resistor to a divider meant writing the node equations again from scratch. That gets tiresome when the question you keep asking is the same: what happens at this pair of terminals when I connect something to them? A sensor output, a battery, a GPIO pin and a USB port all raise that question. **Thevenin's theorem** answers it once. It says that any network of resistors and sources, however complicated, behaves at two chosen terminals exactly like a single voltage source in series with a single resistor. Once you have those two numbers, every load is a one-line calculation." },
      { t: "formula", text: String.raw`Any linear network  ≡  V_th in series with R_th
V_load = V_th × R_load / (R_th + R_load)`, caption: "The Thevenin equivalent, and what any load then sees." },

      { t: "h", text: "Finding V_th and R_th" },
      { t: "list", ordered: true, items: [
        "**V_th is the open-circuit voltage**: the voltage across the two terminals with nothing connected. Find it with nodal analysis or, for a divider, the divider formula.",
        "**R_th is the resistance looking back into the terminals with every independent source switched off.** Switching off a voltage source means replacing it with a wire (0 V); switching off a current source means removing it (0 A). Then combine the remaining resistors in series and parallel.",
        "A second route to R_th: find the **short-circuit current** I_sc that would flow if you joined the terminals with a wire. Then R_th = V_th / I_sc. This is the one you use on the bench.",
      ] },

      { t: "h", text: "Worked example: a divider feeding an ADC" },
      { t: "p", text: "You build a divider of two 10 kΩ resistors from the ESP32's 3.3 V rail, to bias a sensor input at mid-rail. Open-circuit, the middle sits at 3.3 × 10 / 20 = **1.65 V**. With the 3.3 V rail replaced by a wire, the two 10 kΩ resistors are in parallel as seen from the middle: R_th = 10 × 10 / (10 + 10) = **5 kΩ**." },
      { t: "diagram", text: String.raw`
  +3.3 V ──[ 10k ]──●──[ 10k ]── GND        ≡        1.65 V ──[ 5k ]──● out
                    │                                                 │
                   out                                               load`, caption: "The divider and its Thevenin equivalent are indistinguishable at the output terminal." },
      { t: "p", text: "Now connect a load of 50 kΩ (an op-amp input with a bias resistor, say). The load sees 1.65 V behind 5 kΩ, so V = 1.65 × 50 / (5 + 50) = **1.50 V**. The reading has dropped by 0.15 V, which is 1 - 50/55 ≈ **9.1%**. Check it the long way with KCL at the middle node: (1.50 - 3.3)/10 + 1.50/10 + 1.50/50 = -0.18 + 0.15 + 0.03 = 0 mA. It balances." },
      { t: "p", text: "The error depends only on the ratio R_load / R_th. For an error under 1%, R_load must be about 100 times R_th. That is the precise version of the \"ten times\" rule from the last lesson: ten times gives roughly 9% error, which is fine for a threshold but not for a measurement." },
      { t: "table", head: ["R_load / R_th", "V_load as a fraction of V_th", "Error"], rows: [
        ["1", "0.50", "50%"],
        ["10", "0.909", "9.1%"],
        ["100", "0.990", "1.0%"],
        ["1000", "0.999", "0.1%"],
      ], caption: "Loading error for a resistive load, from V_load / V_th = R_load / (R_th + R_load)." },

      { t: "h", text: "Norton: the same thing as a current source" },
      { t: "p", text: "The **Norton equivalent** is a current source I_N in parallel with a resistance R_N. It is the same network described differently: I_N = V_th / R_th (the short-circuit current) and R_N = R_th. For the divider, I_N = 1.65 V / 5 kΩ = 0.33 mA, which is exactly the current that would flow from the middle into a wire to ground. Use whichever form makes the next step easier: Thevenin when loads are in series, Norton when they are in parallel. A photodiode, which produces a current proportional to light, is naturally a Norton source." },

      { t: "h", text: "Source impedance and load impedance" },
      { t: "p", text: "Engineers usually say **source impedance** for R_th and **load impedance** (or input impedance) for R_load. \"Impedance\" generalises resistance to AC, as you will see in the lesson on phasors, but for DC the words mean the same thing. The design rule is almost always the same: **a source should have a low output impedance and a load a high input impedance**, so that the voltage passes across the junction without being pulled down. Some real cases:" },
      { t: "list", items: [
        "**ATmega328P ADC (Arduino Uno)**: the datasheet recommends a source impedance of 10 kΩ or less. Above that, the sample-and-hold capacitor does not charge fully in the sampling window and readings come out low and dependent on the previous channel.",
        "**ESP32 ADC**: the same physics applies. A divider of two 100 kΩ resistors (R_th = 50 kΩ) to measure a battery needs a capacitor of around 100 nF from the ADC pin to ground, which acts as a local reservoir for the sampling capacitor.",
        "**A GPIO pin driven high** behaves like a voltage source with a source resistance of a few tens of ohms. That is why an LED with no series resistor drags the pin voltage down and stresses the driver.",
        "**A battery** has internal resistance. A fresh alkaline AA might be a few tenths of an ohm; a worn-out one, several ohms. Its open-circuit voltage looks fine on a multimeter, then collapses when a motor starts.",
      ] },

      { t: "h", text: "Measuring a Thevenin equivalent on the bench" },
      { t: "p", text: "You rarely know the inside of a sensor module or a battery. You can still find its equivalent with two measurements. First measure the open-circuit voltage with a multimeter; a multimeter's 10 MΩ input loads almost nothing, so this is V_th. Then connect a known load resistor R_L and measure V_L again. Rearranging the divider formula gives R_th." },
      { t: "formula", text: String.raw`R_th = R_L × (V_th - V_L) / V_L

Example: V_th = 9.40 V open-circuit, V_L = 9.10 V with R_L = 100 Ω
R_th = 100 × 0.30 / 9.10 ≈ 3.3 Ω`, caption: "The loaded-voltage method. Choose R_L so the drop is large enough to read, but not so large it overheats anything." },
      { t: "p", text: "Check: with R_th = 3.3 Ω and 100 Ω load, V_L = 9.40 × 100 / 103.3 ≈ 9.10 V, which matches. The load draws 91 mA here, so the 100 Ω resistor dissipates about 0.83 W; use a 2 W part or keep the test short. Never measure I_sc directly on a battery by shorting it: a short circuit can deliver tens of amps." },
      { t: "note", kind: "safety", text: "Do not short-circuit batteries, especially Li-ion and LiPo cells, to measure short-circuit current. Use the loaded-voltage method with a resistor that limits current to a safe value." },

      { t: "deep", title: "Why Thevenin's theorem is true: superposition and linearity", blocks: [
        { t: "p", text: "A circuit of resistors and independent sources is **linear**: every node voltage is a weighted sum of the source values. Superposition follows: you can find the effect of each source alone, with the others switched off, and add the results. Now drive the terminals of the network with a test current I. By linearity the terminal voltage is V = a + b·I, where a is the voltage with I = 0 (the open-circuit voltage) and b is the change in voltage per unit current with all internal sources switched off (a resistance). That straight line is exactly the terminal law of a source V_th = a in series with R_th = b. Nothing else about the inside can be seen from outside." },
        { t: "p", text: "The theorem breaks down where the network is non-linear. A diode or transistor has no single R_th; you can only linearise around an operating point and use a **small-signal** equivalent, which is what you will do for BJT amplifiers in the next module. A circuit with dependent sources (such as a transistor model) still has a Thevenin equivalent, but you must find R_th with a test source rather than by combining resistors, because switching off the independent sources leaves the dependent ones active." },
      ] },
      { t: "deep", title: "Maximum power transfer and why embedded work usually avoids it", blocks: [
        { t: "p", text: "The power into a load R_L from a Thevenin source is P = V_th² × R_L / (R_th + R_L)². Differentiate and set to zero and you find the maximum at R_L = R_th. At that point half the power is wasted in R_th, so the efficiency is only 50%, and the load voltage is half of V_th." },
        { t: "formula", text: String.raw`dP/dR_L = V_th² × (R_th - R_L) / (R_th + R_L)³ = 0   →   R_L = R_th
P_max = V_th² / (4 R_th)`, caption: "Matched load." },
        { t: "p", text: "Matching is right for radio: an antenna and a 50 Ω cable are matched so that signal power is not reflected. It is wrong for almost everything else in this course. You want a power supply to deliver energy efficiently, so R_th should be far below R_L, and you want a sensor voltage to arrive intact, so R_L should be far above R_th. Matching is a special case, not a goal." },
      ] },
    ],
    mistakes: [
      "**Leaving voltage sources in place when finding R_th.** Replace each ideal voltage source with a wire and each current source with an open circuit first.",
      "**Using huge divider resistors into an ADC** to save power, then wondering why readings are low and drift. Keep R_th under the datasheet figure (10 kΩ on the Uno) or add a capacitor or buffer.",
      "**Measuring open-circuit voltage with a low-impedance meter or a loaded circuit** and calling it V_th. Disconnect the load first.",
      "**Shorting a battery to find its short-circuit current.** Use a known load resistor and the loaded-voltage formula instead.",
      "**Assuming a 10 to 1 impedance ratio is \"no error\".** It is about 9%. For measurement accuracy you need 100 to 1 or better.",
    ],
    practice: {
      kind: "bench",
      task: "Find the Thevenin equivalent of a divider and of a 9 V battery, and confirm the prediction with a load.",
      steps: [
        "Build a divider of 10 kΩ and 10 kΩ from your board's 3.3 V pin (on the ESP32 DevKit or the Uno's 3.3 V pin). Calculate V_th and R_th.",
        "Measure the open-circuit output with a multimeter. Then connect a 4.7 kΩ load from the output to GND, predict the loaded voltage from your V_th and R_th, and measure it.",
        "Use the loaded-voltage formula on your measurement to calculate R_th from the data. Compare with 5 kΩ.",
        "Take a 9 V battery. Measure its open-circuit voltage, then measure across a 100 Ω, 2 W resistor for no more than a few seconds. Calculate its internal resistance.",
        "Write one sentence explaining how that internal resistance would affect a motor that draws 1 A from the battery.",
      ],
    },
    quiz: [
      {
        q: "A divider of 20 kΩ (top) and 20 kΩ (bottom) is fed from 5 V. What are V_th and R_th at the middle?",
        options: ["2.5 V and 40 kΩ", "2.5 V and 10 kΩ", "5 V and 10 kΩ", "2.5 V and 20 kΩ"],
        answer: 1,
        why: "Open-circuit, the divider gives 5 × 20 / 40 = 2.5 V. With the 5 V source replaced by a wire, the two 20 kΩ resistors are in parallel: 10 kΩ.",
      },
      {
        q: "A source has V_th = 2 V and R_th = 1 kΩ. You connect a 9 kΩ load. What voltage does the load see?",
        options: ["2.0 V", "0.2 V", "1.8 V", "1.0 V"],
        answer: 2,
        why: "V = 2 × 9 / (1 + 9) = 1.8 V. The load is nine times R_th, so about 10% is lost.",
      },
      {
        q: "To read a sensor with under 1% error from loading, roughly how large must the load resistance be compared with R_th?",
        options: ["About equal", "About 10 times larger", "About 100 times larger", "About 10 times smaller"],
        answer: 2,
        why: "The fraction reaching the load is R_L / (R_th + R_L). At R_L = 100 R_th it is 100/101, about 0.99.",
      },
      {
        q: "A module reads 5.00 V open-circuit and 4.00 V with a 1 kΩ load. What is its output resistance?",
        options: ["250 Ω", "1 kΩ", "200 Ω", "4 kΩ"],
        answer: 0,
        why: "R_th = R_L × (V_th - V_L) / V_L = 1000 × 1.00 / 4.00 = 250 Ω.",
      },
      {
        q: "Why does a divider of two 1 MΩ resistors make a poor input to the Arduino Uno's ADC without a capacitor?",
        options: [
          "Because 1 MΩ resistors are too noisy to use at all",
          "Because its source resistance of 500 kΩ is far above the 10 kΩ the ADC expects, so the sampling capacitor does not charge fully",
          "Because the divider ratio is wrong",
          "Because the ADC cannot measure voltages below 2.5 V",
        ],
        answer: 1,
        why: "R_th of the divider is 1 MΩ in parallel with 1 MΩ, 500 kΩ. The ATmega328P datasheet recommends 10 kΩ or less so the sample-and-hold settles in time.",
      },
    ],
  },

  "i1-capacitors-inductors-and-transients": {
    id: "i1-capacitors-inductors-and-transients",
    outcomes: [
      "Describe how capacitors and inductors store energy and how their current and voltage are related",
      "Calculate the voltage on a charging or discharging RC circuit at any time",
      "Use the time constant to design debounce, reset and power-up delays",
      "Explain why switching an inductor needs a flyback path",
    ],
    blocks: [
      { t: "h", text: "Where time enters the circuit" },
      { t: "p", text: "Resistor circuits respond instantly: change the input and every voltage jumps to its new value. Real embedded circuits do not. A reset pin rises slowly after power is applied. A button contact bounces, and a capacitor smooths it. A relay coil keeps pushing current after the transistor turns off, and the voltage spike can kill the transistor. All of these are **transients**, and they come from the two parts that store energy: the capacitor and the inductor." },

      { t: "h", text: "The capacitor" },
      { t: "p", text: "A capacitor is two conductors separated by an insulator. Put a voltage across it and charge Q collects on the plates in proportion: Q = C·V, where C is the capacitance in farads. Current is the rate at which charge flows, so the current into a capacitor is set by how fast its voltage is changing." },
      { t: "formula", text: String.raw`Q = C · V
i = C · dv/dt
Energy stored  E = ½ C V²`, caption: "The capacitor's defining relations." },
      { t: "p", text: "Two consequences follow, and you will use them constantly. First, **a capacitor's voltage cannot jump**, because an instant change in voltage would need infinite current. So at the moment a switch closes, a discharged capacitor still reads 0 V and behaves like a short circuit. Second, **in steady DC a capacitor carries no current**, because dv/dt is zero, so after a long time it behaves like an open circuit. Those two pictures, short at the instant of change and open after a long time, let you sketch most transients before writing an equation." },

      { t: "h", text: "The inductor" },
      { t: "p", text: "An inductor is a coil of wire. Current through it builds a magnetic field, and a changing field induces a voltage that opposes the change. The voltage across an inductor is set by how fast its current is changing. It is the mirror image of the capacitor." },
      { t: "formula", text: String.raw`v = L · di/dt
Energy stored  E = ½ L I²`, caption: "L is the inductance in henries." },
      { t: "p", text: "So **an inductor's current cannot jump**. At the instant of a change it behaves like an open circuit (it resists a sudden rise in current), and in steady DC it behaves like a wire (just the resistance of its copper). The dangerous case is turning current off. A relay coil carrying 70 mA has energy stored in its field; if a transistor opens the circuit in, say, 100 ns, the coil tries to keep the current flowing and v = L·di/dt becomes enormous, easily over a hundred volts. That spike punches through the transistor. The cure, a **flyback diode** across the coil, gives the current somewhere to go. You will meet it again in the semiconductor module." },
      { t: "note", kind: "warn", text: "Every relay coil, solenoid, motor and inductive load switched by a transistor needs a flyback path, normally a diode across the load, cathode to the positive supply." },

      { t: "h", text: "The RC step response" },
      { t: "p", text: "Connect a resistor R and a discharged capacitor C in series, and at t = 0 apply a step of V_s volts. At first the capacitor is at 0 V, so the whole V_s appears across R and the current is V_s / R. As charge builds, the capacitor voltage rises, the voltage left across R falls, and the current falls with it. The charging slows down as it approaches V_s. The result is an exponential curve with a time constant τ (tau)." },
      { t: "formula", text: String.raw`τ = R · C
Charging:     v_C(t) = V_s · (1 - e^(-t/τ))
Discharging:  v_C(t) = V_0 · e^(-t/τ)
Time to reach a voltage V while charging:  t = -τ · ln(1 - V/V_s)`, caption: "Ohms times farads gives seconds." },
      { t: "table", head: ["Time", "Charged to (fraction of V_s)", "Left to go"], rows: [
        ["1 τ", "63.2%", "36.8%"],
        ["2 τ", "86.5%", "13.5%"],
        ["3 τ", "95.0%", "5.0%"],
        ["5 τ", "99.3%", "0.7%"],
      ], caption: "Memorise the first and last rows: 63% after one time constant, effectively finished after five." },
      { t: "diagram", text: String.raw`
 V_s ┤                     ......................
     │               ......
     │          ....
0.63 ┤ - - - .                             v_C(t)
     │     .
     │   .
     │  .
   0 ┼.───────┬───────┬───────┬───────┬───────┬── t
     0        τ      2τ      3τ      4τ      5τ`, caption: "The charging curve. The initial slope, if continued, would reach V_s at exactly t = τ." },

      { t: "h", text: "Worked example: a power-on delay" },
      { t: "p", text: "A 10 kΩ resistor charges a 10 µF capacitor from 3.3 V, and a logic input treats anything above 2.0 V as high. How long after power-up does the input see a high? First, τ = 10 000 × 10 × 10⁻⁶ = **0.1 s**. Then t = -0.1 × ln(1 - 2.0/3.3) = -0.1 × ln(0.394) = **0.093 s**, about 93 ms." },
      { t: "p", text: "Check: substitute back. v_C(0.093) = 3.3 × (1 - e^(-0.93)) = 3.3 × (1 - 0.395) = 2.0 V. It matches. Sanity check too: 2.0 V is 61% of 3.3 V, just under the 63% reached at one time constant, so the answer should be just under 0.1 s, and it is." },

      { t: "h", text: "The RL step response" },
      { t: "p", text: "An inductor in series with a resistor behaves the same way, with current in place of voltage. Apply V_s at t = 0: the current starts at zero (the inductor resists the jump) and rises towards V_s / R with time constant **τ = L / R**. A 10 mH coil with 100 Ω of resistance has τ = 0.01 / 100 = 100 µs, so it reaches full current in about 0.5 ms. Motor windings and relay coils are RL loads, which is why their current lags behind a PWM edge." },
      { t: "formula", text: String.raw`τ = L / R
Rising:  i(t) = (V_s / R) · (1 - e^(-t/τ))`, caption: "Henries divided by ohms gives seconds." },

      { t: "h", text: "Where you use the time constant" },
      { t: "list", items: [
        "**Button debounce**: a 10 kΩ pull-up and 100 nF capacitor have τ = 1 ms, long enough to swallow contact bounce of a few hundred microseconds. A Schmitt-trigger input then gives one clean edge.",
        "**Reset delay**: microcontroller reset pins often have an RC network so the chip starts only after the supply has settled. The ESP32 DevKit's EN pin has exactly this: a pull-up and a capacitor.",
        "**Decoupling**: a 100 nF capacitor by every chip supplies the short bursts of current the chip draws, faster than the long supply wire can.",
        "**ADC sampling**: the ADC's internal sampling capacitor charges through the source resistance. Too large a source resistance means it has not reached its final value when the conversion starts, the effect behind the Uno's 10 kΩ limit in the last lesson.",
      ] },
      { t: "p", text: "Measuring τ is a good first experiment with the Uno. Drive the RC from a digital pin and time how long the ADC takes to see 63.2% of full scale. Because the pin and the ADC both use the 5 V supply, the result does not depend on the exact supply voltage." },
      { t: "snippet", lang: "cpp", code: String.raw`// Arduino Uno: measure an RC time constant.
// D7 -> 10 kOhm -> node -> 10 uF -> GND. Node also to A0.
const int DRIVE = 7;
const int SENSE = A0;

void setup() {
  Serial.begin(115200);
  pinMode(DRIVE, OUTPUT);
}

void loop() {
  // Discharge fully: hold low for well over 5 tau (5 x 0.1 s).
  digitalWrite(DRIVE, LOW);
  while (analogRead(SENSE) > 2) {}
  delay(1000);

  // Step up and time the rise to 63.2 % of full scale (0.632 x 1023 = 647).
  unsigned long t0 = micros();
  digitalWrite(DRIVE, HIGH);
  while (analogRead(SENSE) < 647) {}
  unsigned long tau_us = micros() - t0;

  Serial.print("tau = ");
  Serial.print(tau_us / 1000.0, 1);
  Serial.println(" ms (expected about 100 ms)");
  delay(2000);
}`, caption: "Each analogRead takes about 112 µs on the Uno, so the timing resolution is about 0.1 ms, plenty for a 100 ms time constant." },
      { t: "p", text: "Expect a result between about 80 and 120 ms. Electrolytic capacitors are commonly rated at ±20%, and that is the main reason the number differs from 100 ms. Note which way the polarised capacitor goes: the stripe marks the negative lead, which goes to GND." },

      { t: "deep", title: "Deriving the RC charging equation", blocks: [
        { t: "p", text: "Write KVL around the loop after the switch closes. The source voltage equals the drop across R plus the capacitor voltage, and the current is the same through both parts." },
        { t: "formula", text: String.raw`V_s = i·R + v_C          and   i = C · dv_C/dt
V_s = RC · dv_C/dt + v_C
dv_C / (V_s - v_C) = dt / (RC)
-ln(V_s - v_C) = t/(RC) + k
At t = 0, v_C = 0, so k = -ln(V_s)
ln((V_s - v_C)/V_s) = -t/τ
v_C = V_s · (1 - e^(-t/τ))`, caption: "Separating variables in a first-order differential equation." },
        { t: "p", text: "The same steps give the general rule for any first-order circuit: v(t) = v(∞) + (v(0) - v(∞)) · e^(-t/τ). Find the starting value, the final value and τ = R_th · C, where R_th is the Thevenin resistance seen by the capacitor, and you can write the answer without solving anything. This is why the Thevenin lesson came first: a capacitor on a divider charges with τ = (R1 ∥ R2) · C, not (R1 + R2) · C." },
      ] },
      { t: "deep", title: "Real capacitors and inductors: ESR, leakage, dielectrics and saturation", blocks: [
        { t: "p", text: "A real capacitor has a small **equivalent series resistance** (ESR) and a series inductance from its leads, so above some frequency (its self-resonant frequency, often tens of megahertz for a 100 nF ceramic) it stops acting like a capacitor at all. Electrolytics have much higher ESR and leakage current, and they dry out with heat; their life is rated in hours at a temperature, such as 2000 h at 105 °C." },
        { t: "list", items: [
          "**C0G (NP0) ceramics**: stable with voltage and temperature, small values. Use them in filters and timing circuits.",
          "**X7R and X5R ceramics**: large values in small packages, but the capacitance falls with applied DC voltage, sometimes by half or more near the rated voltage. Check the maker's DC-bias curve.",
          "**Y5V ceramics**: cheap and very unstable; avoid them in anything that depends on the value.",
          "**Aluminium electrolytics**: bulk storage on supply rails; polarised; reversed, they can vent.",
        ] },
        { t: "p", text: "An inductor wound on a magnetic core **saturates** above its rated current: the core cannot hold more field, the inductance collapses, and the current then rises far faster than τ = L/R predicts. Datasheets give a saturation current (I_sat) and a heating current (I_rms); a power inductor in a buck converter must be chosen for both." },
      ] },
    ],
    mistakes: [
      "**Using R1 + R2 as the resistance for a capacitor across the bottom of a divider.** Use the Thevenin resistance seen by the capacitor, R1 ∥ R2.",
      "**Expecting a capacitor to be fully charged after one time constant.** It is at 63%. Allow five time constants for \"done\".",
      "**Leaving out the flyback diode on a relay or motor.** The turn-off spike from L·di/dt destroys the transistor, sometimes after working for days.",
      "**Fitting an electrolytic capacitor backwards.** The stripe is negative. Reversed, it leaks, heats and can burst.",
      "**Trusting the marked value of an X7R ceramic at high DC bias.** A 10 µF part at its rated voltage may give only a few microfarads.",
    ],
    practice: {
      kind: "bench",
      task: "Measure an RC time constant two ways and compare with the calculation.",
      steps: [
        "On the Uno, connect D7 through 10 kΩ to a 10 µF electrolytic capacitor (stripe to GND), and the junction to A0.",
        "Upload the sketch in the lesson and record five readings of τ from the Serial Monitor at 115200 baud.",
        "Replace the 10 µF with a 100 µF capacitor. Predict τ, then measure.",
        "Add a second 10 kΩ from the junction to GND (with 10 µF again). Predict the new final voltage and the new τ using the Thevenin equivalent, then explain why the sketch now never finishes. Change the threshold in the code to 63.2% of the new final value and measure.",
        "Write down the capacitor's tolerance and say whether your measurements fall inside it.",
      ],
    },
    quiz: [
      {
        q: "A 4.7 kΩ resistor and 22 µF capacitor are in series. What is the time constant?",
        options: ["10.3 ms", "103 ms", "1.03 s", "4.7 ms"],
        answer: 1,
        why: "τ = R·C = 4700 × 22 × 10⁻⁶ = 0.1034 s, about 103 ms.",
      },
      {
        q: "A discharged capacitor is suddenly connected to a supply through a resistor. At that instant, how does the capacitor behave?",
        options: ["Like an open circuit", "Like a short circuit, because its voltage cannot jump", "Like an inductor", "Like a voltage source at the supply voltage"],
        answer: 1,
        why: "The capacitor's voltage starts at 0 V and cannot change instantly, so the full supply appears across the resistor, just as if the capacitor were a wire.",
      },
      {
        q: "An RC circuit charges towards 5 V with τ = 2 ms. Roughly what is the capacitor voltage after 6 ms?",
        options: ["3.2 V", "4.3 V", "4.75 V", "5.0 V exactly"],
        answer: 2,
        why: "6 ms is 3τ, at which the capacitor is 95% charged: 0.95 × 5 = 4.75 V.",
      },
      {
        q: "Why does a transistor switching a relay coil need a diode across the coil?",
        options: [
          "To make the relay switch faster",
          "Because the coil's current cannot stop instantly, and without a path, v = L·di/dt produces a large voltage spike at turn-off",
          "To stop the coil drawing current when it is on",
          "Because relays only work on AC",
        ],
        answer: 1,
        why: "An inductor resists a change in current. Opening the circuit quickly makes di/dt huge, and the resulting voltage spike can break down the transistor. The diode lets the current circulate and decay.",
      },
      {
        q: "A 100 mH coil has 50 Ω of resistance. How long does its current take to reach essentially its final value after a step?",
        options: ["About 2 ms", "About 10 ms", "About 50 ms", "About 0.4 ms"],
        answer: 1,
        why: "τ = L/R = 0.1 / 50 = 2 ms. Five time constants is 10 ms.",
      },
      {
        q: "A 10 µF capacitor sits across the bottom resistor of a divider made of two 10 kΩ resistors. What time constant does it charge with?",
        options: ["200 ms", "100 ms", "50 ms", "25 ms"],
        answer: 2,
        why: "The capacitor sees the divider's Thevenin resistance, 10 kΩ ∥ 10 kΩ = 5 kΩ. τ = 5000 × 10 × 10⁻⁶ = 50 ms.",
      },
    ],
  },

  "i1-ac-phasors-and-filters": {
    id: "i1-ac-phasors-and-filters",
    outcomes: [
      "Describe a sinusoid by its amplitude, frequency and phase, and convert between peak, peak-to-peak and RMS",
      "Calculate the impedance of resistors, capacitors and inductors at a given frequency",
      "Design a first-order RC low-pass or high-pass filter for a chosen cut-off frequency",
      "Read and sketch a Bode plot of gain in decibels and phase against frequency",
    ],
    blocks: [
      { t: "h", text: "Why frequency is the other half of the story" },
      { t: "p", text: "The last lesson asked how a circuit responds to a sudden step. The other question engineers ask is how it responds to a steady sine wave at each frequency. Sensors produce slow signals buried in fast noise. Mains hum sits at 50 Hz. A PWM output switches at kilohertz, and you may want only its average. An ADC sampling at 1 kHz is fooled by anything above 500 Hz. Each of these is a statement about frequency, and each is handled with a **filter**. To design one you need a way to treat capacitors and inductors like resistors at a given frequency: **phasors** and **impedance**." },

      { t: "h", text: "Describing a sine wave" },
      { t: "formula", text: String.raw`v(t) = V_p · sin(ωt + φ)        ω = 2πf
V_pp  = 2 · V_p
V_rms = V_p / √2 ≈ 0.707 · V_p      (sine waves only)`, caption: "Amplitude, angular frequency and phase." },
      { t: "p", text: "V_p is the peak amplitude, f the frequency in hertz, ω the angular frequency in radians per second, and φ the phase, the shift along the time axis expressed as an angle. RMS (root mean square) is the DC voltage that would heat a resistor equally. Indian mains is 230 V RMS at 50 Hz, so its peak is 230 × √2 ≈ 325 V. A function generator usually displays peak-to-peak; a multimeter on AC displays RMS. Always write down which one you mean." },

      { t: "h", text: "Phasors: a sine wave as one complex number" },
      { t: "p", text: "In a circuit built from R, L and C and driven by a sine wave, every voltage and current is a sine wave at the **same frequency** once the start-up transient has died away. Only amplitude and phase differ. So you can drop the time function and describe each signal by a single complex number, a **phasor**, whose magnitude is the amplitude and whose angle is the phase. Writing j for √-1 (electrical engineers use j because i means current), a phasor V = V_p∠φ represents v(t) = V_p sin(ωt + φ)." },
      { t: "p", text: "The point of phasors is that differentiation becomes multiplication by jω. The capacitor law i = C·dv/dt becomes I = jωC·V, and the inductor law v = L·di/dt becomes V = jωL·I. Both are now Ohm's law with a complex resistance, which is called **impedance**, Z." },
      { t: "formula", text: String.raw`Z_R = R
Z_C = 1 / (jωC)   magnitude X_C = 1 / (2πfC),  current leads voltage by 90°
Z_L = jωL         magnitude X_L = 2πfL,        current lags voltage by 90°`, caption: "Impedances add in series and combine in parallel exactly like resistances." },
      { t: "p", text: "A capacitor's impedance falls as frequency rises: it blocks DC and passes high frequencies. An inductor does the opposite. For example, a 100 nF capacitor at 1 kHz has X_C = 1 / (2π × 1000 × 100 × 10⁻⁹) ≈ **1.59 kΩ**; at 10 kHz it is ten times lower, 159 Ω; at DC it is infinite. Everything you learned about dividers, Thevenin and nodal analysis now works for AC, with complex numbers in place of real ones." },

      { t: "h", text: "The RC low-pass filter" },
      { t: "diagram", text: String.raw`
  v_in ──[ R ]──●── v_out
                │
               ═╪═ C
                │
  GND ──────────┘`, caption: "A divider whose lower leg is a capacitor." },
      { t: "p", text: "Treat it as a divider with Z_C in the bottom leg. At low frequency Z_C is huge, so almost all of v_in appears at the output. At high frequency Z_C is small, so the output is pulled towards ground. The frequency where the two legs have equal magnitude, R = X_C, is the **cut-off frequency**, f_c." },
      { t: "formula", text: String.raw`H(f) = v_out / v_in = Z_C / (R + Z_C) = 1 / (1 + j·f/f_c)
f_c = 1 / (2πRC)
|H| = 1 / √(1 + (f/f_c)²)
Phase = -arctan(f/f_c)`, caption: "First-order low-pass transfer function." },
      { t: "p", text: "At f = f_c, |H| = 1/√2 ≈ 0.707, which is **-3 dB**, and the phase is -45°. Far above f_c, |H| ≈ f_c / f: every tenfold increase in frequency divides the output by ten. The high-pass filter swaps R and C, and its response is the mirror image: H = (j·f/f_c) / (1 + j·f/f_c), the same f_c, -3 dB and +45° at cut-off, and it blocks DC completely. A high-pass is how you remove a DC offset from a microphone signal; a low-pass is how you smooth a PWM output or remove noise before an ADC." },

      { t: "h", text: "Decibels and Bode plots" },
      { t: "p", text: "Filter gains span many powers of ten, so they are plotted on logarithmic scales. Gain in **decibels** is 20·log₁₀(|H|) for voltage ratios. A ratio of 0.707 is -3 dB, 0.1 is -20 dB, 0.01 is -40 dB, and a gain of 10 is +20 dB. A **Bode plot** shows gain in dB and phase in degrees against frequency on a log axis. For a first-order filter the gain curve is almost two straight lines: flat at 0 dB below f_c, and falling at **-20 dB per decade** above it, with the real curve 3 dB below the corner." },
      { t: "diagram", text: String.raw`
 gain (dB)
    0 ┤━━━━━━━━━━━━━━━━━━━━━━━.
      │                         ' .
   -3 ┤ - - - - - - - - - - - - - ●   (f_c)
      │                              ' .
  -20 ┤                                  ' .     slope -20 dB/decade
      │                                      ' .
  -40 ┤                                          ' .
      └──────┬──────────┬──────────┬──────────┬───── f (log)
           f_c/10      f_c      10 f_c    100 f_c`, caption: "Asymptotic Bode magnitude of a first-order low-pass." },

      { t: "h", text: "Worked example: a 1 kHz low-pass" },
      { t: "p", text: "Design a low-pass with f_c near 1 kHz from standard parts. Choose C = 100 nF (a common, cheap value), then R = 1 / (2π × 1000 × 100 × 10⁻⁹) = 1592 Ω. The nearest E24 value is 1.6 kΩ, giving f_c = 1 / (2π × 1600 × 100 × 10⁻⁹) = **995 Hz**. Now predict the response at three frequencies." },
      { t: "table", head: ["Frequency", "|H|", "Gain", "Phase"], rows: [
        ["100 Hz", "0.995", "-0.04 dB", "-5.7°"],
        ["1 kHz", "0.705", "-3.0 dB", "-45.2°"],
        ["10 kHz", "0.099", "-20.1 dB", "-84.3°"],
      ], caption: "Calculated from |H| = 1/√(1 + (f/995)²) and phase = -arctan(f/995)." },
      { t: "p", text: "Check one row by hand. At 10 kHz, f/f_c = 10.05, so |H| = 1/√(1 + 101.1) = 1/10.10 = 0.099, and 20·log₁₀(0.099) = -20.1 dB. A 1 V peak sine at 10 kHz comes out at about 0.1 V and lags by 84°. These are the numbers you will measure with an oscilloscope in the next lesson." },
      { t: "note", kind: "tip", text: "Remember the loading lesson. Whatever drives the filter adds its source resistance to R, and whatever reads the output is in parallel with C. Keep the source impedance well below R and the load impedance well above R, or buffer the filter with an op-amp (next module)." },

      { t: "h", text: "Choosing a filter for an embedded job" },
      { t: "list", items: [
        "**Smoothing PWM into a DC level**: put f_c at least 100 times below the PWM frequency. A first-order filter then reduces the ripple by roughly that factor. For 1 kHz PWM, f_c ≈ 10 Hz.",
        "**Anti-alias before an ADC**: put f_c below half the sampling rate. A first-order filter only gives -20 dB per decade, so it reduces aliased noise rather than removing it; serious designs use higher-order filters or oversample.",
        "**Removing a DC offset** (AC coupling a microphone): high-pass with f_c well below the lowest frequency you care about, for example 20 Hz for audio.",
        "**Debouncing and decoupling** are low-pass filters too, seen in the time domain in the last lesson. f_c = 1/(2πτ) links the two views.",
      ] },
      { t: "snippet", lang: "python", code: String.raw`import math

R = 1600.0      # ohms
C = 100e-9      # farads
fc = 1 / (2 * math.pi * R * C)
print(f"fc = {fc:.0f} Hz")

for f in (100, 300, 1000, 3000, 10000):
    h = 1 / complex(1, f / fc)            # H = 1 / (1 + j f/fc)
    gain_db = 20 * math.log10(abs(h))
    phase = math.degrees(math.atan2(h.imag, h.real))
    print(f"{f:6d} Hz  |H| = {abs(h):.3f}  {gain_db:6.1f} dB  {phase:6.1f} deg")`, caption: "Python's built-in complex type makes phasor arithmetic one line. Use it to fill in your prediction table." },

      { t: "deep", title: "Why jω: from differential equations to complex exponentials", blocks: [
        { t: "p", text: "Euler's formula, e^(jθ) = cos θ + j sin θ, lets you write a sinusoid as the real or imaginary part of a rotating complex number V·e^(jωt). Differentiating e^(jωt) with respect to time just multiplies it by jω. So when every signal is of the form V·e^(jωt), the differential equations of an RLC circuit become algebraic equations in V, and the common factor e^(jωt) cancels. What remains is the phasor relation." },
        { t: "formula", text: String.raw`Low-pass, by KCL at v_out:
(v_out - v_in)/R + C · dv_out/dt = 0
Substitute v = V·e^(jωt):
(V_out - V_in)/R + jωC·V_out = 0
V_out (1 + jωRC) = V_in
H = 1 / (1 + jωRC) = 1 / (1 + j·f/f_c),  with  f_c = 1/(2πRC)`, caption: "The transfer function falls straight out of nodal analysis." },
        { t: "p", text: "The magnitude of a complex number a + jb is √(a² + b²) and its angle is arctan(b/a), which gives the |H| and phase formulas in the lesson. A transfer function written in terms of s = jω is a Laplace transfer function, which the advanced control systems module uses throughout: the low-pass is H(s) = 1 / (1 + sτ), with a single pole at s = -1/τ." },
      ] },
      { t: "deep", title: "Time constant, rise time and bandwidth are the same fact", blocks: [
        { t: "p", text: "The low-pass filter and the RC step response are one circuit looked at two ways, so their numbers are tied together. The 10% to 90% rise time of a first-order step response is t_r = τ · (ln 0.9 - ln 0.1) = τ · ln 9 ≈ 2.2τ. With f_c = 1/(2πτ), that gives t_r ≈ 0.35 / f_c." },
        { t: "formula", text: String.raw`t_r = 2.2 τ = 2.2 / (2π f_c) ≈ 0.35 / f_c`, caption: "The bandwidth and rise-time rule." },
        { t: "p", text: "This rule tells you what an oscilloscope can show. A 100 MHz scope has a rise time of roughly 3.5 ns, so it cannot faithfully show an edge faster than that. It also tells you how fast a filtered signal can follow a change: the 10 Hz PWM smoothing filter above takes about 35 ms to rise most of the way (10% to 90%) and about 75 ms to settle within 1% of a new duty cycle, which is a trade-off between ripple and response that you choose deliberately." },
      ] },
    ],
    mistakes: [
      "**Mixing up peak, peak-to-peak and RMS.** A generator set to 2 Vpp gives 1 V peak and 0.707 V RMS. Label every reading.",
      "**Using f_c = 1/(RC).** That is the angular cut-off ω_c in rad/s. In hertz it is 1/(2πRC), about six times lower.",
      "**Forgetting the source and load impedance** when predicting a filter's response. They change the effective R and add load in parallel with C.",
      "**Expecting a first-order filter to remove everything above f_c.** It only falls at 20 dB per decade, so at 2 f_c the signal is still at 45%.",
      "**Using 10·log₁₀ for voltage ratios.** Voltage and current use 20·log₁₀; 10·log₁₀ is for power.",
    ],
    practice: {
      kind: "bench",
      task: "Prepare a prediction table for the RC filter you will build and measure in the next lesson.",
      steps: [
        "Pick a C you own (for example 100 nF) and calculate R for f_c near 1 kHz. Choose the nearest standard resistor and recalculate f_c.",
        "Run the Python script with your values to predict |H|, gain in dB and phase at 100 Hz, 300 Hz, 1 kHz, 3 kHz and 10 kHz.",
        "Sketch the asymptotic Bode magnitude plot on log paper or a spreadsheet, marking f_c and the -20 dB per decade slope.",
        "Repeat the calculation for the high-pass version (R and C swapped) and note how the table changes.",
        "Measure your actual R and, if your meter allows, your actual C, and recalculate f_c from the measured values.",
      ],
    },
    quiz: [
      {
        q: "A sine wave measures 6 V peak-to-peak on a scope. What is its RMS value?",
        options: ["6 V", "4.24 V", "2.12 V", "3 V"],
        answer: 2,
        why: "Peak is 3 V; RMS is 3 / √2 ≈ 2.12 V.",
      },
      {
        q: "What is the magnitude of the impedance of a 10 nF capacitor at 10 kHz?",
        options: ["About 1.6 kΩ", "About 16 kΩ", "About 160 Ω", "About 628 Ω"],
        answer: 0,
        why: "X_C = 1/(2πfC) = 1/(2π × 10⁴ × 10⁻⁸) = 1/(6.28 × 10⁻⁴) ≈ 1592 Ω.",
      },
      {
        q: "An RC low-pass has R = 10 kΩ and C = 16 nF. What is its cut-off frequency, approximately?",
        options: ["6.25 kHz", "100 Hz", "160 Hz", "1 kHz"],
        answer: 3,
        why: "f_c = 1/(2π × 10⁴ × 16 × 10⁻⁹) ≈ 995 Hz, about 1 kHz.",
      },
      {
        q: "A first-order low-pass has f_c = 500 Hz. Roughly what gain does it have at 50 kHz?",
        options: ["-3 dB", "-20 dB", "-40 dB", "-60 dB"],
        answer: 2,
        why: "50 kHz is two decades above f_c, and the gain falls by about 20 dB per decade, giving about -40 dB.",
      },
      {
        q: "At the cut-off frequency of an RC low-pass, what are the gain and phase?",
        options: ["0 dB and 0°", "-3 dB and -45°", "-6 dB and -90°", "-3 dB and -90°"],
        answer: 1,
        why: "At f = f_c, |H| = 1/√2 (-3 dB) and the phase is -arctan(1) = -45°.",
      },
      {
        q: "You want to turn 1 kHz PWM from a GPIO pin into a steady DC level with little ripple. Which first-order low-pass cut-off is sensible?",
        options: ["About 10 Hz", "About 1 kHz", "About 10 kHz", "About 500 Hz"],
        answer: 0,
        why: "f_c should be well below the PWM frequency, about 100 times lower, so the 1 kHz ripple is reduced by roughly a factor of 100.",
      },
    ],
  },

  "i1-oscilloscope-generator-and-rc-filter-project": {
    id: "i1-oscilloscope-generator-and-rc-filter-project",
    outcomes: [
      "Set up an oscilloscope's vertical, horizontal and trigger controls to get a stable trace",
      "Use a function generator and know what its output impedance does to your circuit",
      "Measure amplitude ratio and phase shift between two channels",
      "Measure an RC filter's frequency response and compare it with the calculation, explaining any differences",
    ],
    blocks: [
      { t: "h", text: "Seeing what the multimeter cannot" },
      { t: "p", text: "A multimeter gives you one number: an average or an RMS value. It cannot show you the bounce on a button, the ringing on an edge, the lag through a filter or the ripple on a supply. The **oscilloscope** draws voltage against time, and the **function generator** produces the test signals. Together they turn the theory of the last three lessons into something you can see and check. This lesson teaches the instruments, then uses them for the module's exit project: build an RC filter and compare its measured response with your calculation." },

      { t: "h", text: "The oscilloscope in four groups of controls" },
      { t: "list", items: [
        "**Vertical (per channel)**: volts per division and position. Set the scale so the signal fills most of the screen height; a trace two divisions tall wastes most of the scope's resolution. Coupling is DC (shows everything) or AC (blocks the DC level with a high-pass filter, useful for small ripple on a 5 V rail).",
        "**Horizontal**: time per division and position. To see a 1 kHz signal (1 ms period), about 200 µs/div shows several cycles across a 10-division screen.",
        "**Trigger**: tells the scope when to start each sweep so successive sweeps line up. Choose the source channel, a level (a voltage partway through the signal) and a slope (rising or falling). An unstable, rolling trace almost always means the trigger level is outside the signal or on the wrong channel.",
        "**Acquisition and measurement**: Auto sets everything as a starting point; built-in measurements give frequency, peak-to-peak, RMS and phase directly. Single-shot mode captures one event, such as a single button press.",
      ] },
      { t: "p", text: "A safe starting routine: press Default Setup, connect the probe to the scope's built-in calibration output (usually a 1 kHz square wave), set the probe to ×10 on both the probe and the channel menu, and press Auto. You should see a clean square wave. If its corners overshoot or droop, adjust the probe's compensation screw until they are square. This compensates the probe's internal RC divider to match the scope input, which is the Thevenin and filter theory of this module in action." },

      { t: "h", text: "Probes: ×1, ×10 and ground" },
      { t: "p", text: "A scope input is typically 1 MΩ in parallel with about 15 pF to 20 pF. A ×1 probe adds its cable capacitance, so the circuit sees perhaps 100 pF, which is enough to slow down a 10 kΩ node noticeably (τ = 10 kΩ × 100 pF = 1 µs). A **×10 probe** contains a 9 MΩ resistor, so the circuit sees 10 MΩ and only about 10 pF to 15 pF, at the cost of dividing the signal by ten (the scope multiplies it back when set to ×10). Use ×10 by default." },
      { t: "note", kind: "safety", text: "The probe's ground clip on a mains-powered bench scope is connected to earth through the power cord. Clipping it onto any point that is not at earth potential, such as the live side of a mains circuit or a floating supply's negative rail when something else is earthed, creates a short circuit through the probe. Never probe mains circuits with a standard scope and probe. On battery and USB-powered student circuits, clip the ground to the circuit's GND." },
      { t: "p", text: "Keep the ground lead short for fast edges. The long ground clip is an inductor, and with the probe tip's capacitance it rings, showing overshoot on an edge that is actually clean. For edges in the tens of nanoseconds, use the small spring ground that fits on the probe tip." },

      { t: "h", text: "The function generator" },
      { t: "p", text: "A function generator produces sine, square and triangle waves at a set frequency, amplitude and DC offset. Most have a **50 Ω output impedance**: a Thevenin source with R_th = 50 Ω. Many also assume they drive a 50 Ω load and display the amplitude that would appear across it. Connect the generator to a high-impedance circuit and the actual voltage is **double** the displayed value, because no current is lost in the internal 50 Ω. Either set the generator's load setting to \"High Z\", or always measure the input with the scope rather than trusting the display." },
      { t: "p", text: "That 50 Ω also adds to the filter's R. With R = 1.6 kΩ it shifts f_c down by about 3%; with R = 100 Ω it would be a third. Choose filter resistors well above 50 Ω for this experiment. If you have no generator, the ESP32's built-in DAC or a PWM output through a filter can produce test tones, and the free phone or PC tone-generator apps work at audio frequencies, but a bench generator is far easier." },
      { t: "note", kind: "warn", text: "Keep the generator's output between 0 V and your board's supply if it connects to a microcontroller pin. A sine set to 2 Vpp with 0 V offset swings to -1 V, which is outside the absolute maximum rating of an ESP32 or ATmega328P pin. Add a DC offset or keep microcontroller pins out of the test." },

      { t: "h", text: "Measuring gain and phase with two channels" },
      { t: "p", text: "Put channel 1 on the filter input and channel 2 on the output, with both grounds on the circuit's GND. Trigger on channel 1. The **gain** is the ratio of the output peak-to-peak to the input peak-to-peak; use the scope's Vpp measurements, and convert to dB with 20·log₁₀. The **phase** comes from the time delay Δt between matching points on the two waveforms, such as their rising zero crossings." },
      { t: "formula", text: String.raw`Gain (dB) = 20 · log₁₀(V_out,pp / V_in,pp)
Phase (°)  = -360 · Δt / T  = -360 · Δt · f

Example at 1 kHz: Δt = 125 µs  →  phase = -360 × 125e-6 × 1000 = -45°`, caption: "Δt is positive when the output crosses later than the input, so the phase is negative (a lag)." },
      { t: "p", text: "Measure at least five frequencies across two decades, for example 100 Hz, 300 Hz, 1 kHz, 3 kHz and 10 kHz, plus extra points near f_c. At each one, adjust the time base to show two or three cycles, then read both amplitudes and the delay. Many scopes also have an X-Y mode: plotting output against input shows an ellipse whose shape encodes the phase, and a straight line means zero phase shift." },

      { t: "h", text: "The exit project: measured against calculated" },
      { t: "p", text: "Build the 1.6 kΩ and 100 nF low-pass from the last lesson on a breadboard. Drive it from the generator with a 2 Vpp sine (measure the actual input on channel 1). Record your readings in a table beside the predictions, and plot both on the same Bode plot." },
      { t: "table", head: ["f", "Predicted gain", "Measured gain", "Predicted phase", "Measured phase"], rows: [
        ["100 Hz", "-0.04 dB", "", "-5.7°", ""],
        ["300 Hz", "-0.4 dB", "", "-16.8°", ""],
        ["1 kHz", "-3.0 dB", "", "-45.2°", ""],
        ["3 kHz", "-10.0 dB", "", "-71.7°", ""],
        ["10 kHz", "-20.1 dB", "", "-84.3°", ""],
      ], caption: "Predictions for R = 1.6 kΩ, C = 100 nF (f_c = 995 Hz). Fill in the measured columns." },
      { t: "p", text: "Then find the measured f_c directly: sweep the frequency until the output is 0.707 of the input (or the phase is -45°), and read the frequency. Compare it with 995 Hz. A difference of a few per cent is normal, and part of the project is explaining it. The usual causes, in rough order of size:" },
      { t: "list", ordered: true, items: [
        "**Component tolerance.** A ±10% capacitor alone moves f_c by up to 10%. Measure C with a meter if you can and recalculate.",
        "**Generator output impedance** adding about 50 Ω to R, which lowers f_c by about 3% here.",
        "**Probe and scope loading**: 10 MΩ and about 15 pF in parallel with C, negligible at these values but not with a 1 nF capacitor and 1 MΩ resistor.",
        "**Reading error**: measuring a small output at 10 kHz needs the volts-per-division turned down so the trace fills the screen.",
      ] },
      { t: "snippet", lang: "python", code: String.raw`import math

R, C = 1600.0, 100e-9
fc = 1 / (2 * math.pi * R * C)

# Your measurements: frequency (Hz), Vin_pp (V), Vout_pp (V), delay (s, output after input)
data = [
    (100,   2.00, 1.99, 160e-6),
    (1000,  2.00, 1.40, 125e-6),
    (10000, 2.00, 0.20, 23e-6),
]

print(f"predicted fc = {fc:.0f} Hz")
print("   f     pred dB  meas dB   pred deg  meas deg")
for f, vin, vout, dt in data:
    pred_db = -10 * math.log10(1 + (f / fc) ** 2)
    pred_ph = -math.degrees(math.atan(f / fc))
    meas_db = 20 * math.log10(vout / vin)
    meas_ph = -360 * dt * f
    print(f"{f:6d}  {pred_db:7.1f}  {meas_db:7.1f}  {pred_ph:8.1f}  {meas_ph:8.1f}")`, caption: "Replace the example rows with your own readings. The example values are illustrative, not real measurements." },
      { t: "p", text: "Finish with a short report: the circuit, the predicted table, the measured table, the Bode plot with both curves, the measured f_c, and a paragraph explaining the differences with numbers. That paragraph is the real test of the module: it uses loading, source impedance, time constants and phasors together." },

      { t: "deep", title: "How the trigger and sampling actually work", blocks: [
        { t: "p", text: "A digital storage oscilloscope samples its inputs continuously into a memory buffer with an analogue-to-digital converter, typically 8 bits. A comparator watches the trigger source; when the signal crosses the trigger level in the chosen direction, the scope keeps a set number of samples before and after that instant and draws them. Because every sweep is aligned on the same crossing, repetitive signals stand still on screen." },
        { t: "p", text: "Three numbers limit what a scope can show. **Bandwidth** is the frequency at which the scope's own front end is -3 dB down; a signal at the bandwidth limit reads about 30% low, so for amplitude accuracy within a few per cent you want a bandwidth three to five times the highest frequency of interest. **Sample rate** must be several times the bandwidth to draw a sine wave clearly (and far above the signal frequency to avoid aliasing, the same effect you will meet with ADCs). **Memory depth** decides how long a window can be captured at full sample rate: 10 Mpoints at 1 GSa/s is 10 ms." },
        { t: "p", text: "The 8-bit vertical resolution means one screen height is divided into 256 levels. A signal occupying two divisions of an eight-division screen is resolved into only 64 levels, which is why filling the screen matters for small-signal measurements." },
      ] },
      { t: "deep", title: "Probe compensation as an RC divider", blocks: [
        { t: "p", text: "A ×10 passive probe is a divider: a 9 MΩ resistor in the tip, shunted by a small capacitor C_tip, feeding the scope's 1 MΩ input in parallel with the cable and input capacitance C_in. At DC the ratio is 1 MΩ / 10 MΩ = 1/10. At high frequency the capacitors dominate and the ratio is C_tip / (C_tip + C_in). The divider is flat at all frequencies only when both ratios are equal." },
        { t: "formula", text: String.raw`Flat response when  R_tip · C_tip = R_in · C_in
9 MΩ · C_tip = 1 MΩ · C_in   →   C_tip = C_in / 9`, caption: "The compensation screw adjusts a small trimmer capacitor to meet this condition." },
        { t: "p", text: "Under-compensated, the high frequencies are attenuated more than DC, so a square wave's corners are rounded. Over-compensated, they are attenuated less, and the corners overshoot. This is exactly a pair of RC time constants that must match, and it is why you compensate a probe on each channel you plug it into." },
      ] },
    ],
    mistakes: [
      "**Leaving the probe on ×1 or the channel set to the wrong attenuation.** Readings are then out by ten. Set both the probe switch and the channel menu to ×10.",
      "**Trusting the generator's amplitude display.** With a 50 Ω setting into a high-impedance circuit, the real output is twice the display. Measure the input on channel 1.",
      "**Letting the trigger wander.** If the trace rolls, set the trigger source to the input channel and the level inside the signal's range.",
      "**Clipping the probe ground to a point that is not circuit ground**, creating a short through the earth connection of the scope.",
      "**Measuring a tiny output with the volts-per-division set for the input**, losing most of the resolution. Scale each channel separately.",
      "**Driving a microcontroller pin with a generator signal that goes negative** or above the supply.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: design, build and measure an RC low-pass filter, and compare the measured response with the calculation.",
      steps: [
        "Compensate a ×10 probe on each channel using the scope's calibration output.",
        "Set the generator to a 2 Vpp sine with 0 V offset at 100 Hz, High Z load if available. Confirm the amplitude on channel 1.",
        "Build the filter (R = 1.6 kΩ, C = 100 nF, or your own design from the last lesson). Channel 1 on the input, channel 2 on the output, both grounds on GND.",
        "Measure Vin_pp, Vout_pp and the time delay at 100 Hz, 300 Hz, 1 kHz, 3 kHz and 10 kHz. Calculate gain in dB and phase.",
        "Find the measured f_c where the output is 0.707 of the input. Compare it with the calculated value.",
        "Plot predicted and measured gain and phase on one Bode plot (the Python script or a spreadsheet), and write a paragraph explaining each difference with a number.",
        "Swap R and C to make a high-pass filter, repeat three measurements, and confirm the response mirrors the low-pass.",
      ],
    },
    quiz: [
      {
        q: "A scope trace keeps rolling sideways and will not stand still. What is the most likely fix?",
        options: [
          "Increase the volts per division",
          "Set the trigger source to the channel with the signal and the trigger level inside the signal's range",
          "Switch the probe from ×10 to ×1",
          "Turn the generator amplitude up to maximum",
        ],
        answer: 1,
        why: "A stable display needs each sweep to start at the same point on the waveform, which needs a trigger level the signal actually crosses on the right channel.",
      },
      {
        q: "A generator with a 50 Ω output displays 1 Vpp (assuming a 50 Ω load). It drives a filter with an input impedance of several kilohms. What does the scope show at the input?",
        options: ["About 0.5 Vpp", "About 1 Vpp", "About 2 Vpp", "0 V"],
        answer: 2,
        why: "The display assumes half the internal voltage is lost in the 50 Ω source. With a high-impedance load almost nothing is lost, so the actual voltage is about twice the displayed value.",
      },
      {
        q: "At 2 kHz, the output of a filter crosses zero 50 µs after the input. What is the phase shift?",
        options: ["-18°", "-36°", "-72°", "-90°"],
        answer: 1,
        why: "Phase = -360 × Δt × f = -360 × 50 × 10⁻⁶ × 2000 = -36°.",
      },
      {
        q: "Why is a ×10 probe usually preferred over ×1?",
        options: [
          "It makes signals ten times larger",
          "It loads the circuit far less, about 10 MΩ and around 10 pF instead of 1 MΩ and around 100 pF",
          "It removes the need for a ground clip",
          "It increases the scope's sample rate",
        ],
        answer: 1,
        why: "The probe's internal divider raises the input impedance and reduces the capacitance the circuit sees, so it disturbs the circuit less. The scope multiplies the reading back by ten.",
      },
      {
        q: "Your measured f_c comes out 8% below the calculated value. Which explanation is most likely to account for most of it?",
        options: [
          "Kirchhoff's laws do not hold at 1 kHz",
          "The capacitor's actual value is above its marked value, within its tolerance",
          "The scope's 8-bit resolution",
          "The trigger level was set too high",
        ],
        answer: 1,
        why: "f_c = 1/(2πRC), so a capacitor 8% high lowers f_c by about 8%. Capacitor tolerances of ±10% are common, so this is the usual main cause.",
      },
    ],
  },
};

export default lessons;
