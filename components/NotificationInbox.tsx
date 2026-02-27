'use client';

import { Inbox } from '@novu/nextjs';
import { useAuth } from '@/context/AuthContext';

export default function NotificationInbox() {
    const { user, theme } = useAuth();
    const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER;

    if (!applicationIdentifier || !user?.id) return null;

    return (
        <Inbox
            applicationIdentifier={applicationIdentifier}
            subscriberId={user.id}
            appearance={{
                baseTheme: (theme === 'dark' ? 'dark' : 'light') as any,
                variables: {
                    colorPrimary: '#00A651',
                    colorPrimaryForeground: '#FFFFFF',
                    colorBackground: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                    colorForeground: theme === 'dark' ? '#E0E0E0' : '#121212',
                    colorNeutral: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    fontSize: '14px',
                    borderRadius: '12px',
                },
                elements: {
                    bellIcon: {
                        color: '#A0A0A0',
                    },
                },
            }}
        />
    );
}
