import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[12px] font-medium text-[#525252]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-[40px] w-full appearance-none bg-white px-3 py-2 text-[14px] text-[#0A0A0A] rounded-[8px] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] disabled:opacity-50 transition-all duration-150 pr-9',
              error && 'border-[#B91C1C] focus:ring-[#B91C1C] bg-[#FEF2F2]/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#525252]">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
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

Select.displayName = 'Select';
