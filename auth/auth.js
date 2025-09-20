/**
 * Login Form Handler
 * Modern JavaScript for login functionality with validation
 * @author Your Name
 * @version 1.0.0
 */

class LoginForm {
    constructor() {
        this.form = document.querySelector('.login-form');
        this.emailField = this.form.querySelector('input[type="email"]');
        this.passwordField = this.form.querySelector('#password');
        this.togglePassword = document.getElementById('togglePassword');
        this.loginBtn = this.form.querySelector('.login-btn');
        this.socialBtns = document.querySelectorAll('.social-btn');
        
        // Initialize form
        this.init();
    }

    /**
     * Initialize all event listeners and setup
     */
    init() {
        this.attachEventListeners();
        this.setupFieldValidation();
        this.initializeAnimations();
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Password toggle
        this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Social login buttons
        this.socialBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });

        // Real-time field validation
        this.emailField.addEventListener('blur', () => this.validateEmail());
        this.passwordField.addEventListener('blur', () => this.validatePassword());
        
        // Input field animations
        this.attachFieldAnimations();
    }

    /**
     * Handle form submission with validation
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Validate all fields
            const isValid = this.validateAllFields();
            
            if (!isValid) {
                this.setLoadingState(false);
                return;
            }

            // Get form data
            const formData = this.getFormData();
            
            // Simulate API call (replace with actual authentication)
            const result = await this.authenticateUser(formData);
            
            if (result.success) {
                this.handleSuccessfulLogin(result);
            } else {
                this.handleFailedLogin(result.message);
            }
            
        } catch (error) {
            console.error('Login error: - auth.js:85', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Validate all form fields
     * @returns {boolean} - Validation result
     */
    validateAllFields() {
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();
        
        return emailValid && passwordValid;
    }

    /**
     * Validate email field
     * @returns {boolean} - Email validation result
     */
    validateEmail() {
        const email = this.emailField.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError(this.emailField, 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError(this.emailField, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(this.emailField);
        return true;
    }

    /**
     * Validate password field
     * @returns {boolean} - Password validation result
     */
    validatePassword() {
        const password = this.passwordField.value;
        
        if (!password) {
            this.showFieldError(this.passwordField, 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError(this.passwordField, 'Password must be at least 6 characters');
            return false;
        }
        
        this.clearFieldError(this.passwordField);
        return true;
    }

    /**
     * Show field-specific error message
     * @param {HTMLElement} field - Input field element
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        // Remove existing error
        this.clearFieldError(field);
        
        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #e74c3c;
            font-size: 12px;
            margin-top: 5px;
            animation: slideDown 0.3s ease;
        `;
        
        // Add error styling to field
        field.style.borderColor = '#e74c3c';
        field.parentElement.appendChild(errorDiv);
    }

    /**
     * Clear field error message
     * @param {HTMLElement} field - Input field element
     */
    clearFieldError(field) {
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '#e1e5e9';
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const isPassword = this.passwordField.type === 'password';
        
        this.passwordField.type = isPassword ? 'text' : 'password';
        this.togglePassword.className = isPassword ? 'ri-eye-off-line password-toggle' : 'ri-eye-line password-toggle';
        
        // Add animation effect
        this.togglePassword.style.transform = 'scale(0.8)';
        setTimeout(() => {
            this.togglePassword.style.transform = 'scale(1)';
        }, 150);
    }

    /**
     * Get form data as object
     * @returns {Object} - Form data
     */
    getFormData() {
        return {
            email: this.emailField.value.trim(),
            password: this.passwordField.value,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Simulate user authentication (replace with actual API call)
     * @param {Object} formData - Login credentials
     * @returns {Promise<Object>} - Authentication result
     */
    async authenticateUser(formData) {
        // Simulate API delay
        await this.delay(1500);
        
        // Demo authentication logic (replace with real implementation)
        if (formData.email === 'abc@gmail.com' && formData.password === 'password') {
            return {
                success: true,
                user: {
                    id: 1,
                    email: formData.email,
                    name: 'Demo User'
                },
                token: 'demo-jwt-token'
            };
        } else {
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
    }

    /**
     * Handle successful login
     * @param {Object} result - Authentication result
     */
    handleSuccessfulLogin(result) {
        // Store user data (use secure storage in production)
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        // Show success message
        this.showSuccess('Login successful! Redirecting...');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = '../home/home.html';
        }, 100);
    }

    /**
     * Handle failed login
     * @param {string} message - Error message
     */
    handleFailedLogin(message) {
        this.showError(message || 'Login failed. Please try again.');
        
        // Shake animation for form
        this.form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.form.style.animation = '';
        }, 500);
    }

    /**
     * Handle social login
     * @param {Event} event - Click event
     */
    handleSocialLogin(event) {
        const button = event.currentTarget;
        const provider = button.textContent.trim().toLowerCase();
        
        // Add loading state to social button
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Connecting...';
        button.disabled = true;
        
        // Simulate social login (replace with actual implementation)
        setTimeout(() => {
            alert(`${provider} login integration - Add your OAuth implementation here`);
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }

    /**
     * Set loading state for form
     * @param {boolean} isLoading - Loading state
     */
    setLoadingState(isLoading) {
        if (isLoading) {
            this.loginBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite; margin-right: 8px;"></i>Signing In...';
            this.loginBtn.disabled = true;
            this.form.style.pointerEvents = 'none';
            this.form.style.opacity = '0.7';
        } else {
            this.loginBtn.innerHTML = 'Sign In';
            this.loginBtn.disabled = false;
            this.form.style.pointerEvents = 'auto';
            this.form.style.opacity = '1';
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success/error)
     */
    showNotification(message, type) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Setup real-time field validation
     */
    setupFieldValidation() {
        // Add custom styles for validation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add field animation effects
     */
    attachFieldAnimations() {
        const fields = [this.emailField, this.passwordField];
        
        fields.forEach(field => {
            field.addEventListener('focus', () => {
                field.parentElement.style.transform = 'scale(1.02)';
            });
            
            field.addEventListener('blur', () => {
                field.parentElement.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Initialize page animations
     */
    initializeAnimations() {
        // Add smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Add focus trap for accessibility
        this.setupFocusTrap();
    }

    /**
     * Setup focus trap for modal-like behavior
     */
    setupFocusTrap() {
        const focusableElements = this.form.querySelectorAll(
            'input, button, textarea, select, a[href]'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if user is already logged in
     */
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Redirect if already logged in
            // window.location.href = '/auth.html';
        }
    }
}

// Utility functions for external use
const LoginUtils = {
    /**
     * Clear all stored authentication data
     */
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.clear();
    },

    /**
     * Get current user data
     * @returns {Object|null} - User data or null if not logged in
     */
    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }
};

// Initialize login form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = new LoginForm();
    
    // Check authentication status
    loginForm.checkAuthStatus();
    
    // Make utilities available globally
    window.LoginUtils = LoginUtils;
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoginForm, LoginUtils };
}
