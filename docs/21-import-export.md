# استيراد وتصدير البيانات

## استيراد البيانات من Excel
- دعم استيراد البيانات من ملفات Excel بأي هيكل
- تحليل عناوين الأعمدة في ملف Excel ومطابقتها مع الحقول في قاعدة البيانات
- واجهة لتخطيط الأعمدة (column mapping) للربط بين أعمدة Excel وحقول النظام
- التحقق من البيانات قبل الاستيراد وعرض الأخطاء المحتملة
- إمكانية استيراد بيانات جزئية (الحقول التي تم تخطيطها فقط)
- دعم التحديث التلقائي للسجلات الموجودة (التعرف على السجلات المكررة)
- معالجة الملفات الكبيرة بتقسيمها وتحميلها على دفعات

## تصدير البيانات إلى Excel/PDF
- تصدير أي جدول أو نتائج بحث إلى Excel أو PDF
- خيارات تخصيص التصدير (اختيار الحقول، الترتيب، التنسيق)
- إضافة اسم المدرسة وترويسة للتقارير المصدرة
- تنسيق البيانات المصدرة حسب نوعها (تاريخ، عملة، نص)
- دعم الترميز العربي الصحيح في الملفات المصدرة
- خيارات تصدير متعددة (كل البيانات، الصفحة الحالية، العناصر المحددة)
- تضمين الإحصائيات والملخصات في التقارير المصدرة

## تنفيذ استيراد البيانات من Excel
```typescript
import { useState } from 'react';
import { read, utils } from 'xlsx';
import { supabase } from '../lib/supabaseClient';

interface ColumnMapping {
  excelColumn: string;
  dbColumn: string;
}

export const useExcelImport = (tableName: string, requiredFields: string[]) => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [dbColumns, setDbColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    failed: number;
    updated: number;
  }>({ total: 0, success: 0, failed: 0, updated: 0 });

  // جلب أسماء الأعمدة من قاعدة البيانات
  const fetchTableColumns = async () => {
    try {
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: tableName,
      });

      if (error) throw error;
      
      // استبعاد الأعمدة التي لا يمكن تعديلها مباشرة
      const filteredColumns = data.filter((col: string) => 
        !['id', 'created_at', 'updated_at', 'is_active'].includes(col)
      );
      
      setDbColumns(filteredColumns);
    } catch (err: any) {
      setError(`خطأ في جلب أعمدة الجدول: ${err.message}`);
    }
  };

  // معالجة اختيار الملف
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setLoading(true);

      // قراءة الملف
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('الملف لا يحتوي على بيانات كافية');
      }

      // استخراج العناوين
      const headerRow = jsonData[0] as string[];
      setHeaders(headerRow);

      // إنشاء معاينة للبيانات
      const previewData = jsonData.slice(1, 6).map((row: any) => {
        const rowData: Record<string, any> = {};
        headerRow.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });
      setPreview(previewData);

      // جلب أعمدة قاعدة البيانات
      await fetchTableColumns();

      // محاولة إنشاء تخطيط تلقائي للأعمدة
      const autoMapping: ColumnMapping[] = [];
      headerRow.forEach(excelHeader => {
        // البحث عن تطابق بين عنوان Excel وعمود قاعدة البيانات
        const matchedDbColumn = dbColumns.find(dbCol => 
          dbCol.toLowerCase() === excelHeader.toLowerCase() ||
          dbCol.replace(/_/g, ' ').toLowerCase() === excelHeader.toLowerCase()
        );
        
        if (matchedDbColumn) {
          autoMapping.push({
            excelColumn: excelHeader,
            dbColumn: matchedDbColumn
          });
        }
      });
      
      setMapping(autoMapping);
    } catch (err: any) {
      setError(`خطأ في معالجة الملف: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // تحديث التخطيط
  const updateMapping = (excelColumn: string, dbColumn: string) => {
    setMapping(prev => {
      // إزالة التخطيط السابق لهذا العمود إن وجد
      const filtered = prev.filter(m => m.excelColumn !== excelColumn);
      
      // إضافة التخطيط الجديد إذا تم اختيار عمود قاعدة بيانات
      if (dbColumn) {
        return [...filtered, { excelColumn, dbColumn }];
      }
      
      return filtered;
    });
  };

  // التحقق من البيانات قبل الاستيراد
  const validateData = (data: any[]) => {
    const errors: { row: number; message: string }[] = [];
    const mappedDbColumns = mapping.map(m => m.dbColumn);
    
    // التحقق من وجود الحقول المطلوبة
    const missingRequiredFields = requiredFields.filter(field => !mappedDbColumns.includes(field));
    if (missingRequiredFields.length > 0) {
      throw new Error(`الحقول التالية مطلوبة: ${missingRequiredFields.join(', ')}`);
    }
    
    // التحقق من صحة البيانات
    data.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2; // +2 لأن الصف الأول هو العناوين والفهرسة تبدأ من 0
      
      mapping.forEach(map => {
        const value = row[map.excelColumn];
        
        // التحقق من وجود القيم المطلوبة
        if (requiredFields.includes(map.dbColumn) && (value === undefined || value === null || value === '')) {
          errors.push({
            row: rowNumber,
            message: `القيمة مطلوبة للحقل "${map.dbColumn}" في الصف ${rowNumber}`
          });
        }
        
        // يمكن إضافة المزيد من التحققات حسب نوع البيانات
      });
    });
    
    return errors;
  };

  // استيراد البيانات
  const importData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!file) {
        throw new Error('الرجاء اختيار ملف');
      }
      
      if (mapping.length === 0) {
        throw new Error('الرجاء تخطيط الأعمدة أولاً');
      }
      
      // قراءة جميع البيانات من الملف
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      
      // استخراج العناوين والبيانات
      const headerRow = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      // تحويل البيانات إلى تنسيق مناسب للإدخال في قاعدة البيانات
      const formattedData = rows.map(row => {
        const rowData: Record<string, any> = {};
        mapping.forEach(map => {
          const columnIndex = headerRow.indexOf(map.excelColumn);
          if (columnIndex !== -1) {
            rowData[map.dbColumn] = row[columnIndex];
          }
        });
        return rowData;
      });
      
      // التحقق من البيانات
      const validationErrors = validateData(formattedData);
      if (validationErrors.length > 0) {
        throw new Error(`توجد أخطاء في البيانات: ${JSON.stringify(validationErrors)}`);
      }
      
      // تقسيم البيانات إلى مجموعات للمعالجة
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < formattedData.length; i += batchSize) {
        batches.push(formattedData.slice(i, i + batchSize));
      }
      
      // إحصائيات الاستيراد
      let successCount = 0;
      let failedCount = 0;
      let updatedCount = 0;
      
      // معالجة كل مجموعة
      for (const batch of batches) {
        const { data, error } = await supabase
          .from(tableName)
          .insert(batch)
          .select();
        
        if (error) {
          failedCount += batch.length;
          throw error;
        } else {
          successCount += data?.length || 0;
        }
      }
      
      setImportStats({
        total: formattedData.length,
        success: successCount,
        failed: failedCount,
        updated: updatedCount
      });
      
      return {
        success: true,
        message: `تم استيراد ${successCount} سجل بنجاح، فشل ${failedCount} سجل، تم تحديث ${updatedCount} سجل`
      };
    } catch (err: any) {
      setError(`خطأ في استيراد البيانات: ${err.message}`);
      return {
        success: false,
        message: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    file,
    headers,
    preview,
    mapping,
    dbColumns,
    loading,
    error,
    importStats,
    handleFileChange,
    updateMapping,
    importData
  };
};
```

## تنفيذ تصدير البيانات إلى Excel
```typescript
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

interface ExportOptions {
  fileName: string;
  sheetName?: string;
  includeHeaders?: boolean;
  columnsToExport?: string[];
  columnTitles?: Record<string, string>;
  format?: 'xlsx' | 'pdf';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  logo?: string;
}

export const exportData = async (
  data: any[],
  options: ExportOptions
) => {
  try {
    const {
      fileName,
      sheetName = 'Sheet1',
      includeHeaders = true,
      columnsToExport,
      columnTitles = {},
      format = 'xlsx',
      orientation = 'portrait',
      title,
      subtitle,
      logo
    } = options;

    // تصفية الأعمدة إذا تم تحديدها
    let filteredData = data;
    if (columnsToExport && columnsToExport.length > 0) {
      filteredData = data.map(item => {
        const filteredItem: Record<string, any> = {};
        columnsToExport.forEach(col => {
          if (item[col] !== undefined) {
            filteredItem[col] = item[col];
          }
        });
        return filteredItem;
      });
    }

    // تغيير أسماء الأعمدة إذا تم توفير عناوين بديلة
    const renamedData = filteredData.map(item => {
      const renamedItem: Record<string, any> = {};
      Object.keys(item).forEach(key => {
        const newKey = columnTitles[key] || key;
        renamedItem[newKey] = item[key];
      });
      return renamedItem;
    });

    if (format === 'xlsx') {
      // تصدير إلى Excel
      const worksheet = utils.json_to_sheet(renamedData, {
        header: includeHeaders ? Object.keys(renamedData[0] || {}) : undefined
      });

      // تنسيق الخلايا
      const range = utils.decode_range(worksheet['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = utils.encode_col(C) + '1';
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'EFEFEF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, sheetName);
      writeFile(workbook, `${fileName}.xlsx`);
    } else if (format === 'pdf') {
      // تصدير إلى PDF
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      // إضافة الترويسة
      if (title) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      }

      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      }

      // إضافة الشعار إذا تم توفيره
      if (logo) {
        try {
          doc.addImage(logo, 'JPEG', 10, 10, 30, 30);
        } catch (err) {
          console.error('Error adding logo to PDF:', err);
        }
      }

      // تحويل البيانات إلى تنسيق مناسب للجدول
      const headers = Object.keys(renamedData[0] || {});
      const rows = renamedData.map(item => headers.map(header => item[header]));

      // إضافة الجدول
      autoTable(doc, {
        head: includeHeaders ? [headers] : undefined,
        body: rows,
        startY: title || subtitle ? 40 : 20,
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // إضافة ترويسة وتذييل للصفحات
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // تذييل الصفحة
        doc.setFontSize(8);
        doc.text(
          `الصفحة ${i} من ${totalPages} - تم إنشاؤه في ${new Date().toLocaleDateString('ar-EG')}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // حفظ الملف
      doc.save(`${fileName}.pdf`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error exporting data:', err);
    return { success: false, error: err.message };
  }
};
```
