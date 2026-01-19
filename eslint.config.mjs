import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'examples/**',
      'test/**',
      '*.js',
      '*.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'array-bracket-spacing': ['error', 'never'],
      'arrow-parens': ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'block-scoped-var': 'error',
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'comma-dangle': ['error', 'never'],
      'comma-spacing': ['error', { before: false, after: true }],
      'comma-style': ['error', 'last'],
      'computed-property-spacing': ['error', 'never'],
      curly: ['error', 'all'],
      'dot-location': ['error', 'property'],
      'eol-last': ['error', 'always'],
      eqeqeq: ['error', 'smart'],
      indent: ['error', 4, { SwitchCase: 0 }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
      'no-multi-spaces': ['error', { exceptions: { Property: false } }],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': ['error', { skipBlankLines: false }],
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single', 'avoid-escape'],
      semi: ['error', 'always'],
      'semi-spacing': ['error', { before: false, after: true }],
      'space-before-blocks': ['error', 'always'],
      'space-before-function-paren': ['error', 'never'],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  prettierConfig,
]
