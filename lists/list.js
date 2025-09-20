/**
 * Vehicle Registrations List Manager - Fixed for your data structure
 * @version 2.3.0
 */

// Import Firebase functions
import { db } from '../firebase/firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

class VehicleRegistrationsList {
    constructor() {
        this.allRegistrations = [];
        this.filteredRegistrations = [];
        this.collectionName = 'vehicleRegistrations'; // Use your actual collection name
        this.filters = {
            global: '',
            ownerName: '',
            regNumber: '',
            vehicleType: '',
            status: '',
            expiringDate: ''  // Add this new filter
        };
        
        setTimeout(() => this.init(), 100);
    }

    async init() {
        console.log('🚀 Initializing Vehicle Registrations List... - list.js:28');
        
        try {
            await this.fetchRegistrations();
            this.setupEventListeners();
            this.renderTable();
            this.showNotification('Data loaded successfully!', 'success');
        } catch (error) {
            console.error('❌ Initialization failed: - list.js:36', error);
            this.showError(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Fetch registrations from vehicleRegistrations collection
     */
    async fetchRegistrations() {
        const tbody = document.getElementById('registrationsTableBody');
        
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">
                    <i class="ri-loader-4-line"></i>
                    <p>Loading registrations...</p>
                </td>
            </tr>
        `;
    
        try {
            console.log('📡 Fetching data from vehicleRegistrations collection... - list.js:57');
            
            const dataCollection = collection(db, 'vehicleRegistrations');
            
            // Try ordering by expiringDate ascending (soonest expiry first)
            let querySnapshot;
            let sortMethod = 'client-side';
            
            try {
                console.log('📊 Trying to order by expiringDate (asc)  soonest expiry first... - list.js:66');
                const q = query(dataCollection, orderBy("expiringDate", "asc"));
                querySnapshot = await getDocs(q);
                sortMethod = 'firestore-orderBy';
                console.log('✅ Firestore orderBy expiringDate (asc) successful - list.js:70');
            } catch (orderError) {
                console.warn('⚠️ Firestore orderBy failed, trying submittedAt: - list.js:72', orderError.message);
                
                // Fallback to submittedAt ordering
                try {
                    const q = query(dataCollection, orderBy("submittedAt", "desc"));
                    querySnapshot = await getDocs(q);
                    sortMethod = 'firestore-submittedAt';
                    console.log('✅ Firestore orderBy submittedAt successful - list.js:79');
                } catch (submittedError) {
                    console.warn('⚠️ All Firestore ordering failed, using simple query: - list.js:81', submittedError.message);
                    // Final fallback - simple query without ordering
                    querySnapshot = await getDocs(dataCollection);
                    sortMethod = 'client-side';
                    console.log('✅ Simple query executed, will sort on clientside - list.js:85');
                }
            }
            
            console.log('📊 Query results: - list.js:89', {
                size: querySnapshot.size,
                empty: querySnapshot.empty,
                sortMethod: sortMethod
            });
            
            if (querySnapshot.empty) {
                console.log('📭 No documents found - list.js:96');
                this.showNoDataMessage();
                return;
            }
            
            // Process all documents
            this.allRegistrations = [];
            let docCount = 0;
            
            querySnapshot.forEach((doc) => {
                docCount++;
                const docData = { id: doc.id, ...doc.data() };
                this.allRegistrations.push(docData);
            });
            
            // Client-side sorting if Firestore ordering failed or we need to ensure proper sorting
            if (sortMethod === 'client-side' || sortMethod === 'firestore-submittedAt') {
                console.log('📊 Applying clientside sorting by expiringDate (ascending  soonest first)... - list.js:113');
                
                this.allRegistrations.sort((a, b) => {
                    // Handle missing or invalid expiring dates
                    const dateA = a.expiringDate ? new Date(a.expiringDate) : new Date('2099-12-31'); // Future date for missing
                    const dateB = b.expiringDate ? new Date(b.expiringDate) : new Date('2099-12-31');
                    
                    // Check for invalid dates
                    const validDateA = !isNaN(dateA.getTime()) ? dateA : new Date('2099-12-31');
                    const validDateB = !isNaN(dateB.getTime()) ? dateB : new Date('2099-12-31');
                    
                    // Sort ASCENDING (soonest expiry dates first)
                    return validDateA - validDateB;
                });
                
                console.log('✅ Clientside sorting completed  soonest expiry dates first - list.js:128');
            }
            
            this.filteredRegistrations = [...this.allRegistrations];
            
            console.log(`✅ Successfully loaded ${this.allRegistrations.length} registrations - list.js:133`);
            console.log('📋 First few registrations (sorted by expiringDate  soonest first): - list.js:134', 
                this.allRegistrations.slice(0, 5).map(reg => ({
                    id: reg.id.slice(-8),
                    ownerName: reg.ownerName,
                    expiringDate: reg.expiringDate,
                    registrationNumber: reg.registrationNumber,
                    daysUntilExpiry: this.calculateDaysUntilExpiry(reg.expiringDate)
                }))
            );
            
            // Add visual urgency indicators
            this.addExpiryUrgencyData();
            
            // Log sorting verification
            if (this.allRegistrations.length > 1) {
                const firstExpiry = new Date(this.allRegistrations[0].expiringDate || '2099-12-31');
                const lastExpiry = new Date(this.allRegistrations[this.allRegistrations.length - 1].expiringDate || '2099-12-31');
                console.log('📅 Sorting verification: - list.js:151', {
                    firstExpiryDate: this.allRegistrations[0].expiringDate,
                    lastExpiryDate: this.allRegistrations[this.allRegistrations.length - 1].expiringDate,
                    isCorrectlyOrdered: firstExpiry <= lastExpiry,
                    firstExpiryDaysLeft: this.calculateDaysUntilExpiry(this.allRegistrations[0].expiringDate)
                });
            }
            
        } catch (error) {
            console.error("❌ Fetch error: - list.js:160", error);
            this.handleFetchError(error);
        }
    }


    /**
 * Calculate days until expiry
 */
calculateDaysUntilExpiry(expiringDate) {
    if (!expiringDate) return 'N/A';
    
    try {
        const today = new Date();
        const expiry = new Date(expiringDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Expired ${Math.abs(diffDays)} days ago`;
        } else if (diffDays === 0) {
            return 'Expires today';
        } else if (diffDays === 1) {
            return 'Expires tomorrow';
        } else {
            return `${diffDays} days left`;
        }
    } catch (error) {
        return 'Invalid date';
    }
}

/**
 * Add urgency data to registrations for visual indicators
 */
addExpiryUrgencyData() {
    this.allRegistrations.forEach(reg => {
        if (!reg.expiringDate) {
            reg.urgencyLevel = 'unknown';
            return;
        }
        
        const today = new Date();
        const expiry = new Date(reg.expiringDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            reg.urgencyLevel = 'expired';
        } else if (diffDays <= 7) {
            reg.urgencyLevel = 'critical';
        } else if (diffDays <= 30) {
            reg.urgencyLevel = 'warning';
        } else {
            reg.urgencyLevel = 'normal';
        }
        
        reg.daysUntilExpiry = diffDays;
    });
}

    
    

    /**
     * Handle fetch errors
     */
    handleFetchError(error) {
        let errorMessage = 'Failed to load registrations';
        
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check Firestore security rules.';
            console.log('🔐 Required security rule: - list.js:232');
            console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehicleRegistrations/{document} {
      allow read, write: if true;
    }
  }
}
            `);
        } else {
            errorMessage = `Database error: ${error.message}`;
        }
        
        this.showError(errorMessage);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('🎯 Setting up event listeners... - list.js:254');

        // Global search
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.filters.global = e.target.value.toLowerCase().trim();
            console.log('🔍 Global search: - list.js:259', this.filters.global);
            this.applyFilters();
        });

        // Owner name filter
        document.getElementById('ownerNameFilter')?.addEventListener('input', (e) => {
            this.filters.ownerName = e.target.value.toLowerCase().trim();
            this.applyFilters();
        });

        // Registration number filter
        document.getElementById('regNumberFilter')?.addEventListener('input', (e) => {
            this.filters.regNumber = e.target.value.toLowerCase().trim();
            this.applyFilters();
        });

        // Vehicle type filter
        document.getElementById('vehicleTypeFilter')?.addEventListener('change', (e) => {
            this.filters.vehicleType = e.target.value;
            this.applyFilters();
        });

        // Status filter (note: your data might not have status field)
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

     

        // Action buttons
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshData());
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearAllFilters());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportToCSV());

        console.log('✅ Event listeners setup complete - list.js:294');
    }

    /**
     * Apply filters to the data
     */
    /**
 * Apply filters with custom filter support
 */
applyFilters() {
    const startCount = this.allRegistrations.length;
    console.log('🔄 Applying filters to - list.js:305', startCount, 'registrations');
    console.log('🔄 Current filters: - list.js:306', this.filters);
    
    this.filteredRegistrations = this.allRegistrations.filter(registration => {
        // Handle custom filters first
        if (this.customFilter) {
            switch (this.customFilter) {
                case 'expiring-soon':
                    const today = new Date();
                    const expiryDate = new Date(registration.expiringDate);
                    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    if (daysUntilExpiry > 30 || daysUntilExpiry < 0) {
                        return false; // Show only vehicles expiring within 30 days
                    }
                    break;
                    
                case 'expired':
                    const todayForExpired = new Date();
                    const expiryForExpired = new Date(registration.expiringDate);
                    if (expiryForExpired >= todayForExpired) {
                        return false; // Show only expired vehicles
                    }
                    break;
            }
        }
        
        // Global search across all fields
        if (this.filters.global) {
            const searchText = this.filters.global;
            const searchableText = [
                registration.id || '',
                registration.ownerName || '',
                registration.ownerEmail || '',
                // registration.email || '',
                registration.phone || '',
                registration.ownerPhone || '',
                registration.vehicleType || '',
                registration.registrationNumber || '',
                registration.testingDate || '',
                registration.expiringDate || '',
                registration.submittedAt || '',
                registration.userToken || '',
                registration.expiringDate || '',

            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchText)) {
                return false;
            }
        }

        // Owner name filter
        if (this.filters.ownerName && 
            !(registration.ownerName || '').toLowerCase().includes(this.filters.ownerName)) {
            return false;
        }

        // Registration number filter
        if (this.filters.regNumber && 
            !(registration.registrationNumber || '').toLowerCase().includes(this.filters.regNumber)) {
            return false;
        }

        // Vehicle type filter
        if (this.filters.vehicleType && registration.vehicleType !== this.filters.vehicleType) {
            return false;
        }

        // Status filter
        if (this.filters.status && (registration.status || 'pending') !== this.filters.status) {
            return false;
        }


        if (this.filters.expiringDate) {
            if (!registration.expiringDate) {
                return false; // Skip records without expiring date
            }
            
            // Convert both dates to YYYY-MM-DD format for comparison
            const registrationExpiryDate = new Date(registration.expiringDate).toISOString().split('T')[0];
            const filterDate = this.filters.expiringDate;
            
            console.log('📅 Comparing dates:  Untitled1:68 - list.js:388', {
                registrationExpiry: registrationExpiryDate,
                filterDate: filterDate,
                owner: registration.ownerName,
                regNumber: registration.registrationNumber
            });
            
            if (registrationExpiryDate !== filterDate) {
                return false;
            }
            
            console.log('✅ Vehicle expiring today found:  Untitled1:79 - list.js:399', {
                owner: registration.ownerName,
                regNumber: registration.registrationNumber,
                expiringDate: registration.expiringDate
            });
        }

       

        return true;
    });

    // Clear custom filter after applying
    this.customFilter = null;

    console.log(`📊 Filter results: ${startCount} → ${this.filteredRegistrations.length} - list.js:414`);
    this.renderTable();
}


    /**
     * Render the table with your actual data structure
     */
   /**
 * Render table with urgency indicators
 */
renderTable() {
    console.log('🎨 Rendering table with - list.js:426', this.filteredRegistrations.length, 'filtered registrations');
    
    const tbody = document.getElementById('registrationsTableBody');
    const totalCount = document.getElementById('totalCount');
    const visibleCount = document.getElementById('visibleCount');

    if (!tbody) {
        console.error('❌ Table body element not found - list.js:433');
        return;
    }

    // Update counts
    if (totalCount) totalCount.textContent = this.allRegistrations.length;
    if (visibleCount) visibleCount.textContent = this.filteredRegistrations.length;

    // Handle empty states
    if (this.allRegistrations.length === 0) {
        this.showNoDataMessage();
        return;
    }

    if (this.filteredRegistrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-results">
                    <i class="ri-search-line"></i>
                    <p>No matches found for your search</p>
                    <button class="btn btn-secondary btn-sm" onclick="window.registrationsList.clearAllFilters()">
                        Clear Filters
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    // Render data rows with urgency indicators
    tbody.innerHTML = this.filteredRegistrations.map((reg, index) => {
        const urgencyClass = reg.urgencyLevel || 'normal';
        const daysText = this.calculateDaysUntilExpiry(reg.expiringDate);
        
        return `
            <tr data-id="${reg.id}" class="urgency-${urgencyClass}" style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                <td><span class="registration-id">${reg.id.slice(-8)}</span></td>
                <td><strong>${reg.ownerName || 'N/A'}</strong></td>
                <td>${reg.phone  || 'N/A'}</td>
                <td>${reg.email  || 'N/A'}</td>

                <td><span class="vehicle-type-badge">${this.formatVehicleType(reg.vehicleType)}</span></td>
                <td><strong>${reg.registrationNumber || 'N/A'}</strong></td>
                <td>${this.formatDate(reg.testingDate)}</td>
                <td class="expiry-cell">
                    <div class="expiry-date">${this.formatDate(reg.expiringDate)}</div>
                    <div class="expiry-urgency urgency-${urgencyClass}">${daysText}</div>
                </td>
                <td><span class="status-badge status-${reg.status || 'pending'}">${(reg.status || 'pending').toUpperCase()}</span></td>
                <td>${this.formatDateTime(reg.createdAt || reg.submittedAt)}</td>
            </tr>
        `;
    }).join('');

    console.log('✅ Table rendered successfully with urgency indicators - list.js:487');
}


    // Helper methods
    formatVehicleType(type) {
        const types = {
            '2-wheeler': '2W',
            '3-wheeler': '3W',
            '4-wheeler': '4W',
            'heavy-vehicle': 'HV'
        };
        return types[type] || type || 'N/A';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN');
        } catch (error) {
            return dateString;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            // Handle the format from your data: "2025-09-20T09:39:10.091Z"
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    async refreshData() {
        console.log('🔄 Refreshing data... - list.js:528');
        const refreshBtn = document.getElementById('refreshBtn');
        if (!refreshBtn) return;
        
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Refreshing...';
        refreshBtn.disabled = true;

        try {
            await this.fetchRegistrations();
            this.applyFilters();
            this.showNotification('Data refreshed!', 'success');
        } catch (error) {
            this.showNotification('Refresh failed', 'error');
        } finally {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    clearAllFilters() {
        console.log('🧹 Clearing all filters... - list.js:549');
        
        // Safe element clearing with null checks
        const elementIds = ['globalSearch', 'ownerNameFilter', 'regNumberFilter', 'vehicleTypeFilter', 'statusFilter'];
        
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
    
        // Reset filters object
        this.filters = {
            global: '',
            ownerName: '',
            regNumber: '',
            vehicleType: '',
            status: '',
            expiringDate: ''  // Add this
        };
    
        this.applyFilters();
        this.showNotification('Filters cleared', 'info');
    }
    

    exportToCSV() {
        if (this.filteredRegistrations.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }

        const headers = ['ID', 'Owner', 'Vehicle Type', 'Reg Number', 'Testing Date', 'Expiry Date', 'Submitted'];
        const csvData = [
            headers.join(','),
            ...this.filteredRegistrations.map(reg => [
                reg.id,
                reg.ownerName || '',
                reg.vehicleType || '',
                reg.registrationNumber || '',
                reg.testingDate || '',
                reg.expiringDate || '',
                reg.submittedAt || ''
            ].map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehicle-registrations-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`Exported ${this.filteredRegistrations.length} records`, 'success');
    }

    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message} - list.js:610`);
        
        const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db', warning: '#f39c12' };
        const notification = document.createElement('div');
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            padding: 12px 20px; border-radius: 8px; color: white;
            background: ${colors[type]}; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease; font-weight: 500;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    showError(message) {
        console.error('💥 Error: - list.js:628', message);
        const tbody = document.getElementById('registrationsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-results" style="color: var(--danger-color);">
                    <i class="ri-error-warning-line"></i>
                    <p>${message}</p>
                    <button class="btn btn-primary btn-sm" onclick="window.location.reload()" style="margin-top: 12px;">
                        <i class="ri-refresh-line"></i> Reload
                    </button>
                </td>
            </tr>
        `;
    }

    showNoDataMessage() {
        console.log('📭 Showing no data message - list.js:646');
        const tbody = document.getElementById('registrationsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-results">
                    <i class="ri-database-line"></i>
                    <p>No vehicle registrations found</p>
                    <div style="margin-top: 16px;">
                        <button class="btn btn-primary" onclick="window.location.href='../register/register.html'">
                            <i class="ri-add-line"></i> Add Registration
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Add required CSS animations and initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, starting application... - list.js:668');
    
    // Add required CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the app
    setTimeout(() => {
        window.registrationsList = new VehicleRegistrationsList();
    }, 200);
});
