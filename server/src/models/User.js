import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['ambulance', 'traffic_police', 'hospital', 'admin'],
    default: 'ambulance'
  },
  organization: { type: String, default: 'Emergency Medical Services' },
  badgeNumber: { type: String, default: 'EMS-001' },
  phone: { type: String, default: '+91 98765 43210' },
  accountStatus: { 
    type: String, 
    enum: ['active', 'pending', 'suspended'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
