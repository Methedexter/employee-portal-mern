// backend/server.js
// Debug log to confirm the script is running
console.log('Script file is being parsed...');
console.log('Starting server...');

// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const opn = require('opn'); // Consider 'open' package as 'opn' is deprecated
const mongoose = require('mongoose'); // Mongoose is needed here for mongoose.connection events
require('dotenv').config(); // Load environment variables from .env file

// Import modularized components
const connectDB = require('./db'); // MongoDB connection function
const User = require('./models/User'); // User model (for index creation)
const userRoutes = require('./routes/userRoutes'); // All user and auth related routes

// Debug log to confirm environment variables are loaded
console.log('Environment variables:', {
    MONGODB_URI: process.env.MONGODB_URI ? '***** (loaded)' : 'NOT LOADED', // Mask URI for security
    PORT: process.env.PORT || 5000,
});

// Initialize Express app
const app = express();
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(express.json()); // Parse JSON request bodies

// Serve static files from the frontend directory
// Assumes frontend is one level up from backend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB
connectDB();

// Ensure the unique index on userId is created after DB connection
// This listener runs once when the connection to MongoDB is successfully established.
mongoose.connection.on('connected', () => {
    User.collection.createIndex({ userId: 1 }, { unique: true })
        .then(() => console.log('Unique index on userId ensured'))
        .catch(err => {
            if (err.code === 11000) {
                console.warn('Unique index on userId already exists, skipping creation.');
            } else {
                console.error('Error creating index:', err);
            }
        });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Use modularized API routes
app.use('/api', userRoutes); // All routes defined in userRoutes.js will be under /api

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Open the browser automatically (only useful in development)
    opn(`http://localhost:${PORT}`).catch(err => console.error('Failed to open browser:', err));
});
