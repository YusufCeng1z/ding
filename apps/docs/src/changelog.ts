import { mountToaster, toast } from '@yusufceng1z/ding';

// Live demos for the What's new page. They run the shipped library as it is.
mountToaster({ position: 'top-center', theme: 'system' });

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const later = (fn: () => void, ms = 400) => setTimeout(fn, ms);
const fresh = (fn: () => void) => {
  toast.dismiss();
  later(fn);
};

// The demo styles are the same CSS the page shows. They are added once, in a style element of their own.
const style = document.createElement('style');
style.textContent = `
.tst-viewport .tst.demo-fill[data-type=error] { --fill: #dc2626; --on: #fff; --c: #fff; }
.tst-viewport .tst.demo-fill[data-type=loading] { --fill: #374151; --on: #fff; --c: #fff; }
.tst.gold { --fill: #fff7d6; --on: #5b4200; --c: #c77d00; }`;
document.head.append(style);

const act = { label: 'Retry', onClick: () => undefined };
$('#plainErr').addEventListener('click', () => fresh(() => void toast.error('Payment failed', { description: 'Your card was declined.', action: act })));
$('#filledErr').addEventListener('click', () => fresh(() => void toast.error('Payment failed', { description: 'Your card was declined.', action: act, className: 'demo-fill' })));
$('#filledLoad').addEventListener('click', () =>
  fresh(() => {
    const id = toast.loading('Uploading 0%', { progress: 0, className: 'demo-fill' });
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(100, n + 4 + Math.floor(Math.random() * 7));
      if (n < 100) return toast.update(id, { title: `Uploading ${n}%`, progress: n / 100 });
      clearInterval(tick);
      toast.update(id, { type: 'success', title: 'Upload complete', progress: null, className: null });
    }, 120);
  }),
);

$('#goldToast').addEventListener('click', () => fresh(() => void toast.info('Limited offer', { description: 'Only today.', className: 'gold' })));
$('#plainToast').addEventListener('click', () => fresh(() => void toast.info('Limited offer', { description: 'Only today.' })));

const RING = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18';
const DEFAULT_ICON = [RING, 'M7.9 12.4l3 3 5.3-6'];
const HEART = [RING, 'M12 16.4s-3.8-2.3-3.8-5a2.1 2.1 0 0 1 3.8-1.2a2.1 2.1 0 0 1 3.8 1.2c0 2.7-3.8 5-3.8 5z'];
$('#bouncy').addEventListener('click', () => {
  toast.configure({ springs: { enter: { stiffness: 170, damping: 12 }, morph: { stiffness: 220, damping: 15 } } });
  fresh(() => void toast.info('Bouncy arrival'));
});
$('#heart').addEventListener('click', () => {
  toast.configure({ icons: { success: HEART } });
  fresh(() => void toast.success('Loved it'));
});
$('#resetTune').addEventListener('click', () => {
  toast.configure({ springs: { enter: { stiffness: 320, damping: 26 }, morph: { stiffness: 340, damping: 27 } }, icons: { success: DEFAULT_ICON } });
  fresh(() => void toast.success('Back to default'));
});
