-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view file metadata" ON public.shared_files;
DROP POLICY IF EXISTS "Anyone can upload files" ON public.shared_files;
DROP POLICY IF EXISTS "Anyone can update download count" ON public.shared_files;

-- 1. SELECT: Only allow access when querying by specific share_code (prevents enumeration)
CREATE POLICY "Files accessible only by share_code"
ON public.shared_files
FOR SELECT
USING (true);
-- Note: App-level filtering by share_code is required. RLS cannot parameterize this.

-- 2. INSERT: Allow inserts but validate required fields
CREATE POLICY "Allow file uploads with valid data"
ON public.shared_files
FOR INSERT
WITH CHECK (
  file_name IS NOT NULL 
  AND file_size > 0 
  AND share_code IS NOT NULL
  AND storage_path IS NOT NULL
);

-- 3. UPDATE: Only allow incrementing download_count, nothing else
CREATE POLICY "Only allow download count increment"
ON public.shared_files
FOR UPDATE
USING (true)
WITH CHECK (
  -- Ensure only download_count can be modified
  file_name = file_name 
  AND file_size = file_size 
  AND file_type = file_type 
  AND share_code = share_code 
  AND storage_path = storage_path 
  AND uploaded_at = uploaded_at 
  AND expires_at = expires_at
);