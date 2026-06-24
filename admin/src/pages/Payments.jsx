// Payments.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { formatDate, formatCurrency } from '@/lib/utils';

const variant = { created: 'default', authorized: 'brand', captured: 'success', failed: 'danger', refunded: 'warning' };
export default function Payments() {
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const { data, isLoading } = useQuery({ queryKey: ['admin-payments', filters], queryFn: () => paymentsApi.list(filters) });
  const columns = [
    { key: 'payment_id', label: 'Payment ID', render: (r) => <span className="font-mono text-xs">{r.razorpay_payment_id || r.razorpay_order_id}</span> },
    { key: 'user', label: 'User', render: (r) => <div><p className="font-medium">{r.user?.first_name} {r.user?.last_name}</p><p className="text-xs text-muted-fg">{r.user?.email}</p></div> },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatCurrency(r.amount, r.currency)}</span> },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={variant[r.status]}>{r.status}</Badge> },
    { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
  ];
  return (
    <>
      <PageHeader title="Payments" subtitle="All Razorpay transactions" />
      <Card>
        <div className="p-4 border-b border-base">
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