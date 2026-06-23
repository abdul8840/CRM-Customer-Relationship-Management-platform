import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { contactsApi, companiesApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { Searchbar } from '@/components/shared/Searchbar';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const schema = z.object({
  first_name: z.string().min(1), last_name: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(), mobile: z.string().optional(),
  job_title: z.string().optional(), department: z.string().optional(),
  company_id: z.coerce.number().optional().or(z.literal('')),
  source: z.string().optional(), notes: z.string().optional(),
});

const ContactForm = ({ defaultValues, onSubmit, onCancel, loading }) => {
  const { data: companies = [] } = useQuery({ queryKey: ['companies-all'], queryFn: () => companiesApi.list({ limit: 100 }).then((d) => d.items) });
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="First name" required error={errors.first_name?.message}><Input {...register('first_name')} /></FormField>
        <FormField label="Last name"><Input {...register('last_name')} /></FormField>
        <FormField label="Email"><Input type="email" {...register('email')} /></FormField>
        <FormField label="Phone"><Input {...register('phone')} /></FormField>
        <FormField label="Mobile"><Input {...register('mobile')} /></FormField>
        <FormField label="Job title"><Input {...register('job_title')} /></FormField>
        <FormField label="Department"><Input {...register('department')} /></FormField>
        <FormField label="Company">
          <Select {...register('company_id')}>
            <option value="">— None —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Notes"><Textarea rows={3} {...register('notes')} /></FormField>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
};

export default function Contacts() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['contacts', filters], queryFn: () => contactsApi.list(filters) });
  const upsert = useMutation({
    mutationFn: (d) => editing ? contactsApi.update(editing.id, d) : contactsApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['contacts'] }); },
  });
  const del = useMutation({ mutationFn: (id) => contactsApi.remove(id), onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['contacts'] }); } });

  const columns = [
    { key: 'name', label: 'Contact', render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar src={r.avatar_url} name={`${r.first_name} ${r.last_name}`} size={36} />
        <div><p className="font-medium">{r.first_name} {r.last_name}</p><p className="text-xs text-muted-fg">{r.email}</p></div>
      </div>
    )},
    { key: 'company', label: 'Company', render: (r) => r.company?.name || '—' },
    { key: 'phone', label: 'Phone' },
    { key: 'job_title', label: 'Title' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'default'}>{r.status}</Badge> },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Contacts" subtitle="Your customer contact database" actions={
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Contact</Button>
      } />
      <Card>
        <div className="p-4 border-b border-base"><Searchbar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} /></div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Contact' : 'New Contact'} size="lg">
        <ContactForm defaultValues={editing} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete contact?" danger loading={del.isPending} />
    </>
  );
}