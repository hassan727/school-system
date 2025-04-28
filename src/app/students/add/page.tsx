'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import StudentForm from '@/components/students/StudentForm';
import { CreateStudentInput } from '@/types/student';
import studentService from '@/services/studentService';
import sharedDataService from '@/services/sharedDataService';
import { showToast } from '@/components/ui/ToastContainer';

export default function AddStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // معالجة إضافة طالب جديد
  const handleSubmit = async (data: CreateStudentInput) => {
    setIsSubmitting(true);
    try {
      console.log('Creating student with data:', data);

      // التحقق من وجود الفصل الدراسي أو المرحلة
      if (!data.classroom_id && !data.stage_id && !data.grade_level) {
        showToast('يجب تحديد الفصل الدراسي أو المرحلة الدراسية أو المستوى الدراسي', 'error');
        setIsSubmitting(false);
        return;
      }

      // التحقق من وجود اللغة الثانية
      if (data.second_language && data.second_language !== 'french' && data.second_language !== 'german') {
        showToast('اللغة الثانية يجب أن تكون الفرنسية أو الألمانية فقط', 'error');
        setIsSubmitting(false);
        return;
      }

      const { data: newStudent, error } = await studentService.createStudent(data);

      if (error) {
        console.error('Error creating student:', error);
        showToast('حدث خطأ أثناء إضافة الطالب: ' + (error.message || 'خطأ غير معروف'), 'error');
        return;
      }

      // تحديث البيانات المشتركة إذا كان الطالب موجودًا
      if (newStudent) {
        sharedDataService.updateStudent(newStudent);
      }

      // عرض رسالة نجاح
      showToast('تم إضافة الطالب بنجاح', 'success');

      // التوجيه إلى صفحة تفاصيل الطالب بعد تأخير قصير
      setTimeout(() => {
        router.push(`/students/${newStudent?.id}`);
      }, 1000);
    } catch (error) {
      console.error('Error creating student:', error);
      showToast('حدث خطأ أثناء إضافة الطالب', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-3">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">إضافة طالب جديد</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            أدخل بيانات الطالب الجديد
          </p>
        </div>

        <StudentForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </MainLayout>
  );
}
