import { redirect } from 'next/navigation';

export default async function SubjectsPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  await params;
  redirect('/courses');
}