
import React, { useState, useEffect } from 'react';
import { User, Copy, Check, Edit2, LogOut, ShieldCheck } from 'lucide-react';
import { useToast } from '../../common/Toast';

interface ProfileViewProps {
  userId: string;
  userName: string;
  onUpdateName: (name: string) => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  userName,
  onUpdateName,
  onLogout
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const { success } = useToast();
  
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
    success("ID 已复制");
    setTimeout(() => setIsCopied(false), 2000);
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
                       <ShieldCheck size={12} /> 个人账号
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
                 <div className="flex-1 min-w-0 mr-4">
                    <div className="text-xs text-slate-500 mb-1">用户 ID (User ID)</div>
                    <div className="font-mono font-bold text-slate-700 text-sm break-all">{userId || "Loading..."}</div>
                 </div>
                 <button 
                   onClick={handleCopyId}
                   className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex-shrink-0"
                   title="复制 ID"
                 >
                    {isCopied ? <Check size={18} className="text-green-600"/> : <Copy size={18} />}
                 </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 pl-1">
                 这是您的唯一身份标识，仅用于系统识别。
              </p>
           </section>

           {/* Logout */}
           <div className="pt-6 border-t border-slate-100 flex justify-center">
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                 <LogOut size={16} /> 退出登录
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};
