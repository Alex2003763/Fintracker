import React from 'react';
import BaseModal from './BaseModal';
import { Button } from './ModalForm';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger';
  cancelButtonText?: string;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmButtonText = 'Confirm',
    confirmButtonVariant = 'primary',
    cancelButtonText = 'Cancel',
    loading = false
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      animation="scale"
      aria-label={`Confirmation: ${title}`}
    >
      <div className="p-6">
        <div className="text-[rgb(var(--color-text-muted-rgb))] mb-6 leading-relaxed">
          {message}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelButtonText}
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmationModal;