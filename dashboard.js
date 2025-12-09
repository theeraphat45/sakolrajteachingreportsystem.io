// Dashboard Module
class Dashboard {
    constructor(role) {
        this.role = role;
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.setupEventListeners();
        this.initCharts();
    }

    async loadDashboardData() {
        try {
            // Show loading
            if (window.app) window.app.showLoading();

            // Load data based on role
            switch(this.role) {
                case 'admin':
                    await this.loadAdminDashboard();
                    break;
                case 'teacher':
                    await this.loadTeacherDashboard();
                    break;
                case 'student':
                    await this.loadStudentDashboard();
                    break;
            }

            // Hide loading
            if (window.app) window.app.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            if (window.app) {
                window.app.hideLoading();
                window.app.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
            }
        }
    }

    async loadAdminDashboard() {
        // Load summary statistics
        const summary = await this.fetchSummaryData();
        this.updateAdminSummary(summary);

        // Load recent reports
        const reports = await this.fetchRecentReports();
        this.updateRecentReports(reports);

        // Load attendance statistics
        const attendance = await this.fetchAttendanceStats();
        this.updateAttendanceStats(attendance);
    }

    async loadTeacherDashboard() {
        const user = Auth.getCurrentUser();
        
        // Load teacher's classes
        const classes = await this.fetchTeacherClasses(user.username);
        this.updateTeacherClasses(classes);

        // Load today's reports
        const todayReports = await this.fetchTodayReports(user.username);
        this.updateTodayReports(todayReports);

        // Load attendance summary
        const attendance = await this.fetchTeacherAttendance(user.username);
        this.updateTeacherAttendance(attendance);
    }

    async loadStudentDashboard() {
        const user = Auth.getCurrentUser();
        
        // Load classroom info
        const classroomData = await this.fetchClassroomData(user.classroom);
        this.updateClassroomInfo(classroomData);

        // Load today's report
        const todayReport = await this.fetchTodayClassReport(user.classroom);
        this.updateTodayReport(todayReport);

        // Load weekly attendance
        const weeklyAttendance = await this.fetchWeeklyAttendance(user.classroom);
        this.updateWeeklyAttendance(weeklyAttendance);
    }

    async fetchSummaryData() {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    totalClassrooms: 24,
                    reportedToday: 18,
                    notReported: 6,
                    totalTeachers: 45,
                    activeToday: 38,
                    totalStudents: 1200,
                    attendanceRate: 95.5
                });
            }, 500);
        });
    }

    async fetchRecentReports() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { classroom: 'ม.4/1', subject: 'คณิตศาสตร์ 4', teacher: 'ครูวีระพล', time: '08:30', status: 'ปกติ' },
                    { classroom: 'ม.5/2', subject: 'วิทยาศาสตร์', teacher: 'ครูรุจิพัชญ์', time: '09:30', status: 'ผู้สอนแทน' },
                    { classroom: 'ม.6/1', subject: 'ภาษาอังกฤษ', teacher: 'ครูผุสดี', time: '10:30', status: 'ไม่มีผู้สอน' },
                    { classroom: 'ม.4/2', subject: 'สังคมศึกษา', teacher: 'ครูสมชาย', time: '11:30', status: 'ปกติ' },
                    { classroom: 'ม.5/1', subject: 'ภาษาไทย', teacher: 'ครูสมหมาย', time: '13:30', status: 'กิจกรรม' }
                ]);
            }, 500);
        });
    }

    async fetchAttendanceStats() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    byGrade: {
                        'ม.1': { present: 95, absent: 5 },
                        'ม.2': { present: 93, absent: 7 },
                        'ม.3': { present: 96, absent: 4 },
                        'ม.4': { present: 94, absent: 6 },
                        'ม.5': { present: 97, absent: 3 },
                        'ม.6': { present: 98, absent: 2 }
                    },
                    bySubject: {
                        'คณิตศาสตร์': 96,
                        'วิทยาศาสตร์': 95,
                        'ภาษาอังกฤษ': 94,
                        'ภาษาไทย': 97,
                        'สังคมศึกษา': 93
                    }
                });
            }, 500);
        });
    }

    updateAdminSummary(data) {
        // Update summary cards
        document.getElementById('totalClassrooms').textContent = data.totalClassrooms;
        document.getElementById('reportedToday').textContent = data.reportedToday;
        document.getElementById('notReported').textContent = data.notReported;
        document.getElementById('totalTeachers').textContent = data.totalTeachers;
        document.getElementById('activeToday').textContent = data.activeToday;
        document.getElementById('attendanceRate').textContent = `${data.attendanceRate}%`;

        // Calculate percentage
        const reportPercentage = Utils.calculatePercentage(data.reportedToday, data.totalClassrooms);
        document.getElementById('reportPercentage').textContent = `${reportPercentage}%`;

        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${reportPercentage}%`;
        }
    }

    updateRecentReports(reports) {
        const tbody = document.getElementById('recentReports');
        if (!tbody) return;

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${report.classroom}</td>
                <td>${report.subject}</td>
                <td>${report.teacher}</td>
                <td>${report.time}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(report.status)}">
                        ${report.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewReport('${report.classroom}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateAttendanceStats(stats) {
        // Update grade level attendance
        const gradeTable = document.getElementById('gradeAttendance');
        if (gradeTable) {
            gradeTable.innerHTML = Object.entries(stats.byGrade).map(([grade, data]) => `
                <tr>
                    <td>${grade}</td>
                    <td>${data.present}%</td>
                    <td>${data.absent}%</td>
                    <td>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-success" style="width: ${data.present}%"></div>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Update subject attendance (for chart)
        this.updateSubjectChart(stats.bySubject);
    }

    getStatusBadgeClass(status) {
        const classes = {
            'ปกติ': 'bg-success',
            'ผู้สอนแทน': 'bg-warning text-dark',
            'ไม่มีผู้สอน': 'bg-danger',
            'กิจกรรม': 'bg-info'
        };
        return classes[status] || 'bg-secondary';
    }

    initCharts() {
        // Initialize Chart.js instances
        this.initAttendanceChart();
        this.initReportStatusChart();
    }

    initAttendanceChart() {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
                datasets: [{
                    label: 'อัตราการเข้าเรียน (%)',
                    data: [95, 94, 96, 93, 95, 96, 94, 95, 96, 97, 96, 98],
                    borderColor: '#C00000',
                    backgroundColor: 'rgba(192, 0, 0, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 90,
                        max: 100
                    }
                }
            }
        });
    }

    initReportStatusChart() {
        const ctx = document.getElementById('reportStatusChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['รายงานแล้ว', 'ยังไม่รายงาน', 'ไม่มีเรียน'],
                datasets: [{
                    data: [75, 15, 10],
                    backgroundColor: [
                        '#198754',
                        '#dc3545',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    updateSubjectChart(subjectData) {
        const ctx = document.getElementById('subjectChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(subjectData),
                datasets: [{
                    label: 'อัตราการเข้าเรียน (%)',
                    data: Object.values(subjectData),
                    backgroundColor: '#C00000'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 90,
                        max: 100
                    }
                }
            }
        });
    }

    async fetchTeacherClasses(teacherId) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 'ม.4/1', name: 'มัธยมศึกษาปีที่ 4/1', subject: 'คณิตศาสตร์ 4', period: 'คาบ 1-2' },
                    { id: 'ม.4/2', name: 'มัธยมศึกษาปีที่ 4/2', subject: 'คณิตศาสตร์เพิ่มเติม 4', period: 'คาบ 3-4' },
                    { id: 'ม.5/1', name: 'มัธยมศึกษาปีที่ 5/1', subject: 'คณิตศาสตร์ 5', period: 'คาบ 5-6' }
                ]);
            }, 500);
        });
    }

    async fetchTodayReports(teacherId) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { classroom: 'ม.4/1', status: 'ปกติ', reportedBy: 'นักเรียน 1', time: '08:45' },
                    { classroom: 'ม.4/2', status: 'ยังไม่ได้รายงาน', reportedBy: '-', time: '-' },
                    { classroom: 'ม.5/1', status: 'ผู้สอนแทน', reportedBy: 'นักเรียน 2', time: '10:30' }
                ]);
            }, 500);
        });
    }

    updateTeacherClasses(classes) {
        const container = document.getElementById('teacherClasses');
        if (!container) return;

        container.innerHTML = classes.map(cls => `
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${cls.name}</h5>
                        <p class="card-text">
                            <i class="bi bi-book"></i> ${cls.subject}<br>
                            <i class="bi bi-clock"></i> ${cls.period}
                        </p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="viewClassReport('${cls.id}')">
                                <i class="bi bi-clipboard-check"></i> ดูรายงาน
                            </button>
                            <button class="btn btn-outline-primary" onclick="reportClass('${cls.id}')">
                                <i class="bi bi-plus-circle"></i> รายงานการสอน
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateTodayReports(reports) {
        const container = document.getElementById('todayReports');
        if (!container) return;

        container.innerHTML = reports.map(report => `
            <tr>
                <td>${report.classroom}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(report.status)}">
                        ${report.status}
                    </span>
                </td>
                <td>${report.reportedBy}</td>
                <td>${report.time}</td>
                <td>
                    ${report.status === 'ยังไม่ได้รายงาน' ? 
                        `<button class="btn btn-sm btn-primary" onclick="reportNow('${report.classroom}')">
                            <i class="bi bi-pencil"></i> รายงาน
                        </button>` : 
                        `<button class="btn btn-sm btn-outline-primary" onclick="viewDetails('${report.classroom}')">
                            <i class="bi bi-eye"></i> ดูรายละเอียด
                        </button>`
                    }
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Add event listeners for dashboard actions
        this.setupReportButtons();
        this.setupFilterControls();
        this.setupDownloadButtons();
    }

    setupReportButtons() {
        // Report buttons for teacher dashboard
        document.querySelectorAll('.btn-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const classroom = e.target.dataset.classroom;
                this.openReportModal(classroom);
            });
        });
    }

    setupFilterControls() {
        // Grade filter for admin dashboard
        const gradeFilter = document.getElementById('gradeFilter');
        if (gradeFilter) {
            gradeFilter.addEventListener('change', (e) => {
                this.filterByGrade(e.target.value);
            });
        }

        // Date filter
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filterByDate(e.target.value);
            });
        }
    }

    setupDownloadButtons() {
        // Download buttons
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.downloadData(type);
            });
        });
    }

    async filterByGrade(grade) {
        // Filter data by grade level
        console.log('Filter by grade:', grade);
        // Implement filtering logic
    }

    async filterByDate(date) {
        // Filter data by date
        console.log('Filter by date:', date);
        // Implement filtering logic
    }

    async downloadData(type) {
        // Download data as CSV/Excel
        console.log('Download data type:', type);
        // Implement download logic
    }

    openReportModal(classroom) {
        // Open report modal for specific classroom
        console.log('Open report modal for:', classroom);
        // Implement modal opening logic
    }

    // Student dashboard methods
    async fetchClassroomData(classroom) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    classroom: classroom,
                    grade: classroom.split('/')[0],
                    roomNumber: classroom.split('/')[1],
                    totalStudents: 40,
                    classTeacher: 'ครูที่ปรึกษา',
                    todaySchedule: [
                        { period: 1, subject: 'คณิตศาสตร์', teacher: 'ครูวีระพล' },
                        { period: 2, subject: 'วิทยาศาสตร์', teacher: 'ครูรุจิพัชญ์' },
                        { period: 3, subject: 'ภาษาอังกฤษ', teacher: 'ครูผุสดี' }
                    ]
                });
            }, 500);
        });
    }

    async fetchTodayClassReport(classroom) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    hasReported: true,
                    reportTime: '08:45',
                    status: 'ปกติ',
                    details: 'สอนตามปกติดี',
                    reportedBy: 'นักเรียนตัวแทน'
                });
            }, 500);
        });
    }

    updateClassroomInfo(data) {
        // Update classroom info for student dashboard
        document.getElementById('classroomName').textContent = `ห้อง ${data.classroom}`;
        document.getElementById('totalStudents').textContent = data.totalStudents;
        document.getElementById('classTeacher').textContent = data.classTeacher;

        // Update schedule
        const scheduleList = document.getElementById('todaySchedule');
        if (scheduleList) {
            scheduleList.innerHTML = data.todaySchedule.map(item => `
                <li class="list-group-item">
                    <div class="row">
                        <div class="col-2">คาบ ${item.period}</div>
                        <div class="col-5">${item.subject}</div>
                        <div class="col-5">${item.teacher}</div>
                    </div>
                </li>
            `).join('');
        }
    }

    updateTodayReport(report) {
        const container = document.getElementById('todayReportStatus');
        if (!container) return;

        if (report.hasReported) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="bi bi-check-circle"></i> รายงานแล้ว</h5>
                    <p>เวลารายงาน: ${report.reportTime}<br>
                    สถานะ: ${report.status}<br>
                    รายงานโดย: ${report.reportedBy}</p>
                    <button class="btn btn-outline-success" onclick="viewReportDetails()">
                        <i class="bi bi-eye"></i> ดูรายละเอียด
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="bi bi-exclamation-circle"></i> ยังไม่ได้รายงาน</h5>
                    <p>กรุณารายงานการเรียนการสอนวันนี้</p>
                    <button class="btn btn-primary" onclick="createReport()">
                        <i class="bi bi-plus-circle"></i> สร้างรายงาน
                    </button>
                </div>
            `;
        }
    }

    async fetchWeeklyAttendance(classroom) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    days: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'],
                    present: [38, 40, 39, 38, 40],
                    absent: [2, 0, 1, 2, 0]
                });
            }, 500);
        });
    }

    updateWeeklyAttendance(data) {
        const ctx = document.getElementById('weeklyAttendanceChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.days,
                datasets: [
                    {
                        label: 'มาเรียน',
                        data: data.present,
                        backgroundColor: '#198754'
                    },
                    {
                        label: 'ขาดเรียน',
                        data: data.absent,
                        backgroundColor: '#dc3545'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        max: 40
                    }
                }
            }
        });
    }
}

// Global functions for button clicks
function viewReport(classroom) {
    window.location.href = `report.html?classroom=${classroom}`;
}

function viewClassReport(classroom) {
    window.location.href = `report.html?classroom=${classroom}`;
}

function reportClass(classroom) {
    window.location.href = `report.html?classroom=${classroom}&action=create`;
}

function reportNow(classroom) {
    window.location.href = `report.html?classroom=${classroom}&action=create`;
}

function viewDetails(classroom) {
    window.location.href = `report.html?classroom=${classroom}&view=details`;
}

function viewReportDetails() {
    window.location.href = 'history.html';
}

function createReport() {
    window.location.href = 'report.html';
}

// Initialize dashboard based on current role
document.addEventListener('DOMContentLoaded', () => {
    const currentRole = Auth.getCurrentRole();
    if (currentRole) {
        window.dashboard = new Dashboard(currentRole);
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}