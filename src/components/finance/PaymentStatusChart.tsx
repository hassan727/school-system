'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// تسجيل مكونات الرسم البياني
Chart.register(
  ArcElement,
  Tooltip,
  Legend
);

interface PaymentStatusChartProps {
  paid: number;
  due: number;
  discount: number;
}

/**
 * مكون الرسم البياني لحالة المدفوعات
 */
export function PaymentStatusChart({ paid, due, discount }: PaymentStatusChartProps) {
  // تكوين بيانات الرسم البياني
  const chartData = {
    labels: ['مدفوع', 'متبقي', 'خصومات'],
    datasets: [
      {
        data: [paid, due, discount],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(245, 158, 11, 0.6)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)'
        ],
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
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.raw !== null) {
              label += new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                maximumFractionDigits: 0
              }).format(context.raw);
            }
            return label;
          }
        }
      }
    }
  };
  
  return <Doughnut data={chartData} options={options} />;
}
