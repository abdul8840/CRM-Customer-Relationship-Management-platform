import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { leadsApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/shared/PageHeader';
import { Searchbar } from '@/components/shared/Searchbar';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LeadForm } from './LeadForm';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusVariants = { new: 'brand', contacted: 'warning', qualified: 'success', unqualified: 'default', converted: 'purple', lost: 'danger' };

export default function Leads() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', status: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsApi.list(filters),
  });

  const upsert = useMutation({
    mutationFn: (d) => editing ? leadsApi.update(editing.id, d) : leadsApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['leads'] }); },
  });

  const del = useMutation({
    mutationFn: (id) => leadsApi.remove(id),
    onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['leads'] }); },
  });

  const exportCsv = async () => {
    const res = await fetch(`${leadsApi.exportUrl()}?${new URLSearchParams(filters)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <div><p className="font-medium">{r.first_name} {r.last_name}</p><p className="text-xs text-muted-fg">{r.email}</p></div> },
    { key: 'company_name', label: 'Company' },
    { key: 'source', label: 'Source', render: (r) => <Badge>{r.source}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariants[r.status]}>{r.status}</Badge> },
    { key: 'estimated_value', label: 'Value', render: (r) => formatCurrency(r.estimated_value) },
    { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    },
  ];

  return (
    <>
      <PageHeader title="Leads" subtitle="Manage your sales leads" actions={
        <>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Lead</Button>
        </>
      } />
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-base">
          <Searchbar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} placeholder="Search leads…" />
          <Select className="sm:w-48" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">All statuses</option>
            {Object.keys(statusVariants).map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Lead' : 'New Lead'} size="lg">
        <LeadForm defaultValues={editing} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete lead?" description="This action cannot be undone." danger loading={del.isPending} />
    </>
  );
}