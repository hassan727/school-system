# التكامل والمزامنة التلقائية بين الأقسام

## آلية التكامل والمزامنة

### 1. تصميم قاعدة بيانات مركزية
- استخدام Supabase كقاعدة بيانات مركزية موحدة
- تصميم العلاقات بين الجداول بشكل يضمن تكامل البيانات
- استخدام المفاتيح الخارجية (Foreign Keys) للحفاظ على ترابط البيانات

### 2. استخدام Triggers وRealtime Subscriptions
- إعداد Triggers في Supabase للتحديث التلقائي للبيانات المترابطة
- تنفيذ Realtime Subscriptions لتحديث واجهة المستخدم فور تغير البيانات
- استخدام Functions لتنفيذ العمليات المعقدة عند تغيير البيانات

### 3. مركزية معالجة البيانات
- إنشاء طبقة خدمات (Services Layer) موحدة لمعالجة البيانات
- توحيد منطق العمل (Business Logic) في خدمات مشتركة
- استخدام Context API في React لمشاركة البيانات بين المكونات

### 4. تحديث البيانات في الوقت الفعلي
- تنفيذ نظام تحديث تلقائي للبيانات عبر WebSockets
- تحديث واجهة المستخدم فور حدوث تغييرات في البيانات
- تنفيذ آلية للتعامل مع الاتصال المتقطع بالإنترنت

## أمثلة على التكامل بين الوحدات

### 1. تكامل بيانات الطلاب والمالية
- عند إضافة طالب جديد، يتم إنشاء سجل مالي تلقائياً
- تحديث الحالة المالية للطالب فور تسجيل أي دفعة
- عرض تلقائي للمتأخرات المالية في لوحة تحكم الطالب

### 2. تكامل الحضور والغياب مع الإشعارات
- إرسال إشعار تلقائي لولي الأمر عند تسجيل غياب الطالب
- تحديث إحصائيات الحضور في لوحة تحكم المدرسة فور تسجيل الحضور
- ربط بيانات الحضور بالتقارير الأكاديمية

### 3. تكامل المعلمين والجدول الدراسي
- تحديث جدول المعلم تلقائياً عند تغيير الجدول الدراسي
- منع التعارضات في جداول المعلمين بشكل تلقائي
- تحديث حالة المعلم (متاح/مشغول) بناءً على الجدول

### 4. تكامل الاختبارات والدرجات مع التقارير
- تحديث بطاقة تقرير الطالب فور إدخال الدرجات
- حساب المعدلات والإحصائيات تلقائياً عند تغيير أي درجة
- إشعار أولياء الأمور تلقائياً عند نشر نتائج الاختبارات

### 5. تكامل المالية مع التقارير والإحصائيات
- تحديث التقارير المالية فور تسجيل أي عملية مالية
- حساب المؤشرات المالية تلقائياً (نسب التحصيل، المتأخرات)
- تحديث الرسوم البيانية في لوحة التحكم في الوقت الفعلي

## تنفيذ آلية التكامل والمزامنة

### 1. تنفيذ Triggers في Supabase
```sql
-- مثال: Trigger لإنشاء سجل مالي عند إضافة طالب جديد
CREATE OR REPLACE FUNCTION create_student_financial_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO student_financials (
        student_id,
        academic_year,
        fee_structure_id,
        total_fees,
        discount_amount,
        net_fees,
        paid_amount,
        remaining_amount,
        payment_status
    )
    SELECT
        NEW.id,
        (SELECT name FROM academic_years WHERE is_current = TRUE LIMIT 1),
        (SELECT id FROM fee_structures WHERE grade_id = NEW.grade_id AND is_active = TRUE LIMIT 1),
        (SELECT total_fees FROM fee_structures WHERE grade_id = NEW.grade_id AND is_active = TRUE LIMIT 1),
        0,
        (SELECT total_fees FROM fee_structures WHERE grade_id = NEW.grade_id AND is_active = TRUE LIMIT 1),
        0,
        (SELECT total_fees FROM fee_structures WHERE grade_id = NEW.grade_id AND is_active = TRUE LIMIT 1),
        'غير مدفوع';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_student_insert
AFTER INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION create_student_financial_record();
```

### 2. تنفيذ Realtime Subscriptions في React
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRealtimeData(table: string, conditions?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // جلب البيانات الأولية
    fetchData();

    // إعداد الاشتراك في التحديثات المباشرة
    const subscription = supabase
      .from(table)
      .on('*', (payload) => {
        if (payload.eventType === 'INSERT') {
          setData((prevData) => [...prevData, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setData((prevData) =>
            prevData.map((item) => (item.id === payload.new.id ? payload.new : item))
          );
        } else if (payload.eventType === 'DELETE') {
          setData((prevData) => prevData.filter((item) => item.id !== payload.old.id));
        }
      })
      .subscribe();

    // إلغاء الاشتراك عند إزالة المكون
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [table, JSON.stringify(conditions)]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase.from(table).select('*');

      if (conditions) {
        Object.entries(conditions).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setData(data || []);
    } catch (err) {
      setError(err);
      console.error(`Error fetching data from ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
}
```

### 3. تنفيذ طبقة الخدمات المشتركة
```typescript
// src/services/studentService.ts
import { supabase } from '../lib/supabaseClient';
import { notificationService } from './notificationService';
import { financialService } from './financialService';

export const studentService = {
  async addStudent(studentData: any) {
    try {
      // إضافة الطالب
      const { data: student, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (error) throw error;

      // إضافة بيانات ولي الأمر
      if (studentData.guardian) {
        await this.addGuardian({
          student_id: student.id,
          ...studentData.guardian
        });
      }

      return student;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  async addGuardian(guardianData: any) {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .insert(guardianData)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error adding guardian:', error);
      throw error;
    }
  },

  async updateStudentStatus(studentId: number, status: string[]) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({ status })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  },

  async getStudentWithRelatedData(studentId: number) {
    try {
      // جلب بيانات الطالب
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          guardians(*),
          student_financials(*),
          student_attendance(*)
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      return student;
    } catch (error) {
      console.error('Error fetching student with related data:', error);
      throw error;
    }
  }
};
```

### 4. تنفيذ Context API للمشاركة البيانات
```typescript
// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AppContextType {
  currentUser: any;
  currentAcademicYear: any;
  currentSemester: any;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [currentSemester, setCurrentSemester] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      setIsLoading(true);

      // جلب المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
          
        if (userError) throw userError;
        setCurrentUser(userData);
      }

      // جلب العام الدراسي الحالي
      const { data: academicYear, error: academicYearError } = await supabase
        .from('academic_years')
        .select('*')
        .eq('is_current', true)
        .single();
        
      if (academicYearError) throw academicYearError;
      setCurrentAcademicYear(academicYear);

      // جلب الفصل الدراسي الحالي
      const { data: semester, error: semesterError } = await supabase
        .from('semesters')
        .select('*')
        .eq('academic_year_id', academicYear.id)
        .eq('is_current', true)
        .single();
        
      if (semesterError && semesterError.code !== 'PGRST116') throw semesterError;
      setCurrentSemester(semester);
    } catch (error) {
      console.error('Error refreshing app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // الاشتراك في تغييرات المستخدم
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      await refreshData();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentAcademicYear,
        currentSemester,
        isLoading,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
```
