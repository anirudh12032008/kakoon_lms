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
};

export default lessons;
