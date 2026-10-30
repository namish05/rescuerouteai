import express from 'express';
import Ambulance from '../models/Ambulance.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

export const DEFAULT_AMBULANCES = [
  {
    ambulanceId: 'AMB-101',
    vehicleNumber: 'DL 1C AA 4421',
    operatorName: 'Vikram Sethi (Lead Paramedic)',
    operatorPhone: '+91 98111 22334',
    currentLocation: {
      lat: 28.6304,
      lng: 77.2177,
      heading: 182,
      speedKmH: 52,
      lastUpdated: new Date()
    },
    status: 'en_route_hospital',
    currentEmergencyId: 'EMG-8801',
    equipmentLevel: 'ALS (Advanced Life Support)',
    equipmentList: ['Ventilator (Hamilton-T1)', 'Zoll Defibrillator', 'Multipara Monitor', 'Syringe Pumps'],
    batteryStatus: 92,
    oxygenLevel: 85
  },
  {
    ambulanceId: 'AMB-102',
    vehicleNumber: 'DL 1C BB 1092',
    operatorName: 'Arjun Das (Paramedic)',
    operatorPhone: '+91 98222 55667',
    currentLocation: {
      lat: 28.6139,
      lng: 77.2090,
      heading: 95,
      speedKmH: 40,
      lastUpdated: new Date()
    },
    status: 'available',
    currentEmergencyId: null,
    equipmentLevel: 'ALS (Advanced Life Support)',
    equipmentList: ['Defibrillator', 'Oxygen Tank', 'First Responder Kit'],
    batteryStatus: 98,
    oxygenLevel: 95
  },
  {
    ambulanceId: 'AMB-103',
    vehicleNumber: 'DL 2C CC 7731',
    operatorName: 'Sneha Patel (EMT Specialist)',
    operatorPhone: '+91 98333 77889',
    currentLocation: {
      lat: 28.5855,
      lng: 77.2215,
      heading: 210,
      speedKmH: 0,
      lastUpdated: new Date()
    },
    status: 'available',
    currentEmergencyId: null,
    equipmentLevel: 'Neonatal ICU',
    equipmentList: ['Transport Incubator', 'Micro-infusion Pump', 'Infant Resuscitator'],
    batteryStatus: 88,
    oxygenLevel: 90
  },
  {
    ambulanceId: 'AMB-104',
    vehicleNumber: 'DL 3C DD 3311',
    operatorName: 'Manish Kumar (Driver/Paramedic)',
    operatorPhone: '+91 98444 88990',
    currentLocation: {
      lat: 28.6508,
      lng: 77.2334,
      heading: 45,
      speedKmH: 0,
      lastUpdated: new Date()
    },
    status: 'available',
    currentEmergencyId: null,
    equipmentLevel: 'BLS (Basic Life Support)',
    equipmentList: ['Oxygen Cylinder', 'Spine Board', 'Basic Trauma Kit'],
    batteryStatus: 100,
    oxygenLevel: 92
  }
];

let memoryAmbulances = [...DEFAULT_AMBULANCES];

// Get all ambulances
router.get('/', async (req, res) => {
  try {
    const list = await Ambulance.find().lean();
    if (list && list.length > 0) {
      return res.json({ success: true, count: list.length, ambulances: list });
    }
    res.json({ success: true, count: memoryAmbulances.length, ambulances: memoryAmbulances });
  } catch (err) {
    res.json({ success: true, count: memoryAmbulances.length, ambulances: memoryAmbulances });
  }
});

// Get single ambulance
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const amb = await Ambulance.findOne({ ambulanceId: id }).lean();
    if (amb) return res.json({ success: true, ambulance: amb });
  } catch (err) {}

  const mem = memoryAmbulances.find(a => a.ambulanceId === id);
  if (mem) return res.json({ success: true, ambulance: mem });

  res.status(404).json({ success: false, message: 'Ambulance not found' });
});

// Update location in real time
router.post('/:id/location', protect, async (req, res) => {
  const { id } = req.params;
  const { lat, lng, heading = 0, speedKmH = 45, emergencyId } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
  }

  const updateData = {
    currentLocation: {
      lat,
      lng,
      heading,
      speedKmH,
      lastUpdated: new Date()
    }
  };

  if (emergencyId) {
    updateData.currentEmergencyId = emergencyId;
  }

  try {
    const amb = await Ambulance.findOneAndUpdate({ ambulanceId: id }, updateData, { new: true });
    // Broadcast via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('ambulance_location_updated', {
        ambulanceId: id,
        emergencyId: emergencyId || amb?.currentEmergencyId,
        location: updateData.currentLocation
      });
    }
    if (amb) return res.json({ success: true, ambulance: amb });
  } catch (err) {}

  // In-memory update
  const idx = memoryAmbulances.findIndex(a => a.ambulanceId === id);
  if (idx !== -1) {
    memoryAmbulances[idx] = {
      ...memoryAmbulances[idx],
      currentLocation: updateData.currentLocation,
      currentEmergencyId: emergencyId || memoryAmbulances[idx].currentEmergencyId
    };
    const io = req.app.get('io');
    if (io) {
      io.emit('ambulance_location_updated', {
        ambulanceId: id,
        emergencyId: memoryAmbulances[idx].currentEmergencyId,
        location: updateData.currentLocation
      });
    }
    return res.json({ success: true, ambulance: memoryAmbulances[idx] });
  }

  res.json({ success: true, message: 'Location updated in simulation cache', location: updateData.currentLocation });
});

// Update status
router.patch('/:id/status', protect, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const amb = await Ambulance.findOneAndUpdate({ ambulanceId: id }, { status }, { new: true });
    const io = req.app.get('io');
    if (io) io.emit('ambulance_status_updated', { ambulanceId: id, status });
    if (amb) return res.json({ success: true, ambulance: amb });
  } catch (err) {}

  const idx = memoryAmbulances.findIndex(a => a.ambulanceId === id);
  if (idx !== -1) {
    memoryAmbulances[idx].status = status;
    const io = req.app.get('io');
    if (io) io.emit('ambulance_status_updated', { ambulanceId: id, status });
    return res.json({ success: true, ambulance: memoryAmbulances[idx] });
  }

  res.status(404).json({ success: false, message: 'Ambulance not found' });
});

export default router;
