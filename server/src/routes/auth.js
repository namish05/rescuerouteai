import express from 'express';
import User from '../models/User.js';
import { signToken, protect } from '../middleware/auth.js';

const router = express.Router();

// Preset Demo Users
const DEMO_ACCOUNTS = {
  ambulance: {
    name: 'Vikram Sethi',
    email: 'ambulance@rescueroute.ai',
    role: 'ambulance',
    organization: 'National Ambulance Service (CAT 1)',
    badgeNumber: 'AMB-DEL-401',
    phone: '+91 98111 22334'
  },
  traffic_police: {
    name: 'Inspector Rajesh Verma',
    email: 'traffic@rescueroute.ai',
    role: 'traffic_police',
    organization: 'Central Traffic Operations & Corridor Desk',
    badgeNumber: 'TP-HQ-089',
    phone: '+91 98222 33445'
  },
  hospital: {
    name: 'Dr. Priya Sharma',
    email: 'hospital@rescueroute.ai',
    role: 'hospital',
    organization: 'AIIMS Apex Emergency & Trauma Center',
    badgeNumber: 'ER-CHIEF-01',
    phone: '+91 11 2658 8500'
  },
  admin: {
    name: 'Command Administrator',
    email: 'admin@rescueroute.ai',
    role: 'admin',
    organization: 'Emergency Operations Command Bureau',
    badgeNumber: 'ADM-SYS-001',
    phone: '+91 99999 00000'
  }
};

// 1-Click Demo Login
router.post('/demo-login', async (req, res) => {
  const { role = 'ambulance' } = req.body;
  const demoData = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.ambulance;

  try {
    let user = await User.findOne({ email: demoData.email });
    if (!user) {
      user = await User.create({
        ...demoData,
        password: 'Password123!'
      });
    }

    const token = signToken(user);
    res.json({
      success: true,
      message: `Logged in successfully as Demo ${role.toUpperCase()}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        badgeNumber: user.badgeNumber
      }
    });
  } catch (error) {
    // If DB is offline, return synthetic session
    const mockUser = {
      id: `demo-${role}-id`,
      name: demoData.name,
      email: demoData.email,
      role: demoData.role,
      organization: demoData.organization,
      badgeNumber: demoData.badgeNumber
    };
    const token = signToken(mockUser);
    res.json({
      success: true,
      message: `Logged in as Demo ${role.toUpperCase()} (Resilience Mode)`,
      token,
      user: mockUser
    });
  }
});

// Standard Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, organization, badgeNumber } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'ambulance',
      organization: organization || 'Emergency Medical Services',
      badgeNumber: badgeNumber || 'EMS-GEN'
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        badgeNumber: user.badgeNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Standard Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        badgeNumber: user.badgeNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Current User Profile
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
