'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    switch (user.role) {
      case 'Admin': router.replace('/admin/dashboard'); break;
      case 'Sales':
      case 'Designer': router.replace('/office/dashboard'); break;
      case 'Cutter':
      case 'Painter': router.replace('/factory/tasks'); break;
      case 'Installer': router.replace('/field/schedule'); break;
    }
  }, [user, loading, router]);

  return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
}
