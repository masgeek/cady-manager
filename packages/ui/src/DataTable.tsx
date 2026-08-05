import React from 'react';
import type { Column } from './types';

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  getRowId: (row: T) => string;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  page = 0,
  pageSize = 20,
  totalCount,
  onPageChange,
}: DataTableProps<T>) {
  const totalPages = totalCount !== undefined ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead className="table-light">
            <tr>
              {columns.map((col) => (
                <th key={String(col.field)} scope="col">
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-3">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowId(row)}>
                  {columns.map((col) => (
                    <td key={String(col.field)}>
                      {col.render
                        ? col.render(row[col.field as keyof T], row)
                        : String(row[col.field as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalCount !== undefined && onPageChange && totalPages > 1 && (
        <nav>
          <ul className="pagination pagination-sm justify-content-center mb-0 mt-2">
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link" aria-label="Previous page" onClick={() => onPageChange(page - 1)}>Previous</button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
                <button className="page-link" aria-label={`Page ${i + 1}`} onClick={() => onPageChange(i)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link" aria-label="Next page" onClick={() => onPageChange(page + 1)}>Next</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
