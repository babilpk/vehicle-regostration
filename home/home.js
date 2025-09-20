/**
 * Vehicle Registration Dashboard - Firebase Data Integration with Mobile Menu
 * @version 3.1.0
 */

// Import Firebase functions
import { db } from '../firebase/firebase-config.js';
import { collection, getDocs, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

class HomePage {
    constructor() {
        this.registrations = [];
        this.stats = {
            total: 0,
            pending: 0,
            thisMonth: 0
        };
        this.init();
    }

    /**
     * Initialize the homepage
     */
    async init() {
        console.log('🚀 Initializing Vehicle Registration Dashboard... - home.js:25');
        
        try {
            this.setupEventListeners();
            await this.loadFirebaseData();
            this.updateStatistics();
            this.loadRecentActivity();
            this.animateStats();
            
            console.log('✅ Dashboard initialized successfully - home.js:34');
        } catch (error) {
            console.error('❌ Dashboard initialization failed: - home.js:36', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    /**
     * Load all data from Firebase
     */
    async loadFirebaseData() {
        try {
            console.log('📡 Loading data from Firebase... - home.js:46');
            
            // Load all registrations
            const querySnapshot = await getDocs(collection(db, 'vehicleRegistrations'));
            
            this.registrations = [];
            querySnapshot.forEach((doc) => {
                this.registrations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`📊 Loaded ${this.registrations.length} registrations: - home.js:59`, this.registrations);
            
        } catch (error) {
            console.error('❌ Error loading Firebase data: - home.js:62', error);
            throw error;
        }
    }

    /**
     * Update statistics based on real data
     */
    updateStatistics() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate statistics from actual data
        this.stats.total = this.registrations.length;
        
        this.stats.pending = this.registrations.filter(reg => 
            (reg.status || 'pending') === 'pending'
        ).length;

        this.stats.thisMonth = this.registrations.filter(reg => {
            if (!reg.submittedAt && !reg.createdAt) return false;
            
            const submissionDate = new Date(reg.submittedAt || reg.createdAt);
            return submissionDate.getMonth() === currentMonth && 
                   submissionDate.getFullYear() === currentYear;
        }).length;

        console.log('📊 Updated statistics: - home.js:90', this.stats);
    }

    /**
     * Load recent activity from real data
     */
    loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        // Sort registrations by submission date (most recent first)
        const recentRegistrations = [...this.registrations]
            .sort((a, b) => {
                const dateA = new Date(a.submittedAt || a.createdAt || 0);
                const dateB = new Date(b.submittedAt || b.createdAt || 0);
                return dateB - dateA;
            })
            .slice(0, 5); // Get last 5 registrations

        if (recentRegistrations.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="ri-information-line"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">No registrations yet</div>
                        <div class="activity-time">Start by adding your first vehicle registration</div>
                    </div>
                    <div class="activity-status status-pending">Getting Started</div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = recentRegistrations.map(reg => {
            const submissionDate = new Date(reg.submittedAt || reg.createdAt);
            const timeAgo = this.getTimeAgo(submissionDate);
            const status = reg.status || 'pending';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="ri-car-line"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">
                            ${reg.ownerName || 'Unknown'} registered ${reg.vehicleType || 'vehicle'}
                        </div>
                        <div class="activity-time">${timeAgo}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                            Registration: ${reg.registrationNumber || 'N/A'} • Email: ${reg.email || reg.ownerEmail || 'N/A'}
                        </div>
                    </div>
                    <div class="activity-status status-${status}">${status.toUpperCase()}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Calculate time ago from date
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    /**
     * Animate statistics counters with real data
     */
    animateStats() {
        const animateCounter = (element, target, duration = 2000) => {
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current);
            }, 16);
        };

        // Animate each statistic
        const totalElement = document.getElementById('totalRegistrations');
        const pendingElement = document.getElementById('pendingRegistrations');
        const monthElement = document.getElementById('thisMonthRegistrations');

        if (totalElement) animateCounter(totalElement, this.stats.total);
        if (pendingElement) animateCounter(pendingElement, this.stats.pending);
        if (monthElement) animateCounter(monthElement, this.stats.thisMonth);
    }

    /**
     * Setup event listeners including mobile menu
     */
    setupEventListeners() {
        // Navigation actions
        window.openRegistration = () => {
            this.showNotification('Opening vehicle registration...', 'info');
            setTimeout(() => {
                window.location.href = '../register/register.html';
            }, 500);
        };

        window.viewList = () => {
            this.showNotification('Loading registrations list...', 'info');
            setTimeout(() => {
                window.location.href = '../lists/list.html';
            }, 500);
        };

        window.openAnalytics = () => {
            this.showNotification('Analytics dashboard coming soon!', 'info');
        };

        // Desktop User Menu Toggle
        window.toggleUserMenu = () => {
            const userDropdown = document.querySelector('.desktop-user-menu');
            if (userDropdown) {
                userDropdown.classList.toggle('active');
            }
        };

        // Mobile Menu Toggle Function
        window.toggleMobileMenu = () => {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const navMenu = document.getElementById('navMenu');
            
            if (mobileMenuBtn && navMenu) {
                mobileMenuBtn.classList.toggle('active');
                navMenu.classList.toggle('active');
                
                // Prevent body scroll when menu is open
                if (navMenu.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        };

        // Logout function
        window.logout = () => {
            if (confirm('Are you sure you want to logout?')) {
                this.showNotification('Logging out...', 'info');
                setTimeout(() => {
                    // Clear any stored data
                    localStorage.clear();
                    sessionStorage.clear();
                    // Redirect to login or home
                    window.location.href = '../auth/auth.html';
                }, 100);
            }
        };

        // Mobile Menu Event Listeners
        document.addEventListener('DOMContentLoaded', () => {
            const navLinks = document.querySelectorAll('.nav-link');
            const navMenu = document.getElementById('navMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            
            // Close mobile menu when clicking on nav links
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        navMenu?.classList.remove('active');
                        mobileMenuBtn?.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            });
            
            // Close mobile menu on window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    navMenu?.classList.remove('active');
                    mobileMenuBtn?.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            // Close desktop dropdown
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }

            // Close mobile menu when clicking outside
            const isClickInsideNav = e.target.closest('.nav-container');
            const navMenu = document.getElementById('navMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            
            if (!isClickInsideNav && navMenu?.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuBtn?.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Refresh data periodically (every 5 minutes)
        setInterval(async () => {
            try {
                await this.loadFirebaseData();
                this.updateStatistics();
                this.loadRecentActivity();
                console.log('🔄 Dashboard data refreshed automatically - home.js:323');
            } catch (error) {
                console.error('❌ Autorefresh failed: - home.js:325', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#667eea'
        };

        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 24px;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 2000;
            background: ${colors[type]};
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Auto-remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const homePage = new HomePage();
        window.homePage = homePage; // Make available globally for debugging
    } catch (error) {
        console.error('❌ Error initializing dashboard: - home.js:398', error);
    }
});
