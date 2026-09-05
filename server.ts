import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use raw body parsing for the excel file upload
  app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
  app.use(express.json());

  // Save Excel Endpoint
  app.post('/api/save-excel', (req, res) => {
    try {
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'No data provided' });
      }

      // The original file is stored in public/دار القلم ١٤٤٧.xlsx
      // In development, the root public folder is mapped. In production it's dist/
      const isProd = process.env.NODE_ENV === 'production';
      const rootDir = process.cwd();
      const targetPath = isProd 
        ? path.join(rootDir, 'dist', 'دار القلم ١٤٤٧.xlsx')
        : path.join(rootDir, 'public', 'دار القلم ١٤٤٧.xlsx');

      // Also save to public even in prod so it's persisted in the source workspace
      const sourcePath = path.join(rootDir, 'public', 'دار القلم ١٤٤٧.xlsx');

      fs.writeFileSync(targetPath, req.body);
      if (isProd && fs.existsSync(path.join(rootDir, 'public'))) {
        fs.writeFileSync(sourcePath, req.body);
      }

      console.log(`Saved Excel file successfully to ${targetPath}`);
      res.json({ success: true, message: 'Saved successfully' });
    } catch (err) {
      console.error('Error saving excel:', err);
      res.status(500).json({ error: 'Failed to save file' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
