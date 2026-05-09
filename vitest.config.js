import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Ambiente de teste (jsdom para simular navegador)
    environment: 'jsdom',
    
    // Globals (describe, it, expect disponíveis sem import)
    globals: true,
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'test-results/',
        'playwright-report/',
        '*.config.js',
        '*.config.ts',
        'dist/',
        'build/',
        'functions/',
        'api-chatbot/',
        'telegram-bot/',
        'chatbot-condominio/',
      ],
    },
    
    // Setup files
    setupFiles: ['./tests/setup.js'],
    
    // Timeout
    testTimeout: 10000,
    
    // Include/Exclude
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'playwright-report/**',
      'test-results/**',
      'functions/**',
      'api-chatbot/**',
      'telegram-bot/**',
      'chatbot-condominio/**',
      'tests/*.spec.js', // Excluir testes E2E do Playwright
    ],
  },
});
