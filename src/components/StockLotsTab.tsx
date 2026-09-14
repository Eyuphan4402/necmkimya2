import { useState, useMemo } from 'react';
import { ProductionBatch } from '../types';
import { formatDate, getSKTStatus } from '../utils/dateUtils';
import { getProductColor } from '../utils/productColors';
import {
  Package,
  AlertTriangle,
  Search,
  Truck,
  Plus,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';

interface StockLotsTabProps {
  batches: ProductionBatch[];
  onOpenNewBatch: () => void;
  onSelectLotForShipment: (batch: ProductionBatch) => void;
  onDeleteBatch: (batchId: string) => void;
}

export const StockLotsTab = ({
  batches,
  onOpenNewBatch,
  onSelectLotForShipment,
  onDeleteBatch,
}: StockLotsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'critical'>('all');
  const [copiedLotId, setCopiedLotId] = useState<string | null>(null);

  // Key metrics in ADET
  const totalStockQuantity = useMemo(() => {
    return batches.reduce((sum, b) => sum + b.currentQuantity, 0);
  }, [batches]);

  const activeBatches = useMemo(() => {
    return batches.filter((b) => b.currentQuantity > 0);
  }, [batches]);

  const criticalBatches = useMemo(() => {
    return batches.filter((b) => {
      if (b.currentQuantity <= 0) return false;
      const status = getSKTStatus(b.expiryDate);
      return status.status === 'critical' || status.status === 'expired';
    });
  }, [batches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        batch.productName.toLowerCase().includes(q) ||
        batch.lotNumber.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === 'active') return batch.currentQuantity > 0;
      if (filterType === 'critical') {
        const status = getSKTStatus(batch.expiryDate);
        return (
          batch.currentQuantity > 0 &&
          (status.status === 'critical' || status.status === 'expired')
        );
      }
      return true;
    });
  }, [batches, searchQuery, filterType]);

  const handleCopyLot = (lotNumber: string, id: string) => {
    navigator.clipboard?.writeText(lotNumber);
    setCopiedLotId(id);
    setTimeout(() => setCopiedLotId(null), 2000);
  };

  return (
    <div className="space-y-3.5 pb-24">
      {/* High-level KPI Cards (2 col on folded, 4 col on Fold 6 unfolded) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <div className="flex items-center justify-between theme-text-muted mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium">Toplam Depo Stoğu</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black theme-text-main">
            {totalStockQuantity.toLocaleString('tr-TR')}{' '}
            <span className="text-xs font-semibold theme-text-muted">Adet</span>
          </div>
          <p className="text-[10px] theme-text-subtle mt-0.5">
            {activeBatches.length} Aktif Lot Depoda
          </p>
        </div>

        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <div className="flex items-center justify-between theme-text-muted mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium">Aktif Lotlar</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black theme-text-main">
            {activeBatches.length}{' '}
            <span className="text-xs font-semibold theme-text-muted">Lot</span>
          </div>
          <p className="text-[10px] theme-text-subtle mt-0.5">
            Depoda sevke hazır
          </p>
        </div>

        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <div className="flex items-center justify-between theme-text-muted mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium">Kritik SKT</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                criticalBatches.length > 0 ? 'text-amber-400' : 'theme-text-subtle'
              }`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              criticalBatches.length > 0 ? 'text-amber-400' : 'theme-text-main'
            }`}
          >
            {criticalBatches.length}
          </div>
          <p className="text-[10px] theme-text-subtle mt-0.5">
            {criticalBatches.length > 0
              ? '≤30 Gün kalan partiler'
              : 'Tüm SKT durumları iyi'}
          </p>
        </div>

        <div className="theme-card border rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <div className="flex items-center justify-between theme-text-muted mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium">Tükenen Lotlar</span>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black theme-text-muted">
            {batches.filter((b) => b.currentQuantity <= 0).length}{' '}
            <span className="text-xs font-semibold theme-text-subtle">Lot</span>
          </div>
          <p className="text-[10px] theme-text-subtle mt-0.5">
            Stoku sıfırlananlar
          </p>
        </div>
      </div>

      {/* Action Bar: Search + Single Clear "Yeni Üretim" Button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-stock"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün adı veya Lot No ara..."
              className="w-full theme-input border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            id="btn-stock-add-batch"
            onClick={onOpenNewBatch}
            className="flex items-center gap-1 px-3 py-2 theme-btn-primary rounded-xl text-xs font-semibold shadow transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Üretim</span>
          </button>
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex gap-1.5 text-xs">
          <button
            id="filter-tab-all"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterType === 'all'
                ? 'theme-card border theme-text-main font-bold shadow-xs'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            Tümü ({batches.length})
          </button>
          <button
            id="filter-tab-active"
            onClick={() => setFilterType('active')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterType === 'active'
                ? 'theme-card border theme-text-main font-bold shadow-xs'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            Stokta ({activeBatches.length})
          </button>
          <button
            id="filter-tab-critical"
            onClick={() => setFilterType('critical')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterType === 'critical'
                ? 'theme-card border theme-text-main font-bold shadow-xs'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            Kritik SKT ({criticalBatches.length})
          </button>
        </div>
      </div>

      {/* Simplified, High-Contrast, Eye-Safe Stock List */}
      {filteredBatches.length === 0 ? (
        <div
          id="stock-empty-view"
          className="theme-card border border-dashed rounded-2xl p-8 text-center text-xs theme-text-muted"
        >
          Aramaya veya filtreye uygun lot bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {filteredBatches.map((batch) => {
            const pColor = getProductColor(batch.productName);
            const sktStatus = getSKTStatus(batch.expiryDate);
            const percentRemaining =
              batch.initialQuantity > 0
                ? Math.round((batch.currentQuantity / batch.initialQuantity) * 100)
                : 0;
            const isDepleted = batch.currentQuantity <= 0;

            return (
              <div
                key={batch.id}
                id={`lot-card-${batch.id}`}
                className={`theme-card border rounded-2xl p-3.5 space-y-2.5 transition shadow-sm ${
                  pColor.borderAccent
                } ${isDepleted ? 'opacity-55' : ''}`}
              >
                {/* Header: Distinct Product Indicator + Name + Lot Number */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${pColor.dotColor}`}
                      />
                      <h3 className="text-sm font-bold theme-text-main truncate">
                        {batch.productName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => handleCopyLot(batch.lotNumber, batch.id)}
                        className="font-mono text-xs font-bold theme-text-muted bg-black/20 px-2 py-0.5 rounded border border-inherit hover:theme-text-main transition flex items-center gap-1"
                        title="Lot Numarasını Kopyala"
                      >
                        <span>{batch.lotNumber}</span>
                        {copiedLotId === batch.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 theme-text-subtle" />
                        )}
                      </button>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${sktStatus.badgeClass}`}
                      >
                        SKT: {formatDate(batch.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Stock Quantity in Adet */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-black theme-text-main">
                      {batch.currentQuantity.toLocaleString('tr-TR')} Adet
                    </div>
                    <span className="text-[10px] theme-text-muted block">
                      Mevcut Stok
                    </span>
                  </div>
                </div>

                {/* Progress bar (Remaining / Initial) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] theme-text-muted">
                    <span>
                      Toplam Üretilen: {batch.initialQuantity} Adet
                    </span>
                    <span className="font-semibold">%{percentRemaining} Kaldı</span>
                  </div>
                  <div className="w-full theme-subcard h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentRemaining > 30
                          ? 'bg-emerald-500'
                          : percentRemaining > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>
                </div>

                {/* Footer: Production Date & Quick Ship Button */}
                <div className="flex items-center justify-between pt-1 border-t border-inherit">
                  <span className="text-[10px] theme-text-subtle">
                    Üretim: {formatDate(batch.productionDate)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-delete-batch-${batch.id}`}
                      onClick={() => {
                        if (
                          confirm(
                            `"${batch.lotNumber}" numaralı parti kaydını silmek istiyor musunuz?`
                          )
                        ) {
                          onDeleteBatch(batch.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                      title="Lotu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {!isDepleted ? (
                      <button
                        id={`btn-ship-from-stock-${batch.id}`}
                        onClick={() => onSelectLotForShipment(batch)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg theme-subcard border theme-text-main hover:theme-btn-primary transition flex items-center gap-1 shadow-xs"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Sevk Et</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold theme-text-subtle px-2 py-0.5 rounded theme-subcard">
                        Tükendi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
