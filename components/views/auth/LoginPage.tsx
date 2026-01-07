
import React, { useState, useEffect } from 'react';
import { Mic, Lock, ArrowRight, Loader2, AlertCircle, User, UserCircle2 } from 'lucide-react';
import { authService } from '../../../services/authService';

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
  onGuestLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState(''); // Password or OTP Code
  
  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Verification Code State
  const [countdown, setCountdown] = useState(0);

  // Helper to check if input looks like a phone number (simple digit check)
  const isPhone = /^\d+$/.test(identifier) && identifier.length > 3;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => setCountdown(0);
  }, []);

  const handleSendCode = () => {
    if (!identifier) {
        setError("请输入手机号");
        return;
    }
    if (!isPhone) {
        setError("请输入有效的手机号");
        return;
    }
    
    setError(null);
    setMessage(`验证码已发送至 ${identifier} (测试码: 123456)`);
    setCountdown(60);
    
    // Start countdown
    const timer = setInterval(() => {
        setCountdown((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // --- Mock Admin Login ---
    if (identifier === 'admin' && password === 'admin') {
        setTimeout(() => {
            onLoginSuccess({
                access_token: 'mock_admin_token',
                user: {
                    id: '1000000000', // 10位数 ID
                    email: 'admin@mock.com'
                }
            });
        }, 800);
        return;
    }

    // --- Real Auth Logic ---
    try {
      if (isPhone) {
        // Phone Auth Simulation
        // For prototype: any code works or specific '123456'
        console.log("Phone auth triggered for:", identifier);
        
        // Generate a random 10-digit ID for phone users
        const random10DigitId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        // Mock success for any phone number in prototype
        const mockPhoneSession = {
          access_token: 'mock_phone_token',
          user: {
            id: random10DigitId,
            email: `${identifier}@phone.mock`, // Mock email for internal consistency
            phone: identifier
          }
        };
        
        setTimeout(() => {
           onLoginSuccess(mockPhoneSession);
        }, 1000);
      } else {
        // Email Auth
        if (isLogin) {
          const { data, error } = await authService.signInWithPassword(identifier, password);
          if (error) throw error;
          if (data.session) onLoginSuccess(data.session);
        } else {
          const { error } = await authService.signUp(identifier, password);
          if (error) throw error;
          setMessage("注册成功！请检查您的邮箱完成验证，或直接尝试登录。");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (isLoginMode: boolean) => {
    setIsLogin(isLoginMode);
    setError(null);
    setMessage(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-slide-up border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-200 transform rotate-3 hover:rotate-0 transition-transform duration-500">
             <Mic size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">积木会议助手</h1>
          <p className="text-slate-500 text-sm mt-2">专业的智能会议录音与分析工具</p>
        </div>

        {/* Form Content */}
        <div className="p-8">
           {/* Login/Register Toggle */}
           <div className="flex items-center justify-center mb-8">
              <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
                 <button 
                   onClick={() => handleToggle(true)}
                   className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   登录
                 </button>
                 <button 
                   onClick={() => handleToggle(false)}
                   className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   注册
                 </button>
              </div>
           </div>

           {error && (
             <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-600 text-xs font-medium animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
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
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    账号
                 </label>
                 <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                       <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder="邮箱 / 手机号 / admin"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                 </div>
              </div>
              
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    {isPhone ? '验证码 / 密码' : '密码'}
                 </label>
                 <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                       <Lock size={18} />
                    </div>
                    
                    <div className="flex gap-2">
                       <input 
                          type={isPhone ? "text" : "password"}
                          required
                          minLength={isPhone ? 4 : 5}
                          className="flex-1 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                          placeholder={isPhone ? "输入验证码" : "••••••••"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                       />
                       {isPhone && !isLogin && (
                          <button 
                            type="button" 
                            onClick={handleSendCode}
                            disabled={countdown > 0}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${countdown > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          >
                             {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                          </button>
                       )}
                    </div>
                 </div>
              </div>

              <div className="pt-4 space-y-3">
                 <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                 >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{isLogin ? '登录中...' : '注册中...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isLogin ? '立即登录' : '创建账号'}</span>
                        <ArrowRight size={18} />
                      </>
                    )}
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
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
           {isLogin ? '还没有账号？' : '已有账号？'}
           <button onClick={() => handleToggle(!isLogin)} className="font-bold text-blue-600 hover:underline ml-1">
             {isLogin ? '免费注册' : '直接登录'}
           </button>
        </div>
      </div>
    </div>
  );
};
