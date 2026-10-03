import { redirect } from 'next/navigation';

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ programId: string; subjectId: string }>;
}) {
  const { subjectId } = await params;
  redirect(`/courses/${subjectId}`);
}