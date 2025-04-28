/**
 * نموذج بيانات المرحلة الدراسية
 */
export interface Stage {
  id: string;
  name: string;
  grade_level_start: number;
  grade_level_end: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * نموذج بيانات إنشاء مرحلة دراسية جديدة
 */
export interface CreateStageInput {
  name: string;
  grade_level_start: number;
  grade_level_end: number;
}

/**
 * نموذج بيانات تحديث مرحلة دراسية
 */
export interface UpdateStageInput extends Partial<CreateStageInput> {
  id: string;
}

/**
 * نموذج بيانات البحث عن مرحلة دراسية
 */
export interface StageSearchParams {
  name?: string;
  page?: number;
  limit?: number;
}
