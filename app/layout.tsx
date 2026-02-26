'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useAuth();

  return (
    <body suppressHydrationWarning className={`${theme} min-h-screen pb-20`}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </body>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <AuthProvider>
        <RootLayoutContent>{children}</RootLayoutContent>
      </AuthProvider>
    </html>
  );
}
