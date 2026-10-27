import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';
import { seedInitialAdmin } from './server/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPort(): number {
  // Check CLI arguments first (e.g. --port 3000)
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const p = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(p)) return p;
  }
  // In development, port must always be 3000 in AI Studio
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return parseInt(process.env.PORT || '3000', 10);
}

async function startServer() {
  const app = express();
  const PORT = getPort();
  const isProd = process.env.NODE_ENV === 'production';

  // Seed default administrator & demo participant
  await seedInitialAdmin();

  // Middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProd) {
    // In development: mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    // In production: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 PLANET-X 2026 Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
