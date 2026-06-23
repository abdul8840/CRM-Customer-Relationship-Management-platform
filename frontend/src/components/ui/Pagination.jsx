import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
export const Pagination = ({ meta, onPage }) => {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between p-4 text-sm">
      <p className="text-muted-fg">Page {meta.page} of {meta.totalPages} — {meta.total} records</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => onPage(meta.page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};