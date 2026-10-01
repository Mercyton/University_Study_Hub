-- Allow authenticated admins to register uploaded paper metadata.
drop policy if exists "Admins can insert past papers" on public.past_papers;
create policy "Admins can insert past papers"
on public.past_papers
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow signed-in students to see paper metadata in the subject listings.
drop policy if exists "Authenticated users can view past papers" on public.past_papers;
create policy "Authenticated users can view past papers"
on public.past_papers
for select
to authenticated
using (true);

-- Allow admins to upload PDFs to the configured past-papers bucket.
drop policy if exists "Admins can upload past papers" on storage.objects;
create policy "Admins can upload past papers"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'past-papers'
	and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Allow signed-in users to create signed URLs for papers in this bucket.
drop policy if exists "Authenticated users can read past papers" on storage.objects;
create policy "Authenticated users can read past papers"
on storage.objects
for select
to authenticated
using (bucket_id = 'past-papers');

-- Allow cleanup when the storage upload succeeded but metadata insertion failed.
drop policy if exists "Admins can delete past papers" on storage.objects;
create policy "Admins can delete past papers"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'past-papers'
	and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
