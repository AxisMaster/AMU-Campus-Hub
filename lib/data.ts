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
 * Helper to extract the storage path (filename) from a Supabase public URL.
 * Example: https://.../storage/v1/object/public/event-images/random-name.png -> random-name.png
 */
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parts = url.split('/');
    return parts[parts.length - 1]; // Return the last segment which is the filename
  } catch (e) {
    return null;
  }
}

/**
 * Delete/reject an event. Admin-only operation.
 * Also cleans up associated images/documents from Supabase Storage.
 */
export const deleteEvent = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();

    // 1. Fetch URLs first to know what to delete from storage
    const { data: eventData } = await adminClient
      .from('events')
      .select('image_url, document_url')
      .eq('id', id)
      .single();

    if (eventData) {
      const pathsToDelete: string[] = [];
      const imagePath = extractStoragePath(eventData.image_url);
      const docPath = extractStoragePath(eventData.document_url);

      if (imagePath && !eventData.image_url?.includes('picsum.photos')) {
        pathsToDelete.push(imagePath);
      }
      if (docPath) {
        pathsToDelete.push(docPath);
      }

      if (pathsToDelete.length > 0) {
        try {
          await adminClient.storage.from('event-images').remove(pathsToDelete);
        } catch (storageError) {
          console.error('Failed to cleanup storage for event:', id, storageError);
          // Don't throw, proceed with DB deletion anyway
        }
      }
    }

    // 2. Manually delete from saved_events first
    await adminClient.from('saved_events').delete().eq('event_id', id);

    // 3. Delete from notifications if any
    await adminClient.from('notifications').delete().eq('event_id', id);

    // 4. Finally delete the event itself
    const { error } = await adminClient.from('events').delete().eq('id', id);
    if (error) {
      console.error('Error deleting event in Supabase:', error);
      throw error;
    }
  } else {
    fallbackEvents = fallbackEvents.filter((e) => e.id !== id);
  }
};

/**
 * Automatically delete events that are older than 7 days.
 * Also cleans up associated storage assets.
 */
export const cleanupExpiredEvents = async (): Promise<void> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateString = sevenDaysAgo.toISOString().split('T')[0];

  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();

    // 1. Get IDs and URLs of events to be deleted
    const { data: expiredEvents } = await adminClient
      .from('events')
      .select('id, image_url, document_url')
      .lt('date', dateString);

    if (expiredEvents && expiredEvents.length > 0) {
      const ids = expiredEvents.map(e => e.id);

      // 2. Extract and delete storage paths
      const pathsToDelete: string[] = [];
      expiredEvents.forEach(e => {
        const imagePath = extractStoragePath(e.image_url);
        const docPath = extractStoragePath(e.document_url);

        if (imagePath && !e.image_url?.includes('picsum.photos')) {
          pathsToDelete.push(imagePath);
        }
        if (docPath) {
          pathsToDelete.push(docPath);
        }
      });

      if (pathsToDelete.length > 0) {
        try {
          await adminClient.storage.from('event-images').remove(pathsToDelete);
        } catch (storageError) {
          console.error('Error during storage auto-cleanup:', storageError);
        }
      }

      // 3. Clean up database records
      await adminClient.from('saved_events').delete().in('event_id', ids);
      await adminClient.from('notifications').delete().in('event_id', ids);

      const { error } = await adminClient.from('events').delete().in('id', ids);
      if (error) console.error('Error during DB auto-cleanup:', error);
    }
  } else {
    fallbackEvents = fallbackEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= sevenDaysAgo;
    });
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
    documentUrl: dbEvent.document_url,
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
    document_url: event.documentUrl || null,
  };
}

/**
 * Cross-references all files in the 'event-images' storage bucket with the URLs in the 'events' table.
 * Deletes any files in storage that aren't referenced by any event.
 */
export const deepStorageCleanup = async (): Promise<{ deleted: number; total: number; errors: number }> => {
  if (!isSupabaseConfigured) return { deleted: 0, total: 0, errors: 0 };

  const adminClient = createAdminClient();
  let deletedCount = 0;
  let errorCount = 0;

  try {
    // 1. Fetch all active image and document URLs
    const { data: events, error: dbError } = await adminClient
      .from('events')
      .select('image_url, document_url');

    if (dbError) throw dbError;

    // 2. Extract and store filenames in a Set
    const activeFiles = new Set<string>();
    events?.forEach(e => {
      const imgPath = extractStoragePath(e.image_url);
      const docPath = extractStoragePath(e.document_url);
      if (imgPath) activeFiles.add(imgPath);
      if (docPath) activeFiles.add(docPath);
    });

    // 3. List all files in the bucket
    const { data: storageFiles, error: storageError } = await adminClient
      .storage
      .from('event-images')
      .list();

    if (storageError) throw storageError;

    if (!storageFiles) return { deleted: 0, total: 0, errors: 0 };

    // 4. Identify orphans
    const orphanedPaths = storageFiles
      .filter(file => !activeFiles.has(file.name))
      .map(file => file.name);

    if (orphanedPaths.length === 0) {
      return { deleted: 0, total: storageFiles.length, errors: 0 };
    }

    // 5. Delete in batches
    const batchSize = 100;
    for (let i = 0; i < orphanedPaths.length; i += batchSize) {
      const batch = orphanedPaths.slice(i, i + batchSize);
      const { error: deleteError } = await adminClient
        .storage
        .from('event-images')
        .remove(batch);

      if (deleteError) {
        console.error('Batch storage deletion error:', deleteError);
        errorCount += batch.length;
      } else {
        deletedCount += batch.length;
      }
    }

    return {
      deleted: deletedCount,
      total: storageFiles.length,
      errors: errorCount
    };

  } catch (error) {
    console.error('Deep Storage Cleanup failed:', error);
    throw error;
  }
};
