-- ============================================================================
-- STUDENT DOCUMENT STORAGE
-- ============================================================================
alter table public.requirements
  add column if not exists upload_file_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-documents',
  'student-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'student_documents_select_anon_auth'
  ) then
    create policy "student_documents_select_anon_auth"
      on storage.objects for select
      to anon, authenticated
      using (bucket_id = 'student-documents');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'student_documents_insert_anon_auth'
  ) then
    create policy "student_documents_insert_anon_auth"
      on storage.objects for insert
      to anon, authenticated
      with check (bucket_id = 'student-documents');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'student_documents_update_anon_auth'
  ) then
    create policy "student_documents_update_anon_auth"
      on storage.objects for update
      to anon, authenticated
      using (bucket_id = 'student-documents')
      with check (bucket_id = 'student-documents');
  end if;
end $$;
