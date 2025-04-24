# 3. إدارة المالية والرسوم المدرسية

## الصفحات والمكونات
- جدول الرسوم الدراسية
- سجل المدفوعات
- إدارة المصروفات
- الميزانية والتخطيط المالي
- الفواتير والإيصالات

## هيكل قاعدة البيانات
- جدول fee_structures (هيكل الرسوم)
- جدول student_financials (الحالة المالية للطلاب)
- جدول payment_plans (خطط الدفع)
- جدول payments (سجل المدفوعات)
- جدول expenses (المصروفات)
- جدول salaries (الرواتب)
- جدول budgets (الميزانيات)
- جدول financial_transactions (سجل العمليات المالية)
- جدول discounts (أنواع الخصومات)
- جدول student_discounts (الخصومات المطبقة)

## تفاصيل الرسوم الدراسية
- تحديد الرسوم حسب المرحلة الدراسية
- خيارات الخصم (منحة تفوق، خصم أخوة، خصم موظفين، أخرى)
- طرق السداد (كامل، أقساط)
- تفاصيل الأقساط (عدد الأقساط، تواريخ الاستحقاق، المبالغ)
- إمكانية تسجيل دفعة مقدمة عند التسجيل

## تسجيل المدفوعات
- تاريخ وتوقيت الدفع
- قيمة الدفعة
- طريقة الدفع (نقداً، تحويل بنكي، شيك)
- اسم المستلم/المسؤول
- رقم الإيصال
- إرفاق صورة الإيصال

## الوظائف
- تحديد الرسوم الدراسية لكل صف
- تسجيل مدفوعات الطلاب
- إصدار إيصالات الدفع بالجنيه المصري
- حساب المتأخرات والخصومات
- إدارة الرواتب والمكافآت
- تسجيل المصروفات التشغيلية
- طباعة التقارير المالية
- استيراد البيانات المالية من Excel
- تصدير التقارير المالية إلى Excel أو PDF

## العمليات الحسابية
- احتساب إجمالي الرسوم المستحقة لكل طالب
- خصم المدفوعات من الرسوم المستحقة
- احتساب الخصومات (خصم الإخوة، خصم السداد المبكر)
- احتساب الغرامات للمتأخرين
- تقارير الربح والخسارة
- موازنة الميزانية

## تنسيق العرض
- استخدام جدول بتنسيق ثابت لضمان عرض البيانات بشكل كامل
- ترتيب الأعمدة ليتناسب مع اتجاه القراءة العربي (من اليمين إلى اليسار)
- خلفية ملونة لرؤوس الجدول
- زيادة حجم الخط وتأثير العرض البارز للأرقام
- توسيط البيانات رأسياً وأفقياً
- تنسيق مناسب للنصوص العربية

## هيكل قاعدة البيانات
```sql
-- جدول هيكل الرسوم
CREATE TABLE fee_structures (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    academic_year VARCHAR(20) NOT NULL,
    tuition_fee DECIMAL(10, 2) NOT NULL,
    registration_fee DECIMAL(10, 2) NOT NULL,
    activity_fee DECIMAL(10, 2) NOT NULL,
    transportation_fee DECIMAL(10, 2) NOT NULL,
    uniform_fee DECIMAL(10, 2) NOT NULL,
    books_fee DECIMAL(10, 2) NOT NULL,
    other_fees DECIMAL(10, 2) DEFAULT 0,
    total_fees DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الحالة المالية للطلاب
CREATE TABLE student_financials (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    academic_year VARCHAR(20) NOT NULL,
    fee_structure_id INTEGER NOT NULL REFERENCES fee_structures(id),
    total_fees DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    net_fees DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    payment_plan_id INTEGER REFERENCES payment_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول خطط الدفع
CREATE TABLE payment_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    installments_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تفاصيل خطط الدفع
CREATE TABLE payment_plan_details (
    id SERIAL PRIMARY KEY,
    payment_plan_id INTEGER NOT NULL REFERENCES payment_plans(id),
    installment_number INTEGER NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    due_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المدفوعات
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    student_financial_id INTEGER NOT NULL REFERENCES student_financials(id),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    received_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    receipt_image_url TEXT,
    installment_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول أنواع الخصومات
CREATE TABLE discounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    is_percentage BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الخصومات المطبقة
CREATE TABLE student_discounts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    student_financial_id INTEGER NOT NULL REFERENCES student_financials(id),
    discount_id INTEGER NOT NULL REFERENCES discounts(id),
    discount_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    approved_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المصروفات
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(50),
    receipt_image_url TEXT,
    approved_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الرواتب
CREATE TABLE salaries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL,
    allowances DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    payment_date DATE,
    payment_status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الميزانيات
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL,
    spent_amount DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل العمليات المالية
CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
