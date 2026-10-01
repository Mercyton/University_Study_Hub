import Link from 'next/link';
import { getPastPapers, getExamCategories } from '@/lib/queries';
import { ChevronRight, FileText, Lock, Calendar } from 'lucide-react';

export default async function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string; subjectId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  // 1. Await params and searchParams first
  const { programId, subjectId } = await params;
  const { category } = await searchParams;

  const categories = await getExamCategories();
  
  // 2. Default to the first category if none selected
  const activeCategoryId = category || categories?.[0]?.id || '';
  
  // 3. Only query if subjectId and categoryId are valid strings
  const papers = (subjectId && activeCategoryId) 
    ? await getPastPapers(subjectId, activeCategoryId)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/programs" className="hover:underline">Programs</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/programs/${programId}`} className="hover:underline">Subjects</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-200 font-medium">Exam Papers</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Past Examination Papers</h1>
        <p className="text-slate-400 text-sm mt-1">
          Select an exam type to browse papers organized from newest to oldest.
        </p>
      </div>

      {/* Exam Category Filter Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {categories?.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <Link
              key={cat.id}
              href={`/programs/${programId}/${subjectId}?category=${cat.id}`}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? 'border-lime-400 text-lime-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Papers Grid List */}
      <div className="space-y-3">
        {papers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800">
            No papers uploaded for this category yet.
          </div>
        ) : (
          papers.map((paper) => (
            <Link
              key={paper.id}
              href={`/viewer/${paper.id}`}
              className="p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-lime-400/50 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-lime-400 group-hover:bg-lime-400 group-hover:text-slate-950 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{paper.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> {paper.year}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-lime-400 bg-lime-400/10 px-3 py-1.5 rounded-full">
                <Lock className="w-3 h-3" /> View Paper
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}