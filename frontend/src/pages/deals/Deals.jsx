import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useForm } from 'react-hook-form';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { dealsApi } from '@/api/endpoints';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Skeleton } from '@/components/ui/Skeleton';
import { DealCard } from './DealCard';
import { formatCurrency } from '@/lib/utils';

const STAGES = [
  { key: 'lead', title: 'Lead', color: 'bg-slate-100 dark:bg-slate-800' },
  { key: 'qualified', title: 'Qualified', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { key: 'proposal_sent', title: 'Proposal Sent', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { key: 'negotiation', title: 'Negotiation', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { key: 'won', title: 'Won', color: 'bg-green-100 dark:bg-green-900/30' },
  { key: 'lost', title: 'Lost', color: 'bg-red-100 dark:bg-red-900/30' },
];

const DealForm = ({ defaultValues, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit } = useForm({ defaultValues: defaultValues || { stage: 'lead', currency: 'INR' } });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Title" required><Input {...register('title', { required: true })} /></FormField>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Value"><Input type="number" step="0.01" {...register('value')} /></FormField>
        <FormField label="Stage">
          <Select {...register('stage')}>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}</Select>
        </FormField>
        <FormField label="Expected close"><Input type="date" {...register('expected_close_date')} /></FormField>
        <FormField label="Probability %"><Input type="number" min="0" max="100" {...register('probability')} /></FormField>
      </div>
      <FormField label="Description"><Textarea rows={3} {...register('description')} /></FormField>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
};

const Column = ({ stage, deals, onCardClick }) => (
  <div className="flex flex-col w-72 flex-shrink-0">
    <div className={`p-3 rounded-t-lg ${stage.color}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{stage.title}</p>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30">{deals.length}</span>
      </div>
      <p className="text-xs text-muted-fg mt-0.5">{formatCurrency(deals.reduce((s, d) => s + Number(d.value || 0), 0))}</p>
    </div>
    <div className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[400px]" data-stage={stage.key}>
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        {deals.map((d) => <DealCard key={d.id} deal={d} onClick={onCardClick} />)}
      </SortableContext>
    </div>
  </div>
);

export default function Deals() {
  const qc = useQueryClient();
  const [view, setView] = useState('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const { data: board, isLoading } = useQuery({ queryKey: ['deals-kanban'], queryFn: () => dealsApi.kanban() });

  const upsert = useMutation({
    mutationFn: (d) => editing ? dealsApi.update(editing.id, d) : dealsApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['deals-kanban'] }); },
  });
  const moveStage = useMutation({ mutationFn: ({ id, stage }) => dealsApi.moveStage(id, stage), onSuccess: () => qc.invalidateQueries({ queryKey: ['deals-kanban'] }) });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const flatDeals = useMemo(() => Object.values(board || {}).flat(), [board]);
  const activeDeal = flatDeals.find((d) => d.id === activeId);

  const onDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const dragged = flatDeals.find((d) => d.id === active.id);
    if (!dragged) return;

    const overStage = STAGES.find((s) => s.key === over.id) ? over.id : flatDeals.find((d) => d.id === over.id)?.stage;
    if (overStage && overStage !== dragged.stage) {
      qc.setQueryData(['deals-kanban'], (prev) => {
        const next = { ...prev };
        next[dragged.stage] = (next[dragged.stage] || []).filter((d) => d.id !== dragged.id);
        next[overStage] = [{ ...dragged, stage: overStage }, ...(next[overStage] || [])];
        return next;
      });
      moveStage.mutate({ id: dragged.id, stage: overStage });
    }
  };

  if (isLoading) return <div className="flex gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-96 w-72" />)}</div>;

  return (
    <>
      <PageHeader title="Deals Pipeline" subtitle="Drag deals across stages" actions={
        <>
          <div className="flex border border-base rounded-lg p-1">
            <button onClick={() => setView('kanban')} className={`p-1.5 rounded ${view === 'kanban' ? 'bg-muted' : ''}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-muted' : ''}`}><List className="h-4 w-4" /></button>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Deal</Button>
        </>
      } />
      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {STAGES.map((stage) => <Column key={stage.key} stage={stage} deals={board?.[stage.key] || []} onCardClick={(d) => { setEditing(d); setFormOpen(true); }} />)}
          </div>
          <DragOverlay>{activeDeal && <DealCard deal={activeDeal} />}</DragOverlay>
        </DndContext>
      )}
      {view === 'list' && (
        <Card>
          <div className="p-4 space-y-2">
            {flatDeals.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 border border-base rounded-lg cursor-pointer hover:bg-muted" onClick={() => { setEditing(d); setFormOpen(true); }}>
                <div><p className="font-medium">{d.title}</p><p className="text-xs text-muted-fg">{d.company?.name}</p></div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{d.stage}</span>
                  <span className="font-semibold">{formatCurrency(d.value, d.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Deal' : 'New Deal'} size="lg">
        <DealForm defaultValues={editing} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
    </>
  );
}