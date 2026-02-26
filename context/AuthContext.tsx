'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  department?: string;
  hall?: string;
  club?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'dark' | 'light';
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; confirmEmail?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  toggleTheme: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  savedEventIds: string[];
  toggleSavedEvent: (eventId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);

  const fetchSavedEvents = async (userId: string, email: string) => {
    if (isSupabaseConfigured && userId !== 'demo-id') {
      try {
        const { data, error } = await supabase
          .from('saved_events')
          .select('event_id')
          .eq('user_id', userId);

        if (!error && data) {
          setSavedEventIds(data.map((d: any) => d.event_id));
        }
      } catch (err) {
        console.error('Error fetching saved events:', err);
      }
    } else {
      const savedIds = JSON.parse(localStorage.getItem(`saved_events_${email}`) || '[]');
      setSavedEventIds(savedIds);
    }
  };

  const fetchUserProfile = async (userId: string, email: string, fallbackName?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setUser({
          id: userId,
          name: data.name || fallbackName || email.split('@')[0],
          email: email,
          role: data.role || 'student',
          avatar: data.avatar_url,
          department: data.department,
          hall: data.hall,
          club: data.club,
        });
      } else {
        // Profile not created yet (trigger might be delayed) - use basic info
        setUser({
          id: userId,
          name: fallbackName || email.split('@')[0],
          email: email,
          role: 'student',
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session with a safety timeout
    const sessionTimeout = setTimeout(() => {
      console.warn('Auth session check timed out, proceeding with loading=false');
      setLoading(false);
    }, 5000); // 5 seconds safety timeout

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(sessionTimeout);
      if (session?.user) {
        fetchUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name
        );
        fetchSavedEvents(session.user.id, session.user.email || '');
      }
      setLoading(false);
    }).catch(err => {
      clearTimeout(sessionTimeout);
      console.error('Session retrieval error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name
        );
        fetchSavedEvents(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setSavedEventIds([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('amu_hub_theme') as 'dark' | 'light';
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: string; confirmEmail?: boolean }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Please set up your environment variables.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Stored in user_metadata, used by the DB trigger
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // If email confirmation is enabled, session will be null
    if (data.session) {
      // User is logged in immediately (email confirmation disabled)
      if (data.user) {
        await fetchUserProfile(data.user.id, data.user.email || '', name);
      }
      return {};
    }

    // Email confirmation is required
    return { confirmEmail: true };
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Please set up your environment variables.' };
    }

    try {
      // Add a 15-second timeout to the sign-in request
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Sign-in timed out. Please check your internet connection.')), 15000)
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id, data.user.email || '');
      }

      return {};
    } catch (err: any) {
      console.error('Sign-in error:', err);
      return { error: err.message || 'Network error or timeout occurred.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSavedEventIds([]);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('amu_hub_theme', newTheme);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    if (isSupabaseConfigured && user.id) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar_url: updatedUser.avatar,
        department: updatedUser.department,
        hall: updatedUser.hall,
        club: updatedUser.club,
        updated_at: new Date().toISOString(),
      });
      if (error) console.error('Error updating profile:', error);
    }
  };

  const toggleSavedEvent = async (eventId: string) => {
    if (!user) return;

    const isSaved = savedEventIds.includes(eventId);
    const previousSavedEventIds = [...savedEventIds];

    // Optimistic UI update
    if (isSaved) {
      setSavedEventIds((prev) => prev.filter((id) => id !== eventId));
    } else {
      setSavedEventIds((prev) => [...prev, eventId]);
    }

    try {
      if (isSupabaseConfigured && user.id !== 'demo-id') {
        if (isSaved) {
          const { error } = await supabase
            .from('saved_events')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', eventId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('saved_events')
            .insert({ user_id: user.id, event_id: eventId });

          if (error) {
            // Check for unique constraint violation (code 23505 in Postgres)
            if (error.code === '23505') {
              console.warn('Event already saved in database, syncing state quietly.');
              // It's actually a success state (it's already saved)
              return;
            }
            throw error;
          }
        }
      } else {
        // Local storage fallback for demo
        const savedIds = JSON.parse(localStorage.getItem(`saved_events_${user.email}`) || '[]');
        if (isSaved) {
          const newIds = savedIds.filter((id: string) => id !== eventId);
          localStorage.setItem(`saved_events_${user.email}`, JSON.stringify(newIds));
        } else {
          if (!savedIds.includes(eventId)) {
            savedIds.push(eventId);
            localStorage.setItem(`saved_events_${user.email}`, JSON.stringify(savedIds));
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      // Rollback optimistic update
      setSavedEventIds(previousSavedEventIds);
      alert('Failed to update saved status. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, theme, signUp, signIn, signOut, toggleTheme, updateProfile,
      savedEventIds, toggleSavedEvent
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
