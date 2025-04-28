'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import EditStudentClient from '@/components/students/EditStudentClient';
import { Spinner } from '@/components/ui/Spinner';

export default function EditStudentPage() {
  // استخدام useParams للحصول على المعرف بشكل آمن
  const params = useParams();
  const id = params?.id as string;

  // التحقق من وجود المعرف
  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <p className="text-red-500 mb-4">خطأ: لم يتم تحديد معرف الطالب</p>
          <Link href="/students" className="text-blue-500 hover:underline">
            العودة إلى قائمة الطلاب
          </Link>
        </div>
      </div>
    );
  }

  // استخدام Suspense لتحميل المكون بشكل آمن
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    }>
      <EditStudentClient id={id} />
    </Suspense>
  );
}
