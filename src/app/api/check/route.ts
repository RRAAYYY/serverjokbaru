import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const keyCode = req.headers.get('x-key-auth') || req.headers.get('X-Key-Auth');
    
    if (!keyCode) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }
    
    const key = await query('SELECT * FROM keys WHERE key_code = ?', [keyCode.toUpperCase()]);
    
    if (!key) {
      return NextResponse.json({ valid: false, error: 'Key not found' });
    }
    
    const now = new Date();
    const expiresAt = new Date(key.expires_at);
    const isValid = key.status === 'active' && now <= expiresAt;
    
    if (now > expiresAt && key.status === 'active') {
      await query('UPDATE keys SET status = ? WHERE key_code = ?', ['expired', keyCode.toUpperCase()]);
    }
    
    const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const remainingHours = Math.floor(remainingSeconds / 3600);
    const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const remainingSecs = remainingSeconds % 60;
    
    return NextResponse.json({
      valid: isValid,
      status: isValid ? 'active' : 'expired',
      expiresAt: key.expires_at,
      remaining: {
        seconds: remainingSeconds,
        formatted: `${remainingHours}h ${remainingMinutes}m ${remainingSecs}s`,
        hours: remainingHours,
        minutes: remainingMinutes,
        seconds: remainingSecs
      },
      lockedToDevice: key.locked_to_device === 1
    });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}