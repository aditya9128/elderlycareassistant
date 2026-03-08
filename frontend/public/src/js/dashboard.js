const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://elderlycare-backend-f853.onrender.com/api';

let currentUser = null;
let dashboardData = null;

const SECTION_MAP = {
  appointments: 'appointments',
  medicalReminders: 'medicalReminders',
  bookings: 'bookings',
  requests: 'requests',
  hospitals: 'hospitals',
  health: 'health',
  settings: 'settings'
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    initDashboard();
    updateCurrentDate();

    await checkAuthentication();
    renderUserProfile(currentUser);

    await loadDashboardData();
    initEventListeners();
  } catch (error) {
    console.error('Dashboard initialization failed:', error);

    const isAuthError = /401|authenticated|session/i.test(error.message || '');
    showNotification(
      isAuthError ? 'Session expired. Please login again.' : 'Failed to load dashboard.',
      'error'
    );

    if (isAuthError) {
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    }
  }
});

function initDashboard() {
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
  };

  const openSidebar = () => {
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
  };

  if (mobileMenuButton && sidebar && sidebarOverlay) {
    mobileMenuButton.addEventListener('click', () => {
      const isHidden = sidebar.classList.contains('-translate-x-full');
      if (isHidden) openSidebar();
      else closeSidebar();
    });

    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  document.querySelectorAll('.quick-action-card, .sidebar-nav-item, button').forEach((el) => {
    el.classList.add('transition-all');
  });
}

async function checkAuthentication() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('401 unauthorized');
    }
    throw new Error(`Authentication failed (${response.status})`);
  }

  const payload = await response.json();
  if (!payload.success || !payload.data) {
    throw new Error(payload.message || 'Authentication failed');
  }

  currentUser = payload.data;
}

function renderUserProfile(user) {
  const userName = user?.UName || user?.name || 'User';
  const userEmail = user?.UEmail || user?.email || '';

  updateElementText('userName', userName);
  updateElementText('userEmail', userEmail);
  updateElementText('welcomeName', userName.split(' ')[0] || 'User');

  if (user?.UDob) {
    updateUserAge(user.UDob);
  }

  const profilePic = document.getElementById('userProfilePic');
  if (profilePic && user?.UProfileImage && user.UProfileImage !== 'default-user.png') {
    profilePic.src = `/uploads/${user.UProfileImage}`;
    profilePic.onerror = () => {
      profilePic.src = './images/user-default.png';
    };
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/dashboard`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Dashboard fetch failed (${response.status})`);
    }

    const payload = await response.json();
    if (!payload.success || !payload.data) {
      throw new Error(payload.message || 'Dashboard payload invalid');
    }

    dashboardData = payload.data;
    renderDashboard(payload.data);
  } catch (error) {
    console.error('Dashboard data load error:', error);
    showNotification('Could not load live data. Showing demo dashboard.', 'warning');

    dashboardData = getDemoData();
    renderDashboard(dashboardData);
  }
}

function renderDashboard(data) {
  updateStats(data?.stats || {});
  updateSidebarBadges(data?.stats || {});
  updateAppointments(data?.upcomingAppointments || []);
  updateReminders(data?.activeReminders || []);
  updateHealthMetrics(data?.healthMetrics || {});
  updateRecentActivity(data?.recentActivity || []);
  updateEmergencyContacts(data?.emergencyContacts || []);
  
  // Load bookings from the dedicated bookings endpoint
  loadUserBookings();
}

function updateStats(stats) {
  setStatValue('appointments', stats.upcomingAppointments ?? 0);
  setStatValue('reminders', stats.activeReminders ?? 0);
  setStatValue('requests', stats.caregiverRequests ?? 0);
  setStatValue('health', stats.healthScore ?? '85%');
}

function setStatValue(key, value) {
  const target = document.querySelector(`[data-stat="${key}"]`);
  if (target) target.textContent = String(value);
}

function updateSidebarBadges(stats) {
  const appointmentsBadge = document.querySelector('[data-badge="appointments"]');
  const remindersBadge = document.querySelector('[data-badge="reminders"]');
  const bookingsBadge = document.querySelector('[data-badge="bookings"]');

  if (appointmentsBadge) appointmentsBadge.textContent = String(stats.upcomingAppointments ?? 0);
  if (remindersBadge) remindersBadge.textContent = String(stats.activeReminders ?? 0);
  if (bookingsBadge) {
    bookingsBadge.textContent = String((stats.completedBookings ?? 0) + (stats.upcomingAppointments ?? 0));
  }
}

function updateAppointments(appointments) {
  const container = document.querySelector('[data-appointments-list]');
  if (!container) return;

  container.innerHTML = '';

  if (!appointments.length) {
    container.appendChild(createEmptyState('No upcoming appointments scheduled.'));
    return;
  }

  appointments.slice(0, 5).forEach((appointment) => {
    container.appendChild(createAppointmentElement(appointment));
  });
}

function createAppointmentElement(appointment) {
  const div = document.createElement('div');
  div.className = 'flex flex-col gap-3 sm:flex-row sm:items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all';

  const status = appointment.status || 'Pending';
  const statusTone = status === 'Confirmed' || status === 'Active'
    ? 'text-green-600'
    : status === 'Pending'
      ? 'text-yellow-600'
      : 'text-red-600';

  const dotClass = status === 'Confirmed' || status === 'Active'
    ? 'status-active'
    : status === 'Pending'
      ? 'status-pending'
      : 'status-cancelled';

  div.innerHTML = `
    <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
      <i class="fas fa-user-nurse text-primary-600"></i>
    </div>
    <div class="flex-1">
      <h4 class="font-semibold text-gray-800">${escapeHtml(appointment.caregiverName || appointment.caregiverId?.cgName || 'Caregiver')}</h4>
      <p class="text-gray-600 text-sm">${escapeHtml(appointment.serviceType || 'Appointment')}</p>
      <div class="flex items-center mt-2">
        <i class="fas fa-clock text-gray-400 text-sm mr-2"></i>
        <span class="text-gray-700 text-sm">${formatAppointmentDate(appointment.startDate || appointment.date)}</span>
      </div>
    </div>
    <div class="sm:text-right">
      <div class="inline-flex items-center">
        <span class="status-dot ${dotClass}"></span>
        <span class="text-sm ${statusTone}">${escapeHtml(status)}</span>
      </div>
      <button class="block mt-2 text-primary-600 hover:text-primary-800 text-sm view-appointment-btn" data-id="${appointment._id || ''}" type="button">
        <i class="fas fa-eye mr-1"></i> View
      </button>
    </div>
  `;

  return div;
}

function updateReminders(reminders) {
  const container = document.querySelector('[data-reminders-list]');
  if (!container) return;

  container.innerHTML = '';

  if (!reminders.length) {
    container.appendChild(createEmptyState('No active reminders for today.'));
    return;
  }

  const today = new Date();
  const todays = reminders.filter((r) => {
    if (!r.nextReminder) return false;
    const reminderDate = new Date(r.nextReminder);
    return reminderDate.toDateString() === today.toDateString();
  });

  const items = (todays.length ? todays : reminders).slice(0, 4);
  items.forEach((reminder) => {
    container.appendChild(createReminderElement(reminder));
  });
}

function createReminderElement(reminder) {
  const reminderDate = reminder.nextReminder ? new Date(reminder.nextReminder) : new Date();
  const timeText = reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const item = document.createElement('div');
  item.className = 'reminder-item flex flex-col gap-2 sm:flex-row sm:items-center p-3 bg-blue-50 border border-blue-100 rounded-xl';
  item.setAttribute('data-reminder-id', reminder._id || '');

  item.innerHTML = `
    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
      <i class="fas fa-pills text-blue-600"></i>
    </div>
    <div class="flex-1">
      <h4 class="font-semibold text-gray-800">${escapeHtml(reminder.medicationName || 'Medication')}</h4>
      <p class="text-gray-600 text-sm">${escapeHtml(reminder.instructions || 'Take as prescribed')}</p>
    </div>
    <button class="text-blue-600 font-medium text-left sm:text-right mark-reminder-btn" type="button">${timeText}</button>
  `;

  return item;
}

function updateHealthMetrics(metrics) {
  const bpStatus = document.querySelector('[data-health="bp-status"]');
  const bpBar = document.querySelector('[data-health="bp-bar"]');
  const sugarStatus = document.querySelector('[data-health="sugar-status"]');
  const sugarBar = document.querySelector('[data-health="sugar-bar"]');

  const systolic = Number(metrics?.bloodPressure?.systolic || 0);
  const diastolic = Number(metrics?.bloodPressure?.diastolic || 0);
  if (bpBar && (systolic || diastolic)) {
    const score = Math.max(10, Math.min(100, Math.round((systolic + diastolic) / 2)));
    bpBar.style.width = `${score}%`;

    if (bpStatus) {
      if (systolic < 120 && diastolic < 80) {
        bpStatus.textContent = 'Normal';
        bpStatus.className = 'text-sm font-medium text-green-600';
      } else if (systolic < 140 && diastolic < 90) {
        bpStatus.textContent = 'Elevated';
        bpStatus.className = 'text-sm font-medium text-yellow-600';
      } else {
        bpStatus.textContent = 'High';
        bpStatus.className = 'text-sm font-medium text-red-600';
      }
    }
  }

  const fasting = Number(metrics?.bloodSugar?.fasting || 0);
  if (sugarBar && fasting) {
    sugarBar.style.width = `${Math.max(10, Math.min(100, fasting))}%`;

    if (sugarStatus) {
      if (fasting < 100) {
        sugarStatus.textContent = 'Normal';
        sugarStatus.className = 'text-sm font-medium text-green-600';
      } else if (fasting < 126) {
        sugarStatus.textContent = 'Monitor';
        sugarStatus.className = 'text-sm font-medium text-yellow-600';
      } else {
        sugarStatus.textContent = 'High';
        sugarStatus.className = 'text-sm font-medium text-red-600';
      }
    }
  }
}

function updateRecentActivity(activities) {
  const tbody = document.querySelector('[data-activity-body]');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!activities.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td class="py-4 text-gray-500" colspan="4">No recent activity.</td>';
    tbody.appendChild(row);
    return;
  }

  activities.slice(0, 6).forEach((activity) => {
    tbody.appendChild(createActivityRow(activity));
  });
}

function createActivityRow(activity) {
  const row = document.createElement('tr');
  row.className = 'border-b border-gray-100 hover:bg-gray-50';

  const status = escapeHtml(activity.status || 'Pending');
  const statusClass = status === 'Confirmed' || status === 'Completed'
    ? 'bg-green-100 text-green-800'
    : status === 'Pending'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  const icon = activity.type === 'reminder' ? 'fa-bell' : 'fa-calendar-check';
  const iconBg = activity.type === 'reminder' ? 'bg-accent-100 text-accent-600' : 'bg-primary-100 text-primary-600';

  row.innerHTML = `
    <td class="py-4">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${iconBg}">
          <i class="fas ${icon}"></i>
        </div>
        <div>
          <p class="font-medium">${escapeHtml(activity.description || 'Activity update')}</p>
          <p class="text-gray-600 text-sm">${escapeHtml(activity.details || '')}</p>
        </div>
      </div>
    </td>
    <td class="py-4">${formatTimeAgo(activity.timestamp || activity.date)}</td>
    <td class="py-4">
      <span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass}">${status}</span>
    </td>
    <td class="py-4">
      <button class="text-primary-600 hover:text-primary-800 text-sm font-medium view-activity-btn" data-id="${activity._id || ''}" type="button">View Details</button>
    </td>
  `;

  return row;
}

function updateEmergencyContacts(contacts) {
  if (!Array.isArray(contacts) || !contacts.length) return;

  const primary = contacts.find((item) => item.isPrimary) || contacts[0];
  if (!primary) return;

  const name = document.querySelector('[data-primary-contact-name]');
  const phone = document.querySelector('[data-primary-contact-phone]');
  const call = document.querySelector('[data-primary-contact-call]');

  if (name) name.textContent = primary.name || 'Emergency Contact';
  if (phone) phone.textContent = primary.phone || 'No phone';
  if (call && primary.phone) call.setAttribute('href', `tel:${primary.phone}`);
}

function initEventListeners() {
  const logoutBtn = document.getElementById('userLogOutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const editProfileBtn = document.getElementById('editProfile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      showNotification('Profile editor is not available yet.', 'info');
    });
  }

  const addHealthBtn = document.querySelector('[data-action="add-health"]');
  if (addHealthBtn) {
    addHealthBtn.addEventListener('click', () => {
      showNotification('Add health reading feature coming soon.', 'info');
    });
  }

  const viewRemindersBtn = document.querySelector('[data-action="view-reminders"]');
  if (viewRemindersBtn) {
    viewRemindersBtn.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToSection('medicalReminders');
    });
  }

  document.querySelectorAll('.sidebar-nav-item').forEach((item) => {
    item.addEventListener('click', (event) => {
      const href = item.getAttribute('href') || '';
      if (!href.startsWith('#')) return;

      event.preventDefault();
      setActiveNav(item);

      const target = href.slice(1);
      const mapped = SECTION_MAP[target] || target;
      scrollToSection(mapped);

      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      if (window.innerWidth < 1024 && sidebar && sidebarOverlay) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
      }
    });
  });

  document.querySelectorAll('.quick-action-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      const href = card.getAttribute('href') || '';
      if (href === '#setMedicalReminder') {
        event.preventDefault();
        window.location.href = 'medicalReminder.html';
        return;
      }

      if (href === '#searchCaregivers') {
        event.preventDefault();
        window.location.href = 'find-caregivers.html';
        return;
      }

      if (href.startsWith('#')) {
        event.preventDefault();
        const target = href.slice(1);
        scrollToSection(target);
      }
    });
  });

  document.querySelectorAll('[data-stat-card]').forEach((card) => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-stat-card');
      if (target) scrollToSection(target);
    });
  });

  document.addEventListener('click', (event) => {
    const appointmentBtn = event.target.closest('.view-appointment-btn');
    if (appointmentBtn) {
      const appointmentId = appointmentBtn.getAttribute('data-id') || '';
      showNotification(
        appointmentId ? `Appointment ${appointmentId} selected.` : 'Appointment selected.',
        'info'
      );
      return;
    }

    const activityBtn = event.target.closest('.view-activity-btn');
    if (activityBtn) {
      const activityId = activityBtn.getAttribute('data-id') || '';
      showNotification(activityId ? `Activity ${activityId} selected.` : 'Activity selected.', 'info');
      return;
    }

    const reminderBtn = event.target.closest('.mark-reminder-btn');
    if (reminderBtn) {
      const reminderCard = reminderBtn.closest('.reminder-item');
      if (reminderCard) {
        reminderCard.classList.add('opacity-60', 'line-through');
      }
      reminderBtn.textContent = 'Completed';
      reminderBtn.className = 'text-green-600 font-medium text-left sm:text-right mark-reminder-btn';
      showNotification('Reminder marked as completed.', 'success');
    }
  });
}

function setActiveNav(activeElement) {
  document.querySelectorAll('.sidebar-nav-item').forEach((item) => {
    item.classList.remove('active');
  });

  activeElement.classList.add('active');
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
}

function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function updateUserAge(dob) {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  const userInfo = document.querySelector('#userEmail');
  if (!userInfo || !userInfo.parentElement) return;

  let ageEl = userInfo.parentElement.querySelector('.age-display');
  if (!ageEl) {
    ageEl = document.createElement('p');
    ageEl.className = 'age-display text-white/60 text-xs mt-1';
    userInfo.parentElement.appendChild(ageEl);
  }

  ageEl.textContent = `${age} years old`;
}

function updateCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (!dateElement) return;

  const now = new Date();
  dateElement.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatAppointmentDate(value) {
  if (!value) return 'Date not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTimeAgo(value) {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

function scrollToSection(id) {
  if (!id || id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const target = document.getElementById(id);
  if (!target) {
    showNotification(`Section '${id}' is not available yet.`, 'warning');
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const tone = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  }[type] || 'bg-blue-500 text-white';

  const icon = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type] || 'fa-info-circle';

  const notification = document.createElement('div');
  notification.className = `notification fixed top-4 right-4 px-5 py-3 rounded-xl shadow-lg z-50 ${tone}`;
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <i class="fas ${icon}"></i>
      <span>${escapeHtml(message)}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3500);
}

function createEmptyState(message) {
  const div = document.createElement('div');
  div.className = 'p-4 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500';
  div.textContent = message;
  return div;
}

function escapeHtml(value) {
  const text = String(value ?? '');
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getDemoData() {
  return {
    stats: {
      upcomingAppointments: 2,
      activeReminders: 3,
      caregiverRequests: 1,
      completedBookings: 4,
      healthScore: '85%'
    },
    upcomingAppointments: [
      {
        _id: 'demo-appointment-1',
        caregiverName: 'Dr. Anubhav Tiwari',
        serviceType: 'Physical Therapy',
        startDate: new Date(Date.now() + 2 * 3600000).toISOString(),
        status: 'Confirmed'
      }
    ],
    activeReminders: [
      {
        _id: 'demo-reminder-1',
        medicationName: 'Morning Medication',
        instructions: 'Take with breakfast',
        nextReminder: new Date(Date.now() + 3600000).toISOString()
      }
    ],
    healthMetrics: {
      bloodPressure: { systolic: 124, diastolic: 82 },
      bloodSugar: { fasting: 106 }
    },
    recentActivity: [
      {
        _id: 'demo-activity-1',
        type: 'booking',
        description: 'Appointment scheduled',
        details: 'With Dr. Anubhav Tiwari',
        status: 'Confirmed',
        timestamp: new Date(Date.now() - 90 * 60000).toISOString()
      }
    ],
    emergencyContacts: [
      { name: 'Primary Caregiver', phone: '+919876543210', isPrimary: true }
    ]
  };
}

function showEmergencyPanel() {
  const panel = document.getElementById('emergencyPanel');
  if (!panel) return;
  panel.classList.remove('hidden');
  panel.classList.add('flex');
}

function hideEmergencyPanel() {
  const panel = document.getElementById('emergencyPanel');
  if (!panel) return;
  panel.classList.add('hidden');
  panel.classList.remove('flex');
}

window.showEmergencyPanel = showEmergencyPanel;
window.hideEmergencyPanel = hideEmergencyPanel;
window.dashboardDebug = {
  getUser: () => currentUser,
  getData: () => dashboardData,
  refresh: () => loadDashboardData()
};

// ========== BOOKING REQUESTS FUNCTIONALITY ==========

// Load user's booking requests
async function loadUserBookings() {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings (${response.status})`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      updateBookingsSection(data.data || []);
      updateSentRequestsSection(data.data || []);
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
}

// Update the My Bookings section (confirmed/active bookings)
function updateBookingsSection(bookings) {
  const container = document.querySelector('[data-bookings-list]');
  if (!container) return;
  
  const confirmedBookings = bookings.filter(b => 
    ['Confirmed', 'Active'].includes(b.status)
  );
  
  if (!confirmedBookings.length) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-calendar-check text-4xl mb-3 opacity-30"></i>
        <p>No active bookings</p>
        <a href="find-caregivers.html" class="mt-3 inline-block text-primary-600 hover:text-primary-800 font-medium">
          Find a Caregiver <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = confirmedBookings.map(booking => `
    <div class="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
      <div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
        <i class="fas fa-user-nurse text-green-600"></i>
      </div>
      <div class="flex-1">
        <h4 class="font-semibold text-gray-800">${booking.caregiverId?.cgName || 'Caregiver'}</h4>
        <p class="text-gray-600 text-sm">${booking.careType || 'Care Service'}</p>
        <div class="flex items-center mt-1">
          <i class="fas fa-calendar text-gray-400 text-sm mr-2"></i>
          <span class="text-gray-700 text-sm">${new Date(booking.startDate).toLocaleDateString()}</span>
        </div>
      </div>
      <span class="px-3 py-1 ${booking.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} rounded-full text-xs font-medium">
        ${booking.status}
      </span>
    </div>
  `).join('');
}

// Update Sent Requests section (pending bookings)
function updateSentRequestsSection(bookings) {
  const container = document.querySelector('[data-requests-list]');
  if (!container) return;
  
  const pendingRequests = bookings.filter(b => b.status === 'Pending');
  const declinedRequests = bookings.filter(b => ['Declined', 'Rejected'].includes(b.status));
  const allRequests = [...pendingRequests, ...declinedRequests];
  
  if (!allRequests.length) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-paper-plane text-4xl mb-3 opacity-30"></i>
        <p>No pending requests</p>
        <a href="find-caregivers.html" class="mt-3 inline-block text-primary-600 hover:text-primary-800 font-medium">
          Send a Request <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allRequests.map(booking => {
    const statusClass = booking.status === 'Pending' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-red-100 text-red-800';
    
    return `
      <div class="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
        <div class="flex-shrink-0 w-12 h-12 ${booking.status === 'Pending' ? 'bg-yellow-100' : 'bg-red-100'} rounded-xl flex items-center justify-center mr-4">
          <i class="fas ${booking.status === 'Pending' ? 'fa-clock' : 'fa-times-circle'} ${booking.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'}"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">${booking.caregiverId?.cgName || 'Caregiver'}</h4>
          <p class="text-gray-600 text-sm">${booking.elderName} - ${booking.careType || 'Care Service'}</p>
          <div class="flex items-center mt-1">
            <i class="fas fa-calendar text-gray-400 text-sm mr-2"></i>
            <span class="text-gray-700 text-sm">${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="px-3 py-1 ${statusClass} rounded-full text-xs font-medium">
            ${booking.status}
          </span>
          <p class="text-gray-500 text-xs mt-2">Sent ${getTimeAgo(booking.createdAt)}</p>
        </div>
      </div>
    `;
  }).join('');
  
  // Update the requests badge
  const requestsBadge = document.querySelector('[data-badge="requests"]');
  if (requestsBadge) {
    requestsBadge.textContent = pendingRequests.length.toString();
  }
}

// Helper function to get time ago
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Export for debugging
window.loadUserBookings = loadUserBookings;
