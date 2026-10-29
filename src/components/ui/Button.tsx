import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-[8px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer';

    const variants = {
      primary: 'bg-[#0A0A0A] text-white hover:bg-[#171717] active:bg-[#262626] border border-[#0A0A0A] shadow-xs',
      secondary: 'bg-white text-[#0A0A0A] border border-[#E5E5E5] hover:bg-[#F5F5F5] active:bg-neutral-100 shadow-xs',
      outline: 'bg-white text-[#0A0A0A] border border-[#E5E5E5] hover:bg-[#F5F5F5] hover:border-[#A3A3A3] shadow-xs',
      ghost: 'bg-transparent text-[#0A0A0A] hover:bg-[#F5F5F5] active:bg-neutral-100',
      destructive: 'bg-white text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEF2F2] active:bg-red-100',
      link: 'text-[#0A0A0A] underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const sizes = {
      sm: 'h-[32px] px-3 text-[12px] gap-1.5',
      md: 'h-[40px] px-4 text-[14px] gap-2',
      lg: 'h-[48px] px-6 text-[15px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
