# 7. إدارة الاختبارات والدرجات

## الصفحات والمكونات
- جدول الاختبارات
- سجل درجات الطلاب
- كشوف الدرجات
- تحليل النتائج

## الوظائف
- إضافة اختبارات وتحديد مواعيدها
- تسجيل درجات الطلاب
- حساب المعدلات والتقديرات
- تحليل أداء الطلاب والصفوف
- مقارنة النتائج بين الفترات الدراسية
- استيراد درجات الطلاب من Excel
- تصدير النتائج إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول أنواع التقييم
CREATE TABLE assessment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الاختبارات
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    exam_date DATE NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL,
    passing_marks DECIMAL(5, 2) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول درجات الطلاب
CREATE TABLE student_marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    marks_obtained DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    remarks TEXT,
    entered_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول التقديرات
CREATE TABLE grade_scales (
    id SERIAL PRIMARY KEY,
    min_percentage DECIMAL(5, 2) NOT NULL,
    max_percentage DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول النتائج النهائية
CREATE TABLE final_results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    rank INTEGER,
    result_status VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تحليل النتائج
CREATE TABLE result_analytics (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    classroom_id INTEGER REFERENCES classrooms(id),
    subject_id INTEGER REFERENCES subjects(id),
    exam_id INTEGER REFERENCES exams(id),
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    total_students INTEGER NOT NULL,
    passed_students INTEGER NOT NULL,
    failed_students INTEGER NOT NULL,
    highest_marks DECIMAL(5, 2) NOT NULL,
    lowest_marks DECIMAL(5, 2) NOT NULL,
    average_marks DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إشعارات النتائج
CREATE TABLE result_notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    exam_id INTEGER REFERENCES exams(id),
    notification_type VARCHAR(50) NOT NULL,
    sent_to VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
