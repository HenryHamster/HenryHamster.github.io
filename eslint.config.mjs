import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Vinext's client router does not navigate correctly in the static export,
    // so internal links intentionally use native document navigation.
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
