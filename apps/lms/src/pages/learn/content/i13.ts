import type { ModuleContent } from "../model/curriculum";

/**
 * Module i13: Electronics design practice.
 * KiCad menu paths are for KiCad 10.0 (stable line released March 2026).
 * Normal mode is complete on its own; `deep` sections hold detail and background.
 */
const lessons: ModuleContent = {
  "i13-schematics-and-kicad": {
    id: "i13-schematics-and-kicad",
    outcomes: [
      "Read a schematic: symbols, nets, labels, power symbols and reference designators",
      "Draw a clear schematic in KiCad 10 that someone else can follow",
      "Run the electrical rules check and fix its common errors, including missing power flags",
      "Assign footprints so the schematic is ready for a PCB",
    ],
    blocks: [
      { t: "h", text: "Why a schematic comes first" },
      { t: "p", text: "A breadboard circuit lives in your head and in a tangle of jumper wires. Pull one wire and nobody, including you a month later, knows how to put it back. A **schematic** is the circuit's source code: it records what connects to what, the value and rating of every part, and the intent behind it, in a form that others can check, that a PCB tool can turn into copper, and that you can debug from. Professional engineers argue about a schematic long before any board is made, because a mistake caught on paper costs nothing." },
      { t: "p", text: "A schematic is not a picture of the layout. Parts are arranged so that the **function** is clear: signals flow left to right, higher voltages at the top, ground at the bottom. Where the parts sit on the board is a separate decision made later in the PCB editor." },

      { t: "h", text: "The vocabulary of a schematic" },
      { t: "list", items: [
        "**Symbol**: the drawing of a part (zigzag or box for a resistor, two plates for a capacitor, triangle and bar for a diode, a rectangle with named pins for an IC). Each symbol has **pins** with numbers that match the real part's pins.",
        "**Reference designator**: the unique name of each part on the board. R for resistors, C capacitors, L inductors, D diodes (LED is often D too), Q transistors, U integrated circuits, J connectors, SW switches, F fuses, Y crystals. R1, R2, C1 and so on. These are printed on the board's silkscreen so you can find the part.",
        "**Value**: 10k, 100n, 1N4148, ATmega328P. Write resistances as 4k7 rather than 4.7k on silkscreen, because a decimal point can be lost in printing.",
        "**Wire** and **net**: a wire is a drawn line; a net is the set of all pins electrically joined, whether by wires, labels or power symbols. The PCB tool works with nets.",
        "**Junction**: a dot where wires join. Two wires crossing without a dot are not connected. Avoid four-way junctions; offset them into two T-junctions so a missing dot cannot be misread.",
        "**Net label**: a name attached to a wire. Every wire with the same label is the same net, even on the opposite side of the sheet. Labels such as `SDA`, `SCL`, `MOTOR_PWM` replace long wires and document the signal.",
        "**Power symbols**: GND, +5V, +3V3. In KiCad these are global labels in disguise: every +3V3 symbol joins the same net.",
      ] },
      { t: "diagram", text: String.raw`
   +5V                      +3V3
    │                        │
   [R1 10k]                 [R2 4k7]
    │                        │
    ├──── BUTTON ◄ label     ├──── SDA ◄ label
    │                        │
   [SW1]                    (to U1 pin 27)
    │
   GND`, caption: "Labels and power symbols join nets without drawn wires." },

      { t: "h", text: "KiCad 10 and the design flow" },
      { t: "p", text: "This module uses **KiCad 10.0**, the stable release line since March 2026 (point releases 10.0.x follow; any 10.0.x behaves the same for this lesson). KiCad is free, open source, runs on Windows, macOS and Linux, and is used professionally. A KiCad **project** (`.kicad_pro`) holds a schematic (`.kicad_sch`) and a board (`.kicad_pcb`). Open the project from the KiCad project manager, then open the Schematic Editor from it." },
      { t: "list", ordered: true, items: [
        "**Place symbols**: Place → Add Symbol (shortcut A; the KiCad 10 manual lists these Place actions as Place Symbols, Place Power Symbols, Draw Wires, Place Net Labels and Place No Connect Flags, and the menu wording can differ slightly between versions, but the shortcuts A, P, W, L and Q do not). Search the libraries, for example `Device:R` for a generic resistor or `MCU_Microchip_ATmega:ATmega328P-P`. Rotate with R, mirror with X or Y, move with M.",
        "**Place power symbols**: Place → Add Power (shortcut P), then choose GND, +5V and so on.",
        "**Draw wires**: Place → Add Wire (shortcut W). Click on a pin end to start and end a wire. A wire end not on a pin shows a small circle until it is connected.",
        "**Add labels**: Place → Add Label (shortcut L) for a local label on this sheet; global labels connect across sheets.",
        "**Mark unused pins**: Place → Add No Connect Flag (shortcut Q) on any IC pin you deliberately leave open, so the check knows it is intentional.",
        "**Annotate**: Tools → Annotate Schematic gives every R? and C? a number.",
        "**Set values and properties**: double-click a symbol (or press E) to edit value, footprint and fields such as a supplier part number.",
        "**Electrical rules check**: Inspect → Electrical Rules Checker, then Run ERC.",
        "**Assign footprints**: Tools → Assign Footprints opens the footprint assignment tool, which pairs each symbol with a physical pad pattern.",
        "**Send to the board**: in the PCB Editor, Tools → Update PCB from Schematic (F8).",
      ] },
      { t: "note", kind: "tip", text: "Set the grid to 50 mil (1.27 mm, the default) and keep it there in the schematic. Pins of library symbols sit on that grid; a wire drawn on a finer grid can miss a pin by a fraction and look connected when it is not. ERC reports these as unconnected pins." },

      { t: "h", text: "The electrical rules check" },
      { t: "p", text: "ERC knows each pin's **electrical type**: input, output, bidirectional, passive, power input, power output, open collector, not connected. It then looks for combinations that are probably wrong. The common results:" },
      { t: "table", head: ["ERC message (paraphrased)", "What it means", "Fix"], rows: [
        ["Pin not connected", "A pin has nothing on it", "Wire it, or add a no-connect flag if deliberate"],
        ["Input power pin not driven by any output power pins", "A power-input pin (an IC's VCC) is on a net that nothing declares as a source", "Add a PWR_FLAG to that net if it really is powered from a connector or battery"],
        ["Pins of type output and output are connected", "Two outputs fight each other", "Usually a real error; check the circuit"],
        ["Label not connected / dangling wire", "A label or wire end touches nothing", "Connect it or delete it"],
        ["Different net names on one net", "Two labels on the same wire", "Keep one name"],
      ] },
      { t: "p", text: "**Power flags** confuse almost everyone at first. Your 5 V may come in through a USB connector, a barrel jack or a battery clip. Those connector pins are passive: KiCad does not know they supply power. So when ERC sees the microcontroller's VCC (a power input) on a net with no power output, it complains. Placing the `PWR_FLAG` symbol (from Place → Add Power, search PWR_FLAG) on the net tells ERC \"this net is driven from outside\". Typically you need one on +5V, one on GND and one on any other supply net that enters through a connector. A regulator's output pin is already a power output, so its net does not need a flag." },
      { t: "p", text: "ERC catches drawing mistakes, not design mistakes. It will not tell you that an LED has no current-limiting resistor or that a 5 V signal goes into a 3.3 V ESP32 pin. A clean ERC is a minimum, not a proof." },

      { t: "h", text: "Habits of a readable schematic" },
      { t: "list", items: [
        "Inputs on the left, outputs on the right, supplies at the top, ground at the bottom.",
        "Put each decoupling capacitor next to the IC power pin it serves, and say so (\"C3 at U1 pin 7\").",
        "Use labels for buses and long runs instead of wires crossing the whole sheet.",
        "Group the circuit into blocks (power, MCU, sensors, connectors) with a text heading for each.",
        "Put voltages, current limits and notes as text where a reviewer would wonder (\"max 500 mA from USB\").",
        "Fill in a title block: File → Page Settings sets title, revision and date.",
      ] },

      { t: "deep", title: "Pin electrical types and the ERC matrix", blocks: [
        { t: "p", text: "In Schematic Setup (File → Schematic Setup), the Pin Conflicts Map is a grid of every pin type against every other type, each cell set to no error, warning or error. Output to output is an error. Open collector to open collector is fine (that is how I2C wired-AND works). Bidirectional to output is a warning. Passive to anything is fine, which is why resistors never cause conflicts, and also why passive connector pins never satisfy a power input. If you make your own symbol, setting pin types correctly is what makes ERC useful: a symbol with every pin passive passes ERC whatever you connect." },
        { t: "p", text: "Under Electrical Rules → Violation Severity you can change individual checks. Resist turning errors off to get a clean report; exclude a specific violation instead (right-click it in the ERC dialog → Exclude) and add a comment, so the reason is recorded." },
      ] },
      { t: "deep", title: "Hierarchical sheets in brief", blocks: [
        { t: "p", text: "A large design is split into sheets: Place → Add Hierarchical Sheet draws a box representing a sub-sheet, and hierarchical pins on its edge connect to hierarchical labels inside it. A power supply drawn once on its own sheet can then be reused. For a first project a single A4 sheet is enough. Module a3 uses hierarchy properly." },
        { t: "p", text: "Even on one sheet, the habit that hierarchy enforces is worth copying: draw each functional block (power, MCU, sensor, connector) in its own boxed area and connect the blocks only through labelled nets. The schematic then reads as a block diagram at a glance." },
      ] },
    ],
    mistakes: [
      "**Wires that look connected but are not.** An off-grid wire end or a wire passing through a pin without ending on it. ERC reports the pin as unconnected; zoom in and check.",
      "**Disabling ERC errors instead of fixing them.** Especially the power-input error: add PWR_FLAG where a supply enters, do not silence the check.",
      "**Drawing the schematic like the breadboard.** Arrange by function, not by physical position, or the schematic becomes as hard to read as the wiring.",
      "**Four-way junctions.** A missing dot turns a connection into a crossing. Use T-junctions.",
      "**Same label spelt two ways.** `SDA` and `I2C_SDA` are two different nets; the PCB will have them unconnected.",
    ],
    practice: {
      kind: "bench",
      task: "Draw your own project's circuit in KiCad 10 and get a clean ERC.",
      steps: [
        "Install KiCad 10.0.x from kicad.org. Create a new project named after your project.",
        "Draw the circuit of one of your beginner or intermediate projects: the microcontroller board as a connector or module symbol, plus sensors, LEDs, resistors and connectors.",
        "Use power symbols and labels for every supply and bus. Add PWR_FLAG where power enters. Annotate.",
        "Run Inspect → Electrical Rules Checker. Fix every error and warning, or exclude it with a written reason.",
        "Print the sheet to PDF (File → Plot) and ask a classmate to trace one signal from the sensor to the microcontroller pin without your help.",
      ],
    },
    quiz: [
      {
        q: "Two wires cross on a schematic with no junction dot. Are they connected?",
        options: ["Yes, crossing wires always connect", "No, a connection needs a junction (or the wires to end on each other)", "Only if they carry the same voltage", "Only on a PCB"],
        answer: 1,
        why: "Crossing without a dot means no connection. That is why four-way junctions are avoided: a lost dot would change the meaning.",
      },
      {
        q: "ERC says the microcontroller's VCC power input is not driven, but the board is powered from a USB connector. What is the correct fix?",
        options: ["Delete the VCC pin", "Turn the error off in the severity settings", "Place a PWR_FLAG on the +5V net", "Change the connector to a regulator"],
        answer: 2,
        why: "Connector pins are passive, so ERC cannot know they supply power. PWR_FLAG declares that the net is driven from outside.",
      },
      {
        q: "Two wires in different corners of the sheet both carry the label `SCL`. What does KiCad do?",
        options: ["Treats them as two separate nets", "Connects them into one net", "Reports an error", "Joins them only if a wire is drawn too"],
        answer: 1,
        why: "Wires with the same label on a sheet are the same net. That is the purpose of labels.",
      },
      {
        q: "A schematic has a clean ERC. Which of these could still be wrong?",
        options: [
          "A pin with nothing connected",
          "Two outputs connected together",
          "An LED driven from a GPIO with no current-limiting resistor",
          "A dangling label",
        ],
        answer: 2,
        why: "ERC checks connections and pin types, not circuit design. A missing resistor connects legally and passes.",
      },
      {
        q: "What is the reference designator prefix for an integrated circuit and for a connector?",
        options: ["IC and C", "U and J", "Q and P", "M and K"],
        answer: 1,
        why: "U is used for integrated circuits and J for connectors. Q is transistors, C capacitors.",
      },
    ],
  },

  "i13-component-selection": {
    id: "i13-component-selection",
    outcomes: [
      "Choose between through-hole and surface-mount packages and read SMD size codes",
      "Select resistors and capacitors by value, tolerance, power and voltage rating with derating",
      "Read the key limits on a datasheet's absolute maximum and recommended operating tables",
      "Source parts in India and write a bill of materials with real part numbers",
    ],
    blocks: [
      { t: "h", text: "A value is not a part" },
      { t: "p", text: "\"10 kΩ resistor\" describes a value. To buy and build it you need much more: a package that fits your board and your soldering skill, a tolerance good enough for the job, a power rating that keeps it cool, and a supplier who has it in stock. Most failures in student projects are not wrong values but wrong ratings: a capacitor at its voltage limit, a regulator that overheats, a resistor that slowly browns. This lesson is about choosing parts that survive." },

      { t: "h", text: "Packages" },
      { t: "p", text: "**Through-hole (THT)** parts have leads that pass through holes in the board and are soldered on the far side: axial resistors, radial electrolytics, DIP ICs with 2.54 mm (0.1 inch) pin pitch, TO-220 regulators. They are easy to solder by hand, strong mechanically, and fit breadboards and perfboard. **Surface-mount (SMD)** parts sit on pads on the surface. They are much smaller, cheaper in volume, and suit machine assembly; most modern ICs are only made in SMD packages." },
      { t: "table", head: ["Package code", "Size (mm)", "Typical use", "Hand soldering"], rows: [
        ["1206", "3.2 × 1.6", "Resistors, capacitors", "Easy"],
        ["0805", "2.0 × 1.25", "Resistors, capacitors", "Easy with tweezers; good first SMD"],
        ["0603", "1.6 × 0.8", "Resistors, capacitors", "Possible with practice and magnification"],
        ["0402", "1.0 × 0.5", "Dense boards", "Hard; machine assembly"],
        ["SOT-23", "2.9 × 1.3 body", "Small transistors, regulators", "Moderate"],
        ["SOIC-8", "4.9 × 3.9 body, 1.27 mm pitch", "Op-amps, EEPROMs, drivers", "Moderate, drag solder"],
        ["TSSOP / QFN", "0.65 mm or 0.5 mm pitch", "Microcontrollers, sensors", "Hard; QFN needs hot air"],
      ], caption: "Chip sizes are in imperial codes: 0805 means 0.08 × 0.05 inch." },
      { t: "note", kind: "warn", text: "Chip codes are imperial by default. A metric 0603 (0.6 × 0.3 mm) is the imperial 0201, tiny. When a listing says \"0603\", check whether it means 1.6 × 0.8 mm (imperial 0603) before ordering." },

      { t: "h", text: "Resistors: tolerance, power and derating" },
      { t: "p", text: "**Tolerance** is how far the real value can be from the marked value: 5% carbon film, 1% metal film. 1% parts now cost almost the same as 5%, so use 1% by default. Values come from the E-series: E12 (10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82) for 5%, E24 and E96 for tighter tolerances." },
      { t: "p", text: "**Power rating**: a resistor dissipates P = I² × R = V² / R. Typical ratings are 0.25 W for a common axial THT resistor, 0.125 W for 0805, 0.1 W for 0603 and 0.25 W for 1206 (check the datasheet; ratings vary by maker). **Derate**: design for at most half the rating, because ratings assume 70 °C ambient with good cooling, and a resistor at full rating runs over 100 °C." },
      { t: "p", text: "Worked example. An LED with a 2.0 V forward drop runs at 10 mA from 5 V. R = (5 - 2.0) / 0.010 = 300 Ω; choose the next E12 value up, 330 Ω. Then I = 3.0 / 330 = 9.09 mA and P = 3.0 × 0.00909 = 27 mW. An 0805 (125 mW, so 62 mW derated) is comfortable. Now a 100 Ω resistor directly across 5 V as a load for testing: P = 25 / 100 = 0.25 W. That is twice an 0805's rating, and exactly a quarter-watt THT resistor's full rating. It needs a 0.5 W or 1 W part to stay within the half-rating rule." },

      { t: "h", text: "Capacitors" },
      { t: "table", head: ["Type", "Range", "Good for", "Watch out for"], rows: [
        ["Ceramic C0G / NP0", "pF to about 10 nF", "Timing, filters, crystals", "Small values only"],
        ["Ceramic X7R / X5R", "nF to tens of µF", "Decoupling, bulk on SMD boards", "Capacitance falls with DC voltage"],
        ["Aluminium electrolytic", "1 µF to many mF", "Bulk supply storage", "Polarised; wears out with heat; ESR"],
        ["Tantalum", "µF range", "Compact bulk", "Polarised; fails short, sometimes burning, if over-voltaged"],
      ] },
      { t: "p", text: "**Voltage rating**: choose at least 1.5 to 2 times the highest voltage the capacitor sees, more for tantalum. A 16 V electrolytic is a sensible minimum on a 7.4 V battery rail; 10 V would be too close once the pack is fully charged at 8.4 V and motor spikes are added. Class II ceramics (X7R, X5R) lose a large part of their capacitance under DC bias: a 10 µF 6.3 V 0603 can be closer to 3 to 4 µF at 5 V. Use a higher voltage rating or a larger package when the actual capacitance matters." },

      { t: "h", text: "Reading a datasheet's limits" },
      { t: "p", text: "Every active part's datasheet has two tables that matter. **Absolute maximum ratings** are limits beyond which the part may be damaged. They are not operating conditions; running at them shortens life or is simply not guaranteed. **Recommended operating conditions** are where the part is specified to work. Design inside the recommended range with margin. For example, a part with an absolute maximum supply of 6 V and a recommended range of 1.8 to 5.5 V should run at 5 V, not 6 V. Check the pin voltage limits too: the ESP32's GPIOs are 3.3 V parts, and a 5 V signal is outside their limits." },
      { t: "p", text: "For anything that gets warm (regulators, motor drivers, MOSFETs), compute dissipation and temperature rise. A linear regulator dropping 12 V to 5 V at 200 mA dissipates (12 - 5) × 0.2 = 1.4 W. With a junction-to-ambient thermal resistance of 65 °C/W for a TO-220 without a heatsink, the rise is 1.4 × 65 = 91 °C; at 35 °C ambient the junction reaches 126 °C, near the typical 125 °C limit. Use a heatsink, a lower input voltage, or a buck converter." },

      { t: "h", text: "Sourcing in India" },
      { t: "list", items: [
        "**Robu.in** and **Robocraze**: Indian hobby suppliers, fast delivery, modules, motors, sensors, development boards. Good for prototypes; check that the listing names the actual part number, not only \"sensor module\".",
        "**LCSC**: the parts store linked to JLCPCB. Very large range of SMD parts at low prices, each with a C-number used for JLCPCB assembly. Ships to India with customs duty added.",
        "**Mouser India** and **DigiKey India**: authorised distributors with full datasheets and genuine parts; prices in rupees with duties shown, free shipping above an order threshold. Use them for anything where a fake would hurt (regulators, MCUs, Li-ion protection ICs).",
        "**Local markets** such as Lamington Road in Mumbai or SP Road in Bengaluru, and local shops in Bhopal for common through-hole parts on the same day.",
      ] },
      { t: "p", text: "Write a **bill of materials (BOM)** with, for each line: reference designators, quantity, value, package or footprint, manufacturer part number, supplier and supplier part number, unit price. The manufacturer part number is the single most useful field: it lets anyone buy exactly the same part anywhere." },
      { t: "note", kind: "warn", text: "Counterfeit and remarked chips are common on marketplaces. A fake AMS1117 or Li-ion protection IC may work on the bench and fail under load. Buy safety-relevant parts from authorised distributors." },

      { t: "deep", title: "Why derating works: temperature and life", blocks: [
        { t: "p", text: "Most failure mechanisms in components speed up with temperature roughly according to the Arrhenius relation: as a rough rule, life halves for every 10 °C rise. An aluminium electrolytic rated 2000 hours at 105 °C lasts about 2000 × 2^((105 - 45)/10) = 2000 × 64 = 128000 hours (about 15 years) at 45 °C. A resistor's power derating curve is flat to 70 °C ambient and falls linearly to zero at 155 °C for typical thick-film chips, which is why the same part carries less power in a hot enclosure." },
        { t: "p", text: "Derating also covers what the datasheet does not tell you: tolerance on your own calculation, supply spikes, a hot day. Industry guidelines such as those used for aerospace go further (for example, ceramic capacitors at 50% of rated voltage, resistors at 50% of rated power, semiconductors kept well below their maximum junction temperature). For student work the half-power and 1.5 to 2 times voltage rules capture most of the benefit." },
      ] },
      { t: "deep", title: "E-series and choosing resistor pairs for a divider", blocks: [
        { t: "p", text: "E-series values are spaced evenly on a logarithmic scale, so the ratio between neighbours is constant: E12 steps by 10^(1/12) ≈ 1.21, E24 by 10^(1/24) ≈ 1.10, E96 by 10^(1/96) ≈ 1.024. To get a 0.4 divider ratio (for example 8.4 V battery to 3.36 V for the ESP32 ADC), you need R2 / (R1 + R2) = 0.4, so R1 = 1.5 × R2. In E12, 15k and 10k give exactly 0.4. With 1% resistors the worst-case ratio is between 0.395 and 0.405. Always check the worst case against the ADC's absolute maximum: at 8.4 V the high-ratio corner gives 3.40 V, above the 3.3 V supply and inside the usual 0.3 V allowance only just, so a lower ratio such as 33k over 20k (20 / 53 = 0.377, giving 3.17 V at 8.4 V) is safer." },
        { t: "p", text: "A second consideration is the divider's resistance. A divider of tens of kilohms draws only a fraction of a milliamp from the battery, but the ADC's sampling capacitor sees it as a source resistance; a 100 nF capacitor from the ADC pin to ground gives the sampler a low-impedance source without changing the DC ratio." },
      ] },
    ],
    mistakes: [
      "**Choosing a resistor by value only.** A 100 Ω 0805 across 5 V dissipates 0.25 W, twice its rating.",
      "**A capacitor rated exactly at the supply voltage.** Spikes and charged batteries exceed it. Use 1.5 to 2 times.",
      "**Treating absolute maximum ratings as operating limits.** Design inside the recommended operating conditions.",
      "**Confusing imperial and metric chip codes.** Metric 0603 is far smaller than imperial 0603.",
      "**Buying a \"module\" with no part number.** You cannot find its datasheet, so you cannot check its ratings.",
      "**Ignoring DC bias on X5R/X7R ceramics.** The capacitance you get can be half or less of the marking.",
    ],
    practice: {
      kind: "bench",
      task: "Write a full bill of materials for your exit-project board.",
      steps: [
        "List every part in your project's schematic with its reference designator.",
        "For each resistor compute the worst-case dissipation and choose a package that keeps it under half its rating.",
        "For each capacitor note the highest voltage it sees and choose a rating at least 1.5 times that.",
        "Find a real manufacturer part number for each line on Mouser India, DigiKey India or LCSC, and a hobby-supplier alternative where one exists.",
        "Add prices and total the BOM for one board and for five boards. Note which parts dominate the cost.",
      ],
    },
    quiz: [
      {
        q: "A 220 Ω resistor has 5 V across it. What package is the smallest that respects the half-rating rule?",
        options: ["0603 (0.1 W)", "0805 (0.125 W)", "1206 (0.25 W)", "A 0.5 W THT resistor"],
        answer: 2,
        why: "P = 25 / 220 = 0.114 W. Half-ratings: 0603 gives 0.05 W and 0805 0.0625 W, both too small; 1206 gives 0.125 W, which covers 0.114 W. The 0.5 W part works too but is not the smallest.",
      },
      {
        q: "What does the package code 0805 describe?",
        options: ["0.8 × 0.5 mm", "0.08 × 0.05 inch, about 2.0 × 1.25 mm", "A resistor of 0.805 Ω", "An 8-pin package with 0.5 mm pitch"],
        answer: 1,
        why: "Chip codes are imperial dimensions in hundredths of an inch by default: 0.08 × 0.05 inch.",
      },
      {
        q: "Which voltage rating would you choose for an electrolytic capacitor on a 2S Li-ion rail (8.4 V when full)?",
        options: ["6.3 V", "10 V", "16 V", "8.4 V"],
        answer: 2,
        why: "Use 1.5 to 2 times the maximum: 12.6 to 16.8 V. 16 V is the sensible standard value; 10 V gives too little margin.",
      },
      {
        q: "A linear regulator drops 9 V to 5 V at 300 mA. How much power does it dissipate?",
        options: ["1.5 W", "2.7 W", "0.3 W", "1.2 W"],
        answer: 3,
        why: "P = (9 - 5) × 0.3 = 1.2 W, all turned to heat in the regulator.",
      },
      {
        q: "Where should you buy a lithium battery protection IC for a robot?",
        options: [
          "Any marketplace listing with the lowest price",
          "An authorised distributor such as Mouser India or DigiKey India",
          "Salvaged from an old phone",
          "It does not matter for a protection IC",
        ],
        answer: 1,
        why: "Safety-relevant parts should be genuine. Authorised distributors guarantee the part matches its datasheet.",
      },
    ],
  },

  "i13-soldering-and-construction": {
    id: "i13-soldering-and-construction",
    outcomes: [
      "Make reliable through-hole joints and recognise bad ones",
      "Solder 0805 and SOIC surface-mount parts with an iron",
      "Choose solder, flux and iron temperature, and work safely with fumes and heat",
      "Plan and build a circuit on perfboard or stripboard",
    ],
    blocks: [
      { t: "h", text: "Why soldering is a design skill" },
      { t: "p", text: "A breadboard is for an afternoon. Its contacts loosen, wires fall out when a robot vibrates, and stray capacitance between strips upsets fast signals. A soldered joint is permanent, low-resistance and mechanically strong, if it is made properly. A bad joint is worse than a breadboard: it can work on the bench, fail when warm, and look fine. Learning to make and inspect joints, and to plan a board so it is easy to build, saves you more debugging time than any instrument." },

      { t: "h", text: "How a solder joint works" },
      { t: "p", text: "Solder does not glue parts together. When molten solder touches clean, hot copper, tin from the solder reacts with the copper to form a thin **intermetallic** layer that bonds the two metals. For that to happen, both surfaces must be hot enough and free of oxide. **Flux** removes oxide and stops it reforming while you heat. Most electronics solder wire has flux in its core; extra flux from a pen or syringe makes SMD work much easier." },
      { t: "table", head: ["Solder", "Melting point", "Iron tip temperature (typical)", "Notes"], rows: [
        ["Sn63/Pb37 (leaded, eutectic)", "183 °C", "315 to 340 °C", "Easiest to use; shiny joints; contains lead"],
        ["Sn60/Pb40 (leaded)", "183 to 190 °C", "320 to 345 °C", "Common in Indian shops"],
        ["SAC305 (lead-free: Sn96.5 Ag3 Cu0.5)", "217 to 220 °C", "350 to 370 °C", "RoHS compliant; duller joints; needs more heat"],
      ] },
      { t: "p", text: "Use a temperature-controlled iron (a station or a TS100/Pinecil style iron), a chisel tip about 2 mm wide for most work, 0.6 to 0.8 mm solder wire, a damp sponge or brass wool, and flux. Higher temperatures than the table are not better: they burn off the flux before it works, oxidise the tip and can lift pads off the board." },
      { t: "note", kind: "safety", text: "The iron tip is at 350 °C: always return it to its stand, never hand it to someone, and keep the cable away from the tip. Flux fumes irritate the lungs: work with a fume extractor or a fan blowing fumes away from your face and an open window. Leaded solder is toxic if swallowed: do not eat at the bench and wash your hands afterwards. Wear safety glasses when cutting leads, which fly off at speed." },

      { t: "h", text: "Through-hole technique" },
      { t: "list", ordered: true, items: [
        "Insert the part, bend the leads slightly outwards so it stays put, and flip the board.",
        "Clean and tin the tip with a little solder so heat transfers well.",
        "Touch the tip so it contacts both the pad and the lead at once. Wait about one second.",
        "Feed solder into the joint on the opposite side from the tip, not onto the tip. It should flow around the lead and across the pad.",
        "Remove the solder, then the iron, after 2 to 3 seconds total. Do not move the part while the joint cools.",
        "Trim the lead just above the joint with flush cutters.",
      ] },
      { t: "p", text: "A good joint is a smooth, concave cone (like a small volcano) with the solder wetting both the pad and the lead, and the outline of the lead visible. A **cold joint** is dull, grainy or balled, with solder sitting on the lead without wetting the pad: reheat with fresh flux. A **dry joint** has too little solder. A **bridge** joins two neighbouring pads: remove the excess with a clean tip or desoldering braid and flux." },

      { t: "h", text: "Basic surface-mount" },
      { t: "p", text: "0805 resistors and capacitors and SOIC chips are well within reach of an iron. You need fine tweezers, flux, good light and ideally a magnifier or a cheap USB microscope." },
      { t: "list", items: [
        "**Two-terminal parts (0805):** put a small blob of solder on one pad. Hold the part with tweezers, reheat the blob and slide the part in so one end sits in it. Let it cool, check alignment, then solder the other end normally and touch up the first.",
        "**SOIC and similar:** tack one corner pin, check that every pin lines up with its pad, tack the opposite corner, then solder the rest. For fine pitch, flood the pins with flux and drag a loaded tip slowly along the row (drag soldering); surface tension pulls solder onto each pin. Clear bridges with braid and flux.",
        "**Clean up:** remove flux residue with isopropyl alcohol and a brush, then inspect every pin under magnification.",
      ] },
      { t: "note", kind: "warn", text: "Many SMD parts, MOSFETs and sensors are damaged by static discharge. Touch a grounded metal object before handling them, keep them in their bags until needed, and use an ESD mat and wrist strap if you have them." },

      { t: "h", text: "Perfboard and stripboard" },
      { t: "p", text: "**Perfboard** (dot board) has a 2.54 mm grid of holes, each with its own isolated copper pad. You make every connection yourself with bent leads, tinned copper wire or insulated wire on the back. **Stripboard** (Veroboard) has long copper strips joining rows of holes; you cut the strips where connections must stop, using a spot-face cutter or a 3 to 4 mm drill bit turned by hand. Stripboard is faster for circuits that suit rows (an IC with its pins along strips); perfboard is more flexible." },
      { t: "list", ordered: true, items: [
        "**Plan on paper or in software first** (a stripboard planner, or graph paper with the grid drawn). Mark strip cuts with an X. Check every net from the schematic against the plan.",
        "Under a DIP IC on stripboard, cut every strip between the two rows of pins, or the opposite pins short together.",
        "Put a **socket** under ICs so they can be replaced and are not heated.",
        "Run power and ground along the edges like rails, and place a 100 nF ceramic capacitor at each IC's supply pins.",
        "Use headers or screw terminals for every off-board connection, never wires soldered straight to the board that will be flexed.",
        "After building, check with a multimeter's continuity mode that neighbouring strips are not shorted and that the supply rails are not shorted to each other, **before** applying power.",
      ] },

      { t: "deep", title: "What goes wrong inside a bad joint", blocks: [
        { t: "p", text: "The intermetallic layer (mainly Cu6Sn5) is only about 1 to 4 µm thick in a good joint. Too little heat and it does not form: the solder is held by surface contact only and cracks under thermal cycling. Too much heat or time and it grows thick and brittle, and on lead-free joints the copper pad can dissolve. Thermal cycling (a robot driver warming and cooling every run) fatigues joints on heavy parts; that is why large components are glued or clamped and why through-hole is preferred for connectors that take force." },
        { t: "p", text: "Leaded and lead-free solder do not mix well: a lead-free joint contaminated with lead can form a low-melting phase that weakens it. When reworking a factory lead-free board, either use lead-free solder or remove the old solder completely with braid first." },
      ] },
      { t: "deep", title: "Hot air and solder paste", blocks: [
        { t: "p", text: "QFN and other bottom-terminated packages cannot be reached with an iron. The usual method is solder paste (fine solder powder in flux) applied through a stencil or by syringe, the part placed on top, and the board heated with a hot-air station or a hotplate until the paste reflows (for leaded paste about 210 to 230 °C peak, for SAC305 about 240 to 250 °C). Surface tension self-centres the part. A cheap hotplate is a surprisingly good first reflow tool for small boards." },
        { t: "p", text: "Paste should be kept in a refrigerator and brought to room temperature before use, and it has a limited shelf life once opened. Hot air also lets you remove parts: heat all pins evenly until the solder melts and lift the part with tweezers, protecting neighbouring plastic parts with aluminium tape." },
      ] },
    ],
    mistakes: [
      "**Melting solder on the tip and carrying it to the joint.** The flux burns off on the way; heat the joint and feed solder into it.",
      "**Turning the iron up to fix poor joints.** The real cause is usually a dirty tip or no flux; high temperature makes it worse.",
      "**Forgetting the strip cuts under a DIP IC on stripboard.** Opposite pins short together.",
      "**Powering a new board without a continuity check.** A rail-to-rail short can destroy a regulator or a USB port.",
      "**Moving a part while the solder freezes.** This causes a disturbed, grainy joint.",
      "**No ventilation.** Flux fumes are a real respiratory irritant over a long session.",
    ],
    practice: {
      kind: "bench",
      task: "Build one sensor circuit from your projects on stripboard and inspect every joint.",
      steps: [
        "Plan the layout on graph paper or a stripboard planner, with strip cuts marked. Check each net against your KiCad schematic.",
        "Solder ten practice joints on a scrap board at 330 °C (leaded) or 360 °C (lead-free); cut one open with cutters and examine it.",
        "Build the circuit with sockets for ICs and headers for connections to the microcontroller board.",
        "Inspect every joint under a magnifier; rework any dull or balled ones.",
        "Check continuity between neighbouring strips and between supply rails, then power it from a bench supply with a 100 mA current limit and measure the supply current.",
      ],
    },
    quiz: [
      {
        q: "Why is flux needed when soldering?",
        options: [
          "It lowers the melting point of solder",
          "It removes oxide from the metal and prevents new oxide forming, so solder can wet the surfaces",
          "It glues the part in place",
          "It cools the joint quickly",
        ],
        answer: 1,
        why: "Solder can only bond to clean metal. Flux strips oxide and protects the surface while it is hot.",
      },
      {
        q: "A joint is dull, grainy and the solder sits as a ball on the lead without spreading over the pad. What is it and what do you do?",
        options: ["A good joint; leave it", "A cold joint; reheat it with fresh flux", "A bridge; cut the track", "A dry joint; add epoxy"],
        answer: 1,
        why: "Poor wetting and a dull, grainy finish are the signs of a cold joint. Reheat with flux so the solder wets both surfaces.",
      },
      {
        q: "What tip temperature suits SAC305 lead-free solder (melting about 217 to 220 °C)?",
        options: ["200 °C", "250 °C", "About 350 to 370 °C", "Above 450 °C"],
        answer: 2,
        why: "The tip must be well above the melting point to heat the joint quickly. About 350 to 370 °C works; much hotter burns flux and lifts pads.",
      },
      {
        q: "You put a DIP-8 IC across stripboard strips without cutting them. What happens?",
        options: [
          "Nothing, stripboard isolates each hole",
          "Each pin on one side is shorted to the opposite pin on the other side",
          "The IC is shorted only at its supply pins",
          "The IC runs hotter but works",
        ],
        answer: 1,
        why: "Each strip runs under both rows, joining pin 1 to pin 8, 2 to 7 and so on. Cut the strips between the rows.",
      },
      {
        q: "What is the best first step when soldering an 0805 resistor with an iron?",
        options: [
          "Solder both pads, then press the part on",
          "Tin one pad, reflow it while sliding the part in with tweezers, then solder the other end",
          "Use a heat gun at maximum",
          "Glue it first",
        ],
        answer: 1,
        why: "Tacking one end holds the part in place and lets you check alignment before soldering the second end.",
      },
    ],
  },

  "i13-instruments-and-fault-finding": {
    id: "i13-instruments-and-fault-finding",
    outcomes: [
      "Use a multimeter for voltage, current, resistance and continuity without damaging it or the circuit",
      "Set up an oscilloscope with a 10x probe, compensate it, and trigger on a signal",
      "Use a bench supply's current limit to protect a new board",
      "Decode a bus with a logic analyser and follow a systematic fault-finding method",
    ],
    blocks: [
      { t: "h", text: "Measuring instead of guessing" },
      { t: "p", text: "When a circuit does not work, it is tempting to change code, swap parts and hope. That wastes hours. A measurement tells you a fact about the circuit, and a few well-chosen facts find almost any fault. This lesson covers the four instruments on every electronics bench and a method for using them that works on circuits you have never seen before." },

      { t: "h", text: "The multimeter" },
      { t: "list", items: [
        "**DC voltage**: probes in parallel with what you measure. Black on ground, red on the point. The meter's input resistance (typically 10 MΩ) barely loads most circuits.",
        "**Current**: the meter goes in series, so you must break the circuit and move the red lead to the A or mA socket. In this mode the meter is nearly a short circuit: put it across a supply and you blow its fuse (or the meter). Move the lead back to V afterwards.",
        "**Resistance and continuity**: only on unpowered circuits. Other parts in parallel affect the reading, so lift one end of a resistor for an exact value. Continuity mode beeps below a few tens of ohms, ideal for checking shorts and connections.",
        "**Diode test**: shows the forward drop (about 0.6 V for silicon, 1.8 to 3 V for LEDs), useful for checking diodes, LEDs and transistor junctions.",
      ] },
      { t: "note", kind: "safety", text: "Check the meter's CAT rating before any mains work, and do not measure mains in this course. Never measure resistance or continuity on a powered circuit. If the meter shows a voltage while you are in current mode across a supply, you have already made a mistake: disconnect immediately." },

      { t: "h", text: "The oscilloscope" },
      { t: "p", text: "A multimeter shows one averaged number. An oscilloscope shows voltage against time, so you can see PWM, serial data, noise, ringing and supply dips. The controls: **vertical** scale (volts per division) and offset; **horizontal** timebase (time per division); and **trigger**, which decides when the trace starts so a repeating signal stands still. Set the trigger to edge, rising, at a level halfway through the signal's swing." },
      { t: "p", text: "**Probes**: a standard passive probe has a 1x/10x switch. In 10x mode the probe contains a 9 MΩ resistor which, with the scope's 1 MΩ input, forms a 10:1 divider. The signal is divided by ten, but the probe loads the circuit ten times less and has far more bandwidth than in 1x mode. Use 10x for almost everything and set the scope's channel to 10x so the displayed voltages are right." },
      { t: "formula", text: String.raw`probe tip 9 MΩ  ─┬─ scope input 1 MΩ
ratio = 1 / (9 + 1) = 1/10
compensation: R_tip × C_tip = R_in × C_in   (both time constants equal)`, caption: "The 10x probe divider and the condition for a flat response." },
      { t: "p", text: "**Compensation**: the scope input also has capacitance (about 15 to 25 pF plus the cable). The probe has a small adjustable capacitor so that the divider ratio is the same at all frequencies. Clip the probe to the scope's calibration output (a 1 kHz square wave) and turn the trimmer until the square wave has flat tops: rounded corners mean under-compensated, spiky corners mean over-compensated. Do this whenever you move a probe to another channel or scope." },
      { t: "p", text: "Keep the ground lead short. The usual 15 cm ground clip forms a loop that picks up noise and makes fast edges ring; for clean measurements of fast signals use the short ground spring that comes with the probe. The probe ground is connected to mains earth through the scope: never clip it to anything other than circuit ground." },

      { t: "h", text: "The bench power supply" },
      { t: "p", text: "A bench supply sets a voltage and a **current limit**. Below the limit it behaves as a constant voltage source (CV). If the circuit tries to draw more, the supply reduces its voltage to hold the current at the limit (CC mode, usually shown by a light). For a new or repaired board, set the voltage, set the current limit a little above what you expect (for example 100 mA for a microcontroller and a few sensors), then connect. If there is a short, the supply goes into CC, the voltage drops, nothing burns, and you have learned something. A board that draws far more current than expected at power-on has a fault; a board that draws none has an open circuit." },

      { t: "h", text: "The logic analyser" },
      { t: "p", text: "A logic analyser records many digital channels at once, showing only high or low. A cheap 8-channel 24 MHz USB analyser with the open source **PulseView** (sigrok) software decodes UART, I2C, SPI and more into bytes on the screen. It answers questions such as \"does the sensor acknowledge its address?\" or \"what bytes actually go out on TX?\" Sample at least four times faster than the fastest signal (for 400 kHz I2C, 2 MHz or more) and connect its ground to the circuit ground. Most cheap analysers accept up to 5 V on inputs; check before using one on higher voltages." },
      { t: "table", head: ["Question", "Instrument"], rows: [
        ["Is the supply at the right voltage?", "Multimeter (DC V)"],
        ["Does the rail dip when the motor starts?", "Oscilloscope, triggered on the dip"],
        ["Is there a short somewhere?", "Bench supply current, then multimeter continuity"],
        ["Does the I2C sensor answer?", "Logic analyser with I2C decoder"],
        ["What frequency and duty is this PWM?", "Oscilloscope (or the multimeter's Hz mode)"],
      ] },

      { t: "h", text: "A systematic fault-finding method" },
      { t: "list", ordered: true, items: [
        "**Define the symptom exactly.** \"The OLED stays blank but the LED blinks\" is useful; \"it doesn't work\" is not. Note what does work too.",
        "**Look first.** Inspect for bridges, missing joints, reversed parts (diodes, electrolytics, ICs in sockets), wrong values. Smell for burning. Feel (carefully) for hot parts.",
        "**Power first.** Measure every supply rail at the pins of the parts that use it, not at the connector. Check ground too. Check the current drawn. Most faults are power faults.",
        "**Compare with expected values.** Before measuring, write down what each point should read. A measurement is only meaningful against an expectation.",
        "**Half-split.** Treat the circuit as a chain from input to output. Measure in the middle. If the signal is right there, the fault is after it; if not, before it. Repeat on the faulty half. A chain of 16 stages takes at most four measurements.",
        "**Change one thing at a time** and re-measure. Write down what you did and what you saw.",
        "**Confirm the fix explains the symptom.** If replacing a part fixes it, ask why the part failed, or the fault will return.",
      ] },
      { t: "diagram", text: String.raw`
 sensor → divider → ADC pin → firmware → I2C → OLED
                       ▲
            measure here first (middle of the chain)
    good here → fault is in firmware, I2C or OLED
    bad here  → fault is in sensor or divider`, caption: "Half-splitting a signal chain." },
      { t: "p", text: "Worked example. An ESP32 board reads a thermistor divider but always reports 0 °C. Expected at the ADC pin (GPIO 34 on the ESP32 DevKit) at room temperature: with a 10 kΩ NTC and 10 kΩ fixed resistor from 3.3 V, about 1.65 V. Measured: 0.00 V. Half-split back along the chain: the top of the divider reads 3.3 V, the junction reads 0 V. So either the fixed resistor is open or the junction is shorted to ground. Power off, continuity between the junction and ground: beeps. Inspection finds a solder bridge from the junction to the neighbouring ground strip. Remove it: the pin reads 1.63 V and the reported temperature is 25 °C. Three measurements, one fault, and the fix explains the symptom completely." },

      { t: "deep", title: "Why 10x probes have more bandwidth", blocks: [
        { t: "p", text: "In 1x mode the probe is just a cable, and its capacitance (often 50 to 100 pF) plus the scope input forms a low-pass filter with the source resistance of the circuit. With a 1 kΩ source and 100 pF, the corner is 1 / (2π × 1000 × 100e-12) ≈ 1.6 MHz; a 20 MHz probe rating is meaningless there. In 10x mode the compensated divider presents roughly 10 MΩ in parallel with 10 to 15 pF to the circuit, so the same 1 kΩ source with 12 pF gives a corner near 13 MHz, and the probe's own rated bandwidth (often 100 MHz or more) applies to low-impedance sources. The cost is a factor of ten in sensitivity, which matters only for millivolt signals." },
        { t: "p", text: "The scope's own bandwidth is a separate limit. A square wave's rise time t_r relates to bandwidth by roughly BW ≈ 0.35 / t_r, so a 50 MHz scope shows edges no faster than about 7 ns even if the real edge is faster. When an edge looks slow, check whether you are seeing the circuit or the instrument." },
      ] },
      { t: "deep", title: "Measuring current without breaking the circuit", blocks: [
        { t: "p", text: "Breaking a trace to insert an ammeter is awkward on a finished board. Alternatives: measure the voltage across a known series resistor (a 0.1 Ω shunt designed in for this purpose, or an existing resistor) and divide by its value; use a clamp meter on a wire for larger DC currents; or read the bench supply's current display for the whole board. Designing a 0 Ω link or a jumper header into each supply rail of a PCB makes current measurement easy during bring-up, which is a common professional habit." },
        { t: "p", text: "For small currents such as a sleeping ESP32 (microamps), the burden voltage of a multimeter on its µA range can be large enough to disturb the circuit. Dedicated current-measurement tools with low burden voltage exist for this; for this course, the bench supply reading and a series shunt are enough." },
      ] },
    ],
    mistakes: [
      "**Leaving the red lead in the A socket and measuring voltage.** The meter shorts the circuit and blows its fuse.",
      "**Measuring resistance in a powered circuit.** The reading is meaningless and the meter can be damaged.",
      "**Scope channel set to 1x with a 10x probe.** Every reading is ten times too small.",
      "**Skipping probe compensation.** Square waves look rounded or spiky and you chase a fault that is in the probe.",
      "**No current limit on a new board.** A short burns a track or a regulator instead of simply tripping the supply into CC.",
      "**Measuring without an expected value.** A number on its own does not tell you whether it is wrong.",
    ],
    practice: {
      kind: "bench",
      task: "Measure a working project with all four instruments, then find a planted fault.",
      steps: [
        "Power a project board from a bench supply with a 150 mA limit; note the supply current at idle and when an LED or motor is on.",
        "Compensate a 10x probe on the scope's calibration output, then view a PWM output and measure its frequency and duty cycle.",
        "Capture the board's I2C or UART traffic with a logic analyser and PulseView; identify the device address or the bytes sent.",
        "Ask a partner to plant one fault (a pulled wire, a wrong resistor, a bridge). Find it using the method in the lesson, writing down each expected value, measurement and conclusion.",
      ],
    },
    quiz: [
      {
        q: "A 10x probe is used but the scope channel is set to 1x. A 3.3 V signal is displayed as what?",
        options: ["33 V", "3.3 V", "0.33 V", "1 V"],
        answer: 2,
        why: "The probe divides by 10 and the scope does not scale back up, so 3.3 V shows as 0.33 V.",
      },
      {
        q: "During compensation, the square wave from the calibration output has rounded leading corners. What does that mean?",
        options: ["The probe is over-compensated", "The probe is under-compensated; adjust the trimmer", "The scope is broken", "The timebase is too slow"],
        answer: 1,
        why: "Rounded corners mean the high frequencies are attenuated more than low ones: under-compensation. Adjust until the tops are flat.",
      },
      {
        q: "A new board connected to a bench supply set to 5 V, 100 mA shows the CC light and 0.4 V. What does this tell you?",
        options: [
          "The board is working normally",
          "The board is trying to draw more than 100 mA, probably a short or a reversed part",
          "The supply is broken",
          "The current limit should be set to 0",
        ],
        answer: 1,
        why: "In CC mode the supply lowers its voltage to hold the current limit. A board that pulls the rail to 0.4 V at 100 mA has a fault.",
      },
      {
        q: "A signal chain has 8 stages and the output is wrong. With half-splitting, at most how many measurements locate the faulty stage?",
        options: ["8", "4", "3", "1"],
        answer: 2,
        why: "Each measurement halves the possibilities: 8 → 4 → 2 → 1, so three measurements.",
      },
      {
        q: "What is the first thing to measure when a board misbehaves?",
        options: [
          "The firmware version",
          "The supply rails at the pins of the parts that use them",
          "The oscilloscope's calibration",
          "The resistance of every resistor",
        ],
        answer: 1,
        why: "Power first: most faults are missing, low or noisy supplies, and nothing else can be judged until the power is right.",
      },
    ],
  },

  "i13-first-pcb": {
    id: "i13-first-pcb",
    outcomes: [
      "Turn a KiCad schematic into a two-layer board: outline, footprints, placement and routing",
      "Choose track widths and clearances that a low-cost fab can make",
      "Run DRC, generate Gerber and drill files, and check them in a viewer",
      "Order a board from JLCPCB, PCBWay or an Indian fab and assemble and test it",
    ],
    blocks: [
      { t: "h", text: "Why make a PCB" },
      { t: "p", text: "A printed circuit board is the step from \"it works on my bench\" to something that can be repeated, mounted in a robot, handed to someone else and still work next year. For a few hundred rupees and a week of waiting, five professionally made boards arrive at your door. A first board does not need to be clever: a shield that plugs onto an Arduino Uno, or a breakout that carries a sensor and its connector, teaches the whole flow. This lesson takes the schematic from the first lesson to Gerber files and an order." },

      { t: "h", text: "What a two-layer board is" },
      { t: "p", text: "A two-layer board is a sheet of FR-4 (glass fibre and epoxy, usually 1.6 mm thick) with copper on both sides (1 oz, about 35 µm, is standard). Copper you do not want is etched away, leaving **tracks** (traces) and **pads**. **Vias** are small plated holes that connect a track on the top to one on the bottom. **Solder mask** (usually green) covers the copper except at pads, and **silkscreen** prints reference designators and labels. In KiCad these are layers: F.Cu and B.Cu for copper, F.Mask and B.Mask, F.Silkscreen and B.Silkscreen, and Edge.Cuts for the board outline." },

      { t: "h", text: "The flow in KiCad 10" },
      { t: "list", ordered: true, items: [
        "**Finish the schematic and assign footprints** (Tools → Assign Footprints in the Schematic Editor). Choose footprints that match the real parts you will buy: `Resistor_SMD:R_0805_2012Metric`, `Package_DIP:DIP-8_W7.62mm`, `Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical`.",
        "**Set up the board**: in the PCB Editor, File → Board Setup. Under Design Rules → Constraints enter your fab's minimums; under Design Rules → Net Classes set the default track width and clearance.",
        "**Draw the outline** on the Edge.Cuts layer with Place → Draw Rectangle (or lines and arcs). It must be one closed shape. For an Uno shield, place the footprint of the Uno outline or measure it from the official drawing.",
        "**Import the parts**: Tools → Update PCB from Schematic (F8). Footprints arrive in a heap, joined by thin straight lines called the **ratsnest** showing connections still to route.",
        "**Place**: connectors at the edges, the parts that connect to each other close together, decoupling capacitors next to their IC's supply pins, and as few ratsnest lines crossing as possible. Placement decides how easy routing will be; spend most of your time here.",
        "**Route**: Route → Route Single Track (X). Press V while routing to drop a via and change layer. Route power and short critical connections first.",
        "**Ground pour**: Place → Add Filled Zone on B.Cu (often on both layers), assigned to the GND net, covering the board. Press B to fill all zones.",
        "**DRC**: Inspect → Design Rules Checker, Run DRC. Fix every error, including unconnected items.",
        "**Outputs**: File → Fabrication Outputs → Gerbers (.gbr) to plot Gerber files, and from the same dialog Generate Drill Files.",
        "**Check** the files in the Gerber Viewer (from the KiCad project manager) or the fab's online viewer before ordering.",
      ] },

      { t: "h", text: "Track widths and clearances" },
      { t: "p", text: "Low-cost two-layer services such as JLCPCB and PCBWay can make tracks and gaps of about 0.127 mm (5 mil) and vias with a 0.3 mm drill. Do not design at the limit on your first board. Sensible defaults:" },
      { t: "table", head: ["Item", "Safe first-board value", "Why"], rows: [
        ["Signal track", "0.25 mm (10 mil)", "Easy to make and to repair"],
        ["Power track, up to about 1 A", "0.5 to 1.0 mm", "Lower resistance and temperature rise"],
        ["Clearance", "0.2 mm (8 mil)", "Well above the fab minimum"],
        ["Via", "0.4 mm drill, 0.8 mm pad", "Reliable plating, cheap"],
        ["Copper to board edge", "0.5 mm or more", "Routing tool must not cut copper"],
      ] },
      { t: "p", text: "Track width for current is set by temperature rise. The IPC-2221 relation gives, for 1 oz external copper and a 10 °C rise, about 0.3 mm for 1 A and 0.8 mm for 2 A. KiCad has a calculator for this: from the project manager, open the Calculator Tools and choose Track Width. For a motor driver carrying 1.5 A use at least 0.6 to 0.8 mm, or a filled zone." },

      { t: "h", text: "Two-layer habits that make boards work" },
      { t: "list", items: [
        "**A solid ground**: route most signals on the top and keep the bottom as an unbroken ground pour. Return currents flow in the ground under their signal; slots cut through the ground force them to detour, which causes noise.",
        "**Decoupling close**: each IC's 100 nF capacitor within a few millimetres of its supply pin, with a via straight to ground.",
        "**Short, fat power paths** from the connector to the regulator to the loads.",
        "**Keep motor current away from sensor grounds**: route motor driver power and ground directly to the supply connector, not through the area where the analog sensors' grounds return.",
        "**Silkscreen for humans**: label every connector pin (GND, 5V, SDA), put a pin 1 mark on every IC and connector, add the board name, version and date.",
        "**Test points**: small pads on GND, each supply rail and important signals make the bring-up in the previous lesson's method easy.",
      ] },

      { t: "h", text: "Gerbers, drill files and ordering" },
      { t: "p", text: "Gerber files (RS-274X, extension .gbr in KiCad) are the universal format fabs accept: one file per layer (F.Cu, B.Cu, F.Mask, B.Mask, F.Silkscreen, B.Silkscreen, Edge.Cuts, optionally F.Paste for a stencil). The drill file (Excellon, .drl) lists hole positions and sizes. Zip them all into one archive and upload it to the fab's website, which shows a render of both sides: check that the outline is right, that holes are where you expect and that no text is mirrored." },
      { t: "list", items: [
        "**JLCPCB** and **PCBWay** (China): five 100 × 100 mm two-layer boards for a few US dollars plus shipping; delivery to India in about one to two weeks; Indian customs duty applies. JLCPCB can also assemble SMD parts from LCSC stock.",
        "**Indian fabs** such as Lion Circuits (Bengaluru) and PCB Power (Gujarat): higher price per board but no import paperwork, faster local delivery, and useful when a project budget must be spent in India.",
        "Order with standard options for a first board: 1.6 mm FR-4, 1 oz copper, HASL finish (lead-free HASL if you will hand solder lead-free), green mask, white silkscreen.",
      ] },
      { t: "note", kind: "tip", text: "Before ordering, print the board at 1:1 scale on paper and press your real parts onto it. A footprint for the wrong package or a connector at the wrong pitch is obvious at once and costs nothing to fix." },

      { t: "h", text: "Assembly and bring-up" },
      { t: "list", ordered: true, items: [
        "Inspect the bare board. Check continuity between supply and ground: it must not beep.",
        "Solder the power section first (connector, regulator, its capacitors). Power it from a bench supply with a low current limit and check the rail voltage.",
        "Add the remaining parts, smallest and flattest first, connectors last.",
        "Power up again with the current limit, measure every rail at the IC pins, then load firmware and test each function in turn.",
        "Write down every fix you make with a knife or wire. Those notes become version 2 of the board.",
      ] },
      { t: "p", text: "**Exit project**: draw the schematic and a simple two-layer PCB for one of your own projects (a sensor shield for the Uno, a motor-driver and line-sensor board for your i12 robot, or an ESP32 DevKit carrier with screw terminals). Get clean ERC and DRC, order it, assemble it, and test it with the fault-finding method from the previous lesson." },

      { t: "deep", title: "Where the IPC-2221 track width numbers come from", blocks: [
        { t: "p", text: "IPC-2221 fits measured data with I = k × ΔT^0.44 × A^0.725, where I is in amperes, ΔT the temperature rise in °C, A the cross-section in square mils, and k = 0.048 for outer layers (0.024 for inner layers, which are insulated by the board). Solve for A, then divide by the copper thickness (1.37 mil for 1 oz) to get width." },
        { t: "formula", text: String.raw`A = (I / (k × ΔT^0.44))^(1/0.725)
1 A, ΔT = 10 °C, outer layer:
  10^0.44 = 2.754
  I / (0.048 × 2.754) = 1 / 0.1322 = 7.565
  A = 7.565^1.379 ≈ 16.3 mil²
  width = 16.3 / 1.37 ≈ 11.9 mil ≈ 0.30 mm`, caption: "Checking the 0.3 mm for 1 A figure." },
        { t: "p", text: "The curve is conservative and old (based on 1950s data); IPC-2152 is the modern replacement and generally allows somewhat narrower tracks, especially on boards with large copper planes that spread heat. For a first board the IPC-2221 numbers with some margin are fine." },
      ] },
      { t: "deep", title: "Return currents and why a ground pour helps", blocks: [
        { t: "p", text: "Every current flows in a loop. At low frequency the return current takes the path of least resistance; above a few kHz it takes the path of least inductance, which is directly beneath the signal track in the ground plane, because that minimises the loop area. An unbroken plane gives every signal a tight return loop, which means less radiated noise, less pickup and less crosstalk. If a ground pour is split by a track on the bottom layer, the return current must go round the slot, the loop area grows, and the board both emits and picks up more. That is why the bottom layer is kept as clean ground and why vias stitch the top and bottom pours together near connectors and ICs." },
        { t: "p", text: "In practice: route signals on the top, keep any bottom-layer tracks short and running in the same direction so they cut the plane as little as possible, and place stitching vias every 10 to 20 mm around the board edge and near the ends of any slot you cannot avoid." },
      ] },
    ],
    mistakes: [
      "**Footprint does not match the part bought.** A SOT-23 regulator with a different pinout, or a 2.0 mm header pitch instead of 2.54 mm. Check the datasheet's land pattern and print 1:1.",
      "**Board outline not closed on Edge.Cuts.** The fab cannot cut it and DRC complains; draw one closed shape.",
      "**Ignoring unconnected items in DRC.** A single missing track makes the board useless; DRC lists every one.",
      "**Signal tracks cutting the bottom ground pour into islands.** Return currents detour and noise rises; route on the top and keep the bottom solid.",
      "**Thin power tracks for motor current.** A 0.25 mm track carrying 2 A heats up and can lift; size power tracks for current.",
      "**Uploading Gerbers without viewing them.** Missing layers or a mirrored silkscreen are obvious in the viewer and invisible in the zip.",
    ],
    practice: {
      kind: "bench",
      task: "Design, check and order a two-layer board for one of your projects.",
      steps: [
        "Take the schematic from the first lesson. Assign footprints that match your BOM from the component lesson.",
        "Set board rules: 0.25 mm default track, 0.2 mm clearance, 0.4/0.8 mm vias. Draw the outline on Edge.Cuts.",
        "Place parts, route, add a GND pour on the bottom, and run DRC until it is clean.",
        "Plot Gerbers and drill files, open them in the Gerber Viewer, and print the top copper at 1:1 to check footprints with real parts.",
        "Upload the zip to a fab's quote page and check its render. Order when you are satisfied, then assemble and bring up the board as in the lesson.",
      ],
    },
    quiz: [
      {
        q: "Which KiCad layer defines the shape the fab cuts the board to?",
        options: ["F.Cu", "F.Silkscreen", "Edge.Cuts", "B.Mask"],
        answer: 2,
        why: "The board outline is drawn on Edge.Cuts and must be a single closed shape.",
      },
      {
        q: "A track must carry about 1 A on an outer layer of 1 oz copper with a modest temperature rise. Which width is the sensible minimum?",
        options: ["0.1 mm", "0.3 mm, and wider for margin", "0.05 mm", "Width does not matter for current"],
        answer: 1,
        why: "IPC-2221 gives about 0.3 mm for 1 A and a 10 °C rise; use more for margin, for example 0.5 mm.",
      },
      {
        q: "Why keep the bottom layer of a two-layer board as an unbroken ground pour?",
        options: [
          "It makes the board lighter",
          "It gives return currents a short path under each signal, reducing noise and pickup",
          "Fabs charge less for it",
          "It is required by ERC",
        ],
        answer: 1,
        why: "Return currents flow beneath their signals; slots force detours and larger loops, which increase noise.",
      },
      {
        q: "What does the ratsnest show after Update PCB from Schematic?",
        options: [
          "Tracks already routed",
          "Connections from the schematic that still need routing",
          "Errors found by ERC",
          "The board outline",
        ],
        answer: 1,
        why: "Ratsnest lines are straight lines between pads that should be connected but are not routed yet.",
      },
      {
        q: "Which files do you send to a PCB fab for a bare two-layer board?",
        options: [
          "The .kicad_sch file only",
          "Gerber files for each layer plus the drill file, zipped together",
          "A PDF of the schematic",
          "The BOM spreadsheet",
        ],
        answer: 1,
        why: "Gerbers describe each layer and the Excellon drill file gives the holes. The BOM and placement files are only needed for assembly.",
      },
    ],
  },
};

export default lessons;
