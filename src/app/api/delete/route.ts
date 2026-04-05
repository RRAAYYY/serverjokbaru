import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query, runQuery } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(req.url);
    const keyCode = searchParams.get('key');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!keyCode) {
      return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }
    
    const key = await query('SELECT key_code, name FROM keys WHERE key_code = ?', [keyCode.toUpperCase()]);
    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }
    
    await runQuery('DELETE FROM keys WHERE key_code = ?', [keyCode.toUpperCase()]);
    
    await runQuery(`
      INSERT INTO logs (action, admin_id, admin_username, details, ip, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['key_deleted', decoded.id, decoded.username, `Deleted key: ${key.key_code} (${key.name})`, req.headers.get('x-forwarded-for') || 'unknown', new Date().toISOString()]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key:', error);
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
  }
}