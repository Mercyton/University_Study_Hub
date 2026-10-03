import SecurePdfViewer from '@/components/SecurePdfViewer';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default async function PaperViewerPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // Fetch paper metadata from Supabase
  const supabase = await createSupabaseServerClient();
  const { data: paper, error } = await supabase
    .from('past_papers')
    .select('*')
    .eq('id', paperId)
    .single();

  if (error || !paper) {
    return (
      <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2">
        <ShieldAlert className="w-8 h-8" />
        <p>Paper not found or access restricted.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: signedFile, error: signedUrlError } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'past-papers')
    .createSignedUrl(paper.file_path, 60 * 10);

  if (signedUrlError || !signedFile?.signedUrl) {
    return (
      <div className="p-8 text-center text-red-400">
        This paper is temporarily unavailable. Please try again later.
      </div>
    );
  }

  const samplePdfUrl = signedFile.signedUrl;
  const currentStudentEmail = user.email ?? 'student';

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-100">{paper.title}</h1>
            <p className="text-xs text-slate-400">Year: {paper.year} • Read Only Mode</p>
          </div>
        </div>

        <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Protected Stream
        </div>
      </div>

      {/* DRM Secure HTML5 Canvas PDF Viewer */}
      <SecurePdfViewer pdfUrl={samplePdfUrl} userEmail={currentStudentEmail} />
    </div>
  );
}