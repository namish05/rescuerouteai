const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('rescueroute_token');
  const role = localStorage.getItem('rescueroute_demo_role');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (role) {
    headers['x-demo-role'] = role;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  },

  async demoLogin(role) {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return await res.json();
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Stats
  async getDashboardOverview() {
    const res = await fetch(`${API_BASE}/stats/dashboard-overview`);
    return await res.json();
  },

  // Emergencies
  async getEmergencies(status) {
    const url = status ? `${API_BASE}/emergencies?status=${status}` : `${API_BASE}/emergencies`;
    const res = await fetch(url);
    return await res.json();
  },

  async getEmergencyById(id) {
    const res = await fetch(`${API_BASE}/emergencies/${id}`);
    return await res.json();
  },

  async createEmergency(data) {
    const res = await fetch(`${API_BASE}/emergencies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async triggerSos(emergencyId, reason) {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/sos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  async requestGreenCorridor(emergencyId) {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/green-corridor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });
    return await res.json();
  },

  async acknowledgeTrafficClearance(emergencyId, officerName, controlDesk, durationSeconds = 120, trafficNotes = '') {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/traffic-ack`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ officerName, controlDesk, durationSeconds, trafficNotes })
    });
    return await res.json();
  },

  async updateVitals(emergencyId, vitals, notes) {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/vitals`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ vitals, notes })
    });
    return await res.json();
  },

  async resetEmergencies(mode = 'clean') {
    const res = await fetch(`${API_BASE}/emergencies/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode })
    });
    return await res.json();
  },

  async deleteEmergency(emergencyId) {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async clearIntersectionSignal(emergencyId, intersectionId, status = 'cleared_green') {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/intersection-clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ intersectionId, status })
    });
    return await res.json();
  },

  async acknowledgeHospitalReady(emergencyId, data) {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/hospital-ack`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async completeEmergency(emergencyId) {
    const res = await fetch(`${API_BASE}/emergencies/${emergencyId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });
    return await res.json();
  },

  // Ambulances
  async getAmbulances() {
    const res = await fetch(`${API_BASE}/ambulances`);
    return await res.json();
  },

  async updateAmbulanceLocation(ambulanceId, locationData) {
    const res = await fetch(`${API_BASE}/ambulances/${ambulanceId}/location`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(locationData)
    });
    return await res.json();
  },

  // Hospitals
  async getHospitals() {
    const res = await fetch(`${API_BASE}/hospitals`);
    return await res.json();
  },

  async updateHospitalCapacity(hospitalId, updates) {
    const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await res.json();
  },

  // AI
  async analyzeRoutes(pickup, destination) {
    const res = await fetch(`${API_BASE}/ai/analyze-routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, destination })
    });
    return await res.json();
  },

  async triageUrgency(vitalsData) {
    const res = await fetch(`${API_BASE}/ai/triage-urgency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalsData)
    });
    return await res.json();
  }
};
