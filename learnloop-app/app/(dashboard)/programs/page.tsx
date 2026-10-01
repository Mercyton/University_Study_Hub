import Link from 'next/link';
import { getPrograms } from '@/lib/queries';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Select Program</h1>
        <p className="text-slate-400 text-sm mt-1">
          Choose your registered program to view corresponding subjects and past papers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs?.map((program) => (
          <Link
            key={program.id}
            href={`/programs/${program.id}`}
            className="group p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-lime-400/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lime-400 group-hover:bg-lime-400 group-hover:text-slate-950 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-lg text-slate-100">{program.name}</h2>
            </div>
            
            <div className="mt-6 flex items-center justify-end text-xs font-medium text-lime-400 gap-1 group-hover:translate-x-1 transition-transform">
              View Subjects <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}