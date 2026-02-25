'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Bell, User, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    const subscription = supabase
      .channel('public:notifications:count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amu-card border-t border-amu pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-[#00A651]' : 'text-gray-400'}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        <div className="relative -top-5">
          <Link href="/upload">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="bg-[#00A651] rounded-full p-4 shadow-lg shadow-green-900/40 border-4 border-var(--background)"
            >
              <Plus size={28} color="white" />
            </motion.div>
          </Link>
        </div>

        <Link href="/alerts" className={`relative flex flex-col items-center gap-1 ${isActive('/alerts') ? 'text-[#00A651]' : 'text-gray-400'}`}>
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </Link>

        <Link href="/you" className={`flex flex-col items-center gap-1 ${isActive('/you') ? 'text-[#00A651]' : 'text-gray-400'}`}>
          <User size={24} />
          <span className="text-[10px] font-medium">You</span>
        </Link>
      </div>
    </div>
  );
}
