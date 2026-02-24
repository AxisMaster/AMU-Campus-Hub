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
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  toggleTheme: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name
        );
      }
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
      } else {
        setUser(null);
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

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Please set up your environment variables.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Stored in user_metadata, used by the DB trigger
      },
    });

    if (error) {
      return { error: error.message };
    }

    // If email confirmation is disabled, user is logged in immediately
    if (data.user) {
      await fetchUserProfile(data.user.id, data.user.email || '', name);
    }

    return {};
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Please set up your environment variables.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      await fetchUserProfile(data.user.id, data.user.email || '');
    }

    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
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

  return (
    <AuthContext.Provider value={{ user, loading, theme, signUp, signIn, signOut, toggleTheme, updateProfile }}>
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
