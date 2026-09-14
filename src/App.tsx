import { useState, useEffect } from 'react';
import { ActiveTab, Recipe, ProductionBatch, ShipmentOrder, AppTheme } from './types';
import {
  INITIAL_RECIPES,
  INITIAL_BATCHES,
  INITIAL_SHIPMENTS,
} from './data/initialData';
import { TopHeader, BottomNavigation } from './components/Navigation';
import { RecipeProductionTab } from './components/RecipeProductionTab';
import { DailyProductionTab } from './components/DailyProductionTab';
import { StockLotsTab } from './components/StockLotsTab';
import { QuickShipmentTab } from './components/QuickShipmentTab';
import { NewBatchModal } from './components/NewBatchModal';
import { NewRecipeModal } from './components/NewRecipeModal';
import { InstallApkModal } from './components/InstallApkModal';
import { getSKTStatus } from './utils/dateUtils';
import { THEMES } from './utils/theme';
import { fetchServerData, saveServerData } from './utils/apiSync';

const STORAGE_KEYS = {
  RECIPES: 'uretim_app_recipes_v3',
  BATCHES: 'uretim_app_batches_v3',
  SHIPMENTS: 'uretim_app_shipments_v3',
  THEME: 'uretim_app_theme_v3',
};

export default function App() {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
      return saved && THEMES[saved] ? saved : 'slate';
    } catch {
      return 'slate';
    }
  });

  // State with LocalStorage persistence
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      return saved ? JSON.parse(saved) : INITIAL_RECIPES;
    } catch {
      return INITIAL_RECIPES;
    }
  });

  const [batches, setBatches] = useState<ProductionBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return saved ? JSON.parse(saved) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });

  const [shipments, setShipments] = useState<ShipmentOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
      return saved ? JSON.parse(saved) : INITIAL_SHIPMENTS;
    } catch {
      return INITIAL_SHIPMENTS;
    }
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipe');

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchModalPreset, setBatchModalPreset] = useState<{
    recipeId?: string;
    quantity?: number;
    presetDate?: string;
  }>({});

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Shipment preselection
  const [preselectedBatchId, setPreselectedBatchId] = useState<string | null>(
    null
  );

  // Ubuntu Server sync status
  const [serverStatus, setServerStatus] = useState<'connected' | 'offline' | 'syncing'>('connected');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // 1. Initial Load from Ubuntu server
  useEffect(() => {
    let isMounted = true;
    async function loadServerData() {
      const sData = await fetchServerData();
      if (!isMounted) return;
      if (sData && sData.exists) {
        if (sData.recipes && sData.recipes.length > 0) setRecipes(sData.recipes);
        if (sData.batches && sData.batches.length > 0) setBatches(sData.batches);
        if (sData.shipments && sData.shipments.length > 0) setShipments(sData.shipments);
        setServerStatus('connected');
      } else if (sData) {
        // Server exists but empty, seed initial data to server disk
        setServerStatus('syncing');
        await saveServerData(recipes, batches, shipments);
        setServerStatus('connected');
      } else {
        // Server not reachable yet, continue with localStorage
        setServerStatus('offline');
      }
      setInitialLoadDone(true);
    }
    loadServerData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Auto-sync to Ubuntu server when data changes
  useEffect(() => {
    if (!initialLoadDone) return;
    const timer = setTimeout(async () => {
      setServerStatus('syncing');
      const success = await saveServerData(recipes, batches, shipments);
      setServerStatus(success ? 'connected' : 'offline');
    }, 600);
    return () => clearTimeout(timer);
  }, [recipes, batches, shipments, initialLoadDone]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
    } catch (e) {
      console.error(e);
    }
  }, [currentTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch (e) {
      console.error(e);
    }
  }, [recipes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.error(e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    } catch (e) {
      console.error(e);
    }
  }, [shipments]);

  // Critical SKT count for notification badge
  const criticalSKTCount = batches.filter((b) => {
    if (b.currentQuantity <= 0) return false;
    const status = getSKTStatus(b.expiryDate);
    return status.status === 'critical' || status.status === 'expired';
  }).length;

  // Handlers
  const handleSaveNewBatch = (newBatch: ProductionBatch) => {
    setBatches((prev) => [newBatch, ...prev]);
    if (activeTab !== 'daily') {
      setActiveTab('stock');
    }
  };

  const handleSaveNewRecipe = (newRecipe: Recipe) => {
    setRecipes((prev) => [newRecipe, ...prev]);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const handleDeleteBatch = (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  };

  // Multi-product and multi-lot shipment order execution
  const handleExecuteShipmentOrder = (
    customer: string,
    notes: string,
    date: string,
    items: Array<{
      batchId: string;
      lotNumber: string;
      productName: string;
      quantity: number;
      unit: string;
    }>
  ): boolean => {
    // 1. Validate that each batch has enough stock
    for (const item of items) {
      const b = batches.find((x) => x.id === item.batchId);
      if (!b || b.currentQuantity < item.quantity) {
        return false;
      }
    }

    // 2. Decrement stock from each selected batch
    setBatches((prev) =>
      prev.map((b) => {
        const itemToDeduct = items.find((i) => i.batchId === b.id);
        if (itemToDeduct) {
          return {
            ...b,
            currentQuantity: Math.max(0, b.currentQuantity - itemToDeduct.quantity),
          };
        }
        return b;
      })
    );

    // 3. Create a consolidated shipment order
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const orderNumber = `SEV-${date.replace(/-/g, '')}-${String(
      shipments.length + 1
    ).padStart(2, '0')}`;
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

    const newOrder: ShipmentOrder = {
      id: `ship-${Date.now()}`,
      orderNumber,
      customer: customer || 'Standart Sevkiyat',
      date,
      time: timeStr,
      notes,
      items: items.map((i, idx) => ({
        id: `ship-item-${Date.now()}-${idx}`,
        ...i,
      })),
      totalQuantity: totalQty,
      createdAt: Date.now(),
    };

    setShipments((prev) => [newOrder, ...prev]);
    return true;
  };

  // Undo / refund a shipment order back to the respective batch lots
  const handleUndoShipmentOrder = (orderId: string) => {
    const targetOrder = shipments.find((s) => s.id === orderId);
    if (!targetOrder) return;

    // Return stock to each lot
    setBatches((prev) =>
      prev.map((b) => {
        const itemToRefund = targetOrder.items.find((i) => i.batchId === b.id);
        if (itemToRefund) {
          return {
            ...b,
            currentQuantity: b.currentQuantity + itemToRefund.quantity,
          };
        }
        return b;
      })
    );

    // Remove from shipment history
    setShipments((prev) => prev.filter((s) => s.id !== orderId));
  };

  // Quick ship from Stock or Daily tab
  const handleSelectLotForShipment = (batch: ProductionBatch) => {
    setPreselectedBatchId(batch.id);
    setActiveTab('shipment');
  };

  const handleResetData = () => {
    if (
      confirm(
        'Tüm veriler varsayılan ayarlara ve temiz örnek kayıtlara sıfırlansın mı?'
      )
    ) {
      setRecipes(INITIAL_RECIPES);
      setBatches(INITIAL_BATCHES);
      setShipments(INITIAL_SHIPMENTS);
      localStorage.removeItem(STORAGE_KEYS.RECIPES);
      localStorage.removeItem(STORAGE_KEYS.BATCHES);
      localStorage.removeItem(STORAGE_KEYS.SHIPMENTS);
    }
  };

  const activeThemeConfig = THEMES[currentTheme] || THEMES.slate;

  return (
    <div
      data-theme={currentTheme}
      className="min-h-screen theme-bg-page theme-text-main flex flex-col transition-colors duration-200"
    >
      {/* Main Fluid Responsive Container */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col relative min-h-screen">
        {/* Top Header with Theme Switcher */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewBatch={() => {
            setBatchModalPreset({});
            setIsBatchModalOpen(true);
          }}
          onOpenNewRecipe={() => setIsRecipeModalOpen(true)}
          currentTheme={currentTheme}
          onSelectTheme={setCurrentTheme}
          serverStatus={serverStatus}
          onOpenApkModal={() => setIsApkModalOpen(true)}
        />

        {/* Tab Content Body */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          {activeTab === 'recipe' && (
            <RecipeProductionTab
              recipes={recipes}
              onOpenNewRecipeModal={() => setIsRecipeModalOpen(true)}
              onDeleteRecipe={handleDeleteRecipe}
            />
          )}

          {activeTab === 'daily' && (
            <DailyProductionTab
              batches={batches}
              recipes={recipes}
              onOpenNewBatch={(presetDate) => {
                setBatchModalPreset({ presetDate });
                setIsBatchModalOpen(true);
              }}
              onSelectLotForShipment={handleSelectLotForShipment}
            />
          )}

          {activeTab === 'stock' && (
            <StockLotsTab
              batches={batches}
              onOpenNewBatch={() => {
                setBatchModalPreset({});
                setIsBatchModalOpen(true);
              }}
              onSelectLotForShipment={handleSelectLotForShipment}
              onDeleteBatch={handleDeleteBatch}
            />
          )}

          {activeTab === 'shipment' && (
            <QuickShipmentTab
              batches={batches}
              shipments={shipments}
              onExecuteShipmentOrder={handleExecuteShipmentOrder}
              onUndoShipmentOrder={handleUndoShipmentOrder}
              preselectedBatchId={preselectedBatchId}
              onClearPreselection={() => setPreselectedBatchId(null)}
            />
          )}
        </main>

        {/* Bottom Navigation (4 Tabs) */}
        <BottomNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stockCount={batches.reduce((sum, b) => sum + b.currentQuantity, 0)}
          criticalSKTCount={criticalSKTCount}
          currentTheme={currentTheme}
        />
      </div>

      {/* Unified Modals */}
      <NewBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        recipes={recipes}
        batches={batches}
        onSaveBatch={handleSaveNewBatch}
        initialRecipeId={batchModalPreset.recipeId}
        initialQuantity={batchModalPreset.quantity}
        presetDate={batchModalPreset.presetDate}
      />

      <NewRecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        onSaveRecipe={handleSaveNewRecipe}
      />

      <InstallApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
}
