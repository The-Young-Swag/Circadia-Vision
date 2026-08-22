import { Link, useRouterState } from '@tanstack/react-router'
import {
  GraduationCap,
  LayoutDashboard,
  Library,
  LineChart,
  Menu,
  Moon,
  MoreHorizontal,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useTheme } from '#/shared/hooks/useTheme'
import type { Theme } from '#/shared/hooks/useTheme'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  meta: string
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: LayoutDashboard,
    meta: 'OVERVIEW',
  },
  {
    to: '/review',
    label: 'Review',
    icon: GraduationCap,
    meta: 'SESSION',
  },
  {
    to: '/library',
    label: 'Library',
    icon: Library,
    meta: 'COLLECTION',
  },
  {
    to: '/insights',
    label: 'Insights',
    icon: LineChart,
    meta: 'ANALYTICS',
  },
]

const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    to: '/privacy',
    label: 'Privacy',
    icon: ShieldCheck,
    meta: 'CONTROL',
  },
]

const MOBILE_PRIMARY_ITEMS = PRIMARY_NAV_ITEMS.slice(0, 3)
const MOBILE_MORE_ITEMS = [
  ...PRIMARY_NAV_ITEMS.slice(3),
  ...SECONDARY_NAV_ITEMS,
]

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isReview = pathname.startsWith('/review')

  useEffect(() => {
    setMobileOpen(false)
    setMoreOpen(false)
  }, [pathname])

  return (
    <>
      {!isReview && (
        <MobileHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenNavigation={() => setMobileOpen(true)}
        />
      )}

      {!isReview && (
        <MobileBottomNavigation
          moreOpen={moreOpen}
          onToggleMore={() => setMoreOpen((open) => !open)}
        />
      )}

      {moreOpen && (
        <MobileMoreSheet
          items={MOBILE_MORE_ITEMS}
          onClose={() => setMoreOpen(false)}
        />
      )}

      {mobileOpen && (
        <MobileDrawer
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <DesktopSidebar
        collapsed={collapsed}
        isReview={isReview}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onExpand={() => setCollapsed(false)}
        onCollapse={() => setCollapsed(true)}
      />
    </>
  )
}

type MobileHeaderProps = {
  theme: Theme
  onToggleTheme: () => void
  onOpenNavigation: () => void
}

function MobileHeader({
  theme,
  onToggleTheme,
  onOpenNavigation,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-(--line) bg-(--surface) px-4 lg:hidden">
      <Link
        to="/"
        className="flex items-center gap-2.5 no-underline"
      >
        <BrandMark />

        <span className="display text-lg tracking-tight text-(--ink)">
          Circadia
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle
          theme={theme}
          onToggle={onToggleTheme}
        />

        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenNavigation}
          className="grid h-9 w-9 place-items-center rounded-full bg-(--racing) text-white"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

function MobileBottomNavigation({
  moreOpen,
  onToggleMore,
}: {
  moreOpen: boolean
  onToggleMore: () => void
}) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="safe-area-pb fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-(--line) bg-(--surface) px-2 py-2 lg:hidden"
    >
      {MOBILE_PRIMARY_ITEMS.map((item) => (
        <MobileTab key={item.to} item={item} />
      ))}

      <button
        type="button"
        aria-label="More navigation options"
        aria-expanded={moreOpen}
        onClick={onToggleMore}
        className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-(--ink-soft)"
      >
        <MoreHorizontal size={20} aria-hidden="true" />
        <span className="mono-label text-[10px]">MORE</span>
      </button>
    </nav>
  )
}

function MobileMoreSheet({
  items,
  onClose,
}: {
  items: NavItem[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      <button
        type="button"
        aria-label="Close more navigation"
        onClick={onClose}
        className="flex-1 bg-black/30"
      />

      <div className="space-y-2 rounded-t-2xl border-t border-(--line) bg-(--surface) p-4">
        {items.map((item) => (
          <MoreNavLink
            key={item.to}
            item={item}
            onNavigate={onClose}
          />
        ))}

        <button
          type="button"
          onClick={onClose}
          className="btn-ghost mt-2 w-full"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function MoreNavLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-(--line) px-3 py-3"
    >
      <Icon size={18} aria-hidden="true" />

      <span className="font-medium">
        {item.label}
      </span>

      <span className="mono-label ml-auto">
        {item.meta}
      </span>
    </Link>
  )
}

function MobileDrawer({
  theme,
  onToggleTheme,
  onClose,
}: {
  theme: Theme
  onToggleTheme: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="flex-1 bg-black/40 backdrop-blur-[2px]"
      />

      <aside className="flex w-75 max-w-[84vw] flex-col border-l border-sidebar-border bg-sidebar shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <span className="mono-label text-(--ink-faint)">
            NAVIGATION
          </span>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-(--line)"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-auto p-4">
          <SidebarNav
            onNavigate={onClose}
          />
        </nav>

        <SidebarFooter
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </aside>
    </div>
  )
}

type DesktopSidebarProps = {
  collapsed: boolean
  isReview: boolean
  theme: Theme
  onToggleTheme: () => void
  onToggleCollapsed: () => void
  onExpand: () => void
  onCollapse: () => void
}

function DesktopSidebar({
  collapsed,
  isReview,
  theme,
  onToggleTheme,
  onToggleCollapsed,
  onExpand,
  onCollapse,
}: DesktopSidebarProps) {
  const widthClass = collapsed
    ? 'lg:w-[72px] hover:lg:w-[280px]'
    : 'lg:w-[280px]'

  const reviewClass = isReview
    ? 'opacity-40 hover:opacity-100'
    : ''

  return (
    <aside
      className={`sidebar-shell group/sidebar fixed inset-y-0 left-0 z-30 hidden flex-col transition-all duration-200 lg:flex ${widthClass} ${reviewClass}`}
      onMouseEnter={collapsed ? onExpand : undefined}
      onMouseLeave={collapsed ? onCollapse : undefined}
    >
      <div className="flex h-18 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <BrandMark />

        {!collapsed && (
          <div className="min-w-0 leading-none">
            <div className="display truncate text-xl tracking-tight">
              Circadia
            </div>

            <div className="mono-label mt-1 truncate text-(--ink-faint)">
              ADAPTIVE STUDY
            </div>
          </div>
        )}

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
          className="ml-auto hidden h-7 w-7 place-items-center rounded-full border border-sidebar-border text-(--ink-faint) hover:bg-sidebar-accent lg:grid"
        >
          <span className="mono-label text-[10px]" aria-hidden="true">
            {collapsed ? '→' : '←'}
          </span>
        </button>
      </div>

      <nav
        aria-label="Sidebar navigation"
        className="flex-1 space-y-6 overflow-auto px-3 py-6"
      >
        <SidebarNav collapsed={collapsed} />
      </nav>

      <SidebarFooter
        theme={theme}
        onToggleTheme={onToggleTheme}
        collapsed={collapsed}
      />
    </aside>
  )
}

function MobileTab({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-(--ink-soft)"
      activeProps={{
        className:
          'flex flex-col items-center gap-1 rounded-xl bg-(--racing) px-3 py-1.5 text-white',
      }}
    >
      <Icon size={20} aria-hidden="true" />

      <span className="mono-label text-[10px]">
        {item.label.toUpperCase()}
      </span>
    </Link>
  )
}

function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void
  collapsed?: boolean
}) {
  return (
    <div className="space-y-6">
      <NavSection
        label="Study"
        items={PRIMARY_NAV_ITEMS}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <NavSection
        label="Intelligence"
        items={SECONDARY_NAV_ITEMS}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    </div>
  )
}

function NavSection({
  label,
  items,
  collapsed,
  onNavigate,
}: {
  label: string
  items: NavItem[]
  collapsed: boolean
  onNavigate?: () => void
}) {
  const labelClass = collapsed
    ? 'hidden group-hover/sidebar:block'
    : ''

  return (
    <section>
      <div
        className={`sidebar-kicker mb-2 px-2 ${labelClass}`}
      >
        {label}
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarNavLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  )
}

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  const contentClass = collapsed
    ? 'hidden group-hover/sidebar:block'
    : ''

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className="sidebar-link group"
      activeProps={{
        className: 'sidebar-link is-active group',
      }}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-(--line) bg-(--surface-muted) transition-colors group-[.is-active]:border-white/20 group-[.is-active]:bg-white/15">
        <Icon
          size={16}
          aria-hidden="true"
          className="text-(--ink-soft) group-[.is-active]:text-white"
        />
      </span>

      <span
        className={`min-w-0 flex-1 leading-none ${contentClass}`}
      >
        <span className="block truncate text-sm">
          {item.label}
        </span>

        <span className="mono-label block truncate text-[10px] leading-none opacity-60 group-[.is-active]:opacity-80">
          {item.meta}
        </span>
      </span>
    </Link>
  )
}

function SidebarFooter({
  theme,
  onToggleTheme,
  collapsed = false,
}: {
  theme: Theme
  onToggleTheme: () => void
  collapsed?: boolean
}) {
  return (
    <>
      {collapsed && (
        <div className="flex flex-col items-center gap-2 border-t border-sidebar-border p-2 group-hover/sidebar:hidden">
          <SignalStatus />

          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />
        </div>
      )}

      <div
        className={`space-y-3 border-t border-sidebar-border p-4 ${
          collapsed ? 'hidden group-hover/sidebar:block' : ''
        }`}
      >
        <div className="rounded-xl border border-(--line) bg-(--surface-muted) p-3">
          <div className="mono-label">
            Personal signal
          </div>

          <SignalStatus showLabel />

          <div className="mono-label mt-1 opacity-70">
            On this device • Never key content
          </div>
        </div>

        <ThemeToggle
          theme={theme}
          onToggle={onToggleTheme}
          expanded
        />

        <div className="mono-label text-center opacity-60">
          © 2026 Circadia • Veridian/Emerald/BRG
        </div>
      </div>
    </>
  )
}

function SignalStatus({
  showLabel = false,
}: {
  showLabel?: boolean
}) {
  return (
    <div className={showLabel ? 'mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-(--ink-faint)' : undefined}>
      <span
        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-(--emerald)"
        aria-hidden="true"
        title="Personal signal active"
      />

      {showLabel && 'Personal signal active'}
    </div>
  )
}

function ThemeToggle({
  theme,
  onToggle,
  expanded = false,
}: {
  theme: Theme
  onToggle: () => void
  expanded?: boolean
}) {
  const isDark = theme === 'dark'
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Light mode' : 'Dark mode'

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label={`Switch to ${label.toLowerCase()}`}
        onClick={onToggle}
        className="grid h-8 w-8 place-items-center rounded-full border border-(--line)"
      >
        <Icon size={14} aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Switch to ${label.toLowerCase()}`}
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-full border border-(--line) bg-(--surface) px-3 py-2 text-sm font-medium hover:bg-(--surface-muted)"
    >
      <span className="flex items-center gap-2">
        <Icon size={16} aria-hidden="true" />
        {label}
      </span>

      <span className="mono-label rounded-full bg-(--racing) px-2 py-1 text-[10px] text-white">
        {theme.toUpperCase()}
      </span>
    </button>
  )
}

function BrandMark() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-(--racing) text-white shadow-sm">
      <span
        className="h-3 w-3 rounded-full bg-(--emerald)"
        aria-hidden="true"
      />
    </span>
  )
}