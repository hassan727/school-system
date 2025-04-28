'use client';

import { StatCard } from '@/components/dashboard';
import { formatCurrency } from '@/lib/utils';
import {
  UserGroupIcon,
  UserIcon,
  BanknotesIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  stats: {
    studentsCount: number;
    teachersCount: number;
    revenue: number;
    expenses: number;
  };
  isLoading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="إجمالي الطلاب"
        value={stats.studentsCount}
        icon={<UserGroupIcon />}
        iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600 dark:text-blue-400"
        linkHref="/students"
        linkText="عرض التفاصيل"
        isLoading={isLoading}
      />
      
      <StatCard
        title="إجمالي المعلمين"
        value={stats.teachersCount}
        icon={<UserIcon />}
        iconBgColor="bg-green-100 dark:bg-green-900/30"
        iconColor="text-green-600 dark:text-green-400"
        linkHref="/staff"
        linkText="عرض التفاصيل"
        isLoading={isLoading}
      />
      
      <StatCard
        title="الإيرادات"
        value={formatCurrency(stats.revenue)}
        icon={<BanknotesIcon />}
        iconBgColor="bg-amber-100 dark:bg-amber-900/30"
        iconColor="text-amber-600 dark:text-amber-400"
        linkHref="/finance/reports"
        linkText="عرض التفاصيل"
        isLoading={isLoading}
      />
      
      <StatCard
        title="المصروفات"
        value={formatCurrency(stats.expenses)}
        icon={<ReceiptPercentIcon />}
        iconBgColor="bg-red-100 dark:bg-red-900/30"
        iconColor="text-red-600 dark:text-red-400"
        linkHref="/finance/expenses"
        linkText="عرض التفاصيل"
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardStats;
