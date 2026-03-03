"use client";

import { sileo } from "sileo";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText,
  confirmVariant,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const variantClasses = {
    danger: "bg-red-600 hover:bg-red-700 border-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700 border-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700 border-blue-700",
  };

  const handleCancel = () => {
    sileo.info({
      title: "Action cancelled",
      description: "No changes were made.",
      duration: 2000,
    });
    onCancel();
  };

  const handleConfirm = () => {
    // Close the dialog first so the loading toast from the action is visible
    onCancel();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-bg-base border-2 border-dashed border-border p-6 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_var(--color-border)]">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-text-primary font-mono mb-2">
            {title}
          </h3>
          <p className="text-text-secondary">{message}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border-2 border-border text-text-primary hover:bg-bg-surface transition-colors font-mono text-sm uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 border-2 text-white transition-colors font-mono text-sm uppercase tracking-widest ${variantClasses[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}