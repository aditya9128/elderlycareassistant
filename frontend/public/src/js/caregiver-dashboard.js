// caregiver-dashboard.js - COMPLETE WORKFLOW WITH ALL FUNCTIONS

const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentCaregiver = null;
let currentPatients = [];
let pendingRequests = [];
let upcomingAppointments = [];
let recentHealthUpdates = [];
let dashboardStats = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🏥 Caregiver dashboard initializing...');
    
    try {
        await checkCaregiverAuth();
        await initDashboard();
        initEventListeners();
        
        // Load initial data
        await loadDashboardData();
        
        console.log('✅ Dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showNotification('Failed to load dashboard. Please try again.', 'error');
        
        // Redirect to login if auth fails
        if (error.message.includes('auth') || error.message.includes('Authentication')) {
            setTimeout(() => {
                window.location.href = 'caregiver-login.html';
            }, 2000);
        }
    }
});

// Authentication check - UPDATED for cookie-based auth
async function checkCaregiverAuth() {
    console.log('🔐 Checking caregiver authentication...');
    
    try {
        // First check localStorage for basic user info
        const userType = localStorage.getItem('userType');
        const userId = localStorage.getItem('userId');
        
        if (!userType || userType !== 'caregiver' || !userId) {
            console.log('❌ No caregiver data in localStorage');
            
            // Try to validate with backend
            const isValid = await verifyAuthStatus();
            if (!isValid) {
                throw new Error('Not authenticated as caregiver');
            }
        }
        
        // Verify with backend to ensure cookies are valid
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include' // IMPORTANT: sends cookies automatically
        });
        
        if (!response.ok) {
            throw new Error('Failed to verify authentication status');
        }
        
        const data = await response.json();
        console.log('🔐 Auth status:', data);
        
        if (!data.isAuthenticated || data.user?.role !== 'caregiver') {
            throw new Error('Not authenticated as caregiver');
        }
        
        // Get full caregiver profile
        await loadCaregiverProfile();
        
        console.log('✅ Caregiver authenticated successfully:', currentCaregiver?.cgName);
        
    } catch (error) {
        console.error('❌ Auth check failed:', error);
        
        // Clear any invalid data
        clearAuthStorage();
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'caregiver-login.html';
        }, 500);
        
        throw error;
    }
}

// Verify authentication status
async function verifyAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.isAuthenticated && data.user?.role === 'caregiver';
        }
        return false;
    } catch (error) {
        console.error('Auth verification error:', error);
        return false;
    }
}

// Initialize dashboard UI
async function initDashboard() {
    console.log('📊 Initializing dashboard UI...');
    
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000);
    
    // Load verification status
    await loadVerificationStatus();
    
    // Load notifications count
    await loadNotificationCount();
    
    console.log('✅ Dashboard UI initialized');
}

// Load all dashboard data
async function loadDashboardData() {
    console.log('📈 Loading dashboard data...');
    
    try {
        // Load combined dashboard stats
        await loadDashboardStats();
        
        // Load individual data
        await Promise.all([
            loadCurrentPatients(),
            loadPendingRequests(),
            loadAppointments(),
            loadHealthUpdates()
        ]);
        
        // Update UI
        updateStatsCards();
        updatePatientsList();
        updateRequestsList();
        updateAppointmentsList();
        updatePerformanceUI();
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('Some data failed to load. Please refresh.', 'warning');
    }
}

// Load dashboard stats (combined) - UPDATED
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/dashboard/stats`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            dashboardStats = data.data;
            updateDashboardStatsUI();
        } else {
            console.warn('Failed to load dashboard stats:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load caregiver profile - UPDATED
async function loadCaregiverProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/profile/me`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentCaregiver = data.data;
            updateCaregiverUI();
        } else {
            console.warn('Failed to load caregiver profile:', data.message);
        }
    } catch (error) {
        console.error('Error loading caregiver profile:', error);
    }
}

// Load current patients - UPDATED
async function loadCurrentPatients() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/patients/assigned`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentPatients = data.data || [];
            console.log('Loaded patients:', currentPatients);
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Load pending requests - UPDATED
async function loadPendingRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/requests/pending`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            pendingRequests = data.data || [];
            console.log('Loaded pending requests:', pendingRequests);
        }
    } catch (error) {
        console.error('Error loading pending requests:', error);
    }
}

// Load appointments - UPDATED
async function loadAppointments() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/appointments?type=upcoming&limit=10`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            upcomingAppointments = data.data || [];
            console.log('Loaded appointments:', upcomingAppointments);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// Load health updates - UPDATED
async function loadHealthUpdates() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/health-updates?limit=5`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            recentHealthUpdates = data.data || [];
            console.log('Loaded health updates:', recentHealthUpdates);
        }
    } catch (error) {
        console.error('Error loading health updates:', error);
    }
}

// Load verification status - UPDATED
async function loadVerificationStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/verification/status`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateVerificationStatusUI(data.data);
        }
    } catch (error) {
        console.error('Error loading verification status:', error);
    }
}

// Load notification count - UPDATED
async function loadNotificationCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/requests/new-count`, {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateNotificationCountUI(data.data);
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Submit health update - UPDATED
async function submitHealthUpdate(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/health-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Send cookies
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Health update saved successfully!', 'success');
            await loadHealthUpdates();
            await loadDashboardStats();
            return true;
        } else {
            showNotification(data.message || 'Failed to save health update', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error submitting health update:', error);
        showNotification('Error submitting health update', 'error');
        return false;
    }
}

// Upload documents - UPDATED
async function uploadDocuments(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/upload-document`, {
            method: 'POST',
            credentials: 'include', // Send cookies
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Documents uploaded successfully!', 'success');
            await loadVerificationStatus();
            return true;
        } else {
            showNotification(data.message || 'Failed to upload documents', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error uploading documents:', error);
        showNotification('Error uploading documents', 'error');
        return false;
    }
}

// Accept request - UPDATED
async function acceptRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/requests/${requestId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Send cookies
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Request accepted successfully!', 'success');
            await loadPendingRequests();
            await loadDashboardStats();
            return true;
        } else {
            showNotification(data.message || 'Failed to accept request', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error accepting request:', error);
        showNotification('Error accepting request', 'error');
        return false;
    }
}

// Decline request - UPDATED
async function declineRequest(requestId, reason) {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/requests/${requestId}/decline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Send cookies
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Request declined', 'info');
            await loadPendingRequests();
            await loadDashboardStats();
            return true;
        } else {
            showNotification(data.message || 'Failed to decline request', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error declining request:', error);
        showNotification('Error declining request', 'error');
        return false;
    }
}

// Update availability - UPDATED
async function updateAvailability(availabilityData) {
    try {
        const response = await fetch(`${API_BASE_URL}/caregivers/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Send cookies
            body: JSON.stringify(availabilityData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Availability updated successfully!', 'success');
            return true;
        } else {
            showNotification(data.message || 'Failed to update availability', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error updating availability:', error);
        showNotification('Error updating availability', 'error');
        return false;
    }
}

// ========== UI UPDATE FUNCTIONS ==========

function updateDashboardStatsUI() {
    if (!dashboardStats) return;
    
    // Update all stats cards
    document.getElementById('totalPatients').textContent = dashboardStats.currentPatients || 0;
    document.getElementById('totalRequests').textContent = dashboardStats.pendingRequests || 0;
    document.getElementById('totalEarnings').textContent = `₹${(dashboardStats.totalEarnings || 0).toLocaleString()}`;
    document.getElementById('caregiverRating').textContent = (dashboardStats.rating || 0).toFixed(1);
    document.getElementById('totalReviews').textContent = dashboardStats.totalRatings || 0;
    document.getElementById('todayAppointments').textContent = dashboardStats.upcomingAppointments || 0;
    
    // Update sidebar counts
    const currentPatientsCount = document.getElementById('currentPatientsCount');
    const pendingRequestsCount = document.getElementById('pendingRequestsCount');
    const appointmentsCount = document.getElementById('appointmentsCount');
    
    if (currentPatientsCount) currentPatientsCount.textContent = dashboardStats.currentPatients || 0;
    if (pendingRequestsCount) pendingRequestsCount.textContent = dashboardStats.pendingRequests || 0;
    if (appointmentsCount) appointmentsCount.textContent = dashboardStats.upcomingAppointments || 0;
}

function updateStatsCards() {
    // This function is called by loadDashboardData
    // Dashboard stats are already updated by updateDashboardStatsUI
    updatePerformanceUI();
}

function updatePatientsList() {
    const patientsList = document.getElementById('patientsList');
    if (!patientsList) return;
    
    if (currentPatients.length === 0) {
        patientsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-user-injured text-4xl mb-4 opacity-50"></i>
                <p>No current patients. New requests will appear here.</p>
            </div>
        `;
        return;
    }
    
    patientsList.innerHTML = currentPatients.map(patient => `
        <div class="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-purple-600"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-800">${patient.UName || 'Patient'}</h4>
                        <p class="text-gray-600 text-sm">${patient.age ? patient.age + ' years' : ''}</p>
                    </div>
                </div>
                <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    ${patient.healthStatus || 'Stable'}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="text-gray-600">
                    <i class="fas fa-phone-alt mr-2 text-gray-400"></i>
                    ${patient.UPhone || 'No phone'}
                </div>
                <div class="text-gray-600">
                    <i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                    ${patient.UCity || 'Location not set'}
                </div>
                <div class="text-gray-600">
                    <i class="fas fa-calendar-alt mr-2 text-gray-400"></i>
                    Assigned: ${new Date(patient.assignedDate).toLocaleDateString()}
                </div>
                <div class="text-gray-600">
                    <i class="fas fa-stethoscope mr-2 text-gray-400"></i>
                    ${patient.serviceType || 'General Care'}
                </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-gray-200">
                <button onclick="showHealthUpdateModal('${patient._id}', '${patient.UName}')" 
                        class="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
                    <i class="fas fa-plus-circle mr-2"></i> Add Health Update
                </button>
            </div>
        </div>
    `).join('');
}

function updateRequestsList() {
    const requestsList = document.getElementById('requestsList');
    if (!requestsList) return;
    
    if (pendingRequests.length === 0) {
        requestsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-clipboard-list text-4xl mb-4 opacity-50"></i>
                <p>No pending care requests.</p>
            </div>
        `;
        return;
    }
    
    requestsList.innerHTML = pendingRequests.map(request => `
        <div class="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-blue-600"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-800">${request.patient?.UName || 'Patient'}</h4>
                        <p class="text-gray-600 text-sm">${request.patient?.age ? request.patient.age + ' years' : ''}</p>
                    </div>
                </div>
                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Pending
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-sm mb-4">
                <div class="text-gray-600">
                    <i class="fas fa-calendar mr-2 text-gray-400"></i>
                    ${new Date(request.startDate).toLocaleDateString()}
                </div>
                <div class="text-gray-600">
                    <i class="fas fa-clock mr-2 text-gray-400"></i>
                    ${request.duration || 'Not specified'}
                </div>
                <div class="text-gray-600">
                    <i class="fas fa-stethoscope mr-2 text-gray-400"></i>
                    ${request.serviceType}
                </div>
                <div class="text-gray-600">
                    <i class="fas fa-rupee-sign mr-2 text-gray-400"></i>
                    ₹${request.budget || 'Negotiable'}
                </div>
            </div>
            
            ${request.notes ? `
                <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p class="text-gray-700 text-sm">${request.notes}</p>
                </div>
            ` : ''}
            
            <div class="flex space-x-3">
                <button onclick="acceptRequestAction('${request._id}')" 
                        class="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                    Accept
                </button>
                <button onclick="declineRequestAction('${request._id}')" 
                        class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                    Decline
                </button>
            </div>
        </div>
    `).join('');
}

function updateAppointmentsList() {
    const scheduleList = document.getElementById('todaysSchedule');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayAppointments = upcomingAppointments.filter(apt => {
        const aptDate = new Date(apt.startDate);
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });
    
    if (todayAppointments.length === 0) {
        scheduleList.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i class="fas fa-calendar-day text-3xl mb-2 opacity-50"></i>
                <p>No appointments scheduled for today.</p>
            </div>
        `;
        return;
    }
    
    scheduleList.innerHTML = todayAppointments.map(apt => `
        <div class="flex items-center p-3 bg-blue-50 rounded-xl">
            <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-user-md text-blue-600"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-800">${apt.patient?.name || 'Patient'}</h4>
                <p class="text-gray-600 text-sm">${apt.serviceType}</p>
            </div>
            <div class="text-right">
                <p class="font-medium text-gray-800">${new Date(apt.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p class="text-gray-600 text-sm">${apt.duration || 'Not specified'}</p>
            </div>
        </div>
    `).join('');
}

function updateHealthUpdatesUI(healthUpdates) {
    const recentActivity = document.getElementById('recentActivity');
    if (!recentActivity) return;
    
    if (!healthUpdates || healthUpdates.length === 0) {
        recentActivity.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-history text-4xl mb-4 opacity-50"></i>
                <p>No recent activity.</p>
            </div>
        `;
        return;
    }
    
    recentActivity.innerHTML = healthUpdates.map(update => `
        <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <i class="fas fa-heartbeat text-green-600 text-sm"></i>
            </div>
            <div class="flex-1">
                <p class="text-gray-800">
                    <span class="font-medium">${update.patient?.name || 'Patient'}</span> - Health update recorded
                </p>
                <p class="text-gray-600 text-sm mt-1">
                    ${update.clinicalNotes || 'No notes provided'}
                </p>
                <p class="text-gray-500 text-xs mt-2">
                    <i class="far fa-clock mr-1"></i> ${new Date(update.createdAt).toLocaleString()}
                </p>
            </div>
        </div>
    `).join('');
}

function updateCaregiverUI() {
    if (!currentCaregiver) return;
    
    document.getElementById('caregiverName').textContent = currentCaregiver.cgName || 'Caregiver';
    document.getElementById('caregiverEmail').textContent = currentCaregiver.cgEmail || '';
    document.getElementById('welcomeName').textContent = currentCaregiver.cgName || 'Caregiver';
    
    // Update specialization
    const specializationElement = document.getElementById('caregiverSpecialization');
    if (specializationElement && currentCaregiver.cgSpecialization) {
        specializationElement.textContent = Array.isArray(currentCaregiver.cgSpecialization) 
            ? currentCaregiver.cgSpecialization.join(', ')
            : currentCaregiver.cgSpecialization;
    }
    
    // Update profile image
    const profilePic = document.getElementById('caregiverProfilePic');
    if (profilePic && currentCaregiver.cgProfileImage) {
        profilePic.src = `/uploads/caregivers/${currentCaregiver.cgProfileImage}`;
    }
    
    // Update availability status
    const statusDot = document.getElementById('availabilityStatus');
    const statusText = document.getElementById('statusText');
    if (currentCaregiver.isBusy) {
        statusDot.className = 'status-dot status-cancelled';
        statusText.textContent = 'Busy';
    } else {
        statusDot.className = 'status-dot status-active';
        statusText.textContent = 'Available';
    }
}

function updateVerificationStatusUI(verificationData) {
    const verificationCard = document.getElementById('verificationStatusCard');
    const verificationSection = document.getElementById('verificationSection');
    const verificationDot = document.getElementById('verificationDot');
    const verificationBadge = document.getElementById('verificationBadge');
    
    if (verificationData.isVerified) {
        // Verified caregiver
        verificationCard.classList.add('hidden');
        verificationSection.classList.add('hidden');
        verificationDot.className = 'verification-dot verified';
        verificationBadge.classList.add('hidden');
    } else {
        // Not verified - show verification card
        verificationCard.classList.remove('hidden');
        verificationSection.classList.remove('hidden');
        verificationDot.className = 'verification-dot unverified';
        verificationBadge.classList.remove('hidden');
        verificationBadge.innerHTML = '<i class="fas fa-clock mr-1"></i>Pending';
        
        // Update document status
        if (verificationData.verificationStatus) {
            document.getElementById('idProofStatus').textContent = 
                verificationData.verificationStatus.idProof ? '✓ Uploaded' : 'Pending';
            document.getElementById('medicalCertStatus').textContent = 
                verificationData.verificationStatus.medicalCertificate ? '✓ Uploaded' : 'Pending';
        }
    }
}

function updateNotificationCountUI(countData) {
    const notificationCount = document.getElementById('notificationCount');
    if (countData.unreadNotifications > 0) {
        notificationCount.textContent = countData.unreadNotifications;
        notificationCount.classList.remove('hidden');
    } else {
        notificationCount.classList.add('hidden');
    }
    
    // Update request count in sidebar
    const requestBadge = document.getElementById('pendingRequestsCount');
    if (countData.pendingRequests > 0) {
        requestBadge.textContent = countData.pendingRequests;
    } else {
        requestBadge.textContent = '0';
    }
}

function updatePerformanceUI() {
    if (!dashboardStats) return;
    
    // Update performance bars
    const responseRate = Math.min(100, Math.round((dashboardStats.responseRate || 0)));
    const completionRate = Math.min(100, Math.round((dashboardStats.completionRate || 0)));
    const satisfactionRate = Math.min(100, Math.round((dashboardStats.satisfactionRate || 0)));
    
    document.getElementById('responseRate').textContent = `${responseRate}%`;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    document.getElementById('satisfactionRate').textContent = `${satisfactionRate}%`;
    
    document.getElementById('responseRateBar').style.width = `${responseRate}%`;
    document.getElementById('completionRateBar').style.width = `${completionRate}%`;
    document.getElementById('satisfactionBar').style.width = `${satisfactionRate}%`;
}

// ========== MODAL FUNCTIONS ==========

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

function showHealthUpdateModal(patientId, patientName) {
    const patientSelect = document.getElementById('patientSelect');
    if (patientSelect) {
        // Clear existing options except first
        while (patientSelect.options.length > 1) {
            patientSelect.remove(1);
        }
        
        // Add current patient
        const option = document.createElement('option');
        option.value = patientId;
        option.textContent = patientName;
        patientSelect.appendChild(option);
        patientSelect.value = patientId;
    }
    
    showModal('healthUpdateModal');
}

async function acceptRequestAction(requestId) {
    const success = await acceptRequest(requestId);
    if (success) {
        hideModal('requestActionModal');
    }
}

async function declineRequestAction(requestId) {
    const reason = prompt('Please provide a reason for declining this request:');
    if (reason !== null) {
        const success = await declineRequest(requestId, reason);
        if (success) {
            hideModal('requestActionModal');
        }
    }
}

// ========== EVENT LISTENERS ==========

// Initialize event listeners
function initEventListeners() {
    console.log('🎮 Initializing event listeners...');
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuButton && sidebar && sidebarOverlay) {
        mobileMenuButton.addEventListener('click', function() {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        });
        
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }
    
    // Navigation links
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);
                
                // Update active nav item
                document.querySelectorAll('.sidebar-nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                this.classList.add('active');
                
                // Close mobile menu if open
                if (window.innerWidth < 1024) {
                    sidebar.classList.add('-translate-x-full');
                    sidebarOverlay.classList.add('hidden');
                }
            }
        });
    });
    
    // Quick actions
    document.getElementById('addHealthUpdate')?.addEventListener('click', function() {
        if (currentPatients.length === 0) {
            showNotification('No patients available for health updates', 'warning');
            return;
        }
        showModal('healthUpdateModal');
    });
    
    document.getElementById('updateAvailability')?.addEventListener('click', function() {
        showAvailabilityModal();
    });
    
    document.getElementById('uploadDocuments')?.addEventListener('click', function() {
        showModal('documentUploadModal');
    });
    
    document.getElementById('uploadVerificationDocs')?.addEventListener('click', function() {
        showModal('documentUploadModal');
    });
    
    // Health update form
    const healthUpdateForm = document.getElementById('healthUpdateForm');
    if (healthUpdateForm) {
        healthUpdateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const systolic = document.getElementById('systolic').value;
            const diastolic = document.getElementById('diastolic').value;
            const bloodSugar = document.getElementById('bloodSugar').value;
            const temperature = document.getElementById('temperature').value;
            const pulseRate = document.getElementById('pulseRate').value;
            const patientId = document.getElementById('patientSelect').value;
            
            const formData = {
                patientId: patientId,
                vitalSigns: {
                    bloodPressure: {
                        systolic: parseInt(systolic),
                        diastolic: parseInt(diastolic)
                    },
                    bloodSugar: {
                        value: parseInt(bloodSugar)
                    },
                    temperature: {
                        value: parseFloat(temperature)
                    },
                    pulseRate: {
                        value: parseInt(pulseRate)
                    }
                },
                clinicalNotes: document.getElementById('clinicalNotes').value,
                medicationAdministered: document.getElementById('medicationAdministered').value
            };
            
            const success = await submitHealthUpdate(formData);
            if (success) {
                hideModal('healthUpdateModal');
                this.reset();
            }
        });
    }
    
    // Document file selection
    document.getElementById('idProofFile')?.addEventListener('change', function(e) {
        const fileName = document.getElementById('idProofFileName');
        if (this.files.length > 0) {
            fileName.textContent = `Selected: ${this.files[0].name}`;
            fileName.classList.remove('hidden');
        }
    });
    
    document.getElementById('medicalCertFile')?.addEventListener('change', function(e) {
        const fileName = document.getElementById('medicalCertFileName');
        if (this.files.length > 0) {
            fileName.textContent = `Selected: ${this.files[0].name}`;
            fileName.classList.remove('hidden');
        }
    });
    
    document.getElementById('policeVerificationFile')?.addEventListener('change', function(e) {
        const fileName = document.getElementById('policeVerificationFileName');
        if (this.files.length > 0) {
            fileName.textContent = `Selected: ${this.files[0].name}`;
            fileName.classList.remove('hidden');
        }
    });
    
    // Document upload
    document.getElementById('submitDocumentsBtn')?.addEventListener('click', async function() {
        const formData = new FormData();
        
        const idProofFile = document.getElementById('idProofFile').files[0];
        const medicalCertFile = document.getElementById('medicalCertFile').files[0];
        const policeVerificationFile = document.getElementById('policeVerificationFile').files[0];
        
        if (idProofFile) {
            formData.append('document', idProofFile);
            formData.append('documentType', 'ID Proof');
        }
        if (medicalCertFile) {
            formData.append('document', medicalCertFile);
            formData.append('documentType', 'Medical Certificate');
        }
        if (policeVerificationFile) {
            formData.append('document', policeVerificationFile);
            formData.append('documentType', 'Police Verification');
        }
        
        if (formData.entries().next().done) {
            showNotification('Please select at least one file to upload', 'warning');
            return;
        }
        
        const success = await uploadDocuments(formData);
        if (success) {
            hideModal('documentUploadModal');
            // Clear file inputs
            document.getElementById('idProofFile').value = '';
            document.getElementById('medicalCertFile').value = '';
            document.getElementById('policeVerificationFile').value = '';
            document.getElementById('idProofFileName').classList.add('hidden');
            document.getElementById('medicalCertFileName').classList.add('hidden');
            document.getElementById('policeVerificationFileName').classList.add('hidden');
        }
    });
    
    // Logout
    document.getElementById('caregiverLogOutBtn')?.addEventListener('click', function() {
        // Call logout API to clear cookies
        fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }).finally(() => {
            clearAuthStorage();
            window.location.href = 'caregiver-login.html';
        });
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.fixed.inset-0').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this.id);
            }
        });
    });
    
    // Auto-refresh data every 5 minutes
    setInterval(async () => {
        console.log('🔄 Auto-refreshing dashboard data...');
        await loadDashboardStats();
        await loadPendingRequests();
        await loadNotificationCount();
    }, 5 * 60 * 1000);
    
    console.log('✅ Event listeners initialized');
}

// ========== HELPER FUNCTIONS ==========

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAvailabilityModal() {
    // Create a simple availability modal
    const availabilityHTML = `
        <div id="availabilityModal" class="fixed inset-0 bg-black/70 z-50 hidden items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full p-8 animate-slide-up">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">Update Availability</h3>
                    <button onclick="hideModal('availabilityModal')" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form id="availabilityForm" class="space-y-6">
                    <div>
                        <label class="block text-gray-700 mb-3 font-medium">Availability Status</label>
                        <div class="flex space-x-4">
                            <label class="flex items-center">
                                <input type="radio" name="availability" value="available" class="mr-2" checked>
                                <span>Available</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="availability" value="busy" class="mr-2">
                                <span>Busy</span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2 font-medium">Available Days</label>
                        <div class="grid grid-cols-4 gap-2">
                            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
                                <label class="flex items-center">
                                    <input type="checkbox" name="days" value="${day}" class="mr-1" checked>
                                    <span>${day}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="pt-4 border-t border-gray-200">
                        <button type="submit" 
                                class="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all flex items-center justify-center">
                            <i class="fas fa-save mr-2"></i>
                            Update Availability
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to DOM if not exists
    if (!document.getElementById('availabilityModal')) {
        document.body.insertAdjacentHTML('beforeend', availabilityHTML);
        
        // Add form submit listener
        setTimeout(() => {
            document.getElementById('availabilityForm')?.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const availabilityData = {
                    isBusy: formData.get('availability') === 'busy',
                    availabilityDays: Array.from(formData.getAll('days'))
                };
                
                const success = await updateAvailability(availabilityData);
                if (success) {
                    hideModal('availabilityModal');
                    // Reload caregiver profile to update status
                    await loadCaregiverProfile();
                }
            });
        }, 100);
    }
    
    showModal('availabilityModal');
}

function clearAuthStorage() {
    console.log('🧹 Clearing auth storage...');
    
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('caregiverProfileImage');
    localStorage.removeItem('verified');
    
    // Clear sessionStorage
    sessionStorage.clear();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg animate-slide-in-right ${
        type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
        type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' :
        type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' :
        'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-3"></i>
            <p class="font-medium">${message}</p>
            <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function updateCurrentDateTime() {
    const now = new Date();
    
    // Update date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Update time
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Make functions globally available for modals and inline event handlers
window.showModal = showModal;
window.hideModal = hideModal;
window.showNotification = showNotification;
window.showHealthUpdateModal = showHealthUpdateModal;
window.acceptRequestAction = acceptRequestAction;
window.declineRequestAction = declineRequestAction;

console.log('🏥 Caregiver dashboard module loaded');