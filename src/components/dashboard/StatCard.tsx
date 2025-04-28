'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  linkHref: string;
  linkText: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  linkHref,
  linkText,
  isLoading = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
        </div>
      </div>
      <p className={`text-3xl font-bold ${iconColor} mb-3`}>
        {isLoading ? (
          <span className="inline-block w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
        ) : (
          value
        )}
      </p>
      <div className="mt-2">
        <Link href={linkHref} className={`text-sm ${iconColor} hover:underline flex items-center`}>
          {linkText}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default StatCard;
