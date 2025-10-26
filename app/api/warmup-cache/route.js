import { NextResponse } from 'next/server';
import { forceWarmup } from '../../../lib/cache-warmup';

/**
 * Manual cache warmup endpoint
 * Call this to pre-populate cache: GET /api/warmup-cache
 */
export async function GET(request) {
  try {
    console.log('🔥 Manual cache warmup triggered');
    
    const results = await forceWarmup();
    
    return NextResponse.json({
      success: true,
      message: 'Cache warmup completed',
      results
    });
    
  } catch (error) {
    console.error('Cache warmup error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Cache warmup failed' 
      },
      { status: 500 }
    );
  }
}
