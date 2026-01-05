// ============================================
// ElderlyCare Assistant - Medical Reminders Module
// ============================================

// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api'
    : 'https://elderlycare-backend-f853.onrender.com/api';

// Global state
let currentUser = null;
let remindersData = null;
let currentPage = 1;
let currentFilters = {};
let editingReminderId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Medical Reminders page loading...');
    
    try {
        // Initialize UI components first
        initUIComponents();
        initEventListeners();
        updateCurrentDate();
        
        // Then load data
        loadRemindersPage();
        
        console.log('✅ Medical Reminders page ready');
    } catch (error) {
        console.error('❌ Page initialization failed:', error);
        showNotification('Failed to load page. Please refresh.', 'error');
    }
});

// Initialize UI components
// Initialize UI components
function initUIComponents() {
    console.log('🏗️ Initializing UI components...');
    
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
    
    // Set default time for reminderTime1
    const timeInput = document.getElementById('reminderTime1');
    if (timeInput && !timeInput.value) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const defaultTime = now.toTimeString().substring(0, 5);
        timeInput.value = defaultTime;
    }
    
    // Set today's date and minimum date for start date input
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.value = today;
        startDateInput.min = today;
    }
    
    // Set default time for filter dates
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');
    if (filterStartDate) {
        filterStartDate.value = today;
    }
    if (filterEndDate) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        filterEndDate.value = nextWeek.toISOString().split('T')[0];
    }
}

// Initialize all event listeners
function initEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Authentication & Navigation
    initAuthListeners();
    initNavListeners();
    initTabListeners();
    
    // Reminder Actions
    initReminderActionListeners();
    initModalListeners();
    initFilterListeners();
    initFormListeners();
    
    // Quick Actions
    initQuickActionListeners();
    
    // Search
    initSearchListener();
}

// Authentication listeners
function initAuthListeners() {
    // Logout button
    const logoutBtn = document.getElementById('userLogOutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Navigation listeners
function initNavListeners() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                scrollToSection(targetId);
                
                // Update active tab
                if (targetId === 'medicationReminders') {
                    switchTab('medication');
                } else if (targetId === 'appointmentReminders') {
                    switchTab('appointment');
                } else if (targetId === 'quickAdd') {
                    showAddReminderModal();
                } else if (targetId === 'history') {
                    switchTab('completed');
                }
            }
        });
    });
}

// Tab navigation listeners
function initTabListeners() {
    const tabs = {
        'allRemindersTab': 'all',
        'dueRemindersTab': 'due',
        'medicationTab': 'medication',
        'appointmentTab': 'appointment',
        'completedTab': 'completed'
    };
    
    Object.entries(tabs).forEach(([tabId, tabName]) => {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.addEventListener('click', function() {
                switchTab(tabName);
            });
        }
    });
}

// Reminder action listeners
function initReminderActionListeners() {
    // Add new reminder button
    const addReminderBtn = document.getElementById('addReminderButton');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', showAddReminderModal);
    }
    
    // Create first reminder button
    const createFirstBtn = document.getElementById('createFirstReminder');
    if (createFirstBtn) {
        createFirstBtn.addEventListener('click', showAddReminderModal);
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreButton');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreReminders);
    }
    
    // View all due button
    const viewAllDueBtn = document.getElementById('viewAllDue');
    if (viewAllDueBtn) {
        viewAllDueBtn.addEventListener('click', function() {
            switchTab('due');
        });
    }
    
    // Delete reminder buttons (dynamic - handled in renderReminders)
    // Edit reminder buttons (dynamic - handled in renderReminders)
    // Complete reminder buttons (dynamic - handled in renderReminders)
}

// Modal listeners
function initModalListeners() {
    // Create/Edit reminder modal
    const reminderModal = document.getElementById('reminderModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelReminderBtn = document.getElementById('cancelReminder');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideReminderModal);
    }
    
    if (cancelReminderBtn) {
        cancelReminderBtn.addEventListener('click', hideReminderModal);
    }
    
    // Close modal when clicking outside
    if (reminderModal) {
        reminderModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideReminderModal();
            }
        });
    }
    
    // Complete reminder modal
    const completeModal = document.getElementById('completeModal');
    const closeCompleteBtn = document.getElementById('closeCompleteModal');
    const cancelCompleteBtn = document.getElementById('cancelComplete');
    
    if (closeCompleteBtn) {
        closeCompleteBtn.addEventListener('click', hideCompleteModal);
    }
    
    if (cancelCompleteBtn) {
        cancelCompleteBtn.addEventListener('click', hideCompleteModal);
    }
    
    // Close complete modal when clicking outside
    if (completeModal) {
        completeModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideCompleteModal();
            }
        });
    }
    
    // Filter modal
    const filterModal = document.getElementById('filterModal');
    const closeFilterBtn = document.getElementById('closeFilterModal');
    const filterButton = document.getElementById('filterButton');
    
    if (closeFilterBtn) {
        closeFilterBtn.addEventListener('click', hideFilterModal);
    }
    
    if (filterButton) {
        filterButton.addEventListener('click', showFilterModal);
    }
    
    // Close filter modal when clicking outside
    if (filterModal) {
        filterModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideFilterModal();
            }
        });
    }
}

// Filter listeners
function initFilterListeners() {
    const resetFiltersBtn = document.getElementById('resetFilters');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

// Form listeners
function initFormListeners() {
    const reminderForm = document.getElementById('reminderForm');
    if (reminderForm) {
        reminderForm.addEventListener('submit', handleReminderSubmit);
    }
    
    // Category change listener
    const categorySelect = document.getElementById('reminderCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    }
    
    // Schedule type change listener
    const scheduleSelect = document.getElementById('scheduleType');
    if (scheduleSelect) {
        scheduleSelect.addEventListener('change', handleScheduleTypeChange);
    }
    
    // Add time button
    const addTimeBtn = document.getElementById('addTimeButton');
    if (addTimeBtn) {
        addTimeBtn.addEventListener('click', addTimeField);
    }
    
    // Complete reminder form
    const confirmCompleteBtn = document.getElementById('confirmComplete');
    if (confirmCompleteBtn) {
        confirmCompleteBtn.addEventListener('click', handleCompleteReminder);
    }
}

// Quick action listeners
function initQuickActionListeners() {
    // Take medication button
    const takeMedicationBtn = document.getElementById('takeMedication');
    if (takeMedicationBtn) {
        takeMedicationBtn.addEventListener('click', function() {
            // TODO: Implement quick medication completion
            showNotification('Select a medication reminder to mark as taken', 'info');
        });
    }
    
    // Skip reminder button
    const skipReminderBtn = document.getElementById('skipReminder');
    if (skipReminderBtn) {
        skipReminderBtn.addEventListener('click', function() {
            // TODO: Implement quick skip
            showNotification('Select a reminder to skip', 'info');
        });
    }
    
    // Snooze reminder button
    const snoozeReminderBtn = document.getElementById('snoozeReminder');
    if (snoozeReminderBtn) {
        snoozeReminderBtn.addEventListener('click', function() {
            // TODO: Implement quick snooze
            showNotification('Select a reminder to snooze', 'info');
        });
    }
    
    // Quick add reminder button
    const addQuickReminderBtn = document.getElementById('addQuickReminder');
    if (addQuickReminderBtn) {
        addQuickReminderBtn.addEventListener('click', function() {
            showQuickAddModal();
        });
    }
}

// Search listener
function initSearchListener() {
    const searchInput = document.getElementById('searchReminders');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchReminders(this.value);
            }, 300);
        });
    }
}

// Load reminders page
async function loadRemindersPage() {
    try {
        showLoading(true);
        
        // Check authentication
        await checkAuthentication();
        
        // Load user profile
        await loadUserProfile();
        
        // Load reminder statistics
        await loadReminderStats();
        
        // Load reminders
        await loadReminders();
        
        // Load due reminders
        await loadDueReminders();
        
        // Load categories
        updateCategoriesList();
        
        showLoading(false);
        
    } catch (error) {
        console.error('❌ Failed to load reminders page:', error);
        showLoading(false);
        
        if (error.message.includes('authenticated')) {
            window.location.href = 'login.html';
        } else {
            showNotification('Failed to load reminders. Please try again.', 'error');
        }
    }
}

// Check authentication
async function checkAuthentication() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Authentication failed');
        }
        
        currentUser = data.data;
        console.log('✅ User authenticated:', currentUser.UName);
        
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        localStorage.clear();
        window.location.href = 'login.html';
        throw error;
    }
}

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        // Update user information
        updateElementText('userName', currentUser.UName || 'User');
        updateElementText('userEmail', currentUser.UEmail || '');
        
        // Update profile picture if available
        if (currentUser.UProfileImage) {
            const profilePic = document.getElementById('userProfilePic');
            if (profilePic && currentUser.UProfileImage !== 'default-user.png') {
                profilePic.src = `/uploads/${currentUser.UProfileImage}`;
            }
        }
        
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load reminder statistics
async function loadReminderStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/stats`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load stats: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateStatsUI(data.data);
        }
        
    } catch (error) {
        console.error('Error loading reminder stats:', error);
    }
}

// Load reminders
async function loadReminders() {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams(currentFilters);
        queryParams.set('page', currentPage);
        queryParams.set('limit', '10');
        
        const response = await fetch(`${API_BASE_URL}/reminders?${queryParams}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load reminders: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            remindersData = data;
            renderReminders(data.data);
            updateTabCounts(data);
            
            // Show/hide load more button
            const loadMoreContainer = document.getElementById('loadMoreContainer');
            if (loadMoreContainer) {
                loadMoreContainer.classList.toggle('hidden', data.page >= data.pages);
            }
        }
        
    } catch (error) {
        console.error('Error loading reminders:', error);
        showNotification('Failed to load reminders', 'error');
    }
}

// Load more reminders
async function loadMoreReminders() {
    currentPage++;
    await loadReminders();
}

// Load due reminders
async function loadDueReminders() {
    try {
        const response = await fetch(`${API_BASE_URL}/reminders/due`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load due reminders: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            renderDueReminders(data.data);
            updateDueNowCount(data.count);
        }
        
    } catch (error) {
        console.error('Error loading due reminders:', error);
    }
}

// Update statistics UI
function updateStatsUI(stats) {
    // Update main stats cards
    updateElementText('totalReminders', stats.total || 0);
    updateElementText('dueReminders', stats.due || 0);
    updateElementText('completionPercentage', `${Math.round(stats.completionRate || 0)}%`);
    updateElementText('currentStreak', `${stats.streaks?.current || 0} days`);
    
    // Update sidebar stats
    updateElementText('activeRemindersCount', stats.active || 0);
    updateElementText('dueTodayCount', stats.due || 0);
    updateElementText('completionRate', `${Math.round(stats.completionRate || 0)}%`);
    
    // Update badge counts
    updateElementText('remindersBadge', stats.total || 0);
    
    // Calculate medication count from categories
    const medicationCount = stats.categories?.filter(cat => cat === 'Medication').length || 0;
    updateElementText('medicationBadge', medicationCount);
    
    // Update change indicator
    const changeElement = document.getElementById('reminderChange');
    if (changeElement) {
        const change = stats.total > 0 ? '+' + stats.total : '0';
        changeElement.textContent = `${change} new`;
    }
}

// Update tab counts
function updateTabCounts(data) {
    // Calculate counts from data
    const allCount = data.total || 0;
    const dueCount = data.categories?.due || 0;
    const upcomingCount = data.categories?.upcoming || 0;
    
    // Update badge counts
    updateElementText('allCountBadge', allCount);
    updateElementText('dueCountBadge', dueCount);
    
    // These would need additional API calls or filtering
    // For now, we'll use placeholders
    updateElementText('medicationCountBadge', '0');
    updateElementText('appointmentCountBadge', '0');
    updateElementText('completedCountBadge', '0');
}

// Update due now count
function updateDueNowCount(count) {
    const dueNowCard = document.getElementById('dueNowCard');
    if (dueNowCard) {
        dueNowCard.classList.toggle('hidden', count === 0);
    }
}

// Render reminders list
function renderReminders(reminders) {
    const container = document.getElementById('remindersList');
    if (!container) return;
    
    // Clear existing content if it's the first page
    if (currentPage === 1) {
        container.innerHTML = '';
    }
    
    // Show empty state if no reminders
    if (!reminders || reminders.length === 0) {
        if (currentPage === 1) {
            container.innerHTML = `
                <div class="empty-state bg-white rounded-2xl shadow-soft">
                    <i class="fas fa-bell-slash"></i>
                    <h3 class="text-xl font-semibold mb-2">No reminders found</h3>
                    <p class="mb-4">${Object.keys(currentFilters).length > 0 ? 'Try changing your filters' : 'Create your first medical reminder'}</p>
                    <button id="createFirstReminder" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Create Reminder
                    </button>
                </div>
            `;
            
            // Re-attach event listener
            const createFirstBtn = document.getElementById('createFirstReminder');
            if (createFirstBtn) {
                createFirstBtn.addEventListener('click', showAddReminderModal);
            }
        }
        return;
    }
    
    // Create reminders
    reminders.forEach(reminder => {
        const reminderElement = createReminderElement(reminder);
        container.appendChild(reminderElement);
    });
    
    // Attach event listeners to new reminder elements
    attachReminderEventListeners();
}

// Create a reminder element
function createReminderElement(reminder) {
    const isDue = reminder.isDue || false;
    const categoryClass = `category-${reminder.category.toLowerCase().replace(/\s+/g, '-')}`;
    const priorityClass = `priority-${reminder.priority.toLowerCase()}`;
    
    // Format times
    const timesHTML = reminder.times && reminder.times.length > 0
        ? reminder.times.map(time => `
            <span class="time-badge">
                <i class="far fa-clock"></i>${time.time || '--:--'}
            </span>
        `).join('')
        : '<span class="text-gray-500">No time set</span>';
    
    // Format next reminder
    const nextReminderText = reminder.nextReminder
        ? new Date(reminder.nextReminder).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Not scheduled';
    
    return document.createRange().createContextualFragment(`
        <div class="reminder-card bg-white rounded-2xl p-6 ${isDue ? 'due-reminder' : ''} ${categoryClass}" data-id="${reminder._id}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-xl font-bold text-gray-800">${reminder.title || 'Untitled Reminder'}</h3>
                        <span class="priority-badge ${priorityClass}">${reminder.priority}</span>
                        <span class="status-dot status-${reminder.status.toLowerCase()}"></span>
                        <span class="text-sm font-medium text-gray-600">${reminder.status}</span>
                    </div>
                    
                    <p class="text-gray-600 mb-3">${reminder.description || 'No description'}</p>
                    
                    <div class="flex flex-wrap items-center gap-4 mb-4">
                        <div class="flex items-center">
                            <i class="fas fa-tag text-gray-400 mr-2"></i>
                            <span class="text-sm text-gray-700">${reminder.category}</span>
                        </div>
                        
                        ${reminder.medicineName ? `
                        <div class="flex items-center">
                            <i class="fas fa-pills text-gray-400 mr-2"></i>
                            <span class="text-sm text-gray-700">${reminder.medicineName}</span>
                        </div>
                        ` : ''}
                        
                        ${reminder.medicineType ? `
                        <div class="flex items-center">
                            <i class="fas fa-capsules text-gray-400 mr-2"></i>
                            <span class="text-sm text-gray-700">${reminder.medicineType}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-clock text-gray-400 mr-2"></i>
                            <span class="text-sm font-medium text-gray-700">Schedule:</span>
                        </div>
                        <div class="pl-6">
                            <p class="text-sm text-gray-600 mb-1">Type: ${reminder.scheduleType}</p>
                            <div class="flex flex-wrap gap-2 mb-2">
                                ${timesHTML}
                            </div>
                            <p class="text-sm text-gray-600">Next: ${nextReminderText}</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    ${reminder.status === 'Active' ? `
                    <button class="complete-reminder-btn bg-accent-500 hover:bg-accent-600 text-white p-2 rounded-lg transition-colors" 
                            data-id="${reminder._id}"
                            title="Mark as complete">
                        <i class="fas fa-check"></i>
                    </button>
                    ` : ''}
                    
                    <button class="edit-reminder-btn bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors" 
                            data-id="${reminder._id}"
                            title="Edit reminder">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button class="delete-reminder-btn bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors" 
                            data-id="${reminder._id}"
                            title="Delete reminder">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                        <i class="fas fa-fire text-yellow-500 mr-1"></i>
                        <span class="text-sm text-gray-700">Streak: ${reminder.streak?.current || 0} days</span>
                    </div>
                    
                    <div class="flex items-center">
                        <i class="fas fa-chart-line text-green-500 mr-1"></i>
                        <span class="text-sm text-gray-700">Completion: ${Math.round(reminder.completionRate || 0)}%</span>
                    </div>
                </div>
                
                <div class="text-sm text-gray-500">
                    Created: ${new Date(reminder.createdAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    `).firstElementChild;
}

// Render due reminders
function renderDueReminders(reminders) {
    const container = document.getElementById('dueNowList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!reminders || reminders.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No due reminders</p>';
        return;
    }
    
    reminders.slice(0, 3).forEach(reminder => {
        const dueElement = createDueReminderElement(reminder);
        container.appendChild(dueElement);
    });
}

// Create due reminder element
function createDueReminderElement(reminder) {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl';
    div.dataset.id = reminder._id;
    
    div.innerHTML = `
        <div class="flex items-center">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas ${reminder.category === 'Medication' ? 'fa-pills' : 'fa-bell'} text-red-600"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-800 truncate">${reminder.title}</h4>
                <p class="text-gray-600 text-sm truncate">${reminder.medicineName || reminder.category}</p>
            </div>
        </div>
        <button class="complete-due-btn bg-accent-500 hover:bg-accent-600 text-white px-3 py-1 rounded-lg font-medium transition-colors" 
                data-id="${reminder._id}">
            Done
        </button>
    `;
    
    return div;
}

// Update categories list
function updateCategoriesList() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    const categories = [
        { name: 'Medication', icon: 'fa-pills', color: 'blue', count: 0 },
        { name: 'Doctor Appointment', icon: 'fa-user-md', color: 'green', count: 0 },
        { name: 'Health Checkup', icon: 'fa-stethoscope', color: 'purple', count: 0 },
        { name: 'Exercise', icon: 'fa-running', color: 'yellow', count: 0 },
        { name: 'Meal', icon: 'fa-utensils', color: 'red', count: 0 },
        { name: 'Water Intake', icon: 'fa-tint', color: 'cyan', count: 0 }
    ];
    
    container.innerHTML = categories.map(cat => `
        <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer category-filter" data-category="${cat.name}">
            <div class="flex items-center">
                <div class="w-8 h-8 bg-${cat.color}-100 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas ${cat.icon} text-${cat.color}-600"></i>
                </div>
                <span class="font-medium text-gray-700">${cat.name}</span>
            </div>
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">${cat.count}</span>
        </div>
    `).join('');
    
    // Add category filter listeners
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.dataset.category;
            currentFilters.category = category;
            currentPage = 1;
            loadReminders();
        });
    });
}

// Attach event listeners to reminder elements
function attachReminderEventListeners() {
    // Complete reminder buttons
    const completeButtons = document.querySelectorAll('.complete-reminder-btn, .complete-due-btn');
    completeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const reminderId = this.dataset.id;
            showCompleteModal(reminderId);
        });
    });
    
    // Edit reminder buttons
    const editButtons = document.querySelectorAll('.edit-reminder-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const reminderId = this.dataset.id;
            editReminder(reminderId);
        });
    });
    
    // Delete reminder buttons
    const deleteButtons = document.querySelectorAll('.delete-reminder-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const reminderId = this.dataset.id;
            deleteReminder(reminderId);
        });
    });
    
    // Reminder card click (for details view - TODO)
    const reminderCards = document.querySelectorAll('.reminder-card');
    reminderCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (!e.target.closest('button')) {
                const reminderId = this.dataset.id;
                viewReminderDetails(reminderId);
            }
        });
    });
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    const tabs = ['all', 'due', 'medication', 'appointment', 'completed'];
    tabs.forEach(tab => {
        const tabElement = document.getElementById(`${tab}RemindersTab`);
        if (tabElement) {
            tabElement.classList.toggle('active', tab === tabName);
        }
    });
    
    // Update filters based on tab
    currentPage = 1;
    
    switch (tabName) {
        case 'all':
            delete currentFilters.category;
            delete currentFilters.status;
            break;
        case 'due':
            delete currentFilters.category;
            currentFilters.status = 'Active';
            // Note: Due filtering would need server-side support
            break;
        case 'medication':
            currentFilters.category = 'Medication';
            delete currentFilters.status;
            break;
        case 'appointment':
            currentFilters.category = 'Doctor Appointment';
            delete currentFilters.status;
            break;
        case 'completed':
            delete currentFilters.category;
            currentFilters.status = 'Completed';
            break;
    }
    
    loadReminders();
}

// Search reminders
function searchReminders(query) {
    if (query.trim()) {
        currentFilters.search = query;
    } else {
        delete currentFilters.search;
    }
    currentPage = 1;
    loadReminders();
}

// Show add reminder modal
function showAddReminderModal() {
    editingReminderId = null;
    
    const modal = document.getElementById('reminderModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('reminderForm');
    
    if (modalTitle) modalTitle.textContent = 'Create New Reminder';
    if (form) form.reset();
    
    // Reset form fields
    resetFormFields();
    
    // Show modal
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// Show edit reminder modal
async function editReminder(reminderId) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load reminder');
        }
        
        const data = await response.json();
        
        if (data.success) {
            editingReminderId = reminderId;
            populateReminderForm(data.data);
            
            const modal = document.getElementById('reminderModal');
            const modalTitle = document.getElementById('modalTitle');
            
            if (modalTitle) modalTitle.textContent = 'Edit Reminder';
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading reminder:', error);
        showLoading(false);
        showNotification('Failed to load reminder details', 'error');
    }
}

// Populate reminder form
function populateReminderForm(reminder) {
    // Basic fields
    setFormValue('reminderTitle', reminder.title);
    setFormValue('reminderDescription', reminder.description);
    setFormValue('reminderCategory', reminder.category);
    setFormValue('reminderPriority', reminder.priority);
    setFormValue('scheduleType', reminder.scheduleType);
    
    // Dates
    if (reminder.startDate) {
        setFormValue('startDate', new Date(reminder.startDate).toISOString().split('T')[0]);
    }
    
    // Medication fields
    if (reminder.category === 'Medication') {
        setFormValue('medicineName', reminder.medicineName);
        setFormValue('medicineDosage', reminder.dosage?.quantity + (reminder.dosage?.unit || ''));
        setFormValue('medicineType', reminder.medicineType);
        setFormValue('dosageInstructions', reminder.dosageInfo);
        setFormValue('medicationFrequency', reminder.frequency);
    }
    
    // Times
    if (reminder.times && reminder.times.length > 0) {
        setFormValue('reminderTime1', reminder.times[0].time);
        
        // Clear additional times
        const additionalTimes = document.getElementById('additionalTimes');
        if (additionalTimes) additionalTimes.innerHTML = '';
        
        // Add additional times
        reminder.times.slice(1).forEach((time, index) => {
            addTimeField(time.time);
        });
    }
    
    // Days of week
    if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
        const dayCheckboxes = document.querySelectorAll('input[name="days"]');
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = reminder.daysOfWeek.includes(checkbox.value);
        });
    }
    
    // Notification settings
    setFormValue('pushNotifications', reminder.notifications?.push?.enabled || true);
    setFormValue('emailNotifications', reminder.notifications?.email?.enabled || true);
    setFormValue('advanceNotification', reminder.notifications?.advanceTime || 15);
    
    // Trigger category change to show/hide appropriate fields
    const categorySelect = document.getElementById('reminderCategory');
    if (categorySelect) {
        categorySelect.dispatchEvent(new Event('change'));
    }
}

// Show complete modal
async function showCompleteModal(reminderId) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load reminder');
        }
        
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('reminderToComplete');
            if (container) {
                container.innerHTML = `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-bold text-gray-800">${data.data.title}</h4>
                        ${data.data.medicineName ? `<p class="text-gray-600">${data.data.medicineName}</p>` : ''}
                        <p class="text-sm text-gray-500 mt-1">${data.data.category}</p>
                    </div>
                `;
            }
            
            // Store reminder ID for completion
            const completeModal = document.getElementById('completeModal');
            if (completeModal) {
                completeModal.dataset.reminderId = reminderId;
                completeModal.classList.remove('hidden');
                completeModal.classList.add('flex');
            }
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading reminder:', error);
        showLoading(false);
        showNotification('Failed to load reminder details', 'error');
    }
}

// Show filter modal
function showFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// Show quick add modal (simplified version)
function showQuickAddModal() {
    // For now, just show the regular modal
    showAddReminderModal();
    
    // TODO: Implement a simplified quick add form
}

// Handle reminder form submission
// Handle reminder form submission
//// Handle reminder form submission - UPDATED VERSION
async function handleReminderSubmit(e) {
    e.preventDefault();
    
    try {
        // First validate the form
        if (!validateReminderForm()) {
            return;
        }
        
        showLoading(true);
        
        // Gather form data
        const formData = {
            title: getFormValue('reminderTitle'),
            description: getFormValue('reminderDescription'),
            category: getFormValue('reminderCategory'),
            priority: getFormValue('reminderPriority'),
            scheduleType: getFormValue('scheduleType'),
            times: getReminderTimes(),
            notifications: {
                push: { enabled: getFormValue('pushNotifications') === 'true' },
                email: { enabled: getFormValue('emailNotifications') === 'true' },
                advanceTime: parseInt(getFormValue('advanceNotification')) || 15
            },
            status: 'Active',
            isActive: true
        };
        
        // Handle start date - ensure it's not in the past
        const startDateStr = getFormValue('startDate');
        if (startDateStr) {
            // Create date at noon to avoid timezone/time of day issues
            const startDate = new Date(startDateStr);
            startDate.setHours(12, 0, 0, 0); // Set to noon
            formData.startDate = startDate;
        }
        
        // Add category-specific fields
        if (formData.category === 'Medication') {
            formData.medicineName = getFormValue('medicineName');
            formData.dosageInfo = getFormValue('dosageInstructions');
            formData.medicineType = getFormValue('medicineType');
            formData.frequency = getFormValue('medicationFrequency');
            
            // Parse dosage
            const dosage = getFormValue('medicineDosage');
            if (dosage && dosage.trim()) {
                const match = dosage.match(/(\d+)\s*(\w+)/);
                if (match) {
                    formData.dosage = {
                        quantity: parseInt(match[1]),
                        unit: match[2]
                    };
                }
            }
        }
        
        // Add days of week for weekly schedule
        if (formData.scheduleType === 'Weekly') {
            const dayCheckboxes = document.querySelectorAll('input[name="days"]:checked');
            const selectedDays = Array.from(dayCheckboxes).map(cb => cb.value);
            
            // If no days selected, use all days
            if (selectedDays.length === 0) {
                formData.daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            } else {
                formData.daysOfWeek = selectedDays;
            }
        }
        
        // For one-time reminders, set reminderDateTime
        if (formData.scheduleType === 'One-time' && formData.times.length > 0) {
            const time = formData.times[0].time;
            if (time && formData.startDate) {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderDate = new Date(formData.startDate);
                reminderDate.setHours(hours, minutes, 0, 0);
                
                // Ensure reminder is in the future
                const now = new Date();
                if (reminderDate < now) {
                    // If reminder time is in the past today, move to tomorrow
                    reminderDate.setDate(reminderDate.getDate() + 1);
                }
                
                formData.reminderDateTime = reminderDate;
                // Clear times array for one-time reminders
                formData.times = [];
            }
        }
        
        // Debug: Log the data being sent
        console.log('📤 Sending reminder data:', JSON.stringify(formData, null, 2));
        
        // Determine API endpoint and method
        const url = editingReminderId
            ? `${API_BASE_URL}/reminders/${editingReminderId}`
            : `${API_BASE_URL}/reminders`;
        
        const method = editingReminderId ? 'PUT' : 'POST';
        
        // Send request
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            let errorMessage = `Failed to save reminder: ${response.status}`;
            
            try {
                const errorData = await response.json();
                console.log('📥 Error response data:', errorData);
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                const errorText = await response.text();
                console.log('📥 Error response text:', errorText);
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('✅ Success response:', data);
        
        if (data.success) {
            showNotification(
                editingReminderId ? 'Reminder updated successfully' : 'Reminder created successfully',
                'success'
            );
            
            hideReminderModal();
            
            // Reload data
            currentPage = 1;
            await Promise.all([
                loadReminderStats(),
                loadReminders(),
                loadDueReminders()
            ]);
        } else {
            throw new Error(data.message || 'Failed to save reminder');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('❌ Error saving reminder:', error);
        showLoading(false);
        showNotification('Failed to save reminder: ' + error.message, 'error');
    }
}
// Test API endpoint
async function testReminderAPI() {
    try {
        console.log('🔍 Testing reminder API...');
        
        // First, check if we can access the endpoint
        const testData = {
            title: "Test Reminder",
            category: "Medication",
            scheduleType: "Daily",
            startDate: new Date().toISOString(),
            times: [{ time: "09:00", isActive: true }],
            status: "Active",
            isActive: true,
            notifications: {
                push: { enabled: true },
                email: { enabled: true },
                advanceTime: 15
            }
        };
        
        console.log('Test data:', testData);
        
        const response = await fetch(`${API_BASE_URL}/reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(testData)
        });
        
        console.log('Test response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Test error response:', errorText);
            return { success: false, error: errorText };
        }
        
        const data = await response.json();
        console.log('Test success response:', data);
        return { success: true, data: data };
        
    } catch (error) {
        console.error('Test error:', error);
        return { success: false, error: error.message };
    }
}

// Add this to debug helper
window.reminderDebug = {
    reload: () => loadRemindersPage(),
    getFilters: () => currentFilters,
    clearFilters: () => {
        currentFilters = {};
        currentPage = 1;
        loadReminders();
    },
    testAPI: testReminderAPI,
    createTestReminder: testReminderAPI
};

// Validate reminder form
// Validate reminder form with backend requirements
// Validate reminder form with backend requirements
function validateReminderForm() {
    // Check required fields
    const title = getFormValue('reminderTitle');
    const category = getFormValue('reminderCategory');
    const scheduleType = getFormValue('scheduleType');
    const startDateStr = getFormValue('startDate');
    
    if (!title.trim()) {
        showNotification('Please enter a reminder title', 'error');
        highlightField('reminderTitle');
        return false;
    }
    
    if (!category) {
        showNotification('Please select a category', 'error');
        highlightField('reminderCategory');
        return false;
    }
    
    if (!scheduleType) {
        showNotification('Please select a schedule type', 'error');
        highlightField('scheduleType');
        return false;
    }
    
    if (!startDateStr) {
        showNotification('Please select a start date', 'error');
        highlightField('startDate');
        return false;
    }
    
    // Parse start date
    const startDate = new Date(startDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is in the past (ignoring time)
    if (startDate < today) {
        showNotification('Start date cannot be in the past', 'error');
        highlightField('startDate');
        return false;
    }
    
    // Check time fields
    const times = getReminderTimes();
    if (times.length === 0) {
        showNotification('Please add at least one reminder time', 'error');
        highlightField('reminderTime1');
        return false;
    }
    
    // Validate each time format (HH:MM)
    for (const timeObj of times) {
        if (!timeObj.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeObj.time)) {
            showNotification('Please enter valid times in HH:MM format', 'error');
            return false;
        }
    }
    
    // For one-time reminders, check if time is in the past for today
    if (scheduleType === 'One-time' && startDateStr === new Date().toISOString().split('T')[0]) {
        const firstTime = times[0].time;
        if (firstTime) {
            const [hours, minutes] = firstTime.split(':').map(Number);
            const now = new Date();
            const reminderTime = new Date();
            reminderTime.setHours(hours, minutes, 0, 0);
            
            if (reminderTime < now) {
                showNotification('One-time reminder time cannot be in the past for today', 'error');
                highlightField('reminderTime1');
                return false;
            }
        }
    }
    
    // Check medication fields if category is Medication
    if (category === 'Medication') {
        const medicineName = getFormValue('medicineName');
        if (!medicineName?.trim()) {
            showNotification('Please enter medicine name for medication reminders', 'error');
            highlightField('medicineName');
            return false;
        }
    }
    
    return true;
}

// Highlight field with error
function highlightField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = '#ef4444';
        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        
        // Scroll to field
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field.focus();
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }, 3000);
    }
}

// Handle complete reminder
async function handleCompleteReminder() {
    try {
        showLoading(true);
        
        const modal = document.getElementById('completeModal');
        const reminderId = modal?.dataset.reminderId;
        
        if (!reminderId) {
            throw new Error('No reminder selected');
        }
        
        const status = getFormValue('completionStatus');
        const notes = getFormValue('completionNotes');
        
        const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                status: status,
                notes: notes
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark reminder as complete');
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Reminder marked as ' + status.toLowerCase(), 'success');
            hideCompleteModal();
            
            // Reload data
            currentPage = 1;
            await Promise.all([
                loadReminderStats(),
                loadReminders(),
                loadDueReminders()
            ]);
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error completing reminder:', error);
        showLoading(false);
        showNotification('Failed to complete reminder: ' + error.message, 'error');
    }
}

// Delete reminder
async function deleteReminder(reminderId) {
    if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete reminder');
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Reminder deleted successfully', 'success');
            
            // Remove from UI immediately
            const reminderElement = document.querySelector(`[data-id="${reminderId}"]`);
            if (reminderElement) {
                reminderElement.remove();
            }
            
            // Reload stats
            await loadReminderStats();
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showLoading(false);
        showNotification('Failed to delete reminder', 'error');
    }
}

// View reminder details (TODO)
function viewReminderDetails(reminderId) {
    console.log('View details for reminder:', reminderId);
    // TODO: Implement detailed view or modal
    showNotification('Detailed view feature coming soon!', 'info');
}

// Handle category change
function handleCategoryChange() {
    const category = getFormValue('reminderCategory');
    const medicationFields = document.getElementById('medicationFields');
    const frequencyField = document.getElementById('frequencyField');
    
    if (medicationFields) {
        medicationFields.classList.toggle('hidden', category !== 'Medication');
    }
    
    if (frequencyField) {
        frequencyField.classList.toggle('hidden', category !== 'Medication');
    }
}

// Handle schedule type change
function handleScheduleTypeChange() {
    const scheduleType = getFormValue('scheduleType');
    const daysOfWeekFields = document.getElementById('daysOfWeekFields');
    const timeFields = document.getElementById('timeFields');
    
    if (daysOfWeekFields) {
        daysOfWeekFields.classList.toggle('hidden', scheduleType !== 'Weekly');
    }
    
    if (timeFields) {
        timeFields.classList.toggle('hidden', scheduleType === 'One-time');
    }
}

// Add time field
function addTimeField(timeValue = '') {
    const container = document.getElementById('additionalTimes');
    if (!container) return;
    
    const timeId = `reminderTime${container.children.length + 2}`;
    
    const timeField = document.createElement('div');
    timeField.className = 'flex items-center space-x-2';
    timeField.innerHTML = `
        <input type="time" 
               id="${timeId}"
               value="${timeValue}"
               class="form-input w-32">
        <button type="button" class="remove-time-btn bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(timeField);
    
    // Add remove listener
    const removeBtn = timeField.querySelector('.remove-time-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            timeField.remove();
        });
    }
}

// Get reminder times from form
function getReminderTimes() {
    const times = [];
    
    // Get first time
    const time1 = getFormValue('reminderTime1');
    if (time1) {
        times.push({ time: time1, isActive: true });
    }
    
    // Get additional times
    const additionalTimeInputs = document.querySelectorAll('#additionalTimes input[type="time"]');
    additionalTimeInputs.forEach(input => {
        if (input.value) {
            times.push({ time: input.value, isActive: true });
        }
    });
    
    return times;
}

// Apply filters
function applyFilters() {
    currentFilters = {
        category: getFormValue('filterCategory'),
        status: getFormValue('filterStatus'),
        priority: getFormValue('filterPriority')
    };
    
    // Remove empty filters
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    currentPage = 1;
    loadReminders();
    hideFilterModal();
}

// Reset filters
function resetFilters() {
    currentFilters = {};
    currentPage = 1;
    
    // Reset form values
    setFormValue('filterCategory', '');
    setFormValue('filterStatus', '');
    setFormValue('filterPriority', '');
    setFormValue('filterStartDate', '');
    setFormValue('filterEndDate', '');
    
    loadReminders();
    hideFilterModal();
}

// Hide modals
function hideReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    editingReminderId = null;
}

function hideCompleteModal() {
    const modal = document.getElementById('completeModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        delete modal.dataset.reminderId;
    }
}

function hideFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Reset form fields
// Reset form fields
// Reset form fields
function resetFormFields() {
    // Clear additional times
    const additionalTimes = document.getElementById('additionalTimes');
    if (additionalTimes) additionalTimes.innerHTML = '';
    
    // Uncheck days of week
    const dayCheckboxes = document.querySelectorAll('input[name="days"]');
    dayCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Set default values
    setFormValue('reminderCategory', 'Medication');
    setFormValue('reminderPriority', 'Medium');
    setFormValue('scheduleType', 'Daily');
    setFormValue('pushNotifications', 'true');
    setFormValue('emailNotifications', 'true');
    setFormValue('advanceNotification', '15');
    
    // Set default time to 9:00 AM
    setFormValue('reminderTime1', '09:00');
    
    // Set start date to today or tomorrow based on current time
    const now = new Date();
    let startDate = new Date();
    
    // If it's past 8 PM, set start date to tomorrow
    if (now.getHours() >= 20) {
        startDate.setDate(startDate.getDate() + 1);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    setFormValue('startDate', startDateStr);
    
    // Trigger change events
    const categorySelect = document.getElementById('reminderCategory');
    const scheduleSelect = document.getElementById('scheduleType');
    
    if (categorySelect) categorySelect.dispatchEvent(new Event('change'));
    if (scheduleSelect) scheduleSelect.dispatchEvent(new Event('change'));
}
// Helper functions
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function getFormValue(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return '';
    
    if (element.type === 'checkbox') {
        return element.checked ? 'true' : 'false';
    }
    
    return element.value || '';
}

function setFormValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (element.type === 'checkbox') {
        element.checked = value === 'true' || value === true;
    } else {
        element.value = value || '';
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

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
        loadingOverlay.classList.toggle('flex', show);
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

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
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

// Debug helper
window.reminderDebug = {
    reload: () => loadRemindersPage(),
    getFilters: () => currentFilters,
    clearFilters: () => {
        currentFilters = {};
        currentPage = 1;
        loadReminders();
    },
    testAPI: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/reminders/stats`, {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('API Test:', data);
            return data;
        } catch (error) {
            console.error('API Test Error:', error);
            return { error: error.message };
        }
    }
};

console.log('✅ Medical Reminders script loaded');