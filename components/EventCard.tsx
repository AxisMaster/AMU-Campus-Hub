'use client';

import Image from 'next/image';
import { MapPin, CheckCircle, Clock, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    await toggleSavedEvent(event.id);
  };

  const isAdmin = user?.role === 'admin';
  const showAdminActions = isAdmin && !event.isApproved && onApprove && onReject;

  return (
    <div className={`bg-amu-card rounded-3xl overflow-hidden shadow-lg border relative group transition-all duration-300 ${isPast ? 'opacity-60 grayscale-[0.3]' : ''} ${!event.isApproved ? 'border-yellow-500/50' : 'border-amu'}`}>
      {/* === IMAGE ZONE === */}
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={event.imageUrl || 'https://picsum.photos/800/600'}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Admin Delete Button */}
        {isAdmin && onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg transition-transform hover:scale-110"
            title="Delete Event"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Admin Approval Badge */}
        {!event.isApproved && isAdmin && (
          <div className={`absolute top-3 z-20 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isAdmin && onDelete ? 'right-14' : 'right-3'}`}>
            <Clock size={12} /> Pending
          </div>
        )}

        {/* Date Badge */}
        <div className={`absolute top-3 left-3 rounded-2xl p-2 w-13 h-13 flex flex-col items-center justify-center shadow-lg ${isPast ? 'bg-gray-800/90 text-gray-400 border border-gray-700' : 'bg-white/10 backdrop-blur-md border border-white/20 text-white'}`}>
          {isPast ? (
            <span className="text-[10px] font-black uppercase">ENDED</span>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{month}</span>
              <span className="text-lg font-black leading-none">{day}</span>
            </>
          )}
        </div>
      </div>

      {/* === INFO ZONE (solid background, no overlay) === */}
      <div className="p-5">
        {/* Category & Venue */}
        <div className="flex items-center gap-2 text-xs mb-2">
          <span className="text-[#00A651] font-bold uppercase tracking-wider">{event.category}</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span className="text-gray-400 flex items-center gap-1">
            <MapPin size={12} />
            {event.venue}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-var(--foreground) leading-tight mb-3 line-clamp-2">{event.title}</h3>

        {/* Date & Time Row + Actions */}
        <div className="flex items-center justify-between">
          {/* Date + Time */}
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Calendar size={14} className="text-gray-500" />
            <span className="font-medium">{format(eventDate, 'EEE, d MMM')}</span>
            {event.time && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="font-medium">{event.time}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {showAdminActions ? (
            <div className="flex gap-2">
              <button
                onClick={onReject}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-lg"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-lg flex items-center gap-1"
              >
                <CheckCircle size={14} /> Approve
              </button>
            </div>
          ) : isPast ? (
            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-800/30 rounded-full border border-gray-800/50">
              Ended
            </div>
          ) : (
            <button
              onClick={handleSave}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-colors shadow-lg ${isSaved
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
