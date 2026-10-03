import { getSubjects } from '@/lib/queries';
import CourseSearch from '@/components/CourseSearch';

export default async function CoursesPage() {
  const courses = await getSubjects();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <p className="mt-1 text-sm text-slate-400">Browse past papers by course.</p>
      </div>

      <CourseSearch courses={courses} />
    </div>
  );
}