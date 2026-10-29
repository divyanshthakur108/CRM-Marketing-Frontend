import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'active' | 'approved' | 'pending' | 'draft' | 'rejected' | 'mock' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'active',
  children,
  ...props
}) => {
  const variants = {
    active: 'bg-[#0A0A0A] text-white border border-[#0A0A0A] font-medium',
    approved: 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] font-medium',
    pending: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-medium',
    draft: 'bg-white text-[#525252] border border-[#E5E5E5] font-medium',
    rejected: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] font-medium',
    mock: 'bg-[#0A0A0A] text-white text-[11px] font-medium px-2 py-0.5 rounded-[6px] tracking-wide',
    outline: 'bg-transparent text-[#0A0A0A] border border-[#E5E5E5] font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center text-[12px] px-2.5 py-0.5 rounded-full select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
