'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '../components/AuthProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = window.localStorage.getItem('tbay-theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
