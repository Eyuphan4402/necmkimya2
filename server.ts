import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Helper to read database
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return null;
}

// Helper to write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

app.use(express.json({ limit: '10mb' }));

// CORS headers for Android Studio app / mobile web requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    host: '62.171.177.210',
    app: 'Uretim & Stok Takip',
  });
});

// Get synchronized data from Ubuntu server
app.get('/api/data', (req, res) => {
  const dbData = readDB();
  if (!dbData) {
    return res.json({
      exists: false,
      recipes: null,
      batches: null,
      shipments: null,
      lastUpdated: null,
    });
  }
  res.json({
    exists: true,
    recipes: dbData.recipes || null,
    batches: dbData.batches || null,
    shipments: dbData.shipments || null,
    lastUpdated: dbData.lastUpdated || null,
  });
});

// Save / Sync data from client (phone or browser) to server disk
app.post('/api/data', (req, res) => {
  const { recipes, batches, shipments } = req.body;
  const payload = {
    recipes: recipes || [],
    batches: batches || [],
    shipments: shipments || [],
    lastUpdated: new Date().toISOString(),
  };

  const success = writeDB(payload);
  if (success) {
    res.json({ success: true, lastUpdated: payload.lastUpdated });
  } else {
    res.status(500).json({ success: false, error: 'Sunucuya kayıt yazılamadı.' });
  }
});

// Reset server data
app.post('/api/reset', (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    res.json({ success: true, message: 'Sunucu verisi sıfırlandı.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Sıfırlama başarısız.' });
  }
});

async function start() {
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
    console.log(`Sunucu aktif: http://0.0.0.0:${PORT} (IP: 62.171.177.210)`);
  });
}

start();
