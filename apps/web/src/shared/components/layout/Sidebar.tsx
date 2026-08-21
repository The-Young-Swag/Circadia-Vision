import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Library, GraduationCap, LineChart, ShieldCheck, Moon, Sun, Menu, X, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  meta?: string
}

const PRIMARY: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, meta: 'OVERVIEW' },
  { to: '/review', label: 'Review', icon: GraduationCap, meta: 'SESSION' },
  { to: '/library', label: 'Library', icon: Library, meta: 'COLLECTION' },
  { to: '/insights', label: 'Insights', icon: LineChart, meta: 'ANALYTICS' },
]

const SECONDARY: NavItem[] = [
  { to: '/privacy', label: 'Privacy', icon: ShieldCheck, meta: 'CONTROL' },
]

export default function Sidebar() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const isReview = useRouterState({ select: (s) => s.location.pathname.startsWith('/review') })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const close = () => {
      setMobileOpen(false)
      setMoreOpen(false)
    }
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [])

  // During review, minimize chrome — hide sidebar labels, keep minimal
  const reviewMinimized = isReview

  return (
    <>
      {/* Mobile top bar — only when not in review minimal */}
      {!reviewMinimized && (
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
      )}

      {/* Mobile bottom nav — per §11, hidden during review to minimize chrome */}
      {!reviewMinimized && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] px-2 py-2 flex items-center justify-around safe-area-pb">
          {PRIMARY.slice(0, 3).map((item) => (
            <MobileTab key={item.to} item={item} />
          ))}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[var(--ink-soft)]"
            aria-expanded={moreOpen}
            aria-label="More"
          >
            <MoreHorizontal size={20} />
            <span className="mono-label text-[10px]">MORE</span>
          </button>
        </nav>
      )}

      {/* Mobile More sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button className="flex-1 bg-black/30" onClick={() => setMoreOpen(false)} aria-label="Close more" />
          <div className="bg-[var(--surface)] border-t border-[var(--line)] rounded-t-2xl p-4 space-y-2">
            {[...PRIMARY.slice(3), ...SECONDARY].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl border border-[var(--line)]"
              >
                <item.icon size={18} />
                <span className="font-medium">{item.label}</span>
                <span className="ml-auto mono-label">{item.meta}</span>
              </Link>
            ))}
            <button
              onClick={() => setMoreOpen(false)}
              className="w-full btn-ghost mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
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
            <div className="flex-1 overflow-auto p-4">
              <SidebarNav onNavigate={() => setMobileOpen(false)} collapsed={false} />
            </div>
            <SidebarFooter theme={theme} setTheme={setTheme} collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop sidebar — icon-only 72px, hover expands to 280px per §10 */}
      <aside
        className={`hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex-col sidebar-shell transition-all duration-200 group/sidebar ${collapsed ? 'lg:w-[72px] hover:lg:w-[280px]' : 'lg:w-[280px]'} ${reviewMinimized ? 'opacity-40 hover:opacity-100' : ''}`}
        onMouseEnter={() => collapsed && setCollapsed(false)}
        onMouseLeave={() => collapsed && setCollapsed(true)}
      >
        <div className="flex h-[72px] items-center gap-3 px-4 border-b border-[var(--sidebar-border)] shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--racing)] text-white shadow-sm shrink-0">
            <span className="h-3 w-3 rounded-full bg-[var(--emerald)]" />
          </span>
          {!collapsed && (
            <div className="leading-none min-w-0">
              <div className="display text-[20px] tracking-tight truncate">Circadia</div>
              <div className="mono-label mt-1 text-[var(--ink-faint)] truncate">ADAPTIVE STUDY</div>
            </div>
          )}
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto h-7 w-7 hidden lg:grid place-items-center rounded-full border border-[var(--sidebar-border)] text-[var(--ink-faint)] hover:bg-[var(--sidebar-accent)]"
          >
            <span className="mono-label text-[10px]">{collapsed ? '→' : '←'}</span>
          </button>
        </div>

        <nav className="flex-1 overflow-auto px-3 py-6 space-y-6">
          <SidebarNav collapsed={collapsed} />
        </nav>

        <SidebarFooter theme={theme} setTheme={setTheme} collapsed={collapsed} />
      </aside>
    </>
  )
}

function MobileTab({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[var(--ink-soft)]"
      activeProps={{ className: 'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--racing)] text-white' }}
    >
      <Icon size={20} />
      <span className="mono-label text-[10px]">{item.label.toUpperCase()}</span>
    </Link>
  )
}

function SidebarNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <div className={`sidebar-kicker px-2 mb-2 ${collapsed ? 'hidden group-hover/sidebar:block' : ''}`}>Study</div>
        <div className="space-y-1">
          {PRIMARY.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </div>
      </div>
      <div>
        <div className={`sidebar-kicker px-2 mb-2 ${collapsed ? 'hidden group-hover/sidebar:block' : ''}`}>Intelligence</div>
        <div className="space-y-1">
          {SECONDARY.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NavLink({ item, onNavigate, collapsed }: { item: NavItem; onNavigate?: () => void; collapsed?: boolean }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="sidebar-link group"
      activeProps={{ className: 'sidebar-link is-active group' }}
      title={collapsed ? item.label : undefined}
    >
      <span className="h-8 w-8 grid place-items-center rounded-lg bg-[var(--surface-muted)] border border-[var(--line)] group-[.is-active]:bg-white/15 group-[.is-active]:border-white/20 transition-colors shrink-0">
        <Icon size={16} className="text-[var(--ink-soft)] group-[.is-active]:text-white" />
      </span>
      <span className={`flex-1 leading-none min-w-0 ${collapsed ? 'hidden group-hover/sidebar:block' : ''}`}>
        <span className="block text-[14px] truncate">{item.label}</span>
        <span className="mono-label text-[10px] leading-none opacity-60 group-[.is-active]:opacity-80 truncate">{item.meta}</span>
      </span>
    </Link>
  )
}

function SidebarFooter({
  theme,
  setTheme,
  collapsed,
}: {
  theme: 'light' | 'dark'
  setTheme: (v: 'light' | 'dark') => void
  collapsed?: boolean
}) {
  return (
    <>
      {/* Collapsed — icon only, hover reveals full */}
      <div className={`border-t border-[var(--sidebar-border)] p-2 flex flex-col items-center gap-2 ${collapsed ? 'flex group-hover/sidebar:hidden' : 'hidden'}`}>
        <span className="h-2 w-2 rounded-full bg-[var(--emerald)] animate-pulse" title="Personal signal active" />
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 grid place-items-center rounded-full border border-[var(--line)]"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
      <div className={`border-t border-[var(--sidebar-border)] p-4 space-y-3 ${collapsed ? 'hidden group-hover/sidebar:block' : ''}`}>
        <div className="rounded-xl bg-[var(--surface-muted)] border border-[var(--line)] p-3">
          <div className="mono-label">Personal signal</div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-[var(--ink-faint)]">
            <span className="h-2 w-2 rounded-full bg-[var(--emerald)] animate-pulse" aria-hidden /> Personal signal active
          </div>
          <div className="mono-label mt-1 opacity-70">On this device • Never key content</div>
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
    </>
  )
}
