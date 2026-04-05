import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const { searchParams } = new URL(req.url);
    const keyCode = searchParams.get('key');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!keyCode) {
      return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }
    
    const key = db.prepare(`
      SELECT key_code as keyCode, name, status, 
             device_fingerprint as hwid, locked_to_device as lockedToDevice,
             created_at as createdAt, expires_at as expiresAt
      FROM keys WHERE key_code = ?
    `).get(keyCode.toUpperCase());
    
    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch key info' }, { status: 500 });
  }
}