'use client';

import Image from 'next/image';
import { MapPin, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function EventCard({ event }: { event: Event }) {
  const { user, savedEventIds, toggleSavedEvent } = useAuth();
  const router = useRouter();

  const eventDate = new Date(event.date);
  const day = format(eventDate, 'dd');
  const month = format(eventDate, 'MMM').toUpperCase();

  const isSaved = savedEventIds.includes(event.id);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the event details page
    if (!user) {
      router.push('/login');
      return;
    }
    await toggleSavedEvent(event.id);
  };

  return (
    <div className="bg-amu-card rounded-3xl overflow-hidden mb-6 shadow-lg border border-amu relative group">
      <div className="relative h-64 w-full">
        <Image
          src={event.imageUrl || 'https://picsum.photos/800/600'}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-var(--card) via-transparent to-transparent opacity-90" />

        {/* Date Badge */}
        <div className="absolute top-4 left-4 bg-white rounded-2xl p-2 w-14 h-14 flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{month}</span>
          <span className="text-xl font-black text-black leading-none">{day}</span>
        </div>
      </div>

      <div className="p-5 absolute bottom-0 w-full">
        <div className="flex items-center gap-2 text-gray-300 text-xs mb-2">
          <MapPin size={14} className="text-[#00A651]" />
          <span>{event.venue}</span>
        </div>

        <h3 className="text-2xl font-bold text-var(--foreground) mb-4 leading-tight">{event.title}</h3>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-var(--card) bg-gray-700 overflow-hidden relative">
                <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} fill alt="User" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-var(--card) bg-gray-800 flex items-center justify-center text-[10px] text-white font-medium">
              +120
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors shadow-lg ${isSaved
              ? 'bg-amu-card text-[#00A651] border-2 border-[#00A651]'
              : 'bg-[#00A651] hover:bg-[#008f45] text-white shadow-green-900/20'
              }`}
          >
            {isSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
