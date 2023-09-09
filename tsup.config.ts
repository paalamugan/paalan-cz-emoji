import { defineConfig } from 'tsup';

const env = process.env.NODE_ENV;
const isDev = env === 'development';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  treeshake: false,
  target: 'es2019',
  sourcemap: isDev,
  minify: !options.watch,
  clean: true,
  dts: true,
  splitting: false,
  format: ['cjs', 'esm'],
}));
