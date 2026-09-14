import { useState, useMemo } from 'react';
import { ProductionBatch, Recipe } from '../types';
import { formatDate, getSKTStatus } from '../utils/dateUtils';
import { getProductColor } from '../utils/productColors';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  BarChart3,
  Layers,
} from 'lucide-react';

interface DailyProductionTabProps {
  batches: ProductionBatch[];
  recipes: Recipe[];
  onOpenNewBatch: (presetDate?: string) => void;
  onSelectLotForShipment: (batch: ProductionBatch) => void;
}

export const DailyProductionTab = ({
  batches,
  onOpenNewBatch,
  onSelectLotForShipment,
}: DailyProductionTabProps) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === todayStr;

  // Batches for the selected day
  const dayBatches = useMemo(() => {
    return batches.filter((b) => b.productionDate === selectedDate);
  }, [batches, selectedDate]);

  // Total quantity in ADET for the selected day
  const dayTotalQuantity = useMemo(() => {
    return dayBatches.reduce((sum, b) => sum + b.initialQuantity, 0);
  }, [dayBatches]);

  // Production breakdown by product for the selected day
  const productBreakdown = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; count: number }> = {};
    dayBatches.forEach((b) => {
      if (!map[b.productName]) {
        map[b.productName] = { name: b.productName, quantity: 0, count: 0 };
      }
      map[b.productName].quantity += b.initialQuantity;
      map[b.productName].count += 1;
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [dayBatches]);

  // Last 7 days production data for the simple trend chart
  const last7DaysData = useMemo(() => {
    const result = [];
    const baseDate = new Date(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayTotal = batches
        .filter((b) => b.productionDate === dStr)
        .reduce((sum, b) => sum + b.initialQuantity, 0);

      // Short day name and date
      const dayLabel = d.toLocaleDateString('tr-TR', {
        weekday: 'short',
        day: 'numeric',
      });

      result.push({
        dateStr: dStr,
        label: dayLabel,
        quantity: dayTotal,
        isSelected: dStr === selectedDate,
      });
    }
    return result;
  }, [batches, selectedDate]);

  const max7DayQuantity = useMemo(() => {
    const max = Math.max(...last7DaysData.map((d) => d.quantity));
    return max > 0 ? max : 100;
  }, [last7DaysData]);

  return (
    <div className="space-y-3.5 pb-24">
      {/* Date Header Selector */}
      <div
        id="daily-date-card"
        className="theme-card border rounded-2xl p-3 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            id="btn-prev-day"
            onClick={() => handleShiftDate(-1)}
            aria-label="Önceki Gün"
            className="p-2 rounded-xl theme-subcard border theme-text-muted hover:theme-text-main transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              id="input-daily-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="theme-input border theme-text-main text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
            {isToday && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full theme-accent-badge">
                Bugün
              </span>
            )}
          </div>

          <button
            id="btn-next-day"
            onClick={() => handleShiftDate(1)}
            aria-label="Sonraki Gün"
            className="p-2 rounded-xl theme-subcard border theme-text-muted hover:theme-text-main transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!isToday && (
          <div className="mt-2 text-center">
            <button
              id="btn-jump-today"
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Bugüne Dön
            </button>
          </div>
        )}
      </div>

      {/* High-level Graphical KPI Cards (Clean & Minimal, 2 col folded, 4 col unfolded) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <span className="text-[10px] sm:text-[11px] theme-text-muted block font-medium">
            Günlük Toplam
          </span>
          <div className="text-xl sm:text-2xl font-black theme-text-main mt-0.5">
            {dayTotalQuantity.toLocaleString('tr-TR')}{' '}
            <span className="text-xs font-semibold theme-text-muted">Adet</span>
          </div>
          <span className="text-[10px] theme-text-subtle">
            {formatDate(selectedDate)}
          </span>
        </div>

        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] theme-text-muted block font-medium">
              Üretim Partisi
            </span>
            <button
              id="btn-daily-quick-add"
              onClick={() => onOpenNewBatch(selectedDate)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg theme-btn-primary transition"
            >
              + Yeni
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
            {dayBatches.length}{' '}
            <span className="text-xs font-semibold theme-text-muted">Parti</span>
          </div>
          <span className="text-[10px] theme-text-subtle">
            {productBreakdown.length} Farklı Ürün
          </span>
        </div>

        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <span className="text-[10px] sm:text-[11px] theme-text-muted block font-medium">
            Ürün Çeşidi
          </span>
          <div className="text-xl sm:text-2xl font-black theme-text-main mt-0.5">
            {productBreakdown.length}{' '}
            <span className="text-xs font-semibold theme-text-muted">Çeşit</span>
          </div>
          <span className="text-[10px] theme-text-subtle">Bugün Üretilen</span>
        </div>

        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <span className="text-[10px] sm:text-[11px] theme-text-muted block font-medium">
            Ort. Parti Hacmi
          </span>
          <div className="text-xl sm:text-2xl font-black theme-text-main mt-0.5">
            {dayBatches.length > 0
              ? Math.round(dayTotalQuantity / dayBatches.length)
              : 0}{' '}
            <span className="text-xs font-semibold theme-text-muted">Adet</span>
          </div>
          <span className="text-[10px] theme-text-subtle">Parti Başına</span>
        </div>
      </div>

      {/* CHARTS CONTAINER: 1 col on folded, 2 cols side-by-side on Fold 6 unfolded */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* GRAFİK 1: ÜRÜN BAZINDA DAĞILIM (BASİT & GÖRSEL ÇUBUKLAR) */}
        <div className="theme-card border rounded-2xl p-3.5 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              Ürün Dağılım Grafiği
            </span>
            <span className="text-[11px] theme-text-subtle">
              Toplam: {dayTotalQuantity} Adet
            </span>
          </div>

          {productBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs theme-text-muted border border-dashed rounded-xl">
              Bu tarihte üretim kaydı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {productBreakdown.map((item) => {
                const pColor = getProductColor(item.name);
                const percentage =
                  dayTotalQuantity > 0
                    ? Math.round((item.quantity / dayTotalQuantity) * 100)
                    : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${pColor.dotColor}`}
                        />
                        <span className="font-semibold theme-text-main truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold theme-text-main">
                          {item.quantity} Adet
                        </span>
                        <span className="text-[10px] theme-text-muted ml-1">
                          (%{percentage})
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Bar */}
                    <div className="w-full theme-subcard h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pColor.barColor}`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GRAFİK 2: SON 7 GÜNÜN ÜRETİM ÇUBUK GRAFİĞİ */}
        <div className="theme-card border rounded-2xl p-3.5 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider theme-text-muted">
              Son 7 Günlük Üretim Trendi (Adet)
            </span>
            <span className="text-[10px] theme-text-subtle">
              Güne dokunarak geçiş yapın
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 pb-1">
            {last7DaysData.map((d) => {
              const heightPercent =
                max7DayQuantity > 0
                  ? Math.round((d.quantity / max7DayQuantity) * 100)
                  : 0;

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className="flex flex-col items-center h-full justify-end group focus:outline-none"
                >
                  {/* Number on top of bar */}
                  <span
                    className={`text-[9px] font-bold mb-1 transition ${
                      d.isSelected
                        ? 'theme-text-main font-black scale-110'
                        : 'theme-text-subtle group-hover:theme-text-main'
                    }`}
                  >
                    {d.quantity > 0 ? d.quantity : '-'}
                  </span>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[28px] theme-subcard h-16 rounded-t-lg overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        d.isSelected
                          ? 'theme-btn-primary shadow-sm'
                          : d.quantity > 0
                          ? 'bg-slate-600 group-hover:bg-slate-500'
                          : 'bg-transparent'
                      }`}
                      style={{
                        height: `${Math.max(
                          heightPercent,
                          d.quantity > 0 ? 12 : 0
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <span
                    className={`text-[9px] mt-1.5 capitalize transition ${
                      d.isSelected
                        ? 'theme-text-main font-bold border-b-2 border-emerald-400'
                        : 'theme-text-subtle'
                    }`}
                  >
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* GÜNÜN PARTİLERİ (Fold 6: 1 col on folded, 2 cols on unfolded) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider theme-text-muted">
            Günün Partileri ({dayBatches.length})
          </span>

          <button
            id="btn-add-batch-daily-bottom"
            onClick={() => onOpenNewBatch(selectedDate)}
            className="text-xs font-semibold theme-text-main theme-subcard px-2.5 py-1 rounded-lg border hover:theme-card transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Parti</span>
          </button>
        </div>

        {dayBatches.length === 0 ? (
          <div className="theme-card border border-dashed rounded-2xl p-6 text-center text-xs theme-text-muted">
            Seçilen günde kayıtlı parti yok.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {dayBatches.map((batch) => {
              const pColor = getProductColor(batch.productName);
              const sktStatus = getSKTStatus(batch.expiryDate);

              return (
                <div
                  key={batch.id}
                  id={`daily-batch-card-${batch.id}`}
                  className={`theme-card border rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 ${pColor.borderAccent}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${pColor.dotColor}`}
                      />
                      <h4 className="text-xs font-bold theme-text-main truncate">
                        {batch.productName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] font-bold theme-text-muted bg-black/20 px-1.5 py-0.2 rounded border border-inherit">
                        {batch.lotNumber}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${sktStatus.badgeClass}`}
                      >
                        SKT: {formatDate(batch.expiryDate)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black theme-text-main">
                        {batch.initialQuantity} Adet
                      </div>
                      <span className="text-[10px] theme-text-subtle block">
                        Kalan: {batch.currentQuantity} Adet
                      </span>
                    </div>

                    {batch.currentQuantity > 0 && (
                      <button
                        id={`btn-daily-ship-${batch.id}`}
                        onClick={() => onSelectLotForShipment(batch)}
                        className="p-1.5 rounded-lg theme-subcard border theme-text-main hover:theme-btn-primary transition"
                        title="Sevk Et"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
