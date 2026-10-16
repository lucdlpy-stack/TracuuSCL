import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initial seed users
const INITIAL_USERS = [
  {
    id: 'USR-000',
    username: 'luctt1',
    name: 'Tôn Tấn Lực',
    email: 'luctt1@evn.com.vn',
    passwordHash: 'Luctt12026', // also accepts luctt1
    role: 'Admin',
    unit: 'Công ty Điện lực Chợ Lớn',
    permissions: { canView: true, canEdit: true, canUpdate: true },
  },
  {
    id: 'USR-001',
    username: 'admin',
    name: 'Tôn Tấn Lực',
    email: 'admin@evn.com.vn',
    passwordHash: 'EvnAdmin2026',
    role: 'Admin',
    unit: 'Công ty Điện lực Chợ Lớn',
    permissions: { canView: true, canEdit: true, canUpdate: true },
  },
  {
    id: 'USR-002',
    username: 'kythuat',
    name: 'Kỹ sư Quản lý Kỹ thuật',
    email: 'kythuat@evn.com.vn',
    passwordHash: 'Kythuat2026',
    role: 'Technical',
    unit: 'Công ty Điện lực Chợ Lớn',
    permissions: { canView: true, canEdit: true, canUpdate: true },
  },
  {
    id: 'USR-003',
    username: 'vanhanh',
    name: 'Kỹ sư Quản lý Vận hành',
    email: 'vanhanh@evn.com.vn',
    passwordHash: 'Vanhanh2026',
    role: 'Operator',
    unit: 'Công ty Điện lực Tân Thuận',
    permissions: { canView: true, canEdit: true, canUpdate: false },
  },
];

type DB = {
  users: any[];
  assets: any[];
  repairRecords: any[];
  planRecords: any[];
  cycleRules: any[];
  systemLogs: any[];
  lastUpdated: string;
};

function loadDatabase(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);

      // Ensure Admin luctt1 exists
      if (!loaded.users || !Array.isArray(loaded.users)) {
        loaded.users = INITIAL_USERS;
      } else {
        const luctt1Exists = loaded.users.some(
          (u: any) => u.username && u.username.toLowerCase() === 'luctt1'
        );
        if (!luctt1Exists) {
          loaded.users.unshift(INITIAL_USERS[0]);
        } else {
          // ensure name is Tôn Tấn Lực
          const adminUser = loaded.users.find(
            (u: any) => u.username && u.username.toLowerCase() === 'luctt1'
          );
          if (adminUser) {
            adminUser.name = 'Tôn Tấn Lực';
            adminUser.role = 'Admin';
            adminUser.permissions = { canView: true, canEdit: true, canUpdate: true };
          }
        }
      }

      return {
        users: loaded.users || INITIAL_USERS,
        assets: loaded.assets || [],
        repairRecords: loaded.repairRecords || [],
        planRecords: loaded.planRecords || [],
        cycleRules: loaded.cycleRules || [],
        systemLogs: loaded.systemLogs || [],
        lastUpdated: loaded.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Error loading db.json:', err);
  }

  return {
    users: INITIAL_USERS,
    assets: [],
    repairRecords: [],
    planRecords: [],
    cycleRules: [],
    systemLogs: [],
    lastUpdated: new Date().toISOString(),
  };
}

function saveDatabase(db: DB) {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

let db = loadDatabase();

// SSE Clients List for Real-time push across Web & Smartphone
type SSEClient = {
  id: string;
  res: Response;
};
let sseClients: SSEClient[] = [];

function broadcastToClients(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.res.write(payload);
      if (typeof (client.res as any).flush === 'function') {
        (client.res as any).flush();
      }
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự.' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: 'Mật khẩu phải bao gồm cả chữ và số.' };
  }
  return { valid: true };
}

// ======================== AUTH ROUTES ========================

app.post('/api/auth/login', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
  }

  const normalized = account.trim().toLowerCase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
  );

  const isPasswordValid =
    user &&
    (user.passwordHash === password ||
      (normalized === 'luctt1' && (password === 'luctt1' || password === 'Luctt12026' || password === 'Luctt1')));

  if (!user || !isPasswordValid) {
    return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
  }

  const token = `EVN_TOKEN_${user.id}_${Date.now()}`;
  const userResponse = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    unit: user.unit,
    permissions: user.permissions || { canView: true, canEdit: true, canUpdate: true },
  };

  return res.json({ token, user: userResponse });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { username, name, email, password, unit } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const normUsername = username.trim().toLowerCase();
  if (db.users.some((u) => u.username.toLowerCase() === normUsername)) {
    return res.status(400).json({ error: 'Tên tài khoản này đã tồn tại trong hệ thống.' });
  }

  const newUser = {
    id: `USR-${Date.now()}`,
    username: username.trim(),
    name: name.trim(),
    email: email?.trim() || `${normUsername}@evn.com.vn`,
    passwordHash: password,
    role: 'Engineer',
    unit: unit?.trim() || 'Công ty Điện lực Chợ Lớn',
    permissions: { canView: true, canEdit: true, canUpdate: true },
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  const token = `EVN_TOKEN_${newUser.id}_${Date.now()}`;
  return res.json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      unit: newUser.unit,
      permissions: newUser.permissions,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập.' });
  }

  const token = authHeader.replace('Bearer ', '');
  const match = token.match(/^EVN_TOKEN_(USR-[0-9]+)_/);
  if (!match) {
    return res.status(401).json({ error: 'Token không hợp lệ.' });
  }

  const userId = match[1];
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Người dùng không tồn tại.' });
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      unit: user.unit,
      permissions: user.permissions || { canView: true, canEdit: true, canUpdate: true },
    },
  });
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { userId, username, oldPassword, newPassword } = req.body;
  const normalized = (username || '').trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      (userId && u.id === userId) ||
      (normalized && (u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized))
  );

  if (!user) {
    return res.status(404).json({ error: 'Người dùng không tồn tại.' });
  }

  const isOldValid =
    user.passwordHash === oldPassword ||
    (user.username.toLowerCase() === 'luctt1' &&
      (oldPassword === 'luctt1' || oldPassword === 'Luctt12026' || oldPassword === 'Luctt1'));

  if (!isOldValid) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }

  const passCheck = validatePassword(newPassword);
  if (!passCheck.valid) {
    return res.status(400).json({ error: passCheck.message });
  }

  user.passwordHash = newPassword;
  saveDatabase(db);
  return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
});

// ======================== USER MANAGEMENT ROUTES ========================

app.get('/api/users', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role || 'Engineer',
    unit: u.unit || 'Công ty Điện lực Chợ Lớn',
    permissions: u.permissions || { canView: true, canEdit: true, canUpdate: true },
  }));
  return res.json({ users: safeUsers });
});

app.post('/api/users/update-permissions', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { users } = req.body;
  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ error: 'Dữ liệu người dùng không hợp lệ.' });
  }

  for (const updatedUser of users) {
    const existing = db.users.find(
      (u) => u.id === updatedUser.id || u.username.toLowerCase() === updatedUser.username.toLowerCase()
    );
    if (existing) {
      existing.role = updatedUser.role || existing.role;
      existing.permissions = updatedUser.permissions || existing.permissions;
    } else {
      db.users.push(updatedUser);
    }
  }

  saveDatabase(db);
  broadcastToClients({ type: 'USERS_UPDATED', users: db.users });
  return res.json({ success: true, message: 'Đã cập nhật phân quyền người dùng!' });
});

app.post('/api/users/delete', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Thiếu thông tin người dùng cần xóa.' });
  }

  db.users = db.users.filter((u) => u.id !== userId && u.username.toLowerCase() !== 'luctt1');
  saveDatabase(db);
  broadcastToClients({ type: 'USERS_UPDATED', users: db.users });
  return res.json({ success: true, message: 'Đã xóa tài khoản cán bộ khỏi hệ thống!' });
});

// ======================== REALTIME SYNC ROUTES ========================

app.get('/api/sync/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  res.write(
    `data: ${JSON.stringify({
      type: 'INIT',
      data: {
        assets: db.assets,
        repairRecords: db.repairRecords,
        planRecords: db.planRecords,
        cycleRules: db.cycleRules,
        systemLogs: db.systemLogs,
        users: db.users,
      },
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

app.get('/api/sync/pull', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    data: {
      assets: db.assets,
      repairRecords: db.repairRecords,
      planRecords: db.planRecords,
      cycleRules: db.cycleRules,
      systemLogs: db.systemLogs,
      users: db.users,
      lastUpdated: db.lastUpdated,
    },
  });
});

app.post('/api/sync/push', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const payload = req.body;

  if (payload.assets && Array.isArray(payload.assets)) db.assets = payload.assets;
  if (payload.repairRecords && Array.isArray(payload.repairRecords)) db.repairRecords = payload.repairRecords;
  if (payload.planRecords && Array.isArray(payload.planRecords)) db.planRecords = payload.planRecords;
  if (payload.cycleRules && Array.isArray(payload.cycleRules)) db.cycleRules = payload.cycleRules;
  if (payload.systemLogs && Array.isArray(payload.systemLogs)) db.systemLogs = payload.systemLogs;
  if (payload.users && Array.isArray(payload.users)) db.users = payload.users;

  saveDatabase(db);
  broadcastToClients({ type: 'FULL_SYNC', data: payload });

  return res.json({ success: true, timestamp: db.lastUpdated });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`EVN Asset Handbook Server running at http://localhost:${PORT}`);
  });
}

startServer();
