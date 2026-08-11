'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!email || !password) {
      setError('Enter both your email address and password.');
      setSubmitting(false);
      return;
    }

    try {
      await login(email, password);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const testCredentials = [
    { role: 'Admin', email: 'admin@company.com', pass: 'admin123' },
    { role: 'Sales', email: 'sales@company.com', pass: 'sales123' },
    { role: 'Warehouse', email: 'warehouse@company.com', pass: 'warehouse123' },
    { role: 'Accounts', email: 'accounts@company.com', pass: 'accounts123' },
  ];

  if (authLoading && !submitting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-sm rounded-2xl px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="mt-4 text-sm font-medium text-slate-900">Checking session</div>
          <div className="mt-2 text-sm text-slate-500">Verifying your access to the internal portal.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card hidden rounded-3xl p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">ERP CRM Portal</div>
                <div className="text-xs text-slate-500">Internal operations workspace</div>
              </div>
            </div>

            <div className="mt-10 max-w-xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Sign in to manage customers, stock, and sales documents.
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                Use the portal to handle daily ERP tasks across sales, warehouse, and accounts without switching between disconnected tools.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Customers</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">CRM records</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Inventory</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Stock levels</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Challans</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Dispatch flow</div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            This interface is intentionally restrained so the data and workflow stay clear for daily use.
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="surface-card rounded-3xl p-6 sm:p-8">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  <LockKeyhole className="h-3.5 w-3.5" /> Secure access
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
                <p className="mt-2 text-sm text-slate-600">Enter your workspace credentials to continue.</p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring"
                >
                  {submitting ? 'Signing in...' : <><LogIn className="h-4 w-4" /> Sign in</>}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
                No account yet?{' '}
                <Link href="/register" className="font-medium text-blue-700 hover:text-blue-800">
                  Register workspace
                </Link>
              </div>
            </div>

            <div className="surface-card mt-4 rounded-3xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test credentials</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {testCredentials.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.pass);
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus-ring"
                  >
                    <div className="text-sm font-medium text-slate-900">{cred.role}</div>
                    <div className="mt-1 text-xs text-slate-500">{cred.email}</div>
                    <div className="mt-2 text-[11px] text-slate-400">Password: {cred.pass}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
