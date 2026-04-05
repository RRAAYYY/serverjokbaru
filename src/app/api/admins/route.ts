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
    
    const admins = await queryAll(`
      SELECT id, username, name, role, status, created_at as createdAt
      FROM admins 
      WHERE status != 'deleted'
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}