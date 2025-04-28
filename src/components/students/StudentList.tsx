'use client';

import { useState } from 'react';
import { Student } from '@/types/student';
import StudentCard from './StudentCard';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDeleteStudent?: (id: string) => Promise<void>;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onDeleteStudent,
}) => {
  // حساب عدد الصفحات
  const totalPages = Math.ceil(totalCount / pageSize);

  // إنشاء مصفوفة أرقام الصفحات
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // إذا كان عدد الصفحات أقل من أو يساوي الحد الأقصى، عرض جميع الصفحات
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // دائمًا عرض الصفحة الأولى
      pages.push(1);
      
      // حساب نطاق الصفحات حول الصفحة الحالية
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // ضبط النطاق إذا كان الصفحة الحالية قريبة من البداية أو النهاية
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // إضافة علامة ... إذا كانت الصفحة الأولى ليست متجاورة مع startPage
      if (startPage > 2) {
        pages.push('...');
      }
      
      // إضافة الصفحات في النطاق
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // إضافة علامة ... إذا كانت الصفحة الأخيرة ليست متجاورة مع endPage
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // دائمًا عرض الصفحة الأخيرة
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // معالجة تغيير الصفحة
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">لا يوجد طلاب متطابقين مع معايير البحث</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          حاول تغيير معايير البحث أو إضافة طلاب جدد
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onDelete={onDeleteStudent}
          />
        ))}
      </div>

      {/* ترقيم الصفحات */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-1 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              السابق
            </Button>

            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="px-2">
                  {page}
                </span>
              )
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
