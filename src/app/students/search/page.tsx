'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import StudentFilters from '@/components/students/StudentFilters';
import { Button } from '@/components/ui/Button';
import { StudentSearchParams } from '@/types/student';

export default function StudentSearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<StudentSearchParams>({});

  // معالجة البحث
  const handleSearch = (searchFilters: StudentSearchParams) => {
    setFilters(searchFilters);
    
    // بناء معلمات البحث
    const params = new URLSearchParams();
    
    if (searchFilters.name) params.set('name', searchFilters.name);
    if (searchFilters.grade_level) params.set('grade_level', searchFilters.grade_level.toString());
    if (searchFilters.classroom_id) params.set('classroom_id', searchFilters.classroom_id);
    if (searchFilters.status) params.set('status', searchFilters.status);
    if (searchFilters.gender) params.set('gender', searchFilters.gender);
    if (searchFilters.enrollment_year) params.set('enrollment_year', searchFilters.enrollment_year.toString());
    
    // التوجيه إلى صفحة النتائج
    router.push(`/students?${params.toString()}`);
  };

  return (
    <MainLayout>
      <div className="p-3">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">بحث متقدم عن الطلاب</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            استخدم الفلاتر أدناه للبحث عن الطلاب
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
          <StudentFilters
            onFilter={handleSearch}
            initialFilters={filters}
          />
        </div>
      </div>
    </MainLayout>
  );
}
