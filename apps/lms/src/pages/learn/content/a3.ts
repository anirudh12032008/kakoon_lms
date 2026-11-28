import type { ModuleContent } from "../model/curriculum";

/**
 * Module a3: PCB design I, schematic to manufactured board.
 * KiCad menu paths are for KiCad 10.0 (checked against docs.kicad.org/10.0).
 * Fab figures are from JLCPCB's PCB capabilities page (checked November 2026).
 * Normal mode is complete on its own; `deep` sections hold detail and background.
 */
const lessons: ModuleContent = {
  "a3-hierarchy-libraries-reference-design": {
    id: "a3-hierarchy-libraries-reference-design",
    outcomes: [
      "Split a design into hierarchical sheets with clean interfaces",
      "Manage symbol, footprint and 3D model libraries through KiCad's library tables",
      "Create a symbol and a footprint that match a datasheet exactly",
      "Draw the schematic of an ESP32-S3 development board: USB-C, ESD, LDO, boot and reset, sensor",
    ],
    blocks: [
      { t: "h", text: "Why the schematic decides whether the board works" },
      { t: "p", text: "In module i13 you drew a one-sheet schematic, assigned stock footprints and routed a simple two-layer board. That flow breaks down as soon as a board has forty parts, a USB connector, a regulator that has to be chosen rather than copied, and a part that is not in KiCad's libraries. Almost every \"first spin\" failure in industry is a schematic or library failure: a footprint with pins numbered in the wrong order, a missing pull-down on a USB-C CC pin, a strapping pin left floating. Routing mistakes are usually visible; library mistakes are invisible until the board arrives. This lesson is about building the schematic and libraries so that the layout in the next lesson is the easy part." },
      { t: "p", text: "This module uses **KiCad 10.0** throughout, as in i13. The running example, and the exit project, is an ESP32-S3 development board: USB-C power and data, a 3.3 V regulator, the ESP32-S3-WROOM-1 module, boot and reset buttons, and an I2C temperature and humidity sensor." },

      { t: "h", text: "Hierarchical schematics" },
      { t: "p", text: "A hierarchical design is a tree of sheets. The root sheet holds **sheet symbols**: rectangles, each standing for a sub-sheet file (`power.kicad_sch`, `mcu.kicad_sch`). In the Schematic Editor, Place → Add Hierarchical Sheet (shortcut S) draws one. Inside the sub-sheet you place **hierarchical labels** on the signals that leave the sheet; back on the parent, the sheet symbol grows matching **sheet pins**, and you wire those pins to each other. Navigate with the hierarchy navigator panel or by double-clicking a sheet symbol." },
      { t: "p", text: "KiCad has three kinds of label, and choosing between them is the core skill of hierarchy:" },
      { t: "table", head: ["Label", "Scope", "Use it for"], rows: [
        ["Local label", "One sheet only", "Signals inside a block"],
        ["Hierarchical label", "This sheet to its parent, through a sheet pin", "The defined interface of a block"],
        ["Global label", "Every sheet in the design", "Very few nets, such as a reset line used everywhere"],
        ["Power symbol", "Global, like a global label", "Supplies and ground: +3V3, VBUS, GND"],
      ] },
      { t: "p", text: "Prefer hierarchical labels to global labels. A sheet whose interface is a handful of hierarchical pins can be read and reviewed on its own, like a function with arguments. A design full of global labels is a program full of global variables: anything can connect to anything and the root sheet no longer tells you how the blocks talk." },
      { t: "diagram", text: String.raw`
 root.kicad_sch
 ┌────────────┐  VBUS  ┌────────────┐ +3V3  ┌────────────┐
 │  usb.sch   ├───────►│ power.sch  ├──────►│  mcu.sch   │
 │            │ D+ D-  └────────────┘       │            │
 │            ├─────────────────────────────►            │
 └────────────┘                             │            │ SDA SCL
                                            │            ├──────► sensor.sch
                                            └────────────┘`, caption: "Root sheet of the dev board: four blocks joined only by sheet pins." },
      { t: "p", text: "Readability rules that scale: one function per sheet; signal flow left to right; name nets for their function (`USB_DP`, `I2C_SDA`, `EN`) so the netlist, the layout and the firmware use the same words; put the key design numbers as text on the sheet (\"LDO max 600 mA, θJA ≈ 250 °C/W\"); and fill in the title block with revision and date on every sheet." },

      { t: "h", text: "Symbols, footprints and 3D models" },
      { t: "p", text: "A component in KiCad is three separate objects linked by name. The **symbol** (schematic) has pins with numbers, names and electrical types. The **footprint** (layout) has pads with numbers, a courtyard, silkscreen and fabrication drawings. The **3D model** (`.step` or `.wrl`) is attached to the footprint and is used for the 3D viewer and mechanical export. The only link between symbol and footprint is the **pin number to pad number** match. If the symbol says VDD is pin 1 and the footprint puts pad 1 on the opposite corner, KiCad will happily connect VDD to the wrong copper." },
      { t: "p", text: "Libraries are found through two **library tables**: `sym-lib-table` for symbols and `fp-lib-table` for footprints. Each exists globally (shared by all projects, set in Preferences → Manage Symbol Libraries and Preferences → Manage Footprint Libraries) and per project (stored in the project folder, edited in the Project Specific Libraries tab of the same dialogs). A library is referenced by a nickname, and every symbol stores its footprint as `Nickname:FootprintName`, for example `RF_Module:ESP32-S3-WROOM-1`." },
      { t: "list", items: [
        "Keep the parts you make in a **project library** whose path uses `${KIPRJMOD}`, the variable for the project folder. The project then opens correctly on any machine and in version control.",
        "3D model paths in footprints use a path variable (the KiCad 10 stock libraries use `${KICAD10_3DMODEL_DIR}`). Check them in Preferences → Configure Paths if models are missing in the 3D viewer.",
        "When a project is finished, Tools → Collect and Embed 3D Models (KiCad 10) stores the models inside the board file so the archive is self-contained.",
        "Never edit the stock KiCad libraries in place. Copy the part into your project library and edit the copy.",
      ] },

      { t: "h", text: "Making a part you can trust" },
      { t: "p", text: "Open the Symbol Editor or the Footprint Editor from the project manager. For a symbol: one pin per physical pin, pin numbers exactly as the datasheet's pin table, names as the datasheet uses them, and correct electrical types (power input on VDD, power output on a regulator's VOUT, open collector on an interrupt output) so that ERC means something. Put the footprint name and the datasheet URL in the symbol fields." },
      { t: "p", text: "For a footprint, work from the datasheet's **recommended land pattern**, not the package outline drawing. Pads are larger than the leads by a toe and heel margin so a solder fillet forms. Set the pad numbers, mark pin 1 on the silkscreen and on F.Fab, draw the courtyard (KiCad's convention is 0.25 mm around the part for most SMD parts), and put the origin at the part's centre, because pick-and-place machines use the footprint origin as the part's centroid. Then print the footprint 1:1 on paper and lay the real part on it." },
      { t: "note", kind: "tip", text: "Check every new footprint three ways before ordering: pad count and numbering against the pin table, pitch and pad size against the land pattern drawing, and the 1:1 paper print with the real part. Most fatal library errors are caught by the paper print." },

      { t: "h", text: "Reference design walkthrough: an ESP32-S3 dev board" },
      { t: "p", text: "Work through the board block by block, the way a reviewer would. The ESP32-S3 has a native USB 2.0 full-speed (12 Mbit/s) controller on GPIO 19 (D-) and GPIO 20 (D+), with a built-in USB Serial/JTAG peripheral. That lets you program and debug it over USB with no USB-to-serial chip, which removes a whole block from the design." },
      { t: "p", text: "**USB-C connector and CC resistors.** A USB-C source (a charger, a laptop port) does not put 5 V on VBUS until it sees a sink. The sink announces itself with a pull-down resistor **Rd = 5.1 kΩ** from each CC pin (CC1 and CC2) to ground. Use two separate 5.1 kΩ resistors, one per pin. Tying CC1 and CC2 together into one resistor is a classic error: some chargers then see an unexpected configuration and refuse to supply power. With only Rd fitted the board can draw default USB power (500 mA from a USB 2.0 port); that is plenty here. Also connect both D+ pins (A6, B6) together and both D- pins (A7, B7) together, so the cable works in either orientation." },
      { t: "p", text: "**ESD protection.** The connector is the one place where a charged person touches your circuit. Put a low-capacitance USB ESD array (for example the USBLC6-2SC6, which clamps D+, D- and VBUS) right behind the connector, so the discharge current goes to ground before it reaches the ESP32. Low capacitance (a few pF) matters because the array sits on the data lines." },
      { t: "p", text: "**Regulator selection.** The input is VBUS, nominally 5 V (4.75 to 5.25 V at the port, less after cable drop). The ESP32-S3 draws short Wi-Fi transmit peaks of a few hundred milliamps, and Espressif recommends a 3.3 V supply able to deliver at least 500 mA. A low-dropout linear regulator (LDO) is the simple answer. Check four numbers on the datasheet: output current (at least 500 mA; parts such as the AP2112K-3.3 are rated 600 mA), dropout at that current (a few hundred millivolts, so 4.5 V in still regulates), stability with ceramic output capacitors, and **dissipation**." },
      { t: "formula", text: String.raw`P = (V_in - V_out) × I
peak Wi-Fi:   (5.0 - 3.3) × 0.5 A  = 0.85 W
average:      (5.0 - 3.3) × 0.10 A = 0.17 W
ΔT = P × θJA,  SOT-23-5 θJA ≈ 250 °C/W (check the datasheet)
peak, if sustained:  0.85 × 250 = 212 °C rise  → not acceptable continuously
average:             0.17 × 250 = 42.5 °C rise → fine at 35 °C ambient (about 78 °C junction)`, caption: "LDO dissipation check. Short peaks are averaged by the package's thermal mass; the average sets the temperature." },
      { t: "p", text: "Check: 1.7 × 0.5 = 0.85 and 0.85 × 250 = 212.5; 1.7 × 0.1 = 0.17 and 0.17 × 250 = 42.5. The lesson is that a tiny LDO is fine for an ESP32 that averages 100 mA, but would cook if your board also ran a 400 mA LED strip from 3.3 V. In that case pick a larger package with copper area for heat, or a buck converter. Put a 10 µF ceramic at the LDO input and output, as the datasheet asks, and keep the VBUS capacitance modest (the USB specification limits it to 10 µF so that plugging in does not draw an inrush spike)." },
      { t: "p", text: "**Reset and boot.** The ESP32-S3 enable pin (EN, also called CHIP_PU) needs an RC delay so the chip starts only after the supply is stable: Espressif's reference uses 10 kΩ to 3.3 V and 1 µF to ground, giving τ = 10 ms. Check: 10 000 × 1 × 10⁻⁶ = 0.01 s. Add a reset button from EN to ground. GPIO 0 is a strapping pin: high at reset (its internal pull-up) boots the application, low enters the download mode. A BOOT button from GPIO 0 to ground lets you force download mode if the firmware ever breaks USB." },
      { t: "p", text: "**Auto-reset, and why this board does not need it.** Boards that use the original ESP32, which has no native USB, program through a USB-to-serial chip (CP2102, CH340). The programming tool then toggles the bridge's DTR and RTS lines, which drive EN and GPIO 0 through two cross-coupled NPN transistors, so the chip resets into download mode with no buttons pressed. The ESP32-S3's USB Serial/JTAG peripheral can enter download mode on command from the host, so with native USB the transistor pair is unnecessary. Keep the BOOT and RESET buttons anyway." },
      { t: "p", text: "**Sensor.** An I2C temperature and humidity sensor (an SHT40 or a BME280) on its own sheet, with 4.7 kΩ pull-ups on SDA and SCL to 3.3 V and a 100 nF capacitor at its VDD pin. On the ESP32-S3 any free GPIO can be I2C; GPIO 8 (SDA) and GPIO 9 (SCL) are the Arduino-ESP32 defaults for S3 boards. Avoid the strapping pins (GPIO 0, 3, 45, 46) and the USB pins (19, 20) for anything else." },
      { t: "diagram", text: String.raw`
 USB-C ──VBUS──┬── USBLC6 ──┬── LDO 3V3 ──┬── ESP32-S3-WROOM-1 ── I2C ── SHT40
   │           │            │   10µF in   │   10µF + 100nF          4k7 pull-ups
   ├─CC1─[5k1]─┤GND         │   10µF out  │   EN: 10k / 1µF, RESET button
   ├─CC2─[5k1]─┘            │             │   GPIO0: BOOT button
   └─D+/D-─────── USBLC6 ───┴─────────────┘   GPIO19 D-, GPIO20 D+`, caption: "Block view of the reference design." },

      { t: "deep", title: "Repeated sheets, buses and design blocks", blocks: [
        { t: "p", text: "A sheet file can be used by several sheet symbols. A board with four identical motor channels draws the channel once and places four sheet symbols pointing at the same file; KiCad keeps separate reference designators for each instance (annotation handles this) and the nets inside get the sheet path as a prefix, so `/Motor1/PWM` and `/Motor2/PWM` stay distinct. In the PCB Editor, Tools → Multi-Channel → Generate Placement Rule Areas and Repeat Layout then copy the layout of one channel onto the others, which is the professional way to lay out repeated circuits." },
        { t: "p", text: "Buses group related nets. A bus label such as `D[0..7]` stands for D0 to D7; a bus group such as `I2C{SDA SCL}` bundles differently named nets so one sheet pin can carry them. Use buses where they make the sheet shorter without hiding which wire is which, and break out each member with a labelled bus entry where it reaches a pin." },
      ] },
      { t: "deep", title: "Footprint geometry from IPC-7351 and the land pattern", blocks: [
        { t: "p", text: "IPC-7351 defines land patterns from the component's dimensional tolerances: pad length = lead length plus a toe extension and a heel extension, chosen for one of three density levels (most, nominal, least material). The stock KiCad libraries generate SMD footprints this way, which is why `R_0805_2012Metric` has pads noticeably larger than the part. When a datasheet gives its own recommended land pattern, use it: the maker has tested it, especially for QFN exposed pads where the paste layer is split into windows (often 50 to 80% paste coverage) to stop the part floating on molten solder." },
        { t: "p", text: "Name your footprints in the same style as the stock library (`SOT-23-5`, `QFN-56-1EP_7x7mm_P0.4mm_EP4x4mm`). The name then tells a reviewer the pitch and body size without opening the file, and the KiCad library convention checker in the Footprint Editor will catch missing courtyards, wrong layer use and off-centre origins." },
      ] },
      { t: "deep", title: "USB-C sink resistors: what the source actually measures", blocks: [
        { t: "p", text: "A USB-C source pulls each CC pin up, either with a resistor Rp or a current source, and watches the voltage. With the sink's Rd = 5.1 kΩ connected on one CC pin (the cable connects only one CC through), the voltage lands in a window that means \"sink attached\"; the source then turns VBUS on. The Rp value advertises how much current the source offers (default USB, 1.5 A or 3.0 A), and a sink that wants more than default current can read that voltage with an ADC. Two CC pins exist so that plug orientation can be detected, which is why each needs its own Rd." },
        { t: "p", text: "Legacy USB-A to USB-C cables contain a 56 kΩ pull-up inside the plug and power the board regardless. That is why a board with missing Rd often \"works on my cable\" and fails with a proper C-to-C charger: test with both." },
      ] },
    ],
    mistakes: [
      "**One 5.1 kΩ resistor shared by CC1 and CC2.** Use one Rd per CC pin, or C-to-C chargers may refuse to supply power.",
      "**Global labels everywhere.** The root sheet stops documenting how blocks connect; use hierarchical labels for block interfaces.",
      "**A footprint drawn from the package outline instead of the land pattern.** Pads end up too small for a fillet, or the exposed pad floods with paste.",
      "**Pin numbers that do not match pad numbers.** Symbol and footprint are linked only by number; verify every pin against the datasheet table.",
      "**Choosing an LDO by output current only.** Compute dissipation and junction temperature for the average load, and check dropout at the lowest VBUS.",
      "**Strapping pins used as ordinary I/O.** A sensor that pulls GPIO 0 low at reset sends the ESP32-S3 into download mode every boot.",
    ],
    practice: {
      kind: "bench",
      task: "Draw the full hierarchical schematic of the ESP32-S3 dev board in KiCad 10 and get it reviewed.",
      steps: [
        "Create a project with a project symbol and footprint library whose path uses `${KIPRJMOD}`.",
        "Draw four sub-sheets (usb, power, mcu, sensor) and a root sheet that connects them only through sheet pins.",
        "Download the datasheets for the USB-C receptacle, the USBLC6-2SC6, your LDO and your sensor. Check each stock footprint against its land pattern, or make your own in the project library.",
        "Write the LDO dissipation calculation and the EN RC time constant as text on the power and mcu sheets.",
        "Run ERC to zero errors, plot the schematic to PDF and swap it with a classmate for a review against the walkthrough in this lesson.",
      ],
    },
    quiz: [
      {
        q: "Which label type should carry the I2C lines from the mcu sheet to its parent sheet?",
        options: ["A global label", "A hierarchical label with a matching sheet pin", "A local label", "A power symbol"],
        answer: 1,
        why: "Hierarchical labels define a sheet's interface through sheet pins, keeping the connection visible on the parent sheet. Global labels connect everywhere and hide the structure.",
      },
      {
        q: "A board has USB-C with a single 5.1 kΩ resistor from both CC pins (tied together) to ground. What is the likely symptom?",
        options: [
          "The data lines run at low speed",
          "Some USB-C chargers and C-to-C cables do not turn on VBUS",
          "The board draws 3 A",
          "Nothing, it is the standard circuit",
        ],
        answer: 1,
        why: "Each CC pin needs its own Rd. Tying them together presents an unexpected configuration, and compliant sources may not supply power.",
      },
      {
        q: "An LDO takes 5.0 V to 3.3 V with an average load of 150 mA, in a package with θJA = 200 °C/W, at 40 °C ambient. What is the junction temperature?",
        options: ["91 °C", "51 °C", "106 °C", "75 °C"],
        answer: 0,
        why: "P = 1.7 × 0.15 = 0.255 W; rise = 0.255 × 200 = 51 °C; junction = 40 + 51 = 91 °C.",
      },
      {
        q: "Why does the ESP32-S3 dev board not need the two-transistor auto-reset circuit?",
        options: [
          "The S3 has no EN pin",
          "Its native USB Serial/JTAG peripheral lets the host put it into download mode without DTR and RTS",
          "Auto-reset is only for 5 V boards",
          "The LDO resets the chip",
        ],
        answer: 1,
        why: "Auto-reset is for programming through a USB-to-serial bridge. With native USB, the host commands download mode directly.",
      },
      {
        q: "What is the only thing that links a schematic symbol's pins to a footprint's pads in KiCad?",
        options: ["Pin names", "The pin number matching the pad number", "Their positions on screen", "The 3D model"],
        answer: 1,
        why: "KiCad matches by number. Names and positions do not matter, which is why numbering errors produce wrong connections silently.",
      },
    ],
  },

  "a3-placement-routing-rules": {
    id: "a3-placement-routing-rules",
    outcomes: [
      "Plan a board outline and place parts by function, signal flow and mechanical constraints",
      "Set net classes and design rules from a real fab's capability figures",
      "Size tracks for current using IPC-2221 and explain how IPC-2152 differs",
      "Choose via types and lay out decoupling and power on a two-layer board",
    ],
    blocks: [
      { t: "h", text: "Layout is where electrical behaviour is decided" },
      { t: "p", text: "The schematic says which pins connect. The layout decides how long the connections are, which loops the currents flow round, how hot the regulator runs and whether the board can be made cheaply. Two boards with identical schematics can behave completely differently: one quiet and reliable, one that resets whenever Wi-Fi transmits. In i13 you routed a simple board with default rules. Here you set the rules deliberately, from a fab's capability page and from physics, and place parts with a strategy." },

      { t: "h", text: "Board outline and mechanical first" },
      { t: "p", text: "Start with the constraints you cannot move: the enclosure, mounting holes (M3 holes with a 3.2 mm drill and a keep-out for the screw head), connector positions at the edge, button positions, and for this board the **antenna end of the ESP32-S3 module**, which must overhang or sit at the board edge with no copper under or beside the antenna (module a4 explains why). Draw the outline on Edge.Cuts, place the fixed parts and lock them (select, then L for Toggle Lock) so you do not nudge them later." },

      { t: "h", text: "Placement strategy" },
      { t: "list", ordered: true, items: [
        "**Fixed parts**: connectors, mounting holes, module, buttons, LEDs that must line up with the case.",
        "**Critical small loops**: decoupling capacitors at their pins, the LDO's input and output capacitors at its pins, ESD array right behind the USB connector, crystal next to its chip if there is one.",
        "**Signal flow**: arrange blocks in the same order as the schematic's flow, USB → protection → regulator → MCU → sensor, so most connections are short and few cross.",
        "**Noisy away from sensitive**: switching regulators, motor drivers and the antenna away from the sensor and analog inputs. A temperature sensor also belongs away from the LDO and the module, which warm the board.",
        "**Routing room**: leave channels for tracks between dense parts; nudge parts until the ratsnest is short and uncrossed. Only then start routing.",
      ] },
      { t: "p", text: "Use a 0.5 mm or 0.25 mm grid for placement, keep all passives in a group facing the same way (machine assembly and inspection both benefit), and put reference designators where they can be read after assembly. Use the 3D viewer (View → 3D Viewer, Alt+3) to check that tall parts do not clash with the enclosure." },

      { t: "h", text: "Design rules from the fab" },
      { t: "p", text: "Every fab publishes a capability page. The figures below are JLCPCB's for standard boards (checked November 2026). Note the difference between the **minimum** the fab can make and the value you should design to: designing at the minimum costs yield and sometimes money." },
      { t: "table", head: ["Parameter", "JLCPCB minimum", "Design to (this board)"], rows: [
        ["Track / space, 1 oz, 2-layer", "0.10 / 0.10 mm", "0.20 / 0.20 mm signals"],
        ["Via drill (hole)", "0.15 mm (0.2 mm preferred)", "0.3 mm"],
        ["Via pad diameter", "0.25 mm; at least hole + 0.1 mm", "0.6 mm"],
        ["Annular ring, 2-layer, 1 oz", "0.18 mm absolute, 0.25 mm recommended", "Component holes: 0.25 mm or more; vias follow the via pad rule, see note"],
        ["Via hole to track", "0.2 mm", "0.25 mm"],
        ["Via hole to via hole", "0.2 mm", "0.3 mm"],
        ["Copper to routed board edge", "0.2 mm", "0.5 mm"],
        ["Copper to V-cut edge", "0.4 mm", "0.5 mm"],
        ["Plated hole size tolerance", "+0.13 / -0.08 mm", "Size connector holes for it"],
      ], caption: "Source: JLCPCB PCB capabilities page. The annular ring figures there are for component plated holes; small vias are covered by the via diameter rule (pad at least 0.1 mm, preferably 0.15 mm, bigger than the hole)." },
      { t: "p", text: "Enter these in File → Board Setup. Under Design Rules → Constraints go the absolute minimums (so DRC flags anything the fab cannot make); under Design Rules → Net Classes go the values you actually want for each class of net. Board Setup → Physical Stackup records the layer count, thickness and copper weight." },

      { t: "h", text: "Net classes" },
      { t: "p", text: "A **net class** gives a group of nets its own track width, clearance and via size. The router then uses the right width automatically. For this board:" },
      { t: "table", head: ["Net class", "Nets", "Track", "Clearance", "Via (pad / drill)"], rows: [
        ["Default", "Signals, I2C, GPIO", "0.20 mm", "0.20 mm", "0.6 / 0.3 mm"],
        ["Power", "VBUS, +3V3, GND tracks", "0.50 mm", "0.20 mm", "0.8 / 0.4 mm"],
        ["USB", "USB_DP, USB_DN", "per a4 impedance calc", "0.20 mm", "avoid vias"],
      ] },
      { t: "p", text: "Assign nets to classes in Board Setup → Net Classes with pattern rules (for example `+3V3` and `VBUS` to Power) or from the schematic with net class directives, so the assignment survives every Update PCB from Schematic." },

      { t: "h", text: "Track width for current: IPC-2221, worked" },
      { t: "p", text: "A track heats because of its resistance. The long-standing IPC-2221 chart is fitted by a simple formula relating current I (amps), allowed temperature rise ΔT (°C) and cross-section area A (square mils):" },
      { t: "formula", text: String.raw`I = k × ΔT^0.44 × A^0.725
k = 0.048 for outer layers, 0.024 for inner layers
solve:  A = ( I / (k × ΔT^0.44) )^(1/0.725)
width = A / thickness,   1 oz copper = 1.378 mil = 0.035 mm`, caption: "IPC-2221 track current relation (1 mil = 0.0254 mm)." },
      { t: "p", text: "Worked: 1 A on an outer 1 oz layer with a 10 °C rise. 10^0.44 = 2.754, so k × ΔT^0.44 = 0.048 × 2.754 = 0.1322. A = (1 / 0.1322)^(1/0.725) = 7.565^1.379 = 16.3 mil². Width = 16.3 / 1.378 = 11.8 mil = 0.30 mm. For 2 A the same steps give 42.4 mil² and 0.78 mm. Check by substituting back: 0.048 × 2.754 × 16.3^0.725 = 0.1322 × 7.57 = 1.00 A. KiCad's Calculator Tools (from the project manager) has a Track Width page that implements this IPC-2221 formula; use it to check your hand result." },
      { t: "p", text: "**IPC-2152** (2009) replaced the 2221 charts with new measurements. Its main findings: the old internal-layer curve was far too pessimistic (2221 says an inner track needs twice the area of an outer one; in a real board the surrounding planes and laminate carry heat away so well that inner tracks behave much like outer ones), and board thickness, nearby copper planes and laminate conductivity all matter. For outer layers on an ordinary board, 2221 and 2152 give similar answers, and 2221 errs on the safe side. Practical rule: use 2221 for outer-layer tracks on simple boards, and a 2152-based calculator (for example the Saturn PCB Toolkit) when you are sizing inner-layer power or want to avoid over-design." },
      { t: "note", kind: "tip", text: "Temperature rise is not the only limit. A 0.3 mm, 50 mm long 1 oz track has about 0.08 Ω, so 1 A drops 80 mV. On a 3.3 V rail that is 2.4%. Check voltage drop as well as heat on long supply runs." },

      { t: "h", text: "Vias" },
      { t: "list", items: [
        "**Through vias** go from top to bottom and are the only kind on a standard two-layer board. Each has a few tenths of a nanohenry of inductance and roughly 0.5 A of comfortable current for a 0.3 mm hole; use several in parallel for power and ground connections.",
        "**Blind vias** connect an outer layer to an inner layer without going through; **buried vias** join inner layers only. JLCPCB makes blind vias as laser-drilled microvias (0.075 to 0.15 mm, copper filled) on HDI builds and buried vias mechanically. They cost much more and are for dense multilayer boards, not this one.",
        "**Via-in-pad** puts a via inside an SMD pad, used under fine-pitch BGAs and for thermal pads. An open via in a pad wicks solder away from the joint, so it must be filled and capped (JLCPCB's process uses epoxy or copper paste, filled and plated over). Under a QFN thermal pad, small vias with solder mask tenting on the bottom are a cheaper compromise.",
      ] },

      { t: "h", text: "Routing and pours on two layers" },
      { t: "p", text: "The best two-layer strategy for a mixed digital board is: route nearly everything on the top, keep the bottom a **solid ground pour**, and when a signal must cross another, drop it to the bottom for the shortest possible jump. Every return current flows in the ground directly under its track; a long bottom-layer track cuts the ground into islands and forces those return currents round the cut. Add a GND pour on the top too, stitched to the bottom with vias every 5 to 10 mm, and remove isolated copper islands (the zone property \"remove islands\" does this)." },
      { t: "p", text: "Route power with wide tracks or short pours, from the regulator's output capacitor to each load. Route the USB pair together, same length, no stubs, over unbroken ground (a4 covers the impedance). Use 45° corners or arcs; right angles are not an electrical problem at these speeds, but they trap etchant on some processes and look careless. Add teardrops (Board Setup → Teardrops) to strengthen small pads and vias." },

      { t: "h", text: "Decoupling on two layers" },
      { t: "p", text: "A decoupling capacitor supplies the fast current spikes a chip draws when it switches, because the regulator is too far away and too slow. Its effectiveness is set almost entirely by the **loop inductance** from the capacitor to the chip's power pin and back to its ground pin. On two layers:" },
      { t: "list", items: [
        "Place the 100 nF capacitor within a few millimetres of the power pin, on the same side as the chip.",
        "Route power **through the capacitor pad, then to the chip pin**, so the supply current passes the capacitor first.",
        "Put a ground via right at the capacitor's ground pad, and another at the chip's ground pin or thermal pad, into the bottom ground pour.",
        "Keep the bulk capacitors (10 µF) near the regulator and where power enters each block.",
        "For the ESP32-S3 module, follow the module datasheet: a 10 µF and a 100 nF close to its 3V3 pin, and many ground vias under the module's ground pads.",
      ] },
      { t: "diagram", text: String.raw`
 good:  +3V3 ──►[C 100n]──► U pin VDD        bad:  +3V3 ──────────► U pin VDD
                  │ ●via                                    │ (8 mm)
                 GND pour ◄── ● U pin GND                 [C 100n]
                                                            │ ●via`, caption: "Feed the pin through the capacitor and via both grounds straight into the pour." },

      { t: "deep", title: "Deriving the track temperature from resistance", blocks: [
        { t: "p", text: "Copper's resistivity is about 1.72 × 10⁻⁸ Ω·m at 20 °C and rises by about 0.39% per °C. A track of width w, thickness t and length L has R = ρL / (w t). For w = 0.30 mm, t = 0.035 mm, L = 50 mm: R = 1.72e-8 × 0.05 / (0.30e-3 × 0.035e-3) = 0.0819 Ω. At 1 A it dissipates 82 mW. The temperature rise then depends on how well that heat spreads into the laminate and air, which is exactly what the IPC charts measure empirically; there is no clean closed form because the heat path through FR-4 (about 0.3 W/m·K) and into nearby copper dominates." },
        { t: "p", text: "This is also why IPC-2152 found inner layers so much better than IPC-2221 predicted: an inner track is surrounded by copper planes a fraction of a millimetre away, which spread heat sideways very effectively, while an outer track loses heat mainly by convection to still air." },
      ] },
      { t: "deep", title: "Custom design rules in KiCad 10", blocks: [
        { t: "p", text: "Board Setup → Design Rules → Custom Rules accepts a small rule language for things net classes cannot express. Examples: a larger clearance between the VBUS net and everything else, a rule that forbids vias inside the antenna keep-out, or a minimum clearance from copper to a mounting hole." },
        { t: "snippet", lang: "text", code: String.raw`(version 1)
(rule "VBUS extra clearance"
  (condition "A.NetName == 'VBUS'")
  (constraint clearance (min 0.3mm)))
(rule "No copper near mounting holes"
  (condition "B.Type == 'Hole' && A.Type != 'Hole'")
  (constraint hole_clearance (min 0.6mm)))`, caption: "Two custom rules. Check them with Inspect → Clearance Resolution on a pair of items." },
        { t: "p", text: "Inspect → Clearance Resolution and Inspect → Constraints Resolution show which rule applies between two selected items and why, which is the quickest way to debug a rule that is not doing what you expected." },
      ] },
    ],
    mistakes: [
      "**Routing before placement is finished.** A poor placement cannot be rescued by routing; spend most of the time placing.",
      "**Designing at the fab's minimums.** Yield and repairability suffer; use roomy values unless density forces you down.",
      "**Long tracks on the bottom ground layer.** They split the ground and force return currents round the cut.",
      "**Decoupling capacitor connected by a long track.** The loop inductance makes it nearly useless at high frequency.",
      "**Treating IPC-2221's inner-layer curve as accurate.** It badly overestimates the width needed; use IPC-2152 for inner power.",
      "**Copper under the module antenna.** It detunes the antenna and kills range.",
    ],
    practice: {
      kind: "bench",
      task: "Lay out the ESP32-S3 dev board on two layers with rules taken from JLCPCB's capability page.",
      steps: [
        "Read JLCPCB's current capability page and fill Board Setup → Constraints with its minimums for a 1.6 mm two-layer board.",
        "Create Default, Power and USB net classes with the values from this lesson.",
        "Draw a 50 × 30 mm outline with the module antenna at one short edge and the USB-C connector at the other; lock both.",
        "Place by the five-step strategy, then route with the bottom kept as solid ground. Count the bottom-layer track segments and try to keep each under 5 mm.",
        "Size the VBUS track for 500 mA with both the hand formula and the KiCad calculator, and note the voltage drop over its length.",
      ],
    },
    quiz: [
      {
        q: "Using IPC-2221, what outer-layer 1 oz width carries 1 A with a 10 °C rise?",
        options: ["About 0.10 mm", "About 0.30 mm", "About 0.78 mm", "About 1.8 mm"],
        answer: 1,
        why: "A = (1 / (0.048 × 10^0.44))^(1/0.725) = 16.3 mil²; 16.3 / 1.378 = 11.8 mil = 0.30 mm.",
      },
      {
        q: "What did IPC-2152 show about inner-layer tracks compared with IPC-2221?",
        options: [
          "They need four times the width",
          "IPC-2221 overestimates their required width; surrounding planes carry heat away well",
          "Inner layers cannot carry current",
          "Nothing changed",
        ],
        answer: 1,
        why: "2221's inner curve assumed poor cooling. Measurements for 2152 showed nearby planes and laminate spread heat, so inner tracks behave much like outer ones.",
      },
      {
        q: "JLCPCB's minimum via hole is 0.15 mm and the pad must be at least 0.1 mm larger. Which via is the most sensible for a cheap two-layer board?",
        options: ["0.15 mm hole, 0.25 mm pad", "0.3 mm hole, 0.6 mm pad", "0.1 mm hole, 0.2 mm pad", "1.0 mm hole, 1.1 mm pad"],
        answer: 1,
        why: "0.3 / 0.6 mm is well clear of the minimums and is easy to plate. The minimum sizes cost yield; 0.1 / 0.2 mm needs thin board and special finish.",
      },
      {
        q: "On a two-layer board, which routing strategy best preserves return paths?",
        options: [
          "Split routing evenly between both layers",
          "Route signals on top and keep the bottom as unbroken ground, with only short jumps",
          "Route power on the bottom across the board",
          "Avoid ground pours",
        ],
        answer: 1,
        why: "Return current flows in the ground under each track. An unbroken bottom plane keeps every return path directly beneath its signal.",
      },
      {
        q: "Why must a via in an SMD pad be filled and capped?",
        options: [
          "To increase its inductance",
          "An open via wicks solder away from the joint during reflow",
          "Fabs forbid copper in pads",
          "To make it a blind via",
        ],
        answer: 1,
        why: "Molten solder flows down an open hole, starving the joint. Filling and plating over the via makes the pad flat and solderable.",
      },
      {
        q: "A 100 nF decoupling capacitor is 8 mm from the chip's VDD pin, fed by a thin track. What is the main problem?",
        options: ["The capacitance is too small", "The loop inductance is too high, so it cannot supply fast current spikes", "It will overheat", "DRC will fail"],
        answer: 1,
        why: "At high frequency the track and via inductance dominate the capacitor's impedance. Decoupling works only when the loop is very short.",
      },
    ],
  },

  "a3-outputs-fabrication-assembly": {
    id: "a3-outputs-fabrication-assembly",
    outcomes: [
      "Run a final DRC with schematic parity and clear every violation",
      "Generate Gerber X2, Excellon drill, BOM and component placement files in KiCad 10",
      "Explain how a board is fabricated and assembled, and what each process needs from your files",
      "Panelise a board and place a fab-and-assembly order correctly",
    ],
    blocks: [
      { t: "h", text: "The files are the product" },
      { t: "p", text: "A fab never sees your KiCad project. It sees a handful of files, and builds exactly what they say. A silkscreen line on the copper layer becomes copper; a missing drill file means no holes; a placement file with the wrong rotation puts every diode in backwards. This lesson goes from a finished layout to an order that comes back right, and explains the factory processes so you know why the files look the way they do." },

      { t: "h", text: "Final design rule check" },
      { t: "p", text: "Inspect → Design Rules Checker in KiCad 10. Tick **Refill all zones before performing DRC** (zones filled before your last edit are stale) and **Test for parity between PCB and schematic**, which catches footprints missing from the board, extra footprints, and net differences. Then run it. Zero errors and zero unconnected items are required. Warnings must each be fixed or deliberately excluded with a reason. Typical late findings: a silkscreen label over a pad (clipped by the fab), a courtyard overlap that would stop a machine placing the parts, and an \"unconnected\" pair of GND islands that the pour did not join." },
      { t: "note", kind: "warn", text: "DRC can only check the rules you gave it. If Board Setup → Constraints does not hold the fab's real minimums, a clean DRC means nothing. Re-read the fab's capability page before the final run." },

      { t: "h", text: "Fabrication outputs in KiCad 10" },
      { t: "table", head: ["Output", "KiCad 10 menu (PCB Editor)", "What it tells the factory"], rows: [
        ["Gerber files", "File → Fabrication Outputs → Gerbers (.gbr) (opens the Plot dialog)", "Each layer's copper, mask, paste, silkscreen and outline as images"],
        ["Drill files", "File → Fabrication Outputs → Drill Files (.drl), or Generate Drill Files in the Plot dialog", "Hole positions and sizes, plated and non-plated, in Excellon format"],
        ["Component placement", "File → Fabrication Outputs → Component Placement (.pos, .gbr)", "Each part's centre X, Y, rotation and side, for the pick-and-place machine"],
        ["Bill of materials", "Schematic Editor: Tools → Generate Bill of Materials", "What part goes at each reference designator"],
        ["IPC-2581 / ODB++", "File → Fabrication Outputs → IPC-2581 File (.xml) or ODB++ Output File", "All of the above in one intelligent file, for fabs that accept it"],
      ] },
      { t: "p", text: "In the Plot dialog, choose the layers F.Cu, B.Cu, F.Mask, B.Mask, F.Paste, B.Paste, F.Silkscreen, B.Silkscreen and Edge.Cuts. Tick **Use extended X2 format**: Gerber X2 adds attributes to each file (which layer it is, its position in the stack-up, which net each track belongs to, which objects are pads), so the fab's software can assign layers automatically and cross-check connectivity. Tick **Generate Gerber job file** too: the `.gbrjob` file describes the whole set (layer order, board thickness, finish) in one place. KiCad's Gerber X2 output is accepted by JLCPCB, PCBWay and the larger Indian fabs; if a fab asks for old-style RS-274X, untick X2." },
      { t: "p", text: "For drill files choose Excellon, units millimetres, and \"PTH and NPTH in a single file\" or separate files as your fab prefers (JLCPCB accepts either). Set the drill origin to the same origin as the Gerbers (absolute, or both relative to the same auxiliary origin) so holes line up with pads." },
      { t: "p", text: "Then **open the files in KiCad's Gerber Viewer** (from the project manager) and look at every layer. Check: holes centred in pads, mask openings on every pad, no silkscreen on pads, the outline closed, nothing on Edge.Cuts except the outline and intended cut-outs. Zip the Gerbers and drill files together; that zip is what you upload." },

      { t: "h", text: "BOM and placement for assembly" },
      { t: "p", text: "For assembly the fab needs to know which real part goes where. Give every symbol a manufacturer part number field (`MPN`) and, for JLCPCB assembly, an `LCSC` field holding the LCSC part number (for example C-numbers such as `C25804` for a resistor; look each one up, do not copy numbers from a tutorial). In the Schematic Editor's Generate Bill of Materials dialog choose the fields to export, group identical parts (same value, footprint and part number on one line with several designators) and export as CSV. JLCPCB expects columns named Comment, Designator, Footprint and LCSC Part #." },
      { t: "p", text: "The placement (CPL) file lists Designator, Mid X, Mid Y, Rotation and Layer for every SMD part. KiCad writes it from footprint origins, which is why footprints must have their origin at the part centre. The most common assembly error is **rotation**: KiCad's zero orientation for a part and the assembler's may differ by 90° or 180° (often for SOT-23s, diodes and connectors). Assembly services show a preview of each part on your board before you pay; check every polarised part (diodes, LEDs, ICs, electrolytics, the USB-C connector) in that preview and correct the rotation there or in your CPL file." },

      { t: "h", text: "How a two-layer board is fabricated" },
      { t: "list", ordered: true, items: [
        "**Material**: copper-clad FR-4 panel cut to size.",
        "**Drilling**: CNC drills make every plated hole from your drill file.",
        "**Plating the holes**: a thin chemical (electroless) copper layer makes the hole walls conductive, then electroplating builds them up to about 20 to 25 µm. This is why the finished hole is smaller than the drill and why hole tolerance is +0.13 / -0.08 mm.",
        "**Imaging and etching**: photoresist is exposed through your copper layer images; unwanted copper is etched away.",
        "**Solder mask**: liquid photoimageable mask is applied, exposed through the mask images and developed so pads are open.",
        "**Surface finish**: exposed copper is coated to stay solderable: HASL (hot-air levelled solder, cheap, slightly uneven) or ENIG (nickel and a thin gold layer, flat, best for fine pitch).",
        "**Silkscreen**, then **electrical test** (flying-probe testing checks every net for opens and shorts against your Gerber netlist, one more reason to use X2), then **routing** the outline and V-scoring.",
      ] },

      { t: "h", text: "How a board is assembled" },
      { t: "list", ordered: true, items: [
        "**Stencil printing**: a laser-cut stainless steel stencil made from your paste layers (F.Paste) deposits solder paste on the pads.",
        "**Solder paste inspection** (on better lines): cameras measure each paste deposit.",
        "**Pick-and-place**: the machine reads the CPL file, picks parts from reels and places them. Fiducials (bare copper dots) let its camera align to the board.",
        "**Reflow**: the board passes through an oven with a profile of preheat, soak, peak (about 240 to 250 °C for SAC305 lead-free paste) and cooling.",
        "**Inspection**: automated optical inspection (AOI) for every joint it can see; X-ray for hidden joints such as BGAs and QFN pads.",
        "**Through-hole parts**: by wave or selective soldering, or by hand. Keeping a board all-SMD on one side is the cheapest assembly.",
      ] },

      { t: "h", text: "Panelisation" },
      { t: "p", text: "Machines handle panels, not tiny boards. Small boards are joined into an array with **rails** (5 mm strips at the edges for conveyors, carrying fiducials and tooling holes). Boards separate by **V-score** (a V-groove cut part-way through from both sides, snapped apart; only straight lines across the whole panel, and copper must stay 0.4 mm from the score at JLCPCB) or by **tab routing with mouse bites** (the outline is milled with small tabs left, perforated by a row of small holes; works for any shape, leaves small nubs). JLCPCB and PCBWay will panelise for you; to do it yourself, the KiKit plugin for KiCad builds panels from a board file." },

      { t: "h", text: "Ordering" },
      { t: "p", text: "On the order page you set: layers 2, thickness 1.6 mm, FR-4, 1 oz copper, minimum track and hole (the site detects these from the files), solder mask colour, surface finish (HASL lead-free or ENIG; ENIG for the ESP32-S3 module's castellated pads and fine-pitch parts is worth the small extra cost), quantity, and whether to add assembly. With assembly you upload the BOM and CPL, confirm each part's match and stock, and review the placement preview. Order a stencil if you plan to assemble yourself. Keep the exact zip you uploaded with a revision number; you will need it to diagnose anything that comes back wrong." },

      { t: "deep", title: "Inside Gerber X2 and the job file", blocks: [
        { t: "p", text: "A Gerber file is a list of drawing commands: select an aperture (a round or rectangular pen), move, draw, flash. RS-274X (\"X1\") defined the image only; the layer's meaning was in the file name, and fabs guessed. X2 adds attribute commands. File attributes such as `%TF.FileFunction,Copper,L1,Top*%` say what the file is. Aperture attributes such as `%TA.AperFunction,SMDPad,CuDef*%` say what each flash represents. Object attributes such as `%TO.N,USB_DP*%` attach the net name to each track. The fab's CAM software can then check your copper against the netlist and set up electrical test without guessing." },
        { t: "snippet", lang: "text", code: String.raw`%TF.GenerationSoftware,KiCad,Pcbnew,10.0*%
%TF.FileFunction,Copper,L1,Top*%
%TF.FilePolarity,Positive*%
%FSLAX46Y46*%
%MOMM*%
%TA.AperFunction,SMDPad,CuDef*%
%ADD10R,0.600000X0.450000*%
%TD*%
%TO.N,USB_DP*%
%TO.C,J1*%
%TO.P,J1,A6*%
D10*
X12500000Y-8200000D03*`, caption: "Abbreviated top-copper X2 header and one flashed pad, as KiCad writes it." },
        { t: "p", text: "The `.gbrjob` file is JSON: board size, thickness, layer stack, finish and the list of Gerber files with their functions. It is what lets an order page pre-fill layer count and thickness from your upload." },
      ] },
      { t: "deep", title: "Reflow profiles and why parts tombstone", blocks: [
        { t: "p", text: "A typical lead-free reflow profile ramps at 1 to 3 °C/s to a soak at about 150 to 200 °C for 60 to 120 s (flux activates, the board equalises), then rises above the 217 °C liquidus for 45 to 90 s with a peak near 245 °C, then cools at a few °C/s. Too short a soak leaves large copper areas cooler than small pads." },
        { t: "p", text: "Tombstoning, where a chip resistor stands up on one end, happens when one pad melts before the other and surface tension pulls the part upright. The usual layout cause is unequal heat sinking: one pad connected straight into a big pour, the other to a thin track. Thermal relief spokes on pour connections (KiCad zones default to them) and symmetrical pad connections prevent it, which is a layout decision that affects assembly yield." },
      ] },
    ],
    mistakes: [
      "**Skipping the Gerber viewer check.** Problems such as missing mask openings or a broken outline only show in the output files.",
      "**DRC with stale zones.** Refill zones before the final DRC, or the check runs on old copper.",
      "**Wrong rotations in the CPL file.** Check every polarised part in the assembler's preview.",
      "**Footprint origins not at the part centre.** Pick-and-place uses the origin as the centroid; parts land offset.",
      "**Drill files with a different origin from the Gerbers.** Holes land beside the pads.",
      "**Copying LCSC part numbers from a tutorial.** Look up each part and confirm value, package and stock.",
    ],
    practice: {
      kind: "bench",
      task: "Produce a complete, checked fabrication and assembly package for your dev board.",
      steps: [
        "Run DRC with zone refill and schematic parity enabled, and clear every error.",
        "Plot Gerber X2 with a job file and generate Excellon drill files; open all of them in KiCad's Gerber Viewer and write a one-line check for each layer.",
        "Add MPN and LCSC fields to every SMD part, then export the BOM and the placement file.",
        "Upload the zip, BOM and CPL to an assembly service's quote page (do not pay), and screenshot the placement preview with every rotation corrected.",
        "Write a short order sheet: layers, thickness, copper, finish, mask colour, quantity, panel option and why.",
      ],
    },
    quiz: [
      {
        q: "What does Gerber X2 add over the older RS-274X format?",
        options: [
          "Higher resolution images",
          "Attributes: layer function, pad types and net names, so CAM software can identify layers and check connectivity",
          "Drill hole data",
          "3D models",
        ],
        answer: 1,
        why: "X2 keeps the same image commands but adds file, aperture and object attributes that describe what each layer and object is.",
      },
      {
        q: "Every SOT-23 transistor on an assembled board is rotated 180°. Which file was most likely wrong?",
        options: ["The drill file", "The component placement (CPL) file, or its rotation mapping", "The F.Silkscreen Gerber", "The job file"],
        answer: 1,
        why: "Rotation comes from the placement file. KiCad's zero orientation and the assembler's can differ, which is why the preview check exists.",
      },
      {
        q: "Why is the finished plated hole smaller than the drill size?",
        options: [
          "The drill wears out",
          "Copper is plated onto the hole wall, about 20 to 25 µm thick",
          "Solder mask fills it",
          "FR-4 expands",
        ],
        answer: 1,
        why: "Hole walls are plated after drilling. Fabs drill oversize to give the requested finished size, within a stated tolerance.",
      },
      {
        q: "Your board outline has curved edges and you need a panel. Which separation method fits?",
        options: ["V-score", "Tab routing with mouse bites", "Neither, curved boards cannot be panelised", "Laser cutting by hand"],
        answer: 1,
        why: "V-scores must be straight lines across the whole panel. Tab routing follows any shape.",
      },
      {
        q: "Which DRC option catches a footprint present in the schematic but missing from the board?",
        options: ["Refill all zones", "Test for parity between PCB and schematic", "Report all errors for each track", "Clearance Resolution"],
        answer: 1,
        why: "The parity test compares the board with the schematic netlist, reporting missing or extra footprints and net differences.",
      },
    ],
  },

  "a3-bring-up-exit-project": {
    id: "a3-bring-up-exit-project",
    outcomes: [
      "Inspect a newly assembled board systematically before power",
      "Bring a board up with a current-limited, staged power-on sequence",
      "Design test points and features that make bring-up and debugging easy",
      "Rework SMD parts and complete the dev board exit project",
    ],
    blocks: [
      { t: "h", text: "Bring-up is a planned experiment" },
      { t: "p", text: "Plugging a new board straight into a laptop is how USB ports and afternoons get destroyed. Bring-up is a sequence of checks in which each step is safe even if the previous assumption was wrong. Professionals write the bring-up plan while they design, and add features to the board (test points, jumpers, LEDs) specifically for it. This lesson gives you that plan, then pulls the module together into the exit project." },

      { t: "h", text: "Design for bring-up" },
      { t: "list", items: [
        "**Test points** on every supply rail (VBUS, +3V3), on GND, on EN and GPIO 0, and on the I2C lines. A 1 mm round pad with a label is enough for a probe; a loop or a pin header is better for a scope ground clip.",
        "**A way to break each rail**: a 0 Ω resistor or solder jumper between the LDO output and the module, so you can power the regulator alone and measure the module's current with a meter in series.",
        "**A power LED** on +3V3 (through 1 kΩ, about 1 mA for a typical LED) so you can see at a glance that the rail is up.",
        "**Silkscreen** for every test point, polarity marks on diodes and capacitors, pin 1 dots, and the board name and revision.",
        "**A spare GPIO to a header** for debugging toggles, and the UART0 TX/RX pins on a header as a fallback console.",
      ] },

      { t: "h", text: "Inspection before power" },
      { t: "list", ordered: true, items: [
        "**Visual, under magnification**: bridges on the USB-C connector and the module's castellated pads, tombstoned passives, missing parts, rotated diodes and ICs (compare pin 1 dots with the silkscreen).",
        "**Resistance between rails, unpowered**: VBUS to GND, +3V3 to GND. Expect from hundreds of ohms upward (there are loads on the rails) and a reading that rises as capacitors charge. A few ohms or less means a short. Also check VBUS to +3V3: they must not be connected.",
        "**Polarity of anything that matters**: the LDO orientation, the ESD array, electrolytics if any.",
      ] },

      { t: "h", text: "The power-on sequence" },
      { t: "p", text: "Use a bench supply, not USB, for the first power. Feed 5.0 V into VBUS at the test point or connector, with the **current limit at about 50 mA** and the module jumper open, so only the LDO, LED and protection are powered. Expected current: the LDO's quiescent current (tens of microamps) plus the power LED (about 1 mA). Watch the supply's constant-current (CC) indicator: if it lights, the supply is current limiting, which means a fault. Then measure +3V3: it should read 3.3 V within the LDO's tolerance (typically ±1 to 2%)." },
      { t: "p", text: "Close the module jumper, raise the limit to about 150 mA and power again. An idle ESP32-S3 running its boot ROM draws a few tens of milliamps. Then raise the limit to 600 mA and let firmware start Wi-Fi; peaks of a few hundred milliamps are normal. At each step, compare against the expected number written in the bring-up plan, and touch-test the LDO (carefully) or use a thermal camera: a regulator too hot to touch after a minute at idle has a fault downstream." },
      { t: "table", head: ["Step", "Limit", "Expected", "If not"], rows: [
        ["LDO only, module jumper open", "50 mA", "About 1 to 2 mA, +3V3 = 3.3 V", "Short or reversed part on the power sheet"],
        ["Module connected, held in reset (EN to GND)", "150 mA", "A few mA", "Short on the module side"],
        ["Module running boot ROM", "150 mA", "Tens of mA", "Check EN and GPIO 0 levels"],
        ["Wi-Fi active", "600 mA", "Average about 100 mA, peaks of several hundred mA", "Brown-out resets: check LDO and capacitors"],
      ] },
      { t: "p", text: "Only after this, plug into a computer through a USB cable. The board should enumerate as a USB Serial/JTAG device (on Linux `lsusb` shows Espressif's vendor ID 303a). Flash a blink and an I2C scanner. The scanner should find the sensor at its address (0x44 for an SHT40, 0x76 or 0x77 for a BME280)." },
      { t: "snippet", lang: "cpp", code: String.raw`// I2C bring-up check for the ESP32-S3 dev board (Arduino-ESP32 core 3.x).
// Sensor on GPIO 8 (SDA) and GPIO 9 (SCL), 4.7 kOhm pull-ups on the board.
#include <Wire.h>

const int SDA_PIN = 8;
const int SCL_PIN = 9;

void setup() {
  Serial.begin(115200);
  delay(1000);                       // let USB CDC enumerate
  Wire.begin(SDA_PIN, SCL_PIN, 100000);
  Serial.println("I2C scan:");
  int found = 0;
  for (uint8_t addr = 0x08; addr < 0x78; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  device at 0x%02X\n", addr);
      found++;
    }
  }
  if (found == 0) Serial.println("  none: check pull-ups, SDA/SCL swap, sensor power");
}

void loop() {}`, caption: "Compile with board \"ESP32S3 Dev Module\" and USB CDC On Boot enabled so Serial goes to the native USB port." },

      { t: "h", text: "When something is wrong: rework" },
      { t: "p", text: "Expect at least one fault on a first board. For SMD rework you need flux, braid, fine tweezers, an iron with a fine tip, and a hot-air station for anything with more than a few pins." },
      { t: "list", items: [
        "**Bridge on fine pitch**: add flux, drag a clean tip or desoldering braid across the pins.",
        "**Wrong or rotated two-terminal part**: heat both ends with two irons or a wide tip, or hot air, lift it off, clean the pads with braid, solder the new part.",
        "**IC or connector**: hot air at about 350 °C with a nozzle a little bigger than the part, moving in circles until all joints melt; lift with tweezers. Protect nearby plastic parts (the USB-C connector, buttons) with aluminium or polyimide tape.",
        "**Missing connection**: a bodge wire of thin enamelled wire (0.1 to 0.2 mm) from pad to pad, glued down with a dot of UV-cure mask or hot glue. Record it on the schematic as a change for the next revision.",
        "**Cut a track**: scrape through it with a sharp knife, check with a continuity meter that it is open.",
      ] },
      { t: "note", kind: "safety", text: "Hot-air nozzles reach 350 to 450 °C and the board stays hot for minutes. Use a heat-resistant mat, keep fingers off freshly reworked parts, and ventilate flux fumes. Disconnect power and any Li-ion battery before rework." },

      { t: "h", text: "Exit project: the ESP32-S3 dev board" },
      { t: "p", text: "Your exit project for this module is the board developed through these four lessons: a two-layer ESP32-S3-WROOM-1 board with USB-C (two 5.1 kΩ Rd resistors, ESD array), a 3.3 V LDO chosen by calculation, EN RC reset with RESET and BOOT buttons, and an I2C sensor, manufactured and brought up. Deliverables:" },
      { t: "list", ordered: true, items: [
        "Hierarchical schematic PDF with design calculations written on the sheets.",
        "Layout with net classes, JLCPCB-derived constraints, DRC report with zero errors.",
        "Fab package: Gerber X2 zip, drill, BOM, CPL, and your Gerber viewer checklist.",
        "A bring-up log: each step, the current limit, expected and measured values, and any rework with its root cause.",
        "A firmware demo that reads the sensor over I2C and prints temperature and humidity over native USB, then connects to Wi-Fi without brown-out resets.",
        "A revision list: every change you would make for revision B.",
      ] },

      { t: "deep", title: "Brown-out resets: diagnosing a weak supply", blocks: [
        { t: "p", text: "The ESP32-S3 has a brown-out detector that resets the chip if its supply falls below a threshold (around 2.4 to 2.8 V depending on configuration). If the board resets the moment Wi-Fi starts and the serial log shows a brown-out message, the supply sagged during a transmit burst. Trigger a scope on a falling edge on +3V3 at about 3.0 V, with a short ground spring at the module's ground. A dip of several hundred millivolts lasting tens of microseconds points at too little local capacitance or too much inductance between the capacitors and the module; a slow sag points at the LDO current limit, high cable resistance or a weak USB port." },
        { t: "p", text: "Fixes, in order of ease: add or move 10 µF and 22 µF ceramics right at the module's 3V3 pin; shorten and widen the +3V3 path; check the LDO's dropout at the actual VBUS (measure it under load; a long thin cable can bring it below 4.5 V); choose an LDO with more current headroom. Do not just turn the brown-out detector off in firmware: the chip may then run outside its supply specification." },
      ] },
      { t: "deep", title: "Writing a bring-up plan like a professional", blocks: [
        { t: "p", text: "A professional bring-up plan is a table written before the board arrives: step number, configuration (jumpers, what is fitted), stimulus (supply voltage and limit, firmware image), measurement point, expected value with limits, and pass or fail. It is written from the schematic and the datasheets, not from the board, so it is an independent check: if the board disagrees with the plan, either the board or the plan is wrong, and both are worth knowing." },
        { t: "p", text: "Keep the log with the board's serial number or revision. Faults that recur across several boards point at the design; faults on one board point at assembly. When you change the design for revision B, the log tells the next engineer why." },
      ] },
    ],
    mistakes: [
      "**First power from a laptop USB port.** A short can damage the port; use a current-limited bench supply first.",
      "**No expected values written down.** Without them a measurement cannot tell you whether something is wrong.",
      "**No test points or rail jumpers.** You cannot isolate a short or measure a block's current on a finished board.",
      "**Heating a whole area with hot air to remove one part.** Neighbouring parts and plastic connectors shift or melt; tape them and use a fitting nozzle.",
      "**Silencing brown-out resets in firmware.** The chip then runs out of specification; fix the supply.",
    ],
    practice: {
      kind: "bench",
      task: "Write and execute a bring-up plan for your manufactured dev board.",
      steps: [
        "Before the boards arrive, write the bring-up table: steps, limits, expected values and pass criteria, from your schematic and datasheets.",
        "Inspect each board under magnification and measure rail-to-ground resistances; record them.",
        "Power the LDO alone at 50 mA limit, then the module at 150 mA, then Wi-Fi at 600 mA, recording current and +3V3 at each step.",
        "Flash the I2C scanner, confirm the sensor address, then run a sensor and Wi-Fi demo for 10 minutes without resets.",
        "Rework any fault, find its root cause (design, library, assembly or handling) and add it to the revision B list.",
      ],
    },
    quiz: [
      {
        q: "Before any power, you measure 2 Ω between +3V3 and GND on a new board. What should you do?",
        options: [
          "Power it at full current to burn out the short",
          "Look for a short: bridges, a rotated part, a failed capacitor; do not power it",
          "Nothing, capacitors read low",
          "Power it from USB instead",
        ],
        answer: 1,
        why: "A few ohms is a short, not capacitor charging (which reads rising values). Find it unpowered, by inspection and by isolating blocks.",
      },
      {
        q: "Why power the LDO with the module jumper open first?",
        options: [
          "The module needs a separate supply",
          "So a fault in the power block shows up at low current, and the module is protected if the output is wrong",
          "To save energy",
          "Because ESP32 cannot start without it",
        ],
        answer: 1,
        why: "Staging isolates blocks. If the LDO output were wrong or shorted, the module is not exposed and the small current makes the fault obvious.",
      },
      {
        q: "A power LED with a 2.0 V forward drop on +3V3 uses a 1 kΩ resistor. Roughly what current does it draw?",
        options: ["13 mA", "3.3 mA", "1.3 mA", "0.13 mA"],
        answer: 2,
        why: "I = (3.3 - 2.0) / 1000 = 1.3 mA.",
      },
      {
        q: "The board resets with a brown-out message whenever Wi-Fi starts. Which first fix is most sensible?",
        options: [
          "Disable the brown-out detector",
          "Add local bulk ceramic capacitance at the module's 3V3 pin and check the supply path and LDO headroom",
          "Lower the CPU frequency only",
          "Replace the sensor",
        ],
        answer: 1,
        why: "Wi-Fi transmit peaks pull the rail down. Local capacitance and a low-impedance path fix the cause; disabling detection hides it.",
      },
      {
        q: "Why should test points include a ground point near each rail test point?",
        options: [
          "Ground points are required by DRC",
          "So a scope probe can use a short ground connection, keeping the measurement loop small",
          "To carry return current",
          "To lower the rail voltage",
        ],
        answer: 1,
        why: "A long ground lead forms a loop that picks up noise and rings. A nearby ground point allows a short spring connection.",
      },
    ],
  },
};

export default lessons;
