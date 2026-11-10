# @yusufceng1z/ding-vue

Toasts with real spring physics for Vue 3 and Nuxt. One toast that morphs in place. No stylesheet to import.

## Install

```bash
npm i @yusufceng1z/ding-vue
```

## Use

Render the toaster once, then call `toast` from anywhere.

```vue
<script setup>
import { Toaster, toast } from '@yusufceng1z/ding-vue';
</script>

<template>
  <Toaster position="top-center" theme="system" />
  <button @click="toast.success('Saved')">Save</button>
</template>
```

`Toaster` renders nothing in place. It mounts in `onMounted`, so it is safe to server-render. In Nuxt, put it in `app.vue` and call `toast` from client code (event handlers, `onMounted`).

Options, actions, progress, sound and accessibility are covered in the [docs](https://ding.yusufcengiz.dev/docs.html).

## Links

- [Live demo and docs](https://ding.yusufcengiz.dev)
- [Source on GitHub](https://github.com/YusufCeng1z/ding)

## License

[MIT](LICENSE)
