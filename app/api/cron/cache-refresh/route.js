import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job - Cache Refresh
 * Runs daily at 2 AM UTC
 * Triggered by Vercel Cron: https://vercel.com/docs/cron-jobs
 */
export async function GET(request) {
  // Verify this is actually a cron request from Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕐 Cron job started: Cache refresh');
  
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    // Call the warmup endpoint
    const response = await fetch(`${baseUrl}/api/warmup-cache`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Warmup failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Cron job completed successfully');
    console.log('Results:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Cache refresh completed',
      timestamp: new Date().toISOString(),
      results: result
    });
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
