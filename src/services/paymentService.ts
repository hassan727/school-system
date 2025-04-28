import { supabase } from '@/lib/supabase';
import {
  PaymentRecord,
  CreatePaymentRecordInput,
  UpdatePaymentRecordInput,
  PaymentRecordSearchParams
} from '@/types/payment';

/**
 * خدمة إدارة المدفوعات
 */
export const paymentService = {
  /**
   * الحصول على قائمة المدفوعات
   */
  async getPayments(params: PaymentRecordSearchParams = {}): Promise<{ data: PaymentRecord[] | null; count: number | null; error: any }> {
    try {
      const {
        student_id,
        payment_type,
        payment_method,
        start_date,
        end_date,
        page = 1,
        limit = 10
      } = params;

      // حساب الإزاحة للصفحة
      const offset = (page - 1) * limit;

      // بناء الاستعلام
      let query = supabase
        .from('payment_records')
        .select('*', { count: 'exact' });

      // إضافة الفلاتر
      if (student_id) {
        query = query.eq('student_id', student_id);
      }

      if (payment_type) {
        query = query.eq('payment_type', payment_type);
      }

      if (payment_method) {
        query = query.eq('payment_method', payment_method);
      }

      if (start_date) {
        query = query.gte('payment_date', start_date);
      }

      if (end_date) {
        query = query.lte('payment_date', end_date);
      }

      // إضافة الترتيب والصفحة
      query = query
        .order('payment_date', { ascending: false })
        .range(offset, offset + limit - 1);

      // تنفيذ الاستعلام
      const { data, error, count } = await query;

      return { data, count, error };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { data: null, count: null, error };
    }
  },

  /**
   * الحصول على مدفوعات طالب معين
   */
  async getStudentPayments(studentId: string): Promise<{ data: PaymentRecord[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching student payments:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على سجل دفع بواسطة المعرف
   */
  async getPaymentById(id: string): Promise<{ data: PaymentRecord | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching payment:', error);
      return { data: null, error };
    }
  },

  /**
   * إنشاء سجل دفع جديد
   */
  async createPayment(payment: CreatePaymentRecordInput): Promise<{ data: PaymentRecord | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .insert([payment])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث سجل دفع
   */
  async updatePayment(payment: UpdatePaymentRecordInput): Promise<{ data: PaymentRecord | null; error: any }> {
    try {
      const { id, ...updateData } = payment;

      const { data, error } = await supabase
        .from('payment_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating payment:', error);
      return { data: null, error };
    }
  },

  /**
   * حذف سجل دفع
   */
  async deletePayment(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', id);

      return { success: !error, error };
    } catch (error) {
      console.error('Error deleting payment:', error);
      return { success: false, error };
    }
  },

  /**
   * الحصول على إحصائيات المدفوعات
   */
  async getPaymentStatistics(studentId?: string): Promise<{
    totalPayments: number;
    advancePayments: number;
    installmentPayments: number;
    otherPayments: number;
    error: any;
  }> {
    try {
      // بناء الاستعلام الأساسي
      let query = supabase.from('payment_records').select('amount, payment_type');

      // إضافة فلتر الطالب إذا كان موجوداً
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      // تنفيذ الاستعلام
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // حساب الإحصائيات
      let totalPayments = 0;
      let advancePayments = 0;
      let installmentPayments = 0;
      let otherPayments = 0;

      data.forEach(payment => {
        const amount = parseFloat(payment.amount);
        totalPayments += amount;

        switch (payment.payment_type) {
          case 'advance_payment':
            advancePayments += amount;
            break;
          case 'installment':
            installmentPayments += amount;
            break;
          default:
            otherPayments += amount;
            break;
        }
      });

      return {
        totalPayments,
        advancePayments,
        installmentPayments,
        otherPayments,
        error: null
      };
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      return {
        totalPayments: 0,
        advancePayments: 0,
        installmentPayments: 0,
        otherPayments: 0,
        error
      };
    }
  }
};

export default paymentService;
