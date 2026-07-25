-- 02_add_profile_fields.sql
-- Adds missing fields and tables for the Profile Module.

-- 1. Add fields to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS residence_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS college_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;

-- 2. Add fields to existing students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS institute_enrollment VARCHAR(50),
ADD COLUMN IF NOT EXISTS course VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_semester VARCHAR(20),
ADD COLUMN IF NOT EXISTS section VARCHAR(20),
ADD COLUMN IF NOT EXISTS technical_skills TEXT,
ADD COLUMN IF NOT EXISTS soft_skills TEXT,
ADD COLUMN IF NOT EXISTS hobbies TEXT,
ADD COLUMN IF NOT EXISTS clubs TEXT;

-- 3. Create Family Details Table
CREATE TABLE IF NOT EXISTS family_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    father_name VARCHAR(100),
    father_mobile VARCHAR(20),
    father_occupation VARCHAR(100),
    father_designation VARCHAR(100),
    father_organization VARCHAR(150),
    mother_name VARCHAR(100),
    mother_mobile VARCHAR(20),
    mother_occupation VARCHAR(100),
    mother_designation VARCHAR(100),
    mother_organization VARCHAR(150),
    family_status VARCHAR(50),
    number_of_brothers INTEGER,
    number_of_sisters INTEGER,
    annual_income VARCHAR(50)
);

-- 4. Create Address Details Table
CREATE TABLE IF NOT EXISTS address_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    local_address TEXT,
    local_city VARCHAR(100),
    local_state VARCHAR(100),
    local_pincode VARCHAR(20),
    permanent_address TEXT,
    permanent_city VARCHAR(100),
    permanent_state VARCHAR(100),
    permanent_pincode VARCHAR(20)
);

-- 5. Create Student Projects Table
CREATE TABLE IF NOT EXISTS student_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    tech_stack TEXT[],
    github_link VARCHAR(500),
    live_link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Student Internships Table
CREATE TABLE IF NOT EXISTS student_internships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(user_id) ON DELETE CASCADE,
    role VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL,
    mentor VARCHAR(150),
    duration VARCHAR(50),
    technologies TEXT[],
    description TEXT,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Student Certifications Table
CREATE TABLE IF NOT EXISTS student_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    issuer VARCHAR(150) NOT NULL,
    date VARCHAR(50),
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Student Achievements Table
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date VARCHAR(50),
    description TEXT,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
