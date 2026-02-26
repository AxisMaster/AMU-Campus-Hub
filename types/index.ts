import { LucideIcon } from 'lucide-react';

export type Category = 'All' | 'Cultural' | 'Academic' | 'Hall' | 'Club' | 'Department' | 'Sports';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  time: string;
  venue: string;
  category: Category;
  imageUrl?: string;
  documentUrl?: string;
  organizer: string;
  isApproved: boolean;
  createdBy: string; // User email
  userId?: string; // User ID for notifications
  registrationLink?: string;
  socialLink?: string;
  entryFee?: string;
  expectedAudience?: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
}

export interface Club {
  id: string;
  name: string;
  logo: string; // Emoji or URL
}
