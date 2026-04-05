import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { queryAll } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const keys = await queryAll(`
      SELECT id, key_code as keyCode, name, status, 
             device_fingerprint as hwid, locked_to_device as lockedToDevice,
             duration_hours, expires_at as expiresAt,
             created_at as createdAt
      FROM keys 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
  }
}