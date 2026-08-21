import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

import { getContext } from './integrations/tanstack-query/root-provider'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

function NotFound() {
  return (
    <div className="page-wrap py-16 text-center">
      <p className="kicker">404</p>
      <h1 className="display text-2xl mt-2">Page not found</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-2">
        That link doesn’t exist. Try the navigation above or head back to the
        dashboard.
      </p>
      <a href="/" className="btn-primary inline-flex mt-6 no-underline">
        Go to dashboard
      </a>
    </div>
  )
}

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
