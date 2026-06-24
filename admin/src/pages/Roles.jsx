import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { rolesApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';

export default function Roles() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const { data: perms = [] } = useQuery({ queryKey: ['permissions'], queryFn: rolesApi.permissions });
  const { register, handleSubmit, reset } = useForm();

  const grouped = useMemo(() => {
    const g = {};
    perms.forEach((p) => { (g[p.module] = g[p.module] || []).push(p); });
    return g;
  }, [perms]);

  const openEdit = (role) => {
    setEditing(role);
    setSelected(new Set(role.permissions?.map((p) => p.id) || []));
    reset({ name: role.name, slug: role.slug, description: role.description });
    setOpen(true);
  };
  const openNew = () => { setEditing(null); setSelected(new Set()); reset({}); setOpen(true); };

  const save = useMutation({
    mutationFn: (d) => editing ? rolesApi.update(editing.id, { ...d, permission_ids: [...selected] })
                                : rolesApi.create({ ...d, permission_ids: [...selected] }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['roles'] }); },
  });
  const del = useMutation({ mutationFn: rolesApi.remove, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['roles'] }); } });

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <PageHeader title="Roles & Permissions" actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> New Role</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">{r.name} {r.is_system && <Badge variant="default">system</Badge>}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                {!r.is_system && <Button variant="ghost" size="icon" onClick={() => confirm('Delete?') && del.mutate(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-muted-fg mb-3">{r.description}</p>
              <div className="flex flex-wrap gap-1">
                {r.permissions?.slice(0, 12).map((p) => <Badge key={p.id} variant="brand">{p.slug}</Badge>)}
                {r.permissions?.length > 12 && <Badge>+{r.permissions.length - 12} more</Badge>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : 'New Role'} size="xl" footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit((d) => save.mutate(d))} loading={save.isPending}>Save</Button>
        </>
      }>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <FormField label="Name" required><Input {...register('name', { required: true })} /></FormField>
          <FormField label="Slug" required><Input {...register('slug', { required: true })} /></FormField>
          <FormField label="Description"><Input {...register('description')} /></FormField>
        </div>
        <h4 className="font-semibold mb-3">Permissions</h4>
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-2">
          {Object.entries(grouped).map(([mod, list]) => (
            <div key={mod}>
              <p className="text-xs font-semibold uppercase text-muted-fg mb-2">{mod}</p>
              <div className="grid sm:grid-cols-3 gap-2">
                {list.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-2 border border-base rounded-lg cursor-pointer hover:bg-muted">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}