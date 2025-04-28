// بيانات تجريبية للوحة التحكم
import { ChartData } from 'chart.js';

// تعريف نوع مخصص للرسوم البيانية مع ضمان أن labels دائمًا من نوع string[]
export type TypedChartData<T extends 'line' | 'bar' | 'doughnut'> = Omit<ChartData<T>, 'labels'> & {
  labels: string[];
};

// بيانات الإيرادات
export const getRevenueData = (): TypedChartData<'line'> => ({
  labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
  datasets: [
    {
      label: 'الإيرادات',
      data: [120000, 190000, 150000, 210000, 180000, 230000],
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    },
    {
      label: 'الإيرادات المتوقعة',
      data: [100000, 170000, 160000, 200000, 190000, 250000],
      backgroundColor: 'rgba(37, 99, 235, 0.0)',
      borderColor: 'rgba(37, 99, 235, 0.5)',
      borderWidth: 2,
      borderDash: [5, 5],
      tension: 0.4,
      fill: false,
    }
  ],
});

// بيانات المصروفات
export const getExpensesData = (): TypedChartData<'bar'> => ({
  labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
  datasets: [
    {
      label: 'المصروفات',
      data: [80000, 95000, 110000, 85000, 100000, 120000],
      backgroundColor: 'rgba(220, 38, 38, 0.7)',
      borderColor: 'rgba(220, 38, 38, 1)',
      borderWidth: 1,
    },
    {
      label: 'الميزانية المخططة',
      data: [90000, 90000, 100000, 100000, 110000, 110000],
      backgroundColor: 'rgba(220, 38, 38, 0.2)',
      borderColor: 'rgba(220, 38, 38, 0.7)',
      borderWidth: 1,
      // borderDash: [5, 5], // تم إزالتها لأنها غير متوافقة مع مخططات الأعمدة
    }
  ],
});

// بيانات توزيع المصروفات
export const getDistributionData = (): TypedChartData<'doughnut'> => ({
  labels: ['الرواتب', 'المرافق', 'الصيانة', 'المستلزمات', 'التطوير', 'أخرى'],
  datasets: [
    {
      label: 'توزيع المصروفات',
      data: [65, 10, 8, 7, 6, 4],
      backgroundColor: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ],
      borderColor: [
        'rgba(37, 99, 235, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(107, 114, 128, 1)',
      ],
      borderWidth: 1,
    },
  ],
});

// بيانات مؤشرات الأداء الرئيسية
export const getKPIs = () => [
  {
    id: 'kpi-1',
    name: 'نسبة الحضور',
    value: 92,
    target: 95,
    unit: '%',
    status: 'warning' as const,
  },
  {
    id: 'kpi-2',
    name: 'معدل النجاح',
    value: 87,
    target: 80,
    unit: '%',
    status: 'success' as const,
  },
  {
    id: 'kpi-3',
    name: 'تحصيل الرسوم',
    value: 78,
    target: 90,
    unit: '%',
    status: 'danger' as const,
  },
  {
    id: 'kpi-4',
    name: 'رضا أولياء الأمور',
    value: 85,
    target: 85,
    unit: '%',
    status: 'success' as const,
  },
];

// بيانات التنبيهات
export const getAlerts = () => ({
  overdueInvoices: 5,
  upcomingExams: 3,
  todayMeetings: 2,
});

// بيانات الأنشطة الأخيرة
export const getActivities = () => [
  {
    id: 'act-1',
    title: 'تسجيل طالب جديد',
    description: 'تم تسجيل الطالب أحمد محمد في الصف الأول الابتدائي',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // قبل 30 دقيقة
    type: 'student' as const,
    link: '/students/123',
  },
  {
    id: 'act-2',
    title: 'دفع رسوم دراسية',
    description: 'تم استلام دفعة بقيمة 5000 ج.م من ولي أمر الطالب محمد علي',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // قبل ساعتين
    type: 'financial' as const,
    link: '/finance/payments/456',
  },
  {
    id: 'act-3',
    title: 'تعيين معلم جديد',
    description: 'تم تعيين المعلم سمير أحمد لمادة الرياضيات',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // قبل 5 ساعات
    type: 'staff' as const,
    link: '/staff/789',
  },
];
