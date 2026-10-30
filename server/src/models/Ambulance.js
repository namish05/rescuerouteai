import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema({
  ambulanceId: { type: String, required: true, unique: true },
  vehicleNumber: { type: String, required: true },
  assignedOperator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operatorName: { type: String, default: 'Paramedic Team Alpha' },
  operatorPhone: { type: String, default: '+91 98101 23456' },
  currentLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speedKmH: { type: Number, default: 48 },
    lastUpdated: { type: Date, default: Date.now }
  },
  status: {
    type: String,
    enum: ['available', 'dispatched', 'en_route_pickup', 'en_route_hospital', 'arrived', 'maintenance', 'offline'],
    default: 'available'
  },
  currentEmergencyId: { type: String, default: null },
  hospitalAffiliation: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  equipmentLevel: { type: String, enum: ['ALS (Advanced Life Support)', 'BLS (Basic Life Support)', 'Neonatal ICU'], default: 'ALS (Advanced Life Support)' },
  equipmentList: [{ type: String }],
  batteryStatus: { type: Number, default: 94 },
  oxygenLevel: { type: Number, default: 88 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Ambulance || mongoose.model('Ambulance', ambulanceSchema);
