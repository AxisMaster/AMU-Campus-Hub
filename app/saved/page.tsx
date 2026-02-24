'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { Event } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { format } from 'date-fns';
import Image from 'next/image';

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
      if (isSupabaseConfigured && user.id) {
        const { data, error } = await supabase
          .from('saved_events')
          .select('event_id, events(*)')
          .eq('user_id', user.id);

        if (!error && data) {
          const events = data.map((item: any) => ({
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
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24">
      <header className="p-6 flex items-center gap-4 border-b border-amu">
        <Link href="/profile" className="p-2 bg-amu-card rounded-full border border-amu">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bookmark size={20} className="text-[#00A651]" />
          Saved Events
        </h1>
      </header>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : savedEvents.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
            <p>You haven&apos;t saved any events yet.</p>
            <Link href="/" className="text-[#00A651] mt-4 inline-block hover:underline">
              Discover Events
            </Link>
          </div>
        ) : (
          savedEvents.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id} className="block">
              <div className="bg-amu-card rounded-3xl overflow-hidden shadow-lg border border-amu relative group flex h-32">
                <div className="relative w-32 h-full flex-shrink-0">
                  <Image
                    src={event.imageUrl || 'https://picsum.photos/800/600'}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 flex flex-col justify-center flex-1">
                  <div className="text-xs text-[#00A651] font-bold uppercase tracking-wider mb-1">
                    {format(new Date(event.date), 'MMM dd')} • {event.time}
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{event.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{event.venue}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
