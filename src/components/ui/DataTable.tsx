import { useState, useMemo } from 'react';
import { Table, Spinner } from 'react-bootstrap';
import { BsSearch, BsInboxFill } from 'react-icons/bs';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRowKey(item: any, index: number): string {
  if (typeof item.id === 'string') return item.id;
  if (typeof item.auditId === 'string') return item.auditId;
  if (typeof item.notificationId === 'string') return item.notificationId;
  if (typeof item.projectID === 'string') return item.projectID;
  if (typeof item.studentDocumentId === 'string') return item.studentDocumentId;
  return String(index);
}

export function DataTable<T>({
  columns,
  data,
  loading,
  searchable = true,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = (item as Record<string, unknown>)[col.key];
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, columns, search]);

  if (loading) {
    return (
      <div className="table-wrap">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
          <Spinner animation="border" style={{ color: 'var(--accent)', width: 28, height: 28, borderWidth: 2 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      {searchable && data.length > 0 && (
        <div className="datatable-toolbar">
          <div style={{ position: 'relative' }}>
            <BsSearch
              size={12}
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="datatable-search-input"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 28 }}
            />
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length !== data.length
              ? `${filtered.length} of ${data.length} records`
              : `${data.length} record${data.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BsInboxFill size={22} />
          </div>
          <p className="empty-state-text mb-0">
            {search ? 'No results match your search' : 'No records found'}
          </p>
          {search && (
            <p className="empty-state-sub mb-0">Try a different search term</p>
          )}
        </div>
      ) : (
        <Table hover responsive className="mb-0">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {actions && <th style={{ width: 1, whiteSpace: 'nowrap' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                onClick={() => onRowClick?.(item)}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(item)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      : String(((item as any)[col.key]) ?? '')}
                  </td>
                ))}
                {actions && (
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="d-flex gap-1">{actions(item)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default DataTable;
