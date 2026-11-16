import React from 'react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badges,
  className,
  sticky = false,
}) => {
  return (
    <div
      className={cn(
        'w-full bg-app-surface border-b border-app-border pb-4 pt-1 transition-all',
        sticky && 'sticky top-0 z-20 bg-app-surface/95 backdrop-blur-xs',
        className
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-caption-text text-ink-muted mb-2">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-ink-subtle">/</span>}
                {crumb.href && !isLast ? (
                  <a href={crumb.href} className="hover:text-ink transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className={cn(isLast && 'text-ink font-medium')}>{crumb.label}</span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-title-page font-semibold tracking-tight text-ink leading-tight">
              {title}
            </h1>
            {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
          </div>
          {description && (
            <p className="text-body-default text-ink-muted leading-normal line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
