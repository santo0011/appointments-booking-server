
const jwt = require('jsonwebtoken')
module.exports.createToken = async (data) => {
    const token = await jwt.sign(data, process.env.SECRET, { expiresIn: process.env.TOKEN_EXP })
    return token
}
