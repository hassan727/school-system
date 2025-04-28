'use client';

import { useState } from 'react';
import { ChartCard } from '@/components/dashboard';
import { ChartData, ChartOptions } from 'chart.js';

interface DashboardChartsProps {
  revenueData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  };
  expensesData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  };
  distributionData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
    }[];
  };
  isLoading?: boolean;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  revenueData,
  expensesData,
  distributionData,
  isLoading = false,
}) => {
  // خيارات الرسم البياني الخطي
  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ar-EG', { 
                style: 'currency', 
                currency: 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('ar-EG', { 
              style: 'currency', 
              currency: 'EGP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value as number);
          }
        }
      },
    },
  };

  // خيارات الرسم البياني الشريطي
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ar-EG', { 
                style: 'currency', 
                currency: 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('ar-EG', { 
              style: 'currency', 
              currency: 'EGP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value as number);
          }
        }
      },
    },
  };

  // خيارات الرسم البياني الدائري
  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('ar-EG', { 
                style: 'percent', 
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              }).format(context.parsed / 100);
            }
            return label;
          }
        }
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <ChartCard
        title="الإيرادات الشهرية"
        chartType="line"
        data={revenueData}
        options={lineOptions}
        isLoading={isLoading}
        filters={['الأسبوع', 'الشهر', 'الربع', 'العام']}
      />
      
      <ChartCard
        title="المصروفات الشهرية"
        chartType="bar"
        data={expensesData}
        options={barOptions}
        isLoading={isLoading}
        filters={['الأسبوع', 'الشهر', 'الربع', 'العام']}
      />
      
      <ChartCard
        title="توزيع المصروفات"
        chartType="doughnut"
        data={distributionData}
        options={doughnutOptions}
        isLoading={isLoading}
        filters={['الشهر', 'الربع', 'العام']}
        height={250}
      />
    </div>
  );
};

export default DashboardCharts;
