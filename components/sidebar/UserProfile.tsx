
import React from 'react';
import { User, LogOut } from 'lucide-react';

interface UserProfileProps {
  name: string;
  role: string;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  name, 
  role, 
  onLogout 
}) => {
  return (
    <div className="flex items-center space-x-3 px-1 pt-1">
      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm">
         <User size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
        <div className="text-xs text-slate-500 truncate">{role}</div>
      </div>
      <button 
        onClick={onLogout}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        title="退出登录"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};
