import { springEasing, type SpringConfig } from './spring.ts';

type Springs = { enter: SpringConfig; morph: SpringConfig; stack: SpringConfig };
const configs: Springs = {
  enter: { stiffness: 320, damping: 26 }, // arrival: quick, lands with a hint of overshoot
  morph: { stiffness: 340, damping: 27 }, // pill opening: liquid but controlled
  stack: { stiffness: 400, damping: 36 }, // stack shuffle + fold/unfold: tight, no wobble
};
let cache: { [K in keyof Springs]: ReturnType<typeof springEasing> } | undefined;

export const getSpringConfigs = () => configs;

export function getSprings() {
  return (cache ??= { enter: springEasing(configs.enter), morph: springEasing(configs.morph), stack: springEasing(configs.stack) });
}

/** Retune springs live; affects toasts shown afterwards. */
export function setSprings(p: Partial<Springs>): void {
  Object.assign(configs.enter, p.enter);
  Object.assign(configs.morph, p.morph);
  Object.assign(configs.stack, p.stack);
  cache = undefined;
  if (typeof document !== 'undefined') {
    const el = document.querySelector('style[data-toast]');
    if (el) el.textContent = buildCss();
  }
}

export function buildCss(): string {
  const { stack, enter } = getSprings();
  return `
.tst-viewport{color-scheme:light dark;--tst-stack:${stack.easing};--tst-stack-dur:${stack.duration}ms;--tst-pop:${enter.easing};--tst-pop-dur:${enter.duration}ms;
--tst-bg:light-dark(#fff,#0c0c0d);--tst-fg:light-dark(#0f0f13,#fafafa);--tst-ring:light-dark(oklch(0 0 0/.08),oklch(1 0 0/.1));
--tst-shadow:0 0 0 1px var(--tst-ring),0 4px 12px -4px light-dark(oklch(0 0 0/.14),oklch(0 0 0/.45));
--tst-success:light-dark(#12a36b,#4ade80);--tst-error:light-dark(#e5484d,#f87171);--tst-warning:light-dark(#c77d00,#fbbf24);--tst-info:light-dark(#2f7de1,#60a5fa);
--tst-size:44px;--tst-radius:22px;--tst-gap:8px;--tst-pad:16px;--tst-stack-offset:10px;--tst-stack-scale:.05;
position:fixed;inset:0;z-index:2147483647;pointer-events:none;font:500 14px/1.3 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.tst-viewport[data-theme=light]{color-scheme:light}
.tst-viewport[data-theme=dark]{color-scheme:dark}
.tst-viewport:dir(rtl){--tst-flip:-1}
.tst-viewport:dir(rtl) .tst-progress::after{transform-origin:right}
.tst-viewport[data-position^=top]{--tst-dir:-1}
.tst-viewport[data-position^=bottom]{--tst-dir:1}
.tst-viewport{--tst-y0:calc(var(--tst-dir,-1)*(var(--tst-size) + var(--tst-pad) + 24px))}
.tst-viewport[data-position$=center]{--tst-ox:50%;--tx:-50%}
.tst-viewport[data-position$=left]{--tst-ox:0%;--tx:0px}
.tst-viewport[data-position$=right]{--tst-ox:100%;--tx:0px}
.tst-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.tst-slot{position:absolute;pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:grab;--tst-i:0;
--y:calc(var(--tst-dir)*-1*var(--tst-i)*var(--tst-stack-offset));--s:calc(1 - var(--tst-i)*var(--tst-stack-scale));
transform:translate(calc(var(--tx) + var(--dx,0px)),calc(var(--y) + var(--dy,0px))) scale(var(--s));
transform-origin:var(--tst-ox) var(--tst-oy);z-index:calc(100 - var(--tst-i));
transition-property:transform,opacity;transition-duration:var(--tst-stack-dur),.25s;transition-timing-function:var(--tst-stack),ease-out}
.tst-slot::after{content:'';position:absolute;z-index:-1;left:0;right:0;top:calc(var(--tst-gap)/-2);bottom:calc(var(--tst-gap)/-2)}
.tst-slot[data-dragging]{transition:none;cursor:grabbing}
.tst-slot[data-flung]{transition:transform .38s cubic-bezier(.2,.8,.3,1),opacity .25s ease-out;opacity:0;pointer-events:none}
.tst-viewport[data-position^=top] .tst-slot{top:calc(var(--tst-pad) + env(safe-area-inset-top,0px));--tst-oy:0%}
.tst-viewport[data-position^=bottom] .tst-slot{bottom:calc(var(--tst-pad) + env(safe-area-inset-bottom,0px));--tst-oy:100%}
.tst-viewport[data-position$=center] .tst-slot{left:50%}
.tst-viewport[data-position$=left] .tst-slot{left:var(--tst-pad)}
.tst-viewport[data-position$=right] .tst-slot{right:var(--tst-pad)}
/* --c: status color for the glyph · --fill/--on: status surface + its text (used by filled styles) */
.tst{--c:var(--tst-fg);--fill:var(--tst-bg);--on:var(--tst-fg);--tp:0;--ap:0;position:relative;box-sizing:border-box;width:var(--tst-size);height:var(--tst-size);border:1px solid transparent;
border-radius:var(--r,min(var(--tst-radius),calc(var(--tst-size)/2)));overflow:hidden;color:var(--on);background:var(--fill);box-shadow:var(--tst-shadow);
translate:0 var(--tst-y0);scale:var(--tst-enter-scale,.5);opacity:0;will-change:translate,scale}
.tst[data-settled]{will-change:auto}
.tst[data-settled] .tst-body{filter:none;transform:none}
.tst[data-phase=exit]{animation:tst-out .15s ease-out both}
.tst[data-type=success]{--c:var(--tst-success)}
.tst[data-type=error]{--c:var(--tst-error)}
.tst[data-type=warning]{--c:var(--tst-warning)}
.tst[data-type=info]{--c:var(--tst-info)}

.tst-icon{position:absolute;inset-inline-start:-1px;top:-1px;width:var(--tst-size);height:var(--tst-size);display:grid;place-items:center}
.tst-media{width:28px;height:28px;border-radius:50%;object-fit:cover;outline:1px solid light-dark(oklch(0 0 0/.1),oklch(1 0 0/.1));outline-offset:-1px;animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both}
.tst-badge{position:relative;width:24px;height:24px;display:grid;place-items:center}
.tst-svg{width:22px;height:22px;fill:none;stroke:var(--c);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:stroke .3s cubic-bezier(.2,0,0,1);animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both}
.tst-svg path{stroke-dasharray:1;stroke-dashoffset:1;animation:tst-draw .5s cubic-bezier(.4,0,.2,1) .15s forwards}
.tst-svg path:first-child{stroke-dasharray:1 1;transition:stroke-dasharray .65s cubic-bezier(.4,0,.2,1)}
.tst[data-type=loading] .tst-svg path:first-child{stroke-dasharray:.28 .72}
.tst{--md:.55s}
.tst[data-ready]{--md:.05s}
.tst-svg path{transform-box:fill-box;transform-origin:center}
.tst-svg path:nth-child(n+2){animation-duration:.32s;animation-delay:var(--md)}
.tst-svg path:nth-child(3){animation-delay:calc(var(--md) + .08s)}
/* each status has its own little gesture, built from the parts of its glyph */
.tst[data-type=success] .tst-svg{animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both,tst-pulse .45s var(--tst-pop) calc(var(--md) + .25s)}
.tst[data-type=success] .tst-badge::after{content:'';position:absolute;inset:1px;border-radius:50%;border:1.5px solid var(--c);opacity:0;animation:tst-ripple .7s cubic-bezier(.2,0,0,1) calc(var(--md) + .25s)}
.tst[data-type=error] .tst-svg{animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both,tst-shake .42s cubic-bezier(.3,0,.3,1) calc(var(--md) + .3s)}
.tst[data-type=warning] .tst-svg path:nth-child(2){stroke-dasharray:none;stroke-dashoffset:0;animation:tst-drop .5s var(--tst-pop) var(--md) both}
.tst[data-type=warning] .tst-svg path:nth-child(3){stroke-dasharray:none;stroke-dashoffset:0;animation:tst-dot .38s var(--tst-pop) calc(var(--md) + .16s) both}
.tst[data-type=info] .tst-svg path:nth-child(3){stroke-dasharray:none;stroke-dashoffset:0;animation:tst-dot .4s var(--tst-pop) var(--md) both}
.tst[data-type=info] .tst-svg path:nth-child(2){animation-delay:calc(var(--md) + .16s)}

.tst-body{position:absolute;inset-inline-start:calc(var(--tst-size) - 1px);top:-1px;display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;width:max-content;max-width:calc(100vw - 2*var(--tst-pad) - var(--tst-size) + 1px);min-height:var(--tst-size);padding-inline-end:8px;
opacity:calc(var(--tp)*1.5 - .25);filter:blur(calc((1 - var(--tp))*10px));transform:translateX(calc((1 - var(--tp))*-12px*var(--tst-flip,1)))}
.tst-body:has(.tst-action,.tst-close){padding-inline-end:8px;padding-bottom:0}
.tst-body[data-wrapped]{padding-bottom:10px}
.tst-body[data-wrapped] .tst-copy{flex-basis:100%;max-width:none}
.tst-body[data-wrapped] .tst-copy + *{margin-inline-start:auto}
.tst-copy{width:max-content;max-width:min(340px,calc(100vw - 176px));padding-block:12px;padding-inline:0 6px;line-height:1.4;text-wrap:pretty;overflow-wrap:anywhere}
.tst-title{font-weight:550;font-variant-numeric:tabular-nums}
.tst-count,.tst-meta{margin-inline-start:6px;opacity:.7}
.tst-meta{font-weight:450;font-size:12px}
.tst-timer{position:absolute;inset:auto 0 0 0;height:2px;background:var(--c);opacity:.45;transform-origin:left;animation:tst-timer var(--tst-life) linear forwards;pointer-events:none}
.tst-viewport:hover .tst-timer,.tst-viewport:has(:focus-visible) .tst-timer{animation-play-state:paused}
.tst-viewport:dir(rtl) .tst-timer{transform-origin:right}
.tst-ghost{position:absolute;inset-inline-start:0;top:0;pointer-events:none}
.tst-progress{position:absolute;inset:auto 0 0 0;height:3px;background:color-mix(in srgb,var(--tst-fg) 14%,transparent);opacity:var(--tp);pointer-events:none}
.tst-progress::after{content:'';position:absolute;inset:0;background:var(--c);transform-origin:left;transform:scaleX(var(--pg,0));transition:transform .3s cubic-bezier(.2,0,0,1)}
.tst-desc{margin-top:3px;font-size:13px;font-weight:450;opacity:.65}
.tst[data-phase=open] .tst-desc{animation:tst-in-up var(--tst-pop-dur) var(--tst-pop) .1s both}
.tst[data-phase=open] .tst-action,.tst[data-phase=open] .tst-close{animation:tst-in-btn var(--tst-pop-dur) var(--tst-pop) .16s backwards}
.tst[data-phase=open] .tst-secondary{animation-delay:.1s}
.tst-action,.tst-close{position:relative;flex:none;margin:0;border:0;color:inherit;font:inherit;cursor:pointer;background:transparent;
opacity:calc(var(--ap)*1.3 - .15);transform:scale(calc(.85 + var(--ap)*.15));
transition-property:background-color,scale;transition-duration:.15s;transition-timing-function:ease-out}
.tst-action{height:30px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:600;background:var(--tst-fg);color:var(--tst-bg)}
.tst-secondary{background:transparent;color:color-mix(in srgb,var(--tst-fg) 65%,transparent);padding:0 10px}
.tst-close{width:30px;height:30px;padding:0;border-radius:50%;display:grid;place-items:center}
/* 30px look, 44px target: taller hit area, narrow enough sideways that neighbours (8px apart) never overlap */
.tst-action::before,.tst-close::before{content:'';position:absolute;inset:-7px -3px}
.tst-slot:focus-visible{outline:none}
.tst-slot:focus-visible .tst{outline:2px solid var(--tst-fg);outline-offset:-5px}
.tst-close svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
@media (hover:hover){.tst-action:hover{background:color-mix(in srgb,var(--tst-fg) 82%,var(--tst-bg))}.tst-secondary:hover,.tst-close:hover{background:color-mix(in srgb,var(--tst-fg) 10%,transparent);color:var(--tst-fg)}}
.tst-action:not(:disabled):active,.tst-close:not(:disabled):active{scale:.96}
.tst-action:focus-visible,.tst-close:focus-visible{outline:2px solid var(--tst-fg);outline-offset:2px}

@keyframes tst-out{to{transform:translateY(calc(var(--tst-dir)*12px)) scale(.92);opacity:0;filter:blur(4px)}}
@keyframes tst-swap{from{opacity:0;scale:.25;filter:blur(4px)}}
@keyframes tst-timer{to{transform:scaleX(0)}}
@keyframes tst-in-btn{from{opacity:0;translate:0 8px;filter:blur(4px)}}
@keyframes tst-in-up{from{opacity:0;transform:translateY(12px);filter:blur(4px)}}
@keyframes tst-draw{to{stroke-dashoffset:0}}
@keyframes tst-pulse{40%{transform:scale(1.14)}}
@keyframes tst-ripple{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}
@keyframes tst-shake{20%{translate:-2.5px 0}45%{translate:2.5px 0}70%{translate:-1.5px 0}to{translate:0}}
@keyframes tst-drop{from{opacity:0;translate:0 -5px}}
@keyframes tst-dot{from{opacity:0;scale:0}}
@keyframes tst-fade{from{opacity:0}}
@keyframes tst-fade-out{to{opacity:0}}
@media (prefers-reduced-motion:reduce){
.tst{translate:none!important;scale:none!important;animation:tst-fade .2s ease-out both}
.tst[data-phase=exit],.tst-body{filter:none!important;transform:none!important}
.tst-svg,.tst-desc,.tst-media,.tst-action,.tst-close,.tst-badge::after{animation:none!important}
.tst-timer{display:none}
.tst-svg path{animation:none!important;stroke-dashoffset:0!important}
.tst-slot{transition-property:opacity}
}
`;
}

/**
 * Idempotent; call from the adapter on the client.
 * Pass `nonce` when the page has a Content Security Policy that blocks inline styles.
 */
export function injectStyles(doc: Document = document, opts: { nonce?: string } = {}): void {
  if (doc.querySelector('style[data-toast]')) return;
  const el = doc.createElement('style');
  el.setAttribute('data-toast', '');
  if (opts.nonce) el.nonce = opts.nonce;
  el.textContent = buildCss();
  doc.head.prepend(el);
}
