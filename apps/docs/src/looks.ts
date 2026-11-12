import { toast, ICONS } from '@yusufceng1z/ding';

/** One customised toast style. The landing page and the playground share this, so they always agree on what a style means. */
export type ColorKey = 'bg' | 'fg' | 'success' | 'error' | 'warning' | 'info';
/** `on` is the text and icon color on a filled toast. */
export type Colors = Partial<Record<ColorKey | 'on', string>>;
export type Motion = 'default' | 'soft' | 'snappy';
export interface Look {
  theme: 'light' | 'dark';
  radius: number;
  size: 44 | 56;
  colors: Colors;
  filled: boolean;
  motion: Motion;
  icon: 'default' | 'heart';
}

export const COLORS: [ColorKey, string][] = [['bg', 'Background'], ['fg', 'Text'], ['success', 'Success'], ['error', 'Error'], ['warning', 'Warning'], ['info', 'Info']];
export const BASE: Record<Look['theme'], Record<ColorKey, string>> = {
  light: { bg: '#ffffff', fg: '#0f0f13', success: '#12a36b', error: '#e5484d', warning: '#c77d00', info: '#2f7de1' },
  dark: { bg: '#0c0c0d', fg: '#fafafa', success: '#4ade80', error: '#f87171', warning: '#fbbf24', info: '#60a5fa' },
};
export const DEFAULT: Look = { theme: 'light', radius: 22, size: 44, colors: {}, filled: false, motion: 'default', icon: 'default' };

/** Status surfaces for filled toasts, dark enough for white text. */
export const FILL = { success: '#15803d', error: '#dc2626', warning: '#b45309', info: '#1d4ed8', loading: '#374151' } as const;
const SPRINGS: Record<Motion, { enter: { stiffness: number; damping: number }; morph: { stiffness: number; damping: number } }> = {
  default: { enter: { stiffness: 320, damping: 26 }, morph: { stiffness: 340, damping: 27 } },
  soft: { enter: { stiffness: 170, damping: 12 }, morph: { stiffness: 220, damping: 15 } },
  snappy: { enter: { stiffness: 520, damping: 32 }, morph: { stiffness: 560, damping: 34 } },
};
const RING = ICONS.success[0]!;
const ICON_DEFAULT = [...ICONS.success];
const ICON_HEART = [RING, 'M12 16.4s-3.8-2.3-3.8-5a2.1 2.1 0 0 1 3.8-1.2a2.1 2.1 0 0 1 3.8 1.2c0 2.7-3.8 5-3.8 5z'];

export const LOOKS: Record<string, Look> = {
  Default: DEFAULT,
  Filled: { ...DEFAULT, filled: true },
  Midnight: { ...DEFAULT, theme: 'dark', radius: 16, colors: { bg: '#0b1220', fg: '#e5edff', success: '#34d399', error: '#f87171', warning: '#fbbf24', info: '#38bdf8' } },
  Brand: { ...DEFAULT, radius: 8, colors: { bg: '#1e3a8a', fg: '#ffffff', success: '#4ade80', error: '#fca5a5', warning: '#fcd34d', info: '#93c5fd' } },
  Warm: { ...DEFAULT, radius: 12, colors: { bg: '#fff7ed', fg: '#431407', success: '#15803d', error: '#c2410c', warning: '#b45309', info: '#1d4ed8' } },
  Square: { ...DEFAULT, radius: 4 },
  Large: { ...DEFAULT, size: 56, radius: 16 },
  Bouncy: { ...DEFAULT, motion: 'soft' },
  Hearts: { ...DEFAULT, icon: 'heart', radius: 18, colors: { success: '#e11d48' } },
};

/** The CSS a user would paste. The page applies exactly this text, so the preview and the snippet cannot drift apart. */
export function lookCss(l: Look): string {
  const vars: string[] = [];
  if (l.radius !== DEFAULT.radius) vars.push(`--tst-radius: ${l.radius}px;`);
  if (l.size !== DEFAULT.size) vars.push(`--tst-size: ${l.size}px;`, '--tst-pad: 24px;', 'font-size: 16px;');
  for (const [k] of COLORS) if (l.colors[k]) vars.push(`--tst-${k}: ${l.colors[k]};`);
  const out: string[] = [];
  if (vars.length) out.push(`.tst-viewport {\n  ${vars.join('\n  ')}\n}`);
  if (l.filled) {
    for (const t of ['success', 'error', 'warning', 'info', 'loading'] as const) {
      out.push(`.tst-viewport .tst[data-type=${t}] { --fill: ${(t !== 'loading' && l.colors[t]) || FILL[t]}; --on: ${l.colors.on ?? '#fff'}; --c: ${l.colors.on ?? '#fff'}; }`);
    }
  }
  return out.join('\n');
}

/** The `configure` call for the parts CSS cannot do. Empty when nothing differs from the defaults. */
export function lookJs(l: Look): string {
  const o: string[] = [];
  if (l.theme !== DEFAULT.theme) o.push(`theme: '${l.theme}'`);
  if (l.motion !== 'default') {
    const s = SPRINGS[l.motion];
    o.push(`springs: {\n    enter: { stiffness: ${s.enter.stiffness}, damping: ${s.enter.damping} },\n    morph: { stiffness: ${s.morph.stiffness}, damping: ${s.morph.damping} },\n  }`);
  }
  if (l.icon === 'heart') o.push(`icons: {\n    success: [${ICON_HEART.map((d) => `'${d}'`).join(', ')}],\n  }`);
  return o.length ? `toast.configure({\n  ${o.join(',\n  ')},\n});` : '';
}

let tag: HTMLStyleElement | undefined;
function apply(l: Look) {
  tag ??= Object.assign(document.createElement('style'), { id: 'ding-look' });
  tag.textContent = lookCss(l);
  document.head.append(tag); // last in the head, so it wins over the library's own stylesheet
  toast.configure({ springs: SPRINGS[l.motion], icons: { success: l.icon === 'heart' ? ICON_HEART : ICON_DEFAULT } });
}

/**
 * Switch look, then run `then` (usually: show a sample toast).
 * The pill size is read when a toast is created, and springs only apply to new toasts,
 * so when either changes the open toast leaves first.
 */
export function restyle(prev: Look, next: Look, then: () => void) {
  if (prev.size !== next.size || prev.motion !== next.motion) {
    toast.dismiss();
    setTimeout(() => (apply(next), then()), 550);
  } else {
    apply(next);
    then();
  }
}
