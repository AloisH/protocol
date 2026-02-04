import antfu from '@antfu/eslint-config';
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';

export default antfu(
  {
    vue: true,
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    stylistic: {
      semi: true,
    },
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
    rules: {
      // Disable strict-boolean-expressions (too noisy, revisit later)
      'ts/strict-boolean-expressions': 'off',
      // Allow global process/buffer in Nuxt/Node context
      'node/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
      // Allow confirm for dangerous actions (delete account, etc)
      'no-alert': 'off',
    },
    ignores: [
      // Generated
      'coverage/**',
      'prisma/generated/**',
      '.nuxt/**',
      // Markdown virtual files from formatter
      '**/*.md/**',
      // Hidden folders (docs, agent instructions)
      '.*/**',
      // MDC content (not code)
      'content/**',
      // Files outside tsconfig (have own configs or rarely change)
      'e2e/**',
      'scripts/**',
      'prisma/seed.ts',
      '*.config.ts',
    ],
  },
  // Disable type-aware rules for Vue files (parser issues + OOM in CI)
  {
    files: ['**/*.vue'],
    rules: {
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-return': 'off',
      'ts/no-unnecessary-boolean-literal-compare': 'off',
      'ts/no-unnecessary-condition': 'off',
      'ts/no-redundant-type-constituents': 'off',
      'ts/restrict-template-expressions': 'off',
    },
  },
  // Test files: vitest patterns
  {
    files: ['**/*.test.ts', '**/*.integration.test.ts'],
    rules: {
      'ts/unbound-method': 'off', // expect(mock.method) pattern
      'ts/no-unsafe-assignment': 'off', // expect.any() returns any
    },
  },
  // Vue a11y
  ...pluginVueA11y.configs['flat/recommended'],
  {
    rules: {
      'vuejs-accessibility/label-has-for': ['error', {
        controlComponents: ['UInput', 'UTextarea', 'UCheckbox', 'USelect', 'URadio', 'URadioGroup', 'USelectMenu'],
        required: { some: ['nesting', 'id'] },
      }],
    },
  },
);
