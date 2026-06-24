import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { plansApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';

const PlanForm = ({ defaultValues, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: defaultValues ? {
      ...defaultValues,
      features: (defaultValues.features || []).join('\n'),
      limits: JSON.stringify(defaultValues.limits || {}, null, 2),
    } : { interval: 'month', currency: 'INR', is_active: true },
  });
  const submit = (d) => onSubmit({
    ...d,
    features: d.features?.split('\n').map(s => s.trim()).filter(Boolean),
    limits: d.limits ? JSON.parse(d.limits) : {},
    price: Number(d.price), trial_days: Number(d.trial_days || 0), sort_order: Number(d.sort_order || 0),
  });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Name" required><Input {...register('name', { required: true })} /></FormField>
        <FormField label="Slug" required><Input {...register('slug', { required: true })} /></FormField>
        <FormField label="Price"><Input type="number" step="0.01" {...register('price')} /></FormField>
        <FormField label="Currency"><Input maxLength={3} {...register('currency')} /></FormField>
        <FormField label="Interval"><Select {...register('interval')}><option>month</option><option>year</option></Select></FormField>
        <FormField label="Trial days"><Input type="number" {...register('trial_days')} /></FormField>
        <FormField label="Sort order"><Input type="number" {...register('sort_order')} /></FormField>
        <FormField label="Active"><Select {...register('is_active')}><option value="true">Yes</option><option value="false">No</option></Select></FormField>
      </div>
      <FormField label="Description"><Textarea rows={2} {...register('description')} /></FormField>
      <FormField label="Features (one per line)"><Textarea rows={4} {...register('features')} /></FormField>
      <FormField label='Limits JSON (e.g. {"leads":1000,"users":5})'><Textarea rows={3} className="font-mono text-xs" {...register('limits')} /></FormField>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
};

export default function Plans() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['admin-plans'], queryFn: plansApi.list });
  const upsert = useMutation({
    mutationFn: (d) => editing ? plansApi.update(editing.id, d) : plansApi.create(d),
    onSuccess: () => { toast.success('Saved'); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['admin-plans'] }); },
  });
  const del = useMutation({ mutationFn: plansApi.remove, onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['admin-plans'] }); } });

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-fg">{r.slug}</p></div> },
    { key: 'price', label: 'Price', render: (r) => <span className="font-semibold">{formatCurrency(r.price, r.currency)} <span className="text-xs text-muted-fg">/{r.interval}</span></span> },
    { key: 'trial_days', label: 'Trial' },
    { key: 'is_active', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'success' : 'default'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Subscription Plans" actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New Plan</Button>} />
      <Card><DataTable columns={columns} rows={plans} loading={isLoading} /></Card>
      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? 'Edit Plan' : 'New Plan'} size="lg">
        <PlanForm defaultValues={editing} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete plan?" danger loading={del.isPending} />
    </>
  );
}