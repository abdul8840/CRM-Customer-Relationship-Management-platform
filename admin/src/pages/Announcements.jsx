// Announcements.jsx (same shape)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { announcementsApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';

const typeColor = { info: 'brand', success: 'success', warning: 'warning', critical: 'danger' };

export default function Announcements() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data: items = [] } = useQuery({ queryKey: ['admin-ann'], queryFn: announcementsApi.list });
  const { register, handleSubmit, reset } = useForm();
  const save = useMutation({
    mutationFn: (d) => editing ? announcementsApi.update(editing.id, d) : announcementsApi.create(d),
    onSuccess: () => { toast.success('Saved'); setOpen(false); setEditing(null); reset(); qc.invalidateQueries({ queryKey: ['admin-ann'] }); },
  });
  const del = useMutation({ mutationFn: announcementsApi.remove, onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['admin-ann'] }); } });

  return (
    <>
      <PageHeader title="Announcements" actions={<Button onClick={() => { setEditing(null); reset({ type: 'info', audience: 'all' }); setOpen(true); }}><Plus className="h-4 w-4" /> New</Button>} />
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2"><Badge variant={typeColor[a.type]}>{a.type}</Badge><Badge>{a.audience}</Badge>{!a.is_active && <Badge variant="danger">inactive</Badge>}</div>
                <h4 className="font-semibold mt-2">{a.title}</h4>
                <p className="text-sm text-muted-fg mt-1">{a.content}</p>
                <p className="text-xs text-muted-fg mt-2">Published {formatDate(a.published_at)} • Expires {a.expires_at ? formatDate(a.expires_at) : 'never'}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(a); reset({ ...a, published_at: a.published_at?.slice(0,16), expires_at: a.expires_at?.slice(0,16) }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
          <FormField label="Title" required><Input {...register('title', { required: true })} /></FormField>
          <FormField label="Content" required><Textarea rows={4} {...register('content', { required: true })} /></FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Type"><Select {...register('type')}>{['info', 'success', 'warning', 'critical'].map((t) => <option key={t}>{t}</option>)}</Select></FormField>
            <FormField label="Audience"><Select {...register('audience')}>{['all', 'customers', 'admins'].map((t) => <option key={t}>{t}</option>)}</Select></FormField>
            <FormField label="Publish at"><Input type="datetime-local" {...register('published_at')} /></FormField>
            <FormField label="Expires at"><Input type="datetime-local" {...register('expires_at')} /></FormField>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete announcement?" danger loading={del.isPending} />
    </>
  );
}