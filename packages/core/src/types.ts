import type { SpringConfig } from './spring.ts';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
/** enter: shape only · open: pill expanded · closing: text erased, pill shrinking · exit: shape leaves */
export type Phase = 'enter' | 'open' | 'closing' | 'exit';
export type Position =
  | 'top-center' | 'top-left' | 'top-right'
  | 'bottom-center' | 'bottom-left' | 'bottom-right';
export type Theme = 'system' | 'light' | 'dark';
/** Accessible names read by screen readers. Pass your own strings to localize them. */
export interface ToastLabels {
  /** Name of the notifications region. Default `Notifications` */
  region: string;
  /** Name of the close button on sticky toasts. Default `Dismiss notification` */
  dismiss: string;
}

export interface ToastAction {
  label: string;
  /** Return a patch to morph this toast in place (e.g. Undo → "Restored"). Return nothing to dismiss it. */
  onClick: () => void | ToastPatch;
}
export interface ToastOptions {
  id?: string;
  description?: string;
  action?: ToastAction;
  /** Second button beside the action (e.g. Reply + Snooze). */
  secondary?: ToastAction;
  /** Small trailing text beside the title, e.g. a timestamp ("now", "2m"). */
  meta?: string;
  /** Avatar or thumbnail URL. Replaces the status icon with a round image. */
  image?: string;
  /** ms before auto-close. 0 = until dismissed. Default 5000; errors, actions and loading stay until dismissed. */
  duration?: number;
  /** 0–1. Draws a thin bar inside the pill. */
  progress?: number;
  /** Extra class on the toast element (`.tst`), for styling one toast. Style it as `.tst.your-class`. */
  className?: string;
}
export interface ToastPatch {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  /** 0–1, or null to remove the bar */
  progress?: number | null;
  /** null removes the action button */
  action?: ToastAction | null;
  secondary?: ToastAction | null;
  /** null removes it */
  meta?: string | null;
  /** null returns to the status icon */
  image?: string | null;
  /** null removes it */
  className?: string | null;
}
export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  phase: Phase;
  /** ms until auto-close; 0 = stays until dismissed */
  duration: number;
  action?: ToastAction;
  secondary?: ToastAction;
  meta?: string;
  image?: string;
  progress?: number;
  /** identical toasts fired again collapse into one with a counter */
  count: number;
  className?: string;
}
/** Spring settings for the three motions. Leave a motion out to keep its current spring. */
export interface SpringSettings {
  /** arrival of the toast */
  enter?: SpringConfig;
  /** the pill opening and morphing */
  morph?: SpringConfig;
  /** shuffling and fold/unfold */
  stack?: SpringConfig;
}
/** Status icons as lists of SVG path `d` strings on a 24×24 grid, drawn as strokes. */
export type ToastIcons = Partial<Record<ToastType, string[]>>;
export interface ToasterState {
  toasts: ToastItem[];
  position: Position;
  theme: Theme;
  labels: ToastLabels;
  /** text for the persistent polite live region (role=status) */
  status: string;
  /** text for the persistent assertive live region (role=alert) */
  alert: string;
}
export interface PromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}
