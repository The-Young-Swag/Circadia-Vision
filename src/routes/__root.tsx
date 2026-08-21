import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/layout/Footer'
import Sidebar from '../components/layout/Sidebar'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles/app.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme'); var m=t==='dark'?'dark':'light'; document.documentElement.classList.toggle('dark', m==='dark');}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Circadia — Adaptive Study' },
      { name: 'description', content: 'Offline-first adaptive spaced-repetition that senses rhythm, adapts review, surfaces insight. On-device, timing-only.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[#f8fafc] dark:selection:bg-[#1e293b]">
        <div className="min-h-screen flex flex-col lg:flex-row">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col lg:pl-[280px]">
            {/* Mobile spacer is handled inside Sidebar top bar */}
            <main className="flex-1 min-h-[calc(100vh-64px)]">{children}</main>
            <Footer />
          </div>
        </div>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
