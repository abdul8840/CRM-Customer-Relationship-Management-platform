// Input.jsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
export const Input = forwardRef(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none transition placeholder:text-muted-fg',
      'focus:ring-brand', error ? 'border-red-500' : 'border-base', className
    )}
    {...props}
  />
));
Input.displayName = 'Input';