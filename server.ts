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

// Direct APK download route
app.get('/download/necmkimya.apk', (req, res) => {
  const apkPath = path.join(process.cwd(), 'public', 'NecmKimya_UretimTakip.apk');
  const fallbackApkPath = path.join(process.cwd(), 'data', 'NecmKimya_UretimTakip.apk');
  
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, 'NecmKimya_UretimTakip.apk');
  } else if (fs.existsSync(fallbackApkPath)) {
    return res.download(fallbackApkPath, 'NecmKimya_UretimTakip.apk');
  } else {
    // If not compiled yet, return helpful json or text
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>APK İndir - Necm Kimya</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; text-align: center; }
            .card { max-width: 480px; margin: 40px auto; background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; }
            h2 { color: #34d399; margin-top: 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
            a.btn { display: inline-block; background: #10b981; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>📱 Mobil APK / PWA Kurulumu</h2>
            <p>Uygulamanızı telefonunuza doğrudan indirmek için:</p>
            <p>1. Telefonunuzun Chrome tarayıcısında sağ üstteki <strong>3 noktaya (⋮)</strong> dokunun.<br/>
            2. <strong>"Uygulamayı Yükle"</strong> butonuna basarak Google Play gibi anında kurabilirsiniz.</p>
            <p>Derlenmiş özel .apk dosyasını sunucunuzun <code>/var/www/necmkimya2/public/NecmKimya_UretimTakip.apk</code> klasörüne yerleştirebilirsiniz.</p>
            <a class="btn" href="/">Ana Sayfaya Dön</a>
          </div>
        </body>
      </html>
    `);
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
