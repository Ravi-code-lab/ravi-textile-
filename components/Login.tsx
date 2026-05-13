
import React, { useState } from 'react';
import { Scissors, Lock, User, ArrowRight } from 'lucide-react';
import { CompanyInfo } from '../types';

interface LoginProps {
  onLogin: (u: string, p: string) => boolean;
  companyInfo: CompanyInfo;
}

const Login: React.FC<LoginProps> = ({ onLogin, companyInfo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      setError('');
    } else {
      setError('Invalid credentials. Please use admin/admin.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      {/* Moving Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-4 transform rotate-3 hover:rotate-6 transition-transform duration-500 overflow-hidden">
            {companyInfo.logoUrl ? (
                <img src={companyInfo.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex items-center justify-center">
                    <Scissors className="w-10 h-10 text-white" />
                </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{companyInfo.name}</h1>
          <p className="text-indigo-200 text-sm mt-2 font-medium tracking-wide uppercase">Enterprise Operating System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center font-medium backdrop-blur-sm animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <User className="w-5 h-5 text-indigo-300 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-indigo-400 transition-all shadow-inner"
                placeholder="Enter ID"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-indigo-300 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-indigo-400 transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
          >
            Access Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-4 flex justify-between items-center">
          <p className="text-xs text-indigo-300/60">
            Secure Environment v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
