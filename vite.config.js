import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En local, Vite no sirve las funciones de /api (eso lo hace Vercel en producción).
// Este plugin monta api/diagnostico.js en el server de desarrollo para que
// `npm run dev` funcione igual que en Vercel.
function apiLocal() {
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use('/api/diagnostico', async (req, res) => {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }

        res.status = code => { res.statusCode = code; return res; };
        res.json = data => {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(data));
        };

        const { default: handler } = await server.ssrLoadModule('/api/diagnostico.js');
        await handler(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Carga ANTHROPIC_API_KEY del .env SOLO del lado del servidor (sin prefijo VITE_,
  // así Vite nunca la mete en el JS que baja el navegador).
  const env = loadEnv(mode, process.cwd(), '');
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [react(), apiLocal()],
  };
})
