'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StudentForm from '@/components/students/StudentForm';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Student, UpdateStudentInput } from '@/types/student';
import studentService from '@/services/studentService';

interface EditStudentPageProps {
  params: {
    id: string;
  };
}

export default function EditStudentPage({ params }: EditStudentPageProps) {
  const router = useRouter();
  // استخدام React.use() لفك تغليف params
  // Nota: En Next.js 15.x, params ya es un objeto, pero en versiones futuras será una Promise
  // Por ahora, podemos acceder directamente a params.id, pero estamos preparando el código para el futuro
  const id = params.id;

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحميل بيانات الطالب
  useEffect(() => {
    loadStudent();
  }, [id]);

  // تحميل بيانات الطالب من الخادم
  const loadStudent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await studentService.getStudentById(id);

      if (error) {
        console.error('Error loading student:', error);
        setError('حدث خطأ أثناء تحميل بيانات الطالب');
        return;
      }

      if (!data) {
        setError('لم يتم العثور على الطالب');
        return;
      }

      setStudent(data);
    } catch (error) {
      console.error('Error loading student:', error);
      setError('حدث خطأ أثناء تحميل بيانات الطالب');
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة تحديث بيانات الطالب
  const handleSubmit = async (formData: UpdateStudentInput) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateStudentInput = {
        ...formData,
        id,
      };

      const { error } = await studentService.updateStudent(updateData);

      if (error) {
        console.error('Error updating student:', error);
        alert('حدث خطأ أثناء تحديث بيانات الطالب');
        return;
      }

      // التوجيه إلى صفحة تفاصيل الطالب
      router.push(`/students/${id}`);
    } catch (error) {
      console.error('Error updating student:', error);
      alert('حدث خطأ أثناء تحديث بيانات الطالب');
    } finally {
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
              العودة إلى تفاصيل الطالب
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
