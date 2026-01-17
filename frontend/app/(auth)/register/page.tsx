'use client';

import { useAuth } from '@/contexts/auth-context';
import { ArrowRight, Loader2, Lock, Mail, Phone, Shield, Sparkles, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, verifyEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (step === 'form') {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        });
        setStep('otp');
      } else {
        await verifyEmail({ email: formData.email, otp: formData.otp });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Shield className="w-24 h-24" />
      </div>

      <div className="text-center mb-8 relative">
        <div className="inline-flex p-3 bg-primary-600/10 rounded-2xl border border-primary-500/20 mb-4">
          <Sparkles className="w-6 h-6 text-primary-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Join the Network
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          {step === 'otp' ? 'Enter the verification code sent to your email' : 'Secure access to premium Bangladeshi experts'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-bold mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 'form' ? (
          <>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 transition-colors"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 transition-colors"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="Phone Number (+880...)"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 transition-colors"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 transition-colors"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </>
        ) : (
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              maxLength={6}
              placeholder="6-Digit OTP"
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-primary-500 tracking-[0.5em] font-black text-center transition-colors"
              value={formData.otp}
              onChange={e => setFormData({...formData, otp: e.target.value})}
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 'otp' ? 'Verify OTP' : 'Create Account'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {step === 'form' && (
        <>
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-full border-t border-slate-200 dark:border-slate-800"></div>
              <span className="relative bg-white dark:bg-slate-900 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Continue With</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Google
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 mt-8 font-medium">
            Already a member?{' '}
            <Link href="/login" className="text-primary-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
