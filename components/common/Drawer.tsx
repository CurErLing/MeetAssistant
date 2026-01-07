
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string; // e.g., "w-4/5 max-w-xs"
  showCloseButton?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  width = "w-4/5 max-w-xs",
  showCloseButton = true
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const slideAnimation = position === 'left' ? 'animate-slide-right' : 'animate-slide-left';
  const positionClass = position === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>
      
      {/* Drawer Panel */}
      <div className={`relative ${width} bg-white h-full shadow-2xl ${slideAnimation} flex flex-col ${positionClass}`}>
         {showCloseButton && (
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10 transition-colors"
           >
             <X size={20} />
           </button>
         )}
         {children}
      </div>
    </div>
  );
};
