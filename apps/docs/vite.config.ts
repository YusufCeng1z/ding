import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Alias to package sources so dev needs no prior build and edits hot-reload.
export default defineConfig({
  plugins: [react(), svelte()],
  build: { rollupOptions: { input: { main: src('index.html'), docs: src('docs.html'), changelog: src('changelog/index.html'), changelog003: src('changelog/0-0-3/index.html'), javascriptToast: src('javascript-toast/index.html'), loadingToast: src('loading-toast/index.html'), nextjsToast: src('nextjs-toast/index.html'), reactHotToastAlternative: src('react-hot-toast-alternative/index.html'), reactToast: src('react-toast/index.html'), shadcnToast: src('shadcn-toast/index.html'), sonnerAlternative: src('sonner-alternative/index.html'), svelteSonnerAlternative: src('svelte-sonner-alternative/index.html'), svelteToast: src('svelte-toast/index.html'), toastAccessibility: src('toast-accessibility/index.html'), toastNotificationUx: src('toast-notification-ux/index.html'), toastVsSnackbar: src('toast-vs-snackbar/index.html'), undoToast: src('undo-toast/index.html') } } },
  resolve: {
    alias: {
      '@yusufceng1z/ding': src('../../packages/core/src/index.ts'),
      '@yusufceng1z/ding-react': src('../../packages/react/src/index.tsx'),
      '@yusufceng1z/ding-svelte': src('../../packages/svelte/src/lib/index.ts'),
    },
    dedupe: ['react', 'react-dom', 'svelte'],
  },
});
