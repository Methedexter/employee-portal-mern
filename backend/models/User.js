// backend/models/User.js
const mongoose = require('mongoose');

// Schema for individual previous experience entries
const previousExperienceSchema = new mongoose.Schema({
    fromDate: { type: Date, default: null },
    toDate: { type: Date, default: null },
    years: { type: Number, default: 0 },
    months: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
}, { _id: false }); // _id: false prevents Mongoose from adding an _id to subdocuments

// User Schema Definition
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, trim: true },
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
    // Changed previousExperience to an array of previousExperienceSchema
    previousExperience: [previousExperienceSchema],
    password: { type: String, required: true }, // IMPORTANT: In a real application, always hash and salt passwords!
    role: { type: String, enum: ['employee', 'admin'], required: true },
});

// Create the User model, specifying 'Users' as the collection name
const User = mongoose.model('User', userSchema, 'Users');
console.log('User model loaded');

module.exports = User;
