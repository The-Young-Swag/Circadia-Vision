import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Library, GraduationCap, LineChart, ShieldCheck, Moon, Sun, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  meta?: string // technical label for JetBrains Mono
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, meta: 'OVERVIEW' },
  { to: '/library', label: 'Library', icon: Library, meta: 'COLLECTION' },
  { to: '/review', label: 'Review', icon: GraduationCap, meta: 'SESSION' },
  { to: '/insights', label: 'Insights', icon: LineChart, meta: 'ANALYTICS' },
  { to: '/privacy', label: 'Privacy', icon: ShieldCheck, meta: 'CONTROL' },
]

export default function Sidebar() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Close drawer on route change (optional) — listen to popstate
  useEffect(() => {
    const close = () => setMobileOpen(false)
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [])

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-[56px] items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--racing)] text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--emerald)]" />
          </span>
          <span className="display text-[18px] tracking-tight text-[var(--ink)]">Circadia</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="h-9 w-9 grid place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 grid place-items-center rounded-full bg-[var(--racing)] text-white"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button aria-label="Close navigation" className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <div className="w-[300px] max-w-[84vw] bg-[var(--sidebar)] border-l border-[var(--sidebar-border)] flex flex-col shadow-2xl">
            <div className="h-[56px] flex items-center justify-between px-4 border-b border-[var(--sidebar-border)]">
              <span className="mono-label text-[var(--ink-faint)]">NAVIGATION</span>
              <button
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-full border border-[var(--line)]"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-auto p-4 space-y-6">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </nav>
            <SidebarFooter theme={theme} setTheme={setTheme} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[280px] lg:flex-col sidebar-shell">
        <div className="flex h-[72px] items-center gap-3 px-6 border-b border-[var(--sidebar-border)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--racing)] text-white shadow-sm">
            <span className="h-3 w-3 rounded-full bg-[var(--emerald)]" />
          </span>
          <div className="leading-none">
            <div className="display text-[20px] tracking-tight">Circadia</div>
            <div className="mono-label mt-1 text-[var(--ink-faint)]">ADAPTIVE STUDY</div>
          </div>
        </div>

        <nav className="flex-1 overflow-auto px-4 py-6 space-y-6">
          <SidebarNav />
        </nav>

        <SidebarFooter theme={theme} setTheme={setTheme} />
      </aside>
    </>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="sidebar-kicker px-2 mb-2">Study</div>
        <div className="space-y-1">
          {NAV.slice(0, 3).map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
      <div>
        <div className="sidebar-kicker px-2 mb-2">Intelligence</div>
        <div className="space-y-1">
          {NAV.slice(3).map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="sidebar-link group"
      activeProps={{ className: 'sidebar-link is-active group' }}
    >
      <span className="h-8 w-8 grid place-items-center rounded-lg bg-[var(--surface-muted)] border border-[var(--line)] group-[.is-active]:bg-white/15 group-[.is-active]:border-white/20 transition-colors">
        <Icon size={16} className="text-[var(--ink-soft)] group-[.is-active]:text-white" />
      </span>
      <span className="flex-1 leading-none">
        <span className="block text-[14px]">{item.label}</span>
        <span className="mono-label text-[10px] leading-none opacity-60 group-[.is-active]:opacity-80">{item.meta}</span>
      </span>
    </Link>
  )
}

function SidebarFooter({
  theme,
  setTheme,
}: {
  theme: 'light' | 'dark'
  setTheme: (v: 'light' | 'dark') => void
}) {
  return (
    <div className="border-t border-[var(--sidebar-border)] p-4 space-y-3">
      <div className="rounded-xl bg-[var(--surface-muted)] border border-[var(--line)] p-3">
        <div className="mono-label">SYSTEM</div>
        <div className="text-xs text-[var(--ink-soft)] mt-1 leading-relaxed">
          Offline-first • On-device • <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border">v1.0</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-[var(--ink-faint)]">
          <span className="h-2 w-2 rounded-full bg-[var(--emerald)] animate-pulse" /> SYNC READY
        </div>
      </div>
      <button
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-full flex items-center justify-between rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-muted)]"
      >
        <span className="flex items-center gap-2">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
        <span className="mono-label text-[10px] px-2 py-1 rounded-full bg-[var(--racing)] text-white">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
      </button>
      <div className="mono-label text-center opacity-60">© 2026 Circadia • Veridian/Emerald/BRG</div>
    </div>
  )
}
