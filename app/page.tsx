'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import BottomNav from '@/components/BottomNav';
import { MOCK_CLUBS } from '@/lib/data';
import { Event } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, theme } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = () => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    try {
      const res = await fetch(`/api/events/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }
      fetchEvents(); // Refresh list
    } catch (err) {
      console.error('Error approving event:', err);
      alert('Failed to approve event. Check console for details.');
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!confirm('Are you sure you want to reject and delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}/reject`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject');
      }
      fetchEvents(); // Refresh list
    } catch (err) {
      console.error('Error rejecting event:', err);
      alert('Failed to reject event. Check console for details.');
    }
  };

  const filteredEvents = events.filter((event) => {
    // Filter by approval status
    if (!user?.role || user.role !== 'admin') {
      if (!event.isApproved) return false;
    }

    const matchesFilter = filter === 'All' || event.category === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-var(--background) text-var(--foreground) pb-24">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div>
          <p className="text-[#00A651] text-sm font-medium uppercase tracking-wider">Welcome back</p>
          <h1 className="text-2xl font-bold">Good Morning, {user?.name || 'Guest'}</h1>
        </div>
        <div className="flex gap-3 items-center">
           <div className="w-10 h-10 rounded-full bg-amu-card flex items-center justify-center border border-amu cursor-pointer hover:bg-amu-card/80 transition-colors">
             <Bell size={20} className="text-gray-400" />
           </div>
           <Link href="/profile">
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00A651] relative">
               <Image 
                 src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Guest'}`} 
                 fill 
                 alt="Profile" 
               />
             </div>
           </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search events, clubs, or venues..." 
            className="w-full bg-amu-card rounded-2xl py-4 pl-12 pr-4 text-var(--foreground) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A651] transition-all border border-amu"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <section className="px-6 mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {['All', 'Cultural', 'Academic', 'Hall', 'Sports'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat 
                  ? 'bg-[#00A651] text-white shadow-lg shadow-green-900/20' 
                  : 'bg-amu-card text-gray-400 border border-amu'
              }`}
            >
              {cat === 'All' ? 'For You' : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Recommended Events */}
      <section className="px-6">
        <h2 className="text-lg font-bold mb-4">Recommended for You</h2>
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-amu-card rounded-3xl overflow-hidden mb-6 shadow-lg border relative group ${!event.isApproved ? 'border-yellow-500/50' : 'border-amu'}`}
              >
                {/* Admin Approval Badge */}
                {!event.isApproved && user?.role === 'admin' && (
                  <div className="absolute top-4 right-4 z-20 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
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
                  <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 w-14 h-14 flex flex-col items-center justify-center shadow-lg text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{format(new Date(event.date), 'MMM')}</span>
                    <span className="text-xl font-black leading-none">{format(new Date(event.date), 'dd')}</span>
                  </div>
                </div>

                <div className="p-5 absolute bottom-0 w-full">
                  <div className="flex items-center gap-2 text-gray-300 text-xs mb-2">
                    <span className="text-[#00A651] font-bold uppercase tracking-wider">{event.category}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-500"/>
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

                    {user?.role === 'admin' && !event.isApproved ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleReject(event.id, e)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-lg flex items-center gap-1"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={(e) => handleApprove(event.id, e)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-lg flex items-center gap-1"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      </div>
                    ) : (
                      <button className="bg-[#00A651] hover:bg-[#008f45] text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-green-900/20">
                        Remind Me
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>No events found.</p>
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
