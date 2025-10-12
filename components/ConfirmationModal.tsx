import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmButtonText = 'Confirm',
    confirmButtonVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = {
      primary: 'bg-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:ring-[rgb(var(--color-primary-rgb))]',
      danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div 
        className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md transition-colors max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="confirmation-dialog-title" className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-[rgb(var(--color-text-muted-rgb))] mb-6">{message}</div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-card-muted-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClasses[confirmButtonVariant]}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;