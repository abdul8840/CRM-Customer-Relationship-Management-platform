import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search as SearchIcon, Eye, CreditCard, IndianRupee } from 'lucide-react';
import { paymentsApi } from '@/api/endpoints';
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
  created: 'default',
  authorized: 'brand',
  captured: 'success',
  failed: 'danger',
  refunded: 'warning',
};

const STATUS_OPTIONS = ['created', 'authorized', 'captured', 'failed', 'refunded'];

const methodIcon = {
  card: '💳',
  upi: '📱',
  netbanking: '🏦',
  wallet: '👛',
  emi: '📅',
};

export default function Payments() {
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', search: '' });
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: () => paymentsApi.list(filters),
    keepPreviousData: true,
  });

  const summary = (data?.items || []).reduce(
    (acc, p) => {
      acc.total += 1;
      if (p.status === 'captured') {
        acc.captured += 1;
        acc.capturedAmount += Number(p.amount || 0);
      } else if (p.status === 'failed') {
        acc.failed += 1;
      } else if (p.status === 'refunded') {
        acc.refunded += 1;
        acc.refundedAmount += Number(p.amount || 0);
      }
      return acc;
    },
    { total: 0, captured: 0, capturedAmount: 0, failed: 0, refunded: 0, refundedAmount: 0 }
  );

  const downloadCsv = () => {
    const rows = data?.items || [];
    if (!rows.length) return;
    const headers = ['When', 'Customer', 'Email', 'Amount', 'Currency', 'Method', 'Status', 'Razorpay Payment ID', 'Razorpay Order ID'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.created_at}"`,
          `"${r.user?.first_name || ''} ${r.user?.last_name || ''}"`,
          r.user?.email || '',
          r.amount,
          r.currency,
          r.method || '',
          r.status,
          r.razorpay_payment_id || '',
          r.razorpay_order_id || '',
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'payment_id',
      label: 'Payment',
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold">
            {r.razorpay_payment_id || r.razorpay_order_id || `#${r.id}`}
          </p>
          <p className="text-xs text-muted-fg">{formatDate(r.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Customer',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={r.user?.avatar_url}
            name={`${r.user?.first_name || ''} ${r.user?.last_name || ''}`}
            size={32}
          />
          <div className="min-w-0">
            <p className="font-medium truncate">{r.user?.first_name} {r.user?.last_name}</p>
            <p className="text-xs text-muted-fg truncate">{r.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => (
        <p className="font-semibold">{formatCurrency(r.amount, r.currency)}</p>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (r) =>
        r.method ? (
          <div className="flex items-center gap-2">
            <span>{methodIcon[r.method] || '💳'}</span>
            <span className="text-sm capitalize">{r.method}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-fg">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>,
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
        title="Payments"
        subtitle="All Razorpay transactions across the platform"
        actions={
          <Button variant="outline" onClick={downloadCsv} disabled={!data?.items?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Captured (page)</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(summary.capturedAmount)}</p>
                  <p className="text-xs text-muted-fg mt-0.5">{summary.captured} transactions</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Total (page)</p>
                <p className="text-2xl font-bold mt-1">{summary.total}</p>
                <p className="text-xs text-muted-fg mt-0.5">payments shown</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Failed</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{summary.failed}</p>
                <p className="text-xs text-muted-fg mt-0.5">
                  {summary.total ? Math.round((summary.failed / summary.total) * 100) : 0}% failure rate
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Refunded</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{formatCurrency(summary.refundedAmount)}</p>
                <p className="text-xs text-muted-fg mt-0.5">{summary.refunded} transactions</p>
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
              placeholder="Customer or payment ID…"
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
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={data?.items}
          loading={isLoading}
          emptyTitle="No payments yet"
          onRowClick={(r) => setViewing(r)}
        />

        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Payment Details"
        size="lg"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant={statusVariant[viewing.status]} className="text-sm">
                  {viewing.status.toUpperCase()}
                </Badge>
                <p className="text-3xl font-bold mt-2">{formatCurrency(viewing.amount, viewing.currency)}</p>
                {viewing.method && (
                  <p className="text-sm text-muted-fg flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="capitalize">{viewing.method}</span>
                  </p>
                )}
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
                  <p className="font-semibold">{viewing.user?.first_name} {viewing.user?.last_name}</p>
                  <p className="text-sm text-muted-fg">{viewing.user?.email}</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Razorpay Payment ID</p>
                <p className="font-mono text-xs">{viewing.razorpay_payment_id || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Razorpay Order ID</p>
                <p className="font-mono text-xs">{viewing.razorpay_order_id || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Created</p>
                <p>{formatDate(viewing.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">Invoice</p>
                <p>{viewing.invoice_id ? `#${viewing.invoice_id}` : '—'}</p>
              </div>
            </div>

            {viewing.meta && Object.keys(viewing.meta).length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Razorpay metadata</p>
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto scrollbar-thin font-mono max-h-72">
                  {JSON.stringify(viewing.meta, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}