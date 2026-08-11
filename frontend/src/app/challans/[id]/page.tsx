'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { ErrorState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../../../components/erp-ui';

interface Customer {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  address: string;
}

interface ChallanItem {
  id: number;
  productId: number;
  quantity: number;
  priceAtSale: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  product: { currentStock: number; minStockAlert: number; location: string };
}

interface Challan {
  id: number;
  challanNumber: string;
  customerId: number;
  customer: Customer;
  totalQuantity: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  createdBy: number;
  creator: { username: string; role: string };
  createdAt: string;
  items: ChallanItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

interface StockErrorDetails {
  productId?: number;
  availableStock?: number;
  requestedQuantity?: number;
}

export default function ChallanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockErrorDetails, setStockErrorDetails] = useState<StockErrorDetails | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        setStockErrorDetails(null);
        const res = await api.get<ApiResponse<Challan>>(`/challans/${id}`) as unknown as ApiResponse<Challan>;
        if (res.success && res.data) {
          setChallan(res.data);
        }
      } catch (error: unknown) {
        console.error('Failed to load challan detail', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve sales challan.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleConfirm = async () => {
    if (!challan) return;
    setError(null);
    setStockErrorDetails(null);
    setActionSubmitting(true);

    try {
      const res = await api.post<ApiResponse<unknown>>(`/challans/${challan.id}/confirm`) as unknown as ApiResponse<unknown>;
      if (res.success && id) {
        const refreshed = await api.get<ApiResponse<Challan>>(`/challans/${id}`) as unknown as ApiResponse<Challan>;
        if (refreshed.success && refreshed.data) setChallan(refreshed.data);
      }
    } catch (error: unknown) {
      console.error('Failed to confirm challan', error);
      setError(error instanceof Error ? error.message : 'Confirmation transaction rejected.');
      if (typeof error === 'object' && error && 'data' in error) {
        setStockErrorDetails((error as { data?: StockErrorDetails }).data ?? null);
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!confirm('Cancel this challan and restore stock if needed?')) return;

    setError(null);
    setStockErrorDetails(null);
    setActionSubmitting(true);

    try {
      const res = await api.post<ApiResponse<unknown>>(`/challans/${challan.id}/cancel`) as unknown as ApiResponse<unknown>;
      if (res.success && id) {
        const refreshed = await api.get<ApiResponse<Challan>>(`/challans/${id}`) as unknown as ApiResponse<Challan>;
        if (refreshed.success && refreshed.data) setChallan(refreshed.data);
      }
    } catch (error: unknown) {
      console.error('Failed to cancel challan', error);
      setError(error instanceof Error ? error.message : 'Cancellation rejected.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const statusVariant = (status: Challan['status']) => {
    if (status === 'Confirmed') return 'success';
    if (status === 'Draft') return 'neutral';
    return 'danger';
  };

  if (loading) return <LoadingState title="Loading challan" description="Fetching document metadata and line items." />;
  if (error && !challan) return <ErrorState title="Challan unavailable" description={error} action={{ label: 'Back to challans', href: '/challans' }} />;
  if (!challan) return null;

  const totalAmount = challan.items.reduce((acc, item) => acc + item.quantity * item.priceAtSale, 0);

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/challans')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring">
        <ArrowLeft className="h-4 w-4" />
        Back to challans
      </button>

      <PageHeader
        title={challan.challanNumber}
        description={`${challan.customer.businessName || challan.customer.name} · created by ${challan.creator.username}`}
        actions={<StatusBadge variant={statusVariant(challan.status)}>{challan.status}</StatusBadge>}
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="font-medium">{error}</div>
          {stockErrorDetails && (
            <div className="mt-2 text-xs text-rose-600">
              Product {stockErrorDetails.productId} has {stockErrorDetails.availableStock} available and {stockErrorDetails.requestedQuantity} requested.
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <SectionCard title="Document info">
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Challan number</div>
                <div className="mt-1 font-mono text-slate-900">{challan.challanNumber}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</div>
                <div className="mt-1 text-slate-900">{new Date(challan.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Generated by</div>
                <div className="mt-1 text-slate-900">{challan.creator.username} · {challan.creator.role}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Customer">
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Business</div>
                <div className="mt-1 font-medium text-slate-900">{challan.customer.businessName}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</div>
                <div className="mt-1 text-slate-900">{challan.customer.name}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</div>
                <div className="mt-1 leading-6 text-slate-900">{challan.customer.address}</div>
              </div>
              {challan.customer.gstNumber && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">GST</div>
                  <div className="mt-1 font-mono text-slate-900">{challan.customer.gstNumber}</div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Line items" description="Snapshot values captured at the time of document creation.">
            <div className="overflow-x-auto">
              <div className="min-w-190 table-shell rounded-2xl">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Unit price</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challan.items.map((item) => {
                      const subtotal = item.quantity * item.priceAtSale;
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="font-medium text-slate-900">{item.productNameSnapshot}</div>
                            <div className="text-xs text-slate-500 font-mono">{item.skuSnapshot}</div>
                          </td>
                          <td className="text-right">{item.priceAtSale.toFixed(2)}</td>
                          <td className="text-right font-medium text-slate-900">{item.quantity}</td>
                          <td className="text-right font-medium text-slate-900">{subtotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div className="text-slate-600">Total quantity: <span className="font-medium text-slate-900">{challan.totalQuantity}</span></div>
              <div className="text-base font-semibold text-slate-900">Net amount: {totalAmount.toFixed(2)}</div>
            </div>
          </SectionCard>

          {hasRole(['ADMIN', 'SALES']) && (
            <div className="flex flex-wrap justify-end gap-3">
              {challan.status === 'Draft' && (
                <>
                  <button onClick={handleCancel} disabled={actionSubmitting} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                  <button onClick={handleConfirm} disabled={actionSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                    <CheckCircle className="h-4 w-4" />
                    Confirm challan
                  </button>
                </>
              )}
              {challan.status === 'Confirmed' && (
                <button onClick={handleCancel} disabled={actionSubmitting} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                  <XCircle className="h-4 w-4" />
                  Cancel and restore stock
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
