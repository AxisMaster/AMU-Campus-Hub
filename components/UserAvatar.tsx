import React from 'react';

// A selection of premium, vibrant gradients
const gradients = [
    'from-emerald-400 to-[#00A651]', // AMU Green
    'from-blue-400 to-indigo-600',
    'from-rose-400 to-red-600',
    'from-amber-400 to-orange-500',
    'from-fuchsia-400 to-purple-600',
    'from-cyan-400 to-blue-600',
];

interface UserAvatarProps {
    name: string;
    className?: string;
}

export default function UserAvatar({ name, className = '' }: UserAvatarProps) {
    // Extract up to 2 initials
    const getInitials = (n: string) => {
        const names = n.trim().split(' ');
        if (names.length === 0 || !names[0]) return '?';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // Consistently pick a gradient based on the first letter of the name
    const getGradient = (n: string) => {
        const charCode = n.trim().toUpperCase().charCodeAt(0) || 0;
        const index = isNaN(charCode) ? 0 : charCode % gradients.length;
        return gradients[index];
    };

    const initials = getInitials(name || 'User');
    const gradient = getGradient(name || 'User');

    return (
        <div className={`flex items-center justify-center rounded-full text-white font-black bg-gradient-to-tr shadow-inner ${gradient} ${className}`}>
            {initials}
        </div>
    );
}
