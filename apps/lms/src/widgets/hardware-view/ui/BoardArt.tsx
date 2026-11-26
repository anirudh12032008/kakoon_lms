import { UNO, ESP32, type BoardPin } from "../model/boardPins";

// Top-down drawings of the boards. Pin holes and their silkscreen labels are
// generated from the pin tables in boardPins.ts; everything else is decoration
// placed in PCB coordinates (1 unit = 0.01 inch, origin = PCB top-left).

const SILK = "#f1f5f9";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "Arial, Helvetica, sans-serif";

/** Circular hole as a sub-path, cut out of the PCB with fill-rule evenodd. */
const hole = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** 2x3 male programming header. */
function Icsp({ xs, ys }: { xs: number[]; ys: number[] }) {
  return (
    <g>
      {xs.flatMap((x) => ys.map((y) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="3" fill="#d6d9de" stroke="#8a9099" strokeWidth="0.5" />
          <rect x={x - 1.2} y={y - 1.2} width="2.4" height="2.4" fill="#c9a227" />
        </g>
      )))}
    </g>
  );
}

// ─── Arduino Uno R3 ───────────────────────────────────────────────────────────

/** One socket of a female header, with its label rotated like the real silkscreen. */
function UnoPin({ pin }: { pin: BoardPin }) {
  const top = pin.side === "top";
  const ly = top ? pin.y + 7 : pin.y - 7;
  return (
    <g>
      <rect x={pin.x - 5} y={pin.y - 5} width="10" height="10" fill="#1b1b1d" />
      <rect x={pin.x - 2.4} y={pin.y - 2.4} width="4.8" height="4.8" rx="0.6" fill="#050505" stroke="#55575c" strokeWidth="0.5" />
      <text
        x={pin.x} y={ly} transform={`rotate(-90 ${pin.x} ${ly})`}
        textAnchor={top ? "end" : "start"} dominantBaseline="central"
        fontSize="4.6" fontFamily={MONO} fontWeight="700" fill={SILK}
      >
        {pin.label}
      </text>
    </g>
  );
}

export function ArduinoUnoSvg() {
  const dipPins = Array.from({ length: 14 }, (_, i) => 130 + i * 10);
  return (
    <svg viewBox={`0 0 ${UNO.w} ${UNO.h}`} role="img" aria-label="Arduino Uno board" className="block w-full h-full">
      <g aria-hidden="true">
        <defs>
          <linearGradient id="uno-pcb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1c86a8" />
            <stop offset="1" stopColor="#0d6485" />
          </linearGradient>
          <linearGradient id="uno-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3f4f6" />
            <stop offset="0.5" stopColor="#c3c8cf" />
            <stop offset="1" stopColor="#8d939c" />
          </linearGradient>
        </defs>

        <g transform={`translate(${UNO.ox} ${UNO.oy})`}>
          {/* PCB outline with the two chamfers on the right edge and four mounting holes */}
          <path
            fillRule="evenodd" fill="url(#uno-pcb)" stroke="#0a4b63" strokeWidth="0.8"
            d={"M2 0H254L260 6V51L270 61V190L260 200V208a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2Z"
              + hole(60, 10, 6.3) + hole(55, 200, 6.3) + hole(260, 180, 6.3) + hole(260, 70, 6.3)}
          />
          {[[60, 10], [55, 200], [260, 180], [260, 70]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7.4" fill="none" stroke="#dbe4ea" strokeWidth="0.9" opacity="0.7" />
          ))}

          {/* Copper traces */}
          <g fill="none" stroke="#2f9cc0" strokeWidth="1" opacity="0.45">
            <path d="M40 60H84L96 72" />
            <path d="M110 70H128V118H140" />
            <path d="M104 78V118H122" />
            <path d="M150 158V176H200V192" />
            <path d="M160 158V170H210V192" />
            <path d="M72 150H100V182H150V192" />
          </g>

          {/* USB-B socket */}
          <rect x="-25" y="38" width="63" height="45" rx="1.5" fill="url(#uno-metal)" stroke="#6b7280" strokeWidth="0.8" />
          <path d="M-25 46H30M-25 75H30" stroke="#9aa0a8" strokeWidth="0.6" />
          <rect x="8" y="35.5" width="12" height="3" fill="#aeb4bc" />
          <rect x="8" y="82.5" width="12" height="3" fill="#aeb4bc" />

          {/* DC barrel jack */}
          <rect x="-7" y="152" width="54" height="36" rx="2" fill="#17181a" stroke="#000" strokeWidth="0.6" />
          <rect x="-7" y="157" width="15" height="26" rx="1" fill="#0b0b0c" />
          <rect x="10" y="156" width="33" height="3" fill="#2c2e31" />
          <rect x="30" y="165" width="14" height="10" fill="#b9bec6" />

          {/* Reset button */}
          <rect x="20" y="4" width="22" height="22" rx="2" fill="url(#uno-metal)" stroke="#6b7280" strokeWidth="0.6" />
          <circle cx="31" cy="15" r="6.5" fill="#b4532a" stroke="#7c2d12" strokeWidth="0.8" />
          <text x="31" y="32" textAnchor="middle" fontSize="3.8" fontFamily={SANS} fontWeight="700" fill={SILK}>RESET</text>

          {/* ATmega16U2 USB bridge, its ICSP header and the 16 MHz crystal */}
          <Icsp xs={[64, 74, 84]} ys={[44, 54]} />
          <rect x="46" y="64" width="11" height="27" rx="5.5" fill="url(#uno-metal)" stroke="#6b7280" strokeWidth="0.6" />
          <rect x="88" y="62" width="20" height="20" rx="1" transform="rotate(45 98 72)" fill="#1f2023" stroke="#3f4147" strokeWidth="0.6" />
          <circle cx="98" cy="62" r="1" fill="#6b7280" />

          {/* Electrolytic capacitors and the 5 V regulator */}
          {[112, 135].map((cy) => (
            <g key={cy}>
              <circle cx="62" cy={cy} r="9.5" fill="url(#uno-metal)" stroke="#6b7280" strokeWidth="0.6" />
              <path d={`M52.5 ${cy}A9.5 9.5 0 0 1 71.5 ${cy}Z`} fill="#2b2f36" />
            </g>
          ))}
          <rect x="80" y="166" width="16" height="10" rx="1" fill="#1f2023" />
          <rect x="83" y="160" width="10" height="6" fill="#b9bec6" />
          {[82, 88, 94].map((x) => <rect key={x} x={x - 1} y="176" width="2" height="4" fill="#b9bec6" />)}

          {/* Small parts */}
          {[[112, 100], [112, 108], [86, 100], [86, 108], [204, 108], [216, 108], [104, 166], [108, 150]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="3.2" rx="0.5" fill="#bfa67a" stroke="#d9dde2" strokeWidth="0.4" />
          ))}

          {/* Status LEDs */}
          {([["L", 56, "#f59e0b"], ["TX", 66, "#fde68a"], ["RX", 75, "#fde68a"]] as const).map(([t, y, c]) => (
            <g key={t}>
              <text x="121" y={y + 1.5} textAnchor="end" fontSize="4" fontFamily={SANS} fontWeight="700" fill={SILK}>{t}</text>
              <rect x="124" y={y - 2} width="6" height="3.6" rx="0.6" fill={c} stroke="#e5e7eb" strokeWidth="0.4" />
            </g>
          ))}
          <text x="231" y="51.5" textAnchor="end" fontSize="4" fontFamily={SANS} fontWeight="700" fill={SILK}>ON</text>
          <rect x="234" y="48" width="6" height="3.6" rx="0.6" fill="#22c55e" stroke="#e5e7eb" strokeWidth="0.4" />

          {/* Logo and section labels */}
          <text x="165" y="42" textAnchor="middle" fontSize="4.4" fontFamily={SANS} fontWeight="700" fill={SILK}>DIGITAL (PWM ~)</text>
          <g fill="none" stroke={SILK} strokeLinecap="round">
            <circle cx="150" cy="80" r="9" strokeWidth="3.4" />
            <circle cx="169" cy="80" r="9" strokeWidth="3.4" />
            <path d="M146.5 80H153.5M165.5 80H172.5M169 76.5V83.5" strokeWidth="1.5" />
          </g>
          <text x="184" y="89" fontSize="24" fontFamily={SANS} fontWeight="700" fontStyle="italic" fill={SILK}>UNO</text>
          <text x="159.5" y="103" textAnchor="middle" fontSize="6.5" fontFamily={SANS} fontWeight="700" letterSpacing="1.2" fill={SILK}>ARDUINO</text>
          <text x="145" y="173" textAnchor="middle" fontSize="4.4" fontFamily={SANS} fontWeight="700" fill={SILK}>POWER</text>
          <text x="225" y="173" textAnchor="middle" fontSize="4.4" fontFamily={SANS} fontWeight="700" fill={SILK}>ANALOG IN</text>
          <path d="M116 176H184M196 176H254" stroke={SILK} strokeWidth="0.6" />

          {/* ICSP header for the ATmega328P */}
          <Icsp xs={[248, 258]} ys={[92, 102, 112]} />
          <text x="253" y="86" textAnchor="middle" fontSize="3.8" fontFamily={SANS} fontWeight="700" fill={SILK}>ICSP</text>

          {/* ATmega328P in its DIP-28 socket */}
          <rect x="123" y="121" width="144" height="38" rx="1" fill="#0e0e10" />
          {dipPins.map((x) => (
            <g key={x} fill="#c9ced6">
              <rect x={x - 1.5} y="122.5" width="3" height="6" />
              <rect x={x - 1.5} y="151.5" width="3" height="6" />
            </g>
          ))}
          <rect x="125" y="128" width="140" height="24" rx="1.5" fill="#2a2b30" stroke="#101012" strokeWidth="0.6" />
          <path d="M125 136.5a3.5 3.5 0 0 1 0 7Z" fill="#131315" />
          <circle cx="131" cy="147.5" r="1.3" fill="#131315" />
          <text x="197" y="142.3" textAnchor="middle" fontSize="6.2" fontFamily={MONO} fontWeight="700" fill="#a3a8b0">ATMEGA328P-PU</text>
        </g>

        {UNO.pins.map((pin) => <UnoPin key={pin.id} pin={pin} />)}
      </g>
    </svg>
  );
}

// ─── ESP32-DevKitC V4 (38 pins) ───────────────────────────────────────────────

/** Soldered header pin with its label on the inside of the row. */
function EspPin({ pin }: { pin: BoardPin }) {
  const left = pin.side === "left";
  return (
    <g>
      <circle cx={pin.x} cy={pin.y} r="3.5" fill="#d4af37" stroke="#8a6d1b" strokeWidth="0.5" />
      <circle cx={pin.x} cy={pin.y} r="1.7" fill="#eceef1" stroke="#6b7280" strokeWidth="0.4" />
      <text
        x={left ? pin.x + 5.2 : pin.x - 5.2} y={pin.y}
        textAnchor={left ? "start" : "end"} dominantBaseline="central"
        fontSize="4.1" fontFamily={MONO} fontWeight="700" fill={SILK}
      >
        {pin.label}
      </text>
    </g>
  );
}

export function Esp32DevKitSvg() {
  const pads = Array.from({ length: 14 }, (_, i) => 30 + i * 5);
  return (
    <svg viewBox={`0 0 ${ESP32.w} ${ESP32.h}`} role="img" aria-label="ESP32 DevKit board" className="block w-full h-full">
      <g aria-hidden="true">
        <defs>
          <linearGradient id="esp-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eef0f3" />
            <stop offset="0.5" stopColor="#c5cad1" />
            <stop offset="1" stopColor="#9399a2" />
          </linearGradient>
        </defs>

        <g transform={`translate(${ESP32.ox} ${ESP32.oy})`}>
          {/* PCB */}
          <rect width="110" height="214" rx="3" fill="#15171c" stroke="#343842" strokeWidth="0.8" />
          <g fill="none" stroke="#262a33" strokeWidth="0.9">
            <path d="M12 60V104H24M98 60V110H86M30 130H20V160M80 132H92V170M55 164V190" />
          </g>

          {/* ESP32-WROOM-32 module: PCB antenna on top, shield can below */}
          <rect x="21" y="1" width="68" height="100" rx="1" fill="#0b0c0f" stroke="#3a3e48" strokeWidth="0.7" />
          <path
            d="M27 24V6H36V17H44V6H52V17H60V6H68V17H76V6H84V24"
            fill="none" stroke="#c8a23a" strokeWidth="2.2" strokeLinejoin="round"
          />
          <path d="M31 24V11" stroke="#c8a23a" strokeWidth="1.4" />
          {pads.map((y) => (
            <g key={y} fill="#c8a23a">
              <rect x="21" y={y} width="2.4" height="3" />
              <rect x="86.6" y={y} width="2.4" height="3" />
            </g>
          ))}
          <rect x="24" y="27" width="62" height="71" rx="1.5" fill="url(#esp-metal)" stroke="#7b818b" strokeWidth="0.8" />
          <rect x="26.5" y="29.5" width="57" height="66" rx="1" fill="none" stroke="#a9afb8" strokeWidth="0.5" />
          <g fontFamily={SANS} fill="#4b5059" textAnchor="middle">
            <text x="55" y="42" fontSize="4.6" fontWeight="700" letterSpacing="0.6">ESPRESSIF</text>
            <text x="55" y="56" fontSize="6.4" fontWeight="700">ESP-WROOM-32</text>
            <text x="55" y="84" fontSize="2.9">FCC ID: 2AC7Z-ESPWROOM32</text>
            <text x="55" y="89" fontSize="2.9">Wi-Fi + Bluetooth</text>
          </g>
          <path d="M49 71a8.5 8.5 0 0 1 12 0M51.5 73.5a5 5 0 0 1 7 0" fill="none" stroke="#4b5059" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="55" cy="76.5" r="1.2" fill="#4b5059" />

          {/* 3.3 V regulator, USB bridge, power LED and passives */}
          <rect x="27" y="113" width="17" height="11" rx="1" fill="#1d1e22" stroke="#3a3e48" strokeWidth="0.5" />
          <rect x="29.5" y="107" width="12" height="6" fill="#b9bec6" />
          {[30, 35.5, 41].map((x) => <rect key={x} x={x - 1.1} y="124" width="2.2" height="4" fill="#b9bec6" />)}
          <rect x="44" y="140" width="22" height="22" rx="1" fill="#1d1e22" stroke="#4a4f5a" strokeWidth="0.6" />
          {[144, 148, 152, 156].map((y) => (
            <path key={y} d={`M42 ${y}H44M66 ${y}H68`} stroke="#b9bec6" strokeWidth="1.1" />
          ))}
          <circle cx="47.5" cy="143.5" r="1" fill="#6b7280" />
          <text x="55" y="152.4" textAnchor="middle" fontSize="3.6" fontFamily={MONO} fontWeight="700" fill="#9ca3af">CP2102</text>
          <rect x="70" y="111" width="6" height="3.6" rx="0.6" fill="#ef4444" stroke="#e5e7eb" strokeWidth="0.4" />
          {[[52, 110], [60, 110], [52, 118], [78, 122], [70, 130], [30, 136], [30, 144], [76, 146], [76, 154], [36, 170], [68, 172]].map(([x, y], i) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="3.2" rx="0.5" fill={i % 3 ? "#bfa67a" : "#26282d"} stroke="#aab0b9" strokeWidth="0.4" />
          ))}
          <rect x="60" y="120" width="8" height="6" rx="0.8" fill="#1d1e22" stroke="#4a4f5a" strokeWidth="0.5" />
          <rect x="44" y="170" width="8" height="6" rx="0.8" fill="#1d1e22" stroke="#4a4f5a" strokeWidth="0.5" />

          {/* EN and BOOT buttons either side of the micro-USB socket */}
          {([["EN", 22], ["BOOT", 74]] as const).map(([t, x]) => (
            <g key={t}>
              <text x={x + 7} y="190" textAnchor="middle" fontSize="4" fontFamily={MONO} fontWeight="700" fill={SILK}>{t}</text>
              <rect x={x} y="192" width="14" height="13" rx="1.5" fill="url(#esp-metal)" stroke="#6b7280" strokeWidth="0.6" />
              <circle cx={x + 7} cy="198.5" r="3.4" fill="#111214" stroke="#3a3e48" strokeWidth="0.5" />
            </g>
          ))}
          <rect x="41" y="195" width="28" height="22" rx="2" fill="url(#esp-metal)" stroke="#6b7280" strokeWidth="0.8" />
          <path d="M44 201H66M44 207H66" stroke="#9aa0a8" strokeWidth="0.6" />
          <rect x="45.5" y="212.5" width="19" height="3" rx="1" fill="#2b2f36" />
        </g>

        {ESP32.pins.map((pin) => <EspPin key={pin.id} pin={pin} />)}
      </g>
    </svg>
  );
}
