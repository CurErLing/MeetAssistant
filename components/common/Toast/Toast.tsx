
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 size={20} className="text-green-500" />,
  error: <AlertCircle size={20} className="text-red-500" />,
  info: <Info size={20} className="text-blue-500" />,
  warning: <AlertTriangle size={20} className="text-amber-500" />,
};

const styles = {
  success: "bg-white border-green-100 shadow-lg shadow-green-500/5",
  error: "bg-white border-red-100 shadow-lg shadow-red-500/5",
  info: "bg-white border-blue-100 shadow-lg shadow-blue-500/5",
  warning: "bg-white border-amber-100 shadow-lg shadow-amber-500/5",
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300); // Wait for animation
  };

  return (
    <div 
      className={`
        flex items-start gap-3 p-4 rounded-xl border min-w-[300px] max-w-md transition-all duration-300 transform
        ${styles[type]}
        ${isExiting ? 'opacity-0 translate-y-[-10px] scale-95' : 'opacity-100 translate-y-0 scale-100 animate-slide-in-top'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 text-sm font-medium text-slate-700 leading-relaxed">
        {message}
      </div>
      <button 
        onClick={handleClose} 
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100"
      >
        <X size={16} />
      </button>
    </div>
  );
};
