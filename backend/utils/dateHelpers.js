// backend/utils/dateHelpers.js

/**
 * Parses a date string into a Date object. Handles both ISO (YYYY-MM-DD) and DD-MM-YYYY formats.
 * @param {string} dateString - The date string to parse.
 * @returns {Date|null} A Date object if parsing is successful, otherwise null.
 */
const parseDateString = (dateString) => {
    if (!dateString) return null;

    // Attempt to parse as ISO (YYYY-MM-DD) first (standard HTML date input format)
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // If ISO parsing failed, try parsing as DD-MM-YYYY
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Rearrange to YYYY-MM-DD for consistent Date object creation
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    console.warn(`Failed to parse date string: "${dateString}"`);
    return null;
};


/**
 * Calculates the duration between two dates in years, months, and days.
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @returns {{years: number, months: number, days: number}} An object containing the duration components.
 */
const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { years: 0, months: 0, days: 0 };
    }

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust for negative days
    if (days < 0) {
        months--; // Borrow a month
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0); // Last day of previous month
        days += prevMonth.getDate(); // Add days in previous month
    }

    // Adjust for negative months
    if (months < 0) {
        years--; // Borrow a year
        months += 12; // Add 12 months
    }

    return { years, months, days };
};

/**
 * Sums two duration objects (years, months, days).
 * Handles carry-over for months (12 months = 1 year).
 * Days are simply added for now; more complex day handling (e.g., 30 days = 1 month)
 * would require iterating over months. For simplicity, days are kept as is.
 * @param {{years: number, months: number, days: number}} duration1 - The first duration.
 * @param {{years: number, months: number, days: number}} duration2 - The second duration.
 * @returns {{years: number, months: number, days: number}} The summed duration.
 */
const sumDurations = (duration1, duration2) => {
    let totalYears = (duration1.years || 0) + (duration2.years || 0);
    let totalMonths = (duration1.months || 0) + (duration2.months || 0);
    let totalDays = (duration1.days || 0) + (duration2.days || 0);

    // Carry over months to years
    if (totalMonths >= 12) {
        totalYears += Math.floor(totalMonths / 12);
        totalMonths %= 12;
    }
    // Note: Days are typically not carried over to months in this simple sum.
    // For more precise calculations (e.g., 30 days = 1 month), a date-based approach is better.

    return { years: totalYears, months: totalMonths, days: totalDays };
};


module.exports = {
    parseDateString,
    calculateDuration,
    sumDurations,
};
