'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * صفحة الإدارة المالية الرئيسية (إعادة توجيه إلى لوحة التحكم)
 */
export default function FinancePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/finance/dashboard');
  }, [router]);
  
  return null;
}
