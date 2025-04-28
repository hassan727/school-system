import { create } from 'zustand';
import { Student } from '@/types/student';

/**
 * واجهة حالة البيانات المشتركة
 */
interface SharedDataState {
  // بيانات الطلاب
  students: Student[];
  setStudents: (students: Student[]) => void;

  // بيانات الفصول الدراسية
  classrooms: any[];
  setClassrooms: (classrooms: any[]) => void;

  // بيانات المراحل الدراسية
  stages: any[];
  setStages: (stages: any[]) => void;

  // الإحصائيات العامة
  statistics: {
    // إحصائيات الطلاب
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    graduatedStudents: number;
    transferredStudents: number;
    maleStudents: number;
    femaleStudents: number;

    // إحصائيات حسب المستوى الدراسي
    studentsByGradeLevel: Record<string, number>;

    // إحصائيات حسب الديانة
    muslimStudents: number;
    christianStudents: number;
    otherReligionStudents: number;

    // إحصائيات حسب اللغة الثانية
    frenchLanguageStudents: number;
    germanLanguageStudents: number;

    // إحصائيات مالية
    totalFees: number;
    totalPaid: number;
    totalDue: number;
    totalDiscounts: number;

    // إحصائيات الفصول الدراسية
    totalClassrooms: number;
    classroomsByStage: Record<string, number>;

    // إحصائيات زمنية
    lastUpdated: Date;
  };
  updateStatistics: (stats: Partial<SharedDataState['statistics']>) => void;

  // تحديث بيانات طالب محدد
  updateStudent: (student: Student) => void;

  // حذف طالب
  removeStudent: (studentId: string) => void;
}

/**
 * إنشاء مخزن البيانات المشتركة باستخدام Zustand
 */
export const useSharedDataStore = create<SharedDataState>((set) => ({
  // بيانات الطلاب
  students: [],
  setStudents: (students) => set({ students }),

  // بيانات الفصول الدراسية
  classrooms: [],
  setClassrooms: (classrooms) => set({ classrooms }),

  // بيانات المراحل الدراسية
  stages: [],
  setStages: (stages) => set({ stages }),

  // الإحصائيات العامة
  statistics: {
    // إحصائيات الطلاب
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    graduatedStudents: 0,
    transferredStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,

    // إحصائيات حسب المستوى الدراسي
    studentsByGradeLevel: {},

    // إحصائيات حسب الديانة
    muslimStudents: 0,
    christianStudents: 0,
    otherReligionStudents: 0,

    // إحصائيات حسب اللغة الثانية
    frenchLanguageStudents: 0,
    germanLanguageStudents: 0,

    // إحصائيات مالية
    totalFees: 0,
    totalPaid: 0,
    totalDue: 0,
    totalDiscounts: 0,

    // إحصائيات الفصول الدراسية
    totalClassrooms: 0,
    classroomsByStage: {},

    // إحصائيات زمنية
    lastUpdated: new Date(),
  },
  updateStatistics: (stats) => set((state) => ({
    statistics: { ...state.statistics, ...stats }
  })),

  // تحديث بيانات طالب محدد
  updateStudent: (student) => set((state) => ({
    students: state.students.map((s) => (s.id === student.id ? student : s))
  })),

  // حذف طالب
  removeStudent: (studentId) => set((state) => ({
    students: state.students.filter((s) => s.id !== studentId)
  })),
}));

/**
 * خدمة البيانات المشتركة
 */
export const sharedDataService = {
  /**
   * تحديث الإحصائيات العامة
   */
  updateStatistics(students: Student[], classrooms: any[] = []) {
    // إحصائيات الطلاب الأساسية
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'active').length;
    const inactiveStudents = students.filter((s) => s.status === 'inactive').length;
    const graduatedStudents = students.filter((s) => s.status === 'graduated').length;
    const transferredStudents = students.filter((s) => s.status === 'transferred').length;
    const maleStudents = students.filter((s) => s.gender === 'male').length;
    const femaleStudents = students.filter((s) => s.gender === 'female').length;

    // إحصائيات حسب المستوى الدراسي
    const studentsByGradeLevel: Record<string, number> = {};
    students.forEach((student) => {
      if (student.grade_level) {
        studentsByGradeLevel[student.grade_level] = (studentsByGradeLevel[student.grade_level] || 0) + 1;
      }
    });

    // إحصائيات حسب الديانة - تحسين البحث عن الديانة
    const muslimStudents = students.filter((s) => {
      const religion = String(s.religion || '').toLowerCase();
      return religion === 'muslim' || religion === 'مسلم' || religion.includes('إسلام') || religion.includes('اسلام');
    }).length;

    const christianStudents = students.filter((s) => {
      const religion = String(s.religion || '').toLowerCase();
      return religion === 'christian' || religion === 'مسيحي' || religion.includes('مسيح');
    }).length;

    const otherReligionStudents = students.filter((s) => {
      if (!s.religion) return false;
      const religion = String(s.religion).toLowerCase();
      return religion !== 'muslim' && religion !== 'مسلم' && !religion.includes('إسلام') && !religion.includes('اسلام') &&
             religion !== 'christian' && religion !== 'مسيحي' && !religion.includes('مسيح');
    }).length;

    // إحصائيات حسب اللغة الثانية
    const frenchLanguageStudents = students.filter((s) => s.second_language === 'french').length;
    const germanLanguageStudents = students.filter((s) => s.second_language === 'german').length;

    // حساب الإحصائيات المالية
    let totalFees = 0;
    let totalPaid = 0;
    let totalDiscounts = 0;

    students.forEach((student) => {
      if (student.fees_amount) {
        totalFees += Number(student.fees_amount || 0);
      }

      if (student.discount_amount) {
        totalDiscounts += Number(student.discount_amount || 0);
      }

      // حساب المبالغ المدفوعة
      if (student.payments && Array.isArray(student.payments) && student.payments.length > 0) {
        student.payments.forEach((payment) => {
          if (payment && payment.amount) {
            totalPaid += Number(payment.amount || 0);
          }
        });
      }

      // إضافة الدفعة المقدمة إلى إجمالي المدفوعات إذا كانت موجودة
      if (student.advance_payment) {
        totalPaid += Number(student.advance_payment || 0);
      }
    });

    // طباعة الإحصائيات المالية للتشخيص
    console.log('Financial statistics:', {
      totalFees,
      totalPaid,
      totalDiscounts,
      totalDue: totalFees - totalPaid - totalDiscounts
    });

    const totalDue = totalFees - totalPaid - totalDiscounts;

    // إحصائيات الفصول الدراسية
    const totalClassrooms = classrooms.length;
    const classroomsByStage: Record<string, number> = {};
    classrooms.forEach((classroom) => {
      if (classroom.stage_id) {
        classroomsByStage[classroom.stage_id] = (classroomsByStage[classroom.stage_id] || 0) + 1;
      }
    });

    // تحديث الإحصائيات في المخزن
    useSharedDataStore.getState().updateStatistics({
      // إحصائيات الطلاب
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      transferredStudents,
      maleStudents,
      femaleStudents,

      // إحصائيات حسب المستوى الدراسي
      studentsByGradeLevel,

      // إحصائيات حسب الديانة
      muslimStudents,
      christianStudents,
      otherReligionStudents,

      // إحصائيات حسب اللغة الثانية
      frenchLanguageStudents,
      germanLanguageStudents,

      // إحصائيات مالية
      totalFees,
      totalPaid,
      totalDue,
      totalDiscounts,

      // إحصائيات الفصول الدراسية
      totalClassrooms,
      classroomsByStage,

      // إحصائيات زمنية
      lastUpdated: new Date(),
    });
  },

  /**
   * تحديث بيانات الطلاب
   */
  updateStudents(students: Student[]) {
    useSharedDataStore.getState().setStudents(students);
    this.updateStatistics(students);
  },

  /**
   * تحديث بيانات طالب محدد
   */
  updateStudent(student: Student) {
    useSharedDataStore.getState().updateStudent(student);

    // تحديث الإحصائيات
    const students = useSharedDataStore.getState().students;
    this.updateStatistics(students);
  },

  /**
   * حذف طالب
   */
  removeStudent(studentId: string) {
    useSharedDataStore.getState().removeStudent(studentId);

    // تحديث الإحصائيات
    const students = useSharedDataStore.getState().students;
    this.updateStatistics(students);
  },
};

export default sharedDataService;
