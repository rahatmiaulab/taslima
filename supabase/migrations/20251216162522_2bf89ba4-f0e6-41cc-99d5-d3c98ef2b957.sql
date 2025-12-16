-- Make storage bucket private and add MIME type restrictions
UPDATE storage.buckets 
SET public = false,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
WHERE id = 'shared-files';

-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;

-- Create restrictive storage policies
-- Allow uploads (anon can upload since this is a public file sharing app)
CREATE POLICY "Allow file uploads to shared-files bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'shared-files');

-- No direct SELECT - we'll use signed URLs
-- This prevents enumeration attacks