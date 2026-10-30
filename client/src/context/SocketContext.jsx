import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { soundEffects } from '../services/soundEffects';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [activeSos, setActiveSos] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    // In dev, connects to proxy or window origin
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to RescueRoute WebSocket Server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Real-time location updates
    socketInstance.on('ambulance_location_updated', (data) => {
      setLiveLocation(data);
    });

    // SOS Emergency Broadcast
    socketInstance.on('sos_alert', (data) => {
      console.warn('🚨 RECEIVED CRITICAL SOS ALERT', data);
      setActiveSos(data);
      soundEffects.playSosAlert();
      soundEffects.playSiren(3000);
      setLastNotification({
        type: 'sos',
        title: '🚨 CRITICAL CODE RED SOS ALERT',
        message: `Ambulance ${data.ambulanceId || 'AMB-101'}: ${data.reason || 'Immediate traffic priority clearance requested'}`,
        timestamp: new Date()
      });
    });

    // Green Corridor activated
    socketInstance.on('green_corridor_activated', (data) => {
      soundEffects.playSuccessChime();
      setLastNotification({
        type: 'corridor',
        title: '🟢 GREEN CORRIDOR SYNCHRONIZED',
        message: `Signals cleared along route for ${data.ambulanceId || 'Ambulance'}. Estimated 14 min saved.`,
        timestamp: new Date()
      });
    });

    // Intersection updated
    socketInstance.on('intersection_updated', (data) => {
      setLastNotification({
        type: 'intersection',
        title: `🚦 Signal Cleared: ${data.intersectionId}`,
        message: `Traffic Desk authorized Green Wave passage.`,
        timestamp: new Date()
      });
    });

    // Hospital ready
    socketInstance.on('hospital_bay_ready', (data) => {
      soundEffects.playRadioBeep();
      setLastNotification({
        type: 'hospital',
        title: '🏥 Hospital Trauma Bay Pre-Cleared',
        message: `${data.bayAssigned || 'Trauma Bay 1'} reserved under ${data.leadDoctor || 'Chief Trauma Doctor'}`,
        timestamp: new Date()
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearSosAlert = () => {
    setActiveSos(null);
  };

  const clearNotification = () => {
    setLastNotification(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveLocation,
        activeSos,
        clearSosAlert,
        lastNotification,
        clearNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
