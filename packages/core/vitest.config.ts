import { defineConfig } from 'vitest/config';

export default defineConfig({
  // node --test runs src/*.test.ts (no DOM); vitest runs the DOM tests in test/.
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] },
});
