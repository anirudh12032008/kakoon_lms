import type { ModuleContent } from "../model/curriculum";

/**
 * Module a4: PCB design II, multilayer, signal integrity and EMC.
 * KiCad menu paths are for KiCad 10.0 (docs.kicad.org/10.0).
 * Stack-up data: JLCPCB impedance calculator, JLC04161H-7628 (checked November 2026).
 * Antenna guidance: Espressif ESP32-S3 hardware design guidelines (latest).
 * Normal mode is complete on its own; `deep` sections hold detail and background.
 */
const lessons: ModuleContent = {
  "a4-stackups-return-currents": {
    id: "a4-stackups-return-currents",
    outcomes: [
      "Explain where return current flows at low and high frequency",
      "Compare four-layer stack-ups (SIG/GND/PWR/SIG and SIG/GND/GND/SIG) and choose one",
      "Read a real fab stack-up and set it up in KiCad 10",
      "Find and fix reference-plane gaps and layer changes that break return paths",
    ],
    blocks: [
      { t: "h", text: "Every signal is a loop" },
      { t: "p", text: "A track does not carry a signal on its own. Current that leaves a driver along a track must come back to the driver, and the path it takes back, the **return path**, is as much part of the circuit as the track. Almost every signal integrity and EMC problem on a board is a return path problem: a loop that is too large radiates and picks up noise, a return current forced to detour creates ground bounce and crosstalk. A four-layer board is mostly a way of giving every signal a perfect return path, and that is why professional boards with any speed or radio on them are rarely two-layer." },
      { t: "p", text: "Module a3 built a two-layer ESP32-S3 board with one ground layer. This module moves to four layers, controlled impedance and EMC, and ends with a four-layer mixed-signal board with a wireless module, reviewed against EMC and DFM checklists." },

      { t: "h", text: "Where return current flows" },
      { t: "p", text: "At DC and low frequency, return current takes the path of **least resistance**: it spreads across the ground plane along the most direct route from load back to source. Above a few tens of kilohertz it takes the path of **least inductance**, which is the path that makes the smallest loop with the outgoing current: directly under the track, in the nearest plane. The return current then concentrates in a band under the track, most of it within a distance of a few times the track's height above the plane." },
      { t: "formula", text: String.raw`return current density in the plane, at distance x from the track centre
J(x) ∝ 1 / (1 + (x/h)²)        h = height of the track above the plane
about half the current lies within ±h, about 80% within ±3h`, caption: "The return current hugs the track; a closer plane gives a tighter, smaller loop." },
      { t: "p", text: "Check the fractions: integrating 1/(1 + u²) gives arctan, so the share within ±h is (2/π) × arctan(1) = 0.5, and within ±3h it is (2/π) × arctan(3) = 0.795. For a track 0.21 mm above its plane, 80% of the return flows in a 1.3 mm wide band. That band is what you must not cut." },

      { t: "h", text: "Reference planes and gaps" },
      { t: "p", text: "The plane a signal's return current flows in is its **reference plane**. Breaking that plane under a track forces the return current to go around the break, which enlarges the loop. The loop's area is what radiates and what picks up magnetic fields; its inductance is what causes ground bounce. Common breaks:" },
      { t: "list", items: [
        "**A slot or split** in the ground plane, often made to \"separate\" analog and digital ground. A track crossing it has its return current pushed to the end of the slot.",
        "**A row of vias with large anti-pads** (clearance holes in the plane), such as under a connector, which merges into a slot.",
        "**Routing a track over the edge of a pour** or over a gap between two different power pours on the PWR layer.",
        "**A layer change**: when a signal dives from layer 1 (referenced to GND on layer 2) to layer 4 (referenced to the PWR plane on layer 3), the return current has to jump from GND to PWR. It does that through the nearest decoupling capacitor, which may be far away.",
      ] },
      { t: "p", text: "Fixes: never route a fast signal across a gap; if a signal changes reference layer between two ground planes, put a **ground stitching via** next to the signal via, so the return has a short jump; if it changes between GND and PWR, put a small capacitor (or rely on one already within a few millimetres) between the two planes at the transition." },

      { t: "h", text: "Four-layer stack-ups" },
      { t: "p", text: "A stack-up is the order and thickness of the copper and dielectric layers. Here is a real one, JLCPCB's standard four-layer 1.6 mm build `JLC04161H-7628` from its impedance calculator:" },
      { t: "table", head: ["Layer", "Material", "Thickness", "εr"], rows: [
        ["L1 top copper", "1 oz outer", "0.035 mm", ""],
        ["Prepreg", "7628 × 1", "0.2104 mm", "4.4"],
        ["L2 inner copper", "0.5 oz", "0.0152 mm", ""],
        ["Core", "FR-4", "1.065 mm", "4.6"],
        ["L3 inner copper", "0.5 oz", "0.0152 mm", ""],
        ["Prepreg", "7628 × 1", "0.2104 mm", "4.4"],
        ["L4 bottom copper", "1 oz outer", "0.035 mm", ""],
      ], caption: "Total about 1.586 mm. Source: JLCPCB impedance calculator." },
      { t: "p", text: "Notice the shape: the outer layers are close to their neighbours (0.21 mm) and the two inner layers are far apart (1.065 mm). That shape is typical of cheap four-layer boards and it decides which arrangement works best." },
      { t: "table", head: ["Arrangement", "Good", "Weak"], rows: [
        ["SIG / GND / PWR / SIG", "Classic; a full power plane; L1 references GND closely", "L4 references PWR, so its returns jump to GND through capacitors; L2 to L3 are 1.065 mm apart, so the planes add almost no capacitance"],
        ["SIG / GND / GND / SIG", "Both signal layers reference ground closely; any layer change is GND to GND, fixed with one stitching via", "No power plane: power is routed as wide tracks or pours on L1 and L4"],
        ["GND / SIG / SIG / GND", "Outer planes shield the signals", "Signals cannot be probed or reworked; parts on the outside break the planes; inner signals couple across the thick core only weakly but have poor routing room"],
      ] },
      { t: "p", text: "For a board like the exit project (an ESP32-S3 module, a sensor, an ADC, a few hundred milliamps of 3.3 V) **SIG/GND/GND/SIG**, or the near-identical **SIG/GND/PWR-pour/SIG with mostly ground on L3**, is usually the better choice. Two or three supply rails are easily carried as pours and wide tracks on the outer layers, every signal has a ground reference 0.21 mm away, and layer changes are fixed with stitching vias. SIG/GND/PWR/SIG becomes the better choice when there are many rails or high currents that need a full plane. With JLCPCB's thick core, the interplane capacitance it is often credited with is negligible: for a 50 × 30 mm board, C = ε0 εr A / d = 8.854e-12 × 4.6 × 1.5e-3 / 1.065e-3 ≈ 57 pF." },
      { t: "note", kind: "tip", text: "Whatever stack-up you pick, keep it symmetrical (copper and dielectric mirror around the centre). An unbalanced stack bows during lamination and reflow." },

      { t: "h", text: "Setting it up in KiCad 10" },
      { t: "p", text: "In the PCB Editor, File → Board Setup → Board Stackup → Physical Stackup: set copper layers to 4, then enter each dielectric's thickness and εr from the fab's table. Under Board Editor Layers, give the inner layers meaningful names and types (power or signal). Draw a GND zone on In1.Cu covering the whole board and, for the SIG/GND/GND/SIG choice, another on In2.Cu. Stitch outer-layer ground pours to them with vias. KiCad 10's Tuning Profiles (in the Net Classes area of Board Setup) can compute track width for a target impedance from this stack-up, used in the next lesson." },

      { t: "deep", title: "Why the return current crowds under the track", blocks: [
        { t: "p", text: "At high frequency the current distribution minimises the total stored magnetic energy, which is the same as minimising loop inductance. Opposite currents close together cancel each other's fields, so the return current moves as close as it can to the outgoing current: in a plane below a track that means directly underneath. The 1/(1 + (x/h)²) profile comes from the method of images: a track at height h over a perfect plane behaves as if an equal and opposite image current flowed at depth h, and the field from that pair at the plane surface gives the induced current density." },
        { t: "p", text: "The transition frequency from \"least resistance\" to \"least inductance\" is where the plane's inductive reactance ωL becomes larger than its resistance R. For 1 oz copper planes it is in the kilohertz to tens of kilohertz range, which is why even audio-rate switching currents follow their tracks fairly closely." },
      ] },
      { t: "deep", title: "Six-layer and HDI stack-ups in outline", blocks: [
        { t: "p", text: "Six layers allow SIG / GND / SIG / PWR / GND / SIG or the more robust SIG / GND / SIG / SIG / GND / SIG with power on pours; each signal layer has an adjacent ground. Eight layers give room for two inner stripline layers between ground planes, the usual choice for DDR memory and multi-gigabit links. HDI boards add laser microvias (blind vias between adjacent layers) so fine-pitch BGAs can be escaped without through vias blocking every layer." },
        { t: "p", text: "Each extra layer pair roughly adds a fixed cost, but often removes the need for a shield can or a second spin to pass EMC. The decision is economic: compare the cost of the layers with the cost of failing a compliance test." },
      ] },
    ],
    mistakes: [
      "**Splitting the ground plane by default.** A split under a crossing track is a large loop; use one ground and partition by placement.",
      "**Changing layers without a stitching via.** The return current must jump planes; give it a path within a millimetre or two.",
      "**Assuming a four-layer power plane gives useful decoupling capacitance.** With a 1 mm core it gives tens of picofarads; capacitors do the work.",
      "**Unbalanced stack-ups.** The board warps during lamination and reflow.",
      "**Routing on L4 referenced to a split power plane.** Every gap between pours is a return path break.",
    ],
    practice: {
      kind: "bench",
      task: "Choose and justify a four-layer stack-up for the exit-project board.",
      steps: [
        "Open JLCPCB's impedance calculator and copy the layer table for JLC04161H-7628 into your notes.",
        "Draw both SIG/GND/PWR/SIG and SIG/GND/GND/SIG for your board's rails and signals, and list every layer change each would force.",
        "Compute the interplane capacitance your board would get between L2 and L3.",
        "Enter the chosen stack-up in KiCad 10's Physical Stackup and add the inner ground zones.",
        "Move one signal across a deliberate slot in a scratch copy of the board and mark the return path the current must take; then fix it.",
      ],
    },
    quiz: [
      {
        q: "At 10 MHz, where does the return current for a top-layer track over a solid ground plane mainly flow?",
        options: [
          "By the shortest straight line through the plane",
          "In the plane directly under the track",
          "Through the board's mounting holes",
          "Evenly across the whole plane",
        ],
        answer: 1,
        why: "Above a few tens of kHz the return takes the path of least inductance, which is directly under the outgoing current.",
      },
      {
        q: "On JLC04161H-7628, which arrangement gives both signal layers a ground reference 0.21 mm away?",
        options: ["SIG/GND/PWR/SIG", "SIG/GND/GND/SIG", "GND/PWR/SIG/SIG", "SIG/PWR/PWR/SIG"],
        answer: 1,
        why: "With GND on both L2 and L3, L1 and L4 each sit one 0.21 mm prepreg away from a ground plane.",
      },
      {
        q: "What fraction of the return current flows within ±3h of the track centre?",
        options: ["About 50%", "About 80%", "About 95%", "100%"],
        answer: 1,
        why: "(2/π) × arctan(3) ≈ 0.795, about 80%.",
      },
      {
        q: "A signal changes from L1 (over GND on L2) to L4 (over GND on L3). What should be next to the signal via?",
        options: ["A series resistor", "A ground stitching via joining L2 and L3", "A test point", "Nothing"],
        answer: 1,
        why: "The return must move from L2's ground to L3's. A stitching via beside the signal via gives it a short path.",
      },
      {
        q: "Why is the interplane capacitance of a cheap four-layer board's L2 and L3 negligible?",
        options: ["Copper is too thin", "They are separated by a thick core (about 1 mm), so C = ε0 εr A / d is only tens of pF", "FR-4 is a conductor", "The planes are at the same voltage"],
        answer: 1,
        why: "Capacitance falls with spacing; at 1.065 mm and a small board area it is about 57 pF, far less than one decoupling capacitor.",
      },
    ],
  },

  "a4-transmission-lines-differential-pairs": {
    id: "a4-transmission-lines-differential-pairs",
    outcomes: [
      "Decide when a track must be treated as a transmission line, using the critical length rule",
      "Compute microstrip characteristic impedance for a real stack-up",
      "Predict reflections and choose series or parallel termination",
      "Route differential pairs for USB 2.0, Ethernet and CAN, with length matching",
    ],
    blocks: [
      { t: "h", text: "When a wire stops being a wire" },
      { t: "p", text: "At low speed a track is a node: the whole length is at one voltage. When the signal edge is fast compared with the time it takes to travel along the track, different parts of the track are at different voltages at the same instant, and the track behaves as a **transmission line**: a wave travels along it, and anything that changes the impedance along the way reflects part of the wave back. Reflections show up as ringing, overshoot that stresses inputs, and false clock edges. An ESP32's GPIO edge is a few nanoseconds; that is fast enough for this to matter on tracks only a few centimetres long." },

      { t: "h", text: "Propagation delay and the critical length" },
      { t: "p", text: "A signal travels at c / √εeff, where εeff is the effective dielectric constant the field sees. For a stripline buried in FR-4, εeff ≈ εr ≈ 4.4, so the delay is about 7 ps/mm. For a microstrip on the outer layer, part of the field is in air and εeff is lower, around 3.3 on our stack-up, giving about 6 ps/mm." },
      { t: "formula", text: String.raw`t_pd = √εeff / c        c = 0.2998 mm/ps
microstrip, εeff ≈ 3.3:  t_pd = 1.817 / 0.2998 ≈ 6.06 ps/mm
critical length (rule of thumb):  ℓ_crit ≈ t_r / (6 × t_pd)
t_r = 1 ns:  ℓ_crit = 1000 / (6 × 6.06) ≈ 27.5 mm`, caption: "Lines longer than about one sixth of the edge's travel distance need impedance control and termination." },
      { t: "p", text: "Check: √3.3 = 1.817; 1.817 / 0.2998 = 6.06 ps/mm; 6 × 6.06 = 36.4; 1000 / 36.4 = 27.5 mm. Note that the rise time, not the clock frequency, sets this. A 1 kHz signal with a 1 ns edge reflects just as badly as a 100 MHz one. Slowing edges (a series resistor, or the ESP32's GPIO drive strength setting) is often the simplest fix." },

      { t: "h", text: "Characteristic impedance" },
      { t: "p", text: "A transmission line has inductance L and capacitance C per unit length, and a wave on it sees a ratio of voltage to current called the **characteristic impedance** Z0 = √(L/C). It is set by geometry: track width w, height h above the reference plane, copper thickness t and εr. Wider track or thinner dielectric means more capacitance and lower Z0. The IPC-2141 approximation for surface microstrip is:" },
      { t: "formula", text: String.raw`Z0 ≈ 87 / √(εr + 1.41) × ln( 5.98 h / (0.8 w + t) )      (valid roughly 0.1 < w/h < 2)

JLC04161H-7628, L1 over L2:  h = 0.2104 mm, εr = 4.4, t = 0.035 mm
try w = 0.34 mm:
  87 / √5.81            = 87 / 2.410 = 36.09
  5.98 × 0.2104         = 1.258
  0.8 × 0.34 + 0.035    = 0.307
  ln(1.258 / 0.307)     = ln(4.098) = 1.410
  Z0 ≈ 36.09 × 1.410    ≈ 50.9 Ω`, caption: "A 0.34 to 0.36 mm track on JLCPCB's standard four-layer build is close to 50 Ω." },
      { t: "p", text: "Solving the other way, w = 0.36 mm gives 49.1 Ω, so about 0.35 mm is 50 Ω on this stack-up by IPC-2141. That formula is an approximation, good to about ±5 to 10%. Before ordering a controlled-impedance board, check with a field solver (KiCad's Calculator Tools has a transmission line page, and JLCPCB's impedance calculator uses its own stack-up data) and order the impedance option so the fab measures and adjusts. On a two-layer 1.6 mm board, h ≈ 1.5 mm and a 50 Ω microstrip needs about 2.8 mm of track, which is why controlled impedance is a four-layer topic." },

      { t: "h", text: "Reflections and termination" },
      { t: "p", text: "When a wave travelling on a line of impedance Z0 reaches a load ZL, a fraction Γ of it reflects:" },
      { t: "formula", text: String.raw`Γ = (ZL - Z0) / (ZL + Z0)
open end (CMOS input), ZL → ∞ : Γ = +1   (voltage doubles at the input)
short,               ZL = 0  : Γ = -1
matched,             ZL = Z0 : Γ = 0
driver 20 Ω on 50 Ω line     : Γ_source = (20 - 50)/(20 + 50) = -0.43`, caption: "Reflection coefficient." },
      { t: "p", text: "A CMOS input is nearly an open circuit, so the wave doubles there and reflects back towards the driver. A low-impedance driver (20 Ω) reflects it again, inverted by Γ = -0.43, and the signal rings until the reflections die. Two standard cures:" },
      { t: "list", items: [
        "**Series (source) termination**: a resistor at the driver so that driver impedance plus resistor equals Z0. For a 20 Ω driver on 50 Ω, use 30 Ω (in practice 22 to 33 Ω). The launched wave is half amplitude, doubles at the open far end to full amplitude, and the reflection is absorbed at the matched source. No DC current, one part per line. Best for point-to-point lines such as SPI clocks.",
        "**Parallel (end) termination**: a resistor equal to Z0 from the far end to ground (or to a mid-rail). No reflection at all, but it draws DC current. Used where there are several loads along a line, and for buses with a defined impedance such as CAN.",
      ] },

      { t: "h", text: "Differential pairs" },
      { t: "p", text: "A differential pair carries a signal as the difference between two tracks driven in opposite directions. The receiver ignores what is common to both (noise coupled equally into each), and the two opposite currents largely cancel each other's fields, so a well-routed pair radiates little. The pair has a **differential impedance** Zdiff, roughly 2 × Z0 × (1 - coupling); it is set by track width, gap and height." },
      { t: "table", head: ["Interface", "Differential impedance", "Notes"], rows: [
        ["USB 2.0", "90 Ω ± 10%", "Espressif asks for 90 Ω on the ESP32-S3's D+/D-; at full speed (12 Mbit/s) short runs are forgiving, high speed (480 Mbit/s) is not"],
        ["Ethernet 10/100BASE-T (PHY to magnetics)", "100 Ω", "Keep pairs over solid ground, magnetics close to the RJ45"],
        ["CAN", "120 Ω", "The cable and its two 120 Ω end terminations define the bus; on the board, keep CANH/CANL together and short, terminate only at the bus ends"],
      ] },
      { t: "p", text: "Routing rules for any pair: keep the two tracks the same width and the gap constant from end to end; route them together, both on the same layer, over an unbroken plane; avoid vias, and if one is needed, put a pair of ground vias next to the pair of signal vias; do not run other signals between them; keep at least 3 to 5 times the gap to anything else. In KiCad 10, name the nets with a matching suffix (`USB_D+` and `USB_D-`, or `_P` and `_N`) so the router recognises them, then use the Route Differential Pairs tool (Route menu, hotkey 6); set the width and gap in the net class or a tuning profile." },

      { t: "h", text: "Length matching" },
      { t: "p", text: "The two halves of a pair must arrive together, or part of the differential signal turns into common-mode noise that radiates. The allowed mismatch follows from the timing: skew = Δℓ × t_pd. At 6.06 ps/mm, a 0.15 mm mismatch is 0.9 ps, negligible even for USB high speed's 2083 ps bit time (1 / 480 MHz). A common guideline for USB 2.0 is to keep the D+/D- mismatch within about 0.15 mm (a few mils); for full speed you have far more margin, but matching is free so do it anyway. KiCad 10's length tuning tools (\"Tune skew of a differential pair\" and the single-track and pair length tuners, in the Route menu and the right toolbar) add serpentine meanders. Put the meander near the end where the mismatch arises (at a bend or a connector pin), keep meander gaps at least three times the track width, and match lengths between different pairs only when a standard requires it (for example the data lanes of a parallel bus)." },

      { t: "deep", title: "Deriving the critical length rule", blocks: [
        { t: "p", text: "A line is \"electrically short\" if reflections settle within the edge itself. A reflection takes a round trip of 2 × ℓ × t_pd. If that is much less than t_r, the reflections overlap the edge and merely round it; if it is comparable, they appear as distinct steps and ringing. Requiring the round trip to be under a third of t_r gives ℓ < t_r / (6 t_pd), the rule used above. Some texts use t_r / (4 t_pd) or t_r / (2 t_pd); all are rules of thumb that answer \"when must I start thinking about it?\", not exact limits. If a line is near the limit, simulate it or terminate it." },
        { t: "p", text: "Edge rate also sets bandwidth: the knee frequency f_knee ≈ 0.35 / t_r (or 0.5 / t_r in some texts). A 1 ns edge has significant energy up to 350 to 500 MHz, which is the frequency at which your board's interconnect, decoupling and EMC must be considered, regardless of the clock rate." },
      ] },
      { t: "deep", title: "Accurate microstrip: Hammerstad and the effective dielectric constant", blocks: [
        { t: "p", text: "The Hammerstad and Jensen equations are more accurate than IPC-2141 across a wider range. For zero-thickness copper and u = w/h ≥ 1: Z0 = 120π / (√εeff × (u + 1.393 + 0.667 ln(u + 1.444))), with εeff = (εr + 1)/2 + (εr - 1)/2 × (1 + 12/u)^(-1/2). Copper thickness is then accounted for by an effective width slightly larger than w, which lowers Z0." },
        { t: "p", text: "For w = 0.34 mm on h = 0.2104 mm (u = 1.616), εeff ≈ 3.29 and zero-thickness Z0 ≈ 55 Ω. The 35 µm copper widens the track electrically and brings it down a few ohms, and the solder mask over the track lowers it by another 1 to 3 Ω, landing within a few ohms of the IPC-2141 answer (about 48 to 50 Ω). This is the reason to finish with a field solver that models thickness and solder mask: closed-form formulas disagree by several percent, which is the same size as the ±10% tolerance fabs guarantee." },
      ] },
    ],
    mistakes: [
      "**Judging by clock frequency instead of edge rate.** A slow clock with fast edges still reflects.",
      "**Assuming controlled impedance on a two-layer 1.6 mm board.** The plane is too far away; a 50 Ω track would be about 3 mm wide.",
      "**Parallel-terminating a point-to-point CMOS line to ground.** It draws large DC current; a series resistor at the source is usually right.",
      "**Splitting a differential pair around a via or part.** The gap changes, impedance jumps and common mode appears.",
      "**Meandering one half of a pair far from where the mismatch arose.** The halves are skewed along most of the route.",
      "**Terminating CAN on every node.** Only the two ends of the bus get 120 Ω.",
    ],
    practice: {
      kind: "bench",
      task: "Design the controlled-impedance and differential routing for the exit-project board.",
      steps: [
        "Compute the 50 Ω microstrip width for L1 on JLC04161H-7628 with IPC-2141, then check it with KiCad's Calculator Tools and JLCPCB's impedance calculator; tabulate the three answers.",
        "Find the width and gap for a 90 Ω USB pair on the same stack-up with a calculator, and create a USB net class or tuning profile with them.",
        "Route the USB pair from the connector through the ESD array to the module with no vias, and tune the skew below 0.15 mm.",
        "List every track longer than the critical length for a 1 ns edge (27.5 mm) and add a series resistor footprint near the driver of each.",
        "If you have a scope with at least 100 MHz bandwidth, probe a GPIO toggling over a 20 cm wire with and without a 33 Ω series resistor and compare the ringing.",
      ],
    },
    quiz: [
      {
        q: "A GPIO edge has a 2 ns rise time on microstrip with t_pd = 6 ps/mm. Using ℓ_crit = t_r / (6 t_pd), what is the critical length?",
        options: ["About 11 mm", "About 56 mm", "About 333 mm", "About 5.6 mm"],
        answer: 1,
        why: "2000 / (6 × 6) = 2000 / 36 ≈ 56 mm.",
      },
      {
        q: "A 50 Ω line drives a CMOS input (nearly open circuit). What is the reflection coefficient at the input?",
        options: ["0", "-1", "+1", "-0.43"],
        answer: 2,
        why: "Γ = (ZL - Z0) / (ZL + Z0) tends to +1 as ZL becomes very large: the wave reflects fully and the voltage doubles.",
      },
      {
        q: "A driver with 15 Ω output impedance drives a 50 Ω line point to point. What series termination resistor is ideal?",
        options: ["50 Ω", "15 Ω", "35 Ω", "65 Ω"],
        answer: 2,
        why: "Driver plus resistor should equal Z0: 15 + 35 = 50 Ω.",
      },
      {
        q: "Using IPC-2141, how does Z0 change if the prepreg under a microstrip is made thinner?",
        options: ["It rises", "It falls", "It does not change", "It becomes infinite"],
        answer: 1,
        why: "Z0 depends on ln(5.98 h / (0.8 w + t)); a smaller h lowers the logarithm, so Z0 falls (more capacitance to the plane).",
      },
      {
        q: "What differential impedance does a USB 2.0 pair need, and what does CAN use?",
        options: ["50 Ω and 50 Ω", "90 Ω and 120 Ω", "100 Ω and 90 Ω", "120 Ω and 100 Ω"],
        answer: 1,
        why: "USB 2.0 is 90 Ω differential; CAN buses are terminated with 120 Ω at each end to match the cable.",
      },
      {
        q: "A USB pair has 0.5 mm length mismatch at 6.06 ps/mm. What is the skew?",
        options: ["About 3 ps", "About 30 ps", "About 0.3 ps", "About 300 ps"],
        answer: 0,
        why: "0.5 × 6.06 = 3.03 ps, tiny next to the 2083 ps high-speed bit time, though still worth tuning out.",
      },
    ],
  },

  "a4-crosstalk-power-integrity-mixed-signal": {
    id: "a4-crosstalk-power-integrity-mixed-signal",
    outcomes: [
      "Estimate and reduce crosstalk between neighbouring tracks",
      "Calculate ground bounce from inductance and current slew",
      "Compute a PDN target impedance and choose a decoupling network to meet it",
      "Partition and ground a mixed-signal board without splitting the plane",
    ],
    blocks: [
      { t: "h", text: "Noise you create yourself" },
      { t: "p", text: "Most noise on a board is not from outside. It is your own fast edges coupling into the next track, your own switching currents bouncing the ground, and your own Wi-Fi bursts denting the 3.3 V rail under an ADC. These effects decide whether a 12-bit ADC gives 12 useful bits or 8, and whether a board passes EMC. They all come from the same few physical quantities: mutual capacitance, mutual and self inductance, and the impedance of the power network." },

      { t: "h", text: "Crosstalk" },
      { t: "p", text: "Two neighbouring tracks are coupled by **mutual capacitance** (an edge on the aggressor pushes current through the capacitance into the victim) and by **mutual inductance** (the aggressor's changing current induces a voltage in the victim loop). Over a solid plane, the coupling falls quickly with separation D relative to height h:" },
      { t: "formula", text: String.raw`crosstalk ∝ 1 / (1 + (D/h)²)
h = 0.21 mm (outer layer, four-layer board)
D = 0.2 mm : 1 / (1 + 0.91) = 0.52
D = 0.6 mm : 1 / (1 + 8.2)  = 0.11
D = 1.0 mm : 1 / (1 + 22.7) = 0.042`, caption: "Relative coupling. Tripling the spacing cuts crosstalk by about a factor of five here." },
      { t: "p", text: "Check: (0.2/0.21)² = 0.907; (0.6/0.21)² = 8.16; (1.0/0.21)² = 22.7. Two consequences. First, a nearby plane is the strongest crosstalk control, because it shrinks h; the same spacing on a two-layer board (h ≈ 1.5 mm) couples far more. Second, the **3W rule** (centre-to-centre spacing at least three times the track width, so the gap is two widths) is a reasonable default for clocks and other aggressors on four-layer boards. Keep parallel runs short; crosstalk grows with coupled length until it reaches a saturation length set by the edge rate. Route adjacent layers in a stripline pair at right angles to each other. Put sensitive analog tracks away from clocks and SPI lines, and a ground guard track (stitched with vias every few millimetres) only where spacing is impossible." },

      { t: "h", text: "Ground bounce" },
      { t: "p", text: "Every connection from a chip's die to the ground plane (bond wire, package lead, pad, via) has inductance, typically a few nanohenries in total. When outputs switch, their current changes quickly through that inductance, and the chip's internal ground moves relative to the board's:" },
      { t: "formula", text: String.raw`V_bounce = L × di/dt
one output: L = 2 nH, Δi = 20 mA in 1 ns
  V = 2e-9 × 0.020 / 1e-9 = 0.04 V = 40 mV
eight outputs switching together through the same ground path:
  V = 8 × 40 mV = 320 mV`, caption: "Simultaneous switching noise. The same happens on the supply pins (supply droop)." },
      { t: "p", text: "320 mV of bounce on a 3.3 V chip can make a quiet output glitch or shift an input's threshold. Reduce it by lowering L (short, wide ground connections, a via at every ground pad, multiple ground vias under a thermal pad: Espressif asks for at least nine under the ESP32-S3's exposed pad), by lowering di/dt (lower GPIO drive strength, series resistors, not switching a whole byte at once), and with decoupling capacitors close to the pins." },

      { t: "h", text: "Power integrity and target impedance" },
      { t: "p", text: "The **power distribution network** (PDN) is everything between the regulator and the chip's die: regulator, planes or pours, vias, capacitors, package. Think of it as an impedance Z(f) seen by the chip. When the chip's current changes by ΔI, the rail moves by ΔI × Z. If you allow a ripple of a few percent of the rail, you get a **target impedance** that the PDN must stay below across the frequencies where the current changes:" },
      { t: "formula", text: String.raw`Z_target = (V_rail × allowed ripple) / ΔI_transient
ESP32-S3 module: 3.3 V, 3% ripple, 0.5 A Wi-Fi current step
Z_target = 3.3 × 0.03 / 0.5 = 0.198 Ω ≈ 0.2 Ω`, caption: "Target impedance of the 3.3 V rail." },
      { t: "p", text: "Now see what parts can meet 0.2 Ω. The LDO's control loop handles low frequencies (up to tens or hundreds of kilohertz). Above that, capacitors must. A real capacitor is a series C, ESR and ESL (equivalent series inductance, including its mounting: pads, tracks and vias). A mounted 0402 or 0603 ceramic has about 0.5 to 1 nH. Take 0.8 nH:" },
      { t: "formula", text: String.raw`100 nF, 0.8 nH, at 10 MHz:  |Z_C| = 1/(2π × 10e6 × 100e-9) = 0.159 Ω,  |Z_L| = 2π × 10e6 × 0.8e-9 = 0.050 Ω
self-resonance f0 = 1 / (2π √(L C)) = 1 / (2π √(0.8e-9 × 100e-9)) ≈ 17.8 MHz
at 100 MHz:  |Z| ≈ 2π × 100e6 × 0.8e-9 = 0.50 Ω   (inductive, the C no longer matters)
need 0.50 / 0.198 ≈ 2.5, so at least 3 such capacitors in parallel to meet 0.2 Ω at 100 MHz`, caption: "Above self-resonance a capacitor is an inductor; parallel capacitors and short mounting lower the inductance." },
      { t: "p", text: "The lessons: above about 20 MHz, **mounting inductance, not capacitance, decides decoupling**, so short connections and parallel parts matter more than value. Use a bulk 10 to 22 µF ceramic near the module for the Wi-Fi burst current, several 100 nF (or 1 µF in 0402) for the mid range, and let the package and die capacitance take over above a few hundred megahertz. Mixing values can create **anti-resonance** peaks where one capacitor's inductance resonates with the next one's capacitance; keeping ESR not too low (ceramics are very low) and using several parts of the same value spreads the peaks." },

      { t: "h", text: "Mixed-signal layout" },
      { t: "p", text: "A mixed-signal board has analog parts (sensors, ADC inputs, references, audio) and digital parts (the MCU, switching regulators, radio). The old advice was to split the ground plane into AGND and DGND joined at one point. On most modern boards that does more harm than good: any signal crossing the split has a broken return path, which radiates and couples. The modern approach:" },
      { t: "list", ordered: true, items: [
        "**One solid ground plane** for the whole board (on a four-layer board, L2 and possibly L3).",
        "**Partition by placement**: put the analog section in one area and the digital and radio section in another, so digital return currents (which stay under their tracks) never flow through the analog area.",
        "**Route analog signals only over the analog area**, and digital signals only over the digital area. Signals that must pass between them (SPI to an ADC) cross at the ADC, which sits on the boundary.",
        "**Mixed-signal chips** (ADC, codec): connect their AGND and DGND pins together to the one plane right at the chip, as most datasheets now recommend.",
        "**Filter the analog supply**: a ferrite bead or small resistor followed by capacitors from the digital 3.3 V, or a separate low-noise LDO for the analog rail.",
        "**Keep switching regulators and the radio away** from analog inputs, and route switcher hot loops tight (input capacitor, switch, diode or low-side switch in a small loop).",
      ] },

      { t: "deep", title: "Near-end and far-end crosstalk", blocks: [
        { t: "p", text: "Crosstalk splits into near-end (NEXT, appearing at the victim's end nearest the driver) and far-end (FEXT, at the other end). Capacitive and inductive coupling add at the near end and subtract at the far end. In a homogeneous stripline the two are equal and FEXT cancels; in microstrip the inductive part is larger (part of the field is in air), so FEXT is negative and grows with coupled length and edge rate. That is one reason stripline is preferred for long parallel buses." },
        { t: "p", text: "NEXT grows with coupled length until the length reaches half the edge's travel distance (t_r / (2 t_pd)), then saturates; for a 1 ns edge at 6 ps/mm that is about 83 mm. Below it, halving the parallel length roughly halves the crosstalk; above it, only spacing and height help." },
      ] },
      { t: "deep", title: "Designing a PDN across frequency", blocks: [
        { t: "p", text: "The full method plots |Z(f)| of the PDN from 1 kHz to 1 GHz against Z_target. Each element covers a band: the regulator up to its loop bandwidth, bulk capacitors from there to about 1 MHz, ceramic capacitors from 1 to perhaps 100 MHz, plane capacitance (only with thin dielectrics, around 0.1 mm or less between power and ground) and the package above. Simulators such as the free PDN tools from capacitor makers (Murata SimSurfing, KEMET K-SIM give measured impedance curves including DC bias) let you add capacitors and watch the curve." },
        { t: "p", text: "A practical rule from that analysis: the capacitor's mounted inductance is roughly the sum of its body (0.3 to 0.5 nH for 0402), the pad-to-via tracks (roughly 0.3 to 0.5 nH per mm of thin track over a 0.2 mm dielectric, more over a distant plane) and the vias. Putting the vias at the ends of the pads or beside them, not at the end of tracks, routinely halves the total." },
      ] },
    ],
    mistakes: [
      "**Splitting AGND and DGND with signals crossing the split.** Partition by placement over one plane instead.",
      "**Choosing decoupling by capacitance only.** Above self-resonance the mounting inductance sets the impedance.",
      "**Long tracks from capacitors to vias.** Each millimetre adds inductance; place vias at the pads.",
      "**Running a clock parallel to an analog input for centimetres.** Space them out and route them on different areas or layers.",
      "**One ground via shared by several pins and capacitors.** It becomes a common inductance and causes ground bounce.",
      "**Ignoring DC bias on X5R/X7R decoupling.** The real capacitance at 3.3 V can be well below the marking.",
    ],
    practice: {
      kind: "bench",
      task: "Design and measure the PDN and grounding of the exit-project board.",
      steps: [
        "Compute the 3.3 V target impedance for your board's largest current step and allowed ripple.",
        "Using a capacitor maker's online tool, plot the impedance of your chosen decoupling set (including DC bias) and check it against the target from 100 kHz to 100 MHz.",
        "Draw a partition map: analog area, digital area, radio area, switcher hot loop. Move parts until no digital track passes over the analog area.",
        "On an existing board, probe the 3.3 V rail at the module with a short ground spring while Wi-Fi transmits, and measure the dip; repeat after adding a 22 µF ceramic at the module.",
      ],
    },
    quiz: [
      {
        q: "A 3.3 V rail may move 2% and the load steps by 0.33 A. What is the target impedance?",
        options: ["0.2 Ω", "0.02 Ω", "2 Ω", "0.1 Ω"],
        answer: 0,
        why: "Z = 3.3 × 0.02 / 0.33 = 0.066 / 0.33 = 0.2 Ω.",
      },
      {
        q: "Ground path inductance is 3 nH and an output's current changes by 30 mA in 2 ns. What is the bounce?",
        options: ["4.5 mV", "45 mV", "450 mV", "90 mV"],
        answer: 1,
        why: "V = L × di/dt = 3e-9 × 0.030 / 2e-9 = 0.045 V = 45 mV.",
      },
      {
        q: "A mounted 100 nF capacitor has 0.8 nH. Above its self-resonance (about 18 MHz), what sets its impedance?",
        options: ["Its capacitance", "Its inductance", "Its voltage rating", "Its tolerance"],
        answer: 1,
        why: "Above resonance the inductive reactance dominates; |Z| ≈ 2π f L, independent of the capacitance.",
      },
      {
        q: "Doubling the spacing between two microstrips from D = h to D = 2h changes relative crosstalk by roughly what factor?",
        options: ["Halves it", "From 0.5 to 0.2, a factor of 2.5", "No change", "Quarters it exactly"],
        answer: 1,
        why: "1 / (1 + 1²) = 0.5 and 1 / (1 + 2²) = 0.2, so it falls by 2.5 times.",
      },
      {
        q: "What is the modern recommended grounding for a board with an ADC and an MCU?",
        options: [
          "Separate AGND and DGND planes joined by a long track",
          "One solid ground plane, with analog and digital sections partitioned by placement",
          "No ground plane",
          "A separate ground plane for each IC",
        ],
        answer: 1,
        why: "A single plane keeps every return path intact; placement keeps digital return currents out of the analog area.",
      },
    ],
  },

  "a4-rf-and-emc": {
    id: "a4-rf-and-emc",
    outcomes: [
      "Place a Wi-Fi/BLE module and its antenna keep-out per Espressif's guidelines",
      "Design an L or pi matching network for a given impedance at 2.4 GHz",
      "Identify EMI sources and apply filtering, ferrites, shielding and ESD/TVS protection",
      "Run near-field pre-compliance scans and read them against CISPR 32 Class B in outline",
    ],
    blocks: [
      { t: "h", text: "The radio and the regulations" },
      { t: "p", text: "A wireless product has two RF jobs. It must radiate well where you want it to (the antenna) and radiate little everywhere else (EMC), and it must not be upset by what others radiate or by a spark from a finger. Before a product can be sold it must pass emissions and immunity tests; in India, as in the EU and US, these follow international standards such as CISPR 32 for emissions. Failing them late is expensive. Most of the fixes are layout decisions you have already learned: return paths, small loops, solid planes. This lesson adds antennas, matching and the test methods." },

      { t: "h", text: "Antennas and the keep-out" },
      { t: "p", text: "The ESP32-S3-WROOM-1 carries a PCB trace antenna at one end of the module, tuned by Espressif for the module sitting on a board in a specified way. The antenna works by having its near field spread into the space around it. Copper under or beside it (ground pour, tracks, a battery, a metal case) loads that field, shifts the resonant frequency and absorbs power. Espressif's ESP32-S3 hardware design guidelines say:" },
      { t: "list", items: [
        "Place the module so its **antenna extends beyond the edge** of the base board, with the antenna feed point near the edge. This is strongly recommended.",
        "If it cannot overhang, keep the feed point as close to the edge as possible and **cut the base board away** on both sides of and below the antenna. Do not put the module in the middle of the board with a cut-out around it.",
        "Use plenty of ground copper and dense ground vias on the base board near (not under) the antenna area.",
        "In the product housing, keep **at least 15 mm of clearance in all directions** around the antenna from metal parts.",
        "Keep crystals, high-speed clocks, the USB port, USB-to-serial chips and UART lines away from the antenna.",
      ] },
      { t: "p", text: "In KiCad, draw a rule area with the rule area tool (Ctrl+Shift+K) over the antenna footprint region on all copper layers with \"keep out tracks, vias, pads, zones and footprints\" set, so DRC enforces the keep-out on every layer, including the inner ground planes of a four-layer board. Then test range and throughput in the finished enclosure." },

      { t: "h", text: "Matching networks" },
      { t: "p", text: "A radio delivers maximum power, and a receiver its best sensitivity, when the antenna's impedance matches the 50 Ω of the RF port. Real antennas are rarely exactly 50 Ω, especially once mounted in a case. A **matching network** of small inductors and capacitors transforms the antenna's impedance to 50 Ω at the operating frequency. Modules like the WROOM-1 are matched internally; you need a network when you put an ESP32 chip directly on your board, or use a U.FL module variant with an external antenna. Espressif's chip-level guidance is a CLC (pi) network near the RF pin with 0201 parts, and a second one near a PCB antenna for tuning." },
      { t: "p", text: "The simplest match is an **L network**, which matches two resistances R_high and R_low with a series reactance on the low side and a shunt reactance on the high side:" },
      { t: "formula", text: String.raw`Q  = √(R_high / R_low - 1)
X_series = Q × R_low        X_shunt = R_high / Q

match a 25 Ω antenna to 50 Ω at 2.44 GHz:
Q = √(50/25 - 1) = 1
X_series = 1 × 25 = 25 Ω    → inductor  L = X / (2π f) = 25 / (2π × 2.44e9) = 1.63 nH
X_shunt  = 50 / 1  = 50 Ω   → capacitor C = 1 / (2π f X) = 1 / (2π × 2.44e9 × 50) = 1.30 pF`, caption: "L-network: series inductor at the antenna side, shunt capacitor at the 50 Ω side." },
      { t: "p", text: "Check: 2π × 2.44e9 = 1.533e10; 25 / 1.533e10 = 1.63e-9 H; 1 / (1.533e10 × 50) = 1.30e-12 F. A **pi network** is two L networks back to back through an intermediate virtual resistance; its extra part lets you choose the Q (bandwidth) and add harmonic filtering. In practice you lay out a pi footprint (shunt, series, shunt), fit a 0 Ω series and leave the shunts empty, then tune the values with a vector network analyser on the real board in its case, because the antenna's impedance depends on its surroundings." },
      { t: "note", kind: "tip", text: "At 2.4 GHz a millimetre of track is a noticeable reactance. Keep the RF track 50 Ω (a grounded coplanar waveguide is common on four-layer boards), short and straight, with ground vias along both sides." },

      { t: "h", text: "EMI sources" },
      { t: "p", text: "Emissions come from a few places. **Differential-mode** radiation comes from current loops: a loop of area A carrying current I at frequency f radiates a field proportional to f² × A × I, so a fast edge in a large loop is the worst case. **Common-mode** radiation comes from cables: a few microamps of common-mode current on a USB or sensor cable (caused by ground noise between board and cable) radiates more than all the board's loops, because the cable is a good antenna. Typical sources on a board like ours: the buck converter's switch node and hot loop, clock and SPI edges, the MCU's internal clock harmonics, and the radio's own harmonics." },
      { t: "formula", text: String.raw`differential-mode, small loop, far field (free space, 10 m):
E ≈ 1.316e-14 × f² × A × I / r     (V/m, f in Hz, A in m², I in A, r in m)
example: 1 cm² loop, 10 mA harmonic at 100 MHz, r = 10 m
E ≈ 1.316e-14 × 1e16 × 1e-4 × 0.01 / 10 = 1.316e-5 V/m ≈ 22 dBµV/m`, caption: "Halving loop area halves the field; doubling frequency quadruples it." },
      { t: "p", text: "Check: f² = 1e16; 1.316e-14 × 1e16 = 131.6; × 1e-4 = 1.316e-2; × 0.01 = 1.316e-4; / 10 = 1.316e-5 V/m = 13.2 µV/m; 20 log10(13.2) = 22.4 dBµV/m. A single small loop is under the Class B limit at 10 m (30 dBµV/m in 30 to 230 MHz), but a ground plane doubles the measured field by reflection and many loops and cables add up, which is why margins of 6 dB or more are wanted at pre-compliance." },

      { t: "h", text: "Controlling EMI and protecting against ESD" },
      { t: "list", items: [
        "**Small loops and solid planes**: everything in the previous lessons. This is the cheapest fix and the only one that works at every frequency.",
        "**Slow the edges** that do not need to be fast: series resistors (22 to 100 Ω) on clocks and SPI lines, lower GPIO drive strength, spread-spectrum clocking where offered.",
        "**Filter every cable**: signals and power leaving the board through a connector are the antennas. Use RC or LC filters, and **ferrite beads** in series with supply lines. A ferrite bead is specified by its impedance at 100 MHz (for example 600 Ω), is mainly resistive at high frequency so it absorbs rather than reflects noise, and loses impedance under DC current: check the curve at your actual load.",
        "**Common-mode chokes** on USB and Ethernet pairs block common-mode current while passing the differential signal.",
        "**Shielding**: a soldered shield can over the radio or a noisy block, with a fence of ground vias round its footprint. A shield with gaps works only if the gaps are much smaller than a wavelength (at 2.4 GHz, λ = 125 mm; keep slots under about λ/20, 6 mm).",
        "**ESD and transients**: put TVS diodes or ESD arrays at every connector, with the shortest possible path to ground. Choose the stand-off (working) voltage above the line's normal maximum, the clamping voltage below what the protected chip survives, and low capacitance (a few pF or less) on data lines. IEC 61000-4-2 level 4 is ±8 kV contact and ±15 kV air discharge, a common target for consumer products.",
      ] },
      { t: "note", kind: "safety", text: "ESD test guns and transient generators produce kilovolt pulses. Use them only under supervision, never on a board connected to a laptop, and never on mains-powered equipment without proper isolation." },

      { t: "h", text: "Pre-compliance testing" },
      { t: "p", text: "A full EMC test happens in an accredited lab (a semi-anechoic chamber or open area test site). Pre-compliance on your bench finds the problems first. You need a spectrum analyser (or an SDR with a calibrated setup), a set of **near-field probes** (small H-field loops and an E-field stub), and ideally a current probe that clamps around a cable." },
      { t: "list", ordered: true, items: [
        "Set the analyser to 30 MHz to 1 GHz with a peak detector and 120 kHz resolution bandwidth (the CISPR bandwidth for that range), and record the baseline with the board off.",
        "Scan the board with the H-field probe held a few millimetres above it, flat to the board for loops; note where each harmonic is strongest (switch node, clock, module, USB connector).",
        "Clamp the current probe on each cable with the board running; cable common-mode current is usually what fails radiated tests.",
        "Change one thing (a series resistor, a ferrite, a stitching via) and compare the same spot. Near-field readings are relative, not absolute: they tell you what improved, not whether you pass.",
        "For a rough absolute check, a calibrated antenna at 3 m in a quiet room against the limit line, with the uncertainty that brings.",
      ] },
      { t: "p", text: "**CISPR 32** covers emissions from multimedia equipment, which includes most IoT devices. **Class B** is for residential environments and is the stricter class. In outline, the radiated limits measured at 10 m with a quasi-peak detector are 30 dBµV/m from 30 to 230 MHz and 37 dBµV/m from 230 MHz to 1 GHz (10 dB higher when measured at 3 m), with further limits above 1 GHz, and there are conducted limits on mains power ports from 150 kHz to 30 MHz. Radios also have their own radio standards for the intentional transmission, which certified modules such as the WROOM-1 have already passed; using a certified module and following its layout guidance keeps that certification valid." },

      { t: "deep", title: "Why ferrite beads can make things worse", blocks: [
        { t: "p", text: "A ferrite bead is an inductor whose core becomes lossy at high frequency. Below a few megahertz it is mostly inductive, and with the capacitors after it forms an LC low-pass filter with a resonance. If that resonance falls where your load draws current (for example a few megahertz), the bead plus capacitor can amplify ripple instead of removing it. Damp it with some resistance (an electrolytic or polymer capacitor with ESR, or a small series resistor), or choose a bead whose inductive region is lower." },
        { t: "p", text: "DC current saturates the core: a bead rated 600 Ω at 100 MHz with no current may offer only a third of that at its rated current. Always read the impedance curve at your DC load from the maker's data, and never put a bead in the ground path, where it breaks the return path you worked to keep." },
      ] },
      { t: "deep", title: "Smith charts and tuning a real antenna", blocks: [
        { t: "p", text: "A vector network analyser (VNA) measures the reflection coefficient S11 of the antenna at the matching network footprint, displayed on a Smith chart: a map of all impedances where the centre is 50 Ω. A series inductor moves a point clockwise along a circle of constant resistance; a shunt capacitor moves it clockwise along a circle of constant conductance. Tuning is the process of choosing moves that land the point at the centre across the whole 2.400 to 2.4835 GHz band." },
        { t: "p", text: "Measure in the final enclosure with the battery and cables in place, because a hand, a plastic case (εr about 3) or a battery near the antenna can shift its resonance by 100 MHz or more. Low-cost VNAs such as the NanoVNA family cover 2.4 GHz in some versions and are good enough for student tuning with care over calibration." },
      ] },
    ],
    mistakes: [
      "**Ground pour under the module antenna, on any layer.** Use a keep-out rule area on every copper layer, including inner planes.",
      "**Placing the module in the middle of the board.** The antenna should overhang the edge or sit at it with board cut away.",
      "**Treating near-field probe readings as pass or fail.** They are relative; use them to compare changes.",
      "**Forgetting cables.** Common-mode current on a cable often dominates radiated emissions; filter every connector.",
      "**A TVS diode with a long track to ground.** The track inductance adds voltage during the fast ESD edge; connect it straight into the plane.",
      "**Ferrite beads chosen by their 100 MHz figure alone.** Check saturation at your DC current and the LC resonance.",
    ],
    practice: {
      kind: "bench",
      task: "Make the exit-project layout RF-correct and run a near-field pre-compliance scan on a working board.",
      steps: [
        "Place the ESP32-S3-WROOM-1 with its antenna overhanging the board edge and add a keep-out rule area over the antenna region on all copper layers.",
        "Add ESD protection, filtering and a common-mode choke footprint on the USB connector, and RC filter footprints on the sensor cable connector.",
        "Compute an L network that matches a 35 Ω antenna to 50 Ω at 2.44 GHz and lay out a pi footprint where it would go on a U.FL variant.",
        "If your lab has a spectrum analyser, make a simple H-field loop probe (a small loop of semi-rigid coax) and scan your a3 board; list the three strongest emissions and their sources.",
        "Apply one change (series resistor, ferrite, ground stitching) and measure the improvement at the same spot.",
      ],
    },
    quiz: [
      {
        q: "According to Espressif's ESP32-S3 guidelines, where should the WROOM module's antenna be placed?",
        options: [
          "Over a solid ground pour in the centre of the board",
          "Extending beyond the board edge, with the feed point near the edge",
          "Under a metal shield",
          "Next to the USB-to-serial chip",
        ],
        answer: 1,
        why: "Espressif strongly recommends the antenna overhang the board edge so no base-board copper loads it.",
      },
      {
        q: "An L network matches 12.5 Ω to 50 Ω. What is its Q?",
        options: ["1", "√3 ≈ 1.73", "4", "3"],
        answer: 1,
        why: "Q = √(50 / 12.5 - 1) = √3 ≈ 1.73.",
      },
      {
        q: "A loop's emitted field is proportional to f² × A × I. If you halve the loop area and the harmonic frequency doubles, what happens to the field?",
        options: ["It halves", "It doubles", "It stays the same", "It quadruples"],
        answer: 1,
        why: "Frequency doubling multiplies by 4, halving area multiplies by 0.5: net 2 times.",
      },
      {
        q: "What resolution bandwidth does CISPR use for radiated emissions from 30 MHz to 1 GHz?",
        options: ["9 kHz", "120 kHz", "1 MHz", "10 Hz"],
        answer: 1,
        why: "120 kHz is the CISPR bandwidth for 30 MHz to 1 GHz; 9 kHz is used for 150 kHz to 30 MHz.",
      },
      {
        q: "Which TVS parameter must be above the line's normal maximum voltage?",
        options: ["Clamping voltage", "Stand-off (working) voltage", "Capacitance", "Peak pulse current"],
        answer: 1,
        why: "Below its stand-off voltage the TVS does not conduct, so it must exceed the normal signal; the clamping voltage must stay below what the chip survives.",
      },
    ],
  },

  "a4-dfm-dft-reliability-exit": {
    id: "a4-dfm-dft-reliability-exit",
    outcomes: [
      "Apply design for manufacture and assembly rules that raise yield",
      "Design a board for test: test points, programming access and self-test",
      "Derate components for reliability and estimate the effect on life",
      "Review the four-layer mixed-signal exit project against EMC and DFM checklists",
    ],
    blocks: [
      { t: "h", text: "One board versus a thousand" },
      { t: "p", text: "A prototype only has to work once, on your bench, with you there to rework it. A product has to be built by people and machines who have never met you, tested in seconds, and keep working for years in heat and vibration. Design for manufacture (DFM), assembly (DFA) and test (DFT), and derating for reliability, are the disciplines that close that gap. Each rule is small; together they decide whether 99% of boards pass or 80%." },

      { t: "h", text: "Design for manufacture (bare board)" },
      { t: "list", items: [
        "**Design above the fab's minimums**: from a3, JLCPCB's 0.10 mm track and space and 0.15 mm via holes are possible; 0.15 to 0.2 mm tracks and 0.3 mm vias are cheaper and higher yield.",
        "**Annular ring and drill tolerance**: plated holes for components with at least the recommended ring (JLCPCB: 0.20 mm recommended on multilayer 1 oz, 0.15 mm absolute minimum), and component hole sizes chosen for the +0.13 / -0.08 mm tolerance.",
        "**Copper balance**: spread copper evenly across layers and the board; large empty areas next to dense ones etch unevenly and the board can warp. Fill unused areas with ground pour.",
        "**Acid traps and slivers**: avoid acute angles between tracks and thin copper slivers between pours; set a minimum zone width.",
        "**Solder mask dams**: leave a strip of mask between fine-pitch pads (about 0.1 mm or more) so solder cannot bridge.",
        "**Controlled impedance**: state the target impedances, layers and reference planes on the fab drawing and order the impedance option.",
      ] },

      { t: "h", text: "Design for assembly" },
      { t: "list", items: [
        "**All SMD on one side** if at all possible; a second side or through-hole parts add a process step each.",
        "**Fiducials**: at least three 1 mm bare copper dots with about a 2 mm mask opening, asymmetrically placed on the board or the panel rails, for machine vision.",
        "**Consistent orientation**: polarised parts in the same direction where possible, so AOI and humans spot reversed parts.",
        "**Spacing**: courtyards must not overlap; leave room for rework tools around BGAs and QFNs (a few millimetres); keep tall parts away from fine-pitch parts so the stencil and nozzle can reach.",
        "**Thermal balance**: symmetrical pad connections on small passives and thermal reliefs on pour connections to stop tombstoning.",
        "**Paste on exposed pads**: segmented paste windows (50 to 80% coverage) on QFN and module thermal pads; via-in-pad filled, or tented, so solder is not wicked away.",
        "**Standard parts**: parts the assembler stocks (JLCPCB \"basic\" parts avoid per-part setup fees); one value per function where you can (all pull-ups 4.7 kΩ, all decoupling 100 nF).",
      ] },

      { t: "h", text: "Design for test" },
      { t: "p", text: "Every board made in volume is tested before it ships. The cheapest tests run automatically on a fixture in seconds:" },
      { t: "list", items: [
        "**Test points for a bed-of-nails fixture**: round pads of 1 mm or more, on one side, on a 2.54 mm (or at least 1.27 mm) grid where possible, with clearance from tall parts. One on every power rail, ground, and the signals needed for programming and functional test.",
        "**Programming access**: the ESP32-S3's USB, or its UART0 pins plus EN and GPIO 0, on test points so a fixture can flash firmware without a cable.",
        "**Boundary scan (JTAG)** on parts that support it (the ESP32-S3 has JTAG on GPIO 39 to 42) can test connectivity between chips without functional firmware.",
        "**Built-in self-test firmware**: on first boot read the sensor's ID register, measure the ADC on a known reference, check Wi-Fi association, report results over USB, and refuse to run normally until it passes.",
        "**Traceability**: a silkscreen area or label for a serial number, and the revision in copper.",
      ] },

      { t: "h", text: "Reliability and derating" },
      { t: "p", text: "Components fail faster when stressed. Most failure mechanisms accelerate with temperature roughly following the Arrhenius law; a common rule of thumb for many parts is that life halves for every 10 °C rise. Derating keeps every part well inside its ratings so that the variations you did not predict (a hot day, a supply spike, a part at the edge of its tolerance) do not push it over. Typical derating guidelines used in industry:" },
      { t: "table", head: ["Component", "Stress", "Derate to"], rows: [
        ["Resistors", "Power", "50% of rating at your actual ambient"],
        ["Ceramic capacitors", "Voltage", "50% of rating (also limits DC bias loss)"],
        ["Tantalum capacitors", "Voltage", "50% or less (polymer types: 80 to 90%)"],
        ["Aluminium electrolytics", "Voltage, temperature", "80% voltage; keep them cool, as life is set by temperature"],
        ["Semiconductors", "Junction temperature", "At least 20 to 25 °C below the maximum"],
        ["Connectors", "Current per contact", "50 to 70% of rating"],
      ] },
      { t: "formula", text: String.raw`life ratio for a 10 °C rule:   L2 / L1 = 2^((T1 - T2) / 10)
electrolytic rated 2000 h at 105 °C, run at 65 °C:
  2^((105 - 65)/10) = 2^4 = 16    → about 32 000 h (3.7 years continuous)
same part at 55 °C:  2^5 = 32     → about 64 000 h (7.3 years)`, caption: "Moving an electrolytic 10 °C cooler, away from the LDO, doubles its expected life." },
      { t: "p", text: "Check: 2000 × 16 = 32 000 h; 32 000 / 8760 = 3.65 years; 2000 × 32 = 64 000 h = 7.3 years. Mechanical reliability matters too: anchor heavy parts and connectors that take cable force (through-hole tabs, or SMD connectors with mounting pads), keep ceramic capacitors away from board edges and V-scores where flexing cracks them, and use conformal coating where condensation is likely." },

      { t: "h", text: "Exit project: four-layer mixed-signal board with a wireless module" },
      { t: "p", text: "Design a four-layer board on JLC04161H-7628 (or your fab's equivalent) that carries an ESP32-S3-WROOM-1, USB-C, a 3.3 V supply (an LDO or a buck converter if your load needs it), a precision analog input chain (for example a load cell or thermocouple amplifier into an external ADC, or the ESP32-S3's ADC through a filtered input), and an I2C or SPI sensor. Then review it against these checklists and submit the completed lists with the design." },
      { t: "table", head: ["EMC checklist item", "Evidence"], rows: [
        ["Stack-up chosen and justified; every signal layer adjacent to a ground plane", "Stack-up table and reasoning"],
        ["No signal crosses a plane gap; every layer change has a stitching via or capacitor", "DRC custom rule or screenshot review"],
        ["Antenna overhangs the edge; keep-out on all copper layers; 15 mm clearance in housing", "Rule area, 3D view"],
        ["USB pair 90 Ω, skew under 0.15 mm, ESD at the connector", "Tuning report, calculator output"],
        ["Every cable connector filtered and ESD protected", "Schematic of each connector"],
        ["Switcher hot loop minimised and away from analog and antenna", "Layout screenshot"],
        ["PDN target impedance computed and decoupling plotted against it", "Calculation and impedance plot"],
        ["Analog section partitioned by placement over one ground", "Partition map"],
      ] },
      { t: "table", head: ["DFM / DFA / DFT checklist item", "Evidence"], rows: [
        ["All rules at least 25% above the fab minimums", "Board Setup constraints"],
        ["Fiducials, one-sided SMD, consistent orientation, courtyards clear", "Assembly drawing"],
        ["Exposed pads with segmented paste and filled or tented vias", "Paste layer view"],
        ["Test points on every rail, GND, programming and key signals", "Test point list"],
        ["Self-test firmware plan", "Test specification"],
        ["Derating table for every power, voltage and temperature stress", "Derating spreadsheet"],
      ] },

      { t: "deep", title: "Failure rates, MTBF and what they really mean", blocks: [
        { t: "p", text: "Reliability handbooks (such as the US MIL-HDBK-217F or the Telcordia SR-332 method) assign each part a base failure rate in FIT (failures per 10⁹ device-hours), multiplied by factors for temperature, stress and environment. Summing the parts gives the board's failure rate λ, and MTBF = 1 / λ. A board totalling 2000 FIT has λ = 2 × 10⁻⁶ per hour and MTBF = 500 000 hours." },
        { t: "p", text: "MTBF is not life. A 500 000 hour MTBF means that in a large fleet, about 1.7% of units fail per year (8760 × 2e-6 = 0.0175) during the useful-life period, not that each board lasts 57 years. Wear-out mechanisms (electrolytic drying, connector fretting, solder fatigue) end the useful life far earlier and are handled by derating and design, not by the MTBF number." },
      ] },
      { t: "deep", title: "Design reviews as a professional practice", blocks: [
        { t: "p", text: "Companies hold several formal reviews: a schematic review before layout starts, a placement review before routing, and a final layout review before release, each with a checklist and a reviewer who did not design the board. The reviewer's job is to find problems, not to approve; every finding is logged with a decision (fix, accept with reason, defer)." },
        { t: "p", text: "Bring the review checklists above to a classmate's board and theirs to yours. Reviewing someone else's design is the fastest way to learn what you miss on your own, and the log becomes part of your exit-project report in module a18." },
      ] },
    ],
    mistakes: [
      "**Designing at the fab's limits to save space you did not need.** Yield drops and every board costs more.",
      "**Parts on both sides for no reason.** Each side is another stencil, another pass and more cost.",
      "**Test points under tall parts or on both sides.** A fixture cannot reach them.",
      "**Ceramic capacitors at a V-score.** Board flexing during separation cracks them, often causing a short later.",
      "**Derating at 25 °C.** Ratings fall with temperature; derate at the real worst-case ambient inside the enclosure.",
      "**Confusing MTBF with life.** Wear-out ends life long before the MTBF figure.",
    ],
    practice: {
      kind: "bench",
      task: "Complete the four-layer exit-project design and its review package.",
      steps: [
        "Draw the schematic and layout of the exit-project board on a four-layer stack-up chosen in lesson 1.",
        "Fill the EMC checklist and the DFM / DFA / DFT checklist with evidence for every item.",
        "Write a derating table: every resistor's power, every capacitor's voltage, every semiconductor's junction temperature at a 45 °C internal ambient.",
        "Swap designs with a classmate, review each other's board against both checklists and log every finding with a decision.",
        "Generate the full fab and assembly package (Gerber X2, drill, BOM, CPL, impedance requirements) ready for order.",
      ],
    },
    quiz: [
      {
        q: "An electrolytic is rated 2000 h at 105 °C. Using the 10 °C rule, what life do you expect at 75 °C?",
        options: ["4000 h", "8000 h", "16 000 h", "6000 h"],
        answer: 2,
        why: "2^((105 - 75)/10) = 2³ = 8; 2000 × 8 = 16 000 h.",
      },
      {
        q: "Why should fiducials be placed asymmetrically?",
        options: [
          "To save copper",
          "So the machine's vision system can detect a board loaded rotated by 180°",
          "Because symmetrical fiducials short together",
          "They must be at the board centre",
        ],
        answer: 1,
        why: "With an asymmetric pattern, a rotated board does not match the expected positions, so the machine catches it.",
      },
      {
        q: "A ceramic capacitor rated 16 V sits on a 12 V rail. Does it meet a 50% voltage derating rule?",
        options: ["Yes", "No, it runs at 75% of rating; use 25 V or higher", "Yes, ceramics need no derating", "Only below 25 °C"],
        answer: 1,
        why: "12 / 16 = 75%. A 50% rule needs at least a 24 V rating, so a 25 V part.",
      },
      {
        q: "A board's parts total 1000 FIT. About what fraction fails per year of continuous operation in the useful-life period?",
        options: ["About 0.9%", "About 9%", "About 0.09%", "About 50%"],
        answer: 0,
        why: "λ = 1e-6 per hour; 8760 × 1e-6 = 0.00876, about 0.9% per year.",
      },
      {
        q: "Which DFT feature lets a fixture program the ESP32-S3 without a cable?",
        options: [
          "Fiducials",
          "Test points on the USB or UART0, EN and GPIO 0 nets",
          "A larger antenna",
          "Conformal coating",
        ],
        answer: 1,
        why: "Fixture pins contacting the programming nets can reset the chip into download mode and flash it.",
      },
    ],
  },
};

export default lessons;
