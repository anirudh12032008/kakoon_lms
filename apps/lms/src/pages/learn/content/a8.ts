import type { ModuleContent } from "../model/curriculum";

/**
 * Module a8: Control systems.
 * Builds on i12 (PID tuned by experiment) with models, analysis and design.
 * Numbers in worked examples were checked in Python (python-control 0.10).
 */
const lessons: ModuleContent = {
  "a8-modelling-a-dc-motor": {
    id: "a8-modelling-a-dc-motor",
    outcomes: [
      "Write the electrical and mechanical equations of a permanent-magnet DC motor",
      "Use the Laplace transform to turn those equations into the transfer function ω(s)/V(s)",
      "Justify the first-order approximation when the armature inductance is small",
      "Identify the gain and time constant of a real motor from a measured step response",
    ],
    blocks: [
      { t: "h", text: "Why a model beats a guess" },
      { t: "p", text: "In module i12 you tuned a PID controller by experiment: raise Kp until it oscillates, back off, add Ki, add a little Kd. That works, but it tells you nothing in advance. You cannot predict the overshoot, you cannot say whether a faster response is even possible with the supply you have, and when the robot gets heavier you start again. Control engineering replaces trial and error with a **model**: a small set of equations that predict how the system responds to any input. With a model you design the controller on paper, predict the response, then check the prediction on the bench. When prediction and measurement agree, you understand your system. When they disagree, the gap tells you what the model missed." },
      { t: "p", text: "The running example in this module is the small brushed DC gear motor that drives most student robots. Everything you learn transfers: a heater, a drone axis, a water tank and a servo all reduce to the same few kinds of equation." },

      { t: "h", text: "The electrical equation" },
      { t: "p", text: "Electrically, the armature winding is a resistance R in series with an inductance L. When the rotor spins at angular speed ω, the conductors cutting the magnet's field generate a voltage that opposes the supply: the **back EMF**, proportional to speed with constant Ke. Applying Kirchhoff's voltage law around the loop:" },
      { t: "formula", text: String.raw`V(t) = R·i(t) + L·di/dt + Ke·ω(t)`, caption: "Supply voltage = resistive drop + inductive drop + back EMF." },
      { t: "h", text: "The mechanical equation" },
      { t: "p", text: "Mechanically, the current in the field produces a torque proportional to current, with constant Kt. That torque accelerates the rotor inertia J and works against viscous friction b (torque proportional to speed) and any load torque τL. Newton's second law for rotation gives:" },
      { t: "formula", text: String.raw`J·dω/dt = Kt·i(t) - b·ω(t) - τL(t)`, caption: "Inertia × angular acceleration = motor torque - friction - load." },
      { t: "p", text: "In SI units Kt (N·m/A) and Ke (V·s/rad) are numerically equal, because the same physical coupling converts electrical power Ke·ω·i into mechanical power Kt·i·ω. From here on both are written K. These two equations are coupled: current makes torque, speed makes back EMF. That loop of cause and effect is built into the motor itself, which is why a motor running on a fixed voltage settles at a steady speed instead of accelerating forever." },
      { t: "diagram", text: String.raw`
 V ──►(+)──► 1/(Ls+R) ──i──► K ──τ──►(+)──► 1/(Js+b) ──┬──► ω
       ▲-                              ▲-                │
       │                               └── τL            │
       └───────────────── K ◄────────────────────────────┘
                       (back EMF)`, caption: "The motor as a block diagram. The back EMF is an internal negative feedback loop." },

      { t: "h", text: "Laplace transform essentials" },
      { t: "p", text: "Differential equations are awkward to combine. The **Laplace transform** turns them into algebra. It maps a function of time f(t), defined for t ≥ 0, to a function F(s) of a complex variable s. You will use only a handful of its properties, listed below, and a short table of pairs. With zero initial conditions, differentiation in time becomes multiplication by s, so a differential equation becomes a polynomial equation that you can rearrange freely." },
      { t: "formula", text: String.raw`F(s) = ∫₀^∞ f(t)·e^(-st) dt

d f/dt        →  s·F(s) - f(0)
∫₀ᵗ f dτ      →  F(s) / s
f(t - T)      →  e^(-sT)·F(s)          (pure delay)
final value:  lim(t→∞) f(t) = lim(s→0) s·F(s)   (if the limit exists)`, caption: "The definition and the properties you need." },
      { t: "table", head: ["f(t), t ≥ 0", "F(s)", "Where you meet it"], rows: [
        ["unit impulse δ(t)", "1", "a sharp kick"],
        ["unit step 1", "1/s", "switching a voltage on"],
        ["ramp t", "1/s²", "a setpoint that moves at constant rate"],
        ["e^(-at)", "1/(s + a)", "first-order decay"],
        ["1 - e^(-t/τ)", "1/(s(τs + 1))", "first-order step response"],
        ["e^(-at)·sin(ωt)", "ω/((s + a)² + ω²)", "damped oscillation"],
      ], caption: "Laplace pairs used in this module." },
      { t: "p", text: "A **transfer function** is the ratio of output transform to input transform with all initial conditions zero. It is a property of the system alone, not of the input. Multiply it by the transform of an input and you have the transform of the output." },

      { t: "h", text: "The motor transfer function" },
      { t: "p", text: "Transform both equations with τL = 0 and zero initial conditions:" },
      { t: "formula", text: String.raw`V(s) = (Ls + R)·I(s) + K·Ω(s)
(Js + b)·Ω(s) = K·I(s)          →  I(s) = (Js + b)·Ω(s) / K

V(s) = [ (Ls + R)(Js + b)/K + K ]·Ω(s)

Ω(s)/V(s) = K / [ (Ls + R)(Js + b) + K² ]`, caption: "Eliminate the current and divide. This is exact for the linear model." },
      { t: "p", text: "The denominator is second order in s, so the motor has two **poles** (values of s that make the denominator zero). Put in numbers for a typical small 6 V gear motor, referred to the motor shaft: R = 2 Ω, L = 0.5 mH, K = 0.02 N·m/A, J = 2 × 10⁻⁵ kg·m², b = 1 × 10⁻⁵ N·m·s." },
      { t: "formula", text: String.raw`L·J s² + (L·b + R·J) s + (R·b + K²) = 0
1×10⁻⁸ s² + 4.0005×10⁻⁵ s + 4.2×10⁻⁴ = 0
poles:  s ≈ -10.5   and   s ≈ -3990   (rad/s)`, caption: "Two real poles, nearly 400 times apart." },

      { t: "h", text: "The first-order approximation" },
      { t: "p", text: "Each pole corresponds to a mode that decays as e^(pt). The pole at -3990 dies away in about a millisecond: it is the electrical transient, the current settling after a voltage change, roughly set by L/R = 0.25 ms. The pole at -10.5 takes a few hundred milliseconds: it is the rotor spinning up. When one pole is ten or more times faster than the other, the fast one finishes long before the slow one has moved, so you can drop it. Setting L = 0 gives:" },
      { t: "formula", text: String.raw`Ω(s)/V(s) ≈ Km / (τm·s + 1)

Km = K / (R·b + K²)  = 0.02 / 4.2×10⁻⁴  ≈ 47.6 (rad/s)/V
τm = R·J / (R·b + K²) = 4×10⁻⁵ / 4.2×10⁻⁴ ≈ 0.0952 s`, caption: "The motor as a first-order system: a DC gain and a mechanical time constant." },
      { t: "p", text: "Check: the slow pole of the full model is -10.53 rad/s and 1/τm = 10.5 rad/s, so the approximation keeps the right dynamics. A simulation of a 6 V step through both models (the Python below) shows the two speed curves differ by at most 0.73 rad/s, a quarter of a percent of the final 286 rad/s. That is far smaller than the scatter between two motors of the same type." },
      { t: "snippet", lang: "python", code: String.raw`import numpy as np
import control as ct      # pip install control  (python-control 0.10)

# DC motor parameters (identified or from the datasheet)
R, L = 2.0, 0.5e-3        # ohm, henry
K = 0.02                  # N*m/A  (= V*s/rad)
J, b = 2e-5, 1e-5         # kg*m^2, N*m*s

s = ct.tf("s")
G_full = K / ((L*s + R) * (J*s + b) + K**2)    # omega(s)/V(s), second order
G_1st = (K / (R*b + K**2)) / ((R*J / (R*b + K**2)) * s + 1)

print("poles of full model:", np.round(ct.poles(G_full), 2))
print("DC gain:", round(ct.dcgain(G_full), 2), "rad/s per volt")

t = np.linspace(0, 0.5, 2001)
_, w_full = ct.step_response(6 * G_full, t)    # 6 V step
_, w_1st = ct.step_response(6 * G_1st, t)
print("max difference:", round(float(np.max(np.abs(w_full - w_1st))), 2), "rad/s")
i63 = np.argmax(w_full >= 0.632 * w_full[-1])
print("time to 63.2 %:", round(t[i63] * 1000, 1), "ms")
# Prints poles -3989.97 and -10.53, DC gain 47.62, max difference 0.73, 94.5 ms`, caption: "Comparing the full and first-order motor models." },
      { t: "note", kind: "tip", text: "The approximation fails if you add a large inductor in series, drive the motor with a slow current-limited supply, or need to control current itself (as in a torque loop on a brushless drive). Then the electrical pole is part of the problem and must stay in the model." },

      { t: "h", text: "Identifying the parameters from a step response" },
      { t: "p", text: "Datasheets for cheap gear motors rarely give J or b, and the gearbox adds friction and inertia of its own. So measure the two numbers the first-order model needs, Km and τm, directly. The first-order step response to a voltage step of size V0 is:" },
      { t: "formula", text: String.raw`ω(t) = Km·V0·(1 - e^(-t/τm))

at t = τm:   ω = 0.632 × final value
at t = 3τm:  ω = 0.950 × final value
at t = 4τm:  ω = 0.982 × final value`, caption: "Two numbers, read off one curve." },
      { t: "list", ordered: true, items: [
        "Log speed from the encoder at a fixed rate (1 ms to 5 ms), with the motor at rest, then apply a voltage step V0 that keeps the motor well away from both stall and the supply limit.",
        "Average the last part of the record to get the final speed ω∞. Then **Km = ω∞ / V0**.",
        "Find the time at which speed first crosses 0.632 × ω∞, measured from the instant of the step. That is **τm**.",
        "Repeat at two or three different step sizes. If Km changes a lot with V0, friction is not viscous (see the deep section) and you should model the dead zone separately.",
      ] },
      { t: "p", text: "Worked example. A 6 V step gives a final speed of 286 rad/s. Km = 286 / 6 = 47.7 (rad/s)/V. The speed reaches 0.632 × 286 = 181 rad/s at 95 ms, so τm = 0.095 s. These match the model values above, as they should, because the test data came from that model. On a real motor you would also record the stall current at the same voltage, which gives R = V0 / I_stall, and from the steady state you can then recover K." },
      { t: "note", kind: "safety", text: "A stalled motor draws V/R continuously: 3 A for the example motor at 6 V. Measure stall current only in short bursts (under a second), with a current-limited bench supply, and never hold a geared motor stalled by hand; gearboxes multiply torque enough to injure fingers and strip gears." },

      { t: "deep", title: "Why Kt equals Ke in SI units", blocks: [
        { t: "p", text: "Consider the motor at steady state with no losses other than R. The electrical power going into the back-EMF term is Ke·ω·i. The mechanical power coming out of the shaft is torque times speed, Kt·i·ω. Energy is conserved in the ideal electromechanical coupling (the magnetic field stores no net energy at steady state), so Ke·ω·i = Kt·i·ω for every ω and i, hence Ke = Kt." },
        { t: "p", text: "This only holds when Ke is in V·s/rad and Kt in N·m/A. Datasheets often give Ke in V per 1000 rpm and Kt in oz·in/A. To convert: Ke [V·s/rad] = Ke [V/krpm] × 60 / (2π × 1000). A motor quoted at 2.1 V/krpm has K ≈ 0.020 V·s/rad, the value used here." },
        { t: "p", text: "A second check you can do on any motor: spin it by hand or with another motor and measure the open-circuit voltage with a multimeter and the speed with a tachometer. The ratio is Ke, without any current flowing." },
      ] },
      { t: "deep", title: "Friction that is not viscous, and the gearbox", blocks: [
        { t: "p", text: "The term b·ω is a linear model of friction. Real gear motors also have **Coulomb friction**: a constant torque τc opposing motion whenever the shaft turns, plus a higher breakaway (stiction) torque to get it started. The effect is a dead zone: below a certain voltage, about 0.5 V to 1.5 V for small gear motors, nothing moves at all." },
        { t: "formula", text: String.raw`steady state with Coulomb friction:
K·i = b·ω + τc ,  V = R·i + K·ω
ω∞ = (K·V - R·τc) / (R·b + K²)      for V > R·τc / K`, caption: "The speed against voltage line is offset: it crosses zero at V0 = R·τc / K." },
        { t: "p", text: "So run the step test at several voltages and plot ω∞ against V0. The slope is Km and the intercept on the voltage axis is the dead zone. A controller can cancel most of the dead zone by adding a small constant voltage in the direction of the command (friction feed-forward), which you will meet in the last lesson." },
        { t: "p", text: "A gearbox of ratio N divides output speed by N and multiplies output torque by N (minus efficiency losses). Inertia on the output side appears at the motor shaft divided by N². With N = 50 a wheel and robot body that look heavy contribute little to J at the motor, which is why the motor's own rotor often dominates τm on a small robot." },
      ] },
      { t: "deep", title: "Fitting the model by least squares instead of one point", blocks: [
        { t: "p", text: "Reading the 63.2 % point uses one sample and is sensitive to noise. A better method uses every sample. Discretise the first-order model with sample time Ts: ω[k+1] = a·ω[k] + c·V[k], where a = e^(-Ts/τm) and c = Km(1 - a). That is linear in the unknowns a and c, so ordinary least squares (as in module i8) fits them from the whole record, even with an arbitrary input such as a series of steps." },
        { t: "snippet", lang: "python", code: String.raw`import numpy as np

def fit_first_order(w, v, Ts):
    """w, v: arrays of measured speed and applied voltage at sample time Ts."""
    X = np.column_stack([w[:-1], v[:-1]])
    a, c = np.linalg.lstsq(X, w[1:], rcond=None)[0]
    tau = -Ts / np.log(a)
    Km = c / (1 - a)
    return Km, tau`, caption: "Least-squares identification of Km and τm from logged data." },
        { t: "p", text: "Excite the motor with steps in both directions and at different levels so the data actually contains the dynamics. Identification is only as good as the experiment: a single small step tells you about one operating point." },
      ] },
    ],
    mistakes: [
      "**Mixing units for K.** Using Ke in V/krpm with Kt in N·m/A makes the two constants differ by a factor of about 100 and the model meaningless. Convert to V·s/rad first.",
      "**Timing τm from the wrong instant.** The clock starts when the voltage step is applied, not when the motor first visibly moves. Log the command alongside the speed.",
      "**Identifying with a step that saturates.** If the step pushes the driver or supply into current limit, the response is not first order and τm comes out too long.",
      "**Ignoring the dead zone.** A step from 0 to 1 V on a motor with a 0.8 V dead zone gives a tiny Km. Test at several voltages and fit the line.",
      "**Applying the final value theorem to an unstable system.** lim s·F(s) as s → 0 only gives the right answer if the output actually settles.",
    ],
    practice: {
      kind: "bench",
      task: "Identify your robot motor's Km and τm and check the first-order model against a second step.",
      steps: [
        "Wire your gear motor to a driver (for example a TB6612FNG) and its encoder to D2 and D4 on the Uno (or GPIO 18 and 19 on the ESP32 DevKit, encoder powered at 3.3 V). Lift the wheels off the floor.",
        "Write a sketch that waits one second, applies a fixed PWM corresponding to a known voltage, and prints time (µs) and encoder count every 2 ms for one second. Measure the actual motor supply voltage with a multimeter to convert PWM duty to volts.",
        "In Python, convert counts to rad/s, find the final speed and the 63.2 % time, and compute Km and τm.",
        "Repeat at three voltages, plot final speed against voltage, and estimate the dead zone from the intercept.",
        "Simulate the first-order model for a different step size and overlay it on a new measurement. Report the largest error as a percentage of the final speed.",
      ],
    },
    quiz: [
      {
        q: "A motor has R = 2 Ω, K = 0.02 N·m/A, J = 2 × 10⁻⁵ kg·m² and b = 1 × 10⁻⁵ N·m·s. What is its mechanical time constant τm in the first-order model?",
        options: ["0.25 ms", "2.0 s", "about 95 ms", "about 10.5 ms"],
        answer: 2,
        why: "τm = R·J / (R·b + K²) = (2 × 2×10⁻⁵) / (2×10⁻⁵ + 4×10⁻⁴) = 4×10⁻⁵ / 4.2×10⁻⁴ ≈ 0.095 s. 0.25 ms is L/R, the electrical time constant.",
      },
      {
        q: "Why is it reasonable to drop the armature inductance for this motor?",
        options: [
          "Because inductance only matters for AC motors",
          "Because the electrical pole (about -3990 rad/s) is hundreds of times faster than the mechanical pole (about -10.5 rad/s), so its transient is over before the speed has changed much",
          "Because the inductance makes the system unstable",
          "Because the Laplace transform cannot represent inductors",
        ],
        answer: 1,
        why: "A pole far to the left decays much faster than the dominant one. When the ratio is ten or more, removing it barely changes the response, as the 0.73 rad/s maximum difference showed.",
      },
      {
        q: "A 5 V step makes a motor settle at 220 rad/s, and it reaches 139 rad/s 60 ms after the step. What are Km and τm?",
        options: ["Km = 44 (rad/s)/V, τm = 60 ms", "Km = 220 (rad/s)/V, τm = 60 ms", "Km = 44 (rad/s)/V, τm = 38 ms", "Km = 27.8 (rad/s)/V, τm = 60 ms"],
        answer: 0,
        why: "Km = 220 / 5 = 44. And 139 / 220 = 0.632, so 60 ms is the time to 63.2 % of the final value, which is τm.",
      },
      {
        q: "In the Laplace domain with zero initial conditions, what does differentiating a signal correspond to?",
        options: ["Dividing by s", "Multiplying by e^(-s)", "Multiplying by s", "Taking the limit as s → 0"],
        answer: 2,
        why: "d f/dt transforms to s·F(s) - f(0), which is s·F(s) when f(0) = 0. Integration divides by s.",
      },
      {
        q: "Using the final value theorem, what is the final speed of the motor Ω(s) = 47.6/(0.0952s + 1) × 3/s (a 3 V step)?",
        options: ["0 rad/s", "47.6 rad/s", "about 1500 rad/s", "about 143 rad/s"],
        answer: 3,
        why: "lim s·Ω(s) as s → 0 = 47.6 × 3 / 1 = 142.8 rad/s. The first-order system settles at Km × V0.",
      },
    ],
  },

  "a8-time-response-and-feedback": {
    id: "a8-time-response-and-feedback",
    outcomes: [
      "Predict rise, overshoot and settling of first and second-order systems from τ, ζ and ωn",
      "Locate poles and zeros and read the response from their positions",
      "Reduce a block diagram and derive a closed-loop transfer function",
      "Calculate steady-state error from the system type and the error constants",
    ],
    blocks: [
      { t: "h", text: "Reading a response before you see it" },
      { t: "p", text: "Most systems you will control behave, at least approximately, like a first or a second-order system. Learn the handful of formulas that describe those two shapes and you can look at a transfer function and say, before any simulation, how fast it is, whether it overshoots, and by how much. That skill is what lets you design: you choose a target response in these terms, then pick controller gains that produce it." },

      { t: "h", text: "First-order systems" },
      { t: "formula", text: String.raw`G(s) = K / (τs + 1)          one pole at s = -1/τ

step response:  y(t) = K·(1 - e^(-t/τ))
rise time (10 % to 90 %):  tr = τ·ln 9 ≈ 2.2τ
settling time (to 2 %):    ts ≈ 4τ`, caption: "One number sets the speed, one sets the size. No overshoot, ever." },
      { t: "p", text: "The motor speed model from the last lesson is first order with τ = 0.0952 s, so its open-loop rise time is about 0.21 s and it settles to 2 % in about 0.38 s. The further left the pole (the smaller τ), the faster the response." },

      { t: "h", text: "Second-order systems" },
      { t: "p", text: "Put the motor in a position loop and it becomes second order, because position is the integral of speed. The standard form uses two parameters: the **natural frequency** ωn (how fast) and the **damping ratio** ζ (how oscillatory)." },
      { t: "formula", text: String.raw`G(s) = ωn² / (s² + 2ζωn·s + ωn²)

poles:  s = -ζωn ± j·ωn·√(1 - ζ²)        (for ζ < 1)
        real part σ = ζωn,  damped frequency ωd = ωn·√(1 - ζ²)

percent overshoot:  Mp = 100·exp(-πζ / √(1 - ζ²))
peak time:          tp = π / ωd
settling time (2 %): ts ≈ 4 / (ζωn)`, caption: "The formulas that describe almost every tuning target." },
      { t: "table", head: ["ζ", "Overshoot", "Character"], rows: [
        ["0", "100 %", "undamped, oscillates forever"],
        ["0.2", "52.7 %", "very lively"],
        ["0.5", "16.3 %", "brisk, visible overshoot"],
        ["0.707", "4.3 %", "a common design target"],
        ["1", "0 %", "critically damped, fastest with no overshoot"],
        ["> 1", "0 %", "overdamped, two real poles, sluggish"],
      ], caption: "Overshoot depends only on ζ." },

      { t: "h", text: "Worked example: P control of motor position" },
      { t: "p", text: "Position is θ = ∫ω dt, so θ(s)/V(s) = Km / (s(τm s + 1)) = 47.6 / (s(0.0952s + 1)). Close a unity feedback loop with a proportional controller V = Kp·(θref - θ):" },
      { t: "formula", text: String.raw`θ/θref = Kp·Km / (τm s² + s + Kp·Km)
        = (Kp·Km/τm) / (s² + (1/τm)s + Kp·Km/τm)
        = 500·Kp / (s² + 10.5 s + 500·Kp)

Kp = 0.5 V/rad:
ωn² = 250        →  ωn = 15.8 rad/s
2ζωn = 10.5      →  ζ = 10.5 / 31.6 = 0.332
Mp = 100·exp(-π × 0.332 / √(1 - 0.110)) = 33.1 %
tp = π / (15.8 × 0.943) = 0.211 s
ts ≈ 4 / (0.332 × 15.8) = 4 / 5.25 = 0.76 s`, caption: "Match coefficients with the standard form." },
      { t: "p", text: "Check: python-control gives overshoot 33.07 %, peak time 0.213 s and a 2 % settling time of 0.70 s for the same loop. The settling formula is an envelope estimate, so it is slightly pessimistic; the others match to two or three figures. Notice what the algebra reveals: raising Kp raises ωn but leaves 2ζωn fixed at 10.5, so ζ falls and the overshoot grows. **Proportional gain alone cannot make this loop both fast and well damped.** That is the job of the D term, or of a better design later in this module." },

      { t: "h", text: "Poles, zeros and what they tell you" },
      { t: "p", text: "Write any rational transfer function as a ratio of factored polynomials. The roots of the numerator are **zeros**; the roots of the denominator are **poles**. Plotted on the complex s-plane, poles alone tell you the shape of the natural response:" },
      { t: "list", items: [
        "**Left half-plane (real part negative):** the mode decays. Further left means faster.",
        "**Right half-plane:** the mode grows. The system is unstable.",
        "**On the imaginary axis:** sustained oscillation (or, at the origin, an integrator that holds its value).",
        "**Complex pairs:** oscillation at ωd, decaying at rate σ. The angle from the negative real axis is cos⁻¹ζ, so lines of constant damping are rays from the origin.",
        "**Dominant poles:** the poles nearest the imaginary axis decay slowest and dominate the response once faster modes have died.",
      ] },
      { t: "p", text: "Zeros do not change stability, but they change the shape. A zero in the left half-plane near the dominant poles adds overshoot (it effectively adds a scaled derivative of the response). A zero in the right half-plane gives an initial move in the wrong direction (non-minimum phase), as when a bicycle must steer briefly left to turn right." },
      { t: "diagram", text: String.raw`
                         Im
     -5.25 + j14.9  x     │
                          │
      ────────────────────┼────────────── Re
                          │
     -5.25 - j14.9  x     │
   (left half-plane:      │  (right half-plane:
    stable)               │   unstable)`, caption: "Closed-loop poles of the position loop with Kp = 0.5." },

      { t: "h", text: "Block diagram algebra" },
      { t: "p", text: "A control system is drawn as blocks (transfer functions) joined by signals. Three rules reduce any such diagram to one transfer function:" },
      { t: "formula", text: String.raw`series:    G1 then G2           →  G1·G2
parallel:  G1 + G2              →  G1 + G2
feedback:  forward G, return H  →  G / (1 + G·H)      (negative feedback)`, caption: "Everything else is moving summing points and pick-off points while keeping each signal unchanged." },
      { t: "diagram", text: String.raw`
 r ──►(+)── e ──► C(s) ── u ──► G(s) ──┬──► y
       ▲-                               │
       └──────────── H(s) ◄─────────────┘`, caption: "The standard loop: controller C, plant G, sensor H." },
      { t: "formula", text: String.raw`Y/R = C·G / (1 + C·G·H)          (closed-loop transfer function)
E/R = 1 / (1 + C·G)               (error, with H = 1)
L(s) = C·G·H                      (the loop transfer function)`, caption: "The loop transfer function L(s) appears everywhere in stability analysis." },
      { t: "p", text: "Derivation of the feedback rule: e = r - H·y and y = C·G·e. Substitute: y = C·G·r - C·G·H·y, so y(1 + C·G·H) = C·G·r. The **characteristic equation** 1 + L(s) = 0 gives the closed-loop poles, and it is the equation every stability test in the next lesson works on." },

      { t: "h", text: "Steady-state error and system type" },
      { t: "p", text: "Use the final value theorem on the error E(s) = R(s)/(1 + L(s)) with unity feedback. The answer depends on how many pure integrators (poles at s = 0) the loop L(s) contains. That number is the **system type**." },
      { t: "table", head: ["System type", "Step input", "Ramp input", "Parabola input"], rows: [
        ["0", "1/(1 + Kp)", "∞", "∞"],
        ["1", "0", "1/Kv", "∞"],
        ["2", "0", "0", "1/Ka"],
      ], caption: "Kp = lim L(s), Kv = lim s·L(s), Ka = lim s²·L(s), each as s → 0." },
      { t: "p", text: "Two examples from the motor. **Speed loop with P control:** L = Kp·Km/(τm s + 1) has no integrator, type 0. With Kp = 0.1 V per rad/s, the position error constant is 0.1 × 47.6 = 4.76 and the steady error to a step is 1/(1 + 4.76) = 17.4 % of the setpoint. **Position loop with P control:** L = Kp·Km/(s(τm s + 1)) has one integrator (position integrates speed), type 1. Its step error is zero, but a setpoint ramping at 1 rad/s lags by 1/Kv = 1/(0.5 × 47.6) = 0.042 rad. The I term of PI adds one integrator, which is exactly why it removes the speed-loop step error you saw in i12." },
      { t: "note", kind: "warn", text: "These results assume the loop is stable and linear. A motor with a 0.8 V dead zone and P control also stops short of the target, but by an amount set by the dead zone, not by the table." },

      { t: "deep", title: "Deriving the overshoot formula", blocks: [
        { t: "p", text: "For ζ < 1 the unit step response of the standard second-order system is:" },
        { t: "formula", text: String.raw`y(t) = 1 - e^(-ζωn t)·[ cos(ωd t) + (ζ/√(1 - ζ²))·sin(ωd t) ]

dy/dt = (ωn/√(1 - ζ²))·e^(-ζωn t)·sin(ωd t)
dy/dt = 0 first at ωd·tp = π   →   tp = π/ωd

y(tp) = 1 - e^(-ζωn π/ωd)·(cos π + 0) = 1 + e^(-πζ/√(1 - ζ²))`, caption: "The peak is where the velocity first returns to zero." },
        { t: "p", text: "So the overshoot fraction is e^(-πζ/√(1 - ζ²)), independent of ωn. The settling estimate comes from the envelope e^(-ζωn t): it falls to 2 % when ζωn t = ln 50 ≈ 3.9, rounded to 4. For a 5 % band, use 3/(ζωn)." },
      ] },
      { t: "deep", title: "When a third pole is not negligible", blocks: [
        { t: "p", text: "The formulas are exact only for two poles and no zeros. Real loops add a filter pole, the motor's electrical pole, and the sample-and-hold delay. A practical rule: if every extra pole has real part at least five times further left than the dominant pair, the dominant-pair formulas predict overshoot to within a few percent. Extra poles closer in add lag and make the real overshoot larger than predicted." },
        { t: "p", text: "A zero at s = -z on top of the standard pair multiplies the response by (1 + s/z), which adds (1/z)·dy/dt to the output. Its effect on overshoot grows as z approaches ζωn. PI controllers place such a zero on purpose, which is why a PI loop designed for a certain ζ often overshoots more than the table says." },
        { t: "snippet", lang: "python", code: String.raw`import control as ct
s = ct.tf("s")
for z in (50, 15, 5):
    T = (1 + s/z) * 250 / (s**2 + 10.5*s + 250)
    print(z, round(ct.step_info(T)["Overshoot"], 1), "% overshoot")`, caption: "See how a zero near the dominant poles adds overshoot." },
      ] },
    ],
    mistakes: [
      "**Using ζ formulas on a system that is not second order.** Check where the other poles are first.",
      "**Expecting more Kp to fix overshoot.** In the position loop more Kp lowers ζ; damping needs derivative action or a different structure.",
      "**Getting the sign of feedback wrong in the algebra.** Negative feedback gives G/(1 + GH). A plus sign in the denominator is the stable, usual case.",
      "**Counting integrators in the controller only.** System type counts poles at the origin in the whole loop L(s), plant included.",
      "**Confusing ωn with ωd.** The oscillation you see on a scope is at ωd = ωn√(1 - ζ²), slightly slower than ωn.",
    ],
    practice: {
      kind: "bench",
      task: "Predict and then measure the step response of a P position loop on your motor.",
      steps: [
        "Using your Km and τm from the previous lesson, compute ωn, ζ, overshoot and peak time for Kp = 0.2, 0.5 and 1.0 V/rad.",
        "Implement θref step of 1 rad with P control at 200 Hz (counts converted to radians) and log θ at each sample.",
        "Measure overshoot and peak time for each Kp. Tabulate predicted against measured.",
        "Explain any systematic gap: dead zone (undershoot, steady error), PWM supply sag, or sampling delay (more overshoot than predicted).",
        "Set a 1 rad/s ramp as setpoint and measure the steady lag. Compare with 1/Kv.",
      ],
    },
    quiz: [
      {
        q: "A second-order system has ζ = 0.5 and ωn = 20 rad/s. What are its overshoot and approximate 2 % settling time?",
        options: ["4.3 % and 0.2 s", "16.3 % and 0.4 s", "16.3 % and 0.2 s", "50 % and 0.4 s"],
        answer: 1,
        why: "Overshoot = 100·exp(-π × 0.5/√0.75) = 16.3 %. Settling ≈ 4/(ζωn) = 4/10 = 0.4 s.",
      },
      {
        q: "In the motor position loop θ/θref = 500Kp/(s² + 10.5s + 500Kp), what happens as Kp increases?",
        options: [
          "ωn increases and ζ decreases, so the response is faster but more oscillatory",
          "Both ωn and ζ increase",
          "ζ increases and the overshoot disappears",
          "The steady-state error to a step grows",
        ],
        answer: 0,
        why: "ωn = √(500Kp) grows, but 2ζωn stays fixed at 10.5, so ζ = 10.5/(2ωn) shrinks and the overshoot grows.",
      },
      {
        q: "With forward path G and feedback H, what is the closed-loop transfer function for negative feedback?",
        options: ["G·H", "G/(1 - GH)", "1/(1 + GH)", "G/(1 + GH)"],
        answer: 3,
        why: "From y = G(r - Hy): y(1 + GH) = Gr, so Y/R = G/(1 + GH). 1/(1 + GH) is the error transfer function when H = 1.",
      },
      {
        q: "A speed loop uses P control on a first-order motor with Km = 40 (rad/s)/V and Kp = 0.2 V per rad/s. What is the steady-state error to a step, as a fraction of the setpoint?",
        options: ["0", "1/8 = 12.5 %", "1/9 ≈ 11.1 %", "1/40 = 2.5 %"],
        answer: 2,
        why: "The loop is type 0 with Kp_loop = 0.2 × 40 = 8. Error = 1/(1 + 8) = 1/9 ≈ 11.1 %.",
      },
      {
        q: "A closed-loop system has poles at -2 and -1 ± j5. Which statement is right?",
        options: [
          "It is unstable because of the complex poles",
          "It is stable; the response oscillates at about 5 rad/s and decays at a rate set by the real part -1",
          "It is stable and has no overshoot",
          "The pole at -2 dominates because it is real",
        ],
        answer: 1,
        why: "All real parts are negative, so it is stable. The complex pair is nearest the imaginary axis and dominates: oscillation at ωd = 5 rad/s, envelope e^(-t).",
      },
    ],
  },

  "a8-stability-and-frequency-response": {
    id: "a8-stability-and-frequency-response",
    outcomes: [
      "Apply the Routh-Hurwitz criterion to find the range of gain for stability",
      "Sketch a root locus from its construction rules",
      "Draw and read a Bode plot, and find gain and phase margins",
      "Relate phase margin to damping and robustness",
    ],
    blocks: [
      { t: "h", text: "Why stability needs tools" },
      { t: "p", text: "A closed loop is stable when all its poles lie in the left half-plane. For a second-order loop you can just solve the quadratic. But add a filter, a sensor lag and the motor's electrical pole and the characteristic polynomial is third, fourth or fifth order, with the gain as a parameter. You want answers to questions like: up to what gain does it stay stable? How close to the edge am I? What happens if the motor gets 30 % slower? This lesson gives three complementary tools: Routh-Hurwitz (algebraic, exact range of gain), the root locus (geometric, where the poles go as gain changes) and the Bode plot (frequency domain, measurable on real hardware, with margins that quantify robustness)." },
      { t: "p", text: "The running example throughout is a loop with gain K and three real lags:" },
      { t: "formula", text: String.raw`L(s) = K / ((s + 1)(s + 2)(s + 3))

characteristic equation:  1 + L(s) = 0
(s + 1)(s + 2)(s + 3) + K = 0
s³ + 6s² + 11s + (6 + K) = 0`, caption: "Three poles, no zeros. Think of a motor, a filter and a slow sensor in series." },

      { t: "h", text: "The Routh-Hurwitz criterion" },
      { t: "p", text: "Routh's method tells you how many roots of a polynomial lie in the right half-plane without finding them. First, a necessary condition: all coefficients must be present and have the same sign. If any is missing or negative, the system is unstable (or marginal). Then build the **Routh array**: the first two rows are the alternating coefficients, and each later entry is computed from the two rows above it." },
      { t: "formula", text: String.raw`s³ |  1          11
s² |  6          6 + K
s¹ |  b1         0
s⁰ |  6 + K

b1 = (6 × 11 - 1 × (6 + K)) / 6 = (60 - K) / 6`, caption: "Each new entry: (left above × right two above - left two above × right above) / left above." },
      { t: "p", text: "**The number of sign changes in the first column equals the number of right-half-plane roots.** For stability every entry of the first column must be positive: 6 + K > 0 and 60 - K > 0. So the loop is stable for **-6 < K < 60**, and for a positive controller gain, 0 < K < 60." },
      { t: "p", text: "At K = 60 the s¹ row is all zeros, which signals roots on the imaginary axis. The row above gives the **auxiliary equation** 6s² + 66 = 0, so s = ±j√11 = ±j3.317. The loop oscillates at 3.317 rad/s when K = 60. Check by substitution: at s = j√11, s³ + 6s² + 11s + 66 = -j11√11 - 66 + j11√11 + 66 = 0." },
      { t: "note", kind: "tip", text: "This gives you Ziegler-Nichols' ultimate gain and period from the model rather than by experiment: Ku = 60 and Tu = 2π/3.317 = 1.89 s." },

      { t: "h", text: "The root locus" },
      { t: "p", text: "The root locus is the path the closed-loop poles trace in the s-plane as K goes from 0 to ∞. Every point s on it satisfies 1 + K·G(s) = 0, which splits into an angle condition (∠G(s) = 180° plus a multiple of 360°) and a magnitude condition (K = 1/|G(s)|). You can sketch it by hand with a few rules, then use software for precision." },
      { t: "list", ordered: true, items: [
        "The locus starts (K = 0) at the open-loop poles and ends (K → ∞) at the open-loop zeros, or at infinity.",
        "On the real axis, the locus occupies segments that have an **odd number** of real poles plus zeros to their right.",
        "Branches going to infinity follow **asymptotes** at angles (180° + 360°k)/(n - m), where n is the number of poles and m of zeros, radiating from the centroid σa = (Σ poles - Σ zeros)/(n - m).",
        "Two branches meeting on the real axis break away where dK/ds = 0.",
        "The crossing of the imaginary axis is where Routh gives a zero row: the gain and frequency found above.",
      ] },
      { t: "formula", text: String.raw`poles: -1, -2, -3      n = 3,  m = 0
real-axis segments: between -1 and -2, and left of -3
asymptotes: 60°, 180°, 300°  from  σa = (-1 - 2 - 3)/3 = -2
breakaway:  K = -(s³ + 6s² + 11s + 6),  dK/ds = 0
            3s² + 12s + 11 = 0  →  s = -1.42  (the root between -1 and -2)
jω crossing: K = 60 at s = ±j3.32`, caption: "Applying the rules to the example." },
      { t: "diagram", text: String.raw`
                      Im
                 \     │     /
                  \    │    /   ← 60° asymptote; crosses jω at j3.32 (K = 60)
                   \   │   /
   ◄──────x─────x───●──x───┼──────── Re
         -3    -2  -1.42 -1  0
          ◄─            │
     (one branch runs   │    two branches meet at -1.42,
      left from -3)     │    then curve up and down
                        │    towards the 60° and 300° asymptotes`, caption: "Sketch of the root locus for K/((s+1)(s+2)(s+3))." },
      { t: "p", text: "Reading it: for small K the two poles between -1 and -2 approach each other, still real (no overshoot). Past K ≈ 0.385 (the gain at the breakaway, |(-1.42 + 1)(-1.42 + 2)(-1.42 + 3)| ≈ 0.385) they become a complex pair, damping falls as K rises, and at K = 60 they cross into the right half-plane. The locus shows at a glance that more gain alone will never make this loop both fast and well damped." },

      { t: "h", text: "Frequency response and Bode plots" },
      { t: "p", text: "Drive a stable linear system with a sine wave of frequency ω. After transients die, the output is a sine at the same frequency, scaled by |G(jω)| and shifted by ∠G(jω). A **Bode plot** draws both against log frequency: magnitude in decibels (20·log₁₀|G|) and phase in degrees. You can measure it on real hardware with a signal generator or a chirp, which makes it the tool of choice when the model is uncertain." },
      { t: "list", items: [
        "A pole at s = -a gives a flat magnitude up to ω = a, then a slope of -20 dB per decade, and a phase going from 0° to -90°, passing -45° at ω = a.",
        "A zero does the opposite: +20 dB per decade and up to +90°.",
        "An integrator 1/s is a straight line of -20 dB per decade with constant phase -90°.",
        "Because log|G1·G2| = log|G1| + log|G2| and phases add, you build the plot by **adding** the pieces.",
        "A pure delay e^(-sT) has magnitude 1 and phase -ωT (in radians). Sampling and computation add delay, which is why fast digital loops lose phase.",
      ] },

      { t: "h", text: "Gain margin and phase margin" },
      { t: "p", text: "The loop goes unstable when, at some frequency, the loop gain L(jω) is exactly -1: magnitude 1 and phase -180°. A signal going round the loop then comes back identical and in phase with the original disturbance, and sustains itself. The margins measure how far you are from that point." },
      { t: "formula", text: String.raw`phase crossover ω180: where ∠L(jω) = -180°
gain margin  GM = 1 / |L(jω180)|          (in dB: -20·log₁₀|L(jω180)|)

gain crossover ωc: where |L(jω)| = 1  (0 dB)
phase margin PM = 180° + ∠L(jωc)`, caption: "GM: how much more gain before instability. PM: how much more lag before instability." },
      { t: "p", text: "Worked example with K = 10. At ω = 1 rad/s, |L| = 10/(√2 × √5 × √10) = 10/√100 = 1 exactly, so ωc = 1 rad/s. The phase there is -(45° + 26.6° + 18.4°) = -90°, so **PM = 90°**. The phase reaches -180° at ω180 = √11 = 3.317 rad/s (the Routh frequency), where |L| = 10/60, so **GM = 6, or 15.6 dB**. Both agree with Routh: gain can rise six times, from 10 to 60, before instability." },
      { t: "snippet", lang: "python", code: String.raw`import numpy as np
import control as ct      # python-control 0.10

s = ct.tf("s")
L = 10 / ((s + 1) * (s + 2) * (s + 3))          # open-loop transfer function

gm, pm, w180, wc = ct.margin(L)
print(f"gain margin  {gm:.2f}  ({20*np.log10(gm):.1f} dB) at {w180:.3f} rad/s")
print(f"phase margin {pm:.1f} deg at {wc:.3f} rad/s")

T = ct.feedback(L, 1)                              # closed loop, unity feedback
info = ct.step_info(T)
print(f"overshoot {info['Overshoot']:.1f} %, settling {info['SettlingTime']:.2f} s")
print("steady-state output:", round(ct.dcgain(T), 3))

ct.bode_plot(L, dB=True, display_margins=True)     # draws the Bode plot
# import matplotlib.pyplot as plt; plt.show()
# Prints GM 6.00 (15.6 dB) at 3.317, PM 90.0 at 1.000,
# overshoot 19.1 %, settling 4.58 s, steady-state output 0.625`, caption: "Margins and the closed-loop step response in a few lines." },
      { t: "p", text: "Notice the steady-state output of 0.625: the loop is type 0 with Kp = 10/6, so the error is 1/(1 + 10/6) = 0.375. Stability and accuracy are separate questions." },
      { t: "p", text: "Why margins matter: the model is never exact. A gain margin of 6 dB means the loop survives the plant gain doubling (a fresh battery, a lighter load). A phase margin of 45° means it survives extra lag equal to 45° at crossover (a slower sensor, a sampling delay). Common targets are **GM ≥ 6 dB and PM between 45° and 60°**. For loops that behave like a second-order pair, PM ≈ 100·ζ degrees for ζ up to about 0.7, which links the frequency-domain margins to the overshoot table of the last lesson." },

      { t: "deep", title: "Why the Routh array counts right-half-plane roots", blocks: [
        { t: "p", text: "A full proof uses the argument principle, but the idea can be seen another way. The Routh array is a sequence of polynomial divisions (a continued fraction expansion of the ratio of the even and odd parts of the polynomial). A polynomial is Hurwitz, meaning all roots are in the left half-plane, exactly when every coefficient of that continued fraction is positive. Each sign change in the first column corresponds to a negative coefficient, which corresponds to one root crossing into the right half-plane." },
        { t: "p", text: "Two special cases arise. A zero in the first column with the rest of the row non-zero: replace it by a small positive ε and carry on, then examine signs as ε → 0. A whole row of zeros: the polynomial has roots symmetric about the origin (on the imaginary axis, or mirrored pairs). Form the auxiliary polynomial from the row above, differentiate it, and use its coefficients as the replacement row. The roots of the auxiliary polynomial are those symmetric roots." },
      ] },
      { t: "deep", title: "The Nyquist criterion, the idea behind the margins", blocks: [
        { t: "p", text: "Gain and phase margins are read from a Bode plot, but their justification is Nyquist's criterion. Plot L(jω) in the complex plane as ω runs from -∞ to ∞. The number of closed-loop right-half-plane poles Z equals N + P, where P is the number of open-loop right-half-plane poles and N is the number of clockwise encirclements of the point -1. For an open-loop stable L (P = 0), the closed loop is stable when the curve does not encircle -1." },
        { t: "p", text: "Margins measure the distance from -1 along two directions: along the negative real axis (gain margin) and along the unit circle (phase margin). A better single number is the **minimum distance** from the curve to -1, which equals 1/Ms, where Ms is the peak of the sensitivity function |1/(1 + L)|. Industrial practice often asks for Ms between 1.4 and 2, which guarantees GM ≥ 11 dB to 6 dB and PM ≥ 42° to 29° respectively (GM ≥ Ms/(Ms - 1), PM ≥ 2·asin(1/(2Ms))) at once, and protects against cases where both margins look fine but the curve passes close to -1 in between." },
        { t: "p", text: "Nyquist also handles what Bode cannot: open-loop unstable plants (a balancing robot, P = 1) and pure delays, where the polynomial methods do not apply because e^(-sT) is not a polynomial." },
      ] },
      { t: "deep", title: "Delay is the enemy: a phase budget", blocks: [
        { t: "p", text: "A sampled controller with period Ts adds, on average, about 1.5·Ts of delay: half a period from the zero-order hold and up to one period of computation and output latency. At crossover ωc that costs 1.5·Ts·ωc radians of phase. With a 100 Hz loop (Ts = 10 ms) and a crossover of 30 rad/s, that is 0.45 rad, or 26°, gone from the phase margin." },
        { t: "formula", text: String.raw`phase lost to delay (degrees) = (180/π) × ωc × T_delay
rule of thumb: sample at least 10 to 20 times the closed-loop bandwidth`, caption: "This is why a loop that worked in simulation can ring on the bench." },
      ] },
    ],
    mistakes: [
      "**Forgetting the coefficient sign check before building a Routh array.** A missing or negative coefficient already means instability.",
      "**Arithmetic errors in the Routh array.** Check the imaginary-axis frequency from the auxiliary equation by substituting it back.",
      "**Reading phase margin at the wrong frequency.** PM is read at the gain crossover (|L| = 0 dB), not where the phase is -180°.",
      "**Using the closed-loop Bode plot for margins.** Margins are a property of the open loop L(s) = C·G·H.",
      "**Treating large margins as good performance.** A 90° phase margin loop can still be slow and have a large steady error, as in the example.",
    ],
    practice: {
      kind: "bench",
      task: "Measure a point on your motor's frequency response and compare with the model.",
      steps: [
        "Drive the motor speed open loop with V(t) = V0 + A·sin(ωt), with V0 chosen to stay above the dead zone and A about 1 V.",
        "Log speed for at least ten periods at each of ω = 2, 5, 10, 20 and 50 rad/s.",
        "Fit a sine to each speed record (least squares on sin and cos terms) to get amplitude ratio and phase lag.",
        "Plot measured |G| in dB and phase against log ω, and overlay Km/(τm·jω + 1) from your identified parameters.",
        "Mark the frequency where the measured phase is -45°. Compare it with 1/τm.",
      ],
    },
    quiz: [
      {
        q: "For the characteristic equation s³ + 4s² + 5s + K = 0, what range of K > 0 gives stability?",
        options: ["0 < K < 20", "0 < K < 5", "0 < K < 4", "Every K > 0"],
        answer: 0,
        why: "Routh: s³ row 1, 5; s² row 4, K; s¹ entry (4 × 5 - K)/4 = (20 - K)/4; s⁰ entry K. All positive needs 0 < K < 20.",
      },
      {
        q: "On a root locus, which real-axis segments belong to the locus?",
        options: [
          "Every segment between two poles",
          "Segments with an odd number of real poles plus zeros to their right",
          "Segments with an even number of poles to their left",
          "Only the segment to the right of the right-most pole",
        ],
        answer: 1,
        why: "This follows from the angle condition: each real pole or zero to the right contributes 180°, and the total must be an odd multiple of 180°.",
      },
      {
        q: "A loop has |L(jω)| = 1 at ω = 4 rad/s, where ∠L = -140°. What is the phase margin?",
        options: ["140°", "-40°", "40°", "220°"],
        answer: 2,
        why: "PM = 180° + ∠L(jωc) = 180° - 140° = 40°.",
      },
      {
        q: "At the phase crossover the loop gain magnitude is 0.25. What is the gain margin in dB?",
        options: ["-12 dB", "4 dB", "6 dB", "12 dB"],
        answer: 3,
        why: "GM = 1/0.25 = 4. In dB, 20·log₁₀4 = 12.0 dB.",
      },
      {
        q: "Why is a phase margin of 45° to 60° a common design target?",
        options: [
          "It guarantees zero steady-state error",
          "It leaves room for unmodelled lag such as sampling delay, and corresponds to well-damped responses (ζ roughly 0.45 to 0.6)",
          "It makes the loop as fast as possible",
          "It is required by the Routh criterion",
        ],
        answer: 1,
        why: "Phase margin is a robustness buffer against extra lag, and for second-order-like loops PM ≈ 100ζ degrees, so 45° to 60° means moderate overshoot.",
      },
    ],
  },

  "a8-pid-design-analytically": {
    id: "a8-pid-design-analytically",
    outcomes: [
      "Design a PI speed controller by pole placement and by zero cancellation",
      "Choose a tuning method (model-based, Ziegler-Nichols, SIMC) to suit what you know",
      "Implement clamping and back-calculation anti-windup and explain the difference",
      "Add a derivative filter and choose its time constant",
    ],
    blocks: [
      { t: "h", text: "From knob-turning to design" },
      { t: "p", text: "In i12 you met the PID controller and tuned it on the robot. Now you have a model of the motor, so you can choose the gains from a specification: \"reach speed with a 30 ms time constant and no overshoot\" or \"position step with 5 % overshoot, settling in 0.3 s\". The design is done on paper in a few lines, checked in simulation, and the result on the bench is the test of the model. This lesson uses the ideal PID in parallel form:" },
      { t: "formula", text: String.raw`C(s) = Kp + Ki/s + Kd·s  =  Kp·(1 + 1/(Ti s) + Td s)

Ki = Kp / Ti ,   Kd = Kp·Td`, caption: "Parallel gains (Kp, Ki, Kd) and standard form (Kp, Ti, Td) describe the same controller." },

      { t: "h", text: "PI design by zero cancellation" },
      { t: "p", text: "The speed plant is first order, G(s) = Km/(τm s + 1). Write the PI controller as C(s) = Kp·(Ti s + 1)/(Ti s). It has a zero at s = -1/Ti. Choose **Ti = τm** and that zero cancels the plant pole exactly:" },
      { t: "formula", text: String.raw`L(s) = C·G = Kp·(τm s + 1)/(τm s) × Km/(τm s + 1) = Kp·Km / (τm s)

closed loop:  T(s) = L/(1 + L) = 1 / ( (τm/(Kp·Km))·s + 1 )

τcl = τm / (Kp·Km)      →     Kp = τm / (Km·τcl),   Ki = Kp/τm`, caption: "The loop becomes a pure integrator; the closed loop is first order with a time constant you choose." },
      { t: "p", text: "Worked example with Km = 47.6 (rad/s)/V and τm = 0.0952 s. Ask for τcl = 30 ms, about three times faster than the motor on its own:" },
      { t: "formula", text: String.raw`Kp = 0.0952 / (47.6 × 0.030) = 0.0667 V per rad/s
Ki = 0.0667 / 0.0952           = 0.700 V per rad
check: τcl = 0.0952 / (0.0667 × 47.6) = 0.0300 s  ✓`, caption: "A specification in, two gains out." },
      { t: "p", text: "What limits τcl? The voltage. At the instant of a step of Δω, the controller output jumps by Kp·Δω. For a 100 rad/s step that is 6.7 V, just above a 6 V supply. Asking for τcl = 10 ms would demand 20 V. **Actuator saturation, not algebra, sets the achievable speed of response.** Simulating the loop at 200 Hz confirms the design: speed reaches 63 % of a 100 rad/s step at 30 ms with no overshoot." },
      { t: "note", kind: "warn", text: "Cancellation works only as well as your τm estimate. If the true τm is 20 % longer, the cancellation is imperfect and a slow tail of small amplitude appears. Never cancel a pole in the right half-plane: the cancellation is never exact and the hidden unstable mode grows." },

      { t: "h", text: "PI design by pole placement" },
      { t: "p", text: "Zero cancellation gives a first-order closed loop. Pole placement lets you choose a second-order one instead, which helps reject load disturbances faster. Without cancelling, the closed-loop characteristic equation with C = Kp + Ki/s is:" },
      { t: "formula", text: String.raw`1 + (Kp + Ki/s)·Km/(τm s + 1) = 0
τm s² + (1 + Km·Kp) s + Km·Ki = 0
s² + ((1 + Km·Kp)/τm) s + Km·Ki/τm = 0

match  s² + 2ζωn s + ωn²:
Kp = (2ζωn·τm - 1) / Km
Ki = ωn²·τm / Km`, caption: "Two gains, two coefficients: any ζ and ωn you like (within voltage limits)." },
      { t: "p", text: "Example: ζ = 0.8, ωn = 40 rad/s. Kp = (2 × 0.8 × 40 × 0.0952 - 1)/47.6 = (6.093 - 1)/47.6 = 0.107. Ki = 1600 × 0.0952/47.6 = 3.20. The closed-loop transfer function also contains the PI zero at -Ki/Kp = -29.9, close to the poles, so expect more overshoot than the 1.5 % the table gives for ζ = 0.8 (a simulation gives about 11 %); simulate before trusting it. A common fix is to apply the proportional term to the measurement only (set-point weighting), which removes the zero from the reference path but keeps the disturbance rejection." },

      { t: "h", text: "Position control: PD and PID" },
      { t: "p", text: "The P position loop of the earlier lesson could not be both fast and damped. Adding derivative action, V = Kp·e + Kd·de/dt, gives the characteristic equation τm s² + (1 + Km·Kd) s + Km·Kp = 0. Now Kp sets ωn and Kd sets damping independently: for ζ = 0.7 and ωn = 30 rad/s, Kp = ωn²τm/Km = 900 × 0.0952/47.6 = 1.80 V/rad and Kd = (2ζωnτm - 1)/Km = (3.998 - 1)/47.6 = 0.063 V·s/rad. Add a small Ki only if a constant load torque (gravity on an arm) must be held with zero error." },

      { t: "h", text: "Tuning methods compared" },
      { t: "table", head: ["Method", "What you need", "Typical result"], rows: [
        ["Model-based (above)", "Km, τm (and delay)", "Meets a stated specification; best when the model is good"],
        ["Ziegler-Nichols ultimate gain", "Ku and Tu from an oscillation test or Routh", "Aggressive, aims at quarter-amplitude decay, often 40 % or more overshoot; a starting point only"],
        ["Ziegler-Nichols / Cohen-Coon step", "Gain, delay and time constant from an open-loop step", "Aggressive for lag-dominated plants"],
        ["SIMC (Skogestad)", "K, τ, delay θ, and a chosen τcl", "Robust; with τcl = θ gives about 47° phase margin and gain margin about 3"],
        ["Relay autotune", "A relay test that produces a limit cycle", "Automated Ku, Tu; used in commercial controllers"],
      ], caption: "Pick by what you know about the plant." },
      { t: "p", text: "SIMC is the model-based rule generalised to plants with delay θ: for G = K·e^(-θs)/(τs + 1), use Kp = τ/(K(τcl + θ)) and Ti = min(τ, 4(τcl + θ)). With θ = 0 it is exactly the zero-cancellation design above. The min() protects against very slow plants, where Ti = τ would make the integral action too weak to reject disturbances." },

      { t: "h", text: "Anti-windup" },
      { t: "p", text: "When the output saturates (the driver is already at 100 % duty), the integrator keeps accumulating error it cannot act on. When the error finally changes sign, the integrator must unwind before the output leaves the limit, causing overshoot and a slow recovery. Two standard cures:" },
      { t: "list", items: [
        "**Clamping (conditional integration):** stop integrating when the output is saturated and the error would drive it further into saturation. Simple and effective; one if-statement.",
        "**Back-calculation:** feed the difference between the saturated and unsaturated outputs back into the integrator through a gain Kaw, so the integrator is actively pulled to the value that just saturates the output. Smoother; Kaw ≈ 1/Ti is a good default (√(1/(Ti·Td)) is another common choice for PID).",
      ] },
      { t: "formula", text: String.raw`u_unsat = Kp·e + I
u       = sat(u_unsat)
dI/dt   = Ki·e + Kaw·(u - u_unsat)        (back-calculation)

clamping: if (u ≠ u_unsat) and (sign(e) = sign(u_unsat)), hold dI/dt = 0`, caption: "When not saturated, u = u_unsat and both reduce to ordinary integration." },
      { t: "p", text: "In the simulated motor loop above, a 150 rad/s step drives the output into the 6 V limit. Without anti-windup the speed overshoots to 154.7 rad/s; with back-calculation it peaks at 150.2 rad/s. On a position loop, where the saturated phase lasts much longer, the difference is dramatic: tens of percent of overshoot." },
      { t: "widget", id: "pid-tuner" },

      { t: "h", text: "Derivative filtering" },
      { t: "p", text: "The pure derivative Kd·s has gain rising without limit at high frequency, so it amplifies encoder quantisation and noise. Every practical PID limits it with a first-order low-pass filter:" },
      { t: "formula", text: String.raw`D(s) = Kd·s / (Tf s + 1)          Tf = Td / N ,  N typically 5 to 20

high-frequency gain limited to Kd/Tf = Kp·N`, caption: "N sets how far beyond the corner 1/Td the derivative works." },
      { t: "p", text: "Also take the derivative of the measurement, not of the error (-Kd·dy/dt instead of Kd·de/dt), so a step in setpoint does not produce a spike (derivative kick, covered in i12). With Td = Kd/Kp = 0.063/1.80 = 35 ms from the PD design above and N = 10, Tf = 3.5 ms. That filter corner (about 286 rad/s) is ten times the 30 rad/s loop bandwidth, so it costs little phase at crossover." },

      { t: "deep", title: "Choosing τcl from robustness, not wishes", blocks: [
        { t: "p", text: "With zero cancellation the loop is L = 1/(τcl s), whose phase is -90° at every frequency: PM = 90°. That looks perfect, but only because the model has no delay or extra lags. Add the sampling delay of a 200 Hz loop (about 1.5 × 5 ms = 7.5 ms) and the crossover at ωc = 1/τcl = 33 rad/s loses 33 × 0.0075 = 0.25 rad = 14°. Add a 2 ms encoder filter: another atan(33 × 0.002) ≈ 4°. Still a healthy 72°." },
        { t: "p", text: "Push τcl to 5 ms (ωc = 200 rad/s) and the delay alone costs 86°: the loop is close to instability before saturation is considered. This is the quantitative form of the advice to keep crossover well below the sampling rate. SIMC encodes the same idea by never letting τcl drop much below the effective delay θ." },
      ] },
      { t: "deep", title: "PID structures: parallel, standard, series and 2-DOF", blocks: [
        { t: "p", text: "Different controllers and libraries use different PID forms, and gains do not transfer between them unchanged. The **parallel** form uses Kp, Ki, Kd independently. The **standard (ISA)** form uses Kp, Ti, Td with Kp multiplying everything. The **series (interacting)** form Kp'(1 + 1/(Ti' s))(1 + Td' s), common in older industrial controllers, multiplies a PI by a PD, so its effective Kp is Kp'(1 + Td'/Ti'). Always check which one your library uses." },
        { t: "p", text: "A **two-degree-of-freedom** PID weights the setpoint differently in each term: u = Kp(b·r - y) + Ki∫(r - y)dt + Kd·d(c·r - y)/dt, with 0 ≤ b ≤ 1 and usually c = 0. The integral always uses the true error, so steady-state accuracy is unchanged, while b trades setpoint overshoot against speed without changing disturbance rejection, because the feedback path is unchanged." },
      ] },
      { t: "deep", title: "Verifying the PI design in simulation", blocks: [
        { t: "snippet", lang: "python", code: String.raw`import control as ct
s = ct.tf("s")
Km, tm = 47.6, 0.0952
G = Km / (tm*s + 1)

Kp, Ki = 0.0667, 0.700                   # zero cancellation, tau_cl = 30 ms
T1 = ct.feedback((Kp + Ki/s) * G, 1)
print("cancel:", ct.step_info(T1)["RiseTime"], "s rise (2.2 x 0.03 = 0.066)")

Kp, Ki = 0.107, 3.20                     # pole placement, zeta 0.8, wn 40
T2 = ct.feedback((Kp + Ki/s) * G, 1)
print("placed:", round(ct.step_info(T2)["Overshoot"], 1), "% overshoot (zero adds it)")
print("poles:", ct.poles(T2))`, caption: "Linear simulation; it ignores saturation, which the sketch in the next lesson handles." },
        { t: "p", text: "The first design gives a rise time of 0.066 s, the 2.2τcl of a first-order system. The pole-placement design gives closed-loop poles at -32 ± j24 (ζ = 0.8, ωn = 40) but about 11 % overshoot instead of the 1.5 % predicted from ζ alone, because of the zero at -29.9. That is the zero effect from the earlier lesson, in a real design." },
      ] },
    ],
    mistakes: [
      "**Designing for a response the actuator cannot deliver.** Check Kp × largest step against the supply voltage before choosing τcl.",
      "**Cancelling a pole with a wrong τm.** Identify the plant carefully, and accept that cancellation is approximate.",
      "**Forgetting the PI zero.** A pole-placement design overshoots more than ζ suggests; simulate it or use set-point weighting.",
      "**Using an unfiltered derivative on an encoder signal.** Quantised position differentiated at 1 kHz is mostly noise.",
      "**Mixing PID forms.** Gains from a standard-form design typed into a parallel-form library give a different controller.",
      "**Adding anti-windup but saturating somewhere else.** The saturation in the controller must match the real limit (supply voltage, maximum duty).",
    ],
    practice: {
      kind: "bench",
      task: "Design a PI speed controller for your motor from its model and compare predicted with measured response.",
      steps: [
        "From your identified Km and τm, design PI by zero cancellation for τcl = τm/3. Check that Kp times your largest planned step stays below the supply voltage.",
        "Simulate the closed loop (python-control) and note the predicted rise time and final speed.",
        "Implement it at 200 Hz with back-calculation anti-windup (the sketch in the next lesson is a template).",
        "Apply steps of 50 % and 100 % of the speed range. Overlay predicted and measured speed.",
        "Disable anti-windup and repeat the large step. Measure the change in overshoot.",
      ],
    },
    quiz: [
      {
        q: "A plant G = 20/(0.5s + 1) is to be controlled by PI with zero cancellation and τcl = 0.1 s. What are Kp and Ki?",
        options: ["Kp = 0.25, Ki = 0.5", "Kp = 0.25, Ki = 2.5", "Kp = 2.5, Ki = 5", "Kp = 0.1, Ki = 0.2"],
        answer: 0,
        why: "Kp = τ/(K·τcl) = 0.5/(20 × 0.1) = 0.25. Ti = τ = 0.5 s, so Ki = Kp/Ti = 0.25/0.5 = 0.5.",
      },
      {
        q: "After zero cancellation, what does the loop transfer function L(s) look like?",
        options: ["A second-order system with ζ = 0.7", "A pure integrator Kp·Km/(τm s)", "A constant gain", "An unstable pole"],
        answer: 1,
        why: "The PI zero cancels the plant pole and leaves the PI integrator: L = Kp·Km/(τm s). The closed loop is then first order.",
      },
      {
        q: "What does back-calculation anti-windup do while the output is saturated?",
        options: [
          "Resets the integrator to zero",
          "Doubles the proportional gain",
          "Feeds (u_saturated - u_unsaturated) into the integrator so it is driven towards the value that just saturates the output",
          "Turns off the derivative term",
        ],
        answer: 2,
        why: "The term Kaw·(u - u_unsat) is negative when the output is clipped high, pulling the integrator down instead of letting it grow.",
      },
      {
        q: "Why is the derivative term filtered with Kd·s/(Tf·s + 1)?",
        options: [
          "To make the controller type 2",
          "To remove steady-state error",
          "To cancel the motor pole",
          "Because a pure derivative has gain rising without limit with frequency and amplifies sensor noise",
        ],
        answer: 3,
        why: "The filter caps the high-frequency gain at Kd/Tf = Kp·N while leaving the derivative action intact around crossover.",
      },
      {
        q: "With PD control of the motor position, τm s² + (1 + Km·Kd)s + Km·Kp = 0. What does increasing Kd alone do?",
        options: [
          "Raises ωn and lowers ζ",
          "Raises ζ without changing ωn",
          "Removes the steady-state error to a ramp",
          "Makes the loop unstable",
        ],
        answer: 1,
        why: "ωn² = Km·Kp/τm does not involve Kd, while 2ζωn = (1 + Km·Kd)/τm grows with Kd. So damping rises at constant ωn.",
      },
    ],
  },

  "a8-digital-cascade-state-space": {
    id: "a8-digital-cascade-state-space",
    outcomes: [
      "Choose a sampling rate and discretise a controller with backward Euler or Tustin",
      "Explain the z-transform and where discrete poles must lie for stability",
      "Write a fixed-rate PID in C with anti-windup and a filtered derivative",
      "Structure cascade and feed-forward loops and write a system in state-space form",
    ],
    blocks: [
      { t: "h", text: "The controller is a program" },
      { t: "p", text: "Everything so far has been continuous time: s, integrals, derivatives. Your controller runs on a microcontroller that reads the encoder, computes, and writes a PWM value once every Ts seconds. Between samples it does nothing. If you choose Ts well and convert the design properly, the digital controller behaves almost exactly like the continuous one. If you do not, it adds delay, aliasing and jitter that no amount of gain tuning can fix. This lesson closes the module: digital implementation, the two loop structures every real motion system uses (cascade and feed-forward), a first look at state-space, and the exit project." },

      { t: "h", text: "Sampling and choosing Ts" },
      { t: "list", items: [
        "**Rule of thumb:** sample 10 to 20 times faster than the closed-loop bandwidth. The 30 ms speed loop has bandwidth 1/0.03 ≈ 33 rad/s (5.3 Hz), so 100 Hz to 200 Hz is enough; this lesson uses 200 Hz (Ts = 5 ms).",
        "**Delay budget:** a sample-and-hold adds about Ts/2 of delay, and computation adds up to Ts more. Those cost phase margin as the last two lessons showed.",
        "**Fixed rate matters.** The discrete gains assume a constant Ts. Jitter (a loop that runs whenever loop() gets round to it) changes the effective gains every sample. Schedule the loop from a timer or a fixed deadline, never with delay().",
        "**Anti-aliasing:** analogue measurements need a low-pass filter below half the sampling rate (module i8). Encoder counts do not alias, but speed computed from them is quantised: at 200 Hz with 1320 edges per revolution, one count per sample is 2π/1320 × 200 ≈ 0.95 rad/s.",
      ] },

      { t: "h", text: "Discretising: backward Euler and Tustin" },
      { t: "p", text: "Discretisation replaces s with an expression in the **shift operator** z, where z⁻¹ means \"the value one sample ago\". Two mappings cover most needs:" },
      { t: "formula", text: String.raw`backward Euler:  s ≈ (1 - z⁻¹) / Ts           (derivative = (x[k] - x[k-1]) / Ts)
Tustin:          s ≈ (2/Ts)·(1 - z⁻¹)/(1 + z⁻¹)   (trapezoidal integration)

integrator Ki/s:
backward Euler:  I[k] = I[k-1] + Ki·Ts·e[k]
Tustin:          I[k] = I[k-1] + Ki·(Ts/2)·(e[k] + e[k-1])

filtered derivative Kd·s/(Tf s + 1), backward Euler, on measurement y:
D[k] = (Tf/(Tf + Ts))·D[k-1] - (Kd/(Tf + Ts))·(y[k] - y[k-1])`, caption: "Both map a stable continuous system to a stable discrete one." },
      { t: "p", text: "Backward Euler is simple and always stable, and for the derivative filter it is the usual choice because it never produces the high-frequency ringing that Tustin can (Tustin maps s = ∞ to z = -1, the Nyquist frequency, where a derivative filter can chatter). Tustin is more accurate for the integrator and preserves frequency response best below the Nyquist frequency. At 20 or more samples per closed-loop time constant the difference is small, so pick the simplest correct form." },

      { t: "h", text: "The z-transform in outline" },
      { t: "p", text: "The z-transform is the discrete counterpart of the Laplace transform: X(z) = Σ x[k]·z⁻ᵏ. A difference equation becomes a ratio of polynomials in z, just as a differential equation became one in s. The exact relation between the two planes for sampled signals is **z = e^(sTs)**. It maps the left half of the s-plane into the inside of the unit circle, so:" },
      { t: "list", items: [
        "A discrete system is stable when all its poles satisfy **|z| < 1**.",
        "A continuous pole at s = -a appears at z = e^(-aTs). The motor pole -10.5 at Ts = 5 ms sits at z = e^(-0.0525) = 0.949.",
        "Poles near z = 1 are slow; poles near the origin are fast; poles on the negative real axis alternate sign every sample (ringing at the Nyquist frequency).",
        "The discrete step response of x[k+1] = a·x[k] + c·u[k] settles to c/(1 - a), the discrete final value.",
      ] },

      { t: "h", text: "A fixed-rate PI controller in C" },
      { t: "p", text: "The sketch below is a complete speed controller for an Arduino Uno with a TB6612FNG or similar driver: encoder A on D2 (interrupt), encoder B on D4, PWM on D9, direction on D8 and D7. It uses the zero-cancellation gains from the last lesson, a 5 ms fixed-deadline schedule, saturation at the supply voltage and back-calculation anti-windup. It compiles for `arduino:avr:uno` (core 1.8.8)." },
      { t: "snippet", lang: "cpp", code: String.raw`// Fixed-rate PI speed controller for a DC motor with an encoder (Arduino Uno).
// Encoder channel A on D2 (INT0), channel B on D4. Driver: PWM on D9, direction on D8
// (for example a TB6612FNG: PWMA = D9, AIN1 = D8, AIN2 = D7 held opposite to D8).
const uint8_t PIN_ENC_A = 2, PIN_ENC_B = 4, PIN_PWM = 9, PIN_DIR1 = 8, PIN_DIR2 = 7;

const float COUNTS_PER_REV = 1320.0f;   // rising edges of channel A per output revolution (yours)
const float TS = 0.005f;                // sample time: 5 ms, 200 Hz
const uint32_t TS_US = 5000;
const float V_SUPPLY = 6.0f;            // motor supply, volts (measure it)

// Gains from the design in this module (PI with zero cancellation, tau_cl = 30 ms).
const float KP = 0.0667f;               // V per (rad/s)
const float KI = 0.700f;                // V per rad
const float KAW = 1.0f / 0.0952f;       // back-calculation gain, about 1 / Ti

volatile long encCount = 0;

void onEncA() {
  // One edge of A per count: B tells the direction.
  if (digitalRead(PIN_ENC_B)) encCount--; else encCount++;
}

void setMotorVolts(float u) {
  bool fwd = u >= 0.0f;
  digitalWrite(PIN_DIR1, fwd ? HIGH : LOW);
  digitalWrite(PIN_DIR2, fwd ? LOW : HIGH);
  float duty = fabs(u) / V_SUPPLY;
  if (duty > 1.0f) duty = 1.0f;
  analogWrite(PIN_PWM, (int)(duty * 255.0f + 0.5f));
}

float integ = 0.0f;       // integrator state, volts
long lastCount = 0;
uint32_t nextTick;
float setpoint = 150.0f;  // rad/s

void setup() {
  pinMode(PIN_ENC_A, INPUT_PULLUP);
  pinMode(PIN_ENC_B, INPUT_PULLUP);
  pinMode(PIN_PWM, OUTPUT);
  pinMode(PIN_DIR1, OUTPUT);
  pinMode(PIN_DIR2, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(PIN_ENC_A), onEncA, RISING);
  Serial.begin(115200);
  nextTick = micros();
}

void loop() {
  if ((int32_t)(micros() - nextTick) < 0) return;   // wait for the next sample instant
  nextTick += TS_US;                                // fixed rate, no drift

  noInterrupts();
  long c = encCount;
  interrupts();
  long dc = c - lastCount;
  lastCount = c;
  float omega = (dc / COUNTS_PER_REV) * 2.0f * PI / TS;   // rad/s

  float e = setpoint - omega;
  float uUnsat = KP * e + integ;
  float u = constrain(uUnsat, -V_SUPPLY, V_SUPPLY);
  // Backward Euler integrator with back-calculation anti-windup.
  integ += TS * (KI * e + KAW * (u - uUnsat));
  setMotorVolts(u);

  static uint8_t div = 0;
  if (++div >= 20) {           // print at 10 Hz, not every sample
    div = 0;
    Serial.print(setpoint); Serial.print(' ');
    Serial.print(omega);    Serial.print(' ');
    Serial.println(u);
  }
}`, caption: "Compiled with arduino-cli for arduino:avr:uno: 4932 bytes of flash." },
      { t: "p", text: "Points worth noticing. The encoder count is copied with interrupts disabled, because a `long` is four bytes and the AVR reads it one byte at a time. `nextTick += TS_US` keeps the average rate exact even if one iteration runs late. Serial printing is decimated to 10 Hz because printing every sample at 115200 baud would take most of the 5 ms. On an ESP32 the same code runs unchanged with pin numbers changed (for example GPIO 18 and 19 for the encoder, GPIO 25 for PWM), or you can move the control step into a FreeRTOS task released by `vTaskDelayUntil` for a tighter schedule." },
      { t: "note", kind: "safety", text: "Test new control code with the wheels off the ground and a hand near the power switch. A sign error in the feedback (encoder wired backwards) turns negative feedback into positive feedback, and the motor runs to full speed instantly." },

      { t: "h", text: "Cascade control" },
      { t: "p", text: "Position control of a motor is almost always built as loops inside loops. The inner loop controls something fast (current or speed); the outer loop controls the slow quantity you care about (position) by commanding the inner loop's setpoint." },
      { t: "diagram", text: String.raw`
 θref ─►(+)─► C_pos ─ ωref ─►(+)─► C_speed ─ V ─► motor ─┬─ ω ─► 1/s ─┬─► θ
         ▲-                    ▲-                        │             │
         │                     └─────────────────────────┘             │
         └─────────────────────────────────────────────────────────────┘`, caption: "Outer position loop commanding an inner speed loop." },
      { t: "list", items: [
        "The inner loop rejects disturbances (supply sag, friction changes) before they reach position.",
        "The inner loop can be saturated on purpose: limiting ωref limits the robot's top speed safely.",
        "**Tune inside out.** Design and test the inner loop first. Then treat it as a first-order block with τcl and design the outer loop around it.",
        "**Separate the bandwidths** by a factor of 3 to 10: with τcl = 30 ms inside, an outer P loop with crossover about 5 to 10 rad/s is safe.",
      ] },
      { t: "p", text: "Example: with the inner loop ω/ωref = 1/(0.03s + 1), an outer P controller ωref = Kθ·(θref - θ) gives θ/θref = Kθ/(0.03s² + s + Kθ). For ζ = 0.7: ωn² = Kθ/0.03 and 2ζωn = 1/0.03 = 33.3, so ωn = 23.8 rad/s and Kθ = 0.03 × 23.8² = 17 (rad/s) per rad. Type 1 again, because position integrates speed. This is the aggressive end: the outer crossover lands near 15 rad/s, only about twice below the inner 33 rad/s, so on a real robot start with half this Kθ to keep the bandwidths properly separated." },

      { t: "h", text: "Feed-forward" },
      { t: "p", text: "Feedback reacts to error after it appears. **Feed-forward** acts on what you already know: the setpoint and measurable disturbances. For the speed loop, the model says a steady speed ωref needs V = ωref/Km, plus a friction offset to overcome the dead zone. Add that directly to the controller output, and the PI only has to correct the small remainder:" },
      { t: "formula", text: String.raw`u = u_PI + ωref / Km + Vc·sign(ωref)         (static and friction feed-forward)
u = u_PI + (τm·dωref/dt + ωref) / Km          (inverse of the first-order model)`, caption: "Feed-forward does not change stability: it is outside the loop." },
      { t: "p", text: "Feed-forward cannot make an unstable loop stable, and an error in Km only leaves a residual for the feedback to clean up. Robot motion stacks use it everywhere: a trajectory generator produces position, velocity and acceleration together, and velocity and acceleration go straight to the motor command, while feedback handles the error. Gravity compensation on a robot arm is feed-forward of a measured disturbance." },

      { t: "h", text: "State-space in outline" },
      { t: "p", text: "Transfer functions describe one input and one output. State-space describes a system by a vector of internal variables, the **state** x, that summarises everything about its past needed to predict its future. For a linear system:" },
      { t: "formula", text: String.raw`dx/dt = A·x + B·u
    y = C·x + D·u

DC motor, x = [θ, ω, i]ᵀ, u = V, y = θ:

     | 0     1       0    |        |  0  |
A =  | 0   -b/J     K/J   |   B =  |  0  |    C = | 1  0  0 |,  D = 0
     | 0   -K/L    -R/L   |        | 1/L |`, caption: "Each row is one of the motor equations from the first lesson." },
      { t: "list", items: [
        "The eigenvalues of A are the poles. For the motor: 0 (the position integrator), about -10.5 and -3990.",
        "The transfer function is C(sI - A)⁻¹B + D. State-space and transfer functions describe the same linear system.",
        "State feedback u = -K·x places all poles at once (pole placement in full generality), and LQR chooses K by minimising a quadratic cost of error and effort.",
        "The state is often not measured directly: the current, or the speed, must be estimated. That is the job of an **observer**, and the optimal observer under Gaussian noise is the Kalman filter of module a9.",
        "State-space extends naturally to many inputs and outputs (a quadrotor, a two-wheel balancing robot) where transfer functions become unwieldy.",
      ] },

      { t: "h", text: "Exit project" },
      { t: "p", text: "Design a motor speed or position controller from a model, then compare predicted and measured responses. Identify Km, τm and the dead zone (lesson 1); design PI speed control by zero cancellation, checking the voltage needed (lesson 4); verify stability margins including sampling delay (lesson 3); implement it at a fixed rate with anti-windup (this lesson); then optionally add an outer position loop and feed-forward. Your report should overlay predicted and measured step responses at two step sizes and explain every visible difference." },

      { t: "deep", title: "Exact discretisation and the zero-order hold", blocks: [
        { t: "p", text: "Euler and Tustin are approximations used for controllers. For plants, there is an exact method: if the input is held constant between samples (a zero-order hold, which is what PWM updated once per period does), the continuous system x' = Ax + Bu becomes exactly x[k+1] = Ad·x[k] + Bd·u[k], with Ad = e^(A·Ts) and Bd = ∫₀^Ts e^(Aτ)dτ·B." },
        { t: "formula", text: String.raw`first-order motor, Ts = 5 ms:
a = e^(-Ts/τm) = e^(-0.005/0.0952) = 0.9488
ω[k+1] = 0.9488·ω[k] + 47.6 × (1 - 0.9488)·V[k]
       = 0.9488·ω[k] + 2.44·V[k]`, caption: "This is the model used for least-squares identification in lesson 1, and the predict step of a Kalman filter." },
        { t: "p", text: "In python-control, ct.sample_system(G, Ts, method=\"zoh\") does this, and method=\"tustin\" or \"backward_diff\" give the approximations. Comparing the discrete loop's poles against |z| < 1 is the digital version of the Routh test." },
      ] },
      { t: "deep", title: "Fixed-point PID for small microcontrollers", blocks: [
        { t: "p", text: "The Uno has no floating-point hardware: each float multiply takes about 7 µs to 10 µs in software. The PI above uses about ten float operations per sample, well under 0.2 ms, so float is fine at 200 Hz. At 5 kHz to 20 kHz (current loops) you would use fixed-point: store gains as integers scaled by 2¹⁶, multiply into a 32-bit accumulator, and shift right by 16." },
        { t: "p", text: "Two traps. Overflow: Kp × e must fit in 32 bits, so bound e before multiplying and saturate the integrator in integer units. Resolution: Ki × Ts can be so small that Ki·Ts·e rounds to zero for small errors, and the integrator stops working near the setpoint. Keep the integrator in a wider type or with more fractional bits than the output." },
      ] },
      { t: "deep", title: "Controllability, observability and LQR in a paragraph each", blocks: [
        { t: "p", text: "A system is **controllable** if the input can drive the state anywhere; the test is that the matrix [B, AB, A²B, ...] has full rank. Only then can state feedback place every pole. It is **observable** if the state can be reconstructed from the output; the test is that [C; CA; CA²; ...] has full rank. Only then can an observer or Kalman filter estimate every state." },
        { t: "p", text: "**LQR** chooses u = -Kx to minimise J = ∫(xᵀQx + uᵀRu)dt. Large Q penalises error, large R penalises effort, and K comes from solving an algebraic Riccati equation (control.lqr in Python). It guarantees at least 60° phase margin at the plant input, and the gain there can rise without limit or fall to one half (-6 dB) before instability, which is one reason it is the default first design for balancing robots and drones. The same Riccati equation, transposed, gives the steady-state Kalman gain: control and estimation are duals." },
      ] },
    ],
    mistakes: [
      "**Running the control loop at a variable rate.** Gains tuned for 5 ms behave differently at 7 ms; schedule from a deadline or timer.",
      "**Reading a multi-byte counter shared with an interrupt without protection.** The value can tear between bytes; disable interrupts for the copy.",
      "**Tuning the outer loop before the inner loop is right.** Cascade loops are tuned from the inside out.",
      "**Making outer and inner loops similar in speed.** Without bandwidth separation they interact and ring.",
      "**Using feed-forward to fix instability.** Feed-forward improves tracking only; stability comes from the feedback loop.",
      "**Printing every sample over Serial.** At 115200 baud the printing alone can exceed the sample period and break the fixed rate.",
    ],
    practice: {
      kind: "bench",
      task: "Build the exit project: a model-designed speed controller with predicted versus measured response.",
      steps: [
        "Wire motor, driver and encoder as in the sketch (Uno) or the equivalent GPIO pins on the ESP32 DevKit, encoder at 3.3 V on the ESP32. Wheels off the ground.",
        "Set COUNTS_PER_REV, V_SUPPLY, KP, KI and KAW from your own identification and design.",
        "Log setpoint, speed and voltage for steps of 30 % and 90 % of the top speed. Toggle the pin at each control step and confirm a steady 5 ms period on a scope or logic analyser.",
        "Simulate the same steps with the first-order model, the discrete PI and the saturation, and overlay simulation and measurement.",
        "Add static and friction feed-forward (ωref/Km + Vc). Report how much the PI output shrinks at steady state and how the rise time changes.",
        "Optional: add an outer position loop designed as in the cascade example and measure its overshoot.",
      ],
    },
    quiz: [
      {
        q: "A continuous pole at s = -20 rad/s is sampled at Ts = 10 ms. Where is the discrete pole?",
        options: ["z = -0.2", "z = 0.2", "z = 1.2", "z = e^(-0.2) ≈ 0.819"],
        answer: 3,
        why: "z = e^(sTs) = e^(-20 × 0.01) = e^(-0.2) ≈ 0.819, inside the unit circle as it should be for a stable pole.",
      },
      {
        q: "Which update implements the integrator Ki/s with backward Euler at sample time Ts?",
        options: [
          "I[k] = I[k-1] + Ki·Ts·e[k]",
          "I[k] = Ki·e[k]/Ts",
          "I[k] = I[k-1] + Ki·(e[k] - e[k-1])",
          "I[k] = Ki·Ts·(e[k] + e[k-1])",
        ],
        answer: 0,
        why: "Backward Euler approximates the integral by adding Ts times the current input each step. Tustin would average e[k] and e[k-1] with Ts/2.",
      },
      {
        q: "In a cascade position controller, which loop should you tune first and why?",
        options: [
          "The outer position loop, because position is what matters",
          "Both together, to save time",
          "The inner speed loop, because the outer loop's design assumes the inner loop's response",
          "Neither; cascade loops need no tuning",
        ],
        answer: 2,
        why: "The outer loop treats the closed inner loop as part of its plant, so the inner loop must be designed and verified first.",
      },
      {
        q: "A motor has Km = 50 (rad/s)/V. With static feed-forward, what voltage is added to the PI output for a setpoint of 200 rad/s?",
        options: ["0.25 V", "4 V", "10000 V", "50 V"],
        answer: 1,
        why: "Static feed-forward is ωref/Km = 200/50 = 4 V. The PI then only corrects the residual error.",
      },
      {
        q: "In the state-space model of the DC motor with x = [θ, ω, i], what are the eigenvalues of A?",
        options: [
          "The zeros of the transfer function",
          "The poles of the system: 0, about -10.5 and about -3990 rad/s",
          "The controller gains",
          "Always 1, because A is square",
        ],
        answer: 1,
        why: "The eigenvalues of A are the poles. The motor has the position integrator at 0 plus the mechanical and electrical poles found in lesson 1.",
      },
      {
        q: "Why is the loop scheduled with nextTick += TS_US rather than delay(5)?",
        options: [
          "delay() does not compile on the Uno",
          "It keeps the sample period constant on average regardless of how long the loop body takes, so the discrete gains stay valid",
          "It uses less power",
          "It makes the PWM frequency higher",
        ],
        answer: 1,
        why: "delay(5) adds 5 ms on top of the computation time, so the period drifts and varies. A fixed deadline keeps Ts exact on average.",
      },
    ],
  },
};

export default lessons;
