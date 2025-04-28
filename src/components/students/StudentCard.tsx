'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Student, GRADE_LEVELS } from '@/types/student';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface StudentCardProps {
  student: Student;
  onDelete?: (id: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // الحصول على اسم المستوى الدراسي
  const gradeLevel = GRADE_LEVELS.find(grade => grade.id === student.grade_level);

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'graduated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'transferred':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  // تحويل الحالة إلى نص عربي
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'graduated':
        return 'متخرج';
      case 'transferred':
        return 'منقول';
      default:
        return status;
    }
  };

  // معالجة حذف الطالب
  const handleDelete = async () => {
    if (!onDelete) return;

    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      setIsDeleting(true);
      await onDelete(student.id);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-3">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {student.profile_image ? (
              <Image
                src={student.profile_image}
                alt={student.full_name || 'صورة الطالب'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {student.full_name || 'بدون اسم'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {gradeLevel?.arabic_name} {student.classroom_name && `- ${student.classroom_name}`}
            </p>
            <div className="mt-1">
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(student.status)}`}>
                {getStatusText(student.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">رقم الهاتف</p>
            <p>{student.phone || 'غير متوفر'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">تاريخ التسجيل</p>
            <p>{formatDate(student.enrollment_date)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">ولي الأمر</p>
            <p>{student.parent_name || 'غير متوفر'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">هاتف ولي الأمر</p>
            <p>{student.parent_phone || 'غير متوفر'}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex justify-between">
          <Link href={`/students/${student.id}`}>
            <Button variant="outline" size="sm">
              عرض التفاصيل
            </Button>
          </Link>
          <div className="flex space-x-2 space-x-reverse">
            <Link href={`/students/edit/${student.id}`}>
              <Button variant="secondary" size="sm">
                تعديل
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                حذف
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
