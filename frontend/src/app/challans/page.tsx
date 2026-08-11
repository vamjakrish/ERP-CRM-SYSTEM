'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../../components/erp-ui';

interface Challan {
  id: number;
  challanNumber: string;
  customer: { name: string; businessName: string };
  totalQuantity: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
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

export default function ChallansPage() {
  const { hasRole } = useAuth();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        let query = `/challans?page=${page}&limit=10`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (statusFilter) query += `&status=${statusFilter}`;

        const res = await api.get<ApiListResponse<Challan>>(query) as unknown as ApiListResponse<Challan>;
        if (res.success) {
          setChallans(res.data);
          setMeta(res.meta);
        }
      } catch (error: unknown) {
        console.error('Failed to load challans', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve sales challans.');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, search, statusFilter]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
  };

  const badgeVariant = (status: Challan['status']) => {
    if (status === 'Confirmed') return 'success';
    if (status === 'Draft') return 'neutral';
    return 'danger';
  };

  if (loading) return <LoadingState title="Loading challans" description="Fetching dispatch documents and status records." />;
  if (error) return <ErrorState title="Challan register unavailable" description={error} action={{ label: 'Retry', href: '/challans' }} />;

  const actions = hasRole(['ADMIN', 'SALES']) ? (
    <Link href="/challans/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring">
      <Plus className="h-4 w-4" />
      Create challan
    </Link>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Challans"
        description="Draft, confirm, and review customer dispatch documents."
        actions={actions}
      />

      <SectionCard>
        <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1.2fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by challan number or customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-9 py-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </form>
      </SectionCard>

      {challans.length === 0 ? (
        <EmptyState
          title="No challans found"
          description="Use the create action to generate a new dispatch document."
          action={hasRole(['ADMIN', 'SALES']) ? { label: 'Create challan', href: '/challans/new' } : undefined}
        />
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <div className="min-w-240 table-shell rounded-2xl">
              <table>
                <thead>
                  <tr>
                    <th>Challan</th>
                    <th>Customer</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Created by</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((challan) => (
                    <tr key={challan.id}>
                      <td>
                        <div className="font-medium text-slate-900">{challan.challanNumber}</div>
                      </td>
                      <td>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{challan.customer.businessName || challan.customer.name}</div>
                        </div>
                      </td>
                      <td>{challan.totalQuantity} items</td>
                      <td><StatusBadge variant={badgeVariant(challan.status)}>{challan.status}</StatusBadge></td>
                      <td>
                        <div className="text-slate-700">{challan.creator.username}</div>
                        <div className="text-xs text-slate-500">{challan.creator.role}</div>
                      </td>
                      <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <Link href={`/challans/${challan.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <div>
            Showing page {meta.page} of {meta.totalPages} · {meta.total} challans
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
