import mongoose from 'mongoose';

const KeySchema = new mongoose.Schema({
  keyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    default: 720,
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active',
  },
  deviceFingerprint: {
    type: String,
    sparse: true,
  },
  lockedToDevice: {
    type: Boolean,
    default: false,
  },
  authorizedSessions: [{
    sessionId: String,
    lastActive: Date,
    ip: String,
  }],
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Key || mongoose.model('Key', KeySchema);