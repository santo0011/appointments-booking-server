const mongoose = require('mongoose');

module.exports.dbConnect = async () => {
    try {
        if (process.env.mode === 'pro') {
            await mongoose.connect(process.env.DB_PRO_URL, { useNewURLParser: true })
            console.log("Database Connected Production Mode....")
        } else {
            await mongoose.connect(process.env.DB_LOCA_URL, { useNewURLParser: true })
            console.log("Database Connected Local Mode....")
        }
    } catch (error) {
        console.log(error.message)
    }
}