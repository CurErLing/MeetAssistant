
import React from 'react';
import { User, LogOut } from 'lucide-react';

interface UserProfileProps {
  name: string;
  role: string;
  userId?: string;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  name, 
  role, 
  userId,
  onLogout 
}) => {
  return (
    <div className="flex items-center space-x-3 px-1 pt-1">
      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm overflow-hidden">
         <User size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate" title={name}>{name}</div>
        <div className="text-xs text-slate-500 truncate">{role}</div>
        {userId && <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">ID: {userId}</div>}
      </div>
      <button 
        onClick={onLogout}
        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
        title="退出登录"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};
