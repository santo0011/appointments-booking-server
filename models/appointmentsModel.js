const bodyParser = require('body-parser');
const { Schema, model } = require('mongoose');

const appointementSchema = new Schema({
    userId: {
        type: Schema.ObjectId,
        required: true
    },
    doctorId: {
        type: Schema.ObjectId,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "pending"
    }

}, { timestamps: true });


module.exports = model('appointements', appointementSchema);

/*     userInfo: {
        type: String,
        required: true
    },
    doctorInfo: {
        type: String,
        required: true
    }, */