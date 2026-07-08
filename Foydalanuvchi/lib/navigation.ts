import {
  Home,
  BarChart3,
  Flame,
  Brain,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface NavTab {
  href: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
}

export const guideNavTab: NavTab = {
  href: '/qollanma',
  icon: BookOpen,
  label: "Qo'llanma",
  shortLabel: 'Qoll.',
};

/** Desktop sidebar — Qo'llanma odatlar va dominantalar orasida */
export type SidebarNavItem = NavTab & { variant?: 'default' | 'guide' };

export const sidebarNavTabs: SidebarNavItem[] = [
  { href: '/', icon: Home, label: 'Bosh sahifa', shortLabel: 'Bosh' },
  { href: '/odatlar', icon: Flame, label: 'Odatlar', shortLabel: 'Odatlar' },
  { ...guideNavTab, variant: 'guide' },
  { href: '/dominantalar', icon: Brain, label: 'Dominantalar', shortLabel: 'Dom.' },
  { href: '/statistika', icon: BarChart3, label: 'Statistika', shortLabel: 'Stat.' },
];

/** Asosiy navigatsiya — desktop sidebar (guide siz) */
export const primaryNavTabs: NavTab[] = [
  { href: '/', icon: Home, label: 'Bosh sahifa', shortLabel: 'Bosh' },
  { href: '/odatlar', icon: Flame, label: 'Odatlar', shortLabel: 'Odatlar' },
  { href: '/dominantalar', icon: Brain, label: 'Dominantalar', shortLabel: 'Dom.' },
  { href: '/statistika', icon: BarChart3, label: 'Statistika', shortLabel: 'Stat.' },
];

/** Mobil pastki navigatsiya — Qo'llanma odatlar va dominantalar orasida */
export const mobileNavTabs: NavTab[] = [
  { href: '/', icon: Home, label: 'Bosh sahifa', shortLabel: 'Bosh' },
  { href: '/odatlar', icon: Flame, label: 'Odatlar', shortLabel: 'Odatlar' },
  { href: '/qollanma', icon: BookOpen, label: "Qo'llanma", shortLabel: 'Qoll.' },
  { href: '/dominantalar', icon: Brain, label: 'Dominantalar', shortLabel: 'Dom.' },
  { href: '/statistika', icon: BarChart3, label: 'Statistika', shortLabel: 'Stat.' },
];

/** @deprecated mobileNavTabs yoki primaryNavTabs ishlating */
export const mainNavTabs = mobileNavTabs;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
