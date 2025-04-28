'use client';

import MainLayout from '@/components/layout/MainLayout';
import { FinancialDashboard } from '@/components/finance/FinancialDashboard';

/**
 * صفحة لوحة التحكم المالية
 */
export default function FinancialDashboardPage() {
  return (
    <MainLayout>
      <div className="p-6">
        <FinancialDashboard />
      </div>
    </MainLayout>
  );
}
