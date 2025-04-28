/**
 * نموذج بيانات الطالب
 */
export interface Student {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  national_id?: string;
  religion?: 'islam' | 'christianity';
  second_language?: 'french' | 'german';
  address?: string;
  phone?: string;
  email?: string;
  grade_level: number;
  stage_id?: string;
  stage_name?: string;
  classroom_id?: string;
  classroom_name?: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'excellent' | 'absent';
  parent_name?: string;
  parent_phone?: string;
  parent_phone2?: string;
  parent_email?: string;
  parent_job?: string;
  parent_relation?: 'father' | 'mother' | 'guardian';
  health_notes?: string;
  academic_notes?: string;
  behavior_notes?: string;
  profile_image?: string;
  financial_status?: 'paid' | 'partial' | 'unpaid';
  fees_amount?: number;
  discount_amount?: number;
  discount_reason?: string;
  file_opening_fee?: number;
  advance_payment?: number;
  total_after_discount?: number;
  payment_method?: 'full' | 'installments';
  installments_count?: number;
  installment_amount?: number;
  installments_data?: InstallmentData[];
  payments?: PaymentRecord[];
  created_at: string;
  updated_at: string;
}

/**
 * نموذج بيانات إنشاء طالب جديد
 */
export interface CreateStudentInput {
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  national_id?: string;
  religion?: 'islam' | 'christianity';
  second_language?: 'french' | 'german';
  address?: string;
  phone?: string;
  email?: string;
  grade_level: number;
  stage_id?: string;
  classroom_id?: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'excellent' | 'absent';
  parent_name?: string;
  parent_phone?: string;
  parent_phone2?: string;
  parent_email?: string;
  parent_job?: string;
  parent_relation?: 'father' | 'mother' | 'guardian';
  health_notes?: string;
  academic_notes?: string;
  behavior_notes?: string;
  profile_image?: string;
  financial_status?: 'paid' | 'partial' | 'unpaid';
  fees_amount?: number;
  discount_amount?: number;
  discount_reason?: string;
  file_opening_fee?: number;
  advance_payment?: number;
  total_after_discount?: number;
  payment_method?: 'full' | 'installments';
  installments_count?: number;
  installment_amount?: number;
  installments_data?: InstallmentData[];
}

/**
 * نموذج بيانات تحديث طالب
 */
export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  id: string;
}

/**
 * نموذج بيانات البحث عن طالب
 */
export interface StudentSearchParams {
  name?: string;
  national_id?: string;
  grade_level?: number;
  classroom_id?: string;
  stage_id?: string;
  status?: 'active' | 'inactive' | 'graduated' | 'transferred' | 'excellent' | 'absent';
  gender?: 'male' | 'female';
  religion?: 'islam' | 'christianity';
  second_language?: 'french' | 'german';
  enrollment_year?: number;
  page?: number;
  limit?: number;
}

/**
 * نموذج بيانات الصف الدراسي
 */
export interface Classroom {
  id: string;
  name: string;
  grade_level: number;
  stage_id?: string;
  stage_name?: string;
  capacity: number;
  teacher_id?: string;
  teacher_name?: string;
  academic_year: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

/**
 * نموذج بيانات المستوى الدراسي
 */
export interface GradeLevel {
  id: number;
  name: string;
  arabic_name: string;
}

/**
 * نموذج بيانات القسط
 */
export interface InstallmentData {
  installment_number: number;
  due_date: string;
  amount: number;
  remaining_balance: number;
  status?: 'paid' | 'unpaid' | 'partial';
  payment_date?: string;
  payment_amount?: number;
  payment_method?: string;
  notes?: string;
}

/**
 * نموذج بيانات سجل الدفع
 */
export interface PaymentRecord {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'advance_payment' | 'installment' | 'other';
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * قائمة المستويات الدراسية
 */
export const GRADE_LEVELS: GradeLevel[] = [
  { id: 1, name: 'First Grade', arabic_name: 'الصف الأول الابتدائي' },
  { id: 2, name: 'Second Grade', arabic_name: 'الصف الثاني الابتدائي' },
  { id: 3, name: 'Third Grade', arabic_name: 'الصف الثالث الابتدائي' },
  { id: 4, name: 'Fourth Grade', arabic_name: 'الصف الرابع الابتدائي' },
  { id: 5, name: 'Fifth Grade', arabic_name: 'الصف الخامس الابتدائي' },
  { id: 6, name: 'Sixth Grade', arabic_name: 'الصف السادس الابتدائي' },
  { id: 7, name: 'First Preparatory', arabic_name: 'الصف الأول الإعدادي' },
  { id: 8, name: 'Second Preparatory', arabic_name: 'الصف الثاني الإعدادي' },
  { id: 9, name: 'Third Preparatory', arabic_name: 'الصف الثالث الإعدادي' },
  { id: 10, name: 'First Secondary', arabic_name: 'الصف الأول الثانوي' },
  { id: 11, name: 'Second Secondary', arabic_name: 'الصف الثاني الثانوي' },
  { id: 12, name: 'Third Secondary', arabic_name: 'الصف الثالث الثانوي' },
];

/**
 * الرسوم الدراسية حسب المرحلة
 */
export const GRADE_FEES: { [key: number]: number } = {
  // المرحلة الابتدائية
  1: 4000, // الصف الأول الابتدائي
  2: 4000, // الصف الثاني الابتدائي
  3: 4000, // الصف الثالث الابتدائي
  4: 4000, // الصف الرابع الابتدائي
  5: 4000, // الصف الخامس الابتدائي
  6: 4000, // الصف السادس الابتدائي

  // المرحلة الإعدادية
  7: 5000, // الصف الأول الإعدادي
  8: 5000, // الصف الثاني الإعدادي
  9: 5000, // الصف الثالث الإعدادي

  // المرحلة الثانوية
  10: 6000, // الصف الأول الثانوي
  11: 6000, // الصف الثاني الثانوي
  12: 6000, // الصف الثالث الثانوي
};

/**
 * رسوم فتح الملف
 */
export const FILE_OPENING_FEE = 300;
