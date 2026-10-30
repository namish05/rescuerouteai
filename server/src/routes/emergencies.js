import express from 'express';
import Emergency from '../models/Emergency.js';
import Ambulance from '../models/Ambulance.js';
import TrafficAlert from '../models/TrafficAlert.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Realistic Delhi Intersections along Connaught Place -> AIIMS corridor
export const SAMPLE_INTERSECTIONS = [
  { id: 'INT-01', name: 'Janpath & Tolstoy Marg Cross', lat: 28.6258, lng: 77.2195, status: 'cleared_green', clearedBy: 'Auto-AI Corridor Sync' },
  { id: 'INT-02', name: 'Windsor Place / Ashoka Rd Roundabout', lat: 28.6180, lng: 77.2144, status: 'cleared_green', clearedBy: 'Desk 4 - Officer Verma' },
  { id: 'INT-03', name: 'Prithviraj Road Junction', lat: 28.6010, lng: 77.2162, status: 'pending_clearance', clearedBy: null },
  { id: 'INT-04', name: 'Safdarjung Airport / Ring Rd Flyover', lat: 28.5835, lng: 77.2120, status: 'pending_clearance', clearedBy: null },
  { id: 'INT-05', name: 'AIIMS Ring Road North Gate Crossing', lat: 28.5695, lng: 77.2085, status: 'normal_red', clearedBy: null }
];

// Sample waypoints from Connaught Place to AIIMS Apex Trauma Center
export const SAMPLE_ROUTE_COORDS = [
  [28.6315, 77.2167], // Connaught Place
  [28.6285, 77.2185], // Janpath start
  [28.6258, 77.2195], // Tolstoy cross
  [28.6220, 77.2170], // Windsor Place approach
  [28.6180, 77.2144], // Windsor circle
  [28.6120, 77.2155], // Sunheri Masjid junction
  [28.6050, 77.2160], // Prithviraj road north
  [28.6010, 77.2162], // Prithviraj junction
  [28.5920, 77.2140], // Safdarjung Tomb area
  [28.5835, 77.2120], // Safdarjung flyover approach
  [28.5770, 77.2105], // Ring road access
  [28.5695, 77.2085], // AIIMS Flyover underpass
  [28.5672, 77.2100]  // AIIMS Trauma Center Emergency ER Gate
];

export const INITIAL_EMERGENCIES = [
  {
    emergencyId: 'EMG-8801',
    ambulanceId: 'AMB-101',
    pickupLocation: {
      lat: 28.6315,
      lng: 77.2167,
      address: 'Inner Circle Block B, Connaught Place, New Delhi'
    },
    destinationHospital: {
      name: 'AIIMS Apex Trauma Center & Hospital',
      lat: 28.5672,
      lng: 77.2100,
      address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi'
    },
    patientInfo: {
      urgency: 'critical_red',
      conditionSummary: 'Severe Acute Myocardial Infarction (STEMI) + Arrhythmia',
      ageGroup: 'Adult Male (54)',
      vitals: {
        heartRateBpm: 122,
        bloodPressure: '150/98',
        spO2Percent: 89,
        temperatureC: 37.2
      },
      triageNotes: 'Cath-lab required urgently on arrival. CPR protocol kept on standby.'
    },
    status: 'green_corridor_active',
    routeDetails: {
      selectedRouteName: 'AI Dynamic Green Corridor (Janpath - Aurobindo)',
      distanceKm: 8.4,
      baselineTimeMin: 26,
      estimatedTimeMin: 11,
      timeSavedMin: 15,
      routeCoordinates: SAMPLE_ROUTE_COORDS,
      intersections: SAMPLE_INTERSECTIONS
    },
    greenCorridorActive: true,
    sosTriggered: false,
    hospitalReadiness: {
      status: 'trauma_bay_ready',
      bayAssigned: 'Cardiac Resuscitation Bay #1',
      leadDoctor: 'Dr. Priya Sharma (Interventional Cardiology)',
      confirmedAt: new Date(Date.now() - 5 * 60000)
    },
    trafficControlAcknowledgement: {
      status: 'corridor_active',
      controlRoomName: 'Delhi Central Traffic Police Command Desk',
      operatorName: 'Inspector Rajesh Verma',
      acknowledgedAt: new Date(Date.now() - 6 * 60000)
    },
    activityLog: [
      { timestamp: new Date(Date.now() - 10 * 60000), actor: 'Paramedic Vikram', action: 'Emergency Initiated', details: 'Critical cardiac code red dispatch' },
      { timestamp: new Date(Date.now() - 8 * 60000), actor: 'System AI Engine', action: 'Route Computed', details: 'Identified 5 intersections along shortest path' },
      { timestamp: new Date(Date.now() - 6 * 60000), actor: 'Inspector Rajesh Verma', action: 'Corridor Approved', details: 'Authorized prioritized green wave clearance' },
      { timestamp: new Date(Date.now() - 5 * 60000), actor: 'Dr. Priya Sharma', action: 'Trauma Bay Pre-Cleared', details: 'Bay #1 prepped with defib & heparin infusion' }
    ],
    createdTimestamp: new Date(Date.now() - 10 * 60000)
  }
];

let memoryEmergencies = JSON.parse(JSON.stringify(INITIAL_EMERGENCIES));

// Get all emergencies
router.get('/', async (req, res) => {
  const { status } = req.query;
  try {
    const query = status ? { status } : {};
    const emergencies = await Emergency.find(query).sort({ createdTimestamp: -1 }).lean();
    if (emergencies && emergencies.length > 0) {
      return res.json({ success: true, count: emergencies.length, emergencies });
    }
    return res.json({ success: true, count: memoryEmergencies.length, emergencies: memoryEmergencies });
  } catch (err) {
    return res.json({ success: true, count: memoryEmergencies.length, emergencies: memoryEmergencies });
  }
});

// Get emergency by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const emg = await Emergency.findOne({ emergencyId: id }).lean();
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) return res.json({ success: true, emergency: mem });

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Create new emergency
router.post('/', protect, async (req, res) => {
  const {
    ambulanceId = 'AMB-101',
    paramedicName,
    paramedicPhone,
    ambulanceNumberPlate,
    equipment = [],
    pickupLocation,
    destinationHospital,
    patientInfo = {},
    routeCoordinates,
    intersections,
    estimatedTimeMin = 12,
    baselineTimeMin = 25,
    distanceKm = 8.5
  } = req.body;

  const emergencyId = `EMG-${Math.floor(1000 + Math.random() * 9000)}`;

  const newEmergencyData = {
    emergencyId,
    ambulanceId: ambulanceId || 'AMB-101',
    paramedicName: paramedicName || req.user?.name || 'Field Paramedic',
    paramedicPhone: paramedicPhone || '+91 98765 43210',
    ambulanceNumberPlate: ambulanceNumberPlate || 'DL 1C AA 4421',
    equipment: equipment || ['Ventilator', 'Oxygen Tank', 'Defibrillator'],
    operatorId: req.user?._id,
    pickupLocation: pickupLocation || {
      lat: 28.6315,
      lng: 77.2167,
      address: 'Connaught Place, New Delhi'
    },
    destinationHospital: destinationHospital || {
      name: 'AIIMS Apex Trauma Center & Hospital',
      lat: 28.5672,
      lng: 77.2100,
      address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi'
    },
    patientInfo: {
      urgency: patientInfo.urgency || 'critical_red',
      patientName: patientInfo.patientName || 'Emergency Patient',
      gender: patientInfo.gender || 'Adult Male',
      ageGroup: patientInfo.ageGroup || '52 yrs',
      bloodGroup: patientInfo.bloodGroup || 'O+',
      callerName: patientInfo.callerName || '',
      callerPhone: patientInfo.callerPhone || '',
      conditionSummary: patientInfo.conditionSummary || 'Emergency Medical Response Required',
      vitals: {
        heartRateBpm: Number(patientInfo.vitals?.heartRateBpm) || 110,
        bloodPressure: patientInfo.vitals?.bloodPressure || '135/90',
        spO2Percent: Number(patientInfo.vitals?.spO2Percent) || 93,
        temperatureC: Number(patientInfo.vitals?.temperatureC) || 37.0,
        respiratoryRate: Number(patientInfo.vitals?.respiratoryRate) || 18,
        bloodSugarMgDl: Number(patientInfo.vitals?.bloodSugarMgDl) || 110
      },
      triageNotes: patientInfo.triageNotes || 'Priority route requested'
    },
    status: 'en_route_hospital',
    routeDetails: {
      selectedRouteName: 'AI Dynamic Emergency Route',
      distanceKm: Number(distanceKm) || 8.4,
      baselineTimeMin: Number(baselineTimeMin) || 25,
      estimatedTimeMin: Number(estimatedTimeMin) || 12,
      timeSavedMin: (Number(baselineTimeMin) || 25) - (Number(estimatedTimeMin) || 12),
      routeCoordinates: routeCoordinates || SAMPLE_ROUTE_COORDS,
      intersections: intersections || SAMPLE_INTERSECTIONS
    },
    greenCorridorActive: false,
    sosTriggered: false,
    hospitalReadiness: {
      status: 'alerted',
      bayAssigned: 'Emergency Triage Room',
      leadDoctor: 'ER Physician On-Duty',
      confirmedAt: null
    },
    trafficControlAcknowledgement: {
      status: 'pending',
      controlRoomName: 'Central Traffic Operations',
      operatorName: 'Traffic Operator',
      acknowledgedAt: null
    },
    activityLog: [
      {
        timestamp: new Date(),
        actor: req.user?.name || paramedicName || 'Ambulance Operator',
        action: 'Incident Created',
        details: `Emergency created for ${ambulanceId} destined for ${destinationHospital?.name || 'AIIMS'}`
      }
    ],
    createdTimestamp: new Date()
  };

  try {
    const created = await Emergency.create(newEmergencyData);
    // Update ambulance status
    await Ambulance.findOneAndUpdate(
      { ambulanceId },
      { status: 'en_route_hospital', currentEmergencyId: emergencyId }
    );

    // Broadcast to all sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('new_emergency_created', created);
      io.emit('traffic_alert_broadcast', {
        emergencyId,
        ambulanceId,
        urgency: created.patientInfo.urgency,
        destination: created.destinationHospital.name,
        intersections: created.routeDetails.intersections
      });
      io.emit('hospital_incoming_ambulance', {
        emergencyId,
        ambulanceId,
        patientInfo: created.patientInfo,
        etaMinutes: created.routeDetails.estimatedTimeMin,
        destination: created.destinationHospital
      });
    }

    return res.status(201).json({ success: true, emergency: created });
  } catch (err) {
    // Memory fallback
    memoryEmergencies.unshift(newEmergencyData);
    const io = req.app.get('io');
    if (io) {
      io.emit('new_emergency_created', newEmergencyData);
      io.emit('traffic_alert_broadcast', {
        emergencyId,
        ambulanceId,
        urgency: newEmergencyData.patientInfo.urgency,
        destination: newEmergencyData.destinationHospital.name,
        intersections: newEmergencyData.routeDetails.intersections
      });
      io.emit('hospital_incoming_ambulance', {
        emergencyId,
        ambulanceId,
        patientInfo: newEmergencyData.patientInfo,
        etaMinutes: newEmergencyData.routeDetails.estimatedTimeMin,
        destination: newEmergencyData.destinationHospital
      });
    }
    return res.status(201).json({ success: true, emergency: newEmergencyData });
  }
});

// Trigger SOS Panic
router.post('/:id/sos', protect, async (req, res) => {
  const { id } = req.params;
  const { reason = 'CRITICAL CODE RED - Immediate Clearance Required' } = req.body;

  const logEntry = {
    timestamp: new Date(),
    actor: req.user?.name || 'Operator',
    action: '🚨 SOS PANIC ACTIVATED',
    details: reason
  };

  try {
    const emg = await Emergency.findOneAndUpdate(
      { emergencyId: id },
      {
        sosTriggered: true,
        sosTriggeredAt: new Date(),
        $push: { activityLog: logEntry }
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('sos_alert', {
        emergencyId: id,
        ambulanceId: emg?.ambulanceId || 'AMB-101',
        reason,
        timestamp: new Date()
      });
    }
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    mem.sosTriggered = true;
    mem.sosTriggeredAt = new Date();
    mem.activityLog.push(logEntry);
    const io = req.app.get('io');
    if (io) {
      io.emit('sos_alert', { emergencyId: id, ambulanceId: mem.ambulanceId, reason, timestamp: new Date() });
    }
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Request / Activate Green Corridor
router.post('/:id/green-corridor', protect, async (req, res) => {
  const { id } = req.params;
  const { requestedBy = req.user?.name || 'Ambulance Operator' } = req.body;

  const logEntry = {
    timestamp: new Date(),
    actor: requestedBy,
    action: 'Green Corridor Requested',
    details: 'Traffic priority clearance requested across route intersections'
  };

  try {
    const emg = await Emergency.findOneAndUpdate(
      { emergencyId: id },
      {
        greenCorridorActive: true,
        'trafficControlAcknowledgement.status': 'corridor_active',
        $push: { activityLog: logEntry }
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('green_corridor_activated', {
        emergencyId: id,
        ambulanceId: emg?.ambulanceId,
        intersections: emg?.routeDetails?.intersections
      });
    }
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    mem.greenCorridorActive = true;
    mem.trafficControlAcknowledgement.status = 'corridor_active';
    mem.activityLog.push(logEntry);
    const io = req.app.get('io');
    if (io) {
      io.emit('green_corridor_activated', {
        emergencyId: id,
        ambulanceId: mem.ambulanceId,
        intersections: mem.routeDetails.intersections
      });
    }
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Traffic Police Acknowledges and Clears Corridor
router.post('/:id/traffic-ack', protect, async (req, res) => {
  const { id } = req.params;
  const { 
    officerName = req.user?.name || 'Inspector Rajesh Verma', 
    controlDesk = 'Central Traffic Command',
    durationSeconds = 120,
    trafficNotes = 'Corridor cleared for priority ambulance passage'
  } = req.body;

  const logEntry = {
    timestamp: new Date(),
    actor: officerName,
    action: 'Traffic Clearance Acknowledged',
    details: `${controlDesk} authorized green wave (${durationSeconds}s override). Notes: ${trafficNotes}`
  };

  try {
    const emg = await Emergency.findOneAndUpdate(
      { emergencyId: id },
      {
        'trafficControlAcknowledgement.status': 'corridor_active',
        'trafficControlAcknowledgement.operatorName': officerName,
        'trafficControlAcknowledgement.controlRoomName': controlDesk,
        'trafficControlAcknowledgement.acknowledgedAt': new Date(),
        trafficNotes,
        greenCorridorActive: true,
        $push: { activityLog: logEntry }
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('traffic_ack_received', {
        emergencyId: id,
        officerName,
        controlDesk,
        durationSeconds,
        trafficNotes,
        status: 'corridor_active'
      });
    }
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    mem.trafficControlAcknowledgement = {
      status: 'corridor_active',
      operatorName: officerName,
      controlRoomName: controlDesk,
      acknowledgedAt: new Date()
    };
    mem.trafficNotes = trafficNotes;
    mem.greenCorridorActive = true;
    mem.activityLog.push(logEntry);
    const io = req.app.get('io');
    if (io) {
      io.emit('traffic_ack_received', {
        emergencyId: id,
        officerName,
        controlDesk,
        durationSeconds,
        trafficNotes,
        status: 'corridor_active'
      });
    }
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Clear Specific Intersection Signal
router.post('/:id/intersection-clear', protect, async (req, res) => {
  const { id } = req.params;
  const { intersectionId, status = 'cleared_green' } = req.body;

  const logEntry = {
    timestamp: new Date(),
    actor: req.user?.name || 'Traffic Controller',
    action: `Signal Updated: ${intersectionId}`,
    details: `Intersection status changed to ${status}`
  };

  try {
    const emg = await Emergency.findOne({ emergencyId: id });
    if (emg && emg.routeDetails && emg.routeDetails.intersections) {
      const targetInt = emg.routeDetails.intersections.find(i => i.id === intersectionId);
      if (targetInt) {
        targetInt.status = status;
        targetInt.clearedAt = new Date();
        targetInt.clearedBy = req.user?.name || 'Traffic Command';
      }
      emg.activityLog.push(logEntry);
      await emg.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('intersection_updated', {
          emergencyId: id,
          intersectionId,
          status,
          clearedBy: req.user?.name || 'Traffic Command'
        });
      }
      return res.json({ success: true, emergency: emg });
    }
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    const target = mem.routeDetails.intersections.find(i => i.id === intersectionId);
    if (target) {
      target.status = status;
      target.clearedAt = new Date();
      target.clearedBy = req.user?.name || 'Traffic Command';
    }
    mem.activityLog.push(logEntry);
    const io = req.app.get('io');
    if (io) {
      io.emit('intersection_updated', {
        emergencyId: id,
        intersectionId,
        status,
        clearedBy: req.user?.name || 'Traffic Command'
      });
    }
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Hospital Confirms ER Bay Readiness
router.post('/:id/hospital-ack', protect, async (req, res) => {
  const { id } = req.params;
  const { 
    bayAssigned = 'Trauma Bay #1', 
    leadDoctor = 'Dr. Priya Sharma', 
    department = 'Emergency Medicine & Critical Care',
    checklist = [],
    doctorNotes = 'Shock trauma team mobilized and standing by.',
    status = 'trauma_bay_ready' 
  } = req.body;

  const logEntry = {
    timestamp: new Date(),
    actor: leadDoctor,
    action: 'ER Readiness Confirmed',
    details: `${bayAssigned} reserved (${department}). Notes: ${doctorNotes}`
  };

  try {
    const emg = await Emergency.findOneAndUpdate(
      { emergencyId: id },
      {
        'hospitalReadiness.status': status,
        'hospitalReadiness.bayAssigned': bayAssigned,
        'hospitalReadiness.leadDoctor': leadDoctor,
        'hospitalReadiness.confirmedAt': new Date(),
        hospitalDoctorNotes: doctorNotes,
        $push: { activityLog: logEntry }
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital_bay_ready', {
        emergencyId: id,
        bayAssigned,
        leadDoctor,
        department,
        checklist,
        doctorNotes,
        status
      });
    }
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    mem.hospitalReadiness = {
      status,
      bayAssigned,
      leadDoctor,
      department,
      checklist,
      confirmedAt: new Date()
    };
    mem.hospitalDoctorNotes = doctorNotes;
    mem.activityLog.push(logEntry);
    const io = req.app.get('io');
    if (io) {
      io.emit('hospital_bay_ready', {
        emergencyId: id,
        bayAssigned,
        leadDoctor,
        department,
        checklist,
        doctorNotes,
        status
      });
    }
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Live Vitals Telemetry Update from Paramedic
router.patch('/:id/vitals', protect, async (req, res) => {
  const { id } = req.params;
  const { vitals = {}, notes } = req.body;

  const logEntry = {
    timestamp: new Date(),
    actor: req.user?.name || 'Paramedic',
    action: 'Vitals Updated In Transit',
    details: `HR: ${vitals.heartRateBpm || '--'} bpm, SpO2: ${vitals.spO2Percent || '--'}%, BP: ${vitals.bloodPressure || '--'}`
  };

  try {
    const emg = await Emergency.findOneAndUpdate(
      { emergencyId: id },
      {
        $set: {
          'patientInfo.vitals.heartRateBpm': Number(vitals.heartRateBpm) || 110,
          'patientInfo.vitals.bloodPressure': vitals.bloodPressure || '120/80',
          'patientInfo.vitals.spO2Percent': Number(vitals.spO2Percent) || 98,
          'patientInfo.vitals.temperatureC': Number(vitals.temperatureC) || 37.0,
          'patientInfo.vitals.respiratoryRate': Number(vitals.respiratoryRate) || 18,
          'patientInfo.vitals.bloodSugarMgDl': Number(vitals.bloodSugarMgDl) || 110,
          ...(notes ? { 'patientInfo.triageNotes': notes } : {})
        },
        $push: { activityLog: logEntry }
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('vitals_updated', {
        emergencyId: id,
        vitals: emg?.patientInfo?.vitals || vitals,
        triageNotes: notes || emg?.patientInfo?.triageNotes
      });
    }
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    if (!mem.patientInfo) mem.patientInfo = {};
    if (!mem.patientInfo.vitals) mem.patientInfo.vitals = {};
    mem.patientInfo.vitals = { ...mem.patientInfo.vitals, ...vitals };
    if (notes) mem.patientInfo.triageNotes = notes;
    mem.activityLog.push(logEntry);

    const io = req.app.get('io');
    if (io) {
      io.emit('vitals_updated', {
        emergencyId: id,
        vitals: mem.patientInfo.vitals,
        triageNotes: mem.patientInfo.triageNotes
      });
    }
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

// Delete specific emergency
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    await Emergency.findOneAndDelete({ emergencyId: id });
  } catch (err) {}
  memoryEmergencies = memoryEmergencies.filter(e => e.emergencyId !== id);
  const io = req.app.get('io');
  if (io) io.emit('emergency_deleted', { emergencyId: id });
  res.json({ success: true, message: `Emergency ${id} removed` });
});

// Reset Emergencies to Clean Fresh Slate or Defaults
router.post('/reset', protect, async (req, res) => {
  const { mode = 'clean' } = req.body; // 'clean' = empty or 'default' = re-seed
  try {
    await Emergency.deleteMany({});
  } catch (err) {}

  if (mode === 'default') {
    memoryEmergencies = JSON.parse(JSON.stringify(INITIAL_EMERGENCIES));
  } else {
    memoryEmergencies = [];
  }

  const io = req.app.get('io');
  if (io) io.emit('emergencies_reset', { mode });
  res.json({ success: true, count: memoryEmergencies.length, emergencies: memoryEmergencies });
});

// Complete Emergency / Arrival
router.post('/:id/complete', protect, async (req, res) => {
  const { id } = req.params;
  const logEntry = {
    timestamp: new Date(),
    actor: req.user?.name || 'Ambulance Operator',
    action: 'Patient Delivered at ER Trauma Bay',
    details: 'Trip successfully finished. Golden Hour target achieved.'
  };

  try {
    const emg = await Emergency.findOneAndUpdate(
      { emergencyId: id },
      {
        status: 'completed',
        completedTimestamp: new Date(),
        $push: { activityLog: logEntry }
      },
      { new: true }
    );
    if (emg) {
      await Ambulance.findOneAndUpdate({ ambulanceId: emg.ambulanceId }, { status: 'available', currentEmergencyId: null });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_completed', { emergencyId: id });
    }
    if (emg) return res.json({ success: true, emergency: emg });
  } catch (err) {}

  const mem = memoryEmergencies.find(e => e.emergencyId === id);
  if (mem) {
    mem.status = 'completed';
    mem.completedTimestamp = new Date();
    mem.activityLog.push(logEntry);
    const io = req.app.get('io');
    if (io) io.emit('emergency_completed', { emergencyId: id });
    return res.json({ success: true, emergency: mem });
  }

  res.status(404).json({ success: false, message: 'Emergency not found' });
});

export default router;
