import { createSupabaseServerClient } from './supabaseServer';

// 1. Fetch all Programs (e.g., Bachelor of Science)
export async function getPrograms() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

// 2. Fetch Subjects registered under a specific Program
export async function getSubjectsByProgram(programId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('program_id', programId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

// 3. Fetch Exam Categories (Test 1, Test 2, Sectional Exams)
export async function getExamCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('exam_categories')
    .select('*');

  if (error) throw error;
  return data;
}

// 4. Fetch Past Papers ordered automatically by Newest Year First
export async function getPastPapers(subjectId: string, categoryId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('past_papers')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('category_id', categoryId)
    .order('year', { ascending: false }); // Latest year on top

  if (error) throw error;
  return data;
}