'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Moon, Sun, Shield, Bookmark, Home, Building, Camera, Check, LogOut, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';

const DEPARTMENTS = ['ZHCET (Engineering)', 'Science', 'Arts', 'Commerce', 'Medicine', 'Law', 'Social Science', 'Other'];
const HALLS = ['Sulaiman Hall', 'Sir Syed Hall', 'Ross Masood Hall', 'Hadi Hasan Hall', 'Mohammad Habib Hall', 'Nadeem Tarin Hall', 'Other'];
const CLUBS = ['CEC (Cultural Education Centre)', 'Drama Club', 'Science Club', 'Photography Club', 'Robotics Club', 'Other'];

export default function YouPage() {
    const { user, theme, toggleTheme, signOut, updateProfile, savedEventIds } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
    const [adminMode, setAdminMode] = useState(false);

    // Settings State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        department: user?.department || '',
        hall: user?.hall || '',
        club: user?.club || '',
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

    if (!user) return null;

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {
            name: formData.name,
            department: formData.department === 'Other' ? otherFields.department : formData.department,
            hall: formData.hall === 'Other' ? otherFields.hall : formData.hall,
            club: formData.club === 'Other' ? otherFields.club : formData.club,
        };
        updateProfile(finalData);
        setActiveTab('profile'); // Switch back to profile view after saving
    };

    const handleLogout = () => {
        signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-var(--background) text-var(--foreground) pb-24 font-sans">
            {/* Header */}
            <header className="p-6 flex justify-between items-center sticky top-0 bg-var(--background)/80 backdrop-blur-lg z-50 border-b border-amu">
                <h1 className="text-3xl font-black tracking-tight">You</h1>
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 bg-amu-card px-4 py-2 rounded-full border border-amu text-xs font-bold transition-all shadow-sm hover:bg-gray-800"
                >
                    {theme === 'dark' ? (
                        <>
                            <Moon size={14} className="text-[#FFD700]" />
                            <span>DARK</span>
                        </>
                    ) : (
                        <>
                            <Sun size={14} className="text-[#FFA500]" />
                            <span>LIGHT</span>
                        </>
                    )}
                </button>
            </header>

            {/* Tabs */}
            <div className="px-6 py-4">
                <div className="flex bg-amu-card p-1 rounded-2xl border border-amu relative">
                    <div
                        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#00A651] rounded-xl transition-transform duration-300 ease-in-out shadow-sm"
                        style={{ transform: activeTab === 'settings' ? 'translateX(100%)' : 'translateX(0)' }}
                    />
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-bold z-10 flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === 'profile' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <UserIcon size={16} /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 text-sm font-bold z-10 flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === 'settings' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <SettingsIcon size={16} /> Settings
                    </button>
                </div>
            </div>

            <div className="px-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' ? (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8 mt-4"
                        >
                            {/* Profile Card */}
                            <div className="bg-amu-card rounded-3xl p-6 flex flex-col items-center text-center gap-4 border border-amu relative overflow-hidden shadow-lg">
                                <div className="relative w-32 h-32 rounded-full border-4 border-var(--background) shadow-2xl">
                                    <UserAvatar name={user.name} className="w-full h-full text-5xl" />
                                    {user.role === 'admin' && (
                                        <div className="absolute bottom-1 right-1 bg-[#00A651] p-2 rounded-full border-4 border-var(--background) shadow-md">
                                            <Shield size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black mb-1">{user.name}</h2>
                                    <p className="text-gray-400 text-sm font-medium mb-4">{user.department || 'Department not set'}</p>

                                    <div className="flex flex-wrap justify-center gap-2">
                                        {user.hall && (
                                            <div className="flex items-center gap-1.5 bg-var(--background) px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 border border-amu shadow-sm">
                                                <Home size={12} className="text-[#00A651]" />
                                                <span>{user.hall}</span>
                                            </div>
                                        )}
                                        {user.club && (
                                            <div className="flex items-center gap-1.5 bg-var(--background) px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 border border-amu shadow-sm">
                                                <Building size={12} className="text-[#00A651]" />
                                                <span>{user.club}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Quick Actions</h3>
                                <Link href="/saved">
                                    <div className="bg-amu-card p-5 rounded-3xl border border-amu hover:bg-amu-card/80 transition-all cursor-pointer group flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#0F291E] flex items-center justify-center text-[#00A651] group-hover:scale-110 transition-transform shadow-inner">
                                                <Bookmark size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">Saved Events</h4>
                                                <p className="text-sm text-gray-400">{savedEventIds.length} items saved for later</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            {/* Admin Mode Toggle */}
                            {user.role === 'admin' && (
                                <div className="bg-amu-card rounded-3xl p-5 flex items-center justify-between border border-[#FFA500]/30 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFA500]/5 rounded-full blur-2xl pointer-events-none" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-full bg-[#3A2814] flex items-center justify-center text-[#FFA500] shadow-inner">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Admin Mode</h3>
                                            <p className="text-sm text-gray-400">Post and manage official notices</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`relative w-14 h-8 rounded-full p-1 transition-colors cursor-pointer z-10 ${adminMode ? 'bg-[#FFA500]' : 'bg-gray-700'}`}
                                        onClick={() => setAdminMode(!adminMode)}
                                    >
                                        <motion.div
                                            className="w-6 h-6 bg-white rounded-full shadow-md"
                                            animate={{ x: adminMode ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8 mt-4"
                        >
                            <form onSubmit={handleSaveSettings} className="space-y-8">


                                {/* Personal Details */}
                                <div className="bg-amu-card p-6 rounded-3xl border border-amu shadow-sm space-y-6">
                                    <h2 className="text-sm font-black tracking-widest text-gray-500 uppercase flex items-center gap-2 mb-4">
                                        <UserIcon size={16} className="text-[#00A651]" />
                                        Personal Details
                                    </h2>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 text-var(--foreground) font-medium transition-all shadow-inner"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                                        <select
                                            required
                                            className="w-full bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 appearance-none text-var(--foreground) font-medium transition-all shadow-inner"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            <option value="" className="bg-white text-black dark:bg-[#121212] dark:text-white">Select Department</option>
                                            {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-white text-black dark:bg-[#121212] dark:text-white">{d}</option>)}
                                        </select>
                                        {formData.department === 'Other' && (
                                            <motion.input
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                type="text"
                                                placeholder="Enter your department"
                                                className="w-full mt-3 bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 text-var(--foreground) font-medium transition-all shadow-inner"
                                                value={otherFields.department}
                                                onChange={(e) => setOtherFields({ ...otherFields, department: e.target.value })}
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Hall of Residence <span className="text-gray-600 opacity-50">(Optional)</span></label>
                                        <select
                                            className="w-full bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 appearance-none text-var(--foreground) font-medium transition-all shadow-inner"
                                            value={formData.hall}
                                            onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                                        >
                                            <option value="" className="bg-white text-black dark:bg-[#121212] dark:text-white">Select Hall</option>
                                            {HALLS.map(h => <option key={h} value={h} className="bg-white text-black dark:bg-[#121212] dark:text-white">{h}</option>)}
                                        </select>
                                        {formData.hall === 'Other' && (
                                            <motion.input
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                type="text"
                                                placeholder="Enter your hall"
                                                className="w-full mt-3 bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 text-var(--foreground) font-medium transition-all shadow-inner"
                                                value={otherFields.hall}
                                                onChange={(e) => setOtherFields({ ...otherFields, hall: e.target.value })}
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Primary Club <span className="text-gray-600 opacity-50">(Optional)</span></label>
                                        <select
                                            className="w-full bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 appearance-none text-var(--foreground) font-medium transition-all shadow-inner"
                                            value={formData.club}
                                            onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                                        >
                                            <option value="" className="bg-white text-black dark:bg-[#121212] dark:text-white">Select Club</option>
                                            {CLUBS.map(c => <option key={c} value={c} className="bg-white text-black dark:bg-[#121212] dark:text-white">{c}</option>)}
                                        </select>
                                        {formData.club === 'Other' && (
                                            <motion.input
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                type="text"
                                                placeholder="Enter your club"
                                                className="w-full mt-3 bg-var(--background) border border-amu rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 text-var(--foreground) font-medium transition-all shadow-inner"
                                                value={otherFields.club}
                                                onChange={(e) => setOtherFields({ ...otherFields, club: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#00A651] text-white font-black tracking-wide py-4 text-sm rounded-2xl shadow-lg shadow-green-900/20 hover:bg-[#008f45] transition-all"
                                >
                                    SAVE PROFILE
                                </button>
                            </form>

                            <button
                                onClick={handleLogout}
                                className="w-full py-4 rounded-2xl border-2 border-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />
        </div>
    );
}
