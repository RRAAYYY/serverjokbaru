import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, runQuery } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function POST(req: NextRequest) {
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
    
    const currentAdmin = await query('SELECT role FROM admins WHERE id = ?', [decoded.id]);
    if (!currentAdmin || currentAdmin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can register new admins' }, { status: 403 });
    }
    
    const { username, password, name, role } = await req.json();
    
    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const existing = await query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 12);
    
    await runQuery(`INSERT INTO admins (username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, name, role || 'admin', new Date().toISOString()]);
    
    await runQuery(`
      INSERT INTO logs (action, admin_id, admin_username, details, ip, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin_created', decoded.id, decoded.username, `Created new admin: ${username} (${role || 'admin'})`, req.headers.get('x-forwarded-for') || 'unknown', new Date().toISOString()]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering admin:', error);
    return NextResponse.json({ error: 'Failed to register admin' }, { status: 500 });
  }
}