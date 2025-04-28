import { createClient } from '@supabase/supabase-js';

// تهيئة عميل Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgedgudxyvgvzlqkcjwj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZWRndWR4eXZndnpscWtjandqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTc2MDksImV4cCI6MjA1OTI5MzYwOX0.sDFEGryuXnaseV7HXxrmbRM0k2CpRtFZQgIrAd4LFvI';

console.log('Initializing Supabase client with URL:', supabaseUrl);

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // إعدادات للتعامل مع الأخطاء والمحاولات المتكررة
    fetch: (url, options) => {
      // إنشاء إشارة إلغاء مع مهلة زمنية
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
  db: {
    schema: 'public',
  },
});

/**
 * التحقق من اتصال Supabase
 */
export const checkSupabaseConnection = async () => {
  try {
    console.log('Checking Supabase connection...');

    // التحقق من الاتصال بالخادم بطريقة أبسط
    try {
      // استخدام استعلام بسيط للتحقق من الاتصال - نستخدم جدول موجود بالفعل
      const { data, error } = await supabase.from('students').select('id').limit(1);

      if (error) {
        console.log('Connection check failed with error:', error);
      } else {
        console.log('Basic connection check successful');
      }
    } catch (connectionError) {
      console.log('Connection check failed, proceeding with table checks:', connectionError);
    }

    // محاولة الاتصال بجدول students
    console.log('Checking students table...');
    const { error: studentsError } = await supabase.from('students').select('count', { count: 'exact' }).limit(1);

    if (studentsError) {
      console.error('Supabase students table error:', JSON.stringify(studentsError));

      // إذا فشل الاتصال بجدول students، نحاول الاتصال بجدول آخر
      console.log('Checking classrooms table...');
      const { error: classroomsError } = await supabase.from('classrooms').select('count', { count: 'exact' }).limit(1);

      if (classroomsError) {
        console.error('Supabase classrooms table error:', JSON.stringify(classroomsError));

        // محاولة أخيرة - التحقق من وجود الجداول
        console.log('Checking if tables exist...');
        const { data: tablesData, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');

        if (tablesError) {
          console.error('Error checking tables:', JSON.stringify(tablesError));
          return false;
        }

        console.log('Available tables:', tablesData);
        return false;
      }
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

/**
 * إنشاء جداول Supabase إذا لم تكن موجودة
 */
export const createTablesIfNotExist = async () => {
  try {
    console.log('Checking if tables need to be created...');

    // التحقق من وجود جدول students
    const { count: studentsCount, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (studentsError && studentsError.code === '42P01') { // جدول غير موجود
      console.log('Students table does not exist, creating it...');

      // إنشاء جدول students
      const { error: createError } = await supabase.rpc('create_students_table');

      if (createError) {
        console.error('Error creating students table:', createError);
        return false;
      }

      console.log('Students table created successfully');
    } else {
      console.log('Students table already exists');
    }

    // التحقق من وجود جدول classrooms
    const { count: classroomsCount, error: classroomsError } = await supabase
      .from('classrooms')
      .select('*', { count: 'exact', head: true });

    if (classroomsError && classroomsError.code === '42P01') { // جدول غير موجود
      console.log('Classrooms table does not exist, creating it...');

      // إنشاء جدول classrooms
      const { error: createError } = await supabase.rpc('create_classrooms_table');

      if (createError) {
        console.error('Error creating classrooms table:', createError);
        return false;
      }

      console.log('Classrooms table created successfully');
    } else {
      console.log('Classrooms table already exists');
    }

    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
};

// تصدير الوظائف المساعدة
export default supabase;
