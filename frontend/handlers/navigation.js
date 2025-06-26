// frontend/handlers/navigation.js
// This module handles the navigation between different sections of the application.

import { isLoggedIn, getUserRole } from '../utils/sessionManager.js';
// These imports are for directly triggering the dashboard/profile loads when a tab is activated.
import { loadAdminDashboard } from './adminDashboard.js';
import { displayLoggedInEmployeeProfile } from './employeeProfile.js';

// Get references to main content sections and navigation tabs
const homeSection = document.getElementById('home-section');
const registrationSection = document.getElementById('registration-section');
const adminSection = document.getElementById('admin-section');
const loginSection = document.getElementById('login-section');

const navTabs = document.getElementById('navTabs');

// Mapping of data-tab attributes to their corresponding content sections
const sectionsMap = {
    home: homeSection,
    registration: registrationSection,
    admin: adminSection,
    login: loginSection, // Refers to the Employee Login/Profile tab
};

/**
 * Activates a specific tab and displays its corresponding content section.
 * Hides all other content sections and deactivates other tabs.
 * @param {string} tabName - The data-tab attribute value of the tab to activate.
 */
export const activateTab = async (tabName) => {
    console.log(`activateTab: Attempting to activate tab "${tabName}".`);
    // Deactivate all tabs and hide all content sections first
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    // Activate the selected tab and show its content section
    const targetTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    const targetSection = sectionsMap[tabName];

    if (targetTab && targetSection) {
        targetTab.classList.add('active');
        targetSection.classList.add('active');
        console.log(`activateTab: Tab "${tabName}" and its section activated.`);

        // Special handling for dashboards/profiles if user is logged in
        if (tabName === 'admin') {
            const role = getUserRole();
            const adminDashboardDiv = document.getElementById('adminDashboard');
            const adminLoginForm = document.getElementById('adminLoginForm');

            if (role === 'admin') {
                console.log('activateTab: Admin role detected. Showing admin dashboard.');
                if (adminDashboardDiv) adminDashboardDiv.classList.remove('hidden');
                if (adminLoginForm) adminLoginForm.classList.add('hidden');
                loadAdminDashboard(); // Ensure dashboard content is loaded/refreshed
            } else {
                console.log('activateTab: Not admin. Showing admin login form.');
                if (adminDashboardDiv) adminDashboardDiv.classList.add('hidden');
                if (adminLoginForm) adminLoginForm.classList.remove('hidden');
            }
        } else if (tabName === 'login') { // This is the Employee Login/Profile tab
            const role = getUserRole();
            const employeeDashboardDiv = document.getElementById('employeeDashboard');
            const employeeLoginForm = document.getElementById('employeeLoginForm');

            if (role === 'employee') {
                console.log('activateTab: Employee role detected. Showing employee profile.');
                if (employeeDashboardDiv) employeeDashboardDiv.classList.remove('hidden');
                if (employeeLoginForm) employeeLoginForm.classList.add('hidden');
                displayLoggedInEmployeeProfile(); // Display employee profile
            } else {
                console.log('activateTab: Not employee. Showing employee login form.');
                if (employeeDashboardDiv) employeeDashboardDiv.classList.add('hidden');
                if (employeeLoginForm) employeeLoginForm.classList.remove('hidden');
            }
        }
    } else {
        console.warn(`activateTab: Tab or section not found for tabName: ${tabName}. TargetTab: ${targetTab}, TargetSection: ${targetSection}`);
    }
};

/**
 * Sets up event listeners for navigation tabs.
 * Handles clicking on tabs to switch content sections.
 */
export const setupNavigation = () => {
    console.log('setupNavigation: Function called to attach listeners.');
    if (!navTabs) {
        console.error('setupNavigation: Navigation tabs container (id="navTabs") not found. Cannot attach listeners.');
        return;
    }

    navTabs.addEventListener('click', (event) => {
        console.log('Navigation Click Event Detected on navTabs:', event.target);
        const clickedTab = event.target.closest('.nav-tab'); // Use closest to handle clicks on child elements
        if (clickedTab) {
            const tabName = clickedTab.dataset.tab;
            console.log('Clicked Tab Element:', clickedTab, 'Data-tab:', tabName);
            if (tabName) {
                activateTab(tabName);
            } else {
                console.warn('Clicked tab has no data-tab attribute.');
            }
        } else {
            console.log('Click was not on a nav-tab element.');
        }
    });
    console.log('setupNavigation: Click listener successfully attached to navTabs.');
};
