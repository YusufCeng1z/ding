import { describe, it, expect, afterEach } from 'vitest';
import { createToaster, TIMING } from '../src/store';
import { bindToast } from '../src/bind';
import { injectStyles } from '../src/styles';

const frames = (n: number) =>
  new Promise<void>((r) => {
    let i = 0;
    const f = () => (++i >= n ? r() : requestAnimationFrame(f));
    requestAnimationFrame(f);
  });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mountSlot(position = 'top-center') {
  injectStyles(document);
  const vp = document.createElement('div');
  vp.className = 'tst-viewport';
  vp.dataset.position = position;
  const slot = document.createElement('div');
  slot.className = 'tst-slot';
  slot.setPointerCapture = () => {};
  const pill = document.createElement('div');
  pill.className = 'tst';
  pill.innerHTML = '<div class="tst-body"><div class="tst-copy"><div class="tst-title">Hi</div></div></div>';
  slot.append(pill);
  vp.append(slot);
  document.body.append(vp);
  return { vp, slot, pill };
}

afterEach(() => document.body.replaceChildren());

describe('drag', () => {
  const press = (slot: HTMLElement, type: string, x: number, y: number) =>
    slot.dispatchEvent(new PointerEvent(type, { button: 0, clientX: x, clientY: y, pointerId: 1 }));

  it('a cancelled drag springs back instead of dismissing', async () => {
    const t = createToaster();
    const id = t.error('Payment failed');
    await wait(TIMING.openDelay + 20);
    const { slot } = mountSlot();
    const off = bindToast(slot, id, t);
    press(slot, 'pointerdown', 500, 300);
    press(slot, 'pointermove', 500, 230); // 70px toward the top edge, past the dismiss distance
    press(slot, 'pointercancel', 0, 0); // a cancel's coordinates say nothing about where the user let go
    expect(t.getState().toasts[0]?.phase).toBe('open');
    expect(slot.hasAttribute('data-flung')).toBe(false);
    expect(slot.hasAttribute('data-dragging')).toBe(false);
    expect(slot.style.getPropertyValue('--dy')).toBe('');
    off();
  });

  it('releasing past the distance still dismisses', async () => {
    const t = createToaster();
    const id = t.error('Payment failed');
    await wait(TIMING.openDelay + 20);
    const { slot } = mountSlot();
    const off = bindToast(slot, id, t);
    press(slot, 'pointerdown', 500, 300);
    press(slot, 'pointermove', 500, 230);
    press(slot, 'pointerup', 500, 230);
    expect(t.getState().toasts[0]?.phase).toBe('exit');
    off();
  });
});

describe('cleanup', () => {
  it('stops writing to the pill once unbound', async () => {
    const t = createToaster();
    const id = t.success('Hi');
    const { slot, pill } = mountSlot();
    const off = bindToast(slot, id, t);
    off();
    const before = pill.style.translate;
    await frames(5);
    expect(pill.style.translate).toBe(before);
  });
});

describe('layout', () => {
  it('lays out two toasters that change in the same frame', async () => {
    const a = createToaster();
    const b = createToaster();
    const one = mountSlot('top-center');
    const two = mountSlot('bottom-center');
    const offA = bindToast(one.slot, a.success('A'), a);
    const offB = bindToast(two.slot, b.success('B'), b);
    await frames(3);
    expect(one.slot.style.getPropertyValue('--tst-ey')).not.toBe('');
    expect(two.slot.style.getPropertyValue('--tst-ey')).not.toBe('');
    offA();
    offB();
  });
});
