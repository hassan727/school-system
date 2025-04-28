'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
// import { formatCurrency } from '@/lib/utils'; // غير مستخدم
import {
  DashboardHeader,
  DashboardStats,
  DashboardCharts,
  DashboardAlerts,
  DashboardKPIs,
  DashboardFilter
} from '@/components/dashboard';
import {
  getRevenueData,
  getExpensesData,
  getDistributionData,
  getKPIs,
  getAlerts,
  getActivities
} from './data/dashboardData';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('month');

  // بيانات إحصائية
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    revenue: 0,
    expenses: 0
  });

  // بيانات الرسوم البيانية
  const [revenueData, setRevenueData] = useState(getRevenueData());
  const [expensesData, setExpensesData] = useState(getExpensesData());
  const [distributionData, setDistributionData] = useState(getDistributionData());

  // بيانات مؤشرات الأداء
  const [kpis, setKpis] = useState(getKPIs());

  // بيانات التنبيهات والأنشطة
  const [alerts, setAlerts] = useState(getAlerts());
  const [activities, setActivities] = useState(getActivities());

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);

      try {
        // الحصول على عدد الطلاب
        const { count: studentsCount, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        if (studentsError) {
          console.error('Error fetching students count:', studentsError);
        }

        // تعيين الإحصائيات
        // ملاحظة: نستخدم قيمة افتراضية لعدد المعلمين لأن جدول teachers غير موجود حاليًا
        setStats({
          studentsCount: studentsCount || 0,
          teachersCount: 0, // قيمة افتراضية حتى يتم إنشاء جدول المعلمين
          revenue: 1250000, // بيانات تجريبية
          expenses: 850000 // بيانات تجريبية
        });

        // تحميل بيانات الرسوم البيانية
        setRevenueData(getRevenueData());
        setExpensesData(getExpensesData());
        setDistributionData(getDistributionData());

        // تحميل بيانات مؤشرات الأداء
        setKpis(getKPIs());

        // تحميل بيانات التنبيهات والأنشطة
        setAlerts(getAlerts());
        setActivities(getActivities());

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [activePeriod]);

  // معالج تغيير الفترة الزمنية
  const handlePeriodChange = (period: string) => {
    setActivePeriod(period);
  };

  // معالج تحديث البيانات
  const handleRefresh = () => {
    // إعادة تحميل البيانات بنفس الفترة الزمنية
    setIsLoading(true);
    setTimeout(() => {
      setStats({
        ...stats,
        revenue: stats.revenue + Math.floor(Math.random() * 50000),
        expenses: stats.expenses + Math.floor(Math.random() * 30000)
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="p-4">
        {/* رأس لوحة التحكم */}
        <DashboardHeader
          title="لوحة التحكم"
          subtitle={`مرحبًا بك في نظام إدارة مدرسة الجيل الواعد - ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          actions={[
            {
              label: 'تقرير جديد',
              href: '/reports/create',
              variant: 'outline'
            },
            {
              label: 'إضافة طالب',
              href: '/students/add',
              variant: 'primary'
            }
          ]}
        />

        {/* فلتر الفترة الزمنية */}
        <DashboardFilter
          onFilterChange={handlePeriodChange}
          onRefresh={handleRefresh}
        />

        {/* الإحصائيات الرئيسية */}
        <DashboardStats
          stats={stats}
          isLoading={isLoading}
        />

        {/* الرسوم البيانية */}
        <DashboardCharts
          revenueData={revenueData}
          expensesData={expensesData}
          distributionData={distributionData}
          isLoading={isLoading}
        />

        {/* مؤشرات الأداء الرئيسية */}
        <DashboardKPIs
          kpis={kpis}
          isLoading={isLoading}
        />

        {/* التنبيهات والأنشطة الأخيرة */}
        <DashboardAlerts
          alerts={alerts}
          activities={activities}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
}
