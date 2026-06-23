// Avatar.jsx
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';
export const Avatar = ({ src, name = '', size = 36, className }) => (
  <div className={cn('rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-100 flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0', className)}
       style={{ width: size, height: size }}>
    {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
  </div>
);