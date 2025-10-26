import { NextResponse } from 'next/server';
import { createClient } from 'redis';

let redisClient = null;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Error:', err));
  }
  
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  
  return redisClient;
}

/**
 * One-time endpoint to seed the existing valid token into KV
 * DELETE THIS FILE after running once!
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { access_token, expires_at } = body;
    
    if (!access_token || !expires_at) {
      return NextResponse.json(
        { error: 'access_token and expires_at required' },
        { status: 400 }
      );
    }
    
    const ttl = expires_at - Math.floor(Date.now() / 1000);
    
    if (ttl <= 0) {
      return NextResponse.json(
        { error: 'Token already expired' },
        { status: 400 }
      );
    }
    
    const redis = await getRedisClient();
    await redis.set('guesty:token', JSON.stringify({
      access_token,
      expires_at,
      cached_at: Math.floor(Date.now() / 1000),
      expires_in_hours: Math.round(ttl / 3600)
    }), { EX: ttl });
    
    console.log(`✅ Token seeded into KV, expires in ${Math.round(ttl / 3600)} hours`);
    
    return NextResponse.json({
      success: true,
      message: 'Token seeded successfully',
      expires_at: new Date(expires_at * 1000).toISOString(),
      hours_remaining: Math.round(ttl / 3600)
    });
    
  } catch (error) {
    console.error('Seed token error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
