'use client';

import { AlertCard, ActivityCard } from '@/components/dashboard';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface DashboardAlertsProps {
  alerts: {
    overdueInvoices: number;
    upcomingExams: number;
    todayMeetings: number;
  };
  activities: {
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    type: 'student' | 'financial' | 'staff' | 'academic' | 'system';
    link: string;
  }[];
  isLoading?: boolean;
}

const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ 
  alerts, 
  activities, 
  isLoading = false 
}) => {
  const alertItems = [
    {
      id: 'overdueInvoices',
      title: 'فواتير متأخرة',
      icon: <ExclamationTriangleIcon />,
      count: alerts.overdueInvoices,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-800 dark:text-red-200'
    },
    {
      id: 'upcomingExams',
      title: 'اختبارات قادمة',
      icon: <ClockIcon />,
      count: alerts.upcomingExams,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-800 dark:text-amber-200'
    },
    {
      id: 'todayMeetings',
      title: 'اجتماعات اليوم',
      icon: <CalendarIcon />,
      count: alerts.todayMeetings,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-800 dark:text-blue-200'
    }
  ];

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AlertCard
        title="التنبيهات"
        alerts={alertItems}
        isLoading={isLoading}
      />
      
      <ActivityCard
        activities={activities}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardAlerts;
