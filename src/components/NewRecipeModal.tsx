import { useState, FormEvent } from 'react';
import { Recipe, RecipeIngredient } from '../types';
import { X, Plus, Trash2, Check, FlaskConical, AlertCircle } from 'lucide-react';

interface NewRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
}

export const NewRecipeModal = ({
  isOpen,
  onClose,
  onSaveRecipe,
}: NewRecipeModalProps) => {
  const [name, setName] = useState('');
  const [shelfLifeMonths, setShelfLifeMonths] = useState(12);
  const [description, setDescription] = useState('');

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { id: '1', name: 'Ana Hammadde A', percentage: 70 },
    { id: '2', name: 'Katkı Maddesi B', percentage: 25 },
    { id: '3', name: 'Aroma / Doğal Özüt', percentage: 5 },
  ]);

  if (!isOpen) return null;

  const totalPercentage = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.percentage) || 0),
    0
  );

  const handleAddIngredient = () => {
    const nextId = String(Date.now() + Math.random());
    setIngredients([
      ...ingredients,
      { id: nextId, name: '', percentage: 0 },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleIngredientChange = (
    id: string,
    field: 'name' | 'percentage',
    val: string | number
  ) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.id === id) {
          return {
            ...ing,
            [field]: field === 'percentage' ? Number(val) || 0 : val,
          };
        }
        return ing;
      })
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validIngredients = ingredients.filter((i) => i.name.trim().length > 0);
    if (validIngredients.length === 0) return;

    const newRecipe: Recipe = {
      id: `rec-${Date.now()}`,
      name: name.trim(),
      category: 'Ürün',
      targetUnit: 'Lt',
      shelfLifeMonths: Number(shelfLifeMonths) || 12,
      description: description.trim(),
      ingredients: validIngredients,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveRecipe(newRecipe);
    onClose();
  };

  return (
    <div
      id="modal-new-recipe-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        id="modal-new-recipe-content"
        className="theme-card border w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-inherit pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl theme-accent-badge">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold theme-text-main">
                Yeni Ürün Reçetesi Tanımla
              </h2>
              <p className="text-xs theme-text-muted">
                Kazan üretimi için hammadde oranlarını (% Lt) girin
              </p>
            </div>
          </div>
          <button
            id="btn-close-recipe-modal"
            onClick={onClose}
            className="theme-text-muted hover:theme-text-main p-1 rounded-lg theme-subcard transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipe Name */}
          <div>
            <label
              htmlFor="input-recipe-name"
              className="block text-xs font-semibold theme-text-main mb-1"
            >
              Ürün Adı:
            </label>
            <input
              id="input-recipe-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Zeytinyağlı Doğal Sıvı Sabun"
              className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Unit (Lt) & Shelf life */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold theme-text-muted mb-1">
                Formül Birimi
              </label>
              <div className="theme-input border rounded-xl px-3 py-2 text-xs font-bold theme-text-main">
                Lt (Litre)
              </div>
            </div>

            <div>
              <label
                htmlFor="input-recipe-shelflife"
                className="block text-xs font-semibold theme-text-muted mb-1"
              >
                Raf Ömrü (SKT / Ay):
              </label>
              <input
                id="input-recipe-shelflife"
                type="number"
                min="1"
                required
                value={shelfLifeMonths}
                onChange={(e) => setShelfLifeMonths(Number(e.target.value))}
                className="w-full theme-input border rounded-xl px-3 py-2 text-xs font-bold theme-text-main focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Ingredients Formulation Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider theme-text-muted">
                Hammadde Formülü
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  Math.round(totalPercentage) === 100
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-amber-400 bg-amber-500/10'
                }`}
              >
                Toplam: %{totalPercentage.toFixed(1)}
              </span>
            </div>

            {Math.round(totalPercentage) !== 100 && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 theme-subcard p-2 rounded-lg border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Toplam formül oranı tam %100 olması tavsiye edilir.</span>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="flex items-center gap-2 theme-subcard p-2 rounded-xl border"
                >
                  <input
                    type="text"
                    required
                    placeholder={`${idx + 1}. Hammadde Adı`}
                    value={ing.name}
                    onChange={(e) =>
                      handleIngredientChange(ing.id, 'name', e.target.value)
                    }
                    className="flex-1 theme-input border rounded-lg px-2.5 py-1.5 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="100"
                      required
                      value={ing.percentage || ''}
                      onChange={(e) =>
                        handleIngredientChange(
                          ing.id,
                          'percentage',
                          e.target.value
                        )
                      }
                      placeholder="%"
                      className="w-16 theme-input border rounded-lg px-2 py-1.5 text-xs font-bold theme-text-main text-right focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs font-bold theme-text-muted">%</span>
                  </div>

                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddIngredient}
              className="w-full py-1.5 rounded-xl border border-dashed text-xs font-semibold theme-text-muted hover:theme-text-main hover:theme-subcard transition flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Hammadde Ekle</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="input-recipe-desc"
              className="block text-xs font-semibold theme-text-muted mb-1"
            >
              Reçete Açıklaması / Talimatlar (Opsiyonel):
            </label>
            <textarea
              id="input-recipe-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: 80 derecede homojenize edilir, soğuduktan sonra dolum yapılır."
              className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              id="btn-save-recipe-submit"
              type="submit"
              className="w-full py-3 rounded-xl theme-btn-primary text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Reçeteyi Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
