import mongoose from 'mongoose';

const trafficAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  emergencyId: { type: String, required: true },
  intersectionName: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  assignedControlRoom: { type: String, default: 'Central Traffic Command Center' },
  priority: {
    type: String,
    enum: ['standard', 'urgent', 'critical_corridor'],
    default: 'critical_corridor'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'corridor_green', 'congested_bypass', 'cleared'],
    default: 'pending'
  },
  signalPhaseOverride: {
    type: String,
    enum: ['normal_cycle', 'manual_green_wave', 'hold_cross_traffic'],
    default: 'normal_cycle'
  },
  reportedObstruction: {
    hasObstruction: { type: Boolean, default: false },
    type: { type: String, default: 'None' }, // e.g. "Stalled Bus", "Road Works"
    cleared: { type: Boolean, default: true }
  },
  notes: { type: String, default: 'Ambulance approaching at high speed. Clear north-south corridor.' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.TrafficAlert || mongoose.model('TrafficAlert', trafficAlertSchema);
