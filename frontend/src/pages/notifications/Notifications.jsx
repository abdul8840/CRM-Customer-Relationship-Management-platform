import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Bell } from 'lucide-react';
import { notificationsApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['all-notifications'], queryFn: () => notificationsApi.list({ limit: 100 }) });
  const markAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['all-notifications'] }) });
  const remove = useMutation({ mutationFn: notificationsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: ['all-notifications'] }) });

  return (
    <>
      <PageHeader title="Notifications" actions={<Button variant="outline" onClick={() => markAll.mutate()}>Mark all read</Button>} />
      {isLoading ? <Skeleton className="h-40" /> : !data?.items?.length ? <Card><EmptyState icon={Bell} title="You're all caught up" /></Card> : (
        <Card>
          {data.items.map((n) => (
            <div key={n.id} className={`flex items-start justify-between gap-3 p-4 border-b border-base last:border-0 ${!n.read_at ? 'bg-muted/30' : ''}`}>
              <div className="flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-fg">{n.message}</p>
                <p className="text-xs text-muted-fg mt-1">{formatDate(n.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(n.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}