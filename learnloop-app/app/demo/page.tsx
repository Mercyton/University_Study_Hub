import Link from 'next/link';

export default function DemoLibraryPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase text-lime-400">LearnLoop Demo</p>
        <h1 className="text-3xl font-bold">Coming soon</h1>
        <Link href="/" className="mt-2 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-100">
          Back to home
        </Link>
      </div>
    </main>
  );
}
