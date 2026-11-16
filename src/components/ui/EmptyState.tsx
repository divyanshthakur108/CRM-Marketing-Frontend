import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center border border-app-border bg-app-surface rounded-card shadow-card',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-app-surface-muted border border-app-border text-ink-muted flex items-center justify-center mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-title-section font-semibold text-ink mb-1.5">{title}</h3>
      {description && <p className="text-body-default text-ink-muted max-w-md mb-6">{description}</p>}
      {actionLabel && onAction ? (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : action ? (
        action
      ) : null}
    </div>
  );
};
