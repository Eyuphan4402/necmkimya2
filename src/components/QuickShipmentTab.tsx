import { useState, useEffect, useMemo, FormEvent } from 'react';
import { ProductionBatch, ShipmentOrder } from '../types';
import { formatDate, getSKTStatus } from '../utils/dateUtils';
import { getProductColor } from '../utils/productColors';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Search,
  RotateCcw,
  Calendar,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';

interface DraftShipmentItem {
  id: string; // unique draft item id
  batchId: string;
  productName: string;
  lotNumber: string;
  unit: string;
  quantity: number;
  availableStock: number;
  expiryDate: string;
}

interface QuickShipmentTabProps {
  batches: ProductionBatch[];
  shipments: ShipmentOrder[];
  onExecuteShipmentOrder: (
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
  ) => boolean;
  onUndoShipmentOrder: (orderId: string) => void;
  preselectedBatchId?: string | null;
  onClearPreselection?: () => void;
}

export const QuickShipmentTab = ({
  batches,
  shipments,
  onExecuteShipmentOrder,
  onUndoShipmentOrder,
  preselectedBatchId,
  onClearPreselection,
}: QuickShipmentTabProps) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form states
  const [customer, setCustomer] = useState<string>('');
  const [shipmentDate, setShipmentDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>('');
  const [cart, setCart] = useState<DraftShipmentItem[]>([]);

  // Item Picker Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedProductForModal, setSelectedProductForModal] = useState<string>('');
  // For multi-lot allocation in modal: lotId -> quantity
  const [lotAllocations, setLotAllocations] = useState<Record<string, number>>({});
  const [targetTotalDemand, setTargetTotalDemand] = useState<number | ''>('');

  // Notification and error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Available batches that have current stock > 0
  const activeBatches = useMemo(() => {
    return batches.filter((b) => b.currentQuantity > 0);
  }, [batches]);

  // Unique products with available stock
  const uniqueProductsWithStock = useMemo(() => {
    const map = new Map<string, { count: number; totalStock: number; unit: string }>();
    activeBatches.forEach((b) => {
      const existing = map.get(b.productName) || { count: 0, totalStock: 0, unit: 'Adet' };
      existing.count += 1;
      existing.totalStock += b.currentQuantity;
      map.set(b.productName, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      lotCount: data.count,
      totalStock: data.totalStock,
      unit: 'Adet',
    }));
  }, [activeBatches]);

  // Handle preselected batch from Stock or Daily tab
  useEffect(() => {
    if (preselectedBatchId) {
      const b = batches.find((item) => item.id === preselectedBatchId);
      if (b && b.currentQuantity > 0) {
        setSelectedProductForModal(b.productName);
        setLotAllocations({ [b.id]: Math.min(b.currentQuantity, 20) });
        setIsAddModalOpen(true);
      }
      if (onClearPreselection) onClearPreselection();
    }
  }, [preselectedBatchId, batches, onClearPreselection]);

  // Filter products for the picker modal
  const filteredProducts = useMemo(() => {
    return uniqueProductsWithStock.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [uniqueProductsWithStock, productSearch]);

  // Lots for the product currently selected in the modal
  const lotsForSelectedProduct = useMemo(() => {
    if (!selectedProductForModal) return [];
    return activeBatches
      .filter((b) => b.productName === selectedProductForModal)
      .sort(
        (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
  }, [activeBatches, selectedProductForModal]);

  // Smart FIFO Auto-Distribute demand across lots
  const handleAutoDistributeDemand = () => {
    const demand = Number(targetTotalDemand);
    if (!demand || demand <= 0) return;

    let remaining = demand;
    const newAllocations: Record<string, number> = {};

    for (const lot of lotsForSelectedProduct) {
      if (remaining <= 0) break;
      const alreadyInCart = cart
        .filter((c) => c.batchId === lot.id)
        .reduce((sum, c) => sum + c.quantity, 0);
      const effectiveAvailable = Math.max(0, lot.currentQuantity - alreadyInCart);

      if (effectiveAvailable > 0) {
        const take = Math.min(remaining, effectiveAvailable);
        newAllocations[lot.id] = take;
        remaining -= take;
      }
    }

    setLotAllocations(newAllocations);
    if (remaining > 0) {
      setErrorMsg(
        `Uyarı: Mevcut lotlarda toplam stok yetersiz. ${demand - remaining} Adet ayrıldı, ${remaining} Adet eksik kaldı.`
      );
    } else {
      setErrorMsg(null);
    }
  };

  // Add allocated lots to the shipment cart
  const handleAddAllocatedLotsToCart = () => {
    setErrorMsg(null);
    const itemsToAdd: DraftShipmentItem[] = [];

    for (const [batchId, rawQty] of Object.entries(lotAllocations)) {
      const qty = Number(rawQty);
      if (qty && qty > 0) {
        const batch = batches.find((b) => b.id === batchId);
        if (!batch) continue;

        const alreadyInCart = cart
          .filter((c) => c.batchId === batchId)
          .reduce((sum, c) => sum + c.quantity, 0);

        if (qty + alreadyInCart > batch.currentQuantity) {
          setErrorMsg(
            `${batch.lotNumber} için girilen miktar (${qty + alreadyInCart}) mevcut stoğu (${batch.currentQuantity}) aşıyor!`
          );
          return;
        }

        itemsToAdd.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          batchId: batch.id,
          productName: batch.productName,
          lotNumber: batch.lotNumber,
          unit: 'Adet',
          quantity: qty,
          availableStock: batch.currentQuantity,
          expiryDate: batch.expiryDate,
        });
      }
    }

    if (itemsToAdd.length === 0) {
      setErrorMsg('Lütfen en az bir lot için sevk edilecek miktar giriniz.');
      return;
    }

    setCart((prev) => [...prev, ...itemsToAdd]);
    setIsAddModalOpen(false);
    setSelectedProductForModal('');
    setLotAllocations({});
    setTargetTotalDemand('');
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Final Dispatch Action
  const handleFinalizeShipment = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Lütfen önce sevk edilecek en az bir ürün ve lot ekleyin.');
      return;
    }

    const customerName = customer.trim() || 'Genel Sevkiyat / Toptan';

    const items = cart.map((item) => ({
      batchId: item.batchId,
      lotNumber: item.lotNumber,
      productName: item.productName,
      quantity: item.quantity,
      unit: 'Adet',
    }));

    const success = onExecuteShipmentOrder(
      customerName,
      notes.trim(),
      shipmentDate,
      items
    );

    if (success) {
      const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
      setSuccessMsg(
        `Sevkiyat tamamlandı! ${cart.length} kalem (toplam ${totalQty} Adet) başarıyla sevk edildi ve stoktan düşüldü.`
      );
      setCart([]);
      setNotes('');
      setCustomer('');
    } else {
      setErrorMsg('Sevkiyat sırasında bir hata oluştu. Lütfen stokları kontrol edin.');
    }
  };

  // Total quantity in draft cart
  const totalCartQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return (
    <div className="space-y-4 pb-24">
      {/* Notifications */}
      {errorMsg && (
        <div
          id="shipment-error-banner"
          className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div
          id="shipment-success-banner"
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="flex-1">{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Shipment Form - Fold 6: 1 col on folded, 2 col side-by-side on unfolded */}
      <form
        onSubmit={handleFinalizeShipment}
        className="theme-card border rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Customer & Basic Details + Add Button (md:col-span-6) */}
          <div className="md:col-span-6 space-y-3">
            <div className="border-b border-inherit pb-2">
              <h3 className="text-xs sm:text-sm font-bold theme-text-main flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                1. Sevkiyat & Müşteri Bilgileri
              </h3>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium theme-text-muted block mb-1">
                  Alıcı / Müşteri / Dağıtım Noktası
                </label>
                <input
                  id="input-shipment-customer"
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Örn: Ege Market, Toptan Bayi, vb."
                  className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium theme-text-muted block mb-1">
                    Sevkiyat Tarihi
                  </label>
                  <input
                    id="input-shipment-date"
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium theme-text-muted block mb-1">
                    İrsaliye / Not (Opsiyonel)
                  </label>
                  <input
                    id="input-shipment-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Örn: IRS-2026-89"
                    className="w-full theme-input border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Add Product & Lot Button */}
              <div className="pt-2">
                <button
                  id="btn-open-add-item-modal"
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setErrorMsg(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl theme-btn-primary text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ürün & Lot Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Shipment Cart / Selected Items & Submit Button (md:col-span-6) */}
          <div className="md:col-span-6 space-y-3 border-t md:border-t-0 md:border-l border-inherit pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-inherit pb-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold theme-text-main flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-400" />
                    2. Sevk Edilecek Kalemler ({cart.length})
                  </h3>
                </div>
                <span className="text-[10px] theme-text-muted">
                  Toplam: {totalCartQuantity} Adet
                </span>
              </div>

              {/* Cart Table / Cards */}
              {cart.length === 0 ? (
                <div
                  id="empty-cart-state"
                  onClick={() => setIsAddModalOpen(true)}
                  className="cursor-pointer theme-subcard border border-dashed rounded-2xl p-6 text-center hover:opacity-90 transition group my-auto"
                >
                  <Package className="w-7 h-7 theme-text-muted mx-auto mb-1.5 group-hover:text-emerald-400 transition" />
                  <p className="text-xs font-semibold theme-text-main">
                    Henüz ürün veya lot eklenmedi
                  </p>
                  <p className="text-[10px] theme-text-muted mt-0.5">
                    Sevk edilecek ürünleri eklemek için dokunun.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item, idx) => {
                    const pColor = getProductColor(item.productName);
                    return (
                      <div
                        key={item.id}
                        id={`cart-item-${idx}`}
                        className={`theme-subcard border rounded-xl p-2.5 flex items-center justify-between gap-2 ${pColor.borderAccent}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${pColor.dotColor}`}
                            />
                            <span className="text-xs font-bold theme-text-main truncate">
                              {item.productName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="font-mono text-[9px] font-semibold theme-accent-badge px-1.5 py-0.2 rounded border">
                              {item.lotNumber}
                            </span>
                            <span className="text-[9px] theme-text-muted">
                              SKT: {formatDate(item.expiryDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black theme-text-main">
                              {item.quantity} Adet
                            </div>
                          </div>

                          <button
                            type="button"
                            id={`btn-remove-cart-${idx}`}
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Kalemi Çıkar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Summary Bar & Submit */}
            <div className="space-y-2 pt-2 border-t border-inherit">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-medium theme-text-muted">
                  Toplam Sevk:
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  {totalCartQuantity.toLocaleString('tr-TR')} Adet
                </span>
              </div>

              <button
                id="btn-submit-shipment"
                type="submit"
                disabled={cart.length === 0}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow ${
                  cart.length > 0
                    ? 'theme-btn-primary cursor-pointer'
                    : 'theme-subcard theme-text-subtle cursor-not-allowed border'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Sevkiyatı Onayla & Stoktan Düş</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* POPUP MODAL: ADD PRODUCT & MULTI-LOT ALLOCATION */}
      {isAddModalOpen && (
        <div
          id="modal-add-product-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            id="modal-add-product-content"
            className="theme-card border w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl theme-accent-badge">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold theme-text-main">
                    Sevk Edilecek Ürün & Lot Seçimi
                  </h3>
                  <p className="text-[11px] theme-text-muted">
                    Tek ürün için birden fazla lottan miktar belirleyebilirsiniz
                  </p>
                </div>
              </div>

              <button
                id="btn-close-picker-modal"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedProductForModal('');
                  setLotAllocations({});
                }}
                className="theme-text-muted hover:theme-text-main p-1.5 rounded-lg theme-subcard transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Product */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider theme-text-muted block">
                1. Ürünü Seçin:
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-picker-search-product"
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Stoktaki ürünlerde ara..."
                  className="w-full theme-input border rounded-xl pl-8 pr-3 py-1.5 text-xs theme-text-main focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Product Pills / List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="text-[11px] theme-text-muted col-span-2 py-3 text-center">
                    Stokta ürün bulunamadı.
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = p.name === selectedProductForModal;
                    const pColor = getProductColor(p.name);
                    return (
                      <button
                        key={p.name}
                        type="button"
                        id={`btn-select-product-${p.name}`}
                        onClick={() => {
                          setSelectedProductForModal(p.name);
                          setLotAllocations({});
                          setTargetTotalDemand('');
                        }}
                        className={`text-left p-2 rounded-xl text-xs border transition flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'theme-btn-primary font-bold shadow-xs'
                            : 'theme-subcard theme-text-muted hover:theme-text-main'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${pColor.dotColor}`}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] shrink-0 font-bold">
                          {p.totalStock} Adet
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Step 2: Multi-Lot Allocation for Selected Product */}
            {selectedProductForModal && (
              <div className="space-y-3 pt-2 border-t border-inherit">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider theme-text-muted block">
                      2. Lot Dağılımı ({lotsForSelectedProduct.length} Farklı Lot)
                    </label>
                    <p className="text-[10px] theme-text-subtle">
                      İster tek lot, ister yetmediğinde birden fazla lot seçin
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                      getProductColor(selectedProductForModal).badgeBg
                    } ${getProductColor(selectedProductForModal).badgeText} ${
                      getProductColor(selectedProductForModal).badgeBorder
                    }`}
                  >
                    {selectedProductForModal}
                  </span>
                </div>

                {/* Smart Auto FIFO Helper */}
                <div className="theme-subcard border rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold theme-text-main block">
                      Akıllı Dağıt (FIFO - SKT Öncelikli):
                    </span>
                    <span className="text-[9px] theme-text-muted">
                      İhtiyaç miktarını yazın, sistem lotlara otomatik bölsün
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-auto-demand"
                      type="number"
                      min="1"
                      placeholder="Adet"
                      value={targetTotalDemand}
                      onChange={(e) =>
                        setTargetTotalDemand(
                          e.target.value ? Number(e.target.value) : ''
                        )
                      }
                      className="w-16 theme-input border rounded-lg px-2 py-1 text-xs font-bold theme-text-main text-right focus:outline-none"
                    />
                    <button
                      type="button"
                      id="btn-apply-auto-demand"
                      onClick={handleAutoDistributeDemand}
                      className="px-2.5 py-1 rounded-lg theme-btn-primary text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Dağıt</span>
                    </button>
                  </div>
                </div>

                {/* List of Lots for this product */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lotsForSelectedProduct.map((lot) => {
                    const skt = getSKTStatus(lot.expiryDate);
                    const currentAlloc = lotAllocations[lot.id] || 0;

                    // Subtract what is already in cart
                    const alreadyInCart = cart
                      .filter((c) => c.batchId === lot.id)
                      .reduce((sum, c) => sum + c.quantity, 0);
                    const remainingAvailable = Math.max(
                      0,
                      lot.currentQuantity - alreadyInCart
                    );

                    return (
                      <div
                        key={lot.id}
                        id={`lot-alloc-${lot.id}`}
                        className={`p-2.5 rounded-xl border transition ${
                          currentAlloc > 0
                            ? 'theme-card border-emerald-500/50 shadow-sm'
                            : 'theme-subcard'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold theme-accent-badge px-1.5 py-0.5 rounded border text-[11px]">
                              {lot.lotNumber}
                            </span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${skt.badgeClass}`}
                            >
                              SKT: {formatDate(lot.expiryDate)}
                            </span>
                          </div>

                          <span className="text-[11px] theme-text-muted">
                            Kalan:{' '}
                            <strong className="theme-text-main">
                              {remainingAvailable} Adet
                            </strong>
                          </span>
                        </div>

                        {/* Quantity input for this specific lot */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] theme-text-muted">
                            Bu lottan sevk:
                          </span>

                          <div className="flex items-center gap-1.5">
                            <input
                              id={`input-lot-qty-${lot.id}`}
                              type="number"
                              min="0"
                              max={remainingAvailable}
                              value={currentAlloc > 0 ? currentAlloc : ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setLotAllocations((prev) => ({
                                  ...prev,
                                  [lot.id]: Math.min(
                                    Math.max(0, val),
                                    remainingAvailable
                                  ),
                                }));
                              }}
                              placeholder="0"
                              className="w-20 theme-input border rounded-lg px-2 py-1 text-xs font-bold theme-text-main text-right focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-xs theme-text-muted">Adet</span>

                            {/* Max button */}
                            <button
                              type="button"
                              onClick={() => {
                                setLotAllocations((prev) => ({
                                  ...prev,
                                  [lot.id]: remainingAvailable,
                                }));
                              }}
                              className="text-[10px] px-2 py-1 rounded bg-black/20 hover:theme-subcard border theme-text-muted hover:theme-text-main transition font-semibold"
                            >
                              Tümü
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add to Cart button */}
                <button
                  type="button"
                  id="btn-confirm-add-lots-to-cart"
                  onClick={handleAddAllocatedLotsToCart}
                  className="w-full py-2.5 rounded-xl theme-btn-primary text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Seçilen Lotları Listeye Ekle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEVKİYAT GEÇMİŞİ & GERİ AL (HISTORY & AUDIT) */}
      <div className="theme-card border rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-inherit pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider theme-text-muted">
              Son Sevkiyat Hareketleri ({shipments.length})
            </h3>
          </div>
          <span className="text-[10px] theme-text-subtle">
            Hatalı sevkiyat geri alınabilir
          </span>
        </div>

        {shipments.length === 0 ? (
          <div className="py-6 text-center text-xs theme-text-muted border border-dashed rounded-xl">
            Henüz yapılmış bir sevkiyat kaydı yok.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {shipments.map((ship) => (
              <div
                key={ship.id}
                id={`shipment-history-${ship.id}`}
                className="theme-subcard border rounded-xl p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold theme-text-main">
                        {ship.customer}
                      </span>
                      <span className="text-[10px] font-mono theme-text-muted">
                        ({ship.orderNumber})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] theme-text-subtle mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ship.date)} {ship.time}
                      </span>
                      {ship.notes && (
                        <span>• Not: {ship.notes}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    id={`btn-undo-shipment-${ship.id}`}
                    onClick={() => {
                      if (
                        confirm(
                          `"${ship.orderNumber}" numaralı sevkiyatı geri almak ve ${ship.totalQuantity} adet ürünü stoğa iade etmek istiyor musunuz?`
                        )
                      ) {
                        onUndoShipmentOrder(ship.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                    title="Sevkiyatı Geri Al (Stoğa İade)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Items in this shipment */}
                <div className="border-t border-inherit pt-1.5 space-y-1">
                  {ship.items.map((item, idx) => {
                    const pColor = getProductColor(item.productName);
                    return (
                      <div
                        key={idx}
                        className="text-[11px] flex items-center justify-between theme-text-muted"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${pColor.dotColor}`}
                          />
                          <span className="theme-text-main truncate">
                            {item.productName}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">
                            [{item.lotNumber}]
                          </span>
                        </div>
                        <span className="font-bold theme-text-main shrink-0">
                          {item.quantity} Adet
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
