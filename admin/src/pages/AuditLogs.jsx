import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon, Download, Eye, Plus, Pencil, Trash2,
  LogIn, LogOut, RefreshCcw, Mail, Activity as ActivityIcon, ShieldAlert,
} from 'lucide-react';
import { auditApi } from '@/api/endpoints';
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
import { formatDate } from '@/lib/utils';

const actionIcon = (action = '') => {
  if (action.includes('create') || action.startsWith('register')) return { icon: Plus, color: 'text-green-600' };
  if (action.includes('update') || action.includes('edit')) return { icon: Pencil, color: 'text-blue-600' };
  if (action.includes('delete') || action.includes('remove')) return { icon: Trash2, color: 'text-red-600' };
  if (action.includes('login')) return { icon: LogIn, color: 'text-emerald-600' };
  if (action.includes('logout')) return { icon: LogOut, color: 'text-slate-600' };
  if (action.includes('refresh') || action.includes('reset')) return { icon: RefreshCcw, color: 'text-amber-600' };
  if (action.includes('email') || action.includes('otp')) return { icon: Mail, color: 'text-purple-600' };
  if (action.includes('permission') || action.includes('role')) return { icon: ShieldAlert, color: 'text-orange-600' };
  return { icon: ActivityIcon, color: 'text-slate-600' };
};

const ENTITY_OPTIONS = [
  'user', 'lead', 'deal', 'contact', 'company', 'task', 'note',
  'subscription', 'invoice', 'payment', 'ticket', 'role', 'plan',
];

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 30,
    search: '',
    entity: '',
    user_id: '',
    from: '',
    to: '',
  });
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', filters],
    queryFn: () => auditApi.list(filters),
    keepPreviousData: true,
  });

  const downloadCsv = () => {
    const rows = data?.items || [];
    if (!rows.length) return;
    const headers = ['When', 'User', 'Email', 'Action', 'Entity', 'Entity ID', 'IP', 'Meta'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.created_at}"`,
          `"${r.user?.first_name || ''} ${r.user?.last_name || ''}"`,
          r.user?.email || '',
          r.action,
          r.entity || '',
          r.entity_id || '',
          r.ip_address || '',
          `"${JSON.stringify(r.meta || {}).replace(/"/g, "'")}"`,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
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
            {new Date(r.created_at).toLocaleDateString([], { year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Actor',
      render: (r) =>
        r.user ? (
          <div className="flex items-center gap-3">
            <Avatar
              src={r.user.avatar_url}
              name={`${r.user.first_name || ''} ${r.user.last_name || ''}`}
              size={32}
            />
            <div className="min-w-0">
              <p className="font-medium truncate">
                {r.user.first_name} {r.user.last_name}
              </p>
              <p className="text-xs text-muted-fg truncate">{r.user.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-fg italic">System</span>
        ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (r) => {
        const { icon: Icon, color } = actionIcon(r.action);
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <Badge variant="brand">{r.action}</Badge>
          </div>
        );
      },
    },
    {
      key: 'entity',
      label: 'Target',
      render: (r) =>
        r.entity ? (
          <div>
            <p className="text-sm font-medium capitalize">{r.entity}</p>
            <p className="text-xs text-muted-fg font-mono">#{r.entity_id}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-fg">—</span>
        ),
    },
    {
      key: 'ip',
      label: 'IP',
      render: (r) => <span className="font-mono text-xs">{r.ip_address || '—'}</span>,
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
        title="Audit Logs"
        subtitle="Complete activity trail across the entire platform"
        actions={
          <Button variant="outline" onClick={downloadCsv} disabled={!data?.items?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Total events</p>
                <p className="text-2xl font-bold mt-1">{data?.meta?.total ?? 0}</p>
                <p className="text-xs text-muted-fg mt-0.5">across all time</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">On this page</p>
                <p className="text-2xl font-bold mt-1">{data?.items?.length ?? 0}</p>
                <p className="text-xs text-muted-fg mt-0.5">events shown</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Unique actors</p>
                <p className="text-2xl font-bold mt-1">
                  {new Set((data?.items || []).map((r) => r.user_id).filter(Boolean)).size}
                </p>
                <p className="text-xs text-muted-fg mt-0.5">on this page</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-fg uppercase tracking-wide">Action types</p>
                <p className="text-2xl font-bold mt-1">
                  {new Set((data?.items || []).map((r) => r.action)).size}
                </p>
                <p className="text-xs text-muted-fg mt-0.5">distinct actions</p>
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
              placeholder="Search action or entity…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          <Select
            value={filters.entity}
            onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value, page: 1 }))}
          >
            <option value="">All entities</option>
            {ENTITY_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
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
          emptyTitle="No audit events yet"
          emptyDescription="Privileged actions will appear here automatically"
          onRowClick={(r) => setViewing(r)}
        />

        <Pagination meta={data?.meta} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Audit Event Detail"
        size="lg"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              {(() => {
                const { icon: Icon, color } = actionIcon(viewing.action);
                return (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                );
              })()}
              <div className="flex-1">
                <Badge variant="brand" className="text-sm">{viewing.action}</Badge>
                <p className="text-sm text-muted-fg mt-2">
                  {formatDate(viewing.created_at, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Actor</p>
                {viewing.user ? (
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={viewing.user.avatar_url}
                      name={`${viewing.user.first_name || ''} ${viewing.user.last_name || ''}`}
                      size={36}
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {viewing.user.first_name} {viewing.user.last_name}
                      </p>
                      <p className="text-xs text-muted-fg">{viewing.user.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-fg">System / Automated</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Target Entity</p>
                {viewing.entity ? (
                  <>
                    <p className="font-medium capitalize">{viewing.entity}</p>
                    <p className="text-xs text-muted-fg font-mono">ID #{viewing.entity_id}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-fg">No entity</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">IP Address</p>
                <p className="font-mono text-sm">{viewing.ip_address || '—'}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Event ID</p>
                <p className="font-mono text-sm">#{viewing.id}</p>
              </div>
            </div>

            {viewing.meta && Object.keys(viewing.meta).length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-fg font-medium tracking-wide mb-2">Metadata</p>
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