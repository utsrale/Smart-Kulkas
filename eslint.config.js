// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const tseslint = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
    },
    rules: {
      // Entitas HTML yang tidak di-escape di dalam JSX (mis. tanda kutip/apostrof
      // pada teks seperti "Don't") — di-pin sebagai error agar konsisten dan terjaga di CI.
      'react/no-unescaped-entities': 'error',

      // Variabel yang dideklarasikan tapi tidak pernah dipakai — naikkan dari 'warn'
      // (default eslint-config-expo) menjadi 'error' dengan opsi yang sama persis,
      // supaya `npm run lint` / CI gagal ketika ada kode mati seperti ini.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        },
      ],
    },
  },
]);
