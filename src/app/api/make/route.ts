import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { runQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    const { name, duration = 24 } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }
    
    const keyCode = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
    
    await runQuery(`
      INSERT INTO keys (key_code, name, duration_hours, expires_at)
      VALUES (?, ?, ?, ?)
    `, [keyCode, name, duration, expiresAt.toISOString()]);
    
    await runQuery(`
      INSERT INTO logs (action, admin_id, admin_username, details, ip, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['key_generated', decoded.id, decoded.username, `Generated key: ${keyCode} (${name}) for ${duration} hours`, req.headers.get('x-forwarded-for') || 'unknown', new Date().toISOString()]);
    
    return NextResponse.json({ success: true, keyCode });
  } catch (error) {
    console.error('Error generating key:', error);
    return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
  }
}