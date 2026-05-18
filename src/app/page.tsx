'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    const role = session.user.role;
    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'manager') router.push('/manager/dashboard');
    else router.push('/employee/dashboard');
  }, [session, status, router]);

  return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}
