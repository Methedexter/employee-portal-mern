// frontend/script.js
// This is the main entry point for the frontend application.
// It imports and initializes other modularized components.

import { setupNavigation, activateTab } from './handlers/navigation.js';
import { setupAuthForms } from './handlers/authForms.js';
import { isLoggedIn, getUserRole, clearSession } from './utils/sessionManager.js';
import { loadAdminDashboard } from './handlers/adminDashboard.js'; // Import to use after admin login
import { displayLoggedInEmployeeProfile } from './handlers/employeeProfile.js'; // Import to use after employee login


// Define your API base URL (can be moved to a config file if more complex)
const API_BASE_URL = 'http://localhost:5000/api';

// Dynamically create and append the logout button to the navigation bar.
const logoutButton = document.createElement('div');
logoutButton.id = 'logout-button';
logoutButton.className = 'nav-tab hidden'; // Initially hidden
logoutButton.textContent = 'Logout';
// Append to the navTabs container
const navTabsContainer = document.getElementById('navTabs');
if (navTabsContainer) {
    navTabsContainer.appendChild(logoutButton);
} else {
    console.error('Navigation tabs container (id="navTabs") not found on script load.');
}


// Get references to the admin and employee login navigation links
const adminLink = document.querySelector('.nav-tab[data-tab="admin"]');
const employeeLoginLink = document.querySelector('.nav-tab[data-tab="login"]');


/**
 * Handles the user logout action.
 * Clears session data, hides the logout button, shows login links,
 * and redirects to the home tab.
 */
const handleLogout = () => {
    console.log('Logout initiated.');
    clearSession(); // Clear all user session data from sessionStorage
    logoutButton.classList.add('hidden'); // Hide the logout button
    if (adminLink) adminLink.classList.remove('hidden'); // Show Admin tab
    if (employeeLoginLink) employeeLoginLink.classList.remove('hidden'); // Show Employee Login tab

    // Reset dashboard visibility
    document.getElementById('adminDashboard')?.classList.add('hidden');
    document.getElementById('adminLoginForm')?.classList.remove('hidden');
    document.getElementById('employeeDashboard')?.classList.add('hidden');
    document.getElementById('employeeLoginForm')?.classList.remove('hidden');


    activateTab('home'); // Redirect user to the home page
    console.log('User logged out successfully. Redirecting to home.');
};

// Add event listener to the dynamically created logout button
if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
    console.log('Logout button click listener attached.');
}

// Event listener for when the DOM content is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Starting script initialization.');

    // Initialize navigation functionality
    setupNavigation();
    console.log('DOMContentLoaded: setupNavigation called.');

    // Initialize authentication form handling (registration, login)
    // Pass API_BASE_URL to the authForms module
    setupAuthForms(API_BASE_URL);
    console.log('DOMContentLoaded: setupAuthForms called.');

    // Check for existing login session on page load
    if (isLoggedIn()) {
        const role = getUserRole();
        console.log(`DOMContentLoaded: User is logged in as ${role}.`);
        
        // Show logout button and hide login/admin links regardless of role
        logoutButton.classList.remove('hidden');
        if (adminLink) adminLink.classList.add('hidden');
        if (employeeLoginLink) employeeLoginLink.classList.add('hidden');

        if (role === 'admin') {
            // If admin, activate admin tab and ensure dashboard is loaded
            activateTab('admin');
            document.getElementById('adminDashboard')?.classList.remove('hidden');
            document.getElementById('adminLoginForm')?.classList.add('hidden');
            loadAdminDashboard(API_BASE_URL); // Load data for admin dashboard
        } else if (role === 'employee') {
            // If employee, activate employee login tab (to show profile) and ensure profile is loaded
            activateTab('login');
            document.getElementById('employeeDashboard')?.classList.remove('hidden');
            document.getElementById('employeeLoginForm')?.classList.add('hidden');
            displayLoggedInEmployeeProfile(); // Display employee profile
        }
    } else {
        console.log('DOMContentLoaded: No user logged in. Defaulting to home tab.');
        activateTab('home');
    }

    // Handle company logo click to go home
    const companyLogo = document.getElementById('companyLogo');
    if (companyLogo) {
        companyLogo.addEventListener('click', () => {
            console.log('Company logo clicked. Activating home tab.');
            activateTab('home'); // Use the activateTab function from navigation.js
        });
    }
});

// Expose these functions globally if needed for some forms/elements
// (though direct imports are preferred for modularity)
window.loadAdminDashboard = loadAdminDashboard;
window.displayLoggedInEmployeeProfile = displayLoggedInEmployeeProfile;
