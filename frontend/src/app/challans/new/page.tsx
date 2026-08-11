'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileCheck, Plus, Save, Trash2 } from 'lucide-react';
import api from '../../../utils/api';
import { ErrorState, LoadingState, PageHeader, SectionCard } from '../../../components/erp-ui';

interface Customer {
  id: number;
  name: string;
  businessName: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface LineItem {
  productId: number;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  currentStock: number;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

interface ApiMutationResponse<T> {
  success: boolean;
  data?: T;
}

interface StockErrorDetails {
  productId?: number;
  availableStock?: number;
  requestedQuantity?: number;
}

export default function NewChallanPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockErrorDetails, setStockErrorDetails] = useState<StockErrorDetails | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          api.get<ApiListResponse<Customer>>('/customers?limit=100') as unknown as ApiListResponse<Customer>,
          api.get<ApiListResponse<Product>>('/products?limit=100') as unknown as ApiListResponse<Product>,
        ]);
        if (custRes.success) {
          setCustomers(custRes.data || []);
          if (custRes.data?.length > 0) setSelectedCustomerId(String(custRes.data[0].id));
        }
        if (prodRes.success) {
          setProducts(prodRes.data || []);
          if (prodRes.data?.length > 0) setSelectedProductId(String(prodRes.data[0].id));
        }
      } catch (error: unknown) {
        console.error('Failed to load lists', error);
        setError('Could not load customers and products for challan creation.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAddItem = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setStockErrorDetails(null);

    const prodId = parseInt(selectedProductId, 10);
    const qty = parseInt(itemQuantity, 10);

    if (isNaN(prodId) || isNaN(qty) || qty <= 0) {
      setError('Select a product and enter a valid quantity.');
      return;
    }

    const product = products.find((item) => item.id === prodId);
    if (!product) {
      setError('Selected product was not found.');
      return;
    }

    const existingIndex = lineItems.findIndex((item) => item.productId === prodId);
    if (existingIndex > -1) {
      const updated = [...lineItems];
      updated[existingIndex].quantity += qty;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          productId: prodId,
          name: product.name,
          sku: product.sku,
          unitPrice: product.unitPrice,
          quantity: qty,
          currentStock: product.currentStock,
        },
      ]);
    }

    setItemQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const submitChallan = async (confirmImmediately: boolean) => {
    setError(null);
    setStockErrorDetails(null);
    setSubmitting(true);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      setSubmitting(false);
      return;
    }

    if (lineItems.length === 0) {
      setError('Add at least one product line.');
      setSubmitting(false);
      return;
    }

    try {
      const createRes = await api.post<ApiMutationResponse<{ id: number }>>('/challans', {
        customerId: selectedCustomerId,
        items: lineItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }) as unknown as ApiMutationResponse<{ id: number }>;

      if (createRes.success && createRes.data) {
        const challanId = createRes.data.id;
        if (confirmImmediately) {
          try {
            const confirmRes = await api.post<ApiMutationResponse<unknown>>(`/challans/${challanId}/confirm`) as unknown as ApiMutationResponse<unknown>;
            if (confirmRes.success) router.push('/challans');
          } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Challan created as draft, but confirmation failed.');
            if (typeof error === 'object' && error && 'data' in error) {
              setStockErrorDetails((error as { data?: StockErrorDetails }).data ?? null);
            }
          }
        } else {
          router.push('/challans');
        }
      }
    } catch (error: unknown) {
      console.error('Submission failed', error);
      setError(error instanceof Error ? error.message : 'Failed to submit sales challan.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuantity = lineItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  if (loading) return <LoadingState title="Loading challan builder" description="Fetching customers and product availability." />;
  if (error && customers.length === 0 && products.length === 0) return <ErrorState title="Challan builder unavailable" description={error} action={{ label: 'Back to challans', href: '/challans' }} />;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/challans')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring">
        <ArrowLeft className="h-4 w-4" />
        Back to challans
      </button>

      <PageHeader title="New challan" description="Create a dispatch document by selecting a customer and adding line items." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionCard title="Customer" description="Select the account receiving the dispatch.">
            <select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.businessName} ({customer.name})
                </option>
              ))}
            </select>
          </SectionCard>

          <SectionCard title="Add products" description="Choose product, quantity, and add it to the document.">
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Product</label>
                <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.sku} · Stock {product.currentStock}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Quantity</label>
                <input type="number" min="1" value={itemQuantity} onChange={(event) => setItemQuantity(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
                <Plus className="h-4 w-4" />
                Add line item
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="space-y-6">
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

          <SectionCard title="Line items" description="Review products before saving or confirming the challan.">
            {lineItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No line items added yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <div className="min-w-190 table-shell rounded-2xl">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-right">Stock</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Subtotal</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => {
                          const subtotal = item.quantity * item.unitPrice;
                          const stockWarning = item.quantity > item.currentStock;
                          return (
                            <tr key={item.productId}>
                              <td>
                                <div className="font-medium text-slate-900">{item.name}</div>
                                <div className="text-xs text-slate-500">{item.sku}</div>
                              </td>
                              <td className="text-right text-slate-600">{item.currentStock}</td>
                              <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                              <td className="text-right">
                                <span className={stockWarning ? 'rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700' : ''}>
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="text-right font-medium text-slate-900">{subtotal.toFixed(2)}</td>
                              <td className="text-center">
                                <button onClick={() => handleRemoveItem(index)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-rose-600 focus-ring" aria-label="Remove line item">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="text-slate-600">Total quantity: <span className="font-medium text-slate-900">{totalQuantity}</span></div>
                  <div className="text-base font-semibold text-slate-900">Estimated amount: {totalAmount.toFixed(2)}</div>
                </div>
              </div>
            )}
          </SectionCard>

          {lineItems.length > 0 && (
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => submitChallan(false)} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                <Save className="h-4 w-4" />
                {submitting ? 'Saving...' : 'Save draft'}
              </button>
              <button onClick={() => submitChallan(true)} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                <FileCheck className="h-4 w-4" />
                {submitting ? 'Processing...' : 'Save and confirm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
