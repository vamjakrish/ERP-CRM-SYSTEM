'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileText, Package, Plus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { EmptyState, ErrorState, LoadingState, MetricCard, PageHeader, SectionCard, StatusBadge } from '../components/erp-ui';

interface Product {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  minStockAlert: number;
  stockStatus: string;
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  customerType: string;
  status: string;
}

interface Challan {
  id: number;
  challanNumber: string;
  customer: { name: string; businessName: string };
  totalQuantity: number;
  status: string;
  createdAt: string;
}

interface ApiListResponse<T> {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    confirmedChallans: 0,
    draftChallans: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait until the auth store has finished initializing.
    // AuthContext already redirects to /login when not authenticated,
    // so we only proceed once loading is false AND the user is authenticated.
    if (authLoading) return;
    if (!isAuthenticated) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        // api.ts response interceptor returns response.data directly,
        // so the resolved value IS the response body ({data, meta})
        const [custRes, prodRes, chalRes] = await Promise.all([
          api.get<ApiListResponse<Customer>>('/customers?limit=100') as unknown as ApiListResponse<Customer>,
          api.get<ApiListResponse<Product>>('/products?limit=100') as unknown as ApiListResponse<Product>,
          api.get<ApiListResponse<Challan>>('/challans?limit=100') as unknown as ApiListResponse<Challan>,
        ]);

        const customersList = custRes.data || [];
        const productsList = prodRes.data || [];
        const challansList = chalRes.data || [];

        const lowStock = productsList.filter((product) => product.currentStock <= product.minStockAlert);
        const confirmed = challansList.filter((challan) => challan.status === 'Confirmed').length;
        const drafts = challansList.filter((challan) => challan.status === 'Draft').length;

        setMetrics({
          totalCustomers: custRes.meta?.total || customersList.length,
          totalProducts: prodRes.meta?.total || productsList.length,
          lowStockCount: lowStock.length,
          confirmedChallans: confirmed,
          draftChallans: drafts,
        });

        setLowStockProducts(lowStock.slice(0, 5));
        setRecentChallans(challansList.slice(0, 5));
      } catch (error: unknown) {
        console.error('Failed to load dashboard data', error);
        setError('Could not load operations metrics. Please check whether the backend API is online.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading) {
    return <LoadingState title="Loading dashboard" description="Pulling the latest customer, inventory, and challan data." />;
  }

  if (error) {
    return <ErrorState title="Dashboard unavailable" description={error} action={{ label: 'Retry later', href: '/' }} />;
  }

  const actions = (
    <>
      {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
        <Link href="/customers" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
          <Users className="h-4 w-4" />
          Add Customer
        </Link>
      )}
      {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
        <Link href="/challans/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring">
          <Plus className="h-4 w-4" />
          Create Challan
        </Link>
      )}
      {user?.role === 'WAREHOUSE' && (
        <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring">
          <Plus className="h-4 w-4" />
          Manage Inventory
        </Link>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.username || 'user'}`}
        description={`Live operational view for your ${user?.role?.toLowerCase() || 'workspace'} account. Focus on customers, stock, and dispatches that need attention.`}
        actions={actions}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total customers" value={metrics.totalCustomers} icon={<Users className="h-5 w-5" />} accent="blue" />
        <MetricCard label="Catalog products" value={metrics.totalProducts} icon={<Package className="h-5 w-5" />} accent="slate" />
        <MetricCard label="Low stock items" value={metrics.lowStockCount} detail="Items at or below minimum stock" icon={<AlertTriangle className="h-5 w-5" />} accent={metrics.lowStockCount > 0 ? 'amber' : 'slate'} />
        <MetricCard label="Confirmed challans" value={metrics.confirmedChallans} detail={`${metrics.draftChallans} drafts waiting`} icon={<FileText className="h-5 w-5" />} accent="emerald" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Inventory alerts"
          description="Products that are at or below their configured minimum stock level."
        >
          {lowStockProducts.length === 0 ? (
            <EmptyState
              title="No stock exceptions"
              description="All tracked items are above minimum thresholds right now."
              action={{ label: 'Open catalog', href: '/products' }}
            />
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{product.name}</div>
                    <div className="mt-1 text-xs text-slate-500">SKU {product.sku}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="warning">Low stock</StatusBadge>
                    <span className="text-sm font-semibold text-slate-900">{product.currentStock}</span>
                    <span className="text-xs text-slate-500">/ min {product.minStockAlert}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent challans"
          description="Latest dispatch documents and their current status."
        >
          {recentChallans.length === 0 ? (
            <EmptyState
              title="No challans yet"
              description="Challan records will appear here as sales documents are created."
              action={{ label: 'Create challan', href: '/challans/new' }}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="divide-y divide-slate-200">
                {recentChallans.map((challan) => (
                  <Link key={challan.id} href={`/challans/${challan.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">{challan.challanNumber}</div>
                      <div className="mt-1 text-xs text-slate-500">{challan.customer.businessName || challan.customer.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">{challan.totalQuantity} items</span>
                      <StatusBadge
                        variant={challan.status === 'Confirmed' ? 'success' : challan.status === 'Draft' ? 'neutral' : 'danger'}
                      >
                        {challan.status}
                      </StatusBadge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Link href="/challans" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
              View all challans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
