/**
 * Catalog of frequent errors that show up in the WebTerminal — both local
 * connection failures and MicroPython runtime tracebacks echoed back from the
 * ESP32. Each has a stable code so we can build a "common errors" help section
 * later and so the popup can give actionable guidance.
 *
 * Codes:
 *   DEV-1xxx — host/serial connection problems
 *   MPY-2xxx — MicroPython runtime errors reported by the device
 *   DEV-1000 — unclassified terminal error (catch-all)
 */

export interface TerminalErrorDef {
  code: string;
  /** Pattern tested against the raw terminal line. */
  match: RegExp;
  /** Short, friendly title shown in the popup. */
  title: string;
  /** One-line next step. */
  hint: string;
}

export const TERMINAL_ERRORS: TerminalErrorDef[] = [
  // ── DEV-1xxx — connection / host ────────────────────────────────────────
  { code: "DEV-1001", match: /not connected/i, title: "Device not connected", hint: "Connect your ESP32 over USB before running code." },
  { code: "DEV-1002", match: /connection failed/i, title: "Couldn't connect to the device", hint: "Replug the board, pick the right port, and try again." },
  { code: "DEV-1003", match: /(send|upload|stop) failed/i, title: "Lost connection to the device", hint: "The board may have been unplugged — reconnect and retry." },
  { code: "DEV-1004", match: /web serial api not supported/i, title: "Browser can't access USB", hint: "Use Chrome or Edge on desktop for USB serial." },

  // ── MPY-2xxx — MicroPython runtime ──────────────────────────────────────
  { code: "MPY-2001", match: /ImportError|ModuleNotFoundError|no module named/i, title: "Missing MicroPython module", hint: "Upload or install the missing library onto the board." },
  { code: "MPY-2002", match: /OSError/i, title: "Hardware / I-O error", hint: "Check wiring, pin numbers, and I2C/SPI addresses." },
  { code: "MPY-2003", match: /SyntaxError|IndentationError/i, title: "Python syntax error", hint: "Fix the highlighted line, then run again." },
  { code: "MPY-2004", match: /NameError/i, title: "Undefined name", hint: "A variable or function is used before it's defined." },
  { code: "MPY-2005", match: /MemoryError/i, title: "Out of memory", hint: "Free up RAM — shrink buffers or split the program." },
  { code: "MPY-2006", match: /TypeError|ValueError|AttributeError|IndexError|KeyError|ZeroDivisionError/i, title: "Runtime error", hint: "Check the values and types your code is using." },
];

const GENERIC_CODE = "DEV-1000";

/** Strips the leading timestamp `[hh:mm:ss]` and any leading status emoji. */
function cleanLine(line: string): string {
  return line.replace(/^\[\d{1,2}:\d{2}:\d{2}(?:\s?[AP]M)?\]\s*/i, "").replace(/^[^\w(]+/, "").trim();
}

export interface TerminalError {
  code: string;
  /** Friendly title for the popup. */
  title: string;
  /** Guidance, when known. */
  hint?: string;
  /** The cleaned original line, for reference. */
  detail: string;
}

/**
 * Classifies a single terminal log line. Returns a coded error when the line
 * looks like an error/traceback, otherwise `null` (normal output — no popup).
 */
export function classifyTerminalError(line: string): TerminalError | null {
  for (const def of TERMINAL_ERRORS) {
    if (def.match.test(line)) {
      return { code: def.code, title: def.title, hint: def.hint, detail: cleanLine(line) };
    }
  }
  const looksLikeError = /|traceback|exception|\bfail(?:ed)?\b|\berror\b|\w+Error:/i.test(line);
  if (looksLikeError) {
    return { code: GENERIC_CODE, title: "Terminal error", detail: cleanLine(line) };
  }
  return null;
}
