import React from 'react';
import { Badge, BadgeVariant } from './Badge';
import { Check, Clock, AlertCircle, Play, Pause, Sparkles, FileText, Send } from 'lucide-react';

export type PlanningStatus =
  | 'Draft'
  | 'Generated'
  | 'Approved'
  | 'Scheduled'
  | 'Launching'
  | 'Active/Done'
  | 'Needs Action'
  | 'Paused'
  | 'In Review'
  | 'Published';

export interface StatusPillProps {
  status: PlanningStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  PlanningStatus,
  { label: string; variant: BadgeVariant; icon: React.ElementType }
> = {
  Draft: {
    label: 'Draft',
    variant: 'neutral',
    icon: FileText,
  },
  Generated: {
    label: 'Generated',
    variant: 'primary',
    icon: Sparkles,
  },
  Approved: {
    label: 'Approved',
    variant: 'success',
    icon: Check,
  },
  Scheduled: {
    label: 'Scheduled',
    variant: 'info',
    icon: Clock,
  },
  'In Review': {
    label: 'In review',
    variant: 'warning',
    icon: Clock,
  },
  Published: {
    label: 'Published',
    variant: 'success',
    icon: Play,
  },
  Launching: {
    label: 'Launching',
    variant: 'primary',
    icon: Send,
  },
  'Active/Done': {
    label: 'Active',
    variant: 'success',
    icon: Play,
  },
  'Needs Action': {
    label: 'Needs action',
    variant: 'danger',
    icon: AlertCircle,
  },
  Paused: {
    label: 'Paused',
    variant: 'neutral',
    icon: Pause,
  },
};

/**
 * StatusPill is a thin semantic wrapper around the core Badge primitive.
 * Preserves existing PlanningStatus types and icon display.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const config = statusConfig[status] || statusConfig['Draft'];
  const IconComponent = config.icon;

  return (
    <Badge
      variant={config.variant}
      icon={showIcon ? <IconComponent className="w-3.5 h-3.5 shrink-0" /> : undefined}
      className={className}
    >
      {config.label}
    </Badge>
  );
};
