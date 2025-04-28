import { supabase } from '@/lib/supabase';
import { schemaService, ColumnMapping, DatabaseColumn } from './schemaService';
import * as XLSX from 'xlsx';
import { translateValue } from './columnTranslator';

/**
 * نموذج بيانات نتيجة تحليل ملف Excel
 */
export interface ExcelAnalysisResult {
  headers: string[];
  sampleData: any[];
  rowCount: number;
  mapping: ColumnMapping[];
  missingRequiredColumns: string[];
  newColumns: string[];
}

/**
 * نموذج بيانات نتيجة استيراد البيانات
 */
export interface ImportResult {
  success: boolean;
  addedCount: number;
  updatedCount: number;
  errorCount: number;
  errors: any[];
  newColumnsAdded?: string[];
}

/**
 * خدمة الاستيراد الديناميكي للبيانات
 */
export const dynamicImportService = {
  /**
   * تحليل ملف Excel
   * @param file ملف Excel
   * @param tableName اسم الجدول
   * @returns نتيجة تحليل الملف
   */
  async analyzeExcelFile(file: File, tableName: string): Promise<ExcelAnalysisResult> {
    try {
      console.log(`Analyzing Excel file for table: ${tableName}`);

      // قراءة الملف
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // تحويل البيانات إلى JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

      console.log('Raw Excel data:', jsonData);

      if (jsonData.length < 2) {
        throw new Error('الملف لا يحتوي على بيانات كافية');
      }

      // استخراج العناوين والبيانات
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      console.log(`Excel file has ${headers.length} columns and ${rows.length} rows`);

      // الحصول على أعمدة الجدول من قاعدة البيانات
      let dbColumns: DatabaseColumn[] = [];
      try {
        dbColumns = await schemaService.getTableColumns(tableName);
        console.log(`Retrieved ${dbColumns.length} columns from database table ${tableName}`);
      } catch (dbError) {
        console.error('Error fetching database columns:', dbError);
        // استمر بقائمة فارغة في حالة الفشل
        dbColumns = [];
      }

      // إنشاء تخطيط للأعمدة
      const mapping = schemaService.createColumnMapping(headers, dbColumns);

      // تحديد الأعمدة المطلوبة المفقودة
      let missingRequiredColumns: string[] = [];
      if (Array.isArray(dbColumns) && dbColumns.length > 0) {
        const requiredDbColumns = dbColumns.filter(col => col.is_nullable === 'NO' && col.column_default === undefined);
        const mappedDbColumns = mapping.map(m => m.dbColumn);
        missingRequiredColumns = requiredDbColumns
          .filter(col => !mappedDbColumns.includes(col.column_name) &&
                        !['id', 'created_at', 'updated_at'].includes(col.column_name))
          .map(col => col.column_name);
      }

      // تحديد الأعمدة الجديدة
      let newColumns: string[] = [];
      if (Array.isArray(dbColumns) && dbColumns.length > 0) {
        const existingDbColumns = dbColumns.map(col => col.column_name);
        newColumns = mapping
          .filter(m => !existingDbColumns.includes(m.dbColumn))
          .map(m => m.dbColumn);
      } else {
        // إذا لم نتمكن من الحصول على أعمدة قاعدة البيانات، نفترض أن جميع الأعمدة جديدة
        newColumns = mapping.map(m => m.dbColumn);
      }

      // إنشاء عينة من البيانات
      const sampleData = rows.slice(0, 5).map(row => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (index < row.length) {
            rowData[header] = row[index];
          } else {
            rowData[header] = null; // قيمة فارغة للأعمدة التي ليس لها بيانات
          }
        });
        return rowData;
      });

      console.log(`Analysis complete. Found ${missingRequiredColumns.length} missing required columns and ${newColumns.length} new columns`);

      return {
        headers,
        sampleData,
        rowCount: rows.length,
        mapping,
        missingRequiredColumns,
        newColumns
      };
    } catch (error) {
      console.error('Error analyzing Excel file:', error);
      throw error;
    }
  },

  /**
   * إضافة الأعمدة الجديدة إلى جدول في قاعدة البيانات
   * @param tableName اسم الجدول
   * @param mapping تخطيط الأعمدة
   * @param sampleData عينة من البيانات
   * @returns قائمة بالأعمدة التي تمت إضافتها
   */
  async addNewColumnsToTable(
    tableName: string,
    mapping: ColumnMapping[],
    sampleData: any[]
  ): Promise<string[]> {
    try {
      console.log(`Adding new columns to table: ${tableName}`);

      // التحقق من صحة المعلمات
      if (!tableName || !Array.isArray(mapping) || mapping.length === 0) {
        console.warn('Invalid parameters for addNewColumnsToTable');
        return [];
      }

      // تصفية التخطيط لإزالة الأعمدة الفارغة
      const validMapping = mapping.filter(m => m.dbColumn && m.dbColumn.trim() !== '');

      if (validMapping.length === 0) {
        console.warn('No valid column mappings found');
        return [];
      }

      // الحصول على أعمدة الجدول الحالية
      let dbColumns: DatabaseColumn[] = [];
      try {
        dbColumns = await schemaService.getTableColumns(tableName);
        console.log(`Retrieved ${dbColumns.length} existing columns from database`);
      } catch (dbError) {
        console.error('Error fetching database columns:', dbError);
        // استمر بقائمة فارغة في حالة الفشل
        dbColumns = [];
      }

      // التحقق من أن dbColumns قائمة
      if (!Array.isArray(dbColumns)) {
        console.warn('dbColumns is not an array, using empty array instead');
        dbColumns = [];
      }

      const existingColumns = dbColumns.map(col => col.column_name);

      // تحديد الأعمدة الجديدة
      const newColumnMappings = validMapping.filter(m => !existingColumns.includes(m.dbColumn));
      console.log(`Found ${newColumnMappings.length} new columns to add`);

      if (newColumnMappings.length === 0) {
        return [];
      }

      const addedColumns: string[] = [];

      // إضافة كل عمود جديد
      for (const columnMapping of newColumnMappings) {
        try {
          // التحقق من وجود اسم العمود
          if (!columnMapping.dbColumn || columnMapping.dbColumn.trim() === '') {
            console.warn('Skipping column with empty name');
            continue;
          }

          console.log(`Attempting to add column: ${columnMapping.dbColumn}`);

          // استنتاج نوع البيانات من عينة البيانات
          let dataType = columnMapping.dataType;

          if (dataType === 'text' && Array.isArray(sampleData) && sampleData.length > 0) {
            // البحث عن أول قيمة غير فارغة في عينة البيانات
            const sampleValue = sampleData.find(row =>
              row &&
              columnMapping.excelColumn &&
              row[columnMapping.excelColumn] !== undefined &&
              row[columnMapping.excelColumn] !== null
            )?.[columnMapping.excelColumn];

            if (sampleValue !== undefined) {
              dataType = schemaService.inferPostgresDataType(sampleValue);
              console.log(`Inferred data type for ${columnMapping.dbColumn}: ${dataType}`);
            }
          }

          // إضافة العمود إلى الجدول
          const success = await schemaService.addColumnToTable(
            tableName,
            columnMapping.dbColumn,
            dataType,
            !columnMapping.isRequired
          );

          if (success) {
            console.log(`Successfully added column: ${columnMapping.dbColumn}`);
            addedColumns.push(columnMapping.dbColumn);
          } else {
            console.warn(`Failed to add column: ${columnMapping.dbColumn}`);
          }
        } catch (columnError) {
          console.error(`Error adding column ${columnMapping.dbColumn}:`, columnError);
          // استمر بالعمود التالي في حالة الفشل
        }
      }

      console.log(`Added ${addedColumns.length} new columns to table ${tableName}`);
      return addedColumns;
    } catch (error) {
      console.error('Error adding new columns to table:', error);
      // إرجاع قائمة فارغة في حالة الفشل
      return [];
    }
  },

  /**
   * استيراد بيانات من ملف Excel إلى جدول في قاعدة البيانات
   * @param file ملف Excel
   * @param tableName اسم الجدول
   * @param mapping تخطيط الأعمدة
   * @param identifierColumn عمود المعرف للتحديث
   * @param batchSize حجم الدفعة
   * @returns نتيجة الاستيراد
   */
  async importData(
    file: File,
    tableName: string,
    mapping: ColumnMapping[],
    identifierColumn: string = '',
    batchSize: number = 10
  ): Promise<ImportResult> {
    try {
      console.log(`Importing data from ${file.name} to table ${tableName}`);

      // قراءة الملف
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // تحويل البيانات إلى JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

      console.log('Raw Excel data:', jsonData);

      if (jsonData.length < 2) {
        throw new Error('الملف لا يحتوي على بيانات كافية');
      }

      // استخراج العناوين والبيانات
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      console.log(`Found ${headers.length} columns and ${rows.length} rows in Excel file`);

      // تصفية التخطيط لإزالة الأعمدة الفارغة
      const validMapping = mapping.filter(map => map.dbColumn && map.dbColumn.trim() !== '');

      if (validMapping.length === 0) {
        console.warn('No valid column mappings found, using default mapping');

        // إنشاء تخطيط افتراضي باستخدام العمود الأول (عادة ما يكون الاسم)
        if (headers.length > 0) {
          const firstHeader = headers[0];
          validMapping.push({
            excelColumn: firstHeader,
            dbColumn: 'full_name', // استخدام اسم عمود موجود بالفعل في قاعدة البيانات
            dataType: 'text',
            isRequired: false,
            defaultValue: null
          });
          console.log(`Created default mapping for column: ${firstHeader} -> full_name`);
        } else {
          throw new Error('لا يوجد أعمدة في ملف Excel');
        }
      }

      console.log(`Using ${validMapping.length} valid column mappings`);

      // تحليل عينة من البيانات
      const sampleData = rows.slice(0, 5).map(row => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (index < row.length && header) {
            rowData[header] = row[index];
          }
        });
        return rowData;
      });

      // إضافة الأعمدة الجديدة إلى الجدول
      const newColumnsAdded = await this.addNewColumnsToTable(tableName, validMapping, sampleData);

      // تحويل البيانات إلى تنسيق مناسب للإدراج في قاعدة البيانات
      const formattedData = rows.map((row, rowIndex) => {
        const rowData: Record<string, any> = {};

        console.log(`Processing row ${rowIndex}:`, row);

        validMapping.forEach(map => {
          if (!map.excelColumn || !map.dbColumn) return;

          const columnIndex = headers.indexOf(map.excelColumn);
          console.log(`Mapping ${map.excelColumn} (index ${columnIndex}) -> ${map.dbColumn}`);

          if (columnIndex !== -1 && columnIndex < row.length) {
            // تحويل القيمة إلى النوع المناسب
            let value = row[columnIndex];

            console.log(`Raw value for ${map.dbColumn}:`, value);

            // معالجة القيم الفارغة أو غير المعرفة
            if ((value === undefined || value === null || value === '') && map.isRequired) {
              // استخدام قيمة افتراضية للحقول المطلوبة
              if (map.dataType === 'integer' || map.dataType === 'numeric') {
                value = 0;
              } else if (map.dataType === 'boolean') {
                value = false;
              } else if (map.dataType.includes('date') || map.dataType.includes('time')) {
                value = new Date().toISOString();
              } else {
                value = '';
              }
              console.log(`Using default value for ${map.dbColumn}:`, value);
            }

            // ترجمة القيم العربية إلى الإنجليزية إذا كانت نصية
            if (typeof value === 'string' && /[\u0600-\u06FF]/.test(value)) {
              const translatedValue = translateValue(value);
              if (translatedValue !== value) {
                value = translatedValue;
              }
            }

            // تحويل القيمة حسب نوع البيانات
            if (map.dataType === 'integer') {
              value = parseInt(value) || 0;
            } else if (map.dataType === 'numeric') {
              value = parseFloat(value) || 0;
            } else if (map.dataType === 'boolean') {
              value = Boolean(value);
            } else if (map.dataType.includes('date') && typeof value === 'string') {
              // التأكد من أن التاريخ بتنسيق صحيح
              try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  // تنسيق التاريخ بصيغة YYYY-MM-DD للحقول من نوع date
                  if (map.dataType === 'date') {
                    value = date.toISOString().split('T')[0];
                  } else {
                    value = date.toISOString();
                  }
                }
              } catch (e) {
                console.warn(`Invalid date format for ${map.dbColumn}:`, value);
              }
            }

            rowData[map.dbColumn] = value;
            console.log(`Final value for ${map.dbColumn}:`, value);
          } else {
            console.warn(`Column ${map.excelColumn} not found in row or has no value`);
          }
        });

        console.log(`Formatted row data:`, rowData);
        return rowData;
      });

      // تصفية البيانات لإزالة السجلات الفارغة
      const validData = formattedData.filter(item => Object.keys(item).length > 0);

      if (validData.length === 0) {
        return {
          success: true,
          addedCount: 0,
          updatedCount: 0,
          errorCount: 0,
          errors: [],
          newColumnsAdded
        };
      }

      console.log(`Prepared ${validData.length} records for import`);

      // تقسيم البيانات إلى دفعات
      const batches = [];
      for (let i = 0; i < validData.length; i += batchSize) {
        batches.push(validData.slice(i, i + batchSize));
      }

      let addedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      // معالجة كل دفعة
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

        for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
          const item = batch[itemIndex];

          try {
            // التحقق من أن السجل يحتوي على بيانات
            if (Object.keys(item).length === 0) {
              console.warn('Skipping empty record');
              continue;
            }

            // التحقق من وجود السجل إذا تم تحديد عمود المعرف
            let existingRecord = null;

            if (identifierColumn && item[identifierColumn]) {
              try {
                const { data: existingData, error: findError } = await supabase
                  .from(tableName)
                  .select('id')
                  .eq(identifierColumn, item[identifierColumn])
                  .maybeSingle();

                if (findError) {
                  console.error(`Error finding record by ${identifierColumn}:`, findError);
                } else {
                  existingRecord = existingData;
                }
              } catch (findError) {
                console.error(`Error finding record by ${identifierColumn}:`, findError);
                // استمر بإضافة سجل جديد
              }
            }

            if (existingRecord) {
              // تحديث السجل الموجود
              try {
                const { error: updateError } = await supabase
                  .from(tableName)
                  .update(item)
                  .eq('id', existingRecord.id);

                if (updateError) {
                  console.error('Error updating record:', updateError);
                  errorCount++;
                  errors.push(updateError);
                } else {
                  updatedCount++;
                  console.log(`Updated record with ID: ${existingRecord.id}`);
                }
              } catch (updateError) {
                console.error('Error updating record:', updateError);
                errorCount++;
                errors.push(updateError);
              }
            } else {
              // إضافة سجل جديد
              try {
                // التحقق من وجود الحقول الإلزامية
                const requiredFields = ['full_name', 'gender', 'birth_date', 'grade_level', 'enrollment_date'];
                const missingFields = requiredFields.filter(field => !item[field]);

                if (missingFields.length > 0) {
                  const error = {
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    details: `Record data: ${JSON.stringify(item)}`
                  };
                  console.error('Validation error:', error);
                  errorCount++;
                  errors.push(error);
                  continue;
                }

                // التحقق من قيود قاعدة البيانات
                if (item.second_language && !['french', 'german', 'english', 'other'].includes(item.second_language)) {
                  console.warn(`Invalid second_language value: ${item.second_language}. Setting to 'french'`);
                  item.second_language = 'french';
                }

                // التأكد من أن حقل status له قيمة صالحة
                if (item.status && !['active', 'inactive', 'new', 'transferred'].includes(item.status)) {
                  console.warn(`Invalid status value: ${item.status}. Setting to 'active'`);
                  item.status = 'active';
                }

                // تحويل التواريخ إلى التنسيق الصحيح
                if (item.birth_date && typeof item.birth_date === 'string') {
                  try {
                    const date = new Date(item.birth_date);
                    if (!isNaN(date.getTime())) {
                      // تنسيق التاريخ بصيغة YYYY-MM-DD
                      item.birth_date = date.toISOString().split('T')[0];
                    }
                  } catch (e) {
                    console.warn(`Invalid birth_date format: ${item.birth_date}`);
                  }
                }

                if (item.enrollment_date && typeof item.enrollment_date === 'string') {
                  try {
                    const date = new Date(item.enrollment_date);
                    if (!isNaN(date.getTime())) {
                      // تنسيق التاريخ بصيغة YYYY-MM-DD
                      item.enrollment_date = date.toISOString().split('T')[0];
                    }
                  } catch (e) {
                    console.warn(`Invalid enrollment_date format: ${item.enrollment_date}`);
                  }
                }

                // التأكد من أن grade_level هو رقم
                if (item.grade_level !== undefined) {
                  item.grade_level = parseInt(item.grade_level) || 1;
                }

                // طباعة البيانات النهائية قبل الإدراج
                console.log('Final data to insert:', item);

                const { data: insertedData, error: insertError } = await supabase
                  .from(tableName)
                  .insert([item])
                  .select('id');

                if (insertError) {
                  console.error('Error inserting record:', insertError);
                  console.error('Record data:', item);
                  console.error('Error details:', JSON.stringify(insertError, null, 2));
                  console.error('Error message:', insertError.message);
                  console.error('Error code:', insertError.code);
                  console.error('Error details:', insertError.details);

                  // إضافة رسالة خطأ أكثر تفصيلاً
                  const errorMessage = {
                    message: insertError.message || 'خطأ في إدخال البيانات',
                    code: insertError.code,
                    details: insertError.details,
                    data: item
                  };

                  errorCount++;
                  errors.push(errorMessage);
                } else {
                  addedCount++;
                  console.log(`Added new record with ID: ${insertedData?.[0]?.id || 'unknown'}`);
                }
              } catch (insertError) {
                console.error('Error inserting record:', insertError);
                console.error('Record data:', item);
                errorCount++;
                errors.push(insertError);
              }
            }
          } catch (error) {
            console.error('Error processing record:', error);
            errorCount++;
            errors.push(error);
          }
        }
      }

      console.log(`Import completed: ${addedCount} added, ${updatedCount} updated, ${errorCount} errors`);

      return {
        success: errorCount === 0,
        addedCount,
        updatedCount,
        errorCount,
        errors,
        newColumnsAdded
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        addedCount: 0,
        updatedCount: 0,
        errorCount: 1,
        errors: [error]
      };
    }
  }
};

export default dynamicImportService;
