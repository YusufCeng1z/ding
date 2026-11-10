import { mountToaster, toast } from '@yusufceng1z/ding';

// Live demos for the What's new page. "Before" switches the old click area and the old Esc rule back on
// so the difference can be felt. It is a simulation: the shipped library only has the new behaviour.
mountToaster({ position: 'top-center', theme: 'system' });

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const count = () => document.querySelectorAll('.tst-slot').length;
const later = (fn: () => void, ms = 60) => setTimeout(fn, ms);

// Before / After
let before = false;
const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
const setMode = (b: boolean) => {
  before = b;
  document.body.classList.toggle('old-mode', b);
  modeButtons.forEach((m) => m.setAttribute('aria-pressed', String((m.dataset.mode === 'before') === b)));
};
modeButtons.forEach((m) => m.addEventListener('click', () => setMode(m.dataset.mode === 'before')));
setMode(false);

// Labels
const LANGS: Record<string, { region?: string; dismiss?: string }> = {
  en: { region: 'Notifications', dismiss: 'Dismiss notification' },
  tr: { region: 'Bildirimler', dismiss: 'Bildirimi kapat' },
  fr: { region: 'Notifications système', dismiss: 'Fermer la notification' },
};
const showLabels = () => {
  const vp = document.querySelector('.tst-viewport')?.getAttribute('aria-label') ?? '-';
  const close = document.querySelector('.tst-close')?.getAttribute('aria-label') ?? '-';
  $('#labelsOut').textContent = `region:  ${vp}\nclose:   ${close}`;
};
document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => {
    toast.error('Could not save', { id: 'labels', duration: 0 });
    toast.configure({ labels: LANGS[b.dataset.lang ?? 'en'] });
    document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    later(showLabels, 120);
  }),
);

// Click area
let retries = 0;
$('#openHit').addEventListener('click', () => {
  toast.dismiss();
  later(
    () =>
      toast.error('Upload failed', {
        description: 'The file is larger than 25 MB.',
        duration: 0,
        action: { label: 'Retry', onClick: () => void ($('#hitOut').textContent = `Retry clicked ${++retries} time${retries === 1 ? '' : 's'}`) },
      }),
    400,
  );
});
$('#showHit').addEventListener('click', () => {
  const on = document.body.classList.toggle('show-hit');
  $('#showHit').setAttribute('aria-pressed', String(on));
});

// Alt+T
$('#openPlain').addEventListener('click', () => {
  toast.dismiss();
  later(() => toast.success('Changes saved'), 400);
});
document.addEventListener('focusin', (e) => {
  if ((e.target as Element).classList?.contains('tst-slot')) $('#focusOut').textContent = 'Focus is on the toast. Its timer is paused.';
});
document.addEventListener('focusout', (e) => {
  if ((e.target as Element).classList?.contains('tst-slot')) $('#focusOut').textContent = 'Focus left the toast. The timer runs again.';
});

// Esc
$('#openSticky').addEventListener('click', () => {
  toast.dismiss();
  later(() => toast.error('Connection lost', { duration: 0 }), 400);
});
$('#openDlg').addEventListener('click', () => $<HTMLDialogElement>('#dlg').showModal());
document.addEventListener(
  'keydown',
  (e) => {
    if (e.key !== 'Escape') return;
    if (before) toast.dismiss(); // the old rule: Esc always dismissed
    later(() => ($('#escOut').textContent = `Toasts on screen: ${count()}`), 300);
  },
  true,
);
