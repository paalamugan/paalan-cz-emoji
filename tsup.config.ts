import { defineConfig } from 'tsup';

const env = process.env.NODE_ENV;
const isDev = env === 'development';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  treeshake: true,
  target: 'es5',
  sourcemap: isDev,
  noExternal: ['find-up', 'cli-truncate', 'wrap-ansi'],
  minify: !options.watch,
  clean: true,
  dts: true,
  splitting: false,
  format: 'cjs',
}));
