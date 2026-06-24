import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search as SearchIcon, Eye, ArrowUpRight } from 'lucide-react';
import { subscriptionsApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusVariant = {
  trial: 'brand',
  active: 'success',
  past_due: 'warning',
  canceled: 'default',
  expired: 'danger',
};

const STATUS_OPTIONS = ['trial', 'active', 'past_due', 'canceled', 'expired'];

export default function Subscriptions() {
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', search: '' });
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subs', filters],
    queryFn: () => subscriptionsApi.list(filters),
    keepPreviousData: true,
  });

  const summary = (data?.items || []).reduce(
    (acc, sub) => {
      acc.total += 1;
      acc.mrr += Number(sub.plan?.price || 0);
      if (sub.status === 'active') acc.active += 1;
      else if (sub.status === 'trial') acc.trial += 1;
      else if (sub.status === 'past_due') acc.pastDue += 1;
      else if (sub.status === 'canceled') acc.canceled += 1;
      return acc;
    },
    { total: 0, mrr: 0, active: 0, trial: 0, pastDue: 0, canceled: 0 }
  );

  const downloadCsv = () => {
    const rows = data?.items || [];
    if (!rows.length) return;
    const headers = ['Customer', 'Email', 'Plan', 'Status', 'Price', 'Currency', 'Period Start', 'Period End', 'Started', 'Canceled'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.user?.first_name || ''} ${r.user?.last_name || ''}"`,
          r.user?.email || '',
          r.plan?.name || '',
          r.status,
          r.plan?.price || 0,
          r.plan?.currency || '',
          r.current_period_start || '',
          r.current_period_end || '',
          r.created_at,
          r.canceled_at || '',
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'user',
      label: 'Customer',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={r.user?.avatar_url}
            name={`${r.user?.first_name || ''} ${r.user?.last_name || ''}`}
            size={36}
          />
          <div className="min-w-0">
            <p className="font-medium truncate">
              {r.user?.first_name} {r.user?.last_name}
            </p>
            <p className="text-xs text-muted-fg truncate">{r.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (r) => (
        <div>
          <p className="font-medium">{r.plan?.name || '—'}</p>
          <p className="text-xs text-muted-fg">
            {formatCurrency(r.plan?.price, r.plan?.currency)}/{r.plan?.interval}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge variant={statusVariant[r.status]}>{r.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'period',
      label: 'Period',
      render: (r) =>
        r.current_period_end ? (
          <div className="text-xs">
            <p className="text-muted-fg">Renews</p>
            <p className="font-medium">{formatDate(r.current_period_end)}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-fg">—</span>
        ),
    },
    {
      key: 'started',
      label: 'Started',
      render: (r) => <span className="text-xs">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (r) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewing(r); }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="All customer subscriptions across the platform"
        actions={
          <Button variant="outline" onClick={downloadCsv} disabled={!data?.items?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">MRR (page)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.mrr)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{summary.active}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Trial</p>
                <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{summary.trial}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Past due</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{summary.pastDue}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Canceled</p>
                <p className="text-2xl font-bold mt-1 text-slate-500">{summary.canceled}</p>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-b border-base">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
            <Input
              className="pl-9"
              placeholder="Customer name or email…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={data?.items}
          loading={isLoading}
          emptyTitle="No subscriptions yet"
          onRowClick={(r) => setViewing(r)}
        />

        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Subscription Details"
        size="lg"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant={statusVariant[viewing.status]} className="text-sm">
                  {viewing.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <h3 className="text-xl font-bold mt-2">{viewing.plan?.name}</h3>
                <p className="text-sm text-muted-fg">
                  {formatCurrency(viewing.plan?.price, viewing.plan?.currency)} / {viewing.plan?.interval}
                </p>
              </div>
            </div>

            <div className="border-t border-base pt-4">
              <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Customer</p>
              <div className="flex items-center gap-3">
                <Avatar
                  src={viewing.user?.avatar_url}
                  name={`${viewing.user?.first_name || ''} ${viewing.user?.last_name || ''}`}
                  size={44}
                />
                <div>
                  <p className="font-semibold">
                    {viewing.user?.first_name} {viewing.user?.last_name}
                  </p>
                  <p className="text-sm text-muted-fg">{viewing.user?.email}</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Period start</p>
                <p>{viewing.current_period_start ? formatDate(viewing.current_period_start) : '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Period end</p>
                <p>{viewing.current_period_end ? formatDate(viewing.current_period_end) : '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Started</p>
                <p>{formatDate(viewing.created_at)}</p>
              </div>
              {viewing.canceled_at && (
                <div>
                  <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Canceled at</p>
                  <p className="text-red-600 dark:text-red-400">{formatDate(viewing.canceled_at)}</p>
                </div>
              )}
              {viewing.trial_ends_at && (
                <div>
                  <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Trial ends</p>
                  <p>{formatDate(viewing.trial_ends_at)}</p>
                </div>
              )}
              {viewing.razorpay_subscription_id && (
                <div>
                  <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Razorpay ID</p>
                  <p className="font-mono text-xs">{viewing.razorpay_subscription_id}</p>
                </div>
              )}
            </div>

            {viewing.plan?.features?.length > 0 && (
              <div className="border-t border-base pt-4">
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Plan features</p>
                <ul className="space-y-1 text-sm">
                  {viewing.plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}