import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage/reporte',
      include: ['src/validaciones/**'],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
