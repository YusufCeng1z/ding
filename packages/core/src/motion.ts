import type { SpringConfig } from './spring';

/** Mass-spring-damper on one number. Keeps velocity when the target moves, so retargeting stays fluid. */
export class Spring {
  v = 0;
  to: number;
  cfg: Required<SpringConfig>;
  constructor(public x: number, cfg: SpringConfig) {
    this.to = x;
    this.cfg = { stiffness: 170, damping: 18, mass: 1, ...cfg };
  }
  tune(c: SpringConfig) {
    Object.assign(this.cfg, c);
  }
  /** Advance dt seconds. Returns true while still moving. */
  step(dt: number): boolean {
    const { stiffness: k, damping: c, mass: m } = this.cfg;
    const h = 1 / 240;
    for (let t = 0; t < dt; t += h) {
      this.v += ((-k * (this.x - this.to) - c * this.v) / m) * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.v) < 0.05 && Math.abs(this.x - this.to) < 0.05) {
      this.x = this.to;
      this.v = 0;
      return false;
    }
    return true;
  }
}

// One shared rAF loop for every animating toast.
const tasks = new Set<(dt: number) => boolean>();
let raf = 0;
let last = 0;
function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  for (const t of tasks) if (!t(dt)) tasks.delete(t);
  raf = tasks.size ? requestAnimationFrame(tick) : 0;
}
/** Stop a task added with `run`, for an element that is going away. */
export function stop(task: (dt: number) => boolean): void {
  tasks.delete(task);
}
/** Run `task(dt)` each frame until it returns false. Re-adding the same function is a no-op. */
export function run(task: (dt: number) => boolean): void {
  tasks.add(task);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}
