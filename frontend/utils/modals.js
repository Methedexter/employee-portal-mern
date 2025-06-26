// frontend/utils/modals.js
// This module handles the logic for custom alert/confirm dialogs and the update user modal.

import { createPreviousExperienceFields } from './utils.js'; // Import utility for previous experience fields
import { formatDateForInput } from './utils.js'; // Also used by openUpdateModal for date formatting

// DOM elements for the custom alert/confirm modal
const customAlertConfirmModal = document.getElementById('customAlertConfirmModal');
const customAlertConfirmTitle = document.getElementById('customAlertConfirmTitle');
const customAlertConfirmMessage = document.getElementById('customAlertConfirmMessage');
const customAlertConfirmOkBtn = document.getElementById('customAlertConfirmOkBtn');
const customAlertConfirmCancelBtn = document.getElementById('customAlertConfirmCancelBtn');
const customAlertConfirmClose = document.getElementById('customAlertConfirmClose');

// DOM elements for the update user modal
const updateUserModal = document.getElementById('updateUserModal');
const updateUserModalCloseButton = document.querySelector('#updateUserModal .close-button'); // Use a more specific selector
const updatePreviousExperienceContainer = document.getElementById('updatePreviousExperienceContainer'); // For cleaning up on close

// Global variables to store the promise resolvers for custom alerts/confirms
let currentAlertResolver = null;
let currentConfirmResolver = null;

// Ensure modal elements exist before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
    // --- Custom Alert/Confirm Modal Logic ---
    if (customAlertConfirmModal && customAlertConfirmOkBtn && customAlertConfirmCancelBtn && customAlertConfirmClose) {
        customAlertConfirmClose.addEventListener('click', () => {
            closeCustomAlertConfirm(false); // Treat closing via X as a cancel
        });

        window.addEventListener('click', (event) => {
            if (event.target === customAlertConfirmModal) {
                closeCustomAlertConfirm(false); // Treat click outside as cancel
            }
        });
    } else {
        console.warn('Custom alert/confirm modal DOM elements not found. Custom alerts/confirms might not work.');
    }

    // --- Update User Modal Logic ---
    if (updateUserModal && updateUserModalCloseButton) {
        updateUserModalCloseButton.addEventListener('click', () => {
            closeUpdateModal();
        });

        window.addEventListener('click', (event) => {
            if (event.target === updateUserModal) {
                closeUpdateModal();
            }
        });
    } else {
        console.warn('Update user modal DOM elements not found. Update modal features might not work.');
    }

    // --- ESCAPE KEY LISTENER (NEW) ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // Check if any modal is currently visible and close it
            if (customAlertConfirmModal && customAlertConfirmModal.style.display === 'flex') {
                closeCustomAlertConfirm(false); // For alerts, this resolves the promise
            } else if (updateUserModal && updateUserModal.style.display === 'flex') {
                closeUpdateModal();
            }
        }
    });
});

/**
 * Helper function to close the custom alert/confirm modal and resolve its promise.
 * @param {boolean} result - The result to resolve the promise with (true for OK, false for Cancel/Escape).
 */
function closeCustomAlertConfirm(result) {
    if (customAlertConfirmModal) {
        customAlertConfirmModal.style.display = 'none';
        // Resolve the correct promise based on which modal was open
        if (currentAlertResolver) {
            currentAlertResolver(result);
            currentAlertResolver = null;
        } else if (currentConfirmResolver) {
            currentConfirmResolver(result);
            currentConfirmResolver = null;
        }
        // Remove event listeners to prevent multiple resolutions if the modal is reused quickly
        customAlertConfirmOkBtn.removeEventListener('click', okClickHandler);
        customAlertConfirmCancelBtn.removeEventListener('click', cancelClickHandler);
        customAlertConfirmClose.removeEventListener('click', closeClickHandler);
    }
}

// Named functions for event listeners to allow easy removal
function okClickHandler() { closeCustomAlertConfirm(true); }
function cancelClickHandler() { closeCustomAlertConfirm(false); }
function closeClickHandler() { closeCustomAlertConfirm(false); }


/**
 * Shows a custom alert dialog to the user.
 * This replaces native `alert()` for better styling and control.
 * @param {string} title - The title for the alert.
 * @param {string} message - The message to display in the alert.
 * @param {'success'|'error'|'warning'|'info'} type - The type of alert for styling and icon.
 * @returns {Promise<boolean>} Resolves to true when the 'OK' button is clicked or Escape is pressed.
 */
export function showCustomAlert(title, message, type = 'info') {
    return new Promise(resolve => {
        if (!customAlertConfirmModal) {
            console.error('Custom alert modal not available.');
            alert(`${title}: ${message}`); // Fallback
            resolve(true);
            return;
        }

        currentAlertResolver = resolve; // Store resolver for external closing (e.g., Escape key)
        currentConfirmResolver = null; // Ensure confirm resolver is cleared

        customAlertConfirmTitle.textContent = title;
        customAlertConfirmMessage.textContent = message;
        customAlertConfirmOkBtn.textContent = 'OK';
        customAlertConfirmCancelBtn.classList.add('hidden'); // Hide cancel for alerts
        customAlertConfirmClose.classList.remove('hidden'); // Show close for alerts

        // Reset button classes and apply type-specific styles
        customAlertConfirmOkBtn.className = 'action-button'; // Reset to base action button styles
        switch (type) {
            case 'success':
                customAlertConfirmOkBtn.classList.add('bg-green-500', 'hover:bg-green-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-green-700';
                break;
            case 'error':
                customAlertConfirmOkBtn.classList.add('bg-red-500', 'hover:bg-red-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-red-700';
                break;
            case 'warning':
                customAlertConfirmOkBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-yellow-700';
                break;
            case 'info':
            default:
                customAlertConfirmOkBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-blue-700';
                break;
        }

        customAlertConfirmModal.style.display = 'flex'; // Show modal

        // Add event listeners using named functions
        customAlertConfirmOkBtn.addEventListener('click', okClickHandler);
        customAlertConfirmClose.addEventListener('click', okClickHandler); // Close button acts as OK for alert
    });
}

/**
 * Shows a custom confirmation dialog to the user.
 * This replaces native `confirm()` for better styling and control.
 * @param {string} title - The title for the confirmation.
 * @param {string} message - The confirmation message to display.
 * @param {'success'|'error'|'warning'|'info'} type - The type of confirmation for styling.
 * @returns {Promise<boolean>} Resolves to true if 'Yes' is clicked, false if 'No' or dismissed (including Escape).
 */
export function showCustomConfirm(title, message, type = 'info') {
    return new Promise(resolve => {
        if (!customAlertConfirmModal) {
            console.error('Custom confirm modal not available.');
            resolve(confirm(`${title}: ${message}`)); // Fallback
            return;
        }

        currentConfirmResolver = resolve; // Store resolver for external closing (e.g., Escape key)
        currentAlertResolver = null; // Ensure alert resolver is cleared

        customAlertConfirmTitle.textContent = title;
        customAlertConfirmMessage.textContent = message;
        customAlertConfirmOkBtn.textContent = 'Yes';
        customAlertConfirmCancelBtn.textContent = 'No';
        customAlertConfirmCancelBtn.classList.remove('hidden'); // Show cancel for confirms
        customAlertConfirmClose.classList.remove('hidden'); // Show close for confirms


        // Reset button classes and apply type-specific styles for OK button
        customAlertConfirmOkBtn.className = 'action-button';
        customAlertConfirmCancelBtn.className = 'action-button bg-gray-500 hover:bg-gray-600'; // Style for cancel
        switch (type) {
            case 'success':
                customAlertConfirmOkBtn.classList.add('bg-green-500', 'hover:bg-green-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-green-700';
                break;
            case 'error':
                customAlertConfirmOkBtn.classList.add('bg-red-500', 'hover:bg-red-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-red-700';
                break;
            case 'warning':
                customAlertConfirmOkBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-yellow-700';
                break;
            case 'info':
            default:
                customAlertConfirmOkBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                customAlertConfirmTitle.className = 'text-xl font-bold mb-4 text-blue-700';
                break;
        }

        customAlertConfirmModal.style.display = 'flex'; // Show modal

        // Add event listeners using named functions
        customAlertConfirmOkBtn.addEventListener('click', yesHandler);
        customAlertConfirmCancelBtn.addEventListener('click', noHandler);
        customAlertConfirmClose.addEventListener('click', noHandler); // Close button acts as 'No' for confirm
    });
}

// Named functions for event listeners for confirm modal
function yesHandler() { closeCustomAlertConfirm(true); }
function noHandler() { closeCustomAlertConfirm(false); }


/**
 * Opens the dedicated update user modal.
 */
export function openUpdateModal() {
    if (updateUserModal) {
        updateUserModal.style.display = 'flex';
        // Reset message div
        const updateMessageDiv = document.getElementById('updateMessage');
        if (updateMessageDiv) {
            updateMessageDiv.classList.add('hidden');
        }
    }
}

/**
 * Closes the dedicated update user modal and resets its form.
 */
export function closeUpdateModal() {
    if (updateUserModal) {
        updateUserModal.style.display = 'none';
        const updateUserForm = document.getElementById('updateUserForm');
        if (updateUserForm) {
            updateUserForm.reset();
        }
        // Clear dynamically added previous experience fields
        if (updatePreviousExperienceContainer) {
            updatePreviousExperienceContainer.innerHTML = `
                <h4 class="text-lg font-semibold mb-3">Previous Experience(s)</h4>
                <button type="button" id="addMorePrevExpUpdate" class="action-button mt-4 px-6 py-2 text-base">Add More Experience</button>
            `;
            // Re-attach listener to the "Add More" button for the next time the modal is opened
            document.getElementById('addMorePrevExpUpdate').onclick = () => {
                // Ensure createPreviousExperienceFields is imported and available here
                createPreviousExperienceFields(updatePreviousExperienceContainer, 0, {}, 'update');
            };
        }
    }
}
