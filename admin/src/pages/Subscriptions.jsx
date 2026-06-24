// Subscriptions.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/shared/PageHeader';
import { Searchbar } from '@/components/shared/Searchbar';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate, formatCurrency } from '@/lib/utils';

const variant = { active: 'success', trial: 'brand', past_due: 'warning', canceled: 'default', expired: 'danger' };
export default function Subscriptions() {
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const { data, isLoading } = useQuery({ queryKey: ['admin-subs', filters], queryFn: () => subscriptionsApi.list(filters) });
  const columns = [
    { key: 'user', label: 'User', render: (r) => <div className="flex items-center gap-3"><Avatar src={r.user?.avatar_url} name={`${r.user?.first_name || ''}`} size={32} /><div><p className="font-medium">{r.user?.first_name} {r.user?.last_name}</p><p className="text-xs text-muted-fg">{r.user?.email}</p></div></div> },
    { key: 'plan', label: 'Plan', render: (r) => <div><p className="font-medium">{r.plan?.name}</p><p className="text-xs text-muted-fg">{formatCurrency(r.plan?.price, r.plan?.currency)}/{r.plan?.interval}</p></div> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={variant[r.status]}>{r.status}</Badge> },
    { key: 'current_period_end', label: 'Renews', render: (r) => formatDate(r.current_period_end) },
    { key: 'created_at', label: 'Started', render: (r) => formatDate(r.created_at) },
  ];
  return (
    <>
      <PageHeader title="Subscriptions" subtitle="All customer subscriptions" />
      <Card>
        <div className="p-4 border-b border-base flex gap-3">
          <Select className="sm:w-48" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">All statuses</option>{Object.keys(variant).map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters({ ...filters, page: p })} />
      </Card>
    </>
  );
}