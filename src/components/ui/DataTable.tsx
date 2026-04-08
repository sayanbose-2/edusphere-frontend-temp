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
  return item.id ?? item.auditId ?? item.notificationId ?? item.projectID ?? item.studentDocumentId ?? String(i);
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <span className="skeleton" style={{ width: j === 0 ? '60%' : j % 2 === 0 ? '80%' : '45%', display: 'block' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T>({ columns, data, loading, searchable = true, onRowClick, actions }: Props<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(item =>
      columns.some(col => String((item as Record<string, unknown>)[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [data, columns, search]);

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
          <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading…' : filtered.length !== data.length
              ? `${filtered.length} of ${data.length}`
              : `${data.length} record${data.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      <Table hover responsive className="mb-0">
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
            {actions && <th style={{ width: 1 }}>Actions</th>}
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
                style={onRowClick ? { cursor: 'pointer' } : undefined}
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
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 4 }}>{actions(item)}</div>
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
