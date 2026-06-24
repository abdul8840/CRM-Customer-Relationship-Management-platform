import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ticketsApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';

const sv = { open: 'brand', in_progress: 'warning', resolved: 'success', closed: 'default' };

export default function Tickets() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const [openTicket, setOpenTicket] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-tickets', filters], queryFn: () => ticketsApi.list(filters) });
  const { data: detail } = useQuery({ queryKey: ['ticket', openTicket?.id], queryFn: () => ticketsApi.get(openTicket.id), enabled: !!openTicket });
  const { register, handleSubmit, reset } = useForm();
  const reply = useMutation({
    mutationFn: ({ id, message }) => ticketsApi.reply(id, message),
    onSuccess: () => { toast.success('Reply sent'); reset(); qc.invalidateQueries({ queryKey: ['ticket', openTicket.id] }); },
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => ticketsApi.setStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tickets'] }); qc.invalidateQueries({ queryKey: ['ticket', openTicket?.id] }); },
  });

  const columns = [
    { key: 'no', label: 'Ticket #', render: (r) => <span className="font-mono text-xs">{r.ticket_number}</span> },
    { key: 'user', label: 'User', render: (r) => <div className="flex items-center gap-2"><Avatar src={r.user?.avatar_url} name={`${r.user?.first_name}`} size={28} /><span>{r.user?.first_name} {r.user?.last_name}</span></div> },
    { key: 'subject', label: 'Subject' },
    { key: 'priority', label: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={sv[r.status]}>{r.status}</Badge> },
    { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <PageHeader title="Support Tickets" />
      <Card>
        <div className="p-4 border-b border-base flex gap-3">
          <Select className="sm:w-48" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">All</option>{Object.keys(sv).map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} onRowClick={(r) => setOpenTicket(r)} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters({ ...filters, page: p })} />
      </Card>
      <Modal open={!!openTicket} onClose={() => setOpenTicket(null)} title={openTicket?.ticket_number} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select className="w-48" value={detail.status} onChange={(e) => setStatus.mutate({ id: detail.id, status: e.target.value })}>
                {Object.keys(sv).map((s) => <option key={s}>{s}</option>)}
              </Select>
              <Badge variant={sv[detail.status]}>{detail.status}</Badge>
            </div>
            <div className="p-3 border border-base rounded-lg">
              <p className="text-xs text-muted-fg mb-1">{detail.user?.email}</p>
              <p className="font-semibold">{detail.subject}</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{detail.description}</p>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
              {detail.messages?.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <Avatar src={m.user?.avatar_url} name={`${m.user?.first_name}`} size={32} />
                  <div className="flex-1 bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <p className="font-medium">{m.user?.first_name} {m.user?.last_name}</p>
                      <p className="text-muted-fg">{formatDate(m.created_at, { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit((d) => reply.mutate({ id: detail.id, message: d.message }))} className="space-y-2">
              <Textarea rows={3} placeholder="Reply…" {...register('message', { required: true })} />
              <div className="flex justify-end"><Button type="submit" loading={reply.isPending}>Send reply</Button></div>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}