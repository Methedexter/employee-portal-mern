// frontend/utils/domHelpers.js
// This module provides helper functions for DOM manipulation,
// such as displaying messages, handling loading states, and rendering tables.
// It relies on the backend to provide pre-calculated age and experience durations.

// showMessage and hideMessage are no longer exported/used directly here;
// showCustomAlert/Confirm from modals.js are used instead by other modules.


/**
 * Formats a date string into 'YYYY-MM-DD' for input fields.
 * If the date is invalid or null, returns an empty string.
 * @param {string|Date|null|undefined} dateInput - The date string or Date object.
 * @returns {string} Formatted date string or empty string.
 */
export const formatForInputDate = (dateInput) => {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) { // Check for invalid date
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error formatting date for input:', e);
        return '';
    }
};

/**
 * Formats a date string or Date object for human-readable display (e.g., "May 3, 2004").
 * Handles null, undefined, or invalid date inputs gracefully.
 * @param {string|Date|null|undefined} dateInput - The date string or Date object to format.
 * @returns {string} Formatted date string or 'N/A'.
 */
export const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A'; // Return 'N/A' for null or undefined inputs
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date'; // Check if the date object is valid
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Formats a duration object (containing years, months, and days) for display.
 * @param {{years: number, months: number, days: number}|null|undefined} duration - The duration object.
 * @returns {string} Formatted duration string or '0 years, 0 months, 0 days'.
 */
export const formatDuration = (duration) => {
    if (!duration) return '0 years, 0 months, 0 days';
    return `${duration.years || 0} years, ${duration.months || 0} months, ${duration.days || 0} days`;
};

/**
 * Displays user data in a table format within a specified container.
 * @param {HTMLElement} container - The DOM element where the table will be rendered.
 * @param {Array<object>} users - An array of user objects to display.
 * @param {boolean} showActions - Whether to show Update/Delete buttons.
 * @param {function} onUpdate - Callback function for update button click.
 * @param {function} onDelete - Callback function for delete button click.
 */
export const displayUsersInTable = (container, users, showActions = false, onUpdate = null, onDelete = null) => {
    if (!container) {
        console.error('displayUsersInTable: Target container element is null or undefined.');
        return;
    }

    container.innerHTML = ''; // Clear any existing content in the container

    // Display a message if no user data is available
    if (!Array.isArray(users) || users.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No user data available to display.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden user-table'; // Added user-table class for CSS targeting

    // Create table header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();

    // Define table headers and their corresponding user object properties
    const headers = [
        { key: 'userId', text: 'User ID' },
        { key: 'fullName', text: 'Full Name' },
        { key: 'designation', text: 'Designation' },
        { key: 'department', text: 'Dept.' }, // Abbreviated Department
        { key: 'educationalQualifications.ug', text: 'UG' },
        { key: 'educationalQualifications.pg', text: 'PG' },
        { key: 'educationalQualifications.phd', text: 'PhD' },
        { key: 'dateOfBirth', text: 'D.O.B' },
        { key: 'totalAge', text: 'Age' }, // Display age as calculated by backend
        { key: 'dateOfJoining', text: 'D.O.J' },
        // Simplified previous experience display in table
        { key: 'totalPreviousExperience', text: 'Prev. Exp.' },
        { key: 'totalExperience', text: 'Total Exp.' }, // Display total experience as calculated by backend
    ];

    // Create header cells
    headers.forEach(headerInfo => {
        const th = document.createElement('th');
        th.textContent = headerInfo.text;
        th.className = 'py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700 whitespace-nowrap';
        if (headerInfo.key === 'department') {
            th.classList.add('dept-col'); // Apply class for department column width
        }
        headerRow.appendChild(th);
    });

    // Add Actions header if enabled
    if (showActions) {
        const th = document.createElement('th');
        th.textContent = 'Actions';
        th.className = 'py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700 whitespace-nowrap';
        headerRow.appendChild(th);
    }

    // Create table body
    const tbody = table.createTBody();
    users.forEach(user => {
        const row = tbody.insertRow();
        row.className = 'hover:bg-gray-50'; // Add hover background color
        // Apply hover transform for the entire row
        row.style.transition = 'transform 0.3s ease'; // Add transition for smooth scaling
        row.addEventListener('mouseover', () => row.style.transform = 'scale(1.01)');
        row.addEventListener('mouseout', () => row.style.transform = 'scale(1)');


        // Populate cells based on headers definition
        headers.forEach(headerInfo => {
            const td = row.insertCell();
            // Apply vertical-align: middle to all table cells for consistent alignment
            td.className = 'py-2 px-4 border-b border-gray-200 text-sm text-gray-800 align-middle';

            let value;
            // Handle nested properties (e.g., educationalQualifications.ug)
            if (headerInfo.key.includes('.')) {
                const keys = headerInfo.key.split('.');
                let tempValue = user;
                keys.forEach(k => {
                    tempValue = tempValue ? tempValue[k] : undefined;
                });
                value = tempValue;
            } else {
                value = user[headerInfo.key];
            }

            // Special formatting based on header key or content type
            if (['dateOfBirth', 'dateOfJoining'].includes(headerInfo.key)) {
                td.textContent = formatDate(value); // Use formatDate helper
            } else if (['totalAge', 'totalExperience', 'totalPreviousExperience'].includes(headerInfo.key)) {
                td.textContent = formatDuration(value); // Use formatDuration helper
            } else if (headerInfo.key === 'educationalQualifications.phd') {
                td.textContent = value ? 'Yes' : 'No'; // Convert boolean/value to Yes/No
            } else {
                td.textContent = value || 'N/A'; // Default display, 'N/A' for null/undefined
            }

            if (headerInfo.key === 'department') {
                td.classList.add('dept-col'); // Apply class for department column width
            }
        });

        // Add action buttons if enabled
        if (showActions) {
            const td = row.insertCell();
            // Use flexbox to stack buttons vertically with alignment
            td.className = 'py-2 px-1 border-b border-gray-200 text-sm flex flex-col items-center justify-center align-middle space-y-1.5';

            const updateButton = document.createElement('button');
            updateButton.textContent = 'Update';
            updateButton.className = 'update-button py-1 px-2 rounded text-xs w-full';
            updateButton.onclick = () => onUpdate && onUpdate(user); // Use the passed onUpdate callback

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button py-1 px-2 rounded text-xs w-full';
            deleteButton.onclick = () => onDelete && onDelete(user.userId); // Use the passed onDelete callback

            td.appendChild(updateButton);
            td.appendChild(deleteButton);
        }
    });

    container.appendChild(table); // Append the completed table to the container
    container.style.animation = 'fadeIn 0.5s ease'; // Apply a fade-in animation to the table container
};
