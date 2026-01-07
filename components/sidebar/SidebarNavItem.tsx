
import React from 'react';

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  isMobile?: boolean;
  actions?: React.ReactNode;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ 
  icon, label, isActive, onClick, count, isMobile, actions 
}) => {
  if (isMobile) {
    return (
      <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
        <span className="text-[10px] mt-1 font-medium">{label}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group mb-1 relative ${
        isActive 
          ? 'bg-slate-200/60 text-slate-900 font-semibold' 
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
      }`}
    >
      <div className={`flex-shrink-0 ${isActive ? 'text-current' : 'text-slate-400 group-hover:text-slate-700'}`}>
        {icon}
      </div>
      <div className="flex-1 flex items-center gap-2 min-w-0 text-left">
        <span className="text-sm truncate">{label}</span>
        {count !== undefined && (
           <span className={`text-xs font-medium ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
             ({count})
           </span>
        )}
      </div>
      {actions && (
        <div onClick={e => e.stopPropagation()} className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </button>
  );
};
