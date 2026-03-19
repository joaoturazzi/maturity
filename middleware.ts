import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPlatformRoute = ['/dashboard', '/diagnostic', '/action-plans',
    '/checkins', '/reports', '/ai-agents', '/acceleration', '/dimensions', '/admin'].some(
    p => req.nextUrl.pathname.startsWith(p)
  )

  if (isPlatformRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin/SuperUser route protection
  const protectedAdminRoutes = ['/admin', '/acceleration', '/dimensions']
  const isProtectedAdmin = protectedAdminRoutes.some(
    r => req.nextUrl.pathname.startsWith(r)
  )

  if (isProtectedAdmin && isLoggedIn) {
    const userRole = req.auth?.user?.role
    if (!['SuperUser', 'Admin'].includes(userRole ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
