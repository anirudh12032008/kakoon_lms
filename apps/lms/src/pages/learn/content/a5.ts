import type { ModuleContent } from "../model/curriculum";

/**
 * Module a5: Real-time operating systems.
 * Checked against: Arduino-ESP32 core 3.3.10, which is built on ESP-IDF v5.5.4 and its
 * SMP port of FreeRTOS kernel V10.5.1 (headers and sdkconfig of the installed core),
 * the ESP-IDF v5.5 "FreeRTOS (IDF)" guide, and the FreeRTOS kernel API reference.
 * Every complete sketch was compiled with arduino-cli for esp32:esp32:esp32.
 */
const lessons: ModuleContent = {
  "a5-tasks-and-the-scheduler": {
    id: "a5-tasks-and-the-scheduler",
    outcomes: [
      "Explain what a task, the scheduler, the tick and a context switch are, and what each costs",
      "Predict which task runs at any moment from priorities and task states",
      "Create pinned and unpinned tasks on the ESP32 with xTaskCreatePinnedToCore and give them exact periods",
      "Name the ways ESP-IDF's dual-core FreeRTOS differs from the single-core FreeRTOS in most textbooks",
    ],
    blocks: [
      { t: "h", text: "Why an operating system on a microcontroller" },
      { t: "p", text: "In module i6 you shared one CPU between jobs with a super-loop and then a cooperative scheduler. Both work while every job can be cut into short steps. They break when one job is long (a TLS handshake, a JPEG decode, a flash erase) and another has a tight deadline (a motor control loop every 1 ms). In a cooperative design the urgent job waits until the long one chooses to return. A **real-time operating system** (RTOS) removes that dependency: a timer interrupt can stop the long job anywhere and run the urgent one, then resume the long job exactly where it was. This is **pre-emption**, and the rest of this module is about using it without creating new bugs." },
      { t: "p", text: "\"Real-time\" does not mean fast. It means **predictable**: the system can promise that a job finishes before its deadline, every time, and you can prove it. A desktop OS is optimised for average throughput; an RTOS is optimised for the worst case. FreeRTOS is the RTOS you will use, because it is built into every ESP32 program whether you use ESP-IDF or the Arduino core." },
      { t: "note", kind: "tip", text: "Versions used in this module: Arduino-ESP32 core 3.3.10, which is built on ESP-IDF v5.5.4, which ships an SMP (dual-core) port of FreeRTOS kernel V10.5.1. API names below are checked against those headers. If you write plain ESP-IDF code (app_main) instead of a sketch, the FreeRTOS calls are identical." },

      { t: "h", text: "Tasks" },
      { t: "p", text: "A **task** is a C function that normally never returns, plus the state needed to pause and resume it. That state lives in two places. The **stack** holds the task's local variables, return addresses and, when it is paused, a copy of every CPU register. The **task control block** (TCB) is a small structure the kernel keeps: a pointer to the saved stack position, the priority, the state, and list links. Because each task has its own stack, it can be stopped in the middle of any function and continued later, which is exactly what a single super-loop cannot do." },
      { t: "p", text: "Every task is in one of four states:" },
      { t: "list", items: [
        "**Running**: executing on a core right now. On the dual-core ESP32 two tasks can be Running at once, one per core.",
        "**Ready**: able to run, waiting for a core.",
        "**Blocked**: waiting for an event (a delay to expire, data on a queue, a semaphore) with an optional timeout. A Blocked task uses no CPU time at all.",
        "**Suspended**: removed from scheduling by `vTaskSuspend()` until `vTaskResume()`. Rarely the right tool; prefer blocking on an object.",
      ] },
      { t: "diagram", text: String.raw`
            vTaskDelay, wait on queue/semaphore
  ┌─────────┐ ─────────────────────────────► ┌─────────┐
  │ Running │                                │ Blocked │
  └─────────┘ ◄──┐                           └─────────┘
    │    ▲       │ scheduler picks it             │ event arrives
    │    │       │ (highest priority Ready)       │ or timeout expires
    │    │   ┌───┴───┐ ◄──────────────────────────┘
    │    └── │ Ready │
    │        └───────┘
    └─ pre-empted by a higher-priority task: back to Ready`, caption: "Task states. Suspended (not drawn) is entered and left only by explicit calls." },

      { t: "h", text: "The scheduler and the tick" },
      { t: "p", text: "The **scheduler** is the part of the kernel that decides which Ready task gets a core. FreeRTOS uses **fixed-priority pre-emptive scheduling**: priorities are numbers you choose (0 is lowest, and ESP-IDF allows 0 to 24), and the highest-priority Ready task always runs. If two Ready tasks share the top priority, they take turns, one tick each; this is **time slicing**, or round robin." },
      { t: "p", text: "The scheduler runs at two kinds of moment. First, whenever a task does something that might change who should run: it blocks, gives a semaphore, sends to a queue, or raises another task's priority. Second, on every **tick**: a periodic timer interrupt, 1000 times a second in the Arduino-ESP32 build (`CONFIG_FREERTOS_HZ=1000`) and 100 times a second in a default ESP-IDF project. The tick interrupt advances the kernel's time count, moves tasks whose delays have expired from Blocked to Ready, and, if one of them outranks the running task, switches to it." },
      { t: "p", text: "The tick sets the resolution of every timeout. `vTaskDelay(pdMS_TO_TICKS(15))` at 100 Hz rounds down to 1 tick, which is anywhere from just over 0 ms to 10 ms depending on where in the current tick period you call it. Always convert with `pdMS_TO_TICKS()` rather than writing raw numbers, so the code stays right if the tick rate changes, and never expect a delay finer than one tick." },

      { t: "h", text: "The context switch" },
      { t: "p", text: "Switching from task A to task B is a **context switch**. The kernel saves A's registers onto A's stack, stores A's stack pointer in A's TCB, loads B's stack pointer from B's TCB, and restores B's registers from B's stack. When the return-from-interrupt instruction executes, the CPU carries on running B as if it had never stopped. On the ESP32's Xtensa LX6 cores at 240 MHz a switch takes a few microseconds; on a Cortex-M4 at 100 MHz it is typically under 2 µs. That cost is small but not zero: a 1 kHz tick on a task set that switches on every tick spends a fraction of a percent of the CPU on switching, while a design that bounces between tasks every few microseconds spends most of it." },
      { t: "diagram", text: String.raw`
 time ─────────────────────────────────────────────────────────────►
 tick      │              │              │              │
 High (3)  ░░░░            ████            ░░░░            ████     runs 1 ms every 2 ms
 Low  (1)      ████████████    ████████████    ████████████    ████  runs whenever High is Blocked
           ▲   ▲           ▲   ▲
           │   │           │   └ High blocks again: switch to Low
           │   │           └ tick: High's delay expires, it pre-empts Low
           │   └ High calls vTaskDelayUntil and blocks
           └ start
 (░ = waiting to start, █ = running)`, caption: "Pre-emption on one core. Low never decides when to give way; the kernel takes the CPU from it." },

      { t: "h", text: "Creating tasks on the ESP32" },
      { t: "p", text: "The ESP32 has two cores, called core 0 (PRO_CPU) and core 1 (APP_CPU). ESP-IDF runs one copy of the scheduler on each, sharing one set of task lists, so this is **symmetric multiprocessing** (SMP). Each task has a **core affinity**: pinned to core 0, pinned to core 1, or `tskNO_AFFINITY`, meaning either core may run it. You create tasks with:" },
      { t: "snippet", lang: "c", code: String.raw`BaseType_t xTaskCreatePinnedToCore(
    TaskFunction_t     pvTaskCode,    // void fn(void *param), must never return
    const char        *pcName,        // for debugging and trace output
    const uint32_t     usStackDepth,  // stack size in BYTES in ESP-IDF (vanilla FreeRTOS: words)
    void              *pvParameters,  // passed to fn as param
    UBaseType_t        uxPriority,    // 0 (lowest) to configMAX_PRIORITIES - 1 (24 in ESP-IDF)
    TaskHandle_t      *pvCreatedTask, // receives the handle, or NULL
    const BaseType_t   xCoreID);      // 0, 1 or tskNO_AFFINITY

// xTaskCreate() takes the same arguments minus xCoreID and creates an unpinned task.
// Both return pdPASS, or errCOULD_NOT_ALLOCATE_REQUIRED_MEMORY if the heap is full.`, caption: "Signature as declared in ESP-IDF v5.5 (freertos/task.h and idf_additions.h)." },
      { t: "p", text: "In the Arduino core the scheduler is already running before `setup()` is called. `setup()` and `loop()` run inside a task called `loopTask`, created with priority 1, an 8192-byte stack, pinned to core 1. Wi-Fi and Bluetooth stacks live mostly on core 0. A sensible default is to pin your time-critical tasks to core 1 and leave core 0 to the radio, unless measurement says otherwise." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.3.x (ESP-IDF 5.5, FreeRTOS V10.5.1 SMP).
// Two periodic tasks pinned to different cores, each on an exact period.
const int LED_PIN = 2;   // on-board LED on most ESP32 DevKit boards

void blinkTask(void *param) {
  pinMode(LED_PIN, OUTPUT);
  const TickType_t period = pdMS_TO_TICKS(250);
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    vTaskDelayUntil(&lastWake, period);      // blocks: the core is free for others
  }
}

void reportTask(void *param) {
  const char *name = (const char *)param;
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    Serial.printf("%s on core %d, tick %lu\n", name, xPortGetCoreID(),
                  (unsigned long)xTaskGetTickCount());
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(1000));
  }
}

void setup() {
  Serial.begin(115200);
  //                       function    name      stack(bytes) param         prio handle core
  xTaskCreatePinnedToCore(blinkTask,  "blink",  2048,        NULL,          2,   NULL,  1);
  xTaskCreatePinnedToCore(reportTask, "report", 4096,        (void *)"rep", 1,   NULL,  0);
}

void loop() {
  vTaskDelete(NULL);   // loop() itself is a task ("loopTask"); we do not need it
}`, caption: "ESP32 DevKit, Arduino-ESP32 3.3.10. Compiled for esp32:esp32:esp32." },
      { t: "p", text: "Two details matter. First, `vTaskDelayUntil(&lastWake, period)` wakes the task at lastWake + period and then advances lastWake, so the period does not drift by the time the body takes. It is the RTOS version of the `last += interval` rule from i6. `vTaskDelay(period)` instead waits period ticks from now, so the body's run time is added to every cycle. Second, a task function must never return. If it has finished its work, it deletes itself with `vTaskDelete(NULL)`." },

      { t: "h", text: "Choosing priorities" },
      { t: "p", text: "Priority is not importance. It is **urgency**: a task that must respond within 1 ms should outrank one that may take 100 ms, even if the slow one is the reason the product exists. The rule that falls out of the theory in the last lesson is simple: **the shorter a task's period or deadline, the higher its priority**. Keep the number of distinct priorities small (four or five levels is plenty for most firmware), leave priority 0 to the idle task, and never give a task that busy-waits a high priority, because it will starve everything beneath it on that core." },
      { t: "p", text: "Worked example. A balancing robot has three jobs: read the IMU and update the motor PWM every 2 ms (takes 0.3 ms), run a navigation planner every 100 ms (takes 15 ms), and log to the SD card every 500 ms (takes up to 40 ms because SD writes stall). In a super-loop the 40 ms SD write would delay the control loop by 20 periods. With priorities control = 3, planner = 2, logger = 1 on the same core, the control task pre-empts both others whenever its period starts, so its worst-case delay is just the context-switch time plus any short critical section. Check the load: 0.3/2 + 15/100 + 40/500 = 0.15 + 0.15 + 0.08 = 0.38, so the core is 38% busy and there is room to spare." },

      { t: "h", text: "What is different on a dual-core ESP32" },
      { t: "p", text: "Most RTOS textbooks, and most of freertos.org, describe a single core. ESP-IDF's SMP FreeRTOS behaves differently in ways that cause real bugs:" },
      { t: "table", head: ["Feature", "Vanilla single-core FreeRTOS", "ESP-IDF SMP FreeRTOS"], rows: [
        ["Stack size argument", "in words (4 bytes on a 32-bit CPU)", "in bytes"],
        ["Running tasks", "one", "two, one per core"],
        ["Highest-priority Ready task", "always runs", "runs only if a core it is allowed on is free of higher-priority work"],
        ["Critical section", "taskENTER_CRITICAL() masks interrupts", "taskENTER_CRITICAL(&spinlock): masks interrupts on this core and takes a spinlock"],
        ["vTaskSuspendAll()", "stops all task switching", "stops switching on the calling core only"],
        ["Idle task", "one", "one per core, pinned"],
        ["Tick", "one tick interrupt", "core 0 keeps time; core 1 only time-slices"],
        ["Floating point", "no effect on scheduling", "a task that uses the FPU is pinned to the core it was on"],
      ], caption: "From the ESP-IDF v5.5 FreeRTOS (IDF) guide." },
      { t: "p", text: "The third row deserves a second look. Suppose task A (priority 10) and task B (priority 9) are both pinned to core 0, and task C (priority 8) is pinned to core 1. B never runs while A is Ready, even though core 1 is busy only with something of lower priority, because B is not allowed on core 1. Affinity is a constraint the scheduler must obey, so a careless pin can starve a task just as a wrong priority can." },
      { t: "note", kind: "warn", text: "The Arduino-ESP32 task watchdog watches the idle task on core 0 only, with a 5 s timeout. A high-priority task on core 0 that never blocks starves that idle task and resets the chip with a 'task_wdt' message. On core 1 the same mistake is silent: nothing resets, the lower-priority tasks just stop. Every task loop must block somewhere." },

      { t: "deep", title: "Inside a context switch on the Xtensa LX6", blocks: [
        { t: "p", text: "The ESP32's Xtensa cores use **register windows**: the CPU has 64 physical address registers, but code sees only 16 at a time (a0 to a15) through a window that rotates by 4, 8 or 12 registers on each call. A context switch therefore cannot simply push 16 registers; it must first spill all the live windows belonging to the outgoing task onto its stack, which the port does with a sequence of window-overflow exceptions. That is one reason an ESP32 switch costs more cycles than a Cortex-M one, where the hardware automatically stacks eight registers on interrupt entry and the kernel pushes the other eight in PendSV." },
        { t: "p", text: "The sequence in ESP-IDF's port is: the tick or a yield raises an interrupt; the interrupt entry code saves the interrupted task's frame (PC, PS, a0 to a15, SAR, loop registers) on its stack; `vTaskSwitchContext()` picks the next TCB for this core; and the exit code restores the new task's frame and returns from the interrupt into it. FPU registers are saved lazily: they are stored only when a second task actually touches the FPU, which is why the kernel pins FPU-using tasks to a core." },
        { t: "p", text: "You can measure the switch cost yourself. Create two tasks of equal priority on one core that ping-pong a task notification 100 000 times, timestamp the loop with `esp_timer_get_time()`, and divide by 200 000 switches. Expect a few microseconds per switch at 240 MHz with the Arduino build; the exact number depends on the cache state, so run it twice and report the second figure." },
      ] },
      { t: "deep", title: "Tickless idle and why the tick rate is a trade-off", blocks: [
        { t: "p", text: "A faster tick gives finer timeouts but costs an interrupt every period even when nothing is due. At 1000 Hz the tick handler runs 1000 times a second per core; each run takes perhaps 1 to 3 µs, so the overhead is about 0.1 to 0.3% of the CPU, which is negligible for performance but not for battery life, because each tick wakes the CPU." },
        { t: "p", text: "**Tickless idle** (`configUSE_TICKLESS_IDLE`, exposed in ESP-IDF as `CONFIG_FREERTOS_USE_TICKLESS_IDLE` together with power management) solves that: when every task is Blocked, the idle task works out when the next timeout is due, stops the tick, sleeps until then, and on waking adds the elapsed ticks back to the count. The program sees no difference except that it now draws sleep current between events. Module a7 uses this with ESP32 light sleep." },
        { t: "p", text: "The rule of thumb for choosing a rate: make the tick period no more than a third of the shortest timeout you need to be accurate, and do not use the tick at all for sub-millisecond timing; use a hardware timer (`esp_timer` or a GPTimer) that notifies a task instead." },
      ] },
    ],
    mistakes: [
      "**Passing a stack size in words from a textbook.** `xTaskCreate(fn, \"t\", 512, ...)` is 2048 bytes on vanilla FreeRTOS but only 512 bytes on ESP-IDF, which overflows as soon as you call printf.",
      "**Letting a task function return.** A task must loop forever or call `vTaskDelete(NULL)`; returning crashes with an abort.",
      "**Busy-waiting in a high-priority task.** `while (!flag) {}` never blocks, so every lower-priority task on that core starves. Block on a queue, semaphore or notification instead.",
      "**Using vTaskDelay() for a fixed rate.** The body's run time is added to each period and the rate drifts. Use `vTaskDelayUntil()`.",
      "**Assuming the highest-priority task always runs.** On the dual-core ESP32 a pinned task waits for its own core even when the other core is running lower-priority work.",
      "**Writing raw tick counts.** `vTaskDelay(100)` means 100 ms at 1000 Hz and 1 s at 100 Hz. Always use `pdMS_TO_TICKS()`.",
    ],
    practice: {
      kind: "bench",
      task: "Run two pinned periodic tasks on an ESP32 DevKit and observe pre-emption and drift.",
      steps: [
        "Upload the two-task sketch from this lesson. In the Serial Monitor at 115200 baud, confirm the report task prints core 0 and that the tick advances by 1000 each line.",
        "Put a logic analyser or oscilloscope on GPIO 2 and measure the LED period. It should be 500 ms (250 ms high, 250 ms low) to within a tick.",
        "Add `delayMicroseconds(30000)` inside blinkTask before vTaskDelayUntil. Measure the period again: it should not change. Then swap to `vTaskDelay(period)` and measure: the period grows by about 60 ms per full cycle. Explain why.",
        "Create a third task pinned to core 1 at priority 3 that busy-waits forever. Predict what happens to the LED, then confirm. Change its loop to block for 1 tick each iteration and observe the difference.",
        "Write down, for each task, its priority, core, period and stack size. Keep this table: it becomes the start of your exit project's task diagram.",
      ],
    },
    quiz: [
      {
        q: "On the ESP32 with ESP-IDF, you create a task with usStackDepth = 1024. How much stack does it get?",
        options: ["1024 words, which is 4096 bytes", "1024 bytes", "1024 ticks", "It depends on the priority"],
        answer: 1,
        why: "ESP-IDF's FreeRTOS takes stack depth in bytes. Vanilla FreeRTOS takes words, so the same number would be four times larger on a textbook port.",
      },
      {
        q: "Task H (priority 3) is Blocked in vTaskDelayUntil and task L (priority 1) is running on the same core. H's wake time arrives at the next tick. What happens?",
        options: [
          "L keeps running until it blocks or calls taskYIELD",
          "The tick interrupt makes H Ready, and because H outranks L the kernel switches to H straight away",
          "H runs on the other core automatically",
          "Both run alternately, one tick each",
        ],
        answer: 1,
        why: "This is pre-emption. The tick moves H from Blocked to Ready, and a Ready task of higher priority than the running one causes an immediate context switch.",
      },
      {
        q: "A task must run every 20 ms. Its body takes 3 ms. With vTaskDelay(pdMS_TO_TICKS(20)) instead of vTaskDelayUntil, what period do you get?",
        options: ["20 ms", "17 ms", "About 23 ms", "40 ms"],
        answer: 2,
        why: "vTaskDelay waits 20 ms from when it is called, after the 3 ms body, so each cycle is about 23 ms. vTaskDelayUntil measures from the previous wake time and keeps 20 ms.",
      },
      {
        q: "Tasks A (priority 10) and B (priority 9) are pinned to core 0; task C (priority 8) is pinned to core 1. A never blocks. Which statement is true?",
        options: [
          "B runs on core 1 because it outranks C",
          "B never runs, because it may only run on core 0 and A always occupies it",
          "A and B time-slice because their priorities are close",
          "C stops running because B outranks it",
        ],
        answer: 1,
        why: "Affinity is a hard constraint. Core 0 always picks A; B is not allowed on core 1, so it starves. C keeps core 1.",
      },
      {
        q: "Why does each task need its own stack in a pre-emptive RTOS but not in a cooperative scheduler?",
        options: [
          "Because tasks use more RAM than functions",
          "Because a pre-empted task can be stopped in the middle of any function, so its local variables, return addresses and registers must be kept somewhere until it resumes",
          "Because the tick interrupt needs a stack per task",
          "Because priorities are stored on the stack",
        ],
        answer: 1,
        why: "A cooperative task returns to the scheduler at a point of its own choosing, with nothing live on the stack. A pre-empted task is frozen mid-call, so its entire call chain and register state must be preserved separately.",
      },
      {
        q: "In the balancing robot example, the tasks use 0.3 ms every 2 ms, 15 ms every 100 ms and 40 ms every 500 ms. What fraction of the core do they use together?",
        options: ["0.23", "0.38", "0.55", "0.08"],
        answer: 1,
        why: "0.3/2 + 15/100 + 40/500 = 0.15 + 0.15 + 0.08 = 0.38.",
      },
    ],
  },

  "a5-queues-semaphores-and-notifications": {
    id: "a5-queues-semaphores-and-notifications",
    outcomes: [
      "Choose between a queue, a binary or counting semaphore, a mutex, an event group and a task notification for a given job",
      "Use each object with the correct FreeRTOS API and timeout",
      "Size a queue from producer and consumer rates",
      "Explain why a mutex is not the same thing as a binary semaphore",
    ],
    blocks: [
      { t: "h", text: "Why tasks need kernel objects" },
      { t: "p", text: "Once tasks can be pre-empted at any instruction, every piece of data two tasks share has the same torn-read and lost-update problems you met with ISRs in i6, plus a new one: a task that is waiting for something should **block**, not poll, so that lower-priority tasks get the CPU. FreeRTOS gives you a small set of objects that solve both problems at once. Each one is a piece of shared state protected by a critical section inside the kernel, plus a list of tasks blocked on it. Using them correctly is most of the skill of RTOS programming." },
      { t: "table", head: ["Object", "Carries", "Typical use"], rows: [
        ["Queue", "copies of fixed-size items, FIFO", "pass readings or commands from one task to another"],
        ["Binary semaphore", "a single 'it happened' flag", "signal an event, often from an ISR"],
        ["Counting semaphore", "a count", "count events, or guard a pool of N identical resources"],
        ["Mutex", "ownership of a resource", "protect a shared bus, peripheral or data structure"],
        ["Event group", "up to 24 independent flag bits", "wait for several conditions at once, or broadcast one"],
        ["Task notification", "a 32-bit value inside the receiving task's TCB", "fastest one-to-one signal or small value"],
      ], caption: "The FreeRTOS communication objects. Event groups hold 24 bits when TickType_t is 32-bit, as on the ESP32." },

      { t: "h", text: "Queues" },
      { t: "p", text: "A **queue** is a ring buffer of fixed-size items with a lock and two waiting lists: tasks waiting to send because it is full, and tasks waiting to receive because it is empty. Items are **copied** in and out, so the sender can reuse its variable immediately. To pass something large, put a pointer in the queue and agree who owns the buffer." },
      { t: "snippet", lang: "c", code: String.raw`QueueHandle_t xQueueCreate(UBaseType_t uxQueueLength, UBaseType_t uxItemSize);
BaseType_t    xQueueSend(QueueHandle_t xQueue, const void *pvItemToQueue, TickType_t xTicksToWait);
BaseType_t    xQueueReceive(QueueHandle_t xQueue, void *pvBuffer, TickType_t xTicksToWait);
BaseType_t    xQueueSendFromISR(QueueHandle_t xQueue, const void *pvItemToQueue,
                                BaseType_t *pxHigherPriorityTaskWoken);
UBaseType_t   uxQueueMessagesWaiting(QueueHandle_t xQueue);
// Send/Receive return pdTRUE on success, errQUEUE_FULL or pdFALSE on timeout.`, caption: "Queue API, FreeRTOS V10.5.1. xQueueSend is the same as xQueueSendToBack." },
      { t: "p", text: "The timeout argument decides what a task does when it cannot proceed. `0` means try once and return at once. `pdMS_TO_TICKS(n)` means block for up to n ms. `portMAX_DELAY` means block forever (with `INCLUDE_vTaskSuspend` set, as in ESP-IDF). Always check the return value: a send that fails silently is a lost reading." },
      { t: "p", text: "**Sizing a queue.** A queue absorbs bursts: while the consumer is busy or pre-empted, items pile up. If a producer sends one item every 10 ms and the consumer can be held up for at most 60 ms (because a higher-priority task or an SD write runs), up to 60 / 10 = 6 items arrive in that time, plus one that may be arriving as the consumer resumes, so a length of 8 gives a margin. If the consumer's average rate is lower than the producer's, no length is enough; the queue will fill and you must drop, average or slow the producer. Measure the worst case with `uxQueueMessagesWaiting()` logged at its maximum." },

      { t: "h", text: "Semaphores" },
      { t: "p", text: "A **binary semaphore** is a queue of length one with no data: it is either available (given) or not. One side calls `xSemaphoreGive()`, the other blocks in `xSemaphoreTake()` until it is given. The classic use is an ISR telling a task that something happened. A **counting semaphore** holds a count up to a maximum: each give adds one, each take subtracts one and blocks at zero. Use it to count events that may arrive faster than they are handled, or to guard a pool of, say, three DMA buffers." },
      { t: "snippet", lang: "c", code: String.raw`SemaphoreHandle_t xSemaphoreCreateBinary(void);              // created EMPTY: take blocks until a give
SemaphoreHandle_t xSemaphoreCreateCounting(UBaseType_t uxMaxCount, UBaseType_t uxInitialCount);
SemaphoreHandle_t xSemaphoreCreateMutex(void);               // created AVAILABLE
BaseType_t xSemaphoreTake(SemaphoreHandle_t xSemaphore, TickType_t xTicksToWait);
BaseType_t xSemaphoreGive(SemaphoreHandle_t xSemaphore);
BaseType_t xSemaphoreGiveFromISR(SemaphoreHandle_t xSemaphore, BaseType_t *pxHigherPriorityTaskWoken);`, caption: "Semaphore and mutex API. A binary semaphore starts empty; a mutex starts available." },

      { t: "h", text: "Mutexes, and why they are not binary semaphores" },
      { t: "p", text: "A **mutex** (mutual exclusion) protects a resource: the I2C bus, the Serial port, a configuration struct. A task takes it, uses the resource, and gives it back. It looks like a binary semaphore that starts available, and in FreeRTOS it is built from the same code, but it differs in two ways that matter:" },
      { t: "list", items: [
        "**Ownership.** A mutex is held by one task, and only that task should give it back. A semaphore has no owner: any task or ISR may give it. So a mutex must never be taken or given in an ISR.",
        "**Priority inheritance.** If a high-priority task blocks on a mutex held by a low-priority task, the kernel temporarily raises the holder to the waiter's priority, so it can finish and release quickly. This bounds a dangerous effect called priority inversion, the subject of the next lesson. Binary semaphores do not do this.",
      ] },
      { t: "p", text: "If a task needs to take the same mutex again while already holding it (a function that locks, calling another function that also locks), use a **recursive mutex**: `xSemaphoreCreateRecursiveMutex()`, `xSemaphoreTakeRecursive()`, `xSemaphoreGiveRecursive()`. A normal mutex taken twice by the same task deadlocks that task." },
      { t: "p", text: "Keep the code between take and give short and never block on something else while holding a mutex if you can help it. A mutex is the right tool when the protected work takes longer than a few microseconds or may block (a whole I2C transaction). For a two-line update of shared variables, a critical section (`taskENTER_CRITICAL(&mux)`) from i6 is cheaper, but it masks interrupts on that core, so it must be very short." },

      { t: "h", text: "Event groups" },
      { t: "p", text: "An **event group** is a word of flag bits that tasks can set, clear and wait on. The power is in the wait: a task can block until **any** of several bits are set, or until **all** of them are, which no single queue or semaphore can express. Typical uses are start-up synchronisation (wait until Wi-Fi is up and the time is set and the sensor is calibrated) and broadcasting one event to many waiting tasks at once." },
      { t: "snippet", lang: "c", code: String.raw`EventGroupHandle_t xEventGroupCreate(void);
EventBits_t xEventGroupSetBits(EventGroupHandle_t xEventGroup, const EventBits_t uxBitsToSet);
EventBits_t xEventGroupClearBits(EventGroupHandle_t xEventGroup, const EventBits_t uxBitsToClear);
EventBits_t xEventGroupWaitBits(EventGroupHandle_t xEventGroup,
                                const EventBits_t uxBitsToWaitFor,
                                const BaseType_t  xClearOnExit,     // pdTRUE: clear the bits waited for
                                const BaseType_t  xWaitForAllBits,  // pdTRUE: AND, pdFALSE: OR
                                TickType_t        xTicksToWait);
// WaitBits returns the bits as they were when the wait ended; check them, the call may have timed out.`, caption: "Event group API." },

      { t: "h", text: "Task notifications" },
      { t: "p", text: "Every task has a built-in 32-bit **notification value** and a pending flag in its TCB. Another task or an ISR can notify it directly, with no separate object to create. Because nothing is allocated and the receiver is known, a notification is the fastest signalling mechanism in FreeRTOS (the kernel documentation measures unblocking a task this way as up to 45% faster than with a binary semaphore) and uses no extra RAM. The limits are that only one task can receive it, and the sender cannot block waiting for the receiver to be ready." },
      { t: "snippet", lang: "c", code: String.raw`// Lightweight counting semaphore:
BaseType_t xTaskNotifyGive(TaskHandle_t xTaskToNotify);
void       vTaskNotifyGiveFromISR(TaskHandle_t xTaskToNotify, BaseType_t *pxHigherPriorityTaskWoken);
uint32_t   ulTaskNotifyTake(BaseType_t xClearCountOnExit, TickType_t xTicksToWait);
           // returns the count before it was cleared (pdTRUE) or decremented (pdFALSE); 0 on timeout

// General form, with a value and an action (eSetBits, eIncrement, eSetValueWithOverwrite, ...):
BaseType_t xTaskNotify(TaskHandle_t xTaskToNotify, uint32_t ulValue, eNotifyAction eAction);
BaseType_t xTaskNotifyWait(uint32_t ulBitsToClearOnEntry, uint32_t ulBitsToClearOnExit,
                           uint32_t *pulNotificationValue, TickType_t xTicksToWait);`, caption: "Task notification API, FreeRTOS V10.5.1 (index 0 of the notification array)." },

      { t: "h", text: "A complete example" },
      { t: "p", text: "The program below has a sensor task sampling an analog input at 10 Hz and a logger task printing the readings. They meet through a queue. Both tasks print, so Serial is guarded by a mutex. An event group makes the sensor wait until the logger has started, which matters in real firmware where a consumer may need seconds to initialise (an SD card, a network connection) before data should flow." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.3.x. Producer, consumer, mutex, event group.
#include <freertos/event_groups.h>

struct Reading { uint32_t tick; uint16_t raw; };

QueueHandle_t readings;          // sensor task -> logger task
SemaphoreHandle_t serialLock;    // mutex around Serial
EventGroupHandle_t sysEvents;
const EventBits_t SENSOR_READY = 1 << 0;
const EventBits_t LOGGER_READY = 1 << 1;
const int ADC_PIN = 34;          // GPIO 34 is input-only, ADC1 channel 6

void logLine(const char *msg) {
  if (xSemaphoreTake(serialLock, pdMS_TO_TICKS(50)) == pdTRUE) {
    Serial.println(msg);
    xSemaphoreGive(serialLock);
  }
}

void sensorTask(void *) {
  xEventGroupSetBits(sysEvents, SENSOR_READY);
  xEventGroupWaitBits(sysEvents, LOGGER_READY, pdFALSE, pdTRUE, portMAX_DELAY);
  TickType_t last = xTaskGetTickCount();
  for (;;) {
    Reading r = { xTaskGetTickCount(), (uint16_t)analogRead(ADC_PIN) };
    if (xQueueSend(readings, &r, 0) != pdTRUE) logLine("queue full: reading dropped");
    vTaskDelayUntil(&last, pdMS_TO_TICKS(100));
  }
}

void loggerTask(void *) {
  xEventGroupSetBits(sysEvents, LOGGER_READY);
  Reading r;
  char buf[48];
  for (;;) {
    if (xQueueReceive(readings, &r, pdMS_TO_TICKS(500)) == pdTRUE) {
      snprintf(buf, sizeof buf, "t=%lu raw=%u", (unsigned long)r.tick, r.raw);
      logLine(buf);
    } else {
      logLine("no reading for 500 ms");
    }
  }
}

void setup() {
  Serial.begin(115200);
  readings   = xQueueCreate(8, sizeof(Reading));
  serialLock = xSemaphoreCreateMutex();
  sysEvents  = xEventGroupCreate();
  configASSERT(readings && serialLock && sysEvents);
  xTaskCreatePinnedToCore(sensorTask, "sensor", 3072, NULL, 3, NULL, 1);
  xTaskCreatePinnedToCore(loggerTask, "logger", 4096, NULL, 1, NULL, 1);
}

void loop() { vTaskDelete(NULL); }`, caption: "ESP32 DevKit, Arduino-ESP32 3.3.10. Compiled for esp32:esp32:esp32." },
      { t: "p", text: "Notice the design choices. The sensor task has the higher priority because its timing matters; the logger may lag. The sensor sends with timeout 0, so a full queue costs one dropped reading and a message, never a late sample. The logger receives with a 500 ms timeout, so a stalled sensor is reported instead of hanging silently. All objects are created before the tasks that use them, and `configASSERT` stops the program at once if the heap could not supply them." },

      { t: "h", text: "Choosing the right object" },
      { t: "list", ordered: true, items: [
        "Does data need to move? Use a **queue** (or a stream or message buffer for byte streams).",
        "Is it one task signalling one other task, with at most a count or a few bits? Use a **task notification**.",
        "Must several tasks wait for the same signal, or must one task wait for a combination of conditions? Use an **event group**.",
        "Is it guarding a resource that several tasks use? Use a **mutex**, never a binary semaphore.",
        "Is it an event signalled to a task you do not have a handle for, or several possible receivers? Use a **semaphore**.",
      ] },

      { t: "deep", title: "What happens inside xQueueSend when a receiver is waiting", blocks: [
        { t: "p", text: "Follow one call. The sensor task (priority 3) calls `xQueueSend()` while the logger (priority 1) is Blocked in `xQueueReceive()`. Inside, the kernel enters a critical section, copies the item into the ring buffer, sees that the queue's 'waiting to receive' list is not empty, removes the logger from that list and from the delayed list (cancelling its timeout), and puts it on the Ready list. Because the logger's priority is lower than the caller's, no switch is requested and the sensor carries on. Had the logger been priority 5, the kernel would yield before `xQueueSend()` returned, and the logger would run first." },
        { t: "p", text: "On the ESP32 there is an extra twist: if the woken task is pinned to the other core, or is unpinned and the other core is running something of lower priority, the kernel sends a **cross-core interrupt** to make the other core reschedule, and both tasks run at once. This is why a queue between tasks on different cores can have lower latency than on one core, but also why the order of printouts from two cores is not deterministic." },
        { t: "p", text: "The copy is the cost. An 8-byte item is trivial; a 1 KB item copied in and out at 1 kHz is 2 MB/s of memcpy. Above a few dozen bytes, queue a pointer to a buffer from a pool, and return the buffer to the pool (another queue of pointers works well) when the consumer is done." },
      ] },
      { t: "deep", title: "Stream buffers, message buffers and software timers", blocks: [
        { t: "p", text: "**Stream buffers** (`xStreamBufferCreate`) carry a byte stream with no item boundaries, for example UART data passed from an ISR to a parser task. **Message buffers** (`xMessageBufferCreate`) carry variable-length messages, each prefixed by its length. Both are designed for exactly one writer and one reader; with more than one of either, you must add your own mutex. They are lighter than queues because they are built on task notifications." },
        { t: "p", text: "**Software timers** (`xTimerCreate`, `xTimerStart`) run a callback after a delay or periodically, without a task of their own. All callbacks run in a single kernel task, the **timer service** or daemon task (priority `configTIMER_TASK_PRIORITY`, which ESP-IDF sets to 1 by default), so a callback must never block and should be short: a long callback delays every other timer. Commands to start and stop timers travel to that task through a queue, which is why `xTimerStart()` itself takes a timeout." },
        { t: "p", text: "`xEventGroupSetBitsFromISR()` is also implemented through the timer service queue, because setting bits may unblock an unbounded number of tasks, which an ISR must not do. That makes it slower and dependent on the daemon task's priority; from an ISR, a task notification is nearly always the better choice." },
      ] },
    ],
    mistakes: [
      "**Using a binary semaphore to protect a shared resource.** It has no owner and no priority inheritance. Use a mutex.",
      "**Taking a mutex in an ISR.** An ISR cannot block and cannot own anything. Signal a task instead.",
      "**Ignoring the return value of send, receive and take.** A timeout is not an error you can ignore; it is information.",
      "**Creating objects after the tasks that use them start.** The task may run first and use a NULL handle. Create objects first, then tasks.",
      "**Queuing big structs by value at high rate.** Each item is copied twice. Queue a pointer and manage buffer ownership.",
      "**Expecting xEventGroupWaitBits to mean the bits were set.** It returns on timeout too. Test the returned bits.",
    ],
    practice: {
      kind: "bench",
      task: "Build the producer and consumer, then provoke and measure overflow and contention.",
      steps: [
        "Wire a 10 kΩ potentiometer between 3.3 V and GND with its wiper to GPIO 34 on the ESP32 DevKit. Never connect 5 V to an ESP32 pin.",
        "Upload the example and confirm 10 readings per second with increasing tick values.",
        "In loggerTask, add `vTaskDelay(pdMS_TO_TICKS(1000))` after printing. Predict how many readings are dropped per second once the queue fills, then count them.",
        "Track the maximum of `uxQueueMessagesWaiting(readings)` in the sensor task and print it every 5 s. Remove the 1 s delay, add a 300 ms one instead, and work out the smallest queue length that drops nothing. Check the number against the sizing rule in the lesson.",
        "Replace the mutex with nothing and let both tasks print long lines quickly. Observe the interleaved output, then put the mutex back.",
      ],
    },
    quiz: [
      {
        q: "A producer sends a reading every 5 ms. The consumer can be held up by higher-priority work for at most 30 ms, and on average it keeps up. What is the smallest sensible queue length?",
        options: ["2", "6, plus a margin of one or two", "30", "No length works"],
        answer: 1,
        why: "In 30 ms, 30 / 5 = 6 readings arrive while the consumer is held up. A length of 7 or 8 gives a margin for the one in flight. Because the average rates match, the queue then drains.",
      },
      {
        q: "Two tasks share an I2C bus. Why should the lock be a mutex and not a binary semaphore?",
        options: [
          "Mutexes are faster",
          "A mutex has an owner and applies priority inheritance, which bounds how long a high-priority task waits for a low-priority holder",
          "Binary semaphores cannot be taken by tasks",
          "A mutex can be given from an ISR",
        ],
        answer: 1,
        why: "Ownership and priority inheritance are the two things a mutex adds. A mutex must not be used from an ISR at all.",
      },
      {
        q: "A display task must wait until Wi-Fi is connected AND the clock is synchronised AND the sensor is calibrated. Which object fits best?",
        options: [
          "Three separate queues",
          "A task notification with eIncrement",
          "An event group, waiting for all three bits with xWaitForAllBits = pdTRUE",
          "A counting semaphore with a maximum of 3",
        ],
        answer: 2,
        why: "Waiting for a combination of conditions is exactly what an event group's AND wait does. A counting semaphore reaching 3 could be three copies of one event.",
      },
      {
        q: "Your ISR must wake one specific task as quickly as possible and pass no data. Which is the lightest choice?",
        options: ["A queue of length 1", "A mutex", "vTaskNotifyGiveFromISR to that task's handle", "xEventGroupSetBitsFromISR"],
        answer: 2,
        why: "A direct task notification needs no separate object and is the fastest unblocking path. Event group setting from an ISR is deferred through the timer task, and a mutex must never be used from an ISR.",
      },
      {
        q: "A task calls a function that takes mutex M, and that function calls another that also takes M. With a normal mutex, what happens?",
        options: [
          "The second take succeeds because the task already owns it",
          "The task blocks forever on itself, a self-deadlock, unless a timeout is given",
          "The kernel raises the task's priority",
          "The mutex becomes a counting semaphore",
        ],
        answer: 1,
        why: "A normal mutex is not recursive. The second take waits for the owner, which is the waiting task itself. Use a recursive mutex or restructure the code.",
      },
    ],
  },

  "a5-inversion-deadlock-and-interrupts": {
    id: "a5-inversion-deadlock-and-interrupts",
    outcomes: [
      "Trace a priority inversion on a timeline and explain how priority inheritance bounds it",
      "State the four conditions for deadlock and break one of them by design",
      "Write an ISR that uses only FromISR APIs and hands its work to a task with portYIELD_FROM_ISR",
      "Decide which work belongs in an ISR and which belongs in a deferred handler task",
    ],
    blocks: [
      { t: "h", text: "Why these bugs are the dangerous ones" },
      { t: "p", text: "The bugs in this lesson do not show up in a quick test. Priority inversion needs three tasks to line up in one particular order; deadlock needs two tasks to take two locks in opposite orders within a few microseconds of each other; an ISR calling the wrong API may work for weeks before corrupting a kernel list. They appear in the field, rarely, and often as a watchdog reset with no obvious cause. The defence is not testing harder but designing so that they cannot happen, and that requires understanding exactly how each one arises." },

      { t: "h", text: "Priority inversion" },
      { t: "p", text: "Take three tasks on one core: **H** (high priority), **M** (medium) and **L** (low). H and L share a resource guarded by a lock; M has nothing to do with it. Now follow the sequence:" },
      { t: "list", ordered: true, items: [
        "L takes the lock and starts using the resource.",
        "H becomes Ready, pre-empts L, runs, and tries to take the lock. It is held, so H blocks. So far this is fine: H expected to wait for the short time L holds the lock.",
        "Before L can finish, M becomes Ready. M outranks L, so it pre-empts L. M runs for as long as it likes.",
        "H, the most urgent task in the system, is now waiting for L, which is waiting for M. H has effectively been demoted below M.",
      ] },
      { t: "diagram", text: String.raw`
 Without inheritance (binary semaphore as the lock):
 H  ......████ blocked on lock ......................................████
 M  ...............████████████████████████████████████████ (unbounded)
 L  ██████lock██                                            ███unlock
     t0   t1  t2                                            t3  t4
 With inheritance (mutex): at t1 L is raised to H's priority, so M cannot pre-empt it
 H  ......████ blocked ████ runs
 M  ...................   ███████████████████
 L  ██████lock██████unlock (at H's priority)`, caption: "Priority inversion. The time H waits is bounded only by how long M chooses to run, unless the lock holder inherits H's priority." },
      { t: "p", text: "Some blocking of H is unavoidable: if L holds the lock, H must wait until L releases it. That wait is bounded by the longest time L holds the lock, which you control by keeping critical code short. What makes inversion dangerous is the **unbounded** part: the time M runs, which has nothing to do with the lock and could be anything." },
      { t: "h", text: "Priority inheritance" },
      { t: "p", text: "**Priority inheritance** removes the unbounded part. When H blocks on a mutex held by L, the kernel raises L's priority to H's for as long as L holds the mutex. M can no longer pre-empt L; L finishes its critical section, gives the mutex, drops back to its own priority, and H runs. H's worst-case wait is now just the longest time any lower-priority task holds that mutex. FreeRTOS mutexes (`xSemaphoreCreateMutex`) do this automatically; binary semaphores do not, which is the strongest reason never to use a semaphore as a lock." },
      { t: "p", text: "Inheritance is a mitigation, not a cure. If L holds two mutexes, or H needs several in turn, the waits add up (a chain of blocking). The robust designs keep shared resources few, hold locks briefly, and, best of all, give each resource to one **owner task** that others talk to through a queue, so no lock is needed at all. A single I2C manager task that accepts requests on a queue cannot suffer inversion on the bus." },
      { t: "note", kind: "warn", text: "On the dual-core ESP32, inversion only happens among tasks that compete for the same core. If you want to demonstrate it on the bench, pin H, M and L all to core 1; otherwise M may simply run on the other core and the effect disappears, which is also why it can appear after an innocent-looking change of affinity." },

      { t: "h", text: "Deadlock" },
      { t: "p", text: "**Deadlock** is a cycle of waiting: task A holds lock 1 and waits for lock 2, while task B holds lock 2 and waits for lock 1. Neither can ever proceed. Coffman and colleagues showed in 1971 that deadlock requires four conditions at once:" },
      { t: "list", ordered: true, items: [
        "**Mutual exclusion**: a resource can be held by only one task.",
        "**Hold and wait**: a task holds one resource while waiting for another.",
        "**No pre-emption**: a resource cannot be taken away from its holder.",
        "**Circular wait**: there is a cycle of tasks, each waiting for a resource the next one holds.",
      ] },
      { t: "p", text: "Break any one and deadlock is impossible. In firmware the practical tools are: a **global lock order** (always take the SPI mutex before the SD mutex, everywhere; this breaks circular wait and is the most common fix); **taking with a timeout** and backing off (release everything held, wait a little, retry; this breaks hold and wait at the cost of complexity); and **owner tasks** that need no locks at all. A timeout on every `xSemaphoreTake` is good defensive practice anyway: a take that fails after 100 ms can log the name of the lock and the task, which turns a silent hang into a bug report." },
      { t: "snippet", lang: "cpp", code: String.raw`// The bug: two tasks take the same two mutexes in opposite orders.
void taskA(void *) { for (;;) {
  xSemaphoreTake(spiLock, portMAX_DELAY);
  xSemaphoreTake(sdLock,  portMAX_DELAY);   // A holds spi, waits for sd
  /* ... */ xSemaphoreGive(sdLock); xSemaphoreGive(spiLock); } }

void taskB(void *) { for (;;) {
  xSemaphoreTake(sdLock,  portMAX_DELAY);
  xSemaphoreTake(spiLock, portMAX_DELAY);   // B holds sd, waits for spi: deadlock
  /* ... */ xSemaphoreGive(spiLock); xSemaphoreGive(sdLock); } }

// The fix: one documented order, spiLock before sdLock, in every task.`, caption: "Fragment: a lock-order deadlock and its fix." },

      { t: "h", text: "Interrupts with an RTOS" },
      { t: "p", text: "Everything from i6 about ISRs still applies: keep them short, mark them `IRAM_ATTR` on the ESP32, use `volatile` and critical sections for shared variables. An RTOS adds one strict rule: **an ISR may call only the API functions whose names end in FromISR** (plus a few documented as ISR-safe). The normal functions may try to block, which is meaningless in an ISR, and they may switch context in the middle of the interrupt, which corrupts the kernel. The FromISR versions never block and never switch; instead they tell you whether a switch is needed." },
      { t: "p", text: "That is the job of the `pxHigherPriorityTaskWoken` argument. You set a local `BaseType_t` to `pdFALSE`, pass its address to each FromISR call, and the kernel sets it to `pdTRUE` if the call unblocked a task with a higher priority than the one that was interrupted. At the end of the ISR you call `portYIELD_FROM_ISR(woken)`. If woken is true, the interrupt returns straight into the newly woken task rather than to the interrupted one. Without this, the woken task waits until the next tick, adding up to 1 ms of latency at 1000 Hz (or 10 ms at 100 Hz)." },
      { t: "h", text: "Deferred processing" },
      { t: "p", text: "The pattern that follows is called **deferred interrupt processing**. The ISR does only what must happen at once: read the hardware register that clears the interrupt, capture a timestamp, copy a byte out of a FIFO. It then notifies a **handler task** and returns. The handler task does the rest (parsing, debouncing, filtering, printing) in task context, where it can block, use any API, and be pre-empted by more urgent tasks. Give the handler a high priority so it runs immediately after the ISR, unless something more urgent is running." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.3.x. Deferred interrupt processing:
// the ISR on GPIO 0 (BOOT button) only records a time and notifies a task.
const int BUTTON_PIN = 0;
TaskHandle_t buttonTaskHandle = NULL;
volatile uint32_t pressMicros = 0;

void IRAM_ATTR onButton() {
  pressMicros = micros();
  BaseType_t woken = pdFALSE;
  vTaskNotifyGiveFromISR(buttonTaskHandle, &woken);
  portYIELD_FROM_ISR(woken);       // switch straight to the handler if it outranks the interrupted task
}

void buttonTask(void *) {
  uint32_t lastAccepted = 0;
  for (;;) {
    uint32_t n = ulTaskNotifyTake(pdTRUE, portMAX_DELAY);   // sleeps until the ISR gives
    uint32_t t = pressMicros;
    if (t - lastAccepted < 50000) continue;                   // 50 ms debounce, done in task context
    lastAccepted = t;
    Serial.printf("press at %lu us (%lu edges since last wake)\n",
                  (unsigned long)t, (unsigned long)n);
  }
}

void setup() {
  Serial.begin(115200);
  xTaskCreatePinnedToCore(buttonTask, "button", 3072, NULL, 5, &buttonTaskHandle, 1);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButton, FALLING);
}

void loop() { vTaskDelete(NULL); }`, caption: "ESP32 DevKit, Arduino-ESP32 3.3.10. The task is created before the interrupt is attached, so the handle is never NULL inside the ISR. Compiled for esp32:esp32:esp32." },
      { t: "p", text: "Read the count that `ulTaskNotifyTake` returns. Because the notification acts as a counting semaphore, a burst of bounce edges that arrive while the task is busy are not lost; they show up as n > 1, and the task decides what to do with them. With a binary semaphore, extra gives while it is already given are simply dropped, which is right for 'data is ready' and wrong for 'count these pulses'." },
      { t: "table", head: ["Do in the ISR", "Defer to a task"], rows: [
        ["clear the interrupt flag", "parse a protocol frame"],
        ["read a FIFO or capture register before it is overwritten", "debounce, filter, average"],
        ["take a timestamp", "print, log, write to flash"],
        ["give a notification, semaphore or queue item (FromISR)", "take a mutex, use I2C or SPI drivers"],
        ["set a GPIO for a hard real-time response", "anything that might block or take more than a few µs"],
      ], caption: "Dividing interrupt work." },
      { t: "p", text: "ESP-IDF adds a few rules of its own. ISRs that must run while flash is being written need `IRAM_ATTR` and must touch only IRAM and DRAM. Interrupts at priority levels above the level FreeRTOS reserves for itself (`configMAX_SYSCALL_INTERRUPT_PRIORITY`, which on the ESP32 port is level 3) must not call any FreeRTOS function, even FromISR ones; the Arduino `attachInterrupt()` and the normal `esp_intr_alloc()` flags give you a level-1 to level-3 interrupt where the FromISR calls are allowed." },

      { t: "deep", title: "What really happened on Mars Pathfinder", blocks: [
        { t: "p", text: "Mars Pathfinder landed on 4 July 1997 and, a few days into surface operations, began resetting itself, losing a day's data each time. The flight computer ran the VxWorks RTOS. Glenn Reeves, who led the flight software team at JPL, later described the cause in a widely circulated email reply to a summary of the incident." },
        { t: "p", text: "The spacecraft used an 'information bus', a shared memory area guarded by a mutex-like semaphore, through which tasks passed data. A high-priority bus management task (`bc_dist`) used it frequently. A low-priority meteorological data task (ASI/MET) used it occasionally, through VxWorks' `select()` and pipe mechanism. Several medium-priority communication tasks had nothing to do with the bus. Exactly the H, M, L sequence of this lesson happened: ASI/MET took the semaphore, `bc_dist` blocked on it, and medium-priority tasks pre-empted ASI/MET for long enough that a still higher-priority scheduling task (`bc_sched`) found that `bc_dist` had not finished its cycle. `bc_sched` treated that as a serious fault and reset the whole system." },
        { t: "p", text: "The VxWorks semaphore had a priority inheritance option, but it was turned off for the semaphore used inside `select()`. The team reproduced the reset on a ground replica in under a day using the trace data VxWorks had been configured to keep, worked out that enabling the inheritance flag would fix it, and uploaded a small patch that changed the semaphore's creation flag to enable it. The resets stopped." },
        { t: "p", text: "Three lessons professionals take from it. First, inversion is a design error that only shows under particular timing, which pre-launch testing had in fact seen once and dismissed as a glitch. Second, the watchdog-style check did its job: a hang became a reset, and the spacecraft survived. Third, leaving tracing enabled in flight software is what made a remote diagnosis possible; you will set up tracing in the last lesson of this module." },
      ] },
      { t: "deep", title: "Priority ceiling, and bounding blocking time", blocks: [
        { t: "p", text: "Basic priority inheritance still allows **chained blocking** (H waits for L1 on one mutex, then for L2 on another) and does not prevent deadlock. The **priority ceiling protocol** goes further: each mutex is given a ceiling equal to the highest priority of any task that ever uses it, and a task may take a mutex only if its priority is higher than the ceilings of all mutexes currently held by other tasks. The result, proved by Sha, Rajkumar and Lehoczky in 1990, is that a task can be blocked by at most one lower-priority critical section, and deadlock through those mutexes is impossible." },
        { t: "p", text: "A simpler variant, the **immediate ceiling** protocol (also called the highest locker protocol), raises a task to the mutex's ceiling as soon as it takes the mutex, not only when someone waits. FreeRTOS does not implement either, but you can emulate the immediate ceiling with `vTaskPrioritySet()` around a critical region, or achieve the same bound by giving the resource to an owner task whose priority equals the ceiling." },
        { t: "p", text: "For schedulability analysis in lesson 5, the result that matters is the **blocking term** B_i: the longest time task i can be held up by lower-priority tasks. Under priority inheritance, B_i is at most the sum, over each mutex task i uses, of the longest critical section of any lower-priority task on that mutex. Under a ceiling protocol it is just the single longest such section. Either way, keeping critical sections short directly shortens every high-priority task's worst-case response." },
      ] },
    ],
    mistakes: [
      "**Using a binary semaphore as a lock.** It never inherits priority, so the inversion is unbounded.",
      "**Calling xQueueSend or xSemaphoreGive in an ISR.** Use the FromISR versions; the normal ones may block or switch context inside the interrupt.",
      "**Forgetting portYIELD_FROM_ISR.** The woken task then waits until the next tick, adding up to a full tick period of latency.",
      "**Attaching the interrupt before creating the handler task.** The ISR then notifies a NULL handle and the chip crashes.",
      "**Taking locks in different orders in different tasks.** Document one global order and follow it everywhere.",
      "**Doing the whole job in the ISR.** Printing, I2C or floating-point filtering inside an ISR raises latency for every other interrupt; defer it.",
    ],
    practice: {
      kind: "bench",
      task: "Reproduce priority inversion on an ESP32 and then remove it.",
      steps: [
        "Create three tasks all pinned to core 1: L (priority 1), M (priority 2) and H (priority 3), sharing a lock created with `xSemaphoreCreateBinary()` followed by one `xSemaphoreGive()`.",
        "L takes the lock and busy-waits 50 ms inside it. H wakes 10 ms after L starts and takes the lock. M wakes 20 ms after L starts and busy-waits 200 ms with no lock. Toggle a separate GPIO in each task while it runs (for example GPIO 25, 26 and 27).",
        "Capture the three GPIOs on a logic analyser. Measure how long H waits for the lock. It should be about 240 ms: from H's arrival at 10 ms, M runs from 20 ms to 220 ms, then L needs its remaining 30 ms, so H gets the lock at 250 ms.",
        "Replace the lock with `xSemaphoreCreateMutex()` and capture again. H should now wait only the remaining 40 ms, because L inherits H's priority and M cannot pre-empt it.",
        "Move M to core 0 with the binary semaphore and observe that the inversion vanishes. Write one paragraph on why this makes the bug easy to miss.",
      ],
    },
    quiz: [
      {
        q: "In a priority inversion, which part of the high-priority task's wait is unbounded?",
        options: [
          "The time the low-priority task holds the lock",
          "The time a medium-priority task, unrelated to the lock, runs while pre-empting the lock holder",
          "The context-switch time",
          "The tick period",
        ],
        answer: 1,
        why: "Waiting for L's critical section is expected and bounded. Waiting for M, which can run for any length of time, is the inversion. Inheritance removes it.",
      },
      {
        q: "Task L holds a FreeRTOS mutex. Task H (priority 4) blocks on it. L's own priority is 1. What priority does L run at until it gives the mutex?",
        options: ["1", "2", "4", "configMAX_PRIORITIES - 1"],
        answer: 2,
        why: "With priority inheritance the holder is raised to the priority of the highest-priority task waiting for the mutex, here 4, and drops back to 1 when it gives it.",
      },
      {
        q: "Two tasks deadlock because one takes lockA then lockB and the other takes lockB then lockA. Which of the four deadlock conditions does a single global lock order remove?",
        options: ["Mutual exclusion", "Hold and wait", "No pre-emption", "Circular wait"],
        answer: 3,
        why: "If every task takes locks in the same order, no cycle of waiting can form. The other three conditions still hold, but all four are needed for deadlock.",
      },
      {
        q: "An ISR gives a notification to a priority 5 task while a priority 2 task was running. The ISR does not call portYIELD_FROM_ISR. With a 1000 Hz tick, what is the worst extra delay before the priority 5 task runs?",
        options: ["None: it runs immediately anyway", "Up to about 1 ms, until the next tick or other scheduling point", "Up to 10 ms", "It never runs"],
        answer: 1,
        why: "Without the yield, the interrupt returns to the priority 2 task. The switch happens at the next scheduling point, at the latest the next tick, 1 ms later at 1000 Hz.",
      },
      {
        q: "Which of these should an ISR do itself rather than defer?",
        options: [
          "Parse a complete NMEA sentence from a GPS",
          "Print the received byte to Serial",
          "Read the byte out of the UART FIFO before the next one overwrites it, and notify a task",
          "Take the I2C mutex and read a sensor",
        ],
        answer: 2,
        why: "Only the time-critical hardware step belongs in the ISR. Parsing, printing and anything with a mutex go to a handler task.",
      },
    ],
  },

  "a5-memory-stacks-and-heaps": {
    id: "a5-memory-stacks-and-heaps",
    outcomes: [
      "Describe the five FreeRTOS heap schemes and choose one for a given product",
      "Explain how ESP-IDF's capability-based heap differs, and allocate DMA-capable or internal memory on purpose",
      "Size a task stack from a measured high-water mark with a stated margin",
      "Recognise stack overflow and heap fragmentation from their symptoms",
    ],
    blocks: [
      { t: "h", text: "Why memory is the first thing to fail" },
      { t: "p", text: "A super-loop has one stack and a fixed set of globals, and the linker tells you at build time whether they fit. An RTOS changes that. Every task has its own stack, carved from RAM when the task is created; every queue, semaphore and timer is allocated too. None of that appears in the 'global variables use N bytes' line from the compiler. A stack that is 200 bytes too small works until the one code path that calls `printf` with a float from inside a deeply nested function, and then it silently overwrites whatever lies beyond it. Most mysterious RTOS crashes are memory bugs, and the defence is measurement, not guesswork." },

      { t: "h", text: "Static and dynamic allocation" },
      { t: "p", text: "FreeRTOS can create every object in two ways. The ordinary functions (`xTaskCreate`, `xQueueCreate`) allocate the TCB, stack or storage from the **kernel heap** with `pvPortMalloc()`. The static variants (`xTaskCreateStatic`, `xQueueCreateStatic`, `xSemaphoreCreateMutexStatic`) take buffers that you declare yourself, usually as globals, so the linker accounts for them and nothing can fail at run time. Safety-critical firmware often uses static allocation only, or allocates everything once at start-up and never frees, which removes fragmentation from the list of things that can go wrong." },

      { t: "h", text: "The five FreeRTOS heap schemes" },
      { t: "p", text: "In vanilla FreeRTOS you pick the heap implementation by compiling exactly one of five files, `heap_1.c` to `heap_5.c`. Each manages a single array (or several, for heap_5) sized by `configTOTAL_HEAP_SIZE`." },
      { t: "table", head: ["Scheme", "Can free?", "Strategy", "When to use"], rows: [
        ["heap_1", "no", "bump pointer: each allocation takes the next bytes", "objects created once at start-up and never deleted; deterministic and tiny"],
        ["heap_2", "yes", "best fit, no merging of neighbouring free blocks", "legacy; fragments if sizes vary. Superseded by heap_4"],
        ["heap_3", "yes", "wraps the C library malloc() and free() with the scheduler suspended", "when you must share one heap with library code; not deterministic"],
        ["heap_4", "yes", "first fit, merges adjacent free blocks (coalescing)", "the usual default when tasks or buffers are created and deleted"],
        ["heap_5", "yes", "heap_4 across several non-contiguous regions", "boards with internal RAM plus external RAM, set up with vPortDefineHeapRegions()"],
      ], caption: "FreeRTOS heap implementations (freertos.org memory management page)." },
      { t: "p", text: "Two numbers describe heap health: **free bytes now** (`xPortGetFreeHeapSize()`) and the **minimum ever free** (`xPortGetMinimumEverFreeHeapSize()`), the low-water mark since boot. The minimum tells you how close you have come to running out; a device that has run a week with a minimum of 30 KB free has evidence of margin." },

      { t: "h", text: "The ESP-IDF heap: capabilities, not schemes" },
      { t: "p", text: "ESP-IDF does not use heap_1 to heap_5. The ESP32's RAM is not one uniform block: some is internal SRAM that the DMA engines can reach, some can hold executable code (IRAM), some is the RTC memory that survives deep sleep, and a board may add external PSRAM over SPI, which is slower and not DMA-capable on the original ESP32. ESP-IDF therefore manages several regions, each tagged with **capabilities**, and `malloc()`, `pvPortMalloc()` and the FreeRTOS create functions all draw from the same capability-aware allocator (in ESP-IDF v5 each region is managed by a TLSF allocator, which allocates in constant time)." },
      { t: "snippet", lang: "c", code: String.raw`#include <esp_heap_caps.h>
void  *heap_caps_malloc(size_t size, uint32_t caps);
void   heap_caps_free(void *ptr);                       // plain free() also works
size_t heap_caps_get_free_size(uint32_t caps);
size_t heap_caps_get_minimum_free_size(uint32_t caps);  // low-water mark since boot
size_t heap_caps_get_largest_free_block(uint32_t caps); // biggest single allocation possible now

// Common capability flags (combine with |):
// MALLOC_CAP_8BIT      byte-addressable data memory (what malloc() returns)
// MALLOC_CAP_32BIT     32-bit aligned access only is fine (includes some IRAM)
// MALLOC_CAP_DMA       reachable by DMA: SPI, I2S and similar buffers
// MALLOC_CAP_INTERNAL  internal SRAM, usable while the flash cache is disabled
// MALLOC_CAP_SPIRAM    external PSRAM, if the board has it`, caption: "ESP-IDF v5.5 heap capabilities API." },
      { t: "p", text: "The practical consequences: a buffer handed to the SPI or I2S driver for DMA must be allocated with `MALLOC_CAP_DMA` (a buffer from PSRAM on the original ESP32 will fail or be copied). Data that an IRAM ISR reads while flash is busy must be in internal RAM. And a large but non-critical buffer (a camera frame, a web page) belongs in PSRAM if there is any, leaving internal RAM for stacks and drivers." },

      { t: "h", text: "Fragmentation" },
      { t: "p", text: "Free memory is useless if it is in pieces too small for the request. **Worked example.** A device has 100 KB of heap free. It repeatedly allocates a 30 KB HTTP buffer, then several 2 KB JSON fragments, then frees the 30 KB buffer but keeps some fragments alive. After a few hours, the free memory is still about 100 KB, but it is spread across holes between the long-lived fragments, and `heap_caps_get_largest_free_block(MALLOC_CAP_8BIT)` reports 20 KB. The next 30 KB request fails, although 'there is plenty free'. The fixes are design choices: allocate long-lived objects first and never free them; use fixed-size pools for things that come and go; and log the largest free block alongside the free total, so you see fragmentation building up before it causes a failure." },

      { t: "h", text: "How big should a task stack be?" },
      { t: "p", text: "A task's stack must hold its deepest chain of function calls, all their local variables, and the register frame saved when it is pre-empted. You cannot easily compute that by hand once library calls are involved (`printf` alone may use one to two kilobytes on the ESP32), so you **measure**. When a task is created, FreeRTOS fills its stack with a known byte pattern (0xA5). As the task runs, it overwrites the pattern. `uxTaskGetStackHighWaterMark(handle)` scans from the far end and reports how much has **never** been touched: the minimum free stack since the task started. In ESP-IDF that figure is in bytes; in vanilla FreeRTOS it is in words." },
      { t: "list", ordered: true, items: [
        "Give the task a generous stack, for example 4096 bytes.",
        "Exercise every code path, especially the error paths and the deepest one (logging, formatting floats, reconnecting Wi-Fi).",
        "Read the high-water mark. Used = allocated - high-water mark.",
        "Set the stack to used plus a margin, usually 25% to 50%, rounded up, and keep the high-water mark in your telemetry so a future change that eats the margin is noticed.",
      ] },
      { t: "p", text: "**Worked example.** A task created with 4096 bytes reports a high-water mark of 2440 bytes after a full test run. It used 4096 - 2440 = 1656 bytes. With a 40% margin: 1656 × 1.4 ≈ 2318 bytes; round up to 2560. Check: at 2560 bytes the expected high-water mark is 2560 - 1656 = 904 bytes, which is 35% of the stack still free, comfortably above zero. Across ten tasks, trimming each from 4096 to its measured size can return 15 KB or more of RAM." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.3.x. Measure stack use and heap health.
#include <esp_heap_caps.h>

TaskHandle_t workerHandle;

void worker(void *) {
  for (;;) {
    char scratch[600];                       // deliberately large local buffer
    snprintf(scratch, sizeof scratch, "tick %lu", (unsigned long)xTaskGetTickCount());
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  Serial.begin(115200);
  xTaskCreatePinnedToCore(worker, "worker", 3072, NULL, 1, &workerHandle, 1);
}

void loop() {
  // In ESP-IDF the high-water mark is in BYTES (vanilla FreeRTOS: words).
  Serial.printf("worker stack never-used: %u bytes of 3072\n",
                (unsigned)uxTaskGetStackHighWaterMark(workerHandle));
  Serial.printf("loopTask stack never-used: %u bytes\n",
                (unsigned)uxTaskGetStackHighWaterMark(NULL));
  Serial.printf("8-bit heap: free %u, minimum ever %u, largest block %u\n",
                (unsigned)heap_caps_get_free_size(MALLOC_CAP_8BIT),
                (unsigned)heap_caps_get_minimum_free_size(MALLOC_CAP_8BIT),
                (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  Serial.printf("DMA-capable internal free %u\n",
                (unsigned)heap_caps_get_free_size(MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL));
  delay(2000);
}`, caption: "ESP32 DevKit, Arduino-ESP32 3.3.10. Compiled for esp32:esp32:esp32." },

      { t: "h", text: "When a stack overflows anyway" },
      { t: "p", text: "The Arduino-ESP32 build enables FreeRTOS stack overflow checking in its 'canary' form (`CONFIG_FREERTOS_CHECK_STACKOVERFLOW_CANARY`): on every context switch the kernel checks that the last bytes of the outgoing task's stack still hold the fill pattern. If not, it stops with a message like `***ERROR*** A stack overflow in task worker has been detected.` followed by a backtrace. The check is cheap but not exhaustive: an overflow that jumps right over the canary (a large local array) or that corrupts memory and crashes before the next switch is not caught. ESP-IDF also offers a hardware watchpoint on the end of the stack (`CONFIG_FREERTOS_WATCHPOINT_END_OF_STACK`), which catches the moment of overflow exactly, at the cost of one of the two debug watchpoints." },
      { t: "note", kind: "tip", text: "A large array as a local variable lives on the task stack. If a task needs a 2 KB buffer, make it static or allocate it once at task start, and keep the stack for call frames." },

      { t: "deep", title: "How heap_4 finds and merges blocks", blocks: [
        { t: "p", text: "heap_4 keeps a singly linked list of free blocks in address order. Each block starts with a small header holding the block size and a pointer to the next free block. An allocation walks the list and takes the **first** block big enough (first fit); if the remainder is larger than a minimum size, it splits it off as a new free block. Each allocation is rounded up to the port's alignment (8 bytes on most 32-bit ports) plus the header, so many tiny allocations waste a noticeable fraction of the heap in headers." },
        { t: "p", text: "Freeing inserts the block back into the address-ordered list and checks its neighbours: if the block immediately before or after is also free, they are merged into one. That coalescing is what heap_2 lacks, and why heap_2 fragments under variable-size workloads. Even with coalescing, fragmentation remains possible whenever long-lived blocks sit between free ones, as in the lesson's example." },
        { t: "p", text: "heap_4's time per call depends on the length of the free list, so it is not strictly deterministic. TLSF (two-level segregated fit), which ESP-IDF v5 uses inside each region, keeps free blocks in a two-level array of lists indexed by size class, found with two bit-scan instructions, so allocate and free run in bounded constant time. That property is what real-time systems actually want from an allocator." },
      ] },
      { t: "deep", title: "Where the ESP32's RAM goes", blocks: [
        { t: "p", text: "The ESP32 has 520 KB of internal SRAM, split into SRAM0 (192 KB), SRAM1 (128 KB) and SRAM2 (200 KB), plus 8 KB of RTC fast memory and 8 KB of RTC slow memory. Part of SRAM0 is used as the flash cache and as IRAM for code that must run from RAM; part of the data RAM is taken by the ROM's own data, by your global variables (`.data` and `.bss`), and by static buffers of the Wi-Fi and Bluetooth stacks. Whatever is left, in several separate regions, becomes the heap." },
        { t: "p", text: "That is why the free heap reported at boot is much smaller than 520 KB, and why it drops sharply (by tens of kilobytes) the moment you call `WiFi.begin()`: the Wi-Fi driver allocates its buffers then. Run the measurement sketch once without Wi-Fi and once with it, and record both figures; that difference is your Wi-Fi budget." },
        { t: "p", text: "The `idf.py size-components` command in ESP-IDF, or reading the `.map` file from an Arduino build folder, shows which libraries account for static RAM. On constrained designs, moving a large constant table into flash (`const` arrays stay in flash on the ESP32 automatically) is often the cheapest win." },
      ] },
    ],
    mistakes: [
      "**Sizing stacks from the vanilla FreeRTOS demos.** Those numbers are in words and written for small Cortex-M tasks; ESP-IDF takes bytes and its library calls are larger.",
      "**Reading the high-water mark once at start-up.** It only reflects paths already run. Read it after the worst-case paths, and log it in the field.",
      "**Watching only total free heap.** Fragmentation shows in the largest free block, not the total.",
      "**Putting big buffers on the stack.** A 1 KB local array needs 1 KB of stack in every task that calls the function.",
      "**Using PSRAM or plain malloc for DMA buffers.** Allocate them with MALLOC_CAP_DMA.",
    ],
    practice: {
      kind: "bench",
      task: "Measure and right-size every task in a small multi-task program.",
      steps: [
        "Upload the measurement sketch to an ESP32 DevKit. Record the worker's high-water mark and calculate how many bytes it really uses.",
        "Increase the scratch array to 2600 bytes and run again. Watch for the stack overflow message and note the task name it reports.",
        "Return to 600 bytes and add a `Serial.printf(\"%f\", 3.14159)` inside the worker. How much more stack does formatting a float cost?",
        "Add `WiFi.mode(WIFI_STA); WiFi.begin(\"x\", \"y\");` in setup (it does not need to connect) and compare the free heap and largest free block before and after.",
        "Size the worker's stack with a 40% margin from your measurement, rebuild, and confirm the high-water mark stays above 25% of the stack.",
      ],
    },
    quiz: [
      {
        q: "A task created with 3072 bytes of stack on an ESP32 reports a high-water mark of 1800. How many bytes has it used at most, and is that a problem?",
        options: [
          "1800 bytes; it is close to full",
          "1272 bytes; no, 1800 bytes (59%) has never been touched",
          "3072 bytes; it has overflowed",
          "1800 words; it is fine",
        ],
        answer: 1,
        why: "The high-water mark is the never-used part, in bytes on ESP-IDF. Used = 3072 - 1800 = 1272 bytes, leaving a large margin.",
      },
      {
        q: "Firmware creates all its tasks and queues at start-up and never deletes anything. Which vanilla FreeRTOS heap scheme is simplest and fully deterministic?",
        options: ["heap_1", "heap_2", "heap_3", "heap_5"],
        answer: 0,
        why: "heap_1 cannot free, but if nothing is ever freed it does not need to. Each allocation is just a pointer bump.",
      },
      {
        q: "The free heap is 90 KB, but a 40 KB allocation fails. What is the most likely cause?",
        options: [
          "A stack overflow",
          "Fragmentation: the largest contiguous free block is smaller than 40 KB",
          "The heap is in words, so only 22.5 KB is free",
          "The tick rate is too low",
        ],
        answer: 1,
        why: "Free memory split into small holes cannot satisfy a large request. heap_caps_get_largest_free_block would show it.",
      },
      {
        q: "You need a buffer for SPI DMA transfers on the ESP32. Which allocation is right?",
        options: [
          "A local array in the task",
          "heap_caps_malloc(size, MALLOC_CAP_SPIRAM)",
          "heap_caps_malloc(size, MALLOC_CAP_DMA)",
          "pvPortMalloc with heap_2",
        ],
        answer: 2,
        why: "Only memory tagged with the DMA capability is reachable by the ESP32's DMA engines. PSRAM on the original ESP32 is not.",
      },
      {
        q: "A task used at most 1656 bytes of stack in testing. You want a 40% margin. Which stack size is the sensible choice?",
        options: ["1656 bytes", "2048 bytes", "2560 bytes", "16 KB"],
        answer: 2,
        why: "1656 × 1.4 ≈ 2318, rounded up to 2560. 2048 gives only about 24% margin; 16 KB wastes RAM.",
      },
    ],
  },

  "a5-schedulability-and-tracing": {
    id: "a5-schedulability-and-tracing",
    outcomes: [
      "Compute processor utilisation and apply the Liu and Layland bound to a periodic task set",
      "Assign rate-monotonic priorities and state what the bound does and does not prove",
      "Measure per-task CPU time with vTaskGetRunTimeStats and compare it with the analysis",
      "Produce a task diagram and timing analysis for a multi-task firmware",
    ],
    blocks: [
      { t: "h", text: "Why analyse instead of test" },
      { t: "p", text: "Testing shows that deadlines were met in the cases you happened to run. A real-time system must meet them in the worst case: every task released at the same instant, every task taking its longest path. That alignment may occur once a week in the field and never on the bench. **Schedulability analysis** turns the question 'will every deadline be met?' into arithmetic on a few numbers per task, so you can answer it before the firmware exists and check it again whenever a task changes." },

      { t: "h", text: "The task model" },
      { t: "p", text: "Describe each periodic task i by three numbers:" },
      { t: "list", items: [
        "**C_i**, the worst-case execution time (WCET): the longest the task's body can run, uninterrupted, for one release.",
        "**T_i**, the period: the time between releases.",
        "**D_i**, the deadline: how long after release it must finish. In the simplest model D_i = T_i: each job must finish before the next one is released.",
      ] },
      { t: "p", text: "The analysis also assumes the tasks are independent (no blocking on each other's locks), run on one core, and that context-switch cost is either negligible or folded into C. Each of those assumptions can be relaxed, and the deep sections show how." },
      { t: "formula", text: String.raw`U_i = C_i / T_i           (fraction of the core task i needs)
U   = Σ C_i / T_i         (total utilisation)
U > 1  →  impossible on one core, whatever the priorities`, caption: "Utilisation." },

      { t: "h", text: "Rate-monotonic priorities" },
      { t: "p", text: "**Rate-monotonic scheduling** (RMS) assigns fixed priorities by period: the shorter the period, the higher the priority. Liu and Layland proved in 1973 that, for independent periodic tasks with D = T on one processor, RMS is **optimal among fixed-priority schemes**: if any fixed-priority assignment meets all deadlines, rate-monotonic does too. (When deadlines are shorter than periods, the optimal order is by deadline instead, called deadline-monotonic.) So the priority rule from lesson 1 is not folklore; it is a theorem, provided its assumptions hold." },

      { t: "h", text: "The Liu and Layland bound" },
      { t: "p", text: "They also gave a simple test. A set of n tasks is guaranteed schedulable under RMS if:" },
      { t: "formula", text: String.raw`U ≤ n × (2^(1/n) - 1)

n = 1   bound = 1.000
n = 2   bound = 0.828
n = 3   bound = 0.780
n = 4   bound = 0.757
n → ∞   bound → ln 2 ≈ 0.693`, caption: "Liu and Layland utilisation bound for rate-monotonic scheduling." },
      { t: "p", text: "The bound is **sufficient but not necessary**. If U is at or below it, every deadline is met, no further work needed. If U is above it but at most 1, the test says nothing: the set may or may not be schedulable, and you need the exact response-time analysis (in the deep section) to decide. Many real task sets with U around 0.85 to 0.9 pass the exact test, especially when periods are harmonic (each a multiple of the shorter ones)." },

      { t: "h", text: "Worked example" },
      { t: "p", text: "A data logger on core 1 runs three tasks, priorities assigned rate-monotonically:" },
      { t: "table", head: ["Task", "C (ms)", "T = D (ms)", "U = C/T", "RM priority"], rows: [
        ["control", "2", "10", "0.200", "3 (highest)"],
        ["filter", "4", "20", "0.200", "2"],
        ["logger", "10", "40", "0.250", "1"],
        ["total", "", "", "0.650", ""],
      ], caption: "A three-task set." },
      { t: "formula", text: String.raw`U = 2/10 + 4/20 + 10/40 = 0.200 + 0.200 + 0.250 = 0.650
bound(3) = 3 × (2^(1/3) - 1) = 3 × (1.2599 - 1) = 0.780
0.650 ≤ 0.780  →  schedulable under RMS`, caption: "The bound settles it." },
      { t: "p", text: "Check by simulating the worst case by hand: release all three at t = 0. Control runs 0 to 2. Filter runs 2 to 6. Logger runs 6 to 10, is pre-empted by control at 10 (runs 10 to 12), resumes 12 to 18, finishing its 10 ms at t = 18, well before its 40 ms deadline. Filter's second job is released at 20 and control's third at 20 too: control runs 20 to 22, filter 22 to 26, both inside their deadlines. Every first job finishes in time, and since the worst case for fixed priorities is the simultaneous release, the set is safe." },
      { t: "p", text: "Now suppose a feature doubles the logger's work to C = 20 ms. U becomes 0.200 + 0.200 + 0.500 = 0.900, above the 0.780 bound. The bound can no longer promise anything, and you must run the exact test or measure. That is the normal use of the bound in practice: a quick screen at design time, with the exact analysis for sets that fail it." },

      { t: "h", text: "Getting C: measure the worst-case execution time" },
      { t: "p", text: "The analysis is only as good as the C values. On a cached processor like the ESP32 you cannot reliably compute WCET from the code, so you measure: record `esp_timer_get_time()` (microseconds since boot) at the start and end of each job, keep the maximum, and run the worst inputs you can construct (cache cold after a flash write, longest message, every error branch). Add a safety margin, often 20% or more, for paths you did not hit. Toggling a GPIO at job start and end and watching it on a logic analyser gives the same number with no software overhead, and shows pre-emption directly." },

      { t: "h", text: "Run-time statistics" },
      { t: "p", text: "FreeRTOS can account the CPU time each task actually uses. The Arduino-ESP32 3.3 build enables everything needed (`CONFIG_FREERTOS_GENERATE_RUN_TIME_STATS`, `CONFIG_FREERTOS_USE_TRACE_FACILITY`, `CONFIG_FREERTOS_USE_STATS_FORMATTING_FUNCTIONS`, with the counter driven by `esp_timer` in microseconds). `vTaskGetRunTimeStats(buffer)` writes a table of each task's accumulated run time and its percentage of the total since boot; `vTaskList(buffer)` writes each task's state, priority, stack high-water mark, number and core. In ESP-IDF's FreeRTOS each percentage is the task's run time divided by the elapsed wall-clock time, not by the combined time of both cores, so a task that uses all of one core shows about 100% and the column adds up to about 200%. The counter is a 32-bit count of microseconds in this build, so it wraps after about 71.6 minutes (2^32 µs); read the statistics before then, or compare two snapshots taken a known time apart." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 3.3.x. Print per-task CPU use and state.
// Needs CONFIG_FREERTOS_GENERATE_RUN_TIME_STATS, USE_TRACE_FACILITY and
// USE_STATS_FORMATTING_FUNCTIONS, all enabled in the Arduino-ESP32 3.3 build.
static char report[1024];

void busy(void *arg) {
  const uint32_t workUs = (uint32_t)(uintptr_t)arg;
  TickType_t last = xTaskGetTickCount();
  for (;;) {
    uint32_t start = micros();
    while (micros() - start < workUs) { }            // simulated computation
    vTaskDelayUntil(&last, pdMS_TO_TICKS(10));
  }
}

void setup() {
  Serial.begin(115200);
  xTaskCreatePinnedToCore(busy, "ctrl", 2048, (void *)2000, 4, NULL, 1);  // 2 ms every 10 ms
  xTaskCreatePinnedToCore(busy, "dsp",  2048, (void *)4000, 3, NULL, 1);  // 4 ms every 10 ms
}

void loop() {
  delay(5000);
  vTaskGetRunTimeStats(report);      // name, absolute time (us), percentage
  Serial.println("Task            Abs time      %");
  Serial.print(report);
  vTaskList(report);                 // name, state, priority, stack high-water mark, number, core
  Serial.println("Task          State Prio Stack Num Core");
  Serial.print(report);
}`, caption: "ESP32 DevKit, Arduino-ESP32 3.3.10. Compiled for esp32:esp32:esp32. Size the buffer for about 50 bytes per task." },
      { t: "p", text: "Predict before you run it. On core 1, ctrl needs 2/10 = 20% and dsp 4/10 = 40%, so ctrl should show about 20% and dsp about 40%, because each percentage is of elapsed time. Core 1's idle task (IDLE1) takes most of the remaining 40%, and IDLE0 takes nearly 100%, since core 0 is almost idle; the column therefore sums to about 200%. If dsp shows much more than predicted, its C is larger than you thought (perhaps it was pre-empted by an interrupt storm that the busy-wait counted as its own time). That comparison of analysis and measurement is the core of the exit project." },

      { t: "h", text: "Tracing" },
      { t: "p", text: "Statistics give averages; a **trace** gives the timeline: every context switch, every queue send and receive, every ISR entry and exit, timestamped. With it you can see an inversion happen, measure the response time of each job, and find the one late job in ten thousand. Two widely used tools work with ESP-IDF:" },
      { t: "list", items: [
        "**SEGGER SystemView**: ESP-IDF's application tracing component (`app_trace`) can stream SystemView events over JTAG or UART; you enable it in menuconfig under Component config, Application Level Tracing, and view the result in SEGGER's free SystemView application. It needs an ESP-IDF project (or a custom Arduino build), not the precompiled Arduino core.",
        "**Percepio Tracealyzer**: records FreeRTOS events through the kernel's trace macros into a RAM buffer or a stream, with richer views (CPU load graphs, response-time histograms). Commercial, with an academic licence.",
      ] },
      { t: "p", text: "Without either, a logic analyser is a perfectly good tracer: give each task a GPIO that it sets on entry and clears before blocking, and an 8-channel analyser shows the schedule directly. Use direct register writes (`GPIO.out_w1ts` and `GPIO.out_w1tc`) rather than `digitalWrite` if you need the probe effect to be well under a microsecond." },

      { t: "h", text: "Exit project: multi-task firmware with timing analysis" },
      { t: "p", text: "Build firmware for the ESP32 DevKit with at least four tasks and one ISR, for example: a 1 kHz control task reading an encoder or an IMU, a 50 Hz filter, a 2 Hz display or telemetry task, and a button ISR with a deferred handler. Your deliverables:" },
      { t: "list", ordered: true, items: [
        "A **task diagram**: every task (name, priority, core, period, stack size), every ISR, and every queue, mutex, event group and notification drawn as arrows between them.",
        "A **timing table**: measured WCET, period, deadline and utilisation for each task on each core, with the Liu and Layland check per core, and the exact response-time result for any core that fails the bound.",
        "**Measurements**: run-time statistics after an hour (before the 71-minute counter wrap), high-water marks for every stack, minimum free heap and largest free block, and a logic-analyser capture of the worst case you could provoke.",
        "A one-page argument for why priority inversion and deadlock cannot occur, naming each shared resource and how it is protected.",
      ] },

      { t: "deep", title: "Response-time analysis: the exact test", blocks: [
        { t: "p", text: "For fixed priorities, the worst response time of task i occurs when it is released at the same instant as every higher-priority task (the **critical instant**). In the time R_i that task i takes to finish, each higher-priority task j is released ceil(R_i / T_j) times and runs for C_j each time. So R_i satisfies:" },
        { t: "formula", text: String.raw`R_i = C_i + B_i + Σ (over j with higher priority) ceil(R_i / T_j) × C_j

Solve by iteration: start with R = C_i + Σ C_j, recompute until R stops changing.
Schedulable  ⇔  R_i ≤ D_i for every task.`, caption: "Response-time analysis (Joseph and Pandya 1986; Audsley et al.). B_i is the blocking term from lesson 3; set it to 0 for independent tasks." },
        { t: "p", text: "Worked example with a set the bound cannot settle: τ1 (C = 3, T = 10), τ2 (C = 5, T = 20), τ3 (C = 12, T = 40), all times in ms. U = 0.30 + 0.25 + 0.30 = 0.85, above the 0.780 bound." },
        { t: "formula", text: String.raw`R1 = 3                                          ≤ 10  ✓
R2: start 3 + 5 = 8;  8 = 5 + ceil(8/10)×3 = 8   ≤ 20  ✓
R3: start 3 + 5 + 12 = 20
    R = 12 + ceil(20/10)×3 + ceil(20/20)×5 = 12 +  6 +  5 = 23
    R = 12 + ceil(23/10)×3 + ceil(23/20)×5 = 12 +  9 + 10 = 31
    R = 12 + ceil(31/10)×3 + ceil(31/20)×5 = 12 + 12 + 10 = 34
    R = 12 + ceil(34/10)×3 + ceil(34/20)×5 = 12 + 12 + 10 = 34   converged
R3 = 34                                         ≤ 40  ✓`, caption: "All three deadlines are met even though U = 0.85. Iteration checked with a short Python script." },
        { t: "snippet", lang: "python", code: String.raw`import math

def response_times(tasks):
    """tasks: list of (C, T) in priority order, highest first. Returns R for each, or None if R > T."""
    out = []
    for i, (c, t) in enumerate(tasks):
        r = c + sum(cj for cj, _ in tasks[:i])
        while True:
            nxt = c + sum(math.ceil(r / tj) * cj for cj, tj in tasks[:i])
            if nxt == r or nxt > t:
                break
            r = nxt
        out.append(nxt if nxt <= t else None)
    return out

print(response_times([(3, 10), (5, 20), (12, 40)]))   # [3, 8, 34]
print(response_times([(2, 10), (4, 20), (10, 40)]))   # [2, 6, 18]`, caption: "Response-time analysis in a dozen lines. Use it for your exit project." },
        { t: "p", text: "To include real overheads, add the context-switch cost twice to each C (one switch in, one out), add a jitter term if releases come from a timer ISR that may be late, and add interrupt handlers as if they were the highest-priority tasks. On the dual-core ESP32, analyse each core separately, which is exact only if every task in the analysis is pinned; unpinned tasks make the analysis much harder, which is a strong reason to pin real-time tasks." },
      ] },
      { t: "deep", title: "Deriving the two-task Liu and Layland bound", blocks: [
        { t: "p", text: "Take two tasks with T1 < T2 ≤ 2 T1 and priorities by rate. Choose C1 and C2 so that the set just fits (the processor is 'fully utilised': any increase in either C misses a deadline) and find the arrangement that minimises U. In the period T2, task 1 is released twice. If C1 is chosen so that its second job finishes exactly at T2 (C1 = T2 - T1), then task 2 gets the time T2 - 2 C1 and" },
        { t: "formula", text: String.raw`C1 = T2 - T1,  C2 = T2 - 2 C1 = 2 T1 - T2
U  = C1/T1 + C2/T2
Let r = T2/T1 (1 < r ≤ 2):   U = (r - 1) + (2 - r)/r = r + 2/r - 2
dU/dr = 1 - 2/r² = 0   →   r = √2
U_min = √2 + 2/√2 - 2 = 2√2 - 2 = 2 × (2^(1/2) - 1) ≈ 0.828`, caption: "The n = 2 case of n(2^(1/n) - 1)." },
        { t: "p", text: "The general proof follows the same idea for n tasks with period ratios chosen to minimise utilisation, giving ratios of 2^(1/n) between successive periods. The worst case arises with periods that are as far from harmonic as possible. With harmonic periods (10, 20, 40 ms, as in the lesson's first example), RMS is schedulable right up to U = 1, which is why designers choose harmonic periods when they can." },
        { t: "p", text: "Earliest deadline first (EDF), a dynamic-priority scheme in which the job with the nearest deadline always runs, is schedulable up to U = 1 for any periods with D = T. FreeRTOS does not provide EDF; it is common in research kernels and some safety-critical systems." },
      ] },
    ],
    mistakes: [
      "**Using average execution time as C.** The analysis needs the worst case; an average makes a set look schedulable that is not.",
      "**Treating a failed Liu and Layland test as unschedulable.** It is only a sufficient test; run response-time analysis.",
      "**Analysing both cores as one.** Utilisation and the bound apply per core, with tasks pinned.",
      "**Forgetting interrupts and blocking.** ISRs and lock-holding lower-priority tasks steal time from every task; include them.",
      "**Adding run-time percentages as if they shared one 100%.** On the dual-core ESP32 each is a share of elapsed time, so the column sums to about 200%, and the 32-bit microsecond counter wraps after about 71 minutes.",
      "**Measuring WCET with a warm cache and easy inputs.** Provoke the worst case on purpose and add margin.",
    ],
    practice: {
      kind: "bench",
      task: "Compare the predicted and measured CPU share of a task set, then push it past the bound.",
      steps: [
        "Upload the run-time statistics sketch. Predict each task's percentage first, then compare with the printed table after 30 s.",
        "Give each busy task a GPIO (for example GPIO 25 and GPIO 26 on the ESP32 DevKit) that is high while it computes. Capture them on a logic analyser and measure dsp's response time from release (its GPIO's rising edge would be at the 10 ms boundary if it ran immediately) to completion.",
        "Compute the response times of ctrl and dsp with the Python function from the deep section and compare with the capture.",
        "Add a third task at priority 2 with C = 3 ms and T = 10 ms. Calculate U for core 1 and run response-time analysis. Then add 1 ms more to it and predict which deadline is missed first; confirm on the analyser.",
        "Start your exit project's timing table with these measured figures.",
      ],
    },
    quiz: [
      {
        q: "Three tasks have (C, T) of (1, 4), (2, 8) and (2, 16) ms. What is the total utilisation, and does the Liu and Layland bound for n = 3 (0.780) guarantee schedulability under RMS?",
        options: [
          "0.625; yes",
          "0.875; no, the test is inconclusive",
          "0.500; yes",
          "0.625; no, it needs response-time analysis",
        ],
        answer: 0,
        why: "U = 1/4 + 2/8 + 2/16 = 0.25 + 0.25 + 0.125 = 0.625, which is below 0.780, so the bound guarantees every deadline is met.",
      },
      {
        q: "Under rate-monotonic scheduling, which task gets the highest priority?",
        options: [
          "The one with the longest execution time",
          "The one with the shortest period",
          "The most important to the product",
          "The one created first",
        ],
        answer: 1,
        why: "Rate-monotonic assigns priority by rate: shortest period, highest priority. Liu and Layland showed this is optimal among fixed-priority schemes when D = T.",
      },
      {
        q: "A task set has U = 0.88 on one core. What can you conclude from the bound alone?",
        options: [
          "It is unschedulable",
          "It is schedulable",
          "Nothing: the bound is sufficient but not necessary, so an exact test is needed",
          "It is schedulable only with EDF",
        ],
        answer: 2,
        why: "Above the bound but below 1, the Liu and Layland test gives no verdict. Response-time analysis or measurement decides.",
      },
      {
        q: "A task pinned to core 1 runs 5 ms every 10 ms. Roughly what percentage will vTaskGetRunTimeStats show for it on a dual-core ESP32?",
        options: ["5%", "25%", "50%", "100%"],
        answer: 2,
        why: "It runs for half of the elapsed time. ESP-IDF divides each task's run time by elapsed time, not by the time of both cores combined, so it shows about 50% and the whole column sums to about 200%.",
      },
      {
        q: "Why do you measure WCET on the ESP32 rather than calculating it from the instructions?",
        options: [
          "The ESP32 has no cycle counter",
          "Flash caching and interrupts make the run time depend on memory state and timing, so the instruction count alone does not give the worst case",
          "FreeRTOS forbids static analysis",
          "WCET is the same as the average",
        ],
        answer: 1,
        why: "Code runs from flash through a cache, so a cold cache can make the same code several times slower. Measurement with worst-case inputs plus a margin is the practical method.",
      },
    ],
  },

};

export default lessons;
