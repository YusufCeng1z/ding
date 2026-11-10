# @yusufceng1z/ding

Toasts with real spring physics. One toast that morphs in place. No dependencies, no stylesheet.

This is the core: springs, timers, store, sound and a plain DOM renderer. For React, Svelte or Vue, use [`@yusufceng1z/ding-react`](https://www.npmjs.com/package/@yusufceng1z/ding-react), [`@yusufceng1z/ding-svelte`](https://www.npmjs.com/package/@yusufceng1z/ding-svelte) or [`@yusufceng1z/ding-vue`](https://www.npmjs.com/package/@yusufceng1z/ding-vue).

## Install

```bash
npm i @yusufceng1z/ding
```

## Use

```ts
import { mountToaster, toast } from '@yusufceng1z/ding';

mountToaster({ position: 'top-center' });

toast.success('Saved');
toast.error('Payment failed', { description: 'Card declined' });

toast.promise(save(), {
  loading: 'Saving…',
  success: 'Saved',
  error: (err) => `Could not save: ${err.message}`,
});
```

Only one toast shows at a time. A new call morphs the toast on screen instead of stacking a second one. Options, actions, progress, sound and accessibility are covered in the [docs](https://ding.yusufcengiz.dev/docs.html).

## Links

- [Live demo and docs](https://ding.yusufcengiz.dev)
- [Source on GitHub](https://github.com/YusufCeng1z/ding)

## License

[MIT](LICENSE)
