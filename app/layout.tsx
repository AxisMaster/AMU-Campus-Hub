'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import './globals.css';


function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useAuth();

  return (
    <body suppressHydrationWarning className={`${theme} min-h-screen pb-20`}>

      <ToastProvider>
        {children}
        <NotificationPrompt />
      </ToastProvider>

    </body>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00A651" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <AuthProvider>
        <RootLayoutContent>{children}</RootLayoutContent>
      </AuthProvider>
    </html>
  );
}
