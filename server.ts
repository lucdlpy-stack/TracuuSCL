import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory data store structure
interface DbSchema {
  version: number;
  lastUpdated: number;
  users: Array<{
    id: string;
    username: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    unit: string;
    createdAt: string;
  }>;
  assets: any[];
  repairRecords: any[];
  planRecords: any[];
  cycleRules: any[];
  systemLogs: any[];
}

// Initial seed users
const INITIAL_USERS = [
  {
    id: 'USR-001',
    username: 'admin',
    name: 'Quản trị viên EVN',
    email: 'admin@evn.com.vn',
    passwordHash: 'EvnAdmin2026', // Contains letters and numbers
    role: 'Admin',
    unit: 'Công ty Điện lực Chợ Lớn',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'USR-002',
    username: 'kythuat',
    name: 'Kỹ sư Quản lý Kỹ thuật',
    email: 'kythuat@evn.com.vn',
    passwordHash: 'Kythuat2026', // Contains letters and numbers
    role: 'Technical',
    unit: 'Công ty Điện lực Chợ Lớn',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'USR-003',
    username: 'vanhanh',
    name: 'Kỹ sư Quản lý Vận hành',
    email: 'vanhanh@evn.com.vn',
    passwordHash: 'Vanhanh2026', // Contains letters and numbers
    role: 'Operator',
    unit: 'Công ty Điện lực Tân Thuận',
    createdAt: new Date().toISOString(),
  },
];

import {
  SEED_ASSETS,
  SEED_REPAIRS,
  SEED_PLANS,
  SEED_RULES,
  SEED_LOGS,
} from './src/services/storage';

function loadDatabase(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.users)) {
        // If assets are empty, populate with seed data so all devices get data immediately
        if (!Array.isArray(data.assets) || data.assets.length === 0) {
          data.assets = SEED_ASSETS;
          data.repairRecords = SEED_REPAIRS;
          data.planRecords = SEED_PLANS;
          data.cycleRules = SEED_RULES;
          data.systemLogs = SEED_LOGS;
          saveDatabase(data);
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Failed to read db.json, creating new database:', err);
  }

  // Create initial database with pre-populated EVN data
  const defaultDb: DbSchema = {
    version: 2,
    lastUpdated: Date.now(),
    users: INITIAL_USERS,
    assets: SEED_ASSETS,
    repairRecords: SEED_REPAIRS,
    planRecords: SEED_PLANS,
    cycleRules: SEED_RULES,
    systemLogs: SEED_LOGS,
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(db: DbSchema) {
  try {
    db.lastUpdated = Date.now();
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
    } catch (e) {
      // client disconnected
      sseClients.splice(i, 1);
    }
  }
}

// Password validation: must contain both letters and numbers, length >= 6
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

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
  }

  const normalized = account.trim().toLowerCase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
  );

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
  }

  // Create simple session token
  const token = `EVN_TOKEN_${user.id}_${Date.now()}`;
  const userResponse = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    unit: user.unit,
  };

  return res.json({ token, user: userResponse });
});

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
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
    },
  });
});

// GET /api/auth/me
app.get('/api/auth/me', (req: Request, res: Response) => {
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
    },
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const { userId, oldPassword, newPassword } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Người dùng không tồn tại.' });
  }
  if (user.passwordHash !== oldPassword) {
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

// ======================== REALTIME SYNC ROUTES ========================

// GET /api/sync/stream -> Server-Sent Events stream for instant push to Web & Smartphone
app.get('/api/sync/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial handshake with current state
  res.write(
    `data: ${JSON.stringify({
      type: 'INIT',
      lastUpdated: db.lastUpdated,
      assets: db.assets,
      repairRecords: db.repairRecords,
      planRecords: db.planRecords,
      cycleRules: db.cycleRules,
      systemLogs: db.systemLogs,
    })}\n\n`
  );
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  // Ping every 10 seconds to keep connection alive through cloud and cellular proxies
  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, 10000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// GET /api/sync/pull -> Pull latest data
app.get('/api/sync/pull', (req: Request, res: Response) => {
  const since = Number(req.query.since) || 0;
  return res.json({
    lastUpdated: db.lastUpdated,
    hasUpdates: db.lastUpdated > since,
    data: {
      assets: db.assets,
      repairRecords: db.repairRecords,
      planRecords: db.planRecords,
      cycleRules: db.cycleRules,
      systemLogs: db.systemLogs,
    },
  });
});

// POST /api/sync/push -> Client pushes changes to server, server broadcasts to all mobile & web clients
app.post('/api/sync/push', (req: Request, res: Response) => {
  const { assets, repairRecords, planRecords, cycleRules, systemLogs } = req.body;

  if (Array.isArray(assets)) db.assets = assets;
  if (Array.isArray(repairRecords)) db.repairRecords = repairRecords;
  if (Array.isArray(planRecords)) db.planRecords = planRecords;
  if (Array.isArray(cycleRules)) db.cycleRules = cycleRules;
  if (Array.isArray(systemLogs)) db.systemLogs = systemLogs;

  db.lastUpdated = Date.now();
  saveDatabase(db);

  // Broadcast to all connected web browsers & smartphones immediately
  broadcastToClients({
    type: 'UPDATE',
    lastUpdated: db.lastUpdated,
    assets: db.assets,
    repairRecords: db.repairRecords,
    planRecords: db.planRecords,
    cycleRules: db.cycleRules,
    systemLogs: db.systemLogs,
  });

  return res.json({ success: true, lastUpdated: db.lastUpdated });
});

// Start dev or production server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[EVN Server] Listening on http://0.0.0.0:${port}`);
  });
}

startServer();
