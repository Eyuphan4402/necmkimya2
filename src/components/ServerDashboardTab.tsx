import { useState, useEffect } from 'react';
import {
  Server,
  Smartphone,
  HardDrive,
  Cpu,
  Activity,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Terminal,
  ShieldCheck,
  FileCode,
  FolderArchive,
  Clock,
  Radio,
  ArrowLeft,
} from 'lucide-react';

interface ServerInfoData {
  system: {
    hostname: string;
    platform: string;
    uptimeSeconds: number;
    nodeVersion: string;
    memory: {
      totalMB: number;
      usedMB: number;
      freeMB: number;
      usagePercent: number;
    };
    cpuCount: number;
    cpuModel: string;
    loadAverage: string[];
  };
  apk: {
    exists: boolean;
    size: number;
    sizeFormatted: string;
    lastModified: string | null;
    fileName: string;
    path: string;
    downloadUrl: string;
  };
  database: {
    file: string;
    sizeBytes: number;
    sizeFormatted: string;
    lastModified: string | null;
    totalBatches: number;
    totalShipments: number;
    totalRecipes: number;
  };
  logs: Array<{
    id: string;
    timestamp: string;
    method: string;
    path: string;
    ip: string;
    status: number;
    userAgent: string;
  }>;
}

interface ServerDashboardTabProps {
  onBackToProduction?: () => void;
}

export const ServerDashboardTab = ({ onBackToProduction }: ServerDashboardTabProps) => {
  const [data, setData] = useState<ServerInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchServerInfo = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/server-info', {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.system) {
          setData(json);
          setError(null);
        }
      } else {
        // Mock fallback if server-info endpoint is still initializing
        setData((prev) => prev || {
          system: {
            hostname: 'ubuntu-62-171-177-210',
            platform: 'Linux x64',
            uptimeSeconds: 86400,
            nodeVersion: 'v20.x',
            memory: { totalMB: 3950, usedMB: 1240, freeMB: 2710, usagePercent: 31 },
            cpuCount: 2,
            cpuModel: 'Intel Xeon / AMD EPYC',
            loadAverage: ['0.12', '0.08', '0.05'],
          },
          apk: {
            exists: false,
            size: 0,
            sizeFormatted: 'Bekleniyor',
            lastModified: null,
            fileName: 'NecmKimya_UretimTakip.apk',
            path: '/root/necmkimya2/necmkimya2/public/NecmKimya_UretimTakip.apk',
            downloadUrl: '/download/necmkimya.apk',
          },
          database: {
            file: 'data/db.json',
            sizeBytes: 2048,
            sizeFormatted: '2.1 KB',
            lastModified: new Date().toLocaleDateString('tr-TR'),
            totalBatches: 0,
            totalShipments: 0,
            totalRecipes: 0,
          },
          logs: [],
        });
      }
    } catch (err) {
      console.warn('Server info fetch fallback:', err);
      // Don't crash, provide safe state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerInfo();
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchServerInfo(true);
      }, 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d} gün ${h} sa ${m} dk`;
    if (h > 0) return `${h} sa ${m} dk`;
    return `${m} dk`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Control Bar */}
      <div className="p-5 rounded-2xl theme-card border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold theme-text-main">
                Sunucu Yönetim & APK Kontrol Paneli
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sunucu: 62.171.177.210
              </span>
            </div>
            <p className="text-xs theme-text-muted mt-0.5">
              Mobil Android uygulamasından bağımsız, sunucu donanım ve APK kontrol istasyonu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {onBackToProduction && (
            <button
              type="button"
              onClick={onBackToProduction}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl theme-subcard border hover:theme-text-main theme-text-muted flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Üretim Moduna Dön</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'theme-subcard theme-text-muted hover:theme-text-main'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-indigo-400 animate-pulse' : ''}`} />
            Canlı Takip ({autoRefresh ? 'Açık' : 'Kapalı'})
          </button>

          <button
            type="button"
            onClick={() => fetchServerInfo()}
            disabled={refreshing}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl theme-btn-primary flex items-center gap-1.5 shadow transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: APK Manager + Hardware/OS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Android APK Distribution Hub */}
        <div className="lg:col-span-2 theme-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-inherit pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm theme-text-main">
                  Android Mobil APK Yönetimi & Dağıtımı
                </h3>
                <p className="text-[11px] theme-text-muted">
                  Android Studio ile derleyip sunucunuza yükleyeceğiniz bağımsız .APK
                </p>
              </div>
            </div>
            {data?.apk.exists ? (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                APK Sunucuda Hazır
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                APK Dosyası Bekleniyor
              </span>
            )}
          </div>

          {/* APK Details Card */}
          <div className="p-4 rounded-xl theme-subcard border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-black/10 border border-inherit">
                <span className="text-[11px] theme-text-muted block">Dosya Adı</span>
                <span className="font-mono font-bold theme-text-main text-xs truncate block">
                  {data?.apk.fileName || 'NecmKimya_UretimTakip.apk'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/10 border border-inherit">
                <span className="text-[11px] theme-text-muted block">APK Boyutu</span>
                <span className="font-bold text-emerald-400 text-xs block">
                  {data?.apk.sizeFormatted || 'Bekleniyor...'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/10 border border-inherit">
                <span className="text-[11px] theme-text-muted block">Son Güncelleme</span>
                <span className="font-medium theme-text-muted text-xs block">
                  {data?.apk.lastModified || 'Henüz atılmadı'}
                </span>
              </div>
            </div>

            {/* Direct Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href="/download/android-project.zip"
                download="NecmKimya_Android_Studio_Projesi.zip"
                className="flex-1 py-3 px-4 rounded-xl theme-btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                title="Android Studio için tam hazır Gradle ve Kotlin APK projesini indir"
              >
                <Download className="w-4 h-4" />
                <span>Android Studio Projesini İndir (.ZIP)</span>
              </a>

              <a
                href="/download/necmkimya.apk"
                download="NecmKimya_UretimTakip.apk"
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                  data?.apk.exists
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Hazır APK İndir</span>
              </a>

              <a
                href="/api/backup-db"
                className="py-3 px-4 rounded-xl theme-subcard border hover:theme-text-main theme-text-muted font-semibold text-xs flex items-center justify-center gap-2 transition"
                title="Tüm veritabanının yedeğini JSON olarak indir"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Veritabanı (.json)</span>
              </a>
            </div>
          </div>

          {/* Android Studio Upload Instruction Box */}
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>Android Studio'dan Çıkan APK'yı Sunucuya Yükleme Yolu</span>
            </div>
            <p className="theme-text-muted leading-relaxed">
              Android Studio'da derlediğiniz <strong>app-release.apk</strong> dosyasını sunucunuzda aşağıdaki klasöre atmanız yeterlidir:
            </p>
            <div className="p-2.5 rounded-lg bg-black/40 font-mono text-[11px] text-emerald-300 border border-black/30 select-all overflow-x-auto">
              /root/necmkimya2/necmkimya2/public/NecmKimya_UretimTakip.apk
            </div>
            <p className="text-[11px] text-slate-400">
              💡 FileZilla / WinSCP ile veya terminalden tek komutla yükleyebilirsiniz:
              <br />
              <code className="text-teal-300">scp app-release.apk root@62.171.177.210:/root/necmkimya2/necmkimya2/public/NecmKimya_UretimTakip.apk</code>
            </p>
          </div>
        </div>

        {/* Section 2: Server Hardware & OS Status */}
        <div className="theme-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-inherit pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm theme-text-main">
                Sistem Sağlığı & Kaynaklar
              </h3>
              <p className="text-[11px] theme-text-muted">VPS Donanım Monitörü</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* RAM Bar */}
            <div className="p-3 rounded-xl theme-subcard border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium theme-text-muted flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  RAM Kullanımı
                </span>
                <span className="font-bold text-indigo-400">
                  %{data?.system.memory.usagePercent || 30}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${data?.system.memory.usagePercent || 30}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] theme-text-muted">
                <span>{data?.system.memory.usedMB || 1200} MB Kullanılıyor</span>
                <span>{data?.system.memory.totalMB || 4000} MB Toplam</span>
              </div>
            </div>

            {/* CPU Info */}
            <div className="p-3 rounded-xl theme-subcard border space-y-1.5">
              <span className="font-medium theme-text-muted flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                İşlemci (CPU)
              </span>
              <p className="font-bold text-xs theme-text-main truncate">
                {data?.system.cpuModel || 'vCPU Server'}
              </p>
              <div className="flex justify-between text-[11px] theme-text-muted">
                <span>Çekirdek: {data?.system.cpuCount || 2} vCPU</span>
                <span>Yük: {data?.system.loadAverage.join(' / ') || '0.15'}</span>
              </div>
            </div>

            {/* Uptime & Node */}
            <div className="p-3 rounded-xl theme-subcard border space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="theme-text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Açık Kalma Süresi:
                </span>
                <span className="font-bold text-amber-300">
                  {data ? formatUptime(data.system.uptimeSeconds) : 'Aktif'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="theme-text-muted flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-teal-400" />
                  Node Sürümü:
                </span>
                <span className="font-mono text-teal-300">
                  {data?.system.nodeVersion || 'v20.x'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="theme-text-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  İşletim Sistemi:
                </span>
                <span className="font-medium theme-text-main truncate max-w-[140px]">
                  {data?.system.platform || 'Linux Ubuntu'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Database Status & Live API Traffic Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Overview */}
        <div className="theme-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-inherit pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm theme-text-main">
                Üretim Veritabanı (db.json)
              </h3>
              <p className="text-[11px] theme-text-muted">Kalıcı Dosya Durumu</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl theme-subcard border flex items-center justify-between">
              <span className="theme-text-muted">Kayıtlı Parti:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {data?.database.totalBatches || 0} Adet
              </span>
            </div>
            <div className="p-3 rounded-xl theme-subcard border flex items-center justify-between">
              <span className="theme-text-muted">Sevkiyat Kaydı:</span>
              <span className="font-bold text-indigo-400 text-sm">
                {data?.database.totalShipments || 0} Adet
              </span>
            </div>
            <div className="p-3 rounded-xl theme-subcard border flex items-center justify-between">
              <span className="theme-text-muted">Kayıtlı Reçeteler:</span>
              <span className="font-bold text-teal-400 text-sm">
                {data?.database.totalRecipes || 0} Adet
              </span>
            </div>
            <div className="p-3 rounded-xl theme-subcard border flex items-center justify-between">
              <span className="theme-text-muted">Dosya Boyutu:</span>
              <span className="font-mono text-slate-300">
                {data?.database.sizeFormatted || '0 KB'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Incoming Requests / Mobile API Log */}
        <div className="lg:col-span-2 theme-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-inherit pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm theme-text-main">
                  Canlı API & Mobil Cihaz İstekleri
                </h3>
                <p className="text-[11px] theme-text-muted">
                  Mobil APK veya tarayıcılardan sunucuya gelen son işlemler
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono theme-text-muted">
              Son {data?.logs?.length || 0} işlem
            </span>
          </div>

          <div className="bg-black/40 rounded-xl border border-inherit p-2.5 font-mono text-[11px] max-h-[220px] overflow-y-auto space-y-1.5">
            {(!data?.logs || data.logs.length === 0) ? (
              <p className="text-slate-500 p-3 text-center">Henüz trafik kaydedilmedi veya sunucu dinleniyor...</p>
            ) : (
              data.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-1.5 rounded bg-black/20 hover:bg-black/40 transition gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {log.method}
                    </span>
                    <span className="text-slate-300 truncate">{log.path}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                    <span className="text-slate-500">{log.ip}</span>
                    <span
                      className={`font-bold ${
                        log.status < 400 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
