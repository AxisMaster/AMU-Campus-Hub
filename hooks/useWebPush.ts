import { useState, useEffect } from 'react';
import { getMessagingToken, onMessageListener } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export const useWebPush = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);

    const [isOptedIn, setIsOptedIn] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
            setIsSupported(true);
            const currentPermission = Notification.permission;
            setPermission(currentPermission);

            // Sync isOptedIn with permission and a local check
            const localOptIn = localStorage.getItem('push_opt_in') !== 'false';
            setIsOptedIn(currentPermission === 'granted' && localOptIn);

            // Listen for foreground messages
            onMessageListener().then((payload: any) => {
                console.log('Foreground Message received:', payload);
                if (payload.notification) {
                    showToast(payload.notification.title || 'New Notification', 'success');
                }
            }).catch(err => console.error('Foreground listener error:', err));
        }
    }, [showToast]);

    const requestPermission = async (manualSync = false) => {
        if (!isSupported) {
            console.warn('Web Push not supported in this browser');
            return false;
        }

        setLoading(true);
        try {
            let status = Notification.permission;

            if (status !== 'granted' || manualSync) {
                status = await Notification.requestPermission();
                setPermission(status);
            }

            if (status === 'granted') {
                const token = await getMessagingToken();
                if (token && user?.id) {
                    await syncTokenWithNovu(user.id, token, 'add');
                    localStorage.setItem('push_opt_in', 'true');
                    setIsOptedIn(true);
                    showToast('Push notifications are active!', 'success');
                } else if (!token) {
                    showToast('Failed to fetch notification token.', 'error');
                }
            } else if (status === 'denied') {
                showToast('Notifications are blocked by browser.', 'error');
            }

            return status === 'granted';
        } catch (error) {
            console.error('Permission request failed:', error);
            showToast('Failed to enable notifications.', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            await syncTokenWithNovu(user.id, '', 'remove');
            localStorage.setItem('push_opt_in', 'false');
            setIsOptedIn(false);
            showToast('Push notifications turned off.', 'success');
        } catch (error) {
            console.error('Unsubscribe error:', error);
            showToast('Failed to turn off notifications.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const syncTokenWithNovu = async (subscriberId: string, deviceToken: string, action: 'add' | 'remove' = 'add') => {
        try {
            const res = await fetch('/api/novu/sync-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriberId, deviceToken, action }),
            });

            if (!res.ok) throw new Error('Failed to sync token');
        } catch (error) {
            console.error('Novu sync error:', error);
            throw error;
        }
    };

    return { isSupported, permission, isOptedIn, requestPermission, unsubscribe, loading };
};
