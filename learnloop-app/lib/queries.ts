import { createSupabaseServerClient } from './supabaseServer';

// 1. Fetch all shared Courses/Subjects
export async function getSubjects() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getSubject(subjectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', subjectId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 2. Fetch Exam Categories (Test 1, Test 2, Sectional Exams)
export async function getExamCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('exam_categories')
    .select('*');

  if (error) throw error;
  return data;
}

// 3. Fetch Past Papers ordered automatically by Newest Year First
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