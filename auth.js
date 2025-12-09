// Authentication Module
const Auth = {
    // User database (simulated - in production this would be from GAS)
    users: {
        'admin': {
            username: 'admin',
            password: 'admin123',
            name: 'ผู้ดูแลระบบ',
            role: 'admin',
            email: 'admin@sakonnakhon.ac.th'
        },
        'teacher1': {
            username: 'teacher1',
            password: 'teacher123',
            name: 'ครูวีระพล สุวรรณชัยรบ',
            role: 'teacher',
            email: 'veerapon@sakonnakhon.ac.th',
            subjects: ['ค32102', 'ค32202'],
            classrooms: ['ม.4/1', 'ม.4/2', 'ม.5/1']
        },
        'teacher2': {
            username: 'teacher2',
            password: 'teacher123',
            name: 'ครูรุจิพัชญ์ อรุวีวัฒนานนท์',
            role: 'teacher',
            email: 'rujipat@sakonnakhon.ac.th',
            subjects: ['ว32286', 'ว30290'],
            classrooms: ['ม.5/1', 'ม.5/2', 'ม.6/1']
        },
        'teacher3': {
            username: 'teacher3',
            password: 'teacher123',
            name: 'ครูผุสดี บุญหงษ์',
            role: 'teacher',
            email: 'phusdee@sakonnakhon.ac.th',
            subjects: ['ว30284', 'ว32285'],
            classrooms: ['ม.6/1', 'ม.6/2']
        },
        'student1': {
            username: 'student1',
            password: 'student123',
            name: 'นักเรียนตัวอย่าง 1',
            role: 'student',
            classroom: 'ม.4/1',
            email: 'student1@sakonnakhon.ac.th'
        },
        'student2': {
            username: 'student2',
            password: 'student123',
            name: 'นักเรียนตัวอย่าง 2',
            role: 'student',
            classroom: 'ม.5/1',
            email: 'student2@sakonnakhon.ac.th'
        }
    },

    // Login function
    login(username, password, role, classroom = '') {
        // Show loading
        if (window.app) window.app.showLoading();

        // Simulate API call delay
        setTimeout(() => {
            const user = this.users[username];
            
            if (user && user.password === password && user.role === role) {
                // Additional check for student role
                if (role === 'student' && user.classroom !== classroom) {
                    window.app?.showToast('ห้องเรียนไม่ถูกต้อง', 'danger');
                    window.app?.hideLoading();
                    return;
                }

                // Store session
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('currentRole', role);
                localStorage.setItem('loginTime', new Date().toISOString());

                window.app?.hideLoading();
                window.app?.showToast('เข้าสู่ระบบสำเร็จ');

                // Redirect based on role
                setTimeout(() => {
                    switch(role) {
                        case 'admin':
                            window.location.href = 'dashboard_admin.html';
                            break;
                        case 'teacher':
                            window.location.href = 'dashboard_teacher.html';
                            break;
                        case 'student':
                            window.location.href = 'dashboard_student.html';
                            break;
                    }
                }, 500);
            } else {
                window.app?.hideLoading();
                window.app?.showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'danger');
            }
        }, 1000);
    },

    // Logout function
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        localStorage.removeItem('loginTime');
        window.location.href = 'login.html';
    },

    // Check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem('currentUser') !== null;
    },

    // Check role
    hasRole(role) {
        return localStorage.getItem('currentRole') === role;
    },

    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // Get user role
    getCurrentRole() {
        return localStorage.getItem('currentRole');
    },

    // Change password
    changePassword(oldPassword, newPassword) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, error: 'ไม่พบผู้ใช้' };

        if (user.password !== oldPassword) {
            return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
        }

        // Update password
        user.password = newPassword;
        this.users[user.username].password = newPassword;
        
        // Update in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));

        return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    },

    // Reset password (admin only)
    resetPassword(username) {
        if (!this.hasRole('admin')) {
            return { success: false, error: 'ไม่มีสิทธิ์ในการใช้งานฟังก์ชันนี้' };
        }

        const user = this.users[username];
        if (!user) {
            return { success: false, error: 'ไม่พบผู้ใช้' };
        }

        // Generate temporary password
        const tempPassword = this.generateTempPassword();
        user.password = tempPassword;

        // In production, send email with temp password
        console.log(`Temporary password for ${username}: ${tempPassword}`);

        return { 
            success: true, 
            message: 'รีเซ็ตรหัสผ่านสำเร็จ',
            tempPassword: tempPassword 
        };
    },

    // Generate temporary password
    generateTempPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // Check session expiry
    checkSessionExpiry() {
        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return true;

        const loginDate = new Date(loginTime);
        const now = new Date();
        const diffHours = (now - loginDate) / (1000 * 60 * 60);

        // Session expires after 8 hours
        if (diffHours > 8) {
            this.logout();
            return true;
        }
        return false;
    },

    // Get all users (admin only)
    getAllUsers() {
        if (!this.hasRole('admin')) {
            return [];
        }

        return Object.values(this.users).map(user => ({
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email,
            classroom: user.classroom || null
        }));
    },

    // Add new user (admin only)
    addUser(userData) {
        if (!this.hasRole('admin')) {
            return { success: false, error: 'ไม่มีสิทธิ์ในการใช้งานฟังก์ชันนี้' };
        }

        if (this.users[userData.username]) {
            return { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
        }

        this.users[userData.username] = {
            ...userData,
            password: '123456' // Default password
        };

        return { success: true, message: 'เพิ่มผู้ใช้สำเร็จ' };
    },

    // Update user (admin only)
    updateUser(username, userData) {
        if (!this.hasRole('admin')) {
            return { success: false, error: 'ไม่มีสิทธิ์ในการใช้งานฟังก์ชันนี้' };
        }

        if (!this.users[username]) {
            return { success: false, error: 'ไม่พบผู้ใช้' };
        }

        this.users[username] = {
            ...this.users[username],
            ...userData
        };

        return { success: true, message: 'อัปเดตผู้ใช้สำเร็จ' };
    },

    // Delete user (admin only)
    deleteUser(username) {
        if (!this.hasRole('admin')) {
            return { success: false, error: 'ไม่มีสิทธิ์ในการใช้งานฟังก์ชันนี้' };
        }

        if (!this.users[username]) {
            return { success: false, error: 'ไม่พบผู้ใช้' };
        }

        delete this.users[username];
        return { success: true, message: 'ลบผู้ใช้สำเร็จ' };
    }
};

// Global login function
function login(username, password, role, classroom = '') {
    return Auth.login(username, password, role, classroom);
}

// Global logout function
function logout() {
    return Auth.logout();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}