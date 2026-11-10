import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Test against the core sources so the suite does not depend on a prior build.
  resolve: { alias: { '@yusufceng1z/ding': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)) } },
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] },
});
