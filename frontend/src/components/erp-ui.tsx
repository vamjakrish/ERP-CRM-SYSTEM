'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, Inbox } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

type SectionCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type StatusBadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: 'blue' | 'emerald' | 'amber' | 'slate';
};

type StateCardProps = {
  title: string;
  description: string;
  action?: { label: string; href: string };
};

const badgeClasses: Record<BadgeVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
};

const accentClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
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
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
          {description && <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionCard({ title, description, children, className = '' }: SectionCardProps) {
  return (
    <section className={`surface-card rounded-2xl ${className}`.trim()}>
      {(title || description) && (
        <header className="border-b border-slate-200 px-5 py-4 sm:px-6">
          {title && <h2 className="text-sm font-semibold tracking-wide text-slate-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function StatusBadge({ children, variant = 'neutral', className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeClasses[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}

export function MetricCard({ label, value, detail, icon, accent = 'slate' }: MetricCardProps) {
  return (
    <div className="surface-card rounded-2xl px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
          {detail && <div className="text-sm text-slate-500">{detail}</div>}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accentClasses[accent]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="surface-card flex min-h-80 items-center justify-center rounded-2xl px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <div className="text-sm font-medium text-slate-900">{title}</div>
        {description && <div className="max-w-md text-sm text-slate-500">{description}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: StateCardProps) {
  return (
    <div className="surface-card flex min-h-65 items-center justify-center rounded-2xl px-6 py-10 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
          <Inbox className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">{description}</div>
        </div>
        {action && (
          <Link href={action.href} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring">
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function ErrorState({ title, description, action }: StateCardProps) {
  return (
    <div className="surface-card flex min-h-55 items-center justify-center rounded-2xl px-6 py-10 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">{description}</div>
        </div>
        {action && (
          <Link href={action.href} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-ring">
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
