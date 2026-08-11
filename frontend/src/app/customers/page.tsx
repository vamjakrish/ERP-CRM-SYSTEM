'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, UserPlus, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../../components/erp-ui';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: string;
  address: string;
  status: string;
  notes?: string;
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

export default function CustomersPage() {
  const { hasRole } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formType, setFormType] = useState('Retail');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState('Lead');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        let query = `/customers?page=${page}&limit=10`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (typeFilter) query += `&type=${typeFilter}`;
        if (statusFilter) query += `&status=${statusFilter}`;

        const res = await api.get<ApiListResponse<Customer>>(query) as unknown as ApiListResponse<Customer>;
        if (res.success) {
          setCustomers(res.data);
          setMeta(res.meta);
        }
      } catch (error: unknown) {
        console.error('Failed to load customers', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve customers.');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, search, typeFilter, statusFilter]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
  };

  const handleCreateCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    if (!formName || !formMobile || !formEmail || !formBusiness || !formAddress) {
      setFormError('Please complete all required fields.');
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await api.post<ApiMutationResponse<Customer>>('/customers', {
        name: formName,
        mobile: formMobile,
        email: formEmail,
        businessName: formBusiness,
        gstNumber: formGst || null,
        customerType: formType,
        address: formAddress,
        status: formStatus,
        notes: formNotes || null,
      }) as unknown as ApiMutationResponse<Customer>;

      if (res.success) {
        setIsModalOpen(false);
        setFormName('');
        setFormMobile('');
        setFormEmail('');
        setFormBusiness('');
        setFormGst('');
        setFormType('Retail');
        setFormAddress('');
        setFormStatus('Lead');
        setFormNotes('');
        setPage(1);
        void (async () => {
          const refreshed = await api.get<ApiListResponse<Customer>>(`/customers?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`) as unknown as ApiListResponse<Customer>;
          if (refreshed.success) {
            setCustomers(refreshed.data);
            setMeta(refreshed.meta);
          }
        })();
      }
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to create customer.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const statusVariant = (status: string) => {
    if (status === 'Active') return 'success';
    if (status === 'Lead') return 'info';
    if (status === 'Inactive') return 'neutral';
    return 'neutral';
  };

  if (loading) return <LoadingState title="Loading customers" description="Fetching CRM accounts, filters, and page counts." />;
  if (error) return <ErrorState title="Customer list unavailable" description={error} action={{ label: 'Retry', href: '/customers' }} />;

  const actions = hasRole(['ADMIN', 'SALES']) ? (
    <button
      onClick={() => setIsModalOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring"
    >
      <UserPlus className="h-4 w-4" />
      Add customer
    </button>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts, follow-up records, and sales pipeline status."
        actions={actions}
      />

      <SectionCard>
        <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1.2fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, business, mobile, or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-9 py-3 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(1);
              }}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
            >
              <option value="">All types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
            >
              <option value="">All statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </SectionCard>

      {customers.length === 0 ? (
        <EmptyState
          title="No customer records"
          description="Try a different search or create a new customer profile for the sales team."
          action={hasRole(['ADMIN', 'SALES']) ? { label: 'Add customer', href: '/customers' } : undefined}
        />
      ) : (
        <SectionCard>
          <div className="overflow-x-auto">
            <div className="min-w-230 table-shell rounded-2xl">
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{customer.businessName}</div>
                          <div className="mt-1 text-xs text-slate-500">{customer.gstNumber ? `GST ${customer.gstNumber}` : 'No GST recorded'}</div>
                        </div>
                      </td>
                      <td>{customer.name}</td>
                      <td>{customer.customerType}</td>
                      <td><StatusBadge variant={statusVariant(customer.status)}>{customer.status}</StatusBadge></td>
                      <td>{customer.mobile}</td>
                      <td className="max-w-55 truncate">{customer.email}</td>
                      <td className="text-right">
                        <Link href={`/customers/${customer.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
                          View
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
            Showing page {meta.page} of {meta.totalPages} · {meta.total} customers
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((value) => Math.min(value + 1, meta.totalPages))}
              disabled={page === meta.totalPages}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="surface-card relative w-full max-w-2xl rounded-3xl p-6 shadow-xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 focus-ring"
              aria-label="Close add customer form"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Add customer</h2>
              <p className="mt-1 text-sm text-slate-600">Create a CRM record for a new account or lead.</p>
            </div>

            {formError && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Business name *</label>
                <input value={formBusiness} onChange={(event) => setFormBusiness(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Contact name *</label>
                <input value={formName} onChange={(event) => setFormName(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Mobile *</label>
                <input value={formMobile} onChange={(event) => setFormMobile(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Email *</label>
                <input type="email" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Customer type</label>
                <select value={formType} onChange={(event) => setFormType(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Status</label>
                <select value={formStatus} onChange={(event) => setFormStatus(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">GST number</label>
                <input value={formGst} onChange={(event) => setFormGst(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Address *</label>
                <textarea value={formAddress} onChange={(event) => setFormAddress(event.target.value)} rows={3} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Notes</label>
                <textarea value={formNotes} onChange={(event) => setFormNotes(event.target.value)} rows={3} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                  {formSubmitting ? 'Saving...' : 'Create customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
