import { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { getProductColor } from '../utils/productColors';
import {
  FlaskConical,
  Calculator,
  Plus,
  Search,
  Trash2,
  X,
  Clock,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

interface RecipeProductionTabProps {
  recipes: Recipe[];
  onOpenNewRecipeModal: () => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export const RecipeProductionTab = ({
  recipes,
  onOpenNewRecipeModal,
  onDeleteRecipe,
}: RecipeProductionTabProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    recipes[0]?.id || ''
  );
  const [activeModalRecipe, setActiveModalRecipe] = useState<Recipe | null>(null);
  const [calcBatchSize, setCalcBatchSize] = useState<number>(200);

  // Filter recipes only by name and ingredients
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const q = searchQuery.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(q) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    );
  }, [recipes, searchQuery]);

  // Selected recipe for side-by-side view on Fold 6 unfolded screen
  const sidePaneRecipe = useMemo(() => {
    return (
      recipes.find((r) => r.id === selectedRecipeId) ||
      filteredRecipes[0] ||
      recipes[0] ||
      null
    );
  }, [recipes, selectedRecipeId, filteredRecipes]);

  const handleOpenRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setActiveModalRecipe(recipe);
    setCalcBatchSize(200);
  };

  const handleCloseRecipe = () => {
    setActiveModalRecipe(null);
  };

  // Reusable detail card for both unfolded side-pane and folded modal
  const renderFormulaContent = (targetRecipe: Recipe, isSidePane = false) => {
    const totalPercentage = targetRecipe.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) || 0),
      0
    );
    const pColor = getProductColor(targetRecipe.name);

    return (
      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-inherit pb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pColor.badgeBg}`}
            >
              <FlaskConical className={`w-5 h-5 ${pColor.badgeText}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold theme-text-main leading-tight truncate">
                {targetRecipe.name}
              </h2>
              <p className="text-xs theme-text-muted mt-0.5">
                Kazan Formülasyonu & Hammadde Dağılımı (Lt)
              </p>
            </div>
          </div>

          {!isSidePane && (
            <button
              id="btn-close-recipe-modal"
              onClick={handleCloseRecipe}
              className="theme-text-muted hover:theme-text-main p-1.5 rounded-lg theme-subcard transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Batch Size Calculator (LT ONLY) */}
        <div className="theme-subcard border rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold theme-text-main flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Hesaplanacak Kazan Hacmi:</span>
            </label>
            <span className="text-xs font-bold theme-accent-badge px-2 py-0.5 rounded-md">
              Lt (Litre)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id={isSidePane ? 'input-side-calc-batch-size' : 'input-calc-batch-size'}
              type="number"
              min="1"
              step="1"
              value={calcBatchSize}
              onChange={(e) =>
                setCalcBatchSize(Math.max(1, parseInt(e.target.value) || 0))
              }
              className="flex-1 theme-input border rounded-xl px-3 py-2 text-base font-bold theme-text-main text-right focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs font-bold theme-text-main px-2">Lt</span>
          </div>

          {/* Quick Preset Buttons (LT) */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[50, 100, 200, 500, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                id={`btn-preset-${preset}${isSidePane ? '-side' : ''}`}
                onClick={() => setCalcBatchSize(preset)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                  calcBatchSize === preset
                    ? 'theme-btn-primary border-transparent font-bold'
                    : 'theme-card theme-text-muted hover:theme-text-main'
                }`}
              >
                {preset} Lt
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients Formulation Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold theme-text-main">
              Hammadde Dağılımı ({targetRecipe.ingredients.length} Kalem)
            </span>
            <span className="font-semibold text-[11px] theme-text-muted">
              Toplam: %{totalPercentage.toFixed(1)}
            </span>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {targetRecipe.ingredients.map((ing) => {
              const requiredUnits = (
                (ing.percentage / 100) *
                calcBatchSize
              ).toFixed(1);
              return (
                <div
                  key={ing.id}
                  id={`recipe-ing-${ing.id}${isSidePane ? '-side' : ''}`}
                  className="theme-subcard border rounded-xl p-2.5 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold theme-text-main truncate">
                      {ing.name}
                    </div>
                    <span className="text-[10px] theme-accent-badge px-1.5 py-0.2 rounded font-bold mt-1 inline-block">
                      %{ing.percentage} Oran
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black theme-text-main">
                      {requiredUnits}
                    </span>
                    <span className="text-[10px] theme-text-muted ml-1">
                      Lt Payı
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recipe Instructions / Description if exists */}
        {targetRecipe.description && (
          <div className="text-xs theme-subcard p-2.5 rounded-xl border">
            <span className="font-semibold theme-text-muted block text-[11px] mb-0.5">
              Hazırlama Notu:
            </span>
            <p className="theme-text-main leading-relaxed">
              {targetRecipe.description}
            </p>
          </div>
        )}

        {/* Info on Shelf Life */}
        <div className="text-[11px] theme-text-muted px-1 flex items-center justify-between">
          <span>Varsayılan Raf Ömrü:</span>
          <strong className="theme-text-main">
            {targetRecipe.shelfLifeMonths} Ay (SKT)
          </strong>
        </div>

        {/* Workflow Guidance & Clean Actions */}
        <div className="space-y-2 pt-2 border-t border-inherit">
          <div className="theme-subcard border rounded-xl p-2.5 flex items-start gap-2 text-xs">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="theme-text-muted leading-relaxed text-[11px]">
              Bu ekran kazan hazırlığı ve hammadde karışım formülü (Lt) içindir.
              Ürün dolumu tamamlandıktan sonra{' '}
              <strong className="theme-text-main">Stok & Lot</strong> sekmesindeki{' '}
              <strong className="theme-text-main">+ Yeni Üretim</strong> butonundan
              ambalajlı adet stoğuna ekleyebilirsiniz.
            </p>
          </div>

          {!isSidePane ? (
            <button
              id="btn-close-recipe-modal-done"
              type="button"
              onClick={handleCloseRecipe}
              className="w-full py-2.5 rounded-xl theme-btn-primary text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Pencereyi Kapat</span>
            </button>
          ) : null}

          {recipes.length > 1 && (
            <button
              id={
                isSidePane
                  ? 'btn-delete-active-recipe-side'
                  : 'btn-delete-active-recipe'
              }
              type="button"
              onClick={() => {
                if (
                  confirm(
                    `"${targetRecipe.name}" reçetesini kalıcı olarak silmek istiyor musunuz?`
                  )
                ) {
                  onDeleteRecipe(targetRecipe.id);
                  if (!isSidePane) handleCloseRecipe();
                }
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reçeteyi Sil</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5 pb-24">
      {/* Top Search & Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-recipe-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ürün adı veya hammadde ara..."
            className="w-full theme-input border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs theme-text-muted hover:theme-text-main"
            >
              ✕
            </button>
          )}
        </div>

        <button
          id="btn-add-recipe-top"
          onClick={onOpenNewRecipeModal}
          className="text-xs font-semibold px-3 py-2 rounded-xl theme-btn-primary transition flex items-center gap-1 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Reçete</span>
        </button>
      </div>

      {/* Fold 6 Adaptive Grid: 1 col on folded cover screen, 2 cols on unfolded screen */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Left Column: Product List */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider theme-text-muted">
              Kayıtlı Ürünler ({filteredRecipes.length})
            </span>
            <span className="text-[11px] theme-text-subtle hidden sm:inline">
              Formül için seçin
            </span>
          </div>

          {filteredRecipes.length === 0 ? (
            <div
              id="recipe-empty-search"
              className="theme-card border border-dashed rounded-2xl p-8 text-center text-xs theme-text-muted"
            >
              Aramaya uygun ürün bulunamadı.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecipes.map((recipe) => {
                const pColor = getProductColor(recipe.name);
                const isSelectedOnSide = sidePaneRecipe?.id === recipe.id;

                return (
                  <button
                    key={recipe.id}
                    id={`recipe-card-btn-${recipe.id}`}
                    type="button"
                    onClick={() => handleOpenRecipe(recipe)}
                    className={`w-full text-left theme-card border rounded-2xl p-3 sm:p-3.5 transition shadow-sm hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-3 ${
                      pColor.borderAccent
                    } ${
                      isSelectedOnSide
                        ? 'ring-2 ring-emerald-500 border-emerald-500'
                        : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${pColor.dotColor}`}
                        />
                        <h3 className="text-xs sm:text-sm font-bold theme-text-main truncate">
                          {recipe.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] theme-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          SKT: {recipe.shelfLifeMonths} Ay
                        </span>
                        <span>•</span>
                        <span>{recipe.ingredients.length} Hammadde</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl theme-subcard border text-xs font-semibold theme-text-main shrink-0">
                      <span>Reçete</span>
                      <ChevronRight className="w-3.5 h-3.5 theme-text-muted" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: In-place Formulation on Fold 6 Unfolded Screen (≥ 768px) */}
        <div className="hidden md:block md:col-span-7">
          <div className="sticky top-20 theme-card border rounded-2xl p-4 shadow-sm">
            {sidePaneRecipe ? (
              renderFormulaContent(sidePaneRecipe, true)
            ) : (
              <div className="p-8 text-center text-xs theme-text-muted">
                İncelemek için soldaki listeden bir ürün seçin.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal only shown on Fold 6 Folded / Mobile screens (< md) */}
      {activeModalRecipe && (
        <div
          id="modal-recipe-detail-backdrop"
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          <div
            id="modal-recipe-detail-content"
            className="theme-card border w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl"
          >
            {renderFormulaContent(activeModalRecipe, false)}
          </div>
        </div>
      )}
    </div>
  );
};
