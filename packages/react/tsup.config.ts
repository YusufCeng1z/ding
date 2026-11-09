import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react'],
  // Toaster uses hooks: the directive lets Next.js server components import it without a wrapper.
  banner: { js: '"use client";' },
});
