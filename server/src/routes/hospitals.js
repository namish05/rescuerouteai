import express from 'express';
import Hospital from '../models/Hospital.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Fallback seed hospitals in Delhi / NCR
export const DEFAULT_HOSPITALS = [
  {
    _id: '674e11111111111111111101',
    name: 'AIIMS Apex Trauma Center & Hospital',
    city: 'New Delhi',
    location: {
      lat: 28.5672,
      lng: 77.2100,
      address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi'
    },
    contact: {
      phone: '+91 11 2658 8500',
      emergencyHotline: '102 / 1066',
      email: 'trauma.er@aiims.edu.in'
    },
    capacity: {
      icuBedsAvailable: 6,
      traumaBedsAvailable: 3,
      generalBedsAvailable: 18,
      doctorsOnDuty: 8
    },
    specialties: ['Level-1 Trauma', 'Cardiology (STEMI)', 'Neurotrauma', 'Emergency Surgery'],
    isVerified: true,
    readinessStatus: 'ready'
  },
  {
    _id: '674e11111111111111111102',
    name: 'Safdarjung Super Speciality Hospital',
    city: 'New Delhi',
    location: {
      lat: 28.5709,
      lng: 77.2078,
      address: 'Ring Road, Opposite AIIMS, New Delhi'
    },
    contact: {
      phone: '+91 11 2616 5060',
      emergencyHotline: '102',
      email: 'er@safdarjung.nic.in'
    },
    capacity: {
      icuBedsAvailable: 4,
      traumaBedsAvailable: 2,
      generalBedsAvailable: 22,
      doctorsOnDuty: 5
    },
    specialties: ['Burns Unit', 'Pediatric Trauma', 'Orthopedic Surgery'],
    isVerified: true,
    readinessStatus: 'ready'
  },
  {
    _id: '674e11111111111111111103',
    name: 'Sir Ganga Ram Hospital',
    city: 'New Delhi',
    location: {
      lat: 28.6387,
      lng: 77.1895,
      address: 'Rajinder Nagar, New Delhi'
    },
    contact: {
      phone: '+91 11 2575 0000',
      emergencyHotline: '+91 11 4225 1000',
      email: 'emergency@sgrh.com'
    },
    capacity: {
      icuBedsAvailable: 5,
      traumaBedsAvailable: 4,
      generalBedsAvailable: 14,
      doctorsOnDuty: 7
    },
    specialties: ['Cardiology', 'Pulmonology', 'Critical Care', 'Stroke Center'],
    isVerified: true,
    readinessStatus: 'ready'
  },
  {
    _id: '674e11111111111111111104',
    name: 'Max Super Speciality Hospital Saket',
    city: 'New Delhi',
    location: {
      lat: 28.5284,
      lng: 77.2114,
      address: '1, 2 Press Enclave Marg, Saket, New Delhi'
    },
    contact: {
      phone: '+91 11 2651 5050',
      emergencyHotline: '011-40554055',
      email: 'emergency.saket@maxhealthcare.com'
    },
    capacity: {
      icuBedsAvailable: 8,
      traumaBedsAvailable: 5,
      generalBedsAvailable: 28,
      doctorsOnDuty: 9
    },
    specialties: ['Cardiac Sciences', 'Neurosciences', 'Organ Transplant'],
    isVerified: true,
    readinessStatus: 'ready'
  }
];

// In-memory cache fallback
let memoryHospitals = [...DEFAULT_HOSPITALS];

// Get all hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find().lean();
    if (hospitals && hospitals.length > 0) {
      return res.json({ success: true, count: hospitals.length, hospitals });
    }
    // If DB has none yet, return defaults
    res.json({ success: true, count: memoryHospitals.length, hospitals: memoryHospitals });
  } catch (err) {
    res.json({ success: true, count: memoryHospitals.length, hospitals: memoryHospitals });
  }
});

// Update readiness/capacity
router.patch('/:id/status', protect, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const hospital = await Hospital.findByIdAndUpdate(id, updates, { new: true });
    if (hospital) {
      // Notify via socket
      const io = req.app.get('io');
      if (io) {
        io.emit('hospital_capacity_updated', { hospitalId: id, capacity: hospital.capacity, readinessStatus: hospital.readinessStatus });
      }
      return res.json({ success: true, hospital });
    }
  } catch (err) {
    // Memory fallback
  }

  // Update memory
  const idx = memoryHospitals.findIndex(h => h._id === id || String(h._id) === id);
  if (idx !== -1) {
    memoryHospitals[idx] = { ...memoryHospitals[idx], ...updates };
    const io = req.app.get('io');
    if (io) {
      io.emit('hospital_capacity_updated', { hospitalId: id, ...updates });
    }
    return res.json({ success: true, hospital: memoryHospitals[idx] });
  }

  res.status(404).json({ success: false, message: 'Hospital not found' });
});

export default router;
