'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookMarked, ChevronRight, Search, X } from 'lucide-react';
import { filterCourses } from '@/lib/filterCourses';

type Course = { id: string | number; name: string };

export default function CourseSearch({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState('');
  const filteredCourses = filterCourses(courses, query);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses"
          aria-label="Search courses"
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-10 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-lime-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear course search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filteredCourses.length === 0 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
          {query ? 'No courses match your search.' : 'No courses are available yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-lime-400" />
                <span className="font-medium text-slate-200">{course.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}