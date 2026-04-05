import { NextRequest, NextResponse } from 'next/server';
import { query, runQuery } from '@/lib/db';
import crypto from 'crypto';

// Fungsi untuk menghasilkan HWID yang konsisten di seluruh browser
function generateHWID(deviceInfo: any): string {
  // HANYA gunakan data hardware yang benar-benar identik di semua browser
  const hwidData = {
    // Platform (Windows/Mac/Linux) - sama di semua browser
    platform: deviceInfo.platform,
    // Timezone - sama di semua browser
    timezone: deviceInfo.timezone,
    // Language - sama di semua browser
    language: deviceInfo.language,
    // Hardware concurrency (jumlah core CPU) - sama di semua browser
    hardwareConcurrency: deviceInfo.hardwareConcurrency,
    // Device memory - sama di semua browser
    deviceMemory: deviceInfo.deviceMemory,
    // Screen resolution - sama di semua browser di device yang sama
    screenResolution: deviceInfo.screenResolution
  };
  
  // Buat hash dari hardware identifiers
  const hwidString = JSON.stringify(hwidData);
  return crypto.createHash('sha256').update(hwidString).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const keyCode = req.headers.get('x-key-auth') || req.headers.get('X-Key-Auth');
    
    if (!keyCode) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }
    
    const { extensionId, deviceInfo, sessionId } = await req.json();
    
    let key = await query('SELECT * FROM keys WHERE key_code = ?', [keyCode.toUpperCase()]);
    
    if (!key) {
      return NextResponse.json({ valid: false, error: 'Invalid key' }, { status: 401 });
    }
    
    const now = new Date();
    const expiresAt = new Date(key.expires_at);
    
    if (now > expiresAt) {
      await runQuery('UPDATE keys SET status = ? WHERE key_code = ?', ['expired', keyCode.toUpperCase()]);
      return NextResponse.json({ valid: false, error: 'Key has expired' }, { status: 401 });
    }
    
    // Generate HWID yang konsisten
    const hwid = generateHWID(deviceInfo);
    console.log('Generated HWID:', hwid.substring(0, 32));
    console.log('Device info used for HWID:', {
      platform: deviceInfo.platform,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      hardwareConcurrency: deviceInfo.hardwareConcurrency,
      deviceMemory: deviceInfo.deviceMemory,
      screenResolution: deviceInfo.screenResolution
    });
    
    // First time activation - lock to HWID
    if (key.locked_to_device === 0) {
      await runQuery(`
        UPDATE keys 
        SET device_fingerprint = ?, 
            locked_to_device = 1, 
            activated_at = ?,
            status = 'active'
        WHERE key_code = ?
      `, [hwid, now.toISOString(), keyCode.toUpperCase()]);
      
      key = await query('SELECT * FROM keys WHERE key_code = ?', [keyCode.toUpperCase()]);
      
      return NextResponse.json({
        valid: true,
        expiresAt: key.expires_at,
        duration: key.duration_hours,
        hwid: hwid.substring(0, 16),
        message: 'Key activated and locked to this device'
      });
    } 
    // Existing activation - check HWID
    else if (key.locked_to_device === 1) {
      // Compare HWID
      if (key.device_fingerprint !== hwid) {
        console.log('HWID mismatch:');
        console.log('  Stored:', key.device_fingerprint?.substring(0, 32));
        console.log('  Received:', hwid.substring(0, 32));
        return NextResponse.json({ 
          valid: false, 
          error: 'Key is locked to another device',
          code: 'DEVICE_MISMATCH'
        }, { status: 403 });
      }
    }
    
    const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const remainingHours = Math.floor(remainingSeconds / 3600);
    const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const remainingSecs = remainingSeconds % 60;
    
    return NextResponse.json({
      valid: true,
      expiresAt: key.expires_at,
      duration: key.duration_hours,
      remaining: {
        seconds: remainingSeconds,
        formatted: `${remainingHours}h ${remainingMinutes}m ${remainingSecs}s`,
        hours: remainingHours,
        minutes: remainingMinutes,
        seconds: remainingSecs
      },
      message: 'Key validated successfully'
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}