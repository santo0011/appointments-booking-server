const { Schema, model } = require('mongoose');


const doctorSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    image: {
        type: String,
    },
    department: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    feePerConsultation: {
        type: Number,
        required: true
    },
    timings: {
        type: Array,
        required: true
    },
    fromTime: {
        type: String,
        required: true
    },
    toTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "pending"
    }

}, { timestamps: true });



module.exports = model('doctors', doctorSchema);