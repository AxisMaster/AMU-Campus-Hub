'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Upload, Calendar, MapPin, Tag, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Image from 'next/image';
import { motion } from 'motion/react';

export default function UploadEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    category: 'Cultural',
    organizer: '',
    registrationLink: '',
    socialLink: '',
    entryFee: '',
    expectedAudience: 'All Students',
  });

  if (!user) {
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      
      if (isSupabaseConfigured && imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('fileName', filePath);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const contentType = uploadRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            if (!uploadRes.ok) {
              const errorData = await uploadRes.json();
              console.error('Error uploading image via API:', errorData);
              throw new Error(errorData.error || 'Upload failed');
            } else {
              const { url } = await uploadRes.json();
              imageUrl = url;
            }
          } else {
            const textResponse = await uploadRes.text();
            console.error('Non-JSON response from upload API:', textResponse);
            throw new Error('Server returned an invalid response');
          }
        } catch (err) {
          console.error('Upload API request failed:', err);
          // Fallback to direct upload attempt (might fail due to RLS)
          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, imageFile);
            
          if (uploadError) {
            console.error('Direct upload also failed:', uploadError);
            alert('Failed to upload image. Please check your Supabase Storage policies.');
          } else {
             const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
             imageUrl = data.publicUrl;
          }
        }
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl: imageUrl || 'https://picsum.photos/800/600', // Fallback
          createdBy: user.email,
          userId: user.id,
          organizer: formData.organizer || user.name,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'An error occurred while creating the event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24">
      <header className="p-6 flex items-center gap-4 border-b border-amu">
        <Link href="/" className="p-2 bg-amu-card rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Post New Event</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-2xl mx-auto">
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/20 border border-green-500 text-green-500 p-4 rounded-xl flex items-center gap-3"
          >
            <CheckCircle size={24} />
            <div>
              <h3 className="font-bold">Event Submitted!</h3>
              <p className="text-sm">Your event has been sent for approval. Redirecting...</p>
            </div>
          </motion.div>
        )}

        {/* Image Upload Placeholder */}
        <div 
          className="w-full h-48 bg-amu-card border-2 border-dashed border-amu rounded-3xl flex flex-col items-center justify-center text-gray-400 hover:border-[#00A651] transition-colors cursor-pointer group relative overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <>
              <Image src={imagePreview} fill alt="Preview" className="object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-bold">Change Image</span>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFile(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-var(--background) flex items-center justify-center mb-2 group-hover:bg-[#00A651] transition-colors">
                <Upload size={20} className="text-white" />
              </div>
              <span className="text-sm font-medium">Upload Event Poster</span>
              <span className="text-xs text-gray-600 mt-1">PNG, JPG up to 5MB</span>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Event Title *</label>
            <input
              type="text"
              required
              className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
              placeholder="e.g. Annual Mushaira"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="date"
                  required
                  className="w-full bg-amu-card border border-amu rounded-xl pl-10 pr-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Time *</label>
              <input
                type="time"
                required
                className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Venue *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                required
                className="w-full bg-amu-card border border-amu rounded-xl pl-10 pr-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
                placeholder="e.g. Kennedy Hall"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Category *</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select
                className="w-full bg-amu-card border border-amu rounded-xl pl-10 pr-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651] appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="Cultural">Cultural</option>
                <option value="Academic">Academic</option>
                <option value="Hall">Hall</option>
                <option value="Sports">Sports</option>
                <option value="Club">Club</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Description *</label>
            <textarea
              required
              className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651] h-32 resize-none"
              placeholder="Tell us more about the event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-amu">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Additional Info (Optional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Registration Form Link</label>
                <input
                  type="url"
                  className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
                  placeholder="https://forms.gle/..."
                  value={formData.registrationLink}
                  onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Event Page / Social Media</label>
                <input
                  type="url"
                  className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
                  placeholder="https://instagram.com/..."
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Entry Fee</label>
                  <input
                    type="text"
                    className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651]"
                    placeholder="e.g. Free or ₹100"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Expected Audience</label>
                  <select
                    className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 text-var(--foreground) focus:outline-none focus:border-[#00A651] appearance-none"
                    value={formData.expectedAudience}
                    onChange={(e) => setFormData({ ...formData, expectedAudience: e.target.value })}
                  >
                    <option value="All Students">All Students</option>
                    <option value="Department Only">Department Only</option>
                    <option value="Hall Residents Only">Hall Residents Only</option>
                    <option value="Club Members Only">Club Members Only</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Submit for Approval'}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}
