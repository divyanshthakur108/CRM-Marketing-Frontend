import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-neutral-200 border border-neutral-300', className)}
      {...props}
    />
  );
}
