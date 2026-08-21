import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Library,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--nav-bg)]">
      <nav className="page-wrap flex h-[64px] items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline text-[var(--ink)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-white">
            <span className="h-2 w-2 rounded-full bg-[var(--amber)]" />
          </span>
          <span className="display text-[18px] tracking-tight">Circadia</span>
          <span className="hidden sm:inline text-xs font-medium text-[var(--ink-faint)] tracking-wide">
            ADAPTIVE STUDY
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            activeProps={{
              className:
                'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            }}
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link
            to="/library"
            className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            activeProps={{
              className:
                'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            }}
          >
            <Library size={16} /> Library
          </Link>
          <Link
            to="/review"
            className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            activeProps={{
              className:
                'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            }}
          >
            <GraduationCap size={16} /> Review
          </Link>
          <Link
            to="/insights"
            className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            activeProps={{
              className:
                'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            }}
          >
            <LineChart size={16} /> Insights
          </Link>
          <Link
            to="/privacy"
            className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            activeProps={{
              className:
                'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            }}
          >
            <ShieldCheck size={16} /> Privacy
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 ml-1">
          <Link
            to="/"
            className="p-2 rounded-lg border border-transparent"
            activeProps={{
              className:
                'p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)]',
            }}
          >
            <LayoutDashboard size={18} />
          </Link>
          <Link
            to="/library"
            className="p-2 rounded-lg border border-transparent"
            activeProps={{
              className:
                'p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)]',
            }}
          >
            <Library size={18} />
          </Link>
          <Link
            to="/review"
            className="p-2 rounded-lg border border-transparent"
            activeProps={{
              className:
                'p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)]',
            }}
          >
            <GraduationCap size={18} />
          </Link>
          <Link
            to="/insights"
            className="p-2 rounded-lg border border-transparent"
            activeProps={{
              className:
                'p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)]',
            }}
          >
            <LineChart size={18} />
          </Link>
          <Link
            to="/privacy"
            className="p-2 rounded-lg border border-transparent"
            activeProps={{
              className:
                'p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)]',
            }}
          >
            <ShieldCheck size={18} />
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>
    </header>
  )
}
