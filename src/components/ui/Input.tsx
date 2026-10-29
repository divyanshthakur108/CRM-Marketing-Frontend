import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[12px] font-medium text-[#525252]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-[40px] w-full bg-white px-3 py-2 text-[14px] text-[#0A0A0A] rounded-[8px] border border-[#E5E5E5] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] disabled:opacity-50 transition-all duration-150',
            error && 'border-[#B91C1C] focus:ring-[#B91C1C] bg-[#FEF2F2]/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[12px] font-medium text-[#B91C1C] mt-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className="text-[12px] text-[#737373] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
