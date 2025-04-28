/**
 * نموذج بيانات سجل المدفوعات
 */
export interface PaymentRecord {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'advance_payment' | 'installment' | 'other';
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
  receipt_number?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * نموذج بيانات إنشاء سجل دفع جديد
 */
export interface CreatePaymentRecordInput {
  student_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'advance_payment' | 'installment' | 'other';
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
  receipt_number?: string;
  created_by?: string;
}

/**
 * نموذج بيانات تحديث سجل دفع
 */
export interface UpdatePaymentRecordInput extends Partial<CreatePaymentRecordInput> {
  id: string;
}

/**
 * نموذج بيانات البحث عن سجلات الدفع
 */
export interface PaymentRecordSearchParams {
  student_id?: string;
  payment_type?: 'advance_payment' | 'installment' | 'other';
  payment_method?: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
