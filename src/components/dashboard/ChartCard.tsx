'use client';

import { ReactNode, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// تسجيل مكونات Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler // إضافة Filler plugin لدعم خاصية fill في الرسوم البيانية
);

type ChartType = 'line' | 'bar' | 'doughnut';

interface ChartCardProps {
  title: string;
  chartType: ChartType;
  data: ChartData<any>;
  options?: ChartOptions<any>;
  filters?: string[];
  isLoading?: boolean;
  height?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  chartType,
  data,
  options,
  filters = ['اليوم', 'الأسبوع', 'الشهر', 'العام'],
  isLoading = false,
  height = 300,
}) => {
  const [activeFilter, setActiveFilter] = useState(filters[2]); // الشهر كافتراضي

  const renderChart = (): ReactNode => {
    if (isLoading) {
      return <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>;
    }

    switch (chartType) {
      case 'line':
        return <Line data={data} options={options} height={height} />;
      case 'bar':
        return <Bar data={data} options={options} height={height} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} height={height} />;
      default:
        return <div>نوع الرسم البياني غير مدعوم</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold mb-2 sm:mb-0">{title}</h2>
        <div className="flex space-x-1 space-x-reverse">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">{renderChart()}</div>
    </div>
  );
};

export default ChartCard;
