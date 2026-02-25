'use client';

import Image from 'next/image';
import { MapPin, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';

interface EventCardProps {
  event: Event;
  isPast?: boolean;
  onApprove?: (e: React.MouseEvent) => void;
  onReject?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export default function EventCard({ event, isPast, onApprove, onReject, onDelete }: EventCardProps) {
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

  const isAdmin = user?.role === 'admin';
  const showAdminActions = isAdmin && !event.isApproved && onApprove && onReject;

  return (
    <div className={`bg-amu-card rounded-3xl overflow-hidden mb-6 shadow-lg border relative group transition-all duration-300 ${isPast ? 'opacity-60 grayscale-[0.3]' : ''} ${!event.isApproved ? 'border-yellow-500/50' : 'border-amu'}`}>
      {/* Admin Deletet Button (Top Right) */}
      {isAdmin && onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg transition-transform hover:scale-110"
          title="Delete Event"
        >
          <Trash2 size={18} />
        </button>
      )}

      {/* Admin Approval Badge */}
      {!event.isApproved && isAdmin && (
        <div className="absolute top-4 right-16 z-20 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock size={12} /> Pending Approval
        </div>
      )}

      <div className="relative h-64 w-full">
        <Image
          src={event.imageUrl || 'https://picsum.photos/800/600'}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-var(--card) via-transparent to-transparent opacity-90" />

        {/* Date Badge */}
        <div className={`absolute top-4 left-4 rounded-2xl p-2 w-14 h-14 flex flex-col items-center justify-center shadow-lg transition-colors ${isPast ? 'bg-gray-800/80 text-gray-400 border border-gray-700' : 'bg-white/10 backdrop-blur-md border border-white/20 text-white'}`}>
          {isPast ? (
            <span className="text-[10px] font-black uppercase tracking-tighter">ENDED</span>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{month}</span>
              <span className="text-xl font-black leading-none">{day}</span>
            </>
          )}
        </div>
      </div>

      <div className="p-5 absolute bottom-0 w-full">
        <div className="flex items-center gap-2 text-gray-300 text-xs mb-2">
          <span className="text-[#00A651] font-bold uppercase tracking-wider">{event.category}</span>
          <span className="w-1 h-1 rounded-full bg-gray-500" />
          <span>{event.venue}</span>
        </div>

        <h3 className="text-2xl font-bold text-var(--foreground) mb-4 leading-tight">{event.title}</h3>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {['Alex', 'Sam', 'Jordan'].map((name) => (
              <UserAvatar key={name} name={name} className="w-8 h-8 border-2 border-var(--card) text-[10px]" />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-var(--card) bg-gray-800 flex items-center justify-center text-[10px] text-white font-medium z-10">
              +120
            </div>
          </div>

          {showAdminActions ? (
            <div className="flex gap-2">
              <button
                onClick={onReject}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-lg flex items-center gap-1"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-lg flex items-center gap-1"
              >
                <CheckCircle size={16} /> Approve
              </button>
            </div>
          ) : isPast ? (
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest px-4 py-2 bg-gray-800/30 rounded-full border border-gray-800/50">
              Event Passed
            </div>
          ) : (
            <button
              onClick={handleSave}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors shadow-lg ${isSaved
                ? 'bg-amu-card text-[#00A651] border-2 border-[#00A651]'
                : 'bg-[#00A651] hover:bg-[#008f45] text-white shadow-green-900/20'
                }`}
            >
              {isSaved ? '✓ Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
