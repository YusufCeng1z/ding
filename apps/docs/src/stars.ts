// Adds a live star count to every GitHub button on the page. The count is cached for an hour,
// because the unauthenticated GitHub API allows only 60 requests per hour per IP.
const REPO = 'YusufCeng1z/ding';
const KEY = 'ding:stars';
const TTL = 60 * 60 * 1000;
const STAR = 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z';

function badge(count: number) {
  const el = document.createElement('span');
  el.className = 'gh-n';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', STAR);
  svg.append(path);
  const num = document.createElement('b');
  num.textContent = new Intl.NumberFormat('en', { notation: 'compact' }).format(count);
  el.append(svg, num);
  return el;
}

export function showStars(root: ParentNode = document) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('a.gh')];
  if (!links.length) return;
  const apply = (n: number) => {
    for (const a of links) {
      a.querySelector('.gh-n')?.remove();
      a.append(badge(n));
      if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', `Star Ding on GitHub, ${n} stars`);
      // one short nudge after the page settles; it ends by itself
      setTimeout(() => {
        a.dataset.nudge = '';
        a.addEventListener('animationend', () => a.removeAttribute('data-nudge'), { once: true });
      }, 1200);
    }
  };
  let cached: { n?: number; t?: number } | null = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* storage blocked: fetch instead */ }
  if (typeof cached?.n === 'number') apply(cached.n);
  if (typeof cached?.n === 'number' && Date.now() - (cached.t ?? 0) < TTL) return;
  fetch(`https://api.github.com/repos/${REPO}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (typeof d?.stargazers_count !== 'number') return;
      try { localStorage.setItem(KEY, JSON.stringify({ n: d.stargazers_count, t: Date.now() })); } catch { /* ignore */ }
      apply(d.stargazers_count);
    })
    .catch(() => { /* offline or rate limited: the button stays as it is */ });
}
