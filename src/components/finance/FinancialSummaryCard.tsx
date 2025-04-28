'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface FinancialSummaryCardProps {
  title: string;
  value: number;
  description?: string;
  trend?: number;
  colorScheme?: 'green' | 'red' | 'blue' | 'amber' | 'purple';
}

/**
 * مكون بطاقة ملخص مالي
 */
export function FinancialSummaryCard({
  title,
  value,
  description,
  trend,
  colorScheme = 'blue'
}: FinancialSummaryCardProps) {
  // تحديد الألوان حسب النوع
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-600 dark:text-green-400',
          icon: 'text-green-500'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-600 dark:text-red-400',
          icon: 'text-red-500'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-600 dark:text-amber-400',
          icon: 'text-amber-500'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          text: 'text-purple-600 dark:text-purple-400',
          icon: 'text-purple-500'
        };
      case 'blue':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          icon: 'text-blue-500'
        };
    }
  };
  
  const colors = getColorClasses();
  
  // تنسيق المبلغ بالجنيه المصري
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Card className={`${colors.bg} border-0`}>
      <CardContent className="p-6">
        <div className="flex flex-col">
          <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
          <div className="text-2xl font-bold mt-2">{formatCurrency(value)}</div>
          
          <div className="flex justify-between items-center mt-4">
            {description && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
            )}
            
            {trend !== undefined && (
              <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
