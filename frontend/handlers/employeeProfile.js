// frontend/handlers/employeeProfile.js
// This module handles the display of the logged-in employee's profile details.

import { getLoggedInUser, getUserRole } from '../utils/sessionManager.js';
import { showCustomAlert } from '../utils/modals.js'; // Import showCustomAlert for errors
import { formatDateDisplay, formatDuration } from '../utils/utils.js'; // Import utility for formatting

// DOM element to display employee profile details
const employeeProfileDetails = document.getElementById('loggedInUserDisplay');

/**
 * Displays the logged-in employee's profile details in the UI.
 * Performs an authorization check and retrieves user data from session storage.
 */
export const displayLoggedInEmployeeProfile = async () => {
    const loggedInUser = getLoggedInUser(); // Retrieve user object from session storage
    const currentUserRole = getUserRole(); // Retrieve user role from session storage

    // Authorization check: Ensure a user is logged in AND their role is 'employee'.
    if (!loggedInUser || currentUserRole !== 'employee') {
        await showCustomAlert('Access Denied', 'You must be logged in as an Employee to view your profile.', 'error');
        // Activate login tab in navigation to prompt for login, but avoid circular import here.
        // Instead, the calling context (e.g., script.js) should handle navigation redirect.
        console.warn('Unauthorized access attempt to employee profile. Redirecting might be needed.');
        // Clear the display
        if (employeeProfileDetails) employeeProfileDetails.innerHTML = '<p class="text-center text-gray-500">Log in to view your profile.</p>';
        return;
    }

    if (!employeeProfileDetails) {
        console.error('Employee profile display element not found (id="loggedInUserDisplay").');
        return;
    }

    employeeProfileDetails.innerHTML = ''; // Clear any previous content or loading messages
    employeeProfileDetails.style.animation = 'fadeInUp 0.5s ease'; // Apply an animation for smooth display

    // Generate HTML for multiple previous experiences
    let previousExperienceHtml = '<p class="font-semibold mt-4"><strong>Previous Experience:</strong></p>';
    if (Array.isArray(loggedInUser.previousExperience) && loggedInUser.previousExperience.length > 0) {
        loggedInUser.previousExperience.forEach((exp, index) => {
            const fromDate = exp.fromDate ? formatDateDisplay(exp.fromDate) : 'N/A';
            const toDate = exp.toDate ? formatDateDisplay(exp.toDate) : 'N/A';
            const durationText = (exp.years || exp.months || exp.days) ? ` (${formatDuration(exp)})` : '';
            previousExperienceHtml += `
                <p class="ml-4">- From: ${fromDate}, To: ${toDate}${durationText}</p>
            `;
        });
    } else {
        previousExperienceHtml += '<p class="ml-4">None</p>';
    }


    // Populate the employee profile display area with user details.
    employeeProfileDetails.innerHTML = `
        <div class="space-y-3 p-4 border rounded-lg bg-white shadow-md">
            <h4 class="text-indigo-700 font-semibold mb-2 text-xl">${loggedInUser.fullName} (${loggedInUser.userId})</h4>
            <p><strong>Role:</strong> <span class="text-gray-700">${loggedInUser.role.charAt(0).toUpperCase() + loggedInUser.role.slice(1)}</span></p>
            <p><strong>Designation:</strong> <span class="text-gray-700">${loggedInUser.designation}</span></p>
            <p><strong>Department:</strong> <span class="text-gray-700">${loggedInUser.department}</span></p>
            <p><strong>Educational Qualifications:</strong>
                <span class="text-gray-700">UG: ${loggedInUser.educationalQualifications.ug || 'N/A'},
                PG: ${loggedInUser.educationalQualifications.pg || 'N/A'},
                PhD: ${loggedInUser.educationalQualifications.phd || 'N/A'}</span></p>
            <p><strong>Date of Birth:</strong> <span class="text-gray-700">${formatDateDisplay(loggedInUser.dateOfBirth)}</span></p>
            <p><strong>Date of Joining:</strong> <span class="text-gray-700">${formatDateDisplay(loggedInUser.dateOfJoining)}</span></p>
            ${previousExperienceHtml} <!-- Insert dynamically generated HTML for previous experiences -->
            <p><strong>Total Age:</strong> <span class="text-gray-700">${formatDuration(loggedInUser.totalAge)}</span></p>
            <p><strong>Current Experience:</strong> <span class="text-gray-700">${formatDuration(loggedInUser.currentExperience)}</span></p>
            <p><strong>Total Experience:</strong> <span class="text-gray-700">${formatDuration(loggedInUser.totalExperience)}</span></p>
        </div>
    `;
};
