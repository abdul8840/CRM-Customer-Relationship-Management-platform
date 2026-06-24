// Select.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
export const Select = forwardRef(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:ring-brand',
      error ? 'border-red-500' : 'border-base', className
    )}
    {...props}
  >{children}</select>
));
Select.displayName = 'Select';