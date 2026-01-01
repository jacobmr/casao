import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only apply to /family routes (except the login page itself and API auth endpoint)
  if (pathname.startsWith('/family')) {
    // Allow access to the password gate page and auth API
    if (pathname === '/family' || pathname === '/api/family/auth') {
      return NextResponse.next()
    }

    // Check for session cookie
    const sessionToken = request.cookies.get('family_session')?.value

    if (!sessionToken) {
      // Redirect to password gate
      return NextResponse.redirect(new URL('/family', request.url))
    }

    // Session validation will be done server-side in pages/APIs
    // Here we just check if cookie exists
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/family/:path*',
    '/api/family/:path*'
  ]
}
