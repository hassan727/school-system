'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import StudentFilters from '@/components/students/StudentFilters';
import StudentList from '@/components/students/StudentList';
import { Button } from '@/components/ui/Button';
import { Student, StudentSearchParams } from '@/types/student';
import studentService from '@/services/studentService';
import realtimeService from '@/services/realtimeService';
import sharedDataService, { useSharedDataStore } from '@/services/sharedDataService';
import { checkSupabaseConnection, createTablesIfNotExist } from '@/lib/supabase';
import { showToast } from '@/components/ui/ToastContainer';

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // استخراج معلمات البحث من URL
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '9');
  const name = searchParams.get('name') || undefined;
  const grade_level = searchParams.get('grade_level')
    ? Number(searchParams.get('grade_level'))
    : undefined;
  const stage_id = searchParams.get('stage_id') || undefined;
  const classroom_id = searchParams.get('classroom_id') || undefined;
  const status = searchParams.get('status') || undefined;
  const gender = searchParams.get('gender') || undefined;
  const religion = searchParams.get('religion') || undefined;
  const second_language = searchParams.get('second_language') || undefined;
  const enrollment_year = searchParams.get('enrollment_year')
    ? Number(searchParams.get('enrollment_year'))
    : undefined;

  // حالة الصفحة
  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<StudentSearchParams>({
    name,
    grade_level,
    stage_id,
    classroom_id,
    status,
    gender,
    religion,
    second_language,
    enrollment_year,
    page,
    limit,
  });

  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);

  // التحقق من اتصال Supabase وإنشاء الجداول إذا لزم الأمر
  useEffect(() => {
    const initializeDatabase = async () => {
      console.log('Initializing database connection...');

      // التحقق من الاتصال بـ Supabase
      const isConnected = await checkSupabaseConnection();

      if (!isConnected) {
        console.error('Cannot connect to Supabase');
        setConnectionError('لا يمكن الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت أو المحاولة مرة أخرى لاحقًا.');
        return;
      }

      console.log('Connected to Supabase successfully');

      // محاولة إنشاء الجداول إذا لم تكن موجودة
      try {
        const tablesCreated = await createTablesIfNotExist();
        console.log('Tables initialization result:', tablesCreated ? 'Success' : 'Failed');

        if (!tablesCreated) {
          setConnectionError('تم الاتصال بقاعدة البيانات ولكن لا يمكن إنشاء الجداول. يرجى التحقق من الصلاحيات.');
          return;
        }
      } catch (error) {
        console.error('Error initializing tables:', error);
        // نستمر حتى لو فشل إنشاء الجداول، لأنها قد تكون موجودة بالفعل
      }

      setConnectionError(null);
    };

    initializeDatabase();
  }, []);

  // تحميل بيانات الطلاب
  useEffect(() => {
    if (!connectionError) {
      loadStudents();
    }
  }, [currentFilters, connectionError]);

  // الاشتراك في التغييرات في الوقت الحقيقي
  useEffect(() => {
    if (!connectionError) {
      // الاشتراك في التغييرات في جدول الطلاب
      realtimeSubscriptionRef.current = realtimeService.subscribeToTable('students', (payload) => {
        console.log('Student data changed:', payload.eventType);

        // تحديث البيانات عند حدوث أي تغيير
        loadStudents();

        // عرض إشعار للمستخدم
        const eventMessages = {
          INSERT: 'تمت إضافة طالب جديد',
          UPDATE: 'تم تحديث بيانات طالب',
          DELETE: 'تم حذف طالب'
        };

        showToast(eventMessages[payload.eventType as keyof typeof eventMessages] || 'تم تحديث البيانات', 'info');
      });

      // إلغاء الاشتراك عند تفكيك المكون
      return () => {
        if (realtimeSubscriptionRef.current) {
          realtimeService.unsubscribe(realtimeSubscriptionRef.current);
          realtimeSubscriptionRef.current = null;
        }
      };
    }
  }, [connectionError]);

  // تحميل بيانات الطلاب من الخادم
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      console.log('Loading students with filters:', currentFilters);

      // استخدام setTimeout لتجنب مشكلة إغلاق قناة الرسائل
      const loadDataWithTimeout = async () => {
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const result = await studentService.getStudents(currentFilters);
              resolve(result);
            } catch (err) {
              console.error('Error in timeout wrapper:', err);
              resolve({ data: [], count: 0, error: err });
            }
          }, 100);
        });
      };

      const { data, count, error } = await loadDataWithTimeout() as any;

      if (error) {
        console.error('Error loading students:', error);
        // عرض رسالة خطأ للمستخدم
        setStudents([]);
        setTotalCount(0);
        return;
      }

      console.log('Students loaded successfully:', { count, dataLength: data?.length });

      // التأكد من أن البيانات ليست فارغة
      if (data && data.length > 0) {
        setStudents(data);
        setTotalCount(count || data.length);

        // تحديث البيانات المشتركة
        sharedDataService.updateStudents(data);
      } else {
        console.log('No students data returned, using empty array');
        setStudents([]);
        setTotalCount(0);

        // تحديث البيانات المشتركة بمصفوفة فارغة
        sharedDataService.updateStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      // عرض رسالة خطأ للمستخدم
      setStudents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق الفلاتر
  const handleFilter = (filters: StudentSearchParams) => {
    // تحديث عنوان URL
    const params = new URLSearchParams();

    if (filters.name) params.set('name', filters.name);
    if (filters.grade_level) params.set('grade_level', filters.grade_level.toString());
    if (filters.stage_id) params.set('stage_id', filters.stage_id);
    if (filters.classroom_id) params.set('classroom_id', filters.classroom_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.religion) params.set('religion', filters.religion);
    if (filters.second_language) params.set('second_language', filters.second_language);
    if (filters.enrollment_year) params.set('enrollment_year', filters.enrollment_year.toString());

    // إعادة تعيين الصفحة إلى 1 عند تغيير الفلاتر
    params.set('page', '1');
    params.set('limit', limit.toString());

    // تحديث عنوان URL
    router.push(`/students?${params.toString()}`);

    // تحديث الفلاتر الحالية
    setCurrentFilters({
      ...filters,
      page: 1,
      limit,
    });
  };

  // تغيير الصفحة
  const handlePageChange = (newPage: number) => {
    // تحديث عنوان URL
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());

    // تحديث عنوان URL
    router.push(`/students?${params.toString()}`);

    // تحديث الفلاتر الحالية
    setCurrentFilters({
      ...currentFilters,
      page: newPage,
    });
  };

  // حذف طالب
  const handleDeleteStudent = async (id: string) => {
    try {
      const { success, error } = await studentService.deleteStudent(id);

      if (success) {
        // تحديث البيانات المشتركة
        sharedDataService.removeStudent(id);

        // إعادة تحميل البيانات
        loadStudents();

        // عرض إشعار للمستخدم
        showToast('تم حذف الطالب بنجاح', 'success');
      } else {
        console.error('Error deleting student:', error);
        showToast('حدث خطأ أثناء حذف الطالب', 'error');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('حدث خطأ أثناء حذف الطالب', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="p-3">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة الطلاب</h1>
          <div className="flex space-x-2 space-x-reverse">
            <Link href="/students/reports">
              <Button variant="outline">
                التقارير
              </Button>
            </Link>
            <Link href="/students/import-export">
              <Button variant="outline">
                استيراد / تصدير
              </Button>
            </Link>
            <Link href="/students/search">
              <Button variant="outline">
                بحث متقدم
              </Button>
            </Link>
            <Link href="/students/add">
              <Button variant="primary">
                إضافة طالب جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* عرض رسالة خطأ الاتصال */}
        {connectionError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">خطأ في الاتصال</p>
            <p>{connectionError}</p>
            <button
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
              onClick={() => window.location.reload()}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* فلاتر البحث */}
        <StudentFilters
          onFilter={handleFilter}
          initialFilters={{
            name,
            grade_level,
            stage_id,
            classroom_id,
            status,
            gender,
            religion,
            second_language,
            enrollment_year,
          }}
        />

        {/* عرض رسالة في حالة عدم وجود بيانات */}
        {!isLoading && students.length === 0 && !connectionError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4">
            <p>لا توجد بيانات للطلاب. يرجى التحقق من الفلاتر أو إضافة طلاب جدد.</p>
          </div>
        )}

        {/* عرض نتائج البحث */}
        <div className="mt-4">
          {!isLoading && students.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              تم العثور على {totalCount} طالب
            </p>
          )}

          <StudentList
            students={students}
            isLoading={isLoading}
            totalCount={totalCount}
            currentPage={currentFilters.page || 1}
            pageSize={currentFilters.limit || 9}
            onPageChange={handlePageChange}
            onDeleteStudent={handleDeleteStudent}
          />
        </div>
      </div>
    </MainLayout>
  );
}
