import type { ModuleContent } from "../model/curriculum";

/**
 * Module b8: Displays and digital sensors.
 * Rules for lesson text: original wording, no pin numbers or board-specific
 * numbers in prose (use `wiring` / `code` blocks), component figures are
 * marked as typical.
 */
const lessons: ModuleContent = {
  "b8-buses-and-i2c": {
    id: "b8-buses-and-i2c",
    outcomes: [
      "Explain the difference between reading a voltage and receiving data",
      "Describe what a bus is and why addresses are needed",
      "Wire an I2C device with its four connections",
      "Find a device's address with the I2C Scanner block",
    ],
    blocks: [
      { t: "h", text: "From a voltage to a message" },
      { t: "p", text: "The sensors in the analog module spoke in voltage: more light, more volts, and the board turned the voltage into a number. That works for one simple quantity. It does not work for a screen that must be told \"write Temp at row 1\", or for a sensor that reports two values at once." },
      { t: "p", text: "These parts use **serial data**. The sender switches a wire between HIGH and LOW in a timed pattern, one **bit** after another, and the receiver reads the pattern back into numbers and letters. It is the same idea as spelling a word aloud one letter at a time. The serial terminal you have used since the first module works this way over the USB cable." },

      { t: "h", text: "What a bus is" },
      { t: "p", text: "If every part needed its own private set of wires, a board would run out of pins quickly. A **bus** is a set of wires that several devices share. Think of one classroom with one teacher. Everybody hears everything, so the teacher starts each question with a roll number, and only that student answers." },
      { t: "p", text: "On a bus the board is the teacher, called the **controller**. Each device has a number, called its **address**. Every message begins with an address, and the devices with a different address stay silent." },

      { t: "h", text: "I2C: two wires" },
      { t: "p", text: "**I2C** (say \"eye squared see\" or \"eye two see\") is the bus used by the LCD in this module, and by many displays, clocks and sensors. It needs only two signal wires however many devices are attached:" },
      { t: "table", head: ["Wire", "Name", "Job"], rows: [
        ["**SDA**", "Serial data", "Carries the bits, in both directions"],
        ["**SCL**", "Serial clock", "A steady tick from the controller that says when to read each bit"],
      ] },
      { t: "p", text: "Add power and ground and an I2C device has four connections: **VCC**, **GND**, **SDA** and **SCL**. A second device connects to the same four points. Each board has particular pins for SDA and SCL, shown in the wiring table below." },
      { t: "wiring", demo: "demo_room_climate" },
      { t: "p", text: "That table is for the room climate project you will build later in this module. For now, look only at the two rows marked SDA and SCL." },
      { t: "deep", title: "What an I2C message looks like on the wires", blocks: [
        { t: "p", text: "Every I2C exchange follows the same pattern. The controller starts it with a **start condition**: SDA falls while SCL is high, which never happens in the middle of data. Then it sends 7 address bits and one more bit saying read or write. The device with that address answers by pulling SDA low for one clock tick, the **acknowledge** (ACK). Data follows in 8-bit bytes, each acknowledged by the receiver, and a **stop condition** (SDA rises while SCL is high) ends it." },
        { t: "diagram", text: String.raw`START | address, 7 bits | R/W | ACK | data, 8 bits | ACK | STOP
      | 0100111 = 0x27 |  0  |  0  |   ........   |  0  |
                        write  device pulls SDA low to say I am here` },
        { t: "p", text: "A scan is simply this sequence repeated for every address: the controller sends each address and notes which ones are acknowledged. Seven bits give 128 possible addresses, a few of which are reserved, so one bus can in principle hold over a hundred devices. Common speeds are 100 kHz (standard mode) and 400 kHz (fast mode)." },
        { t: "formula", text: "0x27 = 2 × 16 + 7 = 39 = binary 010 0111" },
      ] },

      { t: "h", text: "Addresses and the 0x in front" },
      { t: "p", text: "I2C addresses are small numbers, usually written in **hexadecimal**, which is counting in sixteens. The `0x` in front only means \"this number is in hexadecimal\". You do not need to convert it. Treat `0x27` as a label, like a room number." },
      { t: "p", text: "A device's address is set by its maker, sometimes with a choice between two or three values. Two devices with the same address on one bus would both answer at once, and neither message would be readable." },

      { t: "h", text: "Pull-up resistors and voltage" },
      { t: "p", text: "The two I2C lines rest at HIGH because a resistor on each line, called a **pull-up**, connects it to the supply. A device sends a 0 by pulling the line down to ground and sends a 1 by letting go. Most modules carry these resistors already, so you rarely add your own." },
      { t: "note", kind: "safety", text: "The pull-ups connect SDA and SCL to whatever voltage the module is powered from. A module powered from 5 V pulls both lines up to 5 V, and an ESP32 pin must never see more than 3.3 V. On an ESP32, use a module that works at 3.3 V, or put a level shifter between the board and a 5 V module. If you have neither, power the module from the **3.3 V** pin, never from 5 V: the next lesson explains what to expect." },
      { t: "deep", title: "Why the pull-up value matters", blocks: [
        { t: "p", text: "A device can only pull an I2C line **down**. Getting it back up is the pull-up resistor's job, and the wire and pins have a small capacitance that the resistor must charge. That makes each rising edge an RC curve: larger resistance, slower rise. With too large a pull-up the line has not finished rising when the next bit is read, and data is garbled, especially with long wires." },
        { t: "p", text: "Too small a pull-up has the opposite problem: when a device pulls the line low, it must sink the current through the resistor, and the I2C standard expects a device to sink about 3 mA. A 4.7 kΩ pull-up at 5 V gives 5 / 4,700 ≈ 1.1 mA, comfortably inside that, which is why 4.7 kΩ and 10 kΩ are the usual values. Several modules on one bus each add their own pull-ups in parallel, which lowers the total resistance; with many modules attached it can become too strong." },
      ] },

      { t: "h", text: "Finding out who is on the bus" },
      { t: "p", text: "The editor has an **I2C Scanner** block. It calls every possible address in turn and notes which ones answer. The result appears in the serial terminal as a line starting `I2C devices found:` followed by the addresses." },
      { t: "list", items: [
        "**One address listed**: the device is wired correctly and that is its address.",
        "**Nothing listed**: no device answered. This is a wiring or power problem, not a program problem.",
        "**More addresses than devices**: some modules contain two chips, which is normal.",
      ] },
    ],
    mistakes: [
      "**SDA and SCL swapped.** The scanner finds nothing. Swap the two wires and scan again.",
      "**No shared ground.** A module powered from a separate supply with no ground wire to the board never answers.",
      "**Assuming the address.** The program uses one address and the module was made with another. Scan first, then set the address.",
      "**A 5 V module straight onto an ESP32.** It may appear to work while slowly damaging the pins. Check the module's voltage before wiring.",
      "**Using two pins that are not the bus pins.** On the Arduino Uno the I2C pins are fixed. Use the ones in the wiring table.",
    ],
    practice: {
      kind: "build",
      task: "Find the address of your LCD module before you try to print on it.",
      steps: [
        "With USB disconnected, connect the LCD module's **GND**, **VCC**, **SDA** and **SCL**. Read the safety note above first if you are on an ESP32.",
        "In the editor, start a new project and add a **Forever Loop**.",
        "Add an **I2C Scanner** block inside the loop, then a **Sleep** block of 2 seconds after it so the terminal is not flooded.",
        "Run the program and open the serial terminal. Write down the address that appears after `I2C devices found:`.",
        "Disconnect USB, remove the SDA wire, reconnect USB and run again: the list is now empty. Disconnect USB, put the wire back, and check that the address returns. You now know what a wiring fault looks like.",
      ],
    },
    quiz: [
      {
        q: "Three I2C devices are connected to one board. How many signal pins of the board do they use in total?",
        options: ["Six", "Three", "Two", "Four"],
        answer: 2,
        why: "All I2C devices share the same SDA and SCL lines. The address at the start of each message decides which device responds.",
      },
      {
        q: "The scanner prints `I2C devices found:` with nothing after it. What does this tell you?",
        options: [
          "No device answered, so check power, ground and the two bus wires",
          "The address in your program is wrong",
          "The device is working but busy",
          "The forever loop is too fast",
        ],
        answer: 0,
        why: "The scanner tries every address, so an empty list cannot be an address problem. The device is not powered or not connected to the bus.",
      },
      {
        q: "Why is a 5 V I2C module a risk on an ESP32 even though the ESP32 only sends 3.3 V?",
        options: [
          "The ESP32 sends too little current",
          "5 V modules use a different address range",
          "The clock is too fast for the module",
          "The module's pull-up resistors lift SDA and SCL to 5 V, which is more than the pins tolerate",
        ],
        answer: 3,
        why: "I2C lines rest at the pull-up voltage. If the pull-ups go to 5 V, the ESP32's pins see 5 V whenever nothing is pulling the line low.",
      },
      {
        q: "Two identical sensor modules with the same fixed address are put on one bus. What happens?",
        options: [
          "The board reads them one after the other",
          "Both answer the same call at once and the data is garbled",
          "The second one is ignored and the first works normally",
          "The bus speeds up",
        ],
        answer: 1,
        why: "An address must pick out exactly one device. Two devices with the same address both drive the data line together.",
      },
    ],
  },

  "b8-lcd-display": {
    id: "b8-lcd-display",
    outcomes: [
      "Describe how a 16×2 character LCD is laid out",
      "Wire an LCD with an I2C backpack and set its address and contrast",
      "Write a line of text that includes a live value and fits the screen",
      "Diagnose a blank or garbled LCD",
    ],
    blocks: [
      { t: "h", text: "What a 16×2 LCD is" },
      { t: "p", text: "A 16×2 LCD shows **2 rows of 16 characters**. Each character sits in its own small box of dots, so the screen can show letters, digits and simple symbols but not pictures. A project with a screen no longer needs a computer attached to tell you what it is doing." },
      { t: "p", text: "The bare display has sixteen pins and would use up most of a board. The small board soldered to its back, the **I2C backpack**, takes commands over the I2C bus and operates those pins for you. That is why the whole display needs only four wires." },

      { t: "h", text: "Wiring and voltage" },
      { t: "list", ordered: true, items: [
        "Disconnect USB.",
        "Connect the backpack's **GND** to **GND**.",
        "Connect **SDA** and **SCL** to the pins shown in the table below.",
        "Connect **VCC**. On an Arduino Uno this is the **5 V** pin. On an ESP32, read the note below first.",
      ] },
      { t: "wiring", demo: "demo_water_level" },
      { t: "p", text: "The table is for the water level project from the analog module, now with a screen. The buzzer in that project is on a plain output pin, which you can see set up at the top of the program further down. The buzzer rule from the analog module still applies: a buzzer module, or a small active buzzer known to draw less than about 20 mA, never a larger one straight on a pin." },
      { t: "note", kind: "safety", text: "Most LCD backpacks are 5 V parts with pull-up resistors to their supply. Powered from 5 V, they put 5 V on SDA and SCL, which an ESP32 pin must not receive. On an ESP32 the safe choices are an LCD module made for 3.3 V, or a level shifter between the board and a 5 V module. If your kit has neither, connect the backpack's VCC to the **3.3 V** pin. That keeps SDA and SCL at 3.3 V and is safe for the board, but the text is typically faint and on some displays stays invisible even with the contrast screw at its end. Never power the backpack from 5 V with SDA and SCL wired straight to an ESP32." },
      { t: "deep", title: "How two wires drive a parallel display: the backpack", blocks: [
        { t: "p", text: "The LCD itself is built around a controller compatible with the old **HD44780** design. It expects data on parallel wires: a register select line (command or character), an enable line that tells it to read, and four or eight data lines. That is too many pins to spare, so the small board soldered on the back, the **backpack**, carries a **PCF8574** I/O expander." },
        { t: "p", text: "The PCF8574 is an I2C device with eight output pins. The library sends it a byte over I2C, and its eight pins copy the byte's eight bits, driving the LCD's register select, enable, four data lines and the backlight. Each character takes several I2C bytes, because the LCD is fed in two halves of four bits and the enable line must be pulsed for each half. The address choice of 0x27 or 0x3F comes from the two versions of this chip, the PCF8574 and the PCF8574A." },
        { t: "note", kind: "tip", text: "Each character is drawn from a grid of 5 × 8 dots stored in the controller's built-in font. The controller also has room for eight characters of your own design, which is how projects show symbols such as a degree sign or a battery." },
      ] },

      { t: "h", text: "The two settings that cause most blank screens" },
      { t: "p", text: "**Contrast.** On the back of the backpack is a small blue box with a cross-shaped screw. It sets how dark the characters are. Turned too far one way the text is invisible; too far the other way every box is a solid block. If the backlight is on and the screen looks empty, turn this screw slowly with a small screwdriver while the program runs. This is the usual cause of a blank screen." },
      { t: "p", text: "**Address.** Backpacks are commonly made with the address `0x27` or `0x3F`. The **16×2 LCD Node** block has an **I2C Address** setting with both. If you ran the scanner in the previous lesson you already know yours. If not, try one and then the other." },

      { t: "h", text: "Putting a value in the text" },
      { t: "p", text: "The block has a box for each line. Ordinary text is shown as typed. A variable name inside curly braces is replaced by that variable's current value, so `Level: {water_level}` shows the word followed by the latest reading." },
      { t: "p", text: "Each line has only 16 places, so count before you run. Spaces count too." },
      { t: "table", head: ["Text sent", "Characters", "Result"], rows: [
        ["`Water level`", "11", "Fits"],
        ["`Temp: 27 C`", "10", "Fits"],
        ["`Distance: 123.45 cm`", "19", "The end is cut off or spills over"],
      ] },
      { t: "p", text: "The third row is a real trap: a measured value with decimals is longer than you expect. The distance meter project deals with it by first storing the whole-number part of the distance in a variable called `cm`, and showing that. On the Arduino Uno the generated code stores `cm`, `temperature` and `humidity` as decimal numbers, so they appear with two digits after the point, such as `23.00`. The ESP32 shows them without. Look at what your own screen shows and count those digits too." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_water_level" },
      { t: "list", ordered: true, items: [
        "**Setup.** Before the loop, the program starts the I2C bus and creates the display with three facts: its address, 16 columns and 2 rows.",
        "**Measure.** The sensor is read into `water_level`, as in the analog module.",
        "**Show.** The backlight is switched on and the screen is cleared. The first line is written, the cursor moves to the start of the second row, and the value is written there.",
        "**Decide and act.** The `if` switches the buzzer on when the reading is above the full threshold.",
        "**Wait.** The loop pauses for a second.",
      ] },
      { t: "p", text: "The screen is cleared and redrawn on every pass. That is simple and reliable, but if the loop ran many times a second the display would flicker, because an LCD is slow to change. Once or twice a second is comfortable to read." },
      { t: "deep", title: "Why the contrast knob matters so much", blocks: [
        { t: "p", text: "A liquid crystal does not make light. Each dot twists the light passing through it, and a voltage across the dot untwists it so it looks dark against the backlight. The contrast potentiometer sets the voltage on the controller's contrast pin, which shifts how strongly every dot is driven." },
        { t: "p", text: "Too little and nothing appears to be written; too much and every position shows a solid block, whether text was sent or not. The right setting depends on the supply voltage, which is why a display adjusted on 5 V usually needs re-adjusting on 3.3 V, and many 5 V displays never show clear text at 3.3 V at all." },
      ] },
    ],
    mistakes: [
      "**Backlight on, no text.** Turn the contrast screw before changing anything else.",
      "**A row of solid blocks.** The display has power but has received no commands: wrong address, SDA and SCL swapped, or contrast turned too far. On an ESP32 a wrong address or an unconnected display also stops the program at its first lines with an error in the Terminal.",
      "**Old characters left behind.** `100` followed by `99` shows as `990` if the screen is not cleared between writes. The LCD block clears for you; text you add another way may not.",
      "**Text cut off.** The line is longer than 16 characters once the value is filled in. Count with the largest value you expect.",
      "**No backlight at all.** No power to the backpack, or the small jumper on the backpack that feeds the backlight is missing.",
    ],
    practice: {
      kind: "project",
      demo: "demo_water_level",
      task: "Open the water level monitoring project and wire the sensor and LCD. Get the text visible first: adjust the contrast screw, and switch the **I2C Address** in the LCD block if needed. Then change line 1 to your own label and line 2 to `Level: {water_level}`. Count the characters with the largest reading you have seen and check it fits in 16.",
    },
    quiz: [
      {
        q: "The backlight is on, the scanner finds the display at the address used in the program, but no characters are visible. What do you try first?",
        options: [
          "Swap SDA and SCL",
          "Turn the contrast screw on the backpack",
          "Change the address in the block",
          "Replace the display",
        ],
        answer: 1,
        why: "The scanner result proves the wiring and address are right. Invisible text with a working bus is almost always the contrast setting.",
      },
      {
        q: "Line 2 is set to `Humidity: {humidity} %`. On your board the value appears as `65`, with no decimal places. How many characters is the line, and does it fit?",
        options: [
          "12 characters, it fits",
          "22 characters, it does not fit",
          "16 characters, it does not fit",
          "14 characters, it fits",
        ],
        answer: 3,
        why: "`Humidity: 65 %` is 9 for the word and colon, 1 space, 2 digits, 1 space and 1 percent sign: 14 characters, inside the 16 available. A board that shows the value as `65.00` would need 17, which does not fit.",
      },
      {
        q: "Why does an LCD with a backpack need only two signal wires when the bare display has sixteen pins?",
        options: [
          "The backpack receives I2C messages and drives the display's pins itself",
          "The other pins are not needed for text",
          "The backpack sends the data by radio",
          "The display is slowed down so two pins are enough",
        ],
        answer: 0,
        why: "The backpack is a small I2C device whose outputs are connected to the display's pins. The board talks to the backpack, and the backpack operates the display.",
      },
      {
        q: "A student moves a working 5 V LCD from an Arduino Uno to an ESP32 and powers it from 5 V. What is the problem?",
        options: [
          "The address changes on an ESP32",
          "The ESP32 cannot use I2C",
          "The backpack's pull-ups put 5 V on SDA and SCL, above what ESP32 pins tolerate",
          "The contrast must be reset",
        ],
        answer: 2,
        why: "The lines rest at the module's supply voltage through its pull-ups. On an ESP32 use a 3.3 V compatible module or a level shifter.",
      },
    ],
  },

  "b8-dht11": {
    id: "b8-dht11",
    outcomes: [
      "Explain how a digital sensor differs from the analog sensors used so far",
      "Wire a DHT11 module on either board",
      "State what a DHT11 reading can and cannot be trusted for",
      "Read the room climate program part by part",
    ],
    blocks: [
      { t: "h", text: "A sensor that sends numbers" },
      { t: "p", text: "With an LDR or a soil probe, the board measured a voltage and you had to work out what the number meant. The **DHT11** is different. Inside its blue case are a humidity-sensing part, a temperature-sensing part and a tiny chip. The chip does the measuring and sends the finished answers as data: a temperature in degrees Celsius and a relative humidity in percent." },
      { t: "p", text: "So there is no analog pin, no divider and no raw number to interpret. The DHT11 uses a single data wire with its own timing pattern. It is not I2C and has no address. The editor's **DHT11 Temp / Humidity** block handles the pattern and gives you two variables, `temperature` and `humidity`." },

      { t: "h", text: "What relative humidity means" },
      { t: "p", text: "Air can hold water vapour, and warm air can hold more than cold air. **Relative humidity** is how full the air is, as a percentage of the most it could hold at its present temperature. At 50 % the air holds half of what it could. Near 100 % it is close to forming mist or dew. This is why a humid day feels sticky: sweat cannot evaporate into air that is nearly full." },

      { t: "h", text: "How good is a DHT11?" },
      { t: "p", text: "It is a low-cost classroom sensor. Know its limits before you trust it. These are typical figures:" },
      { t: "table", head: ["Property", "Typical value", "What it means for you"], rows: [
        ["Step size", "1 °C and 1 %", "It cannot show small changes"],
        ["Temperature accuracy", "within about 2 °C", "A reading of 28 could really be 26 to 30"],
        ["Humidity accuracy", "within about 5 %", "A reading of 60 could really be 55 to 65"],
        ["Fastest reading rate", "about once a second", "Asking more often gives errors or repeats"],
      ] },
      { t: "p", text: "Work one example. The fan project switches on above 30. If two DHT11 sensors sit side by side, one may say 29 and the other 31. Both are within their accuracy, yet one fan runs and the other does not. A DHT11 is good for \"is the room warm?\" and poor for \"is it exactly 30.0 degrees?\"" },
      { t: "note", kind: "tip", text: "On the Arduino Uno the screen and the Terminal show the temperature and humidity with two digits after the decimal point, such as `27.00`. Those digits come from how the number is stored and printed, not from the sensor. The DHT11 still only resolves whole degrees. The two lines of this project are 13 characters long that way, so they still fit." },
      { t: "deep", title: "How the DHT11 sends its numbers on one wire", blocks: [
        { t: "p", text: "The DHT11 uses its own one-wire protocol, not I2C. The board pulls the data line low for at least 18 ms to wake the sensor, then lets go. The sensor answers with 80 µs low and 80 µs high, then sends **40 bits**. Every bit starts with about 50 µs low; then a high of about 26 to 28 µs means 0 and about 70 µs means 1. The library measures each high pulse to decide." },
        { t: "table", head: ["Byte", "Meaning", "Example"], rows: [["1", "humidity, whole part", "55"], ["2", "humidity, decimal part (0 on the DHT11)", "0"], ["3", "temperature, whole part", "28"], ["4", "temperature, decimal part", "0"], ["5", "checksum: the sum of bytes 1 to 4, keeping the last 8 bits", "83"]], caption: "Check: 55 + 0 + 28 + 0 = 83, so this reading is accepted: 55 % RH and 28 °C." },
        { t: "p", text: "If even one bit is misread, the checksum almost never matches, and the library reports a failed reading instead of a wrong number. The timings are tight, measured in microseconds, which is why long wires or a missing pull-up show up as failed reads rather than slightly wrong values." },
      ] },

      { t: "h", text: "Wiring" },
      { t: "p", text: "Buy and use the DHT11 as a **module**: the blue sensor on a small board with three pins. The module includes the pull-up resistor that the data line needs. A bare four-legged sensor needs that resistor added, about 10 kΩ from the data leg to the supply." },
      { t: "list", ordered: true, items: [
        "Disconnect USB. Read the labels printed on the module: the order of the three pins differs between makers.",
        "Connect the pin marked **+** or **VCC** to the **3.3 V** pin on an ESP32, or the **5 V** pin on an Arduino Uno.",
        "Connect the pin marked **-** or **GND** to **GND**.",
        "Connect the data pin, often marked **S**, **OUT** or **DATA**, to the pin shown in the table.",
        "Wire the LCD as in the previous lesson, with the same care about voltage on an ESP32.",
      ] },
      { t: "wiring", demo: "demo_room_climate" },
      { t: "note", kind: "safety", text: "Power the DHT11 from 3.3 V on an ESP32. Its data line rests at its supply voltage, so a DHT11 powered from 5 V would put 5 V on an ESP32 pin." },

      { t: "h", text: "Reading the program" },
      { t: "code", demo: "demo_room_climate" },
      { t: "list", ordered: true, items: [
        "**Setup.** The sensor is created on its data pin and the LCD is created at its address.",
        "**Measure.** The board asks the sensor for a fresh measurement and stores the two answers in `temperature` and `humidity`.",
        "**Report.** Two lines starting `SENSOR` send both values to the computer. They feed the live charts in the editor.",
        "**Show.** The LCD is cleared and both lines are written, with the values dropped into the text.",
        "**Wait.** The loop pauses for two seconds. That is deliberately slower than the sensor's limit.",
      ] },

      { t: "h", text: "Getting a sensible reading" },
      { t: "list", items: [
        "Give it a minute after power-up before believing the numbers.",
        "Keep it away from your hand, a laptop vent, a relay or direct sun: it measures the air touching it.",
        "To test it, breathe gently on it. Humidity should climb within a few seconds and fall back slowly.",
        "If a reading fails, the Arduino Uno shows `nan` (\"not a number\"), and the ESP32 program stops with an error in the terminal. Both mean the board did not hear a valid reply: check the three wires.",
      ] },
      { t: "deep", title: "What is inside the DHT11, and why it is slow", blocks: [
        { t: "p", text: "Inside the blue case are two sensing parts and a tiny microcontroller. Humidity is measured by an element whose electrical resistance changes as it absorbs water vapour from the air. Temperature comes from an **NTC thermistor**, a resistor whose resistance falls as it warms. The internal chip measures both, applies its factory calibration, and sends the result." },
        { t: "p", text: "The humidity element has to soak up or give off moisture before its reading settles, which takes seconds. The datasheet asks for at least a second between readings, and many libraries enforce about two. Reading faster only returns the old value or fails. For slow quantities like room climate, one reading every few seconds is all you need anyway." },
      ] },
    ],
    mistakes: [
      "**Reading too often.** A loop faster than about once a second gives failed or repeated readings. Keep the two second pause.",
      "**Module pins in the wrong order.** Power on the data pin gives no readings and can damage the sensor. Read the printed labels, do not copy a picture of a different module.",
      "**Bare sensor with no pull-up resistor.** Every reading fails. Use a module, or add the resistor.",
      "**Trusting it to a fraction of a degree.** Two sensors that disagree by two degrees are both working normally.",
      "**Expecting an instant response.** The sensor's case slows the air reaching it. After a change, wait before deciding it is stuck.",
    ],
    practice: {
      kind: "project",
      demo: "demo_room_climate",
      task: "Open the room temperature and humidity project, wire the DHT11 and the LCD, and run it. Open the live chart, breathe on the sensor and watch humidity rise and recover. Then hold the sensor between two fingers for a minute and note how many degrees the temperature climbs and how long it takes. Write both observations down: they are your own measurement of how slow the sensor is.",
    },
    quiz: [
      {
        q: "A DHT11 with typical accuracy reads 31 °C. The fan threshold is 30. What can you honestly say about the room?",
        options: [
          "It is exactly 31.0 °C",
          "It is certainly above 30 °C",
          "It is probably somewhere from 29 to 33 °C, so it may or may not be above 30",
          "The sensor is faulty",
        ],
        answer: 2,
        why: "With accuracy of about 2 °C either way, a reading of 31 covers roughly 29 to 33. The reading alone cannot prove the room is above 30.",
      },
      {
        q: "A student changes the loop pause from two seconds to a tenth of a second to get smoother charts. What is the likely result?",
        options: [
          "Failed or repeated readings, because the sensor cannot measure that often",
          "Ten times more accurate readings",
          "The LCD shows more decimal places",
          "The sensor overheats",
        ],
        answer: 0,
        why: "A DHT11 produces a new measurement about once a second at best. Asking faster does not give new information and often gives errors.",
      },
      {
        q: "Why does the DHT11 not need an analog pin or a threshold conversion?",
        options: [
          "It only reports on or off",
          "It is too slow for an analog pin",
          "It works on the I2C bus",
          "A chip inside it measures and sends the values as data in real units",
        ],
        answer: 3,
        why: "The DHT11 is a digital sensor: it does its own measuring and sends temperature and humidity as numbers over one data wire.",
      },
      {
        q: "On an ESP32, why is the DHT11 powered from the 3.3 V pin instead of the 5 V pin?",
        options: [
          "It measures more accurately at 3.3 V",
          "Its data line rests at its supply voltage, and an ESP32 pin must not see more than 3.3 V",
          "The 5 V pin cannot supply enough current",
          "The DHT11 cannot work at 5 V",
        ],
        answer: 1,
        why: "The data line is pulled up to the sensor's supply. Powering the sensor from 3.3 V keeps that line within what the ESP32 pin tolerates.",
      },
    ],
  },

  "b8-debugging": {
    id: "b8-debugging",
    outcomes: [
      "Split a project that does not work into stages and test each one",
      "Use the Print block and the serial terminal to see what the program sees",
      "Use the live chart to check a sensor before blaming the logic",
      "Change one thing at a time and keep a note of what you tried",
    ],
    blocks: [
      { t: "h", text: "Not working is information" },
      { t: "p", text: "Every project fails the first time. That is normal. What separates a quick fix from a lost afternoon is method. Guessing, swapping wires at random and rebuilding everything can each take an hour and teach you nothing. **Debugging** is finding out what is really happening, and comparing it with what you expected." },
      { t: "p", text: "Begin by writing two sentences. \"I expected the fan to switch on when I warmed the sensor.\" \"What happened: nothing, and no click.\" Being this exact often points at the answer straight away." },

      { t: "h", text: "The chain of stages" },
      { t: "p", text: "Every project in this course is a chain, and a break anywhere stops the whole thing:" },
      { t: "list", ordered: true, items: [
        "**Power**: is every part getting the voltage it needs?",
        "**Input**: is the sensor giving a believable reading?",
        "**Logic**: is the program making the decision you intended?",
        "**Output**: can the output work at all?",
      ] },
      { t: "p", text: "The aim is to find **which link** is broken before trying to fix anything. A doctor does the same: find where it hurts first." },

      { t: "h", text: "Seeing inside the program with Print" },
      { t: "p", text: "The board cannot tell you what it is thinking unless you ask. The **Print** block sends a line to the serial terminal. It has two uses:" },
      { t: "table", head: ["In the Print block", "What appears", "Use it to"], rows: [
        ["A variable name, such as `temperature`", "The variable's current value", "See what the sensor really reads"],
        ["Text in quotes, such as `'fan on'`", "That exact text", "See which branch of an If-Else ran"],
      ] },
      { t: "p", text: "Sensor blocks already send their readings to the **live chart**. Use the chart for a quick look at how a reading moves, and Print when you need an exact number or a marker at a particular point in the program." },

      { t: "h", text: "A worked example" },
      { t: "p", text: "The fan control project is wired and running. You warm the sensor and the fan never starts. Go along the chain." },
      { t: "list", ordered: true, items: [
        "**Output alone.** Make a tiny test program: a Forever Loop with the Relay block on, a Sleep of one second, the Relay block off, and another Sleep. If the relay clicks and the fan pulses, the output and its power are proved good in two minutes.",
        "**Input alone.** Go back to the project and watch `temperature` on the chart. It reads 27 and climbs to 29 when you hold the sensor.",
        "**Logic.** The If-Else asks for more than 30. The reading peaked at 29. The program is doing exactly what it was told.",
      ] },
      { t: "p", text: "Nothing was broken. The test was too gentle for the threshold. Lower the threshold to 28 for testing and the fan starts. Without the reading in front of you, you might have rewired a perfectly good relay." },
      { t: "deep", title: "Halving the chain: the fastest way to find a fault", blocks: [
        { t: "p", text: "When a chain of stages fails somewhere, checking stage by stage from the start can take a long time. A faster method is to test the **middle** first. If the signal is correct there, the fault lies after it; if not, before it. Each test throws away half of the remaining suspects." },
        { t: "formula", text: String.raw`stages to search  →  tests needed (halving each time)
       4          →  2
       8          →  3
      16          →  4` },
        { t: "p", text: "For a light sensor project the middle might be the Terminal: print the raw reading. A sensible changing number proves the sensor, wiring and reading code are fine, so the fault is in the decision or the output. A frozen or impossible number points back towards the sensor and wiring. Professionals use the same idea in software with `git bisect`, halving through hundreds of saved versions to find the one that broke a program." },
      ] },

      { t: "h", text: "Symptoms and first checks" },
      { t: "table", head: ["Symptom", "Likely stage", "First check"], rows: [
        ["Nothing happens, no board light", "Power", "USB cable and port; look for a short circuit"],
        ["Reading stuck at zero or at maximum", "Input", "Sensor power, ground and signal wire"],
        ["Reading jumps at random", "Input", "A loose wire or a signal pin connected to nothing"],
        ["Reading sensible, output never changes", "Logic", "Threshold value and direction of the comparison"],
        ["Output works backwards", "Logic", "Comparison direction, or an active low module"],
        ["Board resets when the output switches", "Power", "The load needs its own supply"],
      ] },

      { t: "h", text: "Rules that save time" },
      { t: "list", items: [
        "**Change one thing at a time**, then test. If you change three things and it works, you do not know which one mattered. If it still fails, you may have added a new fault.",
        "**Test with the simplest program possible.** A fault that survives in a four-block program is a wiring fault.",
        "**Believe the measurement, not your memory.** \"I am sure that wire is right\" is not a test. A multimeter reading is.",
        "**Write down what you tried.** Three lines in a notebook stop you repeating the same test.",
        "**Disconnect USB before moving wires**, even when you are in a hurry.",
      ] },
      { t: "deep", title: "How printing can change what you are watching", blocks: [
        { t: "p", text: "Printing is not free. Over a serial link at 9600 baud, each character takes about 10 bits on the wire, so about 960 characters fit in a second, a little over 1 ms each. A 20-character line costs roughly 21 ms. Once the board's small output buffer is full, the program waits for it to drain." },
        { t: "p", text: "Add many prints inside a fast loop and the loop slows down, which can hide or create a timing problem: a debounce suddenly works, a sensor read is suddenly too slow. If a bug disappears when you add prints, or appears when you add them, suspect timing. Print less often, for example once every few hundred milliseconds, or use a faster speed when the Terminal allows it." },
      ] },
    ],
    mistakes: [
      "**Changing several things at once.** The project starts working and you cannot say why, so the same fault returns next week.",
      "**Blaming the code first.** In beginner projects most faults are a wire in the wrong row, a missing ground or a part without power.",
      "**Printing text without quotes.** The program treats the words as a variable name and stops with an error. Text needs quotes, variable names do not.",
      "**Printing in a very fast loop.** The terminal scrolls too quickly to read. Add a short Sleep while you investigate.",
      "**Rebuilding from scratch.** It feels like progress, but it destroys the evidence and usually rebuilds the same mistake.",
    ],
    practice: {
      kind: "build",
      task: "Add markers to a project so that the terminal tells you which decision the program made.",
      steps: [
        "Open the editor and build: a **Forever Loop**, a **DHT11 Temp / Humidity** block, then an **If-Else** that tests whether `temperature` is greater than a number just above your room's reading.",
        "In the true branch add a **Print** block containing `'warm'` with the quotes. In the false branch add a Print block containing `'cool'`.",
        "After the If-Else add a Print block containing `temperature` with no quotes, then a **Sleep** of 2 seconds.",
        "Run it and read the terminal. Warm the sensor with your fingers and watch for the line where the marker changes.",
        "Now break it on purpose: disconnect USB, remove the sensor's data wire, reconnect and run. Note exactly what the terminal shows, then disconnect USB and put the wire back. You have just learned to recognise that fault.",
      ],
    },
    quiz: [
      {
        q: "A street light project never switches the LED on. A two-block test program that just turns the LED on works. What have you learned?",
        options: [
          "The sensor is broken",
          "The LED, its resistor, its pin and its wiring are fine, so the fault is in the input or the logic",
          "The threshold is too high",
          "Nothing useful",
        ],
        answer: 1,
        why: "Testing the output alone removes one whole stage from suspicion. What remains is the reading or the decision made from it.",
      },
      {
        q: "A Print block containing `moisture` (no quotes) shows 0 on every line, wet or dry. Which stage is at fault?",
        options: [
          "Logic: the comparison is backwards",
          "Output: the relay is active low",
          "Power to the pump",
          "Input: the sensor is unpowered or its signal wire is not connected properly",
        ],
        answer: 3,
        why: "A reading that never moves from zero means no sensor voltage is reaching the pin. The logic cannot be judged until the input is believable.",
      },
      {
        q: "You changed the threshold, swapped two wires and replaced the sensor, and now the project works. What is the problem with this?",
        options: [
          "You do not know which change fixed it, so you have not found the cause",
          "Nothing, it works",
          "The sensor will need calibrating",
          "The program is now slower",
        ],
        answer: 0,
        why: "With three changes at once there is no way to tell which mattered. One change per test turns each test into a clear answer.",
      },
      {
        q: "The reading is sensible and changes as expected, but the relay switches off in the dark and on in the light, the opposite of what you want. Where do you look?",
        options: [
          "The sensor's power wire",
          "The USB cable",
          "The direction of the comparison, or the relay's active low setting",
          "The sleep time",
        ],
        answer: 2,
        why: "A good reading with a reversed result is a logic-stage fault: either the comparison is the wrong way round or the output level is inverted.",
      },
    ],
  },
};

export default lessons;
