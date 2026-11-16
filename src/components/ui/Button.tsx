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
      'inline-flex items-center justify-center font-medium rounded-control transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      primary:
        'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 border border-zinc-950 shadow-xs',
      secondary:
        'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100 shadow-xs',
      outline:
        'bg-transparent text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-xs',
      ghost:
        'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200/60',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent shadow-xs',
      link:
        'text-zinc-900 underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const sizes = {
      sm: 'h-[32px] px-3 text-[12px] gap-1.5',
      md: 'h-[38px] px-4 text-[13px] gap-2',
      lg: 'h-[44px] px-5 text-[14px] gap-2.5',
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
