import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, default: 'New Delhi' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  contact: {
    phone: { type: String, default: '+91 11 2658 8500' },
    emergencyHotline: { type: String, default: '102' },
    email: { type: String, default: 'er@aiims.edu.in' }
  },
  capacity: {
    icuBedsAvailable: { type: Number, default: 8 },
    traumaBedsAvailable: { type: Number, default: 4 },
    generalBedsAvailable: { type: Number, default: 24 },
    doctorsOnDuty: { type: Number, default: 6 }
  },
  specialties: [{ type: String }],
  isVerified: { type: Boolean, default: true },
  readinessStatus: { 
    type: String, 
    enum: ['ready', 'surge_warning', 'full', 'maintenance'], 
    default: 'ready' 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
