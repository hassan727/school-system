'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import StudentForm from '@/components/students/StudentForm';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Student, UpdateStudentInput } from '@/types/student';
import studentService from '@/services/studentService';
import realtimeService from '@/services/realtimeService';
import sharedDataService, { useSharedDataStore } from '@/services/sharedDataService';
import { showToast } from '@/components/ui/ToastContainer';

interface EditStudentClientProps {
  id: string;
}

export default function EditStudentClient({ id }: EditStudentClientProps) {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // مرجع للاشتراك في التغييرات في الوقت الحقيقي
  const realtimeSubscriptionRef = useRef<any>(null);

  // استخدام مخزن البيانات المشتركة
  const updateStudent = useSharedDataStore(state => state.updateStudent);

  // تحميل بيانات الطالب
  useEffect(() => {
    // التحقق من وجود المعرف قبل تحميل البيانات
    if (id) {
      loadStudent();

      // الاشتراك في التغييرات في الوقت الحقيقي
      realtimeSubscriptionRef.current = realtimeService.subscribeToTable('students', (payload) => {
        // تحديث البيانات فقط إذا كان التغيير يتعلق بهذا الطالب
        if (payload.new && payload.new.id === id) {
          console.log('Realtime update for current student:', payload.eventType);
          loadStudent();
        }
      });

      // تنظيف الاشتراك عند إلغاء تحميل المكون
      return () => {
        if (realtimeSubscriptionRef.current) {
          realtimeService.unsubscribe(realtimeSubscriptionRef.current);
        }
      };
    } else {
      setError('معرف الطالب غير صالح');
      setIsLoading(false);
    }
  }, [id]);

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

  // معالجة تحديث بيانات الطالب
  const handleSubmit = async (formData: UpdateStudentInput) => {
    // التحقق من وجود المعرف
    if (!id) {
      showToast('معرف الطالب غير صالح', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting form data for update:', formData);

      const updateData: UpdateStudentInput = {
        ...formData,
        id,
      };

      // إضافة معالجة الأخطاء للاتصال بقاعدة البيانات
      let response;
      try {
        response = await studentService.updateStudent(updateData);
      } catch (fetchError) {
        console.error('Network error when updating student:', fetchError);
        showToast('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى', 'error');
        setIsSubmitting(false);
        return;
      }

      const { data, error } = response;

      if (error) {
        console.error('Error updating student:', error);
        showToast(`حدث خطأ أثناء تحديث بيانات الطالب: ${error.message || 'خطأ غير معروف'}`, 'error');
        setIsSubmitting(false);
        return;
      }

      console.log('Student updated successfully:', data);

      // تحديث بيانات الطالب في الحالة المحلية
      if (data) {
        setStudent(data);

        // تحديث البيانات المشتركة
        sharedDataService.updateStudent(data);

        // عرض رسالة نجاح
        showToast('تم تحديث بيانات الطالب بنجاح', 'success');

        // تأخير التوجيه قليلاً للسماح للمستخدم برؤية رسالة النجاح
        setTimeout(() => {
          // التوجيه إلى صفحة تفاصيل الطالب
          router.push(`/students/${id}`);
        }, 1500);
      } else {
        // عرض رسالة نجاح حتى لو لم تكن هناك بيانات
        showToast('تم تحديث بيانات الطالب بنجاح', 'success');

        // تأخير التوجيه قليلاً للسماح للمستخدم برؤية رسالة النجاح
        setTimeout(() => {
          // التوجيه إلى صفحة تفاصيل الطالب
          router.push(`/students/${id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      showToast('حدث خطأ أثناء تحديث بيانات الطالب', 'error');
      setIsSubmitting(false);
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
        <div className="flex items-center mb-6">
          <Link href={`/students/${id}`}>
            <Button variant="outline" size="sm">
              العودة إلى التفاصيل
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mr-4">تعديل بيانات الطالب</h1>
        </div>

        <StudentForm
          student={student}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </MainLayout>
  );
}
