import { supabase } from '@/lib/supabase';
import {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  StudentSearchParams
} from '@/types/student';
import { mockStudentService } from './mockStudentService';
import { installmentService } from './installmentService';

// التحقق من وجود متغيرات البيئة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useMockService = !supabaseUrl || !supabaseAnonKey;

/**
 * خدمة إدارة الطلاب
 */
export const studentService = {
  /**
   * الحصول على قائمة الطلاب
   */
  async getStudents(params: StudentSearchParams = {}): Promise<{ data: Student[] | null; count: number | null; error: any }> {
    console.log('getStudents called with params:', params);

    // استخدام الخدمة الوهمية إذا لم تكن متغيرات البيئة متوفرة
    if (useMockService) {
      console.log('Using mock service for students');
      return mockStudentService.getStudents(params);
    }

    try {
      console.log('Supabase URL:', supabaseUrl);
      console.log('Using real Supabase service');

      const {
        name,
        national_id,
        grade_level,
        classroom_id,
        stage_id,
        status,
        gender,
        religion,
        second_language,
        enrollment_year,
        page = 1,
        limit = 10
      } = params;

      // حساب الإزاحة للصفحة
      const offset = (page - 1) * limit;

      // التحقق من وجود جدول students
      const { error: tableCheckError } = await supabase
        .from('students')
        .select('count', { count: 'exact' })
        .limit(1);

      if (tableCheckError) {
        console.error('Error checking students table:', tableCheckError);
        // إذا كان هناك خطأ في الوصول إلى الجدول، نستخدم الخدمة الوهمية
        console.log('Falling back to mock service due to table access error');
        return mockStudentService.getStudents(params);
      }

      console.log('Students table exists, proceeding with query');

      // بناء الاستعلام بناءً على الأعمدة الموجودة فعلياً في قاعدة البيانات
      let query = supabase
        .from('students')
        .select(`
          id,
          full_name,
          gender,
          birth_date,
          national_id,
          religion,
          second_language,
          address,
          phone,
          email,
          grade_level,
          classroom_id,
          enrollment_date,
          status,
          parent_name,
          parent_phone,
          parent_phone2,
          parent_email,
          parent_job,
          parent_relation,
          health_notes,
          academic_notes,
          behavior_notes,
          profile_image,
          financial_status,
          fees_amount,
          discount_amount,
          discount_reason,
          file_opening_fee,
          total_after_discount,
          payment_method,
          installments_count,
          installment_amount,
          created_at,
          updated_at,
          classrooms(id, name),
          payment_records(id, amount, payment_date, payment_type, payment_method, notes)
        `, { count: 'exact' });

      // إضافة الفلاتر
      if (name) {
        query = query.ilike('full_name', `%${name}%`);
      }

      if (national_id) {
        query = query.eq('national_id', national_id);
      }

      if (grade_level) {
        query = query.eq('grade_level', grade_level);
      }

      if (classroom_id) {
        query = query.eq('classroom_id', classroom_id);
      }

      // تم حذف فلتر المرحلة الدراسية

      if (status) {
        query = query.eq('status', status);
      }

      if (gender) {
        query = query.eq('gender', gender);
      }

      if (religion) {
        query = query.eq('religion', religion);
      }

      // إضافة فلتر اللغة الثانية
      if (params.second_language) {
        query = query.eq('second_language', params.second_language);
      }

      if (enrollment_year) {
        // البحث عن السنة في تاريخ التسجيل
        const startDate = `${enrollment_year}-01-01`;
        const endDate = `${enrollment_year}-12-31`;
        query = query.gte('enrollment_date', startDate).lte('enrollment_date', endDate);
      }

      // إضافة الترتيب حسب الجنس ثم الاسم أبجدياً
      query = query.order('gender', { ascending: false }) // الذكور أولاً (male) ثم الإناث (female)
        .order('full_name', { ascending: true }) // ترتيب أبجدي للأسماء
        .range(offset, offset + limit - 1);

      // تنفيذ الاستعلام
      console.log('Executing Supabase query with params:', JSON.stringify(params));

      try {
        // تنفيذ الاستعلام بالطريقة القياسية
        const result = await query;

        // التحقق من النتيجة
        if (!result) {
          console.error('Supabase query returned undefined result');
          return mockStudentService.getStudents(params);
        }

        const { data, error, count } = result;

        console.log('Query executed. Error:', error ? 'Yes' : 'No', 'Data count:', data?.length || 0);

        // طباعة تفاصيل الخطأ إذا وجد
        if (error) {
          console.error('Supabase query error details:', JSON.stringify(error));
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);

          // إذا كان الخطأ متعلقًا بالاتصال، نحاول مرة أخرى باستخدام استعلام أبسط
          if (error.code === 'PGRST116' || error.message?.includes('connection')) {
            console.log('Connection error detected, trying simpler query...');

            try {
              const simpleResult = await supabase
                .from('students')
                .select('id, full_name')
                .limit(5);

              if (simpleResult.error) {
                console.error('Simple query also failed:', simpleResult.error);
              } else {
                console.log('Simple query succeeded with', simpleResult.data?.length || 0, 'results');
              }
            } catch (simpleError) {
              console.error('Error executing simple query:', simpleError);
            }
          }

          // الرجوع إلى الخدمة الوهمية في حالة الخطأ
          console.log('Falling back to mock service due to query error');
          return mockStudentService.getStudents(params);
        }

        // التحقق من البيانات
        if (!data) {
          console.log('Query returned null data');
          return { data: [], count: 0, error: null };
        }

        if (data.length === 0) {
          console.log('Query returned empty data array');
          return { data: [], count: count || 0, error: null };
        }

        // طباعة عينة من البيانات للتشخيص
        console.log('Sample data:', JSON.stringify(data[0]));

        // تحويل البيانات (تعديل ليتوافق مع هيكل البيانات الفعلي)
        const formattedData = data.map(student => {
          // تحويل بيانات الطالب
          const formattedStudent = {
            ...student,
            classroom_name: student.classrooms?.name,
            // إضافة سجلات المدفوعات إذا كانت موجودة
            payments: student.payment_records || []
          };

          // حذف الحقول غير المطلوبة
          delete formattedStudent.payment_records;

          return formattedStudent;
        }) as Student[];

        return { data: formattedData, count, error: null };
      } catch (queryError) {
        console.error('Error executing query:', queryError);
        console.error('Error stack:', queryError.stack);

        // الرجوع إلى الخدمة الوهمية في حالة الاستثناء
        console.log('Falling back to mock service due to query execution error');
        return mockStudentService.getStudents(params);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      return { data: null, count: null, error };
    }
  },

  /**
   * الحصول على طالب بواسطة المعرف
   */
  async getStudentById(id: string): Promise<{ data: Student | null; error: any }> {
    try {
      // جلب بيانات الطالب
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, gender, birth_date, national_id, religion, second_language, address, phone, email, grade_level, classroom_id, enrollment_date, status, parent_name, parent_phone, parent_phone2, parent_email, parent_job, parent_relation, health_notes, academic_notes, behavior_notes, profile_image, financial_status, fees_amount, discount_amount, discount_reason, file_opening_fee, advance_payment, total_after_discount, payment_method, installments_count, installment_amount, created_at, updated_at, classrooms(id, name)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching student:', error);
        return { data: null, error };
      }

      if (!data) {
        return { data: null, error: 'Student not found' };
      }

      // تنسيق البيانات الأساسية
      const formattedData = {
        ...data,
        classroom_name: data.classrooms?.name
      } as Student;

      // جلب بيانات الأقساط إذا كان الطالب يدفع بالأقساط
      if (data.payment_method === 'installments') {
        try {
          // جلب الأقساط
          const { data: installmentsData, error: installmentsError } = await installmentService.getStudentInstallments(id);

          if (installmentsError) {
            console.error('Error fetching installments:', installmentsError);
          } else if (installmentsData && installmentsData.length > 0) {
            // إضافة بيانات الأقساط إلى بيانات الطالب
            formattedData.installments_data = installmentsData;
            console.log(`Loaded ${installmentsData.length} installments for student ${id}`);
          }
        } catch (installmentsError) {
          console.error('Error fetching installments:', installmentsError);
        }
      }

      // جلب سجلات المدفوعات لجميع الطلاب
      try {
        // جلب سجلات المدفوعات
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('student_id', id)
          .order('payment_date', { ascending: false });

        if (paymentsError) {
          console.error('Error fetching payment records:', paymentsError);
        } else if (paymentsData && paymentsData.length > 0) {
          // إضافة سجلات المدفوعات إلى بيانات الطالب
          formattedData.payments = paymentsData;
          console.log(`Loaded ${paymentsData.length} payment records for student ${id}`);
        }
      } catch (paymentsError) {
        console.error('Error fetching payment records:', paymentsError);
      }

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error fetching student:', error);
      return { data: null, error };
    }
  },

  /**
   * إنشاء طالب جديد
   */
  async createStudent(student: CreateStudentInput): Promise<{ data: Student | null; error: any }> {
    try {
      // تأكد من وجود الاسم الكامل
      if (!student.full_name) {
        return {
          data: null,
          error: { message: 'الاسم الكامل مطلوب' }
        };
      }

      // طباعة بيانات الطالب للتشخيص
      console.log('Creating student with data:', JSON.stringify(student));

      // تحضير البيانات للإدراج (إزالة الحقول غير الضرورية أو تحويلها)
      // نقوم بإنشاء كائن جديد فقط بالحقول التي نحتاجها
      const studentData: any = {
        full_name: student.full_name,
        gender: student.gender,
        status: student.status,
        grade_level: student.grade_level ? Number(student.grade_level) : null,
        // التأكد من أن التواريخ بالتنسيق الصحيح
        birth_date: student.birth_date ? new Date(student.birth_date).toISOString().split('T')[0] : null,
        enrollment_date: student.enrollment_date ? new Date(student.enrollment_date).toISOString().split('T')[0] : null,
      };

      // إضافة الحقول الاختيارية فقط إذا كانت موجودة
      if (student.national_id) studentData.national_id = student.national_id;
      if (student.religion) studentData.religion = student.religion;
      if (student.address) studentData.address = student.address;
      if (student.phone) studentData.phone = student.phone;
      if (student.email) studentData.email = student.email;
      if (student.classroom_id) studentData.classroom_id = student.classroom_id;
      if (student.parent_name) studentData.parent_name = student.parent_name;
      if (student.parent_phone) studentData.parent_phone = student.parent_phone;
      if (student.parent_phone2) studentData.parent_phone2 = student.parent_phone2;
      if (student.parent_email) studentData.parent_email = student.parent_email;
      if (student.parent_job) studentData.parent_job = student.parent_job;
      if (student.parent_relation) studentData.parent_relation = student.parent_relation;
      if (student.health_notes) studentData.health_notes = student.health_notes;
      if (student.academic_notes) studentData.academic_notes = student.academic_notes;
      if (student.behavior_notes) studentData.behavior_notes = student.behavior_notes;

      // إضافة الحقول المالية فقط إذا كانت موجودة وليست null
      if (student.fees_amount !== null && student.fees_amount !== undefined) {
        studentData.fees_amount = Number(student.fees_amount);
      }

      if (student.discount_amount !== null && student.discount_amount !== undefined) {
        studentData.discount_amount = Number(student.discount_amount);
      }

      if (student.discount_reason) {
        studentData.discount_reason = student.discount_reason;
      }

      if (student.payment_method) {
        studentData.payment_method = student.payment_method;
      }

      if (student.file_opening_fee !== null && student.file_opening_fee !== undefined) {
        studentData.file_opening_fee = Number(student.file_opening_fee);
      }

      if (student.advance_payment !== null && student.advance_payment !== undefined) {
        studentData.advance_payment = Number(student.advance_payment);
      }

      if (student.total_after_discount !== null && student.total_after_discount !== undefined) {
        studentData.total_after_discount = Number(student.total_after_discount);
      }

      if (student.installments_count !== null && student.installments_count !== undefined) {
        studentData.installments_count = Number(student.installments_count);
      }

      if (student.installment_amount !== null && student.installment_amount !== undefined) {
        studentData.installment_amount = Number(student.installment_amount);
      }

      if (student.installments_data && Array.isArray(student.installments_data) && student.installments_data.length > 0) {
        studentData.installments_data = student.installments_data;
      }

      console.log('Prepared student data for insertion:', JSON.stringify(studentData));

      // إدراج البيانات في قاعدة البيانات
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select('*, classrooms(name)')
        .single();

      // إذا كانت هناك دفعة مقدمة، قم بإنشاء سجل دفع
      if (data && !error && student.advance_payment && student.advance_payment > 0) {
        try {
          const paymentRecord = {
            student_id: data.id,
            amount: Number(student.advance_payment),
            payment_date: new Date().toISOString(),
            payment_type: 'advance_payment',
            payment_method: 'cash',
            notes: 'دفعة مقدمة عند التسجيل'
          };

          const { error: paymentError } = await supabase
            .from('payment_records')
            .insert([paymentRecord]);

          if (paymentError) {
            console.error('Error creating payment record:', paymentError);
          } else {
            console.log('Payment record created successfully');
          }
        } catch (paymentError) {
          console.error('Error creating payment record:', paymentError);
        }
      }

      if (error) {
        console.error('Error inserting student:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        return { data: null, error };
      }

      console.log('Student created successfully:', data);

      // إذا كان الطالب يدفع بالأقساط وتوجد بيانات أقساط، قم بحفظها
      if (data && student.payment_method === 'installments' && student.installments_data && Array.isArray(student.installments_data) && student.installments_data.length > 0) {
        try {
          // تحديث الأقساط
          const { success, error: installmentsError } = await installmentService.updateStudentInstallments(data.id, student.installments_data);

          if (!success) {
            console.error('Error creating installments:', installmentsError);
          } else {
            console.log('Installments created successfully');

            // تحديث الحالة المالية للطالب
            await installmentService.updateStudentFinancialStatus(data.id);
          }
        } catch (installmentsError) {
          console.error('Error creating installments:', installmentsError);
        }
      }

      // تنسيق البيانات المسترجعة
      const formattedData = {
        ...data,
        classroom_name: data.classrooms?.name
      } as Student;

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return { data: null, error };
    }
  },

  /**
   * تحديث بيانات طالب
   */
  async updateStudent(student: UpdateStudentInput): Promise<{ data: Student | null; error: any }> {
    try {
      console.log('Updating student with data:', JSON.stringify(student));
      const { id, ...updateData } = student;

      // تحضير البيانات للتحديث (تحويل القيم الرقمية)
      const studentData: any = { ...updateData };

      // تحويل القيم الرقمية
      if (studentData.fees_amount !== null && studentData.fees_amount !== undefined) {
        studentData.fees_amount = Number(studentData.fees_amount);
      }

      if (studentData.discount_amount !== null && studentData.discount_amount !== undefined) {
        studentData.discount_amount = Number(studentData.discount_amount);
      }

      if (studentData.file_opening_fee !== null && studentData.file_opening_fee !== undefined) {
        studentData.file_opening_fee = Number(studentData.file_opening_fee);
      }

      if (studentData.advance_payment !== null && studentData.advance_payment !== undefined) {
        studentData.advance_payment = Number(studentData.advance_payment);
      }

      if (studentData.total_after_discount !== null && studentData.total_after_discount !== undefined) {
        studentData.total_after_discount = Number(studentData.total_after_discount);
      }

      if (studentData.installments_count !== null && studentData.installments_count !== undefined) {
        studentData.installments_count = Number(studentData.installments_count);
      }

      if (studentData.installment_amount !== null && studentData.installment_amount !== undefined) {
        studentData.installment_amount = Number(studentData.installment_amount);
      }

      // حفظ بيانات الأقساط قبل حذفها من البيانات المرسلة إلى جدول الطلاب
      const installmentsData = studentData.installments_data;

      // حذف بيانات الأقساط من البيانات المرسلة إلى جدول الطلاب
      // لأننا سنخزنها في جدول منفصل
      delete studentData.installments_data;

      console.log('Prepared student data for update:', JSON.stringify(studentData));

      // تحديث البيانات في قاعدة البيانات
      const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', id)
        .select('*, classrooms(id, name)')
        .single();

      // إذا كانت هناك دفعة مقدمة، قم بإنشاء سجل دفع
      if (data && !error && studentData.advance_payment && studentData.advance_payment > 0) {
        try {
          const paymentRecord = {
            student_id: id,
            amount: Number(studentData.advance_payment),
            payment_date: new Date().toISOString(),
            payment_type: 'advance_payment',
            payment_method: 'cash',
            notes: 'دفعة مقدمة إضافية'
          };

          const { error: paymentError } = await supabase
            .from('payment_records')
            .insert([paymentRecord]);

          if (paymentError) {
            console.error('Error creating payment record:', paymentError);
          } else {
            console.log('Payment record created successfully');
          }
        } catch (paymentError) {
          console.error('Error creating payment record:', paymentError);
        }
      }

      if (error) {
        console.error('Error updating student:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        return { data: null, error };
      }

      console.log('Student updated successfully:', data);

      // تحديث الأقساط إذا كانت موجودة
      if (installmentsData && Array.isArray(installmentsData) && installmentsData.length > 0) {
        try {
          // تحديث الأقساط
          const { success, error: installmentsError } = await installmentService.updateStudentInstallments(id, installmentsData);

          if (!success) {
            console.error('Error updating installments:', installmentsError);
          } else {
            console.log('Installments updated successfully');

            // تحديث الحالة المالية للطالب
            await installmentService.updateStudentFinancialStatus(id);
          }
        } catch (installmentsError) {
          console.error('Error updating installments:', installmentsError);
        }
      }

      // تنسيق البيانات المسترجعة
      const formattedData = {
        ...data,
        classroom_name: data.classrooms?.name,
        installments_data: installmentsData
      } as Student;

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error updating student:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return { data: null, error };
    }
  },

  /**
   * حذف طالب
   */
  async deleteStudent(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      return { success: !error, error };
    } catch (error) {
      console.error('Error deleting student:', error);
      return { success: false, error };
    }
  },

  /**
   * تحميل صورة الطالب
   */
  async uploadStudentImage(file: File, studentId: string): Promise<{ url: string | null; error: any }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { data, error } = await supabase.storage
        .from('student-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('student-images')
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading student image:', error);
      return { url: null, error };
    }
  },

  /**
   * الحصول على قائمة الفصول الدراسية
   * @deprecated استخدم classroomService.getClassrooms بدلاً من ذلك
   */
  async getClassrooms(gradeLevel?: number, stageId?: string): Promise<{ data: any[] | null; error: any }> {
    try {
      let query = supabase
        .from('classrooms')
        .select('*, stages(id, name)')
        .eq('status', 'active');

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data, error } = await query.order('name');

      // تنسيق البيانات
      const formattedData = data?.map(classroom => ({
        ...classroom,
        stage_name: classroom.stages?.name
      }));

      return { data: formattedData, error };
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث الفصل الدراسي للطالب
   */
  async updateStudentClassroom(studentId: string, classroomId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('students')
        .update({ classroom_id: classroomId })
        .eq('id', studentId);

      if (error) {
        console.error('Error updating student classroom:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating student classroom:', error);
      return { success: false, error };
    }
  },

  /**
   * الحصول على إحصائيات الطلاب
   */
  async getStudentsStatistics(): Promise<{
    totalStudents: number;
    maleStudents: number;
    femaleStudents: number;
    religionStats: { [key: string]: number };
    secondLanguageStats: { [key: string]: number };
    error: any;
  }> {
    try {
      // إجمالي عدد الطلاب
      const { count: totalStudents, error: totalError } = await supabase
        .from('students')
        .select('id', { count: 'exact' });

      if (totalError) {
        throw totalError;
      }

      // عدد الطلاب الذكور
      const { count: maleStudents, error: maleError } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('gender', 'male');

      if (maleError) {
        throw maleError;
      }

      // عدد الطالبات الإناث
      const { count: femaleStudents, error: femaleError } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('gender', 'female');

      if (femaleError) {
        throw femaleError;
      }

      // إحصائيات الديانة
      const { data: religionData, error: religionError } = await supabase
        .from('students')
        .select('religion');

      if (religionError) {
        throw religionError;
      }

      const religionStats: { [key: string]: number } = {};
      religionData.forEach(student => {
        const religion = student.religion || 'غير محدد';
        religionStats[religion] = (religionStats[religion] || 0) + 1;
      });

      // إحصائيات اللغة الثانية
      const { data: languageData, error: languageError } = await supabase
        .from('students')
        .select('second_language');

      if (languageError) {
        throw languageError;
      }

      const secondLanguageStats: { [key: string]: number } = {};
      languageData.forEach(student => {
        const language = student.second_language || 'غير محدد';
        secondLanguageStats[language] = (secondLanguageStats[language] || 0) + 1;
      });

      return {
        totalStudents: totalStudents || 0,
        maleStudents: maleStudents || 0,
        femaleStudents: femaleStudents || 0,
        religionStats,
        secondLanguageStats,
        error: null
      };
    } catch (error) {
      console.error('Error fetching students statistics:', error);
      return {
        totalStudents: 0,
        maleStudents: 0,
        femaleStudents: 0,
        religionStats: {},
        secondLanguageStats: {},
        error
      };
    }
  }
};

export default studentService;
