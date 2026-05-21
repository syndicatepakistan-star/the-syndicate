'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { RadialNav } from '@/components/RadialNav'
import type { NavSectionId } from '@/lib/marketing-nav-routes'
import {
  MARKETING_NAV_HREF,
  MARKETING_PREFETCH_ROUTES,
  prefetchMarketingRoutes,
} from '@/lib/marketing-nav-routes'

function getActiveNavId(pathname: string, hash: string): NavSectionId {
  if (hash === '#joinNowSection') return 'joinNow'
  if (pathname === '/affiliate-login' || pathname.startsWith('/affiliate-login/')) return 'affiliate'
  if (pathname === '/affiliate' || pathname.startsWith('/affiliate/')) return 'affiliate'
  if (pathname === '/quiz' || pathname.startsWith('/quiz/')) return 'syndicateAnalysis'
  if (pathname === '/what-you-get') return 'whatYouGet'
  if (pathname === '/our-methods') return 'ourMethods'
  if (pathname === '/programs') return 'programs'
  if (pathname === '/membership' || pathname === '/membership/') return 'membership'
  return 'home'
}

export function NavApp() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState<NavSectionId>('home')

  const warmRoutes = useCallback(() => {
    prefetchMarketingRoutes(router)
  }, [router])

  const handleToggleMenu = () => {
    if (menuOpen) {
      handleClose()
      return
    }
    warmRoutes()
    setMenuOpen(true)
  }

  const handleClose = () => {
    setMenuOpen(false)
  }

  useEffect(() => {
    const syncActive = () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      setActiveId(getActiveNavId(pathname, hash))
    }

    syncActive()
    window.addEventListener('hashchange', syncActive)
    return () => window.removeEventListener('hashchange', syncActive)
  }, [pathname])

  useEffect(() => {
    warmRoutes()
  }, [warmRoutes])

  useEffect(() => {
    if (!menuOpen) return
    warmRoutes()
  }, [menuOpen, warmRoutes])

  const handlePrefetch = (id: NavSectionId) => {
    router.prefetch(MARKETING_NAV_HREF[id])
  }

  const handleSelect = (id: NavSectionId) => {
    const targetRoute = MARKETING_NAV_HREF[id]
    setActiveId(id)
    if (pathname !== targetRoute) {
      router.push(targetRoute)
    }
    setMenuOpen(false)
  }

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex flex-col bg-gradient-to-b from-black/45 via-black/20 to-transparent transition-[height] duration-75 ease-out pt-2"
      style={{
        height: menuOpen ? '100dvh' : '69px',
        minHeight: menuOpen ? '100dvh' : undefined,
        overflow: menuOpen ? 'visible' : 'hidden',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
      }}
      role="banner"
    >
      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        <div
          className={`flex h-14 min-h-14 w-full shrink-0 items-center px-4 transition-[justify-content] duration-200 ease-in-out sm:h-16 sm:min-h-16 sm:px-5 ${
            menuOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          {!menuOpen && (
            <button
              type="button"
              onClick={handleToggleMenu}
              className="hamburger-attract absolute right-3 flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 rounded-lg border border-amber-300/70 bg-black/55 px-2.5 py-2.5 shadow-[0_0_16px_rgba(251,191,36,0.28)] sm:right-5 sm:px-3"
              aria-label="Open menu"
            >
              <span className="block h-0.5 w-5 rounded-full bg-amber-200" />
              <span className="block h-0.5 w-5 rounded-full bg-amber-200" />
              <span className="block h-0.5 w-4 rounded-full bg-amber-200" />
            </button>
          )}
        </div>
        <div
          className={
            menuOpen
              ? 'relative min-h-0 flex-1 overflow-visible p-2 sm:p-[10px]'
              : 'pointer-events-none h-0 min-h-0 overflow-hidden opacity-0'
          }
        >
          <RadialNav
            open={menuOpen}
            activeId={activeId}
            onClose={handleClose}
            onSelect={handleSelect}
            onPrefetch={handlePrefetch}
          />
        </div>
      </div>
      <div className="sr-only" aria-hidden>
        {MARKETING_PREFETCH_ROUTES.map((route) => (
          <Link key={route} href={route} prefetch tabIndex={-1}>
            {route}
          </Link>
        ))}
      </div>
    </div>
  )
}
