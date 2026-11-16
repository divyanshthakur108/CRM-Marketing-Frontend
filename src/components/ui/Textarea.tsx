import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-caption-text font-medium text-ink-muted"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full bg-app-surface px-3 py-2 text-body-default text-ink rounded-control border border-app-border-control placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:cursor-not-allowed disabled:bg-app-surface-muted disabled:opacity-60 transition-all duration-150 shadow-xs',
            error && 'border-feedback-danger focus:ring-feedback-danger bg-feedback-danger-soft/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-caption-text font-medium text-feedback-danger mt-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className="text-caption-text text-ink-muted mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
