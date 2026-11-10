import { toast } from './store';
import { injectStyles } from './styles';
import { bindToast } from './bind';
import { ICONS } from './icons';
import type { Position, Theme, ToastItem, ToastLabels } from './types';

// Escape belongs to what the user is working in: a dialog, menu or text field closes or clears itself first.
const BUSY = 'dialog,[role=dialog],[aria-modal=true],[role=menu],[role=listbox],input,textarea,select,[contenteditable]';

/** Shared keyboard handling for every adapter: Escape dismisses, Alt+T moves focus into the toast (which also pauses its timer). */
export function onToastKey(e: KeyboardEvent): void {
  if (e.defaultPrevented || !toast.getState().toasts.length) return;
  if (e.key === 'Escape') {
    if (!document.activeElement?.closest(BUSY)) toast.dismiss();
  } else if (e.altKey && e.code === 'KeyT') {
    // a button if the toast has one, otherwise the newest toast itself
    const slots = document.querySelectorAll<HTMLElement>('.tst-viewport .tst-slot');
    (document.querySelector<HTMLElement>('.tst-viewport button:not([tabindex="-1"])') ?? slots[slots.length - 1])?.focus();
  }
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: Element) => {
  const n = document.createElement(tag);
  n.className = cls;
  parent?.append(n);
  return n;
};
// width and height are a fallback for when the stylesheet is blocked (a wrong CSP nonce): without them an SVG fills its container
const svg = (cls: string, paths: readonly string[], size: number) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', String(size));
  s.setAttribute('height', String(size));
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', cls);
  for (const d of paths) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    s.append(p);
  }
  return s;
};

/** Framework-free renderer. Returns an unmount function. */
export function mountToaster(
  opts: { position?: Position; theme?: Theme; labels?: Partial<ToastLabels>; nonce?: string } = {},
): () => void {
  if (typeof document === 'undefined') return () => {}; // server render: nothing to mount
  const { nonce, ...config } = opts;
  injectStyles(document, { nonce });
  toast.configure(config);
  const vp = el('div', 'tst-viewport', document.body);
  vp.setAttribute('role', 'region');
  const status = el('div', 'tst-sr', vp);
  status.setAttribute('role', 'status');
  const alert = el('div', 'tst-sr', vp);
  alert.setAttribute('role', 'alert');
  vp.onpointerenter = () => toast.pause();
  vp.onpointerleave = () => toast.resume();
  vp.addEventListener('focusin', (e) => (e.target as Element).matches(':focus-visible') && toast.pause());
  vp.addEventListener('focusout', () => toast.resume());
  document.addEventListener('keydown', onToastKey);

  const nodes = new Map<string, { slot: HTMLElement; off?: () => void; type?: string }>();

  function build(t: ToastItem) {
    const slot = el('div', 'tst-slot', vp);
    slot.tabIndex = -1; // reachable with Alt+T so a toast without buttons can still be paused
    el('div', 'tst', slot);
    return { slot } as { slot: HTMLElement; off?: () => void; type?: string };
  }

  function render() {
    const s = toast.getState();
    vp.dataset.position = s.position;
    vp.dataset.theme = s.theme;
    vp.setAttribute('aria-label', s.labels.region);
    status.textContent = s.status;
    alert.textContent = s.alert;
    const live = new Set(s.toasts.map((t) => t.id));
    for (const [id, n] of nodes) if (!live.has(id)) (n.off?.(), n.slot.remove(), nodes.delete(id));
    s.toasts.forEach((t, idx) => {
      let n = nodes.get(t.id);
      if (!n) nodes.set(t.id, (n = build(t)));
      const i = s.toasts.length - 1 - idx;
      n.slot.style.setProperty('--tst-i', String(i));
      const card = n.slot.firstElementChild as HTMLElement;
      card.dataset.phase = t.phase;
      card.dataset.type = t.type;
      card.style.setProperty('--tst-life', `${t.duration}ms`);
      // icon: rebuilt only when the type or image changes, so its draw-in replays exactly then
      const iconKey = t.image ?? t.type;
      if (n.type !== iconKey) {
        card.querySelector('.tst-icon')?.remove();
        const icon = el('div', 'tst-icon');
        if (t.image) Object.assign(el('img', 'tst-media', icon), { src: t.image, alt: '', width: 28, height: 28 });
        else el('div', 'tst-badge', icon).append(svg('tst-svg', ICONS[t.type], 22));
        card.prepend(icon);
        n.type = iconKey;
      }
      const timed = (t.action || t.secondary) && t.duration > 0;
      const timer = card.querySelector<HTMLElement>('.tst-timer');
      if (!timed || timer?.dataset.k !== String(t.duration)) {
        timer?.remove();
        if (timed) el('div', 'tst-timer', card).dataset.k = String(t.duration);
      }
      let bar = card.querySelector<HTMLElement>('.tst-progress');
      if (t.progress === undefined) bar?.remove();
      else (bar ??= card.insertBefore(el('div', 'tst-progress'), card.firstChild)).style.setProperty('--pg', String(t.progress));
      let body = card.querySelector<HTMLElement>('.tst-body');
      if (!body) {
        body = el('div', 'tst-body', card);
        const copy = el('div', 'tst-copy', body);
        el('div', 'tst-title', copy);
      }
      const copy = body.querySelector('.tst-copy')!;
      const title = copy.querySelector<HTMLElement>('.tst-title')!;
      const label = `${t.title}|${t.count}|${t.meta ?? ''}`;
      if (title.dataset.k !== label) {
        title.textContent = t.title;
        if (t.count > 1) el('span', 'tst-count', title).textContent = `×${t.count}`;
        if (t.meta) el('span', 'tst-meta', title).textContent = t.meta;
        title.dataset.k = label;
      }
      let desc = copy.querySelector('.tst-desc');
      if (!t.description) desc?.remove();
      else (desc ??= el('div', 'tst-desc', copy)).textContent = t.description;
      let sec = body.querySelector<HTMLButtonElement>('.tst-secondary');
      if (!t.secondary) sec?.remove();
      else {
        if (!sec) {
          sec = el('button', 'tst-action tst-secondary');
          sec.type = 'button';
          sec.onclick = () => toast.act(t.id, 'secondary');
          body.insertBefore(sec, body.querySelector('.tst-action, .tst-close'));
        }
        sec.textContent = t.secondary.label;
        sec.tabIndex = t.phase === 'open' ? 0 : -1;
      }
      let act = body.querySelector<HTMLButtonElement>('.tst-action:not(.tst-secondary)');
      if (!t.action) act?.remove();
      else {
        if (!act) {
          act = el('button', 'tst-action');
          act.type = 'button';
          body.insertBefore(act, body.querySelector('.tst-close')); // a close button left from a sticky toast stays last
          act.onclick = () => toast.act(t.id);
        }
        act.textContent = t.action.label;
        act.tabIndex = t.phase === 'open' ? 0 : -1;
      }
      const sticky = t.duration === 0 && t.type !== 'loading' && !t.secondary;
      let close = body.querySelector<HTMLButtonElement>('.tst-close');
      if (!sticky) close?.remove();
      else {
        if (!close) {
          close = el('button', 'tst-close', body);
          close.type = 'button';
          close.append(svg('', ['M6 6l12 12M18 6L6 18'], 12));
          close.onclick = () => toast.dismiss(t.id);
        }
        close.setAttribute('aria-label', s.labels.dismiss);
        close.tabIndex = t.phase === 'open' ? 0 : -1;
      }
      // bind only once the markup exists: the motion code measures the body on its first frame
      n.off ??= bindToast(n.slot, t.id);
    });
  }

  const off = toast.subscribe(render);
  render();
  return () => {
    off();
    document.removeEventListener('keydown', onToastKey);
    nodes.forEach((n) => n.off?.());
    vp.remove();
  };
}
