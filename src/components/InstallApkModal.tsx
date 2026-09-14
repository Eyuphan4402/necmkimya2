import { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, ShieldCheck, HelpCircle, ExternalLink, QrCode } from 'lucide-react';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallApkModal = ({ isOpen, onClose }: InstallApkModalProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

  useEffect(() => {
    // Check if running in standalone/installed mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      // Fallback hint
      alert('Tarayıcınızın menüsünden (sağ üst 3 nokta) "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğine dokunarak anında telefonunuza kurabilirsiniz!');
    }
  };

  return (
    <div
      id="modal-install-apk-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="modal-install-apk-container"
        className="w-full max-w-lg theme-card border rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base theme-text-main leading-tight">
                Telefona Yükle / APK İndir
              </h3>
              <p className="text-xs theme-text-muted">
                Necm Kimya Üretim ve Stok Takip Mobil Uygulaması
              </p>
            </div>
          </div>
          <button
            id="btn-close-apk-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg theme-subcard theme-text-muted hover:theme-text-main border transition text-xs font-semibold px-2.5"
          >
            Kapat
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-inherit p-1 bg-black/10">
          <button
            type="button"
            id="tab-install-pwa"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'theme-btn-primary shadow'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            1. Anında Telefona Kur (PWA Uygulama)
          </button>
          <button
            type="button"
            id="tab-install-apk"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'theme-btn-primary shadow'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            <Download className="w-4 h-4" />
            2. Özel .APK Dosyası İndir
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'pwa' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl theme-subcard border space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google Chrome & Android Destekli Yerel Yükleme</span>
                </div>
                <p className="text-xs theme-text-muted leading-relaxed">
                  Uygulama telefonunuza Google Play veya APK gerektirmeden, orijinal bir Android uygulaması gibi tam ekran ve offline destekli olarak doğrudan kurulur.
                </p>

                {isInstalled ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Uygulama şu anda telefonunuzda yüklü modda çalışıyor!
                  </div>
                ) : (
                  <button
                    id="btn-direct-install-pwa"
                    type="button"
                    onClick={handlePwaInstall}
                    className="w-full py-2.5 px-4 rounded-xl theme-btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Telefona Doğrudan Uygulama Olarak Yükle
                  </button>
                )}
              </div>

              {/* Instructions for Android Chrome */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Tarayıcıdan Kurulum (10 Saniye):
                </h4>
                <ol className="text-xs space-y-2 theme-text-muted list-decimal list-inside bg-black/10 p-3 rounded-xl border border-inherit">
                  <li>Telefonunuzda bu siteyi Google Chrome ile açın.</li>
                  <li>Sağ üstteki <strong>üç nokta (⋮)</strong> menüsüne dokunun.</li>
                  <li>
                    <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> butonuna basın.
                  </li>
                  <li>Uygulama logosu telefonunuzun menüsüne eklenir, tıkladığınızda tam ekran uygulama olarak açılır.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl theme-subcard border space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Download className="w-4 h-4" />
                  <span>Sunucu .APK İndirme Bağlantısı</span>
                </div>
                <p className="text-xs theme-text-muted leading-relaxed">
                  Sunucunuzda (`62.171.177.210`) barındırılan veya doğrudan derlenen .APK dosyasını telefonunuza indirebilirsiniz.
                </p>

                {/* Direct APK Link */}
                <a
                  id="link-download-apk-direct"
                  href="/download/necmkimya.apk"
                  download="NecmKimya_UretimTakip.apk"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Download className="w-4 h-4" />
                  NecmKimya_UretimTakip.apk İndir (v1.0.0)
                </a>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1.5">
                <p className="font-semibold">💡 Bilgilendirme:</p>
                <p className="leading-relaxed opacity-90">
                  Android telefonunuza indirdikten sonra <em>"Bilinmeyen kaynaklardan uygulama yükleme"</em> izni vererek APK'yı kurabilirsiniz.
                  Uygulama doğrudan <strong>62.171.177.210</strong> sunucunuzdaki veritabanına bağlanır.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-inherit flex items-center justify-between text-[11px] theme-text-muted bg-black/5">
          <span>Sunucu: 62.171.177.210</span>
          <span>Versiyon: v1.0.0 (Mobil Uyumlu)</span>
        </div>
      </div>
    </div>
  );
};
