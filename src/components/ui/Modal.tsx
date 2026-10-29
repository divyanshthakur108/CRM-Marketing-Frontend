import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps extends DialogPrimitive.DialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-[#E5E5E5] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.12)] duration-150 rounded-[10px] max-h-[90vh] overflow-y-auto',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 p-1.5 rounded-[8px] text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1 text-left border-b border-[#E5E5E5] pb-3', className)} {...props} />
);
ModalHeader.displayName = 'ModalHeader';

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-[16px] font-semibold text-[#0A0A0A] leading-none tracking-tight', className)}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-[14px] text-[#525252]', className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-[#E5E5E5]', className)}
    {...props}
  />
);
ModalFooter.displayName = 'ModalFooter';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
  ...props
}) => {
  const isControlled = isOpen !== undefined;
  return (
    <DialogPrimitive.Root
      open={isControlled ? isOpen : open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && onClose) onClose();
        if (onOpenChange) onOpenChange(nextOpen);
      }}
      {...props}
    >
      {title ? (
        <ModalContent className={className}>
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            {description && <ModalDescription>{description}</ModalDescription>}
          </ModalHeader>
          {children}
        </ModalContent>
      ) : (
        children
      )}
    </DialogPrimitive.Root>
  );
};
