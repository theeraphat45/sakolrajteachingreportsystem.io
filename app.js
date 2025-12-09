// Main Application JavaScript
class App {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.init();
    }

    init() {
        this.checkSession();
        this.setupNavigation();
        this.setupEventListeners();
    }

    checkSession() {
        const user = localStorage.getItem('currentUser');
        const role = localStorage.getItem('currentRole');
        
        if (user && role) {
            this.currentUser = JSON.parse(user);
            this.currentRole = role;
            this.updateUIForRole();
        } else if (!window.location.pathname.includes('login.html') && 
                   !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }

    updateUIForRole() {
        // Update navbar based on role
        const navbarUser = document.getElementById('navbarUser');
        if (navbarUser) {
            navbarUser.textContent = `${this.currentUser.name} (${this.currentRole})`;
        }

        // Show/hide menu items based on role
        this.updateMenuVisibility();
    }

    updateMenuVisibility() {
        const adminOnly = document.querySelectorAll('.admin-only');
        const teacherOnly = document.querySelectorAll('.teacher-only');
        const studentOnly = document.querySelectorAll('.student-only');

        adminOnly.forEach(el => {
            el.style.display = this.currentRole === 'admin' ? 'block' : 'none';
        });

        teacherOnly.forEach(el => {
            el.style.display = this.currentRole === 'teacher' ? 'flex' : 'none';
        });

        studentOnly.forEach(el => {
            el.style.display = this.currentRole === 'student' ? 'flex' : 'none';
        });
    }

    setupNavigation() {
        // Handle navigation links
        document.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        const pages = {
            'dashboard': this.getDashboardPage(),
            'profile': 'profile.html',
            'subjects': 'subjects.html',
            'report': 'report.html',
            'retrospective': 'retrospective.html',
            'history': 'history.html',
            'users': 'users.html',
            'reset-password': 'reset-password.html',
            'dashboard_admin': 'dashboard_admin.html',
            'dashboard_teacher': 'dashboard_teacher.html',
            'dashboard_student': 'dashboard_student.html'

        };

        if (pages[page]) {
            window.location.href = pages[page];
        }
    }

    getDashboardPage() {
        switch(this.currentRole) {
            case 'admin': return 'dashboard_admin.html';
            case 'teacher': return 'dashboard_teacher.html';
            case 'student': return 'dashboard_student.html';
            default: return 'login.html';
        }
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLogoutConfirm();
            });
        }

        // Save buttons
        document.querySelectorAll('.btn-save').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSaveConfirm(e);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showDeleteConfirm(e);
            });
        });
    }

    showLogoutConfirm() {
        if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentRole');
            window.location.href = 'login.html';
        }
    }

    showSaveConfirm(event) {
        if (!confirm('คุณต้องการบันทึกข้อมูลใช่หรือไม่?')) {
            event.preventDefault();
        }
    }

    showDeleteConfirm(event) {
        if (!confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
            event.preventDefault();
        }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'success') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Add to container
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        container.appendChild(toast);

        // Show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove after hide
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    showLoading() {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        overlay.innerHTML = `
            <div class="spinner-border text-primary-red" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // API Response Handler
    handleApiResponse(response, successCallback, errorCallback) {
        if (response.success) {
            if (successCallback) successCallback(response.data);
            this.showToast(response.message || 'ดำเนินการสำเร็จ');
        } else {
            if (errorCallback) errorCallback(response.error);
            this.showToast(response.error || 'เกิดข้อผิดพลาด', 'danger');
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Utility Functions
const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    formatNumber(num) {
        return num.toLocaleString('th-TH');
    },

    calculatePercentage(part, total) {
        if (total === 0) return 0;
        return ((part / total) * 100).toFixed(2);
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePhone(phone) {
        const re = /^0[0-9]{8,9}$/;
        return re.test(phone);
    },

    getCurrentSemester() {
        const month = new Date().getMonth() + 1;
        return month >= 5 && month <= 10 ? 1 : 2;
    },

    getAcademicYear() {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        return month >= 5 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, Utils };
}