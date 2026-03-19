import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { parseClerkMeta } from '@/lib/clerkMeta'

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

  const { companyId: jwtCompanyId = '', role = '' } = parseClerkMeta(sessionClaims)

  // Fallback: read httpOnly cookie if JWT hasn't propagated yet
  const cookieCompanyId = req.cookies.get('maturityiq_company')?.value ?? ''
  const companyId = jwtCompanyId || cookieCompanyId

  // No companyId anywhere → onboarding
  // Exception: /dashboard and /api/* pass through so they can check DB directly
  // (covers case where JWT template isn't configured and cookie doesn't exist yet)
  if (!companyId) {
    const path = req.nextUrl.pathname
    const isApiRoute = path.startsWith('/api/')
    const isDashboard = path.startsWith('/dashboard')
    if (!isApiRoute && !isDashboard) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
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
