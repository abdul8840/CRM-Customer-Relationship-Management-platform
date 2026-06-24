// Badge.jsx
import { cn } from '@/lib/utils';
const map = {
  default: 'bg-muted text-fg',
  brand: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
export const Badge = ({ variant = 'default', className, ...p }) => (
  <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', map[variant], className)} {...p} />
);