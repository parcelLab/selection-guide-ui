import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const siteDir = path.join(cwd, 'site');
const distDir = path.join(siteDir, 'dist');
const devDir = path.join(siteDir, 'dev');

await rm(siteDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await mkdir(devDir, { recursive: true });

const shared = {
  bundle: true,
  entryPoints: ['src/index.ts'],
  legalComments: 'none',
  minifyWhitespace: true,
  sourcemap: false,
  target: ['es2018'],
  define: {
    __VERSION__: JSON.stringify('pages'),
  },
};

await build({
  ...shared,
  format: 'iife',
  globalName: 'SizeRecommender',
  minify: true,
  outfile: path.join(distDir, 'size-recommender.iife.js'),
  define: {
    ...shared.define,
    __AUTO_INIT__: 'true',
  },
});

await build({
  ...shared,
  format: 'esm',
  outfile: path.join(distDir, 'size-recommender.esm.js'),
  define: {
    ...shared.define,
    __AUTO_INIT__: 'false',
  },
});

await cp(path.join(cwd, 'dev', 'index.html'), path.join(siteDir, 'index.html'));
await cp(path.join(cwd, 'dev', 'main.js'), path.join(devDir, 'main.js'));
await writeFile(path.join(siteDir, '.nojekyll'), '');
