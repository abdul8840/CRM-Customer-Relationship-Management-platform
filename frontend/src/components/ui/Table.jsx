// Table.jsx
import { cn } from '@/lib/utils';
export const Table = ({ className, ...p }) => <table className={cn('w-full text-sm', className)} {...p} />;
export const Thead = (p) => <thead className="bg-muted text-muted-fg text-xs uppercase tracking-wide" {...p} />;
export const Th = ({ className, ...p }) => <th className={cn('text-left font-medium px-4 py-3', className)} {...p} />;
export const Tr = ({ className, ...p }) => <tr className={cn('border-b border-base hover:bg-muted/40 transition', className)} {...p} />;
export const Td = ({ className, ...p }) => <td className={cn('px-4 py-3', className)} {...p} />;