import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { notesApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';

export default function Notes() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ['notes'], queryFn: () => notesApi.list({ limit: 50 }) });
  const { register, handleSubmit, reset } = useForm();

  const upsert = useMutation({
    mutationFn: (d) => editing ? notesApi.update(editing.id, d) : notesApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); reset(); qc.invalidateQueries({ queryKey: ['notes'] }); },
  });
  const del = useMutation({ mutationFn: (id) => notesApi.remove(id), onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['notes'] }); } });

  return (
    <>
      <PageHeader title="Notes" actions={<Button onClick={() => { setEditing(null); reset({}); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Note</Button>} />
      {isLoading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        : !data?.items?.length ? <Card><EmptyState title="No notes yet" /></Card>
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((n) => (
            <Card key={n.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold flex-1">{n.title || 'Untitled'}</h3>
                  {n.pinned && <Pin className="h-4 w-4 text-amber-500" />}
                </div>
                <p className="text-sm text-muted-fg whitespace-pre-wrap">{n.content}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-base">
                  <p className="text-xs text-muted-fg">{formatDate(n.created_at)}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(n); reset(n); setFormOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(n)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Note' : 'New Note'}>
        <form onSubmit={handleSubmit((d) => upsert.mutate(d))} className="space-y-4">
          <FormField label="Title"><Input {...register('title')} /></FormField>
          <FormField label="Content" required><Textarea rows={6} {...register('content', { required: true })} /></FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Related to" required>
              <Select {...register('related_to_type', { required: true })}>
                <option value="">—</option>{['lead', 'deal', 'contact', 'company'].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Related ID" required><Input type="number" {...register('related_to_id', { required: true, valueAsNumber: true })} /></FormField>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={upsert.isPending}>Save</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete note?" danger loading={del.isPending} />
    </>
  );
}