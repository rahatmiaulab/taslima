-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shared-files', 'shared-files', true, 524288000, NULL);

-- Create table for file metadata
CREATE TABLE public.shared_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  share_code text UNIQUE NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  download_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read file metadata (public file sharing)
CREATE POLICY "Anyone can view file metadata"
  ON public.shared_files
  FOR SELECT
  USING (true);

-- Allow anyone to insert files (public uploads)
CREATE POLICY "Anyone can upload files"
  ON public.shared_files
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update download count
CREATE POLICY "Anyone can update download count"
  ON public.shared_files
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Storage policies for public bucket
CREATE POLICY "Anyone can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'shared-files');

CREATE POLICY "Anyone can view files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'shared-files');

CREATE POLICY "Anyone can download files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'shared-files');

-- Create index for faster lookups by share code
CREATE INDEX idx_shared_files_share_code ON public.shared_files(share_code);

-- Create index for cleanup queries
CREATE INDEX idx_shared_files_expires_at ON public.shared_files(expires_at);

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;