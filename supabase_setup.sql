-- COMPLETE SUPABASE SETUP SCRIPT (UPDATED)
-- Run this in your Supabase SQL Editor

-- 1. CREATE MERCHANT APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS merchant_applications (
    id text PRIMARY KEY,
    onboard_by text,
    applicant_email text,
    merchant_phone_no text,
    title text,
    title_mm text,
    last_name text,
    last_name_mm text,
    dob date,
    father_name text,
    gender text,
    marital_status text DEFAULT 'Single',
    contact_number text,
    nrc_no text,
    nrc_tsp text,
    nrc_type text,
    nrc_number text,
    nrc_full text,
    owner_region text,
    owner_township text,
    owner_district text,
    owner_city_en text,
    owner_city_mm text,
    owner_postal_code text,
    owner_house_no text,
    owner_street text,
    owner_house_no_mm text,
    owner_street_mm text,
    owner_full_address text,
    merchant_label_en text,
    merchant_label_mm text,
    company_name_en text,
    company_name_mm text,
    company_short_name_en text,
    company_short_name_mm text,
    business_name_en text,
    business_name_mm text,
    mcc_group text,
    mcc_name text,
    mcc_code text,
    dica_grn_rcdc text,
    merchant_region text,
    merchant_township text,
    merchant_district text,
    merchant_city_en text,
    merchant_city_mm text,
    merchant_postal_code text,
    merchant_house_no_en text,
    merchant_street_en text,
    merchant_house_no_mm text,
    merchant_street_mm text,
    merchant_full_address text,
    latitude text,
    longitude text,
    open_24_7 boolean DEFAULT true,
    status text DEFAULT 'pending',
    submitted_at timestamptz DEFAULT now(),
    
    -- Admin Review Fields
    reviewed_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    rejected_at timestamptz,
    
    -- File paths
    doc_business_doc text,
    doc_agreement text,
    doc_shop_photo text,
    doc_nrc_front text,
    doc_nrc_back text,
    doc_signature text
);

-- 2. CREATE TIMELINE TABLE
CREATE TABLE IF NOT EXISTS application_timeline (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id text REFERENCES merchant_applications(id) ON DELETE CASCADE,
    action text NOT NULL,
    note text,
    performed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- 3. ENABLE SECURITY (RLS)
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES
-- Allow anyone to submit (anon)
DROP POLICY IF EXISTS "Public Insert" ON merchant_applications;
CREATE POLICY "Public Insert" ON merchant_applications FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON application_timeline;
CREATE POLICY "Public Insert" ON application_timeline FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated admins to do everything
DROP POLICY IF EXISTS "Admin Full Access" ON merchant_applications;
CREATE POLICY "Admin Full Access" ON merchant_applications FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin Full Access" ON application_timeline;
CREATE POLICY "Admin Full Access" ON application_timeline FOR ALL TO authenticated USING (true);

-- 5. STORAGE BUCKETS (Manual step in Supabase UI)
-- Create these buckets and set them to "Public":
-- 1. 'merchant-docs'
-- 2. 'merchant-photos'
-- 3. 'merchant-signatures' (Optional, if you still want to support old signatures)
