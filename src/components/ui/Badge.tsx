import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  // Legacy variant names for 100% backward compatibility
  | 'active'
  | 'approved'
  | 'pending'
  | 'draft'
  | 'rejected'
  | 'mock';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<string, { badge: string; dot: string }> = {
  neutral: {
    badge: 'bg-app-surface-muted text-ink-muted border-app-border',
    dot: 'bg-ink-subtle',
  },
  primary: {
    badge: 'bg-brand-primary-soft text-brand-primary border-brand-primary/20',
    dot: 'bg-brand-primary',
  },
  success: {
    badge: 'bg-feedback-success-soft text-feedback-success border-feedback-success/20',
    dot: 'bg-feedback-success-icon',
  },
  warning: {
    badge: 'bg-feedback-warning-soft text-feedback-warning border-feedback-warning/20',
    dot: 'bg-feedback-warning-icon',
  },
  danger: {
    badge: 'bg-feedback-danger-soft text-feedback-danger border-feedback-danger/20',
    dot: 'bg-feedback-danger-icon',
  },
  info: {
    badge: 'bg-feedback-info-soft text-feedback-info border-feedback-info/20',
    dot: 'bg-feedback-info-icon',
  },
  outline: {
    badge: 'bg-transparent text-ink border-app-border',
    dot: 'bg-ink-muted',
  },
  // Legacy maps
  active: {
    badge: 'bg-brand-primary-soft text-brand-primary border-brand-primary/20',
    dot: 'bg-brand-primary',
  },
  approved: {
    badge: 'bg-feedback-success-soft text-feedback-success border-feedback-success/20',
    dot: 'bg-feedback-success-icon',
  },
  pending: {
    badge: 'bg-feedback-warning-soft text-feedback-warning border-feedback-warning/20',
    dot: 'bg-feedback-warning-icon',
  },
  draft: {
    badge: 'bg-app-surface-muted text-ink-muted border-app-border',
    dot: 'bg-ink-subtle',
  },
  rejected: {
    badge: 'bg-feedback-danger-soft text-feedback-danger border-feedback-danger/20',
    dot: 'bg-feedback-danger-icon',
  },
  mock: {
    badge: 'bg-app-surface-muted text-ink-muted border-app-border tracking-wider uppercase text-[10px]',
    dot: 'bg-ink-subtle',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] leading-tight px-2 py-0.5 gap-1',
  md: 'text-[12px] leading-tight px-2.5 py-0.5 gap-1.5',
};

/** Core design system Badge component with dot, icon, and semantic tone support */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'neutral',
      size = 'md',
      dot = false,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const config = variantStyles[variant] || variantStyles.neutral;
    const sizeCls = sizeStyles[size] || sizeStyles.md;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium border rounded-pill select-none transition-colors duration-150',
          config.badge,
          sizeCls,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            aria-hidden="true"
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)}
          />
        )}
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
