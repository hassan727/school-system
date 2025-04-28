'use client';

import { useState } from 'react';
import { 
  CalendarDaysIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DashboardFilterProps {
  onFilterChange: (period: string) => void;
  onRefresh: () => void;
}

const DashboardFilter: React.FC<DashboardFilterProps> = ({ onFilterChange, onRefresh }) => {
  const [activePeriod, setActivePeriod] = useState('month');
  
  const handlePeriodChange = (period: string) => {
    setActivePeriod(period);
    onFilterChange(period);
  };

  const filters = [
    { id: 'day', label: 'اليوم', icon: <CalendarDaysIcon className="w-4 h-4" /> },
    { id: 'week', label: 'الأسبوع', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'month', label: 'الشهر', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'year', label: 'العام', icon: <ChartBarIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-6">
      <div className="flex space-x-1 space-x-reverse">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
              activePeriod === filter.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => handlePeriodChange(filter.id)}
          >
            <span className="ml-1">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>
      
      <button
        className="flex items-center px-3 py-2 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        onClick={onRefresh}
      >
        <ArrowPathIcon className="w-4 h-4 ml-1" />
        تحديث
      </button>
    </div>
  );
};

export default DashboardFilter;
