/**
 * Frontend JavaScript for the User Management System.
 * This script handles client-side routing, form submissions,
 * data display, and interaction with the backend API.
 */

// DOM elements
const navTabs = document.querySelectorAll('.nav-tab');
const contentSections = document.querySelectorAll('.content-section');
const container = document.querySelector('.container');
const mainContentWrapper = document.getElementById('main-content-wrapper');

const registrationForm = document.getElementById('registrationForm');
const employeeLoginForm = document.getElementById('employeeLoginForm');
const adminLoginForm = document.getElementById('adminLoginForm');

const registrationMessage = document.getElementById('registrationMessage');
const employeeLoginMessage = document.getElementById('employeeLoginMessage');
const adminLoginMessage = document.getElementById('adminLoginMessage');

const adminUsersDisplay = document.getElementById('adminUsersDisplay');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');

const adminDashboard = document.getElementById('adminDashboard');
const employeeDashboard = document.getElementById('employeeDashboard');

// Modal elements
const updateUserModal = document.getElementById('updateUserModal');
const closeButton = document.querySelector('.close-button');
const updateUserForm = document.getElementById('updateUserForm');
const updateMessage = document.getElementById('updateMessage');

let currentActiveTab = 'home'; // Default active tab on load

// Helper function to format date for input type="date" (YYYY-MM-DD)
const formatForInputDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Use getTime() for robust Date object check
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Function to show messages with animation
const showMessage = (element, message, type) => {
    element.textContent = message;
    element.className = `message ${type} block`;
    element.classList.remove('hidden');
    element.style.animation = 'bounceIn 0.5s ease';
    // Hide after a few seconds
    setTimeout(() => {
        hideMessage(element);
    }, 5000);
};

// Function to hide messages
const hideMessage = (element) => {
    element.classList.add('hidden');
    element.style.animation = ''; // Clear animation property
};

// Function to activate a tab with animation
const activateTab = async (tabName) => {
    navTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
            tab.style.animation = 'slideDown 0.3s ease';
        } else {
            tab.classList.remove('active');
            tab.style.animation = '';
        }
    });

    contentSections.forEach(section => {
        if (section.id === `${tabName}-section`) {
            section.classList.add('active');
            section.style.animation = 'fadeInUp 0.5s ease';
        } else {
            section.classList.remove('active');
            section.style.animation = '';
        }
    });

    // Reset dashboard states and messages when switching tabs
    adminDashboard.classList.add('hidden');
    employeeDashboard.classList.add('hidden');
    hideMessage(registrationMessage);
    hideMessage(employeeLoginMessage);
    hideMessage(adminLoginMessage);
    loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>';
    adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">Log in as admin to view and manage employee data.</p>';


    // Special handling for admin and employee login sections
    if (tabName === 'admin') {
        // If an admin is already logged in, show the dashboard immediately
        if (sessionStorage.getItem('userRole') === 'admin') {
            adminDashboard.classList.remove('hidden');
            fetchAdminEmployees();
        }
    } else if (tabName === 'login') { // Employee Login tab
        // If an employee is already logged in, show their profile immediately
        if (sessionStorage.getItem('userRole') === 'employee') {
            employeeDashboard.classList.remove('hidden');
            displayLoggedInEmployeeProfile();
        }
    }

    currentActiveTab = tabName;
};

// Function to format date for display (e.g., "May 3, 2004")
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date'; // Use getTime() for robust Date object check
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Function to format duration for display
const formatDuration = (duration) => {
    if (!duration) return '0 years, 0 months, 0 days';
    return `${duration.years || 0} years, ${duration.months || 0} months, ${duration.days || 0} days`;
};

// Function to display user data in a table with animations
const displayUsersInTable = (containerElement, users, showActions) => {
    containerElement.innerHTML = ''; // Clear previous content
    if (!Array.isArray(users) || users.length === 0) {
        containerElement.innerHTML = '<p class="text-center text-gray-500">No user data available.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'user-table';
    // Adjusted table headers to the new order
    table.innerHTML = `
        <thead>
            <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>UG</th>
                <th>PG</th>
                <th>PhD</th>
                <th>D.O.B</th>
                <th>Age</th>
                <th>D.O.J</th>
                <th>Previous Exp FROM</th>
                <th>Previous Exp TO</th>
                <th>Total Exp</th>
                ${showActions ? '<th>Actions</th>' : ''}
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');
    users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.userId}</td>
            <td>${user.fullName}</td>
            <td>${user.designation}</td>
            <td>${user.department}</td>
            <td>${user.educationalQualifications.ug}</td>
            <td>${user.educationalQualifications.pg}</td>
            <td>${user.educationalQualifications.phd}</td>
            <td>${formatDate(user.dateOfBirth)}</td>
            <td>${formatDuration(user.totalAge)}</td> <!-- Age column -->
            <td>${formatDate(user.dateOfJoining)}</td>
            <td>${formatDate(user.previousExperience.fromDate)}</td> <!-- Previous Exp FROM -->
            <td>${formatDate(user.previousExperience.toDate)}</td> <!-- Previous Exp TO -->
            <td>${formatDuration(user.totalExperience)}</td>
            ${showActions ? `
                <td>
                    <button class="btn-update" data-userid="${user.userId}">Update</button>
                    <button class="btn-delete" data-userid="${user.userId}">Delete</button>
                </td>
            ` : ''}
        `;

        if (showActions) {
            row.querySelector('.btn-update').addEventListener('click', () => openUpdateModal(user));
            row.querySelector('.btn-delete').addEventListener('click', () => deleteUser(user.userId));
        }

        row.style.transition = 'transform 0.3s ease';
        row.addEventListener('mouseover', () => row.style.transform = 'scale(1.01)');
        row.addEventListener('mouseout', () => row.style.transform = 'scale(1)');
    });
    containerElement.appendChild(table);
    containerElement.style.animation = 'fadeIn 0.5s ease';
};

// Handle Registration Form Submission
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(registrationMessage);

    const selectedRole = document.querySelector('input[name="role"]:checked').value;

    const formData = {
        userId: document.getElementById('regUserId').value,
        fullName: document.getElementById('regFullName').value,
        designation: document.getElementById('regDesignation').value,
        educationalQualifications: {
            ug: document.getElementById('regUG').value,
            pg: document.getElementById('regPG').value,
            phd: document.getElementById('regPhD').value,
        },
        department: document.getElementById('regDepartment').value,
        dateOfBirth: document.getElementById('regDateOfBirth').value,
        dateOfJoining: document.getElementById('regDateOfJoining').value,
        previousExperience: {
            fromDate: document.getElementById('regPrevFromDate').value || null,
            toDate: document.getElementById('regPrevToDate').value || null,
        },
        password: document.getElementById('regPassword').value,
        role: selectedRole,
    };

    try {
        console.log('Registration Form Data (Frontend):', formData);
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        console.log('Registration Response Status (Frontend):', response.status, response.statusText);
        const result = await response.json();
        console.log('Registration Response Body (Frontend):', result);

        if (response.ok) {
            showMessage(registrationMessage, `User ${formData.userId} registered successfully as ${formData.role}!`, 'success');
            registrationForm.reset();
            document.querySelector('input[name="role"][value="employee"]').checked = true; // Reset radio button
        } else {
            showMessage(registrationMessage, `Error: ${result.message || 'Failed to register user.'}`, 'error');
        }
    } catch (error) {
        console.error('Registration failed (Frontend - Network or JSON error):', error);
        showMessage(registrationMessage, 'An error occurred during registration. Please try again.', 'error');
    }
});

// Handle Employee Login Form Submission
employeeLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(employeeLoginMessage);
    loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Logging in...</p>';
    employeeDashboard.classList.add('hidden');

    const userId = document.getElementById('empLoginUserId').value;
    const password = document.getElementById('empLoginPassword').value;

    try {
        console.log('Employee Login Attempt (Frontend):', { userId });
        const response = await fetch('/api/employee/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password }),
        });

        console.log('Employee Login Response Status (Frontend):', response.status, response.statusText);
        let result;
        try {
            result = await response.json();
            console.log('Employee Login Response Body (Frontend - parsed):', result);
        } catch (jsonError) {
            console.error('Error parsing employee login response as JSON (Frontend):', jsonError);
            console.log('Employee Login Raw Response Text (Frontend):', await response.text());
            result = { message: 'Unexpected response from server.' };
        }

        if (response.ok) {
            showMessage(employeeLoginMessage, `Employee login successful for ${result.userId}!`, 'success');
            employeeLoginForm.reset();
            // Store session data
            sessionStorage.setItem('userRole', 'employee');
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));

            employeeDashboard.classList.remove('hidden');
            employeeDashboard.style.animation = 'fadeInUp 0.5s ease';
            displayLoggedInEmployeeProfile(); // Display the profile
        } else {
            showMessage(employeeLoginMessage, `Error: ${result.message || 'Invalid credentials.'}`, 'error');
            loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>';
        }
    } catch (error) {
        console.error('Employee login failed (Frontend - Network or unexpected error):', error);
        showMessage(employeeLoginMessage, 'An error occurred during login. Please try again.', 'error');
        loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>';
    }
});

// Handle Admin Login Form Submission
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(adminLoginMessage);
    adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">Authenticating...</p>';
    adminDashboard.classList.add('hidden');

    const userId = document.getElementById('adminUserId').value;
    const password = document.getElementById('adminPassword').value;

    try {
        console.log('Admin Login Attempt (Frontend):', { userId });
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password }),
        });

        console.log('Admin Login Response Status (Frontend):', response.status, response.statusText);
        let result;
        try {
            result = await response.json();
            console.log('Admin Login Response Body (Frontend - parsed):', result);
        } catch (jsonError) {
            console.error('Error parsing admin login response as JSON (Frontend):', jsonError);
            console.log('Admin Login Raw Response Text (Frontend):', await response.text());
            result = { message: 'Unexpected response from server.' };
        }

        if (response.ok) {
            showMessage(adminLoginMessage, `Admin login successful for ${result.userId}!`, 'success');
            adminLoginForm.reset();
            // Store session data
            sessionStorage.setItem('userRole', 'admin');
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));


            adminDashboard.classList.remove('hidden');
            adminDashboard.style.animation = 'fadeInUp 0.5s ease';
            fetchAdminEmployees(); // Fetch and display employees for admin
        } else {
            showMessage(adminLoginMessage, `Error: ${result.message || 'Invalid credentials.'}`, 'error');
            adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">Log in as admin to view and manage employee data.</p>';
        }
    } catch (error) {
        console.error('Admin login failed (Frontend - Network or unexpected error):', error);
        showMessage(adminLoginMessage, 'An error occurred during login. Please try again.', 'error');
        adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">Log in as admin to view and manage employee data.</p>';
    }
});

// Function to fetch and display employees for admin dashboard
async function fetchAdminEmployees() {
    // Only fetch if currently on the admin tab and user is an admin
    if (currentActiveTab === 'admin' && sessionStorage.getItem('userRole') === 'admin') {
        try {
            const usersResponse = await fetch('/api/admin/users');
            const usersResult = await usersResponse.json();

            if (usersResponse.ok && usersResult && usersResult.length > 0) {
                displayUsersInTable(adminUsersDisplay, usersResult, true);
            } else {
                adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">No employee data found for admin to view.</p>';
            }
        } catch (error) {
            console.error('Error fetching employees for admin dashboard:', error);
            adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500 text-red-500">Error loading employee data.</p>';
            showMessage(adminLoginMessage, 'Failed to load employee data. Please try again.', 'error');
        }
    }
}

// Function to display the logged-in employee's profile
function displayLoggedInEmployeeProfile() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (loggedInUser && currentActiveTab === 'login' && sessionStorage.getItem('userRole') === 'employee') {
        loggedInUserDisplay.innerHTML = `
            <h4 class="text-indigo-700 font-semibold mb-2">${loggedInUser.fullName} (${loggedInUser.userId})</h4>
            <p><strong>Role:</strong> ${loggedInUser.role}</p>
            <p><strong>Designation:</strong> ${loggedInUser.designation}</p>
            <p><strong>Department:</strong> ${loggedInUser.department}</p>
            <p><strong>Educational Qualifications:</strong> UG: ${loggedInUser.educationalQualifications.ug}, PG: ${loggedInUser.educationalQualifications.pg}, PhD: ${loggedInUser.educationalQualifications.phd}</p>
            <p><strong>Date of Birth:</strong> ${formatDate(loggedInUser.dateOfBirth)}</p>
            <p><strong>Date of Joining:</strong> ${formatDate(loggedInUser.dateOfJoining)}</p>
            <p><strong>Previous Experience (raw dates):</strong> From: ${formatDate(loggedInUser.previousExperience.fromDate)}, To: ${formatDate(loggedInUser.previousExperience.toDate)}</p>
            <p><strong>Previous Experience (duration):</strong> ${formatDuration(loggedInUser.previousExperience)}</p>
            <p><strong>Total Age:</strong> ${formatDuration(loggedInUser.totalAge)}</p>
            <p><strong>Current Experience:</strong> ${formatDuration(loggedInUser.currentExperience)}</p>
            <p><strong>Total Experience:</strong> ${formatDuration(loggedInUser.totalExperience)}</p>
        `;
        loggedInUserDisplay.style.animation = 'fadeInUp 0.5s ease';
    } else {
        loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>';
    }
}


// Function to open the update modal with animation
const openUpdateModal = (user) => {
    updateUserModal.style.display = 'flex';
    updateUserModal.style.animation = 'fadeIn 0.3s ease';
    hideMessage(updateMessage);

    document.getElementById('updateUserIdHidden').value = user.userId;
    document.getElementById('updateFullName').value = user.fullName;
    document.getElementById('updateDesignation').value = user.designation;
    document.getElementById('updateDepartment').value = user.department;
    document.getElementById('updateUG').value = user.educationalQualifications.ug;
    document.getElementById('updatePG').value = user.educationalQualifications.pg;
    document.getElementById('updatePhD').value = user.educationalQualifications.phd;
    document.getElementById('updateDateOfBirth').value = formatForInputDate(user.dateOfBirth);
    document.getElementById('updateDateOfJoining').value = formatForInputDate(user.dateOfJoining);
    document.getElementById('updatePrevFromDate').value = formatForInputDate(user.previousExperience.fromDate);
    document.getElementById('updatePrevToDate').value = formatForInputDate(user.previousExperience.toDate);
    document.getElementById('updatePassword').value = ''; // Clear password field for security
};

// Function to close the update modal with animation
closeButton.addEventListener('click', () => {
    updateUserModal.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => updateUserModal.style.display = 'none', 300);
});

// Close modal if clicked outside of content
window.addEventListener('click', (event) => {
    if (event.target === updateUserModal) {
        updateUserModal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => updateUserModal.style.display = 'none', 300);
    }
});

// Handle Update User Form Submission
updateUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(updateMessage);

    const userIdToUpdate = document.getElementById('updateUserIdHidden').value;
    const updatedData = {
        fullName: document.getElementById('updateFullName').value,
        designation: document.getElementById('updateDesignation').value,
        educationalQualifications: {
            ug: document.getElementById('updateUG').value,
            pg: document.getElementById('updatePG').value,
            phd: document.getElementById('updatePhD').value,
        },
        department: document.getElementById('updateDepartment').value,
        dateOfBirth: document.getElementById('updateDateOfBirth').value,
        dateOfJoining: document.getElementById('updateDateOfJoining').value,
        previousExperience: {
            fromDate: document.getElementById('updatePrevFromDate').value || null,
            toDate: document.getElementById('updatePrevToDate').value || null,
        },
    };

    const newPassword = document.getElementById('updatePassword').value;
    if (newPassword) { // Only send password if it's not empty
        updatedData.password = newPassword;
    }

    try {
        const response = await fetch(`/api/users/${userIdToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        const result = await response.json();
        if (response.ok) {
            showMessage(updateMessage, 'User updated successfully!', 'success');
            // Re-fetch and display employees for admin dashboard after successful update
            await fetchAdminEmployees();
            setTimeout(() => {
                updateUserModal.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => updateUserModal.style.display = 'none', 300);
            }, 1500); // Close modal after 1.5 seconds
        } else {
            showMessage(updateMessage, `Error: ${result.message || 'Failed to update user.'}`, 'error');
        }
    } catch (error) {
        console.error('Update failed:', error);
        showMessage(updateMessage, 'An error occurred during update. Please try again.', 'error');
    }
});

// Function to delete a user
const deleteUser = async (userId) => {
    const confirmDelete = await showCustomConfirm(`Are you sure you want to delete user ${userId}?`);
    if (!confirmDelete) {
        return; // User cancelled
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            await showCustomAlert('User deleted successfully!', 'success');
            // Re-fetch and display employees for admin dashboard after successful deletion
            await fetchAdminEmployees();
        } else {
            const errorResult = await response.json();
            await showCustomAlert(`Error deleting user: ${errorResult.message || 'Failed to delete user.'}`, 'error');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        await showCustomAlert('An error occurred during deletion. Please try again.', 'error');
    }
};

// Custom Alert/Confirm functions with animations (these are created dynamically)
function showCustomAlert(message, type = 'info') {
    return new Promise(resolve => {
        const alertModal = document.createElement('div');
        alertModal.className = 'modal';
        alertModal.style.display = 'flex';

        alertModal.innerHTML = `
            <div class="modal-content max-w-sm mx-auto p-6 text-center">
                <h3 class="text-xl font-bold mb-4 ${type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-blue-600')}">${type === 'error' ? 'Error' : (type === 'success' ? 'Success' : 'Info')}</h3>
                <p class="mb-6">${message}</p>
                <button class="action-button" id="customAlertOk">OK</button>
            </div>
        `;
        document.body.appendChild(alertModal);
        alertModal.querySelector('.modal-content').style.animation = 'scaleIn 0.3s ease forwards';

        document.getElementById('customAlertOk').addEventListener('click', () => {
            alertModal.querySelector('.modal-content').style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(alertModal);
                resolve(true);
            }, 300);
        });
    });
}

function showCustomConfirm(message) {
    return new Promise(resolve => {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal';
        confirmModal.style.display = 'flex';

        confirmModal.innerHTML = `
            <div class="modal-content max-w-sm mx-auto p-6 text-center">
                <h3 class="text-xl font-bold mb-4 text-orange-600">Confirmation</h3>
                <p class="mb-6">${message}</p>
                <div class="flex justify-center space-x-4">
                    <button class="action-button flex-1" id="customConfirmYes">Yes</button>
                    <button class="action-button bg-gray-500 hover:bg-gray-600 flex-1" id="customConfirmNo">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
        confirmModal.querySelector('.modal-content').style.animation = 'scaleIn 0.3s ease forwards';

        document.getElementById('customConfirmYes').addEventListener('click', () => {
            confirmModal.querySelector('.modal-content').style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(confirmModal);
                resolve(true);
            }, 300);
        });

        document.getElementById('customConfirmNo').addEventListener('click', () => {
            confirmModal.querySelector('.modal-content').style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(confirmModal);
                resolve(false);
            }, 300);
        });
    });
}

// Add event listeners to navigation tabs with animation
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        activateTab(tab.dataset.tab);
    });
});

// Initial tab activation on load with animation
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in from previous session
    const userRole = sessionStorage.getItem('userRole');
    if (userRole === 'admin') {
        activateTab('admin');
    } else if (userRole === 'employee') {
        activateTab('login');
    } else {
        activateTab(currentActiveTab); // Default to home if not logged in
    }
});
