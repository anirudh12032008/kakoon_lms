/**
 * Dependency-free canvas confetti. One call = one burst; the canvas is
 * created on demand and removed when the last particle dies.
 */

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
  rot: number; vrot: number;
  shape: "rect" | "circle";
  life: number; // 0..1, counts down
}

function themeColors(): string[] {
  const s = getComputedStyle(document.documentElement);
  const read = (v: string, fb: string) => s.getPropertyValue(v).trim() || fb;
  return [
    read("--k-primary", "#7c3aed"),
    read("--k-secondary", "#d946ef"),
    read("--k-accent", "#06b6d4"),
    "#22c55e", "#f59e0b", "#ffffff",
  ];
}

/**
 * Fires a confetti burst.
 * @param xRatio 0..1 horizontal origin (0 = left edge)
 * @param yRatio 0..1 vertical origin
 * @param count  particle count (~60 small, ~140 big celebration)
 */
export function burstConfetti(xRatio = 0.5, yRatio = 0.4, count = 90) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const colors = themeColors();
  const ox = window.innerWidth * xRatio;
  const oy = window.innerHeight * yRatio;

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x: ox, y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6, // bias upward
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.4 ? "rect" : "circle",
      life: 1,
    };
  });

  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(32, now - last) / 16.67; // normalize to ~60fps steps
    last = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let alive = 0;
    for (const p of particles) {
      if (p.life <= 0) continue;
      p.vy += 0.22 * dt;        // gravity
      p.vx *= 0.985;            // drag
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      p.life -= 0.011 * dt;
      if (p.life <= 0 || p.y > window.innerHeight + 20) { p.life = 0; continue; }
      alive++;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // squash on Y as it tumbles — reads as a fluttering paper strip
        ctx.fillRect(-p.size / 2, (-p.size / 2) * Math.abs(Math.sin(p.rot)), p.size, p.size * Math.abs(Math.sin(p.rot)) + 1);
        ctx.restore();
      }
    }

    if (alive > 0) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);

  // Hard stop in case rAF stalls (e.g. tab hidden mid-burst).
  setTimeout(() => canvas.remove(), 4000);
}
