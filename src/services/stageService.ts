import { supabase } from '@/lib/supabase';
import { Stage, CreateStageInput, UpdateStageInput, StageSearchParams } from '@/types/stage';

/**
 * خدمة إدارة المراحل الدراسية
 */
export class StageService {
  /**
   * الحصول على قائمة المراحل الدراسية
   * @param params معايير البحث
   * @returns قائمة المراحل الدراسية
   */
  async getStages(params: StageSearchParams = {}): Promise<{
    data: Stage[];
    count: number;
    error: any;
  }> {
    try {
      console.log('getStages called with params:', params);
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      // التحقق من وجود جدول المراحل الدراسية
      try {
        const { data: tableExists } = await supabase
          .from('stages')
          .select('id')
          .limit(1);

        if (!tableExists || tableExists.length === 0) {
          console.error('Stages table does not exist or is empty');

          // إنشاء مراحل افتراضية
          const defaultStages = [
            { id: 'primary', name: 'المرحلة الابتدائية', grade_level_start: 1, grade_level_end: 6 },
            { id: 'preparatory', name: 'المرحلة الإعدادية', grade_level_start: 7, grade_level_end: 9 },
            { id: 'secondary', name: 'المرحلة الثانوية', grade_level_start: 10, grade_level_end: 12 }
          ];

          return {
            data: defaultStages as Stage[],
            count: defaultStages.length,
            error: null
          };
        }

        console.log('Stages table exists, proceeding with query');
      } catch (error) {
        console.error('Error checking stages table:', error);

        // إنشاء مراحل افتراضية في حالة الخطأ
        const defaultStages = [
          { id: 'primary', name: 'المرحلة الابتدائية', grade_level_start: 1, grade_level_end: 6 },
          { id: 'preparatory', name: 'المرحلة الإعدادية', grade_level_start: 7, grade_level_end: 9 },
          { id: 'secondary', name: 'المرحلة الثانوية', grade_level_start: 10, grade_level_end: 12 }
        ];

        return {
          data: defaultStages as Stage[],
          count: defaultStages.length,
          error: null
        };
      }

      // بناء الاستعلام
      let query = supabase
        .from('stages')
        .select('*', { count: 'exact' });

      // إضافة معايير البحث
      if (params.name) {
        query = query.ilike('name', `%${params.name}%`);
      }

      // إضافة الترتيب
      query = query.order('name', { ascending: true });

      // إضافة الصفحات
      const page = params.page || 1;
      const limit = params.limit || 1000;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      query = query.range(start, end);

      // تنفيذ الاستعلام
      console.log('Executing Supabase query with params:', params);
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching stages:', error);
        return { data: [], count: 0, error };
      }

      console.log('Query executed. Error:', error, 'count:', count);

      if (!data || data.length === 0) {
        console.log('No stages found');
        return { data: [], count: count || 0, error: null };
      }

      // عرض عينة من البيانات للتصحيح
      console.log('Sample data:', data[0]);

      return {
        data: data as Stage[],
        count: count || 0,
        error: null,
      };
    } catch (error) {
      console.error('Error in getStages:', error);
      return { data: [], count: 0, error };
    }
  }

  /**
   * الحصول على مرحلة دراسية بواسطة المعرف
   * @param id معرف المرحلة الدراسية
   * @returns بيانات المرحلة الدراسية
   */
  async getStageById(id: string): Promise<{
    data: Stage | null;
    error: any;
  }> {
    try {
      // جلب بيانات المرحلة الدراسية
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching stage:', error);
        return { data: null, error };
      }

      return {
        data: data as Stage,
        error: null,
      };
    } catch (error) {
      console.error('Error in getStageById:', error);
      return { data: null, error };
    }
  }

  /**
   * إنشاء مرحلة دراسية جديدة
   * @param stageData بيانات المرحلة الدراسية الجديدة
   * @returns بيانات المرحلة الدراسية المنشأة
   */
  async createStage(stageData: CreateStageInput): Promise<{
    data: Stage | null;
    error: any;
  }> {
    try {
      // إنشاء المرحلة الدراسية
      const { data, error } = await supabase
        .from('stages')
        .insert(stageData)
        .select()
        .single();

      if (error) {
        console.error('Error creating stage:', error);
        return { data: null, error };
      }

      return {
        data: data as Stage,
        error: null,
      };
    } catch (error) {
      console.error('Error in createStage:', error);
      return { data: null, error };
    }
  }

  /**
   * تحديث مرحلة دراسية
   * @param stageData بيانات تحديث المرحلة الدراسية
   * @returns بيانات المرحلة الدراسية المحدثة
   */
  async updateStage(stageData: UpdateStageInput): Promise<{
    data: Stage | null;
    error: any;
  }> {
    try {
      // تحديث المرحلة الدراسية
      const { data, error } = await supabase
        .from('stages')
        .update(stageData)
        .eq('id', stageData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating stage:', error);
        return { data: null, error };
      }

      return {
        data: data as Stage,
        error: null,
      };
    } catch (error) {
      console.error('Error in updateStage:', error);
      return { data: null, error };
    }
  }

  /**
   * حذف مرحلة دراسية
   * @param id معرف المرحلة الدراسية
   * @returns نتيجة الحذف
   */
  async deleteStage(id: string): Promise<{
    success: boolean;
    error: any;
  }> {
    try {
      // حذف المرحلة الدراسية
      const { error } = await supabase
        .from('stages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting stage:', error);
        return { success: false, error };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('Error in deleteStage:', error);
      return { success: false, error };
    }
  }
}

// إنشاء نسخة من الخدمة للاستخدام في التطبيق
export const stageService = new StageService();
