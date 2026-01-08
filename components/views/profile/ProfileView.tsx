
import React, { useState, useEffect } from 'react';
import { User, Copy, Check, Users, LogOut, ArrowRight, ShieldCheck, Edit2, Plus, LogIn, X, Building } from 'lucide-react';
import { Button } from '../../common/Button';

interface ProfileViewProps {
  userId: string;
  userName: string;
  teamId: string;
  onSwitchTeam: (id: string) => void;
  onUpdateName: (name: string) => void;
  onLogout?: () => void;
}

// Simple fallback UUID generator if crypto is not available (e.g. non-secure context)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  userName,
  teamId,
  onSwitchTeam,
  onUpdateName,
  onLogout
}) => {
  const [inputTeamId, setInputTeamId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Team Mode State: 'select' (buttons) | 'join' (input)
  const [teamMode, setTeamMode] = useState<'select' | 'join'>('select');
  
  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Sync tempName if userName changes externally
  useEffect(() => {
    setTempName(userName);
  }, [userName]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveTeam = () => {
    if (inputTeamId.trim() && inputTeamId !== teamId) {
      onSwitchTeam(inputTeamId.trim());
      setTeamMode('select'); // Reset to selection mode after saving
      setInputTeamId('');
    }
  };

  const handleCreateTeam = () => {
    // Generate a new UUID for the new team using safe generator
    const newTeamId = generateUUID();
    if (confirm("系统将为您生成一个新的团队 ID 并自动切换。\n确认创建吗？")) {
        onSwitchTeam(newTeamId);
    }
  };

  const handleExitTeam = () => {
    if (confirm("确定要退出当前团队吗？退出后将无法访问团队共享的数据。")) {
        onSwitchTeam(''); // Clear team ID
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
    } else {
      setTempName(userName); // Revert if empty
    }
    setIsEditingName(false);
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
                 {isEditingName ? (
                    <div className="flex items-center gap-2 mb-2">
                       <input 
                         className="text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-white/50 text-white focus:outline-none w-full max-w-[240px] placeholder:text-white/50"
                         value={tempName}
                         onChange={(e) => setTempName(e.target.value)}
                         autoFocus
                         onBlur={handleSaveName}
                         onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                       />
                       <button onClick={handleSaveName} className="p-1 hover:bg-white/20 rounded transition-colors"><Check size={24} /></button>
                    </div>
                 ) : (
                    <div className="flex items-center gap-3 mb-2 group">
                       <h2 className="text-3xl font-bold">{userName}</h2>
                       <button 
                         onClick={() => setIsEditingName(true)} 
                         className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                         title="修改昵称"
                       >
                         <Edit2 size={18} />
                       </button>
                    </div>
                 )}
                 
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
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                       <Users size={24} />
                    </div>
                    <div className="flex-1 w-full">
                       <h4 className="font-bold text-slate-800 mb-1">团队空间设置</h4>
                       <p className="text-sm text-slate-500 mb-4">
                          所有拥有相同团队 ID 的成员将共享会议记录、声纹库和热词配置。
                       </p>
                       
                       {teamId ? (
                           <div className="bg-green-50 rounded-xl p-4 border border-green-100 animate-fade-in">
                              <div className="flex items-center gap-2 mb-2 text-green-800 font-bold">
                                 <Building size={18} />
                                 <span>所属团队</span>
                              </div>
                              <div className="bg-white/60 p-2 rounded-lg font-mono text-sm text-green-700 border border-green-100/50 break-all mb-4">
                                 {teamId}
                              </div>
                              <Button 
                                onClick={handleExitTeam}
                                variant="danger"
                                size="sm"
                                icon={<LogOut size={14} />}
                                className="w-full justify-center bg-white border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                退出团队
                              </Button>
                           </div>
                       ) : (
                           <>
                               {teamMode === 'select' ? (
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <button 
                                        onClick={handleCreateTeam}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all group"
                                      >
                                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-600">
                                            <Plus size={20} />
                                         </div>
                                         <span className="font-bold text-sm">注册新团队</span>
                                         <span className="text-[10px] text-slate-400 font-normal">生成新的唯一 ID</span>
                                      </button>

                                      <button 
                                        onClick={() => setTeamMode('join')}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
                                      >
                                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600">
                                            <LogIn size={20} />
                                         </div>
                                         <span className="font-bold text-sm">加入现有团队</span>
                                         <span className="text-[10px] text-slate-400 font-normal">输入 ID 进行绑定</span>
                                      </button>
                                   </div>
                               ) : (
                                   <div className="animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">输入团队 ID</span>
                                        <button onClick={() => setTeamMode('select')} className="text-slate-400 hover:text-slate-600">
                                           <X size={16} />
                                        </button>
                                      </div>
                                      <div className="flex gap-2">
                                          <input 
                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white"
                                            placeholder="请输入 Team UUID"
                                            value={inputTeamId}
                                            onChange={(e) => setInputTeamId(e.target.value)}
                                            autoFocus
                                          />
                                          <Button 
                                            onClick={handleSaveTeam}
                                            disabled={!inputTeamId.trim() || inputTeamId === teamId}
                                            size="sm"
                                          >
                                            绑定
                                          </Button>
                                      </div>
                                   </div>
                               )}
                           </>
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
