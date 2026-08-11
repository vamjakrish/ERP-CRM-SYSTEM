'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Save, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { ErrorState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../../../components/erp-ui';

interface FollowUp {
  id: number;
  note: string;
  createdAt: string;
  creator: { username: string; role: string };
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  notes?: string;
  followUps: FollowUp[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusiness, setEditBusiness] = useState('');
  const [editGst, setEditGst] = useState('');
  const [editType, setEditType] = useState<Customer['customerType']>('Retail');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<Customer['status']>('Lead');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`) as unknown as ApiResponse<Customer>;
        if (res.success && res.data) {
          setCustomer(res.data);
          setEditName(res.data.name);
          setEditMobile(res.data.mobile);
          setEditEmail(res.data.email);
          setEditBusiness(res.data.businessName);
          setEditGst(res.data.gstNumber || '');
          setEditType(res.data.customerType);
          setEditAddress(res.data.address);
          setEditStatus(res.data.status);
        }
      } catch (error: unknown) {
        console.error('Failed to load customer', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch customer profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEditError(null);
    setEditSubmitting(true);

    if (!editName || !editMobile || !editEmail || !editBusiness || !editAddress) {
      setEditError('Please complete all required fields.');
      setEditSubmitting(false);
      return;
    }

    try {
      const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, {
        name: editName,
        mobile: editMobile,
        email: editEmail,
        businessName: editBusiness,
        gstNumber: editGst || null,
        customerType: editType,
        address: editAddress,
        status: editStatus,
      }) as unknown as ApiResponse<Customer>;

      if (res.success) {
        setIsEditing(false);
        void (async () => {
          if (!id) return;
          const refreshed = await api.get<ApiResponse<Customer>>(`/customers/${id}`) as unknown as ApiResponse<Customer>;
          if (refreshed.success && refreshed.data) {
            setCustomer(refreshed.data);
          }
        })();
      }
    } catch (error: unknown) {
      setEditError(error instanceof Error ? error.message : 'Failed to update customer details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();
    setNoteError(null);
    setNoteSubmitting(true);

    if (!newNote.trim()) {
      setNoteError('Follow-up note cannot be empty.');
      setNoteSubmitting(false);
      return;
    }

    try {
      const res = await api.post<ApiResponse<FollowUp>>(`/customers/${id}/followups`, { note: newNote }) as unknown as ApiResponse<FollowUp>;
      if (res.success) {
        setNewNote('');
        void (async () => {
          if (!id) return;
          const refreshed = await api.get<ApiResponse<Customer>>(`/customers/${id}`) as unknown as ApiResponse<Customer>;
          if (refreshed.success && refreshed.data) {
            setCustomer(refreshed.data);
          }
        })();
      }
    } catch (error: unknown) {
      setNoteError(error instanceof Error ? error.message : 'Failed to add follow-up note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const statusVariant = (status: Customer['status']) => {
    if (status === 'Active') return 'success';
    if (status === 'Lead') return 'info';
    return 'neutral';
  };

  if (loading) return <LoadingState title="Loading customer" description="Fetching CRM details and follow-up history." />;
  if (error || !customer) return <ErrorState title="Customer unavailable" description={error || 'Customer profile not found.'} action={{ label: 'Back to customers', href: '/customers' }} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/customers')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring">
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </button>
        {hasRole(['ADMIN', 'SALES']) && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
            <Edit className="h-4 w-4" />
            Edit profile
          </button>
        )}
      </div>

      <PageHeader
        title={customer.businessName}
        description={`${customer.name} · ${customer.customerType} account`}
        actions={<StatusBadge variant={statusVariant(customer.status)}>{customer.status}</StatusBadge>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Profile">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact person</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{customer.name}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Mobile</div>
                  <div className="mt-1 text-sm text-slate-900">{customer.mobile}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</div>
                  <div className="mt-1 text-sm text-slate-900">{customer.email}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">GST</div>
                  <div className="mt-1 text-sm text-slate-900">{customer.gstNumber || 'Not provided'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</div>
                  <div className="mt-1 text-sm text-slate-900">{customer.customerType}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</div>
                <div className="mt-1 text-sm leading-6 text-slate-900">{customer.address}</div>
              </div>
              {customer.notes && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</div>
                  <div className="mt-1 text-sm leading-6 text-slate-900">{customer.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{editError}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Business name *</label>
                  <input value={editBusiness} onChange={(event) => setEditBusiness(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Contact person *</label>
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Mobile *</label>
                  <input value={editMobile} onChange={(event) => setEditMobile(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Email *</label>
                  <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">GST</label>
                  <input value={editGst} onChange={(event) => setEditGst(event.target.value)} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Type</label>
                  <select value={editType} onChange={(event) => setEditType(event.target.value as Customer['customerType'])} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Status</label>
                  <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as Customer['status'])} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Address *</label>
                  <textarea value={editAddress} onChange={(event) => setEditAddress(event.target.value)} rows={4} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                  <Save className="h-4 w-4" />
                  {editSubmitting ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        <div className="space-y-6">
          {hasRole(['ADMIN', 'SALES']) && (
            <SectionCard title="Add follow-up" description="Log call notes, meeting outcomes, and next steps.">
              {noteError && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{noteError}</div>}
              <form onSubmit={handleAddNote} className="space-y-4">
                <textarea value={newNote} onChange={(event) => setNewNote(event.target.value)} rows={4} placeholder="Capture the discussion outcome and next action..." className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                <div className="flex justify-end">
                  <button type="submit" disabled={noteSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring">
                    <Plus className="h-4 w-4" />
                    {noteSubmitting ? 'Saving...' : 'Add note'}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard title="Follow-up history" description="Previous CRM interactions and ownership trail.">
            {customer.followUps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No follow-up notes recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {customer.followUps.map((followUp) => (
                  <div key={followUp.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{followUp.creator.username}</span>
                        <span className="text-xs text-slate-500">{followUp.creator.role}</span>
                      </div>
                      <div className="text-xs text-slate-500">{new Date(followUp.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-700">{followUp.note}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
