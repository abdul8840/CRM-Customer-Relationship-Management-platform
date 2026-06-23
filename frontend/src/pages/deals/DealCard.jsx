import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, GripVertical } from 'lucide-react';

export const DealCard = ({ deal, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <Card ref={setNodeRef} style={style} className="mb-2 cursor-pointer hover:border-blue-400 transition" onClick={() => onClick?.(deal)}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm flex-1">{deal.title}</p>
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4 text-muted-fg" />
          </button>
        </div>
        {deal.company && <p className="text-xs text-muted-fg mt-1">{deal.company.name}</p>}
        <div className="flex items-center justify-between mt-3">
          <Badge variant="success">{formatCurrency(deal.value, deal.currency)}</Badge>
          {deal.expected_close_date && <span className="text-xs text-muted-fg flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(deal.expected_close_date)}</span>}
        </div>
      </div>
    </Card>
  );
};