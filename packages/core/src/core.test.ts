import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { springEasing } from './spring.ts';
import { createToaster, TIMING } from './store.ts';

test('spring easing starts at 0, ends at 1, finite duration', () => {
  const { easing, duration } = springEasing({ stiffness: 260, damping: 17 });
  const pts = easing.slice(7, -1).split(',').map(Number);
  assert.equal(pts[0], 0);
  assert.equal(pts.at(-1), 1);
  assert.ok(Math.max(...pts) > 1, 'underdamped overshoots');
  assert.ok(duration > 100 && duration < 5000);
});

test('toast phases: enter → open → closing → exit → removed', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const t = createToaster();
  const id = t.success('hi');
  const phase = () => t.getState().toasts[0]?.phase;
  assert.equal(phase(), 'enter');
  mock.timers.tick(TIMING.openDelay);
  assert.equal(phase(), 'open');
  mock.timers.tick(TIMING.duration);
  assert.equal(phase(), 'closing');
  mock.timers.tick(TIMING.closing);
  assert.equal(phase(), 'exit');
  mock.timers.tick(TIMING.exit);
  assert.equal(t.getState().toasts.length, 0);
  assert.ok(id);
  mock.timers.reset();
});

test('pause stops the timer, loading→success updates in place', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const t = createToaster();
  const id = t.loading('wait');
  mock.timers.tick(TIMING.openDelay + 10_000);
  assert.equal(t.getState().toasts[0]?.phase, 'open', 'loading is sticky');
  t.update(id, { type: 'success', title: 'done' });
  assert.equal(t.getState().toasts.length, 1);
  t.pause(id);
  mock.timers.tick(TIMING.duration * 2);
  assert.equal(t.getState().toasts[0]?.phase, 'open', 'paused');
  t.resume(id);
  mock.timers.tick(TIMING.duration);
  assert.equal(t.getState().toasts[0]?.phase, 'closing');
  mock.timers.reset();
});

test('pause()/resume() with no id affect all; immediate dismiss skips closing', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const t = createToaster();
  t.success('b', { action: { label: 'Undo', onClick() {} }, duration: 4000 });
  mock.timers.tick(TIMING.openDelay);
  t.pause();
  mock.timers.tick(TIMING.duration * 2);
  assert.deepEqual(t.getState().toasts.map((x) => x.phase), ['open']);
  t.dismiss(t.getState().toasts[0]!.id, { immediate: true });
  assert.equal(t.getState().toasts[0]?.phase, 'exit');
  mock.timers.tick(TIMING.exit);
  assert.equal(t.getState().toasts.length, 0);
  mock.timers.reset();
});

test('errors and actions stay until dismissed; announcements go to the right region', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const t = createToaster();
  t.error('Payment failed', { description: 'Card declined' });
  mock.timers.tick(TIMING.openDelay + 60_000);
  assert.deepEqual(t.getState().toasts.map((x) => x.phase), ['open']);
  assert.match(t.getState().alert, /^Payment failed\. Card declined/);
  t.success('Deleted', { action: { label: 'Undo', onClick() {} } }); // morphs the live toast
  mock.timers.tick(60_000);
  assert.deepEqual(t.getState().toasts.map((x) => x.phase), ['open']);
  assert.match(t.getState().status, /^Deleted/);
  mock.timers.reset();
});

test('act(): a returned patch morphs the toast in place, nothing returned dismisses', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const t = createToaster();
  const a = t.success('Deleted', { action: { label: 'Undo', onClick: () => ({ type: 'info', title: 'Restored' }) } });
  mock.timers.tick(TIMING.openDelay);
  t.act(a);
  const first = t.getState().toasts.find((x) => x.id === a)!;
  assert.equal(first.title, 'Restored');
  assert.equal(first.action, undefined);
  mock.timers.tick(TIMING.duration);
  assert.equal(t.getState().toasts.find((x) => x.id === a)?.phase, 'closing', 'timer starts once the action is gone');
  mock.timers.tick(TIMING.closing + TIMING.exit);
  const c = t.success('Other', { action: { label: 'Close', onClick() {} } });
  mock.timers.tick(TIMING.openDelay);
  t.act(c);
  assert.equal(t.getState().toasts.find((x) => x.id === c)?.phase, 'closing');
  mock.timers.reset();
});

test('identical toasts collapse into one with a count', () => {
  const t = createToaster();
  const id = t.success('Saved');
  assert.equal(t.success('Saved'), id);
  assert.equal(t.getState().toasts.length, 1);
  assert.equal(t.getState().toasts[0]?.count, 2);
});

test('a new toast morphs the live one instead of stacking; stale callers are ignored', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const t = createToaster();
  const a = t.loading('Uploading');
  mock.timers.tick(TIMING.openDelay);
  const b = t.error('Payment failed', { description: 'Card declined' });
  const s = t.getState();
  assert.equal(s.toasts.length, 1);
  assert.equal(s.toasts[0]?.type, 'error');
  assert.equal(s.toasts[0]?.description, 'Card declined');
  t.update(a, { type: 'success', title: 'Uploaded' }); // stale caller: ignored
  assert.equal(t.getState().toasts[0]?.title, 'Payment failed');
  t.update(b, { title: 'Try another card' });
  assert.equal(t.getState().toasts[0]?.title, 'Try another card');
  mock.timers.reset();
});

test('sound is off by default; a custom function hears every new status, not progress ticks', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const heard: string[] = [];
  const t = createToaster();
  const id = t.loading('Working', { progress: 0 });
  t.configure({ sound: (type) => void heard.push(type) });
  t.update(id, { progress: 0.5 }); // quiet: no sound
  t.update(id, { type: 'success', title: 'Done' });
  t.error('Failed');
  assert.deepEqual(heard, ['success', 'error']);
  mock.timers.reset();
});

test('labels default to English, configure() overrides them key by key', () => {
  const t = createToaster();
  assert.deepEqual(t.getState().labels, { region: 'Notifications', dismiss: 'Dismiss notification' });
  t.configure({ labels: { dismiss: 'Fermer la notification' } });
  assert.deepEqual(t.getState().labels, { region: 'Notifications', dismiss: 'Fermer la notification' });
  t.configure({ labels: { region: 'Notifications système', dismiss: undefined } });
  assert.deepEqual(t.getState().labels, { region: 'Notifications système', dismiss: 'Fermer la notification' });
  t.configure({ theme: 'dark' });
  assert.equal(t.getState().labels.region, 'Notifications système', 'other options leave labels alone');
});
