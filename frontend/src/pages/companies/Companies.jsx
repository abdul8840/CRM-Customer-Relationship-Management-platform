import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { companiesApi } from '@/api/endpoints';
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

const CompanyForm = ({ defaultValues, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Name" required><Input {...register('name', { required: true })} /></FormField>
        <FormField label="Website"><Input {...register('website')} /></FormField>
        <FormField label="Industry"><Input {...register('industry')} /></FormField>
        <FormField label="Size">
          <Select {...register('size')}>
            <option value="">—</option>
            {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Email"><Input type="email" {...register('email')} /></FormField>
        <FormField label="Phone"><Input {...register('phone')} /></FormField>
        <FormField label="City"><Input {...register('city')} /></FormField>
        <FormField label="Country"><Input {...register('country')} /></FormField>
      </div>
      <FormField label="Description"><Textarea rows={3} {...register('description')} /></FormField>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
};

export default function Companies() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['companies', filters], queryFn: () => companiesApi.list(filters) });
  const upsert = useMutation({
    mutationFn: (d) => editing ? companiesApi.update(editing.id, d) : companiesApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['companies'] }); },
  });
  const del = useMutation({ mutationFn: (id) => companiesApi.remove(id), onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['companies'] }); } });

  const columns = [
    { key: 'name', label: 'Company', render: (r) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">{r.logo_url ? <img src={r.logo_url} className="h-full w-full object-cover rounded-lg" /> : <Building2 className="h-4 w-4 text-muted-fg" />}</div>
        <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-fg">{r.website}</p></div>
      </div>
    )},
    { key: 'industry', label: 'Industry' },
    { key: 'size', label: 'Size' },
    { key: 'phone', label: 'Phone' },
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
      <PageHeader title="Companies" subtitle="Your customer companies" actions={
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Company</Button>
      } />
      <Card>
        <div className="p-4 border-b border-base"><Searchbar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} /></div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Company' : 'New Company'} size="lg">
        <CompanyForm defaultValues={editing} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete company?" danger loading={del.isPending} />
    </>
  );
}