import type { ModuleContent } from "../model/curriculum";

/**
 * Module i6: Real-time programming.
 * AVR examples target the Arduino Uno (AVR core 1.8.8, avr-libc <util/atomic.h>);
 * ESP32 examples target Arduino-ESP32 3.x (core 3.3.10, ESP-IDF 5.x).
 * Every complete sketch here compiles with arduino-cli.
 */
const lessons: ModuleContent = {
  "i6-super-loop-and-timing": {
    id: "i6-super-loop-and-timing",
    outcomes: [
      "Explain why blocking code breaks multi-tasking and identify blocking calls",
      "Structure firmware as a super-loop of short, non-blocking jobs",
      "Write millis()-based timing that survives counter rollover, and prove why it does",
      "Build reusable software timers, periodic and one-shot",
    ],
    blocks: [
      { t: "h", text: "Why real-time programming" },
      { t: "p", text: "A real device rarely does one thing. A greenhouse controller reads sensors, runs a fan, blinks a status LED, listens to a button and talks to a display, all on one CPU with one thread of execution. **Real-time** does not mean fast; it means **on time**: each job happens within a known deadline. The fan must react within a second, the button within 50 ms, the display can wait. This module is about writing firmware that meets those deadlines on a single processor, without an operating system. The next step, an RTOS, is module a5." },

      { t: "h", text: "Blocking and non-blocking code" },
      { t: "p", text: "A call is **blocking** if it does not return until something happens: a time passes, a byte arrives, a pin changes. While it waits, nothing else in the program runs. The usual offenders on Arduino are `delay()`, `while (!Serial.available()) {}`, `pulseIn()`, `Serial.readString()` (which waits for a timeout), and sensor libraries that wait for a conversion to finish. Consider the classic blink with a button:" },
      { t: "snippet", lang: "cpp", code: String.raw`void loop() {
  digitalWrite(13, HIGH);
  delay(1000);                 // for one second nothing else can happen
  digitalWrite(13, LOW);
  delay(1000);
  if (digitalRead(2) == LOW) startPump();   // checked once every 2 s
}`, caption: "Blocking. A button press shorter than 2 s is usually missed." },
      { t: "p", text: "A **non-blocking** call does a small piece of work and returns at once, whether or not the thing it is waiting for has happened. Instead of waiting for one second, the code asks 'has one second passed yet?', and if not, moves on. The waiting is moved out of the code and into **state**: a variable that remembers when the last toggle happened." },

      { t: "h", text: "The super-loop" },
      { t: "p", text: "The structure that results is called a **super-loop**. `loop()` runs over and over, and on each pass it gives every job a chance to check whether it has work to do. Each job must return quickly. The time for one pass through the loop is the **loop time**, and it sets the worst-case reaction time of every job: if one pass can take 5 ms, no job can react faster than 5 ms." },
      { t: "diagram", text: String.raw`
   ┌──────────────────────────────────────────┐
   │ loop()                                   │
   │   now = millis()                         │
   │   job A: is it time? if so, do a little  │
   │   job B: has input arrived? handle it    │
   │   job C: is it time? if so, do a little  │
   └────────────────────┬─────────────────────┘
                        └──── repeat, thousands of times a second`, caption: "Each job checks, acts briefly or not at all, and returns." },
      { t: "p", text: "The rule that makes it work: **no job may wait**. If a job needs to wait, it records what it is waiting for and returns; next time round it checks again. That one rule is the whole difference between firmware that does one thing and firmware that does ten." },

      { t: "h", text: "Ticks: millis() and micros()" },
      { t: "p", text: "A super-loop needs a clock. On the Arduino Uno, Timer0 overflows every 1.024 ms and its interrupt advances a counter; `millis()` returns that counter as an `unsigned long`, the milliseconds since reset. `micros()` returns microseconds with a resolution of 4 µs on a 16 MHz Uno. On the ESP32 both come from a 64-bit hardware timer, and `micros()` has 1 µs resolution. Each tick of such a counter is a **system tick**, and all software timing is built by comparing ticks." },
      { t: "p", text: "An `unsigned long` is 32 bits, so it can count to 2^32 - 1 = 4 294 967 295 and then wraps to 0. For `millis()` that happens after 4 294 967 296 ms = 49.7 days; for `micros()`, after 4294.97 s, about 71.6 minutes. Any device that stays on for longer than that, which is most real devices, must time correctly across the wrap." },

      { t: "h", text: "Rollover-safe timing" },
      { t: "p", text: "There is one correct way to write a timed check, and it is short:" },
      { t: "formula", text: String.raw`if ((unsigned long)(now - last) >= interval) { ... }`, caption: "Subtract first, then compare. Both variables must be unsigned long (uint32_t)." },
      { t: "p", text: "Unsigned subtraction in C is defined modulo 2^32: if the true result would be negative, it wraps round by adding 2^32. So `now - last` is always the number of ticks elapsed since `last`, even when `now` has wrapped past zero. **Worked example.** `last` = 4 294 967 000, and 496 ms later the counter has wrapped and `now` = 200. The difference computed by the CPU is 200 - 4 294 967 000 + 4 294 967 296 = 496. That is exactly the elapsed time, so a 500 ms interval correctly has not yet expired." },
      { t: "p", text: "Now the tempting wrong version, `if (now >= last + interval)`. With the same `last` and interval = 500, `last + interval` = 4 294 967 500, which wraps to 204. At `now` = 4 294 967 100, only 100 ms after `last` and before the wrap, the test is 4 294 967 100 ≥ 204: true. The timer fires 400 ms early, once every 49.7 days, which is exactly the kind of bug that survives testing and appears in the field." },
      { t: "note", kind: "warn", text: "Keep timestamps in `unsigned long` or `uint32_t`. Storing `millis()` in an `int` (16 bits on the AVR) wraps every 32.8 seconds, and signed overflow is undefined behaviour in C." },

      { t: "h", text: "Keeping a schedule: last += interval" },
      { t: "p", text: "Inside the check, there are two ways to restart the timer. `last = now;` measures the next interval from when the check happened to run, so any lateness accumulates: if the loop is 3 ms late each time, a 500 ms blink drifts by 3 ms per cycle. `last += interval;` measures from when the event was due, so lateness does not accumulate and a 500 ms timer fires 7200 times an hour exactly. Use `+=` for anything periodic (sampling, clocks, blinking). Use `= now` when what matters is a minimum gap since the last action, such as rate-limiting a message. If the loop could fall behind by more than a whole interval, `+=` will fire several times in a row to catch up, which is sometimes right and sometimes not; decide deliberately." },
      { t: "snippet", lang: "cpp", code: String.raw`// Two LEDs at unrelated rates plus a serial command, none blocking the others.
// Uno: LEDs on D12 and D13.
const uint8_t LED_A = 13, LED_B = 12;
const unsigned long PERIOD_A = 500;   // ms
const unsigned long PERIOD_B = 170;   // ms

unsigned long lastA = 0, lastB = 0;

void setup() {
  pinMode(LED_A, OUTPUT);
  pinMode(LED_B, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  unsigned long now = millis();

  if (now - lastA >= PERIOD_A) {        // rollover-safe: subtract, then compare
    lastA += PERIOD_A;                  // keep the schedule, do not drift
    digitalWrite(LED_A, !digitalRead(LED_A));
  }
  if (now - lastB >= PERIOD_B) {
    lastB += PERIOD_B;
    digitalWrite(LED_B, !digitalRead(LED_B));
  }
  if (Serial.available()) {             // never waits: only reads what has arrived
    char c = Serial.read();
    if (c == '?') Serial.println(now);
  }
}`, caption: "Arduino Uno: two LEDs at unrelated rates and a serial command, all responsive. Compiled for arduino:avr:uno." },

      { t: "h", text: "Software timers" },
      { t: "p", text: "Once you have more than two or three timed jobs, wrap the pattern in a small structure. A **software timer** holds its own period and last-fired time, and a function answers 'has it expired?'. A one-shot timer fires once and stops; a periodic timer reloads itself." },
      { t: "snippet", lang: "cpp", code: String.raw`struct SoftTimer {
  uint32_t period;
  uint32_t last;
  bool running;
  bool periodic;

  void start(uint32_t ms, bool repeat) { period = ms; last = millis(); running = true; periodic = repeat; }
  void stop() { running = false; }

  bool expired() {
    if (!running || (uint32_t)(millis() - last) < period) return false;
    if (periodic) last += period; else running = false;
    return true;
  }
};

SoftTimer blink, timeout;
// setup():  blink.start(500, true);  timeout.start(10000, false);
// loop():   if (blink.expired()) toggleLed();
//           if (timeout.expired()) enterSleep();`, caption: "A software timer usable on any board. Every instance costs 10 bytes of RAM and no hardware." },
      { t: "p", text: "Hardware timers, from module i5, are few (three on the Uno) but precise to a clock cycle. Software timers are unlimited but only as precise as your loop time. Use hardware timers for waveforms and precise sampling, and software timers for everything at human timescales." },

      { t: "deep", title: "Why unsigned subtraction is always right: modular arithmetic", blocks: [
        { t: "p", text: "A 32-bit unsigned value lives on a circle of 2^32 points: adding 1 to the largest value gives 0. The C standard defines unsigned arithmetic as arithmetic modulo 2^32 exactly, so for any `a` and `b`, `(a - b) mod 2^32` is the number of steps forward from `b` to `a` round the circle. If the true elapsed time is less than 2^32 ticks, this number equals it, wrap or no wrap." },
        { t: "formula", text: String.raw`elapsed = (now - last) mod 2^32
correct whenever true elapsed time < 2^32 ticks   (49.7 days for millis)

now = 200, last = 4 294 967 000:
200 - 4 294 967 000 = -4 294 966 800
-4 294 966 800 + 4 294 967 296 = 496   ✓`, caption: "The only limit: you cannot measure an interval longer than one full wrap." },
        { t: "p", text: "The comparison `now >= last + interval` fails because it compares positions on the circle as if they were on a straight line. Subtracting first turns two positions into one distance, and distances do not care where zero is. The same reasoning applies to 16-bit timer captures (the i5 input capture sketch) and 8-bit ring buffer indices: as long as the type is unsigned and the true difference fits, subtraction gives the right answer. One trap: on the AVR, subtracting two `uint8_t` or `uint16_t` values promotes them to `int` first, so cast the result back, `(uint16_t)(a - b)`, before comparing." },
      ] },
      { t: "deep", title: "Measuring loop time and jitter", blocks: [
        { t: "p", text: "A super-loop's guarantees come from its worst-case loop time, so measure it. Record `micros()` at the top of every pass, keep the largest difference seen, and print it once a second. Or toggle a spare pin at the top of the loop and watch it on an oscilloscope; the widest gap between edges is the worst case." },
        { t: "snippet", lang: "cpp", code: String.raw`void loop() {
  static uint32_t prev = 0, worst = 0, lastReport = 0;
  uint32_t t = micros();
  uint32_t dt = t - prev;
  prev = t;
  if (dt > worst) worst = dt;

  // ... the real jobs ...

  if (millis() - lastReport >= 1000) {
    lastReport += 1000;
    Serial.print("worst loop us: ");
    Serial.println(worst);   // printing itself adds time: that is part of the truth
    worst = 0;
  }
}`, caption: "Finds the slowest pass. A single blocking call shows up as a huge spike." },
        { t: "p", text: "**Jitter** is the variation in when a periodic job actually runs. A job due every 10 ms in a loop that takes between 0.1 and 3 ms runs between 0 and 3 ms late, so its jitter is up to 3 ms. For a blinking LED that is invisible. For sampling a signal for a digital filter it is a real error, which is why precise sampling uses a hardware timer to trigger the ADC (module i5) or a timer interrupt (next lessons) rather than the super-loop." },
      ] },
    ],
    mistakes: [
      "**Writing now >= last + interval.** It fails when last + interval wraps. Subtract, then compare.",
      "**Storing millis() in an int or long.** Use unsigned long or uint32_t; int wraps in 32.8 s on the AVR.",
      "**Using last = now for periodic jobs.** Lateness accumulates; use last += interval.",
      "**Hiding a blocking call in a library.** Some sensor reads wait hundreds of milliseconds. Measure the loop time to find them.",
      "**Assuming the loop is fast because it usually is.** Deadlines depend on the worst pass, not the average.",
    ],
    practice: {
      kind: "bench",
      task: "Convert a blocking program into a non-blocking one and measure the difference.",
      steps: [
        "Write a blocking sketch for an Uno: blink D13 at 1 Hz with delay(), and turn on an LED on D12 while a button on D2 (to GND, INPUT_PULLUP) is held. Note how badly the button responds.",
        "Rewrite it with millis() and the subtract-then-compare pattern. Confirm the button now responds instantly.",
        "Add the loop-time measurement from the Go deeper section and record the worst loop time. Add a `delay(20)` to the loop and see it appear in the measurement.",
        "Test rollover without waiting 49 days: replace millis() with your own function returning `millis() + 0xFFFFF000UL`, which wraps about 4 seconds after reset. Check that both LEDs keep perfect time through the wrap. Then try the wrong comparison and watch it misbehave.",
      ],
    },
    quiz: [
      {
        q: "last = 4 294 967 200 and now = 104 (the counter has wrapped). What does (unsigned long)(now - last) evaluate to?",
        options: ["200", "-4 294 967 096", "104", "4 294 967 096"],
        answer: 0,
        why: "Unsigned subtraction wraps modulo 2^32: 104 - 4 294 967 200 + 4 294 967 296 = 200, the true elapsed time.",
      },
      {
        q: "How long after reset does millis() on an Arduino roll over?",
        options: ["71.6 minutes", "32.8 seconds", "49.7 days", "It never rolls over"],
        answer: 2,
        why: "It is a 32-bit millisecond counter: 2^32 ms ≈ 4.29 × 10^9 ms ≈ 49.7 days. 71.6 minutes is micros().",
      },
      {
        q: "A periodic 100 ms job uses last = now inside its check, and the loop is typically 2 ms late. What happens over time?",
        options: [
          "Nothing: the timing stays exact",
          "Each period becomes about 102 ms, so the job drifts later and later",
          "The job fires twice",
          "The job stops at rollover",
        ],
        answer: 1,
        why: "Restarting from the time of the check adds the lateness to every period. last += interval measures from the due time instead.",
      },
      {
        q: "Which of these calls is non-blocking?",
        options: [
          "delay(10)",
          "while (!Serial.available()) {}",
          "pulseIn(7, HIGH)",
          "if (Serial.available()) c = Serial.read();",
        ],
        answer: 3,
        why: "It reads only if a byte has already arrived and returns at once otherwise. The others wait.",
      },
      {
        q: "A super-loop's slowest pass takes 8 ms. What is the best guaranteed reaction time for a button handled in that loop?",
        options: ["8 ms at worst, plus any debounce time", "1 ms, because millis() ticks every millisecond", "0 ms", "It depends only on the button"],
        answer: 0,
        why: "A job is only checked once per pass, so in the worst case an event waits a whole slow pass before it is noticed.",
      },
    ],
  },

  "i6-state-machines": {
    id: "i6-state-machines",
    outcomes: [
      "Describe a behaviour as states, events, transitions, guards and actions",
      "Implement a finite state machine with a switch statement and entry actions",
      "Implement a table-driven state machine and say when it is the better choice",
      "Read and draw a state chart, including hierarchical states",
    ],
    blocks: [
      { t: "h", text: "Why state machines" },
      { t: "p", text: "Non-blocking code has a consequence: a job that used to wait in one place now has to remember where it was. A pump controller that used to say 'open valve, wait 2 s, start pump, wait until the tank is full, stop pump, wait 5 s, close valve' must now remember which of those steps it is in between loop passes. If you do that with a scattering of boolean flags (`valveOpen`, `pumping`, `waitingToClose`) you soon get combinations that should be impossible and are not. A **finite state machine (FSM)** is the disciplined way to hold that memory: one variable says which step you are in, and the rules for leaving each step are written down in one place." },

      { t: "h", text: "The vocabulary" },
      { t: "list", items: [
        "A **state** is a situation the system can be in for some time, waiting for something: IDLE, FILLING, DRAINING.",
        "An **event** is something that happens: a button press, a timeout, a sensor crossing a level, a message arriving.",
        "A **transition** is a move from one state to another, caused by an event. 'In FILLING, on TANK_FULL, go to SETTLING.'",
        "A **guard** is a condition that must also be true for the transition to happen: 'on BUTTON, if the door is closed'.",
        "An **action** is what the system does: on a transition, or on **entry** to a state, or on **exit** from it.",
      ] },
      { t: "p", text: "The machine is **finite** because it has a fixed list of states, and at any instant it is in exactly one of them. That single fact removes the impossible combinations: the pump cannot be both FILLING and DRAINING, because the state variable has only one value." },

      { t: "h", text: "Drawing it first" },
      { t: "p", text: "Always draw the machine before writing it. Circles (or boxes) for states, arrows for transitions labelled 'event [guard] / action'. Here is a pump controller:" },
      { t: "diagram", text: String.raw`
              START [tank not full] / open valve
   ┌──────┐ ─────────────────────────────────► ┌─────────┐
   │ IDLE │                                    │ PRIMING │
   └──────┘ ◄──────────┐                       └────┬────┘
      ▲                │ after 5 s /                │ after 2 s / start pump
      │                │ close valve                ▼
      │           ┌────┴─────┐  TANK_FULL /   ┌─────────┐
      │           │ SETTLING │ ◄───────────── │ FILLING │
      │           └──────────┘   stop pump    └────┬────┘
      │                                            │ after 60 s / stop pump, close valve
      │            ┌───────┐                       │
      └─ RESET ─── │ FAULT │ ◄─────────────────────┘
                   └───────┘`, caption: "State diagram. 'after 60 s' in FILLING is a safety timeout: a tank that never fills means a leak or a dry well." },
      { t: "p", text: "The drawing exposes questions the code would hide. What happens if STOP is pressed while PRIMING? Not on the diagram, so the answer is currently 'nothing', and you should decide whether that is right. Every state should be checked against every event, even if most combinations are 'ignore'." },

      { t: "h", text: "The switch-based implementation" },
      { t: "p", text: "The most common implementation keeps the state in an `enum` and runs a `switch` on it in every loop pass. Each case checks the events relevant to its state and, if a transition happens, calls a function that changes the state, records the entry time, and performs the entry action." },
      { t: "snippet", lang: "cpp", code: String.raw`enum State { IDLE, PRIMING, FILLING, SETTLING, FAULT };
State state = IDLE;
uint32_t enteredAt = 0;

void enter(State s) {            // one place for every transition
  state = s;
  enteredAt = millis();
  switch (s) {                   // entry actions
    case IDLE:     valve(false); pump(false); break;
    case PRIMING:  valve(true);               break;
    case FILLING:  pump(true);                break;
    case SETTLING: pump(false);               break;
    case FAULT:    pump(false); valve(false); alarm(true); break;
  }
}

void runPump() {                 // call once per loop pass; never waits
  uint32_t inState = millis() - enteredAt;
  switch (state) {
    case IDLE:
      if (startPressed() && !tankFull()) enter(PRIMING);
      break;
    case PRIMING:
      if (inState >= 2000) enter(FILLING);
      break;
    case FILLING:
      if (tankFull())             enter(SETTLING);
      else if (inState >= 60000)  enter(FAULT);
      break;
    case SETTLING:
      if (inState >= 5000) enter(IDLE);
      break;
    case FAULT:
      if (resetPressed()) { alarm(false); enter(IDLE); }
      break;
  }
}`, caption: "Switch-based FSM. valve(), pump(), alarm() and the input functions are yours to supply for the hardware." },
      { t: "p", text: "Three habits make this robust. First, **every transition goes through enter()**, so entry actions and the entry timestamp can never be forgotten. Second, **time in state** (`millis() - enteredAt`) replaces separate timer variables: each state measures its own timeouts. Third, the **outputs are set by entry actions, not scattered through the code**, so you can read off what the hardware is doing in each state. A variant called a **Moore machine** derives all outputs from the state alone, as here; a **Mealy machine** attaches outputs to transitions. Moore machines are easier to check; Mealy machines can need fewer states." },

      { t: "h", text: "The table-driven implementation" },
      { t: "p", text: "When many states respond to many events, the switch grows into nested ifs. The alternative is to write the machine as data: a two-dimensional table indexed by [current state][event], where each cell holds the next state and an action to run. The engine that runs it is three lines and never changes; to change behaviour you edit the table." },
      { t: "snippet", lang: "cpp", code: String.raw`// Table-driven state machine: a door lock with a keypad-style event source.
// Events arrive over Serial: 'c' = correct code, 'w' = wrong code, 'o' = door opened, 'x' = door closed.
enum State : uint8_t { LOCKED, UNLOCKED, OPEN, ALARM, N_STATES };
enum Event : uint8_t { EV_CODE_OK, EV_CODE_BAD, EV_OPENED, EV_CLOSED, EV_TIMEOUT, N_EVENTS, EV_NONE };

struct Cell { State next; void (*action)(); };

void lockBolt()   { Serial.println("bolt locked"); }
void unlockBolt() { Serial.println("bolt released"); }
void soundAlarm() { Serial.println("ALARM"); }
void nothing()    { }

// rows: current state, columns: event
const Cell table[N_STATES][N_EVENTS] = {
  //            CODE_OK              CODE_BAD             OPENED              CLOSED              TIMEOUT
  /*LOCKED*/  {{UNLOCKED,unlockBolt},{LOCKED,nothing},    {ALARM,soundAlarm}, {LOCKED,nothing},   {LOCKED,nothing}},
  /*UNLOCKED*/{{UNLOCKED,nothing},   {UNLOCKED,nothing},  {OPEN,nothing},     {UNLOCKED,nothing}, {LOCKED,lockBolt}},
  /*OPEN*/    {{OPEN,nothing},       {OPEN,nothing},      {OPEN,nothing},     {LOCKED,lockBolt},  {OPEN,nothing}},
  /*ALARM*/   {{LOCKED,lockBolt},    {ALARM,nothing},     {ALARM,nothing},    {ALARM,nothing},    {ALARM,nothing}},
};

State state = LOCKED;
unsigned long enteredAt = 0;
const unsigned long UNLOCK_WINDOW = 5000;

Event readEvent() {
  if (state == UNLOCKED && millis() - enteredAt >= UNLOCK_WINDOW) return EV_TIMEOUT;
  if (!Serial.available()) return EV_NONE;
  switch (Serial.read()) {
    case 'c': return EV_CODE_OK;
    case 'w': return EV_CODE_BAD;
    case 'o': return EV_OPENED;
    case 'x': return EV_CLOSED;
    default:  return EV_NONE;
  }
}

void setup() { Serial.begin(115200); }

void loop() {
  Event e = readEvent();
  if (e == EV_NONE) return;
  const Cell &cell = table[state][e];
  cell.action();
  if (cell.next != state) {
    state = cell.next;
    enteredAt = millis();
    Serial.print("state ");
    Serial.println(state);
  }
}`, caption: "Arduino Uno: a door lock as a table-driven FSM. Type c, w, o or x into the Serial Monitor to send events. Compiled for arduino:avr:uno." },
      { t: "p", text: "Read the table row by row and it is the state diagram: in LOCKED, a correct code releases the bolt and goes to UNLOCKED; opening the door while LOCKED sounds the alarm. Every cell must be filled, so the table forces you to decide every state-event pair. The cost is flexibility: guards and per-state timing must be built into the event source (here `readEvent()` turns the 5 s unlock window into an EV_TIMEOUT), and a table with 20 states and 15 events has 300 cells, most of them 'stay here, do nothing'." },
      { t: "table", head: ["", "Switch-based", "Table-driven"], rows: [
        ["Best for", "few events per state, guards and timing", "many events, regular structure"],
        ["Changing behaviour", "edit code", "edit data"],
        ["Completeness", "easy to forget a case", "every cell must be written"],
        ["Memory (AVR)", "code in flash", "table in SRAM unless placed in PROGMEM"],
        ["Readability", "reads like a story", "reads like a specification"],
      ], caption: "Choosing an implementation. Both are equally correct when written carefully." },

      { t: "h", text: "State charts: when flat machines get too big" },
      { t: "p", text: "Real systems have states inside states. A washing machine has RUNNING (with substates FILL, WASH, RINSE, SPIN) and PAUSED, and from every substate of RUNNING, opening the lid must pause it. In a flat FSM that is four separate arrows labelled LID_OPEN; in a **state chart** (David Harel's extension of state machines, now part of UML) it is one arrow from the RUNNING superstate. State charts add **hierarchy** (substates inherit the transitions of their parent), **entry and exit actions** on every level, and **history** (on resume, return to the substate you left). You can implement a two-level chart in C with two state variables, one per level, and handle the parent's events before the child's switch." },
      { t: "note", kind: "tip", text: "Add a `default:` case that goes to a safe state. If memory corruption or a bug ever puts an impossible value in the state variable, the machine recovers into something harmless instead of doing nothing." },

      { t: "deep", title: "Implementing a two-level state chart", blocks: [
        { t: "p", text: "Take the washing machine. The top level has IDLE, RUNNING and PAUSED. RUNNING has the substates FILL, WASH, RINSE and SPIN. The rule of hierarchy is: offer each event to the innermost active state first; if it does not handle it, offer it to the parent. LID_OPEN is handled by RUNNING itself for all its substates." },
        { t: "snippet", lang: "cpp", code: String.raw`enum Top { IDLE, RUNNING, PAUSED };
enum Sub { FILL, WASH, RINSE, SPIN };
Top top = IDLE;
Sub sub = FILL;           // remembered while PAUSED: this is 'history'

void handle(Event e) {
  if (top == RUNNING) {
    if (e == LID_OPEN) { motorOff(); top = PAUSED; return; }   // parent transition
    switch (sub) {                                             // child transitions
      case FILL:  if (e == LEVEL_OK)  { sub = WASH;  startTimer(600); } break;
      case WASH:  if (e == TIMEOUT)   { sub = RINSE; startTimer(300); } break;
      case RINSE: if (e == TIMEOUT)   { sub = SPIN;  startTimer(180); } break;
      case SPIN:  if (e == TIMEOUT)   { top = IDLE; motorOff(); }       break;
    }
  } else if (top == PAUSED) {
    if (e == LID_CLOSED) { top = RUNNING; resumeSubstate(sub); }       // history
  } else if (top == IDLE) {
    if (e == START) { top = RUNNING; sub = FILL; openInlet(); }
  }
}`, caption: "Sketch of the structure only: Event, the timer and the hardware functions are placeholders." },
        { t: "p", text: "Beyond two levels, hand-written nesting gets error-prone, and frameworks help: Miro Samek's QP framework and its book 'Practical UML Statecharts in C/C++' are the standard reference for embedded state charts, and the same ideas reappear in ROS 2 lifecycle nodes and in PLC programming with sequential function charts." },
      ] },
      { t: "deep", title: "Testing a state machine on a PC", blocks: [
        { t: "p", text: "A well-written state machine has no hardware inside it: inputs arrive as events, outputs leave through a few functions, and time comes from a single `now()` call. That makes it easy to test on a computer. Compile the same .cpp file with g++, replace `now()` with a variable you advance, replace the output functions with ones that record calls, and feed in event sequences." },
        { t: "list", items: [
          "Test every transition on the diagram at least once.",
          "Test the boring cells too: each state should ignore events it does not handle, and nothing should crash.",
          "Test timeouts by advancing your fake clock, including across a 32-bit wrap.",
          "Test sequences that are 'impossible' in normal use, such as START twice, or RESET while FILLING.",
        ] },
        { t: "p", text: "This is how safety-relevant firmware is developed professionally: the logic is verified off-target before it ever drives a relay, and the hardware layer underneath is kept as thin as possible." },
      ] },
    ],
    mistakes: [
      "**Using several boolean flags instead of one state variable.** Flags allow impossible combinations; an enum does not.",
      "**Changing state without going through one enter() function.** Entry actions and timestamps get forgotten on some paths.",
      "**Blocking inside a state.** A `delay()` in a case freezes every other job. Use time-in-state instead.",
      "**Not drawing the diagram.** Missing transitions (what if STOP is pressed now?) only show up on paper or in the field.",
      "**Leaving out a default case.** A corrupted state variable then does nothing forever instead of failing safe.",
    ],
    practice: {
      kind: "bench",
      task: "Design, draw and implement a state machine for a timed hand dryer or similar device.",
      steps: [
        "Specify the behaviour: an IR or button 'hands present' input, a fan and heater (LEDs on an Uno will do), a maximum run time of 30 s, a 1 s run-on after hands leave, and a 3 s cool-down during which the heater is off but the fan runs.",
        "Draw the state diagram with every transition labelled event [guard] / action. Check every state against every event.",
        "Implement it as a switch-based FSM with an enter() function and time-in-state, with no delay() anywhere.",
        "Re-implement the same machine as a table. Compare the two versions: which was easier to get right, and which would be easier for someone else to change?",
      ],
    },
    quiz: [
      {
        q: "What is the main advantage of a single state variable over several boolean flags?",
        options: [
          "It uses less flash",
          "The system is always in exactly one state, so impossible combinations cannot occur",
          "It runs faster",
          "It allows the code to use delay()",
        ],
        answer: 1,
        why: "With flags, any combination can arise, including meaningless ones. One enum variable can only hold one state at a time.",
      },
      {
        q: "In the pump controller, how does the FILLING state detect its 60 s safety timeout without a separate timer variable?",
        options: [
          "It counts loop passes",
          "It uses delay(60000)",
          "It compares millis() - enteredAt, the time in the current state, with 60 000",
          "A hardware timer interrupt switches the state",
        ],
        answer: 2,
        why: "enter() records the entry time, so every state can measure how long it has been active.",
      },
      {
        q: "A table-driven FSM has 6 states and 5 events. How many cells must the table contain?",
        options: ["11", "30", "6", "5"],
        answer: 1,
        why: "One cell per state-event pair: 6 × 5 = 30. Every cell must say what happens, even if it is 'stay and do nothing'.",
      },
      {
        q: "In a state chart, why put the LID_OPEN transition on the RUNNING superstate instead of on each substate?",
        options: [
          "Substates cannot have transitions",
          "Substates inherit the parent's transitions, so one arrow covers FILL, WASH, RINSE and SPIN",
          "It makes the machine run faster",
          "Because LID_OPEN is not an event",
        ],
        answer: 1,
        why: "Hierarchy lets substates share transitions defined once on the parent, which removes duplicate arrows and duplicate code.",
      },
      {
        q: "What does a default case that enters a safe state protect against?",
        options: [
          "Compiler warnings only",
          "Button bounce",
          "Rollover of millis()",
          "An impossible value in the state variable, from a bug or memory corruption",
        ],
        answer: 3,
        why: "If the state variable ever holds a value no case handles, the default case recovers into a known safe state.",
      },
    ],
  },

  "i6-interrupts-and-shared-data": {
    id: "i6-interrupts-and-shared-data",
    outcomes: [
      "Explain what happens in hardware from an interrupt request to the return from the ISR",
      "Estimate interrupt latency and state the rules for writing an ISR",
      "Use attachInterrupt, ISR(INT0_vect) and IRAM_ATTR correctly, and know when each applies",
      "Share data between an ISR and the main program safely using volatile and atomic access",
    ],
    blocks: [
      { t: "h", text: "Why interrupts" },
      { t: "p", text: "A super-loop notices an event only when it next checks. If the loop takes 5 ms, a 2 µs pulse can come and go unseen, and even a slow event is noticed up to 5 ms late. An **interrupt** lets the hardware demand attention: when the event happens, the CPU stops what it is doing, runs a short function called an **interrupt service routine (ISR)**, and then carries on exactly where it left off. Interrupts are how a single CPU reacts within microseconds to timers, pins, received bytes and finished conversions." },

      { t: "h", text: "What the hardware does" },
      { t: "p", text: "Every interrupt source has an **enable bit** (such as INT0 in EIMSK, or OCIE1A in TIMSK1) and a **flag bit** (INTF0 in EIFR, OCF1A in TIFR1). When the event happens, the flag is set. If the source is enabled and the global interrupt enable bit **I** in the status register SREG is set, the CPU takes the interrupt:" },
      { t: "list", ordered: true, items: [
        "It finishes the current instruction.",
        "It pushes the program counter onto the stack and clears the I bit, so no other interrupt can break in.",
        "It jumps to the interrupt's entry in the **vector table**, a list of jump instructions at the start of flash, one per source. The entry jumps to your ISR.",
        "Your ISR's **prologue** (generated by the compiler) saves SREG and every register the ISR uses; the body runs; the **epilogue** restores them.",
        "`RETI` pops the program counter and sets I again. The main program continues, unaware anything happened, except for whatever the ISR changed.",
      ] },
      { t: "p", text: "The flag is cleared automatically when the ISR runs (for most sources). If an interrupt event happens while interrupts are disabled, its flag stays set and the ISR runs as soon as they are re-enabled: the event is delayed, not lost, unless it happens twice, because a flag can only remember one occurrence." },

      { t: "h", text: "Vectors and priorities on the ATmega328P" },
      { t: "p", text: "The 328P has 26 vectors. Position in the table is priority: the lower the address, the higher the priority. Reset is first, then INT0, INT1, the pin-change interrupts PCINT0 to PCINT2, the watchdog, then the timers, SPI, USART, ADC and so on. Priority only decides which pending interrupt is served first when several flags are set at once; it does not let a high-priority interrupt break into a running ISR, because I is cleared during every ISR. AVR interrupts do not nest unless you deliberately re-enable them, which is rarely wise." },
      { t: "table", head: ["ISR name (avr-libc)", "Source", "Uno pin"], rows: [
        ["INT0_vect", "external interrupt 0", "D2"],
        ["INT1_vect", "external interrupt 1", "D3"],
        ["PCINT0_vect, PCINT1_vect, PCINT2_vect", "pin change on port B, C, D", "any pin, grouped by port"],
        ["TIMER1_COMPA_vect", "Timer1 compare match A", "none"],
        ["TIMER1_CAPT_vect", "Timer1 input capture", "D8"],
        ["TIMER0_OVF_vect", "Timer0 overflow (used by millis)", "none"],
        ["USART_RX_vect", "byte received", "D0"],
        ["ADC_vect", "conversion complete", "none"],
      ], caption: "Some ATmega328P vectors, with the names avr-libc uses in ISR()." },
      { t: "p", text: "The ESP32 works differently. Each core has an interrupt controller with priority levels 1 to 7, and an **interrupt matrix** routes any of about 70 peripheral sources to any core. Higher-level interrupts can pre-empt lower ones. Every GPIO can generate an interrupt, and the Arduino core shares one GPIO interrupt among all pins and dispatches to your function." },

      { t: "h", text: "Latency: how long before your ISR runs" },
      { t: "p", text: "**Interrupt latency** is the time from the event to the first useful instruction of your ISR. On the 328P the datasheet gives at least four clock cycles to respond (finish the instruction, push the PC, clear I) and three for the jump in the vector table. Then the compiler's prologue pushes registers: a small ISR might save 5 registers, a large one or one that calls a function saves all the call-clobbered registers, around 15 pushes at two cycles each." },
      { t: "formula", text: String.raw`best case:     4 (response) + 3 (vector jump) + ~10 (small prologue) ≈ 17 cycles ≈ 1.1 µs at 16 MHz
plus:          up to the longest instruction in progress (a few cycles)
plus:          the full length of any ISR already running
plus:          any time the main code spends with interrupts disabled`, caption: "Latency budget on a 16 MHz Uno. The last two terms are usually the largest, and you control them." },
      { t: "p", text: "The lesson in the formula: your latency depends on everybody else's ISRs. If one ISR takes 200 µs, every other interrupt can be delayed by 200 µs. On the Uno, the Timer0 ISR behind millis() runs every 1.024 ms and takes a few microseconds, and Serial's receive ISR runs for every byte. That is why the rules below exist." },

      { t: "h", text: "The rules for writing an ISR" },
      { t: "list", items: [
        "**Keep it short.** Record what happened (set a flag, store a timestamp, put a byte in a buffer) and return. Do the processing in the main loop. A few microseconds is a good target on an Uno.",
        "**Never wait.** No `delay()`, no polling loops, no waiting for a flag that another interrupt sets: other interrupts are off, so it will never come.",
        "**Do not print.** `Serial.print()` can wait for buffer space, and that buffer is emptied by an interrupt that cannot run while you are in an ISR. The AVR core detects this and sends by polling instead, so the ISR stalls for about 87 µs per character at 115200 baud and every other interrupt waits; on other cores the same call can hang outright.",
        "**millis() does not advance inside an ISR** (its interrupt cannot run), though reading it is fine. `micros()` works for short durations.",
        "**Declare shared variables volatile** and protect multi-byte ones, as described below.",
        "**Do not call non-reentrant functions** that the main program might be in the middle of, such as `malloc()` or most library code.",
      ] },

      { t: "h", text: "attachInterrupt() versus ISR(INT0_vect)" },
      { t: "p", text: "Arduino offers `attachInterrupt(digitalPinToInterrupt(2), handler, FALLING)`. On the Uno it only works on D2 and D3 (INT0 and INT1). The core owns the real `ISR(INT0_vect)` and from it calls your handler through a function pointer, which costs extra cycles: the call forces the prologue to save every call-clobbered register, so latency is a few microseconds rather than about one. In return it is portable: the same line works on an ESP32, where any GPIO can interrupt." },
      { t: "p", text: "Writing `ISR(INT0_vect) { ... }` yourself defines the vector directly, with the smallest possible prologue. You then configure the hardware yourself: `EICRA` selects the edge (ISC01:00 = 10 for falling, 11 for rising, 01 for any change, 00 for low level), `EIMSK` bit INT0 enables it, and writing 1 to INTF0 in `EIFR` clears a stale flag first. You cannot use both for the same interrupt: if your sketch defines `ISR(INT0_vect)` and also calls `attachInterrupt(0, ...)`, the linker reports `multiple definition of '__vector_1'`." },
      { t: "snippet", lang: "cpp", code: String.raw`// Count falling edges on D2 with ISR(INT0_vect) and read the count safely.
#include <util/atomic.h>

volatile uint16_t edges = 0;       // 16-bit: two bytes, so reads must be atomic

ISR(INT0_vect) {
  edges++;
}

void setup() {
  Serial.begin(115200);
  DDRD &= ~(1 << DDD2);            // D2 input
  PORTD |= (1 << PORTD2);          // pull-up
  EICRA = (1 << ISC01);            // ISC01:0 = 10, falling edge
  EIFR = (1 << INTF0);             // clear a stale flag
  EIMSK = (1 << INT0);             // enable INT0
}

void loop() {
  uint16_t copy;
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
    copy = edges;                  // both bytes read with interrupts off
  }
  Serial.println(copy);
  delay(500);
}`, caption: "Arduino Uno: counting falling edges on D2 with a register-level INT0 ISR. Compiled for arduino:avr:uno." },

      { t: "h", text: "IRAM_ATTR on the ESP32" },
      { t: "p", text: "The ESP32 runs code from external flash through a cache. While the flash is being written (saving Wi-Fi credentials, writing NVS preferences, an OTA update), the cache is disabled. If an interrupt fires then and its ISR is in flash, the CPU cannot fetch it and the chip crashes with a 'Cache disabled but cached memory region accessed' error. Marking the ISR `IRAM_ATTR` places it in internal instruction RAM, which is always available. Any function the ISR calls must also be in IRAM, and constant data it reads should be in RAM (`DRAM_ATTR`), not flash." },

      { t: "h", text: "Shared data, part 1: volatile" },
      { t: "p", text: "Look at this loop: `while (!ready) { }` where an ISR sets `ready = true`. An optimising compiler sees that nothing inside the loop changes `ready`, loads it into a register once, and loops on the register forever. The ISR does change the variable in memory, but the loop never looks again. Declaring it `volatile bool ready;` tells the compiler that the variable can change at any moment outside the normal flow of the program, so every read in the source must be a real read from memory, and every write a real write." },
      { t: "p", text: "`volatile` is necessary but not sufficient. It guarantees that accesses happen; it does not guarantee that an access happens in one piece." },

      { t: "h", text: "Shared data, part 2: atomicity" },
      { t: "p", text: "The AVR is an 8-bit CPU. A `uint16_t` is read with two instructions, one byte at a time, and an interrupt can occur between them. **Worked example.** `volatile uint16_t edges` holds 255 (0x00FF). The main program reads the low byte: 0xFF. Before it reads the high byte, the ISR runs and increments the count to 256 (0x0100). The main program now reads the high byte: 0x01. It has assembled 0x01FF = 511, a value the counter never held. This is a **torn read**, and it happens only when the interrupt lands in a window of one or two instructions, so it shows up rarely and randomly." },
      { t: "p", text: "The same problem hits writes, and worse, **read-modify-write** operations: `count++` in the main program is load, add, store; if the ISR also increments `count` between the load and the store, one increment is lost. The cure is a **critical section**: a short stretch of code during which interrupts cannot run. On the AVR, avr-libc provides `ATOMIC_BLOCK(ATOMIC_RESTORESTATE)` in `<util/atomic.h>`. It saves SREG, disables interrupts, runs the block, and restores SREG on every way out of the block, so it is safe even if interrupts were already off. Copy the shared value into a local variable inside the block and work with the copy afterwards, so interrupts are off for as short a time as possible." },
      { t: "table", head: ["Shared variable type", "Single read or write on AVR", "Single read or write on ESP32", "Read-modify-write (x++)"], rows: [
        ["uint8_t, bool", "atomic", "atomic", "not atomic"],
        ["uint16_t", "not atomic: 2 instructions", "atomic", "not atomic"],
        ["uint32_t, float", "not atomic: 4 instructions", "atomic if aligned", "not atomic"],
        ["struct, array, several variables", "not atomic", "not atomic", "not atomic"],
      ], caption: "When you need a critical section. When unsure, use one: it costs a few cycles." },

      { t: "h", text: "Critical sections on the ESP32" },
      { t: "p", text: "The ESP32 has two cores. Disabling interrupts on one core (`noInterrupts()`) does nothing to code running on the other, so it is not a critical section. ESP-IDF provides spinlocks for this: declare a `portMUX_TYPE` initialised with `portMUX_INITIALIZER_UNLOCKED`, and wrap shared accesses in `portENTER_CRITICAL(&mux)` and `portEXIT_CRITICAL(&mux)` in tasks, or the `_ISR` variants inside an ISR. Entering the critical section disables interrupts on this core and takes the lock, so the other core waits at its own `portENTER_CRITICAL` until you leave. Keep these sections as short as on the AVR: a few lines, no function calls that might block." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.x: count edges on GPIO 4 and share the count safely.
const int PIN = 4;
volatile uint32_t edges = 0;
volatile uint32_t lastMicros = 0;
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR onEdge() {          // placed in internal RAM: runs even while flash is busy
  portENTER_CRITICAL_ISR(&mux);
  edges++;
  lastMicros = micros();
  portEXIT_CRITICAL_ISR(&mux);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN), onEdge, FALLING);
}

void loop() {
  uint32_t n, t;
  portENTER_CRITICAL(&mux);        // the other core, or the ISR, cannot change them now
  n = edges;
  t = lastMicros;
  portEXIT_CRITICAL(&mux);
  Serial.printf("%lu edges, last at %lu us\n", (unsigned long)n, (unsigned long)t);
  delay(500);
}`, caption: "ESP32 DevKit, Arduino-ESP32 3.x: IRAM_ATTR ISR on GPIO 4 with a portMUX critical section. Compiled for esp32:esp32:esp32." },

      { t: "deep", title: "Inside an ISR: reading the prologue", blocks: [
        { t: "p", text: "Compile the INT0 example and disassemble it (`avr-objdump -d` on the .elf from the build folder). The ISR for `edges++` on a `uint16_t` compiles to something like this:" },
        { t: "snippet", lang: "text", code: String.raw`__vector_1:
  push r1            ; save the zero register
  push r0            ; save the temporary register
  in   r0, 0x3f      ; read SREG
  push r0            ; save it
  clr  r1
  push r24
  push r25
  lds  r24, edges    ; load low byte
  lds  r25, edges+1  ; load high byte
  adiw r24, 1        ; add 1 to the pair
  sts  edges+1, r25  ; store high byte
  sts  edges, r24    ; store low byte
  pop  r25
  pop  r24
  pop  r0
  out  0x3f, r0      ; restore SREG
  pop  r0
  pop  r1
  reti`, caption: "Typical avr-gcc output; register choice can differ between compiler versions." },
        { t: "p", text: "Count it: 19 instructions. With 2 cycles per push, pop, lds and sts, 4 for RETI and 7 for the response and vector jump, that is about 44 cycles, 2.75 µs at 16 MHz, of which only the 10 cycles of load, add and store are your code. Now replace the body with a call to a function in another file, or use attachInterrupt: the compiler must assume the callee uses every call-clobbered register (r18 to r27, r30, r31) and pushes them all, roughly doubling the cost. That is the measurable difference between `ISR(INT0_vect)` and `attachInterrupt()`." },
        { t: "p", text: "Two attributes change the prologue. `ISR(vector, ISR_NOBLOCK)` re-enables interrupts at the start of the ISR, allowing nesting, at the risk of stack overflow and re-entrancy bugs. `ISR(vector, ISR_NAKED)` generates no prologue at all: you must save everything yourself in assembly. Both are specialist tools." },
      ] },
      { t: "deep", title: "Memory barriers, volatile and why the compiler can still surprise you", blocks: [
        { t: "p", text: "`volatile` orders accesses to volatile variables relative to each other, but the compiler may still move ordinary, non-volatile accesses across them. If an ISR fills a non-volatile buffer and then sets a volatile `ready` flag, the main code may in principle read the buffer before it sees the flag. ATOMIC_BLOCK includes a compiler **memory barrier**, which forbids such reordering across its boundaries; avr-libc's `cli()` and `sei()` are also barriers. That is one more reason to access shared data inside an ATOMIC_BLOCK rather than relying on volatile alone." },
        { t: "p", text: "On multi-core and cached processors the hardware can reorder memory accesses too, and different cores can briefly see different values. The FreeRTOS critical-section macros on the ESP32 include the hardware barriers needed to make the two cores agree. For lock-free communication between tasks or cores, C11 `<stdatomic.h>` and C++ `std::atomic` provide portable atomic operations with defined memory ordering; on the ESP32 they compile to the Xtensa compare-and-swap instruction. Module a5 returns to this with RTOS queues, which wrap all of it for you." },
      ] },
    ],
    mistakes: [
      "**Forgetting volatile.** A loop waiting for a flag set by an ISR can be optimised into an infinite loop.",
      "**Believing volatile makes access atomic.** A 16-bit or 32-bit read on the AVR can still be torn; use ATOMIC_BLOCK.",
      "**Printing or delaying in an ISR.** Serial.print stalls the ISR for the whole transmission (or hangs, on some cores), and delay() never returns.",
      "**Using noInterrupts() as a critical section on the ESP32.** It only affects the current core; use portENTER_CRITICAL with a portMUX.",
      "**Leaving out IRAM_ATTR on an ESP32 ISR.** It works until the first flash write, then crashes.",
      "**Defining ISR(INT0_vect) and calling attachInterrupt on the same pin.** The linker reports multiple definition of __vector_1.",
    ],
    practice: {
      kind: "bench",
      task: "Make a torn read happen, then fix it.",
      steps: [
        "On an Uno, configure Timer1 in CTC mode to interrupt at 10 kHz (prescaler 8, OCR1A = 199) and increment a `volatile uint16_t counter` in TIMER1_COMPA_vect.",
        "In loop(), read counter twice in a row without protection into a and b. If b < a and the counter has not wrapped (a is not near 65 535), you have caught a torn read; count how many you catch in 10 seconds and print the total.",
        "Wrap the reads in ATOMIC_BLOCK(ATOMIC_RESTORESTATE) and run it again. The count of torn reads should be 0.",
        "Measure interrupt latency: in an INT0 ISR, set D8 high as the first statement. Drive D2 from a function generator or from another Uno's pin, and measure the delay from the D2 edge to the D8 edge on an oscilloscope. Compare ISR(INT0_vect) with attachInterrupt().",
      ],
    },
    quiz: [
      {
        q: "An interrupt occurs while interrupts are globally disabled. What happens?",
        options: [
          "It is lost",
          "The CPU resets",
          "Its flag stays set and the ISR runs as soon as interrupts are re-enabled",
          "It runs immediately anyway",
        ],
        answer: 2,
        why: "The flag remembers one pending occurrence. The ISR runs when I is set again. Only a second occurrence before then is lost.",
      },
      {
        q: "Why can a loop like while (!ready) {} hang forever even though an ISR sets ready = true?",
        options: [
          "ISRs cannot write global variables",
          "Without volatile, the compiler may read ready once into a register and never re-read memory",
          "The ISR runs on a different core",
          "bool variables cannot be shared",
        ],
        answer: 1,
        why: "volatile forces a real memory read each time. Without it the optimiser may hoist the read out of the loop.",
      },
      {
        q: "A volatile uint16_t holds 0x00FF when the main code starts reading it on an Uno, and an ISR increments it between the two byte reads. What value can the main code see?",
        options: ["0x00FF", "0x0100", "0x0000", "0x01FF"],
        answer: 3,
        why: "It read the old low byte 0xFF, then the new high byte 0x01, giving 0x01FF = 511: a torn read.",
      },
      {
        q: "Why does an ESP32 ISR need IRAM_ATTR?",
        options: [
          "So it runs on both cores",
          "So it can be fetched while the flash cache is disabled during a flash write",
          "To make it 5 V tolerant",
          "To give it the highest priority",
        ],
        answer: 1,
        why: "Code in flash cannot be fetched while the cache is off. IRAM_ATTR puts the ISR in internal RAM, which is always reachable.",
      },
      {
        q: "On a 16 MHz Uno, one library's ISR takes 300 µs. What does that mean for your INT0 ISR?",
        options: [
          "Nothing, because INT0 has higher priority and pre-empts it",
          "Your ISR can be delayed by up to about 300 µs, since AVR ISRs do not nest",
          "Your ISR runs twice",
          "Your ISR is skipped",
        ],
        answer: 1,
        why: "I is cleared during every ISR, so even a higher-priority interrupt waits for the running ISR to finish. Priority only orders pending ones.",
      },
      {
        q: "Which is a correct critical section for a variable shared between an ISR and loop() on an ESP32?",
        options: [
          "noInterrupts() and interrupts()",
          "Declaring the variable volatile",
          "portENTER_CRITICAL(&mux) and portEXIT_CRITICAL(&mux) with a portMUX_TYPE",
          "Marking loop() IRAM_ATTR",
        ],
        answer: 2,
        why: "The portMUX spinlock excludes the other core as well as interrupts on this one. noInterrupts() only affects the current core.",
      },
    ],
  },

  "i6-events-scheduling-traffic-junction": {
    id: "i6-events-scheduling-traffic-junction",
    outcomes: [
      "Debounce a mechanical switch in software and detect clean edges",
      "Implement a ring-buffer event queue between interrupts and the main loop",
      "Write a cooperative scheduler and explain what an RTOS adds to it",
      "Build an interrupt-driven state machine: the traffic junction exit project",
    ],
    blocks: [
      { t: "h", text: "Why events" },
      { t: "p", text: "The last three lessons gave you non-blocking code, state machines and interrupts. This lesson joins them into one architecture that scales: interrupts and input handlers turn raw hardware activity into **events**, a queue carries events to the main loop, and state machines consume them. Two problems stand between raw inputs and clean events, bounce and edges, so they come first." },

      { t: "h", text: "Switch bounce" },
      { t: "p", text: "When a mechanical contact closes, the metal parts strike and spring apart several times before settling. For typically 1 to 10 ms, sometimes 20 ms or more on cheap or worn switches, the pin flickers between high and low. A loop running every 50 µs, or an edge interrupt, sees each flicker as a separate press." },
      { t: "diagram", text: String.raw`
 pin   ‾‾‾‾‾‾‾‾‾|_|‾|__|‾|________________________|‾|_|‾‾‾‾‾‾‾‾‾‾‾
                 └ bounce ┘                         └bounce┘
 clean ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|________________________________|‾‾‾‾
                     press accepted                  release accepted
                     after stable time               after stable time`, caption: "A press and release with bounce, and the debounced signal." },
      { t: "p", text: "Three software methods are in common use:" },
      { t: "list", items: [
        "**Lockout.** Accept the first edge immediately, then ignore the pin for a fixed time (say 50 ms). Fast response, and easy to do inside an edge ISR, but a noise spike counts as a press.",
        "**Stable time.** Accept a new level only after the pin has stayed at it for a fixed time. Rejects noise, but adds that time as delay.",
        "**Integrator or shift register.** Sample the pin at a fixed rate (every 5 ms, say) and shift each sample into a byte. When the byte is all 0s the switch is pressed; all 1s, released. Eight samples at 5 ms is a 40 ms stable time, using one byte of state per button.",
      ] },
      { t: "p", text: "Hardware can help too: an RC filter (10 kΩ and 100 nF gives τ = 1 ms) slows the bounce, and a Schmitt-trigger input (every AVR pin has one) turns the slow edge into one clean transition. Professional designs often use both, because filtering also removes interference picked up by long button wires." },

      { t: "h", text: "Edge detection" },
      { t: "p", text: "A state machine usually wants **events** ('the button was pressed'), not **levels** ('the button is down'). Converting levels to events is **edge detection**: keep the previous debounced level and compare it with the new one. Previous 1, new 0 is a falling edge, a press with a pull-up; previous 0, new 1 is a rising edge, a release. Each edge produces exactly one event, however long the button is held. Timing the gap between edges gives long-press and double-click detection." },

      { t: "h", text: "Event queues: the ring buffer" },
      { t: "p", text: "Events are produced at unpredictable moments, sometimes several at once, and the consumer (the main loop) handles them when it can. A queue between them absorbs the difference. On a microcontroller the standard structure is a **ring buffer**: a fixed array plus two indices. The **head** is where the next event is written; the **tail** is where the next event is read. Both advance and wrap round to 0 at the end of the array." },
      { t: "diagram", text: String.raw`
 index:   0    1    2    3    4    5    6    7
        ┌────┬────┬────┬────┬────┬────┬────┬────┐
        │    │    │ E1 │ E2 │ E3 │    │    │    │
        └────┴────┴────┴────┴────┴────┴────┴────┘
                    ▲              ▲
                  tail           head
           (next to read)    (next to write)

 empty:  head == tail            full: (head + 1) % SIZE == tail`, caption: "An 8-slot ring buffer holding three events. One slot is always left empty so that full and empty can be told apart." },
      { t: "p", text: "With a size that is a power of two, wrapping is a cheap mask: `(i + 1) & (SIZE - 1)`. With **one producer and one consumer**, a ring buffer needs no critical section on the AVR if the indices are single bytes: only the producer writes head, only the consumer writes tail, and 8-bit reads and writes are atomic. Write the event into its slot **before** advancing head, so the consumer never sees an index pointing at an unwritten slot. When there are two producers, as in the exit project (two ISRs), the ISRs cannot interrupt each other on the AVR, so they are effectively one producer; the consumer still uses a short ATOMIC_BLOCK to keep its read and its index update together, which also makes the code safe to extend." },
      { t: "p", text: "Decide what happens when the queue is full. Dropping the new event and counting the drop is the usual choice; overwriting the oldest suits streams of measurements where only the latest matters. Never wait for space inside an ISR. Size the queue for the worst burst: a queue that is often full is telling you the consumer is too slow." },
      { t: "snippet", lang: "cpp", code: String.raw`// Debounced button on D2 (Uno, to GND) feeding a ring-buffer event queue.
// Timer-sampled debounce: the pin is read every 5 ms inside loop.
#include <util/atomic.h>

enum Event : uint8_t { EV_PRESS, EV_RELEASE, EV_LONG };

const uint8_t QSIZE = 16;                 // power of two
volatile uint8_t qHead = 0, qTail = 0;    // head: next write, tail: next read
volatile Event q[QSIZE];

bool post(Event e) {                      // safe from loop or an ISR (single producer)
  uint8_t next = (qHead + 1) & (QSIZE - 1);
  if (next == qTail) return false;        // full: drop and report
  q[qHead] = e;
  qHead = next;
  return true;
}

bool take(Event &e) {                     // single consumer: loop only
  if (qTail == qHead) return false;       // empty
  e = q[qTail];
  qTail = (qTail + 1) & (QSIZE - 1);
  return true;
}

const uint8_t BTN = 2;
uint8_t history = 0xFF;                   // last 8 samples, 1 = released
bool stable = true;                       // debounced level
unsigned long lastSample = 0, pressedAt = 0;
bool longSent = false;

void sampleButton() {
  history = (history << 1) | digitalRead(BTN);
  if (stable && history == 0x00) {        // 8 lows in a row: pressed
    stable = false; pressedAt = millis(); longSent = false;
    post(EV_PRESS);
  } else if (!stable && history == 0xFF) {  // 8 highs in a row: released
    stable = true;
    post(EV_RELEASE);
  }
  if (!stable && !longSent && millis() - pressedAt >= 1000) {
    longSent = true;
    post(EV_LONG);
  }
}

void setup() {
  pinMode(BTN, INPUT_PULLUP);
  Serial.begin(115200);
}

void loop() {
  if (millis() - lastSample >= 5) { lastSample += 5; sampleButton(); }
  Event e;
  while (take(e)) {
    Serial.println(e == EV_PRESS ? "press" : e == EV_RELEASE ? "release" : "long press");
  }
}`, caption: "Arduino Uno: shift-register debouncing, edge detection, long-press detection and a ring-buffer queue. Compiled for arduino:avr:uno." },

      { t: "h", text: "Cooperative scheduling" },
      { t: "p", text: "Once a program has many periodic jobs, write the super-loop as data: a table of **tasks**, each a function with a period. The scheduler loop calls each task when its time comes. Every task must do a small amount of work and return, which is why this is called **cooperative**: tasks cooperate by giving the CPU back. This is the structure of a great deal of commercial firmware." },
      { t: "snippet", lang: "cpp", code: String.raw`// A minimal cooperative scheduler: each task is a function that runs briefly and returns.
struct Task {
  void (*run)();
  unsigned long period;   // ms
  unsigned long last;     // ms
};

void blinkTask()  { digitalWrite(13, !digitalRead(13)); }
void sensorTask() { static uint16_t avg = 0; avg = (avg * 7 + analogRead(A0)) / 8; if (avg > 1023) avg = 1023; }
void reportTask() { Serial.println(millis()); }

Task tasks[] = {
  { blinkTask,  500, 0 },
  { sensorTask,  10, 0 },
  { reportTask, 1000, 0 },
};
const uint8_t N_TASKS = sizeof(tasks) / sizeof(tasks[0]);

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  unsigned long now = millis();
  for (uint8_t i = 0; i < N_TASKS; i++) {
    if (now - tasks[i].last >= tasks[i].period) {
      tasks[i].last += tasks[i].period;
      tasks[i].run();
    }
  }
}`, caption: "Arduino Uno: a cooperative scheduler in a dozen lines. Compiled for arduino:avr:uno." },
      { t: "p", text: "Its timing is easy to analyse. The worst delay any task can suffer is the sum of the longest run times of all the other tasks, because they may all become due at once and the scheduler runs them in turn. If the three tasks above take at most 20 µs, 120 µs and 900 µs (Serial printing is the slow one), the worst-case lateness for the 10 ms sensor task is about 920 µs, which is fine. If a task needs more time than that budget allows, split it into steps with a small state machine, so each call does one step." },
      { t: "h", text: "From cooperative scheduling to an RTOS" },
      { t: "p", text: "A cooperative scheduler fails when one task cannot be broken into short steps, or when a task's deadline is shorter than another task's run time. A **real-time operating system** (FreeRTOS on the ESP32) solves this with **pre-emption**: a timer interrupt can stop a running task in the middle and switch to a more urgent one. To make that possible each task gets its own stack, so it can be paused anywhere, and tasks get priorities. The price is that any data shared between tasks now needs the same protection as data shared with an ISR, and the RTOS supplies queues, semaphores and mutexes for that. The event queue and critical sections you wrote in this module are exactly what those RTOS objects do inside. Module a5 builds on this." },
      { t: "table", head: ["", "Super-loop", "Cooperative scheduler", "Pre-emptive RTOS"], rows: [
        ["Who decides when a job runs", "the loop order", "task table and periods", "the kernel, by priority"],
        ["Can a long job delay others", "yes", "yes", "only lower-priority ones"],
        ["Stacks", "one", "one", "one per task"],
        ["Shared data protection", "only with ISRs", "only with ISRs", "between tasks too"],
        ["RAM and complexity", "lowest", "low", "higher"],
      ], caption: "Three ways to share one CPU." },

      { t: "h", text: "Exit project: an interrupt-driven traffic junction" },
      { t: "p", text: "A main road crosses a side road. The main road has priority and stays green for at least 10 s and at most 20 s. The side road gets 8 s of green each cycle. A pedestrian button requests an exclusive walk phase, with all traffic stopped. Every change of right of way passes through yellow and an all-red clearance, so two conflicting greens can never be shown, even for a moment." },
      { t: "diagram", text: String.raw`
           after 20 s, or [request] after 10 s
 ┌────────────┐ ───────────────► ┌─────────────┐ 3 s ┌───────────┐
 │ MAIN_GREEN │                  │ MAIN_YELLOW │ ──► │ ALL_RED_1 │
 └────────────┘                  └─────────────┘     └─────┬─────┘
       ▲                                     [request]     │ 1 s  [no request]
       │ 1 s                              ┌────────────────┴─────────────┐
 ┌─────┴─────┐                            ▼                              │
 │ ALL_RED_3 │                     ┌──────────┐ 8 s ┌───────────┐        │
 └───────────┘                     │ PED_WALK │ ──► │ PED_FLASH │        │
       ▲                           └──────────┘     └─────┬─────┘        │
       │ 3 s                                              │ 4 s          │
 ┌─────┴───────┐ 8 s ┌────────────┐ 1 s ┌───────────┐     │              │
 │ SIDE_YELLOW │ ◄── │ SIDE_GREEN │ ◄── │ ALL_RED_2 │ ◄───┘              │
 └─────────────┘     └────────────┘ ◄───┴───────────┴────────────────────┘`, caption: "The junction's state machine. A request (button press) is latched and served after the main road's minimum green." },
      { t: "p", text: "The architecture uses every idea from this module:" },
      { t: "list", items: [
        "**Timer1 in CTC mode** (prescaler 64, OCR1A = 249: 16 000 000 / (64 × 250) = 1000 Hz) gives a 1 ms tick in `TIMER1_COMPA_vect`, which also posts an EV_TICK event every 250 ms.",
        "**INT0 on D2** catches the button in `ISR(INT0_vect)`, with a 50 ms lockout debounce using the tick counter, and posts EV_REQUEST.",
        "A **ring buffer** carries events from the two ISRs to the main loop. The ISRs never touch a lamp.",
        "A **switch-based state machine** with an `enter()` function and time-in-state runs only in the main loop. A table holds each state's lamp pattern and duration.",
        "The 32-bit tick counter is read inside **ATOMIC_BLOCK**, and state timeouts use rollover-safe subtraction.",
        "When the queue is empty the CPU enters **idle sleep** until the next interrupt, using the 'disable interrupts, check, enable and sleep' sequence so a wake-up cannot be lost between the check and the sleep.",
      ] },
      { t: "table", head: ["Signal", "Uno pin", "Port bit"], rows: [
        ["main red, yellow, green", "D4, D5, D6", "PD4, PD5, PD6"],
        ["side red", "D7", "PD7"],
        ["side yellow, green", "D8, D9", "PB0, PB1"],
        ["pedestrian walk, wait", "D10, D11", "PB2, PB3"],
        ["request button (to GND)", "D2", "PD2 / INT0"],
      ], caption: "Each LED through a 330 Ω resistor to GND. The lamp bit mask is arranged so one shift writes PD4 to PD7 and another PB0 to PB3." },
      { t: "snippet", lang: "cpp", code: String.raw`// i6 exit project: traffic junction with a pedestrian request, Arduino Uno.
//
// Main road lamps: red D4, yellow D5, green D6
// Side road lamps: red D7, yellow D8, green D9
// Pedestrian lamps: walk D10 (green), wait D11 (red)
// Request button: D2 (INT0) to GND, internal pull-up
//
// Interrupts produce events, the main loop consumes them:
//   ISR(INT0_vect)        button edge -> EV_REQUEST (with a 50 ms lockout)
//   ISR(TIMER1_COMPA_vect) 1 ms tick   -> tick counter, EV_TICK every 250 ms
// The state machine runs only in the main loop, so no lamp is ever driven from an ISR.
#include <avr/io.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>
#include <util/atomic.h>

// ---------- events and states (declared first so every function can use them) ----------
enum Event : uint8_t { EV_REQUEST, EV_TICK };
enum State : uint8_t {
  MAIN_GREEN, MAIN_YELLOW, ALL_RED_1, PED_WALK, PED_FLASH, ALL_RED_2,
  SIDE_GREEN, SIDE_YELLOW, ALL_RED_3, N_STATES
};

// ---------- event queue (ring buffer, ISR producers, loop consumer) ----------
const uint8_t QSIZE = 8;                       // power of two
volatile uint8_t qHead = 0, qTail = 0;
volatile Event q[QSIZE];
volatile uint8_t qDropped = 0;

static void post(Event e) {                    // called only from ISRs (interrupts already off)
  uint8_t next = (qHead + 1) & (QSIZE - 1);
  if (next == qTail) { qDropped++; return; }
  q[qHead] = e;
  qHead = next;
}

static bool take(Event &e) {
  bool got = false;
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {           // two producers share qHead with us
    if (qTail != qHead) {
      e = q[qTail];
      qTail = (qTail + 1) & (QSIZE - 1);
      got = true;
    }
  }
  return got;
}

// ---------- time base: Timer1 CTC at 1 kHz ----------
volatile uint32_t ticks = 0;                   // ms since start

ISR(TIMER1_COMPA_vect) {
  static uint8_t sub = 0;                      // 8-bit counter: avoids a slow 32-bit % in the ISR
  ticks++;
  if (++sub == 250) { sub = 0; post(EV_TICK); }
}

static uint32_t now() {
  uint32_t t;
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE) { t = ticks; }  // 4 bytes: must not tear
  return t;
}

// ---------- button on INT0 ----------
volatile uint32_t lastEdge = 0;

ISR(INT0_vect) {
  if (ticks - lastEdge >= 50) {                // ignore bounce for 50 ms
    lastEdge = ticks;
    post(EV_REQUEST);
  }
}

// ---------- lamps ----------
// PORTD bits 4 to 7, PORTB bits 0 to 3 map to D4 to D11.
enum Lamp : uint16_t {
  M_RED = 1 << 0, M_YEL = 1 << 1, M_GRN = 1 << 2,
  S_RED = 1 << 3, S_YEL = 1 << 4, S_GRN = 1 << 5,
  P_WALK = 1 << 6, P_WAIT = 1 << 7,
};

static void showLamps(uint8_t lamps) {
  PORTD = (PORTD & 0x0F) | (uint8_t)((lamps & 0x0F) << 4);   // D4 to D7
  PORTB = (PORTB & 0xF0) | (uint8_t)((lamps >> 4) & 0x0F);   // D8 to D11
}

// ---------- state machine ----------

struct StateInfo { uint8_t lamps; uint32_t ms; };
const StateInfo INFO[N_STATES] = {
  { M_GRN | S_RED | P_WAIT, 20000 },   // MAIN_GREEN: max time (min is MAIN_MIN)
  { M_YEL | S_RED | P_WAIT,  3000 },   // MAIN_YELLOW
  { M_RED | S_RED | P_WAIT,  1000 },   // ALL_RED_1
  { M_RED | S_RED | P_WALK,  8000 },   // PED_WALK
  { M_RED | S_RED,           4000 },   // PED_FLASH (walk lamp blinks)
  { M_RED | S_RED | P_WAIT,  1000 },   // ALL_RED_2
  { M_RED | S_GRN | P_WAIT,  8000 },   // SIDE_GREEN
  { M_RED | S_YEL | P_WAIT,  3000 },   // SIDE_YELLOW
  { M_RED | S_RED | P_WAIT,  1000 },   // ALL_RED_3
};
const uint32_t MAIN_MIN = 10000;       // main road keeps green at least this long

State state;
uint32_t enteredAt;
bool requested = false;                // pedestrian request latched
bool flashOn = false;

static void enter(State s) {
  state = s;
  enteredAt = now();
  if (s == PED_WALK) requested = false;   // request served
  showLamps(INFO[s].lamps);
  if (s == PED_FLASH) flashOn = false;
}

static void step(Event e) {
  uint32_t inState = now() - enteredAt;
  if (e == EV_REQUEST && state != PED_WALK) requested = true;

  switch (state) {
    case MAIN_GREEN:
      if (inState >= INFO[MAIN_GREEN].ms || (requested && inState >= MAIN_MIN)) enter(MAIN_YELLOW);
      break;
    case MAIN_YELLOW:
      if (inState >= INFO[state].ms) enter(ALL_RED_1);
      break;
    case ALL_RED_1:
      if (inState >= INFO[state].ms) enter(requested ? PED_WALK : SIDE_GREEN);
      break;
    case PED_WALK:
      if (inState >= INFO[state].ms) enter(PED_FLASH);
      break;
    case PED_FLASH:
      if (e == EV_TICK) {                     // blink the walk lamp at 2 Hz
        flashOn = !flashOn;
        if (flashOn) PORTB |= (1 << PORTB2); else PORTB &= ~(1 << PORTB2);
      }
      if (inState >= INFO[state].ms) enter(ALL_RED_2);
      break;
    case ALL_RED_2:
      if (inState >= INFO[state].ms) enter(SIDE_GREEN);
      break;
    case SIDE_GREEN:
      if (inState >= INFO[state].ms) enter(SIDE_YELLOW);
      break;
    case SIDE_YELLOW:
      if (inState >= INFO[state].ms) enter(ALL_RED_3);
      break;
    case ALL_RED_3:
      if (inState >= INFO[state].ms) enter(MAIN_GREEN);
      break;
    default:
      enter(ALL_RED_1);                       // unknown state: fail safe to all red
      break;
  }
}

int main(void) {
  DDRD |= 0xF0;                               // D4 to D7 outputs
  DDRB |= 0x0F;                               // D8 to D11 outputs
  DDRD &= ~(1 << DDD2);
  PORTD |= (1 << PORTD2);                     // button pull-up

  TCCR1A = 0;                                 // Timer1 CTC (mode 4), prescaler 64
  TCCR1B = (1 << WGM12) | (1 << CS11) | (1 << CS10);
  OCR1A = 249;                                // 16 MHz / (64 * 250) = 1000 Hz
  TIMSK1 = (1 << OCIE1A);

  EICRA = (1 << ISC01);                       // INT0 on falling edge
  EIFR = (1 << INTF0);
  EIMSK = (1 << INT0);

  set_sleep_mode(SLEEP_MODE_IDLE);            // timers keep running in idle
  sei();
  enter(ALL_RED_3);                           // start safe: all red, then main green

  for (;;) {
    Event e;
    while (take(e)) step(e);
    cli();
    if (qHead == qTail) {                     // nothing pending: sleep until an interrupt
      sleep_enable();
      sei();
      sleep_cpu();                            // sei then sleep: no wake-up is lost
      sleep_disable();
    } else {
      sei();
    }
  }
}`, caption: "Arduino Uno. Uses its own main() and no Arduino functions. Compiles with arduino-cli for arduino:avr:uno to about 1150 bytes." },
      { t: "p", text: "Trace one request through the code. You press the button during MAIN_GREEN, 4 s after it started. The INT0 ISR runs within a couple of microseconds, sees that more than 50 ms have passed since the last accepted edge, and posts EV_REQUEST. The CPU wakes from idle sleep, the main loop takes the event, and `step()` latches `requested = true`. MAIN_GREEN now has a reason to leave, but its guard requires 10 s in state, so nothing changes yet. At the first EV_TICK after 10 s, the transition to MAIN_YELLOW fires; 3 s later ALL_RED_1; 1 s later the latched request sends it to PED_WALK, where `enter()` clears the request. After 8 s of walk and 4 s of flashing, it goes through ALL_RED_2 to the side road's green. From press to walk: 6 s of remaining minimum green, 3 s yellow and 1 s all red, about 10 s." },
      { t: "p", text: "Check the timing resolution. Timeouts are evaluated on events, and EV_TICK arrives every 250 ms, so each state can last up to 250 ms longer than its nominal time. All the durations are multiples of 250 ms, so in practice each state ends on the first tick at or after its time. For a traffic light that is acceptable; for a faster machine, post ticks more often or compute the exact time of the next deadline." },
      { t: "note", kind: "safety", text: "This is a teaching model. Real traffic controllers are safety-critical systems with independent conflict monitors that cut power to all greens if two conflicting greens are ever detected, built to standards such as EN 12675. Never connect a hobby controller to real signals." },

      { t: "deep", title: "Sleeping without losing a wake-up", blocks: [
        { t: "p", text: "The obvious idle code is: if the queue is empty, sleep. But if an interrupt posts an event between the check and the sleep instruction, the CPU goes to sleep with an event waiting, and nothing wakes it until the next interrupt, which might be a long time away. This is a classic **race condition**." },
        { t: "p", text: "The fix relies on an AVR guarantee: the instruction after `sei` always executes before any pending interrupt is served. So: disable interrupts, check the queue, and if it is empty, execute `sei` immediately followed by `sleep`. Any interrupt that became pending after the check is served right after the sleep instruction starts, which wakes the CPU at once. That is the sequence in the exit project's main loop, and it is the pattern the avr-libc documentation recommends for `<avr/sleep.h>`. ARM Cortex-M chips solve the same problem with the WFI instruction, which wakes on a pending interrupt even when interrupts are masked." },
        { t: "p", text: "Idle sleep stops only the CPU clock; timers, the UART and external interrupts keep running, so it is always safe to use. Deeper modes (power-down) stop the timers too and need the watchdog or an external interrupt to wake, saving far more power: the subject of the advanced low-power module." },
      ] },
      { t: "deep", title: "Scaling up the junction: tables, actuated phases and fault states", blocks: [
        { t: "p", text: "The exit project already keeps lamp patterns and durations in a table, so the switch only holds the transition logic. The natural next step is to move transitions into a table too, as in the door lock example, turning the controller into a small interpreter for a 'signal plan'. Real controllers work this way: engineers edit timing plans for morning and evening peaks without touching firmware." },
        { t: "p", text: "Real junctions are also **actuated**: vehicle detectors (inductive loops or cameras) extend a green while traffic keeps arriving, up to a maximum, and skip a phase that nobody is waiting for. In the state machine that is a guard on the green states ('leave if no vehicle detected for 3 s, or at the maximum'), and a side-road detector event alongside the pedestrian request." },
        { t: "p", text: "Finally, add a **fault state**. If the program detects an impossible condition (an unknown state, a queue overflow, a lamp current sensor reading a failed bulb), it enters FLASHING_YELLOW or ALL_RED and stays there until reset, which is what real controllers do. Feed the watchdog from the main loop after each successful step, so a hung program also ends in a reset into the safe start-up state: the exit project already starts in ALL_RED_3." },
      ] },
    ],
    mistakes: [
      "**Treating every edge as a press.** Without debouncing, one press produces several events.",
      "**Acting on levels when you need events.** Holding a button down repeats the action every loop pass; detect the edge.",
      "**Advancing the ring buffer head before writing the slot.** The consumer can read an event that has not been written yet.",
      "**Driving outputs from an ISR.** Keep ISRs to recording events; let the state machine own the outputs so their logic lives in one place.",
      "**Checking the queue and then sleeping with interrupts enabled.** An event that arrives in between is not handled until the next interrupt.",
      "**Letting one cooperative task run long.** Every other task's worst-case lateness includes it; split long jobs into steps.",
    ],
    practice: {
      kind: "bench",
      task: "Build the traffic junction and verify its behaviour against the state diagram.",
      steps: [
        "Wire eight LEDs with 330 Ω resistors to D4 to D11 as in the pin table, and a push button from D2 to GND. Upload the exit project sketch.",
        "With a stopwatch, check one full cycle without pressing the button: 20 s main green, 3 s yellow, 1 s all red, 8 s side green, 3 s yellow, 1 s all red.",
        "Press the button early in main green. Predict when the walk phase will start, then time it. Press it again during PED_WALK and confirm nothing changes; press it during PED_FLASH and explain what happens next cycle.",
        "Press the button rapidly many times. Confirm the behaviour is the same as one press (the request is latched once).",
        "Extend it: add a side-road vehicle sensor button on D3 using INT1 that skips SIDE_GREEN when no vehicle is waiting. Update the state diagram first, then the code.",
      ],
    },
    quiz: [
      {
        q: "A shift-register debouncer samples every 5 ms and accepts a press only when 8 consecutive samples are low. What is the stable time required?",
        options: ["5 ms", "8 ms", "40 ms", "13 ms"],
        answer: 2,
        why: "Eight samples 5 ms apart: the pin must stay low for about 8 × 5 = 40 ms before the byte reads 0x00.",
      },
      {
        q: "A ring buffer has 16 slots and keeps one slot empty. How many events can it hold at once?",
        options: ["16", "15", "8", "17"],
        answer: 1,
        why: "Full is defined as (head + 1) % 16 == tail, so one slot always stays empty to distinguish full from empty: 15 events.",
      },
      {
        q: "In a single-producer, single-consumer ring buffer, why must the producer write the event into its slot before advancing head?",
        options: [
          "To save memory",
          "Because head must always be even",
          "Otherwise the consumer could see the new head and read a slot that has not been written yet",
          "It does not matter which comes first",
        ],
        answer: 2,
        why: "The consumer treats every slot before head as valid. Advancing head first publishes a slot that still holds stale data.",
      },
      {
        q: "Three cooperative tasks take at most 50 µs, 300 µs and 2 ms per call. What is the worst-case lateness of the 50 µs task?",
        options: ["50 µs", "300 µs", "2 ms", "About 2.3 ms"],
        answer: 3,
        why: "In the worst case both other tasks are due at the same moment and run first: 300 µs + 2 ms = 2.3 ms.",
      },
      {
        q: "In the traffic junction, the button is pressed 4 s into MAIN_GREEN. Roughly how long until the walk lamp lights?",
        options: ["About 10 s", "Immediately", "About 4 s", "About 24 s"],
        answer: 0,
        why: "Main green must last 10 s (6 s more), then 3 s yellow and 1 s all red: about 10 s from the press.",
      },
      {
        q: "What does a pre-emptive RTOS add that a cooperative scheduler lacks?",
        options: [
          "The ability to run more than one task",
          "Periodic tasks",
          "The ability to stop a running task in the middle and switch to a more urgent one, using a separate stack per task",
          "Interrupts",
        ],
        answer: 2,
        why: "Cooperative tasks must return voluntarily. Pre-emption lets the kernel interrupt a task, which requires each task to have its own stack.",
      },
    ],
  },
};

export default lessons;
