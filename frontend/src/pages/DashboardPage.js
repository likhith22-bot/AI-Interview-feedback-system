import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../api/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/interviews/history')
      .then((r) => setRows(r.data))
      .catch(() => setError('Could not load history.'));
  }, []);

  const sorted = useMemo(() => [...rows].reverse(), [rows]);

  const labels = sorted.map((r) =>
    r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : `#${r.id}`
  );

  const scoreData = {
    labels,
    datasets: [
      {
        label: 'Overall score (0–100)',
        data: sorted.map((r) => r.score),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        tension: 0.25,
        fill: true,
      },
    ],
  };

  const radarish = {
    labels: ['Technical', 'English', 'Confidence'],
    datasets: [
      {
        label: 'Latest attempt',
        data: sorted.length
          ? [
              sorted[sorted.length - 1].technicalScore,
              sorted[sorted.length - 1].englishScore,
              sorted[sorted.length - 1].confidenceScore,
            ]
          : [0, 0, 0],
        backgroundColor: 'rgba(56, 189, 248, 0.35)',
        borderColor: '#38bdf8',
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Track scores and skill dimensions over time.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/upload"
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm font-medium hover:bg-slate-700"
          >
            Upload resume
          </Link>
          <Link
            to="/interview"
            className="px-4 py-2 rounded-lg bg-accent text-ink-950 text-sm font-semibold hover:bg-sky-300"
          >
            Start interview
          </Link>
        </div>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {!rows.length && !error && (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          No interviews yet. Upload a resume and complete a mock interview to see charts.
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Progress</h2>
            <Line
              data={scoreData}
              options={{
                responsive: true,
                plugins: { legend: { labels: { color: '#94a3b8' } } },
                scales: {
                  x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                  y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                },
              }}
            />
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Latest breakdown (0–10)</h2>
            <Bar
              data={radarish}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                  y: { min: 0, max: 10, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                },
              }}
            />
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-300 px-4 py-3 border-b border-slate-800">Recent feedback</h2>
          <ul className="divide-y divide-slate-800">
            {[...rows].slice(0, 8).map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between gap-2 text-slate-400 text-xs mb-1">
                  <span>{r.createdAt && new Date(r.createdAt).toLocaleString()}</span>
                  <span className="text-accent font-mono">Score {r.score}</span>
                </div>
                <p className="text-slate-200">{r.feedback}</p>
                {r.weakTopics && r.weakTopics !== 'none noted' && (
                  <p className="text-amber-200/80 mt-1 text-xs">Weak areas: {r.weakTopics}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
