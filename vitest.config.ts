import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // The installed date-fns-tz@2 cannot load under date-fns@3 in the test
      // runner's ESM resolver (it imports internal date-fns paths removed in
      // v3). Resolve it to a faithful Intl-based shim so timezone-dependent
      // code (e.g. SLA calculations) can be tested. This is test-only config;
      // the application bundle still uses the real package.
      'date-fns-tz': path.resolve(__dirname, './tests/helpers/date-fns-tz-shim.ts'),
    },
  },
});
