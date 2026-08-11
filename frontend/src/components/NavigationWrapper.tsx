'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Products & Stock', href: '/products', icon: Package },
  { name: 'Stock Movements', href: '/inventory/movements', icon: History },
  { name: 'Sales Challans', href: '/challans', icon: FileText },
];

const quickLinks = [
  { label: 'Customers', href: '/customers', icon: Building2 },
  { label: 'Products', href: '/products', icon: Warehouse },
  { label: 'Challans', href: '/challans', icon: ClipboardList },
];

const roleClassMap: Record<string, string> = {
  ADMIN: 'border-slate-200 bg-slate-100 text-slate-700',
  SALES: 'border-blue-200 bg-blue-50 text-blue-700',
  WAREHOUSE: 'border-amber-200 bg-amber-50 text-amber-700',
  ACCOUNTS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function getSectionMeta(pathname: string) {
  if (pathname.startsWith('/customers/')) return { title: 'Customer Record', description: 'CRM profile and follow-up history.' };
  if (pathname.startsWith('/challans/new')) return { title: 'New Challan', description: 'Create and confirm a dispatch document.' };
  if (pathname.startsWith('/challans/')) return { title: 'Challan Record', description: 'Sales challan detail and status actions.' };
  if (pathname.startsWith('/products')) return { title: 'Products & Stock', description: 'Catalog and warehouse inventory overview.' };
  if (pathname.startsWith('/inventory/movements')) return { title: 'Stock Movements', description: 'Inventory audit trail.' };
  if (pathname.startsWith('/challans')) return { title: 'Sales Challans', description: 'Draft and confirmed dispatch records.' };
  return { title: 'Dashboard', description: 'Operational overview and priority items.' };
}

function getBreadcrumbs(pathname: string) {
  if (pathname === '/') return [{ label: 'Dashboard' }];

  return [
    { label: 'Dashboard', href: '/' },
    ...pathname
      .split('/')
      .filter(Boolean)
      .map((segment, index, segments) => ({
        href: `/${segments.slice(0, index + 1).join('/')}`,
        label: segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      })),
  ];
}

type BreadcrumbItem = ReturnType<typeof getBreadcrumbs>[number] & { href?: string };

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/login' || pathname === '/register' || !isAuthenticated) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const sectionMeta = getSectionMeta(pathname);
  const breadcrumbs: BreadcrumbItem[] = getBreadcrumbs(pathname);
  const roleClass = roleClassMap[user?.role || ''] || 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-900">ERP CRM Portal</div>
              <div className="text-xs text-slate-500">Wholesale operations workspace</div>
            </div>
          </Link>
        </div>

        <div className="border-b border-slate-200 p-4">
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold uppercase text-slate-700">
                {user?.username?.slice(0, 2) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{user?.username}</div>
                <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleClass}`}>
                  {user?.role}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 px-2 py-2 text-center transition hover:border-slate-300 hover:bg-slate-50 focus-ring">
                    <Icon className="h-4 w-4 text-slate-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-ring ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-ring"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">ERP CRM Portal</div>
                  <div className="text-xs text-slate-500">Operations workspace</div>
                </div>
              </Link>
            </div>

            <div className="hidden min-w-0 lg:block">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={`${item.label}-${index}`}>
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                    {item.href ? (
                      <Link href={item.href} className="hover:text-slate-700">
                        {item.label}
                      </Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900">{sectionMeta.title}</h1>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-3 xl:flex">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search customers, products, challans"
                  className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 focus-ring" aria-label="Notifications">
                <Bell className="h-4.5 w-4.5" />
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold uppercase text-slate-700">
                  {user?.username?.slice(0, 2) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{user?.username}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 focus-ring lg:hidden"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:hidden">
            <div className="font-medium text-slate-900">{sectionMeta.title}</div>
            <div className="mt-1 text-sm text-slate-500">{sectionMeta.description}</div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <aside className="absolute left-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto border-r border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">ERP CRM Portal</div>
                  <div className="text-xs text-slate-500">Navigation</div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-slate-200 p-2 text-slate-600 focus-ring" aria-label="Close navigation menu">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-200 p-4">
                <div className="surface-card rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold uppercase text-slate-700">
                      {user?.username?.slice(0, 2) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{user?.username}</div>
                      <div className="text-xs text-slate-500">{user?.role}</div>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="space-y-1 px-3 py-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-ring ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-200 p-4">
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-ring"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
