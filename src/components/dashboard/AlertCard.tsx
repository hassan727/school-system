'use client';

import { ReactNode } from 'react';

interface AlertItem {
  id: string;
  title: string;
  icon: ReactNode;
  count: number;
  bgColor: string;
  textColor: string;
}

interface AlertCardProps {
  alerts: AlertItem[];
  title: string;
  isLoading?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alerts, title, isLoading = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 py-1 px-2 rounded-full">
          {alerts.reduce((sum, alert) => sum + alert.count, 0)} تنبيهات
        </span>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-3 ${alert.bgColor} ${alert.textColor} rounded-md`}>
              <div className="flex items-center">
                <span className="w-5 h-5 ml-2">{alert.icon}</span>
                <p className="font-medium">{alert.title} ({alert.count})</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-center">
          لا توجد تنبيهات حالية
        </div>
      )}
    </div>
  );
};

export default AlertCard;
