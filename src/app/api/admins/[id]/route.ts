import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query, runQuery } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Only superadmin can delete admins' }, { status: 403 });
    }
    
    const adminId = parseInt(params.id);
    const targetAdmin = await query('SELECT username, role FROM admins WHERE id = ?', [adminId]);
    
    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    
    if (targetAdmin.role === 'superadmin') {
      return NextResponse.json({ error: 'Cannot delete superadmin' }, { status: 403 });
    }
    
    await runQuery('UPDATE admins SET status = ? WHERE id = ?', ['deleted', adminId]);
    
    await runQuery(`
      INSERT INTO logs (action, admin_id, admin_username, details, ip, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin_deleted', decoded.id, decoded.username, `Deleted admin: ${targetAdmin.username}`, req.headers.get('x-forwarded-for') || 'unknown', new Date().toISOString()]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}