import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import { seedDatabase } from './seed.js';

// Route imports
import authRoutes from './routes/auth.js';
import ambulanceRoutes from './routes/ambulances.js';
import hospitalRoutes from './routes/hospitals.js';
import emergencyRoutes from './routes/emergencies.js';
import aiRoutes from './routes/ai.js';
import statsRoutes from './routes/stats.js';

const app = express();
const server = http.createServer(app);

// Cross-Origin configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Setup WebSocket
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket instance to Express app
app.set('io', io);
setupSocketHandlers(io);

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'RescueRoute AI Emergency Backend',
    timestamp: new Date(),
    uptime: process.uptime(),
    dbState: 'Connected/Resilient'
  });
});

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
server.listen(PORT, () => {
  console.log(`🚀 RescueRoute AI Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on port ${PORT}`);
  connectDB().then(() => {
    seedDatabase().catch(() => {});
  }).catch(err => {
    console.warn('⚡ Continuing in offline/resilient memory mode');
  });
});

