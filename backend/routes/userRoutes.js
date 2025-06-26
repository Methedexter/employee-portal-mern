// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router(); // Initialize an Express Router
const User = require('../models/User'); // Import the User model
const calculateDerivedFields = require('../middleware/calculateDerivedFields'); // Import the derived fields calculator
const { parseDateString } = require('../utils/dateHelpers'); // Import date parsing utility
const bcrypt = require('bcrypt'); // *** IMPORTANT: Imported bcrypt for password hashing ***

/**
 * Helper function to validate dates for user registration/update, including multiple previous experiences.
 * It checks for logical consistency between date fields.
 * @param {object} data - The request body data containing date fields.
 * @param {object|null} existingUser - The existing user object for update scenarios (optional).
 * @returns {{valid: boolean, message?: string, parsedDates?: object}} Validation result.
 */
const validateDates = (data, existingUser = null) => {
    // Parse main dates from input data
    const dobInput = data.dateOfBirth;
    const dojInput = data.dateOfJoining;

    let dateOfBirth = parseDateString(dobInput);
    let dateOfJoining = parseDateString(dojInput);

    // For PUT requests, if main dates are not provided in updateData, use existing user's dates for validation consistency.
    if (existingUser) {
        if (!dobInput && existingUser.dateOfBirth) dateOfBirth = parseDateString(existingUser.dateOfBirth);
        if (!dojInput && existingUser.dateOfJoining) dateOfJoining = parseDateString(existingUser.dateOfJoining);
    }

    // --- Main Date Validation Logic ---
    if (dobInput && !dateOfBirth) { // Check if DOB input was provided but invalid
        return { valid: false, message: 'Invalid Date of Birth format. Please use ISO (YYYY-MM-DD) or DD-MM-YYYY.' };
    }
    if (dojInput && !dateOfJoining) { // Check if DOJ input was provided but invalid
        return { valid: false, message: 'Invalid Date of Joining format. Please use ISO (YYYY-MM-DD) or DD-MM-YYYY.' };
    }

    // Handle multiple previous experiences
    const parsedPreviousExperiences = [];
    const previousExperiencesInput = data.previousExperience || []; // Ensure it's an array, even if empty

    // If existingUser and updateData doesn't fully override previousExperience, merge for validation
    let experiencesToValidate = [];
    if (existingUser && data.previousExperience === undefined) {
        // If previousExperience is not sent in updateData, use existing ones
        experiencesToValidate = existingUser.previousExperience || [];
    } else {
        experiencesToValidate = previousExperiencesInput;
    }


    for (let i = 0; i < experiencesToValidate.length; i++) {
        const expInput = experiencesToValidate[i];
        const fromDate = expInput.fromDate ? parseDateString(expInput.fromDate) : null;
        const toDate = expInput.toDate ? parseDateString(expInput.toDate) : null;

        // Validation for each previous experience entry
        if ((expInput.fromDate && !fromDate) || (expInput.toDate && !toDate)) {
            return { valid: false, message: `Invalid date format in Previous Experience entry ${i + 1}. Please use ISO (YYYY-MM-DD) or DD-MM-YYYY.` };
        }

        if (fromDate && toDate) {
            if (fromDate.getTime() > toDate.getTime()) {
                return { valid: false, message: `Previous Experience "From Date" cannot be after "To Date" in entry ${i + 1}.` };
            }
            // Validate that Previous Experience ends before current Date of Joining
            if (dateOfJoining && toDate.getTime() > dateOfJoining.getTime()) {
                return { valid: false, message: `Previous Experience "To Date" in entry ${i + 1} cannot be after Date of Joining.` };
            }
        } else if (fromDate || toDate) {
            // If one date is provided, the other must also be provided for a complete entry
            return { valid: false, message: `Both "From Date" and "To Date" are required for Previous Experience entry ${i + 1}, if either is provided.` };
        }

        if (fromDate && toDate) { // Only add if both dates are valid and present
            parsedPreviousExperiences.push({ fromDate, toDate });
        }
    }

    return {
        valid: true,
        parsedDates: {
            dateOfBirth,
            dateOfJoining,
            previousExperience: parsedPreviousExperiences,
        }
    };
};


// GET all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        // Map each user document to a plain JavaScript object and calculate derived fields
        const usersWithCalculations = users.map(user => calculateDerivedFields(user.toObject()));
        res.json(usersWithCalculations);
    } catch (err) {
        console.error('Error in /api/users GET:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET user by userId
router.get('/users/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId.trim() });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userWithCalculations = calculateDerivedFields(user.toObject());
        res.json(userWithCalculations);
    } catch (err) {
        console.error('Error in /api/users/:userId GET:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// POST a new user (Registration)
router.post('/users', async (req, res) => {
    try {
        const { role, userId, password, ...userData } = req.body;
        const trimmedUserId = userId.trim();

        // Perform date validation using the helper
        const dateValidation = validateDates(req.body);
        if (!dateValidation.valid) {
            return res.status(400).json({ message: dateValidation.message });
        }
        const { dateOfBirth, dateOfJoining, previousExperience } = dateValidation.parsedDates;

        // Validate user role
        if (!role || !['employee', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role must be either employee or admin.' });
        }

        // --- HASH THE PASSWORD BEFORE SAVING (THIS IS THE KEY CHANGE) ---
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds (cost factor)
        console.log('Hashed Password (for debugging, do not log in production):', hashedPassword); // You can check your server console for this hash.


        // Construct the user object for saving
        const userToSave = {
            ...userData,
            userId: trimmedUserId,
            password: hashedPassword, // *** Store the HASHED password in the database ***
            role,
            dateOfBirth: dateOfBirth,
            dateOfJoining: dateOfJoining,
            previousExperience: previousExperience, // This is now an array
        };

        const user = new User(userToSave);
        const newUser = await user.save();
        // Recalculate derived fields immediately for the response
        const userWithCalculations = calculateDerivedFields(newUser.toObject());
        res.status(201).json(userWithCalculations);

    } catch (err) {
        console.error('Error saving user:');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);

        if (err.code === 11000) { // MongoDB duplicate key error
            res.status(400).json({ message: 'User ID already exists. Please use a unique User ID.' });
        } else if (err.name === 'ValidationError') { // Mongoose validation error (e.g., required fields missing)
            res.status(400).json({ message: `Validation error: ${err.message}` });
        } else {
            res.status(500).json({ message: `Failed to create user: ${err.message}` });
        }
    }
});

// PUT (update) a user by userId
router.put('/users/:userId', async (req, res) => {
    try {
        const trimmedUserIdParam = req.params.userId.trim();
        const updateData = { ...req.body };

        // If a new password is provided, hash it
        if (updateData.password && updateData.password !== '') {
            updateData.password = await bcrypt.hash(updateData.password, 10); // *** Hash new password on update ***
        } else {
            // If password is an empty string, delete it from updateData
            // This ensures Mongoose doesn't try to set it to an empty string,
            // and the existing password hash in the DB is preserved.
            delete updateData.password;
        }

        // Fetch current user data to merge and validate against, especially for partial updates
        const existingUser = await User.findOne({ userId: trimmedUserIdParam });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found for update.' });
        }

        // Create a combined data object for validation that includes existing fields
        // if they are not provided in the update request. This ensures all relevant
        // dates and previous experiences are considered for validation.
        const combinedDataForValidation = {
            ...existingUser.toObject(), // Start with existing user's data
            ...updateData,              // Overlay with update data
            // Ensure previousExperience is an array for validation
            previousExperience: updateData.previousExperience !== undefined ? updateData.previousExperience : existingUser.previousExperience,
        };

        // Perform date validation on the combined data
        const dateValidation = validateDates(combinedDataForValidation, existingUser);
        if (!dateValidation.valid) {
            return res.status(400).json({ message: dateValidation.message });
        }

        // Apply parsed dates and previous experiences back to updateData object for Mongoose to save
        if (updateData.dateOfBirth !== undefined) updateData.dateOfBirth = dateValidation.parsedDates.dateOfBirth;
        if (updateData.dateOfJoining !== undefined) updateData.dateOfJoining = dateValidation.parsedDates.dateOfJoining;
        if (updateData.previousExperience !== undefined) updateData.previousExperience = dateValidation.parsedDates.previousExperience;


        // Find and update the user document
        const user = await User.findOneAndUpdate(
            { userId: trimmedUserIdParam },
            updateData,
            { new: true, runValidators: true } // `new: true` returns the updated document; `runValidators` ensures schema validations apply
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const userWithCalculations = calculateDerivedFields(user.toObject());
        res.json(userWithCalculations);

    } catch (err) {
        console.error('Error updating user:');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
        if (err.name === 'ValidationError') {
            res.status(400).json({ message: `Validation error: ${err.message}` });
        } else {
            res.status(500).json({ message: `Failed to update user: ${err.message}` });
        }
    }
});

// DELETE a user by userId
router.delete('/users/:userId', async (req, res) => {
    try {
        const trimmedUserIdParam = req.params.userId.trim();
        const user = await User.findOneAndDelete({ userId: trimmedUserIdParam });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('Error in /api/users/:userId DELETE:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Admin login endpoint
router.post('/admin/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const trimmedUserId = userId.trim();
        console.log('Server: Admin Login received for userId:', trimmedUserId);

        const user = await User.findOne({ userId: trimmedUserId, role: 'admin' });
        if (!user) {
            console.log('Server: Admin login failed - User not found for userId:', trimmedUserId);
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // --- COMPARE THE PROVIDED PASSWORD WITH THE STORED HASH (THIS IS THE KEY CHANGE) ---
        const isMatch = await bcrypt.compare(password, user.password); // Compare plain password with stored hash
        if (!isMatch) {
            console.log('Server: Admin login failed - Incorrect password for userId:', trimmedUserId);
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        console.log('Server: Admin login successful for userId:', trimmedUserId);
        const userWithCalculations = calculateDerivedFields(user.toObject());
        res.json({ message: 'Admin login successful', userId: trimmedUserId, user: userWithCalculations });
    } catch (err) {
        console.error('Server: Error in admin login route:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Employee login endpoint
router.post('/employee/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const trimmedUserId = userId.trim();
        console.log('Server: Employee Login received for userId:', trimmedUserId);

        const user = await User.findOne({ userId: trimmedUserId, role: 'employee' });
        if (!user) {
            console.log('Server: Employee login failed - User not found for userId:', trimmedUserId);
            return res.status(401).json({ message: 'Invalid employee credentials' });
        }

        // --- COMPARE THE PROVIDED PASSWORD WITH THE STORED HASH (THIS IS THE KEY CHANGE) ---
        const isMatch = await bcrypt.compare(password, user.password); // Compare plain password with stored hash
        if (!isMatch) {
            console.log('Server: Employee login failed - Incorrect password for userId:', trimmedUserId);
            return res.status(401).json({ message: 'Invalid employee credentials' });
        }

        console.log('Server: Employee login successful for userId:', trimmedUserId);
        const userWithCalculations = calculateDerivedFields(user.toObject());
        res.json({ message: 'Employee login successful', userId: trimmedUserId, user: userWithCalculations });
    } catch (err) {
        console.error('Server: Error in employee login route:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Admin dashboard endpoint to get all employees (excluding admins)
router.get('/admin/users', async (req, res) => {
    try {
        // Fetch users with the 'employee' role
        const users = await User.find({ role: 'employee' });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No employees found' });
        }
        // Apply derived field calculations to each employee user
        const usersWithCalculations = users.map(user => calculateDerivedFields(user.toObject()));
        res.json(usersWithCalculations);
    } catch (err) {
        console.error('Error in /api/admin/users GET:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router; // Export the router instance
