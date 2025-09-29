/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    include: [
      'tests/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules',
      '.nuxt',
      '.output',
      'dist'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'components/**/*.{js,ts,vue}',
        'pages/**/*.{js,ts,vue}',
        'stores/**/*.{js,ts}',
        'lib/**/*.{js,ts}',
        'server/api/**/*.{js,ts}',
        'plugins/**/*.{js,ts}',
        'layouts/**/*.{js,ts,vue}'
      ],
      exclude: [
        'node_modules',
        '.nuxt',
        '.output',
        'dist',
        'tests/**',
        'coverage/**',
        'stores/types.ts',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'prisma/**'
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '~~': resolve(__dirname, '.'),
      '@@': resolve(__dirname, '.'),
      '#imports': resolve(__dirname, 'tests/mocks/nuxt-imports.ts')
    }
  }
})

