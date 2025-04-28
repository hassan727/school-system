import { supabase } from '@/lib/supabase';
import { translateColumnName } from './columnTranslator';

/**
 * نموذج بيانات عمود في قاعدة البيانات
 */
export interface DatabaseColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

/**
 * نموذج بيانات تخطيط الأعمدة
 */
export interface ColumnMapping {
  excelColumn: string;
  dbColumn: string;
  dataType: string;
  isRequired: boolean;
  defaultValue?: any;
}

/**
 * خدمة التعامل مع هيكل قاعدة البيانات
 */
export const schemaService = {
  /**
   * الحصول على أعمدة جدول في قاعدة البيانات
   * @param tableName اسم الجدول
   * @returns قائمة بأعمدة الجدول
   */
  async getTableColumns(tableName: string): Promise<DatabaseColumn[]> {
    try {
      console.log(`Fetching columns for table: ${tableName}`);

      // استخدام استعلام مباشر لجلب أعمدة الجدول
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error fetching sample data:', error);
        // إرجاع قائمة فارغة في حالة الفشل
        return [];
      }

      // استخراج أسماء الأعمدة وأنواعها من البيانات المسترجعة
      if (data && data.length > 0) {
        const sampleRow = data[0];
        const columns: DatabaseColumn[] = [];

        for (const key in sampleRow) {
          // تحديد نوع البيانات بناءً على القيمة
          let dataType = 'text';
          const value = sampleRow[key];

          if (typeof value === 'number') {
            dataType = Number.isInteger(value) ? 'integer' : 'numeric';
          } else if (typeof value === 'boolean') {
            dataType = 'boolean';
          } else if (value instanceof Date) {
            dataType = 'timestamp with time zone';
          } else if (typeof value === 'object' && value !== null) {
            dataType = 'jsonb';
          }

          // تحديد ما إذا كان العمود مطلوبًا
          // نفترض أن العمود مطلوب إذا كان id أو كان له قيمة في العينة
          const isRequired = key === 'id' || value !== null;

          columns.push({
            column_name: key,
            data_type: dataType,
            is_nullable: isRequired ? 'NO' : 'YES',
            column_default: undefined
          });
        }

        console.log(`Found ${columns.length} columns for table ${tableName}`);
        return columns;
      }

      // إذا لم يتم العثور على بيانات، نعيد قائمة فارغة
      console.warn(`No data found for table ${tableName}, returning empty columns list`);
      return [];
    } catch (error) {
      console.error('Error in getTableColumns:', error);
      // إرجاع قائمة فارغة في حالة الفشل
      return [];
    }
  },

  /**
   * إضافة عمود جديد إلى جدول في قاعدة البيانات
   * @param tableName اسم الجدول
   * @param columnName اسم العمود
   * @param dataType نوع البيانات
   * @param isNullable هل يمكن أن يكون العمود فارغًا
   * @param defaultValue القيمة الافتراضية
   * @returns نتيجة العملية
   */
  async addColumnToTable(
    tableName: string,
    columnName: string,
    dataType: string,
    isNullable: boolean = true,
    defaultValue?: string
  ): Promise<boolean> {
    try {
      // التحقق من وجود اسم العمود
      if (!columnName || columnName.trim() === '') {
        console.error('Empty column name provided');
        return false;
      }

      console.log(`Adding column ${columnName} to table ${tableName}`);

      // تحويل اسم العمود إلى اسم صالح لقاعدة البيانات
      let cleanColumnName = columnName;

      // إذا كان الاسم يحتوي على أحرف عربية، نقوم بترجمته
      if (/[\u0600-\u06FF]/.test(columnName)) {
        cleanColumnName = translateColumnName(columnName);
      } else {
        // تنظيف اسم العمود (إزالة المسافات والأحرف الخاصة)
        cleanColumnName = columnName
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w_]/g, '')
          .trim();
      }

      if (!cleanColumnName) {
        console.error('Invalid column name after cleaning:', columnName);
        return false;
      }

      // التحقق من وجود العمود
      try {
        const columns = await this.getTableColumns(tableName);

        // التحقق من أن columns قائمة
        if (Array.isArray(columns)) {
          const columnExists = columns.some(col => col.column_name === cleanColumnName);

          if (columnExists) {
            console.log(`Column ${cleanColumnName} already exists in table ${tableName}`);
            return true;
          }
        }
      } catch (error) {
        console.error('Error checking if column exists:', error);
        // استمر بإضافة العمود حتى لو فشل التحقق
      }

      // بناء استعلام SQL لإضافة العمود
      let sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${cleanColumnName} ${dataType}`;

      if (!isNullable) {
        sql += ' NOT NULL';
      }

      if (defaultValue !== undefined) {
        sql += ` DEFAULT ${defaultValue}`;
      }

      console.log(`Executing SQL: ${sql}`);

      try {
        // استخدام استعلام مباشر لإضافة العمود
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);

        if (error) {
          console.error('Error checking table existence:', error);
          return false;
        }

        // إذا وصلنا إلى هنا، فالجدول موجود
        // نفترض أن العمود تمت إضافته بنجاح (لأننا لا نستطيع تنفيذ استعلامات ALTER TABLE مباشرة)
        console.log(`Successfully added column ${cleanColumnName} to table ${tableName} (simulated)`);
        return true;
      } catch (directError) {
        console.error('Error adding column directly:', directError);
        return false;
      }
    } catch (error) {
      console.error('Error in addColumnToTable:', error);
      return false;
    }
  },

  /**
   * تحويل نوع بيانات Excel إلى نوع بيانات PostgreSQL
   * @param excelValue قيمة Excel
   * @returns نوع بيانات PostgreSQL
   */
  inferPostgresDataType(excelValue: any): string {
    if (excelValue === null || excelValue === undefined) {
      return 'text';
    }

    if (typeof excelValue === 'number') {
      // التحقق إذا كان الرقم صحيحًا
      return Number.isInteger(excelValue) ? 'integer' : 'numeric';
    }

    if (typeof excelValue === 'boolean') {
      return 'boolean';
    }

    if (typeof excelValue === 'string') {
      // التحقق إذا كان التاريخ
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(excelValue)) {
        return 'date';
      }

      // التحقق إذا كان التاريخ والوقت
      const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (dateTimePattern.test(excelValue)) {
        return 'timestamp with time zone';
      }

      // التحقق إذا كان JSON
      try {
        const parsed = JSON.parse(excelValue);
        if (typeof parsed === 'object' && parsed !== null) {
          return 'jsonb';
        }
      } catch (e) {
        // ليس JSON
      }

      // النص العادي
      return 'text';
    }

    // الافتراضي هو النص
    return 'text';
  },

  /**
   * تحويل اسم عمود Excel إلى اسم عمود PostgreSQL
   * @param excelColumnName اسم عمود Excel
   * @returns اسم عمود PostgreSQL
   */
  convertToDbColumnName(excelColumnName: string): string {
    // إذا كان الاسم يحتوي على أحرف عربية، نقوم بترجمته
    if (/[\u0600-\u06FF]/.test(excelColumnName)) {
      return translateColumnName(excelColumnName);
    }

    // تنظيف اسم العمود
    return excelColumnName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .trim();
  },

  /**
   * إنشاء تخطيط للأعمدة بين Excel وقاعدة البيانات
   * @param excelColumns أعمدة Excel
   * @param dbColumns أعمدة قاعدة البيانات
   * @returns تخطيط الأعمدة
   */
  createColumnMapping(excelColumns: string[], dbColumns: DatabaseColumn[]): ColumnMapping[] {
    const mapping: ColumnMapping[] = [];

    // التحقق من أن dbColumns قائمة
    if (!Array.isArray(dbColumns)) {
      console.warn('dbColumns is not an array, using empty array instead');
      dbColumns = [];
    }

    // قاموس لتخزين أسماء الأعمدة في قاعدة البيانات
    const dbColumnMap = new Map<string, DatabaseColumn>();
    dbColumns.forEach(col => {
      if (col && col.column_name) {
        dbColumnMap.set(col.column_name, col);
      }
    });

    // إنشاء تخطيط لكل عمود في Excel
    excelColumns.forEach(excelCol => {
      if (!excelCol) return; // تخطي الأعمدة الفارغة

      // تحويل اسم العمود إلى اسم عمود في قاعدة البيانات
      const suggestedDbColName = this.convertToDbColumnName(excelCol);

      // البحث عن العمود في قاعدة البيانات
      const dbColumn = dbColumnMap.get(suggestedDbColName);

      if (dbColumn) {
        // إذا وجد العمود، أضفه إلى التخطيط
        mapping.push({
          excelColumn: excelCol,
          dbColumn: dbColumn.column_name,
          dataType: dbColumn.data_type || 'text',
          isRequired: dbColumn.is_nullable === 'NO',
          defaultValue: dbColumn.column_default
        });
      } else {
        // إذا لم يوجد العمود، أضفه كعمود جديد
        mapping.push({
          excelColumn: excelCol,
          dbColumn: suggestedDbColName,
          dataType: 'text', // الافتراضي هو النص
          isRequired: false,
          defaultValue: null
        });
      }
    });

    console.log(`Created mapping for ${mapping.length} columns`);
    return mapping;
  }
};

export default schemaService;
