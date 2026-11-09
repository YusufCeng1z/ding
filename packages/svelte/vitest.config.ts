import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // Test against the core sources so the suite does not depend on a prior build.
    alias: { '@yusufceng1z/ding': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)) },
    // Svelte 5 resolves to its server build without this, and `mount` is unavailable there.
    conditions: ['browser'],
  },
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] },
});
