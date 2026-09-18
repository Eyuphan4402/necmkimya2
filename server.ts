import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ZipArchive } from 'archiver';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Recent logs store for dashboard
interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  status: number;
  userAgent: string;
}
const recentLogs: RequestLog[] = [];
function addLog(log: RequestLog) {
  recentLogs.unshift(log);
  if (recentLogs.length > 50) recentLogs.pop();
}

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

// Traffic logging middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    if (!req.path.startsWith('/@') && !req.path.startsWith('/node_modules') && !req.path.endsWith('.js') && !req.path.endsWith('.css')) {
      addLog({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        method: req.method,
        path: req.path,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
        status: res.statusCode,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
    }
  });
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

// Server System Metrics & APK Info for Dashboard
app.get('/api/server-info', (req, res) => {
  try {
    const apkPath = path.join(process.cwd(), 'public', 'NecmKimya_UretimTakip.apk');
    let apkInfo = {
      exists: false,
      size: 0,
      sizeFormatted: 'Yok',
      lastModified: null as string | null,
      fileName: 'NecmKimya_UretimTakip.apk',
      path: apkPath,
      downloadUrl: '/download/necmkimya.apk'
    };

    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      apkInfo.exists = true;
      apkInfo.size = stats.size;
      apkInfo.sizeFormatted = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
      apkInfo.lastModified = stats.mtime.toLocaleString('tr-TR');
    }

    const totalMem = os.totalmem ? os.totalmem() : 4 * 1024 * 1024 * 1024;
    const freeMem = os.freemem ? os.freemem() : 2 * 1024 * 1024 * 1024;
    const usedMem = Math.max(0, totalMem - freeMem);

    const dbStats = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
    const dbData = readDB() || {};

    res.json({
      success: true,
      system: {
        hostname: os.hostname ? os.hostname() : 'ubuntu-server',
        platform: `${os.type ? os.type() : 'Linux'} ${os.release ? os.release() : ''} (${os.arch ? os.arch() : 'x64'})`,
        uptimeSeconds: Math.floor(os.uptime ? os.uptime() : 3600),
        nodeVersion: process.version,
        memory: {
          totalMB: Math.round(totalMem / (1024 * 1024)),
          usedMB: Math.round(usedMem / (1024 * 1024)),
          freeMB: Math.round(freeMem / (1024 * 1024)),
          usagePercent: Math.min(100, Math.round((usedMem / totalMem) * 100)),
        },
        cpuCount: os.cpus ? os.cpus().length : 2,
        cpuModel: os.cpus && os.cpus()[0] ? os.cpus()[0].model : 'vCPU',
        loadAverage: os.loadavg ? os.loadavg().map(v => v.toFixed(2)) : ['0.10', '0.08', '0.05'],
      },
      apk: apkInfo,
      database: {
        file: DB_FILE,
        sizeBytes: dbStats ? dbStats.size : 0,
        sizeFormatted: dbStats ? (dbStats.size / 1024).toFixed(1) + ' KB' : '0 KB',
        lastModified: dbStats ? dbStats.mtime.toLocaleString('tr-TR') : null,
        totalBatches: dbData.batches ? dbData.batches.length : 0,
        totalShipments: dbData.shipments ? dbData.shipments.length : 0,
        totalRecipes: dbData.recipes ? dbData.recipes.length : 0,
      },
      logs: recentLogs.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Direct JSON database backup download
app.get('/api/backup-db', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    return res.download(DB_FILE, `necmkimya_backup_${new Date().toISOString().split('T')[0]}.json`);
  }
  res.status(404).json({ error: 'Database file not found' });
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
            <p>Ayrıca Android Studio projesini doğrudan indirip tek tıkla APK derleyebilirsiniz:</p>
            <a class="btn" href="/download/android-project.zip">Android Studio Projesini İndir (.ZIP)</a>
            <br/><br/>
            <a class="btn" style="background:#334155;" href="/">Ana Sayfaya Dön</a>
          </div>
        </body>
      </html>
    `);
  }
});

// Download Android Studio Native Project as ZIP
app.get('/download/android-project.zip', (req, res) => {
  try {
    const archive = new (ZipArchive as any)({ zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="NecmKimya_Android_Studio_Projesi.zip"');

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).send({ error: 'Arşiv oluşturulamadı' });
    });

    archive.pipe(res);

    // Add root gradle files
    if (fs.existsSync(path.join(process.cwd(), 'settings.gradle'))) {
      archive.file(path.join(process.cwd(), 'settings.gradle'), { name: 'settings.gradle' });
    }
    if (fs.existsSync(path.join(process.cwd(), 'build.gradle'))) {
      archive.file(path.join(process.cwd(), 'build.gradle'), { name: 'build.gradle' });
    }
    if (fs.existsSync(path.join(process.cwd(), 'gradle.properties'))) {
      archive.file(path.join(process.cwd(), 'gradle.properties'), { name: 'gradle.properties' });
    }
    if (fs.existsSync(path.join(process.cwd(), 'gradlew'))) {
      archive.file(path.join(process.cwd(), 'gradlew'), { name: 'gradlew', mode: 0o755 });
    }
    if (fs.existsSync(path.join(process.cwd(), 'gradlew.bat'))) {
      archive.file(path.join(process.cwd(), 'gradlew.bat'), { name: 'gradlew.bat' });
    }
    if (fs.existsSync(path.join(process.cwd(), 'gradle'))) {
      archive.directory(path.join(process.cwd(), 'gradle'), 'gradle');
    }
    if (fs.existsSync(path.join(process.cwd(), 'app'))) {
      archive.directory(path.join(process.cwd(), 'app'), 'app');
    }

    archive.finalize();
  } catch (err) {
    console.error('Failed to create android zip:', err);
    res.status(500).send('Arşiv oluşturulamadı.');
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
