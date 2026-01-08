
import React from 'react';
import { User, Users, ShieldCheck } from 'lucide-react';

interface UserProfileProps {
  name: string;
  role: string;
  teamId?: string;
  onProfileClick?: () => void;
  onSwitchTeam?: (id: string) => void;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  name, 
  role, 
  teamId,
  onProfileClick
}) => {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div 
        className="flex items-center space-x-3 px-2 py-2 -mx-1 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-all group"
        onClick={onProfileClick}
        title="查看个人中心"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
           <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
            {name}
            <ShieldCheck size={12} className="text-blue-500" />
          </div>
          <div className="text-xs text-slate-400 truncate">{role}</div>
        </div>
      </div>

      {/* Team Indicator */}
      <div className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
         <Users size={12} className="text-slate-400" />
         <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-slate-500">当前团队</span>
            <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px] leading-tight">
              {teamId ? teamId : 'Default'}
            </span>
         </div>
      </div>
    </div>
  );
};
