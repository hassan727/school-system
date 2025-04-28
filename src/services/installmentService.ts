import { supabase } from '@/lib/supabase';
import { InstallmentData } from '@/types/student';

/**
 * خدمة إدارة الأقساط
 */
export const installmentService = {
  /**
   * الحصول على أقساط طالب
   */
  async getStudentInstallments(studentId: string): Promise<{ data: InstallmentData[] | null; error: any }> {
    try {
      console.log('Getting installments for student:', studentId);
      
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('student_id', studentId)
        .order('installment_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching installments:', error);
        return { data: null, error };
      }
      
      // تنسيق البيانات
      const formattedData = data.map(item => ({
        installment_number: item.installment_number,
        due_date: item.due_date,
        amount: parseFloat(item.amount),
        remaining_balance: parseFloat(item.remaining_balance),
        status: item.status,
        payment_date: item.payment_date,
        payment_amount: item.payment_amount ? parseFloat(item.payment_amount) : undefined,
        payment_method: item.payment_method,
        notes: item.notes
      })) as InstallmentData[];
      
      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error in getStudentInstallments:', error);
      return { data: null, error };
    }
  },
  
  /**
   * إنشاء أو تحديث أقساط طالب
   */
  async updateStudentInstallments(studentId: string, installments: InstallmentData[]): Promise<{ success: boolean; error: any }> {
    try {
      console.log('Updating installments for student:', studentId);
      console.log('Installments data:', JSON.stringify(installments));
      
      // حذف الأقساط الحالية
      const { error: deleteError } = await supabase
        .from('installments')
        .delete()
        .eq('student_id', studentId);
      
      if (deleteError) {
        console.error('Error deleting existing installments:', deleteError);
        return { success: false, error: deleteError };
      }
      
      // لا توجد أقساط جديدة للإضافة
      if (!installments || installments.length === 0) {
        return { success: true, error: null };
      }
      
      // تحضير بيانات الأقساط للإدراج
      const installmentsData = installments.map(item => ({
        student_id: studentId,
        installment_number: item.installment_number,
        due_date: item.due_date,
        amount: item.amount,
        remaining_balance: item.remaining_balance,
        status: item.status || 'unpaid',
        payment_date: item.payment_date,
        payment_amount: item.payment_amount,
        payment_method: item.payment_method,
        notes: item.notes
      }));
      
      // إدراج الأقساط الجديدة
      const { error: insertError } = await supabase
        .from('installments')
        .insert(installmentsData);
      
      if (insertError) {
        console.error('Error inserting installments:', insertError);
        return { success: false, error: insertError };
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateStudentInstallments:', error);
      return { success: false, error };
    }
  },
  
  /**
   * تحديث حالة قسط
   */
  async updateInstallmentStatus(
    studentId: string, 
    installmentNumber: number, 
    status: 'paid' | 'unpaid' | 'partial',
    paymentDetails?: {
      payment_date?: string;
      payment_amount?: number;
      payment_method?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log(`Updating installment ${installmentNumber} status for student ${studentId} to ${status}`);
      
      const updateData: any = { status };
      
      if (paymentDetails) {
        if (paymentDetails.payment_date) updateData.payment_date = paymentDetails.payment_date;
        if (paymentDetails.payment_amount) updateData.payment_amount = paymentDetails.payment_amount;
        if (paymentDetails.payment_method) updateData.payment_method = paymentDetails.payment_method;
        if (paymentDetails.notes) updateData.notes = paymentDetails.notes;
      }
      
      const { error } = await supabase
        .from('installments')
        .update(updateData)
        .eq('student_id', studentId)
        .eq('installment_number', installmentNumber);
      
      if (error) {
        console.error('Error updating installment status:', error);
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateInstallmentStatus:', error);
      return { success: false, error };
    }
  },
  
  /**
   * تحديث الحالة المالية للطالب بناءً على حالة الأقساط
   */
  async updateStudentFinancialStatus(studentId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('Updating financial status for student:', studentId);
      
      // الحصول على أقساط الطالب
      const { data: installments, error: fetchError } = await this.getStudentInstallments(studentId);
      
      if (fetchError) {
        console.error('Error fetching installments for financial status update:', fetchError);
        return { success: false, error: fetchError };
      }
      
      // تحديد الحالة المالية
      let financialStatus = 'unpaid';
      
      if (installments && installments.length > 0) {
        const paidCount = installments.filter(i => i.status === 'paid').length;
        
        if (paidCount === installments.length) {
          financialStatus = 'paid';
        } else if (paidCount > 0) {
          financialStatus = 'partial';
        }
      }
      
      // تحديث الحالة المالية للطالب
      const { error: updateError } = await supabase
        .from('students')
        .update({ financial_status: financialStatus })
        .eq('id', studentId);
      
      if (updateError) {
        console.error('Error updating student financial status:', updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateStudentFinancialStatus:', error);
      return { success: false, error };
    }
  }
};
