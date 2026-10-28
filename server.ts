import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';
import { seedInitialAdmin } from './server/auth.ts';

dotenv.config();

// Suppress Vite config native ignore warning if applicable
process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPort(): number {
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--port' || arg === '-p') {
      const val = parseInt(process.argv[i + 1], 10);
      if (!isNaN(val)) return val;
    }
    if (arg.startsWith('--port=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val)) return val;
    }
  }
  if (process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val)) return val;
  }
  return 3000;
}

function getHost(): string {
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--host' || arg === '-h') {
      return process.argv[i + 1] || '0.0.0.0';
    }
    if (arg.startsWith('--host=')) {
      return arg.split('=')[1] || '0.0.0.0';
    }
  }
  return process.env.HOST || '0.0.0.0';
}

function listenWithRetry(
  app: express.Express,
  port: number,
  host: string,
  retries = 6,
  delay = 500
): Promise<import('http').Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host);

    server.once('listening', () => {
      resolve(server);
    });

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && retries > 0) {
        console.warn(`[dev-server] Port ${port} in use, waiting ${delay}ms before retrying... (${retries} retries left)`);
        setTimeout(() => {
          listenWithRetry(app, port, host, retries - 1, delay).then(resolve).catch(reject);
        }, delay);
      } else {
        reject(err);
      }
    });
  });
}

async function startServer() {
  const startTime = Date.now();
  const app = express();
  const PORT = getPort();
  const HOST = getHost();
  const isProd = process.env.NODE_ENV === 'production';

  // Seed default administrator & clean demo records
  try {
    await seedInitialAdmin();
  } catch (seedErr) {
    console.error('Initial admin verification notice:', seedErr);
  }

  // Middleware
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
        host: HOST,
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

  const server = await listenWithRetry(app, PORT, HOST);
  const elapsed = Date.now() - startTime;

  console.log(`\n  VITE v8.3.5  ready in ${elapsed} ms\n`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://${HOST}:${PORT}/`);
  console.log(`  ➜  API:     http://localhost:${PORT}/api/health\n`);
  console.log(`🚀 PLANET-X 2026 Full-Stack Server active on http://${HOST}:${PORT}`);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down server...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
