import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function pickRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function InterviewPage() {
  const [questions, setQuestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    try {
      const q = JSON.parse(sessionStorage.getItem('interview_questions') || '[]');
      const s = JSON.parse(sessionStorage.getItem('interview_skills') || '[]');
      setQuestions(Array.isArray(q) ? q : []);
      setSkills(Array.isArray(s) ? s : []);
    } catch {
      setQuestions([]);
    }
  }, []);

  useEffect(() => {
    if (questions.length) return;
    const ac = new AbortController();
    api
      .get('/api/interviews/keywords', { signal: ac.signal })
      .then((r) => {
        const k = r.data || [];
        setSkills(k);
        if (!sessionStorage.getItem('interview_questions')) {
          setQuestions((prev) => {
            if (prev.length > 0) return prev;
            return [
              'Tell me about yourself and what role you are targeting.',
              'Describe a difficult bug you fixed and how you verified the fix.',
              'How do you keep your technical skills current?',
            ];
          });
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [questions]);

  const currentQuestion = questions[idx] || '';

  const speak = useCallback(() => {
    if (!currentQuestion || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentQuestion);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, [currentQuestion]);

  const listen = useCallback(() => {
    const SR = pickRecognition();
    if (!SR) {
      setNote('Speech recognition is not supported in this browser. Type your answer instead.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      setAnswer((prev) => (prev ? `${prev} ${text}` : text));
      setListening(false);
    };
    rec.onerror = () => {
      setListening(false);
      setNote('Mic error — check permissions or type your answer.');
    };
    rec.onend = () => setListening(false);
    setListening(true);
    setNote('');
    rec.start();
  }, []);

  const submit = async () => {
    if (!currentQuestion.trim() || !answer.trim()) {
      setNote('Need both a question and an answer.');
      return;
    }
    setBusy(true);
    setResult(null);
    setNote('');
    try {
      const { data } = await api.post('/api/interviews/analyze', {
        question: currentQuestion,
        answer,
        keywords: skills,
      });
      setResult(data);
      setAnswer('');
      setIdx((i) => Math.min(i + 1, Math.max(questions.length - 1, 0)));
    } catch {
      setNote('Analysis failed — is the backend running on port 8080?');
    } finally {
      setBusy(false);
    }
  };

  const canUseSpeech = useMemo(() => Boolean(pickRecognition()), []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Voice mock interview</h1>
        <p className="text-slate-400 mt-1">
          Questions come from your resume when available. The browser reads questions aloud; your answer can be spoken
          or typed.
        </p>
      </div>

      {!questions.length && (
        <p className="text-amber-200/90 text-sm">
          No question list in session —{' '}
          <Link to="/upload" className="underline text-accent">
            upload a resume
          </Link>{' '}
          or use the defaults after keywords load.
        </p>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between gap-2 items-start">
          <p className="text-lg text-slate-100 leading-relaxed flex-1">{currentQuestion || '—'}</p>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Q {questions.length ? idx + 1 : 0}/{questions.length || '—'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={speak}
            className="px-4 py-2 rounded-lg bg-slate-800 text-sm font-medium hover:bg-slate-700"
          >
            Read question aloud
          </button>
          <button
            type="button"
            onClick={listen}
            disabled={listening || !canUseSpeech}
            className="px-4 py-2 rounded-lg bg-emerald-700/80 text-sm font-medium hover:bg-emerald-600 disabled:opacity-40"
          >
            {listening ? 'Listening…' : 'Answer with microphone'}
          </button>
        </div>
        <textarea
          className="w-full min-h-[140px] rounded-xl bg-ink-950 border border-slate-700 px-3 py-2 text-slate-100 focus:ring-2 focus:ring-accent outline-none"
          placeholder="Your answer (spoken text appears here — you can edit)…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="px-5 py-2.5 rounded-lg bg-accent text-ink-950 font-semibold disabled:opacity-40"
        >
          {busy ? 'Analyzing…' : 'Submit for AI feedback'}
        </button>
        {note && <p className="text-sm text-amber-200/90">{note}</p>}
      </div>

      {result && (
        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 space-y-2">
          <h2 className="text-lg font-semibold text-white">Feedback</h2>
          <p className="text-slate-300">{result.feedback}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-sm">
            <div className="rounded-lg bg-ink-950 p-3 border border-slate-800">
              <div className="text-slate-500">Overall</div>
              <div className="text-xl font-mono text-accent">{result.score}</div>
            </div>
            <div className="rounded-lg bg-ink-950 p-3 border border-slate-800">
              <div className="text-slate-500">Technical</div>
              <div className="text-xl font-mono">{result.technicalScore}/10</div>
            </div>
            <div className="rounded-lg bg-ink-950 p-3 border border-slate-800">
              <div className="text-slate-500">English</div>
              <div className="text-xl font-mono">{result.englishScore}/10</div>
            </div>
            <div className="rounded-lg bg-ink-950 p-3 border border-slate-800">
              <div className="text-slate-500">Confidence</div>
              <div className="text-xl font-mono">{result.confidenceScore}/10</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
