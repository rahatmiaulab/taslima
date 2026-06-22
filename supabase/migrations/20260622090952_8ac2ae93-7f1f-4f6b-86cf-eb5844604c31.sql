
-- 1. Extensions for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Drop overly-permissive policies on shared_files
DROP POLICY IF EXISTS "Files accessible only by share_code" ON public.shared_files;
DROP POLICY IF EXISTS "Only allow download count increment" ON public.shared_files;
DROP POLICY IF EXISTS "Allow file uploads with valid data" ON public.shared_files;

-- 3. Keep INSERT public (validated), but block direct SELECT/UPDATE/DELETE from anon/authenticated
CREATE POLICY "Anyone can upload file metadata"
  ON public.shared_files
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    file_name IS NOT NULL
    AND length(file_name) <= 500
    AND file_size > 0
    AND file_size <= 524288000
    AND share_code IS NOT NULL
    AND length(share_code) BETWEEN 4 AND 32
    AND storage_path IS NOT NULL
  );

-- service_role bypasses RLS by default, no policy needed for it.

-- 4. Secure functions for client access (security definer bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_file_by_code(_code text)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_size bigint,
  file_type text,
  storage_path text,
  share_code text,
  uploaded_at timestamptz,
  expires_at timestamptz,
  download_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, file_name, file_size, file_type, storage_path, share_code,
         uploaded_at, expires_at, download_count
  FROM public.shared_files
  WHERE share_code = lower(trim(_code))
    AND expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.increment_download_count(_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.shared_files
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE share_code = lower(trim(_code))
    AND expires_at > now()
  RETURNING download_count INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_downloads(_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_size bigint,
  file_type text,
  share_code text,
  uploaded_at timestamptz,
  download_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, file_name, file_size, file_type, share_code, uploaded_at,
         COALESCE(download_count, 0) AS download_count
  FROM public.shared_files
  WHERE expires_at > now()
  ORDER BY download_count DESC NULLS LAST, uploaded_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_file_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_download_count(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_downloads(integer) TO anon, authenticated;

-- 5. Lock storage: remove any public read/update/delete; only allow public INSERT into shared-files
DROP POLICY IF EXISTS "Public read shared files" ON storage.objects;
DROP POLICY IF EXISTS "Public download shared files" ON storage.objects;
DROP POLICY IF EXISTS "Public update shared files" ON storage.objects;
DROP POLICY IF EXISTS "Public delete shared files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload shared files" ON storage.objects;

CREATE POLICY "Anyone can upload shared files"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'shared-files');

-- 6. Cleanup function for expired files (metadata side; storage handled by edge function)
CREATE OR REPLACE FUNCTION public.delete_expired_file_metadata()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH d AS (
    DELETE FROM public.shared_files
    WHERE expires_at < now()
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM d;
  RETURN deleted_count;
END;
$$;

-- 7. Schedule the edge function to clean expired storage objects every hour
SELECT cron.unschedule('cleanup-expired-files-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-files-hourly');

SELECT cron.schedule(
  'cleanup-expired-files-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xhzapjicxcfmbbxgmkvj.supabase.co/functions/v1/cleanup-expired-files',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoemFwamljeGNmbWJieGdta3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDM1MDgsImV4cCI6MjA3OTA3OTUwOH0.UrRuBZxFJEfIntQxH5BX1I9vEE9bZa2TDbmvVmGf7PY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
