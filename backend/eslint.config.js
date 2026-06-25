const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
    { ignores: ['dist/*', 'coverage/*', 'node_modules/*'] },
    {
        files: ['**/*.ts'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            globals: { ...globals.node, ...globals.jest },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        files: ['**/*.js'],
        extends: [js.configs.recommended],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        // Tests re-require modules after jest.resetModules()/jest.doMock(), which can't be
        // expressed as a static ES import.
        files: ['tests/**/*.ts'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    eslintConfigPrettier,
);
