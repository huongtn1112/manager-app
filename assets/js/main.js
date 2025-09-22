// JavaScript chung cho navigation và utilities
class NavigationManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setActiveNavLink();
        this.handleMobileMenu();
    }
    
    setActiveNavLink() {
        const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            const resolved = new URL(href, window.location.origin + window.location.pathname).pathname
                .replace(/\/index\.html$/, '/');
            if (currentPath === resolved) {
                link.classList.add('active');
            }
        });
    }
    
    handleMobileMenu() {
        // Thêm chức năng mobile menu nếu cần
    }
}

// Utility functions
class Utils {
    static formatDate(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
    
    static formatDateTime(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    
    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            animation: 'slideInRight 0.3s ease-out'
        };
        
        const typeStyles = {
            info: { backgroundColor: '#3498db' },
            success: { backgroundColor: '#27ae60' },
            warning: { backgroundColor: '#f39c12' },
            error: { backgroundColor: '#e74c3c' }
        };
        
        Object.assign(notification.style, styles, typeStyles[type]);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    static getFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }
    
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Animation styles
const animationCSS = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Add animation styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = animationCSS;
document.head.appendChild(styleSheet);

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavigationManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager, Utils };
}