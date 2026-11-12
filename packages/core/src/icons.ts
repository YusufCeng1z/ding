import type { ToastIcons, ToastType } from './types';

/** 24×24 stroke paths, rendered with pathLength=1 so CSS can draw them. Path 1 is always the ring (loading shows it as an arc, so it can close into a circle in place). */
const RING = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18';
export const ICONS: Record<ToastType, string[]> = {
  success: [RING, 'M7.9 12.4l3 3 5.3-6'],
  error: [RING, 'M9.3 9.3l5.4 5.4', 'M14.7 9.3l-5.4 5.4'],
  warning: [RING, 'M12 7.6v5.2', 'M12 16.3h.01'],
  info: [RING, 'M12 11v5.2', 'M12 7.8h.01'],
  loading: [RING],
};

/** Replace status icons. Applies to toasts shown afterwards. An empty list is ignored. */
export function setIcons(icons: ToastIcons): void {
  for (const type of Object.keys(icons) as ToastType[]) {
    const paths = icons[type];
    if (paths?.length) ICONS[type] = [...paths];
  }
}
