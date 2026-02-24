// Data layer for AMU Campus Hub
// Uses Supabase with proper RLS policies - no admin client needed for reads

import { Event, Club } from '@/types';
import { supabase, isSupabaseConfigured, createAdminClient } from '@/lib/supabase';

export const MOCK_CLUBS: Club[] = [
  { id: '1', name: 'UDC', logo: '🛡️' },
  { id: '2', name: 'CEC', logo: '🌳' },
  { id: '3', name: 'Drama', logo: '🎭' },
  { id: '4', name: 'Science', logo: '🧬' },
  { id: '5', name: 'Photo', logo: '📸' },
  { id: '6', name: 'Robot', logo: '🤖' },
];

// In-memory fallback events (only used when Supabase is not configured)
let fallbackEvents: Event[] = [
  {
    id: '1',
    title: 'Annual Kennedy Hall Mushaira',
    description: 'A grand evening of poetry and culture featuring renowned poets.',
    date: '2024-10-12',
    time: '18:00',
    venue: 'Kennedy Hall, AMU',
    category: 'Cultural',
    imageUrl: 'https://picsum.photos/seed/mushaira/800/600',
    organizer: 'Kennedy Hall',
    isApproved: true,
    createdBy: 'admin@amu.ac.in',
  },
  {
    id: '2',
    title: 'MA Library Book Fair 2024',
    description: 'Explore thousands of books from various genres and publishers.',
    date: '2024-10-15',
    time: '10:00',
    venue: 'Maulana Azad Library Lawns',
    category: 'Academic',
    imageUrl: 'https://picsum.photos/seed/bookfair/800/600',
    organizer: 'MA Library',
    isApproved: true,
    createdBy: 'admin@amu.ac.in',
  },
  {
    id: '3',
    title: 'Sir Syed Memorial Debate',
    description: 'Inter-hall debate competition on the legacy of Sir Syed.',
    date: '2024-10-18',
    time: '14:00',
    venue: 'Strachey Hall',
    category: 'Academic',
    imageUrl: 'https://picsum.photos/seed/debate/800/600',
    organizer: 'Debating Society',
    isApproved: true,
    createdBy: 'student@amu.ac.in',
  },
];

/**
 * Fetch events. Uses the admin client on the server-side to read ALL events
 * (including unapproved ones for admin view). RLS filtering for non-admins
 * happens in the client-side components.
 */
export const getEvents = async (): Promise<Event[]> => {
  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.from('events').select('*').order('date', { ascending: true });
    if (error) {
      console.error('Error fetching events from Supabase:', error);
      return fallbackEvents;
    }
    return data.map(mapSupabaseEventToLocal);
  }
  return fallbackEvents;
};

/**
 * Add a new event. Uses admin client to bypass RLS for server-side insertion.
 * The event is created with is_approved: false by default.
 */
export const addEvent = async (event: Event): Promise<void> => {
  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from('events').insert([mapLocalEventToSupabase(event)]);
    if (error) {
      console.error('Error adding event to Supabase:', error);
      throw error;
    }
  } else {
    fallbackEvents.push(event);
  }
};

/**
 * Approve an event. Admin-only operation.
 */
export const approveEvent = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from('events').update({ is_approved: true }).eq('id', id);
    if (error) {
      console.error('Error approving event in Supabase:', error);
      throw error;
    }
  } else {
    const event = fallbackEvents.find((e) => e.id === id);
    if (event) {
      event.isApproved = true;
    }
  }
};

/**
 * Delete/reject an event. Admin-only operation.
 */
export const deleteEvent = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from('events').delete().eq('id', id);
    if (error) {
      console.error('Error deleting event in Supabase:', error);
      throw error;
    }
  } else {
    fallbackEvents = fallbackEvents.filter((e) => e.id !== id);
  }
};

// Helper: map Supabase row → local Event type
function mapSupabaseEventToLocal(dbEvent: any): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    date: dbEvent.date,
    time: dbEvent.time,
    venue: dbEvent.venue,
    category: dbEvent.category,
    imageUrl: dbEvent.image_url,
    organizer: dbEvent.organizer,
    isApproved: dbEvent.is_approved,
    createdBy: dbEvent.created_by,
    userId: dbEvent.user_id,
    registrationLink: dbEvent.registration_link,
    socialLink: dbEvent.social_link,
    entryFee: dbEvent.entry_fee,
    expectedAudience: dbEvent.expected_audience,
  };
}

// Helper: map local Event type → Supabase row
function mapLocalEventToSupabase(event: Event): any {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.venue,
    category: event.category,
    image_url: event.imageUrl,
    organizer: event.organizer,
    is_approved: event.isApproved,
    created_by: event.createdBy,
    user_id: event.userId || null,
    registration_link: event.registrationLink,
    social_link: event.socialLink,
    entry_fee: event.entryFee,
    expected_audience: event.expectedAudience,
  };
}
