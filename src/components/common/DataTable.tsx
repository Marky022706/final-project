// src/components/common/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Info } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchField?: keyof T | ((row: T) => string);
  initialSortKey?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[], selectedRows: T[]) => void;
  rowIdKey?: string;
  toolbarSlot?: React.ReactNode;
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchField,
  initialSortKey = '',
  emptyMessage = 'No records found in our library registers.',
  itemsPerPage = 10,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  rowIdKey = 'id',
  toolbarSlot,
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filter Data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      if (typeof searchField === 'function') {
        return searchField(row).toLowerCase().includes(query);
      }
      if (searchField && typeof row[searchField] === 'string') {
        return (row[searchField] as string).toLowerCase().includes(query);
      }
      
      // Fuzzy search across all string attributes if searchField is not defined
      return Object.values(row).some((val) => 
        val !== null && typeof val === 'string' && val.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery, searchField]);

  // 2. Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Handle functional or nested values
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortKey, sortOrder]);

  // 3. Paginate Data
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Selection handlers
  const filteredRowIds = useMemo(() => {
    return filteredData.map(r => r[rowIdKey]);
  }, [filteredData, rowIdKey]);

  const isAllSelected = useMemo(() => {
    if (filteredRowIds.length === 0) return false;
    return filteredRowIds.every(id => selectedIds.includes(id));
  }, [filteredRowIds, selectedIds]);

  const isSomeSelected = useMemo(() => {
    if (filteredRowIds.length === 0) return false;
    const count = filteredRowIds.filter(id => selectedIds.includes(id)).length;
    return count > 0 && count < filteredRowIds.length;
  }, [filteredRowIds, selectedIds]);

  const handleToggleSelectAll = () => {
    if (!onSelectionChange) return;

    if (isAllSelected) {
      // Deselect all filtered items (keep any outside current filter if desired, or clear all)
      const remainingIds = selectedIds.filter(id => !filteredRowIds.includes(id));
      const remainingRows = data.filter(r => remainingIds.includes(r[rowIdKey]));
      onSelectionChange(remainingIds, remainingRows);
    } else {
      // Select all filtered items
      const mergedIds = Array.from(new Set([...selectedIds, ...filteredRowIds]));
      const selectedRows = data.filter(r => mergedIds.includes(r[rowIdKey]));
      onSelectionChange(mergedIds, selectedRows);
    }
  };

  const handleToggleRow = (row: T) => {
    if (!onSelectionChange) return;

    const rowId = row[rowIdKey];
    let newSelectedIds: (string | number)[];

    if (selectedIds.includes(rowId)) {
      newSelectedIds = selectedIds.filter(id => id !== rowId);
    } else {
      newSelectedIds = [...selectedIds, rowId];
    }

    const newSelectedRows = data.filter(r => newSelectedIds.includes(r[rowIdKey]));
    onSelectionChange(newSelectedIds, newSelectedRows);
  };

  const startOffset = (currentPage - 1) * itemsPerPage + 1;
  const endOffset = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-4">
      {/* Search and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-sm placeholder-slate-400 text-slate-800 dark:text-slate-100 shadow-xs"
          />
        </div>

        {toolbarSlot && (
          <div className="flex items-center gap-2">
            {toolbarSlot}
          </div>
        )}
      </div>

      {/* Main Table view */}
      <div className="overflow-visible border border-slate-100 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-colors"
                        title={isAllSelected ? 'Deselect all books' : 'Select all books'}
                        aria-label="Select all books"
                      />
                    </div>
                  </th>
                )}
                {columns.map((col, idx) => {
                  const isSortable = col.sortable !== false && typeof col.accessor === 'string';
                  const key = (col.sortKey || col.accessor) as string;
                  const isSortedActive = sortKey === key;
                  
                  return (
                    <th
                      key={idx}
                      onClick={() => isSortable && handleSort(key)}
                      className={`px-6 py-4 font-bold tracking-tight text-xs uppercase leading-none ${
                        isSortable ? 'cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50' : ''
                      } ${col.className || ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.header}</span>
                        {isSortable && isSortedActive && (
                          sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-emerald-600" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        {isSortable && !isSortedActive && (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-300 opacity-0 hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 bg-white/40 dark:bg-slate-900/40">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={selectable ? columns.length + 1 : columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Info className="h-9 w-9 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-semibold">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => {
                  const rowId = row[rowIdKey];
                  const isSelected = selectedIds.includes(rowId);

                  return (
                    <tr 
                      key={rowId || rowIdx} 
                      className={`transition-colors duration-150 ${
                        isSelected 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50' 
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {selectable && (
                        <td className="w-12 px-4 py-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(row)}
                              className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-colors"
                              aria-label={`Select book ${row.title || rowId}`}
                            />
                          </div>
                        </td>
                      )}
                      {columns.map((col, colIdx) => {
                        let cellVal: React.ReactNode;
                        if (typeof col.accessor === 'function') {
                          cellVal = col.accessor(row);
                        } else {
                          cellVal = row[col.accessor as string] as React.ReactNode;
                        }

                        return (
                          <td key={colIdx} className={`px-6 py-4 font-medium align-middle ${col.className || ''}`}>
                            {cellVal}
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

        {/* Paginated Footer */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Showing <span className="text-slate-800 dark:text-slate-200">{startOffset}</span> to <span className="text-slate-800 dark:text-slate-200">{endOffset}</span> of <span className="text-slate-800 dark:text-slate-200">{totalItems}</span> records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Prev
              </button>
              <span className="font-semibold text-slate-500 dark:text-slate-400 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
