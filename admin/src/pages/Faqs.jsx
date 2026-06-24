// Faqs.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { faqsApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function Faqs() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data: faqs = [] } = useQuery({ queryKey: ['admin-faqs'], queryFn: faqsApi.list });
  const { register, handleSubmit, reset } = useForm();
  const save = useMutation({
    mutationFn: (d) => editing ? faqsApi.update(editing.id, d) : faqsApi.create(d),
    onSuccess: () => { toast.success('Saved'); setOpen(false); setEditing(null); reset(); qc.invalidateQueries({ queryKey: ['admin-faqs'] }); },
  });
  const del = useMutation({ mutationFn: faqsApi.remove, onSuccess: () => { toast.success('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['admin-faqs'] }); } });

  return (
    <>
      <PageHeader title="FAQs" actions={<Button onClick={() => { setEditing(null); reset({}); setOpen(true); }}><Plus className="h-4 w-4" /> New FAQ</Button>} />
      <Card>
        {faqs.map((f) => (
          <div key={f.id} className="p-4 border-b border-base last:border-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-fg">{f.category}</p>
                <h4 className="font-semibold">{f.question}</h4>
                <p className="text-sm text-muted-fg mt-1">{f.answer}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(f); reset(f); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(f)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          </div>
        ))}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit FAQ' : 'New FAQ'} size="lg">
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
          <FormField label="Category"><Input {...register('category')} /></FormField>
          <FormField label="Question" required><Input {...register('question', { required: true })} /></FormField>
          <FormField label="Answer" required><Textarea rows={5} {...register('answer', { required: true })} /></FormField>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting.id)} title="Delete FAQ?" danger loading={del.isPending} />
    </>
  );
}