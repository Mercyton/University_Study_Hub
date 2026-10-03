-- Courses are shared across programs, so new subjects do not need a program_id.
-- Existing program_id values are retained for legacy records and can be migrated separately.
alter table public.subjects
  alter column program_id drop not null;