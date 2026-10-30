import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  emergencyId: { type: String, required: true, unique: true },
  ambulanceId: { type: String, required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickupLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: 'Connaught Place Outer Circle, New Delhi' }
  },
  destinationHospital: {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi' }
  },
  patientInfo: {
    urgency: {
      type: String,
      enum: ['critical_red', 'serious_yellow', 'moderate_green'],
      default: 'critical_red'
    },
    patientName: { type: String, default: 'Emergency Patient' },
    gender: { type: String, default: 'Adult' },
    bloodGroup: { type: String, default: 'Unknown' },
    callerName: { type: String, default: '' },
    callerPhone: { type: String, default: '' },
    conditionSummary: { type: String, default: 'Acute Cardiac Event - STEMI Suspicion' },
    ageGroup: { type: String, default: 'Adult Male (52)' },
    vitals: {
      heartRateBpm: { type: Number, default: 114 },
      bloodPressure: { type: String, default: '145/95' },
      spO2Percent: { type: Number, default: 91 },
      temperatureC: { type: Number, default: 37.1 },
      respiratoryRate: { type: Number, default: 18 },
      bloodSugarMgDl: { type: Number, default: 110 }
    },
    triageNotes: { type: String, default: 'Patient conscious but disoriented. High priority trauma clearance needed.' }
  },
  paramedicName: { type: String, default: 'Field Paramedic' },
  paramedicPhone: { type: String, default: '' },
  ambulanceNumberPlate: { type: String, default: 'DL 1C AA 4421' },
  equipment: [{ type: String }],
  hospitalDoctorNotes: { type: String, default: '' },
  trafficNotes: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'requested',
      'assigned',
      'en_route_pickup',
      'patient_onboard',
      'green_corridor_active',
      'approaching_hospital',
      'completed',
      'cancelled'
    ],
    default: 'requested'
  },
  routeDetails: {
    selectedRouteName: { type: String, default: 'AI Optimal Green Corridor Route' },
    distanceKm: { type: Number, default: 8.4 },
    baselineTimeMin: { type: Number, default: 24 },
    estimatedTimeMin: { type: Number, default: 11 },
    timeSavedMin: { type: Number, default: 13 },
    routeCoordinates: [[Number]], // [[lat, lng], ...]
    intersections: [{
      id: String,
      name: String,
      lat: Number,
      lng: Number,
      status: {
        type: String,
        enum: ['normal_red', 'pending_clearance', 'cleared_green', 'congested', 'bypassed'],
        default: 'pending_clearance'
      },
      clearedAt: Date,
      clearedBy: String
    }]
  },
  greenCorridorActive: { type: Boolean, default: false },
  sosTriggered: { type: Boolean, default: false },
  sosTriggeredAt: { type: Date, default: null },
  hospitalReadiness: {
    status: {
      type: String,
      enum: ['alerted', 'trauma_bay_ready', 'icu_reserved', 'doctors_standing_by', 'patient_received'],
      default: 'alerted'
    },
    bayAssigned: { type: String, default: 'ER Bay #2 (Trauma Shock Room)' },
    leadDoctor: { type: String, default: 'Dr. Priya Sharma (Chief Trauma)' },
    confirmedAt: { type: Date, default: null }
  },
  trafficControlAcknowledgement: {
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'corridor_active', 'all_clear'],
      default: 'pending'
    },
    controlRoomName: { type: String, default: 'Delhi Central Traffic Police Command' },
    operatorName: { type: String, default: 'Officer R. Verma (Desk 4)' },
    acknowledgedAt: { type: Date, default: null }
  },
  activityLog: [{
    timestamp: { type: Date, default: Date.now },
    actor: String,
    action: String,
    details: String
  }],
  createdTimestamp: { type: Date, default: Date.now },
  completedTimestamp: { type: Date, default: null }
});

export default mongoose.models.Emergency || mongoose.model('Emergency', emergencySchema);
