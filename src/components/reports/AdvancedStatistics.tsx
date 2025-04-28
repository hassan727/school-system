'use client';

import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useSharedDataStore } from '@/services/sharedDataService';
import { GRADE_LEVELS } from '@/types/student';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

// تسجيل مكونات الرسم البياني
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

/**
 * مكون الإحصائيات المتقدمة
 */
export default function AdvancedStatistics() {
  // استخدام مخزن البيانات المشتركة
  const statistics = useSharedDataStore(state => state.statistics);

  // تحويل بيانات المستوى الدراسي إلى تنسيق مناسب للرسم البياني
  const getGradeLevelChartData = () => {
    const labels: string[] = [];
    const data: number[] = [];

    // التحقق من وجود بيانات
    if (Object.keys(statistics.studentsByGradeLevel).length === 0) {
      return { labels, data };
    }

    // تحويل البيانات
    Object.entries(statistics.studentsByGradeLevel).forEach(([gradeId, count]) => {
      const grade = GRADE_LEVELS.find(g => g.id === gradeId);
      if (grade) {
        labels.push(grade.arabic_name);
        data.push(count);
      }
    });

    return { labels, data };
  };

  // تحويل بيانات الديانة إلى تنسيق مناسب للرسم البياني
  const getReligionChartData = () => {
    // التحقق من وجود بيانات
    const totalReligion = statistics.muslimStudents + statistics.christianStudents + statistics.otherReligionStudents;

    // إذا لم تكن هناك بيانات ديانة، نعرض بيانات افتراضية
    if (totalReligion === 0) {
      return {
        labels: ['مسلم'],
        data: [100]
      };
    }

    // إنشاء مصفوفة للتسميات والبيانات
    const labels = [];
    const data = [];

    // إضافة البيانات المتوفرة فقط
    if (statistics.muslimStudents > 0) {
      labels.push('مسلم');
      data.push(statistics.muslimStudents);
    }

    if (statistics.christianStudents > 0) {
      labels.push('مسيحي');
      data.push(statistics.christianStudents);
    }

    if (statistics.otherReligionStudents > 0) {
      labels.push('أخرى');
      data.push(statistics.otherReligionStudents);
    }

    return { labels, data };
  };

  // تحويل بيانات اللغة الثانية إلى تنسيق مناسب للرسم البياني
  const getSecondLanguageChartData = () => {
    return {
      labels: ['فرنسي', 'ألماني'],
      data: [
        statistics.frenchLanguageStudents,
        statistics.germanLanguageStudents
      ]
    };
  };

  // تحويل بيانات الحالة إلى تنسيق مناسب للرسم البياني
  const getStatusChartData = () => {
    return {
      labels: ['نشط', 'غير نشط', 'متخرج', 'منقول'],
      data: [
        statistics.activeStudents,
        statistics.inactiveStudents,
        statistics.graduatedStudents,
        statistics.transferredStudents
      ]
    };
  };

  // تحويل البيانات المالية إلى تنسيق مناسب للرسم البياني
  const getFinancialChartData = () => {
    // التحقق من وجود بيانات مالية
    const totalFinancial = statistics.totalPaid + statistics.totalDiscounts + statistics.totalDue;

    // إذا لم تكن هناك بيانات مالية، نعرض بيانات افتراضية
    if (totalFinancial === 0) {
      return {
        labels: ['لا توجد بيانات مالية'],
        data: [100]
      };
    }

    // إنشاء مصفوفة للتسميات والبيانات
    const labels = [];
    const data = [];

    // إضافة البيانات المتوفرة فقط
    if (statistics.totalPaid > 0) {
      labels.push('مدفوع');
      data.push(statistics.totalPaid);
    }

    if (statistics.totalDiscounts > 0) {
      labels.push('خصومات');
      data.push(statistics.totalDiscounts);
    }

    if (statistics.totalDue > 0) {
      labels.push('متبقي');
      data.push(statistics.totalDue);
    }

    // إذا لم تكن هناك بيانات بعد الفلترة، نعرض بيانات افتراضية
    if (data.length === 0) {
      return {
        labels: ['لا توجد بيانات مالية'],
        data: [100]
      };
    }

    return { labels, data };
  };

  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('ar-EG');
  };

  // بيانات الرسم البياني للمستوى الدراسي
  const gradeLevelData = getGradeLevelChartData();
  const gradeLevelChartData = {
    labels: gradeLevelData.labels,
    datasets: [
      {
        label: 'عدد الطلاب',
        data: gradeLevelData.data,
        backgroundColor: [
          '#3b82f6',
          '#22c55e',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#6366f1',
          '#14b8a6',
          '#a855f7'
        ],
        borderWidth: 1
      }
    ]
  };

  // بيانات الرسم البياني للديانة
  const religionData = getReligionChartData();
  const religionChartData = {
    labels: religionData.labels,
    datasets: [
      {
        data: religionData.data,
        backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b'],
        borderWidth: 1
      }
    ]
  };

  // بيانات الرسم البياني للغة الثانية
  const secondLanguageData = getSecondLanguageChartData();
  const secondLanguageChartData = {
    labels: secondLanguageData.labels,
    datasets: [
      {
        data: secondLanguageData.data,
        backgroundColor: ['#3b82f6', '#ef4444'],
        borderWidth: 1
      }
    ]
  };

  // بيانات الرسم البياني للحالة
  const statusData = getStatusChartData();
  const statusChartData = {
    labels: statusData.labels,
    datasets: [
      {
        data: statusData.data,
        backgroundColor: ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'],
        borderWidth: 1
      }
    ]
  };

  // بيانات الرسم البياني المالي
  const financialData = getFinancialChartData();
  const financialChartData = {
    labels: financialData.labels,
    datasets: [
      {
        data: financialData.data,
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات متقدمة</CardTitle>
          <p className="text-sm text-gray-500">
            آخر تحديث: {formatDate(statistics.lastUpdated)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلاب</p>
              <p className="text-2xl font-bold">{statistics.totalStudents}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">الطلاب النشطين</p>
              <p className="text-2xl font-bold">{statistics.activeStudents}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">الطلاب الذكور</p>
              <p className="text-2xl font-bold">{statistics.maleStudents}</p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">الطالبات الإناث</p>
              <p className="text-2xl font-bold">{statistics.femaleStudents}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* توزيع الطلاب حسب المستوى الدراسي */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع الطلاب حسب المستوى الدراسي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar
                    data={gradeLevelChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* توزيع الطلاب حسب الحالة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع الطلاب حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex justify-center items-center">
                  <div className="w-48 h-48">
                    <Doughnut
                      data={statusChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* توزيع الطلاب حسب الديانة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع الطلاب حسب الديانة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex justify-center items-center">
                  <div className="w-48 h-48">
                    <Doughnut
                      data={religionChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* توزيع الطلاب حسب اللغة الثانية */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع الطلاب حسب اللغة الثانية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex justify-center items-center">
                  <div className="w-48 h-48">
                    <Doughnut
                      data={secondLanguageChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الإحصائيات المالية */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الإحصائيات المالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الرسوم</p>
                    <p className="text-2xl font-bold">{statistics.totalFees.toLocaleString('ar-EG')} ج.م</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المدفوعات</p>
                    <p className="text-2xl font-bold">{statistics.totalPaid.toLocaleString('ar-EG')} ج.م</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المتبقي</p>
                    <p className="text-2xl font-bold">{statistics.totalDue.toLocaleString('ar-EG')} ج.م</p>
                  </div>
                </div>

                <div className="h-64 flex justify-center items-center">
                  <div className="w-64 h-64">
                    <Doughnut
                      data={financialChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
