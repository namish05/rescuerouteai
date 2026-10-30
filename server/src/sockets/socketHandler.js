export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`📡 WebSocket Client Connected: ${socket.id}`);

    // Join specific role channel or emergency room
    socket.on('join_channel', (channel) => {
      socket.join(channel);
      console.log(`User joined channel: ${channel}`);
    });

    socket.on('join_emergency', (emergencyId) => {
      socket.join(`emergency_${emergencyId}`);
      console.log(`Socket ${socket.id} joined emergency_${emergencyId}`);
    });

    // Real-time location stream from Ambulance GPS / Simulator
    socket.on('ambulance_location_stream', (data) => {
      // Broadcast to all connected clients
      io.emit('ambulance_location_updated', data);
    });

    // SOS panic event
    socket.on('trigger_sos', (data) => {
      console.log('🚨 SOS Alert Triggered:', data);
      io.emit('sos_alert', {
        ...data,
        timestamp: new Date()
      });
    });

    // Green corridor request from Paramedic
    socket.on('request_green_corridor', (data) => {
      console.log('🚦 Green Corridor Requested:', data);
      io.emit('green_corridor_activated', data);
    });

    // Traffic Police clears intersection
    socket.on('clear_intersection', (data) => {
      console.log('🟢 Intersection Cleared:', data);
      io.emit('intersection_updated', data);
    });

    // Hospital updates bay status
    socket.on('hospital_status_update', (data) => {
      console.log('🏥 Hospital ER Bay Status:', data);
      io.emit('hospital_bay_ready', data);
    });

    // Direct Emergency Intercom message
    socket.on('emergency_intercom_message', (msg) => {
      io.emit('emergency_intercom_broadcast', {
        ...msg,
        id: `msg-${Date.now()}`,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket Client Disconnected: ${socket.id}`);
    });
  });
};
