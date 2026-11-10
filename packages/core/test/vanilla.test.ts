import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountToaster, toast } from '../src/index.ts';

let unmount: (() => void) | undefined;

beforeEach(() => void vi.useFakeTimers());

// The store is a module singleton: remove every toast (they leave on timers) and restore defaults between tests.
afterEach(() => {
  unmount?.();
  unmount = undefined;
  toast.dismiss();
  vi.advanceTimersByTime(1000);
  vi.useRealTimers();
  toast.configure({
    position: 'top-center',
    theme: 'system',
    labels: { region: 'Notifications', dismiss: 'Dismiss notification' },
  });
  document.querySelector('style[data-toast]')?.remove();
});

const mount = (opts?: Parameters<typeof mountToaster>[0]) => (unmount = mountToaster(opts));
const viewport = () => document.querySelector<HTMLElement>('.tst-viewport')!;

describe('mountToaster', () => {
  it('renders the viewport as a labelled region with its live regions', () => {
    mount();
    expect(viewport().getAttribute('role')).toBe('region');
    expect(viewport().getAttribute('aria-label')).toBe('Notifications');
    expect(viewport().querySelector('[role="status"]')).not.toBeNull();
    expect(viewport().querySelector('[role="alert"]')).not.toBeNull();
  });

  it('forwards position and theme to the store and the markup', () => {
    mount({ position: 'bottom-right', theme: 'dark' });
    expect(toast.getState().position).toBe('bottom-right');
    expect(viewport().dataset.position).toBe('bottom-right');
    expect(viewport().dataset.theme).toBe('dark');
  });

  it('uses the labels option for the region and the close button', () => {
    mount({ labels: { region: 'Alertes', dismiss: 'Fermer' } });
    toast.error('Boom', { duration: 0 });
    expect(viewport().getAttribute('aria-label')).toBe('Alertes');
    expect(document.querySelector('.tst-close')?.getAttribute('aria-label')).toBe('Fermer');
  });

  it('announces toasts through the live regions', () => {
    mount();
    toast.success('Saved');
    expect(viewport().querySelector('[role="status"]')?.textContent).toContain('Saved');
    toast.error('Payment failed');
    expect(viewport().querySelector('[role="alert"]')?.textContent).toContain('Payment failed');
  });

  it('dismisses a sticky toast from its close button', () => {
    mount();
    const id = toast.error('Boom', { duration: 0 });
    const close = document.querySelector<HTMLButtonElement>('.tst-close');
    expect(close).not.toBeNull();
    close!.click();
    expect(toast.getState().toasts.find((t) => t.id === id)?.phase).toBe('closing');
  });

  it('keeps the close button last when a sticky toast morphs into one with an action', () => {
    mount();
    toast.error('Payment failed', { description: 'Card declined' }); // sticky: gets a close button first
    toast.success('Message deleted', { action: { label: 'Undo', onClick: () => ({ type: 'info', title: 'Restored' }) } });
    const body = document.querySelector('.tst-body')!;
    const kinds = [...body.querySelectorAll('button')].map((b) => b.className.replace('tst-', ''));
    expect(kinds).toEqual(['action', 'close']);
  });

  it('puts the secondary button before the action, also when morphing from a sticky toast', () => {
    mount();
    toast.error('Boom'); // leaves a close button behind while the new buttons are added
    toast.info('Update ready', { action: { label: 'Reload', onClick() {} }, secondary: { label: 'Later', onClick() {} } });
    const kinds = [...document.querySelectorAll('.tst-body button')].map((b) => b.textContent || 'close');
    expect(kinds).toEqual(['Later', 'Reload']);
  });

  it('sizes its icons itself, so they stay small when the stylesheet is blocked', () => {
    mount();
    toast.error('Boom', { duration: 0 });
    const size = (sel: string) => [document.querySelector(sel)?.getAttribute('width'), document.querySelector(sel)?.getAttribute('height')];
    expect(size('.tst-svg')).toEqual(['22', '22']);
    expect(size('.tst-close svg')).toEqual(['12', '12']);
    toast.info('Photo', { image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
    expect(size('.tst-media')).toEqual(['28', '28']);
  });

  it('puts the nonce on the injected stylesheet', () => {
    mount({ nonce: 'abc123' });
    const style = document.querySelector<HTMLStyleElement>('style[data-toast]');
    expect(style).not.toBeNull();
    expect(style!.nonce).toBe('abc123');
  });

  it('removes its markup when unmounted', () => {
    mount();
    toast.success('Saved');
    unmount!();
    unmount = undefined;
    expect(document.querySelector('.tst-viewport')).toBeNull();
  });

  it('mounts with a toast without throwing (animations are not asserted)', () => {
    expect(() => {
      mount();
      toast.loading('Uploading', { progress: 0.4 });
    }).not.toThrow();
  });
});
