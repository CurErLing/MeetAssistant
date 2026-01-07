
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Button } from '../common/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningText?: string; // Optional highlighted warning (e.g., "Cannot be undone")
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'secondary'; // Determines button color
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  confirmText = "确认",
  cancelText = "取消",
  variant = 'danger',
  isLoading = false
}) => {
  const Icon = variant === 'danger' ? AlertTriangle : Info;
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-blue-500';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      title={
        <>
          <Icon size={20} className={iconColor} />
          <span>{title}</span>
        </>
      }
      footer={
        <>
          <Button onClick={onClose} variant="secondary" className="flex-1">
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={variant} 
            className="flex-1"
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-slate-600 font-medium leading-relaxed">
        {description}
      </div>
      {warningText && (
        <div className={`text-sm mt-3 p-2 rounded border ${
          variant === 'danger' 
            ? 'text-red-600 bg-red-50 border-red-100' 
            : 'text-blue-600 bg-blue-50 border-blue-100'
        }`}>
          {warningText}
        </div>
      )}
    </BaseModal>
  );
};
