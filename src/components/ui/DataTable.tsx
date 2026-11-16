import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
  skeletonRowCount?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  isLoading = false,
  emptyState,
  onRowClick,
  className,
  skeletonRowCount = 5,
}: DataTableProps<T>) {
  const getSortIcon = (colKey: string) => {
    if (sortColumn !== colKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-ink-subtle opacity-50 group-hover:opacity-100" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 ml-1 text-brand-primary" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 ml-1 text-brand-primary" />;
  };

  const getAriaSort = (colKey: string): React.AriaAttributes['aria-sort'] => {
    if (sortColumn !== colKey) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div
      className={cn(
        'w-full overflow-hidden border border-app-border rounded-card bg-app-surface shadow-card',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-body-default">
          <thead className="bg-app-surface-muted border-b border-app-border sticky top-0 z-10">
            <tr>
              {columns.map((col) => {
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortable ? getAriaSort(col.key) : undefined}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider select-none whitespace-nowrap',
                      alignClass
                    )}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="group inline-flex items-center font-semibold text-ink-muted hover:text-ink focus:outline-none transition-colors"
                      >
                        <span>{col.header}</span>
                        {getSortIcon(col.key)}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/70 text-ink">
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-3/4 rounded-control" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-ink-muted">
                  {emptyState || 'No records found.'}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => {
                const key = keyExtractor(item, rowIdx);
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={key}
                    onClick={() => isClickable && onRowClick?.(item)}
                    className={cn(
                      'transition-colors duration-150',
                      isClickable && 'cursor-pointer hover:bg-app-surface-muted/50',
                      !isClickable && 'hover:bg-app-surface-muted/30'
                    )}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <td
                          key={col.key}
                          className={cn('px-4 py-3.5 align-middle text-small-text', alignClass)}
                        >
                          {col.render
                            ? col.render(item, rowIdx)
                            : (item as Record<string, unknown>)[col.key] != null
                            ? String((item as Record<string, unknown>)[col.key])
                            : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

