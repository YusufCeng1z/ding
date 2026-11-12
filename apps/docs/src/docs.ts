import { mountToaster, toast } from '@yusufceng1z/ding';
import { makeSeg } from './site';
import './site.css';
import './docs.css';

// real toasts for the Run buttons
mountToaster({ theme: 'dark' });
// pending steps of the last example are cancelled when another one starts, so they never fight over the toast
const timers: ReturnType<typeof setTimeout>[] = [];
const later = (f: () => void, ms: number) => void timers.push(setTimeout(f, ms));
const RUN: Record<string, () => void> = {
  show: () => [() => toast.success('Saved'), () => toast.error('Payment failed', { description: 'Card declined' }), () => toast.warning('Storage almost full'), () => toast.info('New version available')].forEach((f, i) => later(f, i * 1500)),
  promise: () => void toast.promise(new Promise((r) => setTimeout(r, 1800)), { loading: 'Saving…', success: 'Saved', error: 'Could not save' }),
  progress: () => {
    const id = toast.loading('Uploading photo…', { progress: 0 });
    later(() => toast.update(id, { progress: 0.6 }), 800);
    later(() => toast.update(id, { type: 'success', title: 'Photo uploaded', progress: null }), 1800);
  },
  undo: () => void toast.success('Message deleted', { action: { label: 'Undo', onClick: () => ({ type: 'info', title: 'Restored' }) } }),
  sound: () => {
    toast.configure({ sound: true, volume: 0.5 });
    void toast.success('Sound is on');
  },
};

function runExample(name: string) {
  timers.splice(0).forEach(clearTimeout);
  RUN[name]?.();
}

// framework switcher: one choice drives every code sample, and is remembered
const FW = ['React', 'Svelte', 'Vue', 'Vanilla'];
let saved = 'react';
try {
  saved = localStorage.getItem('ding-fw') ?? saved;
} catch {
  // storage can be blocked
}
const framework = FW.find((name) => name.toLowerCase() === saved) ?? 'React';
document.body.dataset.fw = framework.toLowerCase();
document.getElementById('fw')!.append(
  makeSeg('Framework', FW, framework, (n) => {
    document.body.dataset.fw = n.toLowerCase();
    document.body.dataset.fwChanged = '';
    try {
      localStorage.setItem('ding-fw', n.toLowerCase());
    } catch {
      // storage can be blocked
    }
  }),
);

// Run and Copy on every code block, plus a link on every heading
document.querySelectorAll('pre').forEach((pre) => {
  const bar = Object.assign(document.createElement('div'), { className: 'pbar' });
  const run = pre.dataset.run;
  if (run && RUN[run]) {
    const r = Object.assign(document.createElement('button'), { type: 'button', className: 'prun', textContent: 'Run' });
    r.onclick = () => runExample(run);
    bar.append(r);
  }
  const b = Object.assign(document.createElement('button'), { type: 'button', className: 'pcopy', textContent: 'Copy' });
  let resetCopy: ReturnType<typeof setTimeout> | undefined;
  b.onclick = async () => {
    const code = pre.querySelector('code')!;
    try {
      await navigator.clipboard.writeText(code.innerText);
      b.textContent = 'Copied';
      b.dataset.copied = '';
    } catch {
      delete b.dataset.copied;
      b.textContent = 'Copy selected text';
      getSelection()?.selectAllChildren(code);
    }
    clearTimeout(resetCopy);
    resetCopy = setTimeout(() => {
      b.textContent = 'Copy';
      delete b.dataset.copied;
    }, 1600);
  };
  bar.append(b);
  const block = Object.assign(document.createElement('div'), { className: 'code-block' });
  if (pre.dataset.for) {
    block.dataset.for = pre.dataset.for;
    delete pre.dataset.for;
  }
  pre.before(block);
  block.append(bar, pre);
});
document.querySelectorAll<HTMLElement>('main section[id] > h2, main h3[id]').forEach((h2) => {
  const a = Object.assign(document.createElement('a'), { className: 'anchor', href: `#${h2.id || h2.parentElement!.id}`, textContent: '#' });
  a.setAttribute('aria-label', `Link to ${h2.textContent}`);
  h2.append(a);
});

const tocToggle = document.querySelector<HTMLButtonElement>('.toc-toggle')!;
const toc = document.getElementById('docs-toc')!;
tocToggle.hidden = false;
tocToggle.onclick = () => {
  tocToggle.setAttribute('aria-expanded', String(tocToggle.getAttribute('aria-expanded') === 'false'));
};
toc.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('a')) {
    tocToggle.setAttribute('aria-expanded', 'false');
  }
});

// highlight the section being read
const links = [...document.querySelectorAll<HTMLAnchorElement>('.side a')];
const mark = (id: string) => links.forEach((a) => (a.hash === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
const secs = [...document.querySelectorAll<HTMLElement>('main section[id], main h3[id]')];
// the current section is the last one whose top has passed the reading line
const update = () => {
  const cur = secs.filter((s) => s.getClientRects().length && s.getBoundingClientRect().top <= 180).at(-1) ?? secs[0];
  if (cur) mark(cur.id);
};
let queued = false;
addEventListener('scroll', () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => ((queued = false), update()));
}, { passive: true });
update();
