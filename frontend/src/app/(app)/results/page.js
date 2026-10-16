'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonCard } from '@/components/SkeletonLoader';

export default function ResultsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/test?tab=results');
  }, [router]);

  return (
    <div style={{ padding: '2rem 0', animation: 'fadeIn 0.2s ease-out' }}>
      <SkeletonCard height="160px" />
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <SkeletonCard height="80px" />
        <SkeletonCard height="80px" />
      </div>
    </div>
  );
}
