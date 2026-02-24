'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Settings, Moon, Sun, Shield, Bookmark, Home, Building } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion } from 'motion/react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Profile() {
  const { user, theme, toggleTheme } = useAuth();
  const router = useRouter();
  const [adminMode, setAdminMode] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSavedCount = async () => {
      if (isSupabaseConfigured && user.id) {
        const { count, error } = await supabase
          .from('saved_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!error && count !== null) {
          setSavedCount(count);
        }
      }
    };

    fetchSavedCount();
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">You</h1>
        <div className="flex gap-4">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 bg-amu-card px-4 py-2 rounded-full border border-amu text-xs font-medium transition-all"
          >
            {theme === 'dark' ? (
              <>
                <Moon size={14} className="text-[#FFD700]" />
                <span>DARK MODE</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-[#FFA500]" />
                <span>LIGHT MODE</span>
              </>
            )}
          </button>
          <Link href="/settings" className="w-10 h-10 rounded-full bg-amu-card flex items-center justify-center border border-amu">
            <Settings size={20} className="text-gray-400" />
          </Link>
        </div>
      </header>

      {/* Profile Card */}
      <section className="px-6 mb-8">
        <div className="bg-amu-card rounded-3xl p-6 flex items-center gap-6 border border-amu relative overflow-hidden">
          <div className="relative w-24 h-24 rounded-full border-4 border-var(--background) shadow-xl">
            <Image
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              fill
              alt="Profile"
              className="rounded-full bg-[#FFE4B5]"
            />
            <div className="absolute bottom-0 right-0 bg-[#00A651] p-1 rounded-full border-2 border-var(--background)">
              <Shield size={12} className="text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-3">{user.department || 'Department not set'}</p>

            <div className="flex flex-wrap gap-2">
              {user.hall && (
                <div className="flex items-center gap-1 bg-var(--background) px-2 py-1 rounded-md text-[10px] text-gray-400 border border-amu">
                  <Home size={10} />
                  <span>{user.hall}</span>
                </div>
              )}
              {user.club && (
                <div className="flex items-center gap-1 bg-var(--background) px-2 py-1 rounded-md text-[10px] text-gray-400 border border-amu">
                  <Building size={10} />
                  <span>{user.club}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Admin Mode Toggle */}
      {user.role === 'admin' && (
        <section className="px-6 mb-8">
          <div className="bg-amu-card rounded-2xl p-4 flex items-center justify-between border border-amu">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#3A2814] flex items-center justify-center text-[#FFA500]">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Admin Mode</h3>
                <p className="text-xs text-gray-500">Post and manage official notices</p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${adminMode ? 'bg-[#00A651]' : 'bg-gray-700'}`}
              onClick={() => setAdminMode(!adminMode)}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ x: adminMode ? 20 : 0 }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="px-6 mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/saved">
            <div className="bg-amu-card p-5 rounded-3xl border border-amu hover:opacity-80 transition-opacity cursor-pointer group flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0F291E] flex items-center justify-center text-[#00A651] group-hover:scale-110 transition-transform">
                <Bookmark size={24} />
              </div>
              <div>
                <h4 className="font-bold">Saved Events</h4>
                <p className="text-xs text-gray-500">{savedCount} items saved for later</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
