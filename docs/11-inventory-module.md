# 9. إدارة المخزون والأصول

## الصفحات والمكونات
- قائمة الأصول والمعدات
- إدارة المخزون (الكتب، القرطاسية، المستلزمات)
- سجل الصيانة

## الوظائف
- إضافة أصول ومعدات جديدة
- متابعة المخزون وإعادة الطلب
- تسجيل عمليات الصيانة
- جرد المخزون
- إصدار طلبات الشراء
- استيراد بيانات المخزون من Excel
- تصدير تقارير المخزون إلى Excel أو PDF

## هيكل قاعدة البيانات
```sql
-- جدول فئات الأصول
CREATE TABLE asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الأصول
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES asset_categories(id),
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(200),
    location VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    warranty_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول فئات المخزون
CREATE TABLE inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول المخزون
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES inventory_categories(id),
    unit VARCHAR(50) NOT NULL,
    current_quantity INTEGER NOT NULL,
    minimum_quantity INTEGER NOT NULL,
    reorder_level INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    location VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول حركات المخزون
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES inventory_items(id),
    transaction_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reference_number VARCHAR(50),
    reference_type VARCHAR(50),
    notes TEXT,
    performed_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الموردين
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول طلبات الشراء
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تفاصيل طلبات الشراء
CREATE TABLE purchase_order_details (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    item_id INTEGER NOT NULL REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل الصيانة
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الجرد
CREATE TABLE inventory_counts (
    id SERIAL PRIMARY KEY,
    count_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    performed_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول تفاصيل الجرد
CREATE TABLE inventory_count_details (
    id SERIAL PRIMARY KEY,
    inventory_count_id INTEGER NOT NULL REFERENCES inventory_counts(id),
    item_id INTEGER NOT NULL REFERENCES inventory_items(id),
    expected_quantity INTEGER NOT NULL,
    actual_quantity INTEGER NOT NULL,
    discrepancy INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```
