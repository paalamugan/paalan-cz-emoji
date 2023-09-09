import { defineConfig } from 'tsup';

const env = process.env.NODE_ENV;
const isDev = env === 'development';

export default defineConfig(() => ({
  entry: ['src/index.ts'],
  treeshake: true,
  target: 'es5',
  sourcemap: isDev,
  minify: false,
  clean: true,
  dts: true,
  splitting: false,
  format: 'cjs',
  output: { exports: 'named' },
}));
