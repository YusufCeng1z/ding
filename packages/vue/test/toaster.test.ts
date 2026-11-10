import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Toaster, toast } from '../src/index.ts';

let wrapper: VueWrapper | undefined;

beforeEach(() => void vi.useFakeTimers());

// The store is a module singleton: remove every toast (they leave on timers) and restore defaults between tests.
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
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

const mountToaster = (props: Record<string, unknown> = {}) => (wrapper = mount(Toaster, { props }));
const viewport = () => document.querySelector<HTMLElement>('.tst-viewport')!;

describe('Vue Toaster', () => {
  it('renders the viewport as a labelled region with its live regions', () => {
    mountToaster();
    expect(viewport().getAttribute('role')).toBe('region');
    expect(viewport().getAttribute('aria-label')).toBe('Notifications');
    expect(viewport().querySelector('[role="status"]')).not.toBeNull();
    expect(viewport().querySelector('[role="alert"]')).not.toBeNull();
  });

  it('forwards position and theme to the store and the markup', () => {
    mountToaster({ position: 'bottom-right', theme: 'dark' });
    expect(toast.getState().position).toBe('bottom-right');
    expect(viewport().dataset.position).toBe('bottom-right');
    expect(viewport().dataset.theme).toBe('dark');
  });

  it('follows prop changes after mount', async () => {
    mountToaster({ position: 'top-center', theme: 'light' });
    await wrapper!.setProps({ position: 'bottom-left', theme: 'dark', labels: { region: 'Alertes' } });
    expect(viewport().dataset.position).toBe('bottom-left');
    expect(viewport().dataset.theme).toBe('dark');
    expect(viewport().getAttribute('aria-label')).toBe('Alertes');
  });

  it('uses the labels prop for the region and the close button', () => {
    mountToaster({ labels: { region: 'Alertes', dismiss: 'Fermer' } });
    toast.error('Boom', { duration: 0 });
    expect(viewport().getAttribute('aria-label')).toBe('Alertes');
    expect(document.querySelector('.tst-close')?.getAttribute('aria-label')).toBe('Fermer');
  });

  it('announces toasts through the live regions', () => {
    mountToaster();
    toast.success('Saved');
    expect(viewport().querySelector('[role="status"]')?.textContent).toContain('Saved');
    toast.error('Payment failed');
    expect(viewport().querySelector('[role="alert"]')?.textContent).toContain('Payment failed');
  });

  it('dismisses a sticky toast from its close button', () => {
    mountToaster();
    const id = toast.error('Boom', { duration: 0 });
    const close = document.querySelector<HTMLButtonElement>('.tst-close');
    expect(close).not.toBeNull();
    close!.click();
    expect(toast.getState().toasts.find((t) => t.id === id)?.phase).toBe('closing');
  });

  it('puts the nonce on the injected stylesheet', () => {
    mountToaster({ nonce: 'abc123' });
    const style = document.querySelector<HTMLStyleElement>('style[data-toast]');
    expect(style).not.toBeNull();
    expect(style!.nonce).toBe('abc123');
  });

  it('removes its markup when the component unmounts', async () => {
    mountToaster();
    toast.success('Saved');
    wrapper!.unmount();
    wrapper = undefined;
    await nextTick();
    expect(document.querySelector('.tst-viewport')).toBeNull();
  });

  it('renders nothing on the server', async () => {
    expect(await renderToString(createSSRApp(Toaster))).not.toContain('tst-viewport');
    expect(document.querySelector('.tst-viewport')).toBeNull();
  });

  it('mounts with a toast without throwing (animations are not asserted)', () => {
    expect(() => {
      mountToaster();
      toast.loading('Uploading', { progress: 0.4 });
    }).not.toThrow();
  });
});
