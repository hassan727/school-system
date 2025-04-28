import { supabase } from '@/lib/supabase';
import { realtimeService } from './realtimeService';

/**
 * خدمة إدارة المالية
 */
export const financialService = {
  /**
   * الحصول على هياكل الرسوم الدراسية
   */
  async getFeeStructures(params: any = {}): Promise<{ data: any[] | null; error: any }> {
    try {
      const { grade_level, academic_year } = params;

      let query = supabase
        .from('fee_structures')
        .select('*');

      if (grade_level) {
        query = query.eq('grade_level', grade_level);
      }

      if (academic_year) {
        query = query.eq('academic_year', academic_year);
      }

      const { data, error } = await query.order('grade_level', { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      return { data: null, error };
    }
  },

  /**
   * إنشاء هيكل رسوم دراسية جديد
   */
  async createFeeStructure(feeStructure: any): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('fee_structures')
        .insert([feeStructure])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating fee structure:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث هيكل رسوم دراسية
   */
  async updateFeeStructure(id: string, updates: any): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('fee_structures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating fee structure:', error);
      return { data: null, error };
    }
  },

  /**
   * حذف هيكل رسوم دراسية
   */
  async deleteFeeStructure(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      return { success: false, error };
    }
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
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
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
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
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
   * إنشاء سند قبض أو صرف
   */
  async createReceipt(receipt: any): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .insert([receipt])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating receipt:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على سندات القبض والصرف
   */
  async getReceipts(params: any = {}): Promise<{ data: any[] | null; count: number | null; error: any }> {
    try {
      const {
        receipt_type,
        entity_type,
        entity_id,
        start_date,
        end_date,
        page = 1,
        limit = 10
      } = params;

      // حساب الإزاحة للصفحة
      const offset = (page - 1) * limit;

      // بناء الاستعلام
      let query = supabase
        .from('receipts')
        .select('*', { count: 'exact' });

      // إضافة الفلاتر
      if (receipt_type) {
        query = query.eq('receipt_type', receipt_type);
      }

      if (entity_type) {
        query = query.eq('entity_type', entity_type);
      }

      if (entity_id) {
        query = query.eq('entity_id', entity_id);
      }

      if (start_date) {
        query = query.gte('receipt_date', start_date);
      }

      if (end_date) {
        query = query.lte('receipt_date', end_date);
      }

      // إضافة الترتيب والحدود
      const { data, count, error } = await query
        .order('receipt_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return { data, count, error: null };
    } catch (error) {
      console.error('Error fetching receipts:', error);
      return { data: null, count: null, error };
    }
  },

  /**
   * الحصول على ملخص مالي
   */
  async getFinancialSummary(params: any = {}): Promise<{ data: any | null; error: any }> {
    try {
      const { start_date, end_date } = params;

      // استعلام إجمالي الرسوم
      const feesQuery = supabase
        .from('students')
        .select('fees_amount, discount_amount');

      // استعلام إجمالي المدفوعات
      const paymentsQuery = supabase
        .from('payment_records')
        .select('amount');

      // استعلام إجمالي المصروفات
      const expensesQuery = supabase
        .from('expenses')
        .select('amount');

      // إضافة فلاتر التاريخ إذا كانت موجودة
      if (start_date) {
        paymentsQuery.gte('payment_date', start_date);
        expensesQuery.gte('expense_date', start_date);
      }

      if (end_date) {
        paymentsQuery.lte('payment_date', end_date);
        expensesQuery.lte('expense_date', end_date);
      }

      // تنفيذ الاستعلامات
      const [feesResult, paymentsResult, expensesResult] = await Promise.all([
        feesQuery,
        paymentsQuery,
        expensesQuery
      ]);

      // التحقق من الأخطاء
      if (feesResult.error || paymentsResult.error || expensesResult.error) {
        throw feesResult.error || paymentsResult.error || expensesResult.error;
      }

      // حساب الإجماليات
      let totalFees = 0;
      let totalDiscounts = 0;
      let totalPayments = 0;
      let totalExpenses = 0;

      // حساب إجمالي الرسوم والخصومات
      feesResult.data?.forEach(student => {
        totalFees += Number(student.fees_amount || 0);
        totalDiscounts += Number(student.discount_amount || 0);
      });

      // حساب إجمالي المدفوعات
      paymentsResult.data?.forEach(payment => {
        totalPayments += Number(payment.amount || 0);
      });

      // حساب إجمالي المصروفات
      expensesResult.data?.forEach(expense => {
        totalExpenses += Number(expense.amount || 0);
      });

      // حساب صافي الإيرادات
      const netRevenue = totalPayments - totalExpenses;

      // حساب المبالغ المستحقة
      const totalDue = totalFees - totalDiscounts - totalPayments;

      // إعداد البيانات
      const summary = {
        totalFees,
        totalDiscounts,
        totalPayments,
        totalExpenses,
        netRevenue,
        totalDue,
        studentCount: feesResult.data?.length || 0,
        paymentCount: paymentsResult.data?.length || 0,
        expenseCount: expensesResult.data?.length || 0
      };

      return { data: summary, error: null };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على بيانات الرسوم البيانية المالية
   */
  async getFinancialChartData(params: any = {}): Promise<{ data: any | null; error: any }> {
    try {
      const { period = 'monthly', year = new Date().getFullYear() } = params;

      // تحديد تنسيق التاريخ حسب الفترة
      let dateFormat = '';
      let groupBy = '';

      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          groupBy = 'day';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          groupBy = 'week';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          groupBy = 'month';
          break;
        case 'quarterly':
          dateFormat = 'YYYY-"Q"Q';
          groupBy = 'quarter';
          break;
        case 'yearly':
          dateFormat = 'YYYY';
          groupBy = 'year';
          break;
        default:
          dateFormat = 'YYYY-MM';
          groupBy = 'month';
      }

      // الحصول على بيانات المدفوعات
      const startDate = new Date(year, 0, 1); // 1 يناير للسنة المحددة
      const endDate = new Date(year, 11, 31); // 31 ديسمبر للسنة المحددة

      // تنفيذ الاستعلامات
      const [paymentsResult, expensesResult] = await Promise.all([
        // استعلام المدفوعات
        supabase
          .from('payment_records')
          .select('payment_date, amount')
          .gte('payment_date', startDate.toISOString())
          .lte('payment_date', endDate.toISOString()),

        // استعلام المصروفات
        supabase
          .from('expenses')
          .select('expense_date, amount')
          .gte('expense_date', startDate.toISOString())
          .lte('expense_date', endDate.toISOString())
      ]);

      // التحقق من الأخطاء
      if (paymentsResult.error || expensesResult.error) {
        throw paymentsResult.error || expensesResult.error;
      }

      // تحويل البيانات إلى تنسيق مناسب للرسوم البيانية
      const periods = new Set<string>();
      const paymentsMap = new Map<string, number>();
      const expensesMap = new Map<string, number>();

      // تجميع بيانات المدفوعات حسب الفترة
      paymentsResult.data?.forEach(payment => {
        const date = new Date(payment.payment_date);
        let periodKey = '';

        // تنسيق التاريخ حسب الفترة المحددة
        switch (period) {
          case 'daily':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'weekly':
            // حساب رقم الأسبوع في السنة
            const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
            periodKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
            break;
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          case 'yearly':
            periodKey = `${date.getFullYear()}`;
            break;
          default:
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        periods.add(periodKey);
        paymentsMap.set(periodKey, (paymentsMap.get(periodKey) || 0) + Number(payment.amount || 0));
      });

      // تجميع بيانات المصروفات حسب الفترة
      expensesResult.data?.forEach(expense => {
        const date = new Date(expense.expense_date);
        let periodKey = '';

        // تنسيق التاريخ حسب الفترة المحددة
        switch (period) {
          case 'daily':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'weekly':
            // حساب رقم الأسبوع في السنة
            const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
            periodKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
            break;
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          case 'yearly':
            periodKey = `${date.getFullYear()}`;
            break;
          default:
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        periods.add(periodKey);
        expensesMap.set(periodKey, (expensesMap.get(periodKey) || 0) + Number(expense.amount || 0));
      });

      // ترتيب الفترات
      const sortedPeriods = Array.from(periods).sort();

      // إعداد البيانات
      const chartData = {
        labels: sortedPeriods,
        datasets: [
          {
            label: 'المدفوعات',
            data: sortedPeriods.map(period => paymentsMap.get(period) || 0)
          },
          {
            label: 'المصروفات',
            data: sortedPeriods.map(period => expensesMap.get(period) || 0)
          }
        ]
      };

      return { data: chartData, error: null };
    } catch (error) {
      console.error('Error fetching financial chart data:', error);
      return { data: null, error };
    }
  },

  /**
   * الاشتراك في التغييرات في الوقت الحقيقي
   */
  subscribeToFinancialChanges(callback: (payload: any) => void) {
    // الاشتراك في التغييرات في جدول المدفوعات
    const paymentsSubscription = realtimeService.subscribeToTable(
      { table: 'payments' },
      callback
    );

    // الاشتراك في التغييرات في جدول سجلات المدفوعات
    const paymentRecordsSubscription = realtimeService.subscribeToTable(
      { table: 'payment_records' },
      callback
    );

    // الاشتراك في التغييرات في جدول المصروفات
    const expensesSubscription = realtimeService.subscribeToTable(
      { table: 'expenses' },
      callback
    );

    // الاشتراك في التغييرات في جدول السندات
    const receiptsSubscription = realtimeService.subscribeToTable(
      { table: 'receipts' },
      callback
    );

    // الاشتراك في التغييرات في جدول الطلاب
    const studentsSubscription = realtimeService.subscribeToTable(
      { table: 'students' },
      callback
    );

    // إرجاع كائنات الاشتراك للتمكن من إلغاء الاشتراك لاحقًا
    return {
      paymentsSubscription,
      paymentRecordsSubscription,
      expensesSubscription,
      receiptsSubscription,
      studentsSubscription,
      unsubscribeAll: () => {
        realtimeService.unsubscribe(paymentsSubscription);
        realtimeService.unsubscribe(paymentRecordsSubscription);
        realtimeService.unsubscribe(expensesSubscription);
        realtimeService.unsubscribe(receiptsSubscription);
        realtimeService.unsubscribe(studentsSubscription);
      }
    };
  }
};

export default financialService;
