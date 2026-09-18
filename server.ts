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

  // --- Auth & Users endpoints ---
  const usersFilePath = path.join(process.cwd(), 'users.json');

  const getUsers = () => {
    try {
      if (!fs.existsSync(usersFilePath)) return [];
      const data = fs.readFileSync(usersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  };

  const saveUsers = (users: any[]) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  };

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (user) {
      res.json({ success: true, username: user.username, role: user.role, complex: user.complex });
    } else {
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
  });

  app.get('/api/users', (req, res) => {
    res.json(getUsers());
  });

  app.post('/api/users', (req, res) => {
    const { username, password, role, complex } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }
    const users = getUsers();
    if (users.find((u: any) => u.username === username)) {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }
    users.push({ username, password, role: role || 'user', complex: complex || 'كل المجمعات' });
    saveUsers(users);
    res.json({ success: true, message: 'تم إضافة المستخدم بنجاح' });
  });

  app.put('/api/users', (req, res) => {
    const { oldUsername, newUsername, newPassword, newComplex } = req.body;
    const users = getUsers();
    const userIndex = users.findIndex((u: any) => u.username === oldUsername);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    if (newUsername && newUsername !== oldUsername && users.find((u: any) => u.username === newUsername)) {
      return res.status(400).json({ error: 'اسم المستخدم الجديد موجود بالفعل' });
    }
    
    if (newUsername) users[userIndex].username = newUsername;
    if (newPassword) users[userIndex].password = newPassword;
    if (newComplex) users[userIndex].complex = newComplex;
    
    saveUsers(users);
    res.json({ success: true, message: 'تم تحديث البيانات بنجاح', user: users[userIndex] });
  });

  app.delete('/api/users/:username', (req, res) => {
    const { username } = req.params;
    let users = getUsers();
    const initialLength = users.length;
    users = users.filter((u: any) => u.username !== username);
    
    if (users.length === initialLength) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    saveUsers(users);
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  });

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

  // Serve public assets directly
  app.use(express.static(path.join(process.cwd(), 'public')));

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
