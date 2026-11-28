import type { ModuleContent } from "../model/curriculum";

/**
 * Module i8: Sensors, measurement and signal processing.
 * Normal mode is a complete lesson; `deep` holds derivations and datasheet detail.
 * Every number in a worked example was checked with Python.
 */
const lessons: ModuleContent = {
  "i8-sensor-characteristics-and-uncertainty": {
    id: "i8-sensor-characteristics-and-uncertainty",
    outcomes: [
      "Read a sensor datasheet and explain range, sensitivity, linearity, hysteresis and drift",
      "Tell accuracy, precision and resolution apart, with an example of each going wrong",
      "Combine independent uncertainties in quadrature and propagate them through a formula",
      "Build a simple uncertainty budget and report a result as value ± expanded uncertainty",
    ],
    blocks: [
      { t: "h", text: "A number is not a measurement" },
      { t: "p", text: "Your thermometer prints 25.37 °C. Is the room at 25.37 °C? Almost certainly not to the hundredth of a degree, and possibly not even to the nearest degree. The digits on the screen tell you what the ADC returned and how your code formatted it. They say nothing about how close that is to the truth. A **measurement** is a number plus a statement of how much you trust it: 25.4 ± 0.4 °C. Engineers who can produce and defend that second part are the ones whose data gets used. This module teaches you to do it, starting with the vocabulary every sensor datasheet uses." },

      { t: "h", text: "Static characteristics of a sensor" },
      { t: "p", text: "A sensor converts a physical quantity (temperature, force, acceleration) into an electrical one (voltage, resistance, capacitance, a digital code). Its **transfer function** is the relationship between the two. The following terms describe how that relationship behaves when the input is steady or changes slowly." },
      { t: "list", items: [
        "**Range** (span): the input values the sensor is specified for. An LM35 covers -55 to 150 °C; an MPU6050 accelerometer can be set to ±2, ±4, ±8 or ±16 g. Outside the range the output may saturate or the part may be damaged.",
        "**Sensitivity**: how much the output changes per unit input, the slope of the transfer function. The LM35 gives 10 mV/°C. A load cell is quoted as, say, 2 mV/V at full load: with 5 V excitation the full-scale output is 10 mV.",
        "**Linearity** (non-linearity): how far the real transfer function departs from a straight line, usually given as a percentage of full scale. A thermistor is strongly non-linear; an RTD is nearly linear; an LM35 is within about ±0.5 °C of a straight line over its range.",
        "**Offset** (zero error): the output when the input is zero. A gyroscope at rest that reads 1.2 °/s has an offset, often called bias, of 1.2 °/s.",
        "**Hysteresis**: the output for the same input depends on whether you approached it from below or above. Capacitive humidity sensors and mechanical pressure sensors show this; a humidity sensor might read 2 %RH differently on the way up and on the way down.",
        "**Drift**: the output changes slowly over time or temperature with the input held constant. Gyroscope bias drifts with temperature; a strain gauge drifts as its adhesive creeps.",
        "**Response time**: how quickly the output follows a step in the input, often given as a time constant τ (time to reach 63% of the step). A thermistor in free air may have τ of 10 s or more.",
      ] },
      { t: "diagram", text: String.raw`
 output
   ^                       . ideal straight line
   |                  . '
   |             .  '  ___ real curve (non-linearity)
   |        .  ' _.-'
   |   .  '_.-'
   | .  .-'
   +-.'-----------------------> input
   ^
   offset: output at zero input`, caption: "Offset shifts the line, sensitivity is its slope, non-linearity is the gap between the real curve and the line." },

      { t: "h", text: "Accuracy, precision and resolution" },
      { t: "p", text: "These three are confused more than any other words in measurement, and the confusion causes real design errors." },
      { t: "list", items: [
        "**Resolution** is the smallest change in output you can see. A 10-bit ADC on a 5 V reference has steps of 5 / 1024 = 4.88 mV. With an LM35 at 10 mV/°C, that is a resolution of 0.49 °C. Resolution is a property of the readout, not of the truth.",
        "**Precision** (repeatability) is how closely repeated readings of the same input agree. If you read a steady input ten times and get values spread by ±0.1 °C, the measurement is precise to about that level.",
        "**Accuracy** is how close the reading is to the true value. The LM35 datasheet quotes ±0.5 °C at 25 °C for the A grade. That bound includes offset and gain errors you cannot see by repeating readings.",
      ] },
      { t: "p", text: "A measurement can be precise but not accurate: ten readings all within 0.05 °C of each other, all 1.5 °C too high because of an offset. It can have fine resolution and be neither: a 24-bit ADC reading a sensor with a loose wire. The classic picture is a target: tightly grouped shots away from the centre are precise but inaccurate; shots scattered around the centre are accurate on average but imprecise." },
      { t: "note", kind: "warn", text: "More decimal places never make a reading more accurate. Print only the digits your uncertainty justifies. If your uncertainty is ±0.4 °C, print 25.4, not 25.37." },

      { t: "h", text: "Systematic and random error" },
      { t: "p", text: "Every error is either **random** (it changes from reading to reading, like electrical noise) or **systematic** (it is the same each time, like an offset or a wrong gain). Averaging many readings shrinks random error: the standard deviation of the mean of n independent readings is s / √n. Averaging does nothing to systematic error. Only calibration against something better removes it, which is the subject of the next lesson." },
      { t: "formula", text: String.raw`mean        x̄ = (1/n) Σ xᵢ
std dev     s = √( Σ (xᵢ - x̄)² / (n - 1) )
std error   s_x̄ = s / √n`, caption: "Sample statistics for n repeated readings. Use n - 1 in the standard deviation of a sample." },

      { t: "h", text: "Propagating errors through a formula" },
      { t: "p", text: "Usually the quantity you want is calculated from several measured ones. Two rules, valid when the inputs are independent and their uncertainties are small, cover most cases." },
      { t: "formula", text: String.raw`Sum or difference:   q = a + b   or  q = a - b
                     u(q) = √( u(a)² + u(b)² )

Product or quotient: q = a × b  or  q = a / b
                     u(q)/q = √( (u(a)/a)² + (u(b)/b)² )

Power:               q = aⁿ
                     u(q)/q = |n| × u(a)/a`, caption: "Absolute uncertainties add in quadrature for sums; relative uncertainties add in quadrature for products." },
      { t: "p", text: "**Worked example.** You find a resistor's value from R = V / I with V = 2.00 V ± 0.02 V and I = 10.0 mA ± 0.1 mA. Then R = 200 Ω. Each input has a relative uncertainty of 1%, so the relative uncertainty of R is √(1² + 1²) = 1.41%, or ±2.8 Ω. Check against the worst case: if V were 1% high and I 1% low, R would be off by about 2%, or 4 Ω. Quadrature gives less than worst case because two independent errors rarely both hit their limits in the bad direction at once. Use worst case only when a failure would be dangerous; quadrature is the realistic estimate." },

      { t: "h", text: "Type A and Type B uncertainty" },
      { t: "p", text: "The international guide on uncertainty (the GUM) sorts every contribution by how you estimated it, not by where it came from." },
      { t: "list", items: [
        "**Type A**: estimated statistically from repeated readings. Read the input n times, compute s, and the standard uncertainty of the mean is s / √n.",
        "**Type B**: estimated from any other information, such as a datasheet limit, a calibration certificate, or the ADC step size. A datasheet bound of ±a with no further information is treated as a rectangular distribution (any value in the band equally likely), whose standard uncertainty is a / √3. A quantisation step q gives q / √12.",
      ] },
      { t: "p", text: "Once every contribution is a **standard uncertainty** (one standard deviation) in the same units, you combine them in quadrature into the **combined standard uncertainty** u_c. You then multiply by a **coverage factor** k, usually 2, to get the **expanded uncertainty** U = k × u_c, which covers roughly 95% of likely values. State k when you report it." },

      { t: "h", text: "Worked example: an uncertainty budget for a thermistor thermometer" },
      { t: "p", text: "You calibrated a thermistor thermometer against a reference thermometer and now read a room at 25.3 °C. The contributions, all in °C:" },
      { t: "table", head: ["Source", "Type", "Information", "Standard uncertainty"], rows: [
        ["Reference thermometer", "B", "certificate ±0.2 °C, rectangular", "0.2 / √3 = 0.115"],
        ["ADC resolution", "B", "one step is 0.1 °C at this temperature", "0.1 / √12 = 0.029"],
        ["Repeatability", "A", "10 readings, s = 0.15 °C", "0.15 / √10 = 0.047"],
        ["Fit residual and self-heating", "B", "±0.3 °C bound, rectangular", "0.3 / √3 = 0.173"],
      ], caption: "Every row is converted to a standard uncertainty before combining." },
      { t: "formula", text: String.raw`u_c = √( 0.115² + 0.029² + 0.047² + 0.173² )
    = √( 0.0133 + 0.0008 + 0.0022 + 0.0300 )
    = √0.0463 ≈ 0.215 °C
U   = 2 × 0.215 ≈ 0.43 °C`, caption: "Combined and expanded uncertainty." },
      { t: "p", text: "Report: **25.3 ± 0.4 °C (k = 2)**. Two lessons fall out of the table. First, the ADC resolution barely matters; buying a 16-bit ADC would not help. Second, the largest term is the fit residual and self-heating, so that is where effort pays off. A budget tells you what to improve, which is its real value." },

      { t: "deep", title: "Why independent uncertainties add in quadrature", blocks: [
        { t: "p", text: "Suppose q = f(a, b) and a and b have small independent errors δa and δb. A first-order Taylor expansion gives δq ≈ (∂f/∂a) δa + (∂f/∂b) δb. Square it and take the expected value over many repeats." },
        { t: "formula", text: String.raw`δq² = (∂f/∂a)² δa² + (∂f/∂b)² δb² + 2 (∂f/∂a)(∂f/∂b) δa δb
E[δa δb] = 0          (independent, zero-mean errors)
u(q)²   = (∂f/∂a)² u(a)² + (∂f/∂b)² u(b)²`, caption: "The cross term averages to zero, leaving a sum of squares." },
        { t: "p", text: "For q = a / b, ∂q/∂a = 1/b and ∂q/∂b = -a/b². Divide through by q² and you get the relative-uncertainty rule above. If the inputs are correlated (for example two readings from the same ADC with a shared reference error) the cross term does not vanish, and you must either include a covariance term or treat the shared part as one contribution. Ratiometric measurements exploit exactly this: a shared reference error cancels in a ratio." },
      ] },
      { t: "deep", title: "Where a / √3 and q / √12 come from", blocks: [
        { t: "p", text: "A rectangular distribution of half-width a has probability density 1/(2a) between -a and +a. Its variance is ∫ x² /(2a) dx from -a to a, which is a²/3. So the standard deviation is a / √3." },
        { t: "p", text: "Quantisation is the same shape. The rounding error of an ideal ADC lies anywhere between -q/2 and +q/2, so the half-width is q/2 and the standard deviation is (q/2)/√3 = q/√12. This same result reappears in lesson 3 as quantisation noise." },
        { t: "p", text: "If you know a bound is more likely near its centre, a triangular distribution (a / √6) is less pessimistic. If a certificate already states a standard uncertainty or an expanded uncertainty with k = 2, divide by k and use it directly; do not divide by √3 again." },
      ] },
    ],
    mistakes: [
      "**Treating resolution as accuracy.** A 12-bit reading of a ±2 °C sensor is still ±2 °C.",
      "**Averaging to remove an offset.** Averaging shrinks random noise only. A systematic error needs calibration.",
      "**Adding uncertainties linearly by default.** Independent contributions add in quadrature; linear addition is a worst case.",
      "**Mixing standard and expanded uncertainties in one budget.** Convert every row to one standard deviation before combining.",
      "**Printing every digit the code produces.** Round the result to match the uncertainty.",
    ],
    practice: {
      kind: "bench",
      task: "Measure the repeatability of an analog temperature sensor and write a short uncertainty budget.",
      steps: [
        "Connect an LM35 (or a thermistor divider) to A0 on the Uno. Log 100 readings at 10 Hz to the Serial Monitor and paste them into a spreadsheet or Python.",
        "Compute the mean, the standard deviation s and the standard uncertainty of the mean s / √n.",
        "Look up the sensor's accuracy in its datasheet and convert it to a standard uncertainty with a / √3.",
        "Compute the ADC resolution in °C and its standard uncertainty q / √12.",
        "Combine everything in quadrature, multiply by 2, and write your reading as value ± U (k = 2). Identify the largest term.",
      ],
    },
    quiz: [
      {
        q: "Ten readings of a steady input all lie within 0.05 °C of each other, but a reference thermometer shows they are all 1.5 °C high. The measurement is:",
        options: ["Accurate but not precise", "Precise but not accurate", "Both accurate and precise", "Limited by resolution"],
        answer: 1,
        why: "Tight agreement between readings is precision. A consistent 1.5 °C error is a systematic error, so it is not accurate.",
      },
      {
        q: "An LM35 (10 mV/°C) is read by a 10-bit ADC with a 5 V reference. What is the temperature resolution?",
        options: ["0.1 °C", "0.25 °C", "0.49 °C", "4.9 °C"],
        answer: 2,
        why: "One ADC step is 5 / 1024 = 4.88 mV, and 4.88 mV divided by 10 mV/°C is about 0.49 °C.",
      },
      {
        q: "P = V × I with V known to 2% and I known to 1.5%, independent. What is the relative uncertainty of P?",
        options: ["3.5%", "2.5%", "1.75%", "0.5%"],
        answer: 1,
        why: "For a product, relative uncertainties add in quadrature: √(2² + 1.5²) = √6.25 = 2.5%.",
      },
      {
        q: "A datasheet gives a bound of ±0.6 °C and nothing else. What standard uncertainty do you enter in the budget?",
        options: ["0.6 °C", "0.3 °C", "0.35 °C", "0.17 °C"],
        answer: 2,
        why: "A bare bound is treated as rectangular, so the standard uncertainty is 0.6 / √3 ≈ 0.35 °C.",
      },
      {
        q: "In the lesson's budget, which change would reduce the uncertainty most?",
        options: [
          "Using a 16-bit ADC",
          "Taking 100 readings instead of 10",
          "Reducing the fit residual and self-heating term",
          "Printing more decimal places",
        ],
        answer: 2,
        why: "The fit and self-heating term (0.173 °C) dominates the quadrature sum. Shrinking small terms such as ADC resolution (0.029 °C) barely changes the total.",
      },
    ],
  },

  "i8-calibration-and-curve-fitting": {
    id: "i8-calibration-and-curve-fitting",
    outcomes: [
      "Perform a two-point calibration and say when it is enough",
      "Build a lookup table and interpolate between its entries in C",
      "Fit a straight line by least squares and judge the fit from its residuals",
      "Convert NTC thermistor resistance to temperature with the Beta and Steinhart-Hart equations",
    ],
    blocks: [
      { t: "h", text: "Why calibrate" },
      { t: "p", text: "The previous lesson showed that averaging cannot remove systematic error. Calibration can. You expose your sensor to a set of known inputs, record what it reports, and build a correction that maps raw readings to true values. Every serious measurement system does this: weighing scales are checked with test weights, thermometers against a reference in a stirred bath, and phone accelerometers against gravity on the factory line. The method you choose depends on how non-linear the sensor is and how much accuracy you need." },
      { t: "p", text: "Calibration needs a **reference** that is noticeably better than what you are calibrating, ideally three to ten times more accurate. Some references are free: ice in water is 0 °C within about 0.1 °C if it is crushed, stirred and mostly ice; gravity is 1 g (9.81 m/s²) and points down; a phone app is not a reference." },

      { t: "h", text: "Two-point calibration" },
      { t: "p", text: "If the sensor is linear and only its offset and gain are wrong, two known points define the correction completely. Read raw values r1 and r2 at known true values y1 and y2, then map any raw reading r to a calibrated value y." },
      { t: "formula", text: String.raw`gain   m = (y2 - y1) / (r2 - r1)
value  y = y1 + m × (r - r1)`, caption: "The straight line through two calibration points." },
      { t: "p", text: "**Worked example.** A temperature sensor reads raw 102 in an ice bath (0.0 °C) and raw 925 in boiling water (taken as 100.0 °C at sea level; at higher altitude water boils lower, so check). The gain is 100 / (925 - 102) = 0.12151 °C per count. A raw reading of 515 gives 0 + 0.12151 × (515 - 102) = 50.18 °C. Choose calibration points that bracket the range you care about; extrapolating a two-point line far outside its points multiplies any small gain error." },

      { t: "h", text: "Multi-point calibration and least squares" },
      { t: "p", text: "With more than two points you can check linearity and average out the noise in each calibration reading. Suppose you record five points with a reference thermometer:" },
      { t: "table", head: ["Raw reading", "Reference (°C)", "Least-squares fit (°C)", "Residual (°C)"], rows: [
        ["102", "0.0", "-0.09", "-0.09"],
        ["310", "25.1", "25.22", "+0.12"],
        ["515", "50.3", "50.15", "-0.15"],
        ["720", "74.8", "75.09", "+0.29"],
        ["925", "100.2", "100.03", "-0.17"],
      ], caption: "Residual = fit minus reference. Fit: T = 0.121643 × raw - 12.4933." },
      { t: "p", text: "The **least-squares line** is the straight line that minimises the sum of the squared vertical distances (residuals) between the points and the line. Its slope and intercept have closed forms:" },
      { t: "formula", text: String.raw`m = ( n Σxy - Σx Σy ) / ( n Σx² - (Σx)² )
c = ( Σy - m Σx ) / n`, caption: "Least-squares slope and intercept for n points (x = raw, y = reference)." },
      { t: "p", text: "Always look at the residuals, not only the line. If they scatter randomly around zero with no pattern, a straight line is a good model and their spread tells you the calibration uncertainty (here about ±0.3 °C). If they form a smile or a frown (negative at both ends, positive in the middle, or the reverse), the sensor is non-linear and you need a curve: a quadratic, a lookup table, or a physical model such as the thermistor equations below." },
      { t: "snippet", lang: "python", code: String.raw`import numpy as np

raw = np.array([102, 310, 515, 720, 925], dtype=float)
ref = np.array([0.0, 25.1, 50.3, 74.8, 100.2])

m, c = np.polyfit(raw, ref, 1)          # degree 1: straight line
resid = (m * raw + c) - ref
print(f"T = {m:.6f} * raw + {c:.4f}")    # T = 0.121643 * raw + -12.4933
print("residuals:", np.round(resid, 2))  # [-0.09  0.12 -0.15  0.29 -0.17]
print(f"rms residual = {np.sqrt(np.mean(resid**2)):.3f} C")

# Try a quadratic and compare: if residuals barely shrink, keep the line.
p2 = np.polyfit(raw, ref, 2)
print("quadratic residuals:", np.round(np.polyval(p2, raw) - ref, 2))`, caption: "Fitting the calibration on a PC. Put the resulting m and c into the firmware as constants." },

      { t: "h", text: "Lookup tables with linear interpolation" },
      { t: "p", text: "When a sensor is non-linear and you do not have, or do not trust, an equation for it, store the calibration points themselves and interpolate between neighbours. This is cheap on a microcontroller, needs no floating-point maths if you use integers, and matches the calibration exactly at every point." },
      { t: "p", text: "**Worked example.** Using the table above, a raw reading of 600 lies between 515 (50.3 °C) and 720 (74.8 °C). The fraction of the way along is (600 - 515) / (720 - 515) = 85 / 205 = 0.4146. So T = 50.3 + 0.4146 × (74.8 - 50.3) = 50.3 + 10.16 = **60.46 °C**." },
      { t: "snippet", lang: "c", code: String.raw`// Lookup table with linear interpolation. Raw values must be ascending.
typedef struct { int raw; float value; } CalPoint;

static const CalPoint CAL[] = {
  { 102,   0.0f }, { 310,  25.1f }, { 515,  50.3f },
  { 720,  74.8f }, { 925, 100.2f },
};
static const int N_CAL = sizeof(CAL) / sizeof(CAL[0]);

float calibrate(int raw) {
  if (raw <= CAL[0].raw) return CAL[0].value;          // clamp below
  if (raw >= CAL[N_CAL - 1].raw) return CAL[N_CAL - 1].value; // clamp above
  int i = 1;
  while (CAL[i].raw < raw) i++;                        // first point above raw
  const CalPoint *a = &CAL[i - 1], *b = &CAL[i];
  float f = (float)(raw - a->raw) / (b->raw - a->raw);
  return a->value + f * (b->value - a->value);         // calibrate(600) = 60.46
}`, caption: "Clamping at the ends is a deliberate choice: it never extrapolates into territory you did not calibrate." },

      { t: "h", text: "Worked case: the NTC thermistor" },
      { t: "p", text: "An NTC (negative temperature coefficient) thermistor is a resistor whose value falls steeply as it warms. A common part is 10 kΩ at 25 °C. It is cheap, sensitive (about -4% per °C near room temperature) and very non-linear, which makes it the standard calibration exercise." },
      { t: "p", text: "**Step 1: resistance from the ADC.** Put a fixed 10 kΩ resistor from the supply to the ADC pin and the thermistor from the pin to ground. Because the ADC reference and the divider share the same supply, the supply voltage cancels (a **ratiometric** measurement):" },
      { t: "formula", text: String.raw`R_ntc = R_fixed × adc / (1023 - adc)
adc = 341  →  R_ntc = 10000 × 341 / 682 = 5000 Ω`, caption: "Thermistor on the bottom of the divider, 10-bit ADC." },
      { t: "p", text: "**Step 2: the Beta equation.** Over a modest range, the thermistor's resistance follows an exponential law with one material constant β (Beta), given in the datasheet or found from two calibration points. Temperatures in this equation are in kelvin." },
      { t: "formula", text: String.raw`1/T = 1/T0 + (1/β) × ln(R / R0)

R0 = 10 000 Ω at T0 = 298.15 K, β = 3891 K, R = 5000 Ω
1/T = 1/298.15 + ln(0.5)/3891
    = 0.0033540 - 0.0001781 = 0.0031759
T   = 314.87 K = 41.72 °C`, caption: "The Beta equation. β here came from the part's resistance at 0 °C and 50 °C." },
      { t: "p", text: "**Step 3: Steinhart-Hart.** The Beta model is an approximation; its error grows away from the points used to find β. The Steinhart-Hart equation adds a cubic term and fits the real curve to within a few hundredths of a degree over a wide range. You find A, B and C from three calibration points by solving three linear equations." },
      { t: "formula", text: String.raw`1/T = A + B ln(R) + C (ln R)³

From R = 32 650 Ω at 0 °C, 10 000 Ω at 25 °C, 3603 Ω at 50 °C:
A = 1.1253e-3,  B = 2.3472e-4,  C = 8.563e-8

R = 5000 Ω:  ln R = 8.5172
1/T = 1.1253e-3 + 2.3472e-4 × 8.5172 + 8.563e-8 × 617.9
    = 1.1253e-3 + 1.9992e-3 + 0.0529e-3 = 3.1774e-3
T   = 314.73 K = 41.58 °C`, caption: "Steinhart-Hart with three calibration points." },
      { t: "p", text: "The two models disagree by 0.14 °C at 41.6 °C, even though both match exactly at 25 °C. If your uncertainty budget is ±0.5 °C, the Beta equation is fine. If you need ±0.1 °C, use Steinhart-Hart, and calibrate the actual part rather than trusting the datasheet's nominal values, because a 1% resistance tolerance alone is about 0.25 °C." },
      { t: "note", kind: "tip", text: "Keep the thermistor current small. With 10 kΩ and 10 kΩ on 5 V, the thermistor dissipates up to about 0.6 mW, which in still air can warm it by a few tenths of a degree. That is the self-heating row in the previous lesson's budget." },

      { t: "deep", title: "Deriving the least-squares formulas", blocks: [
        { t: "p", text: "Define the cost S(m, c) = Σ (m xᵢ + c - yᵢ)². At the minimum both partial derivatives are zero." },
        { t: "formula", text: String.raw`∂S/∂c = 2 Σ (m xᵢ + c - yᵢ)     = 0  →  m Σx  + n c   = Σy
∂S/∂m = 2 Σ xᵢ (m xᵢ + c - yᵢ) = 0  →  m Σx² + c Σx  = Σxy

| Σx²  Σx |   | m |     | Σxy |
| Σx   n  | × | c |  =  | Σy  |`, caption: "The normal equations." },
        { t: "p", text: "Solving the 2 × 2 system by Cramer's rule gives the slope and intercept formulas in the lesson. The same idea extends to any model that is linear in its unknown coefficients, including polynomials and Steinhart-Hart (unknowns A, B, C; inputs 1, ln R, (ln R)³). With more than three thermistor calibration points you would solve the over-determined system by least squares instead of exactly, which also gives you residuals to judge the fit." },
        { t: "p", text: "Least squares assumes the error is in y, not x. In calibration that is reasonable when the reference (y) is much better than the sensor, but note the subtlety: here x is the sensor's raw reading, which is the noisier one. When both have comparable errors, orthogonal (total least squares) regression is the correct tool. For a reference three or more times better than the sensor, the ordinary fit is adequate." },
      ] },
      { t: "deep", title: "Where the Beta equation comes from, and its limits", blocks: [
        { t: "p", text: "In a semiconductor the number of charge carriers rises with temperature roughly as exp(-Eg / 2kT), where Eg is an activation energy and k is Boltzmann's constant. Resistance is inversely proportional to the carrier count, so R ∝ exp(β/T) with β = Eg / 2k. Taking the ratio at two temperatures removes the constant of proportionality: R/R0 = exp(β (1/T - 1/T0)), which rearranges into the Beta equation." },
        { t: "p", text: "In reality the activation energy itself varies slowly with temperature, so β is not constant. Datasheets therefore quote β with its temperature pair, such as B25/50 = 3950 K or B25/85 = 3977 K. Using a B25/85 value for a 0 °C measurement can be off by a degree. Steinhart-Hart's cubic term models the drift of β with temperature, which is why three points fit it so well." },
        { t: "p", text: "Industrial practice adds two more things: a stated interchangeability tolerance (how closely any two parts follow the same curve, often ±0.2 °C or ±1% R25) and a dissipation constant in mW/°C used to calculate self-heating. A thermistor with 1.5 mW/°C dissipating 0.6 mW warms by 0.4 °C." },
      ] },
    ],
    mistakes: [
      "**Extrapolating a two-point line** far beyond the calibration points. Small gain errors grow with distance.",
      "**Using Celsius in the Beta or Steinhart-Hart equation.** Both need kelvin: add 273.15.",
      "**Judging a fit by its line alone.** A curved pattern in the residuals means the model is wrong, even if the line looks close.",
      "**Calibrating at one temperature and using the device at another** without checking drift.",
      "**Treating a careless ice bath as 0 °C.** A glass of water with two cubes floating in it can be several degrees warm. Pack it with crushed ice and stir.",
      "**Forgetting the fixed resistor tolerance** in a thermistor divider. A 5% fixed resistor adds about 1 °C of error unless you calibrate the pair together.",
    ],
    practice: {
      kind: "bench",
      task: "Calibrate a 10 kΩ NTC thermistor and compare the Beta and Steinhart-Hart models.",
      steps: [
        "Wire a 10 kΩ 1% resistor from 5 V to A0 on the Uno and the thermistor from A0 to GND. Print the raw ADC value averaged over 32 readings once a second.",
        "Record three points against a reference thermometer: a well-stirred crushed-ice bath, room temperature, and warm water near 50 °C. Wait until the reading is steady at each.",
        "Convert each raw value to resistance. Solve for A, B and C of Steinhart-Hart on a PC (three equations, three unknowns), and find β from the cold and warm points.",
        "Add a fourth point at a different temperature and compare both models against the reference there.",
        "Put the better model in your sketch and print temperature with only the digits your residuals justify.",
      ],
    },
    quiz: [
      {
        q: "A sensor reads raw 200 at 0 °C and raw 1000 at 100 °C. Assuming it is linear, what temperature does raw 600 correspond to?",
        options: ["60 °C", "50 °C", "40 °C", "75 °C"],
        answer: 1,
        why: "The gain is 100 / (1000 - 200) = 0.125 °C per count. 0.125 × (600 - 200) = 50 °C.",
      },
      {
        q: "After a straight-line fit, the residuals are negative at both ends and positive in the middle. What does this tell you?",
        options: [
          "The fit is excellent",
          "The reference thermometer is broken",
          "The sensor is non-linear and a straight line is the wrong model",
          "You need fewer calibration points",
        ],
        answer: 2,
        why: "A systematic curve in the residuals means the true relationship is curved. Random scatter would mean the line is adequate.",
      },
      {
        q: "A lookup table has raw 400 → 20 °C and raw 600 → 40 °C. What does linear interpolation give for raw 450?",
        options: ["22.5 °C", "25 °C", "30 °C", "45 °C"],
        answer: 1,
        why: "450 is a quarter of the way from 400 to 600, so the value is 20 + 0.25 × 20 = 25 °C.",
      },
      {
        q: "A 10 kΩ fixed resistor sits above an NTC thermistor on a 10-bit ADC, both on the same supply. The ADC reads 512. What is the thermistor resistance, approximately?",
        options: ["5 kΩ", "10 kΩ", "20 kΩ", "It depends on the supply voltage"],
        answer: 1,
        why: "R = 10 kΩ × 512 / (1023 - 512) ≈ 10.0 kΩ. The divider is ratiometric, so the supply voltage cancels.",
      },
      {
        q: "Why does the Steinhart-Hart equation usually fit a thermistor better than the Beta equation?",
        options: [
          "It uses Celsius instead of kelvin",
          "Its extra cubic term accounts for β changing with temperature",
          "It ignores the logarithm",
          "It needs only one calibration point",
        ],
        answer: 1,
        why: "The Beta model assumes a constant β. In reality β drifts with temperature, and the third Steinhart-Hart coefficient captures that curvature.",
      },
    ],
  },

  "i8-sampling-and-digital-filters": {
    id: "i8-sampling-and-digital-filters",
    outcomes: [
      "State the sampling theorem and choose a sampling rate for a signal",
      "Calculate the alias frequency of a signal sampled too slowly",
      "Estimate quantisation noise and the ideal SNR of an N-bit ADC",
      "Implement moving-average, exponential and median filters in C and choose between them",
    ],
    blocks: [
      { t: "h", text: "Why sampling needs theory" },
      { t: "p", text: "A microcontroller does not watch a signal continuously. It takes snapshots, samples, at intervals, and rounds each one to a whole number of ADC steps. Both steps throw information away. Sample too slowly and a fast signal masquerades as a slow one that was never there. Round too coarsely and you add noise. Then, to clean up what remains, you filter, and every filter trades noise for delay. This lesson gives you the rules for each step so you can choose numbers on purpose rather than by habit." },

      { t: "h", text: "The sampling theorem" },
      { t: "p", text: "Sampling at rate fs (samples per second) can represent a signal faithfully only if the signal contains no frequencies at or above **fs / 2**, the **Nyquist frequency**. Equivalently, to capture a signal whose highest frequency is f_max, you need fs > 2 f_max. This is the Nyquist-Shannon sampling theorem." },
      { t: "formula", text: String.raw`fs > 2 × f_max
f_Nyquist = fs / 2`, caption: "The minimum sampling rate. In practice sample 5 to 10 times f_max for a signal you want to look at, not just reconstruct." },
      { t: "p", text: "The theorem's minimum is a mathematical limit that assumes perfect reconstruction filters. Real systems sample faster. To see the shape of a 10 Hz vibration on a plot you want 100 Hz or more. For a control loop the sampling rate is usually 10 to 20 times the bandwidth you want the loop to have." },

      { t: "h", text: "Aliasing" },
      { t: "p", text: "If a frequency above fs / 2 reaches the ADC, it does not disappear. It appears, after sampling, as a lower frequency called an **alias**, and nothing in the samples tells you it is fake. The alias frequency is the distance from the input frequency to the nearest whole multiple of fs." },
      { t: "formula", text: String.raw`f_alias = | f - k × fs |,   k = the integer that makes this smallest`, caption: "The result always lies between 0 and fs / 2." },
      { t: "p", text: "**Worked example 1.** You sample a light sensor at 60 Hz and the room is lit by lamps that flicker at 100 Hz (twice the 50 Hz mains in India). The nearest multiple of 60 to 100 is 120, so f_alias = |100 - 120| = **20 Hz**. Your log shows a slow 20 Hz ripple that does not exist in the room. Check: 20 Hz is below the 30 Hz Nyquist frequency, as an alias must be." },
      { t: "p", text: "**Worked example 2.** A motor vibrates at 900 Hz and you sample an accelerometer at 1000 Hz. f_alias = |900 - 1000| = **100 Hz**. A controller tuned on that data would chase a 100 Hz vibration that is not real." },
      { t: "diagram", text: String.raw`
 true signal (fast)      ╱╲  ╱╲  ╱╲  ╱╲  ╱╲  ╱╲  ╱╲  ╱╲  ╱╲
                        ╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲
 samples                ●         ●         ●         ●
 what the samples show  ●‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾●‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾●   a slow wave`, caption: "Sampling a fast wave slightly less than once per cycle produces a slow false wave." },
      { t: "widget", id: "aliasing" },
      { t: "p", text: "The only cure is to remove frequencies above fs / 2 **before** sampling, with an analog **anti-aliasing filter**. A simple RC low-pass in front of the ADC pin is often enough for slow sensors. Many digital sensors (the MPU6050 in the next lesson, for example) have a configurable low-pass filter inside the chip for exactly this reason. A digital filter applied after sampling cannot remove an alias; by then it is indistinguishable from a real signal." },

      { t: "h", text: "Quantisation noise" },
      { t: "p", text: "An N-bit ADC with reference Vref divides the range into 2ᴺ steps of size q = Vref / 2ᴺ. Each sample is rounded to the nearest step, so it carries an error of up to ±q/2. For a busy signal this rounding error behaves like random noise spread evenly over that band, with an rms value of q / √12 (the same result as the rectangular distribution in lesson 1)." },
      { t: "formula", text: String.raw`q        = Vref / 2ᴺ
noise_rms = q / √12
SNR_ideal = 6.02 N + 1.76 dB     (full-scale sine wave)

Uno, N = 10, Vref = 5 V:
q = 4.883 mV,  noise_rms = 1.41 mV,  SNR = 61.96 dB
N = 12:        SNR = 74.0 dB`, caption: "Each extra bit is worth about 6 dB, a factor of two in amplitude." },
      { t: "p", text: "Real ADCs do worse than ideal because of their own noise and non-linearity; the datasheet's **ENOB** (effective number of bits) tells you how many bits are really useful. The ESP32's 12-bit ADC, for example, has an ENOB well below 12 and is noticeably non-linear near the ends of its range, which is why Espressif provides calibration functions for it." },
      { t: "note", kind: "tip", text: "Oversampling buys resolution: averaging 4ᵏ samples gains k bits, provided the signal carries at least about one step of random noise (dither) so the samples actually differ. Averaging 16 Uno readings of a noisy input gives roughly 12-bit resolution at one sixteenth of the rate." },

      { t: "h", text: "Digital filters" },
      { t: "p", text: "Once the samples are in memory, a digital filter combines each new sample with past ones to suppress noise. Three filters cover most embedded needs." },
      { t: "p", text: "**Moving average** (boxcar). Output is the mean of the last N samples. For white noise it reduces the standard deviation by √N, so N = 8 cuts noise to 35%. It delays the signal by (N - 1)/2 samples, and its frequency response has nulls at multiples of fs / N. That makes it a neat trick for mains hum: at fs = 400 Hz, N = 8 puts a null exactly at 50 Hz. At fs = 100 Hz, N = 8 has its -3 dB point near 5.6 Hz (about 0.443 fs / N) and a 35 ms delay." },
      { t: "p", text: "**Exponential moving average** (EMA), a first-order IIR filter. Each output moves a fraction α of the way towards the new sample. It needs one stored value instead of N, and it is the digital twin of an RC low-pass filter." },
      { t: "formula", text: String.raw`y[n] = y[n-1] + α (x[n] - y[n-1])
     = α x[n] + (1 - α) y[n-1]

time constant  τ ≈ Δt (1 - α) / α
cut-off        fc = 1 / (2π τ)
choosing α     α = 2π fc Δt / (1 + 2π fc Δt)

fs = 100 Hz (Δt = 0.01 s), α = 0.1:
τ = 0.01 × 0.9 / 0.1 = 0.09 s,  fc ≈ 1.8 Hz
fc = 5 Hz wanted:  α = 0.314 / 1.314 = 0.239`, caption: "Smaller α means heavier smoothing, lower cut-off and more lag." },
      { t: "p", text: "**Median filter**. Output is the middle value of the last N samples (N odd). It is not linear, so it has no cut-off frequency in the usual sense. Its strength is that a single wild sample (an ultrasonic sensor's false echo, an I2C glitch, a spark) is ignored completely, whereas a moving average smears the spike into several outputs. A median of 3 or 5 followed by an EMA is a robust combination for range sensors." },
      { t: "table", head: ["Filter", "Memory", "Best at", "Weakness"], rows: [
        ["Moving average, N", "N samples", "White noise, nulling a known frequency", "Delay of (N-1)/2 samples, poor stop-band"],
        ["EMA, α", "1 value", "Cheap smoothing, tunable like an RC", "Long tail; a spike decays slowly"],
        ["Median, N", "N samples + sort", "Isolated spikes and outliers", "Distorts fast edges in small ways, more CPU"],
      ], caption: "Choosing a filter." },
      { t: "widget", id: "digital-filters" },
      { t: "snippet", lang: "cpp", code: String.raw`// Three filters on one noisy ADC channel (A0 on the Uno), sampled at 100 Hz.
// Open the Serial Plotter to compare raw, moving average, EMA and median.

const uint8_t N_MA = 8;
const uint8_t N_MED = 5;
const float ALPHA = 0.1;

// Moving average with a running sum: O(1) per sample.
uint16_t maBuf[N_MA];
uint8_t maIdx = 0;
uint32_t maSum = 0;
float movingAverage(uint16_t x) {
  maSum -= maBuf[maIdx];
  maBuf[maIdx] = x;
  maSum += x;
  maIdx = (maIdx + 1) % N_MA;
  return (float)maSum / N_MA;
}

// Exponential moving average (first-order IIR low-pass).
float emaState = 0;
bool emaStarted = false;
float ema(float x) {
  if (!emaStarted) { emaState = x; emaStarted = true; }
  emaState += ALPHA * (x - emaState);
  return emaState;
}

// Median of the last N_MED samples: sort a copy (insertion sort, N is tiny).
uint16_t medBuf[N_MED];
uint8_t medIdx = 0;
uint16_t median(uint16_t x) {
  medBuf[medIdx] = x;
  medIdx = (medIdx + 1) % N_MED;
  uint16_t s[N_MED];
  for (uint8_t i = 0; i < N_MED; i++) {
    uint16_t v = medBuf[i];
    int8_t j = i - 1;
    while (j >= 0 && s[j] > v) { s[j + 1] = s[j]; j--; }
    s[j + 1] = v;
  }
  return s[N_MED / 2];
}

void setup() {
  Serial.begin(115200);
  uint16_t first = analogRead(A0);
  for (uint8_t i = 0; i < N_MA; i++) { maBuf[i] = first; maSum += first; }
  for (uint8_t i = 0; i < N_MED; i++) medBuf[i] = first;
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last < 10) return;   // 100 Hz
  last += 10;
  uint16_t x = analogRead(A0);
  Serial.print(x); Serial.print(' ');
  Serial.print(movingAverage(x)); Serial.print(' ');
  Serial.print(ema(x)); Serial.print(' ');
  Serial.println(median(x));
}`, caption: "Arduino Uno sketch, compiled with arduino-cli for arduino:avr:uno. Buffers are pre-filled with the first reading so the filters do not start from zero." },
      { t: "note", kind: "warn", text: "Sample at a fixed rate. Every filter constant above assumes a constant Δt. A loop that sometimes takes 10 ms and sometimes 30 ms changes the filter's cut-off from moment to moment. Use `last += 10` scheduling as in the sketch, or a timer interrupt." },

      { t: "deep", title: "Deriving SNR = 6.02N + 1.76 dB", blocks: [
        { t: "p", text: "Take an ideal N-bit ADC with full-scale range Vref and step q = Vref / 2ᴺ. Apply a sine wave that just fills the range: amplitude A = Vref / 2 = 2ᴺ q / 2." },
        { t: "formula", text: String.raw`signal power   P_s = A² / 2 = (2ᴺ q / 2)² / 2 = 2²ᴺ q² / 8
noise power    P_n = q² / 12
SNR            = P_s / P_n = (2²ᴺ / 8) × 12 = 1.5 × 2²ᴺ
SNR (dB)       = 10 log10(1.5) + 2N × 10 log10(2)
               = 1.76 + 6.02 N`, caption: "The 6.02 is 20 log10(2); the 1.76 comes from the ratio of a sine wave's power to a full-scale square's." },
        { t: "p", text: "The noise power q²/12 assumes the rounding error is uniformly distributed and uncorrelated with the signal. That is true for a busy signal spanning many steps. It fails for a DC input or a slow signal that sits on one code: then the error is a fixed offset, not noise, and averaging cannot reduce it. This is why oversampling needs dither." },
        { t: "p", text: "The noise is spread evenly from 0 to fs / 2. If you oversample by a factor M and then low-pass filter to the original bandwidth, only 1/M of the noise power remains, an improvement of 10 log10(M) dB. M = 4 gives 6.02 dB, one bit, which is where the 4ᵏ rule comes from. Sigma-delta ADCs push this idea much further by shaping the noise away from the band of interest." },
      ] },
      { t: "deep", title: "Frequency response of the moving average and the EMA", blocks: [
        { t: "p", text: "Feed a moving average of length N a sine of frequency f. Its output is the sum of N phasors spaced by 2πf/fs, which gives a gain magnitude of |sin(πfN/fs) / (N sin(πf/fs))|. This is zero whenever fN/fs is a whole number, the nulls at multiples of fs/N. Between the nulls the side lobes only fall slowly (the first is at about -13 dB), which is why a moving average is a poor general low-pass filter despite being a good noise averager." },
        { t: "p", text: "The EMA's transfer function is H(z) = α / (1 - (1 - α) z⁻¹). Compare it with an RC filter sampled every Δt: the RC's discrete solution is y[n] = y[n-1] + (Δt/(RC + Δt))(x[n] - y[n-1]) using a backward-difference approximation, so α = Δt / (τ + Δt), which rearranges to τ = Δt(1 - α)/α as used in the lesson. The exact equivalence (matching the step response) is τ = -Δt / ln(1 - α), which for α = 0.1 at 100 Hz gives 0.0949 s and fc = 1.68 Hz, close to the 1.8 Hz approximation." },
        { t: "p", text: "When you need a sharper cut-off than these offer, the next steps are a second-order IIR section (a biquad, designed by the bilinear transform from a Butterworth prototype) or an FIR filter designed with a window. Tools such as Python's scipy.signal.butter produce the coefficients. They belong to module a1, but knowing they exist stops you stacking ten moving averages to imitate one." },
      ] },
    ],
    mistakes: [
      "**Filtering digitally to remove an alias.** Once aliased, the false frequency looks real. Filter in analog before the ADC.",
      "**Using the theoretical minimum of 2 × f_max.** Sample at least 5 to 10 times the highest frequency you care about.",
      "**Variable loop timing with fixed filter constants.** The cut-off moves as Δt changes.",
      "**Starting an EMA from zero.** It takes many samples to climb to the real value; initialise it with the first reading.",
      "**Using a moving average on spiky data.** One outlier corrupts N outputs. Use a median first.",
      "**Expecting oversampling to work on a perfectly steady input.** Without noise every sample is the same code and averaging gains nothing.",
    ],
    practice: {
      kind: "bench",
      task: "See aliasing and filtering on real data.",
      steps: [
        "Connect an LDR divider to A0 on the Uno and point it at a mains-powered LED or tube light (not daylight).",
        "Sample at 1000 Hz for one second and print the values; plot them. You should see the 100 Hz flicker.",
        "Now sample at 110 Hz. Predict the alias (|100 - 110| = 10 Hz), plot it and confirm the slow false wave.",
        "Add a 10 kΩ and 1 µF RC low-pass (fc ≈ 16 Hz) between the divider and A0 and repeat at 110 Hz. Explain why the alias amplitude falls.",
        "Load the three-filter sketch, tap the sensor wire to inject spikes, and compare the four traces on the Serial Plotter.",
      ],
    },
    quiz: [
      {
        q: "You sample at 200 Hz. A 190 Hz signal reaches the ADC. At what frequency does it appear in the samples?",
        options: ["190 Hz", "10 Hz", "90 Hz", "It is removed automatically"],
        answer: 1,
        why: "The nearest multiple of 200 Hz to 190 Hz is 200 Hz, so f_alias = |190 - 200| = 10 Hz.",
      },
      {
        q: "What is the ideal SNR of a 12-bit ADC for a full-scale sine wave?",
        options: ["about 62 dB", "about 72 dB", "about 74 dB", "about 96 dB"],
        answer: 2,
        why: "6.02 × 12 + 1.76 = 74.0 dB.",
      },
      {
        q: "An EMA runs at 100 Hz with α = 0.1. Approximately what is its cut-off frequency?",
        options: ["about 1.8 Hz", "about 10 Hz", "about 18 Hz", "about 0.18 Hz"],
        answer: 0,
        why: "τ ≈ 0.01 × 0.9 / 0.1 = 0.09 s, so fc = 1 / (2π × 0.09) ≈ 1.8 Hz.",
      },
      {
        q: "An ultrasonic distance sensor occasionally returns a reading of 0 among valid values. Which filter handles this best?",
        options: ["A moving average of 8", "An EMA with α = 0.05", "A median of 5", "No filter; just sample faster"],
        answer: 2,
        why: "A median ignores a single outlier completely. Averaging filters spread the bad value into several outputs.",
      },
      {
        q: "Why must an anti-aliasing filter be analog and placed before the ADC?",
        options: [
          "Digital filters are too slow",
          "After sampling, an aliased component is indistinguishable from a real signal at that frequency",
          "Analog filters are always more accurate",
          "The ADC cannot read filtered signals",
        ],
        answer: 1,
        why: "Aliasing maps a high frequency onto a low one during sampling. After that, no processing can tell them apart, so the high frequency must be removed first.",
      },
      {
        q: "A moving average of N samples at 400 Hz must reject 50 Hz hum completely. Which N works?",
        options: ["N = 5", "N = 8", "N = 10", "N = 50"],
        answer: 1,
        why: "The nulls are at multiples of fs / N. 400 / 8 = 50 Hz, so N = 8 places a null on the hum.",
      },
    ],
  },

  "i8-inertial-sensors-and-tilt": {
    id: "i8-inertial-sensors-and-tilt",
    outcomes: [
      "Explain how MEMS accelerometers, gyroscopes and magnetometers sense motion, and what each gets wrong",
      "Convert raw MPU6050 readings to g and °/s from the datasheet sensitivities",
      "Compute tilt from an accelerometer and integrate a gyroscope, and explain why each alone fails",
      "Implement and tune a complementary filter for pitch and roll on an Arduino",
    ],
    blocks: [
      { t: "h", text: "Why inertial sensors need fusion" },
      { t: "p", text: "Balancing robots, drones, phone screen rotation, and fall detectors all need to know which way is down and how fast the device is turning. A few rupees buys a chip with a three-axis accelerometer and three-axis gyroscope that answers both questions, badly. The accelerometer is noisy and confused by motion; the gyroscope is smooth but drifts. Neither alone gives a usable tilt angle. Combining them, in a few lines of code, gives one that is good enough to balance a robot. That combination is the exit project for this module." },

      { t: "h", text: "How MEMS inertial sensors work" },
      { t: "p", text: "MEMS (micro-electro-mechanical systems) sensors are tiny mechanical structures etched in silicon alongside their electronics." },
      { t: "list", items: [
        "**Accelerometer**: a proof mass on silicon springs, with comb-shaped capacitor plates. Acceleration displaces the mass, changing the capacitance, which the chip measures. Crucially, it measures **specific force**: gravity plus any acceleration of the device. A chip lying still on a table reads +1 g upwards on its vertical axis, because the table pushes it up against gravity. In free fall it reads 0.",
        "**Gyroscope**: a mass driven to vibrate back and forth. When the chip rotates, the Coriolis effect pushes the vibrating mass sideways in proportion to the rotation rate, and the sideways motion is sensed capacitively. It measures **angular rate** in degrees per second, not angle.",
        "**Magnetometer**: senses the Earth's magnetic field (about 25 to 65 µT, depending on location) with Hall-effect or magnetoresistive elements. It gives heading (yaw), which neither of the others can, but it is easily disturbed by motors, steel and currents nearby, and needs hard-iron and soft-iron calibration.",
      ] },

      { t: "h", text: "The MPU6050 by the numbers" },
      { t: "p", text: "The InvenSense (now TDK) MPU6050 is the most common hobby IMU: a 3-axis accelerometer and 3-axis gyroscope with 16-bit ADCs on an I2C bus. Newer TDK parts have lower noise, and the 9-axis ICM-20948 adds a magnetometer. The figures below are from the MPU-6000/6050 Product Specification (revision 3.4)." },
      { t: "table", head: ["Parameter", "Accelerometer", "Gyroscope"], rows: [
        ["Full-scale ranges", "±2, ±4, ±8, ±16 g", "±250, ±500, ±1000, ±2000 °/s"],
        ["Sensitivity at smallest range", "16384 LSB/g", "131 LSB/(°/s)"],
        ["Noise density", "400 µg/√Hz", "0.005 °/s/√Hz"],
        ["Zero offset (initial)", "±50 mg (X, Y), ±80 mg (Z)", "±20 °/s"],
        ["I2C address", "0x68 (AD0 low), 0x69 (AD0 high)", "same chip"],
      ], caption: "Key MPU6050 figures. The gyro zero offset of up to ±20 °/s is why you must measure and subtract the bias at start-up." },
      { t: "p", text: "Converting raw readings is division by the sensitivity. On ±2 g, a raw accelerometer value of 8192 is 8192 / 16384 = 0.5 g. On ±250 °/s, a raw gyroscope value of -655 is -655 / 131 = -5.0 °/s. The chip powers up asleep: you must write 0 to register PWR_MGMT_1 (0x6B) to wake it, and the 14 bytes from register 0x3B onwards hold accelerometer X, Y, Z, temperature and gyroscope X, Y, Z, each as a high byte then a low byte." },
      { t: "note", kind: "safety", text: "The MPU6050 chip itself runs at 2.375 to 3.46 V. Most breakout boards (GY-521) carry a 3.3 V regulator and accept 5 V on VCC, and their I2C pull-ups go to 3.3 V. An Uno treats anything above 3.0 V as HIGH, so this works on a short bench wire, but with only about 0.3 V to spare; for long wires or several devices, add a proper level shifter. A bare chip or a board without a regulator must not be fed 5 V. On the ESP32 DevKit, power it from 3.3 V." },

      { t: "h", text: "Tilt from the accelerometer" },
      { t: "p", text: "When the device is still, the accelerometer reads only gravity, a vector of length 1 g pointing up in the sensor's frame. Its direction gives two tilt angles. Using the axes printed on the GY-521 board (X forward, Y left, Z up):" },
      { t: "formula", text: String.raw`roll  φ = atan2( ay, az )
pitch θ = atan2( -ax, √(ay² + az²) )

Example: ax = 0.0, ay = 0.5, az = 0.866 g
roll = atan2(0.5, 0.866) = 30.0°,  pitch = 0°`, caption: "Use atan2, not atan, so the angle is correct in all four quadrants." },
      { t: "p", text: "This is accurate on average and never drifts, because gravity never moves. But it is noisy (vibration couples straight into it), and any acceleration of the device corrupts it: a robot braking at 0.2 g looks to the accelerometer like an extra tilt of atan(0.2) ≈ 11°. Yaw cannot be found at all, because rotating about the vertical does not change the gravity vector." },

      { t: "h", text: "Tilt from the gyroscope" },
      { t: "p", text: "The gyroscope gives angular rate, so you integrate to get angle: angle += rate × Δt at each sample. Over short times this is smooth and immune to linear acceleration. But any bias in the rate is integrated too. A residual bias of just 0.5 °/s, after you subtract the start-up offset, becomes 30° of error after one minute. Gyro bias also drifts with temperature, so subtracting a fixed value only helps for a while." },

      { t: "h", text: "The complementary filter" },
      { t: "p", text: "The two sensors fail in opposite frequency ranges. The accelerometer is right in the long run (low frequencies) and wrong in the short run (high frequencies: vibration, jolts). The gyroscope is right in the short run and wrong in the long run (drift). A **complementary filter** takes the high-frequency part of the gyro angle and the low-frequency part of the accelerometer angle and adds them." },
      { t: "formula", text: String.raw`angle = α × (angle + gyro_rate × Δt) + (1 - α) × accel_angle

time constant  τ = α Δt / (1 - α)
α = 0.98, Δt = 0.01 s  →  τ = 0.98 × 0.01 / 0.02 = 0.49 s`, caption: "Below about 1/(2πτ) ≈ 0.3 Hz the accelerometer wins; above it the gyroscope wins." },
      { t: "p", text: "Read it as: predict the new angle by integrating the gyro, then nudge it 2% of the way towards what the accelerometer says. The nudge is small enough that vibration in the accelerometer is heavily smoothed, but persistent enough that gyro drift is pulled back continuously. A larger α trusts the gyro longer (smoother, slower to correct drift); a smaller α trusts the accelerometer more (faster correction, more vibration)." },
      { t: "diagram", text: String.raw`
 gyro rate ──► [ ∫ dt ] ──► [ high-pass, τ ] ──┐
                                               (+)──► angle
 accel ──► [ atan2 ] ──► [ low-pass, τ ] ──────┘`, caption: "The two filters have the same τ, so their responses add to exactly 1 at every frequency." },

      { t: "h", text: "Complete tilt sensor for the Arduino Uno" },
      { t: "p", text: "Wire the GY-521: VCC to 5 V, GND to GND, SDA to A4, SCL to A5 on the Uno. The sketch talks to the registers directly with the Wire library so that every step is visible: wake, set ranges and the internal low-pass filter, measure the gyro bias while still, then run the filter at a fixed 100 Hz." },
      { t: "snippet", lang: "cpp", code: String.raw`// Tilt (pitch and roll) from an MPU6050 with a complementary filter.
// Arduino Uno: SDA = A4, SCL = A5. MPU6050 breakout VCC to 5 V (it has its own 3.3 V regulator).
#include <Wire.h>
#include <math.h>

const uint8_t MPU = 0x68;          // AD0 low
const float ACC_LSB_PER_G = 16384.0;   // +/-2 g range
const float GYR_LSB_PER_DPS = 131.0;   // +/-250 deg/s range
const float ALPHA = 0.98;          // complementary filter weight
const unsigned long PERIOD_US = 10000; // 100 Hz loop

float gyroBiasX = 0, gyroBiasY = 0;
float pitch = 0, roll = 0;
unsigned long lastUs;

void writeReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MPU);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();
}

// Reads accel (g) and gyro (deg/s). Returns false on an I2C error.
bool readImu(float &ax, float &ay, float &az, float &gx, float &gy) {
  Wire.beginTransmission(MPU);
  Wire.write(0x3B);                // ACCEL_XOUT_H
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(MPU, (uint8_t)14) != 14) return false;
  int16_t raw[7];
  for (int i = 0; i < 7; i++) {
    uint8_t hi = Wire.read();        // two statements: in (read() << 8) | read() the
    uint8_t lo = Wire.read();        // order of the two calls is unspecified in C++
    raw[i] = (int16_t)((hi << 8) | lo);
  }
  ax = raw[0] / ACC_LSB_PER_G;
  ay = raw[1] / ACC_LSB_PER_G;
  az = raw[2] / ACC_LSB_PER_G;
  // raw[3] is temperature, not used here
  gx = raw[4] / GYR_LSB_PER_DPS;
  gy = raw[5] / GYR_LSB_PER_DPS;
  return true;
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setClock(400000);
  writeReg(0x6B, 0x00);            // PWR_MGMT_1: wake up, internal clock
  writeReg(0x1A, 0x03);            // CONFIG: DLPF about 44 Hz
  writeReg(0x1B, 0x00);            // GYRO_CONFIG: +/-250 deg/s
  writeReg(0x1C, 0x00);            // ACCEL_CONFIG: +/-2 g
  delay(100);

  // Keep the board still: average 500 gyro samples to find the bias.
  Serial.println(F("Calibrating gyro, keep still..."));
  float ax, ay, az, gx, gy;
  int n = 0;
  while (n < 500) {
    if (readImu(ax, ay, az, gx, gy)) { gyroBiasX += gx; gyroBiasY += gy; n++; }
    delay(2);
  }
  gyroBiasX /= n;
  gyroBiasY /= n;

  // Start the filter at the accelerometer angle so it does not have to converge.
  readImu(ax, ay, az, gx, gy);
  roll = atan2(ay, az) * RAD_TO_DEG;
  pitch = atan2(-ax, sqrt(ay * ay + az * az)) * RAD_TO_DEG;
  lastUs = micros();
}

void loop() {
  unsigned long now = micros();
  if (now - lastUs < PERIOD_US) return;
  float dt = (now - lastUs) * 1e-6;
  lastUs = now;

  float ax, ay, az, gx, gy;
  if (!readImu(ax, ay, az, gx, gy)) { Serial.println(F("I2C error")); return; }
  gx -= gyroBiasX;
  gy -= gyroBiasY;

  float accRoll = atan2(ay, az) * RAD_TO_DEG;
  float accPitch = atan2(-ax, sqrt(ay * ay + az * az)) * RAD_TO_DEG;

  roll = ALPHA * (roll + gx * dt) + (1 - ALPHA) * accRoll;
  pitch = ALPHA * (pitch + gy * dt) + (1 - ALPHA) * accPitch;

  static uint8_t k = 0;
  if (++k >= 5) {                  // print at 20 Hz
    k = 0;
    Serial.print(accRoll); Serial.print(',');
    Serial.print(roll); Serial.print(',');
    Serial.println(pitch);
  }
}`, caption: "Compiled with arduino-cli for arduino:avr:uno (about 8 KB of flash). Open the Serial Plotter to compare the raw accelerometer roll with the filtered roll." },
      { t: "p", text: "Test it like an engineer. Tilt the board to a known angle against a protractor or a phone propped at a measured slope: the filtered angle should settle within a degree or two. Tap the table hard: the raw accelerometer roll will spike by several degrees while the filtered one barely moves. Leave it still for five minutes: the filtered angle should not wander, unlike a pure gyro integration. If the filtered angle moves the wrong way when you tilt, one gyro axis sign is reversed relative to your angle definition; flip it." },

      { t: "deep", title: "Why the complementary filter is complementary", blocks: [
        { t: "p", text: "Write the filter in the Laplace domain. With θ_g the gyro rate, θ_a the accelerometer angle and τ the time constant, the continuous-time version is θ = (τ s / (τ s + 1)) × (θ_g / s) + (1 / (τ s + 1)) × θ_a. The first factor is a high-pass filter applied to the integrated gyro; the second is a low-pass applied to the accelerometer angle. Their sum is (τ s + 1)/(τ s + 1) = 1, so a true angle seen identically by both sensors passes through unchanged at every frequency: no lag, no gain error." },
        { t: "p", text: "Discretise with step Δt and you get the one-line update in the lesson, with α = τ / (τ + Δt). Rearranging gives τ = α Δt / (1 - α). Note that α depends on Δt: if you change the loop rate, recompute α to keep the same τ, or compute it from the measured dt each time." },
        { t: "p", text: "A constant gyro bias b produces a steady-state angle error of b × τ, not an unbounded one. With τ = 0.49 s and a residual bias of 0.5 °/s, the error is about 0.25°. That is why the start-up bias measurement and τ together decide the filter's accuracy. A Kalman filter (module a9) goes further: it estimates the bias as a state and chooses the blend from the sensors' noise figures instead of a hand-picked α." },
      ] },
      { t: "deep", title: "Noise budget and range selection for the MPU6050", blocks: [
        { t: "p", text: "With the internal low-pass set to about 44 Hz (CONFIG = 3), the equivalent noise bandwidth is roughly 1.57 × 44 ≈ 69 Hz for a first-order roll-off. The accelerometer's rms noise is then 400 µg/√Hz × √69 ≈ 3.3 mg, which at small angles is atan(0.0033) ≈ 0.19° of tilt noise before the complementary filter smooths it further. The gyro's rms noise is 0.005 × √69 ≈ 0.042 °/s." },
        { t: "p", text: "Choose the smallest range that your motion will not exceed. A balancing robot rarely sees more than 2 g or 250 °/s, so the finest ranges give the most resolution. A drone's gyro can exceed 500 °/s during flips, and a saturated gyro reading silently corrupts the integrated angle, so drones use ±2000 °/s. Saturation is a worse error than coarse resolution." },
        { t: "p", text: "For yaw you need a magnetometer, such as the AK09916 inside the ICM-20948. Hard-iron calibration removes a constant offset (from magnetised parts on the board) by rotating the device through all orientations and taking the centre of the ellipsoid of readings; soft-iron calibration removes the stretching of that ellipsoid caused by nearby ferrous material. Tilt-compensate the heading using the pitch and roll you already have, or it will change as you tilt." },
      ] },
    ],
    mistakes: [
      "**Treating accelerometer tilt as valid while the device accelerates.** It measures gravity plus motion; braking looks like tilt.",
      "**Integrating the gyro without removing the start-up bias.** Up to ±20 °/s of offset gives huge drift within seconds.",
      "**Using atan instead of atan2.** atan loses the quadrant and flips sign past 90°.",
      "**Changing the loop rate without recomputing α.** The time constant changes with Δt.",
      "**Feeding 5 V to a bare MPU6050 or a board without a regulator.** The chip is a 3.3 V part.",
      "**Mixing degrees and radians.** atan2 returns radians; gyro readings are in degrees per second. Convert once, consistently.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: build and characterise an IMU tilt sensor, or a calibrated measurement system with a stated uncertainty.",
      steps: [
        "Wire a GY-521 to the Uno (VCC 5 V, GND, SDA to A4, SCL to A5) and upload the complementary filter sketch.",
        "Plot raw accelerometer roll and filtered roll on the Serial Plotter while tapping the table. Record how much each moves.",
        "Leave the board still for 5 minutes and log the filtered angle. Report its drift and its standard deviation.",
        "Place the board on surfaces at three measured angles (use a protractor or a ramp with measured rise and run). Tabulate measured versus true angle and compute the error at each.",
        "Try α = 0.90, 0.98 and 0.995. For each, describe the trade-off between vibration rejection and how quickly the angle recovers after a jolt.",
        "Write up the result as angle ± U (k = 2) using the method of lesson 1, listing the largest contributions. (Alternative exit: the thermistor thermometer from lesson 2 with a full uncertainty budget.)",
      ],
    },
    quiz: [
      {
        q: "An MPU6050 on ±2 g returns a raw Z reading of 16384 while lying flat and still. What does that mean?",
        options: [
          "It is in free fall",
          "It reads +1 g, the table's reaction to gravity",
          "It reads 2 g because the range is ±2 g",
          "The reading is saturated",
        ],
        answer: 1,
        why: "16384 / 16384 LSB/g = 1 g. A still accelerometer reads 1 g upwards, because it measures specific force, not motion.",
      },
      {
        q: "A gyroscope has a residual bias of 0.5 °/s. If you integrate it alone for 60 s, what is the angle error?",
        options: ["0.5°", "8.3°", "30°", "No error, bias cancels"],
        answer: 2,
        why: "The bias is integrated: 0.5 °/s × 60 s = 30°.",
      },
      {
        q: "A complementary filter runs at 100 Hz with α = 0.98. What is its time constant?",
        options: ["0.02 s", "0.098 s", "0.49 s", "4.9 s"],
        answer: 2,
        why: "τ = α Δt / (1 - α) = 0.98 × 0.01 / 0.02 = 0.49 s.",
      },
      {
        q: "Why does the complementary filter take the low-frequency part of the accelerometer angle and the high-frequency part of the gyro angle?",
        options: [
          "The accelerometer is accurate in the long run but noisy short term; the gyro is smooth short term but drifts",
          "The gyro is more accurate at all frequencies",
          "The accelerometer cannot measure slow changes",
          "It is cheaper to compute that way",
        ],
        answer: 0,
        why: "Each sensor is trusted in the frequency range where it is good: gravity does not drift, and the gyro is not disturbed by vibration or linear acceleration.",
      },
      {
        q: "Accelerometer readings are ax = 0, ay = 0.5 g, az = 0.866 g. What is the roll angle?",
        options: ["0°", "30°", "45°", "60°"],
        answer: 1,
        why: "roll = atan2(0.5, 0.866) = 30°, since tan 30° = 0.577 = 0.5 / 0.866.",
      },
    ],
  },
};

export default lessons;
