import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi, rolesApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { Searchbar } from '@/components/shared/Searchbar';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';

const statusVariant = { active: 'success', pending: 'warning', inactive: 'default', suspended: 'danger' };

const UserForm = ({ defaultValues, roles, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="First name" required><Input {...register('first_name', { required: true })} /></FormField>
        <FormField label="Last name"><Input {...register('last_name')} /></FormField>
        <FormField label="Email" required><Input type="email" {...register('email', { required: true })} /></FormField>
        <FormField label="Phone"><Input {...register('phone')} /></FormField>
        {!defaultValues && <FormField label="Password" required><Input type="password" {...register('password', { required: true })} /></FormField>}
        <FormField label="Role" required>
          <Select {...register('role_id', { required: true, valueAsNumber: true })}>
            <option value="">—</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...register('status')}>{['active', 'inactive', 'pending', 'suspended'].map((s) => <option key={s}>{s}</option>)}</Select>
        </FormField>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
};

export default function Users() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', status: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['admin-users', filters], queryFn: () => usersApi.list(filters) });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });

  const upsert = useMutation({
    mutationFn: (d) => editing ? usersApi.update(editing.id, d) : usersApi.create(d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setFormOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => usersApi.setStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });
  const del = useMutation({ mutationFn: (id) => usersApi.remove(id), onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['admin-users'] }); } });

  const columns = [
    { key: 'user', label: 'User', render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar src={r.avatar_url} name={`${r.first_name} ${r.last_name}`} size={36} />
        <div><p className="font-medium">{r.first_name} {r.last_name}</p><p className="text-xs text-muted-fg">{r.email}</p></div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (r) => <Badge variant="brand">{r.role?.name}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge> },
    { key: 'last_login_at', label: 'Last login', render: (r) => formatDate(r.last_login_at) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
        {r.status === 'active' ? (
          <Button variant="ghost" size="icon" title="Suspend" onClick={() => setStatus.mutate({ id: r.id, status: 'suspended' })}><Ban className="h-4 w-4 text-amber-500" /></Button>
        ) : (
          <Button variant="ghost" size="icon" title="Activate" onClick={() => setStatus.mutate({ id: r.id, status: 'active' })}><CheckCircle2 className="h-4 w-4 text-green-500" /></Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Users" subtitle="Manage platform users" actions={
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New User</Button>
      } />
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-base">
          <Searchbar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} />
          <Select className="sm:w-48" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">All statuses</option>{['active', 'inactive', 'pending', 'suspended'].map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit User' : 'New User'} size="lg">
        <UserForm defaultValues={editing} roles={roles} loading={upsert.isPending} onSubmit={(d) => upsert.mutate(d)} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete user?" danger loading={del.isPending} />
    </>
  );
}