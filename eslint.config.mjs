import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['out/**', 'node_modules/**', 'coverage/**', 'examples/**', 'syntaxes/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' }
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    }
);
