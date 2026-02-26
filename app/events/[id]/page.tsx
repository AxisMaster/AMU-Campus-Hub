'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Calendar, Clock, User, Share2, Bookmark, ExternalLink, Users, Banknote, Trash2, Tag } from 'lucide-react';
import { Event } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import PhotoViewer from '@/components/PhotoViewer';

export default function EventDetails() {
  const params = useParams();
  const router = useRouter();
  const { user, savedEventIds, toggleSavedEvent } = useAuth();
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((e: Event) => e.id === params.id);
        setEvent(found || null);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [params.id]);

  const isSaved = event ? savedEventIds.includes(event.id) : false;

  const handleToggleSave = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }
    await toggleSavedEvent(event.id);
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm('Are you sure you want to PERMANENTLY delete this event?')) return;

    try {
      const res = await fetch(`/api/events/${event.id}/delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Event deleted permanently.', 'success');
      router.push('/');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete event.', 'error');
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const shareData = {
      title: event.title,
      text: `Check out "${event.title}" on AMU Campus Hub! 📅 ${format(new Date(event.date), 'EEE, d MMM')} at ${event.venue}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Event link copied to clipboard!', 'success');
      }
    } catch (err) {
      // User cancelled sharing — silently ignore
    }
  };

  const isPast = event ? new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-32">
        <div className="relative h-96 w-full bg-amu-card animate-pulse" />
        <div className="px-6 -mt-10 relative z-10 space-y-6">
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-3 flex-1 max-w-[80%]">
              <div className="h-6 w-20 bg-amu-card rounded-full animate-pulse" />
              <div className="h-8 w-full bg-amu-card rounded-2xl animate-pulse" />
              <div className="h-8 w-2/3 bg-amu-card rounded-2xl animate-pulse" />
            </div>
            <div className="w-16 h-16 bg-amu-card rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amu-card animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-1/2 bg-amu-card rounded-xl animate-pulse" />
                  <div className="h-4 w-1/3 bg-amu-card rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) return <div className="min-h-screen bg-var(--background) text-var(--foreground) flex items-center justify-center text-gray-400">Event not found.</div>;

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-32">
      {/* Photo Viewer Modal */}
      <PhotoViewer
        src={event.imageUrl || 'https://picsum.photos/800/600'}
        alt={event.title}
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
      />

      {/* Hero Image — clickable to open full photo */}
      <div className="relative h-96 w-full cursor-pointer" onClick={() => setPhotoViewerOpen(true)}>
        <Image
          src={event.imageUrl || 'https://picsum.photos/800/600'}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-var(--background) via-transparent to-transparent" />

        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button
            onClick={(e) => { e.stopPropagation(); router.back(); }}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 transition-colors hover:bg-white/20"
            >
              <Share2 size={20} />
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-white/10 text-white transition-colors hover:bg-red-500"
              >
                <Trash2 size={20} />
              </button>
            )}
            {user && (
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleSave(); }}
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
        {/* Category Tag */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-[#00A651] text-xs font-bold uppercase tracking-widest bg-[#00A651]/10 px-3 py-1.5 rounded-full border border-[#00A651]/20">
            <Tag size={12} />
            {event.category}
          </span>
          {isPast && (
            <span className="inline-flex items-center gap-1 ml-2 text-gray-500 text-xs font-bold uppercase tracking-widest bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
              ENDED
            </span>
          )}
        </div>

        <div className="flex justify-between items-end mb-6">
          <h1 className="text-3xl font-bold leading-tight max-w-[80%]">{event.title}</h1>
          <div className={`rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg w-16 h-16 transition-colors ${isPast ? 'bg-gray-800 text-gray-500 border border-gray-700' : 'bg-white text-black'}`}>
            {isPast ? (
              <span className="text-[10px] font-black uppercase tracking-tighter">ENDED</span>
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">{format(new Date(event.date), 'MMM')}</span>
                <span className="text-2xl font-black leading-none">{format(new Date(event.date), 'dd')}</span>
              </>
            )}
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
              {/* Show who created the event — admin only */}
              {user?.role === 'admin' && event.createdBy && (
                <p className="text-gray-600 text-xs mt-1">Submitted by: {event.createdBy}</p>
              )}
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
            <p className="text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">
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
            href={isPast ? undefined : event.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${isPast ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-[#00A651] hover:bg-[#008f45] text-white shadow-green-900/20'}`}
          >
            {isPast ? 'Event Ended' : 'Register Now'} {!isPast && <ExternalLink size={18} />}
          </a>
        ) : (
          <button
            onClick={isPast ? undefined : handleToggleSave}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${isPast
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              : isSaved
                ? 'bg-amu-card text-[#00A651] border-2 border-[#00A651]'
                : 'bg-[#00A651] hover:bg-[#008f45] text-white shadow-green-900/20'
              }`}
          >
            {isPast ? 'Event Ended' : isSaved ? '✓ Saved' : user ? 'Save Event' : 'Sign In to Save'}
          </button>
        )}
      </div>
    </div>
  );
}
