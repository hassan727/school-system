'use client';

import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GRADE_LEVELS, Student } from '@/types/student';
import studentService from '@/services/studentService';
import exportService from '@/services/exportService';
import htmlPrintService from '@/services/htmlPrintService';
import realtimeService from '@/services/realtimeService';
import sharedDataService, { useSharedDataStore } from '@/services/sharedDataService';
import AdvancedStatistics from '@/components/reports/AdvancedStatistics';
import Spinner from '@/components/ui/Spinner';
import { showToast } from '@/components/ui/ToastContainer';
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
import { Pie, Bar } from 'react-chartjs-2';

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

export default function StudentReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('gender');
  const [chartData, setChartData] = useState<any>(null);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);

  // تحميل بيانات الطلاب
  useEffect(() => {
    loadStudents();

    // الاشتراك في التغييرات في الوقت الحقيقي
    realtimeSubscriptionRef.current = realtimeService.subscribeToStudents((payload) => {
      console.log('Realtime update for students:', payload.eventType);
      loadStudents();
    });

    // تنظيف الاشتراك عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeService.unsubscribe(realtimeSubscriptionRef.current);
      }
    };
  }, []);

  // تحميل بيانات الطلاب من الخادم
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await studentService.getStudents({ limit: 1000 });

      if (error) {
        console.error('Error loading students:', error);
        return;
      }

      const studentsData = data || [];
      setStudents(studentsData);

      // تحديث البيانات المشتركة
      sharedDataService.updateStudents(studentsData);

      generateReport(selectedReport, studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // تغيير نوع التقرير
  const handleReportChange = (reportType: string) => {
    setSelectedReport(reportType);
    generateReport(reportType, students);
  };

  // إنشاء التقرير
  const generateReport = (reportType: string, data: Student[]) => {
    switch (reportType) {
      case 'gender':
        generateGenderReport(data);
        break;
      case 'grade':
        generateGradeReport(data);
        break;
      case 'status':
        generateStatusReport(data);
        break;
      default:
        generateGenderReport(data);
    }
  };

  // إنشاء تقرير توزيع الطلاب حسب الجنس
  const generateGenderReport = (data: Student[]) => {
    const maleCount = data.filter(student => student.gender === 'male').length;
    const femaleCount = data.filter(student => student.gender === 'female').length;

    setChartData({
      type: 'pie',
      data: {
        labels: ['ذكور', 'إناث'],
        datasets: [
          {
            data: [maleCount, femaleCount],
            backgroundColor: ['#3b82f6', '#ec4899'],
            borderColor: ['#2563eb', '#db2777'],
            borderWidth: 1,
          },
        ],
      },
      title: 'توزيع الطلاب حسب الجنس',
    });
  };

  // إنشاء تقرير توزيع الطلاب حسب المستوى الدراسي
  const generateGradeReport = (data: Student[]) => {
    const gradeCounts = GRADE_LEVELS.map(grade => {
      return {
        id: grade.id,
        name: grade.arabic_name,
        count: data.filter(student => student.grade_level === grade.id).length,
      };
    }).filter(grade => grade.count > 0);

    setChartData({
      type: 'bar',
      data: {
        labels: gradeCounts.map(grade => grade.name),
        datasets: [
          {
            label: 'عدد الطلاب',
            data: gradeCounts.map(grade => grade.count),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
      title: 'توزيع الطلاب حسب المستوى الدراسي',
    });
  };

  // إنشاء تقرير توزيع الطلاب حسب الحالة
  const generateStatusReport = (data: Student[]) => {
    const activeCount = data.filter(student => student.status === 'active').length;
    const inactiveCount = data.filter(student => student.status === 'inactive').length;
    const graduatedCount = data.filter(student => student.status === 'graduated').length;
    const transferredCount = data.filter(student => student.status === 'transferred').length;

    setChartData({
      type: 'pie',
      data: {
        labels: ['نشط', 'غير نشط', 'متخرج', 'منقول'],
        datasets: [
          {
            data: [activeCount, inactiveCount, graduatedCount, transferredCount],
            backgroundColor: ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'],
            borderColor: ['#16a34a', '#dc2626', '#2563eb', '#d97706'],
            borderWidth: 1,
          },
        ],
      },
      title: 'توزيع الطلاب حسب الحالة',
    });
  };

  // طباعة التقرير باستخدام HTML
  const exportToPDF = async () => {
    if (!chartData) {
      showToast('لا توجد بيانات للطباعة', 'error');
      return;
    }

    setIsExportingPDF(true);

    try {
      // تحويل بيانات الرسم البياني إلى بيانات جدولية
      const reportData = prepareReportData();

      // استخدام خدمة الطباعة HTML الجديدة
      await htmlPrintService.printData(reportData, {
        title: chartData.title,
        subtitle: `إجمالي عدد الطلاب: ${students.length}`
      });

      showToast('تم إرسال التقرير للطباعة بنجاح', 'success');
    } catch (error) {
      console.error('Error printing report:', error);
      showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // تصدير التقرير إلى Excel
  const exportToExcel = async () => {
    if (!chartData) {
      showToast('لا توجد بيانات للتصدير', 'error');
      return;
    }

    setIsExportingExcel(true);

    try {
      // تحويل بيانات الرسم البياني إلى بيانات جدولية
      const reportData = prepareReportData();

      // تصدير البيانات إلى Excel
      await exportService.exportToExcel(reportData, {
        fileName: `تقرير_الطلاب_${selectedReport}_${new Date().toISOString().split('T')[0]}`,
        sheetName: chartData.title,
      });

      // تصدير بيانات الرسم البياني
      if (chartData) {
        await exportService.exportChartDataToExcel(chartData.data, {
          fileName: `رسم_بياني_${selectedReport}_${new Date().toISOString().split('T')[0]}`,
          sheetName: chartData.title,
        });
      }

      showToast('تم تصدير التقرير بنجاح', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // تحضير بيانات التقرير للتصدير
  const prepareReportData = () => {
    if (!chartData) return [];

    const { labels, datasets } = chartData.data;
    const reportData = [];

    // إضافة عنوان التقرير كصف أول
    reportData.push({
      'عنوان التقرير': chartData.title,
      'إجمالي عدد الطلاب': students.length,
      'تاريخ التقرير': new Date().toLocaleDateString('ar-EG')
    });

    // إضافة صف فارغ للفصل بين العنوان والبيانات
    reportData.push({
      'عنوان التقرير': '',
      'إجمالي عدد الطلاب': '',
      'تاريخ التقرير': ''
    });

    // إنشاء بيانات التقرير بناءً على نوع التقرير
    switch (selectedReport) {
      case 'gender':
        // إضافة عناوين الأعمدة
        reportData.push({
          'الفئة': 'الجنس',
          'العدد': 'عدد الطلاب',
          'النسبة المئوية': 'النسبة المئوية'
        });

        // إضافة البيانات
        reportData.push({
          'الفئة': 'ذكور',
          'العدد': datasets[0].data[0],
          'النسبة المئوية': `${((datasets[0].data[0] / students.length) * 100).toFixed(2)}%`
        });
        reportData.push({
          'الفئة': 'إناث',
          'العدد': datasets[0].data[1],
          'النسبة المئوية': `${((datasets[0].data[1] / students.length) * 100).toFixed(2)}%`
        });

        // إضافة صف المجموع
        reportData.push({
          'الفئة': 'المجموع',
          'العدد': students.length,
          'النسبة المئوية': '100%'
        });
        break;

      case 'grade':
        // إضافة عناوين الأعمدة
        reportData.push({
          'المستوى الدراسي': 'المستوى الدراسي',
          'عدد الطلاب': 'عدد الطلاب',
          'النسبة المئوية': 'النسبة المئوية'
        });

        // إضافة البيانات
        labels.forEach((label, index) => {
          reportData.push({
            'المستوى الدراسي': label,
            'عدد الطلاب': datasets[0].data[index],
            'النسبة المئوية': `${((datasets[0].data[index] / students.length) * 100).toFixed(2)}%`
          });
        });

        // إضافة صف المجموع
        reportData.push({
          'المستوى الدراسي': 'المجموع',
          'عدد الطلاب': students.length,
          'النسبة المئوية': '100%'
        });
        break;

      case 'status':
        // إضافة عناوين الأعمدة
        reportData.push({
          'الحالة': 'حالة الطالب',
          'عدد الطلاب': 'عدد الطلاب',
          'النسبة المئوية': 'النسبة المئوية'
        });

        // إضافة البيانات
        labels.forEach((label, index) => {
          reportData.push({
            'الحالة': label,
            'عدد الطلاب': datasets[0].data[index],
            'النسبة المئوية': `${((datasets[0].data[index] / students.length) * 100).toFixed(2)}%`
          });
        });

        // إضافة صف المجموع
        reportData.push({
          'الحالة': 'المجموع',
          'عدد الطلاب': students.length,
          'النسبة المئوية': '100%'
        });
        break;

      default:
        break;
    }

    return reportData;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">تقارير الطلاب</h1>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={exportToPDF}
              isLoading={isExportingPDF}
              disabled={isExportingPDF || !chartData}
            >
              طباعة التقرير
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              isLoading={isExportingExcel}
              disabled={isExportingExcel || !chartData}
            >
              تصدير Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={`cursor-pointer transition-all ${selectedReport === 'gender' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => handleReportChange('gender')}>
            <CardContent className="p-4 text-center">
              <p className="font-medium">توزيع الطلاب حسب الجنس</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${selectedReport === 'grade' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => handleReportChange('grade')}>
            <CardContent className="p-4 text-center">
              <p className="font-medium">توزيع الطلاب حسب المستوى الدراسي</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${selectedReport === 'status' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => handleReportChange('status')}>
            <CardContent className="p-4 text-center">
              <p className="font-medium">توزيع الطلاب حسب الحالة</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${selectedReport === 'custom' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => handleReportChange('custom')}>
            <CardContent className="p-4 text-center">
              <p className="font-medium">تقرير مخصص</p>
            </CardContent>
          </Card>
        </div>

        {chartData && (
          <Card>
            <CardHeader>
              <CardTitle>{chartData.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-xl">
                {chartData.type === 'pie' ? (
                  <Pie data={chartData.data} />
                ) : (
                  <Bar data={chartData.data} options={chartData.options} />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedReport === 'custom' && (
          <Card>
            <CardHeader>
              <CardTitle>إنشاء تقرير مخصص</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                سيتم تنفيذ هذه الميزة قريباً
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>إحصائيات عامة</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
              >
                {showAdvancedStats ? 'عرض الإحصائيات البسيطة' : 'عرض الإحصائيات المتقدمة'}
              </Button>
            </CardHeader>
            <CardContent>
              {showAdvancedStats ? (
                <AdvancedStatistics />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلاب</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">الطلاب النشطين</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.status === 'active').length}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">الطلاب الذكور</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.gender === 'male').length}</p>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">الطالبات الإناث</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.gender === 'female').length}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
