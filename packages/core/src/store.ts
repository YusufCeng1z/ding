import type {
  Position, PromiseMessages, Theme, ToastItem, ToastLabels, ToasterState, ToastOptions, ToastPatch, ToastType,
} from './types';
import { chime } from './sound.ts';

export const TIMING = {
  /** shape arrives, then the pill opens */
  openDelay: 450,
  /** text erase + shrink back to shape */
  closing: 340,
  /** shape leaves the screen */
  exit: 220,
  duration: 5000,
};

/** Errors, toasts with an action, and loading hold until dismissed (WCAG 2.2.2). */
const autoDuration = (type: ToastType, hasAction: boolean) =>
  type === 'loading' || type === 'error' || hasAction ? 0 : TIMING.duration;

interface Entry {
  phaseTimer?: ReturnType<typeof setTimeout>;
  lifeTimer?: ReturnType<typeof setTimeout>;
  startedAt: number;
  /** ms left before auto-close; 0 = sticky */
  remaining: number;
  /** full duration, restored when the toast is bumped */
  base: number;
  paused: boolean;
}

const DEFAULT_LABELS: ToastLabels = { region: 'Notifications', dismiss: 'Dismiss notification' };

const definedOnly = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

export function createToaster() {
  let state: ToasterState = { toasts: [], position: 'top-center', theme: 'system', labels: DEFAULT_LABELS, status: '', alert: '' };
  let flip = false;
  const subs = new Set<() => void>();
  const entries = new Map<string, Entry>();
  let counter = 0;
  // sound: off by default. true = built-in synth, a function = your own (e.g. a sound library)
  let sound: boolean | ((type: ToastType) => void) = false;
  let volume = 0.5;
  // One toast at a time: a new call morphs the live toast instead of stacking. Each caller keeps its own id,
  // but only the newest caller may update the shared toast, so a stale loading->success can't hijack it.
  const live = new Map<string, string>(); // caller id -> toast id
  const owner = new Map<string, string>(); // toast id -> newest caller id

  const emit = () => subs.forEach((fn) => fn());
  const setToasts = (toasts: ToastItem[]) => {
    state = { ...state, toasts };
    emit();
  };
  /** Text goes into stable, always-mounted live regions. The trailing NBSP toggle re-announces identical text. */
  const announce = (type: ToastType, title: string, description?: string) => {
    if (typeof sound === 'function') sound(type);
    else if (sound) chime(type, volume);
    flip = !flip;
    const text = (description ? `${title}. ${description}` : title) + (flip ? '\u00a0' : '');
    state = { ...state, [type === 'error' ? 'alert' : 'status']: text };
    emit();
  };
  const find = (id: string) => state.toasts.find((t) => t.id === id);
  const patch = (id: string, p: Partial<ToastItem>) =>
    setToasts(state.toasts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  function startLife(id: string) {
    const e = entries.get(id);
    if (!e) return;
    clearTimeout(e.lifeTimer);
    e.lifeTimer = undefined;
    if (find(id)?.phase !== 'open' || e.paused || e.remaining <= 0) return;
    e.startedAt = Date.now();
    e.lifeTimer = setTimeout(() => dismiss(id), e.remaining);
  }

  function show(type: ToastType, title: string, opts: ToastOptions = {}): string {
    if (opts.id === undefined && !opts.action && !opts.secondary && !opts.image && !opts.meta) {
      // only a repeat of the newest toast collapses; an older identical one stays separate
      const dup = state.toasts.at(-1);
      if (dup && dup.type === type && dup.title === title && dup.description === opts.description && (dup.phase === 'enter' || dup.phase === 'open')) {
        bump(dup.id);
        return dup.id;
      }
    }
    const id = opts.id ?? `toast-${++counter}`;
    const cur = state.toasts.filter((t) => t.phase === 'enter' || t.phase === 'open').at(-1);
    if (cur) {
      live.set(id, cur.id);
      owner.set(cur.id, id);
      patch(cur.id, { count: 1 });
      apply(cur.id, {
        type, title, description: opts.description ?? '', action: opts.action ?? null, secondary: opts.secondary ?? null, meta: opts.meta ?? null, image: opts.image ?? null,
        progress: opts.progress ?? null, ...(opts.duration !== undefined && { duration: opts.duration }),
      });
      return id;
    }
    owner.set(id, id);
    const first = opts.duration ?? autoDuration(type, !!(opts.action || opts.secondary));
    const e: Entry = { startedAt: 0, remaining: first, base: first, paused: false };
    entries.set(id, e);
    setToasts([
      ...state.toasts,
      { id, type, title, description: opts.description, phase: 'enter', duration: e.remaining, action: opts.action, secondary: opts.secondary, meta: opts.meta, image: opts.image, progress: opts.progress, count: 1 },
    ]);
    announce(type, title, opts.description);
    e.phaseTimer = setTimeout(() => {
      if (find(id)?.phase !== 'enter') return;
      patch(id, { phase: 'open' });
      startLife(id);
    }, TIMING.openDelay);
    return id;
  }

  function update(callerId: string, p: ToastPatch) {
    const id = live.get(callerId) ?? callerId;
    if (owner.get(id) === callerId) apply(id, p);
  }

  function apply(id: string, p: ToastPatch) {
    const t = find(id);
    const e = entries.get(id);
    if (!t || !e) return;
    patch(id, {
      ...(p.title !== undefined && { title: p.title }),
      ...(p.description !== undefined && { description: p.description }),
      ...(p.progress !== undefined && { progress: p.progress ?? undefined }),
      ...(p.action !== undefined && { action: p.action ?? undefined }),
      ...(p.secondary !== undefined && { secondary: p.secondary ?? undefined }),
      ...(p.meta !== undefined && { meta: p.meta ?? undefined }),
      ...(p.image !== undefined && { image: p.image ?? undefined }),
      ...(p.type !== undefined && { type: p.type }),
    });
    if (p.duration !== undefined) e.remaining = p.duration;
    else if (p.type !== undefined || p.action !== undefined || p.secondary !== undefined) {
      const n = find(id)!;
      e.remaining = autoDuration(n.type, !!(n.action || n.secondary));
    }
    if (p.duration !== undefined || p.type !== undefined || p.action !== undefined || p.secondary !== undefined) (e.base = e.remaining, patch(id, { duration: e.remaining }));
    startLife(id);
    const quiet = p.progress !== undefined && p.type === undefined; // progress ticks must not spam screen readers
    if (!quiet && (p.title !== undefined || p.description !== undefined || p.type !== undefined)) {
      announce(p.type ?? t.type, p.title ?? t.title, p.description ?? t.description);
    }
  }

  /** Run a toast's action. A returned patch morphs the toast in place; otherwise it closes. */
  function act(id: string, which: 'action' | 'secondary' = 'action') {
    const result = find(id)?.[which]?.onClick();
    if (result && typeof result === 'object') apply(id, { action: null, secondary: null, ...result });
    else dismiss(id);
  }

  function bump(id: string) {
    const e = entries.get(id);
    const t = find(id);
    if (!e || !t) return;
    patch(id, { count: t.count + 1 });
    e.remaining = e.base;
    startLife(id);
  }

  /** immediate: skip the text-erase/shrink step (used after a drag-away) */
  function dismiss(id?: string, opts: { immediate?: boolean } = {}) {
    if (id === undefined) return state.toasts.forEach((t) => dismiss(t.id, opts));
    id = live.get(id) ?? id;
    const t = find(id);
    const e = entries.get(id);
    if (!t || !e || t.phase === 'exit' || (t.phase === 'closing' && !opts.immediate)) return;
    clearTimeout(e.phaseTimer);
    clearTimeout(e.lifeTimer);
    const leave = () => {
      patch(id, { phase: 'exit' });
      e.phaseTimer = setTimeout(() => {
        entries.delete(id);
        owner.delete(id);
        live.forEach((v, k) => v === id && live.delete(k));
        setToasts(state.toasts.filter((x) => x.id !== id));
      }, TIMING.exit);
    };
    if (opts.immediate) return leave();
    patch(id, { phase: 'closing' });
    e.phaseTimer = setTimeout(leave, TIMING.closing);
  }

  function pause(id?: string) {
    if (id === undefined) return [...entries.keys()].forEach(pause);
    const e = entries.get(id);
    if (!e || e.paused) return;
    e.paused = true;
    if (e.lifeTimer) {
      clearTimeout(e.lifeTimer);
      e.lifeTimer = undefined;
      e.remaining = Math.max(0, e.remaining - (Date.now() - e.startedAt));
    }
  }

  function resume(id?: string) {
    if (id === undefined) return [...entries.keys()].forEach(resume);
    const e = entries.get(id);
    if (!e) return;
    e.paused = false;
    startLife(id);
  }

  function promise<T>(p: Promise<T> | (() => Promise<T>), m: PromiseMessages<T>): Promise<T> {
    const id = show('loading', m.loading);
    const pr = typeof p === 'function' ? p() : p;
    pr.then(
      (v) => update(id, { type: 'success', title: typeof m.success === 'function' ? m.success(v) : m.success }),
      (err) => update(id, { type: 'error', title: typeof m.error === 'function' ? m.error(err) : m.error }),
    );
    return pr;
  }

  return {
    show,
    success: (title: string, o?: ToastOptions) => show('success', title, o),
    error: (title: string, o?: ToastOptions) => show('error', title, o),
    warning: (title: string, o?: ToastOptions) => show('warning', title, o),
    info: (title: string, o?: ToastOptions) => show('info', title, o),
    loading: (title: string, o?: ToastOptions) => show('loading', title, o),
    promise,
    update,
    act,
    dismiss,
    pause,
    resume,
    configure(c: {
      position?: Position;
      theme?: Theme;
      /** Partial: keys you leave out keep their current value. */
      labels?: Partial<ToastLabels>;
      sound?: boolean | ((type: ToastType) => void);
      volume?: number;
    }) {
      if (c.sound !== undefined) sound = c.sound;
      if (c.volume !== undefined) volume = c.volume;
      state = {
        ...state,
        ...(c.position && { position: c.position }),
        ...(c.theme && { theme: c.theme }),
        // undefined keys are skipped so `{ region: undefined }` keeps the current label
        ...(c.labels && { labels: { ...state.labels, ...definedOnly(c.labels) } }),
      };
      emit();
    },
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => void subs.delete(fn);
    },
    getState: () => state,
  };
}

export type Toaster = ReturnType<typeof createToaster>;
export const toast: Toaster = createToaster();
