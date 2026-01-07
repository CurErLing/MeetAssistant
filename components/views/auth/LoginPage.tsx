
import React, { useState, useEffect } from 'react';
import { Mic, Lock, ArrowRight, Loader2, AlertCircle, User, UserCircle2, Info } from 'lucide-react';
import { authService } from '../../../services/authService';

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
  onGuestLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 自动将纯数字或用户名转换为测试邮箱，以便连接 Supabase
  const formatEmail = (input: string) => {
    if (input.includes('@')) return input;
    return `${input}@jimu.demo`; // 自动添加后缀
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Mock Admin (用于测试 UI，不连接数据库)
    if (identifier === 'admin' && password === 'admin') {
        setTimeout(() => {
            onLoginSuccess({
                access_token: 'mock_admin_token',
                user: { id: '1000000000', email: 'admin@mock.com' }
            });
        }, 800);
        return;
    }

    const email = formatEmail(identifier);
    const pass = password;

    try {
      if (isLogin) {
        // 尝试登录
        const { data, error } = await authService.signInWithPassword(email, pass);
        if (error) {
           // 如果登录失败，且错误是"无效凭证"，尝试自动注册（为了演示方便）
           if (error.message.includes('Invalid login') || error.message.includes('Email not confirmed')) {
               throw new Error("登录失败：账号不存在或密码错误。如果您是第一次使用，请点击“注册”按钮。");
           }
           throw error;
        }
        if (data.session) {
            onLoginSuccess(data.session);
        }
      } else {
        // 注册
        const { data, error } = await authService.signUp(email, pass);
        if (error) throw error;
        
        if (data.session) {
            onLoginSuccess(data.session); // 如果 Supabase 设置允许无需验证邮箱直接登录
        } else if (data.user) {
            setMessage(`注册成功！请检查您的邮箱 ${email} 进行验证。验证后请直接登录。`);
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "操作失败，请重试";
      
      // 针对 API Key 或网络问题的友好提示
      if (errMsg.includes('Failed to fetch') || errMsg.includes('API Key') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('jwt')) {
         errMsg = "无法连接到云端服务器 (API Key 无效或网络错误)。建议使用“访客试用”或“admin”账号体验完整功能。";
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (isLoginMode: boolean) => {
    setIsLogin(isLoginMode);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-slide-up border border-slate-100">
        
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-200">
             <Mic size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">积木会议助手</h1>
          <p className="text-slate-500 text-sm mt-2">专业的智能会议录音与分析工具</p>
        </div>

        <div className="p-8">
           {/* Demo Hint */}
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 text-xs text-blue-700">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                 <Info size={14} /> <span>快速体验通道</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-blue-600/80">
                 <li><strong>访客模式</strong>：点击底部“访客试用”无需登录</li>
                 <li><strong>管理员演示</strong>：账号 <code>admin</code> / 密码 <code>admin</code></li>
              </ul>
           </div>

           <div className="flex items-center justify-center mb-6">
              <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
                 <button onClick={() => handleToggle(true)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>登录</button>
                 <button onClick={() => handleToggle(false)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>注册</button>
              </div>
           </div>

           {error && (
             <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-600 text-xs font-medium animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
             </div>
           )}

           {message && (
             <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3 text-green-600 text-xs font-medium animate-fade-in">
                <div className="w-4 h-4 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <span>{message}</span>
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">账号 (邮箱/手机号)</label>
                 <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><User size={18} /></div>
                    <input 
                      type="text" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder={isLogin ? "输入 admin 或 邮箱" : "输入您的邮箱"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                 </div>
              </div>
              
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">密码</label>
                 <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><Lock size={18} /></div>
                    <input 
                      type="password" required minLength={4}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                 </div>
              </div>

              <div className="pt-4 space-y-3">
                 <button 
                   type="submit" disabled={loading}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                 >
                    {loading ? <><Loader2 size={20} className="animate-spin" /><span>请稍候...</span></> : <><span className="ml-1">{isLogin ? '登录 / 自动转换账号' : '立即注册'}</span><ArrowRight size={18} /></>}
                 </button>

                 <button
                   type="button"
                   onClick={onGuestLogin}
                   className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                 >
                    <UserCircle2 size={18} className="text-slate-400" />
                    <span>访客试用 (不保存数据)</span>
                 </button>
              </div>
           </form>
           
           <p className="mt-4 text-xs text-center text-slate-400">
             提示：输入纯数字账号将自动转换为 @jimu.demo 邮箱进行云端存储测试。
           </p>
        </div>
      </div>
    </div>
  );
};
