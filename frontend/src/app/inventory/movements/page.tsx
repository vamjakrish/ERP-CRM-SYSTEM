'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, User } from 'lucide-react';
import api from '../../../utils/api';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../../../components/erp-ui';

interface Movement {
  id: number;
  productId: number;
  product: { name: string; sku: string };
  quantity: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  creator: { username: string; role: string };
  createdAt: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ApiListResponse<Movement>>(`/movements?page=${page}&limit=20`) as unknown as ApiListResponse<Movement>;
        if (res.success) {
          setMovements(res.data);
          setMeta(res.meta);
        }
      } catch (error: unknown) {
        console.error('Failed to load movements', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve stock movement logs.');
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  if (loading) return <LoadingState title="Loading movements" description="Fetching IN and OUT inventory events." />;
  if (error) return <ErrorState title="Movement log unavailable" description={error} action={{ label: 'Retry', href: '/inventory/movements' }} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements"
        description="Audit trail of inventory increases, deductions, and manual corrections."
      />

      {movements.length === 0 ? (
        <EmptyState
          title="No stock movements"
          description="Movement logs will appear here as products are received, adjusted, or shipped."
          action={{ label: 'Open products', href: '/products' }}
        />
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <div className="min-w-270 table-shell rounded-2xl">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const isIn = movement.movementType === 'IN';
                    return (
                      <tr key={movement.id}>
                        <td className="whitespace-nowrap text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {new Date(movement.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-slate-900">{movement.product.name}</div>
                        </td>
                        <td className="font-mono text-sm text-slate-600">{movement.product.sku}</td>
                        <td>
                          <StatusBadge variant={isIn ? 'success' : 'danger'}>
                            <span className="inline-flex items-center gap-1">
                              {isIn ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                              {movement.movementType}
                            </span>
                          </StatusBadge>
                        </td>
                        <td className={`font-semibold ${isIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIn ? '+' : '-'}{movement.quantity}
                        </td>
                        <td className="max-w-[320px] truncate text-slate-600" title={movement.reason}>{movement.reason}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-900">{movement.creator.username}</div>
                              <div className="text-xs text-slate-500">{movement.creator.role}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <div>
            Showing page {meta.page} of {meta.totalPages} · {meta.total} movements
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page === 1} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-ring">
              Previous
            </button>
            <button onClick={() => setPage((value) => Math.min(value + 1, meta.totalPages))} disabled={page === meta.totalPages} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-ring">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
