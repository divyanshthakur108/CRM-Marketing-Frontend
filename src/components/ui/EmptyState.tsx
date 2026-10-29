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
        'flex flex-col items-center justify-center p-8 md:p-12 text-center border border-[#E5E5E5] bg-white rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#0A0A0A] flex items-center justify-center mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-semibold text-[#0A0A0A] mb-1.5">{title}</h3>
      {description && <p className="text-[14px] text-[#525252] max-w-md mb-6">{description}</p>}
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
