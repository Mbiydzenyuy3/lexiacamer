import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.js so tests don't spin up the PWA plugin.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.mjs'],
  },
});
