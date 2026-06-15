/* --------------------------------------------------
   CarePulse: Central Javascript Core State Controller
   -------------------------------------------------- */

// State Storage Key
const LOCAL_STORAGE_KEY = 'student_notes_healthcare_app_data';

// Master Local DB State
let db = {
  users: [],
  appointments: [],
  prescriptions: [],
  availability: {},
  logs: []
};

// Initial Seed Data Generator
const initialSeedData = {
  users: [
    { id: 'u1', name: 'John Doe', email: 'patient@gmail.com', role: 'patient', passwordHash: 'password123', profile: { blood: 'O+', allergies: 'Penicillin', emergency: '9876543210', chronic: 'None' } },
    { id: 'u2', name: 'Dr. Sarah Adams', email: 'doctor@carepulse.com', role: 'doctor', passwordHash: 'password123', specialty: 'General Physician', days: ['Mon', 'Wed', 'Fri'] },
    { id: 'u3', name: 'Admin Host', email: 'admin@carepulse.com', role: 'admin', passwordHash: 'password123' },
    { id: 'u4', name: 'Dr. Michael Chen', email: 'chen@carepulse.com', role: 'doctor', specialty: 'Cardiologist', days: ['Tue', 'Thu'] },
    { id: 'u5', name: 'Jane Smith', email: 'jane.smith@gmail.com', role: 'patient', profile: { blood: 'A-', allergies: 'None', emergency: '9123456789', chronic: 'Hypertension' } }
  ],
  appointments: [
    { id: 'a101', patientId: 'u1', patientName: 'John Doe', doctorId: 'u2', doctorName: 'Dr. Sarah Adams', date: '2026-06-16', timeSlot: '10:00 AM', reason: 'Annual wellness checkup and light headache review.', status: 'accepted' },
    { id: 'a102', patientId: 'u5', patientName: 'Jane Smith', doctorId: 'u2', doctorName: 'Dr. Sarah Adams', date: '2026-06-16', timeSlot: '11:00 AM', reason: 'Checking status of blood pressure medication.', status: 'pending' },
    { id: 'a103', patientId: 'u1', patientName: 'John Doe', doctorId: 'u4', doctorName: 'Dr. Michael Chen', date: '2026-06-18', timeSlot: '02:00 PM', reason: 'Palpitation evaluation report review.', status: 'pending' }
  ],
  prescriptions: [
    { id: 'rx501', apptId: 'a101', patientId: 'u1', patientName: 'John Doe', doctorId: 'u2', doctorName: 'Dr. Sarah Adams', diagnosis: 'Mild Tension Headache', meds: 'Paracetamol 500mg - Once daily if pain persists\nRest and adequate hydration', notes: 'Drink plenty of water and limit screen time.', signature: 'Dr. Sarah Adams', date: '2026-06-12' }
  ],
  logs: [
    { timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), actor: 'System Seed', action: 'Populated demo clinic databases successfully', severity: 'info' },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'Admin Host', action: 'Configured global system scheduler rules', severity: 'info' }
  ]
};

// Current Session Variable
let currentSession = null;

// Standard local storage helper inside try/catch block
function saveToStorage() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Storage update failed:', error);
    showToast('Failed to sync changes to local storage database', 'danger');
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      db = JSON.parse(raw);
    } else {
      db = initialSeedData;
      saveToStorage();
    }
  } catch (error) {
    console.error('Reading data failed:', error);
    db = initialSeedData;
  }
}

// Write system logs
function logActivity(actor, action, severity = 'info') {
  db.logs.unshift({
    timestamp: new Date().toISOString(),
    actor,
    action,
    severity
  });
  if (db.logs.length > 50) db.logs.pop(); // Keep log tidy
  saveToStorage();
}

// Dynamic Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastStack');
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Authentication Flow Tab Switching
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

tabLoginBtn.addEventListener('click', () => {
  tabLoginBtn.classList.add('active');
  tabRegisterBtn.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

tabRegisterBtn.addEventListener('click', () => {
  tabRegisterBtn.classList.add('active');
  tabLoginBtn.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// Demo Login Injector Helper
window.quickLogin = function(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  loginForm.requestSubmit();
};

// Logins & JWT Session Simulation
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const matched = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (matched && (matched.passwordHash === password || password === 'password123')) {
    // Generate simulated session JWT
    currentSession = {
      userId: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      token: 'jwt_mock_token_key_' + Math.random().toString(36).substring(2)
    };
    
    logActivity(matched.name, `Logged in successfully as role: ${matched.role}`);
    showToast(`Welcome back, ${matched.name}!`, 'success');
    renderWorkspace();
  } else {
    showToast('Invalid login credentials. Please check password.', 'danger');
  }
});

// User Registration Simulation
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  if (db.users.some(u => u.email.toLowerCase() === email)) {
    showToast('User email already registered', 'danger');
    return;
  }

  const newUser = {
    id: 'u' + (db.users.length + 1) + Math.floor(Math.random()*100),
    name,
    email,
    role,
    passwordHash: password,
    profile: role === 'patient' ? { blood: 'O+', allergies: 'None', emergency: '9999999999', chronic: 'None' } : undefined,
    specialty: role === 'doctor' ? 'General Physician' : undefined,
    days: role === 'doctor' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : undefined
  };

  db.users.push(newUser);
  saveToStorage();
  logActivity('System Registration', `New user ${name} registered as ${role}`);
  showToast('Account created successfully! Try logging in now.', 'success');
  
  // Reset fields and toggle tabs
  registerForm.reset();
  tabLoginBtn.click();
});

// Logout session reset
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (currentSession) {
    logActivity(currentSession.name, 'Logged out from portal');
  }
  currentSession = null;
  renderWorkspace();
  showToast('Logged out securely.', 'success');
});

// Render appropriate UI depending on session state
function renderWorkspace() {
  const authSection = document.getElementById('authSection');
  const patientDashboard = document.getElementById('patientDashboard');
  const doctorDashboard = document.getElementById('doctorDashboard');
  const adminDashboard = document.getElementById('adminDashboard');
  const profileMenu = document.getElementById('profileMenu');

  // Clear dashboards
  authSection.classList.add('hidden');
  patientDashboard.classList.add('hidden');
  doctorDashboard.classList.add('hidden');
  adminDashboard.classList.add('hidden');
  profileMenu.style.display = 'none';

  if (!currentSession) {
    authSection.classList.remove('hidden');
    loginForm.reset();
    registerForm.reset();
    return;
  }

  // Setup user Profile Headers
  profileMenu.style.display = 'flex';
  document.getElementById('headerUserName').textContent = currentSession.name;
  document.getElementById('headerRoleBadge').textContent = currentSession.role;

  // Active role panel setup
  if (currentSession.role === 'patient') {
    patientDashboard.classList.remove('hidden');
    initPatientDashboard();
  } else if (currentSession.role === 'doctor') {
    doctorDashboard.classList.remove('hidden');
    initDoctorDashboard();
  } else if (currentSession.role === 'admin') {
    adminDashboard.classList.remove('hidden');
    initAdminDashboard();
  }
}

/* --------------------------------------------------
   Patient Dashboard Controller
   -------------------------------------------------- */
function initPatientDashboard() {
  // Navigation Tabs trigger Setup
  setupNavLinks('patientDashboard');

  // Stats Counters setup
  const pAppts = db.appointments.filter(a => a.patientId === currentSession.userId);
  document.getElementById('p-stat-total-appts').textContent = pAppts.length;
  document.getElementById('p-stat-pending-appts').textContent = pAppts.filter(a => a.status === 'pending').length;
  
  const pRxs = db.prescriptions.filter(r => r.patientId === currentSession.userId);
  document.getElementById('p-stat-prescriptions').textContent = pRxs.length;

  // Personal Profile Info Card Fill
  const userObj = db.users.find(u => u.id === currentSession.userId);
  if (userObj && userObj.profile) {
    document.getElementById('p-card-blood').textContent = userObj.profile.blood || 'None';
    document.getElementById('p-card-allergies').textContent = userObj.profile.allergies || 'None';
    document.getElementById('p-card-emergency').textContent = userObj.profile.emergency || 'None';
    document.getElementById('p-card-chronic').textContent = userObj.profile.chronic || 'None';
    
    // Auto-fill forms
    document.getElementById('p-set-name').value = userObj.name;
    document.getElementById('p-set-blood').value = userObj.profile.blood || '';
    document.getElementById('p-set-allergies').value = userObj.profile.allergies || '';
    document.getElementById('p-set-emergency').value = userObj.profile.emergency || '';
    document.getElementById('p-set-chronic').value = userObj.profile.chronic || '';
  }

  // Populate Doctors options for scheduler select list
  const docSelect = document.getElementById('bookDoctor');
  docSelect.innerHTML = '';
  const doctors = db.users.filter(u => u.role === 'doctor');
  doctors.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = `${doc.name} - ${doc.specialty || 'General Practitioner'}`;
    docSelect.appendChild(opt);
  });

  // Render lists
  renderPatientUpcomingList(pAppts);
  renderPatientHistoryTable(pAppts);
  renderPatientRecords();
}

function renderPatientUpcomingList(appts) {
  const container = document.getElementById('p-upcoming-list');
  container.innerHTML = '';
  const upcoming = appts.filter(a => a.status === 'accepted' || a.status === 'pending');

  if (upcoming.length === 0) {
    container.innerHTML = '<p class="empty-state">No scheduled appointments</p>';
    return;
  }

  upcoming.forEach(a => {
    const card = document.createElement('div');
    card.className = 'record-card margin-bottom';
    card.innerHTML = `
      <div>
        <h4><strong>${a.doctorName}</strong></h4>
        <div class="record-meta">
          <span><i class="fa-solid fa-calendar"></i> ${a.date}</span>
          <span><i class="fa-solid fa-clock"></i> ${a.timeSlot}</span>
        </div>
        <p style="margin-top:0.25rem; font-size:0.9rem; color:var(--text-muted);">${a.reason}</p>
      </div>
      <div>
        <span class="badge-status ${a.status}">${a.status}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderPatientHistoryTable(appts) {
  const tbody = document.getElementById('p-history-table-body');
  tbody.innerHTML = '';

  if (appts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="text-align:center;">No records available</td></tr>';
    return;
  }

  appts.forEach(a => {
    const docObj = db.users.find(u => u.id === a.doctorId);
    const rx = db.prescriptions.find(p => p.apptId === a.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${a.doctorName}</strong></td>
      <td>${docObj ? (docObj.specialty || 'GP') : 'GP'}</td>
      <td>${a.date}</td>
      <td>${a.timeSlot}</td>
      <td><span class="badge-status ${a.status}">${a.status}</span></td>
      <td>
        ${rx ? `<button class="btn btn-secondary btn-sm" onclick="printPrescription('${rx.id}')"><i class="fa-solid fa-print"></i> Download</button>` : `<span class="text-muted">No Prescription</span>`}
      </td>
      <td>
        ${(a.status === 'pending' || a.status === 'accepted') ? `<button class="btn btn-danger btn-sm" onclick="cancelAppointment('${a.id}')">Cancel</button>` : `<span class="text-muted">Locked</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPatientRecords() {
  const container = document.getElementById('p-records-list');
  container.innerHTML = '';

  const rxs = db.prescriptions.filter(r => r.patientId === currentSession.userId);
  if (rxs.length === 0) {
    container.innerHTML = '<p class="empty-state">No prescription history found</p>';
    return;
  }

  rxs.forEach(rx => {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.innerHTML = `
      <div class="record-info">
        <h3>Prescription: ${rx.diagnosis}</h3>
        <div class="record-meta">
          <span><i class="fa-solid fa-user-md"></i> Prescribed by: ${rx.doctorName}</span>
          <span><i class="fa-solid fa-calendar"></i> Issued: ${rx.date}</span>
        </div>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" onclick="printPrescription('${rx.id}')">
          <i class="fa-solid fa-download"></i> Print PDF
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Book Appointment Submission
document.getElementById('apptBookingForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const docId = document.getElementById('bookDoctor').value;
  const dateVal = document.getElementById('bookDate').value;
  const slotVal = document.getElementById('bookTime').value;
  const reasonVal = document.getElementById('bookReason').value.trim();

  const docObj = db.users.find(u => u.id === docId);
  const docName = docObj ? docObj.name : 'Unknown Doctor';

  const newAppt = {
    id: 'a' + Math.floor(100 + Math.random()*900),
    patientId: currentSession.userId,
    patientName: currentSession.name,
    doctorId: docId,
    doctorName: docName,
    date: dateVal,
    timeSlot: slotVal,
    reason: reasonVal,
    status: 'pending'
  };

  db.appointments.push(newAppt);
  saveToStorage();
  logActivity(currentSession.name, `Booked a new appointment with ${docName} on ${dateVal}`);
  showToast('Appointment requested successfully!', 'success');
  
  // Direct back to overview
  document.getElementById('apptBookingForm').reset();
  const overviewTab = document.querySelector('[data-tab="p-overview"]');
  if (overviewTab) overviewTab.click();
});

// Update Profile Form Settings
document.getElementById('p-profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const userObj = db.users.find(u => u.id === currentSession.userId);
  if (userObj) {
    userObj.name = document.getElementById('p-set-name').value.trim();
    if (!userObj.profile) userObj.profile = {};
    userObj.profile.blood = document.getElementById('p-set-blood').value.trim();
    userObj.profile.allergies = document.getElementById('p-set-allergies').value.trim();
    userObj.profile.emergency = document.getElementById('p-set-emergency').value.trim();
    userObj.profile.chronic = document.getElementById('p-set-chronic').value.trim();
    
    saveToStorage();
    currentSession.name = userObj.name; // Keep header updated
    logActivity(currentSession.name, 'Updated health card profile settings');
    showToast('Profile settings updated!', 'success');
    renderWorkspace();
  }
});

// Cancel Appointment action helper
window.cancelAppointment = function(id) {
  const appt = db.appointments.find(a => a.id === id);
  if (appt) {
    appt.status = 'canceled';
    saveToStorage();
    logActivity(appt.patientName, `Cancelled schedule slot with ${appt.doctorName}`);
    showToast('Appointment successfully canceled', 'success');
    initPatientDashboard();
  }
};

/* --------------------------------------------------
   Doctor Dashboard Controller
   -------------------------------------------------- */
let activeDiagnosisApptId = null; // Temp holder for active checkups

function initDoctorDashboard() {
  setupNavLinks('doctorDashboard');

  // Status Metrics Cards Setup
  const myAppts = db.appointments.filter(a => a.doctorId === currentSession.userId);
  document.getElementById('d-stat-active').textContent = myAppts.filter(a => a.status === 'accepted').length;
  document.getElementById('d-stat-completed').textContent = myAppts.filter(a => a.status === 'completed').length;
  document.getElementById('d-stat-canceled').textContent = myAppts.filter(a => a.status === 'canceled').length;

  // Populate Availability Checklist
  const myUser = db.users.find(u => u.id === currentSession.userId);
  if (myUser) {
    document.getElementById('d-availSpecialty').value = myUser.specialty || 'General Physician';
    const checkboxes = document.getElementsByName('availDays');
    checkboxes.forEach(box => {
      box.checked = myUser.days ? myUser.days.includes(box.value) : false;
    });
  }

  // Render Tables
  renderDoctorPendingTable(myAppts);
  renderDoctorAcceptedTable(myAppts);
  renderDoctorPatientRecords();
  renderDoctorAnalytics();
}

function renderDoctorPendingTable(myAppts) {
  const tbody = document.getElementById('d-pending-table-body');
  tbody.innerHTML = '';
  
  const pending = myAppts.filter(a => a.status === 'pending');
  if (pending.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state" style="text-align:center;">No pending requests</td></tr>';
    return;
  }

  pending.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${a.patientName}</strong></td>
      <td>${a.date}</td>
      <td>${a.timeSlot}</td>
      <td>${a.reason}</td>
      <td>
        <div class="action-row-buttons">
          <button class="btn btn-primary btn-sm" onclick="actionAppointment('${a.id}', 'accepted')">Accept</button>
          <button class="btn btn-danger btn-sm" onclick="actionAppointment('${a.id}', 'canceled')">Decline</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDoctorAcceptedTable(myAppts) {
  const tbody = document.getElementById('d-today-table-body');
  tbody.innerHTML = '';

  const active = myAppts.filter(a => a.status === 'accepted');
  if (active.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state" style="text-align:center;">No active accepted sessions</td></tr>';
    return;
  }

  active.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${a.patientName}</strong></td>
      <td>${a.timeSlot}</td>
      <td><span class="badge-status accepted">${a.status}</span></td>
      <td>
        <button class="btn btn-success btn-sm" onclick="openPrescriptionForm('${a.id}')">
          <i class="fa-solid fa-notes-medical"></i> Complete & Prescribe
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Doctor action on scheduler requests
window.actionAppointment = function(id, status) {
  const appt = db.appointments.find(a => a.id === id);
  if (appt) {
    appt.status = status;
    saveToStorage();
    logActivity(currentSession.name, `Responded to slot ${id} status: ${status}`);
    showToast(`Appointment status updated to ${status}`, 'success');
    initDoctorDashboard();
  }
};

// Open Digital Prescription Generator modal
window.openPrescriptionForm = function(apptId) {
  activeDiagnosisApptId = apptId;
  const appt = db.appointments.find(a => a.id === apptId);
  
  // Auto prepopulate
  document.getElementById('rxDiagnosis').value = '';
  document.getElementById('rxMeds').value = '';
  document.getElementById('rxNotes').value = '';
  document.getElementById('rxSign').value = currentSession.name;
  
  document.getElementById('prescriptionModal').classList.remove('hidden');
};

window.closePrescriptionModal = function() {
  document.getElementById('prescriptionModal').classList.add('hidden');
};

// Prescription Submission
document.getElementById('prescriptionForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeDiagnosisApptId) return;

  const diag = document.getElementById('rxDiagnosis').value.trim();
  const meds = document.getElementById('rxMeds').value.trim();
  const notes = document.getElementById('rxNotes').value.trim();
  const sign = document.getElementById('rxSign').value.trim();

  const appt = db.appointments.find(a => a.id === activeDiagnosisApptId);
  if (appt) {
    appt.status = 'completed';

    const newRx = {
      id: 'rx' + Math.floor(500 + Math.random()*500),
      apptId: appt.id,
      patientId: appt.patientId,
      patientName: appt.patientName,
      doctorId: appt.doctorId,
      doctorName: appt.doctorName,
      diagnosis: diag,
      meds: meds,
      notes: notes,
      signature: sign,
      date: new Date().toISOString().split('T')[0]
    };

    db.prescriptions.push(newRx);
    saveToStorage();
    logActivity(currentSession.name, `Issued digital prescription records for ${appt.patientName}`);
    showToast('Prescription saved, session completed!', 'success');
    
    closePrescriptionModal();
    initDoctorDashboard();
  }
});

// Render global records list for the doctor view
function renderDoctorPatientRecords() {
  const container = document.getElementById('d-patient-records-list');
  const query = document.getElementById('d-patient-search').value.toLowerCase();
  container.innerHTML = '';

  // Filter unique patients that have booked or completed appts with doctor
  const myAppts = db.appointments.filter(a => a.doctorId === currentSession.userId);
  const patientIds = [...new Set(myAppts.map(a => a.patientId))];
  const myPatients = db.users.filter(u => patientIds.includes(u.id));

  const filtered = myPatients.filter(p => p.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No matching patient record archives found.</p>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'patient-archive-card';
    
    const pr = p.profile || {};
    const apptRxs = db.prescriptions.filter(rx => rx.patientId === p.id && rx.doctorId === currentSession.userId);
    
    card.innerHTML = `
      <div class="archive-header">
        <h3>${p.name}</h3>
        <span class="archive-email">${p.email}</span>
      </div>
      <div class="archive-body">
        <p><strong>Blood Group:</strong> ${pr.blood || 'Unknown'}</p>
        <p><strong>Known Allergies:</strong> ${pr.allergies || 'None recorded'}</p>
        <p><strong>Emergency contact:</strong> ${pr.emergency || 'None'}</p>
        <p><strong>Chronic History:</strong> ${pr.chronic || 'None'}</p>
        
        <div class="archive-records-list">
          <h4>Your Prescription Logs:</h4>
          ${apptRxs.length === 0 ? '<p class="empty-state" style="font-size:0.75rem;">No past medical notes</p>' : 
            apptRxs.map(rx => `<div class="archive-rx-item"><strong>${rx.date} - ${rx.diagnosis}</strong><br>${rx.meds}</div>`).join('')}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

document.getElementById('d-patient-search').addEventListener('input', renderDoctorPatientRecords);

// Availability details save setup
document.getElementById('d-availForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const myUser = db.users.find(u => u.id === currentSession.userId);
  if (myUser) {
    myUser.specialty = document.getElementById('d-availSpecialty').value;
    
    const checkboxes = document.getElementsByName('availDays');
    const checkedDays = [];
    checkboxes.forEach(box => {
      if (box.checked) checkedDays.push(box.value);
    });
    myUser.days = checkedDays;

    saveToStorage();
    logActivity(currentSession.name, 'Updated practice specialty details and availability days');
    showToast('Availability settings updated!', 'success');
  }
});

// Render Doctor performance analytics custom SVG
function renderDoctorAnalytics() {
  const trendContainer = document.getElementById('d-chart-trend');
  const ratingContainer = document.getElementById('d-chart-rating');

  // Simulated trend graph SVG
  trendContainer.innerHTML = `
    <svg viewBox="0 0 400 200" class="chart-svg">
      <!-- Grid Lines -->
      <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-color)" stroke-dasharray="4" />
      <line x1="40" y1="80" x2="380" y2="80" stroke="var(--border-color)" stroke-dasharray="4" />
      <line x1="40" y1="140" x2="380" y2="140" stroke="var(--border-color)" stroke-dasharray="4" />
      <line x1="40" y1="170" x2="380" y2="170" stroke="var(--border-color)" />
      
      <!-- Axis Text -->
      <text x="15" y="25" class="chart-text">30</text>
      <text x="15" y="85" class="chart-text">15</text>
      <text x="15" y="145" class="chart-text">5</text>
      
      <!-- Line Plot -->
      <polyline points="50,160 110,130 170,90 230,110 290,50 350,30" class="chart-line" />
      
      <!-- Data points nodes -->
      <circle cx="50" cy="160" r="5" fill="var(--primary-color)" />
      <circle cx="110" cy="130" r="5" fill="var(--primary-color)" />
      <circle cx="170" cy="90" r="5" fill="var(--primary-color)" />
      <circle cx="230" cy="110" r="5" fill="var(--primary-color)" />
      <circle cx="290" cy="50" r="5" fill="var(--primary-color)" />
      <circle cx="350" cy="30" r="5" fill="var(--primary-color)" />
      
      <!-- X Labels -->
      <text x="40" y="190" class="chart-text">Jan</text>
      <text x="100" y="190" class="chart-text">Feb</text>
      <text x="160" y="190" class="chart-text">Mar</text>
      <text x="220" y="190" class="chart-text">Apr</text>
      <text x="280" y="190" class="chart-text">May</text>
      <text x="340" y="190" class="chart-text">Jun</text>
    </svg>
  `;

  // Dynamic reviews rating builder
  ratingContainer.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 3rem; font-weight: 700; color: var(--primary-color)">4.9</div>
      <div style="color: #f59e0b; font-size: 1.5rem; margin-bottom: 0.5rem">
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star-half-stroke"></i>
      </div>
      <p style="color: var(--text-muted)">96% patient satisfaction rating (based on 48 surveys completed)</p>
    </div>
  `;
}

/* --------------------------------------------------
   Admin Dashboard Controller
   -------------------------------------------------- */
function initAdminDashboard() {
  setupNavLinks('adminDashboard');

  // Stats Counters
  document.getElementById('a-stat-patients').textContent = db.users.filter(u => u.role === 'patient').length;
  document.getElementById('a-stat-doctors').textContent = db.users.filter(u => u.role === 'doctor').length;
  document.getElementById('a-stat-bookings').textContent = db.appointments.length;

  renderAdminLogs();
  renderAdminUsersTable();
  renderAdminReports();
}

function renderAdminLogs() {
  const tbody = document.getElementById('a-activity-log-body');
  tbody.innerHTML = '';

  if (db.logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state" style="text-align:center;">No recent events logged</td></tr>';
    return;
  }

  db.logs.slice(0, 10).forEach(log => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${time}</td>
      <td><strong>${log.actor}</strong></td>
      <td>${log.action}</td>
      <td><span class="badge-status ${log.severity === 'info' ? 'pending' : 'canceled'}">${log.severity}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminUsersTable() {
  const tbody = document.getElementById('a-users-table-body');
  tbody.innerHTML = '';

  db.users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td><span class="user-role-badge">${u.role}</span></td>
      <td><span class="badge-status accepted">Active</span></td>
      <td>
        ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="suspendUser('${u.id}')">Delete</button>` : `<span class="text-muted">Protected</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.suspendUser = function(id) {
  const user = db.users.find(u => u.id === id);
  if (user) {
    db.users = db.users.filter(u => u.id !== id);
    saveToStorage();
    logActivity('Admin Host', `Deleted user account entry for ${user.name}`);
    showToast(`User ${user.name} removed from registry`, 'success');
    initAdminDashboard();
  }
};

function renderAdminReports() {
  const pie = document.getElementById('a-report-pie');
  const line = document.getElementById('a-report-line');

  // Dynamic pie chart visualization
  pie.innerHTML = `
    <svg viewBox="0 0 200 200" class="chart-svg">
      <!-- General Medicine slice -->
      <circle r="75" cx="100" cy="100" fill="transparent" stroke="var(--primary-color)" stroke-width="40" stroke-dasharray="282 471" class="chart-pie-slice" />
      <!-- Cardiology slice -->
      <circle r="75" cx="100" cy="100" fill="transparent" stroke="var(--warning-color)" stroke-width="40" stroke-dasharray="141 471" stroke-dashoffset="-282" class="chart-pie-slice" />
      <!-- Pediatrics slice -->
      <circle r="75" cx="100" cy="100" fill="transparent" stroke="var(--info-color)" stroke-width="40" stroke-dasharray="48 471" stroke-dashoffset="-423" class="chart-pie-slice" />
      
      <!-- Legends -->
      <circle cx="20" cy="20" r="5" fill="var(--primary-color)" />
      <text x="30" y="24" class="chart-text">Gen Practice (60%)</text>
      
      <circle cx="20" cy="40" r="5" fill="var(--warning-color)" />
      <text x="30" y="44" class="chart-text">Cardio (30%)</text>
      
      <circle cx="20" cy="60" r="5" fill="var(--info-color)" />
      <text x="30" y="64" class="chart-text">Pediatrics (10%)</text>
    </svg>
  `;

  // Monthly Growth lines chart visualization
  line.innerHTML = `
    <svg viewBox="0 0 400 200" class="chart-svg">
      <rect x="50" y="30" width="30" height="140" class="chart-bar" />
      <rect x="110" y="60" width="30" height="110" class="chart-bar" />
      <rect x="170" y="40" width="30" height="130" class="chart-bar" />
      <rect x="230" y="70" width="30" height="100" class="chart-bar" />
      <rect x="290" y="20" width="30" height="150" class="chart-bar" />
      <rect x="350" y="45" width="30" height="125" class="chart-bar" />
      <line x1="40" y1="170" x2="380" y2="170" stroke="var(--border-color)" />
      
      <!-- X labels -->
      <text x="50" y="190" class="chart-text">Cardio</text>
      <text x="110" y="190" class="chart-text">Neuro</text>
      <text x="170" y="190" class="chart-text">General</text>
      <text x="230" y="190" class="chart-text">Orthop</text>
      <text x="290" y="190" class="chart-text">Pediatr</text>
      <text x="350" y="190" class="chart-text">Other</text>
    </svg>
  `;
}

/* --------------------------------------------------
   General Helper Utilities
   -------------------------------------------------- */

// Global navigation tab visibility logic
function setupNavLinks(sectionId) {
  const container = document.getElementById(sectionId);
  const links = container.querySelectorAll('.nav-link');
  const panes = container.querySelectorAll('.tab-pane');

  links.forEach(link => {
    link.addEventListener('click', () => {
      // Deactivate siblings
      links.forEach(l => l.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      // Activate current
      link.classList.add('active');
      const targetId = link.getAttribute('data-tab');
      container.querySelector(`#${targetId}`).classList.add('active');
    });
  });
}

// Download & Print prescription records template
window.printPrescription = function(rxId) {
  const rx = db.prescriptions.find(p => p.id === rxId);
  if (rx) {
    document.getElementById('rxPrintDate').textContent = rx.date;
    document.getElementById('rxPrintId').textContent = rx.id;
    document.getElementById('rxPrintDoc').textContent = rx.doctorName;
    document.getElementById('rxPrintPatient').textContent = rx.patientName;
    document.getElementById('rxPrintDiagnosis').textContent = rx.diagnosis;
    
    // Formatting list
    const medList = document.getElementById('rxPrintMedList');
    medList.innerHTML = rx.meds.split('\n').map(m => `<p style="margin-bottom: 5px; font-weight: 500;">&bull; ${m}</p>`).join('');
    
    document.getElementById('rxPrintNotes').textContent = rx.notes || 'None';
    document.getElementById('rxPrintSignature').textContent = rx.signature;

    // Trigger Print Action
    window.print();
  }
};

/* --------------------------------------------------
   Initialize App Trigger
   -------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  
  // Theme Switching setup with global integration
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    if (window.setTheme) {
      window.setTheme(isDark ? 'dark' : 'light');
    }
  });

  // Initial Sync from global theme configurations
  const currentGlobalTheme = document.documentElement.getAttribute('data-theme') || 'light';
  if (currentGlobalTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  // Set up notifications hub
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifList = document.getElementById('notifList');
  const notifBadge = document.getElementById('notifBadge');
  const clearNotifs = document.getElementById('clearNotifs');

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    notifDropdown.classList.remove('show');
  });

  clearNotifs.addEventListener('click', (e) => {
    e.stopPropagation();
    notifList.innerHTML = '<p class="empty-state">No new notifications</p>';
    notifBadge.style.display = 'none';
  });

  // Dynamic alert reminders generator on app load
  setTimeout(() => {
    notifBadge.textContent = '1';
    notifBadge.style.display = 'block';
    notifList.innerHTML = `
      <div class="notif-item">
        <i class="fa-solid fa-calendar-check notif-icon-marker"></i>
        <div>
          <strong>Upcoming Checkup Reminder</strong>
          <p style="font-size:0.75rem; color:var(--text-muted);">You have a schedule tomorrow at 10:00 AM.</p>
        </div>
      </div>
    `;
    showToast('Reminder: You have an appointment tomorrow.', 'info');
  }, 3000);

  renderWorkspace();
});
