import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs) => twMerge(clsx(inputs));
export const formatCurrency = (n, c = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(+n || 0);
export const formatDate = (d, opts) =>
  d ? new Date(d).toLocaleDateString('en-IN', opts || { year: 'numeric', month: 'short', day: '2-digit' }) : '—';
export const initials = (s = '') => s.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');