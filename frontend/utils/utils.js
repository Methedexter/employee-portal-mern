// frontend/utils/utils.js
// This file contains general utility functions used across the frontend.

/**
 * Formats a date string or Date object into 'YYYY-MM-DD' for HTML date inputs.
 * @param {string|Date|null|undefined} dateInput - The date string or Date object.
 * @returns {string} The formatted date string (YYYY-MM-DD) or an empty string if invalid/null.
 */
export function formatDateForInput(dateInput) {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date input for formatting:', dateInput);
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error formatting date for input:', e);
        return '';
    }
}

/**
 * Formats a date string or Date object into a human-readable display string (e.g., "Jan 1, 2023").
 * @param {string|Date|null|undefined} dateInput - The date string or Date object.
 * @returns {string} The formatted date string or 'N/A' if invalid/null.
 */
export function formatDateDisplay(dateInput) {
    if (!dateInput) return 'N/A';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error('Error formatting date for display:', e);
        return 'N/A';
    }
}

/**
 * Formats a duration object (containing years, months, and days) into a human-readable string.
 * @param {{years: number, months: number, days: number}|null|undefined} duration - The duration object.
 * @returns {string} Formatted duration string or '0 years, 0 months, 0 days'.
 */
export function formatDuration(duration) {
    if (!duration) return '0 years, 0 months, 0 days';
    const parts = [];
    if (duration.years > 0) parts.push(`${duration.years} year${duration.years !== 1 ? 's' : ''}`);
    if (duration.months > 0) parts.push(`${duration.months} month${duration.months !== 1 ? 's' : ''}`);
    if (duration.days > 0) parts.push(`${duration.days} day${duration.days !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : '0 days';
}


/**
 * Dynamically creates input fields for previous experience (From Date and To Date).
 * Includes a remove button for each entry.
 * @param {HTMLElement} container - The container element where fields should be added.
 * @param {number} index - A numerical index for unique naming of the input fields.
 * @param {object} [initialData] - Optional. Object with fromDate and toDate for pre-filling.
 * @param {'reg'|'update'} typePrefix - Prefix for input names (e.g., 'reg' or 'update').
 */
export function createPreviousExperienceFields(container, index, initialData = {}, typePrefix) {
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('previous-experience-entry', 'grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4', 'border-b', 'pb-4', 'mb-4', 'relative');

    const fromId = `${typePrefix}PrevFromDate_${index}`;
    const toId = `${typePrefix}PrevToDate_${index}`;

    entryDiv.innerHTML = `
        <button type="button" class="remove-experience-btn">&times;</button>
        <div class="form-group">
            <label for="${fromId}">From Date (Optional):</label>
            <input type="date" id="${fromId}" name="${typePrefix}PrevFromDate_${index}" value="${initialData.fromDate ? formatDateForInput(initialData.fromDate) : ''}">
        </div>
        <div class="form-group">
            <label for="${toId}">To Date (Optional):</label>
            <input type="date" id="${toId}" name="${typePrefix}PrevToDate_${index}" value="${initialData.toDate ? formatDateForInput(initialData.toDate) : ''}">
        </div>
    `;

    container.appendChild(entryDiv);

    // Add event listener to the new remove button
    entryDiv.querySelector('.remove-experience-btn').addEventListener('click', () => {
        entryDiv.remove();
    });
}
