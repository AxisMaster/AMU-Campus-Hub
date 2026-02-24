'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // If already logged in, redirect
  if (user) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const result = await signUp(email, password, name);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMessage('Account created! You are now logged in.');
          setTimeout(() => router.push('/'), 1500);
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-var(--background) flex flex-col justify-center items-center p-6 text-var(--foreground)">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00A651] mb-4 shadow-lg shadow-green-900/30">
            <span className="text-3xl font-black text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500">
            {isSignUp
              ? 'Join AMU Campus Hub to discover events'
              : 'Sign in to your AMU Campus Hub account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-amu-card p-8 rounded-3xl border border-amu shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl mb-6 text-sm"
            >
              {successMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    required={isSignUp}
                    className="w-full bg-var(--background) border border-amu rounded-xl pl-12 pr-4 py-3.5 text-var(--foreground) focus:outline-none focus:border-[#00A651] transition-colors placeholder-gray-500"
                    placeholder="Zaid Khan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-var(--background) border border-amu rounded-xl pl-12 pr-4 py-3.5 text-var(--foreground) focus:outline-none focus:border-[#00A651] transition-colors placeholder-gray-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="w-full bg-var(--background) border border-amu rounded-xl pl-12 pr-12 py-3.5 text-var(--foreground) focus:outline-none focus:border-[#00A651] transition-colors placeholder-gray-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In / Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-[#00A651] font-bold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in, you agree to Campus Hub&apos;s terms. <br />
          Everyone starts as a Student. Admin access is granted separately.
        </p>
      </motion.div>
    </div>
  );
}
