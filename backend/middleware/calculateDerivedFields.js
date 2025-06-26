// backend/middleware/calculateDerivedFields.js
const { parseDateString, calculateDuration, sumDurations } = require('../utils/dateHelpers');

/**
 * Calculates derived fields (totalAge, currentExperience, totalExperience, and individual prev experience durations)
 * for a user object. This function takes a plain JavaScript object (from user.toObject())
 * and returns a new object with the derived fields added. It does NOT modify the Mongoose document directly.
 * @param {object} userObject - The user object (plain JS object from .toObject()).
 * @returns {object} The user object with derived fields added.
 */
const calculateDerivedFields = (userObject) => {
    const user = { ...userObject }; // Create a copy to avoid unintended mutations

    try {
        // Ensure dates are parsed to Date objects before calculation
        const dateOfBirth = user.dateOfBirth ? parseDateString(user.dateOfBirth) : null;
        const dateOfJoining = user.dateOfJoining ? parseDateString(user.dateOfJoining) : null;
        const today = new Date(); // Current date for calculating age and current experience

        user.totalAge = dateOfBirth ? calculateDuration(dateOfBirth, today) : { years: 0, months: 0, days: 0 };
        user.currentExperience = dateOfJoining ? calculateDuration(dateOfJoining, today) : { years: 0, months: 0, days: 0 };

        // Handle multiple previous experiences
        let totalPreviousExperience = { years: 0, months: 0, days: 0 };
        if (Array.isArray(user.previousExperience)) {
            user.previousExperience = user.previousExperience.map(exp => {
                const fromDate = exp.fromDate ? parseDateString(exp.fromDate) : null;
                const toDate = exp.toDate ? parseDateString(exp.toDate) : null;

                let calculatedExpDuration = { years: 0, months: 0, days: 0 };
                if (fromDate && toDate) {
                    calculatedExpDuration = calculateDuration(fromDate, toDate);
                }

                // Sum this individual experience to the total previous experience
                totalPreviousExperience = sumDurations(totalPreviousExperience, calculatedExpDuration);

                return {
                    fromDate: fromDate, // Keep as Date object or null
                    toDate: toDate,     // Keep as Date object or null
                    years: calculatedExpDuration.years,
                    months: calculatedExpDuration.months,
                    days: calculatedExpDuration.days,
                };
            });
        } else {
             // Ensure previousExperience is an array even if it was null/undefined/single object before
            user.previousExperience = [];
        }

        user.totalPreviousExperience = totalPreviousExperience; // Add aggregated previous experience

        // Calculate total experience by summing current and total previous experience
        user.totalExperience = sumDurations(user.currentExperience, user.totalPreviousExperience);

        return user;
    } catch (error) {
        console.error('Error in calculateDerivedFields for userId:', user.userId, error.message, error.stack);
        // Return user with default derived fields if an error occurs to prevent application crash
        return {
            ...user,
            totalAge: { years: 0, months: 0, days: 0 },
            currentExperience: { years: 0, months: 0, days: 0 },
            totalPreviousExperience: { years: 0, months: 0, days: 0 },
            totalExperience: { years: 0, months: 0, days: 0 },
            previousExperience: Array.isArray(user.previousExperience) ? user.previousExperience : [], // Ensure it's an array
        };
    }
};

module.exports = calculateDerivedFields;
