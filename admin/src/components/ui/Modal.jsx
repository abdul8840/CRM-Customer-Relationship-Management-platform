import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={cn('w-full bg-card rounded-2xl border border-base shadow-2xl flex flex-col max-h-[90vh]', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-base">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 scrollbar-thin">{children}</div>
        {footer && <div className="p-5 border-t border-base flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};