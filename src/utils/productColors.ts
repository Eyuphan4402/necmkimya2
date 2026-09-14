// Distinct color profiles for products so each product is visually unmistakable
export interface ProductColor {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  borderAccent: string;
  dotColor: string;
  barColor: string;
  hex: string;
}

const PALETTE: ProductColor[] = [
  {
    name: 'Mor',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
    borderAccent: 'border-l-4 border-l-purple-500',
    dotColor: 'bg-purple-400',
    barColor: 'bg-purple-500',
    hex: '#a855f7',
  },
  {
    name: 'Gök Mavisi',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-400',
    badgeBorder: 'border-sky-500/30',
    borderAccent: 'border-l-4 border-l-sky-500',
    dotColor: 'bg-sky-400',
    barColor: 'bg-sky-500',
    hex: '#0284c7',
  },
  {
    name: 'Kehribar',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    borderAccent: 'border-l-4 border-l-amber-500',
    dotColor: 'bg-amber-400',
    barColor: 'bg-amber-500',
    hex: '#f59e0b',
  },
  {
    name: 'Zümrüt',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    borderAccent: 'border-l-4 border-l-emerald-500',
    dotColor: 'bg-emerald-400',
    barColor: 'bg-emerald-500',
    hex: '#10b981',
  },
  {
    name: 'Gül Pembesi',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    borderAccent: 'border-l-4 border-l-rose-500',
    dotColor: 'bg-rose-400',
    barColor: 'bg-rose-500',
    hex: '#f43f5e',
  },
  {
    name: 'Turuncu',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/30',
    borderAccent: 'border-l-4 border-l-orange-500',
    dotColor: 'bg-orange-400',
    barColor: 'bg-orange-500',
    hex: '#f97316',
  },
  {
    name: 'Camgöbeği',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    borderAccent: 'border-l-4 border-l-cyan-500',
    dotColor: 'bg-cyan-400',
    barColor: 'bg-cyan-500',
    hex: '#06b6d4',
  },
  {
    name: 'Çivit Mavisi',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    borderAccent: 'border-l-4 border-l-indigo-500',
    dotColor: 'bg-indigo-400',
    barColor: 'bg-indigo-500',
    hex: '#6366f1',
  },
  {
    name: 'Limon Yeşili',
    badgeBg: 'bg-lime-500/15',
    badgeText: 'text-lime-400',
    badgeBorder: 'border-lime-500/30',
    borderAccent: 'border-l-4 border-l-lime-500',
    dotColor: 'bg-lime-400',
    barColor: 'bg-lime-500',
    hex: '#84cc16',
  },
  {
    name: 'Fuşya',
    badgeBg: 'bg-fuchsia-500/15',
    badgeText: 'text-fuchsia-400',
    badgeBorder: 'border-fuchsia-500/30',
    borderAccent: 'border-l-4 border-l-fuchsia-500',
    dotColor: 'bg-fuchsia-400',
    barColor: 'bg-fuchsia-500',
    hex: '#d946ef',
  },
  {
    name: 'Deniz Yeşili',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/30',
    borderAccent: 'border-l-4 border-l-teal-500',
    dotColor: 'bg-teal-400',
    barColor: 'bg-teal-500',
    hex: '#14b8a6',
  },
  {
    name: 'Sarı',
    badgeBg: 'bg-yellow-500/15',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/30',
    borderAccent: 'border-l-4 border-l-yellow-500',
    dotColor: 'bg-yellow-400',
    barColor: 'bg-yellow-500',
    hex: '#eab308',
  },
];

// Deterministic color assignment based on product name or id
export const getProductColor = (productName: string): ProductColor => {
  if (!productName) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < productName.length; i++) {
    hash = (hash << 5) - hash + productName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};
