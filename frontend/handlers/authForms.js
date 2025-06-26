// frontend/handlers/authForms.js
// This module handles form submissions for user registration, employee login, and admin login.

import { setSession } from '../utils/sessionManager.js';
import { activateTab } from './navigation.js'; // To activate specific tabs after login/registration
import { showCustomAlert } from '../utils/modals.js'; // Import showCustomAlert for errors
import { createPreviousExperienceFields } from '../utils/utils.js'; // Import utility for dynamic fields

// Get references to the relevant DOM elements
const registrationForm = document.getElementById('registrationForm');
const employeeLoginForm = document.getElementById('employeeLoginForm');
const adminLoginForm = document.getElementById('adminLoginForm');

// Dashboards and display areas that need to be shown/hidden
const adminDashboard = document.getElementById('adminDashboard');
const employeeDashboard = document.getElementById('employeeDashboard');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay'); // For employee profile content

// Elements for dynamic previous experience fields (Registration Form)
const regPreviousExperienceContainer = document.getElementById('regPreviousExperienceContainer');
const addMorePrevExpRegButton = document.getElementById('addMorePrevExpReg');
let regPrevExpCount = 0; // Keep track of the number of previous experience entries for registration

let API_BASE_URL_GLOBAL; // To store the base URL passed from script.js

/**
 * Sets up event listeners for all authentication forms (Registration, Employee Login, Admin Login).
 * @param {string} apiBaseUrl - The base URL for API requests.
 */
export const setupAuthForms = (apiBaseUrl) => {
    API_BASE_URL_GLOBAL = apiBaseUrl;

    // Initialize one previous experience field on load for registration if none exist
    if (regPreviousExperienceContainer && addMorePrevExpRegButton) {
        if (regPreviousExperienceContainer.querySelectorAll('.previous-experience-entry').length === 0) {
             createPreviousExperienceFields(regPreviousExperienceContainer, regPrevExpCount++, {}, 'reg');
        }
        addMorePrevExpRegButton.addEventListener('click', () => {
            createPreviousExperienceFields(regPreviousExperienceContainer, regPrevExpCount++, {}, 'reg');
        });
    }

    // --- Registration Form Submission ---
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission and page reload

            const selectedRole = document.querySelector('input[name="role"]:checked')?.value;
            if (!selectedRole) {
                await showCustomAlert('Error', 'Please select a role (Employee or Admin) for registration.', 'error');
                return;
            }

            // Collect dynamic previous experience data
            const previousExperienceEntries = [];
            document.querySelectorAll('#regPreviousExperienceContainer .previous-experience-entry').forEach(entry => {
                const fromDateInput = entry.querySelector('input[name^="regPrevFromDate_"]');
                const toDateInput = entry.querySelector('input[name^="regPrevToDate_"]');
                const fromDate = fromDateInput ? fromDateInput.value : '';
                const toDate = toDateInput ? toDateInput.value : '';

                // Only add if at least one date is provided, allowing backend validation to catch incomplete pairs
                if (fromDate || toDate) {
                    previousExperienceEntries.push({
                        fromDate: fromDate || null, // Ensure null if empty
                        toDate: toDate || null,     // Ensure null if empty
                    });
                }
            });


            // Collect other form data
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
                previousExperience: previousExperienceEntries, // This is now an array
                password: document.getElementById('regPassword').value,
                role: selectedRole,
            };

            try {
                console.log('Frontend: Sending registration data to:', `${API_BASE_URL_GLOBAL}/users`, formData);
                const response = await fetch(`${API_BASE_URL_GLOBAL}/users`, { // Send data to backend API
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                console.log('Frontend: Registration response status:', response.status, response.statusText);
                const result = await response.json(); // Parse the JSON response from the server
                console.log('Frontend: Registration response body:', result);

                if (response.ok) {
                    // Registration successful - no alert, just reset form
                    await showCustomAlert('Success', 'User registered successfully!', 'success');
                    registrationForm.reset(); // Clear form fields
                    document.querySelector('input[name="role"][value="employee"]').checked = true; // Reset radio button to default 'employee'
                    // Clear and reset previous experience fields
                    regPreviousExperienceContainer.querySelectorAll('.previous-experience-entry').forEach(entry => entry.remove());
                    regPrevExpCount = 0;
                    createPreviousExperienceFields(regPreviousExperienceContainer, regPrevExpCount++, {}, 'reg'); // Add initial field back
                } else {
                    // Display error message from server
                    await showCustomAlert('Registration Error', result.message || 'Failed to register user.', 'error');
                }
            }
            catch (error) {
                console.error('Frontend: Registration failed (Network or unexpected error):', error);
                await showCustomAlert('Error', 'An unexpected error occurred during registration. Please try again.', 'error');
            }
        });
    }

    // --- Employee Login Form Submission ---
    if (employeeLoginForm) {
        employeeLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Authenticating...</p>'; // Show loading state
            employeeDashboard.classList.add('hidden'); // Hide dashboard until successful login

            const userId = document.getElementById('empLoginUserId').value;
            const password = document.getElementById('empLoginPassword').value;

            try {
                console.log('Frontend: Employee Login attempt for User ID:', userId);
                const response = await fetch(`${API_BASE_URL_GLOBAL}/employee/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, password }),
                });

                console.log('Frontend: Employee Login response status:', response.status, response.statusText);
                let result;
                try {
                    result = await response.json(); // Attempt to parse JSON response
                    console.log('Frontend: Employee Login response body (parsed):', result);
                } catch (jsonError) {
                    // Handle cases where the response is not valid JSON (e.g., server crash)
                    console.error('Frontend: Error parsing employee login response as JSON:', jsonError);
                    console.log('Frontend: Employee Login Raw Response Text:', await response.text());
                    result = { message: 'Unexpected server response format.' };
                }

                if (response.ok) {
                    // Login successful - no alert, just redirect and display profile
                    await showCustomAlert('Success', 'Employee login successful!', 'success');
                    employeeLoginForm.reset(); // Clear login form fields
                    setSession('employee', result.user); // Store user role and data in session storage

                    employeeDashboard.classList.remove('hidden'); // Show employee dashboard
                    employeeDashboard.style.animation = 'fadeInUp 0.5s ease'; // Apply animation
                    // Call the function from employeeProfile.js to display the profile
                    window.displayLoggedInEmployeeProfile(); // Using window scope as script.js sets it global
                    activateTab('login'); // Keep the 'Employee Login' tab active, now showing the profile
                    
                    // Show logout button and hide login/admin links
                    document.getElementById('logout-button')?.classList.remove('hidden');
                    document.querySelector('.nav-tab[data-tab="admin"]')?.classList.add('hidden');
                    document.querySelector('.nav-tab[data-tab="login"]')?.classList.add('hidden');

                } else {
                    // Display server's error message
                    await showCustomAlert('Login Error', result.message || 'Invalid credentials or access denied.', 'error');
                    loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>'; // Reset profile display
                }
            } catch (error) {
                console.error('Frontend: Employee login failed (Network or unexpected error):', error);
                await showCustomAlert('Error', 'An unexpected error occurred during employee login. Please try again.', 'error');
                loggedInUserDisplay.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>';
            }
        });
    }

    // --- Admin Login Form Submission ---
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('adminUsersDisplay').innerHTML = '<p class="text-center text-gray-500">Authenticating...</p>'; // Show loading state
            adminDashboard.classList.add('hidden'); // Hide dashboard until successful login

            const userId = document.getElementById('adminUserId').value;
            const password = document.getElementById('adminPassword').value;

            try {
                console.log('Frontend: Admin Login attempt for User ID:', userId);
                const response = await fetch(`${API_BASE_URL_GLOBAL}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, password }),
                });

                console.log('Frontend: Admin Login response status:', response.status, response.statusText);
                let result;
                try {
                    result = await response.json();
                    console.log('Frontend: Admin Login response body (parsed):', result);
                } catch (jsonError) {
                    console.error('Frontend: Error parsing admin login response as JSON:', jsonError);
                    console.log('Frontend: Admin Login Raw Response Text:', await response.text());
                    result = { message: 'Unexpected server response format.' };
                }

                if (response.ok) {
                    // Login successful - no alert, just redirect and display dashboard
                    await showCustomAlert('Success', 'Admin login successful!', 'success');
                    adminLoginForm.reset(); // Clear login form fields
                    setSession('admin', result.user); // Store admin role and data in session storage

                    adminDashboard.classList.remove('hidden'); // Show admin dashboard
                    adminDashboard.style.animation = 'fadeInUp 0.5s ease'; // Apply animation
                    // Call the function from adminDashboard.js to load employees
                    window.loadAdminDashboard(); // Using window scope as script.js sets it global
                    activateTab('admin'); // Keep the 'Admin' tab active, now showing the dashboard

                    // Show logout button and hide login/admin links
                    document.getElementById('logout-button')?.classList.remove('hidden');
                    document.querySelector('.nav-tab[data-tab="admin"]')?.classList.add('hidden');
                    document.querySelector('.nav-tab[data-tab="login"]')?.classList.add('hidden');

                } else {
                    // Display server's error message
                    await showCustomAlert('Login Error', result.message || 'Invalid credentials or access denied.', 'error');
                    document.getElementById('adminUsersDisplay').innerHTML = '<p class="text-center text-gray-500">Log in as admin to view and manage employee data.</p>'; // Reset dashboard display
                }
            } catch (error) {
                console.error('Frontend: Admin login failed (Network or unexpected error):', error);
                await showCustomAlert('Error', 'An unexpected error occurred during admin login. Please try again.', 'error');
                document.getElementById('adminUsersDisplay').innerHTML = '<p class="text-center text-gray-500">Log in as admin to view and manage employee data.</p>';
            }
        });
    }
};
