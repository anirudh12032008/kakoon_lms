/**
 * Local animation registry — persists to localStorage.
 *
 * Each entry stores the full frame data so animations can be
 * uploaded to the device at any time, even without re-opening the designer.
 */

export const ANIM_REGISTRY_KEY = "kakoon-oled-anims";

export interface AnimEntry {
  name: string;
  fps: number;
  frameCount: number;
  /** Flat pixel arrays (0 or 1), 128*64 values per frame */
  frames: number[][];
  /** True once the animation has been successfully uploaded to ESP32 */
  onDevice: boolean;
  savedAt: string;
}

export function loadAnimRegistry(): AnimEntry[] {
  try {
    const raw = localStorage.getItem(ANIM_REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as AnimEntry[]) : [];
  } catch { return []; }
}

export function saveAnimRegistry(entries: AnimEntry[]): void {
  try {
    localStorage.setItem(ANIM_REGISTRY_KEY, JSON.stringify(entries));
  } catch { /* quota or private browsing */ }
}

export function upsertAnim(entry: Omit<AnimEntry, "savedAt"> & { savedAt?: string }): void {
  const list = loadAnimRegistry();
  saveAnimRegistry([
    ...list.filter(e => e.name !== entry.name),
    { ...entry, savedAt: entry.savedAt ?? new Date().toISOString() },
  ]);
}

export function removeAnim(name: string): void {
  saveAnimRegistry(loadAnimRegistry().filter(e => e.name !== name));
}

export function markOnDevice(name: string, on: boolean): void {
  saveAnimRegistry(
    loadAnimRegistry().map(e => e.name === name ? { ...e, onDevice: on } : e)
  );
}

/** Compute the safe filesystem name (matches what EditorPage uploads as) */
export function toSafeName(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
}
