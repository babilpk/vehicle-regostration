/**
 * Vehicle Registration Form Handler
 * Modern JavaScript with comprehensive validation
 * @author Your Name
 * @version 1.0.0
 */
import { db } from '../firebase/firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js"; 



class VehicleRegistrationForm {
    constructor() {

        this.form = document.getElementById('registrationForm');
        this.submitBtn = document.getElementById('submitBtn');
        
        // Form fields
        this.ownerName = document.getElementById('ownerName');
        this.vehicleTypeInputs = document.querySelectorAll('input[name="vehicleType"]');
        this.registrationNumber = document.getElementById('registrationNumber');
        this.testingDate = document.getElementById('testingDate');
        this.expiringDate = document.getElementById('expiringDate');
        this.email = document.getElementById('ownerEmail');
        this.phone = document.getElementById('ownerPhone');

        this.init();
    }

    /**
     * Initialize the form
     */
    init() {
        this.setupDateRestrictions();
        this.attachEventListeners();
        this.checkAuthStatus();
    }

    /**
     * Check if user is authenticated
     */
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.showNotification('Please login to access registration', 'error');
            setTimeout(() => {
                window.location.href = '../auth/login.html';
            }, 100);
        }
    }

    /**
     * Setup date field restrictions
     */
    setupDateRestrictions() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Set minimum date to today for both fields
        this.testingDate.min = todayString;
        this.expiringDate.min = todayString;
        
        // Set maximum date to 5 years from now
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5);
        const maxDateString = maxDate.toISOString().split('T')[0];
        
        this.testingDate.max = maxDateString;
        this.expiringDate.max = maxDateString;
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.ownerName.addEventListener('blur', () => this.validateOwnerName());
        this.ownerName.addEventListener('input', () => this.clearFieldError('ownerName'));
        
        this.vehicleTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.validateVehicleType());
        });
        
        this.registrationNumber.addEventListener('blur', () => this.validateRegistrationNumber());
        this.registrationNumber.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.clearFieldError('registrationNumber');
        });
        
        this.testingDate.addEventListener('change', () => this.validateTestingDate());
        this.expiringDate.addEventListener('change', () => this.validateExpiringDate());
        
        // Date dependency validation
        this.testingDate.addEventListener('change', () => this.validateDateRelationship());
        this.expiringDate.addEventListener('change', () => this.validateDateRelationship());


         // Email validation
    this.email.addEventListener('blur', () => this.validateEmail());
    this.email.addEventListener('input', () => this.clearFieldError('ownerEmail'));
    
    // Phone validation with formatting
    this.phone.addEventListener('blur', () => this.validatePhone());
    this.phone.addEventListener('input', (e) => {
        this.clearFieldError('ownerPhone');
        this.formatPhoneNumber(e);
    });
        
        // Enhanced UX features
        this.addInputAnimations();
        this.addKeyboardNavigation();
    }


    /**
 * Format phone number as user types
 */
formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = '';
    
    if (value.length === 0) {
        formattedValue = '';
    } else if (value.length <= 5) {
        formattedValue = value;
    } else if (value.length <= 10) {
        // Format as: 98765 43210
        formattedValue = value.substring(0, 5) + ' ' + value.substring(5);
    } else if (value.length <= 12 && value.startsWith('91')) {
        // Format as: +91 98765 43210
        formattedValue = '+91 ' + value.substring(2, 7) + ' ' + value.substring(7);
    } else {
        // Keep original formatting for international numbers
        formattedValue = event.target.value;
    }
    
    event.target.value = formattedValue;
}


    
    validateAllFields() {
        const validations = [
            this.validateOwnerName(),
            this.validateEmail(),           // Add email validation
            this.validatePhone(),           // Add phone validation
            this.validateVehicleType(),
            this.validateRegistrationNumber(),
            this.validateTestingDate(),
            this.validateExpiringDate(),
            this.validateDateRelationship()
        ];
        
        return validations.every(result => result === true);
    }

    /**
 * Validate email address
 */
validateEmail() {
    const email = this.email.value.trim();
    
    if (!email) {
        this.showFieldError('ownerEmail', 'Email address is required');
        return false;
    }
    
    if (email.length > 254) {
        this.showFieldError('ownerEmail', 'Email address is too long');
        return false;
    }
    
    // Comprehensive email regex pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
        this.showFieldError('ownerEmail', 'Please enter a valid email address');
        return false;
    }
    
    // Check for common typos in domain names
    const commonDomainTypos = {
        'gmail.co': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'yahoo.co': 'yahoo.com',
        'hotmai.com': 'hotmail.com',
        'outlok.com': 'outlook.com'
    };
    
    const domain = email.split('@')[1];
    if (commonDomainTypos[domain]) {
        this.showFieldError('ownerEmail', `Did you mean ${email.replace(domain, commonDomainTypos[domain])}?`);
        return false;
    }
    
    this.clearFieldError('ownerEmail');
    return true;
}


/**
 * Validate phone number
 */
validatePhone() {
    const phone = this.phone.value.trim();
    
    if (!phone) {
        this.showFieldError('ownerPhone', 'Phone number is required');
        return false;
    }
    
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
        this.showFieldError('ownerPhone', 'Phone number is too short');
        return false;
    }
    
    if (cleanPhone.length > 15) {
        this.showFieldError('ownerPhone', 'Phone number is too long');
        return false;
    }
    
    // Indian phone number patterns
    const indianPatterns = [
        /^[6789]\d{9}$/,           // 10 digit starting with 6,7,8,9
        /^0[6789]\d{9}$/,          // 11 digit starting with 0
        /^91[6789]\d{9}$/,         // 12 digit starting with 91
        /^(\+91)?[6789]\d{9}$/     // With or without +91
    ];
    
    let isValidIndianNumber = false;
    for (const pattern of indianPatterns) {
        if (pattern.test(cleanPhone) || pattern.test(phone)) {
            isValidIndianNumber = true;
            break;
        }
    }
    
    if (!isValidIndianNumber) {
        this.showFieldError('ownerPhone', 'Please enter a valid Indian phone number');
        return false;
    }
    
    // Check for invalid patterns
    const invalidPatterns = [
        /^0{10}$/,          // All zeros
        /^1{10}$/,          // All ones  
        /^(\d)\1{9}$/,      // Same digit repeated
        /^1234567890$/,     // Sequential numbers
        /^0987654321$/      // Reverse sequential
    ];
    
    for (const pattern of invalidPatterns) {
        if (pattern.test(cleanPhone)) {
            this.showFieldError('ownerPhone', 'Please enter a valid phone number');
            return false;
        }
    }
    
    this.clearFieldError('ownerPhone');
    return true;
}


    

    /**
     * Validate owner name
     */
    validateOwnerName() {
        const name = this.ownerName.value.trim();
        
        if (!name) {
            this.showFieldError('ownerName', 'Owner name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showFieldError('ownerName', 'Name must be at least 2 characters');
            return false;
        }
        
        if (!/^[a-zA-Z\s.]+$/.test(name)) {
            this.showFieldError('ownerName', 'Name can only contain letters, spaces, and dots');
            return false;
        }
        
        this.clearFieldError('ownerName');
        return true;
    }

    /**
     * Validate vehicle type selection
     */
    validateVehicleType() {
        const selectedType = document.querySelector('input[name="vehicleType"]:checked');
        
        if (!selectedType) {
            this.showFieldError('vehicleType', 'Please select a vehicle type');
            return false;
        }
        
        this.clearFieldError('vehicleType');
        return true;
    }

    /**
     * Validate registration number
     */
    validateRegistrationNumber() {
        const regNumber = this.registrationNumber.value.trim().toUpperCase();
        
        if (!regNumber) {
            this.showFieldError('registrationNumber', 'Registration number is required');
            return false;
        }
        
        // Indian vehicle registration number pattern
        const pattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        
        if (!pattern.test(regNumber)) {
            this.showFieldError('registrationNumber', 'Invalid format. Use: MH12AB1234');
            return false;
        }
        
        this.clearFieldError('registrationNumber');
        return true;
    }

    /**
     * Validate testing date
     */
    validateTestingDate() {
        const testingDate = this.testingDate.value;
        
        if (!testingDate) {
            this.showFieldError('testingDate', 'Testing date is required');
            return false;
        }
        
        const selectedDate = new Date(testingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showFieldError('testingDate', 'Testing date cannot be in the past');
            return false;
        }
        
        this.clearFieldError('testingDate');
        return true;
    }

    /**
     * Validate expiring date
     */
    validateExpiringDate() {
        const expiringDate = this.expiringDate.value;
        
        if (!expiringDate) {
            this.showFieldError('expiringDate', 'Expiring date is required');
            return false;
        }
        
        const selectedDate = new Date(expiringDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showFieldError('expiringDate', 'Expiring date cannot be in the past');
            return false;
        }
        
        this.clearFieldError('expiringDate');
        return true;
    }

    /**
     * Validate date relationship
     */
    validateDateRelationship() {
        const testingDate = this.testingDate.value;
        const expiringDate = this.expiringDate.value;
        
        if (!testingDate || !expiringDate) {
            return true; // Skip if either date is missing
        }
        
        const testDate = new Date(testingDate);
        const expDate = new Date(expiringDate);
        
        if (expDate <= testDate) {
            this.showFieldError('expiringDate', 'Expiring date must be after testing date');
            return false;
        }
        
        // Check if expiring date is reasonable (not too far in future)
        const maxExpiry = new Date(testDate);
        maxExpiry.setFullYear(maxExpiry.getFullYear() + 3); // Max 3 years validity
        
        if (expDate > maxExpiry) {
            this.showFieldError('expiringDate', 'Expiring date seems too far in the future');
            return false;
        }
        
        this.clearFieldError('expiringDate');
        return true;
    }

    /**
     * Show field-specific error
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName) || 
                           document.querySelector(`input[name="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.innerHTML = `<i class="ri-error-warning-line"></i> ${message}`;
        }
        
        if (inputElement) {
            inputElement.classList.add('error');
        } else if (fieldName === 'vehicleType') {
            // Handle vehicle type validation display
            const vehicleOptions = document.querySelector('.vehicle-options');
            vehicleOptions.style.borderColor = 'var(--danger-color)';
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName) || 
                           document.querySelector(`input[name="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.innerHTML = '';
        }
        
        if (inputElement) {
            inputElement.classList.remove('error');
        } else if (fieldName === 'vehicleType') {
            const vehicleOptions = document.querySelector('.vehicle-options');
            vehicleOptions.style.borderColor = '';
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const selectedVehicleType = document.querySelector('input[name="vehicleType"]:checked');
        
        return {
            ownerName: this.ownerName.value.trim(),
            vehicleType: selectedVehicleType ? selectedVehicleType.value : '',
            registrationNumber: this.registrationNumber.value.trim().toUpperCase(),
            testingDate: this.testingDate.value,
            expiringDate: this.expiringDate.value,
            submittedAt: new Date().toISOString(),
            userToken: localStorage.getItem('authToken'),
            email: this.email.value.trim().toLowerCase(),
            phone: this.phone.value.trim(),
        };
    }

    /**
     * Submit registration (simulate API call)
     */
    /**
 * Submit registration (save to Firebase Firestore)
 */
async submitRegistration(formData) {
    try {
        const docRef = await addDoc(collection(db, "vehicleRegistrations"), formData);

        return {
            success: true,
            registrationId: docRef.id,
            message: "Vehicle registered successfully!",
            data: formData
        };
    } catch (error) {
        console.error("Firebase Error: - register.js:493", error);
        return {
            success: false,
            message: "Failed to save to Firebase"
        };
    }
}


    /**
     * Handle successful registration
     */
    handleSuccessfulRegistration(result) {
        // Store registration data
        localStorage.setItem('lastRegistration', JSON.stringify(result));
        
        // Show success animation
        this.form.classList.add('success-animation');
        
        // Show success notification
        this.showNotification(
            `Registration successful! ID: ${result.registrationId}`, 
            'success'
        );
        
        // Redirect to home after delay
        setTimeout(() => {
            sessionStorage.setItem('registrationMessage', 'Vehicle registered successfully!');
            window.location.href = '../home/home.html';
        }, 100);
    }

    /**
     * Handle registration error
     */
    handleRegistrationError(message) {
        this.showNotification(message || 'Registration failed. Please try again.', 'error');
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        if (isLoading) {
            this.submitBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite; margin-right: 8px;"></i>Processing...';
            this.submitBtn.disabled = true;
            this.form.style.pointerEvents = 'none';
            this.form.style.opacity = '0.7';
        } else {
            this.submitBtn.innerHTML = '<i class="ri-send-plane-line" style="margin-right: 8px;"></i>Register Vehicle';
            this.submitBtn.disabled = false;
            this.form.style.pointerEvents = 'auto';
            this.form.style.opacity = '1';
        }
    }

    /**
     * Show notification
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
        notification.innerHTML = `
            <i class="ri-${type === 'success' ? 'checkbox-circle' : type === 'error' ? 'error-warning' : 'information'}-line"></i>
            <span>${message}</span>
        `;
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#667eea'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            background: ${colors[type]};
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after delay
        const duration = type === 'success' ? 5000 : 4000;
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Add input animations
     */
    addInputAnimations() {
        const inputs = document.querySelectorAll('.form-input');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.style.transform = 'scale(1.01)';
                input.parentElement.style.transition = 'transform 0.3s ease';
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Add keyboard navigation
     */
    addKeyboardNavigation() {
        // Tab navigation enhancement
        const focusableElements = this.form.querySelectorAll(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach((element, index) => {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && element.type !== 'submit') {
                    e.preventDefault();
                    const nextElement = focusableElements[index + 1];
                    if (nextElement) {
                        nextElement.focus();
                    }
                }
            });
        });
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Utility functions
const RegistrationUtils = {
    /**
     * Format registration number
     */
    formatRegistrationNumber(regNumber) {
        return regNumber.replace(/(.{2})(.{2})(.{1,2})(.{4})/, '$1-$2-$3-$4');
    },

    /**
     * Get vehicle type display name
     */
    getVehicleTypeDisplayName(type) {
        const types = {
            '2-wheeler': 'Two Wheeler',
            '3-wheeler': 'Three Wheeler', 
            '4-wheeler': 'Four Wheeler',
            'heavy-vehicle': 'Heavy Vehicle'
        };
        return types[type] || type;
    },

    /**
     * Calculate days between dates
     */
    daysBetweenDates(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
    }
};

// Add necessary animations to document
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
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = new VehicleRegistrationForm();
    
    // Make utilities available globally
    window.RegistrationUtils = RegistrationUtils;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VehicleRegistrationForm, RegistrationUtils };
}
