import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Hospital from './models/Hospital.js';
import Ambulance from './models/Ambulance.js';
import Emergency from './models/Emergency.js';
import TrafficAlert from './models/TrafficAlert.js';
import { DEFAULT_HOSPITALS } from './routes/hospitals.js';
import { DEFAULT_AMBULANCES } from './routes/ambulances.js';
import { INITIAL_EMERGENCIES, SAMPLE_INTERSECTIONS } from './routes/emergencies.js';

const DEMO_USERS = [
  {
    name: 'Vikram Sethi',
    email: 'ambulance@rescueroute.ai',
    password: 'Password123!',
    role: 'ambulance',
    organization: 'National Ambulance Service (CAT 1)',
    badgeNumber: 'AMB-DEL-401',
    phone: '+91 98111 22334'
  },
  {
    name: 'Inspector Rajesh Verma',
    email: 'traffic@rescueroute.ai',
    password: 'Password123!',
    role: 'traffic_police',
    organization: 'Central Traffic Operations & Corridor Desk',
    badgeNumber: 'TP-HQ-089',
    phone: '+91 98222 33445'
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'hospital@rescueroute.ai',
    password: 'Password123!',
    role: 'hospital',
    organization: 'AIIMS Apex Emergency & Trauma Center',
    badgeNumber: 'ER-CHIEF-01',
    phone: '+91 11 2658 8500'
  },
  {
    name: 'Command Administrator',
    email: 'admin@rescueroute.ai',
    password: 'Password123!',
    role: 'admin',
    organization: 'Emergency Operations Command Bureau',
    badgeNumber: 'ADM-SYS-001',
    phone: '+91 99999 00000'
  }
];

export const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('⚠️ MONGODB_URI missing; skipping remote seed.');
      return;
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('🌱 Connected to MongoDB for seeding...');

    // Seed Users
    for (const u of DEMO_USERS) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`👤 Created user: ${u.email} (${u.role})`);
      }
    }

    // Seed Hospitals
    for (const h of DEFAULT_HOSPITALS) {
      const exists = await Hospital.findOne({ name: h.name });
      if (!exists) {
        const { _id, ...rest } = h;
        await Hospital.create(rest);
        console.log(`🏥 Created hospital: ${h.name}`);
      }
    }

    // Seed Ambulances
    for (const a of DEFAULT_AMBULANCES) {
      const exists = await Ambulance.findOne({ ambulanceId: a.ambulanceId });
      if (!exists) {
        await Ambulance.create(a);
        console.log(`🚑 Created ambulance: ${a.ambulanceId}`);
      }
    }

    // Seed Emergency
    for (const e of INITIAL_EMERGENCIES) {
      const exists = await Emergency.findOne({ emergencyId: e.emergencyId });
      if (!exists) {
        await Emergency.create(e);
        console.log(`🚨 Created emergency incident: ${e.emergencyId}`);
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

// Allow direct run
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}
