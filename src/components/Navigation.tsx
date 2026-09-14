import { useState } from 'react';
import {
  FlaskConical,
  CalendarCheck,
  Package,
  Truck,
  Sparkles,
  Palette,
  Check,
  Server,
  Cloud,
} from 'lucide-react';
import { ActiveTab, AppTheme } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stockCount: number;
  criticalSKTCount: number;
  currentTheme: AppTheme;
}

export const BottomNavigation = ({
  activeTab,
  setActiveTab,
  criticalSKTCount,
}: NavigationProps) => {
  const tabs = [
    {
      id: 'recipe' as ActiveTab,
      label: 'Reçeteler',
      icon: FlaskConical,
      shortLabel: 'Reçeteler',
    },
    {
      id: 'daily' as ActiveTab,
      label: 'Günlük Üretim',
      icon: CalendarCheck,
      shortLabel: 'Günlük',
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Stok & Lot',
      icon: Package,
      shortLabel: 'Stok & Lot',
      badge: criticalSKTCount > 0 ? criticalSKTCount : null,
    },
    {
      id: 'shipment' as ActiveTab,
      label: 'Sevkiyat',
      icon: Truck,
      shortLabel: 'Sevkiyat',
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Ana Navigasyon"
      className="sticky bottom-0 left-0 right-0 z-40 theme-nav backdrop-blur-md border-t safe-area-bottom shadow-2xl transition-colors duration-200"
    >
      <div className="w-full max-w-md md:max-w-2xl mx-auto grid grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'theme-accent-badge font-bold shadow-xs'
                  : 'theme-text-muted hover:theme-text-main hover:opacity-80'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 ring-2 ring-inherit">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs mt-1 tracking-tight truncate max-w-full">
                {tab.shortLabel}
              </span>
              {isActive && (
                <div className="w-6 h-1 rounded-full mt-0.5 theme-btn-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBatch: () => void;
  onOpenNewRecipe: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  serverStatus?: 'connected' | 'offline' | 'syncing';
}

export const TopHeader = ({
  activeTab,
  onOpenNewBatch,
  onOpenNewRecipe,
  currentTheme,
  onSelectTheme,
  serverStatus = 'connected',
}: HeaderProps) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    recipe: {
      title: 'Üretim & Reçete',
      subtitle: 'Kazan formülasyonu ve hammadde hesaplama (Lt)',
    },
    daily: {
      title: 'Günlük Üretim',
      subtitle: 'Görsel dağılım ve 7 günlük üretim grafiği',
    },
    stock: {
      title: 'Stok & Lot Takibi',
      subtitle: 'Depodaki mevcut adetler ve SKT durumu',
    },
    shipment: {
      title: 'Sevkiyat & İrsaliye',
      subtitle: 'Çoklu ürün ve lot seçimi ile hızlı düşüş',
    },
  };

  const themeList: { id: AppTheme; label: string; color: string }[] = [
    { id: 'slate', label: 'Koyu Gece', color: 'bg-emerald-500' },
    { id: 'ocean', label: 'Safir Okyanus', color: 'bg-cyan-500' },
    { id: 'amber', label: 'Endüstriyel Amber', color: 'bg-amber-500' },
    { id: 'forest', label: 'Zümrüt Doğa', color: 'bg-teal-500' },
    { id: 'light', label: 'Temiz Aydınlık', color: 'bg-emerald-600' },
  ];

  return (
    <header
      id="top-header"
      className="sticky top-0 z-30 theme-header backdrop-blur-md border-b px-3 sm:px-4 py-2.5 transition-colors duration-200"
    >
      <div className="w-full max-w-md md:max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl theme-btn-primary flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold theme-text-main leading-tight truncate">
                {titles[activeTab].title}
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] theme-text-muted leading-tight truncate">
              {titles[activeTab].subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* Server Sync Status Badge */}
          <div
            id="badge-server-sync"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg theme-subcard border text-[10px] font-semibold transition"
            title={
              serverStatus === 'connected'
                ? 'Ubuntu Sunucuya Bağlı (62.171.177.210)'
                : serverStatus === 'syncing'
                ? 'Sunucuyla Senkronize Ediliyor...'
                : 'Çevrimdışı / Yerel Depolama Modunda'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                serverStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : serverStatus === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline theme-text-muted">
              {serverStatus === 'connected'
                ? '62.171.177.210'
                : serverStatus === 'syncing'
                ? 'Eşitleniyor...'
                : 'Yerel'}
            </span>
          </div>

          {/* Theme Switcher Button */}
          <button
            id="btn-toggle-theme"
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-1.5 rounded-lg theme-subcard theme-text-muted hover:theme-text-main border transition"
            title="Renk Teması Seç"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Theme Dropdown Menu */}
          {isThemeMenuOpen && (
            <div
              id="theme-dropdown-menu"
              className="absolute right-0 top-10 w-48 theme-card border rounded-2xl p-1.5 shadow-2xl z-50 animate-fade-in"
            >
              <div className="px-2 py-1 text-[10px] uppercase font-bold theme-text-muted border-b border-inherit mb-1">
                Renk Teması
              </div>
              {themeList.map((t) => {
                const isCur = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    id={`theme-opt-${t.id}`}
                    type="button"
                    onClick={() => {
                      onSelectTheme(t.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition ${
                      isCur
                        ? 'theme-accent-badge font-bold'
                        : 'theme-text-muted hover:theme-text-main hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                      <span>{t.label}</span>
                    </div>
                    {isCur && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action button in header */}
          {activeTab === 'recipe' && (
            <button
              id="header-btn-new-recipe"
              onClick={onOpenNewRecipe}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg theme-btn-primary shadow transition"
            >
              + Reçete
            </button>
          )}

          {(activeTab === 'stock' || activeTab === 'daily') && (
            <button
              id="header-btn-new-batch"
              onClick={onOpenNewBatch}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg theme-btn-primary shadow transition"
            >
              + Yeni Üretim
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
