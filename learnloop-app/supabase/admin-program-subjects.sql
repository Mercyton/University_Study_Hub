-- Allow authenticated admins to add programs and subjects from the admin console.
drop policy if exists "Admins can insert programs" on public.programs;
create policy "Admins can insert programs"
on public.programs
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update programs" on public.programs;
create policy "Admins can update programs"
on public.programs
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete programs" on public.programs;
create policy "Admins can delete programs"
on public.programs
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert subjects" on public.subjects;
create policy "Admins can insert subjects"
on public.subjects
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update subjects" on public.subjects;
create policy "Admins can update subjects"
on public.subjects
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete subjects" on public.subjects;
create policy "Admins can delete subjects"
on public.subjects
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
