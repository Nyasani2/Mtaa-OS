import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // ── MTAA launch override: allow @ts-nocheck (intentional tech debt) ──
  {
    name: 'mtaa/launch-override',
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-nocheck': false,
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
      }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-duplicate-imports': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
);
