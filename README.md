<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/ding-dark.svg" />
    <img src="assets/ding.svg" alt="Ding mascot" width="180" />
  </picture>
</p>

<h1 align="center">Ding</h1>

<p align="center">
  Toasts with real spring physics.<br />
  One toast that morphs in place. No dependencies. React, Svelte, Vue or plain DOM.
</p>

<p align="center">
  <a href="https://ding.yusufcengiz.dev">Live demo and docs</a>
</p>

<p align="center">
  <img src="assets/ding-demo.gif" alt="A progress toast turns into a success toast, then an error toast with a Retry button morphs into a new message" width="660" />
</p>

---

## Why Ding

- **One toast at a time.** A new call morphs the toast on screen instead of stacking a second one.
- **Real springs.** Size, shape and text move on a spring solver, so interrupting an animation keeps its momentum.
- **No stylesheet.** Styles are injected from JavaScript. Nothing to import.
- **Light, dark and system themes**, six positions, right-to-left support.
- **Rich content.** Description, avatar, buttons, progress bar, a countdown line, small trailing text.
- **Accessible by default.** Persistent live regions, keyboard dismiss, `prefers-reduced-motion`.
- **Optional sound.** A soft built-in tone per status, or plug in your own.
- **Strict TypeScript**, ESM and CommonJS builds.

## Install

```bash
npm i @yusufceng1z/ding-react    # React 18+
npm i @yusufceng1z/ding-svelte   # Svelte 5
npm i @yusufceng1z/ding-vue      # Vue 3 and Nuxt
npm i @yusufceng1z/ding          # plain DOM
```

Each framework package depends on the small `@yusufceng1z/ding` core, so you install only one.

Using shadcn/ui? Ding is in the shadcn registry directory, so one command installs the React package and adds a `ding-toaster.tsx` wrapper:

```bash
npx shadcn@latest add @ding/ding
```

## Quick start

Render the toaster once, then call `toast` from anywhere.

**React**

```tsx
import { Toaster, toast } from '@yusufceng1z/ding-react';

export default function App() {
  return (
    <>
      <Toaster position="top-center" theme="system" />
      <button onClick={() => toast.success('Saved')}>Save</button>
    </>
  );
}
```

Works in the Next.js App Router as is: the package ships `"use client"`, so `Toaster` can go straight into `app/layout.tsx`. See the [Next.js guide](https://ding.yusufcengiz.dev/nextjs-toast/).

**Svelte 5**

```svelte
<script>
  import { Toaster, toast } from '@yusufceng1z/ding-svelte';
</script>

<Toaster position="top-center" theme="system" />
<button onclick={() => toast.success('Saved')}>Save</button>
```

**Vue 3**

```vue
<script setup>
import { Toaster, toast } from '@yusufceng1z/ding-vue';
</script>

<template>
  <Toaster position="top-center" theme="system" />
  <button @click="toast.success('Saved')">Save</button>
</template>
```

`Toaster` renders nothing in place and mounts in `onMounted`, so server rendering is safe. In Nuxt, put it in `app.vue` and call `toast` from client code.

**Plain DOM**

```ts
import { mountToaster, toast } from '@yusufceng1z/ding';

mountToaster({ position: 'top-center' });
toast.success('Saved');
```

## Usage

```ts
toast.success('Saved');
toast.error('Payment failed', { description: 'Card declined' });
toast.warning('Storage almost full');
toast.info('New version available');
toast.loading('Uploading…');
```

Every call returns the toast id.

### Promises and updates

```ts
toast.promise(save(), {
  loading: 'Saving…',
  success: 'Saved',
  error: (err) => `Could not save: ${err.message}`,
});

const id = toast.loading('Uploading photo…', { progress: 0 });
toast.update(id, { progress: 0.6 });
toast.update(id, { type: 'success', title: 'Photo uploaded', progress: null });
```

Only the newest caller can update the shared toast, so a slow request that finishes late cannot overwrite a newer message.

### Actions

An `onClick` may return a patch. The toast then morphs in place instead of closing.

```ts
toast.success('Message deleted', {
  action: {
    label: 'Undo',
    onClick: () => {
      restore();
      return { type: 'info', title: 'Restored' };
    },
  },
});
```

## Options

| Option | Description |
| --- | --- |
| `description` | Second line of text |
| `action` | `{ label, onClick }`, the main button |
| `secondary` | `{ label, onClick }`, a quieter button beside the action |
| `image` | Avatar or thumbnail URL, replaces the status icon |
| `meta` | Small trailing text, such as `now` or `⌘V` |
| `progress` | `0` to `1`, draws a thin bar at the bottom |
| `duration` | Milliseconds before it closes. `0` keeps it until dismissed. Default `5000` |
| `id` | Reuse an id so repeated calls from one place stay one caller |

Errors, loading toasts and toasts with a button stay until dismissed. Hover and keyboard focus pause the timer. Repeating the same toast adds a counter (×2).

## Configure

```ts
toast.configure({
  position: 'bottom-right', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
  theme: 'dark',            // system, light, dark
  sound: true,
  volume: 0.5,
});

toast.dismiss(id); // one toast
toast.dismiss();   // all
```

## Sound

Off by default. With `sound: true` each status plays its own soft tone: success rises, error falls, warning double-taps, info is a single note. Loading is silent and progress updates never make a sound. Browsers keep audio locked until a click or key press.

To use your own sounds, pass a function. It receives `success`, `error`, `warning`, `info` or `loading`:

```ts
toast.configure({ sound: (type) => mySounds.play(type) });
```

## Accessibility

- Messages go through persistent live regions: errors are assertive, everything else is polite.
- `Esc` dismisses. `Alt` + `T` moves focus into the toast.
- Respects `prefers-reduced-motion`.
- Mirrors automatically on right-to-left pages.

### Labels

The notifications region and the close button have English accessible names by default. Pass your own strings to localize them; keys you leave out keep their default.

```ts
toast.configure({
  labels: {
    region: 'Notifications',
    dismiss: 'Fermer la notification',
  },
});
```

`<Toaster labels={{ dismiss: 'Fermer la notification' }} />` does the same in React, Svelte and Vue, and `mountToaster({ labels })` in plain DOM.

### Content Security Policy

Styles are injected as one `<style>` element. If your CSP blocks inline styles, pass the page's nonce:

```tsx
<Toaster nonce={nonce} />  {/* React, Svelte, Vue (:nonce="nonce") */}
```

```ts
mountToaster({ nonce }); // plain DOM
```

Per-toast values are set through the DOM, which CSP allows, so only the stylesheet needs the nonce.

## Packages

| Package | Description |
| --- | --- |
| [`@yusufceng1z/ding`](packages/core) | Springs, timers, store, sound and the plain DOM renderer |
| [`@yusufceng1z/ding-react`](packages/react) | React renderer |
| [`@yusufceng1z/ding-svelte`](packages/svelte) | Svelte 5 renderer |
| [`@yusufceng1z/ding-vue`](packages/vue) | Vue 3 renderer |

The core owns all behavior. The framework packages only render.

## Development

```bash
pnpm install
pnpm test        # unit tests
pnpm typecheck
pnpm build       # build all packages
pnpm dev         # docs and demo site
```

The docs site lives in `apps/docs`. A machine-readable summary is in [`apps/docs/public/llms.txt`](apps/docs/public/llms.txt).

## License

[MIT](LICENSE)
