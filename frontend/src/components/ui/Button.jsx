import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90',
  secondary: 'bg-muted text-fg hover:opacity-80',
  outline: 'border border-base bg-transparent hover:bg-muted',
  ghost: 'hover:bg-muted',
  danger: 'bg-[rgb(var(--danger))] text-white hover:opacity-90',
};
const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base', icon: 'h-9 w-9' };

export const Button = ({ variant = 'primary', size = 'md', loading, className, children, ...props }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-brand',
      variants[variant], sizes[size], className
    )}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);