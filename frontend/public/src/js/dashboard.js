// ============================================
// ElderlyCare Assistant - Dashboard Module (COMPLETELY FIXED)
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentUser = null;
let dashboardData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Dashboard loading...');
    
    try {
        // Initialize dashboard components first (non-blocking)
        initDashboard();
        updateCurrentDate();
        
        // Check authentication
        await checkAuthentication();
        
        // Load user profile
        await loadUserProfile();
        
        // Load dashboard data
        await loadDashboardData();
        
        // Initialize event listeners AFTER data is loaded
        initEventListeners();
        
        console.log('✅ Dashboard ready');
        
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        
        // Show user-friendly error
        const errorMessage = error.message.includes('authenticated') || error.message.includes('401')
            ? 'Session expired. Please login again.'
            : 'Failed to load dashboard.';
        
        showNotification(errorMessage, 'error');
        
        // Only redirect for auth errors
        if (error.message.includes('authenticated') || error.message.includes('401')) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
});

// Check if user is authenticated
async function checkAuthentication() {
    try {
        console.log('🔐 Checking authentication...');
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Auth response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Authentication failed');
        }
        
        currentUser = data.data;
        console.log('✅ User authenticated:', currentUser.UName);
        
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        localStorage.clear();
        
        // Only redirect for auth errors
        if (error.message.includes('Session') || error.message.includes('authenticated')) {
            window.location.href = 'login.html';
        }
        throw error;
    }
}

// Initialize dashboard UI components
function initDashboard() {
    console.log('🏗️ Initializing dashboard UI...');
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuButton && sidebar) {
        mobileMenuButton.addEventListener('click', function() {
            sidebar.classList.toggle('-translate-x-full');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('hidden');
            }
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.add('-translate-x-full');
            this.classList.add('hidden');
        });
    }
    
    // Quick action cards styling
    const quickActionCards = document.querySelectorAll('.quick-action-card');
    quickActionCards.forEach(card => {
        if (!card.classList.contains('block')) {
            card.classList.add('block', 'p-4', 'rounded-xl', 'border', 'transition-all', 'duration-300', 'hover:shadow-md');
        }
    });
    
    // Quick action icons styling
    const quickActionIcons = document.querySelectorAll('.quick-action-icon');
    quickActionIcons.forEach(icon => {
        if (!icon.classList.contains('w-10')) {
            icon.classList.add('w-10', 'h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'mb-3');
        }
    });
    
    // Set up sidebar navigation
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                scrollToSection(targetId);
            }
        });
    });
}

// Load user profile information
async function loadUserProfile() {
    if (!currentUser) {
        console.error('No user data available');
        return;
    }
    
    try {
        console.log('👤 Loading user profile...');
        
        // Update user information
        updateElementText('userName', currentUser.UName || 'User');
        updateElementText('userEmail', currentUser.UEmail || '');
        
        // Update welcome name
        const welcomeNameElement = document.getElementById('welcomeName');
        if (welcomeNameElement && currentUser.UName) {
            const firstName = currentUser.UName.split(' ')[0];
            welcomeNameElement.textContent = firstName;
        }
        
        // Update profile picture
        const profilePic = document.getElementById('userProfilePic');
        if (profilePic) {
            if (currentUser.UProfileImage && currentUser.UProfileImage !== 'default-user.png') {
                profilePic.src = `/uploads/${currentUser.UProfileImage}`;
                profilePic.onerror = function() {
                    this.src = './images/user-default.png';
                };
            }
        }
        
        // Update user age
        if (currentUser.UDob) {
            updateUserAge(currentUser.UDob);
        }
        
        console.log('✅ Profile loaded');
        
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('📊 Fetching dashboard data...');
        
        const response = await fetch(`${API_BASE_URL}/users/dashboard`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Dashboard response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Session expired');
            }
            throw new Error(`Failed to load dashboard: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            dashboardData = data.data;
            updateDashboardUI(dashboardData);
            console.log('✅ Dashboard data loaded');
        } else {
            throw new Error(data.message || 'Failed to load dashboard data');
        }
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        
        // Don't crash for dashboard errors, use placeholder data
        showNotification('Could not load dashboard data. Using demo data.', 'warning');
        loadDemoData();
    }
}

// Update dashboard UI with real data
function updateDashboardUI(data) {
    console.log('🎨 Updating dashboard UI...');
    
    try {
        // Update stats overview
        updateStats(data.stats);
        
        // Update upcoming appointments
        updateAppointments(data.upcomingAppointments);
        
        // Update reminders
        updateReminders(data.activeReminders);
        
        // Update health metrics
        updateHealthMetrics(data.healthMetrics);
        
        // Update recent activity
        updateRecentActivity(data.recentActivity);
        
        // Update emergency contacts
        updateEmergencyContacts(data.emergencyContacts);
        
        console.log('✅ UI updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating UI:', error);
        showNotification('Error updating dashboard: ' + error.message, 'error');
        // Don't throw - we want to keep the dashboard working
    }
}

// Update stats cards
function updateStats(stats) {
    if (!stats) return;
    
    // Update stats directly by finding the right elements
    const statNumbers = document.querySelectorAll('.text-3xl.font-bold.text-gray-800');
    
    if (statNumbers.length >= 4) {
        // Upcoming appointments
        statNumbers[0].textContent = stats.upcomingAppointments || 0;
        
        // Active reminders
        statNumbers[1].textContent = stats.activeReminders || 0;
        
        // Caregiver requests
        statNumbers[2].textContent = stats.caregiverRequests || 0;
        
        // Health score
        statNumbers[3].textContent = stats.healthScore || '85%';
    }
    
    // Update sidebar badges
    updateSidebarBadges(stats);
}

// Update sidebar badge counts
function updateSidebarBadges(stats) {
    // Update appointments badge
    const appointmentsLink = document.querySelector('a[href="#appointments"]');
    if (appointmentsLink) {
        const badge = appointmentsLink.querySelector('.sidebar-badge');
        if (badge && stats.upcomingAppointments) {
            badge.textContent = stats.upcomingAppointments;
        }
    }
    
    // Update reminders badge
    const remindersLink = document.querySelector('a[href="#medicalReminders"]');
    if (remindersLink) {
        const badge = remindersLink.querySelector('.sidebar-badge');
        if (badge && stats.activeReminders) {
            badge.textContent = stats.activeReminders;
        }
    }
}

// Update upcoming appointments
function updateAppointments(appointments) {
    if (!appointments) return;
    
    const container = document.querySelector('.space-y-4');
    if (!container) return;
    
    // Clear placeholder appointments
    const placeholderAppointments = container.querySelectorAll('.flex.items-center.p-4.border');
    placeholderAppointments.forEach(appt => appt.remove());
    
    // Add real appointments (max 2)
    appointments.slice(0, 2).forEach(appointment => {
        const appointmentEl = createAppointmentElement(appointment);
        container.appendChild(appointmentEl);
    });
}

// Create appointment element
function createAppointmentElement(appointment) {
    const div = document.createElement('div');
    div.className = 'flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all';
    
    const status = appointment.status || 'Pending';
    const statusClass = status === 'Confirmed' ? 'status-active' : 
                       status === 'Pending' ? 'status-pending' : 'status-cancelled';
    const statusText = status === 'Confirmed' ? 'text-green-600' : 
                      status === 'Pending' ? 'text-yellow-600' : 'text-red-600';
    
    const date = appointment.startDate || appointment.date;
    const formattedDate = formatAppointmentDate(date);
    
    div.innerHTML = `
        <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-user-nurse text-primary-600"></i>
        </div>
        <div class="flex-1">
            <h4 class="font-semibold text-gray-800">${appointment.caregiverId?.cgName || appointment.caregiverName || 'Caregiver'}</h4>
            <p class="text-gray-600 text-sm">${appointment.serviceType || 'Appointment'}</p>
            <div class="flex items-center mt-2">
                <i class="fas fa-clock text-gray-400 text-sm mr-2"></i>
                <span class="text-gray-700 text-sm">${formattedDate}</span>
            </div>
        </div>
        <div class="text-right">
            <span class="status-dot ${statusClass}"></span>
            <span class="text-sm ${statusText}">${status}</span>
            <button class="block mt-2 text-primary-600 hover:text-primary-800 text-sm view-appointment" data-id="${appointment._id}">
                <i class="fas fa-eye mr-1"></i> View
            </button>
        </div>
    `;
    
    return div;
}

// Update today's reminders
function updateReminders(reminders) {
    if (!reminders) return;
    
    const container = document.querySelector('.space-y-3');
    if (!container) return;
    
    // Clear placeholder reminders
    const placeholderReminders = container.querySelectorAll('.flex.items-center.p-3');
    placeholderReminders.forEach(reminder => reminder.remove());
    
    // Filter for today's reminders
    const today = new Date();
    const todayReminders = reminders.filter(reminder => {
        if (!reminder.nextReminder) return false;
        const reminderDate = new Date(reminder.nextReminder);
        return reminderDate.toDateString() === today.toDateString();
    }).slice(0, 3);
    
    // If no reminders for today, show some from the list
    const displayReminders = todayReminders.length > 0 ? todayReminders : reminders.slice(0, 3);
    
    // Add reminders
    displayReminders.forEach(reminder => {
        const reminderEl = createReminderElement(reminder);
        container.appendChild(reminderEl);
    });
}

// Create reminder element
function createReminderElement(reminder) {
    const div = document.createElement('div');
    div.className = 'flex items-center p-3 bg-blue-50 border border-blue-100 rounded-xl';
    
    const time = reminder.nextReminder ? new Date(reminder.nextReminder) : new Date();
    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <i class="fas fa-pills text-blue-600"></i>
        </div>
        <div class="flex-1">
            <h4 class="font-semibold text-gray-800">${reminder.medicationName || 'Medication'}</h4>
            <p class="text-gray-600 text-sm">${reminder.instructions || 'Take as prescribed'}</p>
        </div>
        <span class="text-blue-600 font-medium">${timeString}</span>
    `;
    
    return div;
}

// Update health metrics - FIXED: No :contains() selector
function updateHealthMetrics(metrics) {
    if (!metrics) return;
    
    // Find health metrics section
    const healthSection = document.querySelector('.bg-white.rounded-2xl.shadow-soft.p-6');
    if (!healthSection) return;
    
    // Find all progress bars
    const progressBars = healthSection.querySelectorAll('.w-full.bg-gray-200.rounded-full.h-2');
    
    if (progressBars.length >= 3) {
        // Update Blood Pressure progress bar
        if (metrics.bloodPressure) {
            const bp = metrics.bloodPressure;
            const bpValue = bp.systolic && bp.diastolic ? Math.min(100, (bp.systolic / 2) + (bp.diastolic / 2)) : 75;
            const bpBar = progressBars[0].querySelector('.bg-green-600, .bg-yellow-500, .bg-blue-600, .h-2');
            if (bpBar) {
                bpBar.style.width = `${bpValue}%`;
                
                // Update status text
                const statusElement = healthSection.querySelector('.text-sm.font-medium:first-of-type');
                if (statusElement && statusElement.nextElementSibling) {
                    if (bp.systolic < 120 && bp.diastolic < 80) {
                        statusElement.nextElementSibling.textContent = 'Normal';
                        statusElement.nextElementSibling.className = 'text-sm font-medium text-green-600';
                    } else if (bp.systolic < 140 && bp.diastolic < 90) {
                        statusElement.nextElementSibling.textContent = 'Elevated';
                        statusElement.nextElementSibling.className = 'text-sm font-medium text-yellow-600';
                    } else {
                        statusElement.nextElementSibling.textContent = 'High';
                        statusElement.nextElementSibling.className = 'text-sm font-medium text-red-600';
                    }
                }
            }
        }
        
        // Update Blood Sugar progress bar
        if (metrics.bloodSugar && metrics.bloodSugar.fasting) {
            const sugar = metrics.bloodSugar.fasting;
            const sugarValue = Math.min(100, sugar);
            const sugarBar = progressBars[1].querySelector('.bg-green-600, .bg-yellow-500, .bg-blue-600, .h-2');
            if (sugarBar) {
                sugarBar.style.width = `${sugarValue}%`;
                
                // Update status text
                const statusElements = healthSection.querySelectorAll('.text-sm.font-medium');
                if (statusElements.length > 2 && statusElements[2].nextElementSibling) {
                    if (sugar < 100) {
                        statusElements[2].nextElementSibling.textContent = 'Normal';
                        statusElements[2].nextElementSibling.className = 'text-sm font-medium text-green-600';
                    } else if (sugar < 126) {
                        statusElements[2].nextElementSibling.textContent = 'Prediabetes';
                        statusElements[2].nextElementSibling.className = 'text-sm font-medium text-yellow-600';
                    } else {
                        statusElements[2].nextElementSibling.textContent = 'Diabetes';
                        statusElements[2].nextElementSibling.className = 'text-sm font-medium text-red-600';
                    }
                }
            }
        }
    }
}

// Update recent activity
function updateRecentActivity(activities) {
    if (!activities || !activities.length) return;
    
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;
    
    // Clear placeholder rows
    const placeholderRows = tableBody.querySelectorAll('tr');
    placeholderRows.forEach(row => row.remove());
    
    // Add recent activities
    activities.slice(0, 5).forEach(activity => {
        const row = createActivityRow(activity);
        tableBody.appendChild(row);
    });
}

// Create activity row
function createActivityRow(activity) {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
    
    let icon = 'fa-calendar-plus';
    let iconColor = 'primary';
    let statusColor = 'green';
    
    if (activity.type === 'reminder') {
        icon = 'fa-bell';
        iconColor = 'accent';
    } else if (activity.type === 'booking') {
        icon = 'fa-calendar-check';
        iconColor = 'primary';
    }
    
    if (activity.status === 'Pending') {
        statusColor = 'yellow';
    } else if (activity.status === 'Cancelled') {
        statusColor = 'red';
    }
    
    const timeAgo = formatTimeAgo(activity.timestamp || activity.date);
    
    row.innerHTML = `
        <td class="py-4">
            <div class="flex items-center">
                <div class="w-8 h-8 bg-${iconColor}-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas ${icon} text-${iconColor}-600"></i>
                </div>
                <div>
                    <p class="font-medium text-gray-800">${activity.description || 'Activity'}</p>
                    <p class="text-gray-600 text-sm">${activity.details || activity.caregiver || ''}</p>
                </div>
            </div>
        </td>
        <td class="py-4 text-gray-600">${timeAgo}</td>
        <td class="py-4">
            <span class="px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-xs font-medium">
                ${activity.status || 'Completed'}
            </span>
        </td>
        <td class="py-4">
            <button class="text-primary-600 hover:text-primary-800 text-sm font-medium view-activity" data-id="${activity.id || activity._id}">
                View Details
            </button>
        </td>
    `;
    
    return row;
}

// Update emergency contacts
function updateEmergencyContacts(contacts) {
    if (!contacts || !contacts.length) return;
    
    // Find the emergency contacts section
    const emergencySection = document.querySelector('.bg-gradient-to-r.from-red-500.to-red-600');
    if (!emergencySection) return;
    
    // Find the secondary contact element (the one with the caregiver)
    const contactElements = emergencySection.querySelectorAll('.flex.items-center.justify-between.p-3.bg-white\\/10.rounded-xl');
    if (contactElements.length < 2) return;
    
    const contactElement = contactElements[1]; // Second contact is the caregiver
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
    
    if (primaryContact) {
        const nameElement = contactElement.querySelector('p.font-semibold');
        const phoneElement = contactElement.querySelector('p.text-white\\/80.text-sm');
        
        if (nameElement) nameElement.textContent = primaryContact.name || 'Emergency Contact';
        if (phoneElement) phoneElement.textContent = primaryContact.phone || 'No phone number';
        
        // Update phone link
        const callButton = contactElement.querySelector('a[href^="tel:"]');
        if (callButton && primaryContact.phone) {
            callButton.href = `tel:${primaryContact.phone}`;
            callButton.textContent = 'Call';
        }
    }
}

// Initialize event listeners - FIXED: No :contains() selectors
function initEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Logout button
    const logoutBtn = document.getElementById('userLogOutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = 'edit-profile.html';
        });
    }
    
    // Add health reading button - Find by looking for specific text
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent.includes('Add Health Reading')) {
            button.addEventListener('click', showAddHealthModal);
        }
    });
    
    // View all reminders button
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (link.textContent.includes('View All Reminders')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'reminders.html';
            });
        }
    });
    
    // Click handlers for dynamic elements
    document.addEventListener('click', function(e) {
        // View appointment buttons
        if (e.target.closest('.view-appointment')) {
            const btn = e.target.closest('.view-appointment');
            const appointmentId = btn.dataset.id;
            viewAppointmentDetails(appointmentId);
        }
        
        // View activity buttons
        if (e.target.closest('.view-activity')) {
            const btn = e.target.closest('.view-activity');
            const activityId = btn.dataset.id;
            viewActivityDetails(activityId);
        }
    });
    
    // Emergency contact button
    const emergencyBtn = document.querySelector('button[onclick*="showEmergencyPanel"]');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', showEmergencyPanel);
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Helper Functions
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function updateUserAge(dob) {
    try {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Add age to user info
        const userInfo = document.querySelector('.flex-1.min-w-0');
        if (userInfo) {
            let ageElement = userInfo.querySelector('.age-display');
            if (!ageElement) {
                ageElement = document.createElement('p');
                ageElement.className = 'age-display text-white/60 text-xs mt-1';
                userInfo.appendChild(ageElement);
            }
            ageElement.textContent = `${age} years old`;
        }
    } catch (error) {
        console.error('Error calculating age:', error);
    }
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

function formatAppointmentDate(dateString) {
    try {
        if (!dateString) return 'Date not set';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString || 'Date not set';
    }
}

function formatTimeAgo(timestamp) {
    try {
        if (!timestamp) return 'Recently';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Recently';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting time ago:', error);
        return 'Recently';
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'warning' ? 'bg-yellow-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Demo data for fallback
function loadDemoData() {
    console.log('📋 Loading demo data...');
    
    const demoData = {
        stats: {
            upcomingAppointments: 2,
            activeReminders: 3,
            caregiverRequests: 1,
            healthScore: '85%'
        },
        upcomingAppointments: [
            {
                _id: 'demo1',
                caregiverName: 'Dr. Anubhav Tiwari',
                serviceType: 'Physical Therapy',
                date: new Date(Date.now() + 3600000).toISOString(),
                status: 'Confirmed'
            }
        ],
        activeReminders: [
            {
                _id: 'demo1',
                medicationName: 'Morning Medication',
                instructions: 'Take with breakfast',
                nextReminder: new Date().setHours(9, 0, 0, 0)
            }
        ],
        healthMetrics: {
            bloodPressure: { systolic: 120, diastolic: 80 },
            bloodSugar: { fasting: 110 }
        },
        recentActivity: [
            {
                _id: 'demo1',
                type: 'booking',
                description: 'Appointment scheduled',
                details: 'With Dr. Anubhav Tiwari',
                status: 'Confirmed',
                timestamp: new Date(Date.now() - 7200000).toISOString()
            }
        ],
        emergencyContacts: [
            {
                name: 'Emergency Contact',
                phone: '+911234567890',
                isPrimary: true
            }
        ]
    };
    
    updateDashboardUI(demoData);
}

// UI Action Functions
function viewAppointmentDetails(appointmentId) {
    showNotification(`Viewing appointment ${appointmentId}`, 'info');
    // In real app: window.location.href = `/appointment/${appointmentId}`;
}

function viewActivityDetails(activityId) {
    showNotification(`Viewing activity ${activityId}`, 'info');
    // In real app: show modal or redirect
}

function showAddHealthModal() {
    showNotification('Add health reading feature coming soon!', 'info');
}

function showEmergencyPanel() {
    const panel = document.getElementById('emergencyPanel');
    if (panel) {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
    }
}

function hideEmergencyPanel() {
    const panel = document.getElementById('emergencyPanel');
    if (panel) {
        panel.classList.add('hidden');
        panel.classList.remove('flex');
    }
}

// Make functions available globally
window.showEmergencyPanel = showEmergencyPanel;
window.hideEmergencyPanel = hideEmergencyPanel;

// Debug helper
window.dashboardDebug = {
    getUser: () => currentUser,
    getData: () => dashboardData,
    refresh: () => {
        loadDashboardData()
            .then(() => showNotification('Dashboard refreshed!', 'success'))
            .catch(err => showNotification('Refresh failed: ' + err.message, 'error'));
    },
    testAuth: checkAuthentication
};

// ============================================
// Navigation and Responsive Enhancements
// ============================================

// Initialize responsive navigation
function initResponsiveNavigation() {
    console.log('📱 Initializing responsive navigation...');
    
    // Sidebar navigation click handlers
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            sidebarNavItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the target page from href
            const href = this.getAttribute('href');
            const targetId = href.substring(1);
            
            // Handle navigation based on target
            handleNavigation(targetId);
        });
    });
    
    // Quick action cards click handlers
    const quickActionCards = document.querySelectorAll('.quick-action-card');
    quickActionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click effect
            this.classList.add('opacity-80');
            setTimeout(() => {
                this.classList.remove('opacity-80');
            }, 200);
            
            // Get card type from text content
            const cardTitle = this.querySelector('h4').textContent.trim();
            handleQuickAction(cardTitle, this);
        });
    });
    
    // Stats cards click handlers
    const statsCards = document.querySelectorAll('.bg-white.rounded-2xl.p-6.shadow-soft');
    statsCards.forEach((card, index) => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click effect
            this.classList.add('ring-2', 'ring-primary-300');
            setTimeout(() => {
                this.classList.remove('ring-2', 'ring-primary-300');
            }, 300);
            
            // Handle based on card index
            handleStatsCardClick(index, this);
        });
        
        // Make stats cards more responsive
        card.style.cursor = 'pointer';
    });
    
    // Appointment items click handlers
    document.addEventListener('click', function(e) {
        const appointmentItem = e.target.closest('.flex.items-center.p-4.border');
        if (appointmentItem && appointmentItem.classList.contains('border-gray-200')) {
            e.preventDefault();
            handleAppointmentClick(appointmentItem);
        }
    });
    
    // Reminder items click handlers
    document.addEventListener('click', function(e) {
        const reminderItem = e.target.closest('.flex.items-center.p-3.bg-');
        if (reminderItem) {
            e.preventDefault();
            handleReminderClick(reminderItem);
        }
    });
    
    // Table row click handlers
    document.addEventListener('click', function(e) {
        const tableRow = e.target.closest('tr.hover\\:bg-gray-50');
        if (tableRow) {
            e.preventDefault();
            handleTableRowClick(tableRow);
        }
    });
    
    // Emergency contact buttons
    const emergencyButtons = document.querySelectorAll('a[href^="tel:"]');
    emergencyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Don't bubble up
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            showNotification(`Calling ${phoneNumber}...`, 'info');
            // Actual call will be handled by device
        });
    });
    
    // Make all buttons more responsive
    const allButtons = document.querySelectorAll('button, a[href="#"]');
    allButtons.forEach(button => {
        // Add hover effects if not already present
        if (!button.classList.contains('transition-all')) {
            button.classList.add('transition-all', 'duration-200');
        }
        
        // Prevent default for anchor tags without href
        if (button.tagName === 'A' && button.getAttribute('href') === '#') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
            });
        }
    });
    
    // Responsive adjustments for mobile
    function adjustForMobile() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Adjust font sizes for mobile
            document.querySelectorAll('h1').forEach(el => {
                if (!el.classList.contains('text-2xl')) {
                    el.classList.add('text-xl');
                }
            });
            
            document.querySelectorAll('h2').forEach(el => {
                if (!el.classList.contains('text-xl')) {
                    el.classList.add('text-lg');
                }
            });
            
            // Make cards more compact on mobile
            document.querySelectorAll('.p-6').forEach(el => {
                if (el.classList.contains('p-6')) {
                    el.classList.add('p-4');
                    el.classList.remove('p-6');
                }
            });
            
            // Adjust grid layouts
            const gridContainers = document.querySelectorAll('.grid');
            gridContainers.forEach(container => {
                if (container.classList.contains('grid-cols-3')) {
                    container.classList.remove('grid-cols-3');
                    container.classList.add('grid-cols-1');
                }
            });
        }
    }
    
    // Initial adjustment
    adjustForMobile();
    
    // Adjust on window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(adjustForMobile, 250);
    });
    
    console.log('✅ Responsive navigation initialized');
}

// Handle sidebar navigation
function handleNavigation(targetId) {
    console.log(`Navigating to: ${targetId}`);
    
    switch(targetId) {
        case 'home':
            // Already on home
            window.location.href = 'dashboard.html';
            break;
            
        case 'appointments':
            // Navigate to appointments page
            window.location.href = '';
            break;
            
        case 'medicalReminders':
            // Navigate to medical reminders page
            window.location.href = '';
            break;
            
        case 'findCaregivers':
            // Navigate to find caregivers page
            window.location.href = '';
            break;
            
        case 'bookings':
            // Navigate to my bookings page
            window.location.href = '';
            break;
            
        case 'requests':
            // Navigate to sent requests page
            window.location.href = '';
            break;
            
        case 'hospitals':
            // Navigate to nearby hospitals page
            window.location.href = '';
            break;
            
        case 'health':
            // Navigate to health metrics page
            window.location.href = '';
            break;
            
        case 'settings':
            // Navigate to settings page
            window.location.href = '';
            break;
            
        default:
            // For sections within the same page
            const section = document.getElementById(targetId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.warn(`Section ${targetId} not found`);
            }
    }
}

// Handle quick action card clicks
function handleQuickAction(cardTitle, cardElement) {
    console.log(`Quick action: ${cardTitle}`);
    
    switch(cardTitle.toLowerCase()) {
        case 'my bookings':
            window.location.href = '';
            break;
            
        case 'view reminders':
            window.location.href = '';
            break;
            
        case 'sent requests':
            window.location.href = '';
            break;
            
        case 'set new reminder':
            window.location.href = 'medicalReminder.html';
            break;
            
        case 'search caregivers':
            window.location.href = 'find-caregivers.html';
            break;
            
        case 'settings':
            window.location.href = '';
            break;
            
        default:
            showNotification(`Action "${cardTitle}" is coming soon!`, 'info');
    }
}

// Handle stats card clicks
function handleStatsCardClick(index, cardElement) {
    console.log(`Stats card ${index} clicked`);
    
    switch(index) {
        case 0: // Upcoming Appointments
            window.location.href = '';
            break;
            
        case 1: // Active Reminders
            window.location.href = '';
            break;
            
        case 2: // Caregiver Requests
            window.location.href = '';
            break;
            
        case 3: // Health Score
            window.location.href = '';
            break;
            
        default:
            showNotification('Viewing details...', 'info');
    }
}

// Handle appointment item clicks
function handleAppointmentClick(appointmentItem) {
    const appointmentName = appointmentItem.querySelector('.font-semibold.text-gray-800').textContent;
    const appointmentTime = appointmentItem.querySelector('.text-gray-700.text-sm').textContent;
    
    showNotification(`Opening appointment with ${appointmentName} at ${appointmentTime}`, 'info');
    
    // Navigate to appointment details page
    window.location.href = '';
}

// Handle reminder item clicks
function handleReminderClick(reminderItem) {
    const reminderName = reminderItem.querySelector('.font-semibold.text-gray-800').textContent;
    const reminderTime = reminderItem.querySelector('.text-blue-600.font-medium, .text-red-600.font-medium, .text-green-600.font-medium').textContent;
    
    showNotification(`Marking reminder "${reminderName}" as completed`, 'success');
    
    // Add visual feedback
    reminderItem.classList.add('opacity-50');
    setTimeout(() => {
        reminderItem.classList.remove('opacity-50');
        reminderItem.classList.add('line-through', 'opacity-70');
        
        // Update time to show completed
        const timeElement = reminderItem.querySelector('.font-medium');
        if (timeElement) {
            timeElement.textContent = 'Completed ✓';
            timeElement.className = 'text-green-600 font-medium';
        }
    }, 300);
    
    // In real app: Send API request to mark as completed
    // await markReminderAsCompleted(reminderId);
}

// Handle table row clicks
function handleTableRowClick(tableRow) {
    const activityText = tableRow.querySelector('.font-medium.text-gray-800').textContent;
    
    showNotification(`Viewing details for: ${activityText}`, 'info');
    
    // Navigate to activity details
    window.location.href = '';
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add this to your existing initialization
    initResponsiveNavigation();
    
    // Add CSS for responsive behaviors
    const style = document.createElement('style');
    style.textContent = `
        /* Responsive card hover effects */
        @media (min-width: 768px) {
            .quick-action-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            .bg-white.rounded-2xl.p-6.shadow-soft:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
            }
        }
        
        /* Mobile touch feedback */
        @media (max-width: 767px) {
            .quick-action-card:active,
            .sidebar-nav-item:active,
            button:active {
                opacity: 0.7;
                transform: scale(0.98);
            }
            
            /* Prevent text selection on mobile */
            .quick-action-card,
            .sidebar-nav-item,
            button {
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
        }
        
        /* Loading state for clickable elements */
        .loading-state {
            position: relative;
            pointer-events: none;
        }
        
        .loading-state::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});

// Add these helper functions for navigation
window.navigateTo = function(page) {
    showNotification(`Loading ${page}...`, 'info');
    
    // Add loading state to the clicked element
    const activeElement = document.activeElement;
    if (activeElement) {
        const originalHTML = activeElement.innerHTML;
        activeElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading...';
        activeElement.classList.add('loading-state');
        
        // Restore after 1.5 seconds (in case navigation doesn't happen)
        setTimeout(() => {
            activeElement.innerHTML = originalHTML;
            activeElement.classList.remove('loading-state');
        }, 1500);
    }
    
    // You'll fill in the actual navigation later
    // window.location.href = `${page}.html`;
};

// Make navigation functions available globally
window.DashboardNav = {
    goToAppointments: function() {
        window.location.href = '';
    },
    goToReminders: function() {
        window.location.href = '';
    },
    goToCaregivers: function() {
        window.location.href = '';
    },
    goToBookings: function() {
        window.location.href = '';
    },
    goToHealthMetrics: function() {
        window.location.href = '';
    },
    goToSettings: function() {
        window.location.href = '';
    }
};

console.log('✅ Navigation module loaded successfully');


console.log('✅ Dashboard script loaded successfully');