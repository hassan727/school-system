# 10. إدارة المكتبة المدرسية

## الصفحات والمكونات
- قائمة الكتب والمراجع
- سجل الاستعارة والإرجاع
- إدارة أعضاء المكتبة

## الوظائف
- إضافة كتب جديدة
- تسجيل استعارة وإرجاع الكتب
- تتبع الكتب المتأخرة
- إرسال تذكيرات للإرجاع
- البحث في قائمة الكتب
- استيراد بيانات الكتب من Excel
- تصدير تقارير المكتبة إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول فئات الكتب
CREATE TABLE book_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الكتب
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    publisher VARCHAR(100),
    isbn VARCHAR(20),
    category_id INTEGER NOT NULL REFERENCES book_categories(id),
    publication_year INTEGER,
    edition VARCHAR(50),
    language VARCHAR(50) NOT NULL,
    pages INTEGER,
    quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    location VARCHAR(50) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول أعضاء المكتبة
CREATE TABLE library_members (
    id SERIAL PRIMARY KEY,
    member_type VARCHAR(20) NOT NULL,
    member_id INTEGER NOT NULL,
    membership_number VARCHAR(50) NOT NULL UNIQUE,
    membership_date DATE NOT NULL,
    expiry_date DATE,
    max_books_allowed INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الاستعارة
CREATE TABLE book_borrowings (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id),
    member_id INTEGER NOT NULL REFERENCES library_members(id),
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) NOT NULL,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    fine_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    issued_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تذكيرات الإرجاع
CREATE TABLE return_reminders (
    id SERIAL PRIMARY KEY,
    borrowing_id INTEGER NOT NULL REFERENCES book_borrowings(id),
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    sent_to VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الغرامات
CREATE TABLE library_fines (
    id SERIAL PRIMARY KEY,
    borrowing_id INTEGER NOT NULL REFERENCES book_borrowings(id),
    fine_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    payment_date DATE,
    payment_status VARCHAR(20) NOT NULL,
    received_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول طلبات الكتب
CREATE TABLE book_requests (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES library_members(id),
    book_title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    request_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول إحصائيات المكتبة
CREATE TABLE library_statistics (
    id SERIAL PRIMARY KEY,
    statistic_date DATE NOT NULL,
    total_books INTEGER NOT NULL,
    total_members INTEGER NOT NULL,
    books_borrowed INTEGER NOT NULL,
    books_returned INTEGER NOT NULL,
    books_overdue INTEGER NOT NULL,
    total_fines DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
