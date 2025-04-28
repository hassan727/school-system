'use client';

import { useState, useEffect } from 'react';
import { StudentSearchParams, GRADE_LEVELS } from '@/types/student';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { stageService } from '@/services/stageService';
import { classroomService } from '@/services/classroomService';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/ToastContainer';

interface StudentFiltersProps {
  onFilter: (filters: StudentSearchParams) => void;
  initialFilters?: StudentSearchParams;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({ onFilter, initialFilters = {} }) => {
  const [filters, setFilters] = useState<StudentSearchParams>(initialFilters);
  const [stages, setStages] = useState<{id: string; name: string}[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  // تحميل المراحل الدراسية عند تحميل المكون
  useEffect(() => {
    loadStages();
    setupRealtimeSubscription();

    // تنظيف الاشتراك عند إلغاء تحميل المكون
    return () => {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
      }
    };
  }, []);

  // تحميل الفصول الدراسية عند تغيير المرحلة الدراسية
  useEffect(() => {
    if (filters.stage_id) {
      loadClassroomsByStage(filters.stage_id);
    } else if (filters.grade_level) {
      loadClassroomsByGradeLevel(filters.grade_level);
    } else {
      setClassrooms([]);
    }
  }, [filters.stage_id, filters.grade_level]);

  // إعداد اشتراك Realtime لجداول الطلاب والفصول والمراحل
  const setupRealtimeSubscription = async () => {
    try {
      // إنشاء قناة للاشتراك في تغييرات الجداول
      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // الاشتراك في جميع الأحداث (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'students',
          },
          () => {
            // تحديث البيانات عند حدوث تغيير
            applyFilters();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'classrooms',
          },
          () => {
            if (filters.stage_id) {
              loadClassroomsByStage(filters.stage_id);
            } else if (filters.grade_level) {
              loadClassroomsByGradeLevel(filters.grade_level);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stages',
          },
          () => {
            loadStages();
          }
        )
        .subscribe();

      setRealtimeSubscription(channel);
      console.log('Realtime subscription setup successfully');
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  // تحميل المراحل الدراسية
  const loadStages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await stageService.getStages();
      if (error) {
        console.error('Error loading stages:', error);
        // إذا كان هناك خطأ في تحميل المراحل، نستخدم المستويات الدراسية مباشرة
        const primaryStage = { id: 'primary', name: 'المرحلة الابتدائية' };
        const preparatoryStage = { id: 'preparatory', name: 'المرحلة الإعدادية' };
        const secondaryStage = { id: 'secondary', name: 'المرحلة الثانوية' };
        setStages([primaryStage, preparatoryStage, secondaryStage]);
        return;
      }
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      // في حالة الخطأ، نستخدم المراحل الافتراضية
      const primaryStage = { id: 'primary', name: 'المرحلة الابتدائية' };
      const preparatoryStage = { id: 'preparatory', name: 'المرحلة الإعدادية' };
      const secondaryStage = { id: 'secondary', name: 'المرحلة الثانوية' };
      setStages([primaryStage, preparatoryStage, secondaryStage]);
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل الفصول الدراسية حسب المرحلة
  const loadClassroomsByStage = async (stageId: string) => {
    setIsLoading(true);
    try {
      // تحديد نطاق المستويات الدراسية بناءً على المرحلة
      let gradeLevelStart = 1;
      let gradeLevelEnd = 12;

      if (stageId === 'primary') {
        gradeLevelStart = 1;
        gradeLevelEnd = 6;
      } else if (stageId === 'preparatory') {
        gradeLevelStart = 7;
        gradeLevelEnd = 9;
      } else if (stageId === 'secondary') {
        gradeLevelStart = 10;
        gradeLevelEnd = 12;
      }

      // جلب الفصول الدراسية للمستويات المحددة
      const promises = [];
      for (let i = gradeLevelStart; i <= gradeLevelEnd; i++) {
        promises.push(classroomService.getClassrooms(i));
      }

      const results = await Promise.all(promises);
      const allClassrooms = results.flatMap(result => result.data || []);

      setClassrooms(allClassrooms);
    } catch (error) {
      console.error('Error loading classrooms by stage:', error);
      showToast('حدث خطأ أثناء تحميل الفصول الدراسية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل الفصول الدراسية حسب المستوى الدراسي
  const loadClassroomsByGradeLevel = async (gradeLevel: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await classroomService.getClassrooms(gradeLevel);
      if (error) {
        console.error('Error loading classrooms by grade level:', error);
        showToast('حدث خطأ أثناء تحميل الفصول الدراسية', 'error');
        return;
      }
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error loading classrooms by grade level:', error);
      showToast('حدث خطأ أثناء تحميل الفصول الدراسية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث الفلاتر
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // تحويل القيم الرقمية
    if (name === 'grade_level' || name === 'enrollment_year') {
      setFilters(prev => ({
        ...prev,
        [name]: value ? Number(value) : undefined,
        // إعادة تعيين الفصل عند تغيير المستوى الدراسي
        ...(name === 'grade_level' ? { classroom_id: undefined } : {})
      }));
    } else if (name === 'stage_id') {
      setFilters(prev => ({
        ...prev,
        [name]: value || undefined,
        // إعادة تعيين الفصل عند تغيير المرحلة
        classroom_id: undefined
      }));
    } else if (name === 'second_language') {
      // التأكد من أن اللغة الثانية هي فقط فرنسي أو ألماني
      if (value === 'french' || value === 'german' || value === '') {
        setFilters(prev => ({
          ...prev,
          second_language: value ? (value as 'french' | 'german') : undefined
        }));
      }
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value || undefined
      }));
    }
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    // تطبيق الفلاتر مباشرة بغض النظر عن اختيار المرحلة أو الفصل
    console.log('Applying filters:', filters);
    onFilter(filters);
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setFilters({});
    setClassrooms([]);
    onFilter({});
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">فلترة الطلاب</h2>
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'تصغير' : 'توسيع'}
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isExpanded ? '' : 'max-h-16 overflow-hidden'}`}>
        {/* البحث بالاسم */}
        <Input
          label="اسم الطالب"
          name="name"
          value={filters.name || ''}
          onChange={handleChange}
          placeholder="بحث بالاسم الرباعي"
        />

        {/* البحث بالرقم القومي */}
        <Input
          label="الرقم القومي"
          name="national_id"
          value={filters.national_id || ''}
          onChange={handleChange}
          placeholder="أدخل الرقم القومي"
        />

        {/* المرحلة الدراسية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            المرحلة الدراسية
          </label>
          <select
            name="stage_id"
            value={filters.stage_id || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            disabled={isLoading}
          >
            <option value="">جميع المراحل</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        {/* المستوى الدراسي */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            المستوى الدراسي
          </label>
          <select
            name="grade_level"
            value={filters.grade_level || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">جميع المستويات</option>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.arabic_name}
              </option>
            ))}
          </select>
        </div>

        {/* الفصل الدراسي */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الفصل الدراسي
          </label>
          <select
            name="classroom_id"
            value={filters.classroom_id || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
            disabled={!filters.grade_level && !filters.stage_id}
          >
            <option value="">جميع الفصول</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
          {isLoading && <div className="text-xs text-gray-500 mt-1">جاري تحميل الفصول...</div>}
        </div>

        {/* اللغة الثانية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            اللغة الثانية
          </label>
          <select
            name="second_language"
            value={filters.second_language || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">الكل</option>
            <option value="french">الفرنسية</option>
            <option value="german">الألمانية</option>
          </select>
        </div>

        {/* الحالة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الحالة
          </label>
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="graduated">متخرج</option>
            <option value="transferred">منقول</option>
            <option value="excellent">متفوق</option>
            <option value="absent">غائب</option>
          </select>
        </div>

        {/* الجنس */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الجنس
          </label>
          <select
            name="gender"
            value={filters.gender || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">الكل</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        {/* الديانة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الديانة
          </label>
          <select
            name="religion"
            value={filters.religion || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">الكل</option>
            <option value="islam">الإسلام</option>
            <option value="christianity">المسيحية</option>
          </select>
        </div>

        {/* سنة التسجيل */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            سنة التسجيل
          </label>
          <select
            name="enrollment_year"
            value={filters.enrollment_year || ''}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="">جميع السنوات</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2 space-x-reverse">
        <Button variant="outline" onClick={resetFilters} disabled={isLoading}>
          إعادة تعيين
        </Button>
        <Button variant="primary" onClick={applyFilters} disabled={isLoading}>
          تطبيق الفلتر
        </Button>
      </div>
    </div>
  );
};

export default StudentFilters;
