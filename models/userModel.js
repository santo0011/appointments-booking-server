const bodyParser = require('body-parser');
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isDoctor: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    seenNotifications: {
        type: Array,
        default: []
    },
    unseenNotifications: {
        type: Array,
        default: []
    },
    isActive: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });


module.exports = model('users', userSchema);