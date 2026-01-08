
import React, { useState } from 'react';
import { User, Copy, Check, Users, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../common/Button';

interface ProfileViewProps {
  userId: string;
  teamId: string;
  onSwitchTeam: (id: string) => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  teamId,
  onSwitchTeam,
  onLogout
}) => {
  const [inputTeamId, setInputTeamId] = useState(teamId);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveTeam = () => {
    if (inputTeamId.trim() && inputTeamId !== teamId) {
      onSwitchTeam(inputTeamId.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in bg-slate-50/50 h-full overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header / Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
              <User size={200} />
           </div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl border-4 border-white/20">
                 <User size={48} />
              </div>
              <div>
                 <h2 className="text-3xl font-bold mb-2">邱</h2>
                 <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1.5">
                       <ShieldCheck size={12} /> Pro 版本
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
           
           {/* Section 1: User Info */}
           <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">基础信息</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between group">
                 <div>
                    <div className="text-xs text-slate-500 mb-1">用户 ID (User ID)</div>
                    <div className="font-mono font-bold text-slate-700 text-sm break-all">{userId || "Loading..."}</div>
                 </div>
                 <button 
                   onClick={handleCopyId}
                   className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                   title="复制 ID"
                 >
                    {isCopied ? <Check size={18} className="text-green-600"/> : <Copy size={18} />}
                 </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 pl-1">
                 这是您的唯一身份标识，仅用于系统识别。
              </p>
           </section>

           {/* Section 2: Team Settings */}
           <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">团队协作</h3>
              
              <div className="space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                       <Users size={24} />
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-slate-800 mb-1">加入团队 / 切换项目</h4>
                       <p className="text-sm text-slate-500 mb-3">
                          输入团队 ID 以访问共享的会议记录和资源。所有拥有相同团队 ID 的成员将共享工作空间。
                       </p>
                       
                       <div className="flex gap-2">
                          <input 
                            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                            placeholder="输入 Team UUID"
                            value={inputTeamId}
                            onChange={(e) => setInputTeamId(e.target.value)}
                          />
                          <Button 
                            onClick={handleSaveTeam}
                            disabled={!inputTeamId.trim() || inputTeamId === teamId}
                            icon={<ArrowRight size={16} />}
                          >
                            切换
                          </Button>
                       </div>
                       
                       {teamId && (
                          <div className="mt-3 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100 inline-block">
                             当前所在团队: <span className="font-mono font-bold ml-1">{teamId}</span>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </section>

           {/* Logout */}
           <div className="pt-6 border-t border-slate-100 flex justify-center">
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                 <LogOut size={16} /> 退出登录
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};
