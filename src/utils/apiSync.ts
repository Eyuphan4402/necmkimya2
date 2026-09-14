import { Recipe, ProductionBatch, ShipmentOrder } from '../types';

export interface ServerSyncData {
  exists: boolean;
  recipes: Recipe[] | null;
  batches: ProductionBatch[] | null;
  shipments: ShipmentOrder[] | null;
  lastUpdated: string | null;
}

export async function fetchServerData(): Promise<ServerSyncData | null> {
  try {
    const res = await fetch('/api/data', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    // Network offline or server unreachable
    return null;
  }
}

export async function saveServerData(
  recipes: Recipe[],
  batches: ProductionBatch[],
  shipments: ShipmentOrder[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipes, batches, shipments }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
