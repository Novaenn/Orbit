import { mdiArrowDown, mdiArrowUp, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js'
import { useState, type ReactNode } from 'react'
import { IconButton } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'
import { Menu } from './Menu'

export type SortDir = 'asc' | 'desc'

export interface Column<T> {
  key: string
  header: string
  numeric?: boolean
  sortable?: boolean
  /** Extra classes for both header and cells, e.g. responsive visibility. */
  className?: string
  cell: (row: T) => ReactNode
}

/** Material data table: 56dp header row, 52dp rows, sortable column headers. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  label,
  onRowClick,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: { key: string; dir: SortDir }
  onSort?: (key: string) => void
  label: string
  /** Makes the row clickable. Buttons and links inside the row keep their own behaviour. */
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" aria-label={label}>
        <thead>
          <tr className="h-14 border-b border-on-surface/12">
            {columns.map((c) => {
              const active = sort?.key === c.key
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cx(
                    'type-subtitle2 px-4 whitespace-nowrap text-on-surface/87',
                    c.numeric ? 'text-right' : 'text-left',
                    c.className,
                  )}
                >
                  {c.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={cx(
                        'group inline-flex items-center gap-1 rounded hover:text-on-surface focus-visible:underline',
                        c.numeric && 'flex-row-reverse',
                      )}
                    >
                      {c.header}
                      <Icon
                        path={active && sort!.dir === 'asc' ? mdiArrowUp : mdiArrowDown}
                        size={18}
                        className={cx(
                          'transition-opacity',
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-38 group-focus-visible:opacity-38',
                        )}
                      />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={
                onRowClick &&
                ((e) => {
                  if (!(e.target as HTMLElement).closest('button, a')) onRowClick(row)
                })
              }
              className={cx(
                'h-[52px] border-b border-on-surface/12 transition-colors duration-150 hover:bg-on-surface/4',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cx(
                    'type-body2 px-4 text-on-surface/87',
                    c.numeric && 'text-right whitespace-nowrap tabular-nums',
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Pagination controls placed below a table or list. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div className="type-caption flex min-h-[52px] flex-wrap items-center justify-end gap-x-2 px-2 text-on-surface/60">
      {pageSizeOptions && onPageSizeChange && (
        <div className="hidden items-center gap-1 sm:flex">
          <span>Rows per page:</span>
          <Menu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            label="Rows per page"
            placement="above"
            items={pageSizeOptions.map((size) => ({
              label: String(size),
              selected: size === pageSize,
              onSelect: () => onPageSizeChange(size),
            }))}
            trigger={
              <button
                type="button"
                data-ripple
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Rows per page: ${pageSize}`}
                onClick={() => setMenuOpen((o) => !o)}
                className="state-layer type-caption flex h-10 items-center gap-0.5 rounded pr-1 pl-2 text-on-surface/87"
              >
                {pageSize}
                <Icon path={mdiMenuDown} className="text-on-surface/60" />
              </button>
            }
          />
        </div>
      )}
      <span className="mx-3 tabular-nums" aria-live="polite">
        {from}–{to} of {total}
      </span>
      <IconButton
        icon={mdiChevronLeft}
        label="Previous page"
        tooltip={false}
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="text-on-surface/60"
      />
      <IconButton
        icon={mdiChevronRight}
        label="Next page"
        tooltip={false}
        disabled={to >= total}
        onClick={() => onPageChange(page + 1)}
        className="text-on-surface/60"
      />
    </div>
  )
}
