'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../../actions';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    const result = await loginAdmin(password);

    setIsLoggingIn(false);
    if (result.success) {
      router.push('/admin');
      router.refresh();
    } else {
      setError(result.error || 'Failed to login.');
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
        {/* Monogram backdrop */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none text-olive-500">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full transform scale-x-[-1]"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.58,17.26C9,17.9 10.5,18.5 12,18.5C17.5,18.5 20,13.5 20,8H17M12,16.5C10,16.5 8,15.5 6.5,14C7.5,11.5 9,9.5 11,8C10,10.5 10.5,13.5 12,16.5M16,6A2,2 0 0,1 14,8C14,6 12,4 12,4C12,4 16,4 16,6Z" /></svg>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto relative rounded-full border border-gold-500/30 flex items-center justify-center bg-cream/50 dark:bg-zinc-800 mb-4">
            <Image src="/images/monogram.webp" alt="Z&Z" width={48} height={48} className="opacity-90 dark:brightness-110" />
          </div>
          <h2 className="text-2xl font-serif text-terracotta-600 dark:text-terracotta-500 font-bold">Admin Portal</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Access Guest Management System</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl p-4 flex gap-3 text-sm mb-6">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-600 dark:text-zinc-300 block">
              Enter Administrator Password
            </label>
            <div className="relative">
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-all text-sm"
                required
                autoFocus
              />
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className={`w-full py-3.5 rounded-xl text-white font-semibold hover:shadow-lg transition-all active:scale-99 cursor-pointer flex items-center justify-center gap-2 ${isLoggingIn ? 'bg-terracotta-400 cursor-not-allowed' : 'bg-terracotta-500 hover:bg-terracotta-600'}`}
          >
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <a 
            href="/"
            className="text-xs text-olive-600 dark:text-olive-400 hover:underline"
          >
            &larr; Return to Guest Invitation
          </a>
        </div>
      </div>
    </div>
  );
}
