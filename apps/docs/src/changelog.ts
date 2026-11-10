import { mountToaster, toast } from '@yusufceng1z/ding';

// Live demos for the What's new page. They run the shipped library as it is.
mountToaster({ position: 'top-center', theme: 'system' });

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const later = (fn: () => void, ms = 60) => setTimeout(fn, ms);

// Progress toasts: the same updates as the Download and Upload demos on the home page.
let tick: ReturnType<typeof setInterval> | undefined;
const run = (start: () => void) => {
  clearInterval(tick);
  toast.dismiss();
  later(start, 400);
};
$('#runDownload').addEventListener('click', () =>
  run(() => {
    const id = toast.info('design-system.zip', { description: 'Downloading · 0%', progress: 0 });
    let n = 0;
    tick = setInterval(() => {
      n = Math.min(100, n + 2 + Math.floor(Math.random() * 7));
      if (n < 100) return toast.update(id, { description: `Downloading · ${n}%`, progress: n / 100 });
      clearInterval(tick);
      toast.update(id, { type: 'success', title: 'Download complete', description: '84 MB · saved to Downloads', progress: null });
    }, 120);
  }),
);
$('#runUpload').addEventListener('click', () =>
  run(() => {
    const id = toast.loading('Uploading 0%', { progress: 0 });
    let n = 0;
    tick = setInterval(() => {
      n = Math.min(100, n + 1 + Math.floor(Math.random() * 6));
      if (n < 100) return toast.update(id, { title: `Uploading ${n}%`, progress: n / 100 });
      clearInterval(tick);
      toast.update(id, { type: 'success', title: 'Upload complete', description: 'photo-2026.raw · 24.1 MB', progress: null });
    }, 110);
  }),
);

// Button order: an error has a close button, then it becomes a toast with an action.
const showOrder = () => {
  const names = [...document.querySelectorAll<HTMLButtonElement>('.tst-body button')].map((b) => (b.classList.contains('tst-close') ? 'close' : b.textContent));
  $('#orderOut').textContent = `Buttons: ${names.length ? names.join(', ') : '-'}`;
};
$('#openErr').addEventListener('click', () => {
  clearInterval(tick);
  toast.dismiss();
  later(() => {
    toast.error('Payment failed', { description: 'Your card was declined' });
    later(showOrder, 700);
  }, 400);
});
$('#openUndo').addEventListener('click', () => {
  toast.success('Message deleted', { action: { label: 'Undo', onClick: () => ({ type: 'info', title: 'Restored' }) } });
  later(showOrder, 700);
});
