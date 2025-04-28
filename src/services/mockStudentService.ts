import { 
  Student, 
  CreateStudentInput, 
  UpdateStudentInput, 
  StudentSearchParams,
  Classroom,
  GRADE_LEVELS
} from '@/types/student';

// بيانات وهمية للفصول الدراسية
const mockClassrooms: Classroom[] = [
  {
    id: '1',
    name: 'فصل 1/1',
    grade_level: 1,
    capacity: 30,
    teacher_id: '1',
    teacher_name: 'أحمد محمد',
    academic_year: '2023-2024',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'فصل 1/2',
    grade_level: 1,
    capacity: 30,
    teacher_id: '2',
    teacher_name: 'محمد علي',
    academic_year: '2023-2024',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'فصل 2/1',
    grade_level: 2,
    capacity: 30,
    teacher_id: '3',
    teacher_name: 'علي أحمد',
    academic_year: '2023-2024',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// بيانات وهمية للطلاب
let mockStudents: Student[] = [
  {
    id: '1',
    first_name: 'محمد',
    last_name: 'أحمد',
    full_name: 'محمد أحمد',
    gender: 'male',
    birth_date: '2015-05-15',
    national_id: '12345678901234',
    address: 'القاهرة، مصر',
    phone: '01012345678',
    email: 'mohamed@example.com',
    grade_level: 1,
    classroom_id: '1',
    classroom_name: 'فصل 1/1',
    enrollment_date: '2022-09-01',
    status: 'active',
    parent_name: 'أحمد محمد',
    parent_phone: '01098765432',
    parent_email: 'ahmed@example.com',
    parent_job: 'مهندس',
    parent_relation: 'father',
    health_notes: 'لا يوجد',
    academic_notes: 'طالب متفوق',
    behavior_notes: 'سلوك ممتاز',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    first_name: 'فاطمة',
    last_name: 'علي',
    full_name: 'فاطمة علي',
    gender: 'female',
    birth_date: '2015-08-20',
    national_id: '12345678901235',
    address: 'الإسكندرية، مصر',
    phone: '01112345678',
    email: 'fatma@example.com',
    grade_level: 1,
    classroom_id: '1',
    classroom_name: 'فصل 1/1',
    enrollment_date: '2022-09-01',
    status: 'active',
    parent_name: 'علي محمد',
    parent_phone: '01198765432',
    parent_email: 'ali@example.com',
    parent_job: 'طبيب',
    parent_relation: 'father',
    health_notes: 'لا يوجد',
    academic_notes: 'طالبة متفوقة',
    behavior_notes: 'سلوك ممتاز',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    first_name: 'أحمد',
    last_name: 'محمود',
    full_name: 'أحمد محمود',
    gender: 'male',
    birth_date: '2014-03-10',
    national_id: '12345678901236',
    address: 'القاهرة، مصر',
    phone: '01212345678',
    email: 'ahmed@example.com',
    grade_level: 2,
    classroom_id: '3',
    classroom_name: 'فصل 2/1',
    enrollment_date: '2021-09-01',
    status: 'active',
    parent_name: 'محمود أحمد',
    parent_phone: '01298765432',
    parent_email: 'mahmoud@example.com',
    parent_job: 'محاسب',
    parent_relation: 'father',
    health_notes: 'لا يوجد',
    academic_notes: 'طالب متوسط',
    behavior_notes: 'سلوك جيد',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// تأخير وهمي لمحاكاة الاتصال بالخادم
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * خدمة وهمية لإدارة الطلاب للاختبار
 */
export const mockStudentService = {
  /**
   * الحصول على قائمة الطلاب
   */
  async getStudents(params: StudentSearchParams = {}): Promise<{ data: Student[] | null; count: number | null; error: any }> {
    await delay(500); // تأخير وهمي

    try {
      const {
        name,
        grade_level,
        classroom_id,
        status,
        gender,
        enrollment_year,
        page = 1,
        limit = 10
      } = params;

      // تطبيق الفلاتر
      let filteredStudents = [...mockStudents];

      if (name) {
        filteredStudents = filteredStudents.filter(student => 
          student.first_name.includes(name) || 
          student.last_name.includes(name) ||
          (student.full_name && student.full_name.includes(name))
        );
      }
      
      if (grade_level) {
        filteredStudents = filteredStudents.filter(student => 
          student.grade_level === grade_level
        );
      }
      
      if (classroom_id) {
        filteredStudents = filteredStudents.filter(student => 
          student.classroom_id === classroom_id
        );
      }
      
      if (status) {
        filteredStudents = filteredStudents.filter(student => 
          student.status === status
        );
      }
      
      if (gender) {
        filteredStudents = filteredStudents.filter(student => 
          student.gender === gender
        );
      }
      
      if (enrollment_year) {
        filteredStudents = filteredStudents.filter(student => {
          const enrollmentYear = new Date(student.enrollment_date).getFullYear();
          return enrollmentYear === enrollment_year;
        });
      }

      // حساب إجمالي عدد النتائج
      const totalCount = filteredStudents.length;

      // تطبيق الترقيم والحد
      const offset = (page - 1) * limit;
      filteredStudents = filteredStudents.slice(offset, offset + limit);

      return { 
        data: filteredStudents, 
        count: totalCount, 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      return { data: null, count: null, error };
    }
  },

  /**
   * الحصول على طالب بواسطة المعرف
   */
  async getStudentById(id: string): Promise<{ data: Student | null; error: any }> {
    await delay(300); // تأخير وهمي

    try {
      const student = mockStudents.find(s => s.id === id);
      
      if (!student) {
        return { data: null, error: 'Student not found' };
      }
      
      return { data: student, error: null };
    } catch (error) {
      console.error('Error fetching student:', error);
      return { data: null, error };
    }
  },

  /**
   * إنشاء طالب جديد
   */
  async createStudent(student: CreateStudentInput): Promise<{ data: Student | null; error: any }> {
    await delay(800); // تأخير وهمي

    try {
      // إنشاء معرف جديد
      const id = (mockStudents.length + 1).toString();
      
      // الحصول على اسم الفصل الدراسي
      let classroom_name = '';
      if (student.classroom_id) {
        const classroom = mockClassrooms.find(c => c.id === student.classroom_id);
        classroom_name = classroom?.name || '';
      }
      
      // إنشاء طالب جديد
      const newStudent: Student = {
        id,
        ...student,
        classroom_name,
        full_name: `${student.first_name} ${student.last_name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // إضافة الطالب إلى القائمة
      mockStudents.push(newStudent);
      
      return { data: newStudent, error: null };
    } catch (error) {
      console.error('Error creating student:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث بيانات طالب
   */
  async updateStudent(student: UpdateStudentInput): Promise<{ data: Student | null; error: any }> {
    await delay(800); // تأخير وهمي

    try {
      const { id, ...updateData } = student;
      
      // البحث عن الطالب
      const index = mockStudents.findIndex(s => s.id === id);
      
      if (index === -1) {
        return { data: null, error: 'Student not found' };
      }
      
      // الحصول على اسم الفصل الدراسي
      let classroom_name = mockStudents[index].classroom_name;
      if (updateData.classroom_id && updateData.classroom_id !== mockStudents[index].classroom_id) {
        const classroom = mockClassrooms.find(c => c.id === updateData.classroom_id);
        classroom_name = classroom?.name || '';
      }
      
      // تحديث بيانات الطالب
      const updatedStudent: Student = {
        ...mockStudents[index],
        ...updateData,
        classroom_name,
        full_name: updateData.first_name && updateData.last_name 
          ? `${updateData.first_name} ${updateData.last_name}`
          : updateData.first_name 
            ? `${updateData.first_name} ${mockStudents[index].last_name}`
            : updateData.last_name
              ? `${mockStudents[index].first_name} ${updateData.last_name}`
              : mockStudents[index].full_name,
        updated_at: new Date().toISOString()
      };
      
      // تحديث القائمة
      mockStudents[index] = updatedStudent;
      
      return { data: updatedStudent, error: null };
    } catch (error) {
      console.error('Error updating student:', error);
      return { data: null, error };
    }
  },

  /**
   * حذف طالب
   */
  async deleteStudent(id: string): Promise<{ success: boolean; error: any }> {
    await delay(500); // تأخير وهمي

    try {
      // البحث عن الطالب
      const index = mockStudents.findIndex(s => s.id === id);
      
      if (index === -1) {
        return { success: false, error: 'Student not found' };
      }
      
      // حذف الطالب من القائمة
      mockStudents.splice(index, 1);
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting student:', error);
      return { success: false, error };
    }
  },

  /**
   * تحميل صورة الطالب
   */
  async uploadStudentImage(file: File, studentId: string): Promise<{ url: string | null; error: any }> {
    await delay(1000); // تأخير وهمي

    try {
      // إنشاء URL وهمي للصورة
      const url = `https://example.com/student-images/${studentId}-${Date.now()}.jpg`;
      
      return { url, error: null };
    } catch (error) {
      console.error('Error uploading student image:', error);
      return { url: null, error };
    }
  },

  /**
   * الحصول على قائمة الفصول الدراسية
   */
  async getClassrooms(gradeLevel?: number): Promise<{ data: Classroom[] | null; error: any }> {
    await delay(300); // تأخير وهمي

    try {
      let filteredClassrooms = [...mockClassrooms];
      
      if (gradeLevel) {
        filteredClassrooms = filteredClassrooms.filter(classroom => 
          classroom.grade_level === gradeLevel
        );
      }
      
      return { data: filteredClassrooms, error: null };
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      return { data: null, error };
    }
  }
};

export default mockStudentService;
