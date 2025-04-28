import { supabase } from '@/lib/supabase';
import { Student, InstallmentData } from '@/types/student';
import { GRADE_FEES, FILE_OPENING_FEE } from '@/types/student';

/**
 * إنشاء أقساط للطالب
 * @param studentId معرف الطالب
 * @param installmentsCount عدد الأقساط
 * @param installmentAmount قيمة القسط
 * @param totalAmount إجمالي المبلغ
 */
async function createInstallmentsForStudent(
  studentId: string,
  installmentsCount: number,
  installmentAmount: number,
  totalAmount: number
): Promise<void> {
  console.log(`Creating ${installmentsCount} installments for student ${studentId}`);

  try {
    // إنشاء مصفوفة الأقساط
    const installments: Partial<InstallmentData>[] = [];
    let remainingBalance = totalAmount;

    // تاريخ اليوم
    const today = new Date();

    for (let i = 1; i <= installmentsCount; i++) {
      // حساب تاريخ استحقاق القسط (شهر واحد لكل قسط)
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + i);

      // حساب الرصيد المتبقي بعد هذا القسط
      remainingBalance -= installmentAmount;
      if (i === installmentsCount) {
        // التأكد من أن القسط الأخير يغطي المبلغ المتبقي بالضبط
        remainingBalance = 0;
      }

      // إضافة القسط إلى المصفوفة
      installments.push({
        student_id: studentId,
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        remaining_balance: Math.max(0, remainingBalance),
        status: 'unpaid'
      });
    }

    // حفظ الأقساط في قاعدة البيانات
    if (installments.length > 0) {
      const { error } = await supabase
        .from('installments')
        .insert(installments);

      if (error) {
        console.error('Error inserting installments:', error);
        throw error;
      }

      console.log(`Successfully created ${installments.length} installments for student ${studentId}`);

      // تحديث الحالة المالية للطالب
      await updateStudentFinancialStatus(studentId);
    }
  } catch (error) {
    console.error(`Error creating installments for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * إنشاء سجل دفع للطالب
 * @param studentId معرف الطالب
 * @param amount المبلغ
 * @param paymentType نوع الدفع
 * @param notes ملاحظات
 */
async function createPaymentRecord(
  studentId: string,
  amount: number,
  paymentType: 'advance_payment' | 'installment' | 'other',
  notes: string = ''
): Promise<void> {
  console.log(`Creating payment record for student ${studentId}: ${amount} EGP (${paymentType})`);

  try {
    const paymentRecord = {
      student_id: studentId,
      amount: Number(amount),
      payment_date: new Date().toISOString(),
      payment_type: paymentType,
      payment_method: 'cash', // الافتراضي هو الدفع النقدي
      notes: notes
    };

    const { error } = await supabase
      .from('payment_records')
      .insert([paymentRecord]);

    if (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }

    console.log(`Successfully created payment record for student ${studentId}`);
  } catch (error) {
    console.error(`Error creating payment record for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * تحديث الحالة المالية للطالب
 * @param studentId معرف الطالب
 */
async function updateStudentFinancialStatus(studentId: string): Promise<void> {
  try {
    // الحصول على أقساط الطالب
    const { data: installments, error: fetchError } = await supabase
      .from('installments')
      .select('*')
      .eq('student_id', studentId);

    if (fetchError) {
      console.error('Error fetching installments for financial status update:', fetchError);
      return;
    }

    // تحديد الحالة المالية
    let financialStatus = 'unpaid';

    if (installments && installments.length > 0) {
      const paidCount = installments.filter(i => i.status === 'paid').length;
      const partialCount = installments.filter(i => i.status === 'partial').length;

      if (paidCount === installments.length) {
        financialStatus = 'paid';
      } else if (paidCount > 0 || partialCount > 0) {
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
    } else {
      console.log(`Updated financial status for student ${studentId} to ${financialStatus}`);
    }
  } catch (error) {
    console.error(`Error updating financial status for student ${studentId}:`, error);
  }
}

/**
 * خدمة استيراد بيانات الطلاب
 */
const studentImportService = {
  /**
   * استيراد بيانات الطلاب من ملف Excel
   * @param data البيانات المستوردة من ملف Excel
   * @param batchSize حجم الدفعة
   * @returns نتيجة عملية الاستيراد
   */
  async importStudents(data: any[], batchSize: number = 10): Promise<{
    success: boolean;
    addedCount: number;
    updatedCount: number;
    errorCount: number;
    errors: any[];
    connectionIssues?: boolean;
    networkLatency?: number;
    batches?: number;
  }> {
    console.log('Starting import process for', data.length, 'records with batch size', batchSize);

    if (!data || data.length === 0) {
      console.warn('No data provided for import');
      return {
        success: false,
        addedCount: 0,
        updatedCount: 0,
        errorCount: 0,
        errors: [{ message: 'لا توجد بيانات للاستيراد' }],
      };
    }

    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];
    let connectionIssues = false;
    const startTime = Date.now();

    // تقسيم البيانات إلى دفعات
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    console.log(`Divided ${data.length} records into ${batches.length} batches of size ${batchSize}`);

    try {
      // معالجة كل دفعة على حدة
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1} of ${batches.length} with ${batch.length} records`);

        // إضافة تأخير بين الدفعات لتجنب مشاكل الاتصال
        if (batchIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // تحويل البيانات إلى تنسيق مناسب لقاعدة البيانات
        const studentsData = await Promise.all(
          batch.map(async (row) => {
            try {
              // استخراج البيانات الأساسية
              // استخدام الاسم الرباعي مباشرة
              const fullName = row['الاسم الرباعي'] || '';

              // التحقق من وجود الاسم
              if (!fullName) {
                throw new Error('الاسم الرباعي مطلوب');
              }

              // استخراج باقي البيانات
              const gender = row['الجنس'] === 'ذكر' ? 'male' : row['الجنس'] === 'أنثى' ? 'female' : null;
              const birthDate = row['تاريخ الميلاد'] || null;
              const nationalId = row['الرقم القومي'] || null;
              const religion = row['الديانة'] === 'الإسلام' ? 'islam' : row['الديانة'] === 'المسيحية' ? 'christianity' : null;
              const secondLanguage = row['اللغة الثانية'] === 'الإنجليزية' ? 'english' :
                                    row['اللغة الثانية'] === 'الفرنسية' ? 'french' :
                                    row['اللغة الثانية'] === 'الألمانية' ? 'german' :
                                    row['اللغة الثانية'] === 'أخرى' ? 'other' : null;
              const address = row['العنوان'] || null;
              const phone = row['رقم الهاتف'] || null;
              const email = row['البريد الإلكتروني'] || null;
              const gradeLevel = parseInt(row['المستوى الدراسي']) || null;
              const classroomId = row['رمز الفصل'] || null;
              const enrollmentDate = row['تاريخ التسجيل'] || new Date().toISOString().split('T')[0];
              const status = row['الحالة'] === 'نشط' ? 'active' :
                            row['الحالة'] === 'غير نشط' ? 'inactive' :
                            row['الحالة'] === 'متخرج' ? 'graduated' :
                            row['الحالة'] === 'منقول' ? 'transferred' :
                            row['الحالة'] === 'متفوق' ? 'excellent' :
                            row['الحالة'] === 'غائب' ? 'absent' : 'active';
              const parentName = row['اسم ولي الأمر'] || null;
              const parentPhone = row['هاتف ولي الأمر'] || null;
              const parentPhone2 = row['هاتف ولي الأمر 2'] || null;
              const parentEmail = row['بريد ولي الأمر'] || null;
              const parentJob = row['وظيفة ولي الأمر'] || null;
              const parentRelation = row['صلة القرابة'] === 'الأب' ? 'father' :
                                    row['صلة القرابة'] === 'الأم' ? 'mother' :
                                    row['صلة القرابة'] === 'الوصي' ? 'guardian' : null;
              const healthNotes = row['ملاحظات صحية'] || null;
              const academicNotes = row['ملاحظات أكاديمية'] || null;
              const behaviorNotes = row['ملاحظات سلوكية'] || null;

              // استخراج البيانات المالية
              const feesAmount = parseFloat(row['الرسوم الدراسية']) || (gradeLevel ? GRADE_FEES[gradeLevel] || 0 : 0);
              const discountAmount = parseFloat(row['قيمة الخصم']) || 0;
              const discountReason = row['سبب الخصم'] || null;
              const fileOpeningFee = parseFloat(row['رسوم فتح الملف']) || FILE_OPENING_FEE;
              const advancePayment = parseFloat(row['الدفعة المقدمة']) || 0;
              const totalAfterDiscount = (feesAmount - discountAmount) + fileOpeningFee;
              const paymentMethod = row['طريقة الدفع'] === 'أقساط' ? 'installments' : 'full';
              const installmentsCount = parseInt(row['عدد الأقساط']) || 0;
              const installmentAmount = installmentsCount > 0 ? totalAfterDiscount / installmentsCount : 0;
              const financialStatus = row['الحالة المالية'] === 'مسدد' ? 'paid' :
                                    row['الحالة المالية'] === 'جزئي' ? 'partial' :
                                    row['الحالة المالية'] === 'غير مسدد' ? 'unpaid' : 'unpaid';

              // التحقق من البيانات الإلزامية
              if (!gender) {
                throw new Error('الجنس مطلوب (ذكر/أنثى)');
              }

              if (!birthDate) {
                throw new Error('تاريخ الميلاد مطلوب');
              }

              if (!gradeLevel) {
                throw new Error('المستوى الدراسي مطلوب');
              }

              // إنشاء كائن بيانات الطالب
              const studentData: Partial<Student> = {
                full_name: fullName,
                gender,
                birth_date: birthDate,
                national_id: nationalId,
                religion,
                second_language: secondLanguage,
                address,
                phone,
                email,
                grade_level: gradeLevel,
                classroom_id: classroomId,
                enrollment_date: enrollmentDate,
                status,
                parent_name: parentName,
                parent_phone: parentPhone,
                parent_phone2: parentPhone2,
                parent_email: parentEmail,
                parent_job: parentJob,
                parent_relation: parentRelation,
                health_notes: healthNotes,
                academic_notes: academicNotes,
                behavior_notes: behaviorNotes,
                financial_status: financialStatus,
                fees_amount: feesAmount,
                discount_amount: discountAmount,
                discount_reason: discountReason,
                file_opening_fee: fileOpeningFee,
                advance_payment: advancePayment,
                total_after_discount: totalAfterDiscount,
                payment_method: paymentMethod,
                installments_count: installmentsCount,
                installment_amount: installmentAmount,
              };

              return { data: studentData, nationalId };
            } catch (error) {
              // إضافة الخطأ إلى قائمة الأخطاء
              errorCount++;
              errors.push({
                student: { full_name: row['الاسم الرباعي'] || 'غير معروف' },
                message: error instanceof Error ? error.message : 'خطأ غير معروف',
                row
              });

              return null;
            }
          })
        );

        // تصفية البيانات الصالحة
        const validStudentsData = studentsData.filter(item => item !== null) as { data: Partial<Student>; nationalId: string | null }[];

        // معالجة كل طالب
        for (const item of validStudentsData) {
          try {
            const { data: studentData, nationalId } = item;

            // التحقق من وجود الطالب بناءً على الرقم القومي أو الاسم
            let existingStudent = null;
            let findError = null;

            // البحث أولاً بالرقم القومي إذا كان متوفراً
            if (nationalId) {
              const result = await supabase
                .from('students')
                .select('id, full_name, national_id')
                .eq('national_id', nationalId)
                .maybeSingle();

              existingStudent = result.data;
              findError = result.error;

              if (findError) {
                console.error('Error finding student by national ID:', findError);
                throw findError;
              }

              // إذا وجدنا طالباً بنفس الرقم القومي، نتحقق من أن الاسم متطابق أو متشابه
              if (existingStudent) {
                console.log(`Found existing student with national ID ${nationalId}: ${existingStudent.full_name}`);

                // إذا كان الاسم مختلفاً تماماً، نسجل تحذيراً
                if (existingStudent.full_name !== studentData.full_name) {
                  console.warn(`Warning: Updating student with different name. Old: ${existingStudent.full_name}, New: ${studentData.full_name}`);

                  // إضافة ملاحظة في الملاحظات الأكاديمية
                  if (!studentData.academic_notes) {
                    studentData.academic_notes = '';
                  }

                  studentData.academic_notes += `\nتم تحديث الاسم من "${existingStudent.full_name}" إلى "${studentData.full_name}" بتاريخ ${new Date().toISOString().split('T')[0]}`;
                }
              }
            }

            // إذا لم نجد الطالب بالرقم القومي، نبحث بالاسم
            if (!existingStudent && studentData.full_name) {
              const result = await supabase
                .from('students')
                .select('id, full_name, national_id')
                .ilike('full_name', studentData.full_name)
                .maybeSingle();

              // إذا وجدنا طالباً بنفس الاسم ولكن بدون رقم قومي أو برقم قومي مختلف
              if (result.data && (!result.data.national_id || (nationalId && result.data.national_id !== nationalId))) {
                console.log(`Found student with same name but different national ID: ${result.data.full_name}`);

                // نضيف ملاحظة في السجل
                if (!studentData.academic_notes) {
                  studentData.academic_notes = '';
                }

                studentData.academic_notes += `\nيوجد طالب آخر بنفس الاسم ولكن برقم قومي مختلف: ${result.data.national_id || 'غير محدد'}`;

                // لا نعتبر هذا تحديثاً، بل إضافة طالب جديد
                existingStudent = null;
              }
            }

            // تحديث أو إضافة الطالب
            if (existingStudent) {
              // تحديث الطالب الموجود
              console.log(`Attempting to update existing student: ${studentData.full_name} (ID: ${existingStudent.id})`);
              console.log('Student data to update:', JSON.stringify(studentData));

              // محاولة تحديث الطالب مع إعادة المحاولة في حالة الفشل
              let updateAttempts = 0;
              let updateSuccess = false;
              let updateError = null;

              while (updateAttempts < 3 && !updateSuccess) {
                updateAttempts++;

                try {
                  const { data: updatedData, error: currentUpdateError } = await supabase
                    .from('students')
                    .update(studentData)
                    .eq('id', existingStudent.id)
                    .select('id, full_name')
                    .single();

                  if (currentUpdateError) {
                    console.error(`Update attempt ${updateAttempts} failed:`, currentUpdateError);
                    updateError = currentUpdateError;

                    // انتظار قبل إعادة المحاولة
                    if (updateAttempts < 3) {
                      await new Promise(resolve => setTimeout(resolve, 1000 * updateAttempts));
                    }
                  } else {
                    updateSuccess = true;
                    console.log(`Successfully updated student: ${studentData.full_name} with ID: ${existingStudent.id}`);

                    // إذا كان هناك دفعة مقدمة، قم بإنشاء سجل دفع
                    if (studentData.advance_payment && studentData.advance_payment > 0) {
                      try {
                        await createPaymentRecord(
                          existingStudent.id,
                          studentData.advance_payment,
                          'advance_payment',
                          'دفعة مقدمة إضافية عند التحديث'
                        );
                      } catch (paymentError) {
                        console.error(`Error creating advance payment record for student ${existingStudent.id}:`, paymentError);
                      }
                    }

                    // إذا كان الطالب يدفع بالأقساط، قم بتحديث الأقساط
                    if (studentData.payment_method === 'installments' &&
                        studentData.installments_count &&
                        studentData.installment_amount) {
                      try {
                        // حذف الأقساط الحالية وإنشاء أقساط جديدة
                        await supabase
                          .from('installments')
                          .delete()
                          .eq('student_id', existingStudent.id);

                        await createInstallmentsForStudent(
                          existingStudent.id,
                          studentData.installments_count,
                          studentData.installment_amount,
                          studentData.total_after_discount || 0
                        );
                      } catch (installmentError) {
                        console.error(`Error updating installments for student ${existingStudent.id}:`, installmentError);
                      }
                    }

                    updatedCount++;
                  }
                } catch (error) {
                  console.error(`Unexpected error during update attempt ${updateAttempts}:`, error);
                  updateError = error;

                  // انتظار قبل إعادة المحاولة
                  if (updateAttempts < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * updateAttempts));
                  }
                }
              }

              if (!updateSuccess) {
                throw updateError || new Error('فشل تحديث الطالب بعد عدة محاولات');
              }

              console.log(`Updated student: ${studentData.full_name} (ID: ${existingStudent.id})`);
            } else {
              // إضافة طالب جديد
              console.log(`Attempting to insert new student: ${studentData.full_name}`);
              console.log('Student data to insert:', JSON.stringify(studentData));

              // محاولة إدراج الطالب مع إعادة المحاولة في حالة الفشل
              let insertAttempts = 0;
              let insertSuccess = false;
              let insertError = null;

              while (insertAttempts < 3 && !insertSuccess) {
                insertAttempts++;

                try {
                  const { data: insertedData, error: currentInsertError } = await supabase
                    .from('students')
                    .insert(studentData)
                    .select('id, full_name')
                    .single();

                  if (currentInsertError) {
                    console.error(`Insert attempt ${insertAttempts} failed:`, currentInsertError);
                    insertError = currentInsertError;

                    // انتظار قبل إعادة المحاولة
                    if (insertAttempts < 3) {
                      await new Promise(resolve => setTimeout(resolve, 1000 * insertAttempts));
                    }
                  } else {
                    insertSuccess = true;
                    console.log(`Successfully inserted student: ${studentData.full_name} with ID: ${insertedData?.id}`);

                    // إذا كان هناك دفعة مقدمة، قم بإنشاء سجل دفع
                    if (studentData.advance_payment && studentData.advance_payment > 0 && insertedData?.id) {
                      try {
                        await createPaymentRecord(
                          insertedData.id,
                          studentData.advance_payment,
                          'advance_payment',
                          'دفعة مقدمة عند التسجيل'
                        );
                      } catch (paymentError) {
                        console.error(`Error creating advance payment record for student ${insertedData.id}:`, paymentError);
                      }
                    }

                    // إذا كان الطالب يدفع بالأقساط، قم بإنشاء الأقساط
                    if (studentData.payment_method === 'installments' &&
                        studentData.installments_count &&
                        studentData.installment_amount &&
                        insertedData?.id) {
                      try {
                        await createInstallmentsForStudent(
                          insertedData.id,
                          studentData.installments_count,
                          studentData.installment_amount,
                          studentData.total_after_discount || 0
                        );
                      } catch (installmentError) {
                        console.error(`Error creating installments for student ${insertedData.id}:`, installmentError);
                      }
                    }

                    addedCount++;
                  }
                } catch (error) {
                  console.error(`Unexpected error during insert attempt ${insertAttempts}:`, error);
                  insertError = error;

                  // انتظار قبل إعادة المحاولة
                  if (insertAttempts < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * insertAttempts));
                  }
                }
              }

              if (!insertSuccess) {
                throw insertError || new Error('فشل إدراج الطالب بعد عدة محاولات');
              }

              console.log(`Added new student: ${studentData.full_name} ${nationalId ? `(National ID: ${nationalId})` : ''}`);
            }
          } catch (error) {
            // إضافة الخطأ إلى قائمة الأخطاء
            errorCount++;
            errors.push({
              student: { full_name: item.data.full_name || 'غير معروف' },
              message: error instanceof Error ? error.message : 'خطأ غير معروف',
              error
            });
          }
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      console.log(`Import process completed in ${totalTime}ms`);
      console.log(`Added: ${addedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);
      console.log(`Processed ${batches.length} batches of size ${batchSize}`);

      // إذا كان الوقت الإجمالي طويلاً جداً، قد يشير ذلك إلى مشاكل في الاتصال
      if (totalTime > 10000 && (data.length < 10)) {
        console.warn(`Import process took unusually long time (${totalTime}ms) for ${data.length} records`);
        connectionIssues = true;
      }

      return {
        success: true,
        addedCount,
        updatedCount,
        errorCount,
        errors,
        connectionIssues,
        networkLatency: totalTime,
        batches: batches.length
      };
    } catch (error) {
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.error('Error importing students:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // تحقق مما إذا كان الخطأ متعلقاً بالاتصال
        if (
          error.name === 'NetworkError' ||
          error.name === 'TimeoutError' ||
          error.message.includes('network') ||
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          !navigator.onLine
        ) {
          connectionIssues = true;
          console.error('Connection issue detected during import process');
        }
      }

      return {
        success: false,
        addedCount,
        updatedCount,
        errorCount: errorCount + 1,
        errors: [...errors, {
          message: 'خطأ عام في استيراد البيانات',
          error,
          connectionRelated: connectionIssues,
          browserOnline: navigator.onLine,
          errorTime: new Date().toISOString()
        }],
        connectionIssues,
        networkLatency: totalTime,
        batches: batches?.length
      };
    }
  }
};

export default studentImportService;
