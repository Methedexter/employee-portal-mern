// frontend/handlers/adminDashboard.js
// This module handles fetching and displaying employee data for the admin dashboard,
// and now also includes the logic for the update user modal.

import { showCustomAlert, showCustomConfirm, openUpdateModal, closeUpdateModal } from '../utils/modals.js';
import { getUserRole } from '../utils/sessionManager.js';
import { formatDateForInput, formatDateDisplay, formatDuration, createPreviousExperienceFields } from '../utils/utils.js'; // Import utilities

// DOM elements specific to the admin dashboard
const adminUsersDisplay = document.getElementById('adminUsersDisplay');

// DOM elements for the update modal
const updateUserForm = document.getElementById('updateUserForm');
const updateUserIdHidden = document.getElementById('updateUserIdHidden'); // Hidden input for user ID
const updateFullName = document.getElementById('updateFullName');
const updateDesignation = document.getElementById('updateDesignation');
const updateDepartment = document.getElementById('updateDepartment');
const updateUG = document.getElementById('updateUG');
const updatePG = document.getElementById('updatePG');
const updatePhD = document.getElementById('updatePhD');
const updateDateOfBirth = document.getElementById('updateDateOfBirth');
const updateDateOfJoining = document.getElementById('updateDateOfJoining');
const updatePreviousExperienceContainer = document.getElementById('updatePreviousExperienceContainer');
const addMorePrevExpUpdateButton = document.getElementById('addMorePrevExpUpdate');
const updatePassword = document.getElementById('updatePassword'); // Password field in update modal

let updatePrevExpCount = 0; // Local counter for dynamic previous experience fields in update modal

// This is the API Base URL used by this module.
// It's assumed that `script.js` will eventually pass this or set a global.
const API_BASE_URL_LOCAL = 'http://localhost:5000/api'; // Or use window.API_BASE_URL if set globally by script.js


/**
 * Fetches all employee data from the backend and displays it in the admin dashboard table.
 * Includes authorization check.
 */
export const loadAdminDashboard = async () => {
    // Basic authorization check: ensure the current user is logged in as an admin.
    if (getUserRole() !== 'admin') {
        await showCustomAlert('Access Denied', 'You must be logged in as an Admin to view this data.', 'error');
        if(adminUsersDisplay) adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">Access Denied. Please log in as an Admin.</p>';
        return;
    }

    // Display a loading message while data is being fetched
    if(adminUsersDisplay) adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">Loading employee data...</p>';

    // --- NEW: Save current scroll position before re-rendering ---
    let scrollPosition = 0;
    if (adminUsersDisplay) {
        scrollPosition = adminUsersDisplay.scrollTop;
    }
    // --- END NEW ---

    try {
        const response = await fetch(`${API_BASE_URL_LOCAL}/admin/users`); // API endpoint to get all employee users
        const users = await response.json(); // Parse the JSON response

        if (!response.ok) {
            // Handle API errors (e.g., server error, unauthenticated)
            await showCustomAlert('Error', `Failed to fetch employees: ${users.message || 'Unknown error'}`, 'error');
            if(adminUsersDisplay) adminUsersDisplay.innerHTML = '<p class="text-center py-4 text-red-500">Error loading data.</p>';
            return;
        }

        if (users.length === 0) {
            // If no employee records are found
            if(adminUsersDisplay) adminUsersDisplay.innerHTML = '<p class="text-center text-gray-500">No employee records found.</p>';
            return;
        }

        renderUsersTable(users); // Render the table with fetched users

        // --- NEW: Restore scroll position after re-rendering ---
        if (adminUsersDisplay) {
            adminUsersDisplay.scrollTop = scrollPosition;
        }
        // --- END NEW ---

    } catch (error) {
        console.error('Error fetching employees for admin dashboard:', error);
        await showCustomAlert('Error', 'An unexpected error occurred while fetching employee data. Check network connection.', 'error');
        if(adminUsersDisplay) adminUsersDisplay.innerHTML = '<p class="text-center py-4 text-red-500">Network error or server issue.</p>';
    }
};

/**
 * Renders the employee data into the admin dashboard table.
 * @param {Array<object>} users - Array of user objects.
 */
function renderUsersTable(users) {
    if (!adminUsersDisplay) {
        console.error('adminUsersDisplay element not found.');
        return;
    }
    
    let tableHtml = `
        <div class="user-table-container">
            <table class="user-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Full Name</th>
                        <th>Designation</th>
                        <th class="dept-col">Dept.</th>
                        <th>UG</th>
                        <th>PG</th>
                        <th>PhD</th>
                        <th>D.O.B</th>
                        <th>Age</th>
                        <th>D.O.J</th>
                        <th>Prev. Exp.</th>
                        <th>Total Exp.</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach(user => {
        const totalAge = formatDuration(user.totalAge);
        const totalExperience = formatDuration(user.totalExperience);
        const totalPreviousExperience = formatDuration(user.totalPreviousExperience);
        
        tableHtml += `
            <tr>
                <td>${user.userId}</td>
                <td>${user.fullName}</td>
                <td>${user.designation}</td>
                <td class="dept-col">${user.department}</td>
                <td>${user.educationalQualifications.ug}</td>
                <td>${user.educationalQualifications.pg}</td>
                <td>${user.educationalQualifications.phd}</td>
                <td>${formatDateDisplay(user.dateOfBirth)}</td>
                <td>${totalAge}</td>
                <td>${formatDateDisplay(user.dateOfJoining)}</td>
                <td>${totalPreviousExperience}</td>
                <td>${totalExperience}</td>
                <td>
                    <button class="update-button" data-user-id="${user.userId}">Update</button>
                    <button class="delete-button" data-user-id="${user.userId}">Delete</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    adminUsersDisplay.innerHTML = tableHtml;

    // Attach event listeners to the dynamically created buttons
    adminUsersDisplay.querySelectorAll('.update-button').forEach(button => {
        button.addEventListener('click', (e) => handleOpenUpdateModal(e.target.dataset.userId));
    });

    adminUsersDisplay.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => handleDeleteUser(e.target.dataset.userId));
    });
}

/**
 * Handles opening the update user modal. This function fetches the specific user data
 * and populates the modal before showing it.
 * @param {string} userId - The ID of the user to fetch and update.
 */
async function handleOpenUpdateModal(userId) {
    try {
        const response = await fetch(`${API_BASE_URL_LOCAL}/users/${userId}`);
        const user = await response.json();

        if (!response.ok) {
            await showCustomAlert('Error', user.message || 'Failed to fetch user data for update.', 'error');
            return;
        }

        // Populate modal fields
        updateUserIdHidden.value = user.userId || '';
        updateFullName.value = user.fullName || '';
        updateDesignation.value = user.designation || '';
        updateDepartment.value = user.department || '';
        updateUG.value = user.educationalQualifications?.ug || '';
        updatePG.value = user.educationalQualifications?.pg || '';
        updatePhD.value = user.educationalQualifications?.phd || '';
        updateDateOfBirth.value = formatDateForInput(user.dateOfBirth);
        updateDateOfJoining.value = formatDateForInput(user.dateOfJoining);
        updatePassword.value = ''; // Always clear password field on open for security

        // Clear and repopulate previous experience fields
        updatePreviousExperienceContainer.innerHTML = `<h4 class="text-lg font-semibold mb-3">Previous Experience(s)</h4>`;
        updatePrevExpCount = 0; // Reset counter for new modal population

        // Re-add the "Add More Experience" button
        const addMoreButtonHTML = `<button type="button" id="addMorePrevExpUpdate" class="action-button mt-4 px-6 py-2 text-base">Add More Experience</button>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = addMoreButtonHTML;
        updatePreviousExperienceContainer.appendChild(tempDiv.firstChild);

        // Attach listener to the newly added "Add More Experience" button
        document.getElementById('addMorePrevExpUpdate').onclick = () => {
            createPreviousExperienceFields(updatePreviousExperienceContainer, updatePrevExpCount++, {}, 'update');
        };

        if (Array.isArray(user.previousExperience) && user.previousExperience.length > 0) {
            user.previousExperience.forEach(exp => {
                createPreviousExperienceFields(updatePreviousExperienceContainer, updatePrevExpCount++, {
                    fromDate: formatDateForInput(exp.fromDate),
                    toDate: formatDateForInput(exp.toDate)
                }, 'update');
            });
        } else {
            // Add at least one empty field if no previous experience
            createPreviousExperienceFields(updatePreviousExperienceContainer, updatePrevExpCount++, {}, 'update');
        }

        // Show the update modal
        openUpdateModal();

    } catch (error) {
        console.error('Error in handleOpenUpdateModal:', error);
        await showCustomAlert('Error', 'An error occurred loading user data for the update form.', 'error');
    }
}

// Attach event listeners for the update modal form submission and the "Add More" button
document.addEventListener('DOMContentLoaded', () => {
    if (updateUserForm) {
        updateUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userIdToUpdate = updateUserIdHidden.value;
            
            // Collect dynamic previous experience data from the update form
            const previousExperienceEntries = [];
            // Select inputs specific to the update modal, using dynamically generated names
            document.querySelectorAll('#updatePreviousExperienceContainer .previous-experience-entry').forEach(entry => {
                const fromDateInput = entry.querySelector('input[name^="updatePrevFromDate_"]');
                const toDateInput = entry.querySelector('input[name^="updatePrevToDate_"]');
                const fromDate = fromDateInput ? fromDateInput.value : '';
                const toDate = toDateInput ? toDateInput.value : '';

                if (fromDate || toDate) { // Only add if at least one date is provided
                    previousExperienceEntries.push({
                        fromDate: fromDate || null,
                        toDate: toDate || null,
                    });
                }
            });

            const updatedData = {
                fullName: updateFullName.value,
                designation: updateDesignation.value,
                educationalQualifications: {
                    ug: updateUG.value,
                    pg: updatePG.value,
                    phd: updatePhD.value,
                },
                department: updateDepartment.value,
                dateOfBirth: updateDateOfBirth.value,
                dateOfJoining: updateDateOfJoining.value,
                previousExperience: previousExperienceEntries,
            };

            const newPassword = updatePassword.value;
            if (newPassword !== '') {
                updatedData.password = newPassword;
            } else {
                delete updatedData.password; // Don't send empty password if user didn't change it
            }

            try {
                const response = await fetch(`${API_BASE_URL_LOCAL}/users/${userIdToUpdate}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                const result = await response.json();
                if (response.ok) {
                    await showCustomAlert('Success', 'User updated successfully!', 'success');
                    closeUpdateModal(); // Close the modal
                    loadAdminDashboard(); // Refresh the dashboard table
                } else {
                    await showCustomAlert('Update Error', result.message || 'Failed to update user.', 'error');
                }
            } catch (error) {
                console.error('Frontend: Update failed (Network or unexpected error):', error);
                await showCustomAlert('Error', 'An unexpected error occurred during update. Please try again.', 'error');
            }
        });
    }

    if (addMorePrevExpUpdateButton) {
        addMorePrevExpUpdateButton.addEventListener('click', () => {
            createPreviousExperienceFields(updatePreviousExperienceContainer, updatePrevExpCount++, {}, 'update');
        });
    }
});


/**
 * Deletes a user record from the system.
 * Prompts for confirmation before proceeding with deletion.
 * @param {string} userId - The ID of the user to delete.
 */
async function handleDeleteUser(userId) {
    const confirmDelete = await showCustomConfirm('Confirm Deletion', `Are you sure you want to delete user with ID: ${userId}? This action cannot be undone.`, 'warning');
    if (!confirmDelete) {
        return; // If user cancels, stop the deletion process
    }

    try {
        const response = await fetch(`${API_BASE_URL_LOCAL}/users/${userId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            await showCustomAlert('Success', `User ${userId} deleted successfully!`, 'success');
            loadAdminDashboard(); // Refresh the employee table after successful deletion
        } else {
            const errorResult = await response.json();
            await showCustomAlert('Error', `Error deleting user: ${errorResult.message || 'Failed to delete user.'}`, 'error');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        await showCustomAlert('Error', 'An error occurred during deletion. Please try again.', 'error');
    }
}
