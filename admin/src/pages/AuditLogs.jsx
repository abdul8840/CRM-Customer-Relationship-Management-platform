// AuditLogs.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Searchbar } from '@/components/shared/Searchbar';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';

export default function AuditLogs() {
  const [filters, setFilters] = useState({ page: 1, limit: 30, search: '' });
  const { data, isLoading } = useQuery({ queryKey: ['audit', filters], queryFn: () => auditApi.list(filters) });
  const columns = [
    { key: 'when', label: 'When', render: (r) => formatDate(r.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
    { key: 'who', label: 'Who', render: (r) => r.user ? `${r.user.first_name} ${r.user.last_name}` : '—' },
    { key: 'action', label: 'Action', render: (r) => <Badge variant="brand">{r.action}</Badge> },
    { key: 'entity', label: 'Entity', render: (r) => r.entity ? `${r.entity}#${r.entity_id}` : '—' },
    { key: 'ip_address', label: 'IP' },
  ];
  return (
    <>
      <PageHeader title="Audit Logs" subtitle="All system activity" />
      <Card>
        <div className="p-4 border-b border-base"><Searchbar value={filters.search} onChange={(v) => setFilters({ ...filters, search: v, page: 1 })} /></div>
        <DataTable columns={columns} rows={data?.items} loading={isLoading} />
        <Pagination meta={data?.meta} onPage={(p) => setFilters({ ...filters, page: p })} />
      </Card>
    </>
  );
}