import Link from 'next/link';
import { getSubjectsByProgram } from '@/lib/queries';
import { BookMarked, ChevronRight } from 'lucide-react';

export default async function SubjectsPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const subjects = await getSubjectsByProgram(programId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/programs" className="hover:underline">Programs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-200">Subjects</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Available Subjects</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects?.map((subject) => (
          <Link
            key={subject.id}
            href={`/programs/${programId}/${subject.id}`}
            className="p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <BookMarked className="w-5 h-5 text-lime-400" />
              <span className="font-medium text-slate-200">{subject.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}