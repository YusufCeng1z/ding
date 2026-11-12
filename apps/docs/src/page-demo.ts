import { mountToaster, toast } from '@yusufceng1z/ding';

// Live demo for the keyword pages: buttons fire the real toast.
mountToaster({ position: 'top-center', theme: 'system', held: 'replace' });

const RUN: Record<string, () => void> = {
  success: () => void toast.success('Saved'),
  error: () => void toast.error('Payment failed', { description: 'Card declined' }),
  promise: () =>
    void toast.promise(new Promise((r) => setTimeout(r, 1600)), { loading: 'Saving…', success: 'Saved', error: 'Failed' }),
  undo: () =>
    void toast.success('Message deleted', {
      action: { label: 'Undo', onClick: () => ({ type: 'info', title: 'Restored' }) },
    }),
  progress: () => {
    const id = toast.loading('Uploading photo…', { progress: 0 });
    [0.3, 0.6, 0.9].forEach((p, i) => setTimeout(() => toast.update(id, { progress: p }), 500 * (i + 1)));
    setTimeout(() => toast.update(id, { type: 'success', title: 'Photo uploaded', progress: null }), 2200);
  },
};

document.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach((b) => {
  b.addEventListener('click', () => RUN[b.dataset.demo ?? '']?.());
});
