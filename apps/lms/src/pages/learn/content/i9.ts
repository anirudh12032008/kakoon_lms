import type { ModuleContent } from "../model/curriculum";

/**
 * Module i9: Actuators and power electronics.
 * Normal mode is a complete lesson; `deep` holds derivations and datasheet detail.
 * Every number in a worked example was checked with Python; every sketch compiles for arduino:avr:uno.
 */
const lessons: ModuleContent = {
  "i9-dc-motors-and-h-bridges": {
    id: "i9-dc-motors-and-h-bridges",
    outcomes: [
      "Use the DC motor equations to predict stall current, no-load speed and torque from a few measurements",
      "Explain how an H-bridge reverses a motor, and compare the L298N, TB6612FNG and DRV8833",
      "Choose a PWM frequency and set up 20 kHz PWM on the Uno",
      "Tell braking from coasting and measure motor current",
    ],
    blocks: [
      { t: "h", text: "Why model a motor" },
      { t: "p", text: "A small gear motor looks simple: apply voltage, it turns. But the questions that decide whether a robot works are numerical. How much current does it draw when it stalls against a wall? Will the driver survive that? How fast will it go with a load? Why does the battery voltage dip every time it starts? A brushed DC motor follows three short equations, and with two or three measurements from a multimeter you can answer all of these before anything burns." },

      { t: "h", text: "The DC motor model" },
      { t: "p", text: "A brushed DC motor is a coil (the armature) spinning in a magnetic field, with brushes and a commutator switching the current so the torque always pushes the same way. Electrically it looks like a resistance R in series with a voltage source, the **back-EMF**, that grows with speed. Two constants link the electrical and mechanical sides." },
      { t: "formula", text: String.raw`back-EMF        E = Ke × ω              (V, ω in rad/s)
torque          τ = Kt × I              (N·m)
electrical      V = I × R + E           (ignoring inductance at steady speed)

In SI units Ke = Kt (V·s/rad = N·m/A), so call both K.`, caption: "The three equations of a brushed DC motor." },
      { t: "p", text: "Two special cases come straight from these. At **stall** (ω = 0) there is no back-EMF, so the current is limited only by the winding resistance: I_stall = V / R. That is the largest current the motor ever draws, and it happens every time the motor starts from rest. At **no load** the motor speeds up until the back-EMF almost equals the supply, and only a small current I0 flows to overcome friction." },
      { t: "p", text: "Combine the equations and eliminate I to get the **speed-torque line**: speed falls linearly from the no-load speed at zero torque to zero at the stall torque. Current rises linearly with torque. Mechanical power (τ × ω) is zero at both ends and peaks at half the stall torque, where speed is half the no-load speed." },
      { t: "formula", text: String.raw`ω = (V - I R) / K = V/K - (R / K²) × τ

τ_stall = K × I_stall
P_mech,max = τ_stall × ω0 / 4      (at τ = τ_stall/2, ω = ω0/2)`, caption: "The speed-torque line and its maximum-power point." },

      { t: "h", text: "Worked example: a TT gear motor" },
      { t: "p", text: "The yellow TT gear motor used on most robot kits has a 1:48 gearbox. Its label values vary between batches, so measure your own. Suppose you measure:" },
      { t: "list", items: [
        "Winding resistance with a multimeter (turn the shaft slightly between readings and take the lowest stable value): R = 4.0 Ω.",
        "At 6.0 V with no load: output shaft speed 200 rpm, current I0 = 0.15 A.",
      ] },
      { t: "formula", text: String.raw`Stall current     I_stall = 6.0 / 4.0 = 1.5 A
Motor speed       ω0 = 200 rpm × 48 = 9600 rpm = 9600 × 2π / 60 = 1005.3 rad/s
Motor constant    K = (V - I0 R) / ω0 = (6.0 - 0.15 × 4.0) / 1005.3 = 5.37 mV·s/rad
Stall torque      τ_stall = K × (I_stall - I0) = 0.00537 × 1.35 = 7.25 mN·m  (motor shaft)
At output shaft   7.25 mN·m × 48 × 0.6 (gearbox efficiency) ≈ 0.21 N·m ≈ 2.1 kg·cm
Max mech power    7.25e-3 × 1005.3 / 4 ≈ 1.82 W   (at about 100 rpm output, 0.83 A)`, caption: "Friction is accounted for by subtracting I0 from the current before converting to torque." },
      { t: "p", text: "Check the maximum-power point: at half the stall torque the current is halfway between I0 and I_stall, (0.15 + 1.5) / 2 = 0.825 A, and the electrical input is 6.0 × 0.825 = 4.95 W. Mechanical output 1.82 W out of 4.95 W in is 37% efficiency, which is typical for a small brushed motor near that point. Small motors are most efficient at light loads, a little below no-load speed, which is why you gear them down rather than run them near stall." },
      { t: "note", kind: "warn", text: "Design the driver and the wiring for the stall current, not the running current. Two TT motors starting together at 6 V draw 3 A for a moment. A driver rated 1 A continuous will cope only if its peak rating and thermal shutdown are adequate, and a weak battery will sag enough to reset the microcontroller (lesson 5)." },

      { t: "h", text: "The H-bridge" },
      { t: "p", text: "To reverse a DC motor you reverse the voltage across it. An **H-bridge** does this with four switches around the motor, drawn like the letter H. Closing the top-left and bottom-right switches drives current one way; closing top-right and bottom-left drives it the other way. Closing both switches on the same side (a **shoot-through**) shorts the supply and destroys the bridge, so driver chips prevent it internally." },
      { t: "diagram", text: String.raw`
        V_motor
     ┌─────┴─────┐
   [S1]        [S3]
     │           │
     ●──( M )────●
     │           │
   [S2]        [S4]
     └─────┬─────┘
          GND

 S1 + S4 on: forward      S3 + S2 on: reverse
 S2 + S4 on: brake        all off:    coast`, caption: "An H-bridge. S1 with S2 (or S3 with S4) at the same time is a short circuit." },

      { t: "h", text: "Choosing a driver: L298N, TB6612FNG, DRV8833" },
      { t: "table", head: ["Driver", "Switches", "Motor supply", "Current per channel", "Voltage lost at 1 A"], rows: [
        ["L298N", "Bipolar transistors", "up to 46 V", "2 A (module)", "1.8 to 3.2 V (datasheet total drop)"],
        ["TB6612FNG", "MOSFETs", "2.5 to 13.5 V", "1.2 A average, 3.2 A peak", "about 0.5 V (typical)"],
        ["DRV8833", "MOSFETs", "2.7 to 10.8 V", "1.5 A RMS", "about 0.36 V (HS + LS on-resistance 360 mΩ)"],
      ], caption: "Figures from the ST L298, Toshiba TB6612FNG and TI DRV8833 datasheets." },
      { t: "p", text: "The L298N is everywhere because it is old, cheap and tolerant of high voltage. Its weakness is that it uses bipolar transistors, which have a roughly fixed saturation voltage instead of a small resistance. Two of them are in the current path, so at 1 A it drops around 2 V or more. On a 6 V supply, a motor driven through an L298N sees only about 4 V, and the chip turns about 2 W into heat, which is why the module needs a large heat sink. A MOSFET driver like the TB6612FNG drops about 0.5 V at 1 A and wastes about 0.5 W. For battery robots below 12 V, a MOSFET driver gives you noticeably more speed and run time from the same battery." },

      { t: "h", text: "PWM frequency" },
      { t: "p", text: "Speed is controlled by PWM: switching the bridge on and off fast, so the motor sees an average voltage of duty × V. The motor's inductance smooths the current between pulses. The frequency matters:" },
      { t: "list", items: [
        "**Too low** (tens of hertz): the current falls to zero between pulses and the motor jerks and loses torque.",
        "**Audible range** (the Uno's default 490 Hz on most PWM pins, 977 Hz on D5 and D6): it works, but the windings sing with an annoying whine.",
        "**About 20 kHz**: above hearing, current is smooth. This is the usual choice for small motors. The TB6612FNG and DRV8833 both handle it easily.",
        "**Too high** (hundreds of kilohertz): each switching transition wastes energy, so losses rise with frequency, and slow drivers like the L298N (rated for switching up to about 25 kHz) cannot keep up.",
      ] },
      { t: "p", text: "The Uno's `analogWrite` cannot produce 20 kHz, but Timer1 can. In fast-PWM mode 14 the counter counts from 0 to ICR1 and back to 0. With no prescaler the frequency is 16 MHz / (ICR1 + 1), so ICR1 = 799 gives exactly 20 kHz, and OCR1A from 0 to 799 sets the duty on D9." },
      { t: "snippet", lang: "cpp", code: String.raw`// DC motor on a TB6612FNG (channel A), 20 kHz PWM from Timer1 on the Uno.
// PWMA = D9 (OC1A), AIN1 = D7, AIN2 = D8, STBY = D6. VM from the motor supply, VCC from 5 V.
// Type a number -100..100 in the Serial Monitor to set speed; 'b' brakes, 'c' coasts.

const uint8_t AIN1 = 7, AIN2 = 8, STBY = 6;
const uint16_t TOP = 799;          // 16 MHz / (1 * (799 + 1)) = 20 kHz

void pwmInit() {
  pinMode(9, OUTPUT);
  TCCR1A = _BV(COM1A1) | _BV(WGM11);              // non-inverting on OC1A, mode 14 low bits
  TCCR1B = _BV(WGM13) | _BV(WGM12) | _BV(CS10);   // mode 14 (fast PWM, TOP = ICR1), no prescale
  ICR1 = TOP;
  OCR1A = 0;
}

void setDuty(uint8_t percent) {
  OCR1A = (uint32_t)TOP * percent / 100;
}

void drive(int speed) {            // -100..100
  speed = constrain(speed, -100, 100);
  digitalWrite(AIN1, speed > 0);
  digitalWrite(AIN2, speed < 0);
  setDuty(abs(speed));
}

void brake() { digitalWrite(AIN1, HIGH); digitalWrite(AIN2, HIGH); setDuty(100); }
void coast() { digitalWrite(AIN1, LOW);  digitalWrite(AIN2, LOW);  setDuty(0); }

void setup() {
  Serial.begin(115200);
  pinMode(AIN1, OUTPUT);
  pinMode(AIN2, OUTPUT);
  pinMode(STBY, OUTPUT);
  pwmInit();
  coast();
  digitalWrite(STBY, HIGH);
  Serial.println(F("speed -100..100, b = brake, c = coast"));
}

void loop() {
  if (!Serial.available()) return;
  int c = Serial.peek();
  if (c == 'b') { Serial.read(); brake(); Serial.println(F("brake")); }
  else if (c == 'c') { Serial.read(); coast(); Serial.println(F("coast")); }
  else if (c == '-' || (c >= '0' && c <= '9')) {
    int s = Serial.parseInt();
    drive(s);
    Serial.print(F("speed ")); Serial.println(s);
  } else Serial.read();            // skip newlines and anything else
}`, caption: "Compiled with arduino-cli for arduino:avr:uno. Using Timer1 disables analogWrite on D9 and D10 and breaks the Servo library, which also uses Timer1." },

      { t: "h", text: "Braking versus coasting" },
      { t: "p", text: "When you stop driving a spinning motor you have two choices. **Coast**: turn all four switches off; the motor freewheels and slows only by friction. **Brake** (short brake): turn on both low-side switches, shorting the motor's terminals. The spinning motor is now a generator driving current through its own resistance, which produces a torque opposing the motion, so it stops quickly. On the TB6612FNG, IN1 = IN2 = high gives short brake; IN1 = IN2 = low gives coast (stop with outputs off). Use brake when a robot must stop on a line; use coast to save the energy and the mechanical shock." },
      { t: "p", text: "PWM interacts with this. During the off part of each PWM cycle, the motor's inductance keeps current flowing. The TB6612FNG's IN/PWM scheme puts the bridge into short brake during the off time (\"slow decay\"), which gives a nearly linear speed versus duty relationship. Drivers that coast during the off time (\"fast decay\") give a less linear response at low duty." },

      { t: "h", text: "Measuring motor current" },
      { t: "p", text: "Current tells you load, stall and battery drain. The simplest method is a small **shunt resistor** in the motor's ground return, read by the ADC: V = I × R. A 0.1 Ω shunt at 1.5 A gives 0.15 V and dissipates 0.225 W; that is only about 31 Uno ADC steps, so amplify it with an op-amp, or use a current-sense IC. The INA219 (I2C, high-side, measures bus voltage and current through its own external shunt) and ACS712 (Hall effect, isolated, analog output) are common modules. Many motor drivers, including the DRV8833's sense pins and the A4988, have a sense resistor built into their design. Because PWM current is pulsed, average your readings over many PWM cycles or sample in sync with the PWM." },

      { t: "deep", title: "Deriving the speed-torque line and the efficiency curve", blocks: [
        { t: "p", text: "Start from V = I R + K ω and τ = K I (taking τ as the torque before friction). Substitute I = τ / K and solve for ω: ω = V/K - R τ / K². At τ = 0, ω0 = V/K; at ω = 0, τ_stall = K V / R. The line between them has slope -R/K², so a motor with low resistance and high K has a stiff speed-torque line (speed barely changes with load)." },
        { t: "formula", text: String.raw`P_mech = τ × ω = τ × (ω0 - (ω0/τ_stall) τ)
dP/dτ  = ω0 - 2 (ω0/τ_stall) τ = 0   →   τ = τ_stall / 2
P_max  = (τ_stall/2)(ω0/2) = τ_stall ω0 / 4

efficiency η = P_mech / (V I) = (K I ω) / (V I) = E / V`, caption: "Efficiency equals the fraction of the supply voltage that appears as back-EMF." },
        { t: "p", text: "The last line is a neat result: ignoring friction, efficiency is simply E / V = ω / ω0. At half speed the motor can be at most 50% efficient, and friction lowers it further. Peak efficiency occurs where friction losses and copper losses (I² R) balance, which for small motors is around 80 to 90% of no-load speed. Large industrial motors have far lower R relative to K, so their peaks are much higher." },
        { t: "p", text: "Inductance L adds an electrical time constant L / R, often a fraction of a millisecond for small motors. This is what PWM relies on: if the PWM period is much shorter than L / R, current ripple is small. A motor with L = 1 mH and R = 4 Ω has L / R = 0.25 ms, so 20 kHz (a 50 µs period) is comfortably faster, while 490 Hz (a 2 ms period) lets the current swing heavily within each cycle." },
      ] },
      { t: "deep", title: "Flyback, recirculation and why motors need capacitors", blocks: [
        { t: "p", text: "Current in an inductor cannot stop instantly. When a switch opens, the motor's current needs somewhere to go, and if there is no path its voltage spikes high enough to break down the switch. Every H-bridge provides a path: MOSFET bridges use their body diodes or synchronous switching, and L298N modules add eight external fast diodes because the L298 has none inside." },
        { t: "p", text: "Recirculating current also flows back into the supply during fast decay and braking, pumping the supply voltage up. On a bench supply that cannot sink current, a motor decelerating hard can push the rail above the driver's maximum rating. A large electrolytic capacitor across the driver's motor supply (100 µF or more, rated for at least twice the supply voltage) absorbs these surges. A 100 nF ceramic capacitor soldered directly across the motor terminals, often with two more from each terminal to the case, suppresses the brush sparking noise that otherwise couples into sensors and resets microcontrollers." },
      ] },
    ],
    mistakes: [
      "**Sizing the driver for running current.** Every start is a stall; plan for V / R.",
      "**Powering motors from the Uno's 5 V pin.** It is fed by USB or the board's small regulator. Motors need their own supply with a shared ground.",
      "**Turning on both switches on one side of an H-bridge.** On discrete bridges this is a short circuit. Use a driver chip or add dead time.",
      "**Expecting full speed through an L298N.** It drops 2 V or more; on a 6 V supply the motor gets about 4 V.",
      "**Using the Servo library and Timer1 PWM together.** Both use Timer1 on the Uno.",
      "**Forgetting suppression capacitors on brushed motors.** Brush noise causes resets and I2C errors.",
    ],
    practice: {
      kind: "bench",
      task: "Characterise a gear motor and drive it at 20 kHz.",
      steps: [
        "Measure the motor's winding resistance (lowest stable reading over several shaft positions) and calculate the stall current at your supply voltage.",
        "Run it at no load from a bench supply or battery and measure the current with a multimeter in series. Count output revolutions over 10 s (a tape flag helps) to find the speed.",
        "Calculate K, the stall torque and the maximum mechanical power as in the worked example.",
        "Wire a TB6612FNG to the Uno as in the sketch (VM to the motor supply, VCC to 5 V, common GND, a 100 µF capacitor across VM). Upload and test speeds, brake and coast.",
        "Measure the voltage across the motor at 100% duty with the TB6612FNG and, if you have one, an L298N module. Explain the difference.",
      ],
    },
    quiz: [
      {
        q: "A motor has a winding resistance of 3 Ω. What current does it draw at the instant it starts from 9 V?",
        options: ["0.33 A", "1 A", "3 A", "27 A"],
        answer: 2,
        why: "At standstill there is no back-EMF, so I = V / R = 9 / 3 = 3 A.",
      },
      {
        q: "A motor's no-load speed is 3000 rpm and its stall torque is 10 mN·m. At what torque does it deliver maximum mechanical power, and at what speed?",
        options: ["10 mN·m at 0 rpm", "5 mN·m at 1500 rpm", "5 mN·m at 3000 rpm", "2.5 mN·m at 2250 rpm"],
        answer: 1,
        why: "Power τ × ω on a straight speed-torque line peaks at half the stall torque and half the no-load speed.",
      },
      {
        q: "Why does an L298N waste more power than a TB6612FNG at the same current?",
        options: [
          "It runs at a higher PWM frequency",
          "Its bipolar transistors have a saturation voltage of around a volt each, while MOSFETs act like a small resistance",
          "It has no protection diodes",
          "It drives both motors at once",
        ],
        answer: 1,
        why: "Two bipolar transistors in the path drop roughly 2 V total at 1 A (about 2 W lost). The TB6612FNG's MOSFETs drop about 0.5 V at 1 A.",
      },
      {
        q: "With Timer1 in fast PWM mode 14, no prescaler, on a 16 MHz Uno, what ICR1 value gives 20 kHz?",
        options: ["199", "399", "799", "1599"],
        answer: 2,
        why: "f = 16 MHz / (ICR1 + 1), so ICR1 + 1 = 800 and ICR1 = 799.",
      },
      {
        q: "On a TB6612FNG, what does setting IN1 and IN2 both high do?",
        options: ["Coast", "Short brake", "Full speed forward", "Shoot-through"],
        answer: 1,
        why: "Both inputs high turns on both low-side switches, shorting the motor terminals so the back-EMF brakes it. Both low is coast. The chip prevents shoot-through.",
      },
    ],
  },

  "i9-steppers-servos-and-brushless": {
    id: "i9-steppers-servos-and-brushless",
    outcomes: [
      "Explain how unipolar and bipolar stepper motors move, and what microstepping does",
      "Set the current limit on an A4988 or DRV8825 board from its sense resistor",
      "Drive a stepper with STEP and DIR pulses and calculate the pulse rate for a speed",
      "Explain the difference between a hobby servo, a closed-loop servo and a brushless motor",
    ],
    blocks: [
      { t: "h", text: "Motors that know where they are, or pretend to" },
      { t: "p", text: "A DC motor turns when you apply voltage, but it has no idea of position. Many machines need position: a 3D printer must place its nozzle within a tenth of a millimetre, a robot arm must hold an angle, a camera gimbal must point. Three families of motor answer this in different ways. Steppers move in exact increments and assume they got there. Servos measure their position and correct it. Brushless motors are the efficient workhorses underneath drones and electric vehicles, which become servos when you add a sensor. Knowing which to use, and how to drive each, saves a lot of frustration." },

      { t: "h", text: "How a stepper motor steps" },
      { t: "p", text: "A hybrid stepper, the common kind such as the NEMA 17 on 3D printers, has a toothed permanent-magnet rotor and a stator with two windings (phases). Energising the phases in sequence pulls the rotor teeth into alignment one step at a time. The standard step angle is 1.8°, so 200 full steps make one revolution. Because each step is a fixed angle, you control position by counting pulses: no sensor is needed, as long as the motor never skips." },
      { t: "list", items: [
        "**Bipolar** steppers have two windings and four wires. To reverse the field the current in each winding must reverse, so each winding needs its own H-bridge. Driver chips such as the A4988 and DRV8825 contain both bridges.",
        "**Unipolar** steppers have centre-tapped windings and five or six wires (the small 28BYJ-48 is the common example). Current only ever flows one way through each half winding, so four simple low-side transistors (the ULN2003 board) can drive it. Only half of each winding is used at a time, so a unipolar motor gives less torque for its size. A six-wire unipolar can be run as bipolar by ignoring the centre taps.",
      ] },
      { t: "p", text: "Find the two windings of an unknown four-wire stepper with a multimeter: wires belonging to the same winding show a few ohms between them; wires from different windings show an open circuit." },

      { t: "h", text: "Microstepping" },
      { t: "p", text: "Instead of switching each winding fully on or off, a driver can set the two winding currents to intermediate values in a sine and cosine pattern. The rotor then settles between full-step positions. With 1/16 microstepping, each full step is split into 16, so a 200-step motor gets 3200 positions per revolution. The main benefit is smoothness and quietness, since motion becomes nearly continuous and resonance is reduced. Microstepping does not give 16 times the accuracy: the torque holding the rotor at an intermediate position is small, so friction and load shift it, and the real positional accuracy stays a fraction of a full step." },
      { t: "formula", text: String.raw`microsteps per rev = (360° / step angle) × microstep factor
                   = 200 × 16 = 3200

pulse rate         = rev/s × microsteps per rev
1 rev/s at 1/16    = 3200 pulses per second (half-period 156 µs)`, caption: "Step rate for a given speed." },

      { t: "h", text: "A4988 and DRV8825: current limiting with Vref" },
      { t: "p", text: "Stepper windings have low resistance (a typical NEMA 17 is about 1.5 to 3 Ω), and they are run from 12 V or 24 V supplies, far above the voltage the winding could take continuously. The driver regulates the current instead (a **chopper** drive): it switches the bridge on until the current, measured across a sense resistor Rs, reaches a trip level, then lets it decay, many thousands of times per second. A high supply voltage forces current into the inductive winding quickly, which keeps torque up at speed. You must set the trip level to suit your motor's rated current, using the small potentiometer on the board and measuring the voltage Vref on it." },
      { t: "table", head: ["Driver board", "Supply", "Microstepping", "Current formula", "Vref for 1.0 A"], rows: [
        ["A4988, Pololu (Rs = 0.068 Ω)", "8 to 35 V", "up to 1/16", "I = Vref / (8 × 0.068) = Vref / 0.544", "0.544 V"],
        ["A4988 clone with R100 (Rs = 0.1 Ω)", "8 to 35 V", "up to 1/16", "I = Vref / (8 × 0.1) = Vref / 0.8", "0.80 V"],
        ["DRV8825, Pololu (Rs = 0.1 Ω)", "8.2 to 45 V", "up to 1/32", "I = Vref / (5 × 0.1) = 2 × Vref", "0.50 V"],
      ], caption: "From the Allegro A4988 and TI DRV8825 datasheets and Pololu's carrier documentation. Read the marking on your board's sense resistors (R050, R068 or R100) before using a formula." },
      { t: "p", text: "**Worked example.** Your NEMA 17 is rated 1.5 A per phase. Set it to about 70 to 80% of rating to keep it cooler, say 1.1 A. On a Pololu A4988 (R068), Vref = 1.1 × 0.544 = 0.60 V. On a DRV8825, Vref = 1.1 / 2 = 0.55 V. Measure Vref between the potentiometer's wiper (or the Vref test point) and GND with the board powered and the motor connected, and turn the screw in small steps." },
      { t: "snippet", lang: "cpp", code: String.raw`// One revolution each way on an A4988 or DRV8825 at 1/16 microstepping.
// STEP = D3, DIR = D4, EN = D5 (active low). MS1..MS3 wired high for 1/16 on the A4988.
// On a DRV8825, 1/16 is M2 high, M1 and M0 low (all three high is 1/32).

const uint8_t STEP = 3, DIR = 4, EN = 5;
const long STEPS_PER_REV = 200L * 16;  // 1.8 degree motor, 1/16 microstepping
const unsigned int HALF_PERIOD_US = 156; // about 3200 steps/s = 1 rev/s

void move(long steps, bool forward) {
  digitalWrite(DIR, forward);
  delayMicroseconds(5);            // DIR setup time before the first STEP edge
  for (long i = 0; i < steps; i++) {
    digitalWrite(STEP, HIGH);
    delayMicroseconds(HALF_PERIOD_US);
    digitalWrite(STEP, LOW);
    delayMicroseconds(HALF_PERIOD_US);
  }
}

void setup() {
  pinMode(STEP, OUTPUT);
  pinMode(DIR, OUTPUT);
  pinMode(EN, OUTPUT);
  digitalWrite(EN, LOW);           // enable the driver
}

void loop() {
  move(STEPS_PER_REV, true);
  delay(500);
  move(STEPS_PER_REV, false);
  delay(500);
}`, caption: "Arduino Uno, compiled with arduino-cli for arduino:avr:uno. A real machine ramps the step rate up and down (the AccelStepper library does this) because a stepper cannot jump instantly to a high speed." },
      { t: "note", kind: "safety", text: "Never connect or disconnect a stepper motor while the driver is powered. The winding's inductive kick can destroy the A4988 or DRV8825 instantly. Put a 100 µF electrolytic capacitor across the motor supply right at the driver board, as Pololu recommends, because supply spikes from long leads also kill these chips. The driver chip and motor run hot (a NEMA 17 at full current can exceed 60 °C on its case); fit the heat sink and do not touch them while running." },
      { t: "p", text: "Steppers have two weaknesses. Their torque falls with speed, because the winding inductance limits how fast current can rise each step. And if the load demands more torque than the motor has, it **skips steps** and the controller never knows. Machines that cannot tolerate this either add an encoder or use a servo." },

      { t: "h", text: "Hobby servos" },
      { t: "p", text: "A hobby servo (SG90, MG996R) is a small DC motor, a gearbox, a potentiometer on the output shaft and a control board in one case. You send it a pulse every 20 ms (50 Hz); the pulse width sets the target angle, conventionally 1 ms for one end, 1.5 ms for centre and 2 ms for the other end, though many servos accept roughly 0.5 to 2.5 ms for their full travel of about 180°. The internal board compares the potentiometer with the pulse width and drives the motor to close the gap. This is closed-loop control in miniature, but crude: you cannot read the position back, you cannot set the speed or torque, and accuracy is a degree or two." },
      { t: "note", kind: "warn", text: "Power servos from a separate 5 to 6 V supply with a common ground, not from the Uno's 5 V pin. An SG90 can draw several hundred milliamps when it starts or stalls, and an MG996R over 2 A, which will brown out the board." },

      { t: "h", text: "Closed-loop servos" },
      { t: "p", text: "An industrial servo is a motor (usually brushless), a high-resolution encoder, and a separate drive that runs nested current, velocity and position control loops thousands of times per second. You command position, velocity or torque over a bus (EtherCAT, CAN, RS-485, or step and direction), and the drive reports back actual position and current. Smart hobby servos such as the Dynamixel range bring some of this down to robot-arm scale. The key difference from a stepper is that a servo measures and corrects, so it cannot silently lose position, and it only draws the current the load needs." },

      { t: "h", text: "Brushless DC motors in outline" },
      { t: "p", text: "A brushless (BLDC) motor turns the DC motor inside out: permanent magnets on the rotor, three windings on the stator, and no brushes. The commutation that brushes did mechanically must now be done electronically by a three-phase bridge (six switches) that energises the windings in the right order for the rotor's position. The controller learns the position from Hall sensors, or sensorlessly from the back-EMF of the undriven winding. With no brushes to wear or spark, BLDC motors are more efficient, longer-lived and quieter, which is why drones, fans, hard disks and electric scooters use them." },
      { t: "p", text: "For hobby use, an **ESC** (electronic speed controller) takes a servo-style pulse (1 to 2 ms at 50 Hz, or faster protocols such as DShot) and does the commutation for you. Simple ESCs use six-step (trapezoidal) commutation. Smooth, efficient control at low speed uses **field-oriented control** (FOC), which module a2 covers." },

      { t: "deep", title: "Why stepper torque falls with speed", blocks: [
        { t: "p", text: "Each step requires the winding current to rise from zero (or reverse) to the target. A winding of inductance L and resistance R driven by supply V reaches current I in a time of roughly L × I / V when V is much larger than I × R. A NEMA 17 with L = 3 mH at 1.5 A on a 12 V supply needs about 0.375 ms per current rise. At 1000 full steps per second, each step lasts only 1 ms, so a large part of each step is spent getting the current up, and the average torque falls." },
        { t: "formula", text: String.raw`t_rise ≈ L × I / V = 0.003 × 1.5 / 12 = 0.375 ms
same motor at 24 V:  0.003 × 1.5 / 24 = 0.19 ms`, caption: "Doubling the supply halves the rise time, which is why printers moved from 12 V to 24 V." },
        { t: "p", text: "The chopper keeps the average current at the set limit regardless of supply, so a higher voltage does not overheat the motor at standstill; it only lets the current rise faster. The limit is the driver's maximum voltage and the motor's insulation. Back-EMF also grows with speed and fights the supply, a second reason torque falls." },
        { t: "p", text: "Decay mode matters too. After each chopper on-time the current decays either slowly (both low-side switches on), quickly (current returned to the supply), or in a mixture. The A4988 and DRV8825 default to mixed decay. Poorly chosen decay causes uneven microsteps and audible noise at low speed; newer drivers such as the TMC2209 adapt automatically and run almost silently." },
      ] },
      { t: "deep", title: "Microstep accuracy and the A4988 full-step current", blocks: [
        { t: "p", text: "In microstepping, the winding currents follow I_A = I_max cos θ and I_B = I_max sin θ. The total holding torque is roughly constant, but the incremental torque that resists being pushed off a microstep is about the holding torque times sin(90° / microstep factor). At 1/16 that is sin(5.6°) ≈ 0.098, under a tenth of the holding torque. Any load torque larger than that shifts the rotor by a whole microstep or more, so treat microstepping as a smoothness feature, not a precision one." },
        { t: "p", text: "One A4988 detail catches people out. In full-step mode both windings are held at about 70.7% of the trip current (the sine table value at 45°), so measuring the winding current in full-step mode reads about 0.71 times what the Vref formula predicts. Pololu suggests setting the limit by Vref rather than by measuring winding current for this reason." },
      ] },
    ],
    mistakes: [
      "**Hot-plugging a stepper on a powered driver.** It can destroy the driver instantly.",
      "**Using a Vref formula for the wrong sense resistor.** Read R050, R068 or R100 on the board first.",
      "**Expecting microstepping to multiply accuracy.** It smooths motion; real accuracy stays near a fraction of a full step.",
      "**Jumping straight to a high step rate.** The motor stalls; ramp the rate up and down.",
      "**Powering servos from the board's 5 V pin.** Starting current browns out the microcontroller.",
      "**Assuming a hobby servo reports its position.** It does not; only its internal loop sees the potentiometer.",
    ],
    practice: {
      kind: "bench",
      task: "Set up a stepper driver safely and measure its behaviour.",
      steps: [
        "Identify the two windings of a NEMA 17 with a multimeter and note the motor's rated current from its label or datasheet.",
        "Fit an A4988 or DRV8825 on a breadboard with a 100 µF capacitor across the motor supply. Read its sense resistor marking and calculate Vref for 75% of rated current.",
        "With the motor connected and the power on (motor still), set Vref with a small screwdriver while measuring it. Power off before touching the motor wires.",
        "Upload the sketch and confirm one revolution each way. Then reduce HALF_PERIOD_US step by step until the motor stalls, and record the highest reliable speed. Repeat with a higher supply voltage if your driver allows it.",
        "Drive an SG90 servo from a separate 5 V supply and find the pulse widths for its two end stops.",
      ],
    },
    quiz: [
      {
        q: "A 1.8° stepper is driven at 1/8 microstepping. How many pulses per second spin it at 2 rev/s?",
        options: ["400", "1600", "3200", "6400"],
        answer: 2,
        why: "200 full steps × 8 = 1600 microsteps per revolution; at 2 rev/s that is 3200 pulses per second.",
      },
      {
        q: "A Pololu A4988 board has 0.068 Ω sense resistors. What current limit does Vref = 0.68 V set?",
        options: ["0.68 A", "1.25 A", "1.0 A", "2.0 A"],
        answer: 1,
        why: "I = Vref / (8 × 0.068) = 0.68 / 0.544 = 1.25 A.",
      },
      {
        q: "What is the main benefit of microstepping?",
        options: [
          "Sixteen times better positional accuracy",
          "Smoother, quieter motion with less resonance",
          "More holding torque",
          "No need for current limiting",
        ],
        answer: 1,
        why: "Microstepping makes motion nearly continuous. The torque holding each microstep is small, so accuracy does not improve in proportion.",
      },
      {
        q: "Why does a bipolar stepper need two H-bridges while a unipolar one can use four low-side transistors?",
        options: [
          "Bipolar motors have more wires",
          "In a bipolar motor the current in each winding must reverse; a unipolar motor uses centre taps so current in each half flows one way",
          "Unipolar motors run on AC",
          "Bipolar motors have no permanent magnets",
        ],
        answer: 1,
        why: "Reversing current needs an H-bridge. Centre-tapped unipolar windings get reversal by energising the other half instead.",
      },
      {
        q: "What does a brushless motor need that a brushed motor does not?",
        options: [
          "A higher supply voltage",
          "Electronic commutation by a three-phase bridge that knows the rotor position",
          "A gearbox",
          "AC mains power",
        ],
        answer: 1,
        why: "Without brushes, the controller must switch the three windings in step with the rotor, using Hall sensors or back-EMF to find its position.",
      },
    ],
  },

  "i9-encoders-and-speed-measurement": {
    id: "i9-encoders-and-speed-measurement",
    outcomes: [
      "Explain how an incremental quadrature encoder signals position and direction",
      "Decode a quadrature encoder at 1x, 2x and 4x resolution, and write an interrupt-based decoder",
      "Convert counts to position and speed, and choose between counting and period measurement",
      "Check that a decoder keeps up with the encoder's maximum edge rate",
    ],
    blocks: [
      { t: "h", text: "Why measure the shaft" },
      { t: "p", text: "Open-loop control assumes that a given PWM duty gives a given speed. It does not: the speed changes with battery voltage, load, temperature and the friction of each gearbox. Two identical motors on a robot at the same duty will drift apart and the robot curves. To control speed or position you must measure it, and the standard sensor is an **incremental encoder** on the motor shaft. This lesson teaches you to read one correctly, which is the core of the module's exit project." },

      { t: "h", text: "Incremental and absolute encoders" },
      { t: "p", text: "An **incremental** encoder produces pulses as the shaft turns. It tells you how far you have moved from wherever you started counting, not where you are. Gear motors such as the N20 and JGA25 are often sold with a small magnetic encoder: a magnet disc on the motor shaft and two Hall sensors, typically giving 7 or 11 pulses per motor revolution. Optical encoders use a slotted disc and a light gate and reach hundreds or thousands of pulses per revolution. An **absolute** encoder outputs the actual angle (for example the AS5600, a 12-bit magnetic angle sensor on I2C) and knows its position at power-up. This lesson is about incremental encoders." },

      { t: "h", text: "Quadrature: two channels for direction" },
      { t: "p", text: "One channel of pulses tells you speed but not direction. A quadrature encoder has two channels, A and B, with the same pulse pattern shifted by a quarter of a cycle (90°). Whichever channel leads tells you the direction." },
      { t: "diagram", text: String.raw`
 forward:
 A  ‾‾‾‾|____|‾‾‾‾|____|‾‾‾‾
 B  ‾‾|____|‾‾‾‾|____|‾‾‾‾|__
 AB   11  10 00  01 11  10 00 ...  (B falls first: B leads)

 state sequence one way:   00 → 01 → 11 → 10 → 00
 state sequence other way: 00 → 10 → 11 → 01 → 00`, caption: "The two-bit state follows a Gray code: only one bit changes at each edge." },
      { t: "p", text: "Because only one channel changes at each edge, every transition from one state to the next identifies the direction unambiguously. A transition in which both bits change at once is impossible for a working encoder read fast enough; seeing one means you missed an edge." },

      { t: "h", text: "1x, 2x and 4x decoding" },
      { t: "p", text: "A disc with N pulses per revolution (PPR, also called lines or CPR in some datasheets, so read carefully) gives you a choice of resolution:" },
      { t: "list", items: [
        "**1x**: count on rising edges of A only, reading B to get the direction. N counts per revolution.",
        "**2x**: count on both edges of A. 2N counts per revolution.",
        "**4x**: count on every edge of both A and B. 4N counts per revolution. This is full quadrature decoding and gives the best resolution.",
      ] },
      { t: "formula", text: String.raw`counts per output rev = PPR × 4 × gear ratio
7 PPR motor, 1:48 gearbox:   7 × 4 × 48 = 1344 counts per output rev
angle resolution          = 360° / 1344 = 0.27°`, caption: "Put the encoder on the motor shaft, before the gearbox, and the gearbox multiplies the resolution." },

      { t: "h", text: "An interrupt-based decoder" },
      { t: "p", text: "Polling the pins in `loop()` misses edges whenever the loop is busy with anything else. Use interrupts. On the Uno only D2 (INT0) and D3 (INT1) have dedicated external interrupts, which is exactly two, enough for one encoder at 4x. The ISR reads both pins, combines the old and new state into a 4-bit index, and looks up +1, -1 or 0 in a table. That one lookup handles every case, including bounce that toggles a pin back and forth (it adds then subtracts, netting zero)." },
      { t: "snippet", lang: "cpp", code: String.raw`// Quadrature encoder on the Uno: A = D2 (INT0), B = D3 (INT1), full 4x decoding.
// Prints count and shaft speed every 100 ms.

const uint8_t PIN_A = 2, PIN_B = 3;
const float COUNTS_PER_REV = 7 * 4 * 48.0;  // e.g. 7 pulses/rev magnet disc, 4x, 1:48 gearbox

volatile long count = 0;
volatile uint8_t lastState = 0;
volatile unsigned long badTransitions = 0;

// Index = (previous AB << 2) | current AB. +1, -1, or 0 (no change or invalid jump).
const int8_t QDEC[16] = { 0, -1, +1,  0,
                         +1,  0,  0, -1,
                         -1,  0,  0, +1,
                          0, +1, -1,  0 };

void onEdge() {
  // Read both pins directly from PIND: much faster than digitalRead inside an ISR.
  uint8_t s = (PIND >> 2) & 0x03;   // bit0 = D2 (A), bit1 = D3 (B)
  uint8_t idx = (lastState << 2) | s;
  int8_t d = QDEC[idx];
  if (d == 0 && s != lastState) badTransitions++;   // both bits changed: a missed edge
  count += d;
  lastState = s;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_A, INPUT_PULLUP);
  pinMode(PIN_B, INPUT_PULLUP);
  lastState = (PIND >> 2) & 0x03;
  attachInterrupt(digitalPinToInterrupt(PIN_A), onEdge, CHANGE);
  attachInterrupt(digitalPinToInterrupt(PIN_B), onEdge, CHANGE);
}

void loop() {
  static unsigned long last = 0;
  static long lastCount = 0;
  if (millis() - last < 100) return;
  last += 100;

  noInterrupts();                  // a long is 4 bytes: copy it atomically
  long c = count;
  unsigned long bad = badTransitions;
  interrupts();

  float rpm = (c - lastCount) / COUNTS_PER_REV / 0.1 * 60.0;
  lastCount = c;
  Serial.print(c); Serial.print('\t');
  Serial.print(rpm, 1); Serial.print(F(" rpm\tbad "));
  Serial.println(bad);
}`, caption: "Arduino Uno, compiled with arduino-cli for arduino:avr:uno. If the count goes negative when you expect positive, swap A and B (or negate the table)." },
      { t: "p", text: "Three details in this code matter. `count` is `volatile` because the ISR changes it behind the main program's back. The main loop copies it with interrupts disabled, because the AVR reads a 4-byte `long` one byte at a time and an interrupt in the middle would give a corrupted value. And the bad-transition counter is a built-in health check: if it rises, the decoder is missing edges." },
      { t: "note", kind: "tip", text: "On the ESP32, the hardware pulse counter (PCNT) peripheral decodes quadrature in hardware with a glitch filter and no CPU load. With Arduino-ESP32 3.x, the ESP32Encoder library or the ESP-IDF pulse_cnt driver use it. On any board, Hall-effect encoder outputs are usually open-collector, so enable pull-ups." },

      { t: "h", text: "From counts to speed" },
      { t: "p", text: "There are two ways to turn pulses into speed, and each is good where the other is poor." },
      { t: "list", items: [
        "**Frequency (count) method**: count edges over a fixed window T and divide. The sketch does this with T = 100 ms. Resolution is one count per window: at 1344 counts per revolution and T = 0.1 s, one count is 60 / (1344 × 0.1) = 0.45 rpm. Good at high speed, coarse at low speed, where only a few counts arrive per window.",
        "**Period method**: time the interval between successive edges with `micros()` in the ISR. Speed is the reciprocal. Precise at low speed, where intervals are long; at high speed the intervals become a few microseconds and timer resolution and ISR jitter dominate. It also needs a timeout to report zero when the shaft stops.",
      ] },
      { t: "p", text: "**Worked example.** The TT motor from lesson 1 at no load runs at 200 rpm at the output, 9600 rpm at the motor. With a 7 PPR disc on the motor shaft at 4x, the edge rate is 9600 / 60 × 28 = 4480 edges per second. In a 100 ms window you count 448 edges, and 448 / 1344 / 0.1 × 60 = 200 rpm. Check: it matches the speed we started from." },

      { t: "h", text: "Can the decoder keep up?" },
      { t: "p", text: "Every edge costs an interrupt. On the Uno, entering and leaving an ISR through `attachInterrupt` plus the short decoder above takes roughly 5 µs. At 4480 edges per second the ISR uses about 2% of the CPU, which is fine. But a 500-line optical encoder at 3000 rpm gives 500 × 4 × 50 = 100 000 edges per second, which would need half a second of ISR time every second and leave nothing for the rest of the program. In that case decode at 1x, use a board with a hardware quadrature counter (ESP32 PCNT, STM32 timers in encoder mode), or fit a dedicated counter chip." },

      { t: "deep", title: "Why the lookup table works", blocks: [
        { t: "p", text: "Write the state as s = (B << 1) | A, giving values 0 to 3. The sequence the table counts as +1 is 0, 2, 3, 1, 0 and the -1 sequence is 0, 1, 3, 2, 0. The index (old << 2) | new picks out one of 16 possible old/new pairs. The four pairs where old equals new (indices 0, 5, 10, 15) are no change: 0. The four pairs where both bits flip (indices 3, 6, 9, 12, for example 0 to 3) are invalid: 0, and the sketch counts them. The remaining eight are valid single steps, four in each direction, assigned -1 and +1." },
        { t: "p", text: "Contact bounce or electrical noise on one channel toggles that bit back and forth while the other is steady. Each toggle is a valid transition, alternately +1 and -1, so the net count is unchanged. This is why table-based 4x decoding is robust where a naive \"count rising edges of A\" decoder adds an extra count for every bounce." },
        { t: "p", text: "Many encoders also have an index (Z) channel that pulses once per revolution. Use it to zero the count at a known angle (homing) and to detect missed counts: the count difference between index pulses must always be exactly 4N." },
      ] },
      { t: "deep", title: "Choosing the speed-measurement window", blocks: [
        { t: "p", text: "The count method's quantisation error is ±1 count per window, so the relative error is 1 / (counts per window). For 1% resolution you need 100 counts per window, which at 4480 edges per second requires a window of at least 22 ms. A longer window gives finer resolution but adds delay: the reported speed is an average over the window, so it lags the true speed by about half the window. A speed control loop running every 20 ms needs speed measurements on the same timescale, which is why fast loops need higher-resolution encoders." },
        { t: "p", text: "A hybrid method gets the best of both: in each fixed window, count the edges and also record the exact time of the first and last edge. Speed = (edges - 1) / (time between first and last edge). This has the period method's precision and the count method's averaging, and is what many commercial drives do." },
        { t: "p", text: "Gearbox backlash means a motor-shaft encoder does not see the output shaft's play. For position control of a robot joint where backlash matters, mount the encoder on the output, accepting the loss of the gear multiplication of resolution, or use both encoders." },
      ] },
    ],
    mistakes: [
      "**Polling an encoder in loop().** Any delay or Serial print misses edges. Use interrupts or a hardware counter.",
      "**Reading a multi-byte volatile count without disabling interrupts.** On the 8-bit AVR it can be torn mid-read.",
      "**Using digitalRead in the ISR on a fast encoder.** It is slow; read the port register.",
      "**Confusing PPR, CPR and lines.** Check whether the datasheet number is before or after 4x and before or after the gearbox.",
      "**Forgetting pull-ups on open-collector Hall encoders.** The lines float and count noise.",
      "**Feeding 5 V encoder outputs into an ESP32.** Power the encoder at 3.3 V if it supports it, or level-shift.",
    ],
    practice: {
      kind: "bench",
      task: "Measure motor speed against PWM duty: the first half of the exit project rig.",
      steps: [
        "Wire a gear motor with a quadrature encoder: A to D2, B to D3 on the Uno, encoder power to 5 V and GND. Drive the motor from the TB6612FNG sketch of lesson 1, moving PWM to Timer1 as there.",
        "Merge the encoder code into the motor sketch. Print duty, count and rpm every 100 ms.",
        "Turn the shaft by hand exactly one output revolution and confirm the count is close to PPR × 4 × gear ratio.",
        "Step duty from 0 to 100% in 10% steps, holding each for 2 s, and record the steady speed. Plot speed against duty and note the dead band at low duty where the motor does not turn.",
        "Repeat at a second supply voltage, and with a light load (a finger on the wheel). Describe how much open-loop speed varies, and check the bad-transition counter stays at zero.",
      ],
    },
    quiz: [
      {
        q: "An encoder has 11 PPR on the motor shaft and the gearbox is 1:30. With 4x decoding, how many counts per output revolution?",
        options: ["330", "660", "1320", "44"],
        answer: 2,
        why: "11 × 4 × 30 = 1320 counts per output revolution.",
      },
      {
        q: "In a quadrature decoder, the state jumps from 00 to 11 in one step. What does this mean?",
        options: [
          "The shaft reversed",
          "The shaft moved forward two steps normally",
          "An edge was missed, so the direction cannot be known",
          "The encoder has an index pulse",
        ],
        answer: 2,
        why: "In a Gray-code sequence only one bit changes per step. Both changing means at least one transition was missed.",
      },
      {
        q: "Why does the sketch copy `count` with interrupts disabled?",
        options: [
          "To make the ISR faster",
          "Because the AVR reads a 4-byte long in several steps and an interrupt could change it halfway",
          "Because Serial.print needs interrupts off",
          "To reset the count",
        ],
        answer: 1,
        why: "An 8-bit CPU reads a 32-bit value byte by byte. If the ISR updates it between bytes the copy is corrupted.",
      },
      {
        q: "You count 224 edges in 100 ms from an encoder with 1344 counts per output revolution. What is the output speed?",
        options: ["50 rpm", "100 rpm", "200 rpm", "16.7 rpm"],
        answer: 1,
        why: "224 / 1344 = 0.1667 rev in 0.1 s, which is 1.667 rev/s, or 100 rpm.",
      },
      {
        q: "At very low speeds, which speed measurement method is more precise?",
        options: [
          "Counting edges in a fixed window",
          "Timing the period between edges",
          "Both are equally precise",
          "Neither works below 100 rpm",
        ],
        answer: 1,
        why: "At low speed only a few edges arrive per window, so counting is coarse. The intervals are long, so timing them is precise.",
      },
    ],
  },

  "i9-regulators-and-batteries": {
    id: "i9-regulators-and-batteries",
    outcomes: [
      "Calculate the dissipation and temperature rise of a linear regulator, and decide when it is acceptable",
      "Explain how a buck converter achieves high efficiency, and use one correctly",
      "Describe Li-ion and LiPo voltages, capacity and C-rate, and size a battery",
      "Explain what a TP4056 charger and a DW01 protection circuit do, and handle lithium cells safely",
    ],
    blocks: [
      { t: "h", text: "Power is where projects fail" },
      { t: "p", text: "Ask anyone who has built robots what killed their projects, and many will say power: a regulator too hot to touch, a board that resets whenever the motors start, a battery that swelled, or a cell that was charged wrongly and caught fire. None of these is mysterious. A regulator's heat follows from one multiplication. A battery's run time and safe current follow from two numbers on its label. This lesson covers voltage regulators and lithium batteries; the next puts them together into a power budget." },

      { t: "h", text: "Linear regulators" },
      { t: "p", text: "A linear regulator, such as the AMS1117-3.3 on many ESP32 boards or the 7805, works like a variable resistor in series with the load, adjusted continuously to hold the output steady. All the load current flows through it, and it drops the difference between input and output voltage. So it dissipates:" },
      { t: "formula", text: String.raw`P_loss    = (V_in - V_out) × I_load
efficiency ≈ V_out / V_in              (ignoring the small quiescent current)
ΔT        = P_loss × θ_JA              (θ_JA in °C/W, junction to ambient)`, caption: "A linear regulator turns the voltage difference times the current into heat." },
      { t: "p", text: "Every linear regulator also has a **dropout voltage**: the minimum V_in - V_out at which it can still regulate. The AMS1117's dropout is about 1.1 V at 800 mA (1.3 V maximum), so a 3.3 V AMS1117 needs at least about 4.4 V in at full current. Low-dropout (LDO) regulators such as the MCP1700 or AP2112 drop only 0.2 to 0.3 V, which matters when running from a single Li-ion cell." },
      { t: "p", text: "**Worked example 1.** An AMS1117-3.3 on an ESP32 board takes 5 V from USB and supplies 300 mA. P = (5 - 3.3) × 0.3 = 0.51 W. In the SOT-223 package on a small board, θ_JA is roughly 60 to 90 °C/W depending on the copper around it. Taking 90 °C/W, the junction runs 0.51 × 90 ≈ 46 °C above ambient, about 80 °C on a warm day. Warm, but acceptable. Efficiency is 3.3 / 5 = 66%." },
      { t: "p", text: "**Worked example 2.** Same regulator, now fed from a 12 V adapter. P = (12 - 3.3) × 0.3 = 2.61 W, and the temperature rise would be 2.61 × 90 ≈ 235 °C. The regulator's thermal shutdown (around 150 °C junction) will cut the output repeatedly, and the board will reset in a loop. Efficiency would be 3.3 / 12 = 27.5%. A large voltage step at more than a few tens of milliamps needs a switching regulator." },

      { t: "h", text: "Switching regulators" },
      { t: "p", text: "A **buck** (step-down) converter switches the input on and off hundreds of thousands of times per second into an inductor and capacitor that smooth the result. An ideal switch has no voltage across it when on and no current through it when off, so it dissipates nothing; an ideal inductor and capacitor store and release energy without loss. The output voltage is set by the duty cycle D: V_out ≈ D × V_in. Real converters lose a little in switch resistance, switching transitions and the inductor, and typically reach 80 to 95% efficiency." },
      { t: "formula", text: String.raw`P_out = P_in × η
I_in  = V_out × I_out / (η × V_in)

12 V → 5 V at 1 A, η = 0.9:
P_out = 5 W,  P_in = 5.56 W,  loss = 0.56 W
I_in  = 5 / (0.9 × 12) = 0.46 A     (less than the output current)
Linear for comparison: loss = (12 - 5) × 1 = 7 W`, caption: "A buck converter conserves power, not current: input current is lower than output current when stepping down." },
      { t: "p", text: "Common modules: the **MP1584** (4.5 to 28 V in, up to 3 A, switching at about 1.5 MHz, set with a trimmer), the **LM2596** (up to 40 V in, 3 A, 150 kHz, larger), and boost modules such as the MT3608 for stepping up. The prices of these modules make switching the default for any battery robot." },
      { t: "note", kind: "warn", text: "Set the output voltage of an adjustable buck module with a multimeter before connecting anything to it. Many ship set near their maximum output, which on a 12 V input can be 11 V or more. Feeding that into an ESP32's 3.3 V pin destroys it instantly." },
      { t: "p", text: "Switchers have costs. They produce ripple and radio-frequency noise at their switching frequency, which can upset sensitive analog measurements and radios. A common pattern is a buck converter to get most of the way efficiently, followed by a small LDO for a clean final rail: 7.4 V battery, buck to 5 V, LDO to 3.3 V." },

      { t: "h", text: "Lithium-ion and LiPo cells" },
      { t: "p", text: "Li-ion cells (cylindrical 18650s) and LiPo cells (lithium polymer pouches) share the same chemistry family and voltages. Lithium ions shuttle between a graphite anode and a metal-oxide cathode through an electrolyte; in LiPo cells the electrolyte is a gel in a flexible pouch, which allows thin shapes and very high currents but makes the cell easy to puncture." },
      { t: "table", head: ["Quantity", "Value per cell", "Note"], rows: [
        ["Fully charged", "4.20 V", "never charge above this (±50 mV)"],
        ["Nominal", "3.6 to 3.7 V", "the label voltage, used for energy"],
        ["Storage", "about 3.8 V", "for weeks or longer unused"],
        ["Discharge cut-off", "3.0 V typical", "2.5 V absolute minimum on many datasheets; stop higher for long life"],
      ], caption: "Lithium-ion and LiPo cell voltages. A 2S pack is two cells in series: 8.4 V full, 7.4 V nominal." },
      { t: "p", text: "**Capacity** is in milliamp-hours: a 2200 mAh cell can in principle deliver 2.2 A for one hour. Energy is capacity times nominal voltage: a 2S 2200 mAh pack holds 7.4 × 2.2 = 16.3 Wh. **C-rate** expresses current relative to capacity: 1C for a 2200 mAh cell is 2.2 A. A LiPo labelled 25C can supply 25 × 2.2 = 55 A in bursts. A typical 18650 is rated for 1C to 2C continuous discharge unless it is a high-drain type. Charging is normally limited to 0.5C to 1C." },
      { t: "p", text: "Lithium cells charge in two phases: **constant current** (CC) until the cell reaches 4.20 V, then **constant voltage** (CV) at 4.20 V while the current tapers; charging stops when the current falls to about C/10. A charger that keeps pushing current after 4.2 V overcharges the cell, which plates metallic lithium inside it and can lead to an internal short and fire." },

      { t: "h", text: "TP4056 charger and DW01 protection" },
      { t: "p", text: "The ubiquitous blue TP4056 module is a single-cell CC/CV linear charger. It charges to 4.2 V (±1.5%) and its current is set by one resistor, R_PROG: I = 1200 / R_PROG (amps, with R in ohms). The modules ship with 1.2 kΩ for 1 A; swap it for 2.4 kΩ to charge at 0.5 A for a smaller cell. Being a linear charger, it gets hot: at 1 A from 5 V into a 3.7 V cell it dissipates about 1.3 W." },
      { t: "p", text: "The version with six pads (IN+, IN-, B+, B-, OUT+, OUT-) adds a **DW01A** protection IC and an **8205A** dual MOSFET. The DW01A disconnects the cell if its voltage rises above about 4.25 V (overcharge), falls below about 2.4 V (over-discharge), or if the current exceeds its limit (overcurrent and short circuit, typically a few amps on these modules). Connect the load to OUT, not to B, or the protection does nothing for it." },
      { t: "note", kind: "safety", text: "Lithium cells store a lot of energy and fail violently. Never charge a cell without a proper lithium charger or below 0 °C; never short its terminals (an 18650 can deliver tens of amps and weld a wire); never puncture, crush or solder directly to a cell; never use a cell that is swollen, dented or has been discharged below about 2 V; charge on a non-flammable surface where you can see it, and never leave charging unattended. Use protected cells or a protection board in every project. If a cell swells, smokes or hisses, move away; do not try to extinguish a lithium fire with a small cup of water, and keep a sand bucket nearby when charging packs." },
      { t: "p", text: "For packs of two or more cells in series, a single-cell TP4056 is not enough: each cell must stay within its limits, which needs a multi-cell protection board with **balancing**, and a charger designed for the pack (an RC balance charger, or a 2S/3S BMS with a matching charger). Charging series cells without balancing lets one cell drift high and overcharge while the pack voltage looks fine." },

      { t: "deep", title: "Inside a buck converter", blocks: [
        { t: "p", text: "During the on time D × T, the switch connects the inductor to V_in, and the voltage across it is V_in - V_out, so its current ramps up. During the off time (1 - D) × T, a diode or a second switch connects the inductor to ground, the voltage across it is -V_out, and its current ramps down. In steady state the current must return to its starting value each cycle, so the up-ramp and down-ramp areas are equal." },
        { t: "formula", text: String.raw`(V_in - V_out) × D T = V_out × (1 - D) T
V_in D - V_out D = V_out - V_out D
V_out = D × V_in

ripple ΔI = (V_in - V_out) × D / (L × f)
12 V → 5 V, f = 1.5 MHz, L = 4.7 µH:
D = 0.417,  ΔI = 7 × 0.417 / (4.7e-6 × 1.5e6) = 0.41 A`, caption: "Volt-second balance on the inductor gives the buck converter's transfer function and inductor ripple." },
        { t: "p", text: "The higher the switching frequency, the smaller the inductor and capacitors for a given ripple, which is why the MP1584 at 1.5 MHz is so tiny. The cost is switching loss, which grows with frequency. Module a2 designs a converter from scratch, including the control loop that adjusts D as the load changes." },
      ] },
      { t: "deep", title: "Why lithium cells fail and how to judge a cell's health", blocks: [
        { t: "p", text: "Overcharging forces lithium to deposit as metal on the anode surface instead of entering the graphite. These deposits grow as dendrites that can pierce the separator, shorting the cell internally. Over-discharge below about 2 V dissolves the copper current collector; when the cell is recharged the copper re-deposits and can also cause shorts. Heat above about 60 °C accelerates electrolyte breakdown, which produces gas (the swelling you see in old LiPo pouches). Past about 130 to 150 °C the reactions become self-heating: thermal runaway." },
        { t: "p", text: "A cell's internal resistance tells you its health. Measure the open-circuit voltage, apply a known load current, and measure again: R = ΔV / I. A good 18650 is around 20 to 60 mΩ; an aged one may be several times that. High internal resistance means large voltage sag under load, which shows up as brown-outs when motors start, and heating at high current (I²R)." },
        { t: "p", text: "Fake capacity ratings are common on unbranded 18650s; a cell labelled 9900 mAh is a lie (the best real 18650s are about 3500 mAh). Measure capacity by discharging at a known current to 3.0 V and timing it." },
      ] },
    ],
    mistakes: [
      "**Using a linear regulator for a big voltage drop at real current.** 12 V to 3.3 V at 300 mA is 2.6 W of heat.",
      "**Forgetting dropout.** An AMS1117-3.3 cannot make 3.3 V from a 3.7 V cell.",
      "**Connecting an adjustable buck module before setting its output.** It may be near its maximum.",
      "**Wiring the load to B+ and B- on a TP4056 protection module.** The protection only covers OUT+ and OUT-.",
      "**Charging series cells without balancing.** One cell overcharges while the pack voltage looks normal.",
      "**Running a cell down to the protection cut-off every time.** About 2.4 V is a last-resort limit; stop at 3.0 to 3.3 V in firmware.",
    ],
    practice: {
      kind: "bench",
      task: "Compare a linear and a switching regulator, and characterise a cell.",
      steps: [
        "Feed an AMS1117-3.3 module and an MP1584 buck module (set to 3.3 V first) from the same 9 V or 12 V supply.",
        "Load each with a resistor that draws about 200 mA (16.5 Ω, rated at least 1 W). Measure input and output voltage and current for each and calculate efficiency.",
        "Measure the regulators' temperatures after 2 minutes (a finger test only if below about 50 °C; prefer a thermocouple). Compare with P × θ_JA.",
        "With a protected 18650 or LiPo cell, measure its open-circuit voltage, then the voltage while drawing 1 A from a load resistor. Calculate its internal resistance.",
        "Charge the cell on a TP4056 module on a non-flammable surface, logging cell voltage every few minutes. Identify the CC and CV phases and the end of charge.",
      ],
    },
    quiz: [
      {
        q: "A linear regulator drops 9 V to 5 V at 250 mA. How much power does it dissipate?",
        options: ["0.25 W", "1.0 W", "1.25 W", "2.25 W"],
        answer: 1,
        why: "P = (9 - 5) × 0.25 = 1.0 W.",
      },
      {
        q: "A buck converter makes 5 V at 2 A from 12 V with 90% efficiency. What is the input current?",
        options: ["2.0 A", "0.93 A", "0.83 A", "2.2 A"],
        answer: 1,
        why: "P_in = 10 W / 0.9 = 11.1 W, so I_in = 11.1 / 12 ≈ 0.93 A.",
      },
      {
        q: "A 1500 mAh LiPo is rated 20C. What is its maximum rated discharge current?",
        options: ["1.5 A", "20 A", "30 A", "75 A"],
        answer: 2,
        why: "20 × 1.5 A = 30 A.",
      },
      {
        q: "Why can an AMS1117-3.3 not regulate correctly from a single Li-ion cell at 3.7 V?",
        options: [
          "The cell voltage is too high",
          "Its dropout is about 1.1 V, so it needs around 4.4 V input",
          "It only works on AC",
          "Lithium cells are too noisy",
        ],
        answer: 1,
        why: "A linear regulator needs V_in at least V_out plus its dropout. 3.3 + 1.1 = 4.4 V, above the cell's voltage.",
      },
      {
        q: "On a TP4056 module with protection, where should the load connect?",
        options: ["B+ and B-", "OUT+ and OUT-", "IN+ and IN-", "Directly to the cell"],
        answer: 1,
        why: "The DW01A and MOSFETs sit between B- and OUT-. Only a load on OUT is protected against over-discharge and short circuit.",
      },
      {
        q: "What happens in the CV phase of lithium charging?",
        options: [
          "The charger holds the cell at 4.2 V while the current falls",
          "The charger pushes constant current above 4.2 V",
          "The cell is discharged to 3.0 V",
          "The charger balances cells in series",
        ],
        answer: 0,
        why: "After the CC phase reaches 4.2 V, the charger holds that voltage and the current tapers until it drops to about C/10.",
      },
    ],
  },

  "i9-power-budget-and-motor-rig": {
    id: "i9-power-budget-and-motor-rig",
    outcomes: [
      "Write a power budget for a battery-powered robot and estimate its run time",
      "Place decoupling and bulk capacitors and size a bulk capacitor for a load step",
      "Explain brown-outs and the brown-out detectors on the Uno and ESP32",
      "Lay out ground connections so motor current does not corrupt logic and sensor signals",
    ],
    blocks: [
      { t: "h", text: "Design the power tree before you wire it" },
      { t: "p", text: "Every earlier lesson in this module had a power question hiding inside it: the stall current of a motor, the Vref of a stepper driver, the heat in a regulator, the C-rate of a battery. A **power budget** gathers them into one table so you can answer three questions before buying parts: how long will it run, what is the peak current, and is every supply rail and component inside its rating? A **power tree** is the drawing that goes with it: which source feeds which regulator, which regulator feeds which load." },

      { t: "h", text: "Writing a power budget" },
      { t: "p", text: "List every load, the rail it is on, its average current and its peak current. Convert to power on each rail, then refer each rail back to the battery through its regulator's efficiency. Take currents from datasheets or, better, from measurement with a multimeter in series." },
      { t: "p", text: "**Worked example.** A two-wheeled robot runs from a 2S LiPo (7.4 V nominal, 2200 mAh). Its motors are driven from the battery through a TB6612FNG; an MP1584 buck converter (assume 90%) makes 5 V for an ESP32 DevKit and sensors, and the DevKit's own regulator makes 3.3 V." },
      { t: "table", head: ["Load", "Rail", "Average", "Peak", "Average power at battery"], rows: [
        ["ESP32 DevKit (Wi-Fi on)", "5 V", "100 mA", "about 350 mA", "part of 5 V rail"],
        ["Sensors (IMU, encoders, ToF)", "5 V", "30 mA", "50 mA", "part of 5 V rail"],
        ["5 V rail total", "5 V", "130 mA (0.65 W)", "400 mA", "0.65 / 0.9 = 0.72 W"],
        ["Two TT motors, cruising", "7.4 V", "2 × 0.4 A", "2 × 1.85 A (stall)", "0.8 × 7.4 = 5.92 W"],
        ["Total", "", "", "about 4.0 A", "6.64 W"],
      ], caption: "Stall current at 7.4 V with R = 4 Ω is 1.85 A per motor. The ESP32 peak comes from Wi-Fi transmit bursts." },
      { t: "formula", text: String.raw`Battery energy   = 7.4 V × 2.2 Ah = 16.3 Wh
Usable (80%)     = 13.0 Wh          (stop at about 3.5 V per cell under load)
Run time         = 13.0 / 6.64 ≈ 1.96 h  ≈ 2 hours

Peak current     ≈ 3.7 A (motors) + 0.4 A × 5 / (0.9 × 7.4) ≈ 4.0 A
C-rate at peak   = 4.0 / 2.2 ≈ 1.8C     (fine for any LiPo, too much for many 18650s)`, caption: "Budget the battery on energy (watt-hours), not milliamp-hours, when regulators convert between voltages." },
      { t: "p", text: "Note what the budget tells you. The motors dominate, so the electronics barely affect run time. The peak current (about 4 A) sets the battery's C-rating, the wire gauge, the fuse and the driver's peak rating (TB6612FNG: 3.2 A peak per channel, so the start-up surge of both motors at 1.85 A each is within it; but 1.85 A is above its 1.2 A average rating, so a stall that lasts more than a moment will overheat it or trip its thermal shutdown). And every 10% improvement in motor efficiency, such as replacing an L298N, is worth more than any firmware power saving." },
      { t: "diagram", text: String.raw`
 2S LiPo 7.4 V ──[ fuse 5 A ]──[ switch ]──┬──► TB6612FNG VM ──► motors
                                           │
                                           └──► MP1584 buck 5 V ──┬──► ESP32 DevKit 5V pin
                                                                  │      └─► onboard LDO 3.3 V ──► ESP32, IMU
                                                                  └──► encoders, TB6612FNG VCC`, caption: "The power tree for the worked example. Put a fuse right at the battery." },

      { t: "h", text: "Decoupling and bulk capacitance" },
      { t: "p", text: "Digital chips draw current in sharp spikes at every clock edge, and the wires and traces from the regulator have inductance that resists sudden changes in current. Without help, each spike causes a dip in the chip's local supply. A **decoupling capacitor** (100 nF ceramic) placed right at each supply pin supplies those spikes locally. It must be close, within a few millimetres, with short connections to both the pin and ground, because the inductance of a long lead defeats it." },
      { t: "p", text: "**Bulk capacitors** (10 µF to 1000 µF electrolytic or polymer) handle slower, larger demands: a motor starting, a Wi-Fi transmit burst, a servo moving. For a load step I lasting Δt that the supply cannot deliver quickly, the capacitor's voltage dips by:" },
      { t: "formula", text: String.raw`ΔV = I × Δt / C

1 A for 100 µs from 470 µF:  ΔV = 1 × 100e-6 / 470e-6 = 0.21 V`, caption: "Sizing a bulk capacitor for a short load step." },
      { t: "list", items: [
        "100 nF ceramic at every IC supply pin, as close as possible.",
        "10 µF to 47 µF at each regulator's input and output (check the regulator datasheet; some LDOs need a minimum output capacitance to be stable).",
        "100 µF or more at each motor driver's supply input, rated for at least 1.5 to 2 times the supply voltage.",
        "100 nF across each brushed motor's terminals.",
        "On the ESP32, an extra 100 µF to 470 µF near the 3.3 V pin helps it ride through Wi-Fi start-up current.",
      ] },

      { t: "h", text: "Brown-outs" },
      { t: "p", text: "A **brown-out** is a supply dip that is too short to see on a multimeter but long enough to put a microcontroller into an undefined state: corrupted variables, a frozen I2C bus, or a half-written flash page. Both your boards have a **brown-out detector** (BOD) that holds the chip in reset while the supply is too low, which is far safer than letting it run confused." },
      { t: "list", items: [
        "**Arduino Uno (ATmega328P)**: the BOD level is set by a fuse; the Uno's standard fuse settings select 2.7 V. The chip records the cause of a reset in the MCUSR register, with BORF set after a brown-out.",
        "**ESP32**: the BOD trips at about 2.43 V on the 3.3 V supply by default. You will see \"Brownout detector was triggered\" on the serial monitor, typically when Wi-Fi starts on a weak USB cable or when motors share the supply.",
      ] },
      { t: "p", text: "The cure is never to disable the detector, but to remove the dip: power motors and logic from separate regulators (or separate batteries) with a common ground, add bulk capacitance, use short thick power wires, check the battery's internal resistance, and soft-start motors by ramping the PWM up over 100 to 200 ms instead of jumping to full duty, which reduces the stall-current spike." },

      { t: "h", text: "Grounding" },
      { t: "p", text: "Ground is not a single magic potential. Every wire has resistance: 30 cm of thin breadboard jumper might be 0.1 Ω. When 2 A of motor current flows through it, the two ends differ by 0.2 V. If your sensor's ground is on that wire, the sensor reading shifts by 0.2 V every time the motor runs, and a 0.2 V shift on a logic ground can corrupt I2C. The fix is to control where large currents flow." },
      { t: "list", items: [
        "**Star ground**: run separate ground wires from the motor driver and from the logic back to one point, at the battery negative or the main capacitor, so motor current never flows in the logic ground wire.",
        "**Common ground, one connection**: the microcontroller and the motor driver must share ground or the control signals have no reference. Share it once, at the star point, not through several parallel paths that form loops.",
        "**Keep high-current loops small**: route the motor supply and its return side by side or twisted together. A small loop radiates less and picks up less.",
        "**Separate analog readings from motor events** where you can: sample sensitive sensors when motors are off or in a quiet part of the PWM cycle.",
      ] },
      { t: "note", kind: "safety", text: "Motors and batteries can hurt you as well as your circuit. Fit a fuse rated just above the peak current at the battery's positive terminal, and a power switch you can reach quickly. Keep fingers, hair and loose cables away from wheels and gears when testing; prop a robot up so its wheels spin freely in the air for first tests. A stalled motor gets hot enough to burn, and a shorted LiPo can melt wires in seconds." },

      { t: "h", text: "The exit project: an open-loop control rig" },
      { t: "p", text: "The module's exit project combines everything: a motor driven by a MOSFET H-bridge at 20 kHz, a quadrature encoder read by interrupts, a power tree with a measured budget, and a document that explains it. Its job is to measure how speed responds to duty, supply voltage and load in open loop, which is the data you will need when you close the loop with PID in module i12." },

      { t: "deep", title: "Wire, trace and connector resistance", blocks: [
        { t: "p", text: "Copper has a resistivity of about 1.7 × 10⁻⁸ Ω·m. A wire's resistance is ρ × length / area. Typical breadboard jumper wire is 22 to 24 AWG (about 0.2 to 0.33 mm²), giving roughly 0.05 to 0.09 Ω per metre, and each breadboard contact adds 10 to 50 mΩ, which can rise sharply when a contact is worn. Silicone-insulated 18 AWG (0.82 mm²) is about 0.021 Ω per metre." },
        { t: "formula", text: String.raw`R = ρ L / A
0.3 m of 24 AWG (0.205 mm²): R = 1.7e-8 × 0.3 / 0.205e-6 ≈ 0.025 Ω
plus two breadboard contacts at 0.03 Ω each ≈ 0.085 Ω
drop at 2 A ≈ 0.17 V, loss ≈ 0.34 W`, caption: "Breadboards and thin jumpers are the commonest cause of mysterious motor-related resets." },
        { t: "p", text: "For anything over about 1 A, use proper wire soldered or screwed into terminals, not breadboard rails. On a PCB, the rule of thumb for a 1 oz (35 µm) outer copper trace is about 1 mm width per 2 to 3 A for a modest temperature rise; module a3 uses the IPC-2152 charts for real designs." },
      ] },
      { t: "deep", title: "Why decoupling capacitors must be close: inductance", blocks: [
        { t: "p", text: "A trace or wire has roughly 1 nH of inductance per millimetre. The voltage across an inductance is L × dI/dt. A chip pulling 50 mA in 5 ns through 20 mm of trace (20 nH) sees a dip of 20e-9 × 0.05 / 5e-9 = 0.2 V, a disturbance large enough to matter on a 3.3 V logic rail. Put a capacitor 2 mm from the pin and the inductance of its path is about a tenth of that, so the dip shrinks proportionally." },
        { t: "p", text: "Every real capacitor also has its own equivalent series inductance (ESL) and resistance (ESR), so above its self-resonant frequency it stops acting like a capacitor. A 100 nF 0603 ceramic, with about 0.5 to 1 nH of ESL, resonates around 15 to 25 MHz, which suits microcontroller clock harmonics. Large electrolytics resonate far lower, which is why you pair a big bulk capacitor with small ceramics rather than relying on either alone." },
      ] },
    ],
    mistakes: [
      "**Budgeting in milliamp-hours across different voltages.** Use watt-hours when regulators convert between rails.",
      "**Ignoring peak current.** The battery, wires, fuse and driver must all handle the stall current.",
      "**Placing decoupling capacitors far from the pins.** The connecting inductance defeats them.",
      "**Disabling the brown-out detector to stop resets.** It hides the fault and lets the chip run corrupted.",
      "**Running motor current through the logic ground wire.** Use a star ground so motor current returns on its own path.",
      "**Powering motors through a breadboard.** Contact resistance and thin rails cause voltage drops and heating.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: a motor speed measurement and open-loop control rig with a documented power budget.",
      steps: [
        "Draw the power tree for your rig: battery or bench supply, fuse, switch, motor driver, buck converter, microcontroller. Note every capacitor and the star ground point.",
        "Build it with soldered or screw-terminal power wiring, a TB6612FNG or DRV8833 at 20 kHz, and an encoder motor read by interrupts (lessons 1 and 3). Use proper wire for anything carrying motor current.",
        "Measure the average and peak current of each rail with a multimeter (and a shunt or INA219 for peaks). Fill in a power budget table and calculate run time from your battery's watt-hours.",
        "Sweep duty from 0 to 100% and record speed at two supply voltages and with and without a light load. Plot the curves and the dead band.",
        "Provoke a brown-out on purpose: start the motor at full duty on a weak supply with no bulk capacitor and observe the reset. Then fix it with bulk capacitance, separate rails and a soft-start ramp, and show that it no longer resets.",
        "Write a two-page report: power tree, budget table, speed curves, and how much open-loop speed varied with voltage and load. That variation is the case for closed-loop control.",
      ],
    },
    quiz: [
      {
        q: "A robot draws 6 W on average from a 3S LiPo (11.1 V nominal, 1500 mAh). Using 80% of the energy, roughly how long does it run?",
        options: ["about 1.3 h", "about 2.2 h", "about 0.25 h", "about 16 h"],
        answer: 1,
        why: "Energy = 11.1 × 1.5 = 16.65 Wh; 80% is 13.3 Wh; 13.3 / 6 ≈ 2.2 h.",
      },
      {
        q: "A 1 A load step lasts 50 µs and is supplied by a 220 µF bulk capacitor. About how far does the voltage dip?",
        options: ["0.023 V", "0.23 V", "2.3 V", "0.0044 V"],
        answer: 1,
        why: "ΔV = I Δt / C = 1 × 50e-6 / 220e-6 ≈ 0.23 V.",
      },
      {
        q: "Your ESP32 prints \"Brownout detector was triggered\" every time the motors start. What is the right fix?",
        options: [
          "Disable the brown-out detector",
          "Separate the motor and logic supplies, add bulk capacitance and ramp the PWM up",
          "Lower the CPU frequency",
          "Use a longer USB cable",
        ],
        answer: 1,
        why: "The detector is reporting a real supply dip caused by motor start current. Remove the dip; do not hide it.",
      },
      {
        q: "Why should motor current not flow through the same ground wire as a sensor?",
        options: [
          "Ground wires can only carry one signal",
          "The motor current develops a voltage across the wire's resistance, shifting the sensor's ground and its reading",
          "It reverses the motor",
          "It increases the battery's capacity",
        ],
        answer: 1,
        why: "Even 0.1 Ω carrying 2 A gives 0.2 V. A star ground keeps the large current on its own return path.",
      },
      {
        q: "Where must a 100 nF decoupling capacitor be placed?",
        options: [
          "Anywhere on the same board",
          "Next to the battery",
          "Right at the IC's supply pin with short connections to pin and ground",
          "In series with the supply",
        ],
        answer: 2,
        why: "The inductance of a long connection prevents the capacitor from supplying fast current spikes. Close placement keeps that inductance small.",
      },
    ],
  },
};

export default lessons;
