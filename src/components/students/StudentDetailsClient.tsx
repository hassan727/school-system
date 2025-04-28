'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import StudentDetails from '@/components/students/StudentDetails';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Student } from '@/types/student';
import studentService from '@/services/studentService';
import realtimeService from '@/services/realtimeService';
import sharedDataService, { useSharedDataStore } from '@/services/sharedDataService';
import { showToast } from '@/components/ui/ToastContainer';

interface StudentDetailsClientProps {
  id: string;
}

export default function StudentDetailsClient({ id }: StudentDetailsClientProps) {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // مرجع للتحديث الدوري والاشتراك في التغييرات في الوقت الحقيقي
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeSubscriptionRef = useRef<any>(null);

  // استخدام مخزن البيانات المشتركة
  const updateStudent = useSharedDataStore(state => state.updateStudent);

  // تحميل بيانات الطالب
  useEffect(() => {
    // التحقق من وجود المعرف قبل تحميل البيانات
    if (id) {
      loadStudent();

      // إعداد تحديث دوري كل 30 ثانية
      refreshIntervalRef.current = setInterval(() => {
        refreshStudentData();
      }, 30000);

      // الاشتراك في التغييرات في الوقت الحقيقي
      realtimeSubscriptionRef.current = realtimeService.subscribeToTable('students', (payload) => {
        // تحديث البيانات فقط إذا كان التغيير يتعلق بهذا الطالب
        if (payload.new && payload.new.id === id) {
          console.log('Realtime update for current student:', payload.eventType);
          refreshStudentData();
        }
      });

      // تنظيف الفاصل الزمني والاشتراك عند إلغاء تحميل المكون
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }

        if (realtimeSubscriptionRef.current) {
          realtimeService.unsubscribe(realtimeSubscriptionRef.current);
        }
      };
    } else {
      setError('معرف الطالب غير صالح');
      setIsLoading(false);
    }
  }, [id]);

  // تحديث بيانات الطالب بشكل هادئ (بدون مؤشر تحميل)
  const refreshStudentData = async () => {
    if (isRefreshing || !id) return; // تجنب التحديثات المتزامنة أو إذا كان المعرف غير موجود

    setIsRefreshing(true);

    try {
      // إضافة معالجة الأخطاء للاتصال بقاعدة البيانات
      let response;
      try {
        response = await studentService.getStudentById(id);
      } catch (fetchError) {
        console.error('Network error when refreshing student data:', fetchError);
        setIsRefreshing(false);
        return;
      }

      const { data, error } = response;

      if (error) {
        console.error('Error refreshing student data:', error);
        return;
      }

      if (!data) {
        console.error('Student not found during refresh');
        return;
      }

      // تحديث البيانات فقط إذا كانت مختلفة
      if (JSON.stringify(data) !== JSON.stringify(student)) {
        setStudent(data);
        setLastUpdated(new Date());

        // تحديث البيانات المشتركة
        updateStudent(data);

        showToast('تم تحديث بيانات الطالب', 'info');
      }
    } catch (error) {
      console.error('Error refreshing student data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // تحميل بيانات الطالب من الخادم
  const loadStudent = async () => {
    if (!id) {
      setError('معرف الطالب غير صالح');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // إضافة معالجة الأخطاء للاتصال بقاعدة البيانات
      let response;
      try {
        response = await studentService.getStudentById(id);
      } catch (fetchError) {
        console.error('Network error when loading student:', fetchError);
        setError('خطأ في الاتصال بقاعدة البيانات');
        showToast('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى', 'error');
        setIsLoading(false);
        return;
      }

      const { data, error } = response;

      if (error) {
        console.error('Error loading student:', error);
        setError('حدث خطأ أثناء تحميل بيانات الطالب');
        showToast('حدث خطأ أثناء تحميل بيانات الطالب', 'error');
        return;
      }

      if (!data) {
        setError('لم يتم العثور على الطالب');
        showToast('لم يتم العثور على الطالب', 'error');
        return;
      }

      setStudent(data);
      setLastUpdated(new Date());

      // تحديث البيانات المشتركة
      updateStudent(data);
    } catch (error) {
      console.error('Error loading student:', error);
      setError('حدث خطأ أثناء تحميل بيانات الطالب');
      showToast('حدث خطأ أثناء تحميل بيانات الطالب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // حذف الطالب
  const handleDeleteStudent = async (studentId: string) => {
    if (!studentId) {
      showToast('معرف الطالب غير صالح', 'error');
      return;
    }

    try {
      // إضافة معالجة الأخطاء للاتصال بقاعدة البيانات
      let response;
      try {
        response = await studentService.deleteStudent(studentId);
      } catch (fetchError) {
        console.error('Network error when deleting student:', fetchError);
        showToast('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى', 'error');
        return;
      }

      const { success, error } = response;

      if (success) {
        // تحديث البيانات المشتركة
        sharedDataService.removeStudent(studentId);

        showToast('تم حذف الطالب بنجاح', 'success');

        // تأخير التوجيه قليلاً للسماح للمستخدم برؤية رسالة النجاح
        setTimeout(() => {
          // التوجيه إلى صفحة قائمة الطلاب
          router.push('/students');
        }, 1500);
      } else {
        console.error('Error deleting student:', error);
        showToast('حدث خطأ أثناء حذف الطالب', 'error');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('حدث خطأ أثناء حذف الطالب', 'error');
    }
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

  if (error || !student) {
    return (
      <MainLayout>
        <div className="p-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{error || 'لم يتم العثور على الطالب'}</p>
            <Link href="/students">
              <Button variant="primary">
                العودة إلى قائمة الطلاب
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/students">
              <Button variant="outline" size="sm">
                العودة إلى القائمة
              </Button>
            </Link>
            <h1 className="text-2xl font-bold mr-4">تفاصيل الطالب</h1>
            {lastUpdated && (
              <span className="text-xs text-gray-500 mr-2">
                آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
              </span>
            )}
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStudentData}
              isLoading={isRefreshing}
              disabled={isRefreshing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث
            </Button>
            <Link href={`/students/${id}/edit`}>
              <Button variant="primary" size="sm">
                تعديل البيانات
              </Button>
            </Link>
          </div>
        </div>

        <StudentDetails
          student={student}
          onDelete={handleDeleteStudent}
        />
      </div>
    </MainLayout>
  );
}
