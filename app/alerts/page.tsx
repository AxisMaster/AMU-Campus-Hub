'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, Clock, CheckCircle, Info, XCircle, BellRing } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  type: 'event_approved' | 'event_rejected' | 'new_event';
  message: string;
  event_id?: string;
  is_read: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchNotifications = async () => {
      if (!isSupabaseConfigured || !user.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);

        // Mark as read
        const unreadIds = data?.filter(n => !n.is_read).map(n => n.id) || [];
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    if (isSupabaseConfigured && user.id) {
      const subscription = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((current) => [payload.new as Notification, ...current]);
            // Mark new notification as read since we are on the alerts page
            supabase.from('notifications').update({ is_read: true }).eq('id', payload.new.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, router]);

  if (!user) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'event_approved':
        return <CheckCircle size={20} className="text-[#00A651]" />;
      case 'event_rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'new_event':
        return <Info size={20} className="text-blue-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'event_approved':
        return 'Event Approved';
      case 'event_rejected':
        return 'Event Rejected';
      case 'new_event':
        return 'New Event Published';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24 font-sans">
      <header className="p-6 border-b border-amu bg-var(--background)/80 backdrop-blur-lg sticky top-0 z-50">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Bell size={24} className="text-[#00A651]" />
          Alerts
        </h1>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Updates \u0026 Notifications</p>
      </header>

      <div className="p-6 space-y-4 max-w-2xl mx-auto relative min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {loading ? (
            // Skeleton Loader
            [1, 2, 3].map((i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.1 }}
                className="bg-amu-card p-5 rounded-3xl border border-amu flex gap-4 items-start animate-pulse"
              >
                <div className="w-8 h-8 rounded-full bg-gray-800 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-4 bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-800 rounded w-16" />
                  </div>
                  <div className="h-3 bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              </motion.div>
            ))
          ) : notifications.length > 0 ? (
            // Notifications List
            notifications.map((alert, index) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.3, delay: index * 0.05 }}
                className={`bg-amu-card p-5 rounded-3xl border ${alert.is_read ? 'border-amu' : 'border-[#00A651] shadow-lg shadow-green-900/10'} flex gap-4 items-start relative overflow-hidden group`}
              >
                {!alert.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#00A651]" />
                )}
                <div className="mt-1 w-10 h-10 rounded-full bg-var(--background) flex items-center justify-center border border-amu shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-base leading-tight">{getTitle(alert.type)}</h3>
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-var(--background) px-2 py-1 rounded-md border border-amu">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mt-2">{alert.message}</p>
                </div>
              </motion.div>
            ))
          ) : (
            // Premium Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center flex flex-col items-center justify-center bg-amu-card/50 rounded-3xl border border-amu border-dashed shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <BellRing size={32} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">No New Alerts</h3>
              <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
                You're all caught up! When events are approved or new official notices arrive, they will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
