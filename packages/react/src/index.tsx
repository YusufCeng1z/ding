import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import {
  toast, injectStyles, bindToast, onToastKey, ICONS,
  type Position, type Theme, type ToastItem, type ToastLabels,
} from '@yusufceng1z/ding';

export { toast };
export type { Position, Theme, ToastLabels };

function Item({ t, i, labels }: { t: ToastItem; i: number; labels: ToastLabels }) {
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => (slot.current ? bindToast(slot.current, t.id) : undefined), [t.id]);
  const sticky = t.duration === 0 && t.type !== 'loading' && !t.secondary;
  return (
    <div ref={slot} className="tst-slot" tabIndex={-1} style={{ '--tst-i': i } as CSSProperties}>
      <div
        className={t.className ? `tst ${t.className}` : 'tst'}
        data-phase={t.phase}
        data-type={t.type}
        // Announced through the viewport's persistent live regions, not here.
        style={{ '--tst-life': `${t.duration}ms` } as CSSProperties}
      >
        {(t.action || t.secondary) && t.duration > 0 && <div className="tst-timer" key={t.duration} />}
        {t.progress !== undefined && <div className="tst-progress" style={{ '--pg': t.progress } as CSSProperties} />}
        <div className="tst-icon">
          {t.image ? (
            <img className="tst-media" src={t.image} alt="" width={28} height={28} />
          ) : (
            <div className="tst-badge">
              <svg className="tst-svg" viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
                {ICONS[t.type].map((d) => (
                  <path key={d} d={d} pathLength={1} />
                ))}
              </svg>
            </div>
          )}
        </div>
        <div className="tst-body">
          <div className="tst-copy">
            <div className="tst-title">
              {t.title}
              {t.count > 1 && <span className="tst-count">×{t.count}</span>}
              {t.meta && <span className="tst-meta">{t.meta}</span>}
            </div>
            {t.description && <div className="tst-desc">{t.description}</div>}
          </div>
          {t.secondary && (
            <button type="button" className="tst-action tst-secondary" tabIndex={t.phase === 'open' ? 0 : -1} onClick={() => toast.act(t.id, 'secondary')}>
              {t.secondary.label}
            </button>
          )}
          {t.action && (
            <button
              type="button"
              className="tst-action"
              tabIndex={t.phase === 'open' ? 0 : -1}
              onClick={() => {
                toast.act(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          {sticky && (
            <button type="button" className="tst-close" aria-label={labels.dismiss} tabIndex={t.phase === 'open' ? 0 : -1} onClick={() => toast.dismiss(t.id)}>
              <svg viewBox="0 0 24 24" width={12} height={12} aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Toaster({
  position,
  theme,
  labels,
  nonce,
}: {
  position?: Position;
  theme?: Theme;
  labels?: Partial<ToastLabels>;
  /** CSP nonce for the injected stylesheet. */
  nonce?: string;
}) {
  const state = useSyncExternalStore(toast.subscribe, toast.getState, toast.getState);
  useEffect(() => injectStyles(document, { nonce }), [nonce]);
  useEffect(() => toast.configure({ position, theme }), [position, theme]);
  // Keyed on the strings, not the object, so an inline `labels={{ ... }}` does not reconfigure every render.
  const region = labels?.region;
  const dismiss = labels?.dismiss;
  useEffect(() => toast.configure({ labels: { region, dismiss } }), [region, dismiss]);
  useEffect(() => {
    document.addEventListener('keydown', onToastKey);
    return () => document.removeEventListener('keydown', onToastKey);
  }, []);
  const n = state.toasts.length;
  return (
    <div
      className="tst-viewport"
      role="region"
      aria-label={state.labels.region}
      data-position={state.position}
      data-theme={state.theme}
      onPointerEnter={() => toast.pause()}
      onPointerLeave={() => toast.resume()}
      onFocus={(e) => e.target.matches(':focus-visible') && toast.pause()}
      onBlur={() => toast.resume()}
    >
      <div className="tst-sr" role="status">
        {state.status}
      </div>
      <div className="tst-sr" role="alert">
        {state.alert}
      </div>
      {state.toasts.map((t, idx) => (
        <Item key={t.id} t={t} i={n - 1 - idx} labels={state.labels} />
      ))}
    </div>
  );
}
