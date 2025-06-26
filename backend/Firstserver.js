// Debug log to confirm the script is running
console.log('Starting server...');

// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const opn = require('opn'); // Note: 'opn' might be deprecated, consider 'open' package
require('dotenv').config();

// Debug log to confirm environment variables are loaded
console.log('Environment variables:', {
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: process.env.PORT,
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Ensure the unique index on userId is created
        User.collection.createIndex({ userId: 1 }, { unique: true })
            .then(() => console.log('Unique index on userId created'))
            .catch(err => console.error('Error creating index:', err));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process if MongoDB connection fails
    });

// User Schema
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, trim: true }, // Added trim
    fullName: { type: String, required: true },
    designation: { type: String, required: true },
    educationalQualifications: {
        ug: { type: String, required: true },
        pg: { type: String, required: true },
        phd: { type: String, required: true },
    },
    department: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    dateOfJoining: { type: Date, required: true },
    previousExperience: {
        fromDate: { type: Date, default: null },
        toDate: { type: Date, default: null },
        years: { type: Number, default: 0 },
        months: { type: Number, default: 0 },
        days: { type: Number, default: 0 },
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['employee', 'admin'], required: true },
});

// Create the User model, using 'Users' collection
const User = mongoose.model('User', userSchema, 'Users');
console.log('User model created');

// Helper function to parse various date string formats (YYYY-MM-DD or DD-MM-YYYY)
const parseDateString = (dateString) => {
    if (!dateString) return null;

    let date = new Date(dateString);

    // If initial parsing failed (e.g., for DD-MM-YYYY), try specific format
    if (isNaN(date.getTime()) && dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const parts = dateString.split('-');
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Convert to YYYY-MM-DD
    }
    // If still invalid, return null. Otherwise, return the Date object.
    return isNaN(date.getTime()) ? null : date;
};

// Helper function to calculate duration in years, months, and days
const calculateDuration = (startDate, endDate) => {
    try {
        if (!startDate || !endDate) {
            return { years: 0, months: 0, days: 0 };
        }

        const start = new Date(startDate); // Ensure they are Date objects for calculations
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn('Invalid Date object(s) provided to calculateDuration:', startDate, endDate);
            return { years: 0, months: 0, days: 0 };
        }

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            const tempDate = new Date(end.getFullYear(), end.getMonth(), 0); // Last day of previous month
            days += tempDate.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    } catch (error) {
        console.error('Error in calculateDuration:', error.message);
        return { years: 0, months: 0, days: 0 };
    }
};

// Helper function to sum durations
const sumDurations = (duration1, duration2) => {
    try {
        duration1 = duration1 || { years: 0, months: 0, days: 0 };
        duration2 = duration2 || { years: 0, months: 0, days: 0 };

        let totalDays = duration1.days + duration2.days;
        let totalMonths = duration1.months + duration2.months;
        let totalYears = duration1.years + duration2.years;

        // Carry over days to months
        totalMonths += Math.floor(totalDays / 30); // Using 30 as an average for simplicity
        totalDays %= 30;

        // Carry over months to years
        totalYears += Math.floor(totalMonths / 12);
        totalMonths %= 12;

        return { years: totalYears, months: totalMonths, days: totalDays };
    } catch (error) {
        console.error('Error in sumDurations:', error.message);
        return { years: 0, months: 0, days: 0 };
    }
};

// Middleware/Function to calculate derived fields (totalAge, currentExperience, totalExperience)
const calculateDerivedFields = (userObject) => {
    const user = { ...userObject }; // Create a copy to avoid modifying the original Mongoose object directly

    try {
        const dateOfBirth = parseDateString(user.dateOfBirth);
        const dateOfJoining = parseDateString(user.dateOfJoining);
        const prevFromDate = user.previousExperience && user.previousExperience.fromDate ? parseDateString(user.previousExperience.fromDate) : null;
        const prevToDate = user.previousExperience && user.previousExperience.toDate ? parseDateString(user.previousExperience.toDate) : null;

        const today = new Date();

        user.totalAge = dateOfBirth ? calculateDuration(dateOfBirth, today) : { years: 0, months: 0, days: 0 };
        user.currentExperience = dateOfJoining ? calculateDuration(dateOfJoining, today) : { years: 0, months: 0, days: 0 };

        let previousExperienceCalculated = { years: 0, months: 0, days: 0 };
        if (prevFromDate && prevToDate) {
            previousExperienceCalculated = calculateDuration(prevFromDate, prevToDate);
        } else {
            // If dates are not provided, use existing years/months/days if they exist in the object
            previousExperienceCalculated = {
                years: user.previousExperience ? (user.previousExperience.years || 0) : 0,
                months: user.previousExperience ? (user.previousExperience.months || 0) : 0,
                days: user.previousExperience ? (user.previousExperience.days || 0) : 0,
            };
        }
        // Ensure previousExperience field on the user object is updated with calculated duration
        user.previousExperience = user.previousExperience || {};
        user.previousExperience.years = previousExperienceCalculated.years;
        user.previousExperience.months = previousExperienceCalculated.months;
        user.previousExperience.days = previousExperienceCalculated.days;


        user.totalExperience = sumDurations(user.currentExperience, user.previousExperience);

        return user;
    } catch (error) {
        console.error('Error in calculateDerivedFields for userId:', user.userId, error.message, error.stack);
        return {
            ...user,
            totalAge: { years: 0, months: 0, days: 0 },
            currentExperience: { years: 0, months: 0, days: 0 },
            totalExperience: { years: 0, months: 0, days: 0 },
            // Do not reset previousExperience dates here, only calculated duration
            previousExperience: user.previousExperience || { years: 0, months: 0, days: 0, fromDate: null, toDate: null },
        };
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API Endpoints for Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}); // Fetch all users
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        const usersWithCalculations = users.map(user => calculateDerivedFields(user.toObject()));
        res.json(usersWithCalculations);
    } catch (err) {
        console.error('Error in /api/users GET:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

app.get('/api/users/:userId', async (req, res) => {
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

app.post('/api/users', async (req, res) => {
    try {
        const { role, userId, password, ...userData } = req.body;

        const trimmedUserId = userId.trim();

        // Parse dates first
        const parsedDateOfBirth = parseDateString(userData.dateOfBirth);
        const parsedDateOfJoining = parseDateString(userData.dateOfJoining);
        const parsedPrevFromDate = userData.previousExperience?.fromDate ? parseDateString(userData.previousExperience.fromDate) : null;
        const parsedPrevToDate = userData.previousExperience?.toDate ? parseDateString(userData.previousExperience.toDate) : null;

        // Basic validation for required dates
        if (!parsedDateOfBirth) {
            return res.status(400).json({ message: 'Invalid Date of Birth format. Please use YYYY-MM-DD or DD-MM-YYYY.' });
        }
        if (!parsedDateOfJoining) {
            return res.status(400).json({ message: 'Invalid Date of Joining format. Please use YYYY-MM-DD or DD-MM-YYYY.' });
        }

        // Specific Date Logic Validation
        if (parsedPrevFromDate && !parsedPrevToDate) {
            return res.status(400).json({ message: 'Previous Experience "To Date" is required if "From Date" is provided.' });
        }
        if (!parsedPrevFromDate && parsedPrevToDate) {
            return res.status(400).json({ message: 'Previous Experience "From Date" is required if "To Date" is provided.' });
        }

        if (parsedPrevFromDate && parsedPrevToDate) {
            if (parsedPrevFromDate.getTime() > parsedPrevToDate.getTime()) {
                return res.status(400).json({ message: 'Previous Experience "From Date" cannot be after "To Date".' });
            }
            // IMPORTANT: Validate that Previous Experience ends before current Date of Joining
            if (parsedPrevToDate.getTime() > parsedDateOfJoining.getTime()) {
                return res.status(400).json({ message: 'Previous Experience "To Date" cannot be after Date of Joining.' });
            }
        }

        if (!role || !['employee', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role must be either employee or admin.' });
        }

        const userToSave = {
            ...userData,
            userId: trimmedUserId,
            password,
            role,
            dateOfBirth: parsedDateOfBirth,
            dateOfJoining: parsedDateOfJoining,
            previousExperience: {
                fromDate: parsedPrevFromDate,
                toDate: parsedPrevToDate,
                // years, months, days will be calculated and potentially updated by Mongoose pre-save hooks or `calculateDerivedFields`
                years: 0, // Reset these, as they will be calculated by middleware later
                months: 0,
                days: 0,
            }
        };

        const user = new User(userToSave);
        const newUser = await user.save();
        // Recalculate derived fields after saving (if not using Mongoose middleware for this)
        const userWithCalculations = calculateDerivedFields(newUser.toObject());
        res.status(201).json(userWithCalculations);

    } catch (err) {
        console.error('Error saving user:');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);

        if (err.code === 11000) {
            res.status(400).json({ message: 'User ID already exists. Please use a unique User ID.' });
        } else if (err.name === 'ValidationError') {
            res.status(400).json({ message: `Validation error: ${err.message}` });
        } else {
            res.status(500).json({ message: `Failed to create user: ${err.message}` });
        }
    }
});

app.put('/api/users/:userId', async (req, res) => {
    try {
        const trimmedUserIdParam = req.params.userId.trim();
        const updateData = { ...req.body };

        // Handle password update: remove if empty string, otherwise hash it (if you implement hashing)
        if (updateData.password === '') {
            delete updateData.password;
        }

        // Parse and validate incoming date strings for update
        if (updateData.dateOfBirth) {
            updateData.dateOfBirth = parseDateString(updateData.dateOfBirth);
            if (!updateData.dateOfBirth) {
                return res.status(400).json({ message: 'Invalid Date of Birth format during update. Please use YYYY-MM-DD or DD-MM-YYYY.' });
            }
        }
        if (updateData.dateOfJoining) {
            updateData.dateOfJoining = parseDateString(updateData.dateOfJoining);
            if (!updateData.dateOfJoining) {
                return res.status(400).json({ message: 'Invalid Date of Joining format during update. Please use YYYY-MM-DD or DD-MM-YYYY.' });
            }
        }

        let parsedPrevFromDate = null;
        let parsedPrevToDate = null;

        if (updateData.previousExperience) {
            if (updateData.previousExperience.fromDate !== undefined) {
                parsedPrevFromDate = parseDateString(updateData.previousExperience.fromDate);
                updateData.previousExperience.fromDate = parsedPrevFromDate;
            }
            if (updateData.previousExperience.toDate !== undefined) {
                parsedPrevToDate = parseDateString(updateData.previousExperience.toDate);
                updateData.previousExperience.toDate = parsedPrevToDate;
            }

            // Ensure previousExperience fields are not undefined in case only one date is sent
            if (updateData.previousExperience.fromDate === undefined && updateData.previousExperience.toDate !== undefined) {
                 // User sent 'toDate' but not 'fromDate', means 'fromDate' should be null (or previous value)
                 // This path is tricky if 'fromDate' was previously set. Better to fetch current user first.
                 // For now, assuming both are sent if either is being changed via previousExperience object.
            }
            if (updateData.previousExperience.toDate === undefined && updateData.previousExperience.fromDate !== undefined) {
                // Similar to above.
            }
        }


        // Fetch current user data to merge and validate against, especially for partial updates
        const existingUser = await User.findOne({ userId: trimmedUserIdParam });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found for update.' });
        }

        // Use existing dates if not provided in the update, for validation
        const finalDateOfBirth = updateData.dateOfBirth || existingUser.dateOfBirth;
        const finalDateOfJoining = updateData.dateOfJoining || existingUser.dateOfJoining;
        const finalPrevFromDate = parsedPrevFromDate !== null ? parsedPrevFromDate : existingUser.previousExperience?.fromDate;
        const finalPrevToDate = parsedPrevToDate !== null ? parsedPrevToDate : existingUser.previousExperience?.toDate;

        // Apply updated date fields to a temporary object for validation
        const tempUserForValidation = {
            dateOfBirth: finalDateOfBirth,
            dateOfJoining: finalDateOfJoining,
            previousExperience: {
                fromDate: finalPrevFromDate,
                toDate: finalPrevToDate
            }
        };


        // Specific Date Logic Validation (on the combined data)
        if (tempUserForValidation.previousExperience.fromDate && !tempUserForValidation.previousExperience.toDate) {
            return res.status(400).json({ message: 'Previous Experience "To Date" is required if "From Date" is provided.' });
        }
        if (!tempUserForValidation.previousExperience.fromDate && tempUserForValidation.previousExperience.toDate) {
            return res.status(400).json({ message: 'Previous Experience "From Date" is required if "To Date" is provided.' });
        }

        if (tempUserForValidation.previousExperience.fromDate && tempUserForValidation.previousExperience.toDate) {
            if (tempUserForValidation.previousExperience.fromDate.getTime() > tempUserForValidation.previousExperience.toDate.getTime()) {
                return res.status(400).json({ message: 'Previous Experience "From Date" cannot be after "To Date".' });
            }
            // IMPORTANT: Validate that Previous Experience ends before current Date of Joining
            if (tempUserForValidation.previousExperience.toDate.getTime() > tempUserForValidation.dateOfJoining.getTime()) {
                return res.status(400).json({ message: 'Previous Experience "To Date" cannot be after Date of Joining.' });
            }
        }

        // Perform the update
        const user = await User.findOneAndUpdate(
            { userId: trimmedUserIdParam },
            updateData,
            { new: true, runValidators: true } // runValidators ensures schema validations apply
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

app.delete('/api/users/:userId', async (req, res) => {
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
app.post('/api/admin/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const trimmedUserId = userId.trim();
        console.log('Server: Admin Login received for userId:', trimmedUserId); // Removed password from log for security
        const user = await User.findOne({ userId: trimmedUserId, role: 'admin', password }); // In a real app, hash and compare passwords!
        if (!user) {
            console.log('Server: Admin login failed - Invalid credentials for userId:', trimmedUserId);
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

// Employee login endpoint with user details
app.post('/api/employee/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const trimmedUserId = userId.trim();
        console.log('Server: Employee Login received for userId:', trimmedUserId); // Removed password from log for security
        const user = await User.findOne({ userId: trimmedUserId, role: 'employee', password }); // In a real app, hash and compare passwords!
        if (!user) {
            console.log('Server: Employee login failed - User not found or credentials invalid for userId:', trimmedUserId);
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
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'employee' });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No employees found' });
        }
        const usersWithCalculations = users.map(user => calculateDerivedFields(user.toObject()));
        res.json(usersWithCalculations);
    } catch (err) {
        console.error('Error in /api/admin/users GET:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Start the server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
    opn(`http://localhost:${process.env.PORT || 5000}`).catch(err => console.error('Failed to open browser:', err));
});
