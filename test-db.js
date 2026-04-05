const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'license.db');
console.log('DB Path:', dbPath);

const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create superadmin
const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('superadmin');
if (!admin) {
  const hashedPassword = bcrypt.hashSync('superadmin123', 12);
  db.prepare('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)')
    .run('superadmin', hashedPassword, 'Super Admin', 'superadmin');
  console.log('✅ Superadmin created');
} else {
  console.log('✅ Superadmin exists');
}

// Test query
const admins = db.prepare('SELECT * FROM admins').all();
console.log('Admins:', admins);

console.log('Database test successful!');