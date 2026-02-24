'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, User, Building, Home, Users, Camera, Check } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Image from 'next/image';

const DEPARTMENTS = ['ZHCET (Engineering)', 'Science', 'Arts', 'Commerce', 'Medicine', 'Law', 'Social Science', 'Other'];
const HALLS = ['Sulaiman Hall', 'Sir Syed Hall', 'Ross Masood Hall', 'Hadi Hasan Hall', 'Mohammad Habib Hall', 'Nadeem Tarin Hall', 'Other'];
const CLUBS = ['CEC (Cultural Education Centre)', 'Drama Club', 'Science Club', 'Photography Club', 'Robotics Club', 'Other'];

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
];

export default function Settings() {
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    hall: user?.hall || '',
    club: user?.club || '',
    avatar: user?.avatar || '',
  });

  const [otherFields, setOtherFields] = useState({
    department: '',
    hall: '',
    club: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      name: formData.name,
      department: formData.department === 'Other' ? otherFields.department : formData.department,
      hall: formData.hall === 'Other' ? otherFields.hall : formData.hall,
      club: formData.club === 'Other' ? otherFields.club : formData.club,
      avatar: formData.avatar,
    };
    updateProfile(finalData);
    router.push('/profile');
  };

  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24">
      <header className="p-6 flex items-center gap-4 border-b border-amu">
        <Link href="/profile" className="p-2 bg-amu-card rounded-full border border-amu">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-8">
        {/* Profile Picture Section */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Camera size={20} className="text-[#00A651]" />
            Profile Picture
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 rounded-full border-4 border-amu overflow-hidden bg-amu-card">
              <Image
                src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                fill
                alt="Profile"
                className="object-cover"
              />
            </div>

            <div className="w-full">
              <p className="text-sm text-gray-500 mb-4 text-center">Choose a default avatar</p>
              <div className="grid grid-cols-4 gap-4">
                {DEFAULT_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setFormData({ ...formData, avatar })}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${formData.avatar === avatar ? 'border-[#00A651] scale-105' : 'border-amu hover:border-gray-400'
                      }`}
                  >
                    <Image src={avatar} fill alt="Avatar Option" className="object-cover" />
                    {formData.avatar === avatar && (
                      <div className="absolute inset-0 bg-[#00A651]/20 flex items-center justify-center">
                        <div className="bg-[#00A651] rounded-full p-1">
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-amu-card" />

        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User size={20} className="text-[#00A651]" />
            Complete Profile
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] text-var(--foreground)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Department *</label>
              <select
                required
                className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] appearance-none text-var(--foreground)"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {formData.department === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your department"
                  className="w-full mt-2 bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] text-var(--foreground)"
                  value={otherFields.department}
                  onChange={(e) => setOtherFields({ ...otherFields, department: e.target.value })}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Hall of Residence (Optional)</label>
              <select
                className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] appearance-none text-var(--foreground)"
                value={formData.hall}
                onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
              >
                <option value="">Select Hall</option>
                {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              {formData.hall === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your hall"
                  className="w-full mt-2 bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] text-var(--foreground)"
                  value={otherFields.hall}
                  onChange={(e) => setOtherFields({ ...otherFields, hall: e.target.value })}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Primary Club (Optional)</label>
              <select
                className="w-full bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] appearance-none text-var(--foreground)"
                value={formData.club}
                onChange={(e) => setFormData({ ...formData, club: e.target.value })}
              >
                <option value="">Select Club</option>
                {CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formData.club === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your club"
                  className="w-full mt-2 bg-amu-card border border-amu rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A651] text-var(--foreground)"
                  value={otherFields.club}
                  onChange={(e) => setOtherFields({ ...otherFields, club: e.target.value })}
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#00A651] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20"
            >
              Save Profile
            </button>
          </form>
        </section>

        <div className="h-px bg-amu-card" />

        <section>
          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
