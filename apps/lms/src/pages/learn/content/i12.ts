import type { ModuleContent } from "../model/curriculum";

/**
 * Module i12: Mobile robot fundamentals.
 * Normal mode is complete on its own; `deep` sections hold derivations and detail.
 * Both Arduino programs compile with arduino-cli for arduino:avr:uno (AVR core 1.8.8).
 */
const lessons: ModuleContent = {
  "i12-robot-anatomy-and-kinematics": {
    id: "i12-robot-anatomy-and-kinematics",
    outcomes: [
      "Name the five subsystems of a mobile robot and what each one must provide",
      "Derive the forward speed v and turn rate ω of a differential-drive robot from its wheel speeds",
      "Find the instantaneous centre of rotation and turning radius for a pair of wheel speeds",
      "Work backwards from a wanted v and ω to the wheel speeds to command",
    ],
    blocks: [
      { t: "h", text: "Why a robot is more than a car with a microcontroller" },
      { t: "p", text: "A remote-control car goes where a human steers it. A robot has to decide where to go and then check whether it got there. That loop of sensing, deciding and acting is what makes a machine a robot, and every part of the hardware exists to serve it. Before you can write good control code you need a clear model of two things: what the physical parts are and what they can do, and how the speeds of the wheels turn into motion of the whole body. This lesson covers both." },

      { t: "h", text: "The five subsystems" },
      { t: "table", head: ["Subsystem", "Typical student parts", "What it must provide"], rows: [
        ["Chassis", "Acrylic or aluminium two-wheel plate, caster ball, motor brackets", "Rigid mounting, sensible centre of mass, clearance over the floor"],
        ["Drive", "N20 or TT gear motors, TB6612FNG or L298N driver, wheels, encoders", "Enough torque to accelerate, speed control, ideally speed feedback"],
        ["Sensors", "IR reflectance array, HC-SR04 ultrasonic, Sharp IR ranger, wheel encoders, IMU", "Information about the floor, obstacles and the robot's own motion"],
        ["Compute", "Arduino Uno or ESP32 DevKit, later a Raspberry Pi", "Fast, regular control loop; enough pins and timers"],
        ["Power", "2S Li-ion (7.4 V nominal) or 6 × AA NiMH, buck regulator", "Motor current without browning out the logic"],
      ] },
      { t: "p", text: "These subsystems constrain each other. Heavy batteries need stronger motors. Fast motors need a faster control loop. A sensor array mounted far ahead of the wheels sees the line early but swings sideways a lot when the robot turns. When something goes wrong on a robot, the cause is often in a different subsystem from the symptom: a robot that \"loses the line\" on a fast bend may have perfectly good sensors and a battery sagging under the motor current." },
      { t: "p", text: "**Power deserves special care.** A DC gear motor can draw five to ten times its running current at stall or at the instant it starts. If the motors and the microcontroller share one supply without enough capacity and decoupling, every start pulls the supply down and the board resets. The standard arrangement is a battery feeding the motor driver directly, and a regulator (a buck converter, or the Uno's on-board regulator from VIN) feeding the logic, with grounds joined at one point and a large electrolytic capacitor (220 to 470 µF) across the motor supply near the driver." },
      { t: "note", kind: "safety", text: "Li-ion and LiPo cells can catch fire if shorted, over-charged or punctured. Use a holder with a protection board or a fused lead, charge with a proper balance charger, never leave a charging pack unattended, and never let a stalled robot sit with motors powered: a stalled motor heats quickly." },

      { t: "h", text: "The differential-drive layout" },
      { t: "p", text: "Most first robots use **differential drive**: two independently driven wheels on one axle, plus a passive caster to keep the body level. There is no steering mechanism. The robot turns by driving its wheels at different speeds, exactly like a tank or a wheelchair. It is mechanically simple, can spin on the spot, and its motion is easy to model, which is why it is the standard teaching platform." },
      { t: "diagram", text: String.raw`
            forward (x of robot)
                   ↑
     left wheel    │    right wheel
       ┌──┐        │        ┌──┐
       │vL│────────●────────│vR│
       └──┘   L/2  │  L/2   └──┘
                   │
                 caster
   ● = midpoint of the axle (the point whose motion we track)`, caption: "Two driven wheels a track width L apart, and a passive caster." },
      { t: "p", text: "Three numbers describe the geometry: the wheel radius `r`, the **track width** `L` (the distance between the two wheels' contact points), and the wheel angular speeds `ωL` and `ωR` in radians per second. Each wheel's rim speed along the ground is `v = r × ω`, as long as the wheel does not slip." },

      { t: "h", text: "Forward kinematics: wheel speeds to body motion" },
      { t: "p", text: "Forward kinematics answers: given the wheel speeds, how does the robot move? The robot is rigid, so at any instant it is rotating about some point with an angular velocity ω (when going straight that point is infinitely far away). The midpoint of the axle moves at the average of the two wheel speeds, and the difference between the wheel speeds, spread across the track width, gives the turn rate:" },
      { t: "formula", text: String.raw`vL = r × ωL          vR = r × ωR
v  = (vR + vL) / 2
ω  = (vR - vL) / L`, caption: "v is forward speed of the axle midpoint (m/s); ω is turn rate (rad/s), positive anticlockwise seen from above." },
      { t: "p", text: "The point the robot rotates about is the **instantaneous centre of rotation (ICR)**. It always lies on the line through the axle, because neither wheel can move sideways. Its distance from the axle midpoint is the **turning radius** R:" },
      { t: "formula", text: String.raw`R = v / ω = (L/2) × (vR + vL) / (vR - vL)`, caption: "R > 0 means the ICR is to the left; R < 0 to the right." },
      { t: "p", text: "Check the special cases, which you should be able to picture. Equal wheel speeds give ω = 0 and R = ∞: straight line. Equal and opposite speeds give v = 0 and R = 0: a spin on the spot about the axle midpoint. One wheel stopped (say vL = 0) gives R = L/2: the robot pivots about the stopped wheel." },

      { t: "h", text: "Worked example" },
      { t: "p", text: "A robot has 65 mm wheels (r = 0.0325 m) and a track width of 150 mm. The left wheel turns at 10 rad/s and the right at 12 rad/s. Find v, ω and R." },
      { t: "formula", text: String.raw`vL = 0.0325 × 10 = 0.325 m/s
vR = 0.0325 × 12 = 0.390 m/s
v  = (0.390 + 0.325) / 2 = 0.3575 m/s
ω  = (0.390 - 0.325) / 0.150 = 0.433 rad/s  (about 24.8 °/s)
R  = 0.3575 / 0.433 = 0.825 m`, caption: "A gentle left curve." },
      { t: "p", text: "Check with the second form of the radius formula: (0.150 / 2) × (0.390 + 0.325) / (0.390 - 0.325) = 0.075 × 0.715 / 0.065 = 0.825 m. The two agree. A second sanity check: the right wheel is on the outside of the curve, so its radius should be R + L/2 = 0.900 m and it should travel 0.900 / 0.825 = 1.09 times as fast as the centre. Indeed 0.390 / 0.3575 = 1.09." },

      { t: "h", text: "Inverse kinematics: the form you actually command" },
      { t: "p", text: "A controller usually decides \"go forward at 0.3 m/s while turning at 0.5 rad/s\". You then need the wheel speeds. Solve the two forward equations for vR and vL:" },
      { t: "formula", text: String.raw`vR = v + ω × L / 2
vL = v - ω × L / 2`, caption: "Inverse kinematics of differential drive." },
      { t: "p", text: "For v = 0.3 m/s and ω = 0.5 rad/s with L = 0.15 m: vR = 0.3 + 0.0375 = 0.3375 m/s and vL = 0.2625 m/s. Divide by r = 0.0325 m to get 10.38 rad/s and 8.08 rad/s, or multiply by 60 / 2π to get about 99 and 77 rpm. Notice the pattern used later in line following: a base speed plus a correction on one wheel and minus the same correction on the other. That is inverse kinematics with ω as the correction." },
      { t: "note", kind: "tip", text: "Every motor has a top speed. If v + ωL/2 exceeds it, the outer wheel saturates and the robot turns less than you asked. Good controllers scale v down when a sharp turn is needed rather than letting one wheel clip." },

      { t: "deep", title: "Deriving the kinematics from the rigid-body velocity rule", blocks: [
        { t: "p", text: "For a rigid body rotating at ω about the ICR, the speed of any point is ω times its distance from the ICR. Put the ICR at distance R from the midpoint along the axle. The left wheel is at R - L/2 and the right at R + L/2 from it." },
        { t: "formula", text: String.raw`vL = ω (R - L/2)
vR = ω (R + L/2)
vR - vL = ω L                 →  ω = (vR - vL) / L
vR + vL = 2 ω R               →  v = ω R = (vR + vL) / 2`, caption: "Subtract and add the two equations." },
        { t: "p", text: "The assumption hidden here is the **non-holonomic constraint**: the wheels roll without slipping sideways, so the robot's velocity at the axle midpoint is always along its heading. In world coordinates this is ẋ sin θ - ẏ cos θ = 0. A differential-drive robot therefore has three pose variables (x, y, θ) but only two controls (v, ω). It can reach any pose, as parallel parking shows, but not by moving directly sideways. Module a10 extends this to Ackermann and omnidirectional bases." },
      ] },
      { t: "deep", title: "Sizing a drive motor from first principles", blocks: [
        { t: "p", text: "Suppose a 1.2 kg robot must accelerate at 1 m/s² and climb a 5° ramp with 65 mm wheels. The force needed is m(a + g sin θ) plus rolling resistance (take 2% of weight): 1.2 × (1 + 9.81 × 0.0872) + 0.02 × 1.2 × 9.81 = 1.2 × 1.855 + 0.235 ≈ 2.46 N. Shared by two wheels at radius 0.0325 m, each needs 2.46 × 0.0325 / 2 ≈ 0.040 N·m, which is 0.41 kg·cm. Choose a motor whose rated (not stall) torque is at least double this, because a DC motor at stall draws maximum current and delivers no speed." },
        { t: "p", text: "Speed sets the gear ratio. For 0.6 m/s top speed the wheel must turn at 0.6 / 0.0325 = 18.5 rad/s, about 176 rpm. A motor rated 200 to 300 rpm at your battery voltage gives margin for battery sag and for the controller's corrections." },
      ] },
    ],
    mistakes: [
      "**Measuring track width between wheel inner faces.** L is between the contact patches (the wheel centre lines). Getting it wrong scales every turn by the same error.",
      "**Using the wheel diameter where the formula wants radius.** v = r × ω uses radius; using diameter doubles every speed.",
      "**Mixing rpm and rad/s.** Convert with ω (rad/s) = rpm × 2π / 60 before using the kinematics.",
      "**Sharing a weak supply between motors and logic.** Motor start-up current browns out the board and looks like a random software reset.",
      "**Assuming PWM duty equals speed.** The two motors of a pair rarely run at the same speed for the same duty; without feedback the robot drifts to one side.",
    ],
    practice: {
      kind: "bench",
      task: "Measure your own robot's geometry and check the kinematics against reality.",
      steps: [
        "Measure wheel diameter with vernier calipers at three points and average. Measure track width between the centre lines of the tyres.",
        "Mark a start line, run the robot with the left motor at a fixed duty and the right motor stopped for exactly one revolution of the robot. Measure the circle traced by the right wheel and compare its radius with L.",
        "Set both motors to the same duty for 2 s and measure the curve. Compute R from the measured path and back out the ratio vR / vL.",
        "Use inverse kinematics to compute wheel speeds for v = 0.2 m/s, ω = 1 rad/s. Predict R (0.2 m) and check it on the floor once speed control is working in the next lessons.",
      ],
    },
    quiz: [
      {
        q: "A robot with L = 0.2 m has vL = 0.30 m/s and vR = 0.50 m/s. What are v and ω?",
        options: ["v = 0.40 m/s, ω = 1.0 rad/s", "v = 0.80 m/s, ω = 1.0 rad/s", "v = 0.40 m/s, ω = 0.04 rad/s", "v = 0.20 m/s, ω = 2.0 rad/s"],
        answer: 0,
        why: "v = (0.50 + 0.30) / 2 = 0.40 m/s and ω = (0.50 - 0.30) / 0.2 = 1.0 rad/s.",
      },
      {
        q: "For the same robot, what is the turning radius?",
        options: ["0.2 m", "2.5 m", "0.4 m", "0.1 m"],
        answer: 2,
        why: "R = v / ω = 0.40 / 1.0 = 0.4 m. Check: (L/2)(vR + vL)/(vR - vL) = 0.1 × 0.8 / 0.2 = 0.4 m.",
      },
      {
        q: "The left wheel is stopped and the right wheel drives forward. Where is the instantaneous centre of rotation?",
        options: ["At the axle midpoint", "Infinitely far away", "At the right wheel", "At the left wheel's contact point"],
        answer: 3,
        why: "With vL = 0 the formula gives R = L/2, which is the position of the left wheel. The robot pivots about the stopped wheel.",
      },
      {
        q: "You want v = 0.25 m/s and ω = 2 rad/s with L = 0.15 m. Which wheel speeds do you command?",
        options: ["vL = 0.10, vR = 0.40 m/s", "vL = 0.40, vR = 0.10 m/s", "vL = 0.25, vR = 0.55 m/s", "vL = 0.175, vR = 0.325 m/s"],
        answer: 0,
        why: "ωL/2 = 2 × 0.075 = 0.15 m/s. vR = 0.25 + 0.15 = 0.40, vL = 0.25 - 0.15 = 0.10. Positive ω is anticlockwise, so the right wheel is faster.",
      },
      {
        q: "Your robot resets every time both motors start together. What is the most likely cause?",
        options: [
          "The PWM frequency is too high",
          "Motor start current is pulling down a shared supply and browning out the microcontroller",
          "The kinematics equations are wrong",
          "The encoders are counting too fast",
        ],
        answer: 1,
        why: "Motors draw several times their running current at start. A shared, weak supply sags and the board's brown-out detector resets it. Separate the supplies or add capacity.",
      },
    ],
  },

  "i12-wheel-odometry": {
    id: "i12-wheel-odometry",
    outcomes: [
      "Convert encoder ticks into wheel distance using the wheel diameter and ticks per revolution",
      "Update a robot's pose (x, y, θ) from left and right wheel distances",
      "Explain the sources of odometry drift and estimate the size of heading and position error",
      "Calibrate wheel diameter and track width with simple floor tests",
    ],
    blocks: [
      { t: "h", text: "Knowing where you are without looking" },
      { t: "p", text: "A robot that follows a line never needs to know where it is: the line tells it what to do. The moment you want a robot to drive 2 m, turn 90° and come back, it needs an estimate of its own position. The cheapest estimate comes from counting wheel revolutions. This is **wheel odometry**, a form of dead reckoning, the same idea ship navigators used before satellites: if you know how far you went and in which direction, you know where you are. It is fast, needs no external infrastructure, and is wrong in a way that grows steadily. Understanding exactly why it goes wrong is as important as the equations." },

      { t: "h", text: "Encoders and ticks" },
      { t: "p", text: "A wheel encoder produces pulses as the wheel turns. Small gear motors often carry a magnetic (Hall effect) encoder on the motor shaft with two channels, A and B, 90° out of phase. This is a **quadrature** encoder. Counting edges on A tells you how far the shaft turned; the level of B at the moment A rises tells you which way. Because the encoder sits on the motor shaft, before the gearbox, one wheel revolution gives many ticks: a 7 pulse-per-revolution magnet disc on a motor with a 1:30 gearbox, counting rising edges of A only, gives 7 × 30 = 210 ticks per wheel revolution. Counting both edges of both channels (\"×4 decoding\") gives four times as many." },
      { t: "formula", text: String.raw`distance per tick  d = π × D / N
wheel distance     s = ticks × d`, caption: "D is wheel diameter, N is ticks per wheel revolution as you count them." },
      { t: "p", text: "For a 65 mm wheel and N = 390 ticks per revolution, d = π × 0.065 / 390 = 0.524 mm per tick. That resolution is far finer than the accuracy you will actually get, as the drift section shows." },
      { t: "diagram", text: String.raw`
 A  ──┐   ┌───┐   ┌───┐   ┌──
      └───┘   └───┘   └───┘
 B  ┐   ┌───┐   ┌───┐   ┌───┐
    └───┘   └───┘   └───┘   └
        ↑ A rises while B is high: one direction
          (in the other direction, B is low when A rises)`, caption: "Quadrature: the phase of B relative to A gives direction." },

      { t: "h", text: "The pose update" },
      { t: "p", text: "The robot's **pose** is its position and heading in a fixed world frame: (x, y, θ). At a regular interval (10 ms is typical), read how many ticks each wheel has moved since last time, convert to distances ΔsL and ΔsR, and apply the differential-drive kinematics from the previous lesson to a small step instead of a speed:" },
      { t: "formula", text: String.raw`Δs = (ΔsR + ΔsL) / 2
Δθ = (ΔsR - ΔsL) / L
x  ← x + Δs × cos(θ + Δθ/2)
y  ← y + Δs × sin(θ + Δθ/2)
θ  ← θ + Δθ`, caption: "Midpoint (second order) update: the heading used is the average over the step." },
      { t: "p", text: "Using θ + Δθ/2 rather than plain θ matters only a little for short steps, but it is free and it removes a systematic error that otherwise accumulates on every curve. Keep θ wrapped into the range -π to π with `atan2(sin θ, cos θ)` so it does not grow without bound." },

      { t: "h", text: "Worked example" },
      { t: "p", text: "Starting at (0, 0, 0), in one update the left encoder moves 1000 ticks and the right 1100, with d = 0.524 mm and L = 0.150 m. (This is a large step to make the numbers visible; a real loop sees a few ticks per update.)" },
      { t: "formula", text: String.raw`ΔsL = 1000 × 0.0005236 = 0.5236 m
ΔsR = 1100 × 0.0005236 = 0.5760 m
Δs  = (0.5760 + 0.5236) / 2 = 0.5498 m
Δθ  = (0.5760 - 0.5236) / 0.150 = 0.349 rad = 20.0°
x   = 0.5498 × cos(10°) = 0.541 m
y   = 0.5498 × sin(10°) = 0.095 m
θ   = 20.0°`, caption: "Heading at the midpoint of the step is 10°." },
      { t: "p", text: "Check: the robot curved left (right wheel went further), so y should be positive and small compared with x. It is. Also, 0.541² + 0.095² = 0.302, √0.302 = 0.549 m, so the straight-line distance from the start is just under the 0.5498 m travelled along the arc, as it must be for a gentle curve." },

      { t: "h", text: "The odometry routine" },
      { t: "p", text: "The program below counts quadrature ticks on interrupts and updates the pose at 100 Hz, logging a CSV line at 10 Hz so you can plot the path on a PC. On the Uno only D2 and D3 have dedicated external interrupts (INT0 and INT1), so each encoder's channel A goes there and channel B goes to an ordinary input. The tick counters are `volatile` and are copied with interrupts disabled, because a `long` takes four bytes on an 8-bit AVR and an interrupt could change it halfway through a read." },
      { t: "snippet", lang: "cpp", code: String.raw`// Wheel odometry for a differential-drive robot on an Arduino Uno.
// Quadrature encoders: left A on D2 (INT0), left B on D4; right A on D3 (INT1), right B on D5.
const uint8_t L_A = 2, L_B = 4, R_A = 3, R_B = 5;

// Calibrate these three on your robot (see lesson).
const float WHEEL_DIAMETER_M = 0.065;
const float TRACK_WIDTH_M = 0.150;     // distance between wheel contact points
const float TICKS_PER_REV = 390.0;     // counted ticks per wheel turn (rising edges of A, after gearbox)

const float M_PER_TICK = PI * WHEEL_DIAMETER_M / TICKS_PER_REV;

volatile long leftTicks = 0, rightTicks = 0;
long lastLeft = 0, lastRight = 0;
float x = 0, y = 0, theta = 0;         // pose: metres, metres, radians
unsigned long lastUpdate = 0, lastPrint = 0;

void leftISR()  { if (digitalRead(L_B)) leftTicks--;  else leftTicks++; }
void rightISR() { if (digitalRead(R_B)) rightTicks++; else rightTicks--; }  // mirrored motor

void updateOdometry() {
  noInterrupts();
  long l = leftTicks, r = rightTicks;
  interrupts();

  float dL = (l - lastLeft) * M_PER_TICK;
  float dR = (r - lastRight) * M_PER_TICK;
  lastLeft = l; lastRight = r;

  float dS = (dR + dL) / 2.0;
  float dTheta = (dR - dL) / TRACK_WIDTH_M;

  // Midpoint integration: use the heading halfway through the step.
  x += dS * cos(theta + dTheta / 2.0);
  y += dS * sin(theta + dTheta / 2.0);
  theta += dTheta;
  theta = atan2(sin(theta), cos(theta));  // wrap to -pi..pi
}

void setup() {
  pinMode(L_A, INPUT_PULLUP); pinMode(L_B, INPUT_PULLUP);
  pinMode(R_A, INPUT_PULLUP); pinMode(R_B, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(L_A), leftISR, RISING);
  attachInterrupt(digitalPinToInterrupt(R_A), rightISR, RISING);
  Serial.begin(115200);
  Serial.println(F("t_ms,x_m,y_m,theta_deg"));
}

void loop() {
  unsigned long now = millis();
  if (now - lastUpdate >= 10) {         // 100 Hz pose update
    lastUpdate = now;
    updateOdometry();
  }
  if (now - lastPrint >= 100) {         // 10 Hz CSV log
    lastPrint = now;
    Serial.print(now); Serial.print(',');
    Serial.print(x, 4); Serial.print(',');
    Serial.print(y, 4); Serial.print(',');
    Serial.println(theta * 180.0 / PI, 2);
  }
}`, caption: "Arduino Uno. Compiled with arduino-cli for arduino:avr:uno." },
      { t: "note", kind: "tip", text: "If one wheel counts backwards when driving forward, its motor is mounted mirrored. Swap the ++ and -- in that ISR (the program already does this for the right wheel) rather than rewiring." },

      { t: "h", text: "Why odometry drifts" },
      { t: "p", text: "Odometry integrates: every small error in every step is added to the pose and never removed. Errors come in two kinds." },
      { t: "list", items: [
        "**Systematic errors** are the same every time: a wheel diameter slightly off, the two wheels not quite equal, track width measured wrongly, encoder ticks per revolution assumed wrongly. These you can calibrate away.",
        "**Random errors** vary: wheel slip on acceleration or on dust, bumps and floor joints, the caster dragging the robot sideways, the contact patch of a soft tyre moving. These cannot be calibrated and only sensing the outside world (a line, a wall, a camera, a beacon) can correct them.",
      ] },
      { t: "p", text: "Heading errors are the dangerous ones, because a wrong heading turns every later metre of travel into sideways position error. A distance error stays a distance error; a heading error grows into a position error proportional to the distance travelled after it." },
      { t: "h", text: "Worked drift example" },
      { t: "p", text: "Your robot's right wheel is really 1% larger than you think, so for each metre the program believes the right wheel travelled, it actually travelled 1.01 m. You command a 5 m straight line using encoder feedback, so the controller keeps the counted distances equal. In reality the right wheel goes 0.05 m further than the left. The heading error at the end is:" },
      { t: "formula", text: String.raw`Δθ = 0.05 / 0.150 = 0.333 rad ≈ 19°
the path is an arc of radius 5 / 0.333 = 15 m
sideways error = 15 × (1 - cos 0.333) ≈ 0.83 m`, caption: "A 1% wheel mismatch becomes almost a metre of error in 5 m." },
      { t: "p", text: "One per cent is less than the difference between two tyres from the same bag, or the change when one tyre picks up a bit of tape. This is why odometry is used for short-term motion and is always combined with some external reference over longer distances." },

      { t: "h", text: "Calibrating" },
      { t: "list", ordered: true, items: [
        "**Distance:** drive straight along a tape measure for 2 m. Compare the odometry distance with the measured distance and scale the wheel diameter by measured / reported.",
        "**Track width:** command ten full spins on the spot (Δθ = 20π) and see how far round the robot really goes. If it under-turns, the effective L is larger than you entered; scale L by (commanded turns / actual turns) as reported by the program versus reality.",
        "**Left-right mismatch:** drive a long straight line and see which way it curves. A consistent curve means the effective diameters differ. Adjust one wheel's metres-per-tick until the path is straight.",
      ] },

      { t: "deep", title: "The UMBmark square test", blocks: [
        { t: "p", text: "Borenstein and Feng's University of Michigan Benchmark (1996) separates the two dominant systematic errors: unequal wheel diameters and wrong track width. Drive a 4 m square clockwise five times and anticlockwise five times, returning to the start each time by odometry. Measure where the robot really ends. Unequal diameters make both directions curve the same way; a track-width error makes the 90° corners too large or too small, which shows up with opposite sign in the two directions. Plotting the two clusters of end points lets you solve for both corrections. It is worth doing once on any robot you will rely on." },
        { t: "p", text: "For a typical small robot, the end-point clusters after a 4 m square are often 10 to 50 cm apart before correction and a few centimetres after. The test is cheap, needs only tape and a measuring tape, and gives you numbers to put in your report instead of an impression that the robot \"drifts a bit\"." },
      ] },
      { t: "deep", title: "Why the midpoint update is better than Euler", blocks: [
        { t: "p", text: "If the wheels run at constant speeds during a step, the true path is an arc. The exact displacement along that arc is Δs × sinc(Δθ/2) in the direction θ + Δθ/2, where sinc(u) = sin(u)/u. For Δθ = 0.05 rad, sinc(0.025) = 0.99990, so the midpoint formula's length error is one part in ten thousand. Plain Euler (using θ instead of θ + Δθ/2) puts the displacement in the wrong direction by Δθ/2, a heading-direction error of 0.025 rad in this step, which adds up the same way on every step of a long curve. The exact arc formula is available if you want it, but at 100 Hz the midpoint form is indistinguishable from it." },
        { t: "p", text: "Encoder resolution also sets a floor. With 0.52 mm per tick and L = 0.15 m, one tick of difference is a heading step of 0.0035 rad (0.2°). That is quantisation, not drift: it does not accumulate, because the counts themselves are exact integers." },
      ] },
    ],
    mistakes: [
      "**Reading a multi-byte counter while interrupts are enabled.** On an 8-bit AVR a `long` can change mid-read and give a wild value. Copy it inside noInterrupts().",
      "**Forgetting the gearbox in ticks per revolution.** Encoder pulses per motor turn must be multiplied by the gear ratio to get ticks per wheel turn.",
      "**Using θ in degrees inside sin and cos.** Arduino's sin and cos take radians.",
      "**Trusting odometry after a collision or wheel spin.** Slip breaks the rolling assumption; the estimate is now wrong and nothing internal will notice.",
      "**Calibrating at a different speed or battery level from normal running.** Slip and tyre squash change with speed; calibrate under the conditions you use.",
    ],
    practice: {
      kind: "bench",
      task: "Log odometry for a closed square and measure the true error.",
      steps: [
        "Wire both encoders as in the program, power the encoders from 5 V, and upload. Push the robot by hand along a 1 m tape measure; check x reads close to 1.000 and adjust WHEEL_DIAMETER_M.",
        "Spin the robot by hand five turns on the spot and adjust TRACK_WIDTH_M until θ returns to the start each turn.",
        "Drive (or push) a 1 m square and return to the start mark. Copy the serial CSV into a file and plot y against x in a spreadsheet or Python.",
        "Measure the real end point with a ruler. Compare it with the logged end point and write down the error in centimetres and degrees.",
        "Repeat in the opposite direction and note whether the error changes sign, as the UMBmark idea predicts.",
      ],
    },
    quiz: [
      {
        q: "A 60 mm wheel gives 300 ticks per revolution. Roughly how far does the wheel travel per tick?",
        options: ["0.20 mm", "0.63 mm", "1.26 mm", "0.10 mm"],
        answer: 1,
        why: "π × 60 / 300 = 188.5 / 300 ≈ 0.63 mm per tick.",
      },
      {
        q: "In one update ΔsL = 0.010 m and ΔsR = 0.014 m, with L = 0.20 m. What is Δθ?",
        options: ["0.012 rad", "0.002 rad", "0.04 rad", "0.02 rad"],
        answer: 3,
        why: "Δθ = (0.014 - 0.010) / 0.20 = 0.02 rad.",
      },
      {
        q: "Why is a small heading error worse than a small distance error in odometry?",
        options: [
          "Heading is measured less often",
          "A heading error turns all later travel into sideways error, so position error grows with distance after it",
          "Distance errors cancel out over time",
          "The encoders cannot measure heading",
        ],
        answer: 1,
        why: "Every later metre is driven in a slightly wrong direction, so the sideways error grows with distance. A distance error does not grow in that way.",
      },
      {
        q: "Which of these can be removed by calibration?",
        options: ["Wheel slip on a dusty floor", "A bump in a floor joint", "One wheel being 0.5% larger than the other", "The caster dragging on carpet"],
        answer: 2,
        why: "A diameter mismatch is systematic: it is the same every run and can be measured and corrected. The others are random.",
      },
      {
        q: "Why does the update use cos(θ + Δθ/2) instead of cos(θ)?",
        options: [
          "To keep θ in the range -π to π",
          "Because the heading during the step is, on average, halfway between its start and end values",
          "Because sin and cos need radians",
          "To make the robot turn faster",
        ],
        answer: 1,
        why: "Over a step on a curve the heading changes from θ to θ + Δθ; using the midpoint heading removes a systematic error that would build up on every curve.",
      },
    ],
  },

  "i12-feedback-control-pid": {
    id: "i12-feedback-control-pid",
    outcomes: [
      "Explain why open-loop control fails on a real robot and what feedback adds",
      "Describe on-off, P, PI and PID control and the effect of each term on the response",
      "Tune a PID loop by experiment, including a Ziegler-Nichols style starting point",
      "Recognise and prevent integral windup and derivative kick",
    ],
    blocks: [
      { t: "h", text: "Why feedback" },
      { t: "p", text: "Set both motors to 60% duty and your robot will not drive straight. One motor is a little stronger, the battery voltage falls over the run, the floor changes. Commanding outputs and hoping is **open-loop** control, and it works only when the world is perfectly predictable. **Closed-loop** control measures the thing you care about, compares it with what you want, and corrects. Almost every behaviour in this module, from holding a wheel speed to staying on a line, is a feedback loop." },
      { t: "diagram", text: String.raw`
 setpoint r ──►(+)──► e ──►[ controller ]── u ──►[ motors + robot ]──┬──► output y
               (-)                                                  │
                ▲                                                   │
                └────────────────[ sensor ]◄────────────────────────┘
   e = r - y   (error)        u = control effort (e.g. PWM)`, caption: "The feedback loop." },
      { t: "p", text: "Vocabulary: the **setpoint** r is what you want (line in the centre, wheel at 10 rad/s). The **process variable** y is what the sensor measures. The **error** e = r - y. The controller turns error into **control effort** u, for example a PWM duty or a difference between wheel speeds." },

      { t: "h", text: "On-off control" },
      { t: "p", text: "The simplest controller: if the line is to the left, turn left hard; if right, turn right hard. A thermostat works this way. It is robust and needs no tuning, but the output is always at one extreme, so the robot zig-zags along the line. Faster driving makes the zig-zag larger, because the robot travels further before each switch. Adding **hysteresis** (a dead band where nothing changes) reduces chatter but not the wobble. On-off is fine for slow robots and as a fallback; for smooth, fast motion you need an output proportional to the error." },

      { t: "h", text: "Proportional control (P)" },
      { t: "formula", text: String.raw`u = Kp × e`, caption: "Effort proportional to error." },
      { t: "p", text: "A small error gives a small correction, a large error a large one. Increasing the gain Kp makes the response faster but, past a point, the robot overshoots, swings back and oscillates, because there is always some delay (sensor update, motor inertia, the time the robot takes to rotate) between applying a correction and seeing its effect. A P controller on its own usually leaves a **steady-state error** when something pushes constantly against it: if one motor is weaker, a non-zero error is needed to produce the correction that balances it, so the robot settles slightly off the line." },

      { t: "h", text: "Adding integral (PI)" },
      { t: "formula", text: String.raw`u = Kp × e + Ki × ∫ e dt`, caption: "The integral grows as long as any error remains." },
      { t: "p", text: "The integral term adds up error over time. While the robot sits slightly off the line, the integral keeps growing and the correction keeps increasing until the error is truly zero. This removes steady-state error. The cost: the integral responds slowly and it remembers the past, so too much Ki causes slow, large overshoots. In code the integral is a running sum: `integral += e * dt` each loop." },

      { t: "h", text: "Adding derivative (PID)" },
      { t: "formula", text: String.raw`u = Kp × e + Ki × ∫ e dt + Kd × de/dt
in code, every dt seconds:
  integral   += e × dt
  derivative  = (e - e_previous) / dt
  u = Kp×e + Ki×integral + Kd×derivative`, caption: "The PID law and its discrete form." },
      { t: "p", text: "The derivative term reacts to how fast the error is changing. If the robot is swinging back towards the line quickly, de/dt is large and of opposite sign to e, so the D term brakes the swing before it overshoots. It acts like damping, like a shock absorber. D lets you use a higher Kp without oscillation, which is why fast line followers rely heavily on it. Its weakness is noise: a jumpy sensor gives a jumpy derivative, so derivative is often filtered or computed from a slightly smoothed signal." },
      { t: "table", head: ["Increase", "Speed of response", "Overshoot", "Steady-state error", "Main risk"], rows: [
        ["Kp", "Faster", "More", "Smaller, rarely zero", "Oscillation"],
        ["Ki", "Slightly faster", "More", "Removed", "Slow overshoot, windup"],
        ["Kd", "Little change", "Less", "No effect", "Amplifies sensor noise"],
      ], caption: "Rules of thumb. They interact, so treat them as directions, not laws." },

      { t: "h", text: "Tuning by experiment" },
      { t: "p", text: "Robots are rarely modelled well enough to calculate gains, so you tune on the real machine. A reliable manual procedure:" },
      { t: "list", ordered: true, items: [
        "Set Ki = 0 and Kd = 0. Start with a small Kp that makes the robot respond sluggishly.",
        "Double Kp until the robot oscillates about the setpoint. Back off to about half that value.",
        "Increase Kd until the oscillation and overshoot die out quickly. If the motors start to buzz or jitter, Kd is amplifying noise: reduce it.",
        "Only if a steady offset remains, add a small Ki and increase it until the offset is removed in a reasonable time without new overshoot.",
        "Change one gain at a time, write down each value and what you saw, and test at the speed you intend to run.",
      ] },
      { t: "h", text: "A Ziegler-Nichols starting point" },
      { t: "p", text: "Ziegler and Nichols (1942) gave a rule based on one experiment. With P only, raise Kp until the system oscillates steadily with constant amplitude, neither growing nor dying. That gain is the **ultimate gain** Ku, and the time for one full oscillation is the **ultimate period** Tu (measure it from your serial log or a video). Then:" },
      { t: "formula", text: String.raw`P   :  Kp = 0.5 Ku
PI  :  Kp = 0.45 Ku,  Ki = 0.54 Ku / Tu
PID :  Kp = 0.6 Ku,   Ki = 1.2 Ku / Tu,   Kd = 0.075 Ku × Tu`, caption: "Classic Ziegler-Nichols ultimate-gain rules (parallel form gains)." },
      { t: "p", text: "Example: a wheel-speed loop oscillates steadily at Ku = 0.2 with Tu = 0.4 s. Then Kp = 0.6 × 0.2 = 0.12, Ki = 1.2 × 0.2 / 0.4 = 0.6, Kd = 0.075 × 0.2 × 0.4 = 0.006. Check the units: Ki has units of Kp per second and Kd of Kp times seconds, which matches Ku / Tu and Ku × Tu. These values give a fast but quite oscillatory response (a decay of about one quarter per cycle); treat them as a starting point and usually reduce Kp and Ki a little." },

      { t: "h", text: "Integral windup" },
      { t: "p", text: "Suppose the robot is lifted off the floor, or its wheels are stuck against an obstacle. The error stays large, the integral keeps growing, and the output is already at its limit (255 PWM) so the extra effort does nothing. When the robot is put down, the integral holds an enormous value and the robot overshoots violently until the integral unwinds. This is **windup**. Three common remedies, often used together:" },
      { t: "list", items: [
        "**Clamp** the integral sum to a fixed range (the line follower in the next lesson does this).",
        "**Conditional integration**: stop adding to the integral while the output is saturated.",
        "**Reset** the integral when the situation changes completely, such as when the line is lost.",
      ] },
      { t: "note", kind: "warn", text: "Run the control loop at a fixed rate. If dt varies because of Serial prints or delays, the integral and derivative terms change meaning from loop to loop. Use a millis() timer as the programs in this module do, and never call delay() inside a control loop." },

      { t: "deep", title: "Derivative kick and derivative on measurement", blocks: [
        { t: "p", text: "If the setpoint changes in a step (you command a new wheel speed), the error jumps instantly and de/dt is momentarily huge, giving a spike in output called derivative kick. Because e = r - y, and r is constant between setpoint changes, de/dt = -dy/dt. Computing the derivative as -Kd × dy/dt instead gives the same damping without the kick. For line following the setpoint is always zero, so the two are identical there; for speed and position control prefer derivative on measurement." },
        { t: "p", text: "To tame noise, low-pass filter the derivative: d_filtered ← d_filtered + α (d_raw - d_filtered) with α between 0.1 and 0.5. Module a8 treats this properly as a pole in the derivative's transfer function." },
      ] },
      { t: "deep", title: "Where Ziegler-Nichols comes from, and its limits", blocks: [
        { t: "p", text: "At the ultimate gain the loop is on the edge of stability: the total phase lag around the loop at the frequency 1/Tu is 180°, and the loop gain there is exactly 1. The rules place the PID's own phase lead and gain so that the closed loop has a gain margin of about 2 and a quarter-amplitude decay. That target was chosen for process plants in the 1940s, where rapid disturbance rejection mattered more than overshoot. For robots, a less aggressive set such as Tyreus-Luyben (Kp = 0.45 Ku, Ki = Kp / (2.2 Tu), Kd = Kp × Tu / 6.3) often feels better. Driving a real robot to sustained oscillation is also not always safe; reduce speed while you find Ku." },
        { t: "p", text: "A second Ziegler-Nichols method uses the open-loop step response instead: apply a step in effort, measure the apparent dead time and the slope of the response, and read gains from a table. It avoids driving the loop to oscillation, but it needs a clean step response, which a line follower does not have. For speed loops on a motor it works well." },
      ] },
    ],
    mistakes: [
      "**Tuning at low speed and running fast.** The robot's delays and dynamics change with speed; tune at the speed you will use.",
      "**Changing several gains at once.** You cannot tell which change caused the improvement or the problem.",
      "**Using delay() in the control loop.** dt becomes inconsistent and the I and D terms are scaled wrongly.",
      "**No limit on the integral.** Windup after a stall or a lift causes a violent overshoot on restart.",
      "**Too much Kd on a noisy sensor.** The motors buzz and heat up; filter the signal or reduce Kd.",
      "**Sign error in the correction.** A positive error that makes the robot turn further away gives immediate, growing divergence. Flip the sign, not the gains.",
    ],
    practice: {
      kind: "bench",
      task: "Tune a wheel-speed PID on one motor with an encoder and log the step response.",
      steps: [
        "Using the encoder wiring from the odometry lesson, compute wheel speed in rad/s every 20 ms from the tick difference.",
        "Write a PID that sets PWM to hold a speed setpoint, with the integral clamped. Print time, setpoint and measured speed as CSV.",
        "With Ki = Kd = 0, find Ku and Tu by raising Kp until steady oscillation. Record both.",
        "Apply the Ziegler-Nichols PID rules, step the setpoint from 5 to 10 rad/s, and plot the response. Note overshoot and settling time.",
        "Hold the wheel by hand for two seconds and release it, first without and then with the integral clamp. Describe the difference.",
      ],
    },
    quiz: [
      {
        q: "A P-only controller leaves the robot settled slightly to one side of the line. Which term removes this offset?",
        options: ["Derivative", "Integral", "A larger dead band", "A lower Kp"],
        answer: 1,
        why: "The integral keeps growing while any error remains, so it increases the correction until the steady error is zero.",
      },
      {
        q: "Raising Kp made the robot oscillate. Which change damps the oscillation while keeping a fast response?",
        options: ["Increase Kd", "Increase Ki", "Remove the sensor", "Switch to on-off control"],
        answer: 0,
        why: "The derivative term opposes rapid changes in error, acting as damping.",
      },
      {
        q: "A loop oscillates steadily at Ku = 2.0 with period Tu = 0.5 s. What are the classic Ziegler-Nichols PID gains?",
        options: [
          "Kp = 1.2, Ki = 4.8, Kd = 0.075",
          "Kp = 1.0, Ki = 2.0, Kd = 0.5",
          "Kp = 1.2, Ki = 0.6, Kd = 0.3",
          "Kp = 0.9, Ki = 2.16, Kd = 0",
        ],
        answer: 0,
        why: "Kp = 0.6 × 2 = 1.2; Ki = 1.2 × 2 / 0.5 = 4.8; Kd = 0.075 × 2 × 0.5 = 0.075.",
      },
      {
        q: "A robot was held still for five seconds with its motors fighting, then released. It lurched far past its target. What happened?",
        options: ["Derivative kick", "Integral windup", "Encoder overflow", "Steady-state error"],
        answer: 1,
        why: "The integral accumulated a large value while the output was saturated and the error could not fall. Clamping or conditional integration prevents it.",
      },
      {
        q: "Why should a PID loop run at a fixed rate?",
        options: [
          "Because the motors need a fixed PWM frequency",
          "Because the integral and derivative depend on dt, so a varying dt changes their effect from loop to loop",
          "Because Serial.print needs it",
          "It does not matter",
        ],
        answer: 1,
        why: "integral += e × dt and derivative = Δe / dt. If dt jumps, these terms are mis-scaled, unless dt is measured exactly every loop.",
      },
    ],
  },

  "i12-sensing-and-behaviours": {
    id: "i12-sensing-and-behaviours",
    outcomes: [
      "Compute a line position from a reflectance sensor array with a weighted average",
      "Build and tune a PID line follower on an Arduino Uno",
      "Measure distance with an HC-SR04 and an IR ranger and know each one's failure modes",
      "Structure robot behaviour as a state machine and combine behaviours by priority",
    ],
    blocks: [
      { t: "h", text: "From sensing to deciding" },
      { t: "p", text: "The previous lessons gave you a body that moves predictably and a controller that corrects errors. A useful robot needs an error to correct, which comes from sensing the world, and a way to choose between goals when several compete. This lesson covers the two classic sensing tasks for a first robot (following a line, avoiding obstacles) and the structure that holds behaviours together without turning the code into a tangle of nested ifs. It ends with the full PID line follower for your exit project." },

      { t: "h", text: "Reflectance sensors" },
      { t: "p", text: "A **TCRT5000** or the sensors on a **QTR-8A** board each contain an infrared LED and a phototransistor side by side. Light from the LED bounces off the floor into the phototransistor. White surfaces reflect a lot of IR, black tape very little, so the phototransistor current, and the voltage across its load resistor, changes with the surface underneath. In the common modules the output voltage is high over black and low over white (check yours: some are inverted). Mount the array 3 to 8 mm above the floor; the reading depends strongly on height, and ambient sunlight contains plenty of IR." },
      { t: "p", text: "Raw readings differ from sensor to sensor, so **calibrate**: sweep the array across the line and record each sensor's minimum and maximum. Then map each reading to 0 (floor) to 1000 (line):" },
      { t: "formula", text: String.raw`vᵢ = 1000 × (rawᵢ - minᵢ) / (maxᵢ - minᵢ),  clipped to 0 … 1000`, caption: "Per-sensor normalisation." },

      { t: "h", text: "Line position by weighted average" },
      { t: "p", text: "Give each sensor a position across the array, for five sensors -2000, -1000, 0, 1000, 2000. The line position is the average of the positions weighted by how strongly each sensor sees the line:" },
      { t: "formula", text: String.raw`position = Σ (vᵢ × xᵢ) / Σ vᵢ
error    = position - 0       (setpoint is the centre)`, caption: "A centroid of the readings." },
      { t: "p", text: "Example: normalised readings [0, 200, 900, 400, 0]. Numerator = 200 × (-1000) + 900 × 0 + 400 × 1000 = 200000. Denominator = 0 + 200 + 900 + 400 + 0 = 1500. Position = 200000 / 1500 = 133. The line is slightly right of centre, which matches the readings: the right-hand neighbour sees more black than the left-hand one. Check: if the readings were symmetric, say [0, 400, 900, 400, 0], the numerator would be zero and so would the position." },
      { t: "p", text: "The weighted average gives a smooth, continuous error even though there are only five sensors, because a line between two sensors is partly seen by both. That smoothness is what lets a PID work well. If the sum Σ vᵢ is tiny, no sensor sees the line: the robot has run off it, and the controller should switch to a recovery behaviour rather than divide by almost zero." },

      { t: "h", text: "The PID line follower" },
      { t: "p", text: "Wiring for the program (Arduino Uno): five analog sensor outputs to A0 to A4, sensor VCC to 5 V. A TB6612FNG driver: PWMA to D5, AIN1 to D7, AIN2 to D8 for the left motor; PWMB to D6, BIN1 to D9, BIN2 to D10 for the right; STBY to D4; VM from the motor battery (up to 13.5 V for the TB6612FNG); VCC from the Uno's 5 V; all grounds common. D5 and D6 are used for PWM because they share Timer0 and give the same frequency." },
      { t: "p", text: "The correction u is applied as inverse kinematics: left = base + u, right = base - u. A positive error (line to the right) speeds up the left wheel and turns the robot right, towards the line. The derivative is scaled by 0.01 in the code so that Kp and Kd have similar magnitudes; that scale is just a convenience." },
      { t: "snippet", lang: "cpp", code: String.raw`// PID line follower: Arduino Uno, 5-sensor analog IR array (TCRT5000 style)
// on A0..A4, TB6612FNG motor driver. Black line on a white floor.
const uint8_t SENSOR_PINS[5] = {A0, A1, A2, A3, A4};
const int POSITIONS[5] = {-2000, -1000, 0, 1000, 2000};  // sensor x positions

// TB6612FNG: left motor = A channel, right motor = B channel
const uint8_t PWMA = 5, AIN1 = 7, AIN2 = 8;
const uint8_t PWMB = 6, BIN1 = 9, BIN2 = 10;
const uint8_t STBY = 4;

float Kp = 0.08, Ki = 0.0, Kd = 0.6;   // tune on the floor, see lesson
const int BASE_SPEED = 140;            // 0..255
const float I_LIMIT = 20000.0;          // anti-windup clamp on the integral sum
const unsigned long DT_MS = 5;          // 200 Hz control loop

int minV[5], maxV[5];
float integral = 0, lastError = 0;
unsigned long lastTick = 0;

void setMotor(uint8_t pwm, uint8_t in1, uint8_t in2, int speed) {
  speed = constrain(speed, -255, 255);
  digitalWrite(in1, speed >= 0 ? HIGH : LOW);
  digitalWrite(in2, speed >= 0 ? LOW : HIGH);
  analogWrite(pwm, abs(speed));
}

void calibrate() {
  for (int i = 0; i < 5; i++) { minV[i] = 1023; maxV[i] = 0; }
  // Spin slowly for about 3 s so every sensor sees line and floor.
  setMotor(PWMA, AIN1, AIN2, 90);
  setMotor(PWMB, BIN1, BIN2, -90);
  unsigned long t0 = millis();
  while (millis() - t0 < 3000) {
    for (int i = 0; i < 5; i++) {
      int v = analogRead(SENSOR_PINS[i]);
      if (v < minV[i]) minV[i] = v;
      if (v > maxV[i]) maxV[i] = v;
    }
  }
  setMotor(PWMA, AIN1, AIN2, 0);
  setMotor(PWMB, BIN1, BIN2, 0);
}

// Returns true and sets error when the line is seen. Error in the range -2000..2000.
bool readLine(float &error) {
  long weighted = 0, total = 0;
  for (int i = 0; i < 5; i++) {
    int span = maxV[i] - minV[i];
    if (span < 50) span = 50;                  // guard against a dead sensor
    long v = (long)(analogRead(SENSOR_PINS[i]) - minV[i]) * 1000 / span;
    v = constrain(v, 0, 1000);                // 0 = white floor, 1000 = black line
    if (v < 100) v = 0;                       // ignore noise
    weighted += v * POSITIONS[i];
    total += v;
  }
  if (total < 300) return false;              // line lost
  error = (float)weighted / total;
  return true;
}

void setup() {
  pinMode(PWMA, OUTPUT); pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT);
  pinMode(PWMB, OUTPUT); pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);
  pinMode(STBY, OUTPUT); digitalWrite(STBY, HIGH);
  Serial.begin(115200);
  delay(1000);
  calibrate();
  lastTick = millis();
}

void loop() {
  unsigned long now = millis();
  if (now - lastTick < DT_MS) return;
  float dt = (now - lastTick) / 1000.0;
  lastTick = now;

  float error;
  if (!readLine(error)) {
    // Lost the line: spin towards the side it was last seen on.
    int s = lastError > 0 ? 120 : -120;
    setMotor(PWMA, AIN1, AIN2, s);
    setMotor(PWMB, BIN1, BIN2, -s);
    integral = 0;
    return;
  }

  integral += error * dt;
  integral = constrain(integral, -I_LIMIT, I_LIMIT);
  float derivative = (error - lastError) / dt;
  lastError = error;

  // error > 0 means the line is to the right, so speed up the left wheel.
  float u = Kp * error + Ki * integral + Kd * derivative * 0.01;
  setMotor(PWMA, AIN1, AIN2, BASE_SPEED + (int)u);
  setMotor(PWMB, BIN1, BIN2, BASE_SPEED - (int)u);
}`, caption: "Arduino Uno. Compiled with arduino-cli for arduino:avr:uno." },
      { t: "p", text: "Tune it with the procedure from the previous lesson: Ki and Kd to zero, raise Kp until the robot weaves, halve it, then raise Kd until the weave stops. Most line followers end up with Ki zero or very small, because the setpoint is fixed and the D term matters far more than the I term. If the robot weaves more as speed increases, that is expected: raise Kd or lower BASE_SPEED." },
      { t: "note", kind: "safety", text: "Test with the wheels off the ground first, holding the robot, to confirm each wheel turns the right way. A robot with a sign error drives straight off the table." },

      { t: "h", text: "Ranging: ultrasonic and infrared" },
      { t: "p", text: "The **HC-SR04** sends a 40 kHz ultrasonic burst when its TRIG pin gets a 10 µs pulse, and holds ECHO high for as long as the sound takes to go out and back. Sound travels at about 343 m/s in air at 20 °C, so:" },
      { t: "formula", text: String.raw`distance = t_echo × 343 / 2
t_echo = 1166 µs  →  0.001166 × 343 / 2 = 0.200 m`, caption: "Divide by two because the sound makes a round trip." },
      { t: "p", text: "On the Uno, `pulseIn(ECHO, HIGH, 25000)` measures the echo with a 25 ms timeout (about 4.3 m range). The HC-SR04 runs from 5 V and its ECHO output is 5 V: on an ESP32 DevKit you must use a divider (for example 1 kΩ and 2 kΩ) on ECHO, or a 3.3 V version such as the HC-SR04P. Its beam is roughly a 30° cone (the module's datasheet quotes a 15° measuring angle; real modules vary), it misses soft or steeply angled surfaces (the sound reflects away), and two sensors fired together hear each other. Fire them in turn, at least 60 ms apart." },
      { t: "p", text: "**IR rangers** such as the Sharp GP2Y0A21 (10 to 80 cm) use triangulation: an IR spot hits the target and a position-sensitive detector measures the angle of the reflected light. The analog output is non-linear (roughly inverse to distance) and, below about 10 cm, it falls again, so a very close object reads as far away. They have a narrow beam, which is good for wall following, and they see surfaces that the ultrasonic sensor misses, but they struggle with black or glossy targets and strong sunlight. Simple IR obstacle modules (LED, photodiode, comparator) give only a yes/no output at a threshold set by a trimmer." },
      { t: "table", head: ["Property", "HC-SR04 ultrasonic", "Sharp IR ranger"], rows: [
        ["Range", "About 2 cm to 4 m", "10 to 80 cm (GP2Y0A21)"],
        ["Beam", "Wide, about 30°", "Narrow"],
        ["Fails on", "Soft cloth, steep angles, other sonars", "Black or shiny targets, sunlight, below 10 cm"],
        ["Output", "Pulse width", "Non-linear analog voltage"],
      ] },

      { t: "h", text: "Behaviours and state machines" },
      { t: "p", text: "A robot with a line sensor and an ultrasonic sensor must decide what to do when there is an obstacle on the line. Writing that as one huge if-else soon becomes unreadable. Two ideas help." },
      { t: "p", text: "A **finite state machine** says the robot is always in exactly one state, each state has its own behaviour, and named events cause transitions. Code it with an `enum` for the states and a `switch` in loop(), where each case does its work and checks its exit conditions. Never block inside a state; check the time with millis()." },
      { t: "diagram", text: String.raw`
   ┌──────────┐ obstacle < 15 cm ┌──────────┐ turned 90°  ┌──────────┐
   │  FOLLOW  │─────────────────►│  AVOID   │────────────►│  SEARCH  │
   │  (PID)   │                  │ (turn)   │             │ (arc)    │
   └──────────┘                  └──────────┘             └────┬─────┘
        ▲                                                      │
        └──────────────────── line found ──────────────────────┘
        line lost > 0.5 s → SEARCH`, caption: "A state machine for a line follower that walks around obstacles." },
      { t: "p", text: "**Behaviour-based control** grew out of Rodney Brooks's **subsumption architecture** (MIT, 1986). Instead of one planner that models the world, the robot runs several simple behaviours in parallel, each mapping sensors directly to actions: \"follow the line\", \"avoid obstacles\", \"stop if the bumper is pressed\". They are arranged in layers by priority, and a higher layer can override (subsume) the output of a lower one when it has something to say. The emergency stop always wins; obstacle avoidance overrides line following only when an obstacle is near. Each behaviour can be built and tested on its own, and the robot degrades gracefully when one fails." },
      { t: "snippet", lang: "cpp", code: String.raw`// Priority arbitration: the first behaviour that wants control wins.
struct Command { bool active; int left; int right; };

Command bumperStop()   { return { digitalRead(2) == LOW, 0, 0 }; }
Command avoidObstacle(float cm) { return { cm > 0 && cm < 15, -120, 120 }; }
Command followLine(int u, int base) { return { true, base + u, base - u }; }

Command arbitrate(float cm, int u, int base) {
  Command c = bumperStop();          if (c.active) return c;
  c = avoidObstacle(cm);             if (c.active) return c;
  return followLine(u, base);        // lowest layer, always active
}`, caption: "Subsumption in miniature: higher layers checked first." },

      { t: "h", text: "Exit project" },
      { t: "p", text: "Build a line or wall following robot with PID control and logged odometry. Combine the two programs: the PID line follower for motion and the odometry routine for pose, with the encoder pins rearranged so they do not clash with the motor driver: on the Uno keep the encoder A channels on D2 and D3 and move the two B channels from D4 and D5 to the free pins D11 and D12. The B channels need no interrupt of their own (the ISR on A only reads B's level with digitalRead), so any digital pin works. That leaves D13 and A5 (usable as a digital pin) for an HC-SR04 if you add one; the bumper in the arbitration snippet used D2, which is now encoder A, so move it too. pulseIn() blocks for up to its timeout, so trigger the sonar only every 60 ms or more and use a short timeout (for example 6000 µs, about 1 m) so the 5 ms PID loop is not stalled. Log the pose over a lap, plot it on a PC, and compare the plotted shape with the real track. For wall following, the error is the measured side distance minus the wanted distance, and the same PID applies." },

      { t: "deep", title: "Why the sensor array's position matters for control", blocks: [
        { t: "p", text: "The array measures where the line is at the array, not at the wheels. If the array is a distance a ahead of the axle and the robot turns at ω, the array swings sideways at roughly a × ω before the robot's path has changed much. A longer a gives earlier warning of bends (good) but makes the measured error respond strongly to rotation, which acts as built-in derivative and can make the loop twitchy. A short a makes the robot react late. Fast competition line followers place the array 10 to 15 cm ahead and use a light chassis so that rotation is quick and the delay is small." },
        { t: "p", text: "Sample rate matters too. At 1 m/s, a 5 ms loop sees the line every 5 mm of travel. A 30-character line at 115200 baud takes about 2.6 ms to transmit. Serial.print only copies into a 64-byte buffer and returns, but once logging outpaces the line the buffer fills and every print blocks, so heavy logging inside the loop can halve the effective control rate. Log every tenth loop, or log to a buffer and print it after the run." },
      ] },
      { t: "deep", title: "Speed of sound and temperature compensation", blocks: [
        { t: "p", text: "The speed of sound in dry air is about c = 331.3 × √(1 + T/273.15) m/s, with T in °C. At 20 °C this gives 343.2 m/s, and at 35 °C (a hot day in Bhopal) 351.9 m/s, 2.5% faster. Using 343 m/s on that day makes every distance read 2.5% short: 1 m reads as about 0.975 m. For obstacle avoidance this does not matter; for mapping or measuring it does, and a temperature sensor fixes it." },
        { t: "p", text: "Humidity has a smaller effect (fractions of a per cent) and can be ignored here. The sensor's own timing also matters: the HC-SR04 waits a few hundred microseconds after the burst before it starts listening, which is part of why it cannot measure below about 2 cm." },
      ] },
    ],
    mistakes: [
      "**Not calibrating the array.** Without per-sensor min and max, a slightly more sensitive sensor pulls the weighted average towards itself.",
      "**Dividing by the reading sum when no sensor sees the line.** Detect the lost-line case and handle it explicitly.",
      "**Connecting the HC-SR04 ECHO pin straight to an ESP32 GPIO.** It outputs 5 V; use a divider or a 3.3 V sensor.",
      "**Firing two ultrasonic sensors at once.** Each hears the other's echo. Trigger them in turn.",
      "**Blocking delays inside states.** A delay(500) during a turn leaves the robot blind to the bumper and line.",
      "**Trusting a Sharp IR reading at very short range.** Below its minimum range the output falls and a close obstacle looks far away.",
    ],
    practice: {
      kind: "bench",
      task: "Build, tune and document the PID line follower, then add obstacle handling.",
      steps: [
        "Make a test track with 18 to 20 mm black electrical tape on white chart paper, with at least one 15 cm radius bend.",
        "Wire and upload the line follower. With the wheels lifted, move the line under the array by hand and confirm the wheels respond in the right direction.",
        "Tune Kp then Kd at BASE_SPEED 100, then raise BASE_SPEED in steps of 20 and retune Kd. Record lap times and gains in a table.",
        "Add an HC-SR04 on two free pins and the arbitration function from the lesson. Place a box on the track and confirm the robot stops or turns before touching it.",
        "Add the odometry routine, log a lap and plot it. Write two sentences on how the plotted lap differs from the real one and why.",
      ],
    },
    quiz: [
      {
        q: "Five sensors at positions -2000 to 2000 give normalised readings [0, 0, 500, 500, 0]. What is the line position?",
        options: ["0", "500", "1000", "250"],
        answer: 1,
        why: "Σ v x = 500 × 0 + 500 × 1000 = 500000; Σ v = 1000; position = 500. The line is halfway between the centre and right-centre sensors.",
      },
      {
        q: "An HC-SR04 echo pulse lasts 2915 µs. About how far is the object?",
        options: ["1.0 m", "0.25 m", "2.0 m", "0.5 m"],
        answer: 3,
        why: "0.002915 × 343 / 2 ≈ 0.50 m. The division by two accounts for the round trip.",
      },
      {
        q: "Why does a weighted average give a better error signal than picking the sensor with the highest reading?",
        options: [
          "It uses less memory",
          "It varies smoothly as the line moves between sensors, rather than jumping in steps",
          "It removes the need for calibration",
          "It works without a line",
        ],
        answer: 1,
        why: "A line between two sensors is partly seen by both, so the centroid changes continuously. A smooth error suits proportional and derivative control.",
      },
      {
        q: "In a subsumption design, an obstacle appears while the robot follows a line. What happens?",
        options: [
          "Both behaviours average their motor commands",
          "The higher-priority avoid behaviour overrides the line-follow output while the obstacle is near",
          "The robot stops forever",
          "The line follower ignores the obstacle",
        ],
        answer: 1,
        why: "Higher layers subsume lower ones only when they are active; when the obstacle is gone, line following takes over again.",
      },
      {
        q: "A Sharp IR ranger reads an object 5 cm away as about 25 cm. Why?",
        options: [
          "The object is black",
          "Below its minimum range the output voltage falls again, so close objects look further away",
          "The sensor needs a 10 µs trigger",
          "The speed of sound changed",
        ],
        answer: 1,
        why: "The output peaks near the minimum range (about 10 cm for the GP2Y0A21) and falls below it, so readings are ambiguous at very short range.",
      },
    ],
  },
};

export default lessons;
