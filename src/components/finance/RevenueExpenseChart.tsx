'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// تسجيل مكونات الرسم البياني
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueExpenseChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
}

/**
 * مكون الرسم البياني للإيرادات والمصروفات
 */
export function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  // تكوين بيانات الرسم البياني
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'الإيرادات',
        data: data.datasets[0].data,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'المصروفات',
        data: data.datasets[1].data,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };
  
  // خيارات الرسم البياني
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('ar-EG', {
              style: 'currency',
              currency: 'EGP',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(value);
          },
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      }
    }
  };
  
  return <Bar data={chartData} options={options} />;
}
