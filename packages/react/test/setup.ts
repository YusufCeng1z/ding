// happy-dom rejects `animation.finished` with an unhandled AbortError when an
// animation is cancelled; browsers mark that rejection as handled. Animations
// are out of scope for these tests, so swallow it at the source.
const animate = Element.prototype.animate;
Element.prototype.animate = function (...args: Parameters<typeof animate>) {
  const a = animate.apply(this, args);
  a.finished.catch(() => {});
  return a;
};
