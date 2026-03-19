import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/onboarding(.*)',
  '/api/webhooks(.*)',
  '/api/onboarding(.*)',
  '/api/fix-user(.*)',
  '/api/debug(.*)',
  '/',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/acceleration(.*)',
  '/dimensions(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Public routes — let through
  if (isPublicRoute(req)) return NextResponse.next()

  // Not logged in — redirect to login
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Logged in but no companyId — redirect to onboarding
  const meta = sessionClaims?.metadata as Record<string, string> | undefined
  const companyId = meta?.companyId ?? ''

  if (!companyId && !req.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Admin route protection
  if (isAdminRoute(req)) {
    const role = meta?.role ?? ''
    if (!['SuperUser', 'Admin'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
