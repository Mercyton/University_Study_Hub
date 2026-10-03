'use client';

import { useEffect, useState } from 'react';
import { Upload, FileUp, CheckCircle, Plus, BookCopy, AlertCircle, Pencil, Trash2, Save, X, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { filterCourses } from '@/lib/filterCourses';

type Subject = { id: string; name: string };
type ExamCategory = { id: string; name: string };

export default function AdminUploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [courseName, setCourseName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [managementMessage, setManagementMessage] = useState('');
  const [managementError, setManagementError] = useState(false);
  const [administratorEmail, setAdministratorEmail] = useState('');
  const [administratorMessage, setAdministratorMessage] = useState('');
  const [administratorError, setAdministratorError] = useState(false);
  const [isGrantingAdministrator, setIsGrantingAdministrator] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState('');
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [savingItemId, setSavingItemId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('2026');
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const filteredSubjects = filterCourses(subjects, courseSearch);

  const handleAddAdministrator = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdministratorMessage('');
    setIsGrantingAdministrator(true);

    try {
      const response = await fetch('/api/admin/administrators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: administratorEmail.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        setAdministratorMessage(result.error ?? 'Unable to authorize this email.');
        setAdministratorError(true);
        return;
      }

      setAdministratorEmail('');
      setAdministratorMessage('Admin access authorized. They can now sign up or sign in with this email.');
      setAdministratorError(false);
    } catch {
      setAdministratorMessage('Unable to reach the server. Please try again.');
      setAdministratorError(true);
    } finally {
      setIsGrantingAdministrator(false);
    }
  };

  useEffect(() => {
    const loadUploadOptions = async () => {
      const [subjectResult, categoryResult] = await Promise.all([
        supabase.from('subjects').select('id, name').order('name'),
        supabase.from('exam_categories').select('id, name'),
      ]);

      const loadError = subjectResult.error ?? categoryResult.error;
      if (loadError) {
        setManagementMessage(loadError.message);
        setManagementError(true);
        return;
      }

      const normalizedSubjects = (subjectResult.data ?? []).map((subject) => ({ ...subject, id: String(subject.id) }));
      setSubjects(normalizedSubjects);
      setSelectedSubjectId(normalizedSubjects[0]?.id ?? '');
      setCategories(categoryResult.data ?? []);
      setSelectedCategoryId(String(categoryResult.data?.[0]?.id ?? ''));
    };

    void loadUploadOptions();
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = courseName.trim();
    if (!name) return;

    setManagementMessage('');
    setIsSavingCourse(true);
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name })
      .select('id, name')
      .single();
    setIsSavingCourse(false);

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    const newSubject = { ...data, id: String(data.id) };
    setSubjects((current) => [...current, newSubject].sort((left, right) => left.name.localeCompare(right.name)));
    setSelectedSubjectId(newSubject.id);

    setCourseName('');
    setManagementMessage('Course added.');
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
      .select('id, name')
      .single();
    setSavingItemId('');

    if (error) {
      setManagementMessage(error.message);
      setManagementError(true);
      return;
    }

    setSubjects((current) => current.map((subject) => (
      subject.id === subjectId ? { ...subject, name: data.name } : subject
    )).sort((left, right) => left.name.localeCompare(right.name)));
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
          Add shared courses and upload paper metadata for the student portal.
        </p>
      </div>

      {managementMessage && (
        <p className={`rounded-lg border p-3 text-sm ${managementError ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-lime-400/30 bg-lime-400/10 text-lime-300'}`}>
          {managementMessage}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <form onSubmit={handleAddCourse} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center gap-2 text-slate-100">
              <BookCopy className="h-4 w-4 text-lime-400" />
              <h2 className="text-base font-semibold">Add Course</h2>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Organic Chemistry"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              />
              <button type="submit" disabled={isSavingCourse} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 disabled:opacity-50">
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
              <label className="mb-1 block text-xs text-slate-400">Course</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400"
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
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

      <form onSubmit={handleAddAdministrator} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-100">
          <UserPlus className="h-4 w-4 text-lime-400" />
          <h2 className="text-base font-semibold">Add New Administrator</h2>
        </div>
        <p className="mb-3 text-sm text-slate-400">Authorize an email address to receive administrator access after signing up or signing in.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={administratorEmail}
            onChange={(event) => setAdministratorEmail(event.target.value)}
            placeholder="admin@university.ac.zm"
            aria-label="New administrator email"
            className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-lime-400"
          />
          <button type="submit" disabled={isGrantingAdministrator} className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> {isGrantingAdministrator ? 'Authorizing...' : 'Authorize email'}
          </button>
        </div>
        {administratorMessage && (
          <p role="status" className={`mt-3 text-sm ${administratorError ? 'text-red-300' : 'text-lime-300'}`}>
            {administratorMessage}
          </p>
        )}
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-100">Manage courses</h2>
          <div className="relative w-full max-w-xs">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
              placeholder="Search courses"
              aria-label="Search courses to manage"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-lime-400"
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredSubjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
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
          ))}
          {filteredSubjects.length === 0 && (
            <p className="text-sm text-slate-500">
              {courseSearch ? 'No courses match your search.' : 'No courses added yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}