import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/onboarding(.*)',
  '/api/webhooks(.*)',
  '/api/onboarding(.*)',
  '/',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/acceleration(.*)',
  '/dimensions(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims, redirectToSignIn } = await auth()
  if (!userId) return redirectToSignIn()

  const meta = sessionClaims?.metadata as Record<string, string> | undefined
  const jwtCompanyId = meta?.companyId ?? ''
  const role = meta?.role ?? ''

  // Fallback: read httpOnly cookie if JWT hasn't propagated yet
  const cookieCompanyId = req.cookies.get('maturityiq_company')?.value ?? ''
  const companyId = jwtCompanyId || cookieCompanyId

  // No companyId anywhere → onboarding
  if (!companyId) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (isAdminRoute(req)) {
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
