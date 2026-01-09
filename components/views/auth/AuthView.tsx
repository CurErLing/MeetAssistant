
import React, { useState, useEffect } from 'react';
import { Mic, Mail, Smartphone, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '../../common/Button';

interface AuthViewProps {
  onLogin: (identifier: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState(''); 
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Timer effect
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSwitchMethod = (newMethod: 'phone' | 'email') => {
    setMethod(newMethod);
    setIdentifier('');
    setPassword('');
    setCode('');
    setCountdown(0);
    setErrorMessage('');
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleGetCode = () => {
    if (!identifier.trim()) {
      setErrorMessage('请输入手机号码');
      return;
    }
    
    if (method === 'phone' && !validatePhone(identifier)) {
      setErrorMessage('请输入正确的11位手机号码');
      return;
    }

    setCountdown(60);
    // Auto-fill for demo purposes
    setCode('123456'); 
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
       setErrorMessage(`请输入${method === 'phone' ? '手机号' : '邮箱'}`);
       return;
    }

    if (method === 'phone' && !validatePhone(identifier)) {
       setErrorMessage('手机号码格式不正确');
       return;
    }
    
    // Basic mock validation
    if (method === 'phone' && !code) {
        // Ideally show error state
        return;
    }
    if (method === 'email' && !password) {
        return;
    }

    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
        setIsSubmitting(false);
        onLogin(identifier);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="mb-8 text-center animate-fade-in">
         <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <Mic size={32} />
         </div>
         <h1 className="text-2xl font-bold text-slate-900 tracking-tight">积木会议助手</h1>
         <p className="text-slate-500 mt-2">智能录音，精准转写，高效会议</p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slide-up">
         
         {/* Tabs */}
         <div className="flex border-b border-slate-100">
            <button 
              onClick={() => handleSwitchMethod('phone')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${method === 'phone' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
               <Smartphone size={18} /> 手机号登录
            </button>
            <button 
              onClick={() => handleSwitchMethod('email')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${method === 'email' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
               <Mail size={18} /> 邮箱登录
            </button>
         </div>

         <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
               
               {/* Input Fields */}
               {method === 'phone' ? (
                 <>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">手机号码</label>
                       <div className="relative">
                          <input 
                            type="tel"
                            className={`w-full pl-4 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 ${errorMessage ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                            placeholder="请输入手机号"
                            value={identifier}
                            onChange={(e) => {
                                setIdentifier(e.target.value);
                                setErrorMessage('');
                            }}
                            autoFocus
                            maxLength={11}
                          />
                       </div>
                       {errorMessage && <p className="text-xs text-red-500 mt-1.5 ml-1 animate-fade-in">{errorMessage}</p>}
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">验证码</label>
                       <div className="flex gap-3">
                          <input 
                            type="text"
                            className="flex-1 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                          />
                          <button 
                            type="button" 
                            onClick={handleGetCode}
                            disabled={!identifier || countdown > 0}
                            className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors whitespace-nowrap min-w-[100px] ${(!identifier || countdown > 0) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          >
                             {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                          </button>
                       </div>
                    </div>
                 </>
               ) : (
                 <>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">电子邮箱</label>
                       <div className="relative">
                          <input 
                            type="email"
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                            placeholder="name@example.com"
                            value={identifier}
                            onChange={(e) => {
                                setIdentifier(e.target.value);
                                setErrorMessage('');
                            }}
                            autoFocus
                            required
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">密码</label>
                       <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                       </div>
                    </div>
                 </>
               )}

               {/* Submit Button */}
               <Button 
                 type="submit" 
                 className="w-full h-12 text-base shadow-lg shadow-blue-200 mt-2" 
                 isLoading={isSubmitting}
                 disabled={!identifier || (method === 'phone' && !code) || (method === 'email' && !password)}
                 icon={<ArrowRight size={20} />}
               >
                 {method === 'phone' ? '登录 / 注册' : '登录'}
               </Button>

               <div className="text-center">
                  <p className="text-xs text-slate-400 leading-relaxed">
                     登录即代表您同意
                     <a href="#" className="text-blue-600 hover:underline mx-1">用户协议</a>
                     和
                     <a href="#" className="text-blue-600 hover:underline mx-1">隐私政策</a>
                  </p>
               </div>
            </form>
         </div>
         
         <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
               <ShieldCheck size={14} className="text-green-500" />
               <span>数据加密传输，保障您的信息安全</span>
            </div>
         </div>
      </div>
    </div>
  );
};
