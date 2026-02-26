'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Ghost, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import BottomNav from '@/components/BottomNav';
import { Event } from '@/types';
import { useAuth } from '@/context/AuthContext';
import EventCard from '@/components/EventCard';
import SkeletonEventCard from '@/components/SkeletonEventCard';
import UserAvatar from '@/components/UserAvatar';
import { useToast } from '@/components/Toast';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = () => {
    setIsLoading(true);
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch events', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/events/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve');
      showToast('Event approved successfully!', 'success');
      fetchEvents();
    } catch (err) {
      console.error(err);
      showToast('Failed to approve event.', 'error');
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to reject and delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reject');
      showToast('Event rejected.', 'info');
      fetchEvents();
    } catch (err) {
      console.error(err);
      showToast('Failed to reject event.', 'error');
    }
  };

  const handleManualDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to PERMANENTLY delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}/delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Event deleted permanently.', 'success');
      fetchEvents();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete event.', 'error');
    }
  };

  const filteredEvents = events.filter((event) => {
    // Filter by approval status: only admins see unapproved events
    if (!user?.role || user.role !== 'admin') {
      if (!event.isApproved) return false;
    }

    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPast = eventDate < today;
    if (timeFilter === 'upcoming' && isPast) return false;
    if (timeFilter === 'past' && !isPast) return false;

    const matchesFilter = filter === 'All' || event.category === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-var(--background) text-var(--foreground) pb-24 font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-[#00A651]">AMU</span> CAMPUS HUB
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Guest'}
          </p>
        </motion.div>
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-amu-card flex items-center justify-center border border-amu cursor-pointer hover:bg-amu-card/80 transition-colors shadow-sm">
            <Bell size={20} className="text-gray-400" />
          </div>
          <Link href="/you">
            <UserAvatar name={user?.name || 'Guest'} className="w-10 h-10 border-2 border-[#00A651]" />
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#00A651]" size={20} />
          <input
            type="text"
            placeholder="Search events, clubs, or venues..."
            className="w-full bg-amu-card rounded-2xl py-4 pl-12 pr-4 text-var(--foreground) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 transition-all border border-amu shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Mode Toggle: Upcoming vs Past */}
      <div className="px-6 mb-6">
        <div className="flex p-1.5 bg-amu-card rounded-2xl border border-amu items-center shadow-inner">
          <button
            onClick={() => setTimeFilter('upcoming')}
            className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all duration-300 ${timeFilter === 'upcoming' ? 'bg-[#00A651] text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
          >
            UPCOMING
          </button>
          <button
            onClick={() => setTimeFilter('past')}
            className={`flex-1 py-3 rounded-[18px] text-sm font-black transition-all duration-300 ${timeFilter === 'past' ? 'bg-[#00A651] text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
          >
            PAST
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="px-6 mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {['All', 'Cultural', 'Academic', 'Hall', 'Sports'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`snap-center px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ease-out ${filter === cat
                ? 'bg-[#00A651] text-white shadow-lg shadow-green-900/30 scale-105 border-transparent'
                : 'bg-amu-card text-gray-400 border border-amu hover:text-white'
                }`}
            >
              {cat === 'All' ? 'For You' : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Events Feed */}
      <section className="px-6 relative min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">
            {timeFilter === 'upcoming' ? 'Recommended for You' : 'Past Events Archive'}
          </h2>
          {timeFilter === 'past' && (
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-800/30 px-2 py-1 rounded-md">
              Cleared after 7 days
            </span>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              // Skeleton Loaders
              [1, 2, 3].map((i) => (
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
            ) : filteredEvents.length > 0 ? (
              // Actual Events
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/events/${event.id}`}>
                    <EventCard
                      event={event}
                      isPast={timeFilter === 'past'}
                      onApprove={(e) => handleApprove(event.id, e)}
                      onReject={(e) => handleReject(event.id, e)}
                      onDelete={(e) => handleManualDelete(event.id, e)}
                    />
                  </Link>
                </motion.div>
              ))
            ) : (
              // Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-1 py-20 text-center flex flex-col items-center justify-center bg-amu-card/50 rounded-3xl border border-amu border-dashed"
              >
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  {timeFilter === 'past' ? (
                    <Clock size={32} className="text-gray-500" />
                  ) : (
                    <Ghost size={32} className="text-gray-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {timeFilter === 'past' ? 'No Past Events' : 'No Events Found'}
                </h3>
                <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
                  {searchQuery
                    ? `We couldn't find any events matching "${searchQuery}". Try adjusting your filters.`
                    : timeFilter === 'past'
                      ? "No past events to show. Upcoming events will appear here after they end."
                      : "There are no events in this category yet. Check back later!"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilter('All'); }}
                    className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-full text-sm font-bold hover:bg-gray-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
