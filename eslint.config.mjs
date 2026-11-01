import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const NODE_BUILT_INS = ['child_process', 'crypto', 'fs', 'https', 'os', 'path', 'process'];

export default tseslint.config(
    { ignores: ['out/**', 'node_modules/**', 'coverage/**', 'examples/**', 'syntaxes/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'all' }],
            '@typescript-eslint/consistent-type-imports': 'error',
            'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
            'no-restricted-imports': ['error', {
                paths: NODE_BUILT_INS.map((name) => ({ name, message: `Use node:${name}.` }))
            }]
        }
    },
    {
        files: ['src/**/*.ts'],
        rules: {
            'no-restricted-globals': ['error', { name: 'process', message: "Import it from 'node:process'." }]
        }
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { require: 'readonly', module: 'writable', __dirname: 'readonly', console: 'readonly' }
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    }
);
