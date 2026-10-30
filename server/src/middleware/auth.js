import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rescueroute_emergency_secure_jwt_token_key_2025';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Support demo token header for hackathon ease
  if (req.headers['x-demo-role']) {
    req.user = {
      _id: 'demo-user-id',
      name: `Demo ${req.headers['x-demo-role'].toUpperCase()} Operator`,
      email: `${req.headers['x-demo-role']}@rescueroute.demo`,
      role: req.headers['x-demo-role'],
      organization: 'Emergency Services Command'
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized: Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      // In case user was deleted or demo token
      req.user = {
        _id: decoded.id,
        name: decoded.name || 'Emergency Responder',
        email: decoded.email,
        role: decoded.role || 'ambulance'
      };
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized: Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized to perform this emergency action.`
      });
    }
    next();
  };
};

export const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};
