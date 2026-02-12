// API Gateway URL
// const API_URL = 'http://localhost:3000/api';
const API_URL = '/api';


// State management
let currentView = 'employees';
let employees = [];
let attendance = [];
let leaves = [];
let payroll = [];

// DOM Elements
const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('.nav-link');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close');

// Event Listeners
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const view = link.getAttribute('href').substring(1);
        changeView(view);
    });
});

closeBtn.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    changeView('employees');
});

// Change view
async function changeView(view) {
    currentView = view;
    
    switch(view) {
        case 'employees':
            await loadEmployees();
            renderEmployees();
            break;
        case 'attendance':
            await loadAttendance();
            renderAttendance();
            break;
        case 'leaves':
            await loadLeaves();
            renderLeaves();
            break;
        case 'payroll':
            await loadPayroll();
            renderPayroll();
            break;
    }
}

// Load dashboard stats
async function loadDashboard() {
    try {
        const [empRes, attRes, leaveRes, payRes] = await Promise.all([
            fetch(`${API_URL}/employees`),
            fetch(`${API_URL}/attendance`),
            fetch(`${API_URL}/leaves`),
            fetch(`${API_URL}/payroll`)
        ]);

        const employees = await empRes.json();
        const attendance = await attRes.json();
        const leaves = await leaveRes.json();
        const payroll = await payRes.json();

        const today = new Date().toISOString().split('T')[0];
        const presentToday = attendance.filter(a => a.date === today && a.check_in).length;
        const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
        const pendingPayroll = payroll.filter(p => p.status === 'pending').length;

        document.getElementById('total-employees').textContent = employees.length;
        document.getElementById('present-today').textContent = presentToday;
        document.getElementById('pending-leaves').textContent = pendingLeaves;
        document.getElementById('pending-payroll').textContent = pendingPayroll;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Employee functions
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        employees = await response.json();
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function renderEmployees() {
    let html = `
        <div class="table-container">
            <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h2>Employee Management</h2>
                <button class="btn btn-primary" onclick="showAddEmployeeModal()">Add Employee</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    employees.forEach(emp => {
        html += `
            <tr>
                <td>${emp.employee_id}</td>
                <td>${emp.first_name} ${emp.last_name}</td>
                <td>${emp.email}</td>
                <td>${emp.department}</td>
                <td>${emp.position}</td>
                <td>
                    <span class="badge badge-${emp.status === 'active' ? 'success' : 'danger'}">
                        ${emp.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editEmployee(${emp.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${emp.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    contentArea.innerHTML = html;
}

function showAddEmployeeModal() {
    modalBody.innerHTML = `
        <h2>Add New Employee</h2>
        <form id="employeeForm" onsubmit="addEmployee(event)">
            <div class="form-group">
                <label>Employee ID</label>
                <input type="text" id="employee_id" required>
            </div>
            <div class="form-group">
                <label>First Name</label>
                <input type="text" id="first_name" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="last_name" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="phone">
            </div>
            <div class="form-group">
                <label>Department</label>
                <input type="text" id="department">
            </div>
            <div class="form-group">
                <label>Position</label>
                <input type="text" id="position">
            </div>
            <div class="form-group">
                <label>Hire Date</label>
                <input type="date" id="hire_date">
            </div>
            <div class="form-group">
                <label>Salary</label>
                <input type="number" id="salary" step="0.01">
            </div>
            <button type="submit" class="btn btn-primary">Save Employee</button>
        </form>
    `;
    modal.style.display = 'block';
}

async function addEmployee(event) {
    event.preventDefault();
    
    const employeeData = {
        employee_id: document.getElementById('employee_id').value,
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        department: document.getElementById('department').value,
        position: document.getElementById('position').value,
        hire_date: document.getElementById('hire_date').value,
        salary: parseFloat(document.getElementById('salary').value)
    };

    try {
        const response = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });

        if (response.ok) {
            modal.style.display = 'none';
            await loadEmployees();
            renderEmployees();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error adding employee:', error);
    }
}

async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            const response = await fetch(`${API_URL}/employees/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadEmployees();
                renderEmployees();
                loadDashboard();
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    }
}

// Attendance functions
async function loadAttendance() {
    try {
        const response = await fetch(`${API_URL}/attendance`);
        attendance = await response.json();
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

function renderAttendance() {
    let html = `
        <div class="table-container">
            <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h2>Attendance Management</h2>
                <div>
                    <button class="btn btn-success" onclick="showCheckInModal()">Check In</button>
                    <button class="btn btn-warning" onclick="showCheckOutModal()">Check Out</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    attendance.forEach(att => {
        html += `
            <tr>
                <td>${att.first_name} ${att.last_name}</td>
                <td>${att.date}</td>
                <td>${att.check_in || '-'}</td>
                <td>${att.check_out || '-'}</td>
                <td>
                    <span class="badge badge-${att.status === 'present' ? 'success' : 'warning'}">
                        ${att.status}
                    </span>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    contentArea.innerHTML = html;
}

function showCheckInModal() {
    modalBody.innerHTML = `
        <h2>Check In</h2>
        <form id="checkInForm" onsubmit="checkIn(event)">
            <div class="form-group">
                <label>Employee ID</label>
                <input type="text" id="employee_id" required>
            </div>
            <button type="submit" class="btn btn-success">Check In</button>
        </form>
    `;
    modal.style.display = 'block';
}

async function checkIn(event) {
    event.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/attendance/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee_id: document.getElementById('employee_id').value
            })
        });

        if (response.ok) {
            modal.style.display = 'none';
            await loadAttendance();
            renderAttendance();
            loadDashboard();
        } else {
            const error = await response.json();
            alert(error.error || 'Check in failed');
        }
    } catch (error) {
        console.error('Error checking in:', error);
    }
}

// Leave functions
async function loadLeaves() {
    try {
        const response = await fetch(`${API_URL}/leaves`);
        leaves = await response.json();
    } catch (error) {
        console.error('Error loading leaves:', error);
    }
}

function renderLeaves() {
    let html = `
        <div class="table-container">
            <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h2>Leave Management</h2>
                <button class="btn btn-primary" onclick="showApplyLeaveModal()">Apply Leave</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    leaves.forEach(leave => {
        html += `
            <tr>
                <td>${leave.first_name} ${leave.last_name}</td>
                <td>${leave.leave_type}</td>
                <td>${leave.start_date}</td>
                <td>${leave.end_date}</td>
                <td>${leave.reason || '-'}</td>
                <td>
                    <span class="badge badge-${leave.status === 'approved' ? 'success' : 
                        leave.status === 'rejected' ? 'danger' : 'warning'}">
                        ${leave.status}
                    </span>
                </td>
                <td>
                    ${leave.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="approveLeave(${leave.id})">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectLeave(${leave.id})">Reject</button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    contentArea.innerHTML = html;
}

// Payroll functions
async function loadPayroll() {
    try {
        const response = await fetch(`${API_URL}/payroll`);
        payroll = await response.json();
    } catch (error) {
        console.error('Error loading payroll:', error);
    }
}

function renderPayroll() {
    let html = `
        <div class="table-container">
            <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h2>Payroll Management</h2>
                <button class="btn btn-primary" onclick="showGeneratePayrollModal()">Generate Payroll</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Month/Year</th>
                        <th>Basic Salary</th>
                        <th>Allowances</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    payroll.forEach(pay => {
        html += `
            <tr>
                <td>${pay.first_name} ${pay.last_name}</td>
                <td>${pay.month}/${pay.year}</td>
                <td>$${pay.basic_salary?.toLocaleString()}</td>
                <td>$${pay.allowances?.toLocaleString()}</td>
                <td>$${pay.deductions?.toLocaleString()}</td>
                <td><strong>$${pay.net_salary?.toLocaleString()}</strong></td>
                <td>
                    <span class="badge badge-${pay.status === 'paid' ? 'success' : 'warning'}">
                        ${pay.status}
                    </span>
                </td>
                <td>
                    ${pay.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="processPayment(${pay.id})">Process Payment</button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    contentArea.innerHTML = html;
}

// Additional functions for leave and payroll
async function approveLeave(id) {
    try {
        const response = await fetch(`${API_URL}/leaves/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'approved',
                approved_by: 'HR001' // In real app, get from logged in user
            })
        });

        if (response.ok) {
            await loadLeaves();
            renderLeaves();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error approving leave:', error);
    }
}

async function rejectLeave(id) {
    try {
        const response = await fetch(`${API_URL}/leaves/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'rejected',
                approved_by: 'HR001'
            })
        });

        if (response.ok) {
            await loadLeaves();
            renderLeaves();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error rejecting leave:', error);
    }
}

function showApplyLeaveModal() {
    modalBody.innerHTML = `
        <h2>Apply for Leave</h2>
        <form id="leaveForm" onsubmit="applyLeave(event)">
            <div class="form-group">
                <label>Employee ID</label>
                <input type="text" id="employee_id" required>
            </div>
            <div class="form-group">
                <label>Leave Type</label>
                <select id="leave_type" required>
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                </select>
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="start_date" required>
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" id="end_date" required>
            </div>
            <div class="form-group">
                <label>Reason</label>
                <textarea id="reason" rows="3"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit Request</button>
        </form>
    `;
    modal.style.display = 'block';
}

async function applyLeave(event) {
    event.preventDefault();
    
    const leaveData = {
        employee_id: document.getElementById('employee_id').value,
        leave_type: document.getElementById('leave_type').value,
        start_date: document.getElementById('start_date').value,
        end_date: document.getElementById('end_date').value,
        reason: document.getElementById('reason').value
    };

    try {
        const response = await fetch(`${API_URL}/leaves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveData)
        });

        if (response.ok) {
            modal.style.display = 'none';
            await loadLeaves();
            renderLeaves();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error applying leave:', error);
    }
}

function showGeneratePayrollModal() {
    modalBody.innerHTML = `
        <h2>Generate Payroll</h2>
        <form id="payrollForm" onsubmit="generatePayroll(event)">
            <div class="form-group">
                <label>Employee ID</label>
                <input type="text" id="employee_id" required>
            </div>
            <div class="form-group">
                <label>Month</label>
                <select id="month" required>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="number" id="year" value="${new Date().getFullYear()}" required>
            </div>
            <div class="form-group">
                <label>Basic Salary</label>
                <input type="number" id="basic_salary" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Allowances</label>
                <input type="number" id="allowances" step="0.01" value="0">
            </div>
            <div class="form-group">
                <label>Deductions</label>
                <input type="number" id="deductions" step="0.01" value="0">
            </div>
            <button type="submit" class="btn btn-primary">Generate Payroll</button>
        </form>
    `;
    modal.style.display = 'block';
}

async function generatePayroll(event) {
    event.preventDefault();
    
    const payrollData = {
        employee_id: document.getElementById('employee_id').value,
        month: document.getElementById('month').value,
        year: document.getElementById('year').value,
        basic_salary: parseFloat(document.getElementById('basic_salary').value),
        allowances: parseFloat(document.getElementById('allowances').value),
        deductions: parseFloat(document.getElementById('deductions').value)
    };

    try {
        const response = await fetch(`${API_URL}/payroll/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payrollData)
        });

        if (response.ok) {
            modal.style.display = 'none';
            await loadPayroll();
            renderPayroll();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error generating payroll:', error);
    }
}

async function processPayment(id) {
    try {
        const response = await fetch(`${API_URL}/payroll/${id}/pay`, {
            method: 'PUT'
        });

        if (response.ok) {
            await loadPayroll();
            renderPayroll();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error processing payment:', error);
    }
}