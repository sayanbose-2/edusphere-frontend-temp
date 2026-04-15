import { useState, useMemo } from 'react';
import { Table } from 'react-bootstrap';
import { BsSearch, BsInbox } from 'react-icons/bs';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowKey(item: any, i: number): string {
  return item.id ?? item.auditId ?? item.notificationId ?? item.studentDocumentId ?? String(i);
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <span className={`skeleton block ${j === 0 ? 'w-3/5' : j % 2 === 0 ? 'w-4/5' : 'w-2/5'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T>({ columns, data, loading, searchable = true, onRowClick, actions }: Props<T>) {
  const [search, setSearch] = useState('');

  const safeData = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return safeData;
    const q = search.toLowerCase();
    return safeData.filter(item =>
      columns.some(col => String((item as Record<string, unknown>)[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [safeData, columns, search]);

  const colCount = columns.length + (actions ? 1 : 0);

  return (
    <div className="table-wrap">
      {searchable && (
        <div className="datatable-toolbar">
          <div className="search-wrap">
            <BsSearch size={11} className="search-icon" />
            <input
              className="datatable-search-input"
              placeholder="Search records…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <span className="text-xs text-tertiary whitespace-nowrap">
            {loading ? 'Loading…' : filtered.length !== safeData.length
              ? `${filtered.length} of ${safeData.length}`
              : `${safeData.length} record${safeData.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      <Table hover responsive className="mb-0">
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
            {actions && <th className="w-1">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows cols={colCount} />
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={colCount}>
                <div className="empty-state">
                  <BsInbox size={32} />
                  <p className="empty-state-title">
                    {search ? 'No results found' : 'No records yet'}
                  </p>
                  {search && <p className="empty-state-sub">Try adjusting your search</p>}
                </div>
              </td>
            </tr>
          ) : (
            filtered.map((item, i) => (
              <tr
                key={rowKey(item, i)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(item)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap">
                    <div className="flex gap-1">{actions(item)}</div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default DataTable;
