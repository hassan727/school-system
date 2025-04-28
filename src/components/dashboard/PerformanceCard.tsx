'use client';

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'success' | 'warning' | 'danger';
}

interface PerformanceCardProps {
  kpis: KPI[];
  title: string;
  isLoading?: boolean;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ kpis, title, isLoading = false }) => {
  const getStatusColor = (status: KPI['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculatePercentage = (value: number, target: number) => {
    return Math.min(Math.round((value / target) * 100), 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : kpis.length > 0 ? (
        <div className="space-y-4">
          {kpis.map((kpi) => {
            const percentage = calculatePercentage(kpi.value, kpi.target);
            
            return (
              <div key={kpi.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{kpi.name}</span>
                  <span className="text-sm">
                    {kpi.value} / {kpi.target} {kpi.unit}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(kpi.status)} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                  <span className={`text-xs ${
                    kpi.status === 'success' ? 'text-green-500' :
                    kpi.status === 'warning' ? 'text-amber-500' :
                    'text-red-500'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">لا توجد مؤشرات أداء متاحة</p>
      )}
    </div>
  );
};

export default PerformanceCard;
