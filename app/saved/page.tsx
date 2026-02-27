'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, FolderHeart, Clock } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { Event } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import EventCard from '@/components/EventCard';
import SkeletonEventCard from '@/components/SkeletonEventCard';

export default function SavedEvents() {
  const { user } = useAuth();
  const router = useRouter();
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSavedEvents = async () => {
      setLoading(true);
      if (isSupabaseConfigured && user.id) {
        const { data, error } = await supabase
          .from('saved_events')
          .select('event_id, events(*)')
          .eq('user_id', user.id);

        if (!error && data) {
          const events: Event[] = data.map((item: any) => ({
            id: item.events.id,
            title: item.events.title,
            description: item.events.description,
            date: item.events.date,
            time: item.events.time,
            venue: item.events.venue,
            category: item.events.category,
            imageUrl: item.events.image_url,
            organizer: item.events.organizer,
            isApproved: item.events.is_approved,
            createdBy: item.events.created_by,
            entryFee: item.events.entry_fee,
            expectedAudience: item.events.expected_audience,
            registrationLink: item.events.registration_link,
            socialLink: item.events.social_link
          }));
          setSavedEvents(events);
        }
      }
      setLoading(false);
    };

    fetchSavedEvents();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24 font-sans">
      <header className="p-6 flex items-center justify-between border-b border-amu">
        <div className="flex items-center gap-4">
          <Link href="/you" className="p-2 bg-amu-card rounded-full border border-amu transition-colors hover:bg-gray-800">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Bookmark size={24} className="text-[#00A651]" />
              Saved Events
            </h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Your personal collection</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-2xl mx-auto relative min-h-[400px]">
        {!loading && savedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">Reminders are active!</p>
              <p className="text-xs text-emerald-500/70 leading-relaxed">
                You'll receive a push notification 24 hours and 1 hour before these events start.
                Make sure notifications are enabled in your settings.
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {loading ? (
            // Skeleton Loaders
            [1, 2].map((i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.1 }}
              >
                <SkeletonEventCard />
              </motion.div>
            ))
          ) : savedEvents.length === 0 ? (
            // Premium Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center flex flex-col items-center justify-center bg-amu-card/50 rounded-3xl border border-amu border-dashed shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FolderHeart size={32} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Saved Events</h3>
              <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed mb-6">
                You haven&apos;t saved any events yet. Browse the home feed and click 'Save' to add them here.
              </p>
              <Link
                href="/"
                className="px-8 py-3 bg-[#00A651] text-white rounded-full text-sm font-bold shadow-lg shadow-green-900/20 hover:bg-[#008f45] transition-all"
              >
                Discover Events
              </Link>
            </motion.div>
          ) : (
            // Saved Events List
            savedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/events/${event.id}`}>
                  <EventCard event={event} />
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
