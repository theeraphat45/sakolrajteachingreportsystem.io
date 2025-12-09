// API Module for Google Apps Script and LINE Integration
const API = {
    // GAS Web App URL (ต้องเปลี่ยนเป็น URL จริง)
    GAS_URL: 'https://script.google.com/macros/s/AKfycby.../exec',
    
    // LINE Messaging API Configuration
    LINE_CONFIG: {
        CHANNEL_ACCESS_TOKEN: 'YOUR_CHANNEL_ACCESS_TOKEN',
        CHANNEL_SECRET: 'YOUR_CHANNEL_SECRET',
        ADMIN_USER_ID: 'YOUR_ADMIN_USER_ID'
    },

    // API Endpoints
    endpoints: {
        // CRUD Operations
        CREATE_REPORT: 'createReport',
        READ_REPORTS: 'readReports',
        UPDATE_REPORT: 'updateReport',
        DELETE_REPORT: 'deleteReport',
        
        // User Management
        GET_USERS: 'getUsers',
        CREATE_USER: 'createUser',
        UPDATE_USER: 'updateUser',
        DELETE_USER: 'deleteUser',
        
        // Subjects
        GET_SUBJECTS: 'getSubjects',
        CREATE_SUBJECT: 'createSubject',
        UPDATE_SUBJECT: 'updateSubject',
        DELETE_SUBJECT: 'deleteSubject',
        
        // Statistics
        GET_STATISTICS: 'getStatistics',
        GET_ATTENDANCE: 'getAttendance',
        GET_MISSING_REPORTS: 'getMissingReports',
        
        // LINE API
        SEND_LINE_MESSAGE: 'sendLineMessage',
        SEND_BROADCAST: 'sendBroadcast'
    },

    // Generic API Call
    async call(endpoint, data = {}, method = 'POST') {
        try {
            const url = `${this.GAS_URL}?action=${endpoint}`;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: method === 'GET' ? null : JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Call Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Report Management
    async createReport(reportData) {
        return await this.call(this.endpoints.CREATE_REPORT, reportData);
    },

    async getReports(filters = {}) {
        return await this.call(this.endpoints.READ_REPORTS, filters, 'GET');
    },

    async updateReport(reportId, updateData) {
        return await this.call(this.endpoints.UPDATE_REPORT, {
            id: reportId,
            ...updateData
        });
    },

    async deleteReport(reportId) {
        return await this.call(this.endpoints.DELETE_REPORT, { id: reportId });
    },

    // User Management
    async getUsers(role = null) {
        const filters = role ? { role } : {};
        return await this.call(this.endpoints.GET_USERS, filters, 'GET');
    },

    async createUser(userData) {
        return await this.call(this.endpoints.CREATE_USER, userData);
    },

    async updateUser(userId, userData) {
        return await this.call(this.endpoints.UPDATE_USER, {
            id: userId,
            ...userData
        });
    },

    async deleteUser(userId) {
        return await this.call(this.endpoints.DELETE_USER, { id: userId });
    },

    // Subject Management
    async getSubjects() {
        return await this.call(this.endpoints.GET_SUBJECTS, {}, 'GET');
    },

    async createSubject(subjectData) {
        return await this.call(this.endpoints.CREATE_SUBJECT, subjectData);
    },

    async updateSubject(subjectId, subjectData) {
        return await this.call(this.endpoints.UPDATE_SUBJECT, {
            id: subjectId,
            ...subjectData
        });
    },

    async deleteSubject(subjectId) {
        return await this.call(this.endpoints.DELETE_SUBJECT, { id: subjectId });
    },

    // Statistics
    async getStatistics(dateRange = {}) {
        return await this.call(this.endpoints.GET_STATISTICS, dateRange, 'GET');
    },

    async getAttendance(grade = null, date = null) {
        const filters = {};
        if (grade) filters.grade = grade;
        if (date) filters.date = date;
        
        return await this.call(this.endpoints.GET_ATTENDANCE, filters, 'GET');
    },

    async getMissingReports(date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return await this.call(this.endpoints.GET_MISSING_REPORTS, { date: targetDate }, 'GET');
    },

    // LINE Messaging API
    async sendLineMessage(userId, message) {
        return await this.call(this.endpoints.SEND_LINE_MESSAGE, {
            userId: userId,
            message: message
        });
    },

    async sendBroadcastToTeachers(message) {
        return await this.call(this.endpoints.SEND_BROADCAST, {
            role: 'teacher',
            message: message
        });
    },

    async sendClassroomReminder(classroom, level) {
        const message = `แจ้งเตือน: ห้อง ${classroom} ระดับชั้น ${level} ยังไม่รายงานการเรียนการสอนวันนี้ กรุณารายงานภายใน 17.30 น. หากรายงานแล้ว ขออภัยในความไม่สะดวกครับ 🙏`;
        
        // Get classroom teacher or representative
        const users = await this.getUsers();
        const targetUser = users.find(u => u.classroom === classroom && u.role === 'student');
        
        if (targetUser && targetUser.lineId) {
            return await this.sendLineMessage(targetUser.lineId, message);
        }
        
        return { success: false, error: 'ไม่พบผู้ใช้หรือ LINE ID' };
    },

    // Automatic daily reminder at 17:30
    async sendDailyReminders() {
        try {
            const missingReports = await this.getMissingReports();
            
            if (missingReports.success && missingReports.data.length > 0) {
                const promises = missingReports.data.map(async (report) => {
                    return await this.sendClassroomReminder(
                        report.classroom,
                        report.level
                    );
                });
                
                const results = await Promise.all(promises);
                return {
                    success: true,
                    message: `ส่งแจ้งเตือนสำเร็จ ${results.filter(r => r.success).length} ห้อง`,
                    results: results
                };
            }
            
            return {
                success: true,
                message: 'ไม่มีห้องที่ต้องแจ้งเตือน'
            };
        } catch (error) {
            console.error('Send daily reminders error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Attendance Calculation
    async calculateTeacherAbsence(teacherId, period = 'month') {
        try {
            const reports = await this.getReports({ teacherId: teacherId });
            
            if (!reports.success) {
                throw new Error('ไม่สามารถดึงข้อมูลรายงานได้');
            }
            
            const teacherReports = reports.data;
            const now = new Date();
            let filteredReports = [];
            
            // Filter by period
            switch (period) {
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filteredReports = teacherReports.filter(r => 
                        new Date(r.date) >= weekAgo
                    );
                    break;
                    
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    filteredReports = teacherReports.filter(r => 
                        new Date(r.date) >= monthAgo
                    );
                    break;
                    
                case 'term':
                    const currentTerm = Utils.getCurrentSemester();
                    filteredReports = teacherReports.filter(r => 
                        r.term === currentTerm
                    );
                    break;
                    
                case 'year':
                    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    filteredReports = teacherReports.filter(r => 
                        new Date(r.date) >= yearAgo
                    );
                    break;
                    
                default:
                    filteredReports = teacherReports;
            }
            
            // Calculate absence
            const totalClasses = filteredReports.length;
            const absentClasses = filteredReports.filter(r => 
                r.status === 'ไม่มีผู้สอน' || r.status === 'ผู้สอนแทน'
            ).length;
            
            const absencePercentage = Utils.calculatePercentage(absentClasses, totalClasses);
            
            return {
                success: true,
                data: {
                    period: period,
                    totalClasses: totalClasses,
                    absentClasses: absentClasses,
                    absencePercentage: absencePercentage,
                    details: filteredReports.map(r => ({
                        date: r.date,
                        classroom: r.classroom,
                        status: r.status
                    }))
                }
            };
        } catch (error) {
            console.error('Calculate teacher absence error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Data Export
    async exportData(type = 'csv', filters = {}) {
        try {
            const reports = await this.getReports(filters);
            
            if (!reports.success) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }
            
            let content = '';
            const data = reports.data;
            
            switch (type) {
                case 'csv':
                    // Create CSV content
                    const headers = ['วันที่', 'ห้อง', 'คาบ', 'วิชา', 'ครูผู้สอน', 'สถานะ', 'ผู้รายงาน', 'เวลา'];
                    content = headers.join(',') + '\n';
                    
                    data.forEach(report => {
                        const row = [
                            report.date,
                            report.classroom,
                            report.period,
                            report.subject,
                            report.teacher,
                            report.status,
                            report.reporter,
                            report.time
                        ].map(field => `"${field || ''}"`).join(',');
                        content += row + '\n';
                    });
                    break;
                    
                case 'excel':
                    // For Excel, you would typically use a library like SheetJS
                    // This is a simplified version
                    content = JSON.stringify(data);
                    break;
                    
                case 'json':
                    content = JSON.stringify(data, null, 2);
                    break;
            }
            
            return {
                success: true,
                data: content,
                filename: `รายงานการสอน_${new Date().toISOString().split('T')[0]}.${type}`
            };
        } catch (error) {
            console.error('Export data error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // File Download Helper
    downloadFile(content, filename, type = 'text/csv') {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Backup and Restore
    async backupData() {
        try {
            const [reports, users, subjects] = await Promise.all([
                this.getReports(),
                this.getUsers(),
                this.getSubjects()
            ]);
            
            if (!reports.success || !users.success || !subjects.success) {
                throw new Error('ไม่สามารถดึงข้อมูลทั้งหมดได้');
            }
            
            const backupData = {
                timestamp: new Date().toISOString(),
                reports: reports.data,
                users: users.data,
                subjects: subjects.data
            };
            
            return {
                success: true,
                data: backupData
            };
        } catch (error) {
            console.error('Backup data error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Initialize API (check connection)
    async initialize() {
        try {
            const testResponse = await fetch(this.GAS_URL + '?action=test');
            return {
                success: testResponse.ok,
                message: testResponse.ok ? 'API Connected' : 'API Connection Failed'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Google Sheets specific methods
    async getSheetData(sheetName, range = 'A:Z') {
        return await this.call('getSheetData', {
            sheetName: sheetName,
            range: range
        }, 'GET');
    },

    async appendToSheet(sheetName, data) {
        return await this.call('appendToSheet', {
            sheetName: sheetName,
            data: data
        });
    },

    async clearSheet(sheetName, range = 'A2:Z') {
        return await this.call('clearSheet', {
            sheetName: sheetName,
            range: range
        });
    }
};

// Initialize API when app loads
document.addEventListener('DOMContentLoaded', async () => {
    const apiStatus = await API.initialize();
    if (!apiStatus.success) {
        console.warn('API Connection Warning:', apiStatus.error);
        // Show warning but allow offline functionality
        if (window.app) {
            window.app.showToast('เชื่อมต่อกับเซิร์ฟเวอร์มีปัญหา โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', 'warning');
        }
    }
});

// Global helper function for API calls
async function callAPI(endpoint, data = {}) {
    return await API.call(endpoint, data);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}