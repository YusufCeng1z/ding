import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Toaster, toast } from '../src/index.tsx';

beforeEach(() => void vi.useFakeTimers());

// The store is a module singleton: remove every toast (they leave on timers) and restore defaults between tests.
afterEach(() => {
  cleanup();
  act(() => {
    toast.dismiss();
    vi.advanceTimersByTime(1000);
    toast.configure({
      position: 'top-center',
      theme: 'system',
      labels: { region: 'Notifications', dismiss: 'Dismiss notification' },
    });
  });
  vi.useRealTimers();
  document.querySelector('style[data-toast]')?.remove();
});

const viewport = (c: HTMLElement) => c.querySelector<HTMLElement>('.tst-viewport')!;

describe('React Toaster', () => {
  it('renders the viewport as a labelled region with its live regions', () => {
    const { container } = render(<Toaster />);
    const vp = viewport(container);
    expect(vp.getAttribute('role')).toBe('region');
    expect(vp.getAttribute('aria-label')).toBe('Notifications');
    expect(vp.querySelector('[role="status"]')).not.toBeNull();
    expect(vp.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('forwards position and theme to the store and the markup', () => {
    const { container } = render(<Toaster position="bottom-right" theme="dark" />);
    expect(toast.getState().position).toBe('bottom-right');
    expect(viewport(container).dataset.position).toBe('bottom-right');
    expect(viewport(container).dataset.theme).toBe('dark');
  });

  it('uses the labels prop for the region and the close button', () => {
    const { container } = render(<Toaster labels={{ region: 'Alertes', dismiss: 'Fermer' }} />);
    act(() => void toast.error('Boom', { duration: 0 }));
    expect(viewport(container).getAttribute('aria-label')).toBe('Alertes');
    expect(container.querySelector('.tst-close')?.getAttribute('aria-label')).toBe('Fermer');
  });

  it('announces toasts through the live regions', () => {
    const { container } = render(<Toaster />);
    act(() => void toast.success('Saved'));
    expect(viewport(container).querySelector('[role="status"]')?.textContent).toContain('Saved');
    act(() => void toast.error('Payment failed'));
    expect(viewport(container).querySelector('[role="alert"]')?.textContent).toContain('Payment failed');
  });

  it('dismisses a sticky toast from its close button', () => {
    const { container } = render(<Toaster />);
    let id = '';
    act(() => void (id = toast.error('Boom', { duration: 0 })));
    const close = container.querySelector<HTMLButtonElement>('.tst-close');
    expect(close).not.toBeNull();
    act(() => fireEvent.click(close!));
    expect(toast.getState().toasts.find((t) => t.id === id)?.phase).toBe('closing');
  });

  it('sizes its icons itself, so they stay small when the stylesheet is blocked', () => {
    const { container } = render(<Toaster />);
    act(() => void toast.error('Boom', { duration: 0 }));
    const size = (sel: string) => [container.querySelector(sel)?.getAttribute('width'), container.querySelector(sel)?.getAttribute('height')];
    expect(size('.tst-svg')).toEqual(['22', '22']);
    expect(size('.tst-close svg')).toEqual(['12', '12']);
    act(() => void toast.info('Photo', { image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' }));
    expect(size('.tst-media')).toEqual(['28', '28']);
  });

  it('puts the nonce on the injected stylesheet', () => {
    render(<Toaster nonce="abc123" />);
    const style = document.querySelector<HTMLStyleElement>('style[data-toast]');
    expect(style).not.toBeNull();
    expect(style!.nonce).toBe('abc123');
  });

  it('mounts with a toast without throwing (animations are not asserted)', () => {
    expect(() => {
      render(<Toaster />);
      act(() => void toast.loading('Uploading', { progress: 0.4 }));
    }).not.toThrow();
  });

  it('adds a per-toast className to the toast element', () => {
    const { container } = render(<Toaster />);
    act(() => void toast.success('Saved', { className: 'mine' }));
    expect(container.querySelector('.tst.mine')).not.toBeNull();
  });
});
