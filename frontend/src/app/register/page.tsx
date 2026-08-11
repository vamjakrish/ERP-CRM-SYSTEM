'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALES');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!username || !email || !password || !role) {
      setError('Complete all required fields before continuing.');
      setSubmitting(false);
      return;
    }

    try {
      await register(username, email, password, role);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-sm rounded-2xl px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="mt-4 text-sm font-medium text-slate-900">Preparing workspace</div>
          <div className="mt-2 text-sm text-slate-500">Checking your access and loading account state.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-card hidden rounded-3xl p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">ERP CRM Portal</div>
                <div className="text-xs text-slate-500">Internal operations workspace</div>
              </div>
            </div>

            <div className="mt-10 max-w-xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Create a workspace account for sales, warehouse, or accounts.
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                This registration form mirrors the internal structure of the app so new users are onboarded with a clear operational role.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Sales</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Customers and challans</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Warehouse</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Products and stock</div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Keep account creation limited to trusted internal users.
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="surface-card rounded-3xl p-6 sm:p-8">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  <UserPlus className="h-3.5 w-3.5" /> New workspace user
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Register account</h2>
                <p className="mt-2 text-sm text-slate-600">Provide identity details and select the correct internal role.</p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Full name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Role</label>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  >
                    <option value="ADMIN">Admin (full access)</option>
                    <option value="SALES">Sales (CRM and challans)</option>
                    <option value="WAREHOUSE">Warehouse (catalog and stock)</option>
                    <option value="ACCOUNTS">Accounts (read-only audit)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring"
                >
                  {submitting ? 'Registering...' : 'Create workspace account'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-700 hover:text-blue-800">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
