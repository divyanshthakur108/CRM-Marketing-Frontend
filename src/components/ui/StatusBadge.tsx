import React from 'react';
import { cn } from '../../lib/utils';

export type StandardStatus =
  | 'draft'
  | 'ready_for_review'
  | 'pending_approval'
  | 'approved'
  | 'changes_requested'
  | 'rejected'
  | 'stale'
  | 'failed'
  | 'generating'
  | 'active'
  | 'published'
  | 'scheduled'
  | 'paused'
  | 'in_review'
  | string;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StandardStatus;
  label?: string;
  showDot?: boolean;
  className?: string;
}

interface StatusVisualConfig {
  label: string;
  dotColor: string;
  badgeClass: string;
}

export function getStatusConfig(rawStatus?: string | null): StatusVisualConfig {
  const normalized = (rawStatus || '').toLowerCase().trim();

  switch (normalized) {
    case 'approved':
      return {
        label: 'Approved',
        dotColor: 'bg-[#15803D]',
        badgeClass: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      };
    case 'active':
    case 'published':
    case 'active/done':
      return {
        label: 'Active',
        dotColor: 'bg-[#15803D]',
        badgeClass: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      };
    case 'pending':
    case 'pending_approval':
      return {
        label: 'Pending review',
        dotColor: 'bg-[#B45309]',
        badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      };
    case 'changes_requested':
      return {
        label: 'Changes requested',
        dotColor: 'bg-[#B45309]',
        badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      };
    case 'stale':
    case 'outdated':
      return {
        label: 'Outdated',
        dotColor: 'bg-[#B45309]',
        badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      };
    case 'ready_for_review':
    case 'ready':
      return {
        label: 'Ready for review',
        dotColor: 'bg-[#525252]',
        badgeClass: 'bg-[#F5F5F5] text-[#0A0A0A] border-[#E5E5E5]',
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        dotColor: 'bg-[#525252]',
        badgeClass: 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]',
      };
    case 'in review':
    case 'in_review':
      return {
        label: 'In review',
        dotColor: 'bg-[#B45309]',
        badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      };
    case 'generating':
    case 'launching':
      return {
        label: 'Generating',
        dotColor: 'bg-[#525252] animate-pulse',
        badgeClass: 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]',
      };
    case 'failed':
      return {
        label: 'Failed',
        dotColor: 'bg-[#B91C1C]',
        badgeClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        dotColor: 'bg-[#B91C1C]',
        badgeClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      };
    case 'paused':
      return {
        label: 'Paused',
        dotColor: 'bg-[#525252]',
        badgeClass: 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]',
      };
    case 'draft':
    default:
      return {
        label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/_/g, ' ') : 'Draft',
        dotColor: 'bg-[#737373]',
        badgeClass: 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]',
      };
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
  className,
  ...props
}) => {
  const config = getStatusConfig(status);
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[12px] font-medium border select-none transition-colors duration-150',
        config.badgeClass,
        className
      )}
      {...props}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
};
