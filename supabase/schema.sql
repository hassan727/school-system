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
