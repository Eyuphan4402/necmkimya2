import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Recipe, ProductionBatch } from '../types';
import {
  getWeekNumber,
  addMonthsToDate,
  generateLotNumber,
} from '../utils/dateUtils';
import { getProductColor } from '../utils/productColors';
import {
  X,
  Sparkles,
  Check,
  Search,
} from 'lucide-react';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  batches: ProductionBatch[];
  onSaveBatch: (newBatch: ProductionBatch) => void;
  initialRecipeId?: string;
  initialQuantity?: number;
  presetDate?: string;
}

export const NewBatchModal = ({
  isOpen,
  onClose,
  recipes,
  batches,
  onSaveBatch,
  initialRecipeId,
  initialQuantity,
  presetDate,
}: NewBatchModalProps) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialRecipeId || recipes[0]?.id || ''
  );
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(initialQuantity || 200);
  const [productionDate, setProductionDate] = useState<string>(presetDate || todayStr);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isManualLot, setIsManualLot] = useState<boolean>(false);

  useEffect(() => {
    if (initialRecipeId) {
      setSelectedRecipeId(initialRecipeId);
    }
    if (initialQuantity) {
      setQuantity(initialQuantity);
    }
    if (presetDate) {
      setProductionDate(presetDate);
    }
  }, [initialRecipeId, initialQuantity, presetDate]);

  // Filter recipes for quick search
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) =>
      r.name.toLowerCase().includes(recipeSearch.toLowerCase())
    );
  }, [recipes, recipeSearch]);

  const selectedRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0];
  }, [recipes, selectedRecipeId]);

  // Calculate week and month numbers
  const prodDateObj = new Date(productionDate || todayStr);
  const year = prodDateObj.getFullYear();
  const weekNum = getWeekNumber(prodDateObj);
  const monthNum = prodDateObj.getMonth() + 1;

  const batchesThisWeek = batches.filter(
    (b) => b.year === year && b.weekNumber === weekNum
  );
  const nextWeeklyNo = batchesThisWeek.length + 1;

  const batchesThisMonth = batches.filter(
    (b) => b.year === year && b.monthNumber === monthNum
  );
  const nextMonthlyNo = batchesThisMonth.length + 1;

  // Auto calculate SKT & Lot number when recipe or date changes
  useEffect(() => {
    if (selectedRecipe) {
      const defaultShelfLife = selectedRecipe.shelfLifeMonths || 12;
      setExpiryDate(addMonthsToDate(productionDate, defaultShelfLife));

      if (!isManualLot) {
        const generated = generateLotNumber(
          selectedRecipe.name,
          productionDate,
          nextWeeklyNo
        );
        setLotNumber(generated);
      }
    }
  }, [selectedRecipeId, productionDate, nextWeeklyNo, isManualLot, selectedRecipe]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe) return;

    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      recipeId: selectedRecipe.id,
      productName: selectedRecipe.name,
      lotNumber: lotNumber.trim() || `LOT-${Date.now()}`,
      productionDate,
      expiryDate,
      year,
      weekNumber: weekNum,
      weeklyProductionNo: nextWeeklyNo,
      monthNumber: monthNum,
      monthlyProductionNo: nextMonthlyNo,
      initialQuantity: Math.max(1, Math.round(Number(quantity))),
      currentQuantity: Math.max(1, Math.round(Number(quantity))),
      unit: 'Adet',
      operator: operator.trim(),
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    onSaveBatch(newBatch);
    onClose();
  };

  return (
    <div
      id="modal-new-batch-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        id="modal-new-batch-content"
        className="theme-card border w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-inherit pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl theme-accent-badge">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold theme-text-main">
                Yeni Üretim & Dolum Kaydı
              </h2>
              <p className="text-xs theme-text-muted">
                Dolumu tamamlanan ürüne Lot No ve SKT verilerek depoya eklenir
              </p>
            </div>
          </div>
          <button
            id="btn-close-batch-modal"
            onClick={onClose}
            className="theme-text-muted hover:theme-text-main p-1 rounded-lg theme-subcard transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Recipe / Product Selection with search */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider theme-text-muted">
                Üretilecek Ürün / Reçete
              </label>
              <span className="text-[10px] theme-text-subtle">
                {recipes.length} Ürün Mevcut
              </span>
            </div>

            {recipes.length > 4 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Ürün adı ara..."
                  className="w-full theme-input border rounded-lg pl-8 pr-2.5 py-1 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {filteredRecipes.map((r) => {
                const isSelected = r.id === selectedRecipe?.id;
                const pColor = getProductColor(r.name);
                return (
                  <button
                    key={r.id}
                    type="button"
                    id={`batch-modal-recipe-${r.id}`}
                    onClick={() => {
                      setSelectedRecipeId(r.id);
                    }}
                    className={`p-2 rounded-xl text-left text-xs border transition flex items-center gap-2 ${
                      isSelected
                        ? 'theme-btn-primary font-bold shadow-xs'
                        : 'theme-subcard theme-text-muted hover:theme-text-main'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${pColor.dotColor}`}
                    />
                    <div className="font-bold truncate flex-1">{r.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity (ADET) & Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium theme-text-muted block mb-1">
                Dolum / Ambalaj Miktarı (Adet)
              </label>
              <input
                id="input-batch-quantity"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full theme-input border rounded-xl px-3 py-2 text-xs font-bold theme-text-main focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium theme-text-muted block mb-1">
                Sorumlu Operatör
              </label>
              <input
                id="input-batch-operator"
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Örn: Ahmet Usta"
                className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Production Date & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium theme-text-muted block mb-1">
                Üretim Tarihi
              </label>
              <input
                id="input-batch-date"
                type="date"
                required
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium theme-text-muted block mb-1">
                Son Kullanma Tarihi (SKT)
              </label>
              <input
                id="input-batch-expiry"
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* Lot Number Box */}
          <div className="theme-subcard border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold theme-text-main">
                Parti / Lot Numarası:
              </label>
              <button
                type="button"
                id="btn-toggle-manual-lot"
                onClick={() => setIsManualLot(!isManualLot)}
                className="text-[11px] text-emerald-400 hover:underline font-medium"
              >
                {isManualLot ? 'Otomatik Oluştur' : 'Manuel Düzenle'}
              </button>
            </div>

            <input
              id="input-batch-lot-number"
              type="text"
              required
              readOnly={!isManualLot}
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              className="w-full font-mono text-xs font-bold rounded-lg px-3 py-2 border theme-input focus:outline-none"
            />
          </div>

          {/* Production Notes */}
          <div>
            <label className="text-[11px] font-medium theme-text-muted block mb-1">
              Parti / Dolum Notu (Opsiyonel)
            </label>
            <input
              id="input-batch-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: 1. Dolum hattı, standart ambalaj"
              className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              id="btn-save-batch-submit"
              type="submit"
              className="w-full py-3 rounded-xl theme-btn-primary text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Dolumu Tamamla & Stoğa Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
