'use client';

import { PerformanceCard } from '@/components/dashboard';

interface DashboardKPIsProps {
  kpis: {
    id: string;
    name: string;
    value: number;
    target: number;
    unit: string;
    status: 'success' | 'warning' | 'danger';
  }[];
  isLoading?: boolean;
}

const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ kpis, isLoading = false }) => {
  return (
    <div className="mt-8">
      <PerformanceCard
        title="مؤشرات الأداء الرئيسية"
        kpis={kpis}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardKPIs;
