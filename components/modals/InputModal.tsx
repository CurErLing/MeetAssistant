
import React, { useState } from 'react';
import { Button } from '../common/Button';
import { BaseModal } from './BaseModal';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  label: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  confirmText?: string;
  placeholder?: string;
  maxWidth?: string;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  title,
  label,
  initialValue,
  onConfirm,
  confirmText = "保存",
  placeholder,
  maxWidth = "max-w-sm"
}) => {
  const [value, setValue] = useState(initialValue);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      title={title}
      footer={
        <>
          <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1" 
            disabled={!value.trim() || value === initialValue}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
        <input 
          autoFocus
          className="w-full text-base font-medium text-slate-900 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder={placeholder}
        />
      </div>
    </BaseModal>
  );
};
