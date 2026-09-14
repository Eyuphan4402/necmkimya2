import { AppTheme } from '../types';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  badgeBg: string;
  badgeBorder: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  headerBg: string;
  isLight?: boolean;
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  slate: {
    id: 'slate',
    name: 'Koyu Gece',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/40',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-500',
    primaryText: 'text-white',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    bodyBg: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900/95',
    cardBorder: 'border-slate-800',
    inputBg: 'bg-slate-800',
    headerBg: 'bg-slate-900/90',
  },
  ocean: {
    id: 'ocean',
    name: 'Safir Okyanus',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/40',
    primaryBg: 'bg-cyan-600',
    primaryHover: 'hover:bg-cyan-500',
    primaryText: 'text-white',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    bodyBg: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900/95',
    cardBorder: 'border-sky-950/80',
    inputBg: 'bg-slate-800',
    headerBg: 'bg-slate-900/90',
  },
  amber: {
    id: 'amber',
    name: 'Endüstriyel Amber',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/40',
    primaryBg: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-500',
    primaryText: 'text-slate-950 font-bold',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
    bodyBg: 'bg-neutral-950 text-neutral-100',
    cardBg: 'bg-neutral-900/95',
    cardBorder: 'border-neutral-800',
    inputBg: 'bg-neutral-800',
    headerBg: 'bg-neutral-900/90',
  },
  forest: {
    id: 'forest',
    name: 'Zümrüt Doğa',
    badgeBg: 'bg-teal-500/20',
    badgeBorder: 'border-teal-500/40',
    primaryBg: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-500',
    primaryText: 'text-white',
    accentText: 'text-teal-400',
    accentBg: 'bg-teal-500/10',
    accentBorder: 'border-teal-500/30',
    bodyBg: 'bg-stone-950 text-stone-100',
    cardBg: 'bg-stone-900/95',
    cardBorder: 'border-stone-800',
    inputBg: 'bg-stone-800',
    headerBg: 'bg-stone-900/90',
  },
  light: {
    id: 'light',
    name: 'Temiz Aydınlık',
    badgeBg: 'bg-emerald-100',
    badgeBorder: 'border-emerald-300',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-white',
    accentText: 'text-emerald-700',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    bodyBg: 'bg-slate-100 text-slate-900',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    inputBg: 'bg-slate-50',
    headerBg: 'bg-white/95',
    isLight: true,
  },
};
