import { supabase } from '@/lib/supabase';
import { Classroom } from '@/types/student';

/**
 * خدمة إدارة الفصول الدراسية
 */
export class ClassroomService {
  /**
   * الحصول على قائمة الفصول الدراسية
   * @param gradeLevel المستوى الدراسي (اختياري)
   * @param stageId معرف المرحلة الدراسية (اختياري)
   * @returns قائمة الفصول الدراسية
   */
  async getClassrooms(gradeLevel?: number, stageId?: string): Promise<{
    data: Classroom[];
    count: number;
    error: any;
  }> {
    try {
      console.log('getClassrooms called with gradeLevel:', gradeLevel, 'stageId:', stageId);

      // بناء الاستعلام
      let query = supabase
        .from('classrooms')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // إضافة فلتر المستوى الدراسي
      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      // إضافة فلتر المرحلة الدراسية (تم تعديله ليعمل مع المستويات الدراسية)
      if (stageId) {
        // تحديد نطاق المستويات الدراسية بناءً على المرحلة
        if (stageId === 'primary') {
          query = query.gte('grade_level', 1).lte('grade_level', 6);
        } else if (stageId === 'preparatory') {
          query = query.gte('grade_level', 7).lte('grade_level', 9);
        } else if (stageId === 'secondary') {
          query = query.gte('grade_level', 10).lte('grade_level', 12);
        }
      }

      // إضافة الترتيب
      query = query.order('name', { ascending: true });

      // تنفيذ الاستعلام
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching classrooms:', error);
        return { data: [], count: 0, error };
      }

      // تنسيق البيانات
      const formattedData = data as Classroom[];

      return {
        data: formattedData,
        count: count || 0,
        error: null,
      };
    } catch (error) {
      console.error('Error in getClassrooms:', error);
      return { data: [], count: 0, error };
    }
  }

  /**
   * الحصول على فصل دراسي بواسطة المعرف
   * @param id معرف الفصل الدراسي
   * @returns بيانات الفصل الدراسي
   */
  async getClassroomById(id: string): Promise<{
    data: Classroom | null;
    error: any;
  }> {
    try {
      // جلب بيانات الفصل الدراسي
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching classroom:', error);
        return { data: null, error };
      }

      // تنسيق البيانات
      const formattedData = data as Classroom;

      return {
        data: formattedData,
        error: null,
      };
    } catch (error) {
      console.error('Error in getClassroomById:', error);
      return { data: null, error };
    }
  }

  /**
   * إنشاء فصل دراسي جديد
   * @param classroomData بيانات الفصل الدراسي الجديد
   * @returns بيانات الفصل الدراسي المنشأ
   */
  async createClassroom(classroomData: Partial<Classroom>): Promise<{
    data: Classroom | null;
    error: any;
  }> {
    try {
      // إنشاء الفصل الدراسي
      const { data, error } = await supabase
        .from('classrooms')
        .insert(classroomData)
        .select()
        .single();

      if (error) {
        console.error('Error creating classroom:', error);
        return { data: null, error };
      }

      return {
        data: data as Classroom,
        error: null,
      };
    } catch (error) {
      console.error('Error in createClassroom:', error);
      return { data: null, error };
    }
  }

  /**
   * تحديث فصل دراسي
   * @param id معرف الفصل الدراسي
   * @param classroomData بيانات تحديث الفصل الدراسي
   * @returns بيانات الفصل الدراسي المحدث
   */
  async updateClassroom(id: string, classroomData: Partial<Classroom>): Promise<{
    data: Classroom | null;
    error: any;
  }> {
    try {
      // تحديث الفصل الدراسي
      const { data, error } = await supabase
        .from('classrooms')
        .update(classroomData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating classroom:', error);
        return { data: null, error };
      }

      return {
        data: data as Classroom,
        error: null,
      };
    } catch (error) {
      console.error('Error in updateClassroom:', error);
      return { data: null, error };
    }
  }

  /**
   * حذف فصل دراسي
   * @param id معرف الفصل الدراسي
   * @returns نتيجة الحذف
   */
  async deleteClassroom(id: string): Promise<{
    success: boolean;
    error: any;
  }> {
    try {
      // حذف الفصل الدراسي
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting classroom:', error);
        return { success: false, error };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('Error in deleteClassroom:', error);
      return { success: false, error };
    }
  }

  /**
   * الحصول على عدد الطلاب في فصل دراسي
   * @param classroomId معرف الفصل الدراسي
   * @returns عدد الطلاب
   */
  async getClassroomStudentsCount(classroomId: string): Promise<{
    count: number;
    error: any;
  }> {
    try {
      // جلب عدد الطلاب
      const { count, error } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('classroom_id', classroomId);

      if (error) {
        console.error('Error fetching classroom students count:', error);
        return { count: 0, error };
      }

      return {
        count: count || 0,
        error: null,
      };
    } catch (error) {
      console.error('Error in getClassroomStudentsCount:', error);
      return { count: 0, error };
    }
  }
}

// إنشاء نسخة من الخدمة للاستخدام في التطبيق
export const classroomService = new ClassroomService();
