import { Link } from '@tanstack/react-router'
import {
  GraduationCap,
  LayoutDashboard,
  Library,
  LineChart,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react'

import { useTheme } from '#/shared/hooks/useTheme'

type NavigationItem = {
  to: '/' | '/library' | '/review' | '/insights' | '/privacy'
  label: string
  icon: typeof LayoutDashboard
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/library',
    label: 'Library',
    icon: Library,
  },
  {
    to: '/review',
    label: 'Review',
    icon: GraduationCap,
  },
  {
    to: '/insights',
    label: 'Insights',
    icon: LineChart,
  },
  {
    to: '/privacy',
    label: 'Privacy',
    icon: ShieldCheck,
  },
]

const DESKTOP_LINK_CLASS =
  'nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-full'

const MOBILE_LINK_CLASS =
  'p-2 rounded-lg border border-transparent'

const MOBILE_ACTIVE_LINK_CLASS =
  'p-2 rounded-lg bg-(--surface-muted) border border-(--line)'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-(--line) bg-(--nav-bg)">
      <nav className="page-wrap flex h-16 items-center gap-6">
        <Brand />

        <DesktopNavigation />

        <MobileNavigation />

        <ThemeButton
          theme={theme}
          onToggle={toggleTheme}
        />
      </nav>
    </header>
  )
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 no-underline text-(--ink)"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--ink) text-white">
        <span className="h-2 w-2 rounded-full bg-(--amber)" />
      </span>

      <span className="display text-[18px] tracking-tight">
        Circadia
      </span>

      <span className="hidden sm:inline text-xs font-medium text-(--ink-faint) tracking-wide">
        ADAPTIVE STUDY
      </span>
    </Link>
  )
}

function DesktopNavigation() {
  return (
    <div className="hidden md:flex items-center gap-1">
      {NAVIGATION_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={DESKTOP_LINK_CLASS}
          activeProps={{
            className: `${DESKTOP_LINK_CLASS} is-active`,
          }}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </div>
  )
}

function MobileNavigation() {
  return (
    <div className="flex md:hidden items-center gap-1 ml-1">
      {NAVIGATION_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          aria-label={label}
          className={MOBILE_LINK_CLASS}
          activeProps={{
            className: MOBILE_ACTIVE_LINK_CLASS,
          }}
        >
          <Icon size={18} />
        </Link>
      ))}
    </div>
  )
}

type ThemeButtonProps = {
  theme: 'light' | 'dark'
  onToggle: () => void
}

function ThemeButton({
  theme,
  onToggle,
}: ThemeButtonProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={onToggle}
      className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-(--line) bg-(--surface) text-(--ink-soft) hover:text-(--ink)"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}