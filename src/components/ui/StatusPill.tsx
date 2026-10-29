import React from 'react';
import { cn } from '../../lib/utils';
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

interface StatusPillProps {
  status: PlanningStatus;
  className?: string;
  showIcon?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const statusConfig: Record<
    PlanningStatus,
    { label: string; styles: string; icon: React.ElementType }
  > = {
    Draft: {
      label: 'Draft',
      styles: 'bg-white text-[#525252] border border-[#E5E5E5] font-medium',
      icon: FileText,
    },
    Generated: {
      label: 'Generated',
      styles: 'bg-[#F5F5F5] text-[#0A0A0A] border border-[#E5E5E5] font-medium',
      icon: Sparkles,
    },
    Approved: {
      label: 'Approved',
      styles: 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] font-medium',
      icon: Check,
    },
    Scheduled: {
      label: 'Scheduled',
      styles: 'bg-[#0A0A0A] text-white border border-[#0A0A0A] font-medium',
      icon: Clock,
    },
    'In Review': {
      label: 'In review',
      styles: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-medium',
      icon: Clock,
    },
    Published: {
      label: 'Published',
      styles: 'bg-[#0A0A0A] text-white border border-[#0A0A0A] font-medium',
      icon: Play,
    },
    Launching: {
      label: 'Launching',
      styles: 'bg-[#0A0A0A] text-white border border-[#0A0A0A] font-medium animate-pulse',
      icon: Send,
    },
    'Active/Done': {
      label: 'Active',
      styles: 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] font-medium',
      icon: Play,
    },
    'Needs Action': {
      label: 'Needs action',
      styles: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] font-medium',
      icon: AlertCircle,
    },
    Paused: {
      label: 'Paused',
      styles: 'bg-[#F5F5F5] text-[#737373] border border-[#E5E5E5] font-medium',
      icon: Pause,
    },
  };

  const config = statusConfig[status] || statusConfig['Draft'];
  const IconComponent = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[12px] px-2.5 py-0.5 rounded-full select-none',
        config.styles,
        className
      )}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
