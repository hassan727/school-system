# 5. إدارة الحضور والغياب

## الصفحات والمكونات
- سجل الحضور اليومي للطلاب
- تقارير الحضور والغياب
- إدارة الإجازات والاستئذان

## الوظائف
- تسجيل حضور وغياب الطلاب يومياً
- تمييز الغياب بعذر والغياب بدون عذر
- إرسال إشعارات لأولياء الأمور عند غياب الطالب
- تقارير الحضور للطالب/الصف/المدرسة
- استيراد بيانات الحضور من Excel
- تصدير تقارير الحضور إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول حضور الطلاب
CREATE TABLE student_attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    excuse_type VARCHAR(50),
    excuse_description TEXT,
    excuse_document_url TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الإجازات والاستئذان
CREATE TABLE student_leaves (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(20) NOT NULL,
    approved_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إشعارات الغياب
CREATE TABLE attendance_notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    attendance_date DATE NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    sent_to VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إحصائيات الحضور
CREATE TABLE attendance_statistics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
    academic_year VARCHAR(20) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    present_days INTEGER NOT NULL,
    absent_days INTEGER NOT NULL,
    excused_days INTEGER NOT NULL,
    attendance_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
