import { api, apiErrorMessage } from "@/shared/api/client";

// SerialPort types come from the global declarations in serial-connect/lib/serial.ts.

const PAGE = 128; // optiboot flash page (Uno/Nano), bytes
const OK = [0x14, 0x10]; // STK_INSYNC, STK_OK
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function compileSketch(code: string, fqbn: string): Promise<string> {
  try {
    const { data } = await api.post<{ hex: string }>("/arduino/compile", { code, fqbn });
    return data.hex;
  } catch (e) {
    throw new Error(apiErrorMessage(e, "Compilation failed"), { cause: e });
  }
}

/** Intel HEX -> contiguous bytes from address 0 (gaps filled with 0xFF). */
function parseHex(hex: string): Uint8Array {
  const chunks: [number, number[]][] = [];
  let size = 0;
  for (const line of hex.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line[0] !== ":") throw new Error("Invalid HEX file");
    const b = line.slice(1).trim().match(/../g)!.map((h) => parseInt(h, 16));
    if (b.some(Number.isNaN) || b.length !== b[0] + 5) throw new Error("Corrupt HEX record");
    if (b.reduce((a, v) => a + v, 0) & 0xff) throw new Error("HEX checksum mismatch");
    if (b[3] === 1) break;
    if (b[3] !== 0) continue; // ponytail: no extended addressing, AVR Uno/Nano flash is < 64 KB
    const addr = (b[1] << 8) | b[2];
    chunks.push([addr, b.slice(4, 4 + b[0])]);
    size = Math.max(size, addr + b[0]);
  }
  const out = new Uint8Array(Math.ceil(size / PAGE) * PAGE).fill(0xff);
  for (const [addr, data] of chunks) out.set(data, addr);
  return out;
}

export async function flashHex(
  port: SerialPort,
  hex: string,
  baud: number,
  onProgress?: (pct: number) => void
): Promise<void> {
  const image = parseHex(hex);
  await port.open({ baudRate: baud });
  const writer = port.writable!.getWriter();
  const reader = port.readable!.getReader();
  let buf: number[] = [];
  let pending: Promise<ReadableStreamReadResult<Uint8Array>> | null = null;

  // Read n bytes, failing after `ms` so a wrong board errors instead of hanging.
  const read = async (n: number, ms: number) => {
    const end = Date.now() + ms;
    while (buf.length < n) {
      pending ??= reader.read();
      const left = end - Date.now();
      const r = left > 0 ? await Promise.race([pending, sleep(left).then(() => null)]) : null;
      if (!r) throw new Error("timeout");
      pending = null;
      if (r.done) throw new Error("Serial port closed");
      buf.push(...r.value);
    }
    return buf.splice(0, n);
  };
  const cmd = async (bytes: number[], ms = 1000) => {
    buf = [];
    await writer.write(new Uint8Array(bytes));
    const r = await read(2, ms);
    if (r[0] !== OK[0] || r[1] !== OK[1]) throw new Error("Unexpected reply from bootloader");
  };

  try {
    // Pulse DTR to reset the board into its bootloader.
    await port.setSignals({ dataTerminalReady: false });
    await sleep(100);
    await port.setSignals({ dataTerminalReady: true });
    await sleep(200);

    let synced = false;
    for (let i = 0; i < 10 && !synced; i++) {
      try {
        await cmd([0x30, 0x20], 300);
        synced = true;
      } catch {
        /* retry */
      }
    }
    if (!synced) throw new Error("Board did not respond. Check the selected board, cable and port.");

    await cmd([0x50, 0x20]); // enter programming mode
    for (let off = 0; off < image.length; off += PAGE) {
      const word = off >> 1;
      await cmd([0x55, word & 0xff, word >> 8, 0x20]);
      await cmd([0x64, PAGE >> 8, PAGE & 0xff, 0x46, ...image.subarray(off, off + PAGE), 0x20], 2000);
      onProgress?.(Math.round(((off + PAGE) / image.length) * 100));
    }
    await cmd([0x51, 0x20]); // leave programming mode (board runs the sketch)
  } finally {
    writer.releaseLock();
    await reader.cancel().catch(() => {});
    reader.releaseLock();
    await port.close().catch(() => {});
  }
}

export async function uploadSketch(
  code: string,
  arduino: { fqbn: string; baud: number },
  port: SerialPort,
  log: (msg: string) => void
): Promise<boolean> {
  try {
    log("Compiling…");
    const hex = await compileSketch(code, arduino.fqbn);
    log("Uploading… 0%");
    let last = 0;
    await flashHex(port, hex, arduino.baud, (pct) => {
      if (pct - last >= 20 || pct === 100) {
        last = pct;
        log(`Uploading… ${pct}%`);
      }
    });
    log("Done");
    return true;
  } catch (e) {
    for (const line of (e instanceof Error ? e.message : String(e)).split("\n")) log(line);
    return false;
  }
}
