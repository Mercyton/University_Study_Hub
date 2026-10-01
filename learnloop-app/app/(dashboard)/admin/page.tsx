'use client';

import { useEffect, useMemo, useState } from 'react';
import { Upload, FileUp, CheckCircle, Plus, BookCopy, FolderOpen, AlertCircle, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Program = {
  id: string;
  name: string;
};

type Subject = { id: string; name: string; program_id: string };
type ExamCategory = { id: string; name: string };

export default function AdminUploadPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [programName, setProgramName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [managementMessage, setManagementMessage] = useState('');
  const [managementError, setManagementError] = useState(false);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState('');
  const [editingProgramName, setEditingProgramName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState('');
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [savingItemId, setSavingItemId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('2026');
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? programs[0],
    [programs, selectedProgramId],
  );

  useEffect(() => {
    const loadUploadOptions = async () => {
      const [programResult, subjectResult, categoryResult] = await Promise.all([
        supabase.from('programs').select('id, name').order('name'),
        supabase.from('subjects').select('id, name, program_id').order('name'),
        supabase.from('exam_categories').select('id, name'),
      ]);

      const loadError = programResult.error ?? subjectResult.error ?? categoryResult.error;
      if (loadError) {
        setManagementMessage(loadError.message);
        setManagementError(true);
        return;
      }

      const normalizedSubjects = (subjectResult.data ?? []).map((subject) => ({
        ...subject,
        id: String(subject.id),
        program_id: String(subject.program_id),
      }));
      const programData = programResult.data ?? [];
      setSubjects(normalizedSubjects);
      setPrograms(programData.map((program) => ({
        ...program,
        id: String(program.id),
      })));
      setSelectedProgramId(String(programData[0]?.id ?? ''));
      setSelectedSubjectId(normalizedSubjects.find((subject) => subject.program_id === String(programData[0]?.id ?? ''))?.id ?? '');
      setCategories(categoryResult.data ?? []);
      setSelectedCategoryId(String(categoryResult.data?.[0]?.id ?? ''));
    };

    void loadUploadOptions();
  }, []);

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = programName.trim();
    if (!name) return;

    setManagementMessage('');
    setIsSavingProgram(true);
    const { data, error } = await supabase
      .from('programs')
      .insert({ name })
      .select('id, name')
      .single();
    setIsSavingProgram(false);

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    const newProgram = { id: String(data.id), name: data.name };
    setPrograms((current) => [...current, newProgram]);
    setSelectedProgramId(newProgram.id);
    setSelectedSubjectId('');
    setProgramName('');
    setManagementMessage('Program added.');
    setManagementError(false);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = courseName.trim();
    if (!name || !selectedProgramId) return;

    setManagementMessage('');
    setIsSavingCourse(true);
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, program_id: selectedProgramId })
      .select('id, name, program_id')
      .single();
    setIsSavingCourse(false);

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    const newSubject = { ...data, id: String(data.id), program_id: String(data.program_id) };
    setSubjects((current) => [...current, newSubject]);
    setSelectedSubjectId(newSubject.id);

    setCourseName('');
    setManagementMessage('Course added.');
    setManagementError(false);
  };

  const handleUpdateProgram = async (programId: string) => {
    const name = editingProgramName.trim();
    if (!name) return;

    setSavingItemId(programId);
    setManagementMessage('');
    const { data, error } = await supabase
      .from('programs')
      .update({ name })
      .eq('id', programId)
      .select('id, name')
      .single();
    setSavingItemId('');

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    setPrograms((current) => current.map((program) => (
      program.id === programId ? { ...program, name: data.name } : program
    )));
    setEditingProgramId('');
    setManagementMessage('Program updated.');
    setManagementError(false);
  };

  const handleDeleteProgram = async (program: Program) => {
    if (!window.confirm(`Delete program "${program.name}"? Linked courses or papers may prevent deletion.`)) return;

    setSavingItemId(program.id);
    setManagementMessage('');
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', program.id)
      .select('id')
      .single();
    setSavingItemId('');

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    setPrograms((current) => current.filter((item) => item.id !== program.id));
    setSubjects((current) => current.filter((subject) => subject.program_id !== program.id));
    if (selectedProgramId === program.id) {
      setSelectedProgramId('');
      setSelectedSubjectId('');
    }
    setManagementMessage('Program deleted.');
    setManagementError(false);
  };

  const handleUpdateSubject = async (subjectId: string) => {
    const name = editingSubjectName.trim();
    if (!name) return;

    setSavingItemId(subjectId);
    setManagementMessage('');
    const { data, error } = await supabase
      .from('subjects')
      .update({ name })
      .eq('id', subjectId)
      .select('id, name, program_id')
      .single();
    setSavingItemId('');

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    setSubjects((current) => current.map((subject) => (
      subject.id === subjectId ? { ...subject, name: data.name } : subject
    )));
    setEditingSubjectId('');
    setManagementMessage('Course updated.');
    setManagementError(false);
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!window.confirm(`Delete course "${subject.name}"? Linked papers may prevent deletion.`)) return;

    setSavingItemId(subject.id);
    setManagementMessage('');
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subject.id)
      .select('id')
      .single();
    setSavingItemId('');

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    setSubjects((current) => current.filter((item) => item.id !== subject.id));
    if (selectedSubjectId === subject.id) setSelectedSubjectId('');
    setManagementMessage('Course deleted.');
    setManagementError(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setUploadError('');

    if (!file || !selectedSubjectId || !selectedCategoryId) {
      setUploadError('Choose a subject, exam category, and PDF file before uploading.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('The PDF must be smaller than 25MB.');
      return;
    }
    setIsUploading(true);

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${selectedSubjectId}/${crypto.randomUUID()}-${safeFileName}`;
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'past-papers';
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: false,
    });

    if (uploadError) {
      setIsUploading(false);
      setUploadError(uploadError.message);
      return;
    }

    const { error: metadataError } = await supabase.from('past_papers').insert({
      title,
      year: Number(year),
      subject_id: selectedSubjectId,
      category_id: selectedCategoryId,
      file_path: filePath,
    });

    if (metadataError) {
      await supabase.storage.from(bucket).remove([filePath]);
      setIsUploading(false);
      setUploadError(metadataError.message);
      return;
    }

    setIsUploading(false);
    setSuccess(true);
    setTitle('');
    setYear('2026');
    setFile(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage programs, add courses, and upload paper metadata for the student portal.
        </p>
      </div>

      {managementMessage && (
        <p className={`rounded-lg border p-3 text-sm ${managementError ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-lime-400/30 bg-lime-400/10 text-lime-300'}`}>
          {managementMessage}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <form onSubmit={handleAddProgram} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center gap-2 text-slate-100">
              <FolderOpen className="h-4 w-4 text-lime-400" />
              <h2 className="text-base font-semibold">Add Program</h2>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g. Bachelor of Education"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              />
              <button type="submit" disabled={isSavingProgram} className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                <Plus className="h-4 w-4" /> {isSavingProgram ? 'Saving...' : 'Add program'}
              </button>
            </div>
          </form>

          <form onSubmit={handleAddCourse} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center gap-2 text-slate-100">
              <BookCopy className="h-4 w-4 text-lime-400" />
              <h2 className="text-base font-semibold">Add Course</h2>
            </div>
            <div className="space-y-3">
              <select
                required
                value={selectedProgramId}
                onChange={(e) => {
                  const nextProgramId = e.target.value;
                  setSelectedProgramId(nextProgramId);
                  setSelectedSubjectId(subjects.find((subject) => subject.program_id === nextProgramId)?.id ?? '');
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              >
                <option value="">Select program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Organic Chemistry"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              />
              <button type="submit" disabled={isSavingCourse || !selectedProgramId} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 disabled:opacity-50">
                <Plus className="h-4 w-4" /> {isSavingCourse ? 'Saving...' : 'Add course'}
              </button>
            </div>
          </form>
        </div>

        <form onSubmit={handleUpload} className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/10 p-3 text-sm text-lime-300">
              <CheckCircle className="h-4 w-4" /> Paper uploaded and indexed successfully.
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4" /> {uploadError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-slate-400">Paper title</label>
            <input
              type="text"
              required
              placeholder="e.g. Chemistry Test 1 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Program</label>
              <input
                type="text"
                readOnly
                value={selectedProgram?.name ?? ''}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Subject</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              >
                <option value="">Select subject</option>
                {subjects.filter((subject) => subject.program_id === selectedProgramId).map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Exam category</label>
              <select
                required
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Year</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-700 p-8 text-center hover:border-lime-400/60">
            <FileUp className="mx-auto mb-2 h-8 w-8 text-lime-400" />
            <p className="text-sm font-medium text-slate-200">{file?.name ?? 'Choose a PDF file'}</p>
            <p className="mt-1 text-xs text-slate-500">Supports PDF files up to 25MB</p>
            <input
              type="file"
              accept="application/pdf,.pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          <button
            type="submit"
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-lime-300 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Paper'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-100">Edit programs</h2>
        <div className="space-y-3">
          {programs.map((program) => {
            const programSubjects = subjects.filter((subject) => subject.program_id === program.id);

            return (
              <div key={program.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-3">
                  {editingProgramId === program.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleUpdateProgram(program.id);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <input
                        autoFocus
                        required
                        value={editingProgramName}
                        onChange={(event) => setEditingProgramName(event.target.value)}
                        aria-label="Program name"
                        className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-lime-400"
                      />
                      <button type="submit" disabled={savingItemId === program.id} title="Save program name" aria-label="Save program name" className="p-1.5 text-lime-300 hover:text-lime-200 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                      <button type="button" title="Cancel edit" aria-label="Cancel edit" onClick={() => setEditingProgramId('')} className="p-1.5 text-slate-400 hover:text-slate-100"><X className="h-4 w-4" /></button>
                    </form>
                  ) : (
                    <>
                      <p className="min-w-0 font-medium text-slate-100">{program.name}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-500">{programSubjects.length} courses</span>
                        <button type="button" title="Edit program" aria-label={`Edit ${program.name}`} onClick={() => { setEditingProgramId(program.id); setEditingProgramName(program.name); }} className="p-1.5 text-slate-400 hover:text-lime-300"><Pencil className="h-4 w-4" /></button>
                        <button type="button" title="Delete program" aria-label={`Delete ${program.name}`} disabled={savingItemId === program.id} onClick={() => void handleDeleteProgram(program)} className="p-1.5 text-slate-400 hover:text-red-300 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-2 space-y-1.5">
                  {programSubjects.length === 0 ? (
                    <span className="text-xs text-slate-500">No courses yet</span>
                  ) : (
                    programSubjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-900 px-2 py-1">
                        {editingSubjectId === subject.id ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              void handleUpdateSubject(subject.id);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2"
                          >
                            <input
                              autoFocus
                              required
                              value={editingSubjectName}
                              onChange={(event) => setEditingSubjectName(event.target.value)}
                              aria-label="Course name"
                              className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-lime-400"
                            />
                            <button type="submit" disabled={savingItemId === subject.id} title="Save course name" aria-label="Save course name" className="p-1 text-lime-300 hover:text-lime-200 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                            <button type="button" title="Cancel edit" aria-label="Cancel edit" onClick={() => setEditingSubjectId('')} className="p-1 text-slate-400 hover:text-slate-100"><X className="h-4 w-4" /></button>
                          </form>
                        ) : (
                          <>
                            <span className="min-w-0 wrap-break-word text-sm text-slate-300">{subject.name}</span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button type="button" title="Edit course" aria-label={`Edit ${subject.name}`} onClick={() => { setEditingSubjectId(subject.id); setEditingSubjectName(subject.name); }} className="p-1 text-slate-400 hover:text-lime-300"><Pencil className="h-4 w-4" /></button>
                              <button type="button" title="Delete course" aria-label={`Delete ${subject.name}`} disabled={savingItemId === subject.id} onClick={() => void handleDeleteSubject(subject)} className="p-1 text-slate-400 hover:text-red-300 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}