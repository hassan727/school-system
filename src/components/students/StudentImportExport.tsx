'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Student } from '@/types/student';
import { Stage } from '@/types/stage';
import * as XLSX from 'xlsx';
import excelTemplateService from '@/services/excelTemplateService';
import studentExportService from '@/services/studentExportService';
import { showToast } from '@/components/ui/ToastContainer';
import { stageService } from '@/services/stageService';
import { classroomService } from '@/services/classroomService';

interface StudentImportExportProps {
  students?: Student[];
  onImport?: (data: any[], batchSize?: number) => void;
}

const StudentImportExport: React.FC<StudentImportExportProps> = ({ students = [], onImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [batchSize, setBatchSize] = useState<number>(10);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل المراحل الدراسية
  useEffect(() => {
    loadStages();
  }, []);

  // تحميل الفصول الدراسية عند تغيير المرحلة
  useEffect(() => {
    if (selectedStageId) {
      loadClassrooms(selectedStageId);
    } else {
      setClassrooms([]);
      setSelectedClassroomId('');
    }
  }, [selectedStageId]);

  // تحميل المراحل الدراسية
  const loadStages = async () => {
    setIsLoadingStages(true);
    try {
      const { data, error } = await stageService.getStages();
      if (error) {
        console.error('Error loading stages:', error);
        return;
      }
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
    } finally {
      setIsLoadingStages(false);
    }
  };

  // تحميل الفصول الدراسية
  const loadClassrooms = async (stageId: string) => {
    setIsLoadingClassrooms(true);
    try {
      const { data, error } = await classroomService.getClassrooms(undefined, stageId);
      if (error) {
        console.error('Error loading classrooms:', error);
        return;
      }
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error loading classrooms:', error);
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  // استيراد بيانات الطلاب من ملف Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];

    if (!file) return;

    // التحقق من نوع الملف
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setImportError('يجب أن يكون الملف بتنسيق Excel (.xlsx أو .xls)');
      return;
    }

    setIsImporting(true);
    showToast('جاري قراءة الملف...', 'info');

    try {
      // قراءة الملف
      const data = await new Promise<string | ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result || '');
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
      });

      // تحليل بيانات Excel
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        setImportError('الملف لا يحتوي على بيانات');
        setIsImporting(false);
        return;
      }

      // التحقق من وجود الأعمدة المطلوبة
      const requiredColumns = ['الاسم الرباعي', 'الجنس', 'تاريخ الميلاد', 'المستوى الدراسي', 'تاريخ التسجيل', 'الحالة'];
      const firstRow = json[0] as any;
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));

      if (missingColumns.length > 0) {
        setImportError(`الملف لا يحتوي على الأعمدة المطلوبة التالية: ${missingColumns.join(', ')}`);
        setIsImporting(false);
        return;
      }

      // عرض معلومات عن البيانات التي سيتم استيرادها
      showToast(`تم قراءة ${json.length} سجل من الملف بنجاح`, 'success');

      // تطبيق فلتر المرحلة والفصل إذا تم اختيارهما
      let filteredData = [...json];

      // إذا تم اختيار فصل، نضيف معرف الفصل إلى البيانات
      if (selectedClassroomId) {
        filteredData = filteredData.map(item => ({
          ...item,
          'رمز الفصل': selectedClassroomId
        }));
      }

      // استدعاء دالة الاستيراد
      if (onImport) {
        // عرض رسالة تأكيد
        if (confirm(`هل أنت متأكد من استيراد ${filteredData.length} سجل؟ سيتم معالجة البيانات على دفعات من ${batchSize} سجل.`)) {
          await onImport(filteredData, batchSize);
        } else {
          showToast('تم إلغاء عملية الاستيراد', 'info');
        }
      } else {
        console.log('Imported data:', filteredData);
        showToast('تم قراءة البيانات بنجاح، لكن لم يتم تنفيذ الاستيراد. عدد السجلات: ' + filteredData.length, 'warning');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError('حدث خطأ أثناء استيراد البيانات. تأكد من أن الملف بتنسيق Excel صحيح.');
    } finally {
      setIsImporting(false);
    }
  };

  // تصدير بيانات الطلاب إلى ملف Excel
  const handleExportExcel = async () => {
    if (!students || students.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'error');
      return;
    }

    setIsExporting(true);

    try {
      // فلترة الطلاب حسب المرحلة والفصل
      let filteredStudents = [...students];

      if (selectedStageId && selectedClassroomId) {
        // تصدير طلاب فصل محدد
        filteredStudents = students.filter(student => student.classroom_id === selectedClassroomId);
      } else if (selectedStageId) {
        // تصدير طلاب مرحلة محددة
        filteredStudents = students.filter(student => student.stage_id === selectedStageId);
      }

      // استخدام خدمة تصدير الطلاب
      await studentExportService.exportToExcel(filteredStudents);
      showToast(`تم تصدير ${filteredStudents.length} طالب بنجاح`, 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // تصدير بيانات الطلاب إلى ملف PDF
  const handleExportPDF = async () => {
    if (!students || students.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'error');
      return;
    }

    setIsExportingPDF(true);

    try {
      // فلترة الطلاب حسب المرحلة والفصل
      let filteredStudents = [...students];

      if (selectedStageId && selectedClassroomId) {
        // تصدير طلاب فصل محدد
        filteredStudents = students.filter(student => student.classroom_id === selectedClassroomId);
      } else if (selectedStageId) {
        // تصدير طلاب مرحلة محددة
        filteredStudents = students.filter(student => student.stage_id === selectedStageId);
      }

      // استخدام خدمة تصدير الطلاب
      await studentExportService.exportToPDF(filteredStudents);
      showToast(`تم تصدير ${filteredStudents.length} طالب بنجاح`, 'success');
    } catch (error) {
      console.error('Error exporting data to PDF:', error);
      showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // تنزيل نموذج Excel فارغ
  const handleDownloadTemplate = () => {
    setIsDownloadingTemplate(true);

    try {
      // إنشاء نموذج Excel فارغ
      const blob = excelTemplateService.createStudentImportTemplate();

      // إنشاء رابط تنزيل
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'نموذج_استيراد_الطلاب.xlsx';

      // تنزيل الملف
      document.body.appendChild(a);
      a.click();

      // تنظيف
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('حدث خطأ أثناء تنزيل النموذج');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>استيراد وتصدير بيانات الطلاب</CardTitle>
      </CardHeader>
      <CardContent>
        {/* فلترة حسب المرحلة والفصل */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-3">فلترة حسب المرحلة والفصل</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                المرحلة الدراسية
              </label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                disabled={isLoadingStages}
              >
                <option value="">اختر المرحلة الدراسية</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الفصل الدراسي
              </label>
              <select
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                disabled={!selectedStageId || isLoadingClassrooms}
              >
                <option value="">اختر الفصل الدراسي</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                حجم الدفعة للاستيراد
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
              >
                <option value="5">5 طلاب في الدفعة</option>
                <option value="10">10 طلاب في الدفعة</option>
                <option value="20">20 طالب في الدفعة</option>
                <option value="50">50 طالب في الدفعة</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                تقسيم البيانات إلى دفعات أصغر يساعد في تجنب مشاكل الاتصال
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">استيراد البيانات</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              قم بتحميل ملف Excel يحتوي على بيانات الطلاب. يجب أن يحتوي الملف على الأعمدة المطلوبة.
              {selectedClassroomId && (
                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                  سيتم تعيين الفصل الدراسي تلقائياً للطلاب المستوردين.
                </span>
              )}
            </p>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="file"
                  id="import-file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleImport}
                  disabled={isImporting}
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  type="button"
                  isLoading={isImporting}
                  disabled={isImporting}
                  onClick={() => {
                    // فتح مربع حوار اختيار الملف عند النقر على الزر
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  اختيار ملف
                </Button>
                <span className="text-sm text-gray-500">
                  {isImporting ? 'جاري الاستيراد...' : 'اختر ملف Excel'}
                </span>
              </div>

              <div>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleDownloadTemplate}
                  isLoading={isDownloadingTemplate}
                  disabled={isDownloadingTemplate}
                  className="text-sm"
                >
                  <span className="ml-1">📥</span>
                  تنزيل نموذج فارغ
                </Button>
                <p className="mt-1 text-xs text-gray-500">
                  يمكنك تنزيل نموذج فارغ لملء البيانات وتحميله مرة أخرى
                </p>
              </div>

              {importError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                  {importError}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">تصدير البيانات</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              قم بتصدير بيانات الطلاب إلى ملف Excel أو PDF.
              {(selectedStageId || selectedClassroomId) && (
                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                  سيتم تصدير الطلاب {selectedClassroomId ? 'في الفصل المحدد' : 'في المرحلة المحددة'} فقط.
                </span>
              )}
            </p>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                isLoading={isExporting}
                disabled={isExporting || students.length === 0}
              >
                تصدير Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                isLoading={isExportingPDF}
                disabled={isExportingPDF || students.length === 0}
              >
                تصدير PDF
              </Button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي عدد الطلاب: <span className="font-bold">{students.length}</span>
                {selectedStageId && selectedClassroomId && (
                  <span className="mr-4">
                    عدد طلاب الفصل المحدد: <span className="font-bold">
                      {students.filter(s => s.classroom_id === selectedClassroomId).length}
                    </span>
                  </span>
                )}
                {selectedStageId && !selectedClassroomId && (
                  <span className="mr-4">
                    عدد طلاب المرحلة المحددة: <span className="font-bold">
                      {students.filter(s => (s as any).stage_id === selectedStageId ||
                        (s.classrooms && (s.classrooms as any).stage_id === selectedStageId)).length}
                    </span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentImportExport;
