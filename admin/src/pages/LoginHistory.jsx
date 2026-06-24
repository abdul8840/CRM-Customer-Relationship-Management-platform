import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Download, Monitor, Smartphone, Globe, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { loginHistoryApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const reasonLabels = {
  user_not_found: 'User not found',
  wrong_password: 'Wrong password',
  account_suspended: 'Account suspended',
  account_pending: 'Email not verified',
  rate_limited: 'Too many attempts',
};

// Detect device type from user agent string
const parseUserAgent = (ua = '') => {
  if (/mobile|android|iphone|ipod/i.test(ua)) return { type: 'mobile', icon: Smartphone };
  if (/tablet|ipad/i.test(ua)) return { type: 'tablet', icon: Smartphone };
  if (/postman|curl|axios|fetch/i.test(ua)) return { type: 'api', icon: Globe };
  return { type: 'desktop', icon: Monitor };
};

const parseBrowser = (ua = '') => {
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  if (/opera|opr/i.test(ua)) return 'Opera';
  if (/postman/i.test(ua)) return 'Postman';
  if (/curl/i.test(ua)) return 'cURL';
  return 'Unknown';
};

const parseOS = (ua = '') => {
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os|macintosh/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return '—';
};

export default function LoginHistory() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    status: '',
    search: '',
    from: '',
    to: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-login-history', filters],
    queryFn: () => loginHistoryApi.list(filters),
    keepPreviousData: true,
    refetchInterval: 30_000, // live-ish: refresh every 30s
  });

  // Compute summary stats from page
  const summary = (data?.items || []).reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === 'success') acc.success += 1;
      else acc.failed += 1;
      acc.uniqueIps.add(row.ip_address);
      acc.uniqueUsers.add(row.user_id);
      return acc;
    },
    { total: 0, success: 0, failed: 0, uniqueIps: new Set(), uniqueUsers: new Set() }
  );

  const downloadCsv = () => {
    const rows = data?.items || [];
    if (!rows.length) return;
    const headers = ['When', 'User', 'Email', 'Status', 'Reason', 'IP', 'Browser', 'OS', 'Device', 'User Agent'];
    const csv = [
      headers.join(','),
      ...rows.map((r) => {
        const ua = r.user_agent || '';
        return [
          `"${r.created_at}"`,
          `"${r.user?.first_name || ''} ${r.user?.last_name || ''}"`,
          r.user?.email || '',
          r.status,
          r.reason || '',
          r.ip_address || '',
          parseBrowser(ua),
          parseOS(ua),
          parseUserAgent(ua).type,
          `"${ua.replace(/"/g, "'")}"`,
        ].join(',');
      }),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'when',
      label: 'When',
      render: (r) => (
        <div>
          <p className="text-sm font-medium">
            {formatDate(r.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-muted-fg">
            {new Date(r.created_at).toLocaleTimeString([], { second: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={r.user?.avatar_url}
            name={`${r.user?.first_name || ''} ${r.user?.last_name || ''}`}
            size={32}
          />
          <div className="min-w-0">
            <p className="font-medium truncate">
              {r.user?.first_name} {r.user?.last_name || ''}
            </p>
            <p className="text-xs text-muted-fg truncate">{r.user?.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) =>
        r.status === 'success' ? (
          <Badge variant="success" className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Success
          </Badge>
        ) : (
          <Badge variant="danger" className="inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (r) =>
        r.reason ? (
          <span className="text-xs text-muted-fg">{reasonLabels[r.reason] || r.reason}</span>
        ) : (
          <span className="text-xs text-muted-fg">—</span>
        ),
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (r) => (
        <span className="font-mono text-xs">{r.ip_address || '—'}</span>
      ),
    },
    {
      key: 'device',
      label: 'Device',
      render: (r) => {
        const ua = r.user_agent || '';
        const { icon: Icon } = parseUserAgent(ua);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-fg flex-shrink-0" />
            <div>
              <p className="text-xs font-medium">{parseBrowser(ua)}</p>
              <p className="text-[10px] text-muted-fg">{parseOS(ua)}</p>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Login History"
        subtitle="Track every authentication attempt across the platform"
        actions={
          <Button variant="outline" onClick={downloadCsv} disabled={!data?.items?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Total (page)</p>
                  <p className="text-2xl font-bold mt-1">{summary.total}</p>
                  <p className="text-xs text-muted-fg mt-0.5">of {data?.meta?.total ?? 0} overall</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Successful</p>
                  <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{summary.success}</p>
                  <p className="text-xs text-muted-fg mt-0.5">
                    {summary.total ? Math.round((summary.success / summary.total) * 100) : 0}% rate
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Failed</p>
                  <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{summary.failed}</p>
                  <p className="text-xs text-muted-fg mt-0.5">attempts blocked</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-fg uppercase tracking-wide">Unique IPs / Users</p>
                  <p className="text-2xl font-bold mt-1">
                    {summary.uniqueIps.size} <span className="text-base text-muted-fg">/</span> {summary.uniqueUsers.size}
                  </p>
                  <p className="text-xs text-muted-fg mt-0.5">on this page</p>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-base">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
            <Input
              className="pl-9"
              placeholder="Email or IP…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            <option value="success">Success only</option>
            <option value="failed">Failed only</option>
          </Select>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
          />
        </div>

        <DataTable
          columns={columns}
          rows={data?.items}
          loading={isLoading}
          emptyTitle="No login attempts recorded"
          emptyDescription="Login activity will appear here as users sign in"
        />

        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>
    </>
  );
}