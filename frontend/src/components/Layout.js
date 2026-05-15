import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'bg-slate-800 text-accent' : 'text-slate-300 hover:bg-slate-800/80'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-ink-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="font-semibold text-white tracking-tight">
            AI Interview<span className="text-accent">Lab</span>
          </Link>
          <nav className="flex items-center gap-1 flex-wrap justify-end">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/upload" className={linkClass}>
              Resume
            </NavLink>
            <NavLink to="/interview" className={linkClass}>
              Mock interview
            </NavLink>
            {user && (
              <span className="text-slate-500 text-sm px-2 hidden sm:inline max-w-[200px] truncate">
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="text-sm text-slate-400 hover:text-white px-3 py-2"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        Spring Boot · Flask AI · React — portfolio MVP
      </footer>
    </div>
  );
}
