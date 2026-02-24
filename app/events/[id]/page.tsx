'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Calendar, Clock, User, Share2, Bookmark, ExternalLink, Users, Banknote } from 'lucide-react';
import { Event } from '@/types';
import { format } from 'date-fns';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function EventDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((e: Event) => e.id === params.id);
        setEvent(found || null);
      });
  }, [params.id]);

  // Check if event is saved
  useEffect(() => {
    if (!user || !event) return;

    const checkSavedStatus = async () => {
      if (isSupabaseConfigured && user.id) {
        const { data } = await supabase
          .from('saved_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .maybeSingle();

        if (data) setIsSaved(true);
      }
    };

    checkSavedStatus();
  }, [user, event]);

  const toggleSave = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }

    if (isSupabaseConfigured && user.id) {
      if (isSaved) {
        await supabase
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_events')
          .insert({ user_id: user.id, event_id: event.id });
        setIsSaved(true);
      }
    }
  };

  if (!event) return <div className="min-h-screen bg-var(--background) text-var(--foreground) flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-32">
      <div className="relative h-96 w-full">
        <Image
          src={event.imageUrl || 'https://picsum.photos/800/600'}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-var(--background) via-transparent to-transparent" />

        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Share2 size={20} />
            </button>
            {user && (
              <button
                onClick={toggleSave}
                className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 transition-colors ${isSaved ? 'text-[#00A651] bg-[#00A651]/20 border-[#00A651]' : ''
                  }`}
              >
                <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-3xl font-bold leading-tight max-w-[80%]">{event.title}</h1>
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg w-16 h-16 text-black">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">{format(new Date(event.date), 'MMM')}</span>
            <span className="text-2xl font-black leading-none">{format(new Date(event.date), 'dd')}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amu-card flex items-center justify-center text-[#00A651] border border-amu">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{format(new Date(event.date), 'EEEE, d MMMM')}</h3>
              <p className="text-gray-400 text-sm">{event.time}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amu-card flex items-center justify-center text-[#00A651] border border-amu">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{event.venue}</h3>
              <p className="text-gray-400 text-sm">Aligarh Muslim University</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amu-card flex items-center justify-center text-[#00A651] border border-amu">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Organizer</h3>
              <p className="text-gray-400 text-sm">{event.organizer}</p>
            </div>
          </div>

          {/* Optional Fields */}
          {(event.entryFee || event.expectedAudience) && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {event.entryFee && (
                <div className="bg-amu-card p-4 rounded-2xl border border-amu flex items-center gap-3">
                  <div className="text-[#00A651]"><Banknote size={20} /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Entry Fee</p>
                    <p className="text-sm font-bold">{event.entryFee}</p>
                  </div>
                </div>
              )}
              {event.expectedAudience && (
                <div className="bg-amu-card p-4 rounded-2xl border border-amu flex items-center gap-3">
                  <div className="text-[#00A651]"><Users size={20} /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Audience</p>
                    <p className="text-sm font-bold">{event.expectedAudience}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <h3 className="font-bold text-lg mb-2">About Event</h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              {event.description}
            </p>

            {event.socialLink && (
              <a
                href={event.socialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00A651] font-bold text-sm hover:underline mb-4"
              >
                <ExternalLink size={16} />
                Visit Event Page / Social Media
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-var(--background) via-var(--background) to-transparent z-20">
        {event.registrationLink ? (
          <a
            href={event.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
          >
            Register Now <ExternalLink size={18} />
          </a>
        ) : (
          <button
            onClick={toggleSave}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${isSaved
                ? 'bg-amu-card text-[#00A651] border-2 border-[#00A651]'
                : 'bg-[#00A651] hover:bg-[#008f45] text-white shadow-green-900/20'
              }`}
          >
            {isSaved ? '✓ Saved' : user ? 'Save Event' : 'Sign In to Save'}
          </button>
        )}
      </div>
    </div>
  );
}
