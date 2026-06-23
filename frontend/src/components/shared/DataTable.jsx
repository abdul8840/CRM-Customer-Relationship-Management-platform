import { Skeleton } from '@/components/ui/Skeleton';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';

export const DataTable = ({ columns, rows, loading, emptyTitle = 'No records', rowKey = 'id', onRowClick }) => {
  if (loading) return (
    <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  );
  if (!rows?.length) return <EmptyState title={emptyTitle} />;
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <Table>
        <Thead><tr>{columns.map((c) => <Th key={c.key} className={c.className}>{c.label}</Th>)}</tr></Thead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row[rowKey]} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
              {columns.map((c) => <Td key={c.key} className={c.className}>{c.render ? c.render(row) : row[c.key] ?? '—'}</Td>)}
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};