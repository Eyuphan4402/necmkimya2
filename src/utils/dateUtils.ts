// Date utilities for ISO Week, Month, and SKT calculations

export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateString;
}

export function addMonthsToDate(dateString: string, months: number): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const today = new Date();
    today.setMonth(today.getMonth() + months);
    return today.toISOString().split('T')[0];
  }
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export function getDaysUntilSKT(expiryDateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateString);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getSKTStatus(expiryDateString: string): {
  label: string;
  status: 'expired' | 'critical' | 'warning' | 'good';
  badgeClass: string;
  days: number;
} {
  const days = getDaysUntilSKT(expiryDateString);
  if (days < 0) {
    return {
      label: `SKT Geçti (${Math.abs(days)} gün önce)`,
      status: 'expired',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      days,
    };
  }
  if (days <= 30) {
    return {
      label: `${days} gün kaldı (Kritik)`,
      status: 'critical',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      days,
    };
  }
  if (days <= 90) {
    return {
      label: `${days} gün kaldı`,
      status: 'warning',
      badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      days,
    };
  }
  return {
    label: `${days} gün kaldı`,
    status: 'good',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    days,
  };
}

export function generateLotNumber(
  productName: string,
  productionDate: string,
  weeklyIndex: number
): string {
  const date = new Date(productionDate);
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  const padWeek = String(week).padStart(2, '0');
  const padIndex = String(weeklyIndex).padStart(2, '0');
  
  // Product prefix: first 2-3 letters
  const cleanName = productName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = cleanName.slice(0, 3) || 'PRD';

  return `LOT-${prefix}-${year}W${padWeek}-${padIndex}`;
}
