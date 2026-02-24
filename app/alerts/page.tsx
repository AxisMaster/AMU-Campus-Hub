'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, Clock, CheckCircle, Info, XCircle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion } from 'motion/react';
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
        return <CheckCircle size={20} className="text-green-500" />;
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
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24">
      <header className="p-6 border-b border-amu">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell size={24} className="text-[#00A651]" />
          Alerts
        </h1>
      </header>

      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading alerts...</div>
        ) : notifications.length > 0 ? (
          notifications.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-amu-card p-5 rounded-3xl border ${alert.is_read ? 'border-amu' : 'border-[#00A651]'} flex gap-4 items-start`}
            >
              <div className="mt-1">{getIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold">{getTitle(alert.type)}</h3>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{alert.message}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>No new alerts for you.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
