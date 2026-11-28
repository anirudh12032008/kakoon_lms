import type { ModuleContent } from "../model/curriculum";

/**
 * Module a18: Systems engineering and capstone.
 * One worked example runs through every lesson: "CampusRover", an autonomous
 * delivery robot that carries parcels between the library, hostels and
 * departments. It has a custom ESP32-S3 motor and power PCB, firmware, and a
 * Raspberry Pi 5 running ROS 2 for navigation.
 */
const lessons: ModuleContent = {
  "a18-requirements-and-the-v-model": {
    id: "a18-requirements-and-the-v-model",
    outcomes: [
      "Explain why a capstone fails more often from unclear requirements than from bad engineering",
      "Write requirements that are specific, measurable and testable, and reject vague ones",
      "Separate functional from non-functional requirements and give each an ID and a verification method",
      "Draw the V-model and say which test level checks which level of design",
    ],
    blocks: [
      { t: "h", text: "Why requirements come first" },
      { t: "p", text: "By the final year you can design a PCB, write firmware and bring up a ROS 2 node. What usually sinks a capstone is not any one of those skills. It is three people building three pieces that do not fit, a demo that proves nothing because nobody agreed what \"working\" meant, and a report written the night before that cannot explain why any decision was made. Systems engineering is the discipline that prevents this. It starts with one question asked before any part is ordered: what exactly must this system do, and how will we prove it does?" },
      { t: "p", text: "The answer is written down as **requirements**. A requirement is a single statement of something the system shall do or a property it shall have, written so that someone outside the team could test it and agree on pass or fail. Throughout this module you will follow one example project, **CampusRover**: a small autonomous robot that carries a parcel of up to 3 kg from the library to a hostel gate on paved campus paths. It has a custom motor and power board built around an ESP32-S3, firmware on that board, and a Raspberry Pi 5 running ROS 2 for mapping and navigation." },

      { t: "h", text: "Needs, requirements and specifications" },
      { t: "p", text: "Three words get mixed up. A **need** is what the stakeholder wants in their own words: \"students should get their parcels without walking to the library.\" A **requirement** turns that into a testable statement about the system: \"The rover shall deliver a payload of up to 3 kg between any two marked stops on the campus route map.\" A **specification** is the detailed design-level description of how a part will meet it: \"Each drive motor: 24 V, 120 rpm at the wheel, stall torque at least 2 N·m.\" Requirements say what; specifications say how. Keep them in separate documents, or at least separate sections, so a design change does not silently rewrite what you promised." },

      { t: "h", text: "How to word a requirement" },
      { t: "p", text: "Good requirements share a pattern: one subject, the word **shall**, one measurable behaviour, and the conditions under which it holds. \"Shall\" marks a binding requirement; \"should\" marks a goal; \"will\" states a fact about the environment. Never put two behaviours in one sentence joined by \"and\": if one passes and the other fails, the requirement cannot be marked either way." },
      { t: "table", head: ["Weak wording", "Problem", "Better requirement"], rows: [
        ["The robot should be fast.", "Not measurable, not binding", "The rover shall travel at a mean speed of at least 0.8 m/s on dry level paving."],
        ["The battery must last a long time.", "No number, no load case", "The rover shall complete at least 6 deliveries of 600 m each on one charge with a 3 kg payload."],
        ["The robot must be safe and reliable.", "Two vague goals in one", "The rover shall stop within 0.5 m of first detecting an obstacle when travelling at 1.0 m/s."],
        ["Use a Raspberry Pi 5.", "A design choice, not a need", "Move to the design document; state the need, e.g. compute for SLAM at 5 Hz map update."],
      ], caption: "Each fix adds a number, a condition, and one behaviour only." },
      { t: "p", text: "A useful check is **SMART**: Specific (one behaviour, no ambiguity), Measurable (a number with units), Achievable (physically and within budget), Relevant (traces back to a stakeholder need), and Time-bound or condition-bound (under what conditions, by which milestone). Add a sixth check of your own: **testable by a method you can actually afford**. \"MTBF of 50,000 hours\" is measurable in principle, but no student team can run that test, so it must be verified by analysis instead, and you should say so." },

      { t: "h", text: "Functional and non-functional requirements" },
      { t: "p", text: "**Functional** requirements describe behaviour: what the system does with its inputs. \"The rover shall announce arrival to the recipient's phone within 10 s of reaching the stop.\" **Non-functional** requirements describe qualities and constraints: performance, power, mass, cost, safety, environment, maintainability, regulatory limits. \"The rover shall operate in ambient temperatures from 5 °C to 45 °C.\" \"The bill of materials shall cost no more than ₹45,000 for one prototype.\" Student teams tend to write only functional requirements and then discover at the demo that the robot works but only in the lab, only for ten minutes, and only when the battery is fresh. Non-functional requirements are where those surprises are caught early." },

      { t: "h", text: "A requirements table with IDs and verification methods" },
      { t: "p", text: "Every requirement gets a unique, permanent **ID**. Never renumber; if a requirement is dropped, mark it deleted and keep the ID so references elsewhere do not silently point at something else. Each one also gets a **verification method**, one of four standard choices: **Test** (operate it and measure), **Demonstration** (operate it and observe pass or fail without measurement), **Inspection** (look at it or at a document), and **Analysis** (calculation or simulation). Choosing the method now forces you to think about how you will prove each line, months before you need to." },
      { t: "table", head: ["ID", "Requirement", "Type", "Verify by"], rows: [
        ["SYS-001", "The rover shall carry a payload of up to 3.0 kg in a lockable compartment.", "Functional", "Test"],
        ["SYS-002", "The rover shall travel at a mean speed of at least 0.8 m/s on dry level paving.", "Performance", "Test"],
        ["SYS-003", "The rover shall stop within 0.5 m of first detecting an obstacle at 1.0 m/s.", "Safety", "Test"],
        ["SYS-004", "The rover shall complete at least 6 deliveries of 600 m on one charge with 3 kg payload.", "Performance", "Test"],
        ["SYS-005", "A red emergency stop button on the top cover shall remove motor power in hardware.", "Safety", "Inspection + Test"],
        ["SYS-006", "The rover shall operate from 5 °C to 45 °C ambient.", "Environmental", "Analysis"],
        ["SYS-007", "The prototype BOM shall cost no more than ₹45,000.", "Constraint", "Inspection"],
        ["SYS-008", "The rover shall notify the recipient within 10 s of arrival.", "Functional", "Demonstration"],
      ], caption: "CampusRover top-level requirements. Lower levels (HW-, FW-, SW-) refine these." },
      { t: "snippet", lang: "yaml", code: String.raw`# requirements.yaml : one entry per requirement, kept in the project repo
- id: SYS-003
  text: >
    The rover shall stop within 0.5 m of first detecting an obstacle
    when travelling at 1.0 m/s on dry level paving.
  type: safety            # functional | performance | safety | environmental | constraint | interface
  rationale: Pedestrians share the paths; 0.5 m keeps a step's clearance.
  source: Stakeholder meeting 2026-08-04 (campus security office)
  parent: NEED-02         # the need it traces to
  children: [HW-012, FW-021, SW-030]
  verification: test      # test | demonstration | inspection | analysis
  test_case: TC-003
  owner: Priya (firmware)
  status: approved        # draft | approved | verified | deleted
  priority: must          # must | should | could`, caption: "Requirements template. Keeping it as plain text in git means changes are reviewed like code." },

      { t: "h", text: "The V-model" },
      { t: "p", text: "The **V-model** is the picture that ties requirements to testing. Read the left arm downwards: you start with stakeholder needs, refine them into system requirements, split the system into subsystems (PCB, firmware, ROS 2 software), and design each component. At the bottom you build. Then you climb the right arm: test each unit, integrate subsystems and test the interfaces, test the whole system against the system requirements, and finally validate with real users that the needs were met. Each level on the right checks the level directly opposite it on the left." },
      { t: "diagram", text: String.raw`Stakeholder needs ─────────────────────────────────── Acceptance / validation
      \                                                      /
   System requirements ─────────────────────────── System test
          \                                              /
       Architecture (PCB, FW, ROS 2) ───────── Integration test
              \                                      /
           Component design ──────────────── Unit test
                  \                              /
                   └─────── Build / code ───────┘

   Left arm: define and decompose.   Right arm: verify and integrate.
   Each horizontal line: the test plan on the right is written
   while the design on the left is written, not afterwards.`, caption: "The V-model for CampusRover." },
      { t: "p", text: "The single most useful habit from the V-model is to **write the test while you write the requirement**. When you write SYS-003, write TC-003 the same day: set up two cones, drive at 1.0 m/s, place a box, measure stopping distance with tape, repeat ten times. If you cannot write the test, the requirement is not finished. The V-model is sometimes criticised as too rigid, and real teams iterate around it many times (build a quick prototype, learn, revise requirements). That is fine; the V describes the relationships between levels, not a rule that each step happens exactly once." },
      { t: "note", kind: "tip", text: "Aim for 15 to 30 system requirements for a capstone. Fewer usually means important qualities are missing; many more and the team will never verify them all in one semester." },

      { t: "deep", title: "Requirement quality checks used in industry", blocks: [
        { t: "p", text: "Standards such as ISO/IEC/IEEE 29148 (requirements engineering) list characteristics of a good individual requirement: necessary, appropriate to its level, unambiguous, complete, singular, feasible, verifiable, correct and conforming to a template. For the set as a whole: complete, consistent (no two contradict), feasible within budget, comprehensible, and able to be validated." },
        { t: "p", text: "Professional teams scan for weasel words: \"user-friendly\", \"fast\", \"robust\", \"minimal\", \"as appropriate\", \"etc.\", \"and/or\", \"support\". Each one hides an unstated number or decision. A simple script that greps your requirements file for these words is a cheap first review." },
        { t: "snippet", lang: "python", code: String.raw`import re, sys

WEASEL = ["fast", "robust", "user-friendly", "easy", "minimal", "adequate",
          "as appropriate", "etc", "and/or", "support", "approximately", "should"]

for n, line in enumerate(open(sys.argv[1], encoding="utf-8"), 1):
    for w in WEASEL:
        if re.search(r"\b" + re.escape(w) + r"\b", line, re.IGNORECASE):
            print(f"line {n}: '{w}': {line.strip()}")`, caption: "Run as python3 weasel.py requirements.yaml. Not a substitute for review, but it catches the obvious." },
        { t: "p", text: "Requirements also come in levels. System requirements (SYS-) are allocated to subsystems, which produce derived requirements: SYS-003 (stop within 0.5 m) becomes SW-030 (obstacle detection latency at most 150 ms from LiDAR scan to stop command), FW-021 (motor controller shall ramp to zero speed within 300 ms of a stop command) and HW-012 (motor driver shall support active braking). Checking that the children add up to the parent is an analysis task: at 1.0 m/s, 150 ms of latency covers 0.15 m and a linear ramp to zero over 300 ms covers 1.0 × 0.3 / 2 = 0.15 m, total 0.30 m, leaving 0.20 m margin inside the 0.5 m limit." },
      ] },
      { t: "deep", title: "Where the V-model came from, and its alternatives", blocks: [
        { t: "p", text: "The V-model grew out of 1980s software and defence projects in Germany and the United States, where contracts demanded that every requirement be shown to be tested. It remains the backbone of automotive (ISO 26262 is organised around it) and aerospace development. Its weakness is that, followed literally, it discovers integration problems late." },
        { t: "p", text: "Alternatives include the spiral model (repeated risk-driven loops), incremental delivery, and agile methods with short sprints. In hardware, where a PCB respin takes two to three weeks, a practical compromise is the **multiple-V**: a quick breadboard V in the first month, an engineering prototype PCB V in the middle, and a final PCB V for the demo. Each loop reuses and corrects the same requirements and test cases." },
      ] },
    ],
    mistakes: [
      "**Writing design choices as requirements.** \"Use an RPLIDAR A1\" is a design decision; the requirement is the detection range and update rate you need.",
      "**No numbers.** \"Long battery life\" cannot pass or fail. Every performance requirement needs a value, a unit and a condition.",
      "**Two behaviours in one requirement.** Split anything joined by \"and\" into separate IDs.",
      "**Renumbering IDs.** It breaks every test case and report section that pointed to the old number.",
      "**Leaving the test plan for the end.** If you cannot say how you will verify a requirement on the day you write it, the requirement is not finished.",
    ],
    practice: {
      kind: "bench",
      task: "Write the requirements set for your own capstone.",
      steps: [
        "Interview at least one real stakeholder (your guide, a lab user, the campus office) and write five needs in their words.",
        "Turn the needs into 15 to 25 system requirements in the YAML template, each with an ID, type, rationale and verification method.",
        "Make sure at least a third are non-functional: power, environment, safety, cost, mass.",
        "Swap files with another team. Each team marks every requirement that fails a SMART check and says why.",
        "Revise, and for three requirements write a one-paragraph test case right away.",
      ],
    },
    quiz: [
      {
        q: "Which is the best-written requirement?",
        options: [
          "The robot should be fast and quiet.",
          "The rover shall use two 24 V gear motors.",
          "The rover shall travel at a mean speed of at least 0.8 m/s on dry level paving.",
          "The rover must be robust in all conditions.",
        ],
        answer: 2,
        why: "It has one behaviour, the binding word shall, a number with units, and a condition. The motor line is a design choice, and the others are vague or combine two goals.",
      },
      {
        q: "\"The prototype bill of materials shall cost no more than ₹45,000.\" What kind of requirement is this, and how is it verified?",
        options: [
          "Functional, by test",
          "Non-functional (constraint), by inspection of the costed BOM",
          "Functional, by demonstration",
          "Non-functional, by analysis of the motor torque",
        ],
        answer: 1,
        why: "Cost is a constraint, not a behaviour. You verify it by inspecting the costed BOM document.",
      },
      {
        q: "In the V-model, what checks the system requirements?",
        options: ["Unit tests", "Integration tests", "System tests", "Code review"],
        answer: 2,
        why: "Each level on the right arm verifies the level opposite on the left. System tests sit opposite system requirements.",
      },
      {
        q: "A requirement is dropped halfway through the project. What should happen to its ID?",
        options: [
          "Reuse it for the next new requirement",
          "Renumber all later requirements to close the gap",
          "Keep the ID and mark the requirement as deleted",
          "Delete the line and its ID",
        ],
        answer: 2,
        why: "IDs are permanent so that test cases and report references never point at the wrong requirement.",
      },
      {
        q: "A team writes \"MTBF shall be at least 50,000 hours\". What verification method is realistic for them?",
        options: ["Test, by running the rover for 50,000 hours", "Analysis, from component failure data", "Demonstration at the final review", "Inspection of the PCB"],
        answer: 1,
        why: "Nobody can test 50,000 hours in a semester. Reliability targets like this are verified by analysis, and the method should be stated when the requirement is written.",
      },
    ],
  },

  "a18-architecture-interfaces-trade-studies": {
    id: "a18-architecture-interfaces-trade-studies",
    outcomes: [
      "Break a system into subsystems with clear boundaries and owners",
      "Write an interface control document for an electrical, data and software interface",
      "Run a weighted decision matrix and test whether its result is robust",
      "Record design decisions so they can be defended later",
    ],
    blocks: [
      { t: "h", text: "Why architecture is a team problem" },
      { t: "p", text: "Once requirements exist, the next risk is integration. Three teammates can each build a subsystem that works perfectly on its own bench and still produce a robot that does not move, because one assumed the motor board talks UART at 115200 baud and the other wrote 921600, or one put the 5 V rail on pin 1 of a connector and the other expected ground. **Architecture** is the decision of how the system is divided into parts, what each part is responsible for, and exactly how they connect. It is the first thing you design and the last thing you should change." },

      { t: "h", text: "Decomposing CampusRover" },
      { t: "p", text: "Split the system so that each part has one owner, one main job, and as few connections to the others as possible. A good test: can you describe each subsystem's job in one sentence without mentioning how another subsystem works inside?" },
      { t: "diagram", text: String.raw`┌────────────────────────── CampusRover ───────────────────────────┐
│                                                                   │
│  ┌──────────────┐   USB serial (micro-ROS)   ┌─────────────────┐  │
│  │ Compute      │◄──────────────────────────►│ Motor & power   │  │
│  │ Raspberry Pi │        IF-02               │ PCB (ESP32-S3)  │  │
│  │ 5, ROS 2     │                            │ firmware        │  │
│  └──┬───────┬───┘                            └──┬────┬────┬────┘  │
│     │ USB   │ Wi-Fi                IF-01 power  │    │    │       │
│  ┌──┴───┐ ┌─┴────────┐   ┌──────────┐ 24 V ────┘    │    │       │
│  │LiDAR │ │ Campus   │   │ Battery  │◄──────────────┘    │       │
│  │      │ │ server   │   │ 7S Li-ion│     IF-03 motors ──┘       │
│  └──────┘ └──────────┘   └──────────┘     + encoders, E-stop     │
└───────────────────────────────────────────────────────────────────┘`, caption: "Top-level architecture. Every line that crosses a box boundary is an interface with an ID." },
      { t: "p", text: "Four subsystems result: the **motor and power PCB** (battery input, 5 V buck for the Pi, two motor drivers, encoder inputs, E-stop relay, current sensing), its **firmware** (speed control loops, odometry, watchdog, battery monitoring), the **compute and ROS 2 software** (LiDAR driver, SLAM, Nav2 navigation, delivery state machine), and the **mechanical chassis**. Each gets an owner. Each line crossing a box is an interface and gets an ID, IF-01, IF-02 and so on." },

      { t: "h", text: "Interface control documents" },
      { t: "p", text: "An **interface control document (ICD)** is the contract for one interface. Both owners sign it, and neither may change it without the other agreeing. A good ICD has an electrical part (connector, pinout, voltages, currents, logic levels), a data part (protocol, rates, message formats, units, coordinate frames), and a behaviour part (what happens at start-up, on timeout, on error). The behaviour part is the one students forget, and it is where most integration bugs live." },
      { t: "snippet", lang: "yaml", code: String.raw`# ICD IF-02 : Compute (Pi 5) <-> Motor and power PCB (ESP32-S3)
id: IF-02
version: 1.2
owners: [Arjun (ROS 2), Priya (firmware)]
physical:
  connector: USB-C on PCB, cable max 0.5 m
  power: PCB USB port is device only; it does not draw power from the Pi
transport: micro-ROS over USB CDC serial, 921600 baud
messages:
  - topic: /cmd_vel
    type: geometry_msgs/msg/Twist
    direction: Pi -> PCB
    rate: 20 Hz nominal
    units: m/s and rad/s, base_link frame (REP 103: x forward, z up)
    limits: |linear.x| <= 1.2 m/s, |angular.z| <= 2.0 rad/s, clamp beyond
  - topic: /wheel_odom
    type: nav_msgs/msg/Odometry
    direction: PCB -> Pi
    rate: 50 Hz
  - topic: /battery_state
    type: sensor_msgs/msg/BatteryState
    direction: PCB -> Pi
    rate: 1 Hz
behaviour:
  startup: motors disabled until first /cmd_vel received after agent connects
  timeout: no /cmd_vel for 250 ms -> ramp to zero speed, set fault flag
  estop: hardware E-stop cuts motor supply; firmware reports it, cannot override
change_log:
  - 1.2 (2026-09-10): timeout reduced from 500 ms to 250 ms to meet SYS-003`, caption: "An ICD as a short YAML file. Version and change log matter as much as the content." },
      { t: "note", kind: "tip", text: "Write units and coordinate frames into every data interface. A wheel speed in rpm sent to code expecting rad/s gives a robot that is roughly ten times too fast or too slow, and both halves look correct on their own." },

      { t: "h", text: "Trade studies" },
      { t: "p", text: "Many architecture choices have no obviously right answer. Which computer? Which LiDAR? Li-ion or lead-acid? A **trade study** makes the choice transparent. List the options, choose criteria that come from your requirements, give each criterion a weight that sums to 1, score every option against every criterion on a fixed scale (here 1 to 5), multiply and add. The highest total wins, but the real value is that the reasoning is written down where a reviewer can challenge it." },
      { t: "h", text: "Worked example: choosing the compute platform" },
      { t: "p", text: "CampusRover needs to run a LiDAR driver, SLAM and Nav2. Three options: a **Raspberry Pi 5**, an **NVIDIA Jetson Orin Nano** developer kit, and running everything as **micro-ROS on the ESP32-S3 alone** with mapping offloaded to a laptop. The criteria and weights come from the requirements: navigation performance matters most (SYS-002, SYS-003), then power draw (SYS-004 battery life), cost (SYS-007), ROS 2 support, and team familiarity." },
      { t: "table", head: ["Criterion", "Weight", "Pi 5", "Jetson Orin Nano", "ESP32-S3 only"], rows: [
        ["Navigation performance", "0.30", "4", "5", "1"],
        ["Power draw", "0.25", "4", "2", "5"],
        ["Cost", "0.20", "4", "2", "5"],
        ["ROS 2 support", "0.15", "5", "4", "2"],
        ["Team familiarity", "0.10", "4", "2", "3"],
        ["Weighted total", "1.00", "4.15", "3.20", "3.15"],
      ], caption: "Scores from 1 (poor) to 5 (excellent). Weights sum to 1.00." },
      { t: "formula", text: String.raw`Pi 5    = 0.30×4 + 0.25×4 + 0.20×4 + 0.15×5 + 0.10×4 = 1.20 + 1.00 + 0.80 + 0.75 + 0.40 = 4.15
Jetson  = 0.30×5 + 0.25×2 + 0.20×2 + 0.15×4 + 0.10×2 = 1.50 + 0.50 + 0.40 + 0.60 + 0.20 = 3.20
ESP32   = 0.30×1 + 0.25×5 + 0.20×5 + 0.15×2 + 0.10×3 = 0.30 + 1.25 + 1.00 + 0.30 + 0.30 = 3.15
Check: weights 0.30 + 0.25 + 0.20 + 0.15 + 0.10 = 1.00`, caption: "Total = Σ (weight × score)." },
      { t: "p", text: "The Pi 5 wins by a clear margin of 0.95 points. Now test robustness: would the answer change if a reviewer disagreed with your weights? Raise the weight on performance by half, from 0.30 to 0.45, and take the extra 0.15 from cost (now 0.05). The Jetson's total becomes 0.45×5 + 0.25×2 + 0.05×2 + 0.15×4 + 0.10×2 = 2.25 + 0.50 + 0.10 + 0.60 + 0.20 = 3.65, and the Pi 5's becomes 0.45×4 + 0.25×4 + 0.05×4 + 0.15×5 + 0.10×4 = 1.80 + 1.00 + 0.20 + 0.75 + 0.40 = 4.15. The Pi 5 still wins, so the decision is robust. If a modest change in weights flips the result, the options are effectively tied, and you should decide on another basis (risk, availability) and say so." },
      { t: "p", text: "Record the outcome as a short **design decision record**: the question, the options, the matrix, the decision, and what would make you revisit it (\"if Nav2 cannot hold 5 Hz on the Pi 5 in the week 4 benchmark, reopen with the Jetson\"). When an examiner asks at the final review why you did not use a Jetson, you point to the record." },

      { t: "deep", title: "Pitfalls of weighted decision matrices", blocks: [
        { t: "p", text: "Matrices are easy to rig, deliberately or not. Common faults: choosing criteria after you already prefer an option; double-counting (\"cost\" and \"affordability\" as separate rows); scores with no evidence; and criteria where all options score the same, which add nothing. Each score should have a one-line justification, ideally a number: Pi 5 power about 5 W to 10 W under load against roughly 7 W to 15 W for the Orin Nano in its common power modes (check current datasheets for the exact modes)." },
        { t: "p", text: "Some criteria are **must-haves**, not weights. If an option cannot meet a requirement at all (the ESP32 alone cannot run SLAM on board), it should be eliminated before the matrix, not merely scored 1. Scoring it keeps a non-solution looking competitive, as you saw: it finished only 0.05 behind the Jetson." },
        { t: "p", text: "More formal methods exist: the Pugh matrix (score each option better, same or worse than a baseline), and the analytic hierarchy process, which derives weights from pairwise comparisons and checks them for consistency. For a capstone, a weighted matrix plus a sensitivity check is enough." },
        { t: "snippet", lang: "python", code: String.raw`weights = {"perf": 0.30, "power": 0.25, "cost": 0.20, "ros": 0.15, "team": 0.10}
scores = {
    "Pi 5":   {"perf": 4, "power": 4, "cost": 4, "ros": 5, "team": 4},
    "Jetson": {"perf": 5, "power": 2, "cost": 2, "ros": 4, "team": 2},
    "ESP32":  {"perf": 1, "power": 5, "cost": 5, "ros": 2, "team": 3},
}
assert abs(sum(weights.values()) - 1.0) < 1e-9

def totals(w):
    return {k: round(sum(w[c] * s[c] for c in w), 2) for k, s in scores.items()}

print(totals(weights))   # {'Pi 5': 4.15, 'Jetson': 3.2, 'ESP32': 3.15}

# Sensitivity: move weight from cost to performance in steps.
for shift in (0.05, 0.10, 0.15):
    w = dict(weights, perf=weights["perf"] + shift, cost=weights["cost"] - shift)
    print(shift, totals(w))`, caption: "Re-running the matrix as weights move shows where, if anywhere, the decision flips." },
      ] },
      { t: "deep", title: "Interface types and how integration really fails", blocks: [
        { t: "p", text: "Interfaces are not only electrical. Mechanical interfaces (mounting holes, connector clearance, cable bend radius), thermal interfaces (the Pi's heat has to go somewhere inside a closed body), and human interfaces (the button a security guard presses) all deserve an ICD entry." },
        { t: "p", text: "In practice, integration failures cluster in a few places: mismatched logic levels (5 V encoder outputs into 3.3 V ESP32 pins), ground reference problems between boards powered from different supplies, mirrored connector pinouts when a cable is crimped in reverse, units and frames, and start-up order (the Pi boots in 30 s, the PCB in 1 s, and the firmware must behave sensibly during those 29 seconds). A good ICD answers each of those explicitly." },
      ] },
    ],
    mistakes: [
      "**Splitting by people instead of function.** Subsystems should follow the physics and the data, then be assigned to people, not the other way round.",
      "**ICDs without behaviour.** Pinouts and message types are not enough; say what happens on start-up, timeout and fault.",
      "**No version on the ICD.** Two people working from different versions is the classic integration bug.",
      "**Choosing criteria after choosing the answer.** Fix criteria and weights from the requirements first, then score.",
      "**No sensitivity check.** A matrix win of 0.05 points is a tie, not a decision.",
    ],
    practice: {
      kind: "bench",
      task: "Produce the architecture, two ICDs and one trade study for your capstone.",
      steps: [
        "Draw your block diagram with every interface line labelled IF-01, IF-02 and so on.",
        "Write a full ICD for the interface between your custom PCB and your ROS 2 computer, including timeout behaviour.",
        "Write a second ICD for one power or sensor interface, including connector pinout and voltage levels.",
        "Pick one open design question and run a weighted matrix with at least three options and four criteria taken from your requirements.",
        "Run the sensitivity script and write a three-line decision record.",
      ],
    },
    quiz: [
      {
        q: "Options A and B are scored on two criteria with weights 0.6 and 0.4. A scores 3 and 5; B scores 4 and 3. Which wins?",
        options: ["A, with 3.8", "B, with 3.6", "A, with 4.0", "They tie"],
        answer: 0,
        why: "A = 0.6×3 + 0.4×5 = 1.8 + 2.0 = 3.8. B = 0.6×4 + 0.4×3 = 2.4 + 1.2 = 3.6. A wins by 0.2.",
      },
      {
        q: "Which item belongs in the behaviour section of an ICD?",
        options: [
          "The connector part number",
          "What the motor board does if no speed command arrives for 250 ms",
          "The colour of the cable",
          "The name of the ROS 2 package",
        ],
        answer: 1,
        why: "Behaviour covers start-up, timeouts and faults: what each side does when the normal exchange breaks down.",
      },
      {
        q: "After a small change in weights, the winning option swaps. What does that tell you?",
        options: [
          "The matrix has an arithmetic error",
          "The original winner is clearly best",
          "The options are effectively tied, so decide on other grounds and record why",
          "You should add more criteria until one wins",
        ],
        answer: 2,
        why: "A result that flips with modest weight changes is not robust. Treat it as a tie and decide on risk, availability or schedule.",
      },
      {
        q: "Why should an option that cannot meet a hard requirement be removed before scoring?",
        options: [
          "Because it makes the table too long",
          "Because a weighted total can make a non-solution look competitive",
          "Because weights must sum to 1",
          "Because it always scores zero anyway",
        ],
        answer: 1,
        why: "In the lesson the ESP32-only option, which cannot run SLAM on board, still scored 3.15, close to the Jetson. Must-haves are filters, not weights.",
      },
      {
        q: "One subsystem sends wheel speed in rpm and the other expects rad/s. Where should this have been caught?",
        options: ["In the BOM", "In the risk register", "In the ICD data section, which states units for every field", "In the final report"],
        answer: 2,
        why: "The ICD's data section states units and frames for every message, so both sides build to the same contract.",
      },
    ],
  },

  "a18-planning-risk-and-bom": {
    id: "a18-planning-risk-and-bom",
    outcomes: [
      "Build a work breakdown and schedule that respects hardware lead times",
      "Keep a risk register, score risks by likelihood and impact, and plan responses",
      "Cost a bill of materials at 1 and 100 units and explain why the two differ",
    ],
    blocks: [
      { t: "h", text: "Why hardware projects run late" },
      { t: "p", text: "Software can be fixed in an evening. Hardware cannot. A PCB order takes one to three weeks to arrive, imported parts can take longer and sometimes clear customs slowly, and a single wrong footprint means another full cycle. A capstone with a 14-week semester has room for perhaps two PCB revisions, and only if the first order goes out early. Planning is how you make sure the long waits overlap with useful work instead of stopping everything." },

      { t: "h", text: "Work breakdown and schedule" },
      { t: "p", text: "Start with a **work breakdown structure (WBS)**: break the project into deliverables, then into tasks small enough that each takes one person about one to five days. Give every task an owner, an estimate, and its dependencies. Then put the tasks on a timeline (a Gantt chart in a spreadsheet is plenty) and find the **critical path**: the longest chain of dependent tasks. Any delay on the critical path delays the demo; delays elsewhere have slack." },
      { t: "table", head: ["Week", "PCB and hardware", "Firmware", "ROS 2 software", "Milestone"], rows: [
        ["1 to 2", "Requirements, architecture, parts shortlist", "Requirements", "Requirements", "Requirements review"],
        ["3 to 4", "Schematic, PCB layout rev A, order", "Motor control on dev board", "LiDAR driver, SLAM in simulation", "PDR (week 4)"],
        ["5 to 6", "Wait for boards; build test jig", "micro-ROS link on dev board", "Nav2 in Gazebo", ""],
        ["7 to 8", "Bring-up rev A, log faults", "Port to rev A board", "Map the real route", "CDR (week 8)"],
        ["9 to 10", "Rev B layout and order", "Odometry, watchdog, battery", "Delivery state machine", ""],
        ["11 to 12", "Assemble rev B", "Integration fixes", "Integration fixes", "System test"],
        ["13 to 14", "Spares, enclosure", "Freeze", "Freeze", "Final review and report"],
      ], caption: "CampusRover 14-week plan. The PCB rev A order in week 4 is on the critical path." },
      { t: "p", text: "Notice the pattern: firmware and ROS 2 work proceeds on a development board and in simulation while the custom PCB is being made. That is deliberate. Never let software wait for hardware. Plan a **code freeze** two weeks before the final review; from then on, only fixes for failing tests are allowed." },

      { t: "h", text: "Risk register" },
      { t: "p", text: "A **risk** is something that has not happened yet but might, and would hurt the project if it did. For each, score **likelihood** (L) and **impact** (I) on a scale of 1 to 5, and multiply them to get a risk score from 1 to 25. Then choose a response: **avoid** (change the plan so it cannot happen), **reduce** (lower L or I), **transfer** (make someone else carry it, such as buying a finished module), or **accept** (watch it and keep a fallback). Review the register every week; a register written once and never opened is decoration." },
      { t: "table", head: ["ID", "Risk", "L", "I", "L × I", "Response"], rows: [
        ["R-01", "PCB rev A has a fault that needs a respin", "4", "4", "16", "Reduce: design review before order; add test points and 0 Ω jumpers"],
        ["R-02", "Imported LiDAR delayed at customs", "3", "5", "15", "Reduce: order in week 1; simulate with Gazebo LiDAR meanwhile"],
        ["R-03", "Nav2 too slow on Pi 5 for 5 Hz", "2", "4", "8", "Accept: benchmark week 4; Jetson fallback in decision record"],
        ["R-04", "Li-ion pack damaged by over-discharge", "2", "5", "10", "Avoid: BMS with low-voltage cut-off; firmware warning at 20 %"],
        ["R-05", "Team member unavailable for 2 weeks", "3", "3", "9", "Reduce: pair on each subsystem; docs in repo"],
        ["R-06", "Campus Wi-Fi blocks robot traffic", "3", "2", "6", "Transfer: request IT exception early; offline mode"],
      ], caption: "Score 15 or more: act this week. 8 to 14: plan a response. Below 8: watch." },
      { t: "diagram", text: String.raw`Impact →      1     2     3     4     5
Likelihood
    5          5    10    15    20    25
    4          4     8    12   [16]   20      R-01
    3          3   [6]   [9]    12  [15]      R-06, R-05, R-02
    2          2     4     6   [8]  [10]      R-03, R-04
    1          1     2     3     4     5`, caption: "Risk matrix. Bracketed cells hold CampusRover risks." },

      { t: "h", text: "Bill of materials and cost" },
      { t: "p", text: "The **bill of materials (BOM)** lists every part: reference designators, manufacturer part number, description, quantity per board, supplier and unit price. Cost it at the quantity you will actually buy, and separately at a volume quantity, because examiners and industry judges will ask what it would cost to make in numbers. Prices for one unit and for a hundred are very different, for three reasons: component **price breaks** (a part at ₹130 in hundreds may be ₹220 for one), **fixed costs** spread over the quantity (PCB set-up, stencil, shipping), and **minimum order quantities** (most PCB fabs make at least five boards)." },
      { t: "table", head: ["Item", "Qty", "1 unit (₹)", "Per unit at 100 (₹)"], rows: [
        ["ESP32-S3 module", "1", "450", "300"],
        ["Motor driver IC (brushed DC, H-bridge)", "2", "440", "260"],
        ["Buck converter IC and passives (24 V to 5 V, 5 A)", "1", "250", "120"],
        ["IMU IC", "1", "400", "250"],
        ["Connectors (power, motor, encoder, USB-C)", "set", "300", "150"],
        ["Resistors, capacitors, LEDs, fuse", "set", "200", "60"],
        ["PCB fabrication, 2-layer, 100 × 80 mm", "1", "1,500", "45"],
        ["Assembly", "1", "0 (hand soldered)", "80"],
        ["Total", "", "3,540", "1,265"],
      ], caption: "CampusRover motor and power PCB. Indicative Indian-market prices for 2026 including typical shipping, before GST; check current distributor prices before you order." },
      { t: "formula", text: String.raw`1 unit:   450 + 440 + 250 + 400 + 300 + 200 + 1500 + 0  = ₹3,540
100 units: 300 + 260 + 120 + 250 + 150 +  60 +   45 + 80 = ₹1,265 per board
Ratio:    3540 / 1265 ≈ 2.8`, caption: "The single prototype costs almost three times as much per board." },
      { t: "p", text: "The biggest single change is the PCB line. For one prototype you pay for the minimum order of five boards plus shipping, about ₹1,500, and it all lands on the one board you use. At 100 units the same panel cost is shared, so it falls to about ₹45 per board. The board BOM is only part of the robot: the battery, motors, LiDAR, Pi 5 and chassis dominate the ₹45,000 system budget, and your full BOM must include them, plus about 10 to 15 % contingency for parts you will break or reorder. Remember GST (most electronic components attract 18 %) when you compare with your budget." },
      { t: "note", kind: "warn", text: "Check stock and lead time, not only price. A part that is out of stock for 20 weeks is not a part. Prefer components available from two Indian distributors or with a pin-compatible second source." },

      { t: "deep", title: "Estimating and protecting the schedule", blocks: [
        { t: "p", text: "People underestimate tasks they have not done before by a factor of two or more. A common fix is three-point estimation: for each task estimate optimistic (O), most likely (M) and pessimistic (P) durations, and use the PERT mean (O + 4M + P) / 6. For PCB bring-up with O = 2, M = 4, P = 12 days, the mean is (2 + 16 + 12) / 6 = 5 days, longer than the most-likely guess, because the pessimistic tail is long." },
        { t: "p", text: "Put buffer at the end of the critical path rather than padding every task, since padded tasks expand to fill their time. Track progress by finished deliverables, not by hours spent: a task is either done (tested, merged, documented) or it is not." },
      ] },
      { t: "deep", title: "BOM management like a manufacturer", blocks: [
        { t: "p", text: "Professional BOMs carry more columns: manufacturer and manufacturer part number (not just a distributor code), approved alternates, lifecycle status (active, not recommended for new designs, end of life), RoHS status, and a do-not-populate flag for footprints left empty. KiCad can export a BOM directly from the schematic fields, so put the manufacturer part number into each symbol once and let the tool generate the list." },
        { t: "p", text: "At volume, cost also includes things a student BOM omits: assembly set-up and stencils, testing time per board, yield loss (if 3 % of boards fail test, every good board carries the cost of the failures), packaging, certification spread over the production run, and warranty returns. A rule of thumb from consumer electronics is that the selling price is often three to five times the BOM cost." },
      ] },
    ],
    mistakes: [
      "**Ordering the first PCB late.** If rev A goes out after week 5, there is no time for rev B.",
      "**Software waiting for hardware.** Develop firmware on a dev board and ROS 2 nodes in simulation in parallel.",
      "**A risk register written once.** Review it weekly and add new risks as you find them.",
      "**Costing only the PCB.** The system BOM includes battery, motors, sensors, compute, chassis, cables and contingency.",
      "**Ignoring minimum order quantities and shipping.** They dominate the cost of a single prototype.",
    ],
    practice: {
      kind: "bench",
      task: "Plan, risk-assess and cost your capstone.",
      steps: [
        "Write a WBS with 30 to 60 tasks, each with an owner, estimate and dependencies, and mark the critical path.",
        "Put your first PCB order date on the schedule and work backwards to the schematic review date.",
        "Write at least eight risks with L, I, score and a response, and agree a weekly review time.",
        "Cost your full system BOM at 1 unit and the PCB BOM at 100 units using current prices from at least two Indian distributors.",
        "Add 10 to 15 % contingency and GST, and compare with your budget requirement.",
      ],
    },
    quiz: [
      {
        q: "A risk has likelihood 3 and impact 5 on 1 to 5 scales. What is its score, and what should you do?",
        options: ["8, watch it", "15, act on it now", "2, accept it", "35, cancel the project"],
        answer: 1,
        why: "Score = L × I = 3 × 5 = 15, in the band where the lesson says to act this week.",
      },
      {
        q: "Why is the PCB cost per board so much higher for one prototype than at 100 units?",
        options: [
          "Prototype boards use better copper",
          "The minimum order and shipping cost are spread over one board instead of a hundred",
          "GST only applies to prototypes",
          "Larger orders use smaller boards",
        ],
        answer: 1,
        why: "Fixed costs (minimum order of five, set-up, shipping) are carried by one board for a prototype but shared across a hundred.",
      },
      {
        q: "Using the lesson's BOM, how much of the ₹3,540 single-unit cost is the PCB fabrication line?",
        options: ["About 13 %", "About 42 %", "About 75 %", "About 4 %"],
        answer: 1,
        why: "1,500 / 3,540 ≈ 0.42, so about 42 %. At 100 units it falls to 45 / 1,265 ≈ 4 %.",
      },
      {
        q: "What is the critical path?",
        options: [
          "The tasks with the highest risk score",
          "The longest chain of dependent tasks, which sets the earliest finish date",
          "The tasks done by the team leader",
          "The order in which parts arrive",
        ],
        answer: 1,
        why: "Any delay on the longest dependent chain delays the end date. Tasks off that chain have slack.",
      },
      {
        q: "Buying a finished, certified Wi-Fi module instead of designing your own radio circuit is which kind of risk response?",
        options: ["Accept", "Avoid", "Transfer", "Ignore"],
        answer: 2,
        why: "You hand the risk (RF design and much of the radio certification work) to the module maker, so it is a transfer.",
      },
    ],
  },

  "a18-verification-reliability-and-safety": {
    id: "a18-verification-reliability-and-safety",
    outcomes: [
      "Tell verification from validation and plan tests at unit, integration and system level",
      "Write test cases and keep a traceability matrix from requirement to result",
      "Run an FMEA with severity, occurrence and detection, and act on the RPN",
      "Use MTBF and failure rates for simple reliability estimates and outline fault trees and functional safety",
    ],
    blocks: [
      { t: "h", text: "Proving it works" },
      { t: "p", text: "A demo where the robot happens to work once proves very little. An examiner, a customer or a safety officer wants evidence: which requirement was tested, how, how many times, with what result, on which version of the hardware and software. That evidence is the right arm of the V-model, and it is also where you think hardest about how the system can fail and hurt someone." },

      { t: "h", text: "Verification and validation" },
      { t: "p", text: "**Verification** asks: did we build the system right? It checks the product against its requirements, one requirement at a time. **Validation** asks: did we build the right system? It checks the product against the real need, with real users in the real environment. A rover can pass every verification test on the lab corridor and fail validation on campus because students actually want deliveries at 10 pm, when the paths are dark and the LiDAR works fine but the cameras for the recipient's face do not. Both are necessary; verification is what the test plan mostly contains." },
      { t: "list", items: [
        "**Unit tests** check one component alone: the PID speed loop on the dev board, the battery voltage divider reading, one ROS 2 node with recorded data.",
        "**Integration tests** check interfaces: the PCB and Pi exchange /cmd_vel and /wheel_odom at the ICD rates; the timeout stops the motors in 250 ms.",
        "**System tests** check SYS- requirements on the complete rover: stopping distance, speed, deliveries per charge.",
        "**Acceptance (validation) tests** put the rover on the real route with real users for a week of deliveries.",
        "**Regression tests** repeat earlier tests after every change, so a fix in one place does not break another.",
      ] },

      { t: "h", text: "Test cases" },
      { t: "p", text: "Each test case is a recipe that someone else could follow and get the same answer. It names the requirement it verifies, the set-up, the equipment, the steps, the pass criteria written before the test is run, and a place to record the result and the versions under test." },
      { t: "snippet", lang: "text", code: String.raw`TEST CASE TC-003            Verifies: SYS-003 (stop within 0.5 m at 1.0 m/s)
Level: System               Method: Test              Author: Priya   Version: 1.1

Set-up
  - Dry level paving, 20 m straight run, marked start line and detection line.
  - Rover at full charge, 3.0 kg payload.
  - Obstacle: cardboard box 40 x 30 x 30 cm placed 3 m beyond detection line.
  - Equipment: 5 m tape, phone video at 60 fps beside the detection line.

Steps
  1. Command 1.0 m/s straight; confirm speed from /wheel_odom log (0.95 to 1.05 m/s).
  2. Record /scan and /cmd_vel with ros2 bag record.
  3. Measure distance from the point of first detection (from the log) to the rover's
     final front-bumper position.
  4. Repeat 10 times.

Pass criteria (fixed before testing)
  - All 10 stops within 0.50 m; no contact with the obstacle.

Results
  Run:    1    2    3    4    5    6    7    8    9    10
  d (m): ___  ___  ___  ___  ___  ___  ___  ___  ___  ___
  PCB rev: ____  FW git hash: ________  ROS 2 git hash: ________
  Result: PASS / FAIL       Tester: ________   Date: ________
  Notes / defects raised: ________________________________`, caption: "Test case template. The versions line makes results reproducible." },

      { t: "h", text: "Traceability matrix" },
      { t: "p", text: "A **traceability matrix** links every requirement to the design elements that implement it, the test cases that verify it, and the latest result. Read across a row and you can answer \"how do we know SYS-003 is met?\" Read down the test column and any empty cell is a requirement nobody is checking. It is the single most persuasive page in a final report." },
      { t: "table", head: ["Requirement", "Design elements", "Test case", "Method", "Status"], rows: [
        ["SYS-001 payload 3 kg", "Chassis drawing CH-02", "TC-001", "Test", "Pass (rev B)"],
        ["SYS-002 speed 0.8 m/s", "FW-010 PID, motor spec", "TC-002", "Test", "Pass (0.86 m/s mean)"],
        ["SYS-003 stop 0.5 m", "SW-030, FW-021, HW-012", "TC-003", "Test", "Pass (max 0.41 m)"],
        ["SYS-004 6 deliveries", "Battery pack, FW-040", "TC-004", "Test", "Fail (5 runs), CR-07 open"],
        ["SYS-005 hardware E-stop", "Schematic sheet 3, K1", "TC-005", "Inspection + Test", "Pass"],
        ["SYS-006 5 to 45 °C", "Thermal calc TA-01", "TA-01", "Analysis", "Pass with 6 °C margin"],
      ], caption: "Reporting a failure honestly, with a change request, is better than hiding it." },

      { t: "h", text: "Failure mode and effects analysis (FMEA)" },
      { t: "p", text: "Testing finds the failures you thought to test for. **FMEA** is a structured way to think of the others before they happen. For each component or function, ask: how can it fail (failure mode), what happens then (effect), why would it fail (cause), and how would we notice (detection)? Score three numbers from 1 to 10. **Severity (S)**: how bad is the effect (10 = injury with no warning). **Occurrence (O)**: how likely is the cause (10 = almost certain). **Detection (D)**: how likely is it that the failure escapes your controls before it causes harm (10 = no way to detect it; note this scale is reversed, a high D is bad). Multiply them to get the **risk priority number**, RPN = S × O × D, from 1 to 1000." },
      { t: "table", head: ["Item / mode", "Effect", "Cause", "S", "O", "D", "RPN", "Action"], rows: [
        ["IMU I2C bus locks up", "Heading drifts, rover leaves path", "Noise on long I2C wires", "6", "4", "6", "144", "Bus-recovery routine; watchdog on IMU data age"],
        ["Encoder cable unplugs", "Odometry wrong, wrong stop", "Vibration, no latch", "8", "3", "5", "120", "Latching connector; firmware checks encoder vs current"],
        ["Motor driver overheats", "Motor cuts out on slope", "Undersized copper, no heatsink", "7", "4", "3", "84", "Thermal relief review; current limit"],
        ["Wi-Fi link lost", "No arrival message", "Campus coverage gap", "5", "6", "2", "60", "Queue messages; retry on reconnect"],
        ["Li-ion over-discharge", "Pack damage, fire risk later", "BMS fault or bypass", "9", "3", "2", "54", "BMS cut-off plus firmware cut-off"],
      ], caption: "CampusRover FMEA extract. Highest RPN first." },
      { t: "formula", text: String.raw`RPN = S × O × D
IMU lock-up:      6 × 4 × 6 = 144
Encoder cable:    8 × 3 × 5 = 120
Driver overheat:  7 × 4 × 3 =  84
Wi-Fi loss:       5 × 6 × 2 =  60
Over-discharge:   9 × 3 × 2 =  54` },
      { t: "p", text: "Sort by RPN and work from the top, but do not follow the RPN blindly: any row with **severity 9 or 10** gets an action regardless of its RPN, because a rare, well-detected failure that can cause a fire still needs a second line of defence. That is why Li-ion over-discharge, the lowest RPN here, has two independent cut-offs. After each action, rescore the row; the IMU watchdog lowers D from 6 to 2 and the RPN from 144 to 48." },

      { t: "h", text: "Reliability: failure rate and MTBF" },
      { t: "p", text: "For electronics in their useful life, failures occur at a roughly constant **failure rate** λ (failures per hour). Its reciprocal is the **mean time between failures**, MTBF = 1 / λ. The probability that a unit survives for time t without failing is the **reliability** R(t) = e^(−t / MTBF). For a series system, where any one part failing stops the whole, failure rates add." },
      { t: "formula", text: String.raw`λ = 1 / MTBF           R(t) = e^(−λt)          series system: λ_sys = Σ λ_i

Controller board  MTBF 50,000 h   →  λ = 2.00 × 10⁻⁵ /h
Motor drivers     MTBF 30,000 h   →  λ = 3.33 × 10⁻⁵ /h
LiDAR             MTBF 100,000 h  →  λ = 1.00 × 10⁻⁵ /h
λ_sys = 6.33 × 10⁻⁵ /h          MTBF_sys = 1 / 6.33 × 10⁻⁵ ≈ 15,800 h
R(1000 h) = e^(−0.0633) ≈ 0.939`, caption: "The system is less reliable than its weakest part: about a 94 % chance of 1000 h with no failure." },
      { t: "p", text: "MTBF does not mean each unit lasts that long. With MTBF 15,800 h, the chance of surviving 15,800 h is e^(−1) ≈ 0.37, so about 63 % of units will have failed by then. It is a rate, useful for comparing designs and planning spares, not a lifetime guarantee. Mechanical parts (motors, gearboxes, connectors, the battery) wear out and do not follow the constant-rate model; treat their rated life separately." },

      { t: "h", text: "Fault trees and functional safety, in outline" },
      { t: "p", text: "FMEA works bottom up, from parts to effects. A **fault tree** works top down: start with one undesired event, such as \"rover strikes a pedestrian\", and break it into the combinations of lower events that could cause it, joined by AND and OR gates. An OR gate means any one cause is enough; an AND gate means all must happen together, which is why independent redundant protections are powerful." },
      { t: "diagram", text: String.raw`                 Rover strikes pedestrian
                           │
                        ┌──┴──┐
                        │ AND │
                        └──┬──┘
             ┌─────────────┴──────────────┐
      Obstacle not handled          E-stop not used in time
             │                             │
          ┌──┴──┐                    (bystander or
          │ OR  │                     remote stop)
          └──┬──┘
    ┌────────┼─────────┐
 LiDAR fails  Nav2 stalls  Motor will not stop
              (no timeout)  (driver fault)`, caption: "A fault tree outline. The AND gate shows why the independent hardware E-stop matters." },
      { t: "p", text: "**Functional safety** is the part of safety that depends on a control system working correctly. The umbrella standard is **IEC 61508**, which defines Safety Integrity Levels (SIL 1 to 4) and requires a safety lifecycle: hazard analysis, safety requirements, design, verification and validation, all documented. Sector standards derive from it: **ISO 26262** for road vehicles (with ASIL A to D), IEC 62061 and ISO 13849 for machinery, and others. A student capstone will not be certified to any of these, but you should adopt their habits: a written hazard list, a safety requirement for each serious hazard, and a hardware safety path (the E-stop cutting motor power through a relay) that does not depend on software working." },
      { t: "note", kind: "safety", text: "The CampusRover E-stop must remove motor power in hardware. A button that asks the firmware to stop is not an emergency stop, because the failure you are protecting against may be the firmware itself. Test it every session before the rover moves." },

      { t: "deep", title: "The bathtub curve and where MTBF figures come from", blocks: [
        { t: "p", text: "Plotted over a product's life, failure rate looks like a bathtub: high at first (infant mortality, from manufacturing defects such as cold solder joints), then low and flat (random failures, the region the constant-λ model describes), then rising again (wear-out: electrolytic capacitors drying, connectors fretting, bearings wearing). Manufacturers remove the first region with burn-in and testing, and designers delay the third by derating parts (running a capacitor at 50 to 80 % of its voltage rating, a resistor well below its power rating)." },
        { t: "p", text: "MTBF numbers come from prediction handbooks (MIL-HDBK-217F, Telcordia SR-332, IEC 61709) that assign each part a base failure rate adjusted for temperature, stress and quality; or from accelerated life testing, where parts run hot and the Arrhenius model scales the result back to normal temperature; or from field return data. Prediction handbooks are known to be pessimistic or optimistic depending on the part, so treat their output as a comparison tool." },
        { t: "p", text: "Redundancy changes the arithmetic. Two independent units in parallel, either of which is enough, fail only if both fail: R_parallel = 1 − (1 − R)². With R = 0.939 each, R_parallel = 1 − 0.061² ≈ 0.996. That is the quantitative case for the AND gate in the fault tree." },
      ] },
      { t: "deep", title: "Running an FMEA session that works", blocks: [
        { t: "p", text: "FMEAs fail when one person fills in a spreadsheet alone. Run it as a two-hour meeting with every subsystem owner, the block diagram on the wall, and the ICDs in hand. Go interface by interface as well as part by part: many of the worst failure modes are at boundaries (a connector, a timeout, a start-up order)." },
        { t: "p", text: "Agree the scoring scales in writing before you start, with examples for each level, or scores drift between people. Newer guidance (the AIAG and VDA FMEA handbook, 2019) replaces the RPN ranking with an action priority table that weights severity first; the principle is the same as the rule in this lesson that high severity always gets action." },
      ] },
    ],
    mistakes: [
      "**Writing pass criteria after seeing the results.** Fix them in the test case before the first run.",
      "**Not recording versions.** A pass on unknown firmware is not evidence of anything.",
      "**Scoring detection the wrong way round.** In FMEA, D = 10 means you cannot detect it; a high D increases the RPN.",
      "**Ignoring high severity because the RPN is low.** Severity 9 or 10 always gets an action.",
      "**Reading MTBF as lifetime.** About 63 % of units have failed by t = MTBF.",
      "**A software-only emergency stop.** The emergency path must cut power in hardware.",
    ],
    practice: {
      kind: "bench",
      task: "Build the verification and safety pack for your capstone.",
      steps: [
        "Write a test case in the template for each system requirement, with pass criteria fixed in advance.",
        "Build the traceability matrix and check that every requirement has at least one test, inspection, analysis or demonstration.",
        "Run a team FMEA with at least ten rows covering parts and interfaces; act on the top three RPNs and every severity 9 or 10 row.",
        "Draw a fault tree for your worst hazard and identify the independent protections under each AND gate.",
        "Run one system test for real, ten repetitions, recording versions, and enter the result in the matrix.",
      ],
    },
    quiz: [
      {
        q: "An FMEA row has severity 7, occurrence 5 and detection 4. What is its RPN?",
        options: ["16", "140", "35", "280"],
        answer: 1,
        why: "RPN = S × O × D = 7 × 5 × 4 = 140.",
      },
      {
        q: "Two parts in series have MTBFs of 20,000 h and 20,000 h. What is the system MTBF?",
        options: ["40,000 h", "20,000 h", "10,000 h", "400,000 h"],
        answer: 2,
        why: "Failure rates add: 1/20,000 + 1/20,000 = 1/10,000 per hour, so MTBF = 10,000 h.",
      },
      {
        q: "The rover passes every requirement test, but in the first week on campus students stop using it because deliveries take too long. Which activity would have caught this?",
        options: ["Unit testing", "Validation with real users", "Regression testing", "FMEA"],
        answer: 1,
        why: "Verification checks against requirements; validation checks against the real need. A requirement set can be met while the need is not.",
      },
      {
        q: "An FMEA row has severity 10 but RPN only 40. What should the team do?",
        options: [
          "Nothing, because the RPN is below 100",
          "Take action anyway, because severity 9 or 10 always gets an action",
          "Lower the severity score",
          "Delete the row",
        ],
        answer: 1,
        why: "The lesson's rule: high severity rows get an action regardless of RPN, typically an independent second protection.",
      },
      {
        q: "In a traceability matrix, what does an empty test-case cell next to a requirement mean?",
        options: [
          "The requirement passed",
          "Nobody is verifying that requirement",
          "The requirement is non-functional",
          "The test was a demonstration",
        ],
        answer: 1,
        why: "Every requirement needs a verification. An empty cell is a gap in the evidence.",
      },
      {
        q: "A unit has MTBF 10,000 h. Roughly what fraction of units survive 10,000 h without failing?",
        options: ["About 100 %", "About 50 %", "About 37 %", "About 0 %"],
        answer: 2,
        why: "R(t) = e^(−t/MTBF) = e^(−1) ≈ 0.37. MTBF is a rate, not a lifetime.",
      },
    ],
  },

  "a18-compliance-reviews-and-the-capstone": {
    id: "a18-compliance-reviews-and-the-capstone",
    outcomes: [
      "Outline the main compliance regimes for electronics sold in India, Europe and the US",
      "Write a design report that a reader can follow and audit",
      "Prepare for and run preliminary and critical design reviews",
      "Present and defend the capstone, and plan the final project deliverables",
    ],
    blocks: [
      { t: "h", text: "From working prototype to something you could sell" },
      { t: "p", text: "Your capstone is a prototype and will not be certified. But examiners, recruiters and startup judges increasingly ask \"what would it take to sell this?\", and the honest answer includes compliance: the legal approvals a product needs before it can be put on the market. Knowing them in outline shapes design choices now (for example, using a pre-certified radio module) and makes your report credible. Then the module turns to the skills that decide your grade as much as the hardware: writing the report, surviving design reviews, and defending the project." },

      { t: "h", text: "Compliance in outline" },
      { t: "note", kind: "warn", text: "Regulations change often, and which rules apply depends on the exact product category. Treat this section as a map of what to look up, not as legal advice. Check the current official sources (BIS, the DoT WPC wing and its Saral Sanchar portal, the EU and FCC sites) or a certified test lab before any product launch." },
      { t: "table", head: ["Regime", "Region", "What it covers", "What it means for CampusRover"], rows: [
        ["CE marking", "EU and EEA", "Manufacturer declares conformity with the applicable EU directives, e.g. EMC, Low Voltage, Radio Equipment Directive (RED), RoHS, and keeps a technical file", "The Wi-Fi radio brings in RED; EMC and safety testing at a lab; a declaration of conformity"],
        ["FCC Part 15", "USA", "Limits on radio emissions: unintentional radiators (any digital circuit) and intentional radiators (radios)", "Using an FCC-certified Wi-Fi module helps, but the finished product still needs its own unintentional emissions assessment"],
        ["BIS CRS", "India", "Compulsory Registration Scheme: products on the government's notified list must be tested at a BIS-recognised lab against the named Indian Standard and registered before sale", "Check whether the product or its parts (for example the battery pack or power adapter) fall in a notified category; many such items do"],
        ["WPC ETA", "India", "Equipment Type Approval from the Department of Telecommunications WPC wing for wireless equipment. Licence-exempt band devices (such as 2.4 GHz Wi-Fi and Bluetooth) can generally use the self-declaration route on the Saral Sanchar portal", "The finished rover, as wireless equipment sold in India, needs ETA even if the module already has one; confirm the current rule"],
        ["RoHS", "EU, and India under the E-waste Rules", "Limits on hazardous substances such as lead, mercury, cadmium and some flame retardants in electrical equipment", "Choose RoHS-compliant parts and lead-free solder from the start; record RoHS status in the BOM"],
      ], caption: "Compliance regimes in outline, as understood in late 2026. Verify against current official sources." },
      { t: "p", text: "Two practical design consequences follow. First, **use a pre-certified radio module** (an ESP32-S3 module with existing approvals) and follow its integration guide for antenna clearance, because designing your own RF section multiplies test cost and risk. Second, **design for EMC from the start**: a solid ground plane, short motor current loops, filtering on cables that leave the board, and snubbing on the motor drivers. Fixing emissions after a failed lab test usually means a board respin. India also has telecom-specific testing under the TEC's MTCTE scheme for some telecom equipment categories; most IoT devices with simple Wi-Fi are not in its scope, but check whether yours is." },

      { t: "h", text: "Technical writing" },
      { t: "p", text: "Your design report is read by examiners who have perhaps twenty minutes and who will judge your engineering by how clearly you explain it. Write for that reader. Put the answer first: each chapter opens with what was decided and why, then the evidence. Use the same IDs everywhere (SYS-003, IF-02, TC-003, R-01) so the reader can follow a thread from requirement to design to test. Every figure has a numbered caption that says what to notice, and every number has units. State failures and limitations plainly; a report that admits SYS-004 failed and explains the root cause and fix scores better than one that hides it, because it shows engineering judgment." },
      { t: "list", ordered: true, items: [
        "**Abstract** (200 words): problem, approach, key results with numbers.",
        "**Introduction and needs**: who it is for and why.",
        "**Requirements**: the table, with rationale.",
        "**Architecture**: block diagram, interfaces, trade studies and decision records.",
        "**Detailed design**: hardware (schematic, layout, power budget), firmware, ROS 2 software.",
        "**Verification and validation**: test plan, traceability matrix, results, FMEA.",
        "**Project management**: schedule against plan, risk register, BOM cost at 1 and 100 units.",
        "**Compliance and safety**: hazards, safety measures, path to certification.",
        "**Conclusions and future work**: what met requirements, what did not, what you would change.",
        "**Appendices**: full schematics, BOM, ICDs, test records, repository link with tagged release.",
      ] },

      { t: "h", text: "Design reviews: PDR and CDR" },
      { t: "p", text: "A **design review** is a meeting where people outside your team try to find problems before they become expensive. The **preliminary design review (PDR)** comes after requirements and architecture and before you commit money: are the requirements right, is the architecture sound, are the trade studies fair, are the big risks handled? The **critical design review (CDR)** comes when the detailed design is complete and before the final build: is the schematic and layout correct, does the power budget close, are the test cases ready? Ask your guide and another team to review. Send the material three days ahead, so reviewers come with questions, not first impressions. Record every action item with an owner and a date, and close each one in writing." },
      { t: "snippet", lang: "text", code: String.raw`DESIGN REVIEW CHECKLIST            Review: PDR / CDR       Date: ________
Project: CampusRover               Reviewers: ________________________

Requirements (PDR)
[ ] Every requirement has an ID, the word "shall", a number and a condition
[ ] Non-functional requirements cover power, environment, safety, cost
[ ] Every requirement has a verification method
Architecture (PDR)
[ ] Block diagram shows every interface with an ID and an owner
[ ] ICDs exist for all interfaces, with versions and timeout behaviour
[ ] Trade studies have justified scores and a sensitivity check
[ ] Risk register reviewed; all scores of 15 or more have actions
Detailed design (CDR)
[ ] Schematic: ERC clean, every net named, pull-ups and decoupling checked
[ ] 3.3 V logic levels respected on ESP32 pins; level shifting where needed
[ ] Power budget closes with at least 20 % margin on every rail
[ ] PCB: DRC clean, footprints checked against datasheets, test points on key nets
[ ] Hardware E-stop removes motor power independently of firmware
[ ] FMEA done; severity 9 and 10 rows have actions
[ ] Test cases written for every requirement; test equipment available
[ ] BOM costed, parts in stock, alternates noted
Outcome
[ ] Pass    [ ] Pass with actions    [ ] Repeat review
Action items: ID / description / owner / due date`, caption: "Design review checklist. Tick only what you have evidence for." },

      { t: "h", text: "Presenting and defending the project" },
      { t: "p", text: "A final presentation of 15 to 20 minutes should follow the same thread as the report: the need, the requirements that matter most, the architecture, two or three key decisions, the evidence (a short video of TC-003 and the traceability matrix), what failed and what you learned, and what it would cost to make. One idea per slide, with a title that states the conclusion (\"Stopping distance meets SYS-003 with 0.09 m margin\", not \"Test results\"). Rehearse the live demo and have a recorded video ready in case the campus Wi-Fi or a battery fails on the day." },
      { t: "p", text: "In the question session, examiners probe decisions. Answer with the evidence you already have: \"We chose the Pi 5 over the Jetson; here is the trade study, and it stays ahead under a sensitivity check.\" If you do not know, say so and say how you would find out. Divide topics among team members in advance so each person answers for their subsystem, which also demonstrates that everyone contributed." },

      { t: "h", text: "The final project" },
      { t: "p", text: "The course's exit project brings everything together: a **custom PCB, firmware and ROS 2 software forming one autonomous or connected system, with a full design report**. CampusRover is one example; a connected environmental monitoring network (solar-powered ESP32 sensor nodes on a custom board reporting to a ROS 2 or MQTT gateway) is another. Whatever you choose, the deliverables are the artefacts from this module: requirements, architecture and ICDs, trade studies, plan, risk register, BOM at 1 and 100 units, test cases and traceability matrix, FMEA, compliance outline, design reviews with closed actions, the report, the presentation, and a tagged repository with schematics, layout, firmware and ROS 2 packages." },

      { t: "deep", title: "What a certification test lab actually does", blocks: [
        { t: "p", text: "For EMC, a lab measures **radiated emissions** in a semi-anechoic chamber or open area test site, with antennas at a set distance while the product runs in its noisiest mode, and **conducted emissions** on the power cable through a line impedance stabilisation network. It then tests **immunity**: electrostatic discharge to exposed points, radiated RF fields, electrical fast transients and surges on cables. Radios are additionally tested for output power, occupied bandwidth, spurious emissions and receiver performance in their band." },
        { t: "p", text: "Pre-compliance testing saves money: a near-field probe and a low-cost spectrum analyser on your own bench can find the worst emitters (often motor driver switching edges and the buck converter's switching node) before you pay for chamber time. Typical fixes are ferrite beads on cables, slowing switching edges, and shrinking high-current loop areas on the PCB." },
      ] },
      { t: "deep", title: "Writing style that examiners reward", blocks: [
        { t: "p", text: "Use the active voice and the past tense for what you did (\"We measured stopping distance ten times\"), and the present tense for what the design is (\"The firmware ramps the motors to zero in 300 ms\"). Prefer short sentences. Define every abbreviation once. Put long tables and logs in appendices and summarise them in the text with the one number that matters." },
        { t: "p", text: "Cite datasheets, standards and papers with full references, including the version or revision. Plagiarism checks are standard; write in your own words and quote sparingly. Ask someone outside the team to read the abstract and conclusion only, then tell you what the project achieved. If they cannot, rewrite those two sections." },
      ] },
    ],
    mistakes: [
      "**Assuming a certified module certifies the product.** The finished product still needs its own assessment for emissions and, in India, its own ETA.",
      "**Treating compliance as a final step.** EMC and RoHS choices are made during component selection and layout.",
      "**Reviews with no action log.** A review whose findings are not recorded and closed changes nothing.",
      "**Slides titled with topics, not conclusions.** State the finding in the title.",
      "**Hiding failures.** Report failed requirements with root cause and fix; it shows judgment.",
      "**Live demo with no backup.** Always have a recorded video of every key test.",
    ],
    practice: {
      kind: "bench",
      task: "Run your PDR and CDR and assemble the final project pack.",
      steps: [
        "Prepare a PDR pack (requirements, architecture, ICDs, trade studies, risk register) and send it to reviewers three days ahead.",
        "Hold the PDR using the checklist, record action items with owners and dates, and close them in writing.",
        "Repeat for the CDR before ordering your final PCB revision.",
        "Write a one-page compliance outline for your product: which regimes apply, which you would satisfy with pre-certified modules, and what you would still need to test.",
        "Draft the report abstract and conclusions, and have someone outside the team summarise your project from them.",
        "Rehearse a 15-minute presentation twice with timed questions, and record backup demo videos.",
      ],
    },
    quiz: [
      {
        q: "A team uses a certified ESP32 Wi-Fi module in a product to be sold in India. Which statement is most accurate?",
        options: [
          "No further approval is needed because the module is certified",
          "The finished product, as wireless equipment, still needs its own WPC Equipment Type Approval",
          "Only BIS CRS applies to wireless devices",
          "Only FCC Part 15 applies in India",
        ],
        answer: 1,
        why: "The lesson notes that the finished wireless product needs its own ETA even when the module has one; licence-exempt band devices can generally use the self-declaration route.",
      },
      {
        q: "When is the critical design review held?",
        options: [
          "Before requirements are written",
          "After the detailed design is complete and before the final build",
          "After the final presentation",
          "On the first day of the project",
        ],
        answer: 1,
        why: "PDR checks requirements and architecture before money is committed; CDR checks the complete detailed design before the final build.",
      },
      {
        q: "Which slide title follows the lesson's advice?",
        options: [
          "Test results",
          "Stopping distance meets SYS-003 with 0.09 m margin",
          "Slide 12",
          "Our robot",
        ],
        answer: 1,
        why: "A conclusion title tells the audience what to notice and links to the requirement ID.",
      },
      {
        q: "Why choose RoHS-compliant parts and lead-free solder at the start rather than later?",
        options: [
          "Because RoHS only applies to prototypes",
          "Because changing materials after the design is fixed means re-sourcing parts and possibly reworking the assembly process",
          "Because lead-free solder is cheaper",
          "Because RoHS limits radio emissions",
        ],
        answer: 1,
        why: "RoHS restricts substances in the parts and solder, so it is decided during component selection; retrofitting it means re-sourcing and reassembly.",
      },
      {
        q: "Your report must show that SYS-004 (6 deliveries per charge) failed. What is the best approach?",
        options: [
          "Remove SYS-004 from the requirements table",
          "Report the failure with measured results, root cause and the planned fix",
          "Change the requirement to 5 deliveries and mark it passed",
          "Leave it out of the traceability matrix",
        ],
        answer: 1,
        why: "Honest reporting with root cause and a fix shows engineering judgment, and the IDs must stay consistent across the report.",
      },
    ],
  },
};

export default lessons;
