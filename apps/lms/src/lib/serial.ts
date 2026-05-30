/**
 * Web Serial API types and utilities for ESP32 communication
 */

// Extend Navigator interface for Web Serial API
declare global {
  interface Navigator {
    serial: Serial;
  }

  interface Serial {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialPort extends EventTarget {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
    ondisconnect: ((this: SerialPort, ev: Event) => void) | null;
    addEventListener(type: "disconnect", listener: (this: SerialPort, ev: Event) => void): void;
    removeEventListener(type: "disconnect", listener: (this: SerialPort, ev: Event) => void): void;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    bufferSize?: number;
    flowControl?: "none" | "hardware";
  }

  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }
}

export interface SerialConnection {
  port: SerialPort | null;
  writer: WritableStreamDefaultWriter<Uint8Array> | null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  isConnected: boolean;
}

/**
 * Check if Web Serial API is supported in the current browser
 */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

/**
 * Request and open a serial port connection
 */
export async function connectSerial(): Promise<SerialConnection> {
  if (!isWebSerialSupported()) {
    throw new Error(
      "Web Serial API is not supported. Please use Chrome or Edge."
    );
  }

  const port = await navigator.serial.requestPort();

  await port.open({
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    flowControl: "none",
  });

  const writer = port.writable?.getWriter() ?? null;
  const reader = port.readable?.getReader() ?? null;

  return {
    port,
    writer,
    reader,
    isConnected: true,
  };
}

/**
 * Disconnect from serial port
 */
export async function disconnectSerial(
  connection: SerialConnection
): Promise<void> {
  try {
    if (connection.reader) {
      await connection.reader.cancel();
      connection.reader.releaseLock();
    }
    if (connection.writer) {
      await connection.writer.close();
    }
    if (connection.port) {
      await connection.port.close();
    }
  } catch (error) {
    // port may already be closed — safe to ignore
    void error;
  }
}

/**
 * Send data over serial connection
 */
export async function sendData(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: string
): Promise<void> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  
  // Send in chunks for reliability with MicroPython
  const CHUNK_SIZE = 64;
  for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
    const chunk = encoded.slice(i, i + CHUNK_SIZE);
    await writer.write(chunk);
    // Small delay between chunks to let ESP32 process
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * Send code to ESP32 using REPL paste mode (Ctrl+E)
 * This directly executes code on the REPL without needing a custom main.py
 */
export async function sendCodeToESP32(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  code: string,
  useMarkers = false
): Promise<void> {
  const encoder = new TextEncoder();
  
  if (useMarkers) {
    // Use ###START### / ###END### markers for custom main.py hot reload
    const wrappedCode = `###START###\n${code}\n###END###\n`;
    await sendData(writer, wrappedCode);
    return;
  }
  
  // Default: REPL paste mode
  // Ctrl+C to interrupt any running code
  await writer.write(encoder.encode("\x03"));
  await new Promise((r) => setTimeout(r, 100));
  
  // Ctrl+C again to be sure
  await writer.write(encoder.encode("\x03"));
  await new Promise((r) => setTimeout(r, 100));
  
  // Ctrl+E to enter paste mode
  await writer.write(encoder.encode("\x05"));
  await new Promise((r) => setTimeout(r, 100));
  
  // Send code in small chunks
  const lines = code.split("\n");
  for (const line of lines) {
    await writer.write(encoder.encode(line + "\n"));
    await new Promise((r) => setTimeout(r, 20));
  }
  
  // Ctrl+D to execute
  await writer.write(encoder.encode("\x04"));
}

/**
 * Upload code to ESP32 as main.py (persistent storage)
 * This saves the code to the ESP32's filesystem so it runs on boot
 */
export async function uploadCodeToESP32(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  code: string,
  onProgress?: (message: string) => void
): Promise<void> {
  const encoder = new TextEncoder();
  
  onProgress?.("Interrupting any running code...");
  
  // Ctrl+C to interrupt any running code
  await writer.write(encoder.encode("\x03"));
  await new Promise((r) => setTimeout(r, 200));
  await writer.write(encoder.encode("\x03"));
  await new Promise((r) => setTimeout(r, 200));
  
  onProgress?.("Entering raw REPL mode...");
  
  // Enter raw REPL mode (Ctrl+A)
  await writer.write(encoder.encode("\x01"));
  await new Promise((r) => setTimeout(r, 100));
  
  // Create a script that writes to main.py
  const escapedCode = code
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n");
  
  const uploadScript = `
import os
try:
    os.remove('main.py')
except:
    pass
f = open('main.py', 'w')
f.write('${escapedCode}')
f.close()
print('UPLOAD_SUCCESS')
`;

  onProgress?.("Writing main.py to ESP32...");
  
  // Send the upload script
  for (const line of uploadScript.split("\n")) {
    await writer.write(encoder.encode(line + "\n"));
    await new Promise((r) => setTimeout(r, 30));
  }
  
  // Ctrl+D to execute in raw REPL
  await writer.write(encoder.encode("\x04"));
  await new Promise((r) => setTimeout(r, 500));
  
  // Exit raw REPL (Ctrl+B)
  await writer.write(encoder.encode("\x02"));
  await new Promise((r) => setTimeout(r, 100));
  
  onProgress?.("Upload complete! Code will run on next boot.");
}
