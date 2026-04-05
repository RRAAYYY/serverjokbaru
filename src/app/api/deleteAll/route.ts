import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query, runQuery } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const count = await query('SELECT COUNT(*) as total FROM keys');
    await runQuery('DELETE FROM keys');
    
    await runQuery(`
      INSERT INTO logs (action, admin_id, admin_username, details, ip, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['keys_deleted_all', decoded.id, decoded.username, `Deleted all ${count.total} keys`, req.headers.get('x-forwarded-for') || 'unknown', new Date().toISOString()]);
    
    return NextResponse.json({ success: true, message: `Deleted ${count.total} keys` });
  } catch (error) {
    console.error('Error deleting all keys:', error);
    return NextResponse.json({ error: 'Failed to delete keys' }, { status: 500 });
  }
}