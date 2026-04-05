const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env.local' });

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  createdAt: Date,
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const existing = await Admin.findOne({ username: 'admin' });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await Admin.create({
      username: 'admin',
      password: hashedPassword,
      role: 'superadmin',
      createdAt: new Date()
    });
    console.log('Admin created: admin / admin123');
  } else {
    console.log('Admin already exists');
  }
  
  process.exit();
}

createAdmin();