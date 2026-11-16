import React from 'react';
import { Badge, BadgeVariant } from './Badge';

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

export interface StatusVisualConfig {
  label: string;
  dotColor: string;
  badgeClass: string;
  variant: BadgeVariant;
}

export function getStatusConfig(rawStatus?: string | null): StatusVisualConfig {
  const normalized = (rawStatus || '').toLowerCase().trim();

  switch (normalized) {
    case 'approved':
      return {
        label: 'Approved',
        dotColor: 'bg-feedback-success-icon',
        badgeClass: 'bg-feedback-success-soft text-feedback-success border-feedback-success/20',
        variant: 'success',
      };
    case 'active':
    case 'published':
    case 'active/done':
      return {
        label: 'Active',
        dotColor: 'bg-feedback-success-icon',
        badgeClass: 'bg-feedback-success-soft text-feedback-success border-feedback-success/20',
        variant: 'success',
      };
    case 'pending':
    case 'pending_approval':
      return {
        label: 'Pending review',
        dotColor: 'bg-feedback-warning-icon',
        badgeClass: 'bg-feedback-warning-soft text-feedback-warning border-feedback-warning/20',
        variant: 'warning',
      };
    case 'changes_requested':
      return {
        label: 'Changes requested',
        dotColor: 'bg-feedback-warning-icon',
        badgeClass: 'bg-feedback-warning-soft text-feedback-warning border-feedback-warning/20',
        variant: 'warning',
      };
    case 'stale':
    case 'outdated':
      return {
        label: 'Outdated',
        dotColor: 'bg-feedback-warning-icon',
        badgeClass: 'bg-feedback-warning-soft text-feedback-warning border-feedback-warning/20',
        variant: 'warning',
      };
    case 'ready_for_review':
    case 'ready':
      return {
        label: 'Ready for review',
        dotColor: 'bg-brand-primary',
        badgeClass: 'bg-brand-primary-soft text-brand-primary border-brand-primary/20',
        variant: 'primary',
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        dotColor: 'bg-feedback-info-icon',
        badgeClass: 'bg-feedback-info-soft text-feedback-info border-feedback-info/20',
        variant: 'info',
      };
    case 'in review':
    case 'in_review':
      return {
        label: 'In review',
        dotColor: 'bg-feedback-warning-icon',
        badgeClass: 'bg-feedback-warning-soft text-feedback-warning border-feedback-warning/20',
        variant: 'warning',
      };
    case 'generating':
    case 'launching':
      return {
        label: 'Generating',
        dotColor: 'bg-brand-primary',
        badgeClass: 'bg-brand-primary-soft text-brand-primary border-brand-primary/20',
        variant: 'primary',
      };
    case 'failed':
      return {
        label: 'Failed',
        dotColor: 'bg-feedback-danger-icon',
        badgeClass: 'bg-feedback-danger-soft text-feedback-danger border-feedback-danger/20',
        variant: 'danger',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        dotColor: 'bg-feedback-danger-icon',
        badgeClass: 'bg-feedback-danger-soft text-feedback-danger border-feedback-danger/20',
        variant: 'danger',
      };
    case 'paused':
      return {
        label: 'Paused',
        dotColor: 'bg-ink-muted',
        badgeClass: 'bg-app-surface-muted text-ink-muted border-app-border',
        variant: 'neutral',
      };
    // CRM Pipeline Stages
    case 'new':
      return {
        label: 'New Lead',
        dotColor: 'bg-[#10B981]',
        badgeClass: 'bg-[#E8F7F1] text-[#10B981] border-[#10B981]/25',
        variant: 'primary',
      };
    case 'contacted':
      return {
        label: 'Contacted',
        dotColor: 'bg-[#3B82F6]',
        badgeClass: 'bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]/25',
        variant: 'info',
      };
    case 'qualified':
      return {
        label: 'Qualified',
        dotColor: 'bg-[#8B5CF6]',
        badgeClass: 'bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6]/25',
        variant: 'primary',
      };
    case 'visit scheduled':
      return {
        label: 'Visit Scheduled',
        dotColor: 'bg-[#F59E0B]',
        badgeClass: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/25',
        variant: 'warning',
      };
    case 'visit done':
      return {
        label: 'Visit Done',
        dotColor: 'bg-[#06B6D4]',
        badgeClass: 'bg-[#ECFEFF] text-[#06B6D4] border-[#06B6D4]/25',
        variant: 'info',
      };
    case 'negotiation':
      return {
        label: 'Negotiation',
        dotColor: 'bg-[#059669]',
        badgeClass: 'bg-[#E8F7F1] text-[#059669] border-[#059669]/25',
        variant: 'success',
      };
    case 'won':
      return {
        label: 'Won',
        dotColor: 'bg-[#16A34A]',
        badgeClass: 'bg-[#DCFCE7] text-[#15803D] border-[#16A34A]/25',
        variant: 'success',
      };
    case 'won/lost':
      return {
        label: 'Won / Lost',
        dotColor: 'bg-[#16A34A]',
        badgeClass: 'bg-[#DCFCE7] text-[#15803D] border-[#16A34A]/25',
        variant: 'success',
      };
    case 'lost':
      return {
        label: 'Lost',
        dotColor: 'bg-[#64748B]',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        variant: 'neutral',
      };
    case 'draft':
    default:
      return {
        label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/_/g, ' ') : 'Draft',
        dotColor: 'bg-ink-subtle',
        badgeClass: 'bg-app-surface-muted text-ink-muted border-app-border',
        variant: 'neutral',
      };
  }
}

/**
 * StatusBadge is a thin semantic wrapper around the core Badge primitive.
 * Maintains 100% backward compatibility for all props and status names.
 */
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
    <Badge
      variant={config.variant}
      dot={showDot}
      className={className}
      {...props}
    >
      {displayLabel}
    </Badge>
  );
};
