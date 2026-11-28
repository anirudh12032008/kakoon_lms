import type { ModuleContent } from "../model/curriculum";

/**
 * Module a9: State estimation and sensor fusion.
 * Builds on a8 (state-space models, observers) and i8 (complementary filter).
 * Every Python program here was run with Python 3 (pure Python, no numpy) and
 * the printed numbers are copied from those runs.
 */
const lessons: ModuleContent = {
  "a9-probability-and-the-bayes-filter": {
    id: "a9-probability-and-the-bayes-filter",
    outcomes: [
      "Describe sensor noise with a mean, a variance and a Gaussian density",
      "Read and build a covariance matrix, and propagate it through a linear map with F·P·Fᵀ",
      "Fuse two independent Gaussian estimates and explain why the result is more certain than either",
      "State the Bayes filter as a predict step and an update step, and run it by hand on a grid",
    ],
    blocks: [
      { t: "h", text: "Every sensor lies a little" },
      { t: "p", text: "In module i8 you read an MPU6050 and noticed two kinds of error: the accelerometer angle jitters from sample to sample, and the integrated gyro angle drifts slowly away. In a8 you designed state feedback and were told that the state often cannot be measured and must be **estimated**. This module is about that estimation. The question is always the same: given a model of how the system moves, and a stream of measurements that are each a little wrong, what is the best guess of the state now, and how sure are you of it?" },
      { t: "p", text: "The second half of that question matters as much as the first. A robot that thinks it is at x = 2.00 m is in a very different position from one that thinks it is at x = 2.00 m give or take 0.5 m. Estimation therefore carries two things forward in time: a best guess and a measure of uncertainty. Probability is the language for both." },

      { t: "h", text: "Mean, variance and the Gaussian" },
      { t: "p", text: "Take 1000 readings from an ultrasonic sensor pointed at a wall 1.000 m away. They scatter: 1.003, 0.998, 1.031, 0.991 and so on. The **mean** μ is the average, the **variance** σ² is the average squared distance from the mean, and the **standard deviation** σ is its square root, in the same units as the reading. If the mean is not the true value, the difference is a **bias**; calibration removes bias, filtering reduces random scatter. Keep these apart: no filter can remove a bias it does not know about." },
      { t: "formula", text: String.raw`μ  = (1/N) · Σ xᵢ
σ² = (1/N) · Σ (xᵢ - μ)²
p(x) = 1/(σ·√(2π)) · exp( -(x - μ)² / (2σ²) )`, caption: "Sample mean, sample variance and the Gaussian (normal) density N(μ, σ²)." },
      { t: "p", text: "Most sensor noise is close to **Gaussian**: the bell curve. The reason is the central limit theorem: when an error is the sum of many small independent effects (thermal noise, quantisation, tiny vibrations), the sum tends to a Gaussian whatever the individual effects look like. Two facts about the Gaussian are worth memorising. About 68% of readings fall within ±1σ of the mean, 95% within ±2σ and 99.7% within ±3σ. And a Gaussian is completely described by just two numbers, μ and σ². That second fact is why the Kalman filter can be so cheap: it only ever has to track a mean and a variance." },

      { t: "h", text: "Several variables: the covariance matrix" },
      { t: "p", text: "A robot state has several numbers: position and velocity, or x, y and heading. Their errors are often linked. If you overestimate the speed, you will soon overestimate the position too. The **covariance** of two variables measures that link: positive if their errors tend to have the same sign, negative if opposite, zero if unrelated. Collect the variances on the diagonal and the covariances off it, and you have the **covariance matrix** P, which is always symmetric and never has negative variances." },
      { t: "formula", text: String.raw`cov(a, b) = average of (a - μa)·(b - μb)

P = | var(p)     cov(p, v) |
    | cov(v, p)  var(v)    |

correlation  ρ = cov(p, v) / (σp · σv),   -1 ≤ ρ ≤ 1`, caption: "Covariance matrix of a position/velocity state." },
      { t: "p", text: "Geometrically, a two-dimensional Gaussian is a hill whose contour lines are ellipses. The diagonal of P sets how wide the ellipse is along each axis; the off-diagonal term tilts it. A tilted ellipse says: I do not know p or v very well separately, but I know a combination of them quite well." },

      { t: "h", text: "Pushing uncertainty through a linear model" },
      { t: "p", text: "Suppose a state x has mean x̂ and covariance P, and you apply a linear map y = F·x (for example, one time step of a motion model). The new mean is simply F·x̂. The new covariance is F·P·Fᵀ. In one dimension that is the familiar rule that multiplying a variable by a scales its variance by a². Add independent noise w with covariance Q, and the covariances add, because independent variances add." },
      { t: "formula", text: String.raw`y = F·x + w,   w ~ N(0, Q)
mean:        ŷ = F·x̂
covariance:  Py = F·P·Fᵀ + Q`, caption: "The single most important formula in this module." },
      { t: "p", text: "Worked example. A trolley has position p and velocity v. You know p to σ = 0.1 m (variance 0.01 m²) and v to σ = 0.2 m/s (variance 0.04 m²/s²), uncorrelated. Predict half a second ahead with constant velocity: p' = p + 0.5·v, v' = v." },
      { t: "formula", text: String.raw`F = | 1  0.5 |      P = | 0.01  0    |
    | 0  1   |          | 0     0.04 |

F·P   = | 0.01  0.02 |
        | 0     0.04 |

F·P·Fᵀ = | 0.01 + 0.25·0.04   0.02 |  =  | 0.02  0.02 |
         | 0.02              0.04 |     | 0.02  0.04 |`, caption: "Position variance doubles to 0.02 m² (σ ≈ 0.141 m), and a positive correlation appears." },
      { t: "p", text: "Check: var(p') = var(p) + 0.5²·var(v) = 0.01 + 0.25 × 0.04 = 0.02, and cov(p', v') = 0.5·var(v) = 0.02. Notice the two effects of prediction. Uncertainty **grows**, and the state variables become **correlated**: from now on a measurement of position alone will also correct velocity, through that off-diagonal 0.02. That is how a Kalman filter estimates a speed it never measures." },

      { t: "h", text: "Fusing two estimates" },
      { t: "p", text: "Two thermometers read a water tank: A says 20.0 °C with variance 4 (σ = 2), B says 22.0 °C with variance 1 (σ = 1). Treat each as a Gaussian belief and multiply them (the probability that both are right). The product of two Gaussians is another Gaussian whose mean is a variance-weighted average and whose variance is smaller than either." },
      { t: "formula", text: String.raw`μ  = (σB²·μA + σA²·μB) / (σA² + σB²)
   = (1·20.0 + 4·22.0) / 5 = 21.6 °C
σ² = σA²·σB² / (σA² + σB²) = 4·1 / 5 = 0.8   (σ ≈ 0.894)`, caption: "Product of N(20, 4) and N(22, 1)." },
      { t: "p", text: "Check: the result sits four fifths of the way towards the better sensor, and 1/0.8 = 1/4 + 1/1 = 1.25, so the information (inverse variances) simply adds. Fusing never makes you less certain, as long as the two errors are independent and the variances are honest. Write the same result as μ = μA + K·(μB - μA) with K = σA²/(σA² + σB²) = 0.8 and you are looking at the Kalman update in its smallest form." },

      { t: "h", text: "The Bayes filter" },
      { t: "p", text: "Everything in this module is a special case of one idea. Keep a **belief**, a probability distribution over the state. Then repeat two steps forever:" },
      { t: "list", ordered: true, items: [
        "**Predict** (motion update): the robot moved, so push the belief through the motion model. Uncertainty spreads out.",
        "**Update** (measurement update): a sensor reading arrived, so multiply the belief by the likelihood of that reading in each possible state, then normalise so it sums to 1. Uncertainty shrinks.",
      ] },
      { t: "formula", text: String.raw`predict:  bel⁻(x) = Σ over x'  p(x | x', u) · bel(x')
update:   bel(x)  = η · p(z | x) · bel⁻(x)      (η makes it sum to 1)`, caption: "u is the control or odometry, z the measurement. The update line is Bayes' rule." },
      { t: "diagram", text: String.raw`
        ┌──────────── bel(x) ◄──────────────┐
        ▼                                    │
 u ──► [ predict: motion model ] ──bel⁻──► [ update: × p(z|x), normalise ] ◄── z
        uncertainty grows                    uncertainty shrinks`, caption: "The recursive loop. Only the current belief is stored, never the full history." },
      { t: "p", text: "Worked example on a grid. A robot lives in a circular corridor of 5 cells; cells 1 and 3 have doors. Its door sensor says \"door\" with probability 0.8 in front of a door and 0.1 in front of a wall. It starts with no idea: 0.2 in every cell. It sees a door, then is commanded one cell right (which works 90% of the time; 10% it slips and stays), then sees a wall." },
      { t: "snippet", lang: "python", code: String.raw`"""Histogram (discrete Bayes) filter in a 5-cell circular corridor. Doors in cells 1 and 3."""
DOORS = [0, 1, 0, 1, 0]
P_HIT = {True: 0.8, False: 0.1}      # p(sense door | door), p(sense door | wall)


def update(bel, saw_door):
    like = [P_HIT[bool(d)] if saw_door else 1 - P_HIT[bool(d)] for d in DOORS]
    post = [b * l for b, l in zip(bel, like)]
    s = sum(post)
    return [p / s for p in post]


def predict(bel, p_move=0.9):
    """Command: move one cell right. 90 % it works, 10 % the wheels slip and it stays."""
    n = len(bel)
    return [p_move * bel[(i - 1) % n] + (1 - p_move) * bel[i] for i in range(n)]


bel = [0.2] * 5
for step, (op, arg) in enumerate([("u", True), ("p", None), ("u", False)], 1):
    bel = update(bel, arg) if op == "u" else predict(bel)
    print(step, op, [round(b, 3) for b in bel])
assert abs(sum(bel) - 1) < 1e-12`, caption: "bayes.py: a complete histogram filter." },
      { t: "snippet", lang: "text", code: String.raw`1 u [0.053, 0.421, 0.053, 0.421, 0.053]
2 p [0.053, 0.089, 0.384, 0.089, 0.384]
3 u [0.061, 0.023, 0.446, 0.023, 0.446]`, caption: "Output. After the door reading the two door cells are favoured; after moving and seeing a wall the robot is most likely in cell 2 or 4." },
      { t: "p", text: "Check step 1 by hand: door cells get 0.2 × 0.8 = 0.16, wall cells 0.2 × 0.1 = 0.02; the total is 2 × 0.16 + 3 × 0.02 = 0.38, so a door cell has 0.16/0.38 = 0.421 and a wall cell 0.02/0.38 = 0.053. The corridor is symmetric, so cells 2 and 4 stay tied: no sensor sequence can separate places that look identical. That is a real limitation called **ambiguity**, and later modules (a13) handle it with particle filters." },
      { t: "p", text: "A grid works for one dimension, but the number of cells explodes with more state variables: 100 cells per axis in 6 dimensions is 10¹² cells. The Kalman filter avoids the grid by assuming that every belief is Gaussian and every model linear. Then the predict step is F·P·Fᵀ + Q, the update is the Gaussian product, and the whole belief is a mean vector and a covariance matrix." },
      { t: "note", kind: "tip", text: "When you debug any filter, ask which step is wrong. If the estimate lags or overshoots after motion, suspect the motion model or Q. If it jumps or ignores readings, suspect the measurement model or R." },

      { t: "deep", title: "Why the covariance propagates as F·P·Fᵀ", blocks: [
        { t: "p", text: "Covariance is defined as P = E[(x - x̂)(x - x̂)ᵀ], where E is the expectation (average over many trials). For y = F·x the error is y - ŷ = F·(x - x̂). Substituting:" },
        { t: "formula", text: String.raw`Py = E[ F(x - x̂) (F(x - x̂))ᵀ ]
   = E[ F (x - x̂)(x - x̂)ᵀ Fᵀ ]
   = F · E[(x - x̂)(x - x̂)ᵀ] · Fᵀ
   = F · P · Fᵀ` },
        { t: "p", text: "F comes out of the expectation because it is a constant matrix. If you add w that is independent of x, the cross terms E[(x - x̂)wᵀ] are zero and only Q remains, giving F·P·Fᵀ + Q. For a non-linear map, this result is only approximately true, using the Jacobian in place of F: that is the extended Kalman filter of lesson 3." },
        { t: "p", text: "A linear map of a Gaussian is exactly Gaussian. A non-linear map of a Gaussian is not: push a round blob of heading uncertainty through x = cos θ and you get a banana. This is the fundamental reason the Kalman filter is exact for linear systems and only approximate otherwise." },
      ] },
      { t: "deep", title: "Mahalanobis distance and the confidence ellipse", blocks: [
        { t: "p", text: "How far is a point from a Gaussian, in units of its own uncertainty? In one dimension, |x - μ|/σ. In several, the **Mahalanobis distance** d² = (x - μ)ᵀ·P⁻¹·(x - μ). For a true Gaussian in n dimensions, d² follows a chi-square distribution with n degrees of freedom. In 2 D the 95% ellipse is d² ≤ 5.99, and in 3 D it is d² ≤ 7.81. Filters use this to reject outliers (**gating**): if a measurement is too many Mahalanobis units from the prediction, it is probably a reflection or a glitch, not information. You will meet d² again as NEES and NIS in lesson 5." },
        { t: "p", text: "The ellipse axes are the eigenvectors of P and their half-lengths are √(5.99·λ) for the eigenvalues λ. For the trolley example P = [[0.02, 0.02], [0.02, 0.04]]: λ = 0.03 ± √(0.01² + 0.02²) = 0.03 ± 0.02236, so 0.0524 and 0.0076. The long axis has half-length √(5.99 × 0.0524) ≈ 0.56 and the short √(5.99 × 0.0076) ≈ 0.21 (in mixed units of m and m/s, which is why you usually plot position ellipses separately)." },
      ] },
    ],
    mistakes: [
      "Confusing standard deviation and variance: R in a filter is a variance (σ²), so a 3 cm sensor has R = 0.0009 m², not 0.03.",
      "Treating a constant offset as noise. Averaging and filtering reduce scatter; only calibration removes a bias.",
      "Forgetting that prediction adds uncertainty. If P never grows between measurements, the filter will become overconfident and stop listening to sensors.",
      "Fusing two readings that share an error source (two sensors on the same flexing bracket, or one reading used twice) as if they were independent: the fused variance is then far too small.",
      "Not normalising in a discrete Bayes filter, so the belief no longer sums to 1 and later comparisons are meaningless.",
    ],
    quiz: [
      {
        q: "A range sensor has σ = 0.05 m. What value of variance R goes into a filter?",
        options: ["0.05 m²", "0.0025 m²", "0.2236 m²", "0.1 m²"],
        answer: 1,
        why: "Variance is σ² = 0.05² = 0.0025 m². Filters work with variances and covariances, not standard deviations.",
      },
      {
        q: "x = [p, v] has P = diag(0.01, 0.04). After p' = p + 0.5·v, v' = v, what is var(p')?",
        options: ["0.01", "0.03", "0.02", "0.05"],
        answer: 2,
        why: "From F·P·Fᵀ: var(p') = 0.01 + 0.5² × 0.04 = 0.02 m².",
      },
      {
        q: "You fuse N(20, 4) and N(22, 1). Which result is right?",
        options: ["Mean 21.0, variance 2.5", "Mean 21.6, variance 0.8", "Mean 20.4, variance 0.8", "Mean 21.6, variance 5"],
        answer: 1,
        why: "Weighted mean (1×20 + 4×22)/5 = 21.6 and variance 4×1/5 = 0.8, smaller than either input.",
      },
      {
        q: "In the Bayes filter, what does the update step do to the belief?",
        options: [
          "Shifts it by the commanded motion",
          "Multiplies it by the likelihood of the measurement in each state and normalises",
          "Adds the process noise Q",
          "Resets it to uniform",
        ],
        answer: 1,
        why: "Update is Bayes' rule: posterior ∝ likelihood × prior, then normalise so it sums to 1.",
      },
      {
        q: "Why does a position-only measurement in a Kalman filter also correct the velocity estimate?",
        options: [
          "Because velocity is measured by the same sensor",
          "It does not; velocity is never corrected",
          "Because prediction creates a covariance between position and velocity, so information flows through the off-diagonal term",
          "Because the filter differentiates the measurement",
        ],
        answer: 2,
        why: "F·P·Fᵀ makes cov(p, v) non-zero. The update uses that correlation to adjust v whenever p is corrected.",
      },
    ],
    practice: {
      kind: "bench",
      task: "Characterise a real sensor's noise and fuse two sensors by hand.",
      steps: [
        "Log 500 readings from an HC-SR04 (or any distance or temperature sensor) at a fixed target and compute the mean, σ and σ² in Python.",
        "Measure the true distance with a ruler and report the bias separately from σ.",
        "Plot a histogram and check that about 68% of readings fall within ±1σ.",
        "Repeat with a second sensor (or the same one at a different range), then fuse the two means with the variance-weighted formula and confirm the fused σ is smaller than both.",
      ],
    },
  },

  "a9-the-kalman-filter": {
    id: "a9-the-kalman-filter",
    outcomes: [
      "Write the Kalman filter predict and update equations and explain each term",
      "Explain the Kalman gain as a ratio of prediction uncertainty to total uncertainty",
      "Run a 1-D Kalman filter step by step with real numbers",
      "Implement a position and velocity Kalman filter and tune Q and R from data",
    ],
    blocks: [
      { t: "h", text: "The linear Gaussian case" },
      { t: "p", text: "The Kalman filter (Rudolf Kálmán, 1960) is the Bayes filter for systems that are linear with Gaussian noise. Under those assumptions it is exactly optimal: no other estimator has a smaller mean squared error. It uses the state-space form from a8, now in discrete time and with noise added:" },
      { t: "formula", text: String.raw`x_k = F·x_(k-1) + B·u_k + w_k,     w ~ N(0, Q)   (process model)
z_k = H·x_k + v_k,                 v ~ N(0, R)   (measurement model)`, caption: "F: state transition, B: control input, H: maps state to what the sensor sees. Q: how much the model is wrong per step. R: sensor noise." },
      { t: "p", text: "The filter keeps an estimate x̂ and its covariance P, and cycles through the two Bayes steps, each now a few lines of matrix algebra." },
      { t: "formula", text: String.raw`PREDICT
x̂⁻ = F·x̂ + B·u
P⁻ = F·P·Fᵀ + Q

UPDATE
y  = z - H·x̂⁻             innovation: what the sensor says minus what we expected
S  = H·P⁻·Hᵀ + R           innovation covariance
K  = P⁻·Hᵀ·S⁻¹             Kalman gain
x̂  = x̂⁻ + K·y
P  = (I - K·H)·P⁻`, caption: "The whole Kalman filter. The superscript ⁻ marks the predicted (prior) values." },
      { t: "h", text: "What the gain means" },
      { t: "p", text: "In one dimension with H = 1 the gain is K = P⁻/(P⁻ + R): the share of the total uncertainty that belongs to the prediction. If the prediction is very uncertain (P⁻ ≫ R), K → 1 and the estimate jumps to the measurement. If the sensor is very noisy (R ≫ P⁻), K → 0 and the measurement is nearly ignored. The update x̂ = x̂⁻ + K·(z - x̂⁻) moves a fraction K of the way from prediction to measurement. That is exactly the Gaussian product from lesson 1, and exactly the shape of the complementary filter from i8, except that here the blend factor is computed every step from the uncertainties instead of being fixed." },
      { t: "p", text: "The innovation y deserves attention too. If the filter is working, the innovations look like white noise with covariance S: no trend, no pattern, about 95% within ±2√S. Innovations that drift one way mean the model is biased; innovations far bigger than √S mean R or Q is too small." },

      { t: "h", text: "A 1-D example, step by step" },
      { t: "p", text: "A float sensor measures the level of a water tank in cm. The level changes slowly and unpredictably, so the model is \"the level stays the same\" (F = 1, no input) with process noise Q = 0.1 cm² per step to allow for real change. The sensor has R = 1.0 cm² (σ = 1 cm). Start with a rough guess x̂ = 10.0 cm, P = 4.0 cm². Readings arrive: 11.2, 10.6, 11.0." },
      { t: "formula", text: String.raw`Step 1, z = 11.2
  predict:  x̂⁻ = 10.0          P⁻ = 4.0 + 0.1 = 4.1
  gain:     K = 4.1 / (4.1 + 1.0) = 0.8039
  update:   y = 11.2 - 10.0 = 1.2
            x̂ = 10.0 + 0.8039·1.2 = 10.9647
            P = (1 - 0.8039)·4.1 = 0.8039

Step 2, z = 10.6
  predict:  x̂⁻ = 10.9647       P⁻ = 0.8039 + 0.1 = 0.9039
  gain:     K = 0.9039 / 1.9039 = 0.4748
  update:   y = 10.6 - 10.9647 = -0.3647
            x̂ = 10.9647 - 0.4748·0.3647 = 10.7916
            P = 0.5252·0.9039 = 0.4748

Step 3, z = 11.0
  predict:  x̂⁻ = 10.7916       P⁻ = 0.5748
  gain:     K = 0.5748 / 1.5748 = 0.3650
  update:   x̂ = 10.7916 + 0.3650·0.2084 = 10.8676
            P = 0.3650` },
      { t: "p", text: "Check (Python, same equations): x̂ = 10.9647, 10.7916, 10.8676 and P = 0.8039, 0.4748, 0.3650. In 1-D with H = 1, P after the update equals K·R, which is why P and K come out numerically equal when R = 1. Watch the pattern: the first reading is trusted heavily because the initial guess was poor, then the gain falls as the filter becomes confident. It does not fall to zero, because Q keeps adding uncertainty. Iterating to convergence gives the **steady-state** values P⁻ = 0.3702, K = 0.2702: from then on every new reading moves the estimate about 27% of the way." },
      { t: "note", kind: "tip", text: "With constant F, H, Q and R the gain converges to a constant within a few dozen steps. On a small microcontroller you can precompute that steady-state gain and run a fixed-gain filter, which is just a well-chosen exponential average. You lose the fast start-up but save all the covariance arithmetic." },

      { t: "h", text: "Tuning Q and R" },
      { t: "p", text: "Only the ratio of Q to R matters for the estimate (scale both by 10 and K is unchanged), but their absolute sizes set P, and P is what you report as your uncertainty. Tune them in this order:" },
      { t: "list", ordered: true, items: [
        "**R from data.** Hold the system still and log the sensor. R is the variance of those readings. This is the easy one; do not guess it.",
        "**Q from physics.** Q describes what the model leaves out. For a constant-velocity model it is the size of the unmodelled accelerations: a robot that brakes at up to 1 m/s² needs σa around 0.5 to 1 m/s². Start there.",
        "**Then adjust Q by looking at innovations.** If the estimate lags real changes and innovations drift with the same sign, raise Q. If the estimate is jittery and follows every noisy reading, lower Q.",
      ] },
      { t: "table", head: ["Symptom", "Likely cause", "Fix"], rows: [
        ["Estimate lags behind real motion", "Q too small (model trusted too much)", "Increase Q"],
        ["Estimate as noisy as the raw sensor", "Q too large or R too small", "Decrease Q or measure R properly"],
        ["P keeps shrinking towards zero, filter stops correcting", "Q zero or far too small", "Give Q a realistic floor"],
        ["Innovations much bigger than √S", "R or Q too small: filter overconfident", "Increase the one that matches the error source"],
      ] },

      { t: "h", text: "Position and velocity from a range sensor" },
      { t: "p", text: "Now the full matrix version. A trolley on a track is watched by an ultrasonic sensor (σ = 3 cm) at 20 Hz. You want its position, cleaner than the raw sensor, and its velocity, which nothing measures. The state is x = [p, v]. The model is constant velocity, disturbed by a random acceleration a with σa = 0.5 m/s². Over one step of Δt that acceleration changes position by a·Δt²/2 and velocity by a·Δt, so the process noise is Q = G·σa²·Gᵀ with G = [Δt²/2, Δt]." },
      { t: "formula", text: String.raw`F = | 1  Δt |     H = | 1  0 |     R = σz² = 0.0009 m²
    | 0  1  |

Q = σa² · | Δt⁴/4  Δt³/2 |
          | Δt³/2  Δt²   |`, caption: "Constant-velocity model with white-acceleration process noise. Δt = 0.05 s." },
      { t: "p", text: "The program below writes out the 2×2 products by hand so you can see every term (and so it runs without numpy). It simulates a true trajectory, generates noisy readings, runs the filter and compares errors. It also computes the NEES consistency score used in lesson 5." },
      { t: "snippet", lang: "python", code: String.raw`"""Position/velocity Kalman filter with a noisy range sensor. Pure Python."""
import math
import random

DT = 0.05          # 20 Hz
SIGMA_Z = 0.03     # ultrasonic noise, m
SIGMA_A = 0.5      # random acceleration, m/s^2 (process noise)


def kf_step(x, P, z):
    """One predict + update. x = [p, v], P = 2x2 list."""
    # predict: x = F x, P = F P F^T + Q, with F = [[1, dt], [0, 1]]
    p, v = x[0] + DT * x[1], x[1]
    a, b, c, d = P[0][0], P[0][1], P[1][0], P[1][1]
    q = SIGMA_A ** 2
    P00 = a + DT * (b + c) + DT * DT * d + q * DT ** 4 / 4
    P01 = b + DT * d + q * DT ** 3 / 2
    P11 = d + q * DT ** 2
    # update with z = p + noise, H = [1, 0]
    S = P00 + SIGMA_Z ** 2
    K0, K1 = P00 / S, P01 / S
    y = z - p
    x = [p + K0 * y, v + K1 * y]
    P = [[(1 - K0) * P00, (1 - K0) * P01],
         [P01 - K1 * P00, P11 - K1 * P01]]
    return x, P


def run(seed, steps=200):
    rng = random.Random(seed)
    tp, tv = 0.0, 0.4
    x, P = [0.0, 0.0], [[1.0, 0.0], [0.0, 1.0]]
    se_z = se_p = se_v = nees = 0.0
    for _ in range(steps):
        acc = rng.gauss(0, SIGMA_A)
        tp += tv * DT + 0.5 * acc * DT * DT
        tv += acc * DT
        z = tp + rng.gauss(0, SIGMA_Z)
        x, P = kf_step(x, P, z)
        ep, ev = tp - x[0], tv - x[1]
        se_z += (z - tp) ** 2
        se_p += ep ** 2
        se_v += ev ** 2
        det = P[0][0] * P[1][1] - P[0][1] * P[1][0]
        nees += (P[1][1] * ep * ep - 2 * P[0][1] * ep * ev + P[0][0] * ev * ev) / det
    return (math.sqrt(se_z / steps), math.sqrt(se_p / steps),
            math.sqrt(se_v / steps), nees / steps, x, P)


if __name__ == "__main__":
    rz, rp, rv, nees, x, P = run(1)
    print(f"RMSE raw sensor   {rz*1000:.1f} mm")
    print(f"RMSE KF position  {rp*1000:.1f} mm")
    print(f"RMSE KF velocity  {rv:.3f} m/s")
    print(f"final P: P00={P[0][0]:.6f} P01={P[0][1]:.6f} P11={P[1][1]:.6f}")
    runs = [run(s)[3] for s in range(50)]
    print(f"mean NEES over 50 runs {sum(runs)/len(runs):.2f} (expect about 2)")
    assert rp < rz, "filter should beat the raw sensor"`, caption: "kf2.py: a complete position and velocity Kalman filter, with a self-check." },
      { t: "snippet", lang: "text", code: String.raw`RMSE raw sensor   29.5 mm
RMSE KF position  14.9 mm
RMSE KF velocity  0.107 m/s
final P: P00=0.000226 P01=0.000649 P11=0.004029
mean NEES over 50 runs 1.93 (expect about 2)`, caption: "Output. The filter halves the position error and produces a velocity estimate the sensor never gave." },
      { t: "p", text: "Check: the raw RMSE of 29.5 mm matches the sensor σ of 30 mm, as it should. The filter's own predicted position σ at the end is √0.000226 ≈ 15 mm, matching the measured 14.9 mm RMSE: the filter knows how good it is. Differentiating the raw readings instead to get velocity would give noise of about √2 × 0.03/0.05 ≈ 0.85 m/s, eight times worse than the 0.107 m/s the filter achieves." },
      { t: "note", kind: "warn", text: "Keep P symmetric and positive. Rounding in P = (I - KH)·P⁻ can slowly make P lose symmetry or even give a negative variance in single-precision float on a microcontroller. Use the Joseph form (Go deeper) or symmetrise with P = (P + Pᵀ)/2 after each update." },

      { t: "deep", title: "Derivation sketch of the Kalman gain", blocks: [
        { t: "p", text: "Look for the update x̂ = x̂⁻ + K·(z - H·x̂⁻) with the K that minimises the expected squared error, which is the trace of P (the sum of the variances). The error after the update is e = x - x̂ = (I - KH)·e⁻ - K·v. Because the prior error e⁻ and the measurement noise v are independent:" },
        { t: "formula", text: String.raw`P = (I - KH)·P⁻·(I - KH)ᵀ + K·R·Kᵀ          (Joseph form, valid for any K)

d trace(P) / dK = -2·(H·P⁻)ᵀ + 2·K·(H·P⁻·Hᵀ + R) = 0
K = P⁻·Hᵀ·(H·P⁻·Hᵀ + R)⁻¹ = P⁻·Hᵀ·S⁻¹

substitute back:  P = (I - KH)·P⁻` },
        { t: "p", text: "The short form P = (I - KH)P⁻ holds only for the optimal K. The Joseph form is valid for any gain and is numerically safer, because it is a sum of two symmetric positive terms; use it in float32 code. Under the Gaussian assumption the minimum-variance estimate is also the full Bayesian posterior; without the Gaussian assumption the Kalman filter is still the best **linear** estimator." },
      ] },
      { t: "deep", title: "Steady-state gain and the link to the complementary filter", blocks: [
        { t: "p", text: "In 1-D with F = H = 1, the steady state satisfies P⁻ = P⁻R/(P⁻ + R) + Q, a quadratic: (P⁻)² - Q·P⁻ - Q·R = 0, so P⁻ = (Q + √(Q² + 4QR))/2. With Q = 0.1, R = 1: P⁻ = (0.1 + √(0.01 + 0.4))/2 = (0.1 + 0.6403)/2 = 0.3702, and K = 0.3702/1.3702 = 0.2702, matching the iteration." },
        { t: "p", text: "A steady-state Kalman filter is a fixed linear filter. The i8 complementary filter angle = α(angle + ω·Δt) + (1 - α)·a is precisely a steady-state Kalman filter for the model \"angle integrates gyro rate\" with accelerometer measurement, with 1 - α playing the role of K. Choosing α = 0.98 is implicitly choosing a ratio of gyro noise to accelerometer noise. The Kalman filter tells you that ratio from measured variances instead of by feel, and it can also add the gyro bias as a state, which the complementary filter cannot." },
      ] },
      { t: "deep", title: "Running it on an ESP32: practical notes", blocks: [
        { t: "p", text: "The Python version is a reference. On the microcontroller the same equations run inside a fixed-rate loop, and most failures come from timing and number formats rather than from the maths." },
        { t: "list", items: [
          "Use `float` on the ESP32 (hardware single-precision FPU). `double` works but is done in software and is several times slower.",
          "Fix Δt from a timer, not from loop timing. If samples are irregular, compute F and Q from the measured Δt each step.",
          "Predict at the fast sensor rate; update only when a measurement arrives. Sensors at different rates simply mean different update calls with their own H and R.",
          "For more than 3 or 4 states, write small fixed-size matrix routines or use a library; avoid dynamic allocation in the loop.",
          "Log x̂, P diagonal and innovations over serial so you can tune offline in Python.",
        ] },
      ] },
    ],
    mistakes: [
      "Setting Q to zero because \"the model is right\". Every model is wrong; with Q = 0 the gain decays to zero and the filter stops listening to its sensors.",
      "Guessing R instead of measuring the sensor variance with the system at rest.",
      "Updating with a measurement that did not arrive (repeating the last value). Skip the update instead; the predict step handles gaps.",
      "Using the wrong H, for example a sensor that reports centimetres while the state is in metres, so the filter treats a unit error as a huge innovation.",
      "Letting P become asymmetric or negative through rounding, then wondering why the filter diverges after an hour.",
    ],
    quiz: [
      {
        q: "In 1-D with P⁻ = 3 and R = 1, what is the Kalman gain?",
        options: ["0.25", "0.33", "0.75", "3"],
        answer: 2,
        why: "K = P⁻/(P⁻ + R) = 3/4 = 0.75: the prediction is the more uncertain, so the measurement is trusted more.",
      },
      {
        q: "x̂⁻ = 10.0, P⁻ = 4.1, R = 1.0 and z = 11.2. What is the updated estimate?",
        options: ["10.24", "11.20", "10.96", "10.60"],
        answer: 2,
        why: "K = 4.1/5.1 = 0.804, x̂ = 10.0 + 0.804 × 1.2 = 10.96.",
      },
      {
        q: "Your position estimate trails behind the real trolley whenever it speeds up, and the innovations all have the same sign during each acceleration. What should you change?",
        options: ["Decrease Q", "Increase Q", "Increase R", "Remove the velocity state"],
        answer: 1,
        why: "The model is trusted too much. Increasing Q tells the filter that unmodelled accelerations happen, so it follows the measurements faster.",
      },
      {
        q: "What does the innovation covariance S = H·P⁻·Hᵀ + R represent?",
        options: [
          "The covariance of the state after the update",
          "The expected spread of (z - H·x̂⁻) if the filter is correct",
          "The process noise",
          "The gain",
        ],
        answer: 1,
        why: "S combines the prediction's uncertainty seen through H with sensor noise. Real innovations should match it; checking that is a key tuning test.",
      },
      {
        q: "If you multiply both Q and R by 10, what happens?",
        options: [
          "The estimate x̂ is unchanged but the reported uncertainty P is 10 times larger",
          "The filter becomes 10 times faster",
          "Both x̂ and P are unchanged",
          "The gain is 10 times larger",
        ],
        answer: 0,
        why: "Only the ratio sets K, so x̂ is unchanged (once the start-up transient has died away). P scales with them, so the stated confidence becomes wrong unless both are realistic.",
      },
      {
        q: "Why is the filter in kf2.py able to estimate velocity from position readings alone?",
        options: [
          "It differentiates the readings",
          "The constant-velocity model correlates p and v, and the gain K1 uses that correlation",
          "Velocity is in H",
          "Q contains the velocity",
        ],
        answer: 1,
        why: "H = [1, 0] measures only p, but P01 ≠ 0 so K1 = P01/S is non-zero and each position innovation corrects v.",
      },
    ],
    practice: {
      kind: "bench",
      task: "Filter a real ultrasonic sensor watching a moving object and tune the filter from data.",
      steps: [
        "Log HC-SR04 range at 20 Hz on an ESP32 while you slide a book slowly towards and away from it; also log 30 s with the book still.",
        "Compute R from the still segment.",
        "Feed the moving log through kf_step from kf2.py (read the CSV instead of simulating) with σa = 0.5 m/s².",
        "Plot raw, filtered position and estimated velocity. Repeat with σa = 0.05 and 5 and describe lag versus noise.",
        "Plot innovations with ±2√S bounds and count the fraction outside; aim for about 5%.",
      ],
    },
  },

  "a9-extended-kalman-filter": {
    id: "a9-extended-kalman-filter",
    outcomes: [
      "Explain why the Kalman filter needs linear models and how the EKF linearises",
      "Write the motion model of a differential-drive robot from wheel odometry and its Jacobians",
      "Derive the Jacobian of a range and bearing measurement to a known landmark",
      "Implement an EKF that corrects drifting odometry, handling angle wrap-around",
    ],
    blocks: [
      { t: "h", text: "When the model is not linear" },
      { t: "p", text: "A wheeled robot moving forward a distance d changes x by d·cos θ and y by d·sin θ. Those sines and cosines make the motion model non-linear. A range sensor that measures distance to a beacon computes √(Δx² + Δy²): non-linear again. The Kalman equations need F and H as matrices. The **extended Kalman filter** (EKF) keeps the non-linear functions for propagating the mean, and uses their **Jacobians** (matrices of partial derivatives, evaluated at the current estimate) for propagating the covariance. In effect it replaces the curve by its tangent at the point where you think you are." },
      { t: "formula", text: String.raw`x_k = f(x_(k-1), u_k) + w        z_k = h(x_k) + v

PREDICT
x̂⁻ = f(x̂, u)
F  = ∂f/∂x  at (x̂, u)          G = ∂f/∂u  at (x̂, u)
P⁻ = F·P·Fᵀ + G·M·Gᵀ            (M: covariance of the odometry inputs)

UPDATE
H  = ∂h/∂x  at x̂⁻
y  = z - h(x̂⁻)                  (wrap angles!)
S  = H·P⁻·Hᵀ + R,   K = P⁻·Hᵀ·S⁻¹
x̂  = x̂⁻ + K·y,     P = (I - K·H)·P⁻`, caption: "The EKF. Same shape as the Kalman filter; f and h for the means, Jacobians for the covariances." },
      { t: "p", text: "A Jacobian is just \"how much each output changes per unit change of each input\". Row i, column j of ∂f/∂x is ∂fᵢ/∂xⱼ. For a 3-state robot F is 3×3." },

      { t: "h", text: "Differential-drive odometry as a motion model" },
      { t: "p", text: "From a8 and i12 you have wheel encoders. Each step, the left and right wheel travel distances dL and dR give a forward speed v = (dR + dL)/(2Δt) and turn rate ω = (dR - dL)/(b·Δt), with b the wheel separation. Treat v and ω as noisy inputs (they come from slipping wheels and quantised encoders, not from a perfect command). With state x = [x, y, θ] and a short step Δt:" },
      { t: "formula", text: String.raw`f:   x' = x + v·Δt·cos θ
     y' = y + v·Δt·sin θ
     θ' = θ + ω·Δt

F = ∂f/∂x = | 1  0  -v·Δt·sin θ |      G = ∂f/∂u = | Δt·cos θ   0  |
            | 0  1   v·Δt·cos θ |                  | Δt·sin θ   0  |
            | 0  0   1          |                  | 0          Δt |

M = | σv²  0   |
    | 0    σω² |`, caption: "Jacobians of the odometry model. Only the θ column of F is interesting: a heading error turns into a sideways position error." },
      { t: "p", text: "Read F's third column: an uncertainty in heading becomes position uncertainty perpendicular to the direction of travel, growing with v·Δt each step. That is why odometry error ellipses grow sideways into a banana as a robot drives: heading error is the killer, and a robot that has driven 10 m with a 2° heading error is about 0.35 m off sideways." },
      { t: "note", kind: "tip", text: "The term G·M·Gᵀ is the physically meaningful way to build Q for odometry: you state noise in the quantities you understand (wheel speed, turn rate) and the Jacobian G converts them into state space for the current heading." },

      { t: "h", text: "Correction from a landmark: range and bearing" },
      { t: "p", text: "Odometry alone drifts without bound. You need a measurement of something fixed in the world. Suppose a sensor (a camera seeing an ArUco marker, or a LiDAR seeing a reflector) gives the **range** r and **bearing** φ to a landmark at a known position (mx, my). Let dx = mx - x, dy = my - y and q = dx² + dy²." },
      { t: "formula", text: String.raw`h(x) = | r |  = | √q                    |
       | φ |    | atan2(dy, dx) - θ     |

H = ∂h/∂x = | -dx/√q   -dy/√q    0 |
            |  dy/q    -dx/q    -1 |`, caption: "Measurement model and Jacobian for range and bearing." },
      { t: "p", text: "Check the Jacobian numerically: at x = [0.5, 0.2, 0.3] with the landmark at (2.0, 3.0), dx = 1.5, dy = 2.8. The analytic H gives first row [-0.4722, -0.8815, 0] and second row [0.2775, -0.1487, -1]. A finite-difference check (perturb each state by 10⁻⁶ and divide) gives the same values to 6 digits. Always do this check: a wrong sign in a Jacobian gives a filter that looks fine for a while and then diverges." },
      { t: "p", text: "A simpler measurement, a compass or a magnetometer heading, is z = θ + v, so h is linear and H = [0, 0, 1]. It corrects heading only, which is often the biggest win, but leaves position to drift. Range and bearing to known landmarks corrects all three states." },
      { t: "note", kind: "warn", text: "Angles wrap. If the prediction says 179° and the sensor says -179°, the true innovation is +2°, not -358°. Wrap every angle innovation into (-π, π] before multiplying by K, and wrap θ after the update. Forgetting this is the most common EKF bug of all and causes the estimate to spin round suddenly." },

      { t: "h", text: "A complete EKF in Python" },
      { t: "p", text: "The robot below drives a circle at 0.3 m/s and 0.2 rad/s. Odometry has random noise plus a 0.02 rad/s bias (a typical effect of a slightly smaller wheel or steady slip). A landmark at (2, 3) m is observed at 2 Hz with σr = 0.1 m and σφ = 3°. The program compares dead-reckoning with the EKF against the simulated truth." },
      { t: "snippet", lang: "python", code: String.raw`"""EKF for a differential-drive robot: encoder odometry + range/bearing to a known landmark."""
import math
import random

DT = 0.1
LM = (2.0, 3.0)                    # landmark position, m
SIG_V, SIG_W = 0.05, 0.08          # odometry noise: m/s, rad/s
SIG_R, SIG_B = 0.10, math.radians(3)


def wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


def matmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def T(A):
    return [list(r) for r in zip(*A)]


def add(A, B):
    return [[a + b for a, b in zip(ra, rb)] for ra, rb in zip(A, B)]


def inv2(M):
    a, b, c, d = M[0][0], M[0][1], M[1][0], M[1][1]
    det = a * d - b * c
    return [[d / det, -b / det], [-c / det, a / det]]


def predict(x, P, v, w):
    th = x[2]
    x = [x[0] + v * DT * math.cos(th), x[1] + v * DT * math.sin(th), wrap(th + w * DT)]
    F = [[1, 0, -v * DT * math.sin(th)],
         [0, 1, v * DT * math.cos(th)],
         [0, 0, 1]]
    G = [[DT * math.cos(th), 0], [DT * math.sin(th), 0], [0, DT]]   # d f / d (v, w)
    M = [[SIG_V ** 2, 0], [0, SIG_W ** 2]]
    P = add(matmul(matmul(F, P), T(F)), matmul(matmul(G, M), T(G)))
    return x, P


def update(x, P, z):
    dx, dy = LM[0] - x[0], LM[1] - x[1]
    q = dx * dx + dy * dy
    r = math.sqrt(q)
    zhat = [r, wrap(math.atan2(dy, dx) - x[2])]
    H = [[-dx / r, -dy / r, 0],
         [dy / q, -dx / q, -1]]
    R = [[SIG_R ** 2, 0], [0, SIG_B ** 2]]
    S = add(matmul(matmul(H, P), T(H)), R)
    K = matmul(matmul(P, T(H)), inv2(S))
    y = [z[0] - zhat[0], wrap(z[1] - zhat[1])]          # wrap the bearing innovation
    x = [x[i] + K[i][0] * y[0] + K[i][1] * y[1] for i in range(3)]
    x[2] = wrap(x[2])
    KH = matmul(K, H)
    P = matmul([[(1 if i == j else 0) - KH[i][j] for j in range(3)] for i in range(3)], P)
    return x, P


def main():
    rng = random.Random(7)
    truth = [0.0, 0.0, 0.0]
    odo = truth[:]
    x, P = truth[:], [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]]
    e_odo = e_ekf = 0.0
    n = 300
    for k in range(n):
        v, w = 0.3, 0.2                               # commanded: a circle
        truth = [truth[0] + v * DT * math.cos(truth[2]), truth[1] + v * DT * math.sin(truth[2]), wrap(truth[2] + w * DT)]
        vm, wm = v + rng.gauss(0, SIG_V), w + rng.gauss(0, SIG_W) + 0.02   # 0.02 rad/s bias: slip
        odo = [odo[0] + vm * DT * math.cos(odo[2]), odo[1] + vm * DT * math.sin(odo[2]), wrap(odo[2] + wm * DT)]
        x, P = predict(x, P, vm, wm)
        if k % 5 == 0:                                # landmark seen at 2 Hz
            dx, dy = LM[0] - truth[0], LM[1] - truth[1]
            z = [math.hypot(dx, dy) + rng.gauss(0, SIG_R), wrap(math.atan2(dy, dx) - truth[2] + rng.gauss(0, SIG_B))]
            x, P = update(x, P, z)
        e_odo += (odo[0] - truth[0]) ** 2 + (odo[1] - truth[1]) ** 2
        e_ekf += (x[0] - truth[0]) ** 2 + (x[1] - truth[1]) ** 2
    ro, re = math.sqrt(e_odo / n), math.sqrt(e_ekf / n)
    print(f"position RMSE  odometry only {ro:.3f} m   EKF {re:.3f} m")
    print(f"final heading error  odometry {math.degrees(wrap(odo[2]-truth[2])):.1f} deg  EKF {math.degrees(wrap(x[2]-truth[2])):.1f} deg")
    assert re < ro


if __name__ == "__main__":
    main()`, caption: "ekf.py: differential-drive EKF with range and bearing updates, pure Python." },
      { t: "snippet", lang: "text", code: String.raw`position RMSE  odometry only 0.610 m   EKF 0.145 m
final heading error  odometry 36.8 deg  EKF 6.7 deg`, caption: "Output after 30 s." },
      { t: "p", text: "Check: the odometry heading error should be about the bias times time, 0.02 × 30 = 0.6 rad ≈ 34°, plus random noise; 36.8° is consistent. The EKF cuts position error by a factor of four. It does not reach zero because the filter does not know about the bias: it treats it as random noise, so a residual error remains. The professional fix is to add the bias as a fourth state, which the landmark updates then estimate; that is the same trick Mahony uses for gyros in lesson 5." },

      { t: "deep", title: "Where the EKF breaks and what replaces it", blocks: [
        { t: "p", text: "Linearisation is accurate when the uncertainty is small compared with the curvature of f and h. It fails when it is not: a robot that has no idea of its heading (σθ of 90°) cannot sensibly linearise cos θ. Symptoms are an overconfident P and innovations that do not match S, followed by divergence." },
        { t: "list", items: [
          "**Iterated EKF**: relinearise the measurement around the updated estimate and repeat the update two or three times. Helps with strongly non-linear measurements.",
          "**Unscented Kalman filter (UKF)**: push 2n + 1 carefully chosen sample points (sigma points) through the true non-linear f and h, then fit a mean and covariance. No Jacobians, and accurate to second order. robot_localization offers `ukf_node` alongside `ekf_node`.",
          "**Error-state (indirect) Kalman filter**: estimate a small error around a nominal trajectory integrated at high rate. The standard design for IMU-based navigation and for attitude, because the error stays small and nearly linear even when the attitude itself is large.",
          "**Particle filter**: represent the belief with many samples. Handles multimodal beliefs such as the symmetric corridor of lesson 1. The basis of AMCL in a13.",
        ] },
      ] },
      { t: "deep", title: "Deriving the range and bearing Jacobian", blocks: [
        { t: "formula", text: String.raw`r = √q,  q = dx² + dy²,  dx = mx - x,  dy = my - y

∂r/∂x = (1/(2√q)) · 2dx · (-1) = -dx/√q
∂r/∂y = -dy/√q
∂r/∂θ = 0

φ = atan2(dy, dx) - θ,   d atan2(b, a) = (a·db - b·da)/(a² + b²)
∂φ/∂x = (dx·0 - dy·(-1))/q = dy/q
∂φ/∂y = (dx·(-1) - dy·0)/q = -dx/q
∂φ/∂θ = -1` },
        { t: "p", text: "Note the minus signs: moving the robot towards the landmark (increasing x when dx > 0) reduces the range. The 1/q in the bearing row shows bearings to distant landmarks hardly constrain position (but still constrain heading fully through the -1)." },
      ] },
    ],
    mistakes: [
      "Not wrapping the bearing innovation and the heading, so the filter spins 360° when the robot crosses ±180°.",
      "Evaluating the Jacobian at the wrong point (old estimate instead of the predicted state for H). F uses x̂ before prediction; H uses x̂⁻.",
      "Getting a Jacobian sign wrong and not checking it numerically by finite differences.",
      "Using a constant Q for odometry instead of G·M·Gᵀ, so position uncertainty does not rotate with the heading.",
      "Leaving a systematic bias (wheel diameter, gyro offset) unmodelled and expecting the filter to remove it.",
    ],
    quiz: [
      {
        q: "What does the EKF use the Jacobian F for?",
        options: [
          "Propagating the mean",
          "Propagating the covariance through the linearised model",
          "Wrapping angles",
          "Computing the measurement",
        ],
        answer: 1,
        why: "The mean is propagated with the non-linear f itself; F (the local linear approximation) is used for P⁻ = F·P·Fᵀ + ...",
      },
      {
        q: "For the odometry model, which entry of F links heading error to y position error?",
        options: ["F[1][1] = 1", "F[0][2] = -v·Δt·sin θ", "F[1][2] = v·Δt·cos θ", "F[2][2] = 1"],
        answer: 2,
        why: "∂y'/∂θ = v·Δt·cos θ: a heading error moves y in proportion to distance travelled.",
      },
      {
        q: "Predicted bearing 179°, measured -179°. What innovation should the filter use?",
        options: ["-358°", "+2°", "0°", "+358°"],
        answer: 1,
        why: "Wrap into (-π, π]: -179 - 179 = -358 ≡ +2°. Using -358° would yank the heading round.",
      },
      {
        q: "Robot at (0.5, 0.2), landmark at (2.0, 3.0). What is ∂r/∂x?",
        options: ["+0.472", "-0.472", "-0.882", "0"],
        answer: 1,
        why: "dx = 1.5, √q = √(1.5² + 2.8²) = 3.176, ∂r/∂x = -1.5/3.176 = -0.472.",
      },
      {
        q: "A robot drives 10 m with an uncorrected 2° heading error. Roughly how far off sideways is it?",
        options: ["0.035 m", "0.35 m", "2 m", "3.5 m"],
        answer: 1,
        why: "10 × sin(2°) ≈ 10 × 0.0349 = 0.35 m. Small heading errors become large position errors.",
      },
    ],
    practice: {
      kind: "bench",
      task: "Run an EKF on your own differential-drive robot's logged odometry with a heading correction.",
      steps: [
        "Log encoder ticks at 50 Hz and an IMU or magnetometer heading at 10 Hz while driving a 2 m square on the floor, returning to the start mark.",
        "Run dead-reckoning only and measure the end-point error with a tape.",
        "Adapt ekf.py: replace the landmark update with a heading update z = θ, H = [0, 0, 1], R from the heading sensor's variance at rest.",
        "Compare end-point errors and plot both paths. Then add a camera and an ArUco marker if you have one and use the range and bearing update.",
      ],
    },
  },

  "a9-orientation-and-quaternions": {
    id: "a9-orientation-and-quaternions",
    outcomes: [
      "Describe an orientation with Euler angles, a rotation matrix and a quaternion, and convert between them",
      "Explain gimbal lock and show it with numbers",
      "Multiply quaternions, rotate a vector with one and normalise it",
      "Integrate gyro rates into a quaternion orientation",
    ],
    blocks: [
      { t: "h", text: "Why tilt from i8 is not enough" },
      { t: "p", text: "The i8 tilt sensor gave pitch and roll as two separate angles, each updated from one gyro axis. That works for small tilts, but it is wrong in general: rotations in 3-D do not add like numbers, and their order matters. Hold a book flat, turn it 90° about the vertical, then 90° about the left-right axis. Start again and do the two in the other order. The book ends up in different orientations. Any estimator that handles drones, legged robots or a robot on a ramp needs a proper representation of 3-D orientation. There are three in common use, each with a job." },

      { t: "h", text: "Euler angles" },
      { t: "p", text: "An orientation can be built from three rotations about coordinate axes. The robotics and aerospace convention (used by ROS REP 103 for roll, pitch, yaw) is **Z-Y-X**: yaw ψ about z, then pitch θ about the new y, then roll φ about the newest x. Euler angles are what humans read: a heading on a display, a tilt limit in a safety check. They are poor for computation for two reasons: the order convention must be agreed (there are 12), and they have a singularity." },
      { t: "h", text: "Gimbal lock" },
      { t: "p", text: "At pitch θ = ±90° (nose straight up), the yaw axis and the roll axis line up. Yaw and roll then do the same thing, and only their difference matters. One degree of freedom has vanished from the description, though not from the object. Numerically, with Z-Y-X angles, (yaw 30°, pitch 90°, roll 10°) and (yaw 50°, pitch 90°, roll 30°) give exactly the same orientation: both have yaw - roll = 20°. Near that point, converting back to Euler angles is ill-conditioned and tiny changes in orientation produce huge jumps in yaw and roll. Rate equations that convert body rates to Euler rates divide by cos θ and blow up." },
      { t: "formula", text: String.raw`Euler rates from body rates (p, q, r), Z-Y-X:
φ̇ = p + (q·sin φ + r·cos φ)·tan θ
θ̇ = q·cos φ - r·sin φ
ψ̇ = (q·sin φ + r·cos φ) / cos θ        → ∞ as θ → 90°`, caption: "This is why the i8 trick of integrating each gyro axis separately is only valid near level." },

      { t: "h", text: "Rotation matrices" },
      { t: "p", text: "A **rotation matrix** R is a 3×3 matrix whose columns are the body's x, y and z axes written in world coordinates. Rotating a vector is a matrix product, v_world = R·v_body, and composing rotations is multiplying matrices: R_total = R1·R2. Rotation matrices are orthonormal (Rᵀ·R = I, det R = +1), so the inverse is just the transpose. They have no singularities and are the clearest way to think, but they store 9 numbers for 3 degrees of freedom, and after many multiplications rounding makes them drift away from orthonormal." },
      { t: "formula", text: String.raw`Rz(ψ) = | cos ψ  -sin ψ  0 |    Ry(θ) = |  cos θ  0  sin θ |    Rx(φ) = | 1  0      0      |
         | sin ψ   cos ψ  0 |            |  0      1  0     |            | 0  cos φ  -sin φ |
         | 0       0      1 |            | -sin θ  0  cos θ |            | 0  sin φ   cos φ |

R = Rz(ψ) · Ry(θ) · Rx(φ)        (Z-Y-X, body to world)`, caption: "Elementary rotations and the Z-Y-X composition." },

      { t: "h", text: "Quaternions" },
      { t: "p", text: "A **unit quaternion** q = (w, x, y, z) with w² + x² + y² + z² = 1 encodes a rotation by angle α about a unit axis n as w = cos(α/2) and (x, y, z) = n·sin(α/2). Four numbers, one constraint, no singularity, cheap to compose and trivial to renormalise. That is why every flight controller, IMU driver and ROS message (`geometry_msgs/Quaternion`) uses them. You do not need to visualise four dimensions; you need four operations." },
      { t: "formula", text: String.raw`product (Hamilton):
a ⊗ b = ( aw·bw - ax·bx - ay·by - az·bz,
          aw·bx + ax·bw + ay·bz - az·by,
          aw·by - ax·bz + ay·bw + az·bx,
          aw·bz + ax·by - ay·bx + az·bw )

conjugate (= inverse for unit q):  q* = (w, -x, -y, -z)
rotate a vector:                   (0, v') = q ⊗ (0, v) ⊗ q*
normalise:                         q ← q / |q|`, caption: "Everything you need to use quaternions." },
      { t: "p", text: "Worked example. A 90° yaw is qz = (cos 45°, 0, 0, sin 45°) = (0.7071, 0, 0, 0.7071). Rotating the x axis (1, 0, 0) with it gives (0, 1, 0): x has turned to point along y, as expected. A 90° roll is qx = (0.7071, 0.7071, 0, 0). Then qz ⊗ qx = (0.5, 0.5, 0.5, 0.5) but qx ⊗ qz = (0.5, 0.5, -0.5, 0.5): different, because rotation order matters. Under qz ⊗ qx the body y axis (0, 1, 0) goes to (0, 0, 1): the roll lifts y to vertical, and the yaw then leaves vertical alone. All four results were checked with the program below." },
      { t: "p", text: "q and -q represent the same rotation (rotating by α about n equals rotating by 360° - α about -n). This **double cover** is harmless but matters when you compare or average quaternions: flip one sign if their dot product is negative." },

      { t: "h", text: "Integrating gyro rates" },
      { t: "p", text: "A gyro reports body rates ω = (p, q, r) in rad/s. Over a short Δt the body turns by angle |ω|·Δt about axis ω/|ω|. Build that small rotation as a quaternion and multiply it on the **right** (it is expressed in the body frame), then normalise. This is exact if ω is constant over the step; the simpler first-order version q ← q + ½·q ⊗ (0, ω)·Δt is fine at 100 Hz and above, provided you normalise each step." },
      { t: "snippet", lang: "python", code: String.raw`"""Quaternion basics in pure Python. q = (w, x, y, z), Hamilton convention."""
import math


def qmul(a, b):
    aw, ax, ay, az = a
    bw, bx, by, bz = b
    return (aw * bw - ax * bx - ay * by - az * bz,
            aw * bx + ax * bw + ay * bz - az * by,
            aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw)


def qconj(q):
    return (q[0], -q[1], -q[2], -q[3])


def qnorm(q):
    n = math.sqrt(sum(c * c for c in q))
    return tuple(c / n for c in q)


def from_axis_angle(axis, angle):
    s = math.sin(angle / 2)
    return (math.cos(angle / 2), axis[0] * s, axis[1] * s, axis[2] * s)


def rotate(q, v):
    """Rotate vector v from body to world: q * (0, v) * q^-1."""
    return qmul(qmul(q, (0.0, *v)), qconj(q))[1:]


def integrate_gyro(q, w, dt):
    """Exact update for a constant body rate w over dt."""
    rate = math.sqrt(w[0] ** 2 + w[1] ** 2 + w[2] ** 2)
    if rate < 1e-12:
        return q
    axis = tuple(c / rate for c in w)
    return qnorm(qmul(q, from_axis_angle(axis, rate * dt)))


def to_euler(q):
    """ZYX yaw, pitch, roll in radians."""
    w, x, y, z = q
    roll = math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))
    pitch = math.asin(max(-1.0, min(1.0, 2 * (w * y - z * x))))
    yaw = math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
    return yaw, pitch, roll


if __name__ == "__main__":
    qz = from_axis_angle((0, 0, 1), math.radians(90))
    print("qz =", tuple(round(c, 4) for c in qz))
    print("rotate x-axis by qz:", tuple(round(c, 6) for c in rotate(qz, (1, 0, 0))))
    qx = from_axis_angle((1, 0, 0), math.radians(90))
    print("qz*qx =", tuple(round(c, 4) for c in qmul(qz, qx)))
    print("qx*qz =", tuple(round(c, 4) for c in qmul(qx, qz)))
    # integrate 90 deg/s about z for 1 s in 100 steps
    q = (1.0, 0.0, 0.0, 0.0)
    for _ in range(100):
        q = integrate_gyro(q, (0, 0, math.radians(90)), 0.01)
    print("after 1 s at 90 deg/s yaw:", [round(math.degrees(a), 3) for a in to_euler(q)])
    v = rotate(qmul(qz, qx), (0, 1, 0))
    print("y-axis under qz*qx:", tuple(round(c, 6) for c in v))
    assert abs(math.degrees(to_euler(q)[0]) - 90) < 1e-6`, caption: "quat.py: quaternion product, rotation, gyro integration and Euler conversion. Lesson 5 imports it." },
      { t: "snippet", lang: "text", code: String.raw`qz = (0.7071, 0.0, 0.0, 0.7071)
rotate x-axis by qz: (0.0, 1.0, 0.0)
qz*qx = (0.5, 0.5, 0.5, 0.5)
qx*qz = (0.5, 0.5, -0.5, 0.5)
after 1 s at 90 deg/s yaw: [90.0, 0.0, 0.0]
y-axis under qz*qx: (-0.0, 0.0, 1.0)`, caption: "Output." },
      { t: "p", text: "Check: 100 steps of 0.01 s at 90°/s is 90° of yaw, and the program asserts it to 10⁻⁶. With the first-order formula and no normalisation, the same run ends with |q| = 1.0031: small, but it grows without limit over minutes, so always normalise." },
      { t: "table", head: ["Representation", "Numbers", "Strength", "Weakness", "Use it for"], rows: [
        ["Euler angles", "3", "Human readable", "Gimbal lock, order conventions", "Display, limits, user input"],
        ["Rotation matrix", "9", "Clear geometry, direct vector rotation", "Redundant, drifts from orthonormal", "Transforming many vectors, derivations"],
        ["Quaternion", "4", "No singularity, cheap, easy to renormalise", "Not intuitive, double cover", "Storage, integration, filters, ROS messages"],
      ] },
      { t: "note", kind: "warn", text: "Check the component order of every library. ROS messages and Eigen's constructor order differ (x, y, z, w versus w, x, y, z), and some IMU chips use other axis conventions. A quaternion with its order swapped is still a valid unit quaternion, so the bug produces wrong orientations, not an error." },

      { t: "deep", title: "From quaternion to rotation matrix and Euler angles", blocks: [
        { t: "formula", text: String.raw`R(q) = | 1-2(y²+z²)   2(xy-wz)     2(xz+wy)   |
       | 2(xy+wz)     1-2(x²+z²)   2(yz-wx)   |
       | 2(xz-wy)     2(yz+wx)     1-2(x²+y²) |

roll  φ = atan2( 2(wx + yz), 1 - 2(x² + y²) )
pitch θ = asin ( 2(wy - zx) )             (clamp to [-1, 1])
yaw   ψ = atan2( 2(wz + xy), 1 - 2(y² + z²) )` },
        { t: "p", text: "Clamp the asin argument: rounding can push 2(wy - zx) to 1.0000001 and asin returns NaN. Near pitch ±90° the roll and yaw formulas become 0/0, which is gimbal lock showing up in the conversion; the quaternion itself is perfectly fine." },
      ] },
      { t: "deep", title: "The quaternion kinematic equation", blocks: [
        { t: "p", text: "Differentiating q(t + Δt) = q(t) ⊗ δq with δq ≈ (1, ω·Δt/2) gives q̇ = ½·q ⊗ (0, ω). Integrating this is what every AHRS does between corrections. With ω constant over Δt, the exact solution is δq = (cos(|ω|Δt/2), (ω/|ω|)·sin(|ω|Δt/2)), which is what integrate_gyro uses. If ω changes direction within a step (coning motion on a vibrating vehicle), even the exact constant-rate form is wrong; inertial navigation systems use higher-rate gyro samples and coning corrections, beyond this course." },
        { t: "p", text: "Body-frame rates multiply on the right; a rotation expressed in the world frame (for example a correction in world coordinates) multiplies on the left. Mixing these up gives an estimator that works at level and fails when tilted." },
      ] },
    ],
    mistakes: [
      "Integrating each gyro axis into roll, pitch and yaw separately at large angles. That only approximates the Euler rate equations near level.",
      "Forgetting to normalise the quaternion after integration, so it slowly stops being a rotation.",
      "Multiplying the gyro increment on the wrong side (left instead of right for body rates).",
      "Mixing component orders (w first versus w last) between libraries and messages.",
      "Comparing q and -q as if they were different orientations, for example in an error metric.",
    ],
    quiz: [
      {
        q: "What is gimbal lock in a Z-Y-X Euler representation?",
        options: [
          "The IMU saturating at high rates",
          "At pitch ±90° the yaw and roll axes align, so only their difference is defined and one degree of freedom is lost from the description",
          "The quaternion norm drifting from 1",
          "A mechanical fault in the gyroscope",
        ],
        answer: 1,
        why: "It is a singularity of the parameterisation: e.g. (30°, 90°, 10°) and (50°, 90°, 30°) are the same orientation.",
      },
      {
        q: "Which unit quaternion represents a 90° rotation about z?",
        options: ["(0, 0, 0, 1)", "(0.7071, 0, 0, 0.7071)", "(0.5, 0.5, 0.5, 0.5)", "(1, 0, 0, 0.7071)"],
        answer: 1,
        why: "w = cos(45°) = 0.7071 and (x, y, z) = (0, 0, 1)·sin(45°). (0, 0, 0, 1) is a 180° rotation about z.",
      },
      {
        q: "For a rotation matrix R, what is R⁻¹?",
        options: ["Rᵀ", "-R", "R itself", "It must be computed numerically"],
        answer: 0,
        why: "Rotation matrices are orthonormal, so the inverse is the transpose.",
      },
      {
        q: "Why is qz ⊗ qx different from qx ⊗ qz?",
        options: [
          "A rounding error",
          "Quaternion multiplication, like rotation composition, is not commutative",
          "Because one of them is not normalised",
          "They are the same; only the sign differs",
        ],
        answer: 1,
        why: "Rotation order matters in 3-D, and quaternion multiplication mirrors that.",
      },
      {
        q: "A gyro reads (0, 0, 1.0) rad/s for Δt = 0.01 s. What incremental quaternion is multiplied on?",
        options: ["(1, 0, 0, 0.01)", "(cos 0.005, 0, 0, sin 0.005)", "(cos 0.01, 0, 0, sin 0.01)", "(0, 0, 0, 0.01)"],
        answer: 1,
        why: "The angle is 0.01 rad about z, and quaternions use half angles: (cos 0.005, 0, 0, sin 0.005).",
      },
    ],
    practice: {
      kind: "bench",
      task: "Track 3-D orientation from gyro data alone and see where it fails.",
      steps: [
        "Log raw gyro at 200 Hz from an MPU6050 on an ESP32 with the board still for 10 s, then rotated by hand through 90° about each axis in turn and back.",
        "Subtract the mean of the still segment (bias) and integrate with integrate_gyro from quat.py.",
        "Convert to Euler angles and check each 90° rotation. Then integrate the same data with the i8 per-axis method and compare after the second rotation.",
        "Leave the board still for 5 minutes and plot how far the gyro-only orientation drifts. This is the problem lesson 5 solves.",
      ],
    },
  },

  "a9-imu-fusion-odometry-and-evaluation": {
    id: "a9-imu-fusion-odometry-and-evaluation",
    outcomes: [
      "Explain what an AHRS estimates and which sensors make which angles observable",
      "Describe Mahony and Madgwick filters in outline and compare them with the complementary filter and an EKF",
      "Fuse wheel odometry with an IMU, and know where robot_localization fits in ROS 2 Lyrical",
      "Evaluate an estimator against a reference with RMSE and consistency checks",
    ],
    blocks: [
      { t: "h", text: "Attitude and heading reference systems" },
      { t: "p", text: "An **AHRS** estimates full 3-D orientation (roll, pitch and yaw) from a gyroscope, an accelerometer and usually a magnetometer. The structure is the one you now know from every filter in this module: the gyro drives the **prediction** (integrate the quaternion as in lesson 4), and the other sensors supply **corrections** towards absolute references." },
      { t: "list", items: [
        "The **accelerometer** measures gravity (plus any real acceleration). It fixes roll and pitch, but says nothing about yaw: rotating about the vertical does not change the direction of gravity.",
        "The **magnetometer** measures the Earth's field. It fixes yaw, but is easily disturbed by motors, steel and current-carrying wires on the robot.",
        "The **gyro** measures rates accurately in the short term but has a bias that drifts with temperature, so integrated angles drift.",
      ] },
      { t: "p", text: "Observability matters: with only gyro and accelerometer, yaw is not observable and will drift no matter how clever the filter. Indoors, near motors, many robot builders skip the magnetometer and accept slow yaw drift, correcting yaw from wheel odometry or a LiDAR instead." },

      { t: "h", text: "Three filters for the same job" },
      { t: "p", text: "**Complementary filter (i8).** Blend integrated gyro angles with accelerometer angles using a fixed α. Simple and robust, but done on separate Euler angles it is only valid near level, and it does not learn the gyro bias." },
      { t: "p", text: "**Mahony filter** (Mahony, Hamel and Pflimlin, 2008). A complementary filter done properly on the rotation group. Each step: predict which way is \"up\" in the body frame from the current quaternion; compare with the normalised accelerometer vector; their cross product e is a small rotation that would align them. Feed e back into the gyro rate with a proportional gain Kp (fast correction) and an integral gain Ki (the integral converges to the negative of the gyro bias, so the filter learns and removes it). This is literally a PI controller (a8) whose plant is the attitude integrator." },
      { t: "formula", text: String.raw`v  = predicted gravity direction in body frame = R(q)ᵀ·(0, 0, 1)
a  = accelerometer / |accelerometer|
e  = a × v
b ← b + Ki·e·Δt                     (integral: bias estimate)
ω' = ω_gyro + Kp·e + b
q ← q ⊗ δq(ω'·Δt),  normalise`, caption: "Mahony update with accelerometer only. A magnetometer adds a second error term for yaw." },
      { t: "p", text: "**Madgwick filter** (Madgwick, 2010). Same idea, different correction: one step of gradient descent on the quaternion to reduce the mismatch between predicted and measured gravity (and magnetic field), with one gain β related to gyro noise. It is cheap, widely used on microcontrollers, and the version in common libraries also includes magnetic distortion compensation. Its base form does not estimate gyro bias; Mahony's integral term does." },
      { t: "p", text: "**EKF or error-state EKF.** Put the quaternion (or a small attitude error) and the gyro biases in the state, the gyro in the prediction and the accelerometer and magnetometer in the update. More computation and more tuning, but it gives covariances, handles sensors at different rates and accepts other measurements (GPS, odometry). This is what flight controllers such as PX4's EKF2 and commercial IMU modules run." },
      { t: "table", head: ["Filter", "Tuning knobs", "Learns gyro bias", "Gives uncertainty", "Cost"], rows: [
        ["Complementary (Euler)", "α", "No", "No", "Tiny"],
        ["Mahony", "Kp, Ki", "Yes (integral)", "No", "Small"],
        ["Madgwick", "β (and ζ in the bias variant)", "Base form no", "No", "Small"],
        ["EKF / ESKF", "Q, R per sensor", "Yes (state)", "Yes, P", "Moderate"],
      ] },

      { t: "h", text: "Evaluating against a reference" },
      { t: "p", text: "An estimator you have not compared with the truth is a hope, not a result. You need a **reference** at least several times more accurate than what you are testing: in simulation it is the simulated truth; on the bench it can be a turntable or servo with an encoder, a phone held rigidly with the board (its own fused attitude is good to a degree or so), a digital inclinometer at fixed angles, motion capture if your lab has it, or for odometry a tape measure and floor marks. Then:" },
      { t: "list", ordered: true, items: [
        "**Align in time.** Log both with timestamps from the same clock, or find the offset by cross-correlating a sharp motion. A 50 ms offset during a fast turn looks like a large error.",
        "**Align in frame.** The reference and the IMU are not mounted identically. Remove the constant mounting rotation (or position offset) found while still, before computing errors.",
        "**Compute errors** properly: wrap angle differences into (-180°, 180°], and for full attitude use the angle of the error quaternion, 2·acos(|w|) of q_ref* ⊗ q_est.",
        "**Summarise** with RMSE = √(mean of error²), plus the maximum error and a plot over time. RMSE alone hides a short catastrophic failure.",
      ] },
      { t: "p", text: "The program below is the evaluation harness for the exit project. It simulates a board wobbling about all three axes at 100 Hz, with gyro bias around 0.5°/s and accelerometer noise of 0.3 m/s², and scores gyro-only integration, the i8 complementary filter and Mahony against the truth. Replace simulate() with your logged data and reference and nothing else needs to change." },
      { t: "snippet", lang: "python", code: String.raw`"""Compare gyro-only, complementary and Mahony attitude estimates against a known truth.

Simulated IMU at 100 Hz: gyro with bias and noise, accelerometer with noise.
Replace simulate() with logged data and a reference (encoder rig, phone, mocap)
to evaluate a real estimator the same way.
"""
import math
import random
from quat import qmul, qconj, qnorm, integrate_gyro, to_euler, rotate

DT = 0.01
G = 9.81


def simulate(seconds=60, seed=3):
    rng = random.Random(seed)
    bias = (0.01, -0.008, 0.005)                # rad/s, about 0.5 deg/s
    q = (1.0, 0.0, 0.0, 0.0)
    for k in range(int(seconds / DT)):
        t = k * DT
        w = (0.4 * math.cos(0.7 * t), 0.3 * math.cos(0.45 * t), 0.1)   # true body rates
        q = integrate_gyro(q, w, DT)
        g_body = rotate(qconj(q), (0.0, 0.0, G))   # what a still accelerometer reads
        gyro = tuple(w[i] + bias[i] + rng.gauss(0, 0.005) for i in range(3))
        acc = tuple(g_body[i] + rng.gauss(0, 0.3) for i in range(3))
        yield q, gyro, acc


def wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


def tilt_from_acc(a):
    roll = math.atan2(a[1], a[2])
    pitch = math.atan2(-a[0], math.hypot(a[1], a[2]))
    return roll, pitch


class Mahony:
    def __init__(self, kp=1.0, ki=0.05):
        self.q = (1.0, 0.0, 0.0, 0.0)
        self.kp, self.ki = kp, ki
        self.ib = [0.0, 0.0, 0.0]               # integral term: learned gyro bias

    def step(self, gyro, acc):
        n = math.sqrt(sum(c * c for c in acc))
        a = tuple(c / n for c in acc)
        v = rotate(qconj(self.q), (0.0, 0.0, 1.0))   # predicted "up" in body frame
        e = (a[1] * v[2] - a[2] * v[1],               # error = measured x predicted
             a[2] * v[0] - a[0] * v[2],
             a[0] * v[1] - a[1] * v[0])
        for i in range(3):
            self.ib[i] += self.ki * e[i] * DT
        w = tuple(gyro[i] + self.kp * e[i] + self.ib[i] for i in range(3))
        self.q = integrate_gyro(self.q, w, DT)
        return self.q


def main():
    gyro_q = (1.0, 0.0, 0.0, 0.0)
    cf_roll = cf_pitch = 0.0
    m = Mahony()
    se = {"gyro only": 0.0, "complementary": 0.0, "Mahony": 0.0}
    n = 0
    for q_true, gyro, acc in simulate():
        _, tp, tr = to_euler(q_true)
        gyro_q = integrate_gyro(gyro_q, gyro, DT)
        _, gp, gr = to_euler(gyro_q)
        ar, ap = tilt_from_acc(acc)
        # i8 complementary filter, alpha = 0.98 (small-angle rate mapping)
        cf_roll = 0.98 * (cf_roll + gyro[0] * DT) + 0.02 * ar
        cf_pitch = 0.98 * (cf_pitch + gyro[1] * DT) + 0.02 * ap
        _, mp, mr = to_euler(m.step(gyro, acc))
        for name, (r, p) in (("gyro only", (gr, gp)), ("complementary", (cf_roll, cf_pitch)), ("Mahony", (mr, mp))):
            se[name] += math.degrees(wrap(r - tr)) ** 2 + math.degrees(wrap(p - tp)) ** 2
        n += 1
    for name, s in se.items():
        print(f"{name:14s} tilt RMSE {math.sqrt(s / (2 * n)):.2f} deg")
    print("Mahony learned bias (rad/s):", [round(-b, 4) for b in m.ib])
    assert math.sqrt(se["Mahony"] / (2 * n)) < math.sqrt(se["gyro only"] / (2 * n))


if __name__ == "__main__":
    main()`, caption: "ahrs.py: evaluation harness. Put quat.py from lesson 4 in the same folder." },
      { t: "snippet", lang: "text", code: String.raw`gyro only      tilt RMSE 6.86 deg
complementary  tilt RMSE 1.52 deg
Mahony         tilt RMSE 0.29 deg
Mahony learned bias (rad/s): [0.0092, -0.0076, 0.003]`, caption: "Output over 60 s." },
      { t: "p", text: "Check: gyro-only error has no correction at all; it is smaller than bias × time (0.01 × 60 = 0.6 rad ≈ 34°) only because the board keeps yawing, which rotates the body-frame bias and partly averages it out in tilt. On a board that does not yaw it would grow linearly. The complementary filter fixes drift but leaves 1.5° because it treats body rates as Euler rates while the board is also yawing. Mahony gets 0.29° and its integral term has learned the x and y biases (0.010 and -0.008 rad/s true) within about 10%. The z bias (0.005 true, 0.003 learned) is only partly learned, because gravity carries little information about rotation around it: the observability point again. Trying Kp = 0.5, 2 and 5 gave 0.37°, 0.27° and 0.32°: a broad optimum, typical of a well-posed filter." },
      { t: "note", kind: "warn", text: "This simulation has no linear acceleration: the board only rotates. On a real robot, braking and turning add acceleration that the accelerometer cannot tell apart from tilt. Lower Kp, or reduce the correction when |a| differs from 9.81 m/s² by more than about 10%." },

      { t: "h", text: "Fusing wheel odometry with an IMU" },
      { t: "p", text: "On a ground robot the two sensors have opposite strengths. Wheel odometry gives good forward distance but poor heading, because slip in turns and unequal wheel diameters corrupt ω = (vR - vL)/b. A gyro measures yaw rate directly and does not slip, but integrating its accelerometer to get distance is hopeless (a 0.01 m/s² bias gives 0.5 × 0.01 × 60² = 18 m error after a minute). So the standard fusion is: forward velocity from the wheels, yaw rate from the gyro (optionally also wheel yaw rate with a larger variance), integrated in an EKF with the motion model of lesson 3. Lesson 3's EKF becomes a wheel-plus-gyro filter by treating the gyro yaw rate as a measurement of an ω state, or simply by using it as the ω input with σω set from the gyro noise." },
      { t: "p", text: "In ROS 2 you do not write this filter yourself. The **robot_localization** package (released for ROS 2 Lyrical Luth as version 3.11.0; install `ros-lyrical-robot-localization`) provides `ekf_node` and `ukf_node` over a 15-state model. Each sensor topic gets a boolean vector saying which of x, y, z, roll, pitch, yaw, their velocities and linear accelerations it measures, and the node publishes the fused `odom` to `base_link` transform. Module a13 configures it in full; the key rules are: fuse velocities rather than absolute poses from odometry, fuse the gyro's yaw rate, and make sure no other node also publishes `odom` to `base_link`." },
      { t: "note", kind: "tip", text: "Before trusting any fused odometry, check each sensor's covariance in its message. robot_localization weighs inputs by the covariances you publish; a driver that publishes zeros claims perfect data and will dominate the fusion." },

      { t: "deep", title: "Consistency: NEES and NIS", blocks: [
        { t: "p", text: "RMSE says how big the errors are. Consistency asks whether the filter **knows** how big they are, i.e. whether P is honest. Downstream code (planners, outlier gates, a13's localisation) relies on P, so an overconfident filter is dangerous even when its RMSE looks good." },
        { t: "formula", text: String.raw`NEES_k = (x_k - x̂_k)ᵀ · P_k⁻¹ · (x_k - x̂_k)      needs ground truth
NIS_k  = y_kᵀ · S_k⁻¹ · y_k                        needs only innovations

consistent filter:  mean NEES ≈ n (state dimension),  mean NIS ≈ m (measurement dimension)`, caption: "Normalised estimation error squared and normalised innovation squared." },
        { t: "p", text: "For a consistent filter, NEES is chi-square distributed with n degrees of freedom. Averaged over N Monte Carlo runs, N·mean NEES is chi-square with N·n degrees of freedom, which gives an acceptance band. For n = 2 and N = 50 runs, the two-sided 95% band on the mean is 74.2/50 to 129.6/50, i.e. 1.48 to 2.59. The kf2.py filter of lesson 2 scored 1.93: consistent. Re-running the same data with the filter's beliefs deliberately wrong shows what NEES detects:" },
        { t: "table", head: ["Filter's σz (true 0.03 m)", "Filter's σa (true 0.5 m/s²)", "Mean NEES", "Position RMSE", "Verdict"], rows: [
          ["0.03", "0.5", "1.93", "15.3 mm", "Consistent, best RMSE"],
          ["0.01", "0.5", "10.57", "17.4 mm", "Overconfident in sensor"],
          ["0.03", "0.05", "82.51", "37.7 mm", "Badly overconfident in model"],
          ["0.1", "5.0", "0.11", "17.3 mm", "Underconfident: P far too large"],
        ] },
        { t: "p", text: "Notice that the overconfident sensor case has an RMSE only 14% worse than the correct one, but NEES is five times too large. RMSE alone would not have flagged it. On real hardware you rarely have ground truth for every state, so use NIS on the innovations (it needs no truth) and check that about 95% of single-step NIS values for a scalar measurement fall below 3.84." },
      ] },
      { t: "deep", title: "Practical evaluation protocol for the exit project", blocks: [
        { t: "p", text: "A credible evaluation is planned before you look at the results. Treat it like a lab experiment with a fixed procedure." },
        { t: "list", items: [
          "Define the test motions in advance: static for 60 s, slow tilts to ±30°, fast shakes, and a long run of 5 to 10 minutes for drift.",
          "Report per-axis RMSE and maximum error for each motion, and the drift rate in degrees per minute (attitude) or percent of distance travelled (odometry).",
          "Hold out data: tune Kp, Ki, Q or R on one log and report results on another, or you are measuring your tuning, not your filter.",
          "Show at least one baseline (raw gyro integration, or the i8 complementary filter, or wheel odometry alone) so improvement is measured, not asserted.",
          "For odometry, drive a closed loop (out and back to a floor mark) and report the end-point error; for a 1 m by 1 m square, under 5 cm is good with a gyro, 10 to 30 cm is common with wheels alone.",
        ] },
      ] },
    ],
    mistakes: [
      "Expecting an accelerometer and gyro alone to hold yaw. Yaw is unobservable without a magnetometer or an external heading source.",
      "Correcting tilt from the accelerometer while the robot accelerates hard, so braking looks like pitching forward.",
      "Integrating the accelerometer twice for position on a ground robot instead of using wheel odometry.",
      "Comparing estimator and reference without aligning timestamps and mounting rotation, then blaming the filter for the offset.",
      "Reporting only RMSE: a filter can have a good RMSE and a dangerously overconfident covariance, or one large failure averaged away.",
      "Tuning on the same log you report results on.",
    ],
    quiz: [
      {
        q: "With only a gyroscope and an accelerometer, which angle cannot be kept from drifting?",
        options: ["Roll", "Pitch", "Yaw", "None; all three are observable"],
        answer: 2,
        why: "Gravity is unchanged by rotation about the vertical, so the accelerometer cannot correct yaw.",
      },
      {
        q: "What does the integral term in the Mahony filter converge to?",
        options: ["The roll angle", "The negative of the gyro bias", "The accelerometer noise", "The magnetic declination"],
        answer: 1,
        why: "A steady error is what a constant gyro bias produces; the integral accumulates until it cancels the bias.",
      },
      {
        q: "A ground robot fuses wheel odometry and an IMU. Which split of responsibilities is standard?",
        options: [
          "Position from double-integrated accelerometer, heading from wheels",
          "Forward velocity from wheels, yaw rate from the gyro",
          "Everything from wheels; the IMU is only for logging",
          "Heading from the accelerometer",
        ],
        answer: 1,
        why: "Wheels measure distance well but slip in turns; the gyro measures yaw rate without slip. Double-integrated acceleration drifts quadratically.",
      },
      {
        q: "Errors (degrees) against a reference are 1, -2, 2, -1. What is the RMSE?",
        options: ["0", "1.5", "1.58", "2.5"],
        answer: 2,
        why: "√((1 + 4 + 4 + 1)/4) = √2.5 = 1.58°. The mean error is 0, which is why the mean is not a useful score.",
      },
      {
        q: "Why must the estimator log and the reference log be aligned in time before computing errors?",
        options: [
          "Because RMSE needs equal sample counts only",
          "A small time offset during fast motion appears as a large error that is not the filter's fault",
          "It is not necessary if both run at 100 Hz",
          "Because the reference has no noise",
        ],
        answer: 1,
        why: "At 100°/s a 50 ms offset is a 5° apparent error. Align with a common clock or cross-correlation.",
      },
    ],
    practice: {
      kind: "bench",
      task: "Exit project: build an attitude estimator (or fused odometry) for a robot and evaluate it against a reference.",
      steps: [
        "Attitude route: mount an MPU6050 (or MPU9250/ICM-20948 for a magnetometer) rigidly with a reference: a phone running a sensor-logging app, a servo with known angles, or an inclinometer. Log IMU at 100 Hz on an ESP32 with timestamps.",
        "Implement Mahony from ahrs.py on the ESP32 in C++ with float, the quaternion integration of lesson 4, and stream q at 50 Hz.",
        "Odometry route instead: on your differential-drive robot, run lesson 3's EKF with wheel v and gyro yaw rate, or configure robot_localization on ROS 2 Lyrical with wheel odometry and IMU topics.",
        "Align time and mounting frame, then compute RMSE, maximum error and drift for the test motions, against gyro-only (or wheel-only) baselines.",
        "Tune on one log and report on another. Include a consistency check (NIS, or NEES in simulation) if your filter produces covariances.",
        "Write a one-page report: setup, reference accuracy, results table, plots, and what limits your accuracy.",
      ],
    },
  },
};

export default lessons;
