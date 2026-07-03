import { Home, BarChart3, Flame, Brain, type LucideIcon } from 'lucide-react';

export interface NavTab {
  href: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
}

export const mainNavTabs: NavTab[] = [
  { href: '/', icon: Home, label: 'Bosh sahifa', shortLabel: 'Bosh' },
  { href: '/odatlar', icon: Flame, label: 'Odatlar', shortLabel: 'Odatlar' },
  { href: '/dominantalar', icon: Brain, label: 'Dominantalar', shortLabel: 'Dom.' },
  { href: '/statistika', icon: BarChart3, label: 'Statistika', shortLabel: 'Stat.' },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
