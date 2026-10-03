import Link from 'next/link';
import { getPastPapers, getExamCategories, getSubject } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { ChevronRight, FileText, Lock, Calendar } from 'lucide-react';

export default async function CoursePapersPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ subjectId }, { category }] = await Promise.all([params, searchParams]);
  const [course, categories] = await Promise.all([getSubject(subjectId), getExamCategories()]);
  if (!course) notFound();

  const activeCategoryId = category || categories?.[0]?.id || '';
  const papers = activeCategoryId ? await getPastPapers(subjectId, activeCategoryId) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/courses" className="hover:underline">Courses</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-slate-200">{course.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
        <p className="mt-1 text-sm text-slate-400">Select an exam type to browse papers from newest to oldest.</p>
      </div>

      <div className="flex space-x-4 border-b border-slate-800">
        {categories?.map((examCategory) => {
          const isActive = examCategory.id === activeCategoryId;
          return (
            <Link
              key={examCategory.id}
              href={`/courses/${subjectId}?category=${examCategory.id}`}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                isActive ? 'border-lime-400 text-lime-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {examCategory.name}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {papers.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
            No papers uploaded for this category yet.
          </div>
        ) : (
          papers.map((paper) => (
            <Link
              key={paper.id}
              href={`/viewer/${paper.id}`}
              className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-lime-400/50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-800 p-2 text-lime-400 transition-colors group-hover:bg-lime-400 group-hover:text-slate-950">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-100">{paper.title}</h2>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3 text-slate-500" /> {paper.year}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-lime-400">
                <Lock className="h-3 w-3" /> View Paper
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}