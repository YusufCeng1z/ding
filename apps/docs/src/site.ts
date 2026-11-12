import './site.css';
import { toast, chime } from '@yusufceng1z/ding';
import { MASCOT } from './mascot';
import { LOOKS, DEFAULT, restyle, type Look } from './looks';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const avatar = (letters: string, bg: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="${bg}"/><text x="28" y="35" font-family="system-ui,sans-serif" font-size="22" font-weight="600" text-anchor="middle" fill="#fff">${letters}</text></svg>`)}`;

const demos = new Map<string, () => void>([
  ['Save', () => void toast.success('Changes saved')],
  ['Error', () => void toast.error('Payment failed', { description: 'Your card was declined. Try another card.' })],
  ['Warning', () => void toast.warning('Storage almost full', { description: 'Free up space or upgrade your plan.' })],
  ['Info', () => void toast.info('New version available')],
  ['Promise', () => void toast.promise(wait(2000), { loading: 'Uploading photo…', success: 'Photo uploaded', error: 'Upload failed. Try again.' })],
  ['Description', () => void toast.success('Deployment ready', { description: 'my-app is live at my-app.vercel.app' })],
  ['Message', () => void toast.info('Sarah Chen', {
    image: avatar('SC', '#6d5dfc'),
    meta: 'now',
    description: 'Can you review the PR before standup?',
    action: { label: 'Reply', onClick: () => ({ type: 'success', title: 'Reply sent', description: '', image: null }) },
    secondary: { label: 'Later', onClick: () => undefined },
  })],
  ['Meeting', () => void toast.info('Design sync in 5 min', {
    image: avatar('DS', '#0f9d6b'),
    description: 'Room 4 · 6 attendees',
    action: { label: 'Join', onClick: () => ({ type: 'success', title: 'Joining…', description: '', image: null }) },
    secondary: { label: 'Snooze', onClick: () => ({ type: 'info', title: 'Snoozed for 10 min', description: '', image: null, action: null, secondary: null, duration: 3000 }) },
  })],
  ['Copy', () => void toast.success('Link copied', { meta: '⌘V', duration: 2500 })],
  ['Music', () => {
    const tracks: [string, string][] = [['Midnight City', 'M83 · Hurry Up, We’re Dreaming'], ['Intro', 'The xx · xx'], ['Kids', 'MGMT · Oracular Spectacular']];
    let i = 0, n = 0;
    const stop = () => (clearInterval(tick), { type: 'info' as const, title: 'Playback stopped', description: '', meta: null, image: null, progress: null, action: null, secondary: null, duration: 2500 });
    // a patch that keeps both buttons: act() removes buttons unless the patch names them
    const next = () => {
      i = (i + 1) % tracks.length;
      n = 0;
      return { title: tracks[i]![0], description: tracks[i]![1], progress: 0, action: { label: 'Next', onClick: next }, secondary: { label: 'Stop', onClick: stop } };
    };
    const id = toast.info(tracks[0]![0], { image: avatar('♪', '#1d1d22'), description: tracks[0]![1], meta: 'now playing', progress: 0, duration: 0, action: { label: 'Next', onClick: next }, secondary: { label: 'Stop', onClick: stop } });
    const tick = setInterval(() => {
      n += 0.02;
      if (n < 1) return toast.update(id, { progress: n });
      const { title, description } = next();
      toast.update(id, { title, description, progress: 0 });
    }, 300);
  }],
  ['Update', () => void toast.info('Update available', {
    description: 'Version 2.4 is ready to install.',
    action: { label: 'Restart', onClick: () => { const id = 'upd'; setTimeout(() => toast.update(id, { type: 'success', title: 'You’re up to date', description: 'Version 2.4' }), 2200); return { type: 'loading', title: 'Restarting…', description: 'This takes a few seconds', action: null, secondary: null }; } },
    secondary: { label: 'Later', onClick: () => undefined },
    id: 'upd',
  })],
  ['Offline', () => void toast.error('You’re offline', {
    description: 'Changes will sync when you reconnect.',
    id: 'off',
    action: { label: 'Retry', onClick: () => { setTimeout(() => toast.update('off', { type: 'success', title: 'Back online', description: 'All changes synced' }), 2000); return { type: 'loading', title: 'Reconnecting…', description: '' , action: null }; } },
  })],
  ['Invite', () => void toast.info('Alex invited you to Atlas', {
    image: avatar('AL', '#e5484d'),
    description: 'Product design workspace · 12 members',
    action: { label: 'Accept', onClick: () => ({ type: 'success', title: 'Joined Atlas', description: 'You can now see 12 members', image: null }) },
    secondary: { label: 'Decline', onClick: () => undefined },
  })],
  ['Download', () => {
    const id = toast.info('design-system.zip', { image: avatar('ZIP', '#3b3b44'), description: 'Downloading · 0%', progress: 0, secondary: { label: 'Cancel', onClick: () => { clearInterval(tick); return { type: 'error', title: 'Download canceled', description: '', image: null, progress: null, secondary: null, duration: 3000 }; } } });
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(100, n + 2 + Math.floor(Math.random() * 7));
      if (n < 100) return toast.update(id, { description: `Downloading · ${n}%`, progress: n / 100 });
      clearInterval(tick);
      toast.update(id, { type: 'success', title: 'Download complete', description: '84 MB · saved to Downloads', image: null, progress: null, secondary: null });
    }, 120);
  }],
  ['Order', () => {
    const id = toast.loading('Order confirmed', { description: 'Preparing your food' });
    const steps: [string, string, string?][] = [['Preparing', 'The kitchen has your order'], ['On the way', 'Courier arrives in 8 min'], ['Delivered', 'Enjoy your meal', 'success']];
    steps.forEach(([title, description, type], i) => setTimeout(() => toast.update(id, { title, description, ...(type && { type: type as 'success' }) }), (i + 1) * 2200));
  }],
  ['Undo', () => void toast.success('Message deleted', { action: { label: 'Undo', onClick: () => ({ type: 'success', title: 'Message restored' }) }, duration: 8000 })],
  ['Confirm', () => void toast.warning('Discard unsaved changes?', { action: { label: 'Discard', onClick: () => ({ type: 'error', title: 'Changes discarded' }) } })],
  ['Sync', () => {
    const id = toast.loading('Syncing 3 files…');
    setTimeout(() => toast.update(id, { type: 'success', title: 'All files synced', description: 'Last sync just now' }), 2000);
  }],
  ['Upload', () => {
    const id = toast.loading('Uploading 0%', { progress: 0 });
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(100, n + 1 + Math.floor(Math.random() * 6));
      if (n < 100) return toast.update(id, { title: `Uploading ${n}%`, progress: n / 100 });
      clearInterval(tick);
      toast.update(id, { type: 'success', title: 'Upload complete', description: 'photo-2026.raw · 24.1 MB', progress: null });
    }, 110);
  }],
  ['Sequence', () => [() => toast.loading('Uploading photo…'), () => toast.success('Photo uploaded'), () => toast.error('Sync failed', { description: 'Check your connection' }), () => toast.info('Retrying in 3s')].forEach((f, i) => setTimeout(f, i * 1300))],
]);

const GROUPS: [string, string, string[]][] = [
  ['Status', 'Quick feedback', ['Save', 'Error', 'Warning', 'Info', 'Description']],
  ['Progress', 'One toast that updates in place', ['Promise', 'Sync', 'Upload', 'Download', 'Order', 'Sequence']],
  ['Content', 'Avatars, buttons and details', ['Message', 'Meeting', 'Invite', 'Music', 'Copy']],
  ['Actions', 'Undo, confirm and retry', ['Undo', 'Confirm', 'Update', 'Offline']],
  ['Sound', 'Hear each cue. Turn on your volume.', ['Success', 'Error', 'Warning', 'Info']],
];
const SOUND_TYPES = { Success: 'success', Error: 'error', Warning: 'warning', Info: 'info' } as const;
const POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;
const NAMES: Record<(typeof POSITIONS)[number], string> = {
  'top-left': 'Top left', 'top-center': 'Top', 'top-right': 'Top right',
  'bottom-left': 'Bottom left', 'bottom-center': 'Bottom', 'bottom-right': 'Bottom right',
};
const INSTALL = { React: 'npm i @yusufceng1z/ding-react', Svelte: 'npm i @yusufceng1z/ding-svelte', Vue: 'npm i @yusufceng1z/ding-vue', Vanilla: 'npm i @yusufceng1z/ding', shadcn: 'npx shadcn@latest add @ding/ding' } as const;
const GITHUB = 'https://github.com/YusufCeng1z/ding';
const GH_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};
const pressed = (b: HTMLElement, on: boolean) => b.setAttribute('aria-pressed', String(on));

/** Segmented control with one indicator that slides between options instead of each option snapping. */
export function makeSeg(label: string, names: string[], initial: string, onPick: (name: string) => void) {
  const ind = h('span', { className: 'ind' });
  const btns = names.map((n) => h('button', { type: 'button', textContent: n }));
  const el = h('div', { className: 'seg', role: 'group', ariaLabel: label }, ind, ...btns);
  const place = () => {
    const on = btns.find((b) => b.getAttribute('aria-pressed') === 'true');
    if (on && on.offsetWidth) el.style.cssText = `--x:${on.offsetLeft}px;--w:${on.offsetWidth}px`;
  };
  btns.forEach((b) => {
    pressed(b, b.textContent === initial);
    b.onclick = () => {
      btns.forEach((x) => pressed(x, x === b));
      place();
      onPick(b.textContent!);
    };
  });
  // first placement happens without a slide; later ones animate
  requestAnimationFrame(() => {
    place();
    requestAnimationFrame(() => el.classList.add('ready'));
  });
  addEventListener('resize', place);
  return el;
}
const link = (href: string, text: string, cls = '') => h('a', { href, className: cls, textContent: text, ...(href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' }) });


export function mountSite(root: HTMLElement, _adapter?: string) {
  (window as unknown as { toast: typeof toast }).toast = toast; // for console experiments
  toast.configure({ theme: 'dark', sound: true });

  // top bar
  const gh = link(GITHUB, '', 'gh');
  gh.innerHTML = `${GH_ICON}<span>Star on GitHub</span>`;
  const bar = h('div', { className: 'bar' }, h('nav', { className: 'nav', ariaLabel: 'Site' }, link('/docs.html', 'Docs', 'navlink'), link('/playground/', 'Playground', 'navlink'), link('/changelog/', 'What\'s new', 'navlink'), gh));

  // install: pick a framework, copy the command
  let fw: keyof typeof INSTALL = 'React';
  // all three commands share one cell, so the pill never changes width and the swap is a cross-fade
  const codes = (Object.keys(INSTALL) as (keyof typeof INSTALL)[]).map((k) => h('code', { textContent: INSTALL[k], className: k === fw ? 'on' : '' }));
  const code = h('span', { className: 'codes' }, ...codes);
  const copy = h('button', { type: 'button', className: 'copy', textContent: 'Copy' });
  copy.onclick = async () => {
    try {
      try {
        await navigator.clipboard.writeText(INSTALL[fw]);
      } catch {
        // clipboard API can be blocked (iframes, insecure origins): fall back to a selection copy
        const t = Object.assign(document.createElement('textarea'), { value: INSTALL[fw] });
        document.body.append(t);
        t.select();
        const ok = document.execCommand('copy');
        t.remove();
        if (!ok) throw new Error('copy failed');
      }
      void toast.success('Copied to clipboard', { id: 'copy', meta: INSTALL[fw], duration: 2500 });
      copy.textContent = 'Copied';
      setTimeout(() => (copy.textContent = 'Copy'), 1600);
    } catch {
      void toast.error('Couldn’t copy', { id: 'copy', description: 'Select the command and copy it manually.' });
    }
  };
  const fwSeg = makeSeg('Framework', Object.keys(INSTALL), fw, (k) => {
    fw = k as keyof typeof INSTALL;
    (Object.keys(INSTALL) as (keyof typeof INSTALL)[]).forEach((n, i) => {
      codes[i]!.classList.toggle('on', n === fw);
      codes[i]!.ariaHidden = String(n !== fw);
    });
  });
  const tryIt = h('button', { type: 'button', className: 'primary', textContent: 'Try it' });
  tryIt.onclick = demos.get('Order')!;
  const mascot = h('button', { type: 'button', className: 'mascot', ariaLabel: 'Ring Ding' });
  mascot.innerHTML = MASCOT;
  // the eyes follow the pointer (skipped under reduced motion)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reach = 15; // how far an eye may travel, in the drawing's own units
    let raf = 0;
    const look = (x?: number, y?: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = mascot.getBoundingClientRect();
        let ex = 0, ey = 0;
        if (x !== undefined && y !== undefined) {
          const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.6);
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 220); // the closer the pointer, the smaller the move
          ex = (dx / d) * reach * k;
          ey = (dy / d) * reach * k;
        }
        mascot.style.setProperty('--ex', `${ex.toFixed(1)}px`);
        mascot.style.setProperty('--ey', `${ey.toFixed(1)}px`);
      });
    };
    document.addEventListener('pointermove', (e) => look(e.clientX, e.clientY), { passive: true });
    document.documentElement.addEventListener('pointerleave', () => look());
  }
  mascot.onclick = () => {
    mascot.classList.remove('ring');
    void mascot.offsetWidth;
    mascot.classList.add('ring');
    void toast.success('Ding!', { id: 'ding', duration: 1800 });
  };
  const hero = h('div', { className: 'hero' },
    mascot,
    h('h1', { textContent: 'Toasts with real spring physics.' }),
    h('p', { className: 'tag', textContent: 'One toast that morphs in place. No dependencies. React, Svelte, Vue or plain DOM.' }),
    h('div', { className: 'actions' }, tryIt),
    h('div', { className: 'install' }, fwSeg, h('div', { className: 'cmd' }, code, copy)),
    link('/llms.txt', 'llms.txt', 'quiet'),
  );

  // settings: the only controls that change the toast itself
  const dots = POSITIONS.map((p) => {
    const b = h('button', { type: 'button', className: 'dot' });
    b.setAttribute('aria-label', NAMES[p]);
    pressed(b, p === 'top-center');
    b.onclick = () => {
      toast.configure({ position: p });
      dots.forEach((x) => pressed(x, x === b));
      void toast.info(NAMES[p], { id: 'pos', duration: 2500 });
    };
    return b;
  });
  const themeSeg = makeSeg('Toast theme', ['Light', 'Dark'], 'Dark', (t) => {
    toast.configure({ theme: t === 'Dark' ? 'dark' : 'light' });
    void toast.info(`${t} toasts`, { id: 'theme', duration: 2500 });
  });
  const soundSeg = makeSeg('Sound', ['Off', 'On'], 'On', (v) => {
    toast.configure({ sound: v === 'On' });
    // the click that turns sound on also unlocks audio, so this toast can be heard
    void toast.info(v === 'On' ? 'Sound on' : 'Sound off', { id: 'sound', duration: 2500 });
  });
  const dismiss = h('button', { type: 'button', className: 'quiet', textContent: 'Dismiss all' });
  dismiss.onclick = () => toast.dismiss();
  const field = (label: string, ...kids: Node[]) => h('div', { className: 'field' }, h('span', { className: 'lbl', textContent: label }), ...kids);
  const settings = h('section', { className: 'settings' },
    field('Position', h('div', { className: 'picker', role: 'group', ariaLabel: 'Toast position' }, ...dots)),
    field('Sound', soundSeg),
    field('Theme', themeSeg),
    dismiss,
  );

  const groups = GROUPS.map(([name, , items]) =>
    h('section', { className: 'group' }, h('h2', { textContent: name }), h('div', { className: 'row' }, ...items.map((n) => {
      const b = h('button', { type: 'button', textContent: n });
      const fire = name === 'Sound' ? () => chime(SOUND_TYPES[n as keyof typeof SOUND_TYPES]) : demos.get(n)!;
      b.onclick = () => {
        fire();
        b.classList.remove('fired');
        void b.offsetWidth;
        b.classList.add('fired'); // brief ink flash: a click is acknowledged even before the toast moves
      };
      return b;
    }))),
  );
  // styles: each button restyles every toast on the page with plain CSS variables
  const SHOWN = ['Default', 'Filled'];
  let look: Look = DEFAULT;
  const lookBtns = Object.entries(LOOKS).filter(([n]) => SHOWN.includes(n)).map(([name, next]) => {
    const b = h('button', { type: 'button', textContent: name });
    pressed(b, name === 'Default');
    b.onclick = () => {
      lookBtns.forEach(([, x]) => pressed(x, x === b));
      const prev = look;
      look = next;
      restyle(prev, next, () => void toast.success('Changes saved', { id: 'look', description: `${name} style`, action: { label: 'Undo', onClick: () => undefined }, duration: 4000 }));
    };
    return [name, b] as const;
  });
  const more = link('/playground/', 'Build your own →', 'quiet');
  const styles = h('section', { className: 'group' }, h('h2', { textContent: 'Styles' }), h('div', { className: 'row' }, ...lookBtns.map(([, b]) => b), more));
  groups.splice(groups.length - 1, 0, styles);
  const foot = h('footer', {}, 'Made by ', link('https://yusufcengiz.dev', 'yusufcengiz.dev'));
  root.replaceChildren(h('div', { className: 'page' }, h('a', { className: 'skip', href: '#main', textContent: 'Skip to demos' }), bar, h('main', { id: 'main' }, hero, settings, ...groups), foot));
}
