import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { normalizeApiUrl } from './lib/config.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = process.env.PAGES_BASE_PATH || env.PAGES_BASE_PATH || '/SubStreamFrontend/';
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('PAGES_BASE_PATH must be a slash-delimited path such as /SubStreamFrontend/ or /.');
  const saved = JSON.parse(readFileSync(new URL('./public/config.json', import.meta.url), 'utf8'));
  const apiUrl = normalizeApiUrl(process.env.API_BASE_URL || env.API_BASE_URL || saved.apiUrl || '');
  return {
    base,
    resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
    plugins: [react(), {
      name: 'static-pages-output',
      enforce: 'post',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = request.url?.split('?')[0];
          if (path !== base + 'config.json' && path !== '/config.json') return next();
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');
          response.end(JSON.stringify({ apiUrl }));
        });
      },
      generateBundle(_options, bundle) {
        const index = bundle['index.html'];
        if (!index || index.type !== 'asset') throw new Error('Missing application entrypoint');
        this.emitFile({ type: 'asset', fileName: '404.html', source: index.source });
        this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
        this.emitFile({ type: 'asset', fileName: 'config.json', source: JSON.stringify({ apiUrl }, null, 2) + '\n' });
      },
    }],
    server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
    preview: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
    build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
  };
});
