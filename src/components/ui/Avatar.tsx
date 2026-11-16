import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

const sizeStyles: Record<AvatarSize, { box: string; text: string; status: string }> = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]', status: 'w-1.5 h-1.5 ring-1' },
  sm: { box: 'w-7 h-7', text: 'text-[11px]', status: 'w-2 h-2 ring-1' },
  md: { box: 'w-9 h-9', text: 'text-[13px]', status: 'w-2.5 h-2.5 ring-2' },
  lg: { box: 'w-11 h-11', text: 'text-[15px]', status: 'w-3 h-3 ring-2' },
  xl: { box: 'w-14 h-14', text: 'text-[18px]', status: 'w-3.5 h-3.5 ring-2' },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-feedback-success',
  offline: 'bg-ink-subtle',
  busy: 'bg-feedback-danger',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate consistent background color based on name string
function getAvatarBg(name?: string): string {
  if (!name) return 'bg-brand-primary-soft text-brand-primary';
  const colors = [
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-amber-50 text-amber-800 border-amber-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-purple-50 text-purple-700 border-purple-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, alt, size = 'md', status, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const sizeConfig = sizeStyles[size] || sizeStyles.md;
    const initials = getInitials(name);
    const colorClass = getAvatarBg(name);

    const showImage = src && !imageError;

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full shrink-0 select-none overflow-visible',
          sizeConfig.box,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'w-full h-full rounded-full overflow-hidden flex items-center justify-center font-medium border border-app-border',
            showImage ? 'bg-app-surface-muted' : colorClass,
            sizeConfig.text
          )}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {status && (
          <span
            aria-label={`Status: ${status}`}
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-app-surface',
              sizeConfig.status,
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

