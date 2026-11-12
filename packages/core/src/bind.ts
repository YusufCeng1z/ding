import { toast, type Toaster } from './store';
import { Spring, run } from './motion';
import { getSpringConfigs, getSprings } from './styles';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/**
 * Drives the pill. Width, height and entrance position are springs; text and action
 * reveal are *derived* from the live width (--tp, --ap), so box and content stay locked together.
 */
function watchMotion(slot: HTMLElement, id: string, t: Toaster): () => void {
  const pill = slot.firstElementChild;
  if (!(pill instanceof HTMLElement)) return () => {};
  const body = pill.querySelector<HTMLElement>('.tst-body');
  const cs = getComputedStyle(pill);
  const SIZE = parseFloat(cs.getPropertyValue('--tst-size')) || 44;
  const dir = Number(cs.getPropertyValue('--tst-dir')) || -1;
  const Y0 = dir * (SIZE + (parseFloat(cs.getPropertyValue('--tst-pad')) || 16) + 24);
  let maxR = 24; // re-read each frame so a changed --tst-radius shows up on an open toast
  const readR = () => {
    const v = parseFloat(cs.getPropertyValue('--tst-radius'));
    return (maxR = Number.isNaN(v) ? 24 : v); // 0 is a valid radius: square corners
  };
  readR();
  const num = (name: string, d: number) => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isNaN(v) ? d : v;
  };
  const s0 = num('--tst-enter-scale', 0.5); // entrance starts at this scale (1 = pure slide)
  const stretchOn = num('--tst-stretch', 1); // 0 disables velocity stretch
  const cfg = getSpringConfigs();

  const w = new Spring(SIZE, cfg.morph);
  const h = new Spring(SIZE, cfg.morph);
  const y = new Spring(Y0, cfg.enter);
  y.to = 0;
  const x = new Spring(0, { stiffness: 520, damping: 13 }); // lateral shake for errors
  let phase = t.getState().toasts.find((x) => x.id === id)?.phase ?? 'enter';
  let copyEnd = SIZE, actionW = 0, fullW = SIZE, fullH = SIZE;

  const apply = () => {
    const tp = clamp((w.x - SIZE) / Math.max(1, copyEnd - SIZE));
    // action to the right of the copy: reveal as the width reaches it. Stacked below: follow the text, a beat later.
    const ap = actionW > 2 ? clamp((w.x - copyEnd) / actionW) : clamp((tp - 0.45) / 0.55);
    const e = (y.x - Y0) / -Y0; // entrance progress, overshoots slightly past 1
    const stretch = clamp(Math.abs(y.v) / 6000, 0, 0.18) * stretchOn; // arrival: stretch along travel
    const squash = clamp(Math.abs(w.v) / 20000, 0, 0.05); // opening: tiny vertical squash
    const k = s0 + (1 - s0) * e;
    pill.style.width = `${w.x}px`;
    pill.style.height = `${h.x}px`;
    pill.style.setProperty('--r', `${Math.min(h.x / 2, readR())}px`);
    pill.style.translate = `${x.x}px ${y.x}px`;
    pill.style.scale = `${k * (1 - stretch * 0.7) * (1 + squash * 0.5)} ${k * (1 + stretch) * (1 - squash)}`;
    pill.style.opacity = String(clamp(e * 2));
    pill.style.setProperty('--tp', tp.toFixed(3));
    pill.style.setProperty('--ap', ap.toFixed(3));
    // text is only crisp when nothing resamples it: once fully open, drop the blur, the nudge and the layer hint
    pill.toggleAttribute('data-settled', tp >= 1);
  };
  const task = (dt: number) => {
    const moving = [w.step(dt), h.step(dt), y.step(dt), x.step(dt)].some(Boolean);
    apply();
    if (!moving && phase !== 'exit') {
      // at rest there is no transform at all, so the browser never resamples the text at a fractional scale
      pill.style.translate = 'none';
      pill.style.scale = 'none';
    }
    return moving;
  };
  const kick = () => {
    if (reduced()) {
      [w, h, y, x].forEach((s) => ((s.x = s.to), (s.v = 0)));
      apply();
    } else run(task);
  };
  const aim = () => {
    const open = phase === 'open';
    w.to = open ? fullW : SIZE;
    h.to = open ? fullH : SIZE;
  };

  const measure = () => {
    if (!body) return;
    const copy = body.querySelector<HTMLElement>('.tst-copy');
    const action = body.querySelector<HTMLElement>('.tst-action, .tst-close');
    // buttons that wrapped onto their own row need room under them
    const wrapped = !!copy && [...body.querySelectorAll<HTMLElement>('.tst-action, .tst-close')].some((b) => b.offsetTop >= copy.offsetTop + copy.offsetHeight);
    body.toggleAttribute('data-wrapped', wrapped);
    fullW = Math.ceil((SIZE + body.offsetWidth) / 2) * 2; // even width: centering by -50% lands on whole pixels
    fullH = Math.max(SIZE, body.offsetHeight);
    const stacked = !!action && !!copy && action.offsetTop >= copy.offsetTop + copy.offsetHeight; // action sits below the copy (direction-safe)
    copyEnd = action && copy && !stacked ? SIZE + copy.offsetWidth + 6 : fullW;
    actionW = fullW - copyEnd;
    if (phase === 'open') (aim(), kick());
  };

  const ro = new ResizeObserver(measure);
  if (body) ro.observe(body);
  measure();
  if (phase === 'open') [w.x, h.x] = [fullW, fullH];
  kick();

  // content-aware motion: an error shakes its head, a warning hops
  const react = (type: string) => {
    if (reduced()) return;
    if (type === 'error') x.v = 380;
    else if (type === 'warning') y.v = -dir * 200;
    else return;
    kick();
  };
  let lastType = t.getState().toasts.find((e) => e.id === id)?.type;
  let count = t.getState().toasts.find((x) => x.id === id)?.count ?? 1;
  const unsub = t.subscribe(() => {
    const it = t.getState().toasts.find((x) => x.id === id);
    if (!it) return;
    if (it.count > count && phase === 'open') {
      y.v = -dir * 240; // a repeat nudges the pill and lets it settle
      kick();
    }
    count = it.count;
    if (it.type !== lastType) {
      lastType = it.type;
      if (phase === 'open') react(it.type);
    }
    if (it.phase === phase) return;
    phase = it.phase;
    if (phase === 'closing') {
      // closing has its own motion: firmer, no overshoot, and a small swell before it collapses
      w.tune({ stiffness: 380, damping: 36 });
      h.tune({ stiffness: 380, damping: 36 });
      w.v = 320;
    } else {
      w.tune(cfg.morph);
      h.tune(cfg.morph);
      if (phase === 'open') {
        w.v = -260; // anticipation: the dot squeezes in, then springs open
        setTimeout(() => lastType && react(lastType), 200);
      }
    }
    if (phase !== 'exit') (aim(), kick());
  });

  // New text: the old line rolls up and out, the new one rolls in. Width springs on its own via the observer.
  const copy = body?.querySelector<HTMLElement>('.tst-copy');
  const titleOf = () => copy?.querySelector('.tst-title')?.innerHTML;
  const kind = () => `${pill.dataset.type}|${!!pill.querySelector('.tst-progress')}`;
  let snap = copy ? { html: copy.innerHTML, w: copy.offsetWidth, title: titleOf(), kind: kind() } : undefined;
  let ghost: HTMLElement | undefined;
  let lastRoll = 0;
  const mo = new MutationObserver(() => {
    if (!copy || !body) return;
    const prev = snap;
    snap = { html: copy.innerHTML, w: copy.offsetWidth, title: titleOf(), kind: kind() };
    // a ticking description under a steady title (download %) swaps in place; rolling it would make the title flicker.
    // Same for a progress toast that keeps its type: only a real change (loading -> done) rolls.
    if (!prev || prev.html === snap.html || prev.title === snap.title || (prev.kind === snap.kind && snap.kind.endsWith('true')) || phase !== 'open' || reduced()) return;
    // fast tickers (progress %) would stay blurred forever: roll at most every 450ms, swap instantly in between
    if (performance.now() - lastRoll < 450) return;
    lastRoll = performance.now();
    ghost?.remove();
    ghost = document.createElement('div');
    ghost.className = 'tst-copy tst-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${prev.w}px`;
    ghost.innerHTML = prev.html;
    body.append(ghost);
    const g = ghost;
    const easing = 'cubic-bezier(.2,.8,.2,1)';
    g.animate(
      [{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-12px)', filter: 'blur(4px)' }],
      { duration: 280, easing, fill: 'forwards' },
    ).onfinish = () => g.remove();
    copy.animate(
      [{ opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 380, easing },
    );
  });
  if (copy) mo.observe(copy, { childList: true, characterData: true, subtree: true });

  // Spinner: spins by script so it can be caught mid-turn and eased to rest as the arc closes into the success ring.
  // The svg is looked up each time: an image toast has none, and adapters may swap the element.
  const getSvg = () => pill.querySelector<SVGElement>('.tst-svg');
  let spin: Animation | undefined;
  let spinOn: SVGElement | null = null;
  const startSpin = () => {
    spin?.cancel();
    spin = undefined;
    spinOn = getSvg();
    if (spinOn && !reduced()) spin = spinOn.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 800, iterations: Infinity });
  };
  let curType = pill.dataset.type;
  if (curType === 'loading') startSpin();
  // After the first draw-in, marks drawn by an in-place change don't wait for a ring that is already there.
  const ready = setTimeout(() => pill.setAttribute('data-ready', ''), 900);
  const tmo = new MutationObserver(() => {
    const next = pill.dataset.type;
    if (next === curType) return;
    const was = curType;
    curType = next;
    if (next === 'loading') return startSpin();
    // a status change pops the icon in place (the ring stays, the glyph inside redraws)
    const now = getSvg();
    if (now && was !== 'loading' && !reduced()) {
      const { easing, duration } = getSprings().stack;
      now.animate([{ scale: 0.6, opacity: 0.3 }, { scale: 1, opacity: 1 }], { duration, easing });
    }
    const svg = spinOn;
    if (was === 'loading' && spin && svg?.isConnected) {
      const deg = ((Number(spin.currentTime) % 800) / 800) * 360;
      spin.cancel();
      spin = undefined;
      svg.animate([{ rotate: `${deg}deg` }, { rotate: '360deg' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
  });
  // The icon element can be replaced (image <-> status icon, or loading arriving on an image toast).
  const imo = new MutationObserver(() => {
    if (curType === 'loading' && (!spinOn?.isConnected || spinOn !== getSvg())) startSpin();
  });
  imo.observe(pill, { childList: true, subtree: true });
  tmo.observe(pill, { attributes: true, attributeFilter: ['data-type'] });

  return () => {
    clearTimeout(ready);
    imo.disconnect();
    tmo.disconnect();
    spin?.cancel();
    ro.disconnect();
    mo.disconnect();
    unsub();
    ghost?.remove();
  };
}

/** Drag toward the screen edge (or sideways) to dismiss; springs back otherwise. */
function watchDrag(slot: HTMLElement, id: string, t: Toaster): () => void {
  let sx = 0, sy = 0, t0 = 0, active = false;
  const edge = () => (slot.closest<HTMLElement>('.tst-viewport')?.dataset.position?.startsWith('top') ? -1 : 1);

  const down = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('button')) return;
    [sx, sy, t0, active] = [e.clientX, e.clientY, e.timeStamp, true];
    slot.setPointerCapture(e.pointerId);
    slot.setAttribute('data-dragging', '');
  };
  const move = (e: PointerEvent) => {
    if (!active) return;
    const dx = e.clientX - sx;
    let dy = e.clientY - sy;
    if (dy * edge() < 0) dy *= 0.2; // resist dragging into the screen
    slot.style.setProperty('--dx', `${dx}px`);
    slot.style.setProperty('--dy', `${dy}px`);
  };
  const up = (e: PointerEvent) => {
    if (!active) return;
    active = false;
    const dx = e.clientX - sx;
    const rawDy = e.clientY - sy;
    const dy = rawDy * edge(); // >0 = toward the edge
    const speed = Math.hypot(dx, dy) / Math.max(1, e.timeStamp - t0);
    const away = dy > 40 || Math.abs(dx) > 80 || (speed > 0.5 && (dy > 15 || Math.abs(dx) > 15));
    slot.removeAttribute('data-dragging');
    if (away) {
      // fling: keep going in the throw direction, as far as the release speed says
      const len = Math.hypot(dx, rawDy) || 1;
      const reach = Math.max(160, speed * 320);
      slot.setAttribute('data-flung', '');
      slot.style.setProperty('--dx', `${(dx / len) * reach}px`);
      slot.style.setProperty('--dy', `${(rawDy / len) * reach}px`);
      t.dismiss(id, { immediate: true });
    }
    else (slot.style.removeProperty('--dx'), slot.style.removeProperty('--dy'));
  };

  slot.addEventListener('pointerdown', down);
  slot.addEventListener('pointermove', move);
  slot.addEventListener('pointerup', up);
  slot.addEventListener('pointercancel', up);
  return () => {
    slot.removeEventListener('pointerdown', down);
    slot.removeEventListener('pointermove', move);
    slot.removeEventListener('pointerup', up);
    slot.removeEventListener('pointercancel', up);
  };
}

/** Adapter hook-up: call with the `.tst-slot` element (its first child is the pill). Returns cleanup. */
export function bindToast(slot: HTMLElement, id: string, t: Toaster = toast): () => void {
  const stopDrag = watchDrag(slot, id, t);
  const stopMotion = watchMotion(slot, id, t);
  return () => (stopDrag(), stopMotion());
}
