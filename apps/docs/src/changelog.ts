import { mountToaster, toast } from '@yusufceng1z/ding';

// Live demos for the What's new page. They run the shipped library as it is, so the default is the new 'list' mode.
mountToaster({ position: 'top-center', theme: 'system' });

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const retry = { label: 'Retry', onClick: () => undefined };
const fix = { label: 'Fix', onClick: () => undefined };

$('#err').addEventListener('click', () => void toast.error('Could not save', { description: 'Network failed.', action: retry }));
$('#ok').addEventListener('click', () => void toast.success('Saved'));
$('#err2').addEventListener('click', () => void toast.error('Upload failed', { description: 'File too large.', action: fix }));

// The mode buttons change the mode and clear the screen, so the next run starts clean.
const modes = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
modes.forEach((b) =>
  b.addEventListener('click', () => {
    toast.dismiss();
    toast.configure({ held: b.dataset.mode as 'list' | 'queue' | 'replace' });
    modes.forEach((m) => m.setAttribute('aria-pressed', String(m === b)));
  }),
);
