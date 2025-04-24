# 14. إدارة الصحة المدرسية

## الصفحات والمكونات
- سجل الحالات الصحية للطلاب
- سجل زيارات العيادة المدرسية
- سجل التطعيمات والفحوصات

## الوظائف
- تسجيل الحالات الصحية للطلاب
- متابعة زيارات العيادة المدرسية
- تسجيل التطعيمات والفحوصات الدورية
- إشعارات للحالات الصحية الطارئة
- استيراد بيانات صحية من Excel
- تصدير تقارير صحية إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول الحالات الصحية
CREATE TABLE health_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول السجل الصحي للطلاب
CREATE TABLE student_health_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    blood_type VARCHAR(10),
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    vision_left DECIMAL(5, 2),
    vision_right DECIMAL(5, 2),
    allergies TEXT,
    chronic_diseases TEXT,
    medications TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول حالات الطلاب الصحية
CREATE TABLE student_health_conditions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    health_condition_id INTEGER NOT NULL REFERENCES health_conditions(id),
    diagnosis_date DATE,
    diagnosis_by VARCHAR(100),
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول زيارات العيادة
CREATE TABLE clinic_visits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    complaint TEXT NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    medication_given TEXT,
    temperature DECIMAL(4, 1),
    blood_pressure VARCHAR(20),
    pulse_rate INTEGER,
    attended_by INTEGER NOT NULL REFERENCES employees(id),
    parent_notified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول التطعيمات
CREATE TABLE vaccinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    recommended_age VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل تطعيمات الطلاب
CREATE TABLE student_vaccinations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    vaccination_id INTEGER NOT NULL REFERENCES vaccinations(id),
    vaccination_date DATE NOT NULL,
    dose_number INTEGER,
    administered_by VARCHAR(100),
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الفحوصات الدورية
CREATE TABLE health_checkups (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    checkup_date DATE NOT NULL,
    checkup_type VARCHAR(50) NOT NULL,
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    bmi DECIMAL(5, 2),
    vision_left DECIMAL(5, 2),
    vision_right DECIMAL(5, 2),
    hearing_left VARCHAR(20),
    hearing_right VARCHAR(20),
    blood_pressure VARCHAR(20),
    dental_health VARCHAR(50),
    general_health VARCHAR(50),
    recommendations TEXT,
    performed_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الحوادث والإصابات
CREATE TABLE accidents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    accident_date DATE NOT NULL,
    accident_time TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    injury_type VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    first_aid_given TEXT,
    action_taken TEXT NOT NULL,
    parent_notified BOOLEAN NOT NULL,
    reported_by INTEGER NOT NULL REFERENCES employees(id),
    witness_names TEXT,
    follow_up TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إشعارات الصحة
CREATE TABLE health_notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    notification_type VARCHAR(50) NOT NULL,
    notification_date DATE NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    sent_to VARCHAR(100) NOT NULL,
    sent_by INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
