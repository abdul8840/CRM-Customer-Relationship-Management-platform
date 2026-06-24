import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, FileText, Eye, Search as SearchIcon } from 'lucide-react';
import { invoicesApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusVariant = {
  draft: 'default',
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'purple',
};

const statusOptions = ['draft', 'pending', 'paid', 'failed', 'refunded'];

export default function Invoices() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    from: '',
    to: '',
  });
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-invoices', filters],
    queryFn: () => invoicesApi.list(filters),
    keepPreviousData: true,
  });

  // ── Summary cards (computed from current page; for true totals use a separate API) ──
  const summary = (data?.items || []).reduce(
    (acc, inv) => {
      acc.total += 1;
      acc.totalAmount += Number(inv.total || 0);
      if (inv.status === 'paid') {
        acc.paid += 1;
        acc.paidAmount += Number(inv.total || 0);
      } else if (inv.status === 'pending') {
        acc.pending += 1;
        acc.pendingAmount += Number(inv.total || 0);
      } else if (inv.status === 'failed') {
        acc.failed += 1;
      }
      return acc;
    },
    { total: 0, totalAmount: 0, paid: 0, paidAmount: 0, pending: 0, pendingAmount: 0, failed: 0 }
  );

  const downloadCsv = () => {
    const rows = data?.items || [];
    if (!rows.length) return;
    const headers = ['Invoice #', 'Customer', 'Email', 'Amount', 'Tax', 'Total', 'Currency', 'Status', 'Due Date', 'Paid At', 'Created'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.invoice_number,
          `"${r.user?.first_name || ''} ${r.user?.last_name || ''}"`,
          r.user?.email || '',
          r.amount,
          r.tax,
          r.total,
          r.currency,
          r.status,
          r.due_date || '',
          r.paid_at || '',
          r.created_at,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-mono text-xs font-semibold">{r.invoice_number}</p>
            <p className="text-xs text-muted-fg">{formatDate(r.created_at)}</p>
          </div>
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
            <p className="font-medium truncate">
              {r.user?.first_name} {r.user?.last_name}
            </p>
            <p className="text-xs text-muted-fg truncate">{r.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Amount',
      render: (r) => (
        <div>
          <p className="font-semibold">{formatCurrency(r.total, r.currency)}</p>
          {Number(r.tax) > 0 && (
            <p className="text-xs text-muted-fg">incl. tax {formatCurrency(r.tax, r.currency)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'due_date',
      label: 'Due / Paid',
      render: (r) => (
        <div className="text-xs">
          {r.paid_at ? (
            <>
              <p className="text-green-600 dark:text-green-400 font-medium">Paid</p>
              <p className="text-muted-fg">{formatDate(r.paid_at)}</p>
            </>
          ) : r.due_date ? (
            <>
              <p>Due</p>
              <p className="text-muted-fg">{formatDate(r.due_date)}</p>
            </>
          ) : (
            <span className="text-muted-fg">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" title="View" onClick={() => setViewing(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          {r.pdf_url && (
            <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" title="Download PDF">
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4 text-blue-600" />
              </Button>
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="All customer invoices across the platform"
        actions={
          <Button variant="outline" onClick={downloadCsv} disabled={!data?.items?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
          : (
            <>
              <Card>
                <CardBody>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Total Invoices</p>
                  <p className="text-2xl font-bold mt-1">{data?.meta?.total ?? summary.total}</p>
                  <p className="text-xs text-muted-fg mt-0.5">on this page: {summary.total}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Paid (page)</p>
                  <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                    {formatCurrency(summary.paidAmount)}
                  </p>
                  <p className="text-xs text-muted-fg mt-0.5">{summary.paid} invoices</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Pending (page)</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                    {formatCurrency(summary.pendingAmount)}
                  </p>
                  <p className="text-xs text-muted-fg mt-0.5">{summary.pending} invoices</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Failed (page)</p>
                  <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{summary.failed}</p>
                  <p className="text-xs text-muted-fg mt-0.5">need attention</p>
                </CardBody>
              </Card>
            </>
          )}
      </div>

      {/* Table */}
      <Card>
        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-base">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
            <Input
              className="pl-9"
              placeholder="Invoice # or customer…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            placeholder="From"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
          />
          <Input
            type="date"
            placeholder="To"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
          />
        </div>

        <DataTable
          columns={columns}
          rows={data?.items}
          loading={isLoading}
          emptyTitle="No invoices yet"
          onRowClick={(r) => setViewing(r)}
        />

        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>

      {/* Invoice detail modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Invoice ${viewing.invoice_number}` : ''}
        size="lg"
        footer={
          viewing && (
            <>
              <Button variant="outline" onClick={() => setViewing(null)}>
                Close
              </Button>
              {viewing.pdf_url && (
                <a href={viewing.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Button>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </a>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-6">
            {/* Status header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-fg">Status</p>
                <Badge variant={statusVariant[viewing.status]} className="mt-1 text-sm px-3 py-1">
                  {viewing.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-fg">Total</p>
                <p className="text-3xl font-bold">{formatCurrency(viewing.total, viewing.currency)}</p>
              </div>
            </div>

            <div className="border-t border-base" />

            {/* Customer */}
            <div>
              <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">
                Bill To
              </p>
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

            {/* Amount breakdown */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-fg">Subtotal</span>
                <span>{formatCurrency(viewing.amount, viewing.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-fg">Tax</span>
                <span>{formatCurrency(viewing.tax || 0, viewing.currency)}</span>
              </div>
              <div className="border-t border-base pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(viewing.total, viewing.currency)}</span>
              </div>
            </div>

            {/* Meta info */}
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">
                  Invoice number
                </p>
                <p className="font-mono">{viewing.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">
                  Currency
                </p>
                <p>{viewing.currency}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">
                  Created
                </p>
                <p>{formatDate(viewing.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">
                  Due date
                </p>
                <p>{viewing.due_date ? formatDate(viewing.due_date) : '—'}</p>
              </div>
              {viewing.paid_at && (
                <div>
                  <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">
                    Paid at
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    {formatDate(viewing.paid_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {viewing.razorpay_invoice_id && (
                <div>
                  <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-1">
                    Razorpay ID
                  </p>
                  <p className="font-mono text-xs">{viewing.razorpay_invoice_id}</p>
                </div>
              )}
            </div>

            {/* PDF link */}
            {viewing.pdf_url && (
              <div className="border-t border-base pt-4">
                <a
                  href={viewing.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[rgb(var(--primary))] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open invoice PDF in new tab
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}