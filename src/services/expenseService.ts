import { supabase } from '@/lib/supabase';

/**
 * خدمة إدارة المصروفات
 */
export const expenseService = {
  /**
   * الحصول على فئات المصروفات
   */
  getExpenseCategories() {
    return [
      { id: 'utilities', name: 'مرافق (كهرباء، مياه، إنترنت)' },
      { id: 'salaries', name: 'رواتب وأجور' },
      { id: 'maintenance', name: 'صيانة' },
      { id: 'supplies', name: 'مستلزمات مدرسية' },
      { id: 'educational', name: 'برامج تعليمية' },
      { id: 'rent', name: 'إيجار' },
      { id: 'transportation', name: 'نقل ومواصلات' },
      { id: 'marketing', name: 'تسويق وإعلان' },
      { id: 'insurance', name: 'تأمين' },
      { id: 'taxes', name: 'ضرائب ورسوم' },
      { id: 'other', name: 'أخرى' }
    ];
  },
  
  /**
   * الحصول على طرق الدفع
   */
  getPaymentMethods() {
    return [
      { id: 'cash', name: 'نقدًا' },
      { id: 'bank_transfer', name: 'تحويل بنكي' },
      { id: 'check', name: 'شيك' },
      { id: 'credit_card', name: 'بطاقة ائتمان' },
      { id: 'other', name: 'أخرى' }
    ];
  },
  
  /**
   * الحصول على المصروفات
   */
  async getExpenses(params: any = {}): Promise<{ data: any[] | null; count: number | null; error: any }> {
    try {
      const {
        category,
        start_date,
        end_date,
        page = 1,
        limit = 10
      } = params;
      
      // حساب الإزاحة للصفحة
      const offset = (page - 1) * limit;
      
      // بناء الاستعلام
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' });
      
      // إضافة الفلاتر
      if (category) {
        query = query.eq('category', category);
      }
      
      if (start_date) {
        query = query.gte('expense_date', start_date);
      }
      
      if (end_date) {
        query = query.lte('expense_date', end_date);
      }
      
      // إضافة الترتيب والحدود
      const { data, count, error } = await query
        .order('expense_date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      return { data, count, error: null };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return { data: null, count: null, error };
    }
  },
  
  /**
   * إنشاء مصروف جديد
   */
  async createExpense(expense: any): Promise<{ data: any | null; error: any }> {
    try {
      // إضافة تاريخ الإنشاء والتحديث
      const newExpense = {
        ...expense,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([newExpense])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { data: null, error };
    }
  },
  
  /**
   * تحديث مصروف
   */
  async updateExpense(id: string, updates: any): Promise<{ data: any | null; error: any }> {
    try {
      // تحديث تاريخ التحديث
      const updatedExpense = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .update(updatedExpense)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { data: null, error };
    }
  },
  
  /**
   * حذف مصروف
   */
  async deleteExpense(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error };
    }
  },
  
  /**
   * الحصول على إحصائيات المصروفات
   */
  async getExpenseStatistics(params: any = {}): Promise<{ data: any | null; error: any }> {
    try {
      const { start_date, end_date } = params;
      
      // بناء الاستعلام
      let query = supabase
        .from('expenses')
        .select('category, amount');
      
      // إضافة فلاتر التاريخ
      if (start_date) {
        query = query.gte('expense_date', start_date);
      }
      
      if (end_date) {
        query = query.lte('expense_date', end_date);
      }
      
      // تنفيذ الاستعلام
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // تجميع البيانات حسب الفئة
      const categoryTotals: Record<string, number> = {};
      let totalExpenses = 0;
      
      data.forEach(expense => {
        const category = expense.category;
        const amount = Number(expense.amount);
        
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        totalExpenses += amount;
      });
      
      // تحويل البيانات إلى مصفوفة
      const categoriesData = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }));
      
      // ترتيب البيانات تنازليًا حسب المبلغ
      categoriesData.sort((a, b) => b.amount - a.amount);
      
      // إعداد البيانات
      const statistics = {
        totalExpenses,
        categoriesCount: Object.keys(categoryTotals).length,
        categoriesData,
        expensesCount: data.length
      };
      
      return { data: statistics, error: null };
    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      return { data: null, error };
    }
  }
};

export default expenseService;
