// backend/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is loaded to access process.env.MONGODB_URI

/**
 * Establishes a connection to the MongoDB database.
 * The MongoDB URI is loaded from the environment variables.
 */
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('Error: MONGODB_URI not found in environment variables.');
            // Exit the process or throw an error if the URI is critical for the application
            process.exit(1); 
        }

        await mongoose.connect(mongoUri, {
            // useNewUrlParser: true, // Deprecated in Mongoose 6.x
            // useUnifiedTopology: true, // Deprecated in Mongoose 6.x
            // useCreateIndex: true, // Deprecated in Mongoose 6.x
            // useFindAndModify: false, // Deprecated in Mongoose 6.x
        });
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process on connection failure, as the app cannot function without a DB
        process.exit(1);
    }
};

module.exports = connectDB;
