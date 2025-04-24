# 4. إدارة المعلمين والموظفين

## الصفحات والمكونات
- قائمة المعلمين والموظفين
- صفحة إضافة معلم/موظف جديد
- صفحة تفاصيل المعلم (البيانات الشخصية، المؤهلات، الجدول الدراسي)
- سجل الحضور والغياب للمعلمين
- نظام الرواتب والحوافز

## الوظائف
- إضافة معلم/موظف جديد
- تعديل بيانات المعلمين
- توزيع المعلمين على الصفوف والمواد
- تسجيل حضور وانصراف المعلمين
- حساب الرواتب والبدلات
- تقييم أداء المعلمين
- استيراد بيانات المعلمين من Excel
- تصدير بيانات المعلمين إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول الموظفين
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) NOT NULL,
    third_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    national_id VARCHAR(14) NOT NULL UNIQUE,
    religion VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone_number1 VARCHAR(20) NOT NULL,
    phone_number2 VARCHAR(20),
    email VARCHAR(100),
    profile_image_url TEXT,
    employment_date DATE NOT NULL,
    employee_type VARCHAR(50) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    basic_salary DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المؤهلات
CREATE TABLE qualifications (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    qualification_type VARCHAR(100) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    major VARCHAR(100) NOT NULL,
    graduation_year INTEGER NOT NULL,
    grade VARCHAR(50),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الخبرات
CREATE TABLE experiences (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    organization VARCHAR(200) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المعلمين
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    specialization VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المواد الدراسية
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول توزيع المعلمين على المواد
CREATE TABLE teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول حضور وغياب الموظفين
CREATE TABLE employee_attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تقييم المعلمين
CREATE TABLE teacher_evaluations (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id),
    evaluator_id INTEGER NOT NULL REFERENCES employees(id),
    evaluation_date DATE NOT NULL,
    teaching_skills DECIMAL(3, 1) NOT NULL,
    classroom_management DECIMAL(3, 1) NOT NULL,
    student_interaction DECIMAL(3, 1) NOT NULL,
    curriculum_knowledge DECIMAL(3, 1) NOT NULL,
    punctuality DECIMAL(3, 1) NOT NULL,
    overall_rating DECIMAL(3, 1) NOT NULL,
    strengths TEXT,
    areas_for_improvement TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول البدلات والخصومات
CREATE TABLE salary_components (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    component_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    is_recurring BOOLEAN NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
