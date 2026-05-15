import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const upload = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/api/resumes/upload', fd);
      sessionStorage.setItem('interview_skills', JSON.stringify(data.skills || []));
      sessionStorage.setItem('interview_questions', JSON.stringify(data.questions || []));
      setMsg(`Extracted ${data.skills?.length || 0} skills. ${data.questions?.length || 0} questions ready.`);
      setTimeout(() => navigate('/interview', { replace: false }), 800);
    } catch {
      setMsg('Upload failed — use a PDF and ensure you are logged in.');
    } finally {
      setBusy(false);
    }
  }, [file, navigate]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Resume upload</h1>
      <p className="text-slate-400 mb-6">
        PDF only. Skills are extracted and personalized questions are generated for your mock interview.
      </p>
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
        <input
          type="file"
          accept="application/pdf"
          className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-accent"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          disabled={!file || busy}
          onClick={upload}
          className="px-5 py-2.5 rounded-lg bg-accent text-ink-950 font-semibold disabled:opacity-40"
        >
          {busy ? 'Uploading…' : 'Upload & analyze'}
        </button>
        {msg && <p className="text-sm text-slate-300">{msg}</p>}
      </div>
    </div>
  );
}
