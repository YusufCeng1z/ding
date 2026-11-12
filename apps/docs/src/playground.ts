import './site.css';
import './playground.css';
import { mountToaster, toast, type ToastType } from '@yusufceng1z/ding';
import { BASE, COLORS, DEFAULT, FILL, LOOKS, lookCss, lookJs, restyle, type ColorKey, type Look, type Motion } from './looks';

const SAMPLES: [ToastType, string, object][] = [
  ['success', 'Changes saved', { description: 'Everything is up to date.', action: { label: 'Undo', onClick: () => undefined } }],
  ['error', 'Payment failed', { description: 'Your card was declined.' }],
  ['warning', 'Storage almost full', {}],
  ['info', 'Update available', { action: { label: 'Reload', onClick: () => undefined }, secondary: { label: 'Later', onClick: () => undefined } }],
];

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
};
const clone = (l: Look): Look => ({ ...l, colors: { ...l.colors } });

let look = clone(DEFAULT);
let current = 0;

// the real toaster, moved into the stage so the preview is the actual component
mountToaster({ theme: look.theme, position: 'top-center', labels: { region: 'Toast preview' } });
const viewport = $<HTMLElement>('.tst-viewport');
const stage = $('#stage');
stage.prepend(viewport);

let n = 0;
let id = 'pg-0';
/** Show the current sample. While one is open it morphs; otherwise a new id keeps a leaving toast from removing it. */
function fire() {
  const open = toast.getState().toasts.some((t) => t.phase === 'enter' || t.phase === 'open');
  if (!open) id = `pg-${++n}`;
  const [type, title, o] = SAMPLES[current]!;
  toast.show(type, title, { id, duration: 0, ...o });
}

/** Every change goes through here: update the look, the controls and the snippet, then show a toast. */
function set(patch: Partial<Look>) {
  const prev = look;
  look = { ...look, ...patch, colors: patch.colors ?? look.colors };
  if (patch.theme) toast.configure({ theme: look.theme });
  restyle(prev, look, fire);
  // a resting toast does not redraw its corners on its own, so apply the new radius to it directly
  if (patch.radius !== undefined) {
    document.querySelectorAll<HTMLElement>('.tst').forEach((e) => e.style.setProperty('--r', `${Math.min(e.offsetHeight / 2, look.radius)}px`));
  }
  refresh();
}
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const later = (key: string, f: () => void) => (clearTimeout(timers[key]), (timers[key] = setTimeout(f, 120)));

$('#next').onclick = () => {
  current = (current + 1) % SAMPLES.length;
  fire();
};

// option groups: one pressed button each
function options<T extends string | number>(sel: string, items: [T, string][], get: () => T, onPick: (v: T) => void) {
  const btns = items.map(([v, label]) => {
    const b = el('button', '', label);
    b.type = 'button';
    b.onclick = () => onPick(v);
    $(sel).append(b);
    return [v, b] as const;
  });
  return () => btns.forEach(([v, b]) => b.setAttribute('aria-pressed', String(v === get())));
}
const syncs = [
  options<44 | 56>('#size', [[44, 'Normal'], [56, 'Large']], () => look.size, (size) => set({ size })),
  options<'light' | 'dark'>('#theme', [['light', 'Light'], ['dark', 'Dark']], () => look.theme, (theme) => set({ theme })),
  options<'solid' | 'filled'>('#filled', [['solid', 'Solid'], ['filled', 'Filled']], () => (look.filled ? 'filled' : 'solid'), (v) => set({ filled: v === 'filled' })),
  options<Motion>('#motion', [['default', 'Default'], ['soft', 'Bouncy'], ['snappy', 'Snappy']], () => look.motion, (motion) => set({ motion })),
  options<'default' | 'heart'>('#icon', [['default', 'Check'], ['heart', 'Heart']], () => look.icon, (icon) => set({ icon })),
];

// ready-made styles
const presetBtns = Object.entries(LOOKS).map(([name, p]) => {
  const b = el('button');
  b.type = 'button';
  b.textContent = name;
  b.onclick = () => set(clone(p));
  $('#presets').append(b);
  return [name, b] as const;
});

// radius
const radiusInput = $<HTMLInputElement>('#radius');
radiusInput.oninput = () => later('radius', () => set({ radius: Number(radiusInput.value) }));

// colors: click a dot to pick
const swatchList: [ColorKey | 'on', string][] = [...COLORS, ['on', 'Text on color']];
const swatches = swatchList.map(([k, text]) => {
  const input = el('input');
  input.type = 'color';
  input.setAttribute('aria-label', `${text} color`);
  const chip = el('span', 'chip');
  const hex = el('code');
  const name = el('span', 'name', text);
  name.append(hex);
  const label = el('label', 'sw');
  label.append(input, chip, name);
  input.oninput = () => later('color', () => set({ colors: { ...look.colors, [k]: input.value.toLowerCase() } }));
  $('#colors').append(label);
  return () => {
    const isOn = k === 'on';
    label.hidden = isOn && !look.filled; // text-on-color only matters for filled toasts
    const v = look.colors[k] ?? (isOn ? '#ffffff' : look.filled && k in FILL ? FILL[k as keyof typeof FILL] : BASE[look.theme][k as ColorKey]);
    input.value = v;
    chip.style.background = v;
    hex.textContent = v;
  };
});

$('#reset').onclick = () => set(clone(DEFAULT));

const code = $('#css');
function snippet() {
  const css = lookCss(look);
  const js = lookJs(look);
  return [css && `/* styles.css */\n${css}`, js && `// once, at startup\n${js}`].filter(Boolean).join('\n\n') || '/* No changes yet */';
}
function refresh() {
  stage.dataset.theme = look.theme;
  radiusInput.value = String(look.radius);
  $<HTMLOutputElement>('#radius-out').value = `${look.radius} px`;
  swatches.forEach((s) => s());
  syncs.forEach((s) => s());
  code.textContent = snippet();
  for (const [name, b] of presetBtns) {
    const p = LOOKS[name]!;
    b.setAttribute('aria-pressed', String(JSON.stringify(p) === JSON.stringify(look) || (name === 'Default' && JSON.stringify(look) === JSON.stringify(DEFAULT))));
  }
}

// copy
const status = $('#status');
const copy = $<HTMLButtonElement>('#copy');
let resetCopy: ReturnType<typeof setTimeout>;
copy.onclick = async () => {
  clearTimeout(resetCopy);
  try {
    await navigator.clipboard.writeText(code.textContent ?? '');
    copy.textContent = 'Copied';
    status.textContent = 'Code copied to clipboard.';
  } catch {
    getSelection()?.selectAllChildren(code);
    copy.textContent = 'Selected';
    status.textContent = 'Code selected. Use your device’s copy command.';
  }
  resetCopy = setTimeout(() => {
    copy.textContent = 'Copy';
    status.textContent = '';
  }, 1600);
};

set(clone(DEFAULT));
