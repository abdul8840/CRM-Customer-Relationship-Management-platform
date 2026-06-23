import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ticketsApi, faqsApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate } from '@/lib/utils';

const statusVariant = { open: 'brand', in_progress: 'warning', resolved: 'success', closed: 'default' };

export default function Support() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: tickets } = useQuery({ queryKey: ['my-tickets'], queryFn: () => ticketsApi.list({ limit: 50 }) });
  const { data: faqs = [] } = useQuery({ queryKey: ['faqs'], queryFn: faqsApi.list });
  const { register, handleSubmit, reset } = useForm();
  const create = useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: () => { toast.success('Ticket created'); setOpen(false); reset(); qc.invalidateQueries({ queryKey: ['my-tickets'] }); },
  });

  return (
    <>
      <PageHeader title="Support" subtitle="Get help from our team" actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Ticket</Button>} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>My Tickets</CardTitle></CardHeader>
          <CardBody className="p-0">
            {tickets?.items?.length ? tickets.items.map((t) => (
              <div key={t.id} className="p-4 border-b border-base last:border-0">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-fg">{t.ticket_number}</p>
                  <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                </div>
                <p className="font-medium mt-1">{t.subject}</p>
                <p className="text-xs text-muted-fg mt-1">{formatDate(t.created_at)}</p>
              </div>
            )) : <p className="p-8 text-center text-sm text-muted-fg">No tickets yet</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>FAQ</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            {faqs.length ? faqs.map((f) => (
              <details key={f.id} className="border border-base rounded-lg p-3">
                <summary className="cursor-pointer font-medium">{f.question}</summary>
                <p className="text-sm text-muted-fg mt-2">{f.answer}</p>
              </details>
            )) : <p className="text-sm text-muted-fg">No FAQs yet</p>}
          </CardBody>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Support Ticket">
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
          <FormField label="Subject" required><Input {...register('subject', { required: true })} /></FormField>
          <FormField label="Description" required><Textarea rows={5} {...register('description', { required: true })} /></FormField>
          <FormField label="Priority">
            <Select {...register('priority')}>{['low', 'medium', 'high', 'urgent'].map((p) => <option key={p}>{p}</option>)}</Select>
          </FormField>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={create.isPending}>Submit</Button></div>
        </form>
      </Modal>
    </>
  );
}