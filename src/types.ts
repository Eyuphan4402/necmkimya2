export interface RecipeIngredient {
  id: string;
  name: string;
  percentage: number; // e.g. 45 for 45%
  unit?: string; // kg, gr, lt, ml
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description?: string;
  targetUnit: string; // 'kg', 'Litre', 'Adet'
  shelfLifeMonths: number; // default expiry months
  ingredients: RecipeIngredient[];
  createdAt: string;
}

export interface ProductionBatch {
  id: string;
  recipeId: string;
  productName: string;
  lotNumber: string; // e.g., LOT-2026W37-01
  productionDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (SKT)
  year: number;
  weekNumber: number; // 1-52
  weeklyProductionNo: number; // e.g. 1st batch of the week
  monthNumber: number; // 1-12
  monthlyProductionNo: number; // e.g. 4th batch of the month
  initialQuantity: number;
  currentQuantity: number;
  unit: string;
  operator?: string;
  notes?: string;
  createdAt: number;
}

export interface ShipmentItem {
  id: string;
  batchId: string;
  lotNumber: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface ShipmentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  items: ShipmentItem[];
  totalQuantity: number;
  createdAt: number;
}

// Deprecated single record for backward compatibility
export type ShipmentRecord = ShipmentOrder;

export type ActiveTab = 'recipe' | 'daily' | 'stock' | 'shipment' | 'server-dashboard';

export type AppTheme = 'slate' | 'ocean' | 'amber' | 'forest' | 'light';

