import { NextResponse } from 'next/server'
import { verifyFamilyPassword, createFamilySession } from '@/lib/family-kv'
import { cookies } from 'next/headers'

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await verifyFamilyPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = await createFamilySession()

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('family_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // seconds
      path: '/'
    })

    console.log('✅ Family portal authentication successful')

    return NextResponse.json({
      success: true,
      message: 'Authentication successful'
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Logout - clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete('family_session')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
