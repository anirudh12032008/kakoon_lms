export const OLED_W = 128;
export const OLED_H = 64;

export type DitherMode = "none" | "floyd" | "ordered";
export type ScaleMode = "fit" | "fill" | "stretch";

export function flatToNodePixels(flat: number[], w: number, h: number): boolean[][] {
  return Array.from({ length: h }, (_, r) =>
    Array.from({ length: w }, (_, c) => flat[r * w + c] !== 0)
  );
}

export function applyBC(lum: number, brightness: number, contrast: number): number {
  lum = ((lum / 255 - 0.5) * contrast + 0.5) * 255 + brightness;
  return Math.max(0, Math.min(255, lum));
}

export function floydSteinberg(grays: Float32Array, w: number, h: number): number[] {
  const buf = new Float32Array(grays);
  const out = new Array(w * h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const nv  = old < 128 ? 0 : 255;
      out[i] = nv === 0 ? 1 : 0;
      const err = old - nv;
      if (x + 1 < w)              buf[i + 1]     += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0)                buf[i + w - 1] += err * 3 / 16;
                                  buf[i + w]     += err * 5 / 16;
        if (x + 1 < w)           buf[i + w + 1] += err * 1 / 16;
      }
    }
  }
  return out;
}

export const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map(v => v * 17);

export function pixelsFromImageData(
  data: ImageData,
  opts: { threshold: number; brightness: number; contrast: number; invert: boolean; dither: DitherMode }
): number[] {
  const { threshold, brightness, contrast, invert, dither } = opts;
  const grays = new Float32Array(OLED_W * OLED_H);
  for (let i = 0; i < OLED_W * OLED_H; i++) {
    const r = data.data[i * 4], g = data.data[i * 4 + 1], b = data.data[i * 4 + 2];
    grays[i] = applyBC(0.299 * r + 0.587 * g + 0.114 * b, brightness, contrast);
  }
  let bits: number[];
  if (dither === "floyd") {
    bits = floydSteinberg(grays, OLED_W, OLED_H);
  } else if (dither === "ordered") {
    bits = Array.from(grays).map((v, i) => {
      const bv = BAYER4[(Math.floor(i / OLED_W) % 4) * 4 + (i % OLED_W) % 4];
      return v < bv ? 1 : 0;
    });
  } else {
    bits = Array.from(grays).map(v => v < threshold ? 1 : 0);
  }
  return invert ? bits.map(v => v ^ 1) : bits;
}

export function drawSourceToCanvas(
  ctx: CanvasRenderingContext2D,
  src: HTMLImageElement | HTMLVideoElement,
  scaleMode: ScaleMode
) {
  const sw = src instanceof HTMLImageElement ? src.naturalWidth  : (src as HTMLVideoElement).videoWidth;
  const sh = src instanceof HTMLImageElement ? src.naturalHeight : (src as HTMLVideoElement).videoHeight;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, OLED_W, OLED_H);
  if (!sw || !sh) return;
  if (scaleMode === "stretch") {
    ctx.drawImage(src, 0, 0, OLED_W, OLED_H);
  } else if (scaleMode === "fit") {
    const s = Math.min(OLED_W / sw, OLED_H / sh);
    ctx.drawImage(src, (OLED_W - sw * s) / 2, (OLED_H - sh * s) / 2, sw * s, sh * s);
  } else {
    const s = Math.max(OLED_W / sw, OLED_H / sh);
    ctx.drawImage(src, (OLED_W - sw * s) / 2, (OLED_H - sh * s) / 2, sw * s, sh * s);
  }
}
