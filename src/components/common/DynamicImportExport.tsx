'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { showToast } from '@/components/ui/ToastContainer';
import { dynamicImportService, ExcelAnalysisResult } from '@/services/dynamicImportService';
import { ColumnMapping } from '@/services/schemaService';
import { Spinner } from '@/components/ui/Spinner';

interface DynamicImportExportProps {
  tableName: string;
  identifierColumn?: string;
  onImportComplete?: (result: any) => void;
}

export function DynamicImportExport({
  tableName,
  identifierColumn = '',
  onImportComplete
}: DynamicImportExportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExcelAnalysisResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [activeTab, setActiveTab] = useState('mapping');
  const [importError, setImportError] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحديث التخطيط عند تغيير نتيجة التحليل
  useEffect(() => {
    if (analysisResult) {
      setMapping(analysisResult.mapping);
      // تعيين التبويب النشط إلى "تخطيط الأعمدة" عند تحليل الملف
      setActiveTab('mapping');
    }
  }, [analysisResult]);

  // معالجة اختيار الملف
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    await analyzeFile(selectedFile);
  };

  // تحليل الملف
  const analyzeFile = async (selectedFile: File) => {
    setIsAnalyzing(true);
    showToast('جاري تحليل الملف...', 'info');

    try {
      console.log(`Analyzing file: ${selectedFile.name}`);
      const result = await dynamicImportService.analyzeExcelFile(selectedFile, tableName);
      console.log('Analysis result:', result);

      if (result && result.headers) {
        // إنشاء تخطيط أولي للأعمدة - تخطيط تلقائي لجميع الأعمدة
        const initialMapping = result.headers.map((header, index) => {
          // تحويل اسم العمود إلى اسم عمود في قاعدة البيانات
          let dbColumn = header.toLowerCase().replace(/\s+/g, '_');
          let dataType = 'text';

          // تعيين أسماء الأعمدة المعروفة
          if (header.toLowerCase().includes('name') || header.toLowerCase().includes('اسم')) {
            dbColumn = 'full_name';
          } else if (header.toLowerCase().includes('national_id') || header.toLowerCase().includes('رقم قومي')) {
            dbColumn = 'national_id';
          } else if (header.toLowerCase().includes('gender') || header.toLowerCase().includes('جنس')) {
            dbColumn = 'gender';
          } else if (header.toLowerCase().includes('birth') || header.toLowerCase().includes('ميلاد')) {
            dbColumn = 'birth_date';
            dataType = 'date';
          } else if (header.toLowerCase().includes('grade') || header.toLowerCase().includes('صف')) {
            dbColumn = 'grade_level';
            dataType = 'integer';
          } else if (header.toLowerCase().includes('enrollment') || header.toLowerCase().includes('التحاق')) {
            dbColumn = 'enrollment_date';
            dataType = 'date';
          } else if (header.toLowerCase().includes('status') || header.toLowerCase().includes('حالة')) {
            dbColumn = 'status';
          } else if (header.toLowerCase().includes('phone') || header.toLowerCase().includes('هاتف')) {
            if (header.toLowerCase().includes('parent') || header.toLowerCase().includes('ولي')) {
              dbColumn = 'parent_phone';
            } else {
              dbColumn = 'phone';
            }
          } else if (header.toLowerCase().includes('parent') || header.toLowerCase().includes('ولي')) {
            dbColumn = 'parent_name';
          } else if (header.toLowerCase().includes('email') || header.toLowerCase().includes('بريد')) {
            dbColumn = 'email';
          } else if (header.toLowerCase().includes('religion') || header.toLowerCase().includes('ديانة')) {
            dbColumn = 'religion';
          } else if (header.toLowerCase().includes('language') || header.toLowerCase().includes('لغة')) {
            dbColumn = 'second_language';
          } else if (header.toLowerCase().includes('address') || header.toLowerCase().includes('عنوان')) {
            dbColumn = 'address';
          }

          // تحديد ما إذا كان الحقل مطلوبًا
          const isRequired = ['full_name', 'national_id'].includes(dbColumn);

          return {
            excelColumn: header,
            dbColumn: dbColumn,
            dataType: dataType,
            isRequired: isRequired,
            defaultValue: null
          };
        });

        console.log('Initial mapping created:', initialMapping);
        setMapping(initialMapping);
        setAnalysisResult(result);

        // تعيين التبويب النشط إلى "تخطيط الأعمدة" بعد تحليل الملف
        setActiveTab('mapping');

        if (result.missingRequiredColumns && result.missingRequiredColumns.length > 0) {
          showToast(`هناك أعمدة مطلوبة مفقودة: ${result.missingRequiredColumns.join(', ')}`, 'warning');
        }

        if (result.newColumns && result.newColumns.length > 0) {
          showToast(`سيتم إضافة أعمدة جديدة: ${result.newColumns.join(', ')}`, 'info');
        }
      } else {
        setImportError('لم يتم العثور على بيانات صالحة في الملف');
        showToast('لم يتم العثور على بيانات صالحة في الملف', 'error');
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      setImportError('حدث خطأ أثناء تحليل الملف: ' + (error instanceof Error ? error.message : String(error)));
      showToast('حدث خطأ أثناء تحليل الملف', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // تحديث تخطيط العمود
  const updateMapping = (index: number, field: keyof ColumnMapping, value: any) => {
    try {
      // التحقق من صحة المعلمات
      if (index < 0 || index >= mapping.length) {
        console.error(`Invalid mapping index: ${index}`);
        return;
      }

      // التحقق من قيمة dbColumn
      if (field === 'dbColumn' && (value === undefined || value === null)) {
        value = ''; // استخدام سلسلة فارغة بدلاً من undefined أو null
      }

      const newMapping = [...mapping];
      newMapping[index] = { ...newMapping[index], [field]: value };
      setMapping(newMapping);

      console.log(`Updated mapping at index ${index}, field ${field} to:`, value);
    } catch (error) {
      console.error('Error updating mapping:', error);
    }
  };

  // استيراد البيانات
  const handleImport = async () => {
    if (!file || !analysisResult) {
      showToast('يرجى اختيار ملف وتحليله أولاً', 'error');
      return;
    }

    // التحقق من وجود تخطيط صالح للأعمدة
    const validMappings = mapping.filter(m => m.dbColumn && m.dbColumn.trim() !== '');
    if (validMappings.length === 0) {
      setImportError('لا يوجد تخطيط صالح للأعمدة. يرجى تحديد عمود واحد على الأقل في قاعدة البيانات.');
      showToast('لا يوجد تخطيط صالح للأعمدة', 'error');
      return;
    }

    // التحقق من وجود أعمدة مطلوبة مفقودة
    const missingRequired = mapping.filter(m => m.isRequired && !m.dbColumn);
    if (missingRequired.length > 0) {
      setImportError(`هناك أعمدة مطلوبة مفقودة: ${missingRequired.map(m => m.excelColumn).join(', ')}`);
      showToast('هناك أعمدة مطلوبة مفقودة', 'error');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    showToast('جاري استيراد البيانات...', 'info');

    try {
      console.log(`Importing data from file: ${file.name}`);
      console.log(`Using mapping (${validMappings.length} valid columns):`, validMappings);

      // استخدام التخطيط الصالح فقط
      const result = await dynamicImportService.importData(
        file,
        tableName,
        validMappings, // استخدام التخطيط الصالح فقط
        identifierColumn,
        batchSize
      );

      console.log('Import result:', result);

      if (result.success) {
        showToast(`تم استيراد البيانات بنجاح. تمت إضافة ${result.addedCount} سجل وتحديث ${result.updatedCount} سجل.`, 'success');

        if (result.newColumnsAdded && result.newColumnsAdded.length > 0) {
          showToast(`تمت إضافة أعمدة جديدة: ${result.newColumnsAdded.join(', ')}`, 'info');
        }
      } else {
        setImportError(`حدث خطأ أثناء استيراد البيانات. عدد الأخطاء: ${result.errorCount}`);
        showToast('حدث خطأ أثناء استيراد البيانات', 'error');

        if (result.errors && result.errors.length > 0) {
          console.error('Import errors:', result.errors);

          // عرض تفاصيل الأخطاء بشكل أكثر وضوحًا
          const errorDetails = result.errors.map((err, index) => {
            if (err.message) {
              return `${index + 1}. ${err.message}`;
            } else if (err.details) {
              return `${index + 1}. ${err.details}`;
            } else if (typeof err === 'object') {
              return `${index + 1}. ${JSON.stringify(err)}`;
            } else {
              return `${index + 1}. ${String(err)}`;
            }
          }).join('\n');

          setImportError(prev => `${prev}\n\nتفاصيل الأخطاء:\n${errorDetails}`);
        }
      }

      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError('حدث خطأ أثناء استيراد البيانات: ' + (error instanceof Error ? error.message : String(error)));
      showToast('حدث خطأ أثناء استيراد البيانات', 'error');
    } finally {
      setIsImporting(false);

      // إعادة تعيين الحقول
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setAnalysisResult(null);
      setMapping([]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>استيراد وتصدير البيانات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* اختيار الملف */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="file">اختر ملف Excel</Label>
              <div className="flex space-x-2 space-x-reverse">
                <a
                  href="/نموذج_بيانات_الطلاب.xlsx"
                  download="نموذج_بيانات_الطلاب.xlsx"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  تحميل نموذج مع بيانات
                </a>
                <a
                  href="/نموذج_فارغ_للتعبئة.xlsx"
                  download="نموذج_فارغ_للتعبئة.xlsx"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  تحميل نموذج فارغ
                </a>
              </div>
            </div>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isAnalyzing || isImporting}
            />
            <p className="text-sm text-gray-500">
              يمكنك استيراد بيانات من ملف Excel بأي هيكل. سيتم إضافة الأعمدة الجديدة تلقائيًا.
            </p>
          </div>

          {/* إعدادات الاستيراد */}
          <div className="space-y-2">
            <Label htmlFor="batchSize">حجم الدفعة</Label>
            <Input
              id="batchSize"
              type="number"
              min="1"
              max="100"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
              disabled={isImporting}
            />
            <p className="text-sm text-gray-500">
              عدد السجلات التي سيتم معالجتها في كل دفعة. القيمة المثالية هي 10-20 سجل.
            </p>
          </div>

          {/* عرض الخطأ */}
          {importError && (
            <div className="bg-red-50 p-4 rounded-md text-red-600">
              {importError}
            </div>
          )}

          {/* نتيجة التحليل */}
          {analysisResult && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="mapping" onClick={() => setActiveTab('mapping')}>تخطيط الأعمدة</TabsTrigger>
                <TabsTrigger value="preview" onClick={() => setActiveTab('preview')}>معاينة البيانات</TabsTrigger>
                <TabsTrigger value="summary" onClick={() => setActiveTab('summary')}>ملخص</TabsTrigger>
              </TabsList>

              {/* تخطيط الأعمدة */}
              <TabsContent value="mapping">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>عمود Excel</TableHead>
                        <TableHead>عمود قاعدة البيانات</TableHead>
                        <TableHead>نوع البيانات</TableHead>
                        <TableHead>مطلوب</TableHead>
                        <TableHead>استيراد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapping.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.excelColumn}</TableCell>
                          <TableCell>
                            <Input
                              value={item.dbColumn}
                              onChange={(e) => updateMapping(index, 'dbColumn', e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.dataType}
                              onValueChange={(value) => updateMapping(index, 'dataType', value)}
                            >
                              <option value="text">نص</option>
                              <option value="integer">رقم صحيح</option>
                              <option value="numeric">رقم عشري</option>
                              <option value="boolean">منطقي</option>
                              <option value="date">تاريخ</option>
                              <option value="timestamp with time zone">تاريخ ووقت</option>
                              <option value="jsonb">JSON</option>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={item.isRequired}
                              onCheckedChange={(checked) => updateMapping(index, 'isRequired', !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={!!item.dbColumn}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  updateMapping(index, 'dbColumn', '');
                                } else if (!item.dbColumn) {
                                  updateMapping(index, 'dbColumn', item.excelColumn.toLowerCase().replace(/\s+/g, '_'));
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* معاينة البيانات */}
              <TabsContent value="preview">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {analysisResult.headers.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResult.sampleData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {analysisResult.headers.map((header, colIndex) => (
                            <TableCell key={colIndex}>
                              {row[header] !== undefined ? String(row[header]) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* ملخص */}
              <TabsContent value="summary">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">إحصائيات الملف</h3>
                    <p>عدد الصفوف: {analysisResult.rowCount}</p>
                    <p>عدد الأعمدة: {analysisResult.headers.length}</p>
                  </div>

                  {analysisResult.missingRequiredColumns.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-600">أعمدة مطلوبة مفقودة</h3>
                      <ul className="list-disc list-inside">
                        {analysisResult.missingRequiredColumns.map((col, index) => (
                          <li key={index}>{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.newColumns.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-blue-600">أعمدة جديدة ستتم إضافتها</h3>
                      <ul className="list-disc list-inside">
                        {analysisResult.newColumns.map((col, index) => (
                          <li key={index}>{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            {file && analysisResult && (
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isImporting ? (
                  <>
                    <Spinner className="ml-2" />
                    جاري الاستيراد...
                  </>
                ) : (
                  'استيراد البيانات'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
