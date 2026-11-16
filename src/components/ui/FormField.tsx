import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      hint,
      error,
      required = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('w-full space-y-1.5 text-left', className)} {...props}>
        {label && (
          <label
            htmlFor={htmlFor}
            className="block text-caption-text font-medium text-ink-muted"
          >
            {label}
            {required && <span className="text-feedback-danger ml-0.5">*</span>}
          </label>
        )}
        {children}
        {error ? (
          <p className="text-caption-text font-medium text-feedback-danger mt-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p className="text-caption-text text-ink-muted mt-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

