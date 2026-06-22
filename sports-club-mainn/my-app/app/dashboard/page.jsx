"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/src/components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <img
          src="https://crests.football-data.org/81.png"
          alt="FC Barcelona"
          className="w-16 h-16 object-contain animate-pulse drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-300/80">
          Loading dashboard
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Dashboard />;
}