import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';

/**
 * Reusable Admin Modal Dialog built on Radix Dialog
 */
export const AdminModal = ({
  isOpen,
  onClose,
  title,
  description = null,
  children,
  confirmLabel = 'Save changes',
  cancelLabel = 'Cancel',
  onConfirm = null,
  isConfirming = false,
  confirmVariant = 'nfiYellow',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  footer = null,
}) => {
  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${sizeMap[size] || sizeMap.md} p-0 overflow-hidden`}>
        {/* Modal Header */}
        <DialogHeader className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-[#284661] text-left">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-slate-500 text-left mt-0.5">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Modal Footer */}
        {footer !== false && (
          <DialogFooter className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-row items-center justify-end gap-2.5">
            {footer ? (
              footer
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isConfirming}
                  className="rounded-lg text-xs font-semibold px-4"
                >
                  {cancelLabel}
                </Button>
                {onConfirm && (
                  <Button
                    type="button"
                    variant={confirmVariant}
                    size="sm"
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className="rounded-lg text-xs font-bold px-5 shadow-2xs"
                  >
                    {isConfirming ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      confirmLabel
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;
