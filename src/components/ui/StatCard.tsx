import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: string | number;
  trendDirection?: TrendDirection;
  trendLabel?: string;
  helperText?: string;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  badge?: React.ReactNode;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      change,
      trendDirection,
      trendLabel,
      helperText,
      icon,
      sparkline,
      badge,
      ...props
    },
    ref
  ) => {
    // Determine trend visual style
    const getTrendBadge = () => {
      if (!change && !trendDirection) return null;

      const direction: TrendDirection =
        trendDirection ||
        (typeof change === 'number'
          ? change > 0
            ? 'up'
            : change < 0
            ? 'down'
            : 'neutral'
          : typeof change === 'string' && change.startsWith('+')
          ? 'up'
          : typeof change === 'string' && change.startsWith('-')
          ? 'down'
          : 'neutral');

      const isPositive = direction === 'up';
      const isNegative = direction === 'down';

      const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
      const toneClasses = isPositive
        ? 'text-feedback-success bg-feedback-success-soft'
        : isNegative
        ? 'text-feedback-danger bg-feedback-danger-soft'
        : 'text-ink-muted bg-app-surface-muted';

      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-pill text-[11px] font-medium leading-tight',
            toneClasses
          )}
        >
          <Icon className="w-3 h-3 shrink-0" />
          <span>{change}</span>
          {trendLabel && <span className="text-ink-muted ml-0.5">{trendLabel}</span>}
        </span>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-app-surface border border-app-border rounded-card p-5 shadow-card transition-all duration-150 flex flex-col justify-between',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-small-text font-medium text-ink-muted line-clamp-1">{label}</span>
          {icon && (
            <div className="p-2 rounded-control bg-app-surface-muted text-ink-muted shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-semibold text-ink tracking-tight tabular-nums">
            {value}
          </div>
          {badge ? badge : getTrendBadge()}
        </div>

        {(helperText || sparkline) && (
          <div className="mt-3 pt-3 border-t border-app-border/60 flex items-center justify-between text-caption-text text-ink-muted">
            {helperText && <span className="line-clamp-1">{helperText}</span>}
            {sparkline && <div className="shrink-0 ml-auto">{sparkline}</div>}
          </div>
        )}
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

