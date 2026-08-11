'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../../components/erp-ui';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  stockStatus: 'LOW_STOCK' | 'OK';
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

interface ApiMutationResponse<T> {
  success: boolean;
  data?: T;
}

export default function ProductsPage() {
  const { hasRole } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSku, setCreateSku] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createStock, setCreateStock] = useState('');
  const [createMinAlert, setCreateMinAlert] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createReason, setCreateReason] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustStock, setAdjustStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        let query = `/products?page=${page}&limit=10`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;

        const res = await api.get<ApiListResponse<Product>>(query) as unknown as ApiListResponse<Product>;
        if (res.success) {
          setProducts(res.data);
          setMeta(res.meta);
        }
      } catch (error: unknown) {
        console.error('Failed to load products', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve products.');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, search, categoryFilter]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
  };

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSubmitting(true);

    if (!createName || !createSku || !createCategory || createPrice === '' || createStock === '' || createMinAlert === '' || !createLocation) {
      setCreateError('Please complete all required fields.');
      setCreateSubmitting(false);
      return;
    }

    try {
      const res = await api.post<ApiMutationResponse<Product>>('/products', {
        name: createName,
        sku: createSku,
        category: createCategory,
        unitPrice: parseFloat(createPrice),
        currentStock: parseInt(createStock, 10),
        minStockAlert: parseInt(createMinAlert, 10),
        location: createLocation,
        reason: createReason || null,
      }) as unknown as ApiMutationResponse<Product>;

      if (res.success) {
        setIsCreateOpen(false);
        setCreateName('');
        setCreateSku('');
        setCreateCategory('');
        setCreatePrice('');
        setCreateStock('');
        setCreateMinAlert('');
        setCreateLocation('');
        setCreateReason('');
        setPage(1);
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            let query = `/products?page=1&limit=10`;
            if (search) query += `&search=${encodeURIComponent(search)}`;
            if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;

            const refreshed = await api.get<ApiListResponse<Product>>(query) as unknown as ApiListResponse<Product>;
            if (refreshed.success) {
              setProducts(refreshed.data);
              setMeta(refreshed.meta);
            }
          } finally {
            setLoading(false);
          }
        })();
      }
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create product.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdjustError(null);
    setAdjustSubmitting(true);

    if (!adjustProduct || adjustStock === '' || !adjustReason) {
      setAdjustError('Enter the new stock amount and a reason.');
      setAdjustSubmitting(false);
      return;
    }

    try {
      const res = await api.put<ApiMutationResponse<Product>>(`/products/${adjustProduct.id}`, {
        currentStock: parseInt(adjustStock, 10),
        reason: adjustReason,
      }) as unknown as ApiMutationResponse<Product>;

      if (res.success) {
        setIsAdjustOpen(false);
        setAdjustProduct(null);
        setAdjustStock('');
        setAdjustReason('');
        void (async () => {
          try {
            setLoading(true);
            setError(null);
            let query = `/products?page=${page}&limit=10`;
            if (search) query += `&search=${encodeURIComponent(search)}`;
            if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;

            const refreshed = await api.get<ApiListResponse<Product>>(query) as unknown as ApiListResponse<Product>;
            if (refreshed.success) {
              setProducts(refreshed.data);
              setMeta(refreshed.meta);
            }
          } finally {
            setLoading(false);
          }
        })();
      }
    } catch (error: unknown) {
      setAdjustError(error instanceof Error ? error.message : 'Failed to adjust stock levels.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const hasLowStock = products.some((product) => product.currentStock <= product.minStockAlert);

  if (loading) return <LoadingState title="Loading inventory" description="Fetching products, categories, and stock status." />;
  if (error) return <ErrorState title="Inventory unavailable" description={error} action={{ label: 'Retry', href: '/products' }} />;

  const actions = hasRole(['ADMIN', 'WAREHOUSE']) ? (
    <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring">
      <Plus className="h-4 w-4" />
      Add product
    </button>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Stock"
        description="Catalog items, warehouse locations, and current stock levels."
        actions={actions}
      />

      <SectionCard>
        <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1.2fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-9 py-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Category</span>
            <input
              type="text"
              placeholder="e.g. Packaging"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="focus-ring w-40 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
            />
          </div>
        </form>
      </SectionCard>

      {hasLowStock && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some products are below minimum stock. Review the table for highlighted rows and adjust inventory where needed.
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          title="No inventory items"
          description="The catalog is empty for the selected filter. Add a product to start tracking stock."
          action={hasRole(['ADMIN', 'WAREHOUSE']) ? { label: 'Add product', href: '/products' } : undefined}
        />
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <div className="min-w-255 table-shell rounded-2xl">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isLow = product.currentStock <= product.minStockAlert;
                    return (
                      <tr key={product.id} className={isLow ? 'bg-amber-50/60' : undefined}>
                        <td>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900">{product.name}</div>
                            {isLow && <div className="mt-1 text-xs text-amber-700">Below minimum stock</div>}
                          </div>
                        </td>
                        <td className="font-mono text-sm text-slate-700">{product.sku}</td>
                        <td>{product.category}</td>
                        <td>{product.unitPrice.toFixed(2)}</td>
                        <td>
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{product.currentStock}</div>
                            <div className="text-xs text-slate-500">Minimum {product.minStockAlert}</div>
                          </div>
                        </td>
                        <td>{product.location}</td>
                        <td>
                          <StatusBadge variant={isLow ? 'warning' : 'success'}>{isLow ? 'Low stock' : 'In stock'}</StatusBadge>
                        </td>
                        <td className="text-right">
                          {hasRole(['ADMIN', 'WAREHOUSE']) && (
                            <button
                              onClick={() => {
                                setAdjustProduct(product);
                                setAdjustStock(String(product.currentStock));
                                setIsAdjustOpen(true);
                              }}
                              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                            >
                              <Scale className="h-4 w-4" />
                              Adjust
                            </button>
                          )}
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
            Showing page {meta.page} of {meta.totalPages} · {meta.total} products
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="surface-card relative w-full max-w-2xl rounded-3xl p-6 shadow-xl">
            <button onClick={() => setIsCreateOpen(false)} className="absolute right-4 top-4 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 focus-ring" aria-label="Close create product form">
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Add product</h2>
              <p className="mt-1 text-sm text-slate-600">Create a catalog item and set the initial warehouse stock.</p>
            </div>

            {createError && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{createError}</div>}

            <form onSubmit={handleCreateSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Product name *</label>
                <input value={createName} onChange={(event) => setCreateName(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">SKU *</label>
                <input value={createSku} onChange={(event) => setCreateSku(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Category *</label>
                <input value={createCategory} onChange={(event) => setCreateCategory(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Unit price *</label>
                <input type="number" step="0.01" value={createPrice} onChange={(event) => setCreatePrice(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Initial stock *</label>
                <input type="number" value={createStock} onChange={(event) => setCreateStock(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Minimum alert *</label>
                <input type="number" value={createMinAlert} onChange={(event) => setCreateMinAlert(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Location *</label>
                <input value={createLocation} onChange={(event) => setCreateLocation(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Reason / note</label>
                <input value={createReason} onChange={(event) => setCreateReason(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
                  Cancel
                </button>
                <button type="submit" disabled={createSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                  {createSubmitting ? 'Saving...' : 'Create product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdjustOpen && adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="surface-card relative w-full max-w-lg rounded-3xl p-6 shadow-xl">
            <button
              onClick={() => {
                setIsAdjustOpen(false);
                setAdjustProduct(null);
              }}
              className="absolute right-4 top-4 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 focus-ring"
              aria-label="Close adjust stock form"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Adjust inventory</h2>
              <p className="mt-1 text-sm text-slate-600">Update stock for {adjustProduct.name}.</p>
            </div>

            {adjustError && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{adjustError}</div>}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Stock quantity</label>
                <input type="number" value={adjustStock} onChange={(event) => setAdjustStock(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Reason</label>
                <textarea value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} rows={3} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdjustOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
                  Cancel
                </button>
                <button type="submit" disabled={adjustSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                  {adjustSubmitting ? 'Saving...' : 'Update stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
