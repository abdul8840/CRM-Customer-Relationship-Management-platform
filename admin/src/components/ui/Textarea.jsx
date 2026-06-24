// Textarea.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
export const Textarea = forwardRef(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-fg focus:ring-brand',
      error ? 'border-red-500' : 'border-base', className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';