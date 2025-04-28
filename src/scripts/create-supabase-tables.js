// هذا النص البرمجي ينشئ الجداول في Supabase
import { createClient } from '@supabase/supabase-js';

// بيانات الاتصال بـ Supabase
const supabaseUrl = 'https://cgedgudxyvgvzlqkcjwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZWRndWR4eXZndnpscWtjandqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTc2MDksImV4cCI6MjA1OTI5MzYwOX0.sDFEGryuXnaseV7HXxrmbRM0k2CpRtFZQgIrAd4LFvI';

// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL لإنشاء الجداول
const createTablesSql = `
-- إنشاء جدول الفصول الدراسية
CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  teacher_id UUID,
  teacher_name TEXT,
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الطلاب
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  national_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  grade_level INTEGER NOT NULL,
  classroom_id UUID REFERENCES classrooms(id),
  enrollment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  parent_job TEXT,
  parent_relation TEXT,
  health_notes TEXT,
  academic_notes TEXT,
  behavior_notes TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للبحث
CREATE INDEX idx_students_name ON students(first_name, last_name);
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_classroom_id ON students(classroom_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_gender ON students(gender);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);

-- إنشاء دالة لتحديث حقل updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء محفزات لتحديث حقل updated_at
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at
BEFORE UPDATE ON classrooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- إنشاء سياسات الأمان للجداول
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات للقراءة والكتابة
CREATE POLICY "Allow read access to students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to students" ON students
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to students" ON students
  FOR DELETE USING (true);

CREATE POLICY "Allow read access to classrooms" ON classrooms
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to classrooms" ON classrooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to classrooms" ON classrooms
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to classrooms" ON classrooms
  FOR DELETE USING (true);

-- إنشاء مخزن للصور
INSERT INTO storage.buckets (id, name, public) VALUES ('student-images', 'student-images', true);

-- إنشاء سياسات للمخزن
CREATE POLICY "Allow public access to student images" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-images');

CREATE POLICY "Allow authenticated uploads to student images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'student-images');

CREATE POLICY "Allow authenticated updates to student images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'student-images');

CREATE POLICY "Allow authenticated deletes to student images" ON storage.objects
  FOR DELETE USING (bucket_id = 'student-images');
`;

// SQL لإضافة بيانات تجريبية
const seedDataSql = `
-- إضافة بيانات تجريبية للفصول الدراسية
INSERT INTO classrooms (id, name, grade_level, capacity, teacher_name, academic_year, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'فصل 1/1', 1, 30, 'أحمد محمد', '2023-2024', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'فصل 1/2', 1, 30, 'محمد علي', '2023-2024', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'فصل 2/1', 2, 30, 'علي أحمد', '2023-2024', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'فصل 2/2', 2, 30, 'خالد محمود', '2023-2024', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'فصل 3/1', 3, 30, 'محمود خالد', '2023-2024', 'active'),
  ('66666666-6666-6666-6666-666666666666', 'فصل 3/2', 3, 30, 'سمير فؤاد', '2023-2024', 'active');

-- إضافة بيانات تجريبية للطلاب
INSERT INTO students (
  id, first_name, last_name, gender, birth_date, national_id, address, phone, email,
  grade_level, classroom_id, enrollment_date, status, parent_name, parent_phone,
  parent_email, parent_job, parent_relation, health_notes, academic_notes, behavior_notes
)
VALUES
  (
    '11111111-1111-1111-1111-111111111112',
    'محمد',
    'أحمد',
    'male',
    '2015-05-15',
    '12345678901234',
    'القاهرة، مصر',
    '01012345678',
    'mohamed@example.com',
    1,
    '11111111-1111-1111-1111-111111111111',
    '2022-09-01',
    'active',
    'أحمد محمد',
    '01098765432',
    'ahmed@example.com',
    'مهندس',
    'father',
    'لا يوجد',
    'طالب متفوق',
    'سلوك ممتاز'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'فاطمة',
    'علي',
    'female',
    '2015-08-20',
    '12345678901235',
    'الإسكندرية، مصر',
    '01112345678',
    'fatma@example.com',
    1,
    '11111111-1111-1111-1111-111111111111',
    '2022-09-01',
    'active',
    'علي محمد',
    '01198765432',
    'ali@example.com',
    'طبيب',
    'father',
    'لا يوجد',
    'طالبة متفوقة',
    'سلوك ممتاز'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'أحمد',
    'محمود',
    'male',
    '2014-03-10',
    '12345678901236',
    'القاهرة، مصر',
    '01212345678',
    'ahmed@example.com',
    2,
    '33333333-3333-3333-3333-333333333333',
    '2021-09-01',
    'active',
    'محمود أحمد',
    '01298765432',
    'mahmoud@example.com',
    'محاسب',
    'father',
    'لا يوجد',
    'طالب متوسط',
    'سلوك جيد'
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    'نور',
    'محمد',
    'female',
    '2014-07-15',
    '12345678901237',
    'الجيزة، مصر',
    '01312345678',
    'nour@example.com',
    2,
    '33333333-3333-3333-3333-333333333333',
    '2021-09-01',
    'active',
    'محمد نور',
    '01398765432',
    'mohamed@example.com',
    'مدرس',
    'father',
    'لا يوجد',
    'طالبة متفوقة',
    'سلوك ممتاز'
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    'يوسف',
    'أحمد',
    'male',
    '2013-12-05',
    '12345678901238',
    'القاهرة، مصر',
    '01412345678',
    'yousef@example.com',
    3,
    '55555555-5555-5555-5555-555555555555',
    '2020-09-01',
    'active',
    'أحمد يوسف',
    '01498765432',
    'ahmed@example.com',
    'مهندس',
    'father',
    'لا يوجد',
    'طالب متفوق',
    'سلوك ممتاز'
  ),
  (
    '66666666-6666-6666-6666-666666666667',
    'سارة',
    'محمود',
    'female',
    '2013-09-20',
    '12345678901239',
    'الإسكندرية، مصر',
    '01512345678',
    'sara@example.com',
    3,
    '55555555-5555-5555-5555-555555555555',
    '2020-09-01',
    'active',
    'محمود سارة',
    '01598765432',
    'mahmoud@example.com',
    'طبيب',
    'father',
    'لا يوجد',
    'طالبة متفوقة',
    'سلوك ممتاز'
  );
`;

// دالة لإنشاء الجداول
async function createTables() {
  try {
    console.log('بدء إنشاء الجداول...');
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSql });

    if (error) {
      console.error('خطأ في إنشاء الجداول:', error);
      return;
    }

    console.log('تم إنشاء الجداول بنجاح!');

    // إضافة البيانات التجريبية
    console.log('بدء إضافة البيانات التجريبية...');
    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seedDataSql });

    if (seedError) {
      console.error('خطأ في إضافة البيانات التجريبية:', seedError);
      return;
    }

    console.log('تم إضافة البيانات التجريبية بنجاح!');
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
  }
}

// تنفيذ الدالة
createTables();
