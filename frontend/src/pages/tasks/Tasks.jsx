import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { Searchbar } from '@/components/shared/Searchbar';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';

const TaskForm = ({ defaultValues, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit } = useForm({ defaultValues: defaultValues || { type: 'other', status: 'pending', priority: 'medium' } });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Title" required><Input {...register('title', { required: true })} /></FormField>
      <FormField label="Description"><Textarea rows={3} {...register('description')} /></FormField>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Type">
          <Select {...register('type')}>{['call', 'email', 'meeting', 'follow_up', 'other'].map((t) => <option key={t}>{t}</option>)}</Select>
        </FormField>
        <FormField label="Status">
          <Select {...register('status')}>{['pending', 'in_progress', 'completed', 'cancelled'].map((t) => <option key={t}>{t}</option>)}</Select>
        </FormField>
        <FormField label="Priority">
          <Select {...register('priority')}>{['low', 'medium', 'high', 'urgent'].map((t) => <option key={t}>{t}</option>)}</Select>
        </FormField>
        <FormField label="Due date"><Input type="datetime-local" {...register('due_date')} /></FormField>
        <FormField label="Reminder at"><Input type="datetime-local" {...register('reminder_at')} /></FormField>
        <FormField label="Recurring">
          <Select {...register('recurrence_pattern')}>
            <option value="">No</option>
            {['daily', 'weekly', 'monthly'].map((t) => <option key={t}>{t}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
};

const priorityVariant = { low: 'default', medium: 'brand', high: 'warning', urgent: 'danger' };
const statusVariant = { pending: 'default', in_progress: 'brand', completed: 'success', cancelled: 'danger' };

export default function Tasks() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', status: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['tasks', filters], queryFn: () => tasksApi.list(filters) });
  const upsert = useMutation({
    mutationFn: (d) => editing ? tasksApi.update(editing.id, d) : tasksApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
  const del = useMutation({ mutationFn: (id) => tasksApi.remove(id), onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['tasks'] }); } });
  const complete = useMutation({ mutationFn: (id) => tasksApi.update(id, { status: 'completed', completed_at: new Date() }), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });

  const columns = [
    { key: 'title', label: 'Task', render: (r) => (
      <div className="flex items-start gap-3">
        <button onClick={(e) => { e.stopPropagation(); complete.mutate(r.id); }} className={`h-5 w-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${r.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-base'}`}>
          {r.status === 'completed' && <Check className="h-3 w-3 text-white" />}
        </button>
        <div className={r.status === 'completed' ? 'line-through opacity-60' : ''}>
          <p className="font-medium">{r.title}</p>
          <p className="text-xs text-muted-fg">{r.description}</p>
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r) => <Badge>{r.type}</Badge> },
    { key: 'priority', label: 'Priority', render: (r) => <Badge variant={priorityVariant[r.priority]}>{r.priority}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge> },
    { key: 'due_date', label: 'Due', render: (r) => formatDate(r.due_date) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Tasks" actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Task</Button>} />
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-base">
          <Searchbar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} />
          <Select className="sm:w-48" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">All statuses</option>{['pending', 'in_progress', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Task' : 'New Task'} size="lg">
        <TaskForm defaultValues={editing} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete task?" danger loading={del.isPending} />
    </>
  );
}