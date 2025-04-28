'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StudentImportExport from '@/components/students/StudentImportExport';
import { Student } from '@/types/student';
import studentService from '@/services/studentService';
import studentImportService from '@/services/studentImportService';
import Spinner from '@/components/ui/Spinner';
import { showToast } from '@/components/ui/ToastContainer';

export default function ImportExportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل بيانات الطلاب
  useEffect(() => {
    loadStudents();
  }, []);

  // تحميل بيانات الطلاب من الخادم
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await studentService.getStudents({ limit: 1000 });

      if (error) {
        console.error('Error loading students:', error);
        return;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة استيراد البيانات
  const handleImport = async (data: any[], batchSize: number = 10) => {
    if (!data || data.length === 0) {
      showToast('لا توجد بيانات للاستيراد', 'error');
      return;
    }

    // إظهار مؤشر التحميل
    setIsLoading(true);
    showToast(`جاري استيراد ${data.length} سجل إلى قاعدة البيانات على دفعات من ${batchSize} سجل...`, 'info');

    // إضافة تأخير قصير لتجنب مشاكل التزامن في المتصفح
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // استخدام Promise.race مع مهلة زمنية لتجنب مشكلة "Unchecked runtime.lastError"
      const importPromise = studentImportService.importStudents(data, batchSize);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('استغرقت عملية الاستيراد وقتاً طويلاً')), 120000); // 2 دقيقة كحد أقصى
      });

      // استدعاء خدمة استيراد البيانات مع مهلة زمنية
      const result = await Promise.race([importPromise, timeoutPromise]) as any;

      if (result.success) {
        // عرض رسالة نجاح
        let successMessage = `تم استيراد البيانات بنجاح:
          - تمت إضافة ${result.addedCount} طالب جديد
          - تم تحديث ${result.updatedCount} طالب موجود
          ${result.errorCount > 0 ? `- فشل استيراد ${result.errorCount} طالب` : ''}`;

        // إضافة معلومات عن زمن الاستجابة والدفعات إذا كانت متاحة
        if (result.networkLatency) {
          successMessage += `\nاستغرقت العملية ${(result.networkLatency / 1000).toFixed(2)} ثانية`;
        }

        if (result.batches) {
          successMessage += `\nتم معالجة ${result.batches} دفعة من البيانات`;
        }

        showToast(successMessage, 'success');

        // إعادة تحميل البيانات
        await loadStudents();

        // عرض تفاصيل الأخطاء إذا وجدت
        if (result.errorCount > 0) {
          console.error('Import errors:', result.errors);

          // عرض أول 3 أخطاء فقط لتجنب رسائل طويلة جدًا
          const errorMessages = result.errors.slice(0, 3).map((err, index) => {
            const studentName = err.student?.full_name || 'طالب غير معروف';
            let errorMsg = `${index + 1}. ${studentName}: ${err.message}`;

            // إضافة معلومات عن مشاكل الاتصال إذا كانت متاحة
            if (err.connectionRelated) {
              errorMsg += ' (مشكلة في الاتصال)';
            }

            return errorMsg;
          }).join('\n');

          const moreErrors = result.errors.length > 3 ? `\n... و${result.errors.length - 3} أخطاء أخرى` : '';

          let warningMessage = `حدثت بعض الأخطاء أثناء الاستيراد:\n${errorMessages}${moreErrors}`;

          // إضافة نصائح إذا كانت هناك مشاكل في الاتصال
          if (result.connectionIssues) {
            warningMessage += '\n\nنصائح: تأكد من استقرار الاتصال بالإنترنت، وحاول استيراد عدد أقل من الطلاب في كل مرة.';
          }

          showToast(warningMessage, 'warning');
        }
      } else {
        console.error('Import errors:', result.errors);

        // عرض تفاصيل الخطأ الأول
        const firstError = result.errors[0];
        const errorMessage = firstError?.message || 'خطأ غير معروف';
        const errorDetails = firstError?.error?.message ? `\nالتفاصيل: ${firstError.error.message}` : '';

        let fullErrorMessage = `حدث خطأ أثناء استيراد البيانات: ${errorMessage}${errorDetails}`;

        // إضافة معلومات عن مشاكل الاتصال
        if (result.connectionIssues || firstError?.connectionRelated) {
          fullErrorMessage += '\n\nيبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.';
          fullErrorMessage += '\nنصائح: حاول استيراد عدد أقل من الطلاب في كل مرة، وتأكد من استقرار الاتصال بالإنترنت.';
        }

        showToast(fullErrorMessage, 'error');
      }
    } catch (error) {
      console.error('Error importing students:', error);

      let errorMessage = 'حدث خطأ أثناء استيراد البيانات';

      // تحقق من نوع الخطأ وإضافة معلومات أكثر تفصيلاً
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        errorMessage += `: ${error.message}`;

        // تحقق مما إذا كان الخطأ متعلقاً بالاتصال
        if (
          error.name === 'NetworkError' ||
          error.name === 'TimeoutError' ||
          error.name === 'AbortError' ||
          error.message.includes('network') ||
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('abort') ||
          error.message.includes('Unchecked runtime.lastError') ||
          !navigator.onLine
        ) {
          errorMessage += '\n\nيبدو أن هناك مشكلة في الاتصال بالإنترنت أو تم إلغاء العملية. يرجى التحقق من اتصالك والمحاولة مرة أخرى.';
          errorMessage += '\nنصائح: حاول استيراد عدد أقل من الطلاب في كل مرة، وتأكد من استقرار الاتصال بالإنترنت.';

          // إضافة نصائح خاصة بمشكلة Unchecked runtime.lastError
          if (error.message.includes('Unchecked runtime.lastError')) {
            errorMessage += '\n\nملاحظة: خطأ "Unchecked runtime.lastError" قد يكون بسبب امتدادات المتصفح. حاول تعطيل الامتدادات أو استخدام متصفح آخر.';
          }
        }
      }

      // إضافة معلومات عن حالة الاتصال
      errorMessage += `\n\nحالة الاتصال: ${navigator.onLine ? 'متصل' : 'غير متصل'}`;

      // إضافة معلومات عن المتصفح
      errorMessage += `\nالمتصفح: ${navigator.userAgent}`;

      showToast(errorMessage, 'error');

      // محاولة إعادة تحميل البيانات بعد فترة
      setTimeout(() => {
        loadStudents();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">استيراد وتصدير بيانات الطلاب</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            قم باستيراد بيانات الطلاب من ملف Excel أو تصدير البيانات الحالية
          </p>
        </div>

        <StudentImportExport
          students={students}
          onImport={handleImport}
        />

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">تعليمات الاستيراد</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">تنسيق الملف</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                يجب أن يكون الملف بتنسيق Excel (.xlsx أو .xls) ويحتوي على الأعمدة التالية:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400 mr-4">
                <li>الاسم الرباعي (مطلوب): الاسم الكامل للطالب</li>
                <li>الجنس (مطلوب): ذكر أو أنثى</li>
                <li>تاريخ الميلاد (مطلوب): بتنسيق YYYY-MM-DD</li>
                <li>الرقم القومي: يستخدم للتحقق من وجود الطالب مسبقاً</li>
                <li>الديانة</li>
                <li>العنوان</li>
                <li>رقم الهاتف</li>
                <li>البريد الإلكتروني</li>
                <li>المستوى الدراسي (مطلوب): رقم من 1 إلى 12</li>
                <li>الفصل: اسم الفصل مثل 5A أو 6B</li>
                <li>تاريخ التسجيل (مطلوب): بتنسيق YYYY-MM-DD</li>
                <li>الحالة (مطلوب): نشط، غير نشط، متخرج، منقول</li>
                <li>اسم ولي الأمر</li>
                <li>هاتف ولي الأمر</li>
                <li>هاتف ولي الأمر 2</li>
                <li>بريد ولي الأمر</li>
                <li>وظيفة ولي الأمر</li>
                <li>صلة القرابة</li>
                <li>ملاحظات صحية</li>
                <li>ملاحظات أكاديمية</li>
                <li>ملاحظات سلوكية</li>
                <li>الرسوم الدراسية: القيمة بالجنيه المصري</li>
                <li>قيمة الخصم: القيمة بالجنيه المصري</li>
                <li>سبب الخصم</li>
                <li>رسوم فتح الملف: القيمة بالجنيه المصري (الافتراضي 300)</li>
                <li>الدفعة المقدمة: القيمة بالجنيه المصري</li>
                <li>طريقة الدفع: دفعة واحدة أو أقساط</li>
                <li>عدد الأقساط: في حالة الدفع بالأقساط</li>
                <li>قيمة القسط: القيمة بالجنيه المصري</li>
                <li>الحالة المالية: مسدد، جزئي، غير مسدد</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">ملاحظات هامة</h3>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400 mr-4">
                <li>تأكد من أن الملف يحتوي على جميع الحقول المطلوبة</li>
                <li>سيتم التحقق من صحة البيانات قبل استيرادها</li>
                <li>في حالة وجود طالب بنفس الرقم القومي، سيتم تحديث بياناته بدلاً من إضافته مرة أخرى</li>
                <li>يمكنك تنزيل نموذج فارغ للملف من خلال زر "تنزيل نموذج فارغ"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-amber-600">نصائح لتجنب مشاكل الاتصال</h3>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400 mr-4">
                <li>تأكد من استقرار اتصالك بالإنترنت قبل بدء عملية الاستيراد</li>
                <li>قم باستيراد عدد قليل من الطلاب في كل مرة (10-20 طالب) لتجنب انقطاع الاتصال</li>
                <li>إذا واجهت خطأ "Unchecked runtime.lastError"، فهذا يشير إلى مشكلة في الاتصال وليس في البيانات نفسها</li>
                <li>في حالة ظهور أخطاء متعلقة بالاتصال، انتظر قليلاً ثم حاول مرة أخرى</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
