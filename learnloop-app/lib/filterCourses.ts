type NamedCourse = { name: string };

export function filterCourses<T extends NamedCourse>(courses: readonly T[], query: string): T[] {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [...courses];

  return courses.filter((course) => course.name.toLowerCase().includes(searchTerm));
}